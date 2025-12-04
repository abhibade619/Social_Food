-- Fix RLS policies for cached_restaurants to ensure data is saved
-- This allows both authenticated and anonymous users to read/write the cache
-- This is safe for this table as it only contains public restaurant data

ALTER TABLE public.cached_restaurants ENABLE ROW LEVEL SECURITY;

-- 1. Allow everyone to read
DROP POLICY IF EXISTS "Anyone can view cached restaurants" ON public.cached_restaurants;
CREATE POLICY "Anyone can view cached restaurants"
ON public.cached_restaurants FOR SELECT
USING (true);

-- 2. Allow everyone to insert (fix for empty table)
DROP POLICY IF EXISTS "Authenticated users can insert cached restaurants" ON public.cached_restaurants;
DROP POLICY IF EXISTS "Anyone can insert cached restaurants" ON public.cached_restaurants;
CREATE POLICY "Anyone can insert cached restaurants"
ON public.cached_restaurants FOR INSERT
WITH CHECK (true);

-- 3. Allow everyone to update (fix for upsert)
DROP POLICY IF EXISTS "Authenticated users can update cached restaurants" ON public.cached_restaurants;
DROP POLICY IF EXISTS "Anyone can update cached restaurants" ON public.cached_restaurants;
CREATE POLICY "Anyone can update cached restaurants"
ON public.cached_restaurants FOR UPDATE
USING (true);
