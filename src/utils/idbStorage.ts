import { Patient, MedicalRecord } from '../types';

const DB_NAME = 'SokhapheapHealthDB_v2';
const DB_VERSION = 2;
const STORE_PATIENTS = 'patients_store';
const STORE_RECORDS = 'medical_records_store';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db: IDBDatabase = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PATIENTS)) {
        db.createObjectStore(STORE_PATIENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        const recordStore = db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
        recordStore.createIndex('patientId', 'patientId', { unique: false });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Save all patients and their uploaded documents to IndexedDB
 */
export async function savePatientsToIDB(patients: Patient[]): Promise<void> {
  if (!Array.isArray(patients) || patients.length === 0) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_PATIENTS, STORE_RECORDS], 'readwrite');
    const pStore = tx.objectStore(STORE_PATIENTS);
    const rStore = tx.objectStore(STORE_RECORDS);

    for (const patient of patients) {
      if (patient && patient.id) {
        pStore.put(patient);

        if (Array.isArray(patient.medicalRecords)) {
          for (const rec of patient.medicalRecords) {
            if (rec && rec.id) {
              rStore.put({
                ...rec,
                patientId: patient.id,
              });
            }
          }
        }
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB savePatients error:', err);
  }
}

/**
 * Save a single patient and their uploaded documents to IndexedDB
 */
export async function saveSinglePatientToIDB(patient: Patient): Promise<void> {
  if (!patient || !patient.id) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_PATIENTS, STORE_RECORDS], 'readwrite');
    const pStore = tx.objectStore(STORE_PATIENTS);
    const rStore = tx.objectStore(STORE_RECORDS);

    pStore.put(patient);

    if (Array.isArray(patient.medicalRecords)) {
      for (const rec of patient.medicalRecords) {
        if (rec && rec.id) {
          rStore.put({
            ...rec,
            patientId: patient.id,
          });
        }
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveSinglePatient error:', err);
  }
}

/**
 * Save a single medical record directly to IndexedDB
 */
export async function saveSingleRecordToIDB(patientId: string, record: MedicalRecord): Promise<void> {
  if (!patientId || !record || !record.id) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_PATIENTS, STORE_RECORDS], 'readwrite');
    const rStore = tx.objectStore(STORE_RECORDS);
    const pStore = tx.objectStore(STORE_PATIENTS);

    rStore.put({
      ...record,
      patientId,
    });

    // Also update in patient object if exists
    const pReq = pStore.get(patientId);
    pReq.onsuccess = () => {
      const patient: Patient = pReq.result;
      if (patient) {
        const records = patient.medicalRecords || [];
        const exists = records.some((r) => r.id === record.id);
        const updatedRecords = exists
          ? records.map((r) => (r.id === record.id ? record : r))
          : [record, ...records];
        pStore.put({ ...patient, medicalRecords: updatedRecords });
      }
    };

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveSingleRecord error:', err);
  }
}

/**
 * Load all patients with all their uploaded documents from IndexedDB
 */
export async function loadPatientsFromIDB(): Promise<Patient[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_PATIENTS, STORE_RECORDS], 'readonly');
    const pStore = tx.objectStore(STORE_PATIENTS);
    const rStore = tx.objectStore(STORE_RECORDS);

    const [patients, allRecords] = await Promise.all([
      new Promise<Patient[]>((resolve, reject) => {
        const req = pStore.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }),
      new Promise<any[]>((resolve, reject) => {
        const req = rStore.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }),
    ]);

    if (!Array.isArray(patients) || patients.length === 0) {
      return [];
    }

    // Attach all stored records to their corresponding patients
    const patientMap = new Map<string, Patient>();
    for (const p of patients) {
      patientMap.set(p.id, {
        ...p,
        medicalRecords: Array.isArray(p.medicalRecords) ? [...p.medicalRecords] : [],
      });
    }

    for (const r of allRecords) {
      if (r && r.patientId && patientMap.has(r.patientId)) {
        const patient = patientMap.get(r.patientId)!;
        const exists = patient.medicalRecords.some((existing) => existing.id === r.id);
        if (!exists) {
          patient.medicalRecords.unshift(r);
        }
      }
    }

    return Array.from(patientMap.values());
  } catch (err) {
    console.warn('IndexedDB loadPatients error:', err);
    return [];
  }
}
