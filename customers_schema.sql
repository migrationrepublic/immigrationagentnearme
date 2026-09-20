-- ============================================================================
-- Customers Module Schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Adds a Zoho-style Customers list. Customers are created automatically the
-- moment someone books a consultation, and can also be added manually by an
-- admin from the "New Customer" screen.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE customer_type AS ENUM ('business', 'individual');

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    customer_type customer_type NOT NULL DEFAULT 'individual',

    salutation TEXT,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    display_name TEXT NOT NULL,

    email TEXT,
    work_phone TEXT,
    mobile TEXT,

    currency TEXT NOT NULL DEFAULT 'AUD',
    language TEXT NOT NULL DEFAULT 'English',

    -- 'manual' = created by an admin from the New Customer screen,
    -- 'booking' = auto-created the first time this person booked.
    source TEXT NOT NULL DEFAULT 'manual',
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_display_name ON customers(display_name);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customers" ON customers FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);
