-- ============================================================================
-- AaplaGaav Project — Complete Database Schema (schema.sql)
-- Supabase PostgreSQL Database Definition
-- Academic Project: SYBCA
-- Description: Smart Village Governance, Citizen Grievance Redressal,
--              Public Notices, Development Projects, and Fund Transparency
-- ============================================================================

-- Enable pgcrypto / uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. VILLAGES (Gram Panchayat Master Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    gram_panchayat VARCHAR(255),
    taluka VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Maharashtra',
    population VARCHAR(50),
    families VARCHAR(50),
    houses VARCHAR(50),
    area VARCHAR(50),
    office_name VARCHAR(255),
    timings VARCHAR(100),
    weekly_off VARCHAR(50) DEFAULT 'रविवार',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.villages IS 'Master directory of Gram Panchayats with demographics and administrative office hours.';

-- ============================================================================
-- 2. PROFILES (Citizen & Administrator User Profiles linked to auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'super_admin')),
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Extended citizen and administrator profile data linked directly to Supabase Auth.';

-- ============================================================================
-- 3. COMPLAINTS (Citizen Grievance Dossier)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'प्राप्त' CHECK (status IN ('प्राप्त', 'प्रक्रियेत', 'सोडवले', 'नाकारले')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.complaints IS 'Citizen grievances. Category and location are encoded into description tags [प्रकार: ...] [ठिकाण: ...].';

-- ============================================================================
-- 4. COMPLAINT_UPDATES (Audit Trail & Timeline History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.complaint_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    new_status VARCHAR(50) NOT NULL,
    update_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.complaint_updates IS 'Immutable timeline logs recording administrator status updates and remarks for grievances.';

-- ============================================================================
-- 5. NOTICES (Public Circulars & Announcements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.notices IS 'Official Gram Panchayat circulars, Gram Sabha notices, and public announcements.';

-- ============================================================================
-- 6. PROJECTS (Village Development Works & Expenditure Progress)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'नियोजित' CHECK (status IN ('नियोजित', 'चालू', 'पूर्ण', 'प्रलंबित')),
    budget NUMERIC(15, 2),
    amount_spent NUMERIC(15, 2) DEFAULT 0.00,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.projects IS 'Village infrastructure works with budget allocation, expenditure, and completion percentages.';

-- ============================================================================
-- 7. FUND_TRANSACTIONS (Gram Panchayat Revenue & Expenditure Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.fund_transactions IS 'Financial transparency ledger recording state grants, tax collections, and expenditures.';

-- ============================================================================
-- 8. CONTACTS (Staff & Emergency Telephone Directory)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    type VARCHAR(50) DEFAULT 'village' CHECK (type IN ('village', 'emergency')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.contacts IS 'Key village representatives (Sarpanch, Gram Sevak) and emergency contact numbers.';

-- ============================================================================
-- 9. NOTIFICATIONS (Citizen In-App Alerts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'complaint', 'notice', 'project')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'Push and in-app alert notifications for citizens regarding complaints, notices, and village works.';

-- ============================================================================
-- 10. INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_village ON public.profiles(village_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_complaints_user ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_updates_complaint ON public.complaint_updates(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notices_village ON public.notices(village_id);
CREATE INDEX IF NOT EXISTS idx_projects_village ON public.projects(village_id);
CREATE INDEX IF NOT EXISTS idx_funds_village ON public.fund_transactions(village_id);
CREATE INDEX IF NOT EXISTS idx_contacts_village ON public.contacts(village_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ============================================================================
-- 11. AUTOMATED UPDATED_AT TIMESTAMP TRIGGER
-- ============================================================================
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

DROP TRIGGER IF EXISTS trg_villages_updated_at ON public.villages;
CREATE TRIGGER trg_villages_updated_at
BEFORE UPDATE ON public.villages
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_complaints_updated_at ON public.complaints;
CREATE TRIGGER trg_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_notices_updated_at ON public.notices;
CREATE TRIGGER trg_notices_updated_at
BEFORE UPDATE ON public.notices
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 12. SECURITY DEFINER ACCESS CONTROL & ANTI-RECURSION HELPER FUNCTIONS
-- ============================================================================

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

    IF auth.uid() = complaint_user_id THEN
        RETURN true;
    END IF;

    RETURN public.is_admin_for_user(complaint_user_id);
END;
$$;

-- Triggers for privilege escalation protection & auto village assignment
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Privilege escalation violation: Only super_admin accounts may alter user roles.';
        END IF;
    END IF;

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

CREATE OR REPLACE FUNCTION public.set_default_village_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- ============================================================================
-- 13. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Villages
CREATE POLICY "villages_select_policy" ON public.villages FOR SELECT USING (true);
CREATE POLICY "villages_insert_policy" ON public.villages FOR INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY "villages_update_policy" ON public.villages FOR UPDATE
    USING (public.is_super_admin() OR (public.is_admin() AND id = public.get_auth_village_id()))
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND id = public.get_auth_village_id()));
CREATE POLICY "villages_delete_policy" ON public.villages FOR DELETE USING (public.is_super_admin());

-- 2. Profiles
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id() AND role = 'citizen'));
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT
    WITH CHECK (public.is_super_admin() OR (auth.uid() = id AND (role IS NULL OR role = 'citizen')));
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_super_admin())
    WITH CHECK (public.is_super_admin() OR (auth.uid() = id AND role = public.get_auth_role()));
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE USING (public.is_super_admin());

-- 3. Complaints
CREATE POLICY "complaints_select_policy" ON public.complaints FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin_for_user(user_id));
CREATE POLICY "complaints_insert_policy" ON public.complaints FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "complaints_update_policy" ON public.complaints FOR UPDATE
    USING (public.is_admin_for_user(user_id))
    WITH CHECK (public.is_admin_for_user(user_id));
CREATE POLICY "complaints_delete_policy" ON public.complaints FOR DELETE USING (public.is_super_admin());

-- 4. Complaint Updates
CREATE POLICY "complaint_updates_select_policy" ON public.complaint_updates FOR SELECT
    USING (public.can_access_complaint(complaint_id));
CREATE POLICY "complaint_updates_insert_policy" ON public.complaint_updates FOR INSERT
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND public.can_access_complaint(complaint_id)));
CREATE POLICY "complaint_updates_delete_policy" ON public.complaint_updates FOR DELETE USING (public.is_super_admin());

