const { createClient } = require('@supabase/supabase-js');

// We use the anon key here for verifying JWTs from clients.
// We do NOT use the service_role key in this phase per requirements.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;
