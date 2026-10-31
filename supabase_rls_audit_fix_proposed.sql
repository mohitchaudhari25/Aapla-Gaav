-- ============================================================================
-- AaplaGaav Digital Village Governance System
-- PROPOSED COMPREHENSIVE RLS SECURITY AUDIT & CORRECTION MIGRATION
-- File: supabase_rls_audit_fix_proposed.sql
-- Status: PROPOSED (READ-ONLY AUDIT PENDING USER APPROVAL)
-- ============================================================================
-- Purpose:
--   1. Resolve notice creation RLS permission errors.
--   2. Eliminate recursive RLS loops on public.profiles.
--   3. Prevent citizen privilege escalation (role spoofing / role modification).
--   4. Enforce strict village-level multi-tenancy & cross-village isolation.
--   5. Fix missing policies (INSERT, UPDATE, DELETE) across all 9 tables.
--   6. Standardize least-privilege access using secure SECURITY DEFINER helpers.
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING LEGACY POLICIES (CLEAN SLATE)
-- ============================================================================

-- Villages
DROP POLICY IF EXISTS "Villages are viewable by everyone" ON public.villages;
DROP POLICY IF EXISTS "Villages are modifiable by admins" ON public.villages;
DROP POLICY IF EXISTS "villages_select_policy" ON public.villages;
DROP POLICY IF EXISTS "villages_insert_policy" ON public.villages;
DROP POLICY IF EXISTS "villages_update_policy" ON public.villages;
DROP POLICY IF EXISTS "villages_delete_policy" ON public.villages;

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Complaints
DROP POLICY IF EXISTS "Citizens view own complaints or admin view all" ON public.complaints;
DROP POLICY IF EXISTS "Citizens can file new complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON public.complaints;
DROP POLICY IF EXISTS "complaints_select_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_insert_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_update_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_delete_policy" ON public.complaints;

-- Complaint Updates
DROP POLICY IF EXISTS "View complaint updates" ON public.complaint_updates;
DROP POLICY IF EXISTS "Admins can insert complaint updates" ON public.complaint_updates;
DROP POLICY IF EXISTS "complaint_updates_select_policy" ON public.complaint_updates;
DROP POLICY IF EXISTS "complaint_updates_insert_policy" ON public.complaint_updates;
DROP POLICY IF EXISTS "complaint_updates_update_policy" ON public.complaint_updates;
DROP POLICY IF EXISTS "complaint_updates_delete_policy" ON public.complaint_updates;

-- Notices
DROP POLICY IF EXISTS "Notices are viewable by all" ON public.notices;
DROP POLICY IF EXISTS "Notices modifiable by admin" ON public.notices;
DROP POLICY IF EXISTS "notices_select_policy" ON public.notices;
DROP POLICY IF EXISTS "notices_insert_policy" ON public.notices;
DROP POLICY IF EXISTS "notices_update_policy" ON public.notices;
DROP POLICY IF EXISTS "notices_delete_policy" ON public.notices;

-- Projects
DROP POLICY IF EXISTS "Projects are viewable by all" ON public.projects;
DROP POLICY IF EXISTS "Projects modifiable by admin" ON public.projects;
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;

-- Fund Transactions
DROP POLICY IF EXISTS "Funds are viewable by all" ON public.fund_transactions;
DROP POLICY IF EXISTS "Funds modifiable by admin" ON public.fund_transactions;
DROP POLICY IF EXISTS "funds_select_policy" ON public.fund_transactions;
DROP POLICY IF EXISTS "funds_insert_policy" ON public.fund_transactions;
DROP POLICY IF EXISTS "funds_update_policy" ON public.fund_transactions;
DROP POLICY IF EXISTS "funds_delete_policy" ON public.fund_transactions;

-- Contacts
DROP POLICY IF EXISTS "Contacts are viewable by all" ON public.contacts;
DROP POLICY IF EXISTS "Contacts modifiable by admin" ON public.contacts;
DROP POLICY IF EXISTS "contacts_select_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete_policy" ON public.contacts;

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

-- ============================================================================
-- STEP 2: SECURITY DEFINER ACCESS CONTROL & ANTI-RECURSION HELPER FUNCTIONS
-- ============================================================================
-- Note: These functions bypass RLS recursion on public.profiles and run in
-- trusted context with explicit SET search_path = public.

