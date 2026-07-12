-- Migration: Database Schema Initialization
-- Description: Sets up the core database schemas, enums, triggers, RLS policies, and performance indexes.

-- 0. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Core Tables Definition

-- 2.1 Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.2 Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    price_aud INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- 2.3 Availability Table
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT false,
    UNIQUE(date, time)
);

-- 2.4 Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    notes TEXT,
    status booking_status DEFAULT 'pending',
    stripe_session_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.5 Stripe Events Table (Idempotency Logs)
CREATE TABLE IF NOT EXISTS stripe_events (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.6 Tool Lead Submissions Table
CREATE TABLE IF NOT EXISTS tool_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_name TEXT NOT NULL, 
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.7 Website Leads Table (Wordpress & External API contact forms)
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

-- 2.8 Document Templates Table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    visa_subclass TEXT,
    file_path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.9 Document Fields Table
CREATE TABLE IF NOT EXISTS document_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES document_templates(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    pdf_field_name TEXT,
    is_required BOOLEAN DEFAULT false,
    options JSONB,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- 2.10 Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT DEFAULT 'pending_review',
    rejection_reason TEXT,
    field_values JSONB,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.11 Signature Requests Table
CREATE TABLE IF NOT EXISTS signature_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    signer_email TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    token TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
    signature_url TEXT,
    ip_address TEXT,
    user_agent TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.12 Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Triggers for Automatic updated_at Update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Bind triggers
CREATE TRIGGER update_website_leads_updated_at BEFORE UPDATE ON website_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doc_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doc_fields_updated_at BEFORE UPDATE ON document_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signature_requests_updated_at BEFORE UPDATE ON signature_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies

-- 5.1 Admins policies
DROP POLICY IF EXISTS "Admins can view admins" ON admins;
CREATE POLICY "Admins can view admins" ON admins FOR SELECT USING (auth.uid() = id);

-- 5.2 Plans policies
DROP POLICY IF EXISTS "Public can view active plans" ON plans;
CREATE POLICY "Public can view active plans" ON plans FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage plans" ON plans;
CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- 5.3 Availability policies
DROP POLICY IF EXISTS "Public can view availability" ON availability;
CREATE POLICY "Public can view availability" ON availability FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage availability" ON availability;
CREATE POLICY "Admins can manage availability" ON availability FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- 5.4 Bookings policies
DROP POLICY IF EXISTS "Admins can view and manage bookings" ON bookings;
CREATE POLICY "Admins can view and manage bookings" ON bookings FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- 5.5 Stripe Events policies
DROP POLICY IF EXISTS "Admins can view stripe_events" ON stripe_events;
CREATE POLICY "Admins can view stripe_events" ON stripe_events FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- 5.6 Tool Submissions policies
DROP POLICY IF EXISTS "Admins can view and manage tool_submissions" ON tool_submissions;
CREATE POLICY "Admins can view and manage tool_submissions" ON tool_submissions FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Public can insert tool_submissions" ON tool_submissions;
CREATE POLICY "Public can insert tool_submissions" ON tool_submissions FOR INSERT WITH CHECK (true);

-- 5.7 Website Leads policies
DROP POLICY IF EXISTS "Admins can view and manage website_leads" ON website_leads;
CREATE POLICY "Admins can view and manage website_leads" ON website_leads FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Public can insert website_leads" ON website_leads;
CREATE POLICY "Public can insert website_leads" ON website_leads FOR INSERT WITH CHECK (true);

-- 5.8 Document Templates policies
DROP POLICY IF EXISTS "Admins can view and manage document_templates" ON document_templates;
CREATE POLICY "Admins can view and manage document_templates" ON document_templates FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can select document_templates" ON document_templates;
CREATE POLICY "Authenticated users can select document_templates" ON document_templates FOR SELECT TO authenticated USING (is_active = true);

-- 5.9 Document Fields policies
DROP POLICY IF EXISTS "Admins can view and manage document_fields" ON document_fields;
CREATE POLICY "Admins can view and manage document_fields" ON document_fields FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can select document_fields" ON document_fields;
CREATE POLICY "Authenticated users can select document_fields" ON document_fields FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM document_templates 
        WHERE id = document_fields.template_id AND is_active = true
    )
);

