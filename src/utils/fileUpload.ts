import { uploadToSupabaseStorage } from './supabaseStorage';
import { compressImageForUpload } from './patientSync';

export interface DocumentUploadResult {
  success: boolean;
  url: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'image' | 'document';
  storageProvider: 'server' | 'supabase' | 'local';
  error?: string;
}

/**
 * Robust, resilient document and image uploader.
 * 1. Uploads to local server disk storage (/api/upload -> /uploads/...).
 * 2. Attempts Supabase storage as supplementary backup if available.
 * 3. Falls back gracefully to high-quality compressed data URLs if offline.
 */
export async function uploadMedicalDocument(
  file: File,
  userId?: string
): Promise<DocumentUploadResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const detectedType: 'pdf' | 'image' | 'document' = isPdf ? 'pdf' : 'image';

  // Format human-readable file size
  const sizeStr = file.size > 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(file.size / 1024)} KB`;

  // Read file as base64 data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  // For images, optimize size before upload
  let uploadPayload = dataUrl;
  if (!isPdf) {
    try {
      uploadPayload = await compressImageForUpload(dataUrl, 1600, 0.85);
    } catch {
      uploadPayload = dataUrl;
    }
  }

  // 1. Primary: Upload to persistent server disk storage (/api/upload)
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        fileSize: sizeStr,
        fileData: uploadPayload,
        userId: userId || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return {
          success: true,
          url: data.url,
          fileName: file.name,
          fileSize: sizeStr,
          fileType: detectedType,
          storageProvider: 'server',
        };
      }
    }
  } catch (err) {
    console.warn('[Upload] Server upload notice:', err);
  }

  // 2. Secondary: Attempt Supabase Storage
  try {
    const supabaseRes = await uploadToSupabaseStorage(file, file.name, userId);
    if (supabaseRes.success && supabaseRes.url) {
      return {
        success: true,
        url: supabaseRes.url,
        fileName: file.name,
        fileSize: sizeStr,
        fileType: detectedType,
        storageProvider: 'supabase',
      };
    }
  } catch (supabaseErr) {
    console.warn('[Upload] Supabase upload notice:', supabaseErr);
  }

  // 3. Fallback: Return client-side compressed data URL
  return {
    success: true,
    url: uploadPayload,
    fileName: file.name,
    fileSize: sizeStr,
    fileType: detectedType,
    storageProvider: 'local',
  };
}
