-- Add special_categories column to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS special_categories TEXT[];

-- Create GIN index for efficient array queries
CREATE INDEX IF NOT EXISTS idx_movies_special_categories 
ON movies USING GIN (special_categories);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'movies' 
AND column_name = 'special_categories';
