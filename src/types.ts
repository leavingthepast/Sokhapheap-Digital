export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export type RecordType = 'Prescription' | 'Lab Result' | 'Medical Report' | 'Other';

export type Language = 'en' | 'km';

export interface Allergy {
  id: string;
  name: string;
  reaction: string;
  severity?: 'Mild' | 'Moderate' | 'Severe';
}

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  notes?: string;
  provider?: string;
}

export interface MedicalRecord {
  id: string;
  name: string;
  type: RecordType;
  date: string;
  description: string;
  doctorOrClinic?: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'image' | 'document';
  imageUrl?: string;
  previewContent?: {
    clinicName?: string;
    doctorName?: string;
    diagnosisOrTest?: string;
    items?: string[];
    rawNotes?: string;
  };
}

export interface IllnessHistoryItem {
  id: string;
  condition: string;
  diagnosedDate: string;
  status: 'Active' | 'Resolved' | 'Chronic';
  doctorOrHospital: string;
  notes: string;
}

export interface LabResultItem {
  id: string;
  testName: string;
  date: string;
  result: string;
  referenceRange: string;
  status: 'Normal' | 'Attention' | 'Critical';
  labOrHospital: string;
}

export type QrAccessStatus = 'pending' | 'allowed' | 'not_allowed';

export interface QrAccessRequest {
  id: string;
  patientId: string;
  requesterName: string;
  requesterRole?: string;
  requesterLocation?: string;
  requestedAt: string;
  status: QrAccessStatus;
  respondedAt?: string;
  qrToken?: string;
  deviceId?: string;
}

export interface Patient {
  id: string;
  userId?: string;
  name: string;
  email: string;
  dob: string;
  gender: 'Female' | 'Male' | 'Other';
  phone: string;
  profilePicture?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bloodType: BloodType;
  allergies: Allergy[];
  vaccinations: Vaccination[];
  medicalRecords: MedicalRecord[];
  illnessHistory: IllnessHistoryItem[];
  labResults: LabResultItem[];
  qrToken: string;
  qrTokenCreatedAt: string;
  accessRequests?: QrAccessRequest[];
}

