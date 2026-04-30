-- Enterprise Consultation Booking System Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Plans Table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    price_aud INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Seed basic plans
INSERT INTO plans (name, slug, price_aud, duration_minutes) VALUES
    ('Phone Consultation', 'phone-consultation', 100, 30),
    ('Online Video Consultation', 'online-video-consultation', 150, 45),
    ('In-Office Consultation', 'in-office-consultation', 200, 60);

-- 2. Availability Table
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT false,
    UNIQUE(date, time)
);

-- 3. Bookings Table
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    plan_id UUID REFERENCES plans(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    notes TEXT,
    status booking_status DEFAULT 'pending',
    stripe_session_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Admins Table
CREATE TABLE admins (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Plans: Anyone can read active plans. Admins can manage all.
CREATE POLICY "Public can view active plans" ON plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Availability: Anyone can read. Admins can manage. Webhooks (service role) bypass RLS.
CREATE POLICY "Public can view availability" ON availability FOR SELECT USING (true);
CREATE POLICY "Admins can manage availability" ON availability FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Bookings: Admins can view and manage all. Webhooks (service role) bypass RLS to insert/update.
CREATE POLICY "Admins can view and manage bookings" ON bookings FOR ALL USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Admins: Only admins can read the admins table
CREATE POLICY "Admins can view admins" ON admins FOR SELECT USING (
  auth.uid() IN (SELECT id FROM admins)
);
