-- Add restaurant_data column to visited_restaurants table
ALTER TABLE public.visited_restaurants 
ADD COLUMN IF NOT EXISTS restaurant_data JSONB;

-- Add restaurant_data column to wishlist table (just in case it's missing there too)
ALTER TABLE public.wishlist
ADD COLUMN IF NOT EXISTS restaurant_data JSONB;
