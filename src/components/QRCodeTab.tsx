import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Printer, 
  ShieldCheck, 
  ShieldAlert,
  Lock, 
  AlertCircle,
  Scan,
  Smartphone,
  Stethoscope,
  Eye,
  CheckCircle2,
  Download,
  Globe,
  Share2,
  X,
  Sparkles,
  Info,
  Maximize2,
  Bell
} from 'lucide-react';
import { Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  generateDoctorScanUrl, 
  CLOUD_DEPLOYED_URL, 
  CLOUD_DEV_URL,
  getQRBaseUrl 
} from '../utils/qrPayload';
import { DoctorMedicalRecordView } from './DoctorMedicalRecordView';

interface QRCodeTabProps {
  patient: Patient;
  onRegenerateToken: () => void;
  onOpenPdf: () => void;
  onOpenDoctorView: () => void;
  onOpenNotifications?: () => void;
}

export const QRCodeTab: React.FC<QRCodeTabProps> = ({
  patient,
  onRegenerateToken,
  onOpenPdf,
  onOpenDoctorView,
  onOpenNotifications,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  
  const [showPhoneSimulator, setShowPhoneSimulator] = useState(false);

  const qrContainerRef = useRef<HTMLDivElement>(null);

  const pendingCount = (patient.accessRequests || []).filter(
    (r) => r.status === 'pending'
  ).length;

  // Use the exact same generateDoctorScanUrl(patient) as used in MedicalSummaryPDF
  const doctorUrl = generateDoctorScanUrl(patient);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(doctorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = () => {
    onRegenerateToken();
    setConfirmRegen(false);
  };

  const handleDownloadQR = () => {
    const svg = qrContainerRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw centered QR
        ctx.drawImage(img, 100, 100, 800, 800);

        // Draw title at bottom
        ctx.fillStyle = '#0f766e';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Sokhapheap Digital - ${patient.name}`, 500, 940);
        ctx.fillStyle = '#64748b';
        ctx.font = '24px monospace';
        ctx.fillText(`ID: ${patient.id} | Token: ${patient.qrToken}`, 500, 975);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Sokhapheap_QR_${patient.name.replace(/\s+/g, '_')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Intro */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700 shadow-2xs border border-teal-100">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{t.emergencyDoctorQr}</span>
              </h1>
              <p className="text-xs text-slate-500">
                {t.qrSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenNotifications && (
              <button
                id="qr-tab-notifications-btn"
                onClick={onOpenNotifications}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                title="Manage Allowed & Not Allowed Scanners"
              >
                <Bell className="w-4 h-4 text-amber-700" />
                <span>{t.accessNotifications || 'Access Requests'}</span>
                {pendingCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setShowPhoneSimulator(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Preview Mobile Doctor View"
            >
              <Smartphone className="w-4 h-4 text-teal-700" />
              <span>Preview Phone View</span>
            </button>

            <button
              onClick={onOpenDoctorView}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-102 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              <span>{t.simulateDoctorScan || 'Open Doctor Portal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main QR Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center gap-8 sm:gap-12">
        {/* QR Display Card (Clickable to open Doctor Portal directly) */}
        <div className="flex flex-col items-center p-6 rounded-3xl bg-slate-50 border-2 border-teal-200/80 shadow-inner text-center shrink-0 w-full sm:w-auto">
          {/* Clickable QR frame with target id for focus */}
          <div 
            id="qr-scan-display-frame"
            ref={qrContainerRef}
            onClick={onOpenDoctorView}
            className="group relative bg-white p-5 rounded-2xl border-2 border-teal-600/30 shadow-md cursor-pointer hover:border-teal-600 hover:shadow-xl transition-all"
            title="Click or scan with any mobile camera to open Doctor Portal"
          >
            <QRCodeSVG
              value={doctorUrl}
              size={220}
              level="M"
              includeMargin={false}
              fgColor="#0f766e"
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-teal-950/75 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-white gap-2 backdrop-blur-xs">
              <Scan className="w-8 h-8 text-teal-300 animate-pulse" />
              <span className="text-xs font-bold tracking-wide text-center">
                Click to Open Doctor Portal
              </span>
              <span className="text-[10px] text-teal-200 text-center">
                Or scan with your phone camera
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 w-full">
            <span className="text-xs font-bold text-teal-900 block">
              {t.scanToViewRecords}
            </span>
            <span className="text-[11px] font-mono text-slate-500 block">
              Ref: <span className="font-semibold text-slate-700">{patient.qrToken}</span>
            </span>
            
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/70">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Direct Public Cloud Scan Ready</span>
            </div>

            <button
              onClick={handleDownloadQR}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 mt-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download High-Res PNG</span>
            </button>

            {/* Admission Gate Security Info */}
            <div className="mt-3 p-3 rounded-xl bg-teal-900/5 border border-teal-200/80 text-left space-y-1.5 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-teal-700" />
                  <span>Admit Gate Active</span>
                </span>
                {pendingCount > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-600 leading-tight">
                Scanners must request admission. When allowed, they can view records (downloads disabled).
              </p>
              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="w-full text-center py-1.5 px-2 bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Bell className="w-3 h-3" />
                  <span>Manage Allowed / Not Allowed ({patient.accessRequests?.length || 0})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info & Action Controls */}
        <div className="space-y-6 flex-1 w-full">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cross-Device Verified Access</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {t.oneQrAnyClinic}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              {t.qrDescription}
            </p>
          </div>

          {/* Device Scan Guide */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
              <Smartphone className="w-4 h-4 text-teal-700" />
              <span>How to scan from another device:</span>
            </div>
            <ol className="text-[11px] text-teal-900/90 space-y-1 list-decimal list-inside leading-relaxed font-medium">
              <li>Open the default <strong>Camera App</strong> on your iPhone or Android phone.</li>
              <li>Point the camera directly at the QR code on your screen.</li>
              <li>Tap the pop-up notification link to immediately open the <strong>Doctor Portal</strong>.</li>
            </ol>
          </div>

          {/* Public Cloud Network Indicator */}
          <div className="p-3.5 rounded-2xl bg-teal-50/90 border border-teal-200/90 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-950 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-700" />
                <span>QR Destination Network:</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Public Cloud (Active)
              </span>
            </div>
            <p className="text-[11px] text-teal-800/90 leading-relaxed font-mono truncate">
              {CLOUD_DEPLOYED_URL}
            </p>
          </div>

          {/* Action Links */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                id="test-doctor-view-btn"
                onClick={onOpenDoctorView}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-102 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>{t.simulateDoctorScan}</span>
              </button>

              <button
                id="print-summary-from-qr-btn"
                onClick={onOpenPdf}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t.printMedicalPdf}</span>
              </button>
            </div>

            {/* Direct URL copy */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
              <span className="font-mono text-slate-500 truncate flex-1 pl-2 text-[11px]">
                {doctorUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 shrink-0 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copyLink}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Security & Revoke Option */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                {t.privacyGuaranteed}
              </span>
            </div>

            {confirmRegen ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{t.revokePrompt}</span>
                </div>
                <p className="text-rose-700">
                  {t.revokeWarning}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleRegenerate}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    {t.yesRegenerate}
                  </button>
                  <button
                    onClick={() => setConfirmRegen(false)}
                    className="px-3 py-1.5 bg-white text-slate-700 font-semibold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRegen(true)}
                className="text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.regenerateToken}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Phone Simulator Modal */}
      {showPhoneSimulator && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-3 border-4 border-slate-700 shadow-2xl max-w-sm w-full relative flex flex-col h-[85vh] max-h-[720px]">
            {/* Phone Top Notch */}
            <div className="flex items-center justify-between px-4 py-1 text-slate-400 text-[10px] select-none shrink-0">
              <span className="font-bold text-white">9:41</span>
              <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto" />
              <span>5G • 100%</span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowPhoneSimulator(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-800 font-bold flex items-center justify-center shadow-lg hover:bg-slate-100 cursor-pointer z-10"
              title="Close simulator"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Phone Screen Container */}
            <div className="flex-1 bg-[#f1f5f9] rounded-2xl overflow-y-auto border border-slate-800">
              <DoctorMedicalRecordView
                patient={patient}
                onExit={() => setShowPhoneSimulator(false)}
              />
            </div>

            {/* Phone Bottom Home Bar */}
            <div className="py-2 flex justify-center shrink-0">
              <div className="w-28 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
