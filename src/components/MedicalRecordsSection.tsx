import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Calendar, 
  Building2, 
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2,
  Upload,
  Camera,
  FileCheck
} from 'lucide-react';
import { MedicalRecord, RecordType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { DOCUMENT_IMAGES } from '../data/documentImages';
import { PdfThumbnail } from './PdfThumbnail';

interface MedicalRecordsSectionProps {
  records: MedicalRecord[];
  onAddRecord: (file?: File) => void;
  onViewRecord: (record: MedicalRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const MedicalRecordsSection: React.FC<MedicalRecordsSectionProps> = ({
  records,
  onAddRecord,
  onViewRecord,
  onDeleteRecord,
}) => {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const filteredRecords = records.filter((rec) => {
    const matchesType = filterType === 'ALL' || rec.type === filterType;
    const matchesSearch =
      rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.doctorOrClinic && rec.doctorOrClinic.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const countByType = (type: string) => {
    if (type === 'ALL') return records.length;
    return records.filter((r) => r.type === type).length;
  };

  const isPdfRecord = (rec: MedicalRecord) => {
    return rec.fileType === 'pdf' || 
      rec.imageUrl?.startsWith('data:application/pdf') || 
      (rec.fileName && rec.fileName.toLowerCase().endsWith('.pdf'));
  };

  const getRecordThumbnail = (rec: MedicalRecord) => {
    if (rec.imageUrl && !rec.imageUrl.startsWith('data:application/pdf')) {
      return rec.imageUrl;
    }
    if (rec.type === 'Prescription') return DOCUMENT_IMAGES.prescriptionCalmette;
    if (rec.type === 'Lab Result') return DOCUMENT_IMAGES.labPasteur;
    if (rec.type === 'Medical Report') return DOCUMENT_IMAGES.reportRoyalPP;
    return DOCUMENT_IMAGES.xrayRadiology;
  };

  const getBadgeColor = (type: RecordType) => {
    switch (type) {
      case 'Prescription':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Lab Result':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Medical Report':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onAddRecord(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddRecord(file);
      e.target.value = '';
    }
  };

  return (
    <div 
      id="medical-records-section" 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white rounded-2xl p-6 sm:p-8 border shadow-2xs space-y-6 transition-all ${
        isDraggingOver 
          ? 'border-teal-500 ring-4 ring-teal-500/10 bg-teal-50/20' 
          : 'border-slate-200/80'
      }`}
    >
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {t.medicalRecordsTitle}
              </h2>
              <span className="text-xs px-2 py-0.5 font-bold rounded-full bg-teal-100 text-teal-800 border border-teal-200/60">
                {records.length}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.medicalRecordsSubtitle} (PDF, PNG, JPG, & Camera Scans)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Camera Scan Trigger */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            title="Take a photo with camera / scan"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">Scan Photo</span>
          </button>

          {/* Upload Button */}
          <button
            id="add-record-btn"
            onClick={() => onAddRecord()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Hidden File / Camera Inputs for quick triggers */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs">
          {(['ALL', 'Prescription', 'Lab Result', 'Medical Report', 'Other'] as const).map((type) => {
            const count = countByType(type);
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  filterType === type
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>
                  {type === 'ALL'
                    ? t.all
                    : type === 'Prescription'
                    ? t.prescription
                    : type === 'Lab Result'
                    ? t.labResult
                    : type === 'Medical Report'
                    ? t.medicalReport
                    : t.other}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                  filterType === type ? 'bg-teal-100 text-teal-900' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Records Grid / List */}
      <div className="space-y-3 pt-2">
        {filteredRecords.length === 0 ? (
          <div 
            onClick={() => onAddRecord()}
            className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30 transition-all space-y-3 cursor-pointer p-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                {t.noRecordsFound}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Drop your PDF prescriptions, lab slips, or health certificate scans directly here to upload.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addRecord}</span>
            </button>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const isPdf = isPdfRecord(rec);
            const thumbUrl = getRecordThumbnail(rec);

            return (
              <div
                key={rec.id}
                className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left Preview Thumbnail & Info */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  {/* Visual Document Thumbnail */}
                  <div 
                    onClick={() => onViewRecord(rec)}
                    className={`w-14 h-16 sm:w-16 sm:h-20 rounded-xl border overflow-hidden shrink-0 cursor-pointer relative group/thumb shadow-2xs transition-all flex items-center justify-center ${
                      isPdf 
                        ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                        : 'bg-slate-100 border-slate-200 hover:opacity-95'
                    }`}
                    title={isPdf ? 'Inspect PDF Document' : t.viewPicture}
                  >
                    {isPdf ? (
                      <PdfThumbnail pdfUrl={rec.imageUrl} />
                    ) : (
                      <img 
                        src={thumbUrl} 
                        alt={rec.name} 
                        className="w-full h-full object-cover object-top"
                      />
                    )}
                    <div className="absolute inset-0 bg-teal-950/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 
                        onClick={() => onViewRecord(rec)}
                        className="font-bold text-slate-900 text-sm hover:text-teal-700 cursor-pointer truncate"
                      >
                        {rec.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeColor(
                          rec.type
                        )}`}
                      >
                        {rec.type === 'Prescription'
                          ? t.prescription
                          : rec.type === 'Lab Result'
                          ? t.labResult
                          : rec.type === 'Medical Report'
                          ? t.medicalReport
                          : t.other}
                      </span>
                      {isPdf && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          PDF
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      {rec.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium pt-0.5">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {rec.date}
                      </span>

                      {rec.doctorOrClinic && (
                        <span className="flex items-center gap-1 text-teal-700 truncate max-w-[220px]">
                          <Building2 className="w-3 h-3" />
                          {rec.doctorOrClinic}
                        </span>
                      )}

                      <span className="font-mono text-[10px] text-slate-400">
                        {rec.fileSize}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onViewRecord(rec)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      isPdf 
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200' 
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isPdf ? 'View PDF' : t.viewPicture}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteRecord(rec.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title={t.deleteRecord}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