-- 5.10 Documents policies
DROP POLICY IF EXISTS "Admins can view and manage documents" ON documents;
CREATE POLICY "Admins can view and manage documents" ON documents FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Clients can select their own documents" ON documents;
CREATE POLICY "Clients can select their own documents" ON documents FOR SELECT TO authenticated USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can insert their own documents" ON documents;
CREATE POLICY "Clients can insert their own documents" ON documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can update their own documents" ON documents;
CREATE POLICY "Clients can update their own documents" ON documents FOR UPDATE TO authenticated USING (auth.uid() = client_id);

-- 5.11 Signature Requests policies
DROP POLICY IF EXISTS "Admins can view and manage signature_requests" ON signature_requests;
CREATE POLICY "Admins can view and manage signature_requests" ON signature_requests FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Signers can select signature_requests" ON signature_requests;
CREATE POLICY "Signers can select signature_requests" ON signature_requests FOR SELECT TO authenticated USING (
    auth.jwt()->>'email' = signer_email OR
    EXISTS (
        SELECT 1 FROM documents
        WHERE id = signature_requests.document_id AND client_id = auth.uid()
    )
);

-- 5.12 Audit Logs policies
DROP POLICY IF EXISTS "Admins can view audit_logs" ON audit_logs;
CREATE POLICY "Admins can view audit_logs" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));


-- 6. Performance Query Optimization Indexes

-- Bookings & Availability
CREATE INDEX IF NOT EXISTS idx_bookings_plan_id ON bookings(plan_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(date, time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability(date);

-- Website & Tool Leads
CREATE INDEX IF NOT EXISTS idx_tool_submissions_tool_name ON tool_submissions(tool_name);
CREATE INDEX IF NOT EXISTS idx_website_leads_email ON website_leads(email);
CREATE INDEX IF NOT EXISTS idx_website_leads_status ON website_leads(status);
CREATE INDEX IF NOT EXISTS idx_website_leads_created_at ON website_leads(created_at);

-- Documents & Templates
CREATE INDEX IF NOT EXISTS idx_doc_templates_subclass ON document_templates(visa_subclass);
CREATE INDEX IF NOT EXISTS idx_doc_fields_template_id ON document_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_doc_fields_sort_order ON document_fields(sort_order);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_template_id ON documents(template_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Signatures & Audit Logs
CREATE INDEX IF NOT EXISTS idx_sig_requests_document_id ON signature_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_sig_requests_signer_email ON signature_requests(signer_email);
CREATE INDEX IF NOT EXISTS idx_sig_requests_status ON signature_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);


-- 7. Seed Core Setup Consultation Plans
INSERT INTO plans (name, slug, price_aud, duration_minutes) VALUES
    ('Phone Consultation', 'phone-consultation', 10000, 30), -- prices represented in cents ($100.00 AUD)
    ('Online Video Consultation', 'online-video-consultation', 15000, 45), -- $150.00 AUD
    ('In-Office Consultation', 'in-office-consultation', 20000, 60) -- $200.00 AUD
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, 
    price_aud = EXCLUDED.price_aud, 
    duration_minutes = EXCLUDED.duration_minutes;


-- 8. Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('templates', 'templates', false),
  ('documents', 'documents', false),
  ('signed', 'signed', false),
  ('signatures', 'signatures', false),
  ('temporary', 'temporary', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage Policies
DROP POLICY IF EXISTS "Allow client uploads" ON storage.objects;
CREATE POLICY "Allow client uploads" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow client reads" ON storage.objects;
CREATE POLICY "Allow client reads" ON storage.objects 
FOR SELECT TO authenticated 
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow admin control" ON storage.objects;
CREATE POLICY "Allow admin control" ON storage.objects 
FOR ALL TO authenticated 
USING (bucket_id IN ('templates', 'documents', 'signed', 'signatures', 'temporary') AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

