import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ExternalLink, 
  Database, 
  RefreshCw, 
  CloudCheck, 
  KeyRound,
  HardDrive,
  ShieldCheck
} from 'lucide-react';
import { Patient } from '../types';
import { pushPatientToFirestore } from '../utils/firestoreService';
import { SUPABASE_URL } from '../supabaseClient';

interface FirestoreStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSyncSuccess?: () => void;
}

export const FirestoreStatusModal: React.FC<FirestoreStatusModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSyncSuccess,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');

  if (!isOpen) return null;

  const handleRetrySync = async () => {
    setIsRetrying(true);
    setStatusMessage(null);
    try {
      const res = await pushPatientToFirestore(patient, patient.userId);
      if (res.success) {
        setStatusType('success');
        setStatusMessage('Patient records and documents are synchronized with local storage, server database, and Supabase Storage.');
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setStatusType('error');
        setStatusMessage('Sync encountered an issue. Records remain protected locally in IndexedDB.');
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err.message || 'Sync error occurred.');
    } finally {
      setIsRetrying(false);
    }
  };

  const currentUserEmail = patient.email || 'Not signed in';
  const currentUid = patient.userId || 'Local user';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cloud & Storage Synchronization</h2>
              <p className="text-xs text-slate-500">Supabase Storage: <span className="font-mono font-semibold text-slate-700">app.files</span></p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Message if tested */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
              statusType === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              {statusType === 'success' ? (
                <CloudCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                {statusMessage}
              </div>
            </div>
          )}

          {/* Account Status Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Signed In Patient</span>
                <span className="font-semibold text-slate-800 truncate block max-w-[200px]">{currentUserEmail}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">User ID</span>
                <span className="font-mono text-slate-700 truncate block max-w-[200px]">{currentUid}</span>
              </div>
            </div>
          </div>

          {/* Connected Services */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Connected Cloud & Storage Services</h3>
            
            <div className="space-y-2">
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-teal-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Supabase Storage</div>
                    <div className="text-[11px] text-slate-500 font-mono">Bucket: app.files (or app-files)</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-teal-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Supabase Database & Auth</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-[260px]">{SUPABASE_URL}</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Connected
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Offline IndexedDB Storage</div>
                    <div className="text-[11px] text-slate-500">Persistent browser database for zero data loss</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleRetrySync}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test Sync Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
