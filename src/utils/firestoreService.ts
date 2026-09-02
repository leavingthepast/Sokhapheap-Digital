import { 
  db, 
  auth,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  query, 
  where 
} from '../firebase';
import { Patient } from '../types';

const PATIENTS_COLLECTION = 'patients';

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  return errInfo;
}

/**
 * Clean object to remove undefined values which Firestore rejects
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Save / push a single patient record to Cloud Firestore.
 */
export async function pushPatientToFirestore(
  patient: Patient, 
  userUid?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!patient || !patient.id) {
      return { success: false, error: 'Invalid patient object' };
    }

    const docId = patient.id;
    const patientRef = doc(db, PATIENTS_COLLECTION, docId);

    const payload = sanitizeForFirestore({
      ...patient,
      userId: userUid || null,
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await setDoc(patientRef, payload, { merge: true });
    return { success: true };
  } catch (error: any) {
    const errInfo = handleFirestoreError(error, FirestoreOperationType.WRITE, `patients/${patient?.id}`);
    if (error?.code !== 'permission-denied' || auth.currentUser) {
      console.warn('Firestore pushPatient:', errInfo.error);
    }
    return { success: false, error: error?.message || 'Failed to save to Firestore' };
  }
}

/**
 * Batch push multiple patient records to Cloud Firestore.
 */
export async function pushAllPatientsToFirestore(
  patients: Patient[], 
  userUid?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!Array.isArray(patients) || patients.length === 0) {
      return { success: true, count: 0 };
    }

    let successCount = 0;
    for (const patient of patients) {
      const res = await pushPatientToFirestore(patient, userUid);
      if (res.success) {
        successCount++;
      }
    }

    return { success: successCount > 0, count: successCount };
  } catch (error: any) {
    console.warn('Firestore pushAllPatients error:', error);
    return { success: false, count: 0, error: error?.message };
  }
}

/**
 * Fetch a patient record from Cloud Firestore by ID, Email, or QR Token.
 */
export async function fetchPatientFromFirestore(
  idOrTokenOrEmail: string
): Promise<Patient | null> {
  try {
    if (!idOrTokenOrEmail) return null;
    const normalized = idOrTokenOrEmail.trim();

    // 1. Try direct document reference by ID
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, normalized);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Patient;
      }
    } catch {
      // Continue to query
    }

    // 2. Query by email
    const emailQuery = query(
      collection(db, PATIENTS_COLLECTION),
      where('email', '==', normalized.toLowerCase())
    );
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      return emailSnap.docs[0].data() as Patient;
    }

    // 3. Query by qrToken
    const tokenQuery = query(
      collection(db, PATIENTS_COLLECTION),
      where('qrToken', '==', normalized)
    );
    const tokenSnap = await getDocs(tokenQuery);
    if (!tokenSnap.empty) {
      return tokenSnap.docs[0].data() as Patient;
    }

    return null;
  } catch (error) {
    console.warn('Firestore fetchPatient error:', error);
    return null;
  }
}

/**
 * Fetch all patients from Firestore.
 */
export async function fetchAllPatientsFromFirestore(): Promise<Patient[]> {
  try {
    const colRef = collection(db, PATIENTS_COLLECTION);
    const querySnapshot = await getDocs(colRef);
    const patients: Patient[] = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        patients.push(docSnap.data() as Patient);
      }
    });
    return patients;
  } catch (error) {
    console.warn('Firestore fetchAllPatients error:', error);
    return [];
  }
}

/**
 * Real-time subscription to a patient document in Firestore.
 */
export function subscribeToPatientFirestore(
  patientId: string,
  onUpdate: (patient: Patient) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const docRef = doc(db, PATIENTS_COLLECTION, patientId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as Patient);
        }
      },
      (error) => {
        const errInfo = handleFirestoreError(error, FirestoreOperationType.GET, `patients/${patientId}`);
        if (onError) onError(error);
        else if (error?.code !== 'permission-denied' || auth.currentUser) {
          console.warn('Firestore subscription status:', errInfo.error);
        }
      }
    );
  } catch (error) {
    console.warn('Could not setup Firestore subscription:', error);
    return () => {};
  }
}

/**
 * Delete patient record from Firestore
 */
export async function deletePatientFromFirestore(patientId: string): Promise<boolean> {
  try {
    const docRef = doc(db, PATIENTS_COLLECTION, patientId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn('Firestore deletePatient error:', error);
    return false;
  }
}
