-- Add from_user_id column to notifications table if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS from_user_id UUID REFERENCES auth.users(id);

-- Refresh the schema cache
SELECT * FROM public.notifications LIMIT 1;
