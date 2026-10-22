import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// This is a browser-safe publishable key. RLS is the security boundary.
// Never expose a Supabase secret/service-role key in any VITE_ variable.
export const supabase = url && publishableKey
  ? createClient(url, publishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : null;
export const supabaseConfigured = Boolean(supabase);
