-- SQL to fix missing columns in 'settings' table

-- Add columns if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'address') THEN
        ALTER TABLE settings ADD COLUMN address text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'city') THEN
        ALTER TABLE settings ADD COLUMN city text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'state') THEN
        ALTER TABLE settings ADD COLUMN state text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'country') THEN
        ALTER TABLE settings ADD COLUMN country text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'phone') THEN
        ALTER TABLE settings ADD COLUMN phone text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'email') THEN
        ALTER TABLE settings ADD COLUMN email text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'rfc') THEN
        ALTER TABLE settings ADD COLUMN rfc text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'zip_code') THEN
        ALTER TABLE settings ADD COLUMN zip_code text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'colonia') THEN
        ALTER TABLE settings ADD COLUMN colonia text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'master_pin') THEN
        ALTER TABLE settings ADD COLUMN master_pin text;
    END IF;
END $$;
