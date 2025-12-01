-- Add place_id column if it doesn't exist
ALTER TABLE public.wishlist 
ADD COLUMN IF NOT EXISTS place_id TEXT;

-- Add other potentially missing columns just in case
ALTER TABLE public.wishlist 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS cuisine TEXT;

-- Drop the old unique constraint if it exists (to avoid conflicts when adding the new one)
ALTER TABLE public.wishlist 
DROP CONSTRAINT IF EXISTS wishlist_user_id_restaurant_name_key;

-- Add new unique constraints
-- We want to ensure uniqueness by place_id (preferred) OR restaurant_name (fallback)
-- Note: You can't easily have "OR" in unique constraints, so we'll add both as separate unique constraints.
-- This might be strict, but it prevents duplicates.

-- Ensure unique pair of user_id + place_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_user_id_place_id_key'
    ) THEN
        ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_place_id_key UNIQUE (user_id, place_id);
    END IF;
END $$;

-- Ensure unique pair of user_id + restaurant_name (for manual entries or legacy data)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_user_id_restaurant_name_key'
    ) THEN
        ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_restaurant_name_key UNIQUE (user_id, restaurant_name);
    END IF;
END $$;

-- Refresh the schema cache (Supabase specific, but good practice to just run a select)
SELECT * FROM public.wishlist LIMIT 1;
