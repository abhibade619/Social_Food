-- ============================================
-- ADD GOOGLE PLACES COLUMNS TO LOGS TABLE
-- ============================================

-- Add place_id for Google Places reference
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS place_id TEXT;

-- Add coordinates for map display
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add full address from Google Places
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS full_address TEXT;

-- Create index for place_id lookups
CREATE INDEX IF NOT EXISTS idx_logs_place_id ON logs(place_id);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_logs_coordinates ON logs(latitude, longitude);

-- Add comments
COMMENT ON COLUMN logs.place_id IS 'Google Places ID for restaurant';
COMMENT ON COLUMN logs.latitude IS 'Restaurant latitude coordinate';
COMMENT ON COLUMN logs.longitude IS 'Restaurant longitude coordinate';
COMMENT ON COLUMN logs.full_address IS 'Full address from Google Places';
