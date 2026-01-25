-- Fix Poster URLs for Srikanth Meka Movies
-- Some movies have wrong year posters - need to update with correct posters

-- Step 1: Check current poster URLs for Srikanth Meka movies
SELECT 
  id,
  title_en,
  slug,
  release_year,
  poster_url,
  hero
FROM movies
WHERE hero = 'Srikanth Meka'
  AND is_published = true
ORDER BY release_year DESC;

-- Step 2: Check specific movies mentioned
-- Satruvu (2013) - should have 2013 poster
SELECT 
  id,
  title_en,
  slug,
  release_year,
  poster_url
FROM movies
WHERE slug = 'satruvu-2013'
   OR (title_en ILIKE '%satruvu%' AND release_year = 2013);

-- Step 3: Update poster URLs
-- You'll need to fetch correct poster URLs from TMDB or other sources
-- and update them here

-- Example for Satruvu (2013):
-- UPDATE movies
-- SET 
--   poster_url = 'https://correct-poster-url-for-2013.jpg',
--   updated_at = NOW()
-- WHERE slug = 'satruvu-2013'
--    OR (title_en ILIKE '%satruvu%' AND release_year = 2013);

-- Step 4: Fix "10th Class Diaries" hero name (if not already fixed)
UPDATE movies
SET 
  hero = 'Srikanth Meka',
  updated_at = NOW()
WHERE (title_en ILIKE '%10th class diaries%' OR slug ILIKE '%10th-class-diaries%')
  AND hero != 'Srikanth Meka';

-- Step 5: Verify fixes
SELECT 
  title_en,
  release_year,
  hero,
  poster_url
FROM movies
WHERE slug IN ('satruvu-2013', '10th-class-diaries-2022')
   OR (title_en ILIKE '%10th class diaries%' AND release_year = 2022)
ORDER BY title_en;

-- Notes:
-- 1. To get correct poster URLs, use TMDB API:
--    - Search for movie by title and year
--    - Get poster_path from results
--    - Use: https://image.tmdb.org/t/p/w500/{poster_path}
-- 2. Or manually find posters from:
--    - IMP Awards: https://www.impawards.com
--    - Ragalahari: https://www.ragalahari.com
--    - Movie galleries
