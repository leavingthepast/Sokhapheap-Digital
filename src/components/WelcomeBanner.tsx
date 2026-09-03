import React, { useState } from 'react';
import { ShieldCheck, FileText, QrCode, UserPen, Phone, Cloud, CloudCheck, RefreshCw } from 'lucide-react';
import { Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';

import { FirestoreStatusModal } from './FirestoreStatusModal';

interface WelcomeBannerProps {
  patient: Patient;
  onOpenPdf: () => void;
  onOpenQrTab: () => void;
  onEditProfile: () => void;
  onSyncData?: () => Promise<boolean | { success: boolean; error?: string; code?: string }>;
  onPushToFirestore?: () => Promise<boolean | { success: boolean; error?: string; code?: string }>;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  patient,
  onOpenPdf,
  onOpenQrTab,
  onEditProfile,
  onSyncData,
  onPushToFirestore,
}) => {
  const { t } = useLanguage();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const initial = patient.name ? patient.name.charAt(0).toUpperCase() : 'P';

  const syncHandler = onSyncData || onPushToFirestore;

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!syncHandler || isSyncing) return;
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const res = await syncHandler();
      const ok = typeof res === 'boolean' ? res : res.success;
      if (ok) {
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3500);
      } else {
        // Open diagnostic modal if sync could not complete (e.g. permission-denied rules in console)
        setIsModalOpen(true);
      }
    } catch {
      setIsModalOpen(true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div 
      id="patient-welcome-banner"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#009b77] to-[#00ab84] text-white p-6 sm:p-8 shadow-sm transition-all"
    >
      {/* Decorative background shape */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-24 top-0 w-32 h-32 bg-teal-300/20 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Patient Profile Picture Avatar */}
          <div 
            onClick={onEditProfile}
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border-2 border-white/40 overflow-hidden shadow-md shrink-0 cursor-pointer hover:border-white transition-all group flex items-center justify-center"
            title={t.editYourProfile || "Edit your profile"}
          >
            {patient.profilePicture ? (
              <img
                src={patient.profilePicture}
                alt={patient.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-white select-none">
                {initial}
              </span>
            )}
            <div className="absolute inset-0 bg-teal-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <UserPen className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-teal-100/90 text-xs sm:text-sm font-medium tracking-wide">
              {t.welcomeBack}
            </p>

            {/* Patient Name and "Edit your profile" button right next to it */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white capitalize">
                {patient.name}
              </h1>

              <button
                id="edit-profile-banner-btn"
                type="button"
                onClick={onEditProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-full border border-white/40 backdrop-blur-xs transition-all shadow-2xs hover:scale-102 cursor-pointer active:scale-98"
                title="Edit your personal details, profile picture, and phone number"
              >
                <UserPen className="w-3.5 h-3.5" />
                <span>{t.editYourProfile || 'Edit your profile'}</span>
              </button>
            </div>

            {/* Secondary Patient Metadata (Phone, ID, Firestore Sync Status) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1.5">
              <div className="flex items-center gap-1.5">
                <div 
                  id="welcome-banner-firestore-sync-pill"
                  onClick={handleManualSync}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-xs cursor-pointer transition-all ${
                    syncSuccess 
                      ? 'bg-emerald-500/30 border-emerald-300 text-emerald-100' 
                      : 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
                  }`}
                  title="Click to sync latest data with Cloud Firestore"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 text-teal-200 animate-spin" />
                  ) : syncSuccess ? (
                    <CloudCheck className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-teal-200" />
                  )}
                  <span>
                    {isSyncing 
                      ? (t.syncingFirestore || 'Syncing...') 
                      : syncSuccess 
                      ? (t.firestoreSyncSuccess || 'Firestore Synced!') 
                      : (t.firestoreSynced || 'Firestore Synced')}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>

                <button
                  type="button"
                  id="open-firestore-status-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white transition-colors cursor-pointer text-xs"
                  title="View Cloud Firestore Status & Security Rules"
                >
                  <span className="sr-only">Firestore Settings</span>
                  <Cloud className="w-3.5 h-3.5" />
                </button>
              </div>

              {patient.phone && (
                <div className="inline-flex items-center gap-1 text-xs text-teal-100 font-mono">
                  <Phone className="w-3 h-3 text-teal-200" />
                  <span>{patient.phone}</span>
                </div>
              )}

              <div className="text-xs text-teal-100/90 font-mono">
                {t.patientId}: <span className="font-semibold text-white">{patient.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-2 md:pt-0 shrink-0">
          <button
            id="banner-generate-pdf-btn"
            onClick={onOpenPdf}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-teal-800 hover:bg-teal-50 text-sm font-semibold rounded-xl shadow-xs hover:shadow transition-all group cursor-pointer"
          >
            <FileText className="w-4 h-4 text-teal-600 group-hover:scale-105 transition-transform" />
            <span>{t.generateMedicalPdf}</span>
          </button>

          <button
            id="banner-view-qr-btn"
            onClick={onOpenQrTab}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-xl border border-white/30 backdrop-blur-xs transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-teal-100" />
            <span>{t.showQrCode}</span>
          </button>
        </div>
      </div>

      {/* Cloud Firestore Diagnostic & Rules Modal */}
      <FirestoreStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={patient}
        onSyncSuccess={() => {
          setSyncSuccess(true);
          setTimeout(() => setSyncSuccess(false), 3500);
        }}
      />
    </div>
  );
};
