-- SQL Script to create and configure the website_leads table in Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Create the table
CREATE TABLE IF NOT EXISTS website_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT,
    source_url TEXT,
    wordpress_form_id TEXT,
    wordpress_lead_id TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE website_leads ENABLE ROW LEVEL SECURITY;

-- 3. Create Security Policies
-- Admins can do anything
DROP POLICY IF EXISTS "Admins can view and manage website_leads" ON website_leads;
CREATE POLICY "Admins can view and manage website_leads" ON website_leads 
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);

-- Public can insert leads (from external website forms/API webhook)
DROP POLICY IF EXISTS "Public can insert website_leads" ON website_leads;
CREATE POLICY "Public can insert website_leads" ON website_leads 
FOR INSERT TO public WITH CHECK (true);

-- 4. Create Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_website_leads_email ON website_leads(email);
CREATE INDEX IF NOT EXISTS idx_website_leads_status ON website_leads(status);
CREATE INDEX IF NOT EXISTS idx_website_leads_created_at ON website_leads(created_at);

-- 5. Bind trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_website_leads_updated_at ON website_leads;
CREATE TRIGGER update_website_leads_updated_at BEFORE UPDATE ON website_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
