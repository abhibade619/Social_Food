-- ============================================
-- CREATE WISHLIST TABLE
-- ============================================

-- Create wishlist table for saving restaurants to try later
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_name TEXT NOT NULL,
  location TEXT,
  cuisine TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, restaurant_name, location)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON wishlist(created_at DESC);

-- Enable RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
CREATE POLICY "Users can view own wishlist"
ON wishlist FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wishlist" ON wishlist;
CREATE POLICY "Users can insert own wishlist"
ON wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wishlist" ON wishlist;
CREATE POLICY "Users can update own wishlist"
ON wishlist FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlist;
CREATE POLICY "Users can delete own wishlist"
ON wishlist FOR DELETE
USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE wishlist IS 'Restaurants users want to try later';
COMMENT ON COLUMN wishlist.user_id IS 'User who saved the restaurant';
COMMENT ON COLUMN wishlist.restaurant_name IS 'Name of the restaurant';
COMMENT ON COLUMN wishlist.location IS 'Restaurant location';
COMMENT ON COLUMN wishlist.cuisine IS 'Type of cuisine';
COMMENT ON COLUMN wishlist.notes IS 'User notes about why they want to try it';