-- 1. Extract role of authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role, 'citizen');
END;
$$;

COMMENT ON FUNCTION public.get_auth_role() IS 'Safely extracts current authenticated user role without RLS recursion.';

-- 2. Extract authorized village_id of authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_village_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT village_id INTO v_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.get_auth_village_id() IS 'Safely extracts current authenticated user village_id without RLS recursion.';

-- 3. Check if authenticated user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if user has admin or super_admin role.';

-- 4. Check if authenticated user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$;

COMMENT ON FUNCTION public.is_super_admin() IS 'Returns true if user has super_admin role.';

-- 5. Check if user is an admin authorized for the village of a specific target user
CREATE OR REPLACE FUNCTION public.is_admin_for_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    admin_v_id UUID;
    target_v_id UUID;
BEGIN
    IF public.is_super_admin() THEN
        RETURN true;
    END IF;

    IF NOT public.is_admin() THEN
        RETURN false;
    END IF;

    SELECT village_id INTO admin_v_id FROM public.profiles WHERE id = auth.uid();
    SELECT village_id INTO target_v_id FROM public.profiles WHERE id = target_user_id;

    IF admin_v_id IS NOT NULL AND target_v_id IS NOT NULL AND admin_v_id = target_v_id THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

COMMENT ON FUNCTION public.is_admin_for_user(UUID) IS 'Verifies if authenticated admin belongs to same village as target citizen.';

-- 6. Check if user can access a specific complaint (as owner citizen or authorized village admin)
CREATE OR REPLACE FUNCTION public.can_access_complaint(target_complaint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    complaint_user_id UUID;
BEGIN
    SELECT user_id INTO complaint_user_id
    FROM public.complaints
    WHERE id = target_complaint_id;

    IF complaint_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Owner citizen can access
    IF auth.uid() = complaint_user_id THEN
        RETURN true;
    END IF;

    -- Authorized village admin or super_admin
    RETURN public.is_admin_for_user(complaint_user_id);
END;
$$;

COMMENT ON FUNCTION public.can_access_complaint(UUID) IS 'Verifies complaint ownership or village admin authorization.';

-- ============================================================================
-- STEP 3: DATABASE INTEGRITY TRIGGERS (ROLE TAMPERING & AUTO-VILLAGE ASSIGNMENT)
-- ============================================================================

-- 1. Anti-Privilege Escalation Trigger on Profiles
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Prevent unauthorized role changes
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Privilege escalation violation: Only super_admin accounts may alter user roles.';
        END IF;
    END IF;

    -- Prevent administrators from reassigning their own village
    IF NEW.village_id IS DISTINCT FROM OLD.village_id THEN
        IF public.get_auth_role() = 'admin' AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Multi-tenancy violation: Village administrators cannot reassign their own authorized village.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- 2. Auto-Populate village_id on Insert when omitted by Frontend
CREATE OR REPLACE FUNCTION public.set_default_village_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If village_id was omitted in insert payload, inherit from creator's authorized village
    IF NEW.village_id IS NULL THEN
        NEW.village_id := public.get_auth_village_id();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notices_set_village_id ON public.notices;
CREATE TRIGGER trg_notices_set_village_id
BEFORE INSERT ON public.notices
FOR EACH ROW EXECUTE FUNCTION public.set_default_village_id();

DROP TRIGGER IF EXISTS trg_projects_set_village_id ON public.projects;
CREATE TRIGGER trg_projects_set_village_id
BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_default_village_id();

DROP TRIGGER IF EXISTS trg_funds_set_village_id ON public.fund_transactions;
CREATE TRIGGER trg_funds_set_village_id
BEFORE INSERT ON public.fund_transactions
FOR EACH ROW EXECUTE FUNCTION public.set_default_village_id();

DROP TRIGGER IF EXISTS trg_contacts_set_village_id ON public.contacts;
CREATE TRIGGER trg_contacts_set_village_id
BEFORE INSERT ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.set_default_village_id();

-- 3. Hardened updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: STRICT ROW LEVEL SECURITY (RLS) POLICIES FOR ALL 9 TABLES
-- ============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- TABLE 1: VILLAGES
-- ----------------------------------------------------------------------------
-- SELECT: Public read (needed for onboarding & village selection)
CREATE POLICY "villages_select_policy" ON public.villages
FOR SELECT USING (true);

-- INSERT: Super Admin only
CREATE POLICY "villages_insert_policy" ON public.villages
FOR INSERT WITH CHECK (
    public.is_super_admin()
);

-- UPDATE: Admin for own village, or Super Admin
CREATE POLICY "villages_update_policy" ON public.villages
FOR UPDATE USING (
    public.is_super_admin() OR (public.is_admin() AND id = public.get_auth_village_id())
)
WITH CHECK (
    public.is_super_admin() OR (public.is_admin() AND id = public.get_auth_village_id())
);

-- DELETE: Super Admin only
CREATE POLICY "villages_delete_policy" ON public.villages
FOR DELETE USING (
    public.is_super_admin()
);

-- ----------------------------------------------------------------------------
-- TABLE 2: PROFILES
-- ----------------------------------------------------------------------------
-- SELECT:
-- 1. Users can always read their own profile.
-- 2. Village admins can read citizen profiles belonging to their authorized village.
-- 3. Super admin can read all profiles.
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
    auth.uid() = id
    OR public.is_super_admin()
    OR (
        public.is_admin()
        AND village_id = public.get_auth_village_id()
        AND role = 'citizen'
    )
);

