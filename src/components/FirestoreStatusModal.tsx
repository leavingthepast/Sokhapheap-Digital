import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  Database, 
  RefreshCw, 
  CloudCheck, 
  KeyRound
} from 'lucide-react';
import { auth } from '../firebase';
import { pushPatientToFirestore } from '../utils/firestoreService';
import { Patient } from '../types';

interface FirestoreStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSyncSuccess?: () => void;
}

const RECOMMENDED_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile access
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Patient medical records:
    // - Authenticated users can create and manage their records
    // - QR code scans and emergency access can read
    match /patients/{patientId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;

export const FirestoreStatusModal: React.FC<FirestoreStatusModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSyncSuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');

  if (!isOpen) return null;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(RECOMMENDED_RULES);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRetrySync = async () => {
    setIsRetrying(true);
    setStatusMessage(null);
    try {
      const res = await pushPatientToFirestore(patient, auth.currentUser?.uid);
      if (res.success) {
        setStatusType('success');
        setStatusMessage('Successfully connected and written to Cloud Firestore! Refresh the Firebase Console to view your records.');
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setStatusType('error');
        if (res.code === 'permission-denied') {
          setStatusMessage('Permission Denied: Your Firebase Rules in the Console are still blocking writes. Please paste the rules below into the Rules tab and click "Publish".');
        } else {
          setStatusMessage(res.error || 'Sync failed. Please check your internet connection and Firebase rules.');
        }
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err.message || 'Sync error occurred.');
    } finally {
      setIsRetrying(false);
    }
  };

  const currentUserEmail = auth.currentUser?.email || patient.email || 'Not signed in';
  const currentUid = auth.currentUser?.uid || patient.userId || 'None';

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
              <h2 className="text-lg font-bold text-slate-900">Cloud Firestore Connection & Rules</h2>
              <p className="text-xs text-slate-500">Project: <span className="font-mono font-semibold text-slate-700">sokhapheap-digital</span> • Database: <span className="font-mono font-semibold text-slate-700">(default)</span></p>
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
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
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
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Signed In User</span>
                <span className="font-semibold text-slate-800 truncate block max-w-[200px]">{currentUserEmail}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Auth UID</span>
                <span className="font-mono text-slate-700 truncate block max-w-[200px]">{currentUid}</span>
              </div>
            </div>
          </div>

          {/* Actionable Steps for Firebase Console */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Why is Cloud Firestore empty?</span>
              </h3>
              <a
                href="https://console.firebase.google.com/project/sokhapheap-digital/firestore/databases/-default-/rules"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-semibold hover:underline"
              >
                <span>Open Rules in Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              When a Firestore database is created in the Firebase Console, Google Cloud defaults the security rules to <strong>deny all writes</strong> (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">allow read, write: if false;</code>).
              To permit your patient records to save into Firestore:
            </p>

            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100/80">
              <li>In your open Firebase Console tab, click the <strong>Rules</strong> tab (next to Data).</li>
              <li>Replace the content with the recommended rules below.</li>
              <li>Click the blue <strong>Publish</strong> button at the top right of the Rules tab.</li>
              <li>Click <strong>Test & Push to Firestore Now</strong> below to immediately write your records!</li>
            </ol>
          </div>

          {/* Rules Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Firebase Firestore Rules:</span>
              <button
                type="button"
                onClick={handleCopyRules}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied to clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Rules</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-teal-200 font-mono text-xs rounded-2xl overflow-x-auto leading-relaxed border border-slate-800">
              {RECOMMENDED_RULES}
            </pre>
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
                <span>Writing to Cloud Firestore...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test & Push to Firestore Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
