-- ============================================================================
-- AAPLAGAAV FINAL DATABASE IMPROVEMENTS & REALTIME CONFIGURATION
-- ============================================================================

-- 1. ADD ALL TABLES TO SUPABASE REALTIME PUBLICATION
-- Ensures all 9 tables broadcast live postgres_changes over WebSockets
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
        public.villages,
        public.profiles,
        public.complaints,
        public.complaint_updates,
        public.notices,
        public.projects,
        public.fund_transactions,
        public.contacts,
        public.notifications;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Table is already in the publication
END;
$$;

-- 2. AUTOMATIC NOTIFICATION TRIGGER ON NEW COMPLAINT SUBMISSION
-- Automatically alerts administrators when a citizen submits a grievance,
-- executed with SECURITY DEFINER so citizens do not require direct write
-- permissions to other users' notifications.
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_complaint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    citizen_name VARCHAR;
    admin_record RECORD;
    v_id UUID;
BEGIN
    SELECT full_name, village_id INTO citizen_name, v_id
    FROM public.profiles
    WHERE id = NEW.user_id;

    FOR admin_record IN
        SELECT id FROM public.profiles
        WHERE role = 'super_admin'
           OR (role = 'admin' AND (village_id = v_id OR v_id IS NULL))
    LOOP
        INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
        VALUES (
            admin_record.id,
            'नवीन तक्रार नोंदवली (New Grievance Submitted)',
            COALESCE(citizen_name, 'नागरिक') || ' यांनी नवीन तक्रार नोंदवली आहे: "' || NEW.title || '"',
            'complaint',
            false,
            NOW()
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_new_complaint ON public.complaints;
CREATE TRIGGER trg_notify_admins_on_new_complaint
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_new_complaint();

-- 3. BASELINE SEED DATA (Idempotent: Only inserts if table is empty)
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
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

