-- ============================================================================
-- AAPLAGAAV: Safe Migration to Add Missing Village Columns
-- ============================================================================
-- Purpose: Adds demographic, administrative, and office timing columns to the
--          public.villages table if they do not already exist.
-- Safe: Uses ADD COLUMN IF NOT EXISTS. Will not alter or delete existing data.
-- ============================================================================

ALTER TABLE public.villages
    ADD COLUMN IF NOT EXISTS gram_panchayat VARCHAR(255),
    ADD COLUMN IF NOT EXISTS families VARCHAR(50),
    ADD COLUMN IF NOT EXISTS houses VARCHAR(50),
    ADD COLUMN IF NOT EXISTS area VARCHAR(50),
    ADD COLUMN IF NOT EXISTS office_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS timings VARCHAR(100),
    ADD COLUMN IF NOT EXISTS weekly_off VARCHAR(50) DEFAULT 'रविवार';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

