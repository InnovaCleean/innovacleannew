-- Extend client name length to support unlimited text (or at least significantly more than before)
ALTER TABLE clients ALTER COLUMN name TYPE text;

-- Also ensure sales.client_name is text (it usually is, but good to be safe)
ALTER TABLE sales ALTER COLUMN client_name TYPE text;