-- INSERT:
-- Users can only insert their own profile and CANNOT self-assign admin/super_admin role.
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
        auth.uid() = id
        AND (role IS NULL OR role = 'citizen')
    )
);

-- UPDATE:
-- Users can update own profile, but cannot change role (enforced via RLS + trigger).
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
    auth.uid() = id OR public.is_super_admin()
)
WITH CHECK (
    public.is_super_admin()
    OR (
        auth.uid() = id
        AND role = public.get_auth_role()
    )
);

-- DELETE: Super Admin only
CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE USING (
    public.is_super_admin()
);

-- ----------------------------------------------------------------------------
-- TABLE 3: COMPLAINTS
-- ----------------------------------------------------------------------------
-- SELECT:
-- 1. Citizen views own filed complaints.
-- 2. Village admin views complaints filed by citizens in their authorized village.
-- 3. Super admin views all complaints.
CREATE POLICY "complaints_select_policy" ON public.complaints
FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin_for_user(user_id)
);

-- INSERT:
-- Citizens can file complaints only for themselves.
CREATE POLICY "complaints_insert_policy" ON public.complaints
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- UPDATE:
-- Authorized village admin or super_admin can update status/remarks.
CREATE POLICY "complaints_update_policy" ON public.complaints
FOR UPDATE USING (
    public.is_admin_for_user(user_id)
)
WITH CHECK (
    public.is_admin_for_user(user_id)
);

-- DELETE: Super Admin only (immutable audit integrity)
CREATE POLICY "complaints_delete_policy" ON public.complaints
FOR DELETE USING (
    public.is_super_admin()
);

-- ----------------------------------------------------------------------------
-- TABLE 4: COMPLAINT_UPDATES
-- ----------------------------------------------------------------------------
-- SELECT:
-- Citizen if complaint is theirs; authorized village admin; super_admin.
CREATE POLICY "complaint_updates_select_policy" ON public.complaint_updates
FOR SELECT USING (
    public.can_access_complaint(complaint_id)
);

-- INSERT:
-- Authorized village admin or super_admin only.
CREATE POLICY "complaint_updates_insert_policy" ON public.complaint_updates
FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND public.can_access_complaint(complaint_id)
    )
);

-- UPDATE & DELETE: Immutable audit logs; Super Admin only for cleanup
CREATE POLICY "complaint_updates_delete_policy" ON public.complaint_updates
FOR DELETE USING (
    public.is_super_admin()
);

-- ----------------------------------------------------------------------------
-- TABLE 5: NOTICES
-- ----------------------------------------------------------------------------
-- SELECT:
-- 1. Super admin views all.
-- 2. Admin views all notices for their authorized village.
-- 3. Citizens view published notices for their village (or system-wide notices).
CREATE POLICY "notices_select_policy" ON public.notices
FOR SELECT USING (
    public.is_super_admin()
    OR (
        public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)
    )
    OR (
        status = 'published' AND (
            village_id = public.get_auth_village_id()
            OR village_id IS NULL
            OR auth.uid() IS NULL -- allows public display of published notices
        )
    )
);

