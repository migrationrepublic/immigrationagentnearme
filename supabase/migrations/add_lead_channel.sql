-- Adds a "channel" column to website_leads so leads can be tagged by where
-- they came from (website contact form vs Facebook / Instagram Lead Ads),
-- and indexes it for the admin panel's source filter.

ALTER TABLE website_leads
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'website';

-- Columns to store the raw Meta lead reference (leadgen_id / form_id / page_id).
-- We reuse the existing wordpress_form_id / wordpress_lead_id text columns for
-- these (they are generic TEXT columns despite the WordPress-era naming), so
-- no new columns are required there.

CREATE INDEX IF NOT EXISTS idx_website_leads_channel ON website_leads(channel);

-- Backfill: anything already in the table came from the website.
UPDATE website_leads SET channel = 'website' WHERE channel IS NULL;
