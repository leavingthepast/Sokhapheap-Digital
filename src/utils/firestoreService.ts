import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';
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
  const currentUser = auth.currentUser;
  const info: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
    },
    operationType,
    path
  };
  console.warn(`[Firestore Error - ${operationType}] at ${path}:`, info.error);
  return info;
}

/**
 * Deep sanitization helper that removes undefined values and deep copies
 * so Firestore setDoc does not throw "FieldValue: unsupported field value: undefined"
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore).filter((item) => item !== undefined);
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  }
  return obj;
}

export interface FirestorePushResult {
  success: boolean;
  error?: string;
  code?: 'permission-denied' | 'unauthenticated' | 'resource-exhausted' | 'offline' | 'unknown';
}

// In-flight write deduplication & write stream throttle management
const activeWrites = new Map<string, Promise<FirestorePushResult>>();
const queuedNextWrites = new Map<string, { patient: Patient; userUid?: string }>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
let isWriteStreamOverloaded = false;
let streamOverloadTimer: ReturnType<typeof setTimeout> | null = null;
let circuitBreakerUntil = 0;
let lastFailureReason: { code: FirestorePushResult['code']; error: string } | null = null;

export function clearFirestoreCircuitBreaker() {
  circuitBreakerUntil = 0;
  isWriteStreamOverloaded = false;
  lastFailureReason = null;
  if (streamOverloadTimer) clearTimeout(streamOverloadTimer);
}

function markStreamOverload() {
  isWriteStreamOverloaded = true;
  circuitBreakerUntil = Date.now() + 60000;
  lastFailureReason = {
    code: 'resource-exhausted',
    error: 'Cloud Firestore write stream queue is full. Writes are temporarily throttled.',
  };
  if (streamOverloadTimer) clearTimeout(streamOverloadTimer);
  streamOverloadTimer = setTimeout(() => {
    isWriteStreamOverloaded = false;
    console.info('[Firestore] Write stream backoff delay completed, resuming standard queue.');
  }, 15000);
}

/**
 * Internal direct write to Firestore for a single patient document.
 * Guarantees that only 1 write per patient document is actively in-flight at any time.
 */
async function executePatientWrite(
  patient: Patient,
  userUid?: string,
  isManualTest = false
): Promise<FirestorePushResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {
      success: false,
      code: 'unauthenticated',
      error: 'Cannot push to Cloud Firestore without an authenticated Firebase session.',
    };
  }

  // If not a manual user-initiated test, respect backoff and circuit breaker
  if (!isManualTest) {
    if (isWriteStreamOverloaded || Date.now() < circuitBreakerUntil) {
      return {
        success: false,
        code: lastFailureReason?.code || 'resource-exhausted',
        error: lastFailureReason?.error || 'Firestore write operations are currently backing off to prevent queue exhaustion.',
      };
    }
  }

  const targetUid = userUid || currentUser.uid;
  const patientId = patient.id || `SKP-${targetUid ? targetUid.substring(0, 8).toUpperCase() : '2026-0001'}`;

  try {
    const patientDataToSave = {
      ...patient,
      id: patientId,
      userId: targetUid,
      uid: targetUid,
      email: patient.email || currentUser.email || '',
      updatedAt: new Date().toISOString(),
    };

    const sanitized = sanitizeForFirestore(patientDataToSave);
    const patientRef = doc(db, 'patients', patientId);

    await setDoc(patientRef, sanitized, { merge: true });
    
    // On success, reset any previous circuit breaker
    clearFirestoreCircuitBreaker();
    console.log(`[Firestore] Successfully saved patient ${patientId} to Cloud Firestore!`);
    return { success: true };
  } catch (err: any) {
    const msg = err?.message || String(err);
    const code = err?.code || '';

    if (code === 'resource-exhausted' || msg.includes('resource-exhausted') || msg.includes('queued writes')) {
      markStreamOverload();
      return {
        success: false,
        code: 'resource-exhausted',
        error: 'Cloud Firestore write stream queue is full. Writes paused to allow queue buffer to drain.',
      };
    }

    const isPermissionDenied = 
      code === 'permission-denied' || 
      msg.includes('permission') || 
      msg.includes('PERMISSION_DENIED');

    if (isPermissionDenied) {
      circuitBreakerUntil = Date.now() + 60000;
      lastFailureReason = {
        code: 'permission-denied',
        error: 'Firestore security rules blocked the write. Please publish the recommended rules in Firebase Console.',
      };
    }

    const errorInfo = handleFirestoreError(err, FirestoreOperationType.WRITE, `patients/${patientId}`);
    return { 
      success: false, 
      error: errorInfo.error,
      code: isPermissionDenied ? 'permission-denied' : 'unknown'
    };
  }
}

/**
 * Push patient document and emergency data directly into Cloud Firestore.
 * Automatically throttles and debounces writes per patient ID to prevent
 * "Write stream exhausted maximum allowed queued writes".
 */
