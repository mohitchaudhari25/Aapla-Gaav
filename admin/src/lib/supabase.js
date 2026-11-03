import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dpxpqhnrigdesrkhuvux.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zmHPCLyjuH3yaGYVbKiBDw_DJ_mOmR4';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing in admin/.env. Falling back to project defaults.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
