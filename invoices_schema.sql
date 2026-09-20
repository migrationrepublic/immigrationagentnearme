-- ============================================================================
-- Invoicing Module Schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Adds a Zoho-Invoice-style invoicing system wired to the existing
-- `bookings` / `plans` tables.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Invoice status + sequential invoice numbering (INV-000001, INV-000002, ...)
-- ----------------------------------------------------------------------------
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'INV-' || LPAD(nextval('invoice_number_seq')::text, 6, '0');
$$;

-- ----------------------------------------------------------------------------
-- 2. Reusable billable items catalog (mirrors the "Items" list in Zoho)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    default_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

INSERT INTO invoice_catalog_items (name, description, default_rate) VALUES
    ('Consultation Fee', NULL, 100.00),
    ('Professional Service Fee', 'Visa Application preparation & lodgment', 600.00),
    ('Nomination Application Fee payable to the Department', NULL, 330.00),
    ('Nimination SAF levy payable to Department', NULL, 1200.00),
    ('SBS Fee payable to the Department', NULL, 420.00),
    ('TAS Fee payable to the Department', NULL, 420.00),
    ('Labour Market Testing', NULL, 800.00),
    ('Administrative Review Tribunal Fee', 'ART Fee - Payable to Administrative Review Tribunal', 3727.00),
    ('Vetassess Skill Assessment Fee', NULL, 1205.60),
    ('Skill Assessment Fee', NULL, 0.00),
    ('Translation Fee - 3rd Part Fee', NULL, 0.00),
    ('Card Surcharge Payable to the Department', '1.4% Card Surcharge applicable on card payments to the Department', 0.00),
    ('MISC', NULL, 0.00)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Invoices (customer info is denormalized on the invoice, same convention
--    as `bookings.name/email/phone` — no separate customers table needed)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,

    -- Bill-to details
    bill_to_name TEXT NOT NULL,
    bill_to_email TEXT NOT NULL,
    bill_to_phone TEXT,
    bill_to_address TEXT,

    -- Optional link back to the consultation booking that generated this invoice
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    status invoice_status DEFAULT 'draft',

    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    terms TEXT DEFAULT 'Due on Receipt',

    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(12,2) NOT NULL DEFAULT 0,

    notes TEXT DEFAULT 'Bank Details:
Name: Migration Republic | BSB: 063-620 | ACC No.: 1123-5022',

    stripe_session_id TEXT,

    sent_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_bill_to_email ON invoices(bill_to_email);

-- ----------------------------------------------------------------------------
-- 4. Invoice line items (the Item Table rows)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

-- ----------------------------------------------------------------------------
-- 5. Payments received against an invoice
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode TEXT NOT NULL DEFAULT 'Cash',
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);

-- ----------------------------------------------------------------------------
-- 6. RLS — Admins can manage everything, service role (server actions /
--    webhooks) bypasses RLS entirely.
-- ----------------------------------------------------------------------------
ALTER TABLE invoice_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoice catalog items" ON invoice_catalog_items FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);
CREATE POLICY "Admins can manage invoices" ON invoices FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);
CREATE POLICY "Admins can manage invoice line items" ON invoice_line_items FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);
CREATE POLICY "Admins can manage invoice payments" ON invoice_payments FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);
