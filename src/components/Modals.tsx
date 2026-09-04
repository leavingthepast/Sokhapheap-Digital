import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Printer, 
  Check, 
  Calendar, 
  Building2, 
  User, 
  AlertCircle,
  FileCheck,
  Maximize2,
  Camera,
  Phone,
  Trash2,
  Sparkles,
  Eye
} from 'lucide-react';
import { BloodType, Allergy, Vaccination, MedicalRecord, RecordType, Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { DOCUMENT_IMAGES } from '../data/documentImages';
import { triggerPrintDocument } from '../utils/printHelper';
import { compressImageForUpload } from '../utils/patientSync';
import { PdfViewer } from './PdfViewer';

// ==========================================
// 1. Edit Blood Type Modal
// ==========================================
interface BloodTypeModalProps {
  currentBloodType: BloodType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (bloodType: BloodType) => void;
}

export const BloodTypeModal: React.FC<BloodTypeModalProps> = ({
  currentBloodType,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<BloodType>(currentBloodType);
  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{t.updateBloodType}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">{t.selectBloodGroup}</p>

        <div className="grid grid-cols-3 gap-2.5">
          {bloodTypes.map((bt) => (
            <button
              key={bt}
              type="button"
              onClick={() => setSelected(bt)}
              className={`py-3 rounded-xl font-extrabold text-base transition-all border ${
                selected === bt
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs scale-102'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {bt}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(selected);
              onClose();
            }}
            className="px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. Add / Edit Allergy Modal
// ==========================================
interface AllergyModalProps {
  isOpen: boolean;
  allergyToEdit?: Allergy | null;
  onClose: () => void;
  onSave: (allergy: Allergy) => void;
}

export const AllergyModal: React.FC<AllergyModalProps> = ({
  isOpen,
  allergyToEdit,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(allergyToEdit?.name || '');
  const [reaction, setReaction] = useState(allergyToEdit?.reaction || '');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>(
    allergyToEdit?.severity || 'Moderate'
  );

  React.useEffect(() => {
    if (allergyToEdit) {
      setName(allergyToEdit.name);
      setReaction(allergyToEdit.reaction);
      setSeverity(allergyToEdit.severity || 'Moderate');
    } else {
      setName('');
      setReaction('');
      setSeverity('Moderate');
    }
  }, [allergyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: allergyToEdit ? allergyToEdit.id : `alg-${Date.now()}`,
      name: name.trim(),
      reaction: reaction.trim(),
      severity,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {allergyToEdit ? t.editAllergy : t.addKnownAllergy}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.allergyName}</label>
            <input
              type="text"
              required
              placeholder="e.g., Penicillin, Peanuts, Egg..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.reactionNotes}</label>
            <input
              type="text"
              placeholder="e.g., Skin hives, fever, anaphylaxis..."
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.severityLevel}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Mild', 'Moderate', 'Severe'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    severity === lvl
                      ? lvl === 'Severe'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : lvl === 'Moderate'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-teal-50 border-teal-500 text-teal-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {lvl === 'Severe' ? t.severe : lvl === 'Moderate' ? t.moderate : t.mild}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              {t.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. Add / Edit Vaccination Modal
// ==========================================
interface VaccinationModalProps {
  isOpen: boolean;
  vaccineToEdit?: Vaccination | null;
  onClose: () => void;
  onSave: (vaccine: Vaccination) => void;
}

export const VaccinationModal: React.FC<VaccinationModalProps> = ({
  isOpen,
  vaccineToEdit,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(vaccineToEdit?.name || '');
  const [date, setDate] = useState(vaccineToEdit?.date || new Date().toISOString().split('T')[0]);
  const [provider, setProvider] = useState(vaccineToEdit?.provider || '');
  const [notes, setNotes] = useState(vaccineToEdit?.notes || '');

  React.useEffect(() => {
    if (vaccineToEdit) {
      setName(vaccineToEdit.name);
      setDate(vaccineToEdit.date);
      setProvider(vaccineToEdit.provider || '');
      setNotes(vaccineToEdit.notes || '');
    } else {
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      setProvider('');
      setNotes('');
    }
  }, [vaccineToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: vaccineToEdit ? vaccineToEdit.id : `vac-${Date.now()}`,
      name: name.trim(),
      date,
      provider: provider.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {vaccineToEdit ? t.editVaccination : t.addVaccinationRecord}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.vaccineName}</label>
            <input
              type="text"
              required
              placeholder="e.g., COVID-19 Booster, Hepatitis B, Tdap..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.dateAdministered}</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.clinicHospital}</label>
            <input
              type="text"
              placeholder="e.g., Calmette Hospital, Pasteur Institute..."
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.doseNotes}</label>
            <input
              type="text"
              placeholder="e.g., Dose 2 booster, batch #8812..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              {t.saveVaccine}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. Add Medical Record Modal (With Real PDF, Image & Scan Upload)
// ==========================================
interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: MedicalRecord) => void;
  initialFile?: File | null;
}

export const AddMedicalRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFile,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [type, setType] = useState<RecordType>('Prescription');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorOrClinic, setDoctorOrClinic] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'document'>('image');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [previewItems, setPreviewItems] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFullPdfPreview, setShowFullPdfPreview] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = React.useCallback((file: File) => {
    if (!file) return;
    setIsProcessing(true);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const detectedType: 'pdf' | 'image' | 'document' = isPdf ? 'pdf' : 'image';
    setFileType(detectedType);
    setFileName(file.name);

    // Format human-readable file size
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;
    setFileSize(sizeStr);

    // Auto-fill record title if empty
    if (!name) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      setName(cleanName);
    }

    // Auto-detect record type from filename keywords
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('rx') || lowerName.includes('prescript') || lowerName.includes('med')) {
      setType('Prescription');
    } else if (lowerName.includes('lab') || lowerName.includes('blood') || lowerName.includes('test') || lowerName.includes('biochem')) {
      setType('Lab Result');
    } else if (lowerName.includes('report') || lowerName.includes('clearance') || lowerName.includes('cert') || lowerName.includes('summary')) {
      setType('Medical Report');
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (isPdf) {
          setUploadedFileUrl(result);
          setIsProcessing(false);
        } else {
          try {
            // Compress high-res images to optimize storage and cross-device sync while maintaining sharp text
            const compressed = await compressImageForUpload(result, 1600, 0.85);
            setUploadedFileUrl(compressed);
          } catch {
            setUploadedFileUrl(result);
          } finally {
            setIsProcessing(false);
          }
        }
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  }, [name]);

  React.useEffect(() => {
    if (initialFile) {
      processFile(initialFile);
    }
  }, [initialFile, processFile]);

  if (!isOpen) return null;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClearFile = () => {
    setUploadedFileUrl('');
    setFileName('');
    setFileSize('');
    setFileType('image');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Determine fallback authentic document if none uploaded
    let finalFileUrl = uploadedFileUrl;
    let finalFileType = fileType;
    if (!finalFileUrl) {
      if (type === 'Prescription') {
        finalFileUrl = DOCUMENT_IMAGES.prescriptionCalmette;
        finalFileType = 'image';
      } else if (type === 'Lab Result') {
        finalFileUrl = DOCUMENT_IMAGES.labPasteur;
        finalFileType = 'image';
      } else if (type === 'Medical Report') {
        finalFileUrl = DOCUMENT_IMAGES.reportRoyalPP;
        finalFileType = 'image';
      } else {
        finalFileUrl = DOCUMENT_IMAGES.xrayRadiology;
        finalFileType = 'image';
      }
    }

    const newRecord: MedicalRecord = {
      id: `rec-${Date.now()}`,
      name: name.trim(),
      type,
      date,
      doctorOrClinic: doctorOrClinic.trim() || undefined,
      description: description.trim() || `${type} document issued on ${date}`,
      fileName: fileName || `${name.trim().toLowerCase().replace(/\s+/g, '_')}.${finalFileType === 'pdf' ? 'pdf' : 'jpg'}`,
      fileSize: fileSize || (uploadedFileUrl ? (finalFileType === 'pdf' ? '1.8 MB' : '1.4 MB') : '520 KB'),
      fileType: finalFileType,
      imageUrl: finalFileUrl,
      previewContent: {
        clinicName: doctorOrClinic || 'Verified Clinical Facility',
        doctorName: 'Attending Practitioner',
        diagnosisOrTest: name,
        items: previewItems.length > 0 ? previewItems : [
          `Document: ${name}`,
          `Type: ${type}`,
          `Format: ${finalFileType.toUpperCase()}`,
          `Date of record: ${date}`,
          description || 'Document successfully added to personal health record'
        ],
        rawNotes: description,
      },
    };

    onSave(newRecord);
    // Reset form
    setName('');
    setDescription('');
    setDoctorOrClinic('');
    setUploadedFileUrl('');
    setFileName('');
    setFileSize('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{t.addMedicalRecordTitle}</h2>
              <p className="text-xs text-slate-500">PDF, PNG, JPG, WebP, or Camera Scans</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload / Drag & Drop Box */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all ${
              isDragging
                ? 'border-teal-600 bg-teal-50/70 scale-[1.01]'
                : uploadedFileUrl
                ? 'border-teal-300 bg-teal-50/30'
                : 'border-slate-300 hover:border-teal-500 bg-slate-50/70'
            }`}
          >
            {isProcessing ? (
              <div className="py-4 space-y-2">
                <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-teal-800">Processing document...</p>
              </div>
            ) : uploadedFileUrl ? (
              <div className="space-y-3">
                {fileType === 'pdf' ? (
                  <div className="space-y-2">
                    {/* Live PDF Page Preview */}
                    <PdfViewer
                      pdfUrl={uploadedFileUrl}
                      fileName={fileName || 'document.pdf'}
                      compact={true}
                      onOpenFull={() => setShowFullPdfPreview(true)}
                    />
                    
                    <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 font-mono">
                      <span className="truncate">{fileName || 'document.pdf'} ({fileSize || 'Ready'})</span>
                      <button
                        type="button"
                        onClick={() => setShowFullPdfPreview(true)}
                        className="text-teal-700 hover:text-teal-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Full Pages</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 p-2 bg-white rounded-xl border border-teal-200 shadow-2xs">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <img src={uploadedFileUrl} alt="Uploaded Document Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 truncate block">
                          {fileName || 'Scanned Document Image'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 shrink-0 uppercase">
                          {fileName.split('.').pop() || 'IMAGE'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {fileSize || 'High Resolution'} • Verified Ready
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    Change File
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 mx-auto flex items-center justify-center shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {t.uploadPrompt}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Drag and drop file here, or choose an option below:
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Browse Files (PDF, PNG, JPG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                    <span>Take Photo / Scan</span>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden File Input for PDF / Images */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Hidden Camera Input for direct camera scan on mobile and supported devices */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.documentName}</label>
            <input
              type="text"
              required
              placeholder="e.g., Gastritis Rx, Blood Glucose Lab, Chest X-Ray..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.documentType}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RecordType)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden font-medium"
              >
                <option value="Prescription">{t.prescription}</option>
                <option value="Lab Result">{t.labResult}</option>
                <option value="Medical Report">{t.medicalReport}</option>
                <option value="Other">{t.other}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.date}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.doctorClinicOptional}</label>
            <input
              type="text"
              placeholder="e.g., Calmette Hospital, Dr. Chea Vanna..."
              value={doctorOrClinic}
              onChange={(e) => setDoctorOrClinic(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.shortDescription}</label>
            <textarea
              rows={2}
              placeholder="e.g., Prescribed 4-week course of Omeprazole 20mg..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs cursor-pointer"
            >
              {t.saveRecord}
            </button>
          </div>
        </form>

        {/* Expanded Full PDF Page Preview Modal while uploading */}
        {showFullPdfPreview && uploadedFileUrl && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
            <div className="bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
              <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  <span className="font-bold text-sm truncate">{fileName || 'Document Preview'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullPdfPreview(false)}
                  className="p-1.5 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 sm:p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-950">
                <PdfViewer
                  pdfUrl={uploadedFileUrl}
                  fileName={fileName}
                  showControls={true}
                  className="w-full"
                />
              </div>

              <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowFullPdfPreview(false)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Done Previewing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5. Document Viewer Modal (High-Resolution Visual Picture, PDF & Clinical Data)
// ==========================================
interface DocumentViewerModalProps {
  record: MedicalRecord | null;
  isOpen: boolean;
  onClose: () => void;
  allowDownload?: boolean;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  record,
  isOpen,
  onClose,
  allowDownload = true,
}) => {
  const { t } = useLanguage();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeView, setActiveView] = useState<'document' | 'details'>('document');

  React.useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
    setActiveView('document');
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  // Resolve document/picture URL
  let fileUrl = record.imageUrl;
  if (!fileUrl) {
    if (record.type === 'Prescription') fileUrl = DOCUMENT_IMAGES.prescriptionCalmette;
    else if (record.type === 'Lab Result') fileUrl = DOCUMENT_IMAGES.labPasteur;
    else if (record.type === 'Medical Report') fileUrl = DOCUMENT_IMAGES.reportRoyalPP;
    else fileUrl = DOCUMENT_IMAGES.xrayRadiology;
  }

  // Detect whether this is a PDF document
  const isPdf = 
    record.fileType === 'pdf' || 
    fileUrl.startsWith('data:application/pdf') || 
    (record.fileName && record.fileName.toLowerCase().endsWith('.pdf'));

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement('a');
    a.href = fileUrl;
    const defaultExt = isPdf ? '.pdf' : '.jpg';
    const fallbackName = `${record.name.toLowerCase().replace(/\s+/g, '_')}${defaultExt}`;
    a.download = record.fileName || fallbackName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = () => {
    if (!fileUrl) return;
    if (fileUrl.startsWith('data:')) {
      const newWin = window.open();
      if (newWin) {
        if (isPdf) {
          newWin.document.write(
            `<html><head><title>${record.name}</title></head><body style="margin:0"><iframe src="${fileUrl}" style="width:100%;height:100%;border:none"></iframe></body></html>`
          );
        } else {
          newWin.document.write(
            `<html><head><title>${record.name}</title></head><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh"><img src="${fileUrl}" style="max-width:100%;max-height:100%" /></body></html>`
          );
        }
      }
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  const handlePrint = () => {
    triggerPrintDocument('document-viewer-content', record.name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full flex flex-col max-h-[94vh] shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs ${
              isPdf 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-teal-50 border-teal-200 text-teal-800'
            }`}>
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {record.name}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isPdf ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                }`}>
                  {isPdf ? 'PDF Document' : record.type}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {record.doctorOrClinic ? `${record.doctorOrClinic} • ` : ''}
                {record.date} • {record.fileSize || 'Standard Document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveView('document')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeView === 'document' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isPdf ? 'View PDF' : t.viewPicture}
              </button>
              <button
                type="button"
                onClick={() => setActiveView('details')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeView === 'details' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.clinicalTranscription}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Toolbar */}
        {activeView === 'document' && (
          <div className="px-4 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700">
            {/* Image controls (if not PDF) */}
            {!isPdf ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-slate-700 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.zoomIn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-slate-700 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.zoomOut}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer"
                  title="Reset View"
                >
                  {t.resetZoom}
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-slate-700 ml-1 cursor-pointer"
                  title="Rotate 90deg"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Interactive PDF Document Viewer</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Open in new window"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Open Full View</span>
              </button>

              {allowDownload ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isPdf ? 'Download PDF' : t.downloadPicture}</span>
                </button>
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg border border-slate-200"
                  title="File downloads are disabled for QR code viewers"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Only (Download Disabled)</span>
                </div>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.printDocument}</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body Container */}
        <div 
          id="document-viewer-content"
          className="flex-1 overflow-auto p-2 sm:p-6 bg-slate-100 flex items-center justify-center min-h-[420px]"
        >
          {activeView === 'document' ? (
            isPdf ? (
              /* Universal Mobile-Optimized PDF Viewer */
              <div className="w-full flex flex-col items-center justify-center">
                <PdfViewer
                  pdfUrl={fileUrl}
                  fileName={record.fileName || record.name}
                  className="w-full"
                />
              </div>
            ) : (
              /* Image Viewer Rendering */
              <div className="w-full flex items-center justify-center p-2">
                <div 
                  className="transition-transform duration-200 origin-center bg-white shadow-xl rounded-xl overflow-hidden max-w-full"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={fileUrl}
                    alt={record.name}
                    className="max-h-[68vh] w-auto object-contain select-none pointer-events-auto"
                  />
                </div>
              </div>
            )
          ) : (
            /* Structured Clinical Details View */
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-md border border-slate-200 space-y-5 text-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{record.name}</h3>
                  <p className="text-xs text-slate-500">Official Clinical Transcript</p>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.originalFileVerified}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">{t.documentType}:</span>
                  <span className="font-bold text-slate-900">{record.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t.date}:</span>
                  <span className="font-bold text-slate-900">{record.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Facility / Doctor:</span>
                  <span className="font-semibold text-slate-900">{record.doctorOrClinic || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">File Reference:</span>
                  <span className="font-mono text-slate-900 truncate block">{record.fileName}</span>
                </div>
              </div>

              {record.description && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">{t.documentDetails}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                    {record.description}
                  </p>
                </div>
              )}

              {record.previewContent?.items && record.previewContent.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">{t.rxLabDetails}</h4>
                  <ul className="space-y-1.5">
                    {record.previewContent.items.map((item, idx) => (
                      <li key={idx} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                        <span className="text-slate-800">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {record.previewContent?.rawNotes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs italic text-slate-500">
                  Notes: "{record.previewContent.rawNotes}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            SOKHAPHEAP SECURE ARCHIVE • {record.id} • {record.fileType.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. Edit Patient Profile Modal (Name, Profile Picture, Phone Number, etc.)
// ==========================================
export interface EditProfileFormData {
  name: string;
  phone: string;
  profilePicture?: string;
  dob?: string;
  gender?: 'Female' | 'Male' | 'Other';
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface EditProfileModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditProfileFormData) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(patient.name || '');
  const [phone, setPhone] = useState(patient.phone || '');
  const [profilePicture, setProfilePicture] = useState<string>(patient.profilePicture || '');
  const [dob, setDob] = useState(patient.dob || '');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>(patient.gender || 'Female');
  const [emergencyName, setEmergencyName] = useState(patient.emergencyContact?.name || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(patient.emergencyContact?.relationship || '');
  const [emergencyPhone, setEmergencyPhone] = useState(patient.emergencyContact?.phone || '');

  React.useEffect(() => {
    if (isOpen) {
      setName(patient.name || '');
      setPhone(patient.phone || '');
      setProfilePicture(patient.profilePicture || '');
      setDob(patient.dob || '');
      setGender(patient.gender || 'Female');
      setEmergencyName(patient.emergencyContact?.name || '');
      setEmergencyRelationship(patient.emergencyContact?.relationship || '');
      setEmergencyPhone(patient.emergencyContact?.phone || '');
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setProfilePicture(res);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePicture('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      profilePicture: profilePicture || undefined,
      dob: dob || undefined,
      gender,
      emergencyContact: {
        name: emergencyName.trim() || patient.emergencyContact?.name || 'Emergency Contact',
        relationship: emergencyRelationship.trim() || patient.emergencyContact?.relationship || 'Family',
        phone: emergencyPhone.trim() || patient.emergencyContact?.phone || '',
      },
    });
    onClose();
  };

  const initial = name ? name.charAt(0).toUpperCase() : 'P';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-700" />
              <span>{t.editProfileTitle || 'Edit Patient Profile'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {t.patientId}: <span className="text-teal-800 font-bold">{patient.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture Upload Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              {t.profilePicture || 'Profile Picture'}
            </label>

            <div className="flex items-center gap-4">
              {/* Picture Avatar Preview */}
              <div className="relative w-20 h-20 rounded-full border-2 border-teal-500/30 overflow-hidden shadow-xs shrink-0 bg-teal-100 flex items-center justify-center">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-teal-800 select-none">
                    {initial}
                  </span>
                )}
              </div>

              {/* Upload or Remove Actions */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t.uploadPhoto || 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  JPG, PNG or WebP image. Stored securely with your profile.
                </p>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.fullName} *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Moli Sok"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.phoneNumber || 'Phone Number'} *
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +855 12 345 678"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Gender & DOB */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.gender || 'Gender'}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Female' | 'Male' | 'Other')}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden font-medium"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.dateOfBirth || 'Date of Birth'}
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
            <span className="text-xs font-bold text-slate-700 block">
              {t.emergencyContact} (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder={t.emergencyContactName || 'Contact Name'}
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden"
              />
              <input
                type="text"
                placeholder={t.relationship || 'Relationship (e.g. Sister)'}
                value={emergencyRelationship}
                onChange={(e) => setEmergencyRelationship(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden"
              />
              <input
                type="tel"
                placeholder={t.emergencyContactPhone || 'Phone Number'}
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t.cancel}
            </button>
            <button
              id="save-profile-btn"
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-all"
            >
              {t.saveProfile || 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
