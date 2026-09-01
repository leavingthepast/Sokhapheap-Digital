import React, { useState, useEffect, useMemo } from 'react';
import { 
  getStoredPatients, 
  saveStoredPatients, 
  STORAGE_KEY_ACTIVE_USER,
  INITIAL_PATIENTS 
} from './data/initialData';
import { Patient, BloodType, Allergy, Vaccination, MedicalRecord } from './types';
import { parseCompactPatientPayload } from './utils/qrPayload';
import { fetchPatientFromServer, savePatientToServer, syncPatientsWithServer } from './utils/patientSync';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  User as FirebaseUser
} from './firebase';
import { Navbar } from './components/Navbar';
import { WelcomeBanner } from './components/WelcomeBanner';
import { BloodTypeCard } from './components/BloodTypeCard';
import { AllergiesCard } from './components/AllergiesCard';
import { VaccinationsCard } from './components/VaccinationsCard';
import { MedicalRecordsSection } from './components/MedicalRecordsSection';
import { MedicalSummaryPDF } from './components/MedicalSummaryPDF';
import { DoctorMedicalRecordView } from './components/DoctorMedicalRecordView';
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
import { HelpCircle, CheckCircle, FileText } from 'lucide-react';

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
    const searchParams = new URLSearchParams(window.location.search);
    let hash = window.location.hash || '';
    if (hash.startsWith('#')) hash = hash.substring(1);
    const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : hash);

    const view = searchParams.get('view') || hashParams.get('view');
    const token = searchParams.get('token') || hashParams.get('token');
    const patientId = searchParams.get('id') || hashParams.get('id');
    const pdata = searchParams.get('pdata') || hashParams.get('pdata') || searchParams.get('payload');

    let scannedPatient: Patient | null = null;
    if (pdata) {
      scannedPatient = parseCompactPatientPayload(pdata);
    }

    const isDoctorView = 
      view === 'doctor_portal' || 
      Boolean(token) || 
      Boolean(patientId) || 
      Boolean(scannedPatient) || 
      window.location.hash.includes('doctor_portal');

    return {
      isDoctorView,
      targetPatientId: patientId || undefined,
      targetToken: token || undefined,
      scannedPatient
    };
  } catch (e) {
    console.error('Error parsing URL context', e);
    return { isDoctorView: false };
  }
}

