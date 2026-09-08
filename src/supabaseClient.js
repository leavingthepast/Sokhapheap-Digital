import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bzmulqaarhwcnazkzdev.supabase.co/rest/v1/";
const SUPABASE_PUBLIC_KEY = "sb_publishable_um2MPkk1hTPtztcUif2Log_rWzZLyhw";

// Normalize URL to base project URL if /rest/v1 suffix is present
const normalizedUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(normalizedUrl || SUPABASE_URL, SUPABASE_PUBLIC_KEY);

export { SUPABASE_URL, SUPABASE_PUBLIC_KEY };
export default supabase;
