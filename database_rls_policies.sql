-- Additional Supabase Schema Updates
-- Run this in your Supabase SQL Editor

-- Ensure logs table has proper user_id foreign key
-- This should already exist, but let's verify the constraint

-- Add index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_logs_user_visit_date 
ON logs(user_id, visit_date DESC);

-- Ensure RLS policies are correct for user-specific data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own logs" ON logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON logs;

-- Recreate policies with correct permissions
CREATE POLICY "Users can view their own logs"
ON logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
ON logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs"
ON logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
ON logs FOR DELETE
USING (auth.uid() = user_id);

-- For Feed: Allow users to view all logs (public feed)
DROP POLICY IF EXISTS "Anyone can view all logs for feed" ON logs;

CREATE POLICY "Anyone can view all logs for feed"
ON logs FOR SELECT
USING (true);  -- This allows viewing all logs for the public feed

-- Note: The app will handle filtering in the UI:
-- - Feed component: Shows all logs (public)
-- - Diary component: Shows only user's logs (private)

-- Verify RLS is enabled
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Check if everything is set up correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'logs';
