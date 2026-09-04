import React from 'react';
import { FileText, QrCode, LogOut, Printer, ShieldCheck, Bell } from 'lucide-react';
import { Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavbarProps {
  patient: Patient;
  activeTab: 'overview' | 'records' | 'qrcode';
  recordsCount?: number;
  onSelectTab: (tab: 'overview' | 'records' | 'qrcode') => void;
  onOpenPdf: () => void;
  onLogout: () => void;
  onOpenDoctorView: () => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  patient,
  activeTab,
  recordsCount,
  onSelectTab,
  onOpenPdf,
  onLogout,
  onOpenDoctorView,
  onOpenNotifications,
}) => {
  const { t } = useLanguage();
  const initial = patient.name ? patient.name.charAt(0).toUpperCase() : 'P';
  const pendingCount = (patient.accessRequests || []).filter(
    (r) => r.status === 'pending'
  ).length;

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
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-1.5 ${
                activeTab === 'records'
                  ? 'bg-teal-50 text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{t.medicalRecords}</span>
              {recordsCount !== undefined && recordsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                  activeTab === 'records' ? 'bg-teal-100 text-teal-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {recordsCount}
                </span>
              )}
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

            {onOpenNotifications && (
              <button
                id="nav-notifications-tab-btn"
                onClick={onOpenNotifications}
                className="relative px-3 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Scan Access Notifications"
              >
                <Bell className="w-4 h-4 text-teal-700" />
                <span className="hidden xl:inline">{t.accessNotifications || 'Access'}</span>
                {pendingCount > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Right Action & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notification Bell in Action Bar */}
            {onOpenNotifications && (
              <button
                id="nav-notifications-btn"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-slate-600 hover:text-teal-800 hover:bg-teal-50 transition-colors border border-transparent hover:border-teal-200 cursor-pointer"
                title="View QR Scan Access Requests (Allowed / Not Allowed)"
              >
                <Bell className="w-4 h-4 text-teal-700" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center px-1 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-xs animate-bounce">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

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
                className="text-sm font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title={t.logOut}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs sm:text-sm">{t.logOut}</span>
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
