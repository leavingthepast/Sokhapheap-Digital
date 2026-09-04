import React, { useState, useEffect, useMemo } from 'react';
import { 
  getStoredPatients, 
  saveStoredPatients, 
  STORAGE_KEY_ACTIVE_USER,
  INITIAL_PATIENTS 
} from './data/initialData';
import { Patient, BloodType, Allergy, Vaccination, MedicalRecord, QrAccessRequest } from './types';
import { parseCompactPatientPayload } from './utils/qrPayload';
import { fetchPatientFromServer, savePatientToServer, syncPatientsWithServer, mergePatientRecords } from './utils/patientSync';
import { savePatientsToIDB, loadPatientsFromIDB, saveSinglePatientToIDB, saveSingleRecordToIDB } from './utils/idbStorage';
import { 
  pushPatientToFirestore, 
  fetchAllPatientsFromFirestore, 
  subscribeToPatientFirestore 
} from './utils/firestoreService';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type FirebaseUser
} from './firebase';
import { Navbar } from './components/Navbar';
import { WelcomeBanner } from './components/WelcomeBanner';
import { BloodTypeCard } from './components/BloodTypeCard';
import { AllergiesCard } from './components/AllergiesCard';
import { VaccinationsCard } from './components/VaccinationsCard';
import { MedicalRecordsSection } from './components/MedicalRecordsSection';
import { MedicalSummaryPDF } from './components/MedicalSummaryPDF';
import { DoctorMedicalRecordView } from './components/DoctorMedicalRecordView';
import { DoctorAdmitGate } from './components/DoctorAdmitGate';
import { AccessRequestsNotificationModal } from './components/AccessRequestsNotificationModal';
import { subscribeToIncomingRequests, updateQrAccessDecision } from './utils/qrAccessManager';
import { QRCodeTab } from './components/QRCodeTab';
import { AuthPage } from './components/AuthPage';
import { 
  BloodTypeModal, 
  AllergyModal, 
  VaccinationModal, 
  AddMedicalRecordModal, 
  DocumentViewerModal,
  EditProfileModal,
  EditProfileFormData
} from './components/Modals';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { HelpCircle, CheckCircle, FileText, AlertTriangle, Bell, Check, Ban, X } from 'lucide-react';

