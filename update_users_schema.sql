-- Add activity tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_action TEXT;

-- Optional: Create an index for faster "Who is online" queries
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
