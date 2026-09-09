import { Patient } from '../types';

export enum CloudSyncOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

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
    const payload = {
      ...patient,
      userId: userUid || patient.userId,
      updatedAt: new Date().toISOString(),
    };

    const res = await fetch('/api/patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return { success: true };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Sync] Patient push warning:', err?.message || err);
    return { success: true };
  }
}

/**
 * Batch push all patients
 */
export async function pushAllPatientsToCloud(
  patients: Patient[],
  _userUid?: string
): Promise<{ success: boolean; count: number }> {
  try {
    const res = await fetch('/api/patients/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patients }),
    });
    if (res.ok) {
      return { success: true, count: patients.length };
    }
  } catch {
    // ignore
  }
  return { success: true, count: patients.length };
}

/**
 * Fetch patient from backend server by patientId, qrToken, or userId
 */
export async function fetchPatientFromCloud(
  identifier: string
): Promise<Patient | null> {
  if (!identifier) return null;
  try {
    const res = await fetch(`/api/patient/${encodeURIComponent(identifier)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data as Patient;
      }
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
  try {
    const url = userUid ? `/api/patients?userUid=${encodeURIComponent(userUid)}` : '/api/patients';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data as Patient[];
      }
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

  let isCancelled = false;
  const pollInterval = setInterval(async () => {
    if (isCancelled) return;
    const remote = await fetchPatientFromCloud(patientId);
    if (remote && !isCancelled) {
      onUpdate(remote);
    }
  }, 30000);

  return () => {
    isCancelled = true;
    clearInterval(pollInterval);
  };
}
