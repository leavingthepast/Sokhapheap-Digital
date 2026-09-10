import { Patient, MedicalRecord, QrAccessRequest } from '../types';
import { supabase } from '../supabaseClient';

export interface CloudPushResult {
  success: boolean;
  error?: string;
  code?: 'permission-denied' | 'unauthenticated' | 'resource-exhausted' | 'offline' | 'unknown';
}

/**
 * Push patient document to persistent backend server and cloud storage.
 */
export async function pushPatientToCloud(
  patient: Patient,
  userUid?: string,
  _options?: { immediate?: boolean }
): Promise<CloudPushResult> {
  try {
    const userId = userUid || patient.userId;
    
    // Supabase user_id expects a UUID. Firebase IDs are not valid UUIDs.
    const isValidUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const validUserId = userId && isValidUuid(userId) ? userId : null;
    
    // Upsert Patient using the actual database schema
    const { error: patientError } = await supabase.from('patients').upsert({
      id: patient.id,
      user_id: validUserId,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      data: patient, // the entire document goes here!
    });

    if (patientError) {
      console.error('[Supabase Sync] Patient push error:', patientError);
      return { success: false, error: patientError.message };
    }

    // Upsert Access Requests to the access_requests table if they exist
    if (patient.accessRequests && patient.accessRequests.length > 0) {
      for (const req of patient.accessRequests) {
        await supabase.from('access_requests').upsert({
          id: req.id,
          patient_id: req.patientId,
          qr_token: req.qrToken,
          requester_name: req.requesterName,
          requester_role: req.requesterRole,
          requester_location: req.requesterLocation,
          status: req.status,
          requested_at: req.requestedAt,
          responded_at: req.respondedAt,
        });
      }
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Sync] Patient push warning:', err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Batch push all patients
 */
export async function pushAllPatientsToCloud(
  patients: Patient[],
  userUid?: string
): Promise<{ success: boolean; count: number }> {
  let successCount = 0;
  for (const p of patients) {
    const res = await pushPatientToCloud(p, userUid);
    if (res.success) successCount++;
  }
  return { success: successCount === patients.length, count: successCount };
}

/**
 * Reassemble a full patient object from Supabase tables
 */
async function assemblePatientFromDb(patientBase: any): Promise<Patient> {
  // Since we save the full document in patientBase.data, we can just start with that
  let assembled = typeof patientBase.data === 'string' ? JSON.parse(patientBase.data) : patientBase.data;
  
  // Ensure the top level fields are correct
  if (patientBase.id) assembled.id = patientBase.id;
  if (patientBase.user_id) assembled.userId = patientBase.user_id;

  // Fetch access requests
  const { data: requests } = await supabase
    .from('access_requests')
    .select('*')
    .eq('patient_id', patientBase.id);

  if (requests && requests.length > 0) {
    // Map db columns back to JS object
    const mappedRequests: QrAccessRequest[] = requests.map(r => ({
      id: r.id,
      patientId: r.patient_id,
      qrToken: r.qr_token,
      requesterName: r.requester_name,
      requesterRole: r.requester_role,
      requesterLocation: r.requester_location,
      status: r.status,
      requestedAt: r.requested_at,
      respondedAt: r.responded_at,
    }));
    
    // Merge requests
    const reqMap = new Map();
    (assembled.accessRequests || []).forEach((r: any) => reqMap.set(r.id, r));
    mappedRequests.forEach(r => {
      const ex = reqMap.get(r.id);
      if (!ex || (ex.status === 'pending' && r.status !== 'pending')) {
         reqMap.set(r.id, r);
      }
    });
    assembled.accessRequests = Array.from(reqMap.values());
  }

  return assembled;
}

/**
 * Fetch patient from backend server by patientId, qrToken, or userId
 */
export async function fetchPatientFromCloud(
  identifier: string
): Promise<Patient | null> {
  if (!identifier) return null;
  try {
    // Try by ID
    let { data: patientBase } = await supabase
      .from('patients')
      .select('*')
      .eq('id', identifier)
      .single();

    if (!patientBase) {
      // Try by QR Token (needs to query the JSON data)
      const res = await supabase
        .from('patients')
        .select('*')
        .contains('data', { qrToken: identifier })
        .limit(1);
      if (res.data && res.data.length > 0) {
        patientBase = res.data[0];
      }
    }

    if (patientBase) {
      return await assemblePatientFromDb(patientBase);
    }
  } catch (err) {
    console.warn('[Sync] Fetch warning:', err);
  }
  return null;
}

/**
 * Fetch all patients from backend server
 */
export async function fetchAllPatientsFromCloud(
  userUid?: string
): Promise<Patient[]> {
  if (!userUid) return [];
  try {
    const { data: patientsBase } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userUid);

    if (patientsBase && patientsBase.length > 0) {
      const fullPatients = await Promise.all(
        patientsBase.map(p => assemblePatientFromDb(p))
      );
      return fullPatients;
    }
  } catch (err) {
    console.warn('[Sync] Fetch all warning:', err);
  }
  return [];
}

/**
 * Real-time listener for patient document changes
 */
export function subscribeToPatientCloud(
  patientId: string,
  onUpdate: (patient: Patient) => void
): () => void {
  if (!patientId) return () => {};

  const channel = supabase
    .channel(`public:patients:id=eq.${patientId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'patients', filter: `id=eq.${patientId}` },
      async () => {
        const remote = await fetchPatientFromCloud(patientId);
        if (remote) {
          onUpdate(remote);
        }
      }
    )
    .subscribe();

  const requestsChannel = supabase
    .channel(`public:access_requests:patient_id=eq.${patientId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'access_requests', filter: `patient_id=eq.${patientId}` },
      async () => {
        const remote = await fetchPatientFromCloud(patientId);
        if (remote) onUpdate(remote);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
    supabase.removeChannel(requestsChannel);
  };
}
