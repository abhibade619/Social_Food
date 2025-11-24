-- ============================================
-- COMPLETE FOODSOCIAL DATABASE SCHEMA
-- ALL COLUMNS INCLUDED - NO MISTAKES
-- ============================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS tagged_users CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. LOGS TABLE - WITH ALL COLUMNS
-- ============================================
CREATE TABLE logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Restaurant Info
    restaurant_name TEXT NOT NULL,
    location TEXT,
    cuisine TEXT,
    
    -- Visit Details
    visit_type TEXT NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Ratings (all optional, can be empty strings or numbers)
    rating_food TEXT,
    rating_service TEXT,
    rating_ambience TEXT,
    rating_value TEXT,
    rating_packaging TEXT,
    rating_store_service TEXT,
    
    -- Return Intent
    return_intent TEXT,
    
    -- Experience/Review
    content TEXT,
    
    -- Photos (array of URLs)
    photos JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. FOLLOWS TABLE
-- ============================================
CREATE TABLE follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- ============================================
-- 4. TAGGED USERS TABLE
-- ============================================
CREATE TABLE tagged_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID REFERENCES logs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(log_id, user_id)
);

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_user_visit_date ON logs(user_id, visit_date DESC);
CREATE INDEX idx_logs_cuisine ON logs(cuisine);
CREATE INDEX idx_logs_location ON logs(location);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_tagged_users_log ON tagged_users(log_id);
CREATE INDEX idx_tagged_users_user ON tagged_users(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagged_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES - PROFILES
-- ============================================
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- 8. RLS POLICIES - LOGS
-- ============================================
-- Allow everyone to view all logs (for Feed)
CREATE POLICY "Anyone can view all logs"
ON logs FOR SELECT
USING (true);

-- Only allow users to insert their own logs
CREATE POLICY "Users can insert their own logs"
ON logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own logs
CREATE POLICY "Users can update their own logs"
ON logs FOR UPDATE
USING (auth.uid() = user_id);

-- Only allow users to delete their own logs
CREATE POLICY "Users can delete their own logs"
ON logs FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 9. RLS POLICIES - FOLLOWS
-- ============================================
CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
USING (auth.uid() = follower_id);

-- ============================================
-- 10. RLS POLICIES - TAGGED USERS
-- ============================================
CREATE POLICY "Anyone can view tagged users"
ON tagged_users FOR SELECT
USING (true);

CREATE POLICY "Log owners can tag users"
ON tagged_users FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM logs
        WHERE logs.id = log_id AND logs.user_id = auth.uid()
    )
);

CREATE POLICY "Log owners can remove tags"
ON tagged_users FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM logs
        WHERE logs.id = log_id AND logs.user_id = auth.uid()
    )
);

-- ============================================
-- 11. AUTO-CREATE PROFILE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 12. TRIGGER FOR AUTO-PROFILE CREATION
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 13. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================
-- 14. VERIFY SCHEMA
-- ============================================
-- Check all tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'logs', 'follows', 'tagged_users')
ORDER BY table_name;

-- Check logs table has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'logs'
ORDER BY ordinal_position;

-- ============================================
-- DONE! ALL COLUMNS CREATED
-- ============================================
-- The logs table now has ALL these columns:
-- - id
-- - user_id
-- - restaurant_name
-- - location
-- - cuisine
-- - visit_type
-- - visit_date
-- - rating_food
-- - rating_service
-- - rating_ambience
-- - rating_value
-- - rating_packaging
-- - rating_store_service
-- - return_intent
-- - content  <-- THIS WAS MISSING BEFORE
-- - photos
-- - created_at
-- - updated_at
-- ============================================
