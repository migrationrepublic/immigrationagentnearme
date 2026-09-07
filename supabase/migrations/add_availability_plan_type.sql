-- Migration: Per-consultation-type availability
-- Description: Adds a plan_id column to `availability` so Phone / Online Video /
--              In-Office consultation slots can be blocked and released independently
--              instead of one blocked slot affecting all three types.

-- 1. Add the column (nullable for now so we can backfill existing rows)
ALTER TABLE availability ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE CASCADE;

-- 2. Backfill rows that correspond to a real booking with that booking's plan_id
UPDATE availability a
SET plan_id = b.plan_id
FROM bookings b
WHERE a.date = b.date
  AND a.time = b.time
  AND a.plan_id IS NULL
  AND b.status <> 'cancelled'
  AND b.plan_id IS NOT NULL;

-- 3. Any remaining rows are manual admin blocks with no specific type on record.
--    Replicate them across every plan so previously "blocked for everyone" slots
--    stay blocked everywhere after the upgrade (no surprise re-opening of slots).
INSERT INTO availability (date, time, is_booked, plan_id)
SELECT a.date, a.time, a.is_booked, p.id
FROM availability a
CROSS JOIN plans p
WHERE a.plan_id IS NULL
ON CONFLICT DO NOTHING;

-- 4. Drop the now-redundant placeholder rows
DELETE FROM availability WHERE plan_id IS NULL;

-- 5. Replace the (date, time) uniqueness with (date, time, plan_id)
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_date_time_key;
ALTER TABLE availability ADD CONSTRAINT availability_date_time_plan_key UNIQUE (date, time, plan_id);

-- 6. Require plan_id going forward
ALTER TABLE availability ALTER COLUMN plan_id SET NOT NULL;

-- 7. Helpful index for the admin/date+type lookups
CREATE INDEX IF NOT EXISTS idx_availability_date_plan ON availability(date, plan_id);
