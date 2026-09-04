import React, { useState, useEffect } from 'react';
import { Patient, QrAccessStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { DoctorMedicalRecordView } from './DoctorMedicalRecordView';
import {
  submitQrAccessRequest,
  checkQrAccessStatus,
  subscribeToAccessDecision,
  getSavedRequestIdForPatient,
} from '../utils/qrAccessManager';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowLeft,
  Clock,
  RefreshCw,
  User,
  Building,
  CheckCircle2,
  XCircle,
  Stethoscope,
} from 'lucide-react';

interface DoctorAdmitGateProps {
  patient: Patient;
  onAdmitted?: () => void;
  onExit: () => void;
  children?: React.ReactNode;
}

export const DoctorAdmitGate: React.FC<DoctorAdmitGateProps> = ({
  patient,
  onAdmitted,
  onExit,
  children,
}) => {
  const { t } = useLanguage();
  const [requesterName, setRequesterName] = useState('Dr. Sothea / Emergency Physician');
  const [requesterRole, setRequesterRole] = useState('Attending Clinical Doctor');
  const [requesterLocation, setRequesterLocation] = useState('Emergency Department');
  const [requestStatus, setRequestStatus] = useState<'initial' | 'pending' | 'allowed' | 'not_allowed'>('initial');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Initial check on mount: strictly verify if THIS session has a specific saved request ID that was allowed
  useEffect(() => {
    let isMounted = true;

    const initCheck = async () => {
      const savedReqId = getSavedRequestIdForPatient(patient.id);
      if (savedReqId) {
        if (isMounted) setActiveRequestId(savedReqId);
        const serverStatus = await checkQrAccessStatus({
          patientId: patient.id,
          requestId: savedReqId,
          qrToken: patient.qrToken,
        });

        if (isMounted) {
          if (serverStatus === 'allowed') {
            setRequestStatus('allowed');
            onAdmitted?.();
          } else if (serverStatus === 'pending') {
            setRequestStatus('pending');
          } else if (serverStatus === 'not_allowed') {
            setRequestStatus('not_allowed');
          }
        }
      }
    };

    initCheck();

    return () => {
      isMounted = false;
    };
  }, [patient.id, patient.qrToken, onAdmitted]);

  // Subscribe to real-time decisions via SSE, BroadcastChannel, and fast polling
  useEffect(() => {
    if (requestStatus !== 'pending' || !activeRequestId) return;

    const unsubscribe = subscribeToAccessDecision(
      patient.id,
      activeRequestId,
      (newStatus: QrAccessStatus) => {
        if (newStatus === 'allowed') {
          // Zero delay! Immediately reveal Doctor Portal
          setRequestStatus('allowed');
          onAdmitted?.();
        } else if (newStatus === 'not_allowed') {
          setRequestStatus('not_allowed');
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [patient.id, activeRequestId, requestStatus, onAdmitted]);

  const handleSubmitRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await submitQrAccessRequest({
        patientId: patient.id,
        qrToken: patient.qrToken,
        requesterName: requesterName.trim() || 'Attending Physician',
        requesterRole: requesterRole.trim() || 'Clinical Doctor',
        requesterLocation: requesterLocation.trim() || 'Emergency Care',
      });

      setActiveRequestId(created.id);
      setRequestStatus('pending');
    } catch (err) {
      console.error('Failed to submit access request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCheck = async () => {
    if (!activeRequestId) return;
    setIsChecking(true);
    try {
      const status = await checkQrAccessStatus({
        patientId: patient.id,
        requestId: activeRequestId,
        qrToken: patient.qrToken,
      });

      if (status === 'allowed') {
        setRequestStatus('allowed');
        onAdmitted?.();
      } else if (status === 'not_allowed') {
        setRequestStatus('not_allowed');
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsChecking(false), 400);
    }
  };

  // Immediate full doctor portal reveal once allowed! No waiting, no loading delay.
  if (requestStatus === 'allowed') {
    return (
      <>
        {children || <DoctorMedicalRecordView patient={patient} onExit={onExit} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none rounded-full blur-3xl" />
      <div className="absolute -bottom-24 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top back/exit bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 z-10">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToDashboard}</span>
        </button>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-400 bg-teal-950/80 border border-teal-800/60 px-3 py-1 rounded-full shadow-xs">
          <Shield className="w-3.5 h-3.5 text-teal-400" />
          <span>Sokhapheap Digital • QR Admission Gate</span>
        </span>
      </div>

      {/* Main Gate Card */}
      <div className="w-full max-w-xl bg-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl p-6 sm:p-8 z-10">
        {/* Patient Identity Header Banner */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-700/80">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center text-white text-xl font-black shadow-lg">
            {patient.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                {patient.name}
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                {patient.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Token: <span className="font-mono text-teal-400">{patient.qrToken}</span> • {patient.gender}
            </p>
          </div>
        </div>

        {/* State 1: Allowed (Auto-transitioning) */}
        {requestStatus === 'allowed' && (
          <div className="py-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {t.accessAllowedSuccess}
            </h2>
            <p className="text-sm text-slate-300 max-w-md">
              The patient has admitted your device. Opening medical records now...
            </p>
          </div>
        )}

        {/* State 2: Request Pending (Waiting for Patient to press Allow) */}
        {requestStatus === 'pending' && (
          <div className="py-6 flex flex-col items-center text-center">
            {/* Pulsing Radar Ring */}
            <div className="relative w-20 h-20 flex items-center justify-center mb-5">
              <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping opacity-60" />
              <div className="absolute inset-2 rounded-full bg-teal-500/30 animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-white shadow-lg">
                <Clock className="w-7 h-7 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{t.waitingPatientAllow}</span>
            </span>

            <h2 className="text-xl font-bold text-white mb-2">
              Access Request Sent
            </h2>

            <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
              {t.requestSentNotice}
            </p>

            {/* Requester Summary Badge */}
            <div className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 text-left mb-6 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Requester:</span>
                <span className="font-semibold text-white">{requesterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="text-white">{requesterRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Request ID:</span>
                <span className="font-mono text-teal-400 text-[11px]">{activeRequestId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-amber-400">Pending Patient Approval</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                id="btn-check-access-status"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="flex-1 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Checking...' : t.checkStatus}</span>
              </button>
              <button
                type="button"
                onClick={() => setRequestStatus('initial')}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Change Details
              </button>
            </div>
          </div>
        )}

        {/* State 3: Not Allowed / Declined */}
        {requestStatus === 'not_allowed' && (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-4">
              <XCircle className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-rose-400 mb-2">
              {t.notAllowed}
            </h2>
            <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
              {t.accessDeniedNotice}
            </p>
            <button
              type="button"
              onClick={() => setRequestStatus('initial')}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
            >
              Submit New Request
            </button>
          </div>
        )}

        {/* State 4: Initial Gate Form (Request to see information) */}
        {requestStatus === 'initial' && (
          <div className="py-4">
            <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-5">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-300 mb-0.5">
                  {t.admitPendingTitle}
                </p>
                <p className="text-slate-300 leading-relaxed">
                  {t.admitPendingDesc}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.requesterNameLabel}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="e.g. Dr. Sothea / Emergency Physician"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.requesterRoleLabel}
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={requesterRole}
                      onChange={(e) => setRequesterRole(e.target.value)}
                      placeholder="e.g. Clinical Doctor"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Clinic / Facility
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={requesterLocation}
                      onChange={(e) => setRequesterLocation(e.target.value)}
                      placeholder="e.g. Emergency Department"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* View-Only Reminder Notice */}
              <div className="flex items-center gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  {t.viewOnlyNotice}: You will be able to inspect all clinical data and view records, but document downloading is restricted.
                </span>
              </div>

              {/* The "Request to see information" Button */}
              <button
                type="submit"
                id="btn-request-to-see-info"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-base shadow-lg shadow-teal-900/40 transition-all cursor-pointer disabled:opacity-60"
              >
                <ShieldAlert className="w-5 h-5 text-teal-100" />
                <span>{isSubmitting ? 'Sending Request...' : t.requestToSeeInfo}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
