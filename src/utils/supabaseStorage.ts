import { supabase } from '../supabaseClient';

export const PRIMARY_STORAGE_BUCKET = 'app.files';
export const FALLBACK_STORAGE_BUCKET = 'app-files';

export interface UploadResult {
  success: boolean;
  url: string;
  storagePath?: string;
  bucket?: string;
  error?: string;
}

/**
 * Uploads a file or image to the user's secure Supabase Storage folder.
 * Matches RLS policy: name like auth.uid()::text || '/%'
 */
export async function uploadToSupabaseStorage(
  file: File | Blob,
  fileName?: string
): Promise<UploadResult> {
  try {
    // 1. Get authenticated user ID for the folder path required by RLS
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      console.warn('User not authenticated with Supabase session. Uploading with anonymous fallback.');
    }

    const folder = userId || 'public';
    const originalName = fileName || (file instanceof File ? file.name : 'document');
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePath = `${folder}/${Date.now()}-${safeName}`;

    // 2. Try primary bucket ('app.files'), fallback to ('app-files')
    const bucketsToTry = [PRIMARY_STORAGE_BUCKET, FALLBACK_STORAGE_BUCKET];
    let lastError: any = null;

    for (const bucket of bucketsToTry) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(uniquePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!error && data) {
          // Successfully uploaded to Supabase Storage!
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(uniquePath);

          const publicUrl = urlData.publicUrl;
          console.log(`[Supabase Storage] Successfully uploaded to ${bucket}/${uniquePath}`);

          return {
            success: true,
            url: publicUrl,
            storagePath: uniquePath,
            bucket,
          };
        }

        lastError = error;
        // If error is bucket not found, continue to fallback bucket
        if (error && (error.message?.includes('not found') || (error as any).statusCode === '404')) {
          continue;
        }
      } catch (err) {
        lastError = err;
      }
    }

    console.warn('[Supabase Storage] Upload error:', lastError?.message || lastError);
    return {
      success: false,
      url: '',
      error: lastError?.message || 'Failed to upload to Supabase storage bucket',
    };
  } catch (err: any) {
    console.error('[Supabase Storage] Unexpected error:', err);
    return {
      success: false,
      url: '',
      error: err?.message || 'Unexpected upload error',
    };
  }
}
