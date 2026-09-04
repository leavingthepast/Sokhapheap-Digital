import { Patient, MedicalRecord, Allergy, Vaccination, IllnessHistoryItem, LabResultItem, QrAccessRequest } from '../types';
import { CLOUD_DEPLOYED_URL } from './qrPayload';
import { savePatientsToIDB, loadPatientsFromIDB } from './idbStorage';
import { 
  pushPatientToFirestore, 
  fetchPatientFromFirestore, 
  fetchAllPatientsFromFirestore 
} from './firestoreService';

const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : CLOUD_DEPLOYED_URL;

/**
 * Robustly merge local and remote patient records without dropping uploaded documents
 */
export function mergePatientRecords(localP?: Patient, remoteP?: Patient): Patient {
  if (!localP && !remoteP) {
    return {
      id: 'SKP-2026-0001',
      name: 'Patient',
      email: 'patient@sokhapheap.kh',
      dob: '',
      gender: 'Female',
      phone: '',
      bloodType: 'Unknown',
      allergies: [],
      vaccinations: [],
      medicalRecords: [],
      illnessHistory: [],
      labResults: [],
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
      qrToken: 'SKP-TOK-0001',
      qrTokenCreatedAt: new Date().toISOString(),
    };
  }
  if (!localP) return remoteP!;
  if (!remoteP) return localP;

  // Union medical records by id preserving all documents
  const recordsMap = new Map<string, MedicalRecord>();
  (remoteP.medicalRecords || []).forEach(r => { if (r && r.id) recordsMap.set(r.id, r); });
  (localP.medicalRecords || []).forEach(r => { if (r && r.id) recordsMap.set(r.id, r); });

  const allergiesMap = new Map<string, Allergy>();
  (remoteP.allergies || []).forEach(a => { if (a && a.id) allergiesMap.set(a.id, a); });
  (localP.allergies || []).forEach(a => { if (a && a.id) allergiesMap.set(a.id, a); });

  const vacMap = new Map<string, Vaccination>();
  (remoteP.vaccinations || []).forEach(v => { if (v && v.id) vacMap.set(v.id, v); });
  (localP.vaccinations || []).forEach(v => { if (v && v.id) vacMap.set(v.id, v); });

  const illnessMap = new Map<string, IllnessHistoryItem>();
  (remoteP.illnessHistory || []).forEach(i => { if (i && i.id) illnessMap.set(i.id, i); });
  (localP.illnessHistory || []).forEach(i => { if (i && i.id) illnessMap.set(i.id, i); });

  const labMap = new Map<string, LabResultItem>();
  (remoteP.labResults || []).forEach(l => { if (l && l.id) labMap.set(l.id, l); });
  (localP.labResults || []).forEach(l => { if (l && l.id) labMap.set(l.id, l); });

  // Union access requests by id preserving latest decisions (allowed / not_allowed overrides pending)
  const accessRequestsMap = new Map<string, QrAccessRequest>();
  (remoteP.accessRequests || []).forEach(r => { if (r && r.id) accessRequestsMap.set(r.id, r); });
  (localP.accessRequests || []).forEach(r => {
    if (r && r.id) {
      const existing = accessRequestsMap.get(r.id);
      if (existing && existing.status !== 'pending' && r.status === 'pending') {
        // Keep existing allowed or not_allowed status
      } else {
        accessRequestsMap.set(r.id, r);
      }
    }
  });

  return {
    ...remoteP,
    ...localP,
    name: localP.name && localP.name !== 'Patient' ? localP.name : (remoteP.name || localP.name),
    email: localP.email || remoteP.email,
    bloodType: localP.bloodType && localP.bloodType !== 'Unknown' ? localP.bloodType : (remoteP.bloodType || 'Unknown'),
    medicalRecords: Array.from(recordsMap.values()),
    allergies: Array.from(allergiesMap.values()),
    vaccinations: Array.from(vacMap.values()),
    illnessHistory: Array.from(illnessMap.values()),
    labResults: Array.from(labMap.values()),
    accessRequests: Array.from(accessRequestsMap.values()),
    profilePicture: localP.profilePicture || remoteP.profilePicture,
    emergencyContact: localP.emergencyContact?.name ? localP.emergencyContact : (remoteP.emergencyContact || localP.emergencyContact),
    qrToken: localP.qrToken || remoteP.qrToken,
    qrTokenCreatedAt: localP.qrTokenCreatedAt || remoteP.qrTokenCreatedAt,
  };
}

/**
 * Resizes and compresses an image data URL to a clean, fast-loading web format
 * suitable for cross-device syncing without hitting size limits.
 */
