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
    // Clear old legacy dummy key if present
    localStorage.removeItem('sokhapheap_digital_patients_v1');
    localStorage.removeItem('sokhapheap_digital_active_email_v1');

    const data = localStorage.getItem(STORAGE_KEY_PATIENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate if it contains old dummy data
        const isDummy = parsed.some(p => p.id === 'SKP-2026-8812' || (p.medicalRecords && p.medicalRecords.some((r: any) => r.id === 'rec-1')));
        if (!isDummy) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Error reading localStorage patients:', e);
  }
  // Initialize with clean initial data
  localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(INITIAL_PATIENTS));
  return INITIAL_PATIENTS;
}

export function saveStoredPatients(patients: Patient[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(patients));
  } catch (e) {
    console.error('Error saving localStorage patients:', e);
  }
}

