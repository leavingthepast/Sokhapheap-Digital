import { Patient, MedicalRecord, Allergy, Vaccination, IllnessHistoryItem, LabResultItem } from '../types';

// Public Cloud Run domain for multi-device scanning (works from any external phone/tablet)
export const CLOUD_DEPLOYED_URL = 'https://ais-pre-wun6t2kzqwnrzhf6l4uamt-34901302090.asia-southeast1.run.app';
export const CLOUD_DEV_URL = 'https://ais-dev-wun6t2kzqwnrzhf6l4uamt-34901302090.asia-southeast1.run.app';

/**
 * Robust UTF-8 to Base64 encoder working identically on Safari, Chrome, iOS & Android
 */
export function encodeUtf8Base64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return '';
    }
  }
}

/**
 * Robust Base64 to UTF-8 decoder working identically on Safari, Chrome, iOS & Android
 */
export function decodeUtf8Base64(base64: string): string {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch {
      return base64;
    }
  }
}

/**
 * Determines the best base URL for QR codes so mobile devices can access it over the public internet.
 */
export function getQRBaseUrl(customBase?: string): string {
  if (customBase) return customBase.replace(/\/+$/, '');

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    let pathname = window.location.pathname;
    if (pathname && pathname !== '/') {
      pathname = pathname.replace(/\/+$/, '');
    } else {
      pathname = '';
    }

    // If running on localhost or 127.0.0.1, external phones won't reach localhost, so use public deployed URL
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('about:') || !origin.startsWith('http')) {
      return CLOUD_DEPLOYED_URL;
    }

    return `${origin}${pathname}`;
  }

  return CLOUD_DEPLOYED_URL;
}

/**
 * Creates a compact JSON payload representing essential patient medical record data
 * for cross-device synchronization without needing a shared localStorage.
 */
export function createCompactPatientPayload(patient: Patient): string {
  const compact = {
    i: patient.id,
    n: patient.name,
    e: patient.email,
    p: patient.phone,
    b: patient.bloodType,
    d: patient.dob,
    g: patient.gender,
    pic: patient.profilePicture && patient.profilePicture.startsWith('http') ? patient.profilePicture : undefined,
    em: patient.emergencyContact,
    t: patient.qrToken,
    tc: patient.qrTokenCreatedAt,
    alg: (patient.allergies || []).map(a => ({ id: a.id, n: a.name, r: a.reaction, s: a.severity })),
    vac: (patient.vaccinations || []).map(v => ({ id: v.id, n: v.name, d: v.date, p: v.provider, nt: v.notes })),
    ill: (patient.illnessHistory || []).map(h => ({ id: h.id, c: h.condition, d: h.diagnosedDate, s: h.status, h: h.doctorOrHospital, nt: h.notes })),
    lab: (patient.labResults || []).map(l => ({ id: l.id, t: l.testName, d: l.date, r: l.result, ref: l.referenceRange, s: l.status, h: l.labOrHospital })),
    rec: (patient.medicalRecords || []).map(r => ({
      id: r.id,
      n: r.name,
      tp: r.type,
      d: r.date,
      desc: r.description,
      dr: r.doctorOrClinic,
      fn: r.fileName,
      fs: r.fileSize,
      ft: r.fileType,
      img: r.imageUrl && (r.imageUrl.startsWith('http') || r.imageUrl.length < 2500) ? r.imageUrl : undefined,
      pv: r.previewContent ? {
        cn: r.previewContent.clinicName,
        dn: r.previewContent.doctorName,
        dt: r.previewContent.diagnosisOrTest,
        it: r.previewContent.items,
        rn: r.previewContent.rawNotes
      } : undefined
    }))
  };

  try {
    const jsonStr = JSON.stringify(compact);
    const encodedB64 = encodeUtf8Base64(jsonStr);
    return encodeURIComponent(encodedB64);
  } catch (e) {
    console.warn('Failed to encode compact patient payload', e);
    return '';
  }
}

/**
 * Reconstructs a full Patient object from a compact QR payload.
 */
