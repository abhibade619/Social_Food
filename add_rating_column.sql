ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 1);

-- Optional: Calculate initial ratings for existing logs if needed
-- This would require a complex update query based on the weights, 
-- or we can leave them null/default for now.
