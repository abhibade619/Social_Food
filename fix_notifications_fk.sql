-- Drop the constraint if it exists (referencing auth.users)
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_from_user_id_fkey;

-- Add the constraint referencing public.profiles
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_from_user_id_fkey 
FOREIGN KEY (from_user_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Refresh schema cache
SELECT * FROM public.notifications LIMIT 1;
