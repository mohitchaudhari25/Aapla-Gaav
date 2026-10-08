import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dpxpqhnrigdesrkhuvux.supabase.co',
  'sb_publishable_zmHPCLyjuH3yaGYVbKiBDw_DJ_mOmR4'
);

async function run() {
  const { data, error } = await supabase.from('complaints').insert([{ user_id: '123e4567-e89b-12d3-a456-426614174000', title: 't', description: 'desc', status: 'प्राप्त' }]);
  console.log("Error:", JSON.stringify(error, null, 2));
}

run();
