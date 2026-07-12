-- ================================================================
-- Migration: Add columns to signature_requests for interactive flow
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. Add fields JSONB column (defaults to empty array)
-- 2. Add signing_order column (defaults to 1)
-- 3. Add signing_message column (optional custom note)

ALTER TABLE signature_requests
  ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE signature_requests
  ADD COLUMN IF NOT EXISTS signing_order INTEGER DEFAULT 1 NOT NULL;

ALTER TABLE signature_requests
  ADD COLUMN IF NOT EXISTS signing_message TEXT;
