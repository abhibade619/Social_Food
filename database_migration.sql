-- FoodSocial Database Schema Updates
-- Run this in your Supabase SQL Editor

-- Add location column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Add photos column to logs (stores array of photo URLs)
ALTER TABLE logs ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_tagged_users_log ON tagged_users(log_id);
CREATE INDEX IF NOT EXISTS idx_tagged_users_user ON tagged_users(user_id);

-- Create a storage bucket for log photos (if not exists)
-- Note: This needs to be done via Supabase Dashboard -> Storage
-- Bucket name: log-photos
-- Public: true (for easy access)

-- Add RLS policies for storage
-- (These will be added via Dashboard after bucket creation)
