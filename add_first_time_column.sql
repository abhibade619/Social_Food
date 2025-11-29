ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS is_first_time BOOLEAN DEFAULT FALSE;

-- Optional: If you had data in is_first_visit, you might want to migrate it, 
-- but since it was likely failing, we can just start fresh or assume false.
-- UPDATE logs SET is_first_time = is_first_visit WHERE is_first_visit IS NOT NULL;
