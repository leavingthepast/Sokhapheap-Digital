import React from 'react';
import { 
  Printer, 
  ArrowLeft, 
  FileText, 
  ExternalLink,
  ShieldCheck, 
  AlertTriangle, 
  Droplet, 
  Syringe, 
  Download,
  Calendar,
  Activity,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { triggerPrintDocument, downloadHtmlSummary } from '../utils/printHelper';
import { generateDoctorScanUrl } from '../utils/qrPayload';

interface MedicalSummaryPDFProps {
  patient: Patient;
  onBack: () => void;
  onOpenDoctorView?: () => void;
}

export const MedicalSummaryPDF: React.FC<MedicalSummaryPDFProps> = ({ patient, onBack, onOpenDoctorView }) => {
  const { t, lang } = useLanguage();
  const qrUrl = generateDoctorScanUrl(patient);

  const handleDirectPrint = () => {
    triggerPrintDocument('medical-summary-pdf-sheet', `Sokhapheap_Medical_Summary_${patient.name}`);
  };

  const handleDownloadHtml = () => {
    downloadHtmlSummary('medical-summary-pdf-sheet', `Sokhapheap_Medical_Summary_${patient.name}.html`);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-teal-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToDashboard}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <LanguageSwitcher />

          <button
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
            title="Save as HTML file"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{t.downloadHtmlSummary}</span>
          </button>

          <button
            id="print-summary-action-btn"
            onClick={handleDirectPrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printSummaryA4}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div 
        id="medical-summary-pdf-sheet"
        className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl shadow-md p-8 sm:p-12 text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0"
      >
        {/* Header Strip */}
        <div className="border-b-2 border-teal-800 pb-5 mb-6 flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-800 flex items-center justify-center text-white font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-teal-950 tracking-tight">
                  {t.appName}
                </h1>
                <p className="text-xs font-semibold text-teal-800 tracking-wide uppercase">
                  {t.officialMedicalSummary}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium pt-1">
              {t.confidentialNotice}
            </p>
          </div>

          <div className="text-right space-y-1 shrink-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>ID: {patient.id}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {t.generated}: {new Date().toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Patient Demographics & Key Clinical Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Patient Details */}
          <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
            {patient.profilePicture && (
              <div className="w-16 h-16 rounded-xl bg-teal-100 border border-teal-200 overflow-hidden shrink-0 hidden sm:block">
                <img src={patient.profilePicture} alt={patient.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-2.5 flex-1">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.completePatientOverview}
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">{t.patientName}:</span>
                  <span className="font-bold text-slate-900 text-sm capitalize">{patient.name || 'Patient'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{t.genderAndDob}:</span>
                  <span className="font-semibold text-slate-900">
                    {patient.gender || 'Not specified'} {patient.dob ? `• ${patient.dob}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Phone:</span>
                  <span className="font-semibold text-slate-900 font-mono">{patient.phone || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{t.emergencyContact}:</span>
                  <span className="font-semibold text-slate-900">
                    {patient.emergencyContact?.name
                      ? `${patient.emergencyContact.name} (${patient.emergencyContact.relationship || 'Contact'}) ${patient.emergencyContact.phone || ''}`
                      : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Blood Type Callout */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col justify-center items-center text-center">
            <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Droplet className="w-4 h-4 fill-rose-600 text-rose-600" />
              <span>{t.bloodType}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-rose-900">
              {patient.bloodType}
            </div>
            <span className="text-[10px] text-rose-700/80 font-medium mt-1">
              {t.bloodTypeSubtitle}
            </span>
          </div>
        </div>

        {/* Section: Known Allergies */}
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              {t.knownAllergiesAndReactions}
            </h2>
          </div>

          {patient.allergies.length === 0 ? (
            <p className="text-xs text-slate-500 italic">{t.noAllergies}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {patient.allergies.map((alg) => (
                <div key={alg.id} className="p-2.5 rounded-lg bg-white border border-amber-200 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block capitalize">{alg.name}</span>
                    <span className="text-slate-600 text-[11px]">{alg.reaction}</span>
                  </div>
                  {alg.severity && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      alg.severity === 'Severe' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alg.severity === 'Severe' ? t.severe : alg.severity === 'Moderate' ? t.moderate : t.mild}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Immunizations & Vaccinations */}
        <div className="mb-6 p-4 rounded-xl border border-sky-200 bg-sky-50/30">
          <div className="flex items-center gap-2 mb-2.5">
            <Syringe className="w-4 h-4 text-sky-700" />
            <h2 className="text-xs font-bold text-sky-900 uppercase tracking-wider">
              {t.immunizationRecords}
            </h2>
          </div>

          {patient.vaccinations.length === 0 ? (
            <p className="text-xs text-slate-500 italic">{t.noVaccinations || 'No vaccination records on file.'}</p>
          ) : (
            <div className="space-y-2 text-xs">
              {patient.vaccinations.map((vac) => (
                <div key={vac.id} className="p-2.5 rounded-lg bg-white border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-slate-900">{vac.name}</span>
                    {vac.provider && <span className="text-slate-500 text-[11px] block sm:inline sm:ml-2">• {vac.provider}</span>}
                  </div>
                  <span className="font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded text-[11px] self-start sm:self-auto">
                    {vac.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Illness & Medical History */}
        <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2 mb-2.5">
            <Activity className="w-4 h-4 text-teal-700" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t.illnessHistorySummary}
            </h2>
          </div>

          {patient.illnessHistory.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No recorded past illnesses or chronic diagnoses.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {patient.illnessHistory.map((ill) => (
                <div key={ill.id} className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{ill.condition}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{ill.diagnosedDate}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{ill.notes}</p>
                  <span className="text-slate-400 text-[10px] block mt-1">Provider: {ill.doctorOrHospital}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Medical Records & Documents Index */}
        <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.consolidatedDocsIndex}
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {t.fullScansViaQr}
            </span>
          </div>

          {patient.medicalRecords.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No uploaded medical documents or scans.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {patient.medicalRecords.map((rec) => (
                <div key={rec.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rec.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {rec.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{rec.description}</p>
                    {rec.doctorOrClinic && (
                      <span className="text-[10px] text-teal-700 font-medium">
                        Clinic: {rec.doctorOrClinic}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-500 text-xs shrink-0 font-medium">
                    {rec.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR Code & Clinical Verification Footer */}
        <div className="mt-8 pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl border">
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-6 h-6 rounded bg-teal-800 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t.doctorPortalHeader}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              {t.scanToSecurelyView} {t.privacyGuaranteed}
            </p>
            <div className="text-[11px] font-mono text-teal-900 flex items-center gap-2">
              <span>Access Token: <strong className="font-bold">{patient.qrToken}</strong></span>
              {onOpenDoctorView && (
                <button
                  onClick={onOpenDoctorView}
                  className="no-print text-teal-700 hover:text-teal-900 underline font-semibold text-xs ml-2 cursor-pointer"
                >
                  Open Doctor Portal →
                </button>
              )}
            </div>
          </div>

          <div 
            onClick={onOpenDoctorView}
            className={`flex flex-col items-center bg-white p-3 rounded-xl border border-slate-200 shadow-2xs shrink-0 ${onOpenDoctorView ? 'cursor-pointer hover:border-teal-600 hover:shadow-md transition-all' : ''}`}
            title={onOpenDoctorView ? "Click or scan to view Doctor Portal" : "Scan to view Doctor Portal"}
          >
            <QRCodeSVG
              value={qrUrl}
              size={110}
              level="M"
              fgColor="#0f766e"
            />
            <span className="text-[10px] font-mono text-teal-800 mt-1.5 font-bold">
              SCAN TO VIEW
            </span>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="mt-6 text-center text-[11px] text-slate-400 font-medium">
          {t.appName} • {t.tagline} • {t.subTagline}
        </div>
      </div>
    </div>
  );
};
