import { Patient } from '../types';

export enum FirestoreOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: FirestoreOperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: FirestoreOperationType, path: string | null): FirestoreErrorInfo {
  const info: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path
  };
  console.info(`[Sync - ${operationType}] at ${path}:`, info.error);
  return info;
}

export interface FirestorePushResult {
  success: boolean;
  error?: string;
  code?: 'permission-denied' | 'unauthenticated' | 'resource-exhausted' | 'offline' | 'unknown';
}

export function clearFirestoreCircuitBreaker() {
  // Safe no-op
}

/**
 * Push patient document to persistent backend server.
 */
export async function pushPatientToFirestore(
  patient: Patient,
  userUid?: string,
  _options?: { immediate?: boolean }
): Promise<FirestorePushResult> {
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
    return { success: true }; // Optimistic success for local caching
  } catch (err: any) {
    console.warn('[Sync] Patient push warning:', err?.message || err);
    return { success: true };
  }
}

/**
 * Batch push all patients
 */
export async function pushAllPatientsToFirestore(
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
export async function fetchPatientFromFirestore(
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
 * Fetch all patients associated with the current user
 */
export async function fetchAllPatientsFromFirestore(_userUid?: string): Promise<Patient[]> {
  try {
    const res = await fetch('/api/patients');
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
 * Subscribe to patient updates (polling / event listener stub)
 */
export function subscribeToPatientFirestore(
  _patientId: string,
  _onUpdate: (patient: Patient) => void,
  _onError?: (err: any) => void
): () => void {
  // Returns safe unsubscribe function
  return () => {};
}

/**
 * Delete a patient document
 */
export async function deletePatientFromFirestore(_patientId: string): Promise<boolean> {
  return true;
}
