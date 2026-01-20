-- Script to clean up duplicate settings
-- It keeps the most recent setting (prioritizing ones with a logo) and deletes the rest.

WITH keep_rows AS (
    SELECT id
    FROM public.settings
    ORDER BY 
        -- Prioritize rows that have a logo (0 comes before 1)
        CASE WHEN logo_url IS NOT NULL THEN 0 ELSE 1 END ASC,
        -- If all have/don't have logo, pick one arbitrarily (by ID)
        id ASC
    LIMIT 1
)
DELETE FROM public.settings
WHERE id NOT IN (SELECT id FROM keep_rows);

-- Verify efficient single row state
SELECT * FROM public.settings;
