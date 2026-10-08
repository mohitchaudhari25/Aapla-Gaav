import { supabase } from './lib/supabase.js';

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_rate_limit_023@example.com',
    password: 'password123'
  });
  if (error) {
    console.error('EXACT ERROR:', error.message, 'STATUS:', error.status, 'CODE:', error.code);
  } else {
    console.log('SIGNUP SUCCESS:', !!data.user);
  }
}

run();
