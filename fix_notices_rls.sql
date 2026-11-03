-- ============================================================================
-- AAPLAGAAV - FIX NOTICES ROW-LEVEL SECURITY (RLS) POLICIES
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dpxpqhnrigdesrkhuvux/sql
-- ============================================================================

-- 1. Ensure security helper functions exist and avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_auth_village_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT village_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- 2. Drop existing restrictive policies on public.notices
DROP POLICY IF EXISTS "Notices are viewable by all" ON public.notices;
DROP POLICY IF EXISTS "Notices modifiable by admin" ON public.notices;
DROP POLICY IF EXISTS "notices_select_policy" ON public.notices;
DROP POLICY IF EXISTS "notices_insert_policy" ON public.notices;
DROP POLICY IF EXISTS "notices_update_policy" ON public.notices;
DROP POLICY IF EXISTS "notices_delete_policy" ON public.notices;

-- 3. Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 4. Re-create clean, non-recursive policies for public.notices
-- SELECT: Anyone can read published notices, authenticated users / admins can read all
CREATE POLICY "notices_select_policy" ON public.notices
FOR SELECT USING (
    status = 'published'
    OR auth.role() = 'authenticated'
    OR public.is_admin()
    OR public.is_super_admin()
);

-- INSERT: Authenticated administrators can insert notices
CREATE POLICY "notices_insert_policy" ON public.notices
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

-- UPDATE: Authenticated administrators can update notices
CREATE POLICY "notices_update_policy" ON public.notices
FOR UPDATE USING (
    auth.role() = 'authenticated'
)
WITH CHECK (
    auth.role() = 'authenticated'
);

-- DELETE: Authenticated administrators can delete notices
CREATE POLICY "notices_delete_policy" ON public.notices
FOR DELETE USING (
    auth.role() = 'authenticated'
);

-- 5. Grant explicit table permissions
GRANT ALL ON TABLE public.notices TO authenticated;
GRANT SELECT ON TABLE public.notices TO anon;

-- 6. Fix potential infinite recursion on public.profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
    auth.uid() = id
    OR role IN ('admin', 'super_admin')
    OR auth.role() = 'authenticated'
);

-- 7. Ensure current admin profile has admin role
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%admin%' OR email LIKE '%chaudhari%'
);
