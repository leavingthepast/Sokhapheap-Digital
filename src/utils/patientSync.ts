import { Patient } from '../types';
import { CLOUD_DEPLOYED_URL } from './qrPayload';
import { 
  pushPatientToFirestore, 
  fetchPatientFromFirestore, 
  fetchAllPatientsFromFirestore,
  pushAllPatientsToFirestore 
} from './firestoreService';

const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : CLOUD_DEPLOYED_URL;

/**
 * Resizes and compresses an image data URL to a clean, fast-loading web format
 * suitable for cross-device syncing without hitting size limits.
 */
export async function compressImageForUpload(
  dataUrl: string, 
  maxDimension: number = 1000, 
  quality: number = 0.8
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
 * Fetch patient from Cloud Firestore or fallback API server by ID, token or email.
 */
export async function fetchPatientFromServer(idOrToken: string): Promise<Patient | null> {
  try {
    // 1. Try Cloud Firestore first
    const firestorePatient = await fetchPatientFromFirestore(idOrToken);
    if (firestorePatient) {
      return firestorePatient;
    }

    // 2. Fallback to API endpoints
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
 * Save single patient (including newly uploaded documents) to Cloud Firestore and server.
 */
export async function savePatientToServer(patient: Patient, userUid?: string): Promise<boolean> {
  let firestoreSuccess = false;
  try {
    // 1. Push to Cloud Firestore
    const res = await pushPatientToFirestore(patient, userUid);
    firestoreSuccess = res.success;
  } catch (e) {
    console.warn('Firestore direct push error:', e);
  }

  try {
    // 2. Also push to API backend
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
        if (res.ok) return true;
      } catch {
        // continue
      }
    }
  } catch (e) {
    console.warn('Could not save patient to server', e);
  }
  return firestoreSuccess;
}

/**
 * Batch sync patients with Cloud Firestore and server.
 */
export async function syncPatientsWithServer(localPatients: Patient[], userUid?: string): Promise<Patient[]> {
  try {
    // 1. First push local patients to Firestore
    if (localPatients.length > 0) {
      await pushAllPatientsToFirestore(localPatients, userUid).catch(() => {});
      
      try {
        await fetch('/api/patients/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patients: localPatients }),
        });
      } catch {
        // Ignore network errors in local dev
      }
    }

    // 2. Fetch latest patients from Firestore
    const firestorePatients = await fetchAllPatientsFromFirestore();
    if (firestorePatients.length > 0) {
      // Merge with local records
      const mergedMap = new Map<string, Patient>();
      for (const p of localPatients) {
        mergedMap.set(p.id, p);
      }
      for (const p of firestorePatients) {
        mergedMap.set(p.id, p);
      }
      return Array.from(mergedMap.values());
    }

    // 3. Fallback to API backend
    const res = await fetch('/api/patients');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch (e) {
    console.warn('Server sync skipped, using local data', e);
  }
  return localPatients;
}
