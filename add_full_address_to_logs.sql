-- Add full_address column to logs table if it doesn't exist
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS full_address TEXT;

-- Update existing logs to have a default value if needed (optional)
-- UPDATE logs SET full_address = location WHERE full_address IS NULL;
