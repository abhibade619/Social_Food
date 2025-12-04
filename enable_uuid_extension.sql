-- Enable the uuid-ossp extension if it's not already enabled
-- This is required for uuid_generate_v4() to work
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify the table definition (optional, but good for safety)
-- Ensure id has the default value
ALTER TABLE public.cached_restaurants 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();
