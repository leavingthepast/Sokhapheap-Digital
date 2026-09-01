import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Droplet, 
  AlertTriangle, 
  Syringe, 
  FileText, 
  Calendar, 
  Eye, 
  Download, 
  Printer, 
  ArrowLeft,
  Building2,
  Stethoscope,
  Activity,
  CheckCircle2,
  Lock,
  Image as ImageIcon,
  Maximize2,
  Search,
  Phone,
  User,
  Heart,
  Clock,
  Filter,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { Patient, MedicalRecord, IllnessHistoryItem, LabResultItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DocumentViewerModal } from './Modals';
import { DOCUMENT_IMAGES } from '../data/documentImages';
import { triggerPrintDocument } from '../utils/printHelper';
import { PdfThumbnail } from './PdfThumbnail';

interface DoctorViewProps {
  patient: Patient;
  onExit: () => void;
}

export const DoctorMedicalRecordView: React.FC<DoctorViewProps> = ({ patient, onExit }) => {
  const { t, lang } = useLanguage();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClinicalTab, setActiveClinicalTab] = useState<'all' | 'illness' | 'documents' | 'labs' | 'vaccines'>('all');
  const [illnessFilter, setIllnessFilter] = useState<'All' | 'Active' | 'Chronic' | 'Resolved'>('All');

  const handlePrintClinicalChart = () => {
    triggerPrintDocument('doctor-clinical-chart', `Doctor_Chart_${patient.name}`);
  };

  const getRecordThumbnail = (rec: MedicalRecord) => {
    if (rec.imageUrl) return rec.imageUrl;
    if (rec.type === 'Prescription') return DOCUMENT_IMAGES.prescriptionCalmette;
    if (rec.type === 'Lab Result') return DOCUMENT_IMAGES.labPasteur;
    if (rec.type === 'Medical Report') return DOCUMENT_IMAGES.reportRoyalPP;
    return DOCUMENT_IMAGES.xrayRadiology;
  };

  // Filtered illness list based on search and status
  const filteredIllnesses = useMemo(() => {
    return (patient.illnessHistory || []).filter((ill) => {
      const matchSearch = 
        !searchQuery ||
        ill.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ill.doctorOrHospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ill.notes.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchFilter = illnessFilter === 'All' || ill.status === illnessFilter;
      return matchSearch && matchFilter;
    });
  }, [patient.illnessHistory, searchQuery, illnessFilter]);

  // Filtered documents based on search
  const filteredRecords = useMemo(() => {
    return (patient.medicalRecords || []).filter((rec) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        rec.name.toLowerCase().includes(q) ||
        rec.type.toLowerCase().includes(q) ||
        rec.description.toLowerCase().includes(q) ||
        rec.doctorOrClinic.toLowerCase().includes(q)
      );
    });
  }, [patient.medicalRecords, searchQuery]);

  // Filtered lab results based on search
  const filteredLabs = useMemo(() => {
    return (patient.labResults || []).filter((lab) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        lab.testName.toLowerCase().includes(q) ||
        lab.result.toLowerCase().includes(q) ||
        lab.labOrHospital.toLowerCase().includes(q) ||
        lab.referenceRange.toLowerCase().includes(q)
      );
    });
  }, [patient.labResults, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Clinical Portal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-2xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  {t.appName} <span className="text-teal-700">| {t.doctorPortalHeader}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{t.qrTokenVerified}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>{t.temporaryAccess}</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded text-[11px] border border-teal-100">
                  {patient.qrToken}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">• Live Doctor Scan Session</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />

            <button
              onClick={handlePrintClinicalChart}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="Print full patient chart"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{t.printClinicalChart}</span>
            </button>

            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all hover:scale-102 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backToDashboard}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Clinical Content Area */}
      <main id="doctor-clinical-chart" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Emergency Triage & Patient Vital Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Patient Identity */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-teal-50 border-2 border-teal-200 overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
                {patient.profilePicture ? (
                  <img src={patient.profilePicture} alt={patient.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-teal-800 uppercase select-none">
                    {patient.name ? patient.name.charAt(0) : 'P'}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Clinical Patient Record
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    ID: {patient.id}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 capitalize tracking-tight">
                  {patient.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <span className="font-semibold text-slate-800">{patient.gender}</span>
                  <span>•</span>
                  <span>DOB: <strong className="text-slate-800">{patient.dob}</strong></span>
                  <span>•</span>
                  <span>Phone: <strong className="text-slate-800 font-mono">{patient.phone}</strong></span>
                </div>
                
                {/* Emergency Contact Pill */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 font-medium">Emergency:</span>
                  <a 
                    href={`tel:${patient.emergencyContact.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
                  >
                    <Phone className="w-3 h-3 text-rose-600" />
                    <span>{patient.emergencyContact.name} ({patient.emergencyContact.relationship}) — {patient.emergencyContact.phone}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Critical Clinical Indicators (Blood Group & Allergies) */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Blood Type */}
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-center min-w-[120px] shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-rose-700 uppercase tracking-wider">
                  <Droplet className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                  <span>{t.bloodType}</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-rose-950 mt-0.5 tracking-tight">
                  {patient.bloodType}
                </div>
                <span className="text-[10px] font-semibold text-rose-700 block mt-0.5">
                  Rh Compatible
                </span>
              </div>

              {/* Critical Allergies Alert */}
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 min-w-[200px] max-w-[280px] shadow-2xs">
                <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t.allergies} ({patient.allergies.length})</span>
                </div>
                <div className="space-y-1">
                  {patient.allergies.length > 0 ? (
                    patient.allergies.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-950 capitalize truncate max-w-[130px]">{a.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          a.severity === 'Severe' ? 'bg-rose-100 text-rose-800' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {a.severity || 'Moderate'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">{t.noAllergies}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Portal Search & Navigation Tabs */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveClinicalTab('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeClinicalTab === 'all'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>All Clinical Overview</span>
              </button>

              <button
                onClick={() => setActiveClinicalTab('illness')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeClinicalTab === 'illness'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{t.illnessHistorySummary} ({patient.illnessHistory.length})</span>
              </button>

              <button
                onClick={() => setActiveClinicalTab('documents')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeClinicalTab === 'documents'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.uploadedDocuments} ({patient.medicalRecords.length})</span>
              </button>

              <button
                onClick={() => setActiveClinicalTab('labs')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeClinicalTab === 'labs'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{t.labBloodPanels} ({patient.labResults.length})</span>
              </button>

              <button
                onClick={() => setActiveClinicalTab('vaccines')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeClinicalTab === 'vaccines'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                <span>{t.vaccinations} ({patient.vaccinations.length})</span>
              </button>
            </div>

            {/* Real-time Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search illnesses, tests, meds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION A: Illness & Diagnostic History */}
        {(activeClinicalTab === 'all' || activeClinicalTab === 'illness') && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 border border-teal-100">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {t.chronologicalHistory} & Clinical Diagnoses
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comprehensive past and active conditions recorded across healthcare institutions
                  </p>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                {(['All', 'Active', 'Chronic', 'Resolved'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setIllnessFilter(status)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      illnessFilter === status
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {filteredIllnesses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No illness records matching current criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIllnesses.map((ill) => (
                  <div 
                    key={ill.id} 
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-teal-300 hover:bg-white hover:shadow-xs transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {ill.condition}
                        </span>
                        <span className="text-[11px] text-teal-800 font-semibold flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-teal-600" />
                          {ill.doctorOrHospital}
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md shrink-0 uppercase tracking-wider ${
                        ill.status === 'Active' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : ill.status === 'Chronic'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {ill.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                      {ill.notes}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                      <span>Diagnosed: <strong className="text-slate-700">{ill.diagnosedDate}</strong></span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        ✓ Verified Record
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION B: Uploaded Medical Documents, Scans & Prescriptions */}
        {(activeClinicalTab === 'all' || activeClinicalTab === 'documents') && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 border border-teal-100">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {t.uploadedDocuments} & Scanned Prescriptions
                  </h2>
                  <p className="text-xs text-slate-500">
                    High-resolution documents with full clinical inspection, zoom, and direct download
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 self-start sm:self-auto">
                {patient.medicalRecords.length} Document Scans Available
              </span>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No medical documents matching query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRecords.map((rec) => {
                  const isPdf = rec.fileType === 'pdf' || 
                    rec.imageUrl?.startsWith('data:application/pdf') || 
                    (rec.fileName && rec.fileName.toLowerCase().endsWith('.pdf'));
                  const thumbUrl = getRecordThumbnail(rec);

                  return (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all flex items-start gap-4 group"
                    >
                      {/* Thumbnail Picture / PDF preview with click-to-zoom indicator */}
                      <div
                        onClick={() => setSelectedRecord(rec)}
                        className={`w-20 h-24 sm:w-24 sm:h-28 rounded-xl border overflow-hidden shrink-0 cursor-pointer relative shadow-2xs group-hover:shadow-md transition-all flex items-center justify-center ${
                          isPdf ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200'
                        }`}
                        title={isPdf ? 'Inspect PDF Document' : t.viewPicture}
                      >
                        {isPdf ? (
                          <PdfThumbnail pdfUrl={rec.imageUrl} />
                        ) : (
                          <img
                            src={thumbUrl}
                            alt={rec.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <div className="absolute inset-0 bg-teal-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 p-1">
                          <Maximize2 className="w-5 h-5" />
                          <span className="text-[9px] font-bold text-center leading-tight">
                            {isPdf ? 'Open PDF' : 'Inspect Document'}
                          </span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => setSelectedRecord(rec)}
                            className="font-bold text-slate-900 text-xs sm:text-sm hover:text-teal-700 cursor-pointer line-clamp-2"
                          >
                            {rec.name}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0">
                            {isPdf && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                PDF
                              </span>
                            )}
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-100/70 text-teal-800">
                              {rec.type}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {rec.description}
                        </p>

                        <div className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">{rec.doctorOrClinic || 'Verified Clinical Center'}</span>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1.5 border-t border-slate-200/60">
                          <span className="font-mono">{rec.date}</span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedRecord(rec)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors cursor-pointer ${
                                isPdf ? 'bg-rose-700 hover:bg-rose-800' : 'bg-teal-700 hover:bg-teal-800'
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isPdf ? 'View PDF' : t.viewPicture}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION C: Laboratory & Blood Chemistry Panels */}
        {(activeClinicalTab === 'all' || activeClinicalTab === 'labs') && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 border border-sky-100">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {t.labBloodPanels} & Diagnostic Test Values
                </h2>
                <p className="text-xs text-slate-500">
                  Hematology, clinical biochemistry, lipid profiles, and metabolic parameters
                </p>
              </div>
            </div>

            {filteredLabs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No laboratory blood panels recorded.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLabs.map((lab) => (
                  <div key={lab.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{lab.testName}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {lab.status}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 font-mono text-xs font-semibold text-slate-800">
                      {lab.result}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>Ref: {lab.referenceRange}</span>
                      <span className="font-mono text-slate-400">{lab.date}</span>
                    </div>
                    <span className="text-[10px] text-sky-700 font-semibold block truncate">
                      {lab.labOrHospital}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION D: Allergies & Immunizations */}
        {(activeClinicalTab === 'all' || activeClinicalTab === 'vaccines') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allergies Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-base border-b border-slate-100 pb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>{t.knownAllergiesAndReactions}</span>
              </div>

              {patient.allergies.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  {t.noAllergies || 'No known allergies reported.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {patient.allergies.map((alg) => (
                    <div key={alg.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 flex items-start justify-between">
                      <div>
                        <span className="font-bold text-amber-950 text-xs sm:text-sm block capitalize">{alg.name}</span>
                        <span className="text-xs text-amber-900/80">{alg.reaction}</span>
                      </div>
                      {alg.severity && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          alg.severity === 'Severe' ? 'bg-rose-100 text-rose-800 font-extrabold' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {alg.severity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Immunization History */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-sky-800 font-bold text-base border-b border-slate-100 pb-3">
                <Syringe className="w-5 h-5 text-sky-600" />
                <span>{t.immunizationRecords}</span>
              </div>

              {patient.vaccinations.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  {t.noVaccinations || 'No immunization records on file.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {patient.vaccinations.map((vac) => (
                    <div key={vac.id} className="p-3 rounded-xl bg-sky-50/50 border border-sky-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{vac.name}</span>
                        <span className="text-[11px] text-slate-500">{vac.provider || vac.notes}</span>
                      </div>
                      <span className="font-mono text-teal-800 font-bold bg-white px-2 py-1 rounded border border-teal-100">
                        {vac.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Interactive High-Resolution Document Viewer Modal */}
      {selectedRecord && (
        <DocumentViewerModal
          record={selectedRecord}
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};
