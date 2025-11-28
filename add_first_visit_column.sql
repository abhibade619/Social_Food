ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS is_first_visit BOOLEAN DEFAULT FALSE;

-- Update existing logs to have a default value if needed (optional)
-- UPDATE logs SET is_first_visit = FALSE WHERE is_first_visit IS NULL;