function parseUrlScanContext(): {
  isDoctorView: boolean;
  targetPatientId?: string;
  targetToken?: string;
  scannedPatient?: Patient | null;
} {
  if (typeof window === 'undefined') {
    return { isDoctorView: false };
  }

  try {
    const href = window.location.href;
    const searchParams = new URLSearchParams(window.location.search);
    
    let hash = window.location.hash || '';
    if (hash.startsWith('#')) hash = hash.substring(1);
    const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : (hash.includes('=') ? hash : ''));

    // Extract potential params from search query, hash params, or direct URL regex matches
    const view = searchParams.get('view') || hashParams.get('view') || (href.includes('view=doctor_portal') ? 'doctor_portal' : null);
    const token = searchParams.get('token') || hashParams.get('token') || (href.match(/[?&#]token=([^&#]+)/)?.[1]);
    const patientId = searchParams.get('id') || hashParams.get('id') || (href.match(/[?&#]id=([^&#]+)/)?.[1]);
    const pdataRaw = searchParams.get('pdata') || hashParams.get('pdata') || searchParams.get('payload') || hashParams.get('payload') || (href.match(/[?&#]pdata=([^&#]+)/)?.[1]);

    let scannedPatient: Patient | null = null;
    if (pdataRaw) {
      try {
        scannedPatient = parseCompactPatientPayload(decodeURIComponent(pdataRaw));
      } catch {
        try {
          scannedPatient = parseCompactPatientPayload(pdataRaw);
        } catch {
          // ignore
        }
      }
    }

    const isDoctorView = 
      view === 'doctor_portal' || 
      Boolean(token) || 
      Boolean(patientId) || 
      Boolean(scannedPatient) || 
      window.location.hash.includes('doctor_portal') ||
      href.includes('doctor_portal');

    return {
      isDoctorView,
      targetPatientId: patientId ? decodeURIComponent(patientId) : undefined,
      targetToken: token ? decodeURIComponent(token) : undefined,
      scannedPatient
    };
  } catch (e) {
    console.error('Error parsing URL context', e);
    return { isDoctorView: false };
  }
}

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}

function formatFirebaseAuthError(error: any, mode: 'login' | 'signup'): string {
  const code = error?.code || '';
  const message = error?.message || '';

  if (mode === 'login') {
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-login-credentials' ||
      code === 'auth/invalid-email' ||
      message.includes('INVALID_LOGIN_CREDENTIALS') ||
      message.includes('invalid-credential') ||
      message.includes('wrong-password') ||
      message.includes('user-not-found')
    ) {
      return 'Email or password is incorrect';
    }
  }

  if (mode === 'signup') {
    if (
      code === 'auth/email-already-in-use' ||
      message.includes('email-already-in-use') ||
      message.includes('EMAIL_EXISTS')
    ) {
      return 'User already exists. Please sign in';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters long.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
  }

  if (code === 'auth/network-request-failed') {
    return 'Network connection issue. Please check your internet connection.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please try again in a few moments.';
  }

  if (mode === 'login') {
    return 'Email or password is incorrect';
  }

  return error?.message || 'Authentication failed. Please try again.';
}

function DashboardContent() {
  const { t } = useLanguage();
  const initialScanContext = useMemo(() => parseUrlScanContext(), []);

  const [patients, setPatients] = useState<Patient[]>(() => {
    const stored = getStoredPatients();
    if (initialScanContext.scannedPatient) {
      const idx = stored.findIndex(p => p.id === initialScanContext.scannedPatient!.id);
      if (idx >= 0) {
        stored[idx] = initialScanContext.scannedPatient;
        return stored;
      }
      return [initialScanContext.scannedPatient, ...stored];
    }
    return stored;
  });

  const [activeEmail, setActiveEmail] = useState<string | null>(() => {
    if (initialScanContext.scannedPatient) {
      return initialScanContext.scannedPatient.email;
    }
    if (initialScanContext.targetPatientId || initialScanContext.targetToken) {
      const stored = getStoredPatients();
      const matched = stored.find(
        p => (initialScanContext.targetPatientId && p.id === initialScanContext.targetPatientId) ||
             (initialScanContext.targetToken && p.qrToken === initialScanContext.targetToken)
      );
      if (matched) return matched.email;
    }
    return auth.currentUser?.email?.toLowerCase() || localStorage.getItem(STORAGE_KEY_ACTIVE_USER) || null;
  });

  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'qrcode'>('overview');
  const [isPdfViewOpen, setIsPdfViewOpen] = useState(false);
  const [isDoctorViewOpen, setIsDoctorViewOpen] = useState<boolean>(() => initialScanContext.isDoctorView);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  // Modals state
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [bloodTypeModalOpen, setBloodTypeModalOpen] = useState(false);
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [allergyToEdit, setAllergyToEdit] = useState<Allergy | null>(null);
  const [vaccineModalOpen, setVaccineModalOpen] = useState(false);
  const [vaccineToEdit, setVaccineToEdit] = useState<Vaccination | null>(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [initialUploadFile, setInitialUploadFile] = useState<File | null>(null);
  const [viewerRecord, setViewerRecord] = useState<MedicalRecord | null>(null);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [activeScanAlert, setActiveScanAlert] = useState<QrAccessRequest | null>(null);

  // Listen to Firebase Authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const lowerEmail = user.email.toLowerCase();
        setActiveEmail(lowerEmail);
        localStorage.setItem(STORAGE_KEY_ACTIVE_USER, lowerEmail);

        setPatients((prev) => {
          const matchIdx = prev.findIndex(
            (p) => (p.userId && p.userId === user.uid) || (p.email && p.email.toLowerCase() === lowerEmail)
          );
          if (matchIdx >= 0) {
            if (prev[matchIdx].userId !== user.uid) {
              const copy = [...prev];
              copy[matchIdx] = { ...copy[matchIdx], userId: user.uid, email: lowerEmail };
              saveStoredPatients(copy);
              savePatientsToIDB(copy).catch(() => {});
              return copy;
            }
            return prev;
          }

          // If there is an unassigned patient record, adopt it for this user
          const unassignedIdx = prev.findIndex((p) => !p.userId);
          if (unassignedIdx >= 0) {
            const copy = [...prev];
            copy[unassignedIdx] = {
              ...copy[unassignedIdx],
              userId: user.uid,
              email: lowerEmail,
              name: user.displayName || copy[unassignedIdx].name,
            };
            saveStoredPatients(copy);
            savePatientsToIDB(copy).catch(() => {});
            return copy;
          }

          return prev;
        });

        // Live sync: fetch patient records from Cloud Firestore
        try {
          const remotePatients = await fetchAllPatientsFromFirestore(user.uid);
          if (remotePatients && remotePatients.length > 0) {
            setPatients((prev) => {
              const map = new Map<string, Patient>();
              for (const p of prev) map.set(p.id, p);
              for (const rp of remotePatients) {
                const existing = map.get(rp.id);
                map.set(rp.id, mergePatientRecords(existing, rp));
              }
              const mergedList = Array.from(map.values());
              saveStoredPatients(mergedList);
              savePatientsToIDB(mergedList).catch(() => {});
              return mergedList;
            });
          }
        } catch (fsErr) {
          console.warn('[Firestore] Initial user sync note:', fsErr);
        }
      } else {
        const ctx = parseUrlScanContext();
        if (!ctx.isDoctorView) {
          setActiveEmail(null);
          localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
        }
      }
      setIsHydrated(true);
    });

    return () => unsubscribe();
  }, []);

  // Check URL parameters for QR scan routing (handles popstate and hashchange)
  useEffect(() => {
    const checkUrlParams = async () => {
      const ctx = parseUrlScanContext();
      if (ctx.isDoctorView) {
        if (ctx.scannedPatient) {
          setPatients((prev) => {
            const idx = prev.findIndex((p) => p.id === ctx.scannedPatient!.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = ctx.scannedPatient!;
              return copy;
            }
            return [ctx.scannedPatient!, ...prev];
          });
          setActiveEmail(ctx.scannedPatient.email);
        }

        // Also attempt server fetch to ensure any newly uploaded high-res documents are received
        const targetIdOrToken = ctx.targetPatientId || ctx.targetToken || (ctx.scannedPatient ? ctx.scannedPatient.id : undefined);
        if (targetIdOrToken) {
          try {
            const freshPatient = await fetchPatientFromServer(targetIdOrToken);
            if (freshPatient) {
              setPatients((prev) => {
                const idx = prev.findIndex((p) => p.id === freshPatient.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = freshPatient;
                  return copy;
                }
                return [freshPatient, ...prev];
              });
              setActiveEmail(freshPatient.email);
            } else if (!ctx.scannedPatient) {
              const matched = patients.find(
                (p) =>
                  (ctx.targetPatientId && p.id === ctx.targetPatientId) ||
                  (ctx.targetToken && p.qrToken === ctx.targetToken)
              );
              if (matched) {
                setActiveEmail(matched.email);
              }
            }
          } catch {
            // fallback
          }
        }
        setIsDoctorViewOpen(true);
      }
    };

    checkUrlParams();
    window.addEventListener('popstate', checkUrlParams);
    window.addEventListener('hashchange', checkUrlParams);
    return () => {
      window.removeEventListener('popstate', checkUrlParams);
      window.removeEventListener('hashchange', checkUrlParams);
    };
  }, []);

  // Initial load & sync with IndexedDB and backend server on load
  useEffect(() => {
    let isMounted = true;

    async function initializeData() {
      try {
        // 1. Load from local IndexedDB first
        const idbList = await loadPatientsFromIDB();
        if (isMounted) {
          if (Array.isArray(idbList) && idbList.length > 0) {
            setPatients((prev) => {
              const map = new Map<string, Patient>();
              for (const p of prev) map.set(p.id, p);
              for (const idbP of idbList) {
                const existing = map.get(idbP.id);
                map.set(idbP.id, mergePatientRecords(existing, idbP));
              }
              return Array.from(map.values());
            });
          }
          setIsHydrated(true);
        }

        // 2. Sync with remote server and Cloud Firestore
        const baseForSync = idbList && idbList.length > 0 ? idbList : patients;
        const synced = await syncPatientsWithServer(baseForSync, currentUser?.uid);
        if (isMounted && Array.isArray(synced) && synced.length > 0) {
          setPatients(synced);
        }
      } catch (err) {
        if (isMounted) setIsHydrated(true);
        console.warn('Initialization note:', err);
      }
    }

    initializeData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save patients whenever they change (ONLY after initial IDB hydration is complete)
  useEffect(() => {
    if (!isHydrated) return;
    saveStoredPatients(patients);
    if (patients.length > 0) {
      savePatientsToIDB(patients).catch(() => {});
      // Debounce server backup synchronization to prevent request flooding
      const timer = setTimeout(() => {
        fetch('/api/patients/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patients }),
        }).catch(() => {});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [patients, isHydrated]);

  const currentPatient = useMemo(() => {
    if (isDoctorViewOpen || initialScanContext.isDoctorView) {
      if (initialScanContext.scannedPatient) {
        const found = patients.find(p => p.id === initialScanContext.scannedPatient!.id);
        if (found) return found;
        return initialScanContext.scannedPatient;
      }
      if (initialScanContext.targetPatientId || initialScanContext.targetToken) {
        const found = patients.find(
          p => (initialScanContext.targetPatientId && p.id === initialScanContext.targetPatientId) ||
               (initialScanContext.targetToken && p.qrToken === initialScanContext.targetToken)
        );
        if (found) return found;
      }
    }
    if (currentUser?.uid) {
      const foundByUid = patients.find((p) => p.userId === currentUser.uid);
      if (foundByUid) return foundByUid;
    }
    if (activeEmail) {
      const found = patients.find((p) => p.email.toLowerCase() === activeEmail.toLowerCase());
      if (found) return found;
    }
    if (patients.length > 0) {
      return patients[0];
    }
    const email = currentUser?.email || activeEmail || 'patient@sokhapheap.kh';
    const displayName = currentUser?.displayName || email.split('@')[0] || 'Patient';
    return {
      ...INITIAL_PATIENTS[0],
      id: `SKP-${currentUser?.uid ? currentUser.uid.substring(0, 8).toUpperCase() : '2026-USER'}`,
      userId: currentUser?.uid,
      name: displayName,
      email: email,
      qrToken: `SKP-TOK-${currentUser?.uid ? currentUser.uid.substring(0, 6).toUpperCase() : 'USER'}`,
      qrTokenCreatedAt: new Date().toISOString(),
    };
  }, [patients, activeEmail, currentUser, isDoctorViewOpen, initialScanContext]);

  // Real-time Cloud Firestore subscription for active logged-in patient
  useEffect(() => {
    if (!currentUser?.uid || !currentPatient?.id) return;

    const unsubscribe = subscribeToPatientFirestore(currentPatient.id, (remotePatient) => {
      if (remotePatient && remotePatient.id === currentPatient.id) {
        setPatients((prev) => {
          const idx = prev.findIndex((p) => p.id === remotePatient.id);
          if (idx >= 0) {
            const merged = mergePatientRecords(prev[idx], remotePatient);
            const copy = [...prev];
            copy[idx] = merged;
            saveStoredPatients(copy);
            savePatientsToIDB(copy).catch(() => {});
            return copy;
          }
          return [remotePatient, ...prev];
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, currentPatient?.id]);

  // Real-time subscription to incoming QR scan admission requests for active patient
  useEffect(() => {
    if (!currentPatient?.id || isDoctorViewOpen) return;

    const unsubscribe = subscribeToIncomingRequests(currentPatient.id, (freshRequests, isNewAlert) => {
      setPatients((prev) => {
        const idx = prev.findIndex((p) => p.id === currentPatient.id);
        if (idx >= 0) {
          const currentList = prev[idx].accessRequests || [];
          const map = new Map<string, any>();
          currentList.forEach((r) => map.set(r.id, r));
          freshRequests.forEach((r) => {
            const existing = map.get(r.id);
            // If local status is already 'allowed' or 'not_allowed', preserve it over stale 'pending'
            if (existing && existing.status !== 'pending' && r.status === 'pending') {
              map.set(r.id, existing);
            } else {
              map.set(r.id, r);
            }
          });
          const mergedList = Array.from(map.values()).sort((a, b) =>
            new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime()
          );

          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            accessRequests: mergedList,
          };
          saveStoredPatients(copy);
          return copy;
        }
        return prev;
      });

      // Exactly ONE scan triggers ONE instant notification alert!
      if (isNewAlert) {
        const latestPending = freshRequests.find((r) => r.status === 'pending');
        if (latestPending) {
          setActiveScanAlert(latestPending);
        }
      }
    });

    return () => unsubscribe();
  }, [currentPatient?.id, isDoctorViewOpen]);

  // Instant one-click decision from the scan notification alert banner
  const handleQuickDecision = async (decision: 'allowed' | 'not_allowed') => {
    if (!activeScanAlert || !currentPatient) return;
    const reqId = activeScanAlert.id;
    setActiveScanAlert(null);

    // 1. Immediately update local patient state
    updateCurrentPatient((p) => ({
      ...p,
      accessRequests: (p.accessRequests || []).map((r) =>
        r.id === reqId
          ? { ...r, status: decision, respondedAt: new Date().toISOString() }
          : r
      ),
    }));

    // 2. Immediately push decision to server and BroadcastChannel with zero wait
    await updateQrAccessDecision(currentPatient.id, reqId, decision);
  };

  const handleSyncData = async (): Promise<boolean> => {
    try {
      if (currentPatient) {
        saveStoredPatients(patients);
        await savePatientsToIDB(patients).catch(() => {});
        await savePatientToServer(currentPatient, currentUser?.uid).catch(() => {});
        const res = await pushPatientToFirestore(currentPatient, currentUser?.uid);
        return res.success;
      }
      return true;
    } catch {
      return false;
    }
  };

  const updateCurrentPatient = (updater: (prev: Patient) => Patient) => {
    let savedTarget: Patient | null = null;
    let newPatientsList: Patient[] = [];

    setPatients((prev) => {
      const matchIdx = prev.findIndex(
        (p) =>
          p.id === currentPatient.id ||
          (currentUser?.uid && p.userId === currentUser.uid) ||
          (currentPatient.email && p.email?.toLowerCase() === currentPatient.email?.toLowerCase())
      );

      let updated: Patient[];
      if (matchIdx >= 0) {
        updated = [...prev];
        updated[matchIdx] = updater(updated[matchIdx]);
      } else {
        const newRecord = updater(currentPatient);
        updated = [newRecord, ...prev];
      }

      const target = updated.find(
        (p) =>
          p.id === currentPatient.id ||
          (currentUser?.uid && p.userId === currentUser.uid) ||
          (currentPatient.email && p.email?.toLowerCase() === currentPatient.email?.toLowerCase())
      );

      savedTarget = target || null;
      newPatientsList = updated;
      return updated;
    });

    if (savedTarget) {
      saveStoredPatients(newPatientsList);
      savePatientsToIDB(newPatientsList).catch(() => {});
      saveSinglePatientToIDB(savedTarget).catch(() => {});
      savePatientToServer(savedTarget, currentUser?.uid).catch(() => {});
      if (currentUser?.uid) {
        pushPatientToFirestore(savedTarget, currentUser.uid).catch((err) => {
          console.warn('[Firestore] Live update push note:', err);
        });
      }
    }
  };

  // Firebase Authentication
  const handleLogin = async (email: string, password = '') => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const lowerEmail = email.toLowerCase().trim();
      const userCred = await signInWithEmailAndPassword(auth, lowerEmail, password);
      setCurrentUser(userCred.user);
      setActiveEmail(lowerEmail);
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, lowerEmail);

      let targetPatient: Patient | null = null;
      let nextList: Patient[] = [];

      setPatients((prev) => {
        const matchIdx = prev.findIndex(
          (p) => (p.userId && p.userId === userCred.user.uid) || (p.email && p.email.toLowerCase() === lowerEmail)
        );
        if (matchIdx >= 0) {
          const copy = [...prev];
          copy[matchIdx] = { ...copy[matchIdx], userId: userCred.user.uid, email: lowerEmail };
          targetPatient = copy[matchIdx];
          nextList = copy;
          return copy;
        }

        const unassigned = prev.find((p) => !p.userId);
        if (unassigned) {
          const copy = prev.map((p) =>
            p.id === unassigned.id
              ? { ...unassigned, userId: userCred.user.uid, email: lowerEmail }
              : p
          );
          targetPatient = copy.find((p) => p.userId === userCred.user.uid) || null;
          nextList = copy;
          return copy;
        }
        nextList = prev;
        return prev;
      });

      if (nextList.length > 0) {
        saveStoredPatients(nextList);
        savePatientsToIDB(nextList).catch(() => {});
      }
      if (targetPatient) {
        pushPatientToFirestore(targetPatient, userCred.user.uid).catch(() => {});
      }

      setActiveTab('overview');
    } catch (err: any) {
      const formatted = formatFirebaseAuthError(err, 'login');
      setAuthError(formatted);
      throw new Error(formatted);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateAccount = async (name: string, email: string, password = '') => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const lowerEmail = email.toLowerCase().trim();
      const userCred = await createUserWithEmailAndPassword(auth, lowerEmail, password);
      setCurrentUser(userCred.user);
      setActiveEmail(lowerEmail);
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, lowerEmail);

      let targetPatient: Patient | null = null;
      let nextList: Patient[] = [];

      setPatients((prev) => {
        const matchIdx = prev.findIndex(
          (p) => (p.userId && p.userId === userCred.user.uid) || (p.email && p.email.toLowerCase() === lowerEmail)
        );
        if (matchIdx >= 0) {
          const copy = [...prev];
          copy[matchIdx] = {
            ...copy[matchIdx],
            userId: userCred.user.uid,
            name: name || copy[matchIdx].name,
            email: lowerEmail,
          };
          targetPatient = copy[matchIdx];
          nextList = copy;
          return copy;
        }

        const unassigned = prev.find((p) => !p.userId);
        if (unassigned) {
          const copy = prev.map((p) =>
            p.id === unassigned.id
              ? {
                  ...unassigned,
                  userId: userCred.user.uid,
                  name: name || unassigned.name,
                  email: lowerEmail,
                }
              : p
          );
          targetPatient = copy.find((p) => p.userId === userCred.user.uid) || null;
          nextList = copy;
          return copy;
        }

        const newPatient: Patient = {
          id: `SKP-${userCred.user.uid.substring(0, 8).toUpperCase()}`,
          userId: userCred.user.uid,
          name: name || lowerEmail.split('@')[0],
          email: lowerEmail,
          dob: '1995-05-15',
          gender: 'Female',
          phone: '+855 12 345 678',
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: '+855 98 765 432',
          },
          bloodType: 'O+',
          allergies: [
            { id: 'alg-init-1', name: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis' }
          ],
          vaccinations: [
            { id: 'vac-init-1', name: 'COVID-19 (Pfizer-BioNTech)', date: '2023-01-15', notes: 'Booster 2' }
          ],
          medicalRecords: [],
          illnessHistory: [],
          labResults: [],
          qrToken: `SKP-TOK-${userCred.user.uid.substring(0, 6).toUpperCase()}`,
          qrTokenCreatedAt: new Date().toISOString(),
        };

        const updated = [newPatient, ...prev];
        targetPatient = newPatient;
        nextList = updated;
        return updated;
      });

      if (nextList.length > 0) {
        saveStoredPatients(nextList);
        savePatientsToIDB(nextList).catch(() => {});
      }
      if (targetPatient) {
        savePatientToServer(targetPatient, userCred.user.uid).catch(() => {});
        pushPatientToFirestore(targetPatient, userCred.user.uid).catch((err) => {
          console.warn('[Firestore] Account creation push note:', err);
        });
      }

      setActiveTab('overview');
    } catch (err: any) {
      const formatted = formatFirebaseAuthError(err, 'signup');
      setAuthError(formatted);
      throw new Error(formatted);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setActiveEmail(null);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
  };

  // Health data mutation handlers
  const handleSaveBloodType = (newType: BloodType) => {
    updateCurrentPatient((p) => ({ ...p, bloodType: newType }));
  };

  const handleSaveAllergy = (allergy: Allergy) => {
    updateCurrentPatient((p) => {
      const exists = p.allergies.some((a) => a.id === allergy.id);
      if (exists) {
        return {
          ...p,
          allergies: p.allergies.map((a) => (a.id === allergy.id ? allergy : a)),
        };
      } else {
        return { ...p, allergies: [...p.allergies, allergy] };
      }
    });
  };

  const handleDeleteAllergy = (id: string) => {
    updateCurrentPatient((p) => ({
      ...p,
      allergies: p.allergies.filter((a) => a.id !== id),
    }));
  };

  const handleSaveVaccination = (vac: Vaccination) => {
    updateCurrentPatient((p) => {
      const exists = p.vaccinations.some((v) => v.id === vac.id);
      if (exists) {
        return {
          ...p,
          vaccinations: p.vaccinations.map((v) => (v.id === vac.id ? vac : v)),
        };
      } else {
        return { ...p, vaccinations: [...p.vaccinations, vac] };
      }
    });
  };

  const handleDeleteVaccination = (id: string) => {
    updateCurrentPatient((p) => ({
      ...p,
      vaccinations: p.vaccinations.filter((v) => v.id !== id),
    }));
  };

  const handleSaveMedicalRecord = (record: MedicalRecord) => {
    saveSingleRecordToIDB(currentPatient.id, record).catch(() => {});
    updateCurrentPatient((p) => ({
      ...p,
      medicalRecords: [record, ...p.medicalRecords],
    }));
  };

  const handleDeleteMedicalRecord = (id: string) => {
    updateCurrentPatient((p) => ({
      ...p,
      medicalRecords: p.medicalRecords.filter((r) => r.id !== id),
    }));
  };

  const handleUpdateProfile = (data: EditProfileFormData) => {
    updateCurrentPatient((p) => ({
      ...p,
      name: data.name,
      phone: data.phone,
      profilePicture: data.profilePicture || undefined,
      dob: data.dob || p.dob,
      gender: data.gender || p.gender,
      emergencyContact: data.emergencyContact || p.emergencyContact,
    }));
  };

  const handleRegenerateToken = () => {
    const newToken = `SKP-TOK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    updateCurrentPatient((p) => ({
      ...p,
      qrToken: newToken,
      qrTokenCreatedAt: new Date().toISOString(),
    }));
  };

  // 1. If Doctor View is active (via QR scan or button)
  if (isDoctorViewOpen) {
    const handleExitDoctor = () => {
      setIsDoctorViewOpen(false);
      if (window.history.pushState) {
        const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        window.history.pushState({ path: cleanUrl }, '', cleanUrl);
      }
    };

    return (
      <DoctorAdmitGate
        patient={currentPatient}
        onExit={handleExitDoctor}
      >
        <DoctorMedicalRecordView
          patient={currentPatient}
          onExit={handleExitDoctor}
        />
      </DoctorAdmitGate>
    );
  }

  // 2. If Printable Medical Summary PDF view is active
  if (isPdfViewOpen) {
    return (
      <MedicalSummaryPDF
        patient={currentPatient}
        onBack={() => setIsPdfViewOpen(false)}
        onOpenDoctorView={() => {
          setIsPdfViewOpen(false);
          setIsDoctorViewOpen(true);
        }}
      />
    );
  }

  // 3. If User is not logged in
  if (!activeEmail) {
    return (
      <AuthPage
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        availablePatients={patients}
        authError={authError}
        isLoading={isAuthLoading}
      />
    );
  }

  // 4. Main Patient Dashboard View
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans text-slate-800 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navbar */}
      <Navbar
        patient={currentPatient}
        activeTab={activeTab}
        recordsCount={currentPatient.medicalRecords?.length || 0}
        onSelectTab={setActiveTab}
        onOpenPdf={() => setIsPdfViewOpen(true)}
        onLogout={handleLogout}
        onOpenDoctorView={() => setIsDoctorViewOpen(true)}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Welcome Banner */}
            <WelcomeBanner
              patient={currentPatient}
              onOpenPdf={() => setIsPdfViewOpen(true)}
              onOpenQrTab={() => setActiveTab('qrcode')}
              onEditProfile={() => setEditProfileModalOpen(true)}
              onOpenNotifications={() => setNotificationsModalOpen(true)}
              onSyncData={handleSyncData}
            />

            {/* 4 Health Information Cards Layout matching presentation & screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blood Type Card */}
              <BloodTypeCard
                bloodType={currentPatient.bloodType}
                onEdit={() => setBloodTypeModalOpen(true)}
              />

              {/* Allergies Card */}
              <AllergiesCard
                allergies={currentPatient.allergies}
                onAdd={() => {
                  setAllergyToEdit(null);
                  setAllergyModalOpen(true);
                }}
                onEdit={(alg) => {
                  setAllergyToEdit(alg);
                  setAllergyModalOpen(true);
                }}
                onDelete={handleDeleteAllergy}
              />

              {/* Vaccinations Card */}
              <VaccinationsCard
                vaccinations={currentPatient.vaccinations}
                onAdd={() => {
                  setVaccineToEdit(null);
                  setVaccineModalOpen(true);
                }}
                onEdit={(vac) => {
                  setVaccineToEdit(vac);
                  setVaccineModalOpen(true);
                }}
                onDelete={handleDeleteVaccination}
              />

              {/* Quick Health Summary / ID Card */}
              <div 
                id="emergency-id-card"
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {t.emergencyIdBadge}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {t.activeStatus}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">{t.patientName}:</span>
                      <span className="font-bold text-slate-900 capitalize">{currentPatient.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">{t.bloodGroup}:</span>
                      <span className="font-bold text-rose-700">{currentPatient.bloodType}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">{t.emergencyContact}:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {currentPatient.emergencyContact.name 
                          ? `${currentPatient.emergencyContact.name} (${currentPatient.emergencyContact.phone})`
                          : 'Not provided'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">{t.digitalId}:</span>
                      <span className="font-mono text-slate-700 font-semibold">{currentPatient.id}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab('qrcode')}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors inline-flex items-center gap-1"
                  >
                    <span>{t.viewEmergencyQr}</span>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => setIsPdfViewOpen(true)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.exportSummary}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEDICAL RECORDS */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            <MedicalRecordsSection
              records={currentPatient.medicalRecords}
              onAddRecord={() => {
                setInitialUploadFile(null);
                setRecordModalOpen(true);
              }}
              onViewRecord={(record) => setViewerRecord(record)}
              onDeleteRecord={handleDeleteMedicalRecord}
              onDirectFileUpload={(file) => {
                setInitialUploadFile(file);
                setRecordModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 3: QR CODE */}
        {activeTab === 'qrcode' && (
          <div className="space-y-6">
            <QRCodeTab
              patient={currentPatient}
              onOpenDoctorView={() => setIsDoctorViewOpen(true)}
              onRegenerateToken={handleRegenerateToken}
              onOpenNotifications={() => setNotificationsModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/80 backdrop-blur-xs py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>{t.systemSecure}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHelpGuide(true)}
              className="hover:text-teal-800 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t.privacyAndGuide}</span>
            </button>
            <span>•</span>
            <span>{t.appName} v2.4</span>
          </div>
        </div>
      </footer>

      {/* Floating Emergency Doctor Preview Button (Bottom Right) */}
      <button
        id="floating-doctor-btn"
        onClick={() => setIsDoctorViewOpen(true)}
        className="fixed bottom-5 right-5 z-40 px-4 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition-transform hover:scale-105 border border-teal-700"
        title="Simulate scanning your QR code as a clinical doctor"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <span>{t.doctorPortalSimulation}</span>
      </button>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        patient={currentPatient}
        onSave={handleUpdateProfile}
      />

      {/* Blood Type Modal */}
      <BloodTypeModal
        isOpen={bloodTypeModalOpen}
        onClose={() => setBloodTypeModalOpen(false)}
        currentBloodType={currentPatient.bloodType}
        onSave={handleSaveBloodType}
      />

      {/* Allergy Modal */}
      <AllergyModal
        isOpen={allergyModalOpen}
        onClose={() => {
          setAllergyModalOpen(false);
          setAllergyToEdit(null);
        }}
        onSave={handleSaveAllergy}
        initialData={allergyToEdit}
      />

      {/* Vaccination Modal */}
      <VaccinationModal
        isOpen={vaccineModalOpen}
        onClose={() => {
          setVaccineModalOpen(false);
          setVaccineToEdit(null);
        }}
        onSave={handleSaveVaccination}
        initialData={vaccineToEdit}
      />

      {/* Add Medical Record Modal */}
      <AddMedicalRecordModal
        isOpen={recordModalOpen}
        onClose={() => {
          setRecordModalOpen(false);
          setInitialUploadFile(null);
        }}
        onSave={handleSaveMedicalRecord}
        initialFile={initialUploadFile}
      />

      {/* View Medical Record / Document Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewerRecord)}
        onClose={() => setViewerRecord(null)}
        record={viewerRecord}
        allowDownload={true}
      />

      {/* QR Scan Access Admission Notifications Modal */}
      <AccessRequestsNotificationModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        patient={currentPatient}
        onUpdatePatient={(updatedPatient) => {
          updateCurrentPatient(() => updatedPatient);
        }}
      />

      {/* Real-time One-Scan Instant Notification Banner / Alert */}
      {activeScanAlert && !isDoctorViewOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-md w-[calc(100%-2rem)] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white border-2 border-teal-500 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center animate-pulse">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                      QR Code Scanned
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white">
                    {activeScanAlert.requesterName}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveScanAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>{activeScanAlert.requesterRole}</strong> from <em>{activeScanAlert.requesterLocation}</em> scanned your medical QR code and requested permission to view your medical records.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickDecision('allowed')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Allow Immediately</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDecision('not_allowed')}
                className="inline-flex items-center justify-center gap-1 py-2.5 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Deny</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveScanAlert(null);
                  setNotificationsModalOpen(true);
                }}
                className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 underline transition-colors cursor-pointer"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Privacy Guide Modal */}
      {showHelpGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{t.securityGuideTitle}</h3>
                <span className="text-xs text-teal-700 font-semibold">{t.securityGuideSubtitle}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p>
                <strong>{t.qrSecurityHeader}</strong> {t.qrSecurityDesc}
              </p>
              <p>
                <strong>{t.revocationHeader}</strong> {t.revocationDesc}
              </p>
              <p>
                <strong>{t.authIntegrationHeader || 'Account Authentication'}:</strong> Secure login with local credential verification and durable offline storage.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHelpGuide(false)}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
}

export default App;

