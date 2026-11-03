import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dpxpqhnrigdesrkhuvux.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zmHPCLyjuH3yaGYVbKiBDw_DJ_mOmR4';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase configuration is missing in .env. Falling back to default project endpoints.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
