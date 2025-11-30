-- Add show_in_diary column to tagged_users table
ALTER TABLE tagged_users 
ADD COLUMN IF NOT EXISTS show_in_diary BOOLEAN DEFAULT FALSE;

-- Update existing records to default (optional, but good for consistency)
UPDATE tagged_users SET show_in_diary = FALSE WHERE show_in_diary IS NULL;
