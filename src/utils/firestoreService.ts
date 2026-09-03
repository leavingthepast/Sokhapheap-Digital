import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Patient } from '../types';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

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
  code?: 'permission-denied' | 'unauthenticated' | 'offline' | 'unknown';
}

/**
 * Push patient document and emergency data directly into Cloud Firestore
 */
export async function pushPatientToFirestore(
  patient: Patient,
  userUid?: string
): Promise<FirestorePushResult> {
  try {
    const targetUid = userUid || auth.currentUser?.uid || patient.userId || 'anonymous-user';
    const patientId = patient.id || `SKP-${targetUid ? targetUid.substring(0, 8).toUpperCase() : '2026-0001'}`;

    // Ensure userId and uid match for firestore.rules permission check
    const patientDataToSave = {
      ...patient,
      id: patientId,
      userId: targetUid,
      uid: targetUid,
      email: patient.email || auth.currentUser?.email || '',
      updatedAt: new Date().toISOString(),
    };

    const sanitized = sanitizeForFirestore(patientDataToSave);
    const patientRef = doc(db, 'patients', patientId);

    await setDoc(patientRef, sanitized, { merge: true });

    // Also maintain user metadata document in /users/{targetUid} if targetUid exists
    if (targetUid && targetUid !== 'anonymous-user') {
      try {
        const userRef = doc(db, 'users', targetUid);
        await setDoc(
          userRef,
          {
            uid: targetUid,
            email: patient.email || auth.currentUser?.email || '',
            displayName: patient.name,
            patientId: patientId,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (userDocErr) {
        console.warn('[Firestore] Note on user doc sync:', userDocErr);
      }
    }

    console.log(`[Firestore] Successfully saved patient ${patientId} to Cloud Firestore!`);
    return { success: true };
  } catch (err: any) {
    const errorInfo = handleFirestoreError(err, FirestoreOperationType.WRITE, `patients/${patient.id}`);
    const isPermissionDenied = 
      err?.code === 'permission-denied' || 
      err?.message?.includes('permission') || 
      err?.message?.includes('PERMISSION_DENIED');
    
    return { 
      success: false, 
      error: errorInfo.error,
      code: isPermissionDenied ? 'permission-denied' : 'unknown'
    };
  }
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