function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
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
    return localStorage.getItem(STORAGE_KEY_ACTIVE_USER) || null;
  });

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
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

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // Only auto-login if email is verified (e.g. Google auth or verified email)
      if (user && user.email && user.emailVerified) {
        const email = user.email.toLowerCase();
        setActiveEmail(email);
        localStorage.setItem(STORAGE_KEY_ACTIVE_USER, email);

        // Ensure patient record exists
        setPatients((prev) => {
          const existing = prev.find((p) => p.email.toLowerCase() === email);
          if (existing) {
            if (user.displayName && (!existing.name || existing.name === 'Patient')) {
              return prev.map((p) => p.email.toLowerCase() === email ? { ...p, name: user.displayName! } : p);
            }
            return prev;
          }

          const newPatient: Patient = {
            id: `SKP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            name: user.displayName || email.split('@')[0] || 'Patient',
            email: email,
            dob: '',
            gender: 'Female',
            phone: user.phoneNumber || '',
            profilePicture: user.photoURL || undefined,
            emergencyContact: {
              name: '',
              relationship: '',
              phone: '',
            },
            bloodType: 'Unknown',
            allergies: [],
            vaccinations: [],
            medicalRecords: [],
            illnessHistory: [],
            labResults: [],
            qrToken: `SKP-TOK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            qrTokenCreatedAt: new Date().toISOString(),
          };
          return [newPatient, ...prev];
        });
      } else if (!user) {
        // Logged out
      }
    });

    return () => unsubscribe();
  }, []);

  // Check URL parameters for QR scan routing (handles popstate and hashchange)
  useEffect(() => {
    const checkUrlParams = async () => {
      const ctx = parseUrlScanContext();
      if (ctx.isDoctorView) {
        if (ctx.scannedPatient) {
          setPatients(prev => {
            const idx = prev.findIndex(p => p.id === ctx.scannedPatient!.id);
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
              setPatients(prev => {
                const idx = prev.findIndex(p => p.id === freshPatient.id);
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
                p => (ctx.targetPatientId && p.id === ctx.targetPatientId) ||
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

  // Initial sync with backend server on load
  useEffect(() => {
    let isMounted = true;
    syncPatientsWithServer(patients).then((synced) => {
      if (isMounted && Array.isArray(synced) && synced.length > 0) {
        setPatients(synced);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Save patients whenever they change (to local storage and server)
  useEffect(() => {
    saveStoredPatients(patients);
    if (patients.length > 0) {
      // Sync in background
      syncPatientsWithServer(patients).catch(() => {});
    }
  }, [patients]);

  const currentPatient = patients.find((p) => p.email === activeEmail) || patients[0] || INITIAL_PATIENTS[0];

  const updateCurrentPatient = (updater: (prev: Patient) => Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === currentPatient.id ? updater(p) : p))
    );
  };

  // Auth actions with Firebase Authentication
  const handleLogin = async (email: string, password = 'password123') => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      let userCred;
      try {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      } catch (loginErr: any) {
        // If demo/test account does not exist on Firebase Auth yet, auto-create it smoothly
        if (
          loginErr?.code === 'auth/user-not-found' ||
          loginErr?.code === 'auth/invalid-credential' ||
          loginErr?.code === 'auth/invalid-login-credentials'
        ) {
          try {
            userCred = await createUserWithEmailAndPassword(auth, email, password);
          } catch (createErr) {
            throw loginErr;
          }
        } else {
          throw loginErr;
        }
      }

      // If email is not verified, block login and show verification screen
      if (userCred && userCred.user) {
        const isDemo = email.toLowerCase() === 'patient@sokhapheap.kh';
        if (!userCred.user.emailVerified && !isDemo) {
          await signOut(auth);
          setActiveEmail(null);
          localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
          return { unverified: true, email: userCred.user.email?.toLowerCase() || email.toLowerCase() };
        }
      }

      setActiveEmail(email.toLowerCase());
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, email.toLowerCase());
      setActiveTab('overview');
    } catch (err: any) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted);
      throw new Error(formatted);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateAccount = async (name: string, email: string, password = 'password123') => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (name && res.user) {
        await updateProfile(res.user, { displayName: name });
      }

      // Send verification email
      if (res.user) {
        await sendEmailVerification(res.user);
      }

      // Don't auto-login after Sign Up
      await signOut(auth);
      setActiveEmail(null);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);

      const newPatient: Patient = {
        id: `SKP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        email: email.toLowerCase(),
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
        medicalRecords: [],
        illnessHistory: [],
        labResults: [],
        qrToken: `SKP-TOK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        qrTokenCreatedAt: new Date().toISOString(),
      };

      setPatients((prev) => [newPatient, ...prev]);
      
      // Return unverified flag to show verification screen
      return { unverified: true, email: email.toLowerCase() };
    } catch (err: any) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted);
      throw new Error(formatted);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResendVerification = async (email: string, password = 'password123') => {
    setAuthError(null);
    try {
      if (auth.currentUser && auth.currentUser.email?.toLowerCase() === email.toLowerCase()) {
        await sendEmailVerification(auth.currentUser);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (cred.user) {
          await sendEmailVerification(cred.user);
        }
        await signOut(auth);
      }
    } catch (err: any) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted);
      throw new Error(formatted);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      if (user && user.email) {
        const email = user.email.toLowerCase();
        setActiveEmail(email);
        localStorage.setItem(STORAGE_KEY_ACTIVE_USER, email);

        setPatients((prev) => {
          const existing = prev.find((p) => p.email.toLowerCase() === email);
          if (existing) {
            return prev.map((p) =>
              p.email.toLowerCase() === email
                ? {
                    ...p,
                    name: user.displayName || p.name,
                    profilePicture: user.photoURL || p.profilePicture,
                  }
                : p
            );
          }

          const newPatient: Patient = {
            id: `SKP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            name: user.displayName || email.split('@')[0],
            email,
            dob: '',
            gender: 'Female',
            phone: user.phoneNumber || '',
            profilePicture: user.photoURL || undefined,
            emergencyContact: {
              name: '',
              relationship: '',
              phone: '',
            },
            bloodType: 'Unknown',
            allergies: [],
            vaccinations: [],
            medicalRecords: [],
            illnessHistory: [],
            labResults: [],
            qrToken: `SKP-TOK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            qrTokenCreatedAt: new Date().toISOString(),
          };
          return [newPatient, ...prev];
        });
        setActiveTab('overview');
      }
    } catch (err: any) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted);
      throw new Error(formatted);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out', e);
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
      profilePicture: data.profilePicture !== undefined ? data.profilePicture : p.profilePicture,
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
    return (
      <DoctorMedicalRecordView
        patient={currentPatient}
        onExit={() => {
          setIsDoctorViewOpen(false);
          if (window.history.pushState) {
            const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
            window.history.pushState({ path: cleanUrl }, '', cleanUrl);
          }
        }}
      />
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
        onResendVerification={handleResendVerification}
        onGoogleSignIn={handleGoogleSignIn}
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
        onSelectTab={setActiveTab}
        onOpenPdf={() => setIsPdfViewOpen(true)}
        onLogout={handleLogout}
        onOpenDoctorView={() => setIsDoctorViewOpen(true)}
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
      />

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
                <strong>{t.authIntegrationHeader || 'Firebase Auth Protected'}:</strong> Secure login with Firebase Authentication (Email/Password & Google Sign-in).
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