-- INSERT:
-- Authorized village admin (for their village) or super_admin.
CREATE POLICY "notices_insert_policy" ON public.notices
FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)
    )
);

-- UPDATE:
-- Authorized village admin or super_admin.
CREATE POLICY "notices_update_policy" ON public.notices
FOR UPDATE USING (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
)
WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
);

-- DELETE:
-- Authorized village admin or super_admin.
CREATE POLICY "notices_delete_policy" ON public.notices
FOR DELETE USING (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
);

-- ----------------------------------------------------------------------------
-- TABLE 6: PROJECTS
-- ----------------------------------------------------------------------------
-- SELECT:
-- Citizens and Admins view projects in their village; super_admin views all.
CREATE POLICY "projects_select_policy" ON public.projects
FOR SELECT USING (
    public.is_super_admin()
    OR village_id = public.get_auth_village_id()
    OR village_id IS NULL
);

-- INSERT:
CREATE POLICY "projects_insert_policy" ON public.projects
FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)
    )
);

-- UPDATE:
CREATE POLICY "projects_update_policy" ON public.projects
FOR UPDATE USING (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
)
WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
);

-- DELETE:
CREATE POLICY "projects_delete_policy" ON public.projects
FOR DELETE USING (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
);

-- ----------------------------------------------------------------------------
-- TABLE 7: FUND_TRANSACTIONS
-- ----------------------------------------------------------------------------
-- SELECT:
-- Citizens & Admins view funds for their village; super_admin views all.
CREATE POLICY "funds_select_policy" ON public.fund_transactions
FOR SELECT USING (
    public.is_super_admin()
    OR village_id = public.get_auth_village_id()
);

-- INSERT:
CREATE POLICY "funds_insert_policy" ON public.fund_transactions
FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)
    )
);

-- UPDATE:
CREATE POLICY "funds_update_policy" ON public.fund_transactions
FOR UPDATE USING (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
)
WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
);

-- DELETE: Super Admin only (financial ledger audit safety)
CREATE POLICY "funds_delete_policy" ON public.fund_transactions
FOR DELETE USING (
    public.is_super_admin()
);

-- ----------------------------------------------------------------------------
-- TABLE 8: CONTACTS
-- ----------------------------------------------------------------------------
-- SELECT:
-- Emergency contacts viewable by everyone; village contacts viewable by village users.
CREATE POLICY "contacts_select_policy" ON public.contacts
FOR SELECT USING (
    type = 'emergency'
    OR public.is_super_admin()
    OR village_id = public.get_auth_village_id()
);

-- INSERT:
CREATE POLICY "contacts_insert_policy" ON public.contacts
FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)
    )
);

-- UPDATE:
CREATE POLICY "contacts_update_policy" ON public.contacts
FOR UPDATE USING (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
)
WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
);

-- DELETE:
CREATE POLICY "contacts_delete_policy" ON public.contacts
FOR DELETE USING (
    public.is_super_admin()
    OR (
        public.is_admin() AND village_id = public.get_auth_village_id()
    )
);

-- ----------------------------------------------------------------------------
-- TABLE 9: NOTIFICATIONS
-- ----------------------------------------------------------------------------
-- SELECT:
-- Recipients view only their own notifications.
CREATE POLICY "notifications_select_policy" ON public.notifications
FOR SELECT USING (
    auth.uid() = user_id
);

-- INSERT:
-- Village admins can insert notifications for citizens in their village; super_admin for all.
CREATE POLICY "notifications_insert_policy" ON public.notifications
FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
        public.is_admin() AND public.is_admin_for_user(user_id)
    )
);

-- UPDATE:
-- Users can update only their own notifications (e.g., mark as read).
CREATE POLICY "notifications_update_policy" ON public.notifications
FOR UPDATE USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- DELETE:
-- Users can delete their own notifications; super_admin can clean up.
CREATE POLICY "notifications_delete_policy" ON public.notifications
FOR DELETE USING (
    auth.uid() = user_id
    OR public.is_super_admin()
);

-- ============================================================================
-- END OF PROPOSED MIGRATION
-- ============================================================================

