-- ================================================================
-- Migration: Add token column to signature_requests
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. Add token column (unique, used as the public signing link key)
ALTER TABLE signature_requests
  ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;

-- 2. Backfill existing rows with a random token (so old rows don't break)
UPDATE signature_requests
  SET token = encode(gen_random_bytes(32), 'hex')
  WHERE token IS NULL;

-- 3. Make it NOT NULL going forward
ALTER TABLE signature_requests
  ALTER COLUMN token SET NOT NULL;

-- 4. Create an index for fast token lookups on the /sign/[token] page
CREATE INDEX IF NOT EXISTS idx_signature_requests_token
  ON signature_requests (token);

-- ================================================================
-- Optional: Verify the migration
-- ================================================================
-- SELECT id, token, signer_email, status FROM signature_requests LIMIT 5;
