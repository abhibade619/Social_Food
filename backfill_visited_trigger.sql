-- 1. Backfill visited_restaurants from existing logs
-- We select distinct user_id and place_id/restaurant_name from logs
-- and insert them into visited_restaurants, ignoring duplicates.

INSERT INTO visited_restaurants (user_id, place_id, restaurant_name, location)
SELECT DISTINCT 
    l.user_id, 
    l.place_id, 
    l.restaurant_name, 
    l.location
FROM logs l
WHERE l.place_id IS NOT NULL  -- Ensure we have a place_id if possible
ON CONFLICT (user_id, place_id) DO NOTHING;

-- Also handle cases where place_id might be missing in logs but we have a name (fallback)
-- This is trickier with the unique constraint on place_id, so we'll skip for now to avoid errors
-- and focus on the high-quality data with place_ids.


-- 2. Create a Trigger Function to auto-add to visited_restaurants on new log
CREATE OR REPLACE FUNCTION public.auto_add_to_visited()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.visited_restaurants (user_id, place_id, restaurant_name, location)
    VALUES (NEW.user_id, NEW.place_id, NEW.restaurant_name, NEW.location)
    ON CONFLICT (user_id, place_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS on_log_created_add_visited ON public.logs;

CREATE TRIGGER on_log_created_add_visited
AFTER INSERT ON public.logs
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_to_visited();
