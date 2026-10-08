import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dpxpqhnrigdesrkhuvux.supabase.co',
  'sb_publishable_zmHPCLyjuH3yaGYVbKiBDw_DJ_mOmR4'
);

const tables = [
  'profiles',
  'villages',
  'notices',
  'projects',
  'fund_transactions',
  'contacts',
  'notifications',
  'complaints',
  'complaint_updates'
];

async function checkTable(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    if (error.code === '42P01') {
      console.log(`Table ${table}: NOT FOUND`);
    } else {
      console.log(`Table ${table}: RLS ENABLED - Policies WORKING (Select blocked: ${error.message})`);
    }
  } else {
    if (data.length === 0) {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const { error: insertError } = await supabase.from(table).insert([{ id: validUuid }]);
      
      if (insertError) {
        if (insertError.code === '42501') {
           console.log(`Table ${table}: RLS ENABLED - Policies WORKING (Select empty, Insert blocked by RLS)`);
        } else {
           console.log(`Table ${table}: RLS ENABLED (Select empty, Insert error: ${insertError.message})`);
        }
      } else {
         console.log(`Table ${table}: RLS DISABLED or policies too permissive`);
      }
    } else {
      console.log(`Table ${table}: RLS DISABLED (or allows anon read)`);
    }
  }
}

async function run() {
  for (const table of tables) {
    await checkTable(table);
  }
}

run();