export function parseCompactPatientPayload(encoded: string): Patient | null {
  try {
    let jsonStr = '';
    const decodedUri = decodeURIComponent(encoded);
    
    // Attempt decoding as base64 UTF-8
    try {
      jsonStr = decodeUtf8Base64(decodedUri);
    } catch {
      jsonStr = decodedUri;
    }

    let c: any = null;
    try {
      c = JSON.parse(jsonStr);
    } catch {
      // If parsing failed, try direct JSON parse of decodedUri in case it wasn't base64
      try {
        c = JSON.parse(decodedUri);
      } catch {
        return null;
      }
    }

    if (!c || !c.i || !c.n) return null;

    const patient: Patient = {
      id: c.i,
      name: c.n,
      email: c.e || `${c.n.toLowerCase().replace(/\s+/g, '')}@sokhapheap.kh`,
      phone: c.p || '',
      dob: c.d || '',
      gender: c.g || 'Female',
      bloodType: c.b || 'Unknown',
      profilePicture: c.pic || undefined,
      emergencyContact: c.em || {
        name: '',
        relationship: '',
        phone: ''
      },
      qrToken: c.t || 'SKP-TOK-VERIFIED',
      qrTokenCreatedAt: c.tc || new Date().toISOString(),
      allergies: (c.alg || []).map((a: any) => ({
        id: a.id || `alg-${Math.random()}`,
        name: a.n || 'Allergy',
        reaction: a.r || '',
        severity: a.s || 'Moderate'
      })),
      vaccinations: (c.vac || []).map((v: any) => ({
        id: v.id || `vac-${Math.random()}`,
        name: v.n || 'Vaccine',
        date: v.d || '2024-01-01',
        provider: v.p || 'Healthcare Provider',
        notes: v.nt || ''
      })),
      illnessHistory: (c.ill || []).map((h: any) => ({
        id: h.id || `ill-${Math.random()}`,
        condition: h.c || 'Condition',
        diagnosedDate: h.d || '2024-01-01',
        status: h.s || 'Resolved',
        doctorOrHospital: h.h || 'Medical Center',
        notes: h.nt || ''
      })),
      labResults: (c.lab || []).map((l: any) => ({
        id: l.id || `lab-${Math.random()}`,
        testName: l.t || 'Lab Test',
        date: l.d || '2024-01-01',
        result: l.r || 'Normal',
        referenceRange: l.ref || 'Normal Range',
        status: l.s || 'Normal',
        labOrHospital: l.h || 'Clinical Laboratory'
      })),
      medicalRecords: (c.rec || []).map((r: any) => ({
        id: r.id || `rec-${Math.random()}`,
        name: r.n || 'Clinical Record',
        type: r.tp || 'Medical Report',
        date: r.d || '2024-01-01',
        description: r.desc || '',
        doctorOrClinic: r.dr || 'Attending Physician',
        fileName: r.fn || 'record.pdf',
        fileSize: r.fs || '1.2 MB',
        fileType: r.ft || 'pdf',
        imageUrl: r.img,
        previewContent: r.pv ? {
          clinicName: r.pv.cn || r.dr || 'Verified Clinical Facility',
          doctorName: r.pv.dn || 'Attending Practitioner',
          diagnosisOrTest: r.pv.dt || r.n || 'Clinical Record',
          items: Array.isArray(r.pv.it) ? r.pv.it : [r.desc || 'Medical Document Record'],
          rawNotes: r.pv.rn || r.desc || ''
        } : undefined
      }))
    };

    return patient;
  } catch (e) {
    console.error('Failed to parse patient payload from QR', e);
    return null;
  }
}

/**
 * Builds the clean, high-speed QR Code scanning URL.
 * Produces a concise, reliable URL that never exceeds QR matrix capacity
 * and resolves seamlessly on mobile cameras via server sync or token lookup.
 */
export function generateDoctorScanUrl(patient: Patient, customBase?: string): string {
  const baseUrl = getQRBaseUrl(customBase);
  const compact = createCompactPatientPayload(patient);
  
  // If compact payload fits comfortably within standard QR matrix capacity (<1200 chars), append pdata for instant zero-latency loading
  if (compact && compact.length < 1200) {
    return `${baseUrl}?view=doctor_portal&token=${encodeURIComponent(patient.qrToken)}&id=${encodeURIComponent(patient.id)}&pdata=${compact}#doctor_portal`;
  }

  return `${baseUrl}?view=doctor_portal&token=${encodeURIComponent(patient.qrToken)}&id=${encodeURIComponent(patient.id)}#doctor_portal`;
}