export async function pushPatientToFirestore(
  patient: Patient,
  userUid?: string,
  options?: { immediate?: boolean }
): Promise<FirestorePushResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    // Return early without dispatching unauthenticated RPCs that cause PERMISSION_DENIED stream failures
    return {
      success: false,
      code: 'unauthenticated',
      error: 'Active Firebase account login is required to sync to Cloud Firestore.',
    };
  }

  // If circuit breaker is active and this is not a manual user action, return early
  if (!options?.immediate && (isWriteStreamOverloaded || Date.now() < circuitBreakerUntil)) {
    return {
      success: false,
      code: lastFailureReason?.code || 'resource-exhausted',
      error: lastFailureReason?.error || 'Firestore write stream is currently backing off.',
    };
  }

  const patientKey = patient.id || (userUid || currentUser.uid);

  // If immediate requested (e.g. from user clicking "Test & Push to Firestore Now" in the UI modal)
  if (options?.immediate) {
    const timer = debounceTimers.get(patientKey);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(patientKey);
    }
    return executePatientWrite(patient, userUid, true);
  }

  // Debounced write management:
  return new Promise((resolve) => {
    // Store latest payload in queue
    queuedNextWrites.set(patientKey, { patient, userUid });

    // Cancel existing debounce timer
    const existingTimer = debounceTimers.get(patientKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      debounceTimers.delete(patientKey);
      const queued = queuedNextWrites.get(patientKey);
      queuedNextWrites.delete(patientKey);

      if (!queued) {
        resolve({ success: true });
        return;
      }

      // If circuit breaker tripped while waiting in debounce, cancel write cleanly
      if (isWriteStreamOverloaded || Date.now() < circuitBreakerUntil) {
        resolve({
          success: false,
          code: lastFailureReason?.code || 'resource-exhausted',
          error: lastFailureReason?.error || 'Write canceled: circuit breaker active.',
        });
        return;
      }

      // If an active write is already in progress, chain onto it
      const currentActive = activeWrites.get(patientKey);
      if (currentActive) {
        try {
          await currentActive;
        } catch {
          // ignore previous write error
        }
      }

      const writePromise = executePatientWrite(queued.patient, queued.userUid, false);
      activeWrites.set(patientKey, writePromise);

      try {
        const res = await writePromise;
        resolve(res);
      } catch (err: any) {
        resolve({
          success: false,
          error: err?.message || 'Write error',
          code: 'unknown',
        });
      } finally {
        activeWrites.delete(patientKey);
      }
    }, 600);

    debounceTimers.set(patientKey, timer);
  });
}

/**
 * Batch push patients to Cloud Firestore
 */
export async function pushAllPatientsToFirestore(
  patients: Patient[],
  userUid?: string
): Promise<{ success: boolean; count: number }> {
  let count = 0;
  for (const patient of patients) {
    const res = await pushPatientToFirestore(patient, userUid);
    if (res.success) count++;
  }
  return { success: count > 0, count };
}

/**
 * Fetch patient from Cloud Firestore by patientId, qrToken, or userId
 */
export async function fetchPatientFromFirestore(
  identifier: string
): Promise<Patient | null> {
  if (!identifier) return null;

  try {
    // 1. Direct document ID lookup
    const directDocRef = doc(db, 'patients', identifier);
    const directSnap = await getDoc(directDocRef);
    if (directSnap.exists()) {
      return directSnap.data() as Patient;
    }

    // 2. Query by qrToken
    try {
      const qToken = query(collection(db, 'patients'), where('qrToken', '==', identifier));
      const snapToken = await getDocs(qToken);
      if (!snapToken.empty) {
        return snapToken.docs[0].data() as Patient;
      }
    } catch {
      // index or permission query fallback
    }

    // 3. Query by userId
    try {
      const qUser = query(collection(db, 'patients'), where('userId', '==', identifier));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        return snapUser.docs[0].data() as Patient;
      }
    } catch {
      // ignore
    }
  } catch (err: any) {
    handleFirestoreError(err, FirestoreOperationType.GET, `patients/${identifier}`);
  }

  return null;
}

/**
 * Fetch all patients associated with the current user or authenticated session
 */
export async function fetchAllPatientsFromFirestore(userUid?: string): Promise<Patient[]> {
  const targetUid = userUid || auth.currentUser?.uid;
  const list: Patient[] = [];

  if (!targetUid) {
    return list;
  }

  try {
    const q = query(collection(db, 'patients'), where('userId', '==', targetUid));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as Patient);
    });

    // If query returned 0, also check by matching patient doc ID directly
    if (list.length === 0) {
      const directDocRef = doc(db, 'patients', targetUid);
      const directSnap = await getDoc(directDocRef);
      if (directSnap.exists()) {
        list.push(directSnap.data() as Patient);
      }
    }
  } catch (err: any) {
    handleFirestoreError(err, FirestoreOperationType.LIST, 'patients');
  }

  return list;
}

/**
 * Subscribe to real-time updates for a patient document
 */
export function subscribeToPatientFirestore(
  patientId: string,
  onUpdate: (patient: Patient) => void,
  onError?: (err: any) => void
): () => void {
  if (!patientId) return () => {};

  try {
    const docRef = doc(db, 'patients', patientId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as Patient);
        }
      },
      (error) => {
        handleFirestoreError(error, FirestoreOperationType.GET, `patients/${patientId}`);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    handleFirestoreError(err, FirestoreOperationType.GET, `patients/${patientId}`);
    return () => {};
  }
}

/**
 * Delete a patient document from Cloud Firestore
 */
export async function deletePatientFromFirestore(patientId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'patients', patientId);
    await deleteDoc(docRef);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, FirestoreOperationType.DELETE, `patients/${patientId}`);
    return false;
  }
}

