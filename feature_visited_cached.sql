-- Create visited_restaurants table
CREATE TABLE IF NOT EXISTS public.visited_restaurants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL,
    restaurant_name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, place_id)
);

-- Enable RLS for visited_restaurants
ALTER TABLE public.visited_restaurants ENABLE ROW LEVEL SECURITY;

-- Policies for visited_restaurants
CREATE POLICY "Users can view their own visited restaurants"
ON public.visited_restaurants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all visited restaurants (for stats)"
ON public.visited_restaurants FOR SELECT
USING (true);

CREATE POLICY "Users can add to their visited restaurants"
ON public.visited_restaurants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their visited restaurants"
ON public.visited_restaurants FOR DELETE
USING (auth.uid() = user_id);


-- Create cached_restaurants table
CREATE TABLE IF NOT EXISTS public.cached_restaurants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    place_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    rating FLOAT,
    user_ratings_total INT,
    price_level INT,
    photos JSONB,
    types JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for cached_restaurants
ALTER TABLE public.cached_restaurants ENABLE ROW LEVEL SECURITY;

-- Policies for cached_restaurants
CREATE POLICY "Anyone can view cached restaurants"
ON public.cached_restaurants FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert cached restaurants"
ON public.cached_restaurants FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cached restaurants"
ON public.cached_restaurants FOR UPDATE
USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.visited_restaurants TO authenticated;
GRANT ALL ON public.visited_restaurants TO service_role;
GRANT ALL ON public.cached_restaurants TO authenticated;
GRANT ALL ON public.cached_restaurants TO service_role;
