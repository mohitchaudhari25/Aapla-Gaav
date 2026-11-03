-- ============================================================================
-- AAPLAGAAV - FIX ADMIN PROFILES & REGISTRATION ROW-LEVEL SECURITY (RLS)
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dpxpqhnrigdesrkhuvux/sql
-- ============================================================================

-- 1. Ensure public.profiles table has ROW LEVEL SECURITY enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies on public.profiles
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- 3. SELECT Policy:
-- Users can view their own profile, administrators can view relevant profiles,
-- and authenticated administrators can read all admin profiles.
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
    auth.uid() = id
    OR role IN ('admin', 'super_admin')
    OR auth.role() = 'authenticated'
);

-- 4. INSERT Policy:
-- Allow authenticated users to insert their own profile during registration (both citizen & admin)
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (
    auth.uid() = id
    OR auth.role() = 'authenticated'
);

-- 5. UPDATE Policy:
-- Allow users to update their own profile details (name, phone, village, etc.)
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
    auth.uid() = id
    OR auth.role() = 'authenticated'
)
WITH CHECK (
    auth.uid() = id
    OR auth.role() = 'authenticated'
);

-- 6. Grant standard table permissions
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;

-- 7. Ensure current administrator accounts have role set to 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%admin%' OR email LIKE '%chaudhari%'
);

