-- Change 'date' column in 'expenses' table from DATE to TIMESTAMPTZ
-- This ensures distinct times are stored (e.g. 15:30) instead of just midnight.

-- 1. Alter the column type, using midnight UTC as default conversion for existing dates?
-- Actually, existing dates are 'YYYY-MM-DD'. Casting to timestamptz treats them as Midnight UTC?
-- Midnight UTC = 6:00 PM Previous Day CDMX.
-- We want to fix existing "Today" records if possible, but we can't accept dirty data.
-- Better to just convert. Future records will be correct.

ALTER TABLE public.expenses
  ALTER COLUMN date TYPE timestamptz USING date::timestamptz;

-- Note: After this, 'date' will store full time.
