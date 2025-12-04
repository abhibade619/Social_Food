-- Function to add visited restaurant when user is tagged
CREATE OR REPLACE FUNCTION public.auto_add_tagged_to_visited()
RETURNS TRIGGER AS $$
DECLARE
    v_place_id TEXT;
    v_restaurant_name TEXT;
    v_location TEXT;
BEGIN
    -- Get restaurant details from the log
    SELECT place_id, restaurant_name, location 
    INTO v_place_id, v_restaurant_name, v_location
    FROM public.logs
    WHERE id = NEW.log_id;

    -- Insert into visited_restaurants if place_id exists
    IF v_place_id IS NOT NULL THEN
        INSERT INTO public.visited_restaurants (user_id, place_id, restaurant_name, location)
        VALUES (NEW.user_id, v_place_id, v_restaurant_name, v_location)
        ON CONFLICT (user_id, place_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_tagged_add_visited ON public.tagged_users;

CREATE TRIGGER on_tagged_add_visited
AFTER INSERT ON public.tagged_users
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_tagged_to_visited();