export async function compressImageForUpload(
  dataUrl: string, 
  maxDimension: number = 1600, 
  quality: number = 0.85
): Promise<string> {
  // If already a remote URL, return directly
  if (dataUrl.startsWith('http')) return dataUrl;
  if (!dataUrl.startsWith('data:image')) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(dataUrl);
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Fetch patient from Cloud Firestore or backend API server by ID, token or email.
 */
export async function fetchPatientFromServer(idOrToken: string): Promise<Patient | null> {
  if (!idOrToken) return null;

  // 1. Try fetching directly from Cloud Firestore first
  try {
    const firestorePatient = await fetchPatientFromFirestore(idOrToken);
    if (firestorePatient) {
      return firestorePatient;
    }
  } catch (err) {
    console.warn('[Firestore] Could not fetch from firestore directly:', err);
  }

  // 2. Fallback to REST API endpoints
  try {
    const endpoints = [
      `/api/patients/${encodeURIComponent(idOrToken)}`,
      `/api/patient?id=${encodeURIComponent(idOrToken)}`,
      `/api/patient?token=${encodeURIComponent(idOrToken)}`,
      `${CLOUD_DEPLOYED_URL}/api/patients/${encodeURIComponent(idOrToken)}`,
      `${CLOUD_DEPLOYED_URL}/api/patient?token=${encodeURIComponent(idOrToken)}`
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const body = await res.json();
          if (body && body.data) return body.data;
          if (body && body.id) return body;
        }
      } catch {
        // try next endpoint
      }
    }
  } catch (e) {
    console.warn('Could not fetch patient from server', e);
  }
  return null;
}

/**
 * Save single patient (including newly uploaded documents) to IDB and backend server.
 */
export async function savePatientToServer(patient: Patient, _userUid?: string): Promise<boolean> {
  // 1. Save to IndexedDB immediately for instant offline durability
  await savePatientsToIDB([patient]).catch(() => {});

  let serverSuccess = false;
  try {
    // 2. Push to API backend with disk persistence
    const endpoints = [
      '/api/patient',
      `${CLOUD_DEPLOYED_URL}/api/patient`
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patient),
        });
        if (res.ok) {
          serverSuccess = true;
          break;
        }
      } catch {
        // continue
      }
    }
  } catch (e) {
    console.warn('Could not save patient to server', e);
  }
  return serverSuccess || true;
}

/**
 * Batch sync patients with IndexedDB, Cloud Firestore, and backend server.
 */
export async function syncPatientsWithServer(localPatients: Patient[], userUid?: string): Promise<Patient[]> {
  try {
    // 1. Check if IndexedDB has additional patients/documents
    const idbPatients = await loadPatientsFromIDB();
    const mergedMap = new Map<string, Patient>();

    for (const p of localPatients) {
      mergedMap.set(p.id, p);
    }

    for (const idbP of idbPatients) {
      const existing = mergedMap.get(idbP.id);
      mergedMap.set(idbP.id, mergePatientRecords(existing, idbP));
    }

    // 2. Cloud Firestore pull if user is logged in
    const targetUid = userUid || (localPatients.find((p) => p.userId)?.userId);
    if (targetUid) {
      try {
        const remoteFirestorePatients = await fetchAllPatientsFromFirestore(targetUid);
        if (Array.isArray(remoteFirestorePatients) && remoteFirestorePatients.length > 0) {
          for (const fp of remoteFirestorePatients) {
            const existing = mergedMap.get(fp.id);
            mergedMap.set(fp.id, mergePatientRecords(existing, fp));
          }
        }
      } catch (err) {
        console.warn('[Firestore] Sync pull note:', err);
      }
    }

    const currentList = Array.from(mergedMap.values());

    // 3. Push local patients to Server
    if (currentList.length > 0) {
      await savePatientsToIDB(currentList).catch(() => {});
      
      try {
        await fetch('/api/patients/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patients: currentList }),
        });
      } catch {
        // Ignore network errors in local dev
      }
    }

    // 5. Fetch latest patients from API backend
    const res = await fetch('/api/patients');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        for (const sp of data.data) {
          const existing = mergedMap.get(sp.id);
          mergedMap.set(sp.id, mergePatientRecords(existing, sp));
        }
        const finalMerged = Array.from(mergedMap.values());
        await savePatientsToIDB(finalMerged).catch(() => {});
        return finalMerged;
      }
    }

    return currentList;
  } catch (e) {
    console.warn('Server sync skipped, using local data', e);
  }
  return localPatients;
}

