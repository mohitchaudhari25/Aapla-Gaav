import { supabase } from './lib/supabase.js';

async function testConnection() {
  try {
    console.log("Testing Supabase connection...");
    // A safe test without Auth/tables is to just query something or check session
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection error:', error.message);
      process.exit(1);
    } else {
      console.log('Supabase connected successfully!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

testConnection();
