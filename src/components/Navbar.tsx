import React from 'react';
import { FileText, QrCode, LogOut, Printer, ShieldCheck } from 'lucide-react';
import { Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavbarProps {
  patient: Patient;
  activeTab: 'overview' | 'records' | 'qrcode';
  onSelectTab: (tab: 'overview' | 'records' | 'qrcode') => void;
  onOpenPdf: () => void;
  onLogout: () => void;
  onOpenDoctorView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  patient,
  activeTab,
  onSelectTab,
  onOpenPdf,
  onLogout,
  onOpenDoctorView,
}) => {
  const { t } = useLanguage();
  const initial = patient.name ? patient.name.charAt(0).toUpperCase() : 'P';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-100 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div 
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-3 cursor-pointer group select-none"
            id="brand-logo-btn"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                {t.appName}
              </span>
              <span className="hidden sm:block text-[11px] text-teal-700 font-medium tracking-wide">
                {t.appSubtitle}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-xl border border-slate-200/60">
            <button
              id="nav-overview-btn"
              onClick={() => onSelectTab('overview')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-teal-50 text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {t.overview}
            </button>
            <button
              id="nav-records-btn"
              onClick={() => onSelectTab('records')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'records'
                  ? 'bg-teal-50 text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {t.medicalRecords}
            </button>
            <button
              id="nav-qrcode-btn"
              onClick={() => onSelectTab('qrcode')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'qrcode'
                  ? 'bg-teal-50 text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>{t.qrCode}</span>
            </button>
          </nav>

          {/* Right Action & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            <button
              id="nav-pdf-summary-btn"
              onClick={onOpenPdf}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200/70 transition-colors"
              title="Generate Printable A4 Summary PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printMedicalPdf}</span>
            </button>

            <button
              id="nav-doctor-preview-btn"
              onClick={onOpenDoctorView}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="Test what a doctor sees when scanning your QR code"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>{t.doctorPortal}</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2">
              <div 
                className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm border border-teal-200 shadow-2xs select-none overflow-hidden"
                title={`Patient: ${patient.name}`}
              >
                {patient.profilePicture ? (
                  <img src={patient.profilePicture} alt={patient.name} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <button
                id="logout-btn"
                onClick={onLogout}
                className="text-sm font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">{t.logOut}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100">
          <button
            onClick={() => onSelectTab('overview')}
            className={`flex-1 py-1.5 text-xs font-semibold text-center rounded-md ${
              activeTab === 'overview' ? 'text-teal-700 bg-teal-50' : 'text-slate-600'
            }`}
          >
            {t.overview}
          </button>
          <button
            onClick={() => onSelectTab('records')}
            className={`flex-1 py-1.5 text-xs font-semibold text-center rounded-md ${
              activeTab === 'records' ? 'text-teal-700 bg-teal-50' : 'text-slate-600'
            }`}
          >
            {t.medicalRecords}
          </button>
          <button
            onClick={() => onSelectTab('qrcode')}
            className={`flex-1 py-1.5 text-xs font-semibold text-center rounded-md ${
              activeTab === 'qrcode' ? 'text-teal-700 bg-teal-50' : 'text-slate-600'
            }`}
          >
            {t.qrCode}
          </button>
        </div>
      </div>
    </header>
  );
};
