-- Add state and country columns to cached_restaurants to prevent ambiguity
ALTER TABLE public.cached_restaurants 
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS country text;

-- Optional: Create an index on city, state, country for faster lookups
CREATE INDEX IF NOT EXISTS idx_cached_restaurants_location ON public.cached_restaurants(city, state, country);
