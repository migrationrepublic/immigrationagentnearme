-- ============================================================================
-- App Settings Schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Run AFTER invoices_schema.sql — this replaces next_invoice_number() so the
-- invoice prefix becomes admin-configurable instead of hardcoded.
--
-- Adds a single settings row that drives business info/branding shown across
-- every email and invoice PDF, plus invoice defaults, so an admin can change
-- them from Admin > Settings without a developer touching code.
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row

    -- Business Info & Branding
    business_name TEXT NOT NULL DEFAULT 'Migration Republic',
    tagline TEXT NOT NULL DEFAULT 'Registered Migration Agents',
    marn_number TEXT NOT NULL DEFAULT '2518961',
    office_address TEXT NOT NULL DEFAULT '470 St Kilda Road, Melbourne, VIC 3004',
    contact_phone TEXT NOT NULL DEFAULT '+61 435 321 219',
    contact_email TEXT NOT NULL DEFAULT 'info@migrationrepublic.com.au',
    website_url TEXT NOT NULL DEFAULT 'https://migrationrepublic.com.au',
    logo_url TEXT NOT NULL DEFAULT 'https://immigrationagentnearme.com/images/logo.jpg',
    facebook_url TEXT DEFAULT 'https://www.facebook.com/',
    instagram_url TEXT DEFAULT 'https://www.instagram.com/',
    linkedin_url TEXT DEFAULT 'https://www.linkedin.com/',
    google_review_url TEXT DEFAULT 'https://g.page/r/CblNnrjAvvg5EAI/review',

    -- Invoice Defaults
    invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
    invoice_default_terms TEXT NOT NULL DEFAULT 'Due on Receipt',
    invoice_due_days INTEGER NOT NULL DEFAULT 0,
    invoice_notes TEXT NOT NULL DEFAULT 'Bank Details:
Name: Migration Republic | BSB: 063-620 | ACC No.: 1123-5022',

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage app settings" ON app_settings FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- ----------------------------------------------------------------------------
-- Make the invoice number PREFIX configurable: the sequence itself keeps
-- incrementing (so existing invoice numbers are unaffected), but the prefix
-- is now applied in application code from app_settings.invoice_prefix instead
-- of being baked into this function.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT LPAD(nextval('invoice_number_seq')::text, 6, '0');
$$;
