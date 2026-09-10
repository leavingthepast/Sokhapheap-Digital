import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
export const SUPABASE_URL = 'https://bzmulqaarhwcnazkzdev.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bXVscWFhcmh3Y25hemt6ZGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NTQyNjIsImV4cCI6MjEwNDQzMDI2Mn0.I9_Wptt5o6ZuSSMydMmsHOdmgVED5z40arHhKzhS-wE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export { SUPABASE_ANON_KEY as SUPABASE_PUBLIC_KEY };
export default supabase;