-- 5. Notices
CREATE POLICY "notices_select_policy" ON public.notices FOR SELECT
    USING (public.is_super_admin() OR (public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)) OR (status = 'published' AND (village_id = public.get_auth_village_id() OR village_id IS NULL OR auth.uid() IS NULL)));
CREATE POLICY "notices_insert_policy" ON public.notices FOR INSERT
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)));
CREATE POLICY "notices_update_policy" ON public.notices FOR UPDATE
    USING (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()))
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()));
CREATE POLICY "notices_delete_policy" ON public.notices FOR DELETE
    USING (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()));

-- 6. Projects
CREATE POLICY "projects_select_policy" ON public.projects FOR SELECT
    USING (public.is_super_admin() OR village_id = public.get_auth_village_id() OR village_id IS NULL);
CREATE POLICY "projects_insert_policy" ON public.projects FOR INSERT
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)));
CREATE POLICY "projects_update_policy" ON public.projects FOR UPDATE
    USING (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()))
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()));
CREATE POLICY "projects_delete_policy" ON public.projects FOR DELETE
    USING (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()));

-- 7. Fund Transactions
CREATE POLICY "funds_select_policy" ON public.fund_transactions FOR SELECT
    USING (public.is_super_admin() OR village_id = public.get_auth_village_id());
CREATE POLICY "funds_insert_policy" ON public.fund_transactions FOR INSERT
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)));
CREATE POLICY "funds_update_policy" ON public.fund_transactions FOR UPDATE
    USING (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()))
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()));
CREATE POLICY "funds_delete_policy" ON public.fund_transactions FOR DELETE USING (public.is_super_admin());

-- 8. Contacts
CREATE POLICY "contacts_select_policy" ON public.contacts FOR SELECT
    USING (type = 'emergency' OR public.is_super_admin() OR village_id = public.get_auth_village_id());
CREATE POLICY "contacts_insert_policy" ON public.contacts FOR INSERT
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND (village_id = public.get_auth_village_id() OR village_id IS NULL)));
CREATE POLICY "contacts_update_policy" ON public.contacts FOR UPDATE
    USING (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()))
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()));
CREATE POLICY "contacts_delete_policy" ON public.contacts FOR DELETE
    USING (public.is_super_admin() OR (public.is_admin() AND village_id = public.get_auth_village_id()));

-- 9. Notifications
CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT
    WITH CHECK (public.is_super_admin() OR (public.is_admin() AND public.is_admin_for_user(user_id)));
CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE
    USING (auth.uid() = user_id OR public.is_super_admin());

-- ============================================================================
-- 13. SEED DATA (Demo Village & Baseline Configurations)
-- ============================================================================
INSERT INTO public.villages (
    id, name, gram_panchayat, taluka, district, state,
    population, families, houses, area, office_name, timings, weekly_off
) VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'शिवाजीनगर',
    'शिवाजीनगर ग्रामपंचायत',
    'हवेली',
    'पुणे',
    'महाराष्ट्र',
    '५,२००',
    '१,१००',
    '९५०',
    '१२ चौरस किमी',
    'ग्रामपंचायत कार्यालय, शिवाजीनगर',
    'सकाळी १०:०० ते संध्याकाळी ५:००',
    'रविवार'
) ON CONFLICT (id) DO NOTHING;

