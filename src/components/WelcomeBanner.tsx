import React from 'react';
import { ShieldCheck, FileText, QrCode, UserPen, Phone, Calendar } from 'lucide-react';
import { Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface WelcomeBannerProps {
  patient: Patient;
  onOpenPdf: () => void;
  onOpenQrTab: () => void;
  onEditProfile: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  patient,
  onOpenPdf,
  onOpenQrTab,
  onEditProfile,
}) => {
  const { t } = useLanguage();
  const initial = patient.name ? patient.name.charAt(0).toUpperCase() : 'P';

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

            {/* Secondary Patient Metadata (Phone, ID, Secure Storage) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-xs font-medium text-white border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-200" />
                <span>{t.secureStorageNote}</span>
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-teal-800 hover:bg-teal-50 text-sm font-semibold rounded-xl shadow-xs hover:shadow transition-all group"
          >
            <FileText className="w-4 h-4 text-teal-600 group-hover:scale-105 transition-transform" />
            <span>{t.generateMedicalPdf}</span>
          </button>

          <button
            id="banner-view-qr-btn"
            onClick={onOpenQrTab}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-xl border border-white/30 backdrop-blur-xs transition-all"
          >
            <QrCode className="w-4 h-4 text-teal-100" />
            <span>{t.showQrCode}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
