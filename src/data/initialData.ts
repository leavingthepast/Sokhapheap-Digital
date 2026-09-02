import { Patient } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'SKP-2026-0001',
    name: 'Patient',
    email: 'patient@sokhapheap.kh',
    dob: '',
    gender: 'Female',
    phone: '',
    profilePicture: undefined,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    bloodType: 'Unknown',
    allergies: [],
    vaccinations: [],
    illnessHistory: [],
    labResults: [],
    medicalRecords: [],
    qrToken: 'SKP-TOK-0001',
    qrTokenCreatedAt: new Date().toISOString(),
  },
];

export const STORAGE_KEY_PATIENTS = 'sokhapheap_digital_patients_v2';
export const STORAGE_KEY_ACTIVE_USER = 'sokhapheap_digital_active_email_v2';

export function getStoredPatients(): Patient[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PATIENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading localStorage patients:', e);
  }
  // Initialize with clean initial data
  try {
    localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(INITIAL_PATIENTS));
  } catch {
    // ignore
  }
  return INITIAL_PATIENTS;
}

export function saveStoredPatients(patients: Patient[]): void {
  if (!Array.isArray(patients) || patients.length === 0) return;
  try {
    localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(patients));
  } catch {
    // If full data exceeds 5MB localStorage limit, strip large base64 strings for localStorage fallback
    try {
      const sanitized = patients.map((p) => ({
        ...p,
        medicalRecords: (p.medicalRecords || []).map((r) => ({
          ...r,
          imageUrl: r.imageUrl && r.imageUrl.length > 5000 ? undefined : r.imageUrl,
        })),
      }));
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(sanitized));
    } catch (innerErr) {
      console.warn('LocalStorage fallback note:', innerErr);
    }
  }
}


