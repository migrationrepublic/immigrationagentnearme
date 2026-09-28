-- Migration: Global single-booking-per-time-slot constraint
-- Description: The business runs one consultant, so only ONE client can be
--              booked at a given date+time, regardless of consultation type
--              (Phone / Online Video / In-Office). Previously availability
--              was tracked per plan_id only, so e.g. a Phone booking and a
--              Video booking could both land on the same slot at once.
--              This adds a database-level guarantee (not just an app-level
--              check) so two concurrent requests can never both succeed.
--
-- NOT YET APPLIED (2026-09-28): this fails to run while the table still has
-- existing double-booked rows at the same date+time (e.g. 2026-09-28 13:00
-- had both a Phone and a Video booking already). Per the business owner,
-- no existing booking data should be touched/cancelled to force this
-- through. The app-level checks in booking.service.ts / admin.ts / the
-- Stripe webhook already stop new double-bookings from this point forward
-- without needing this index. Apply this migration later, once any
-- remaining date+time conflicts have been resolved on their own (e.g. one
-- of the two clients is contacted and rescheduled) — run the diagnostic
-- query below first to check there are none left, then run the
-- CREATE UNIQUE INDEX statement.
--
-- SELECT date, time, COUNT(*) FROM bookings WHERE status <> 'cancelled'
-- GROUP BY date, time HAVING COUNT(*) > 1;

-- A partial unique index: only non-cancelled bookings compete for a slot,
-- so a cancelled booking never blocks the slot from being rebooked.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_date_time_active_unique
  ON bookings (date, time)
  WHERE status <> 'cancelled';
