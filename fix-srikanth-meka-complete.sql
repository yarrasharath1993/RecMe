-- Complete Fix for Srikanth Meka
-- 1. Find and update profile image (you'll need to add the URL)
-- 2. Fix "10th Class Diaries" hero name
-- 3. Fix poster URLs for movies with wrong year posters

-- ============================================================
-- STEP 1: Check current state
-- ============================================================

-- Check if Srikanth Meka profile exists
SELECT 
  id, 
  name_en, 
  slug, 
  profile_image,
  image_url,
  tmdb_id,
  is_published
FROM celebrities 
WHERE slug = 'srikanth-meka'
   OR name_en ILIKE '%srikanth%meka%';

-- ============================================================
-- STEP 2: Update/Create Srikanth Meka profile with image
-- ============================================================

-- Option A: If profile exists, update it
-- Replace 'https://image.tmdb.org/t/p/original/...' with actual TMDB image URL
UPDATE celebrities 
SET 
  profile_image = 'https://image.tmdb.org/t/p/original/YOUR_TMDB_IMAGE_PATH.jpg',  -- Replace with actual URL
  image_url = 'https://image.tmdb.org/t/p/original/YOUR_TMDB_IMAGE_PATH.jpg',      -- Replace with actual URL
  updated_at = NOW()
WHERE slug = 'srikanth-meka'
   OR (name_en ILIKE '%srikanth%' AND name_en ILIKE '%meka%');

-- Option B: If profile doesn't exist, create it
-- Uncomment and run if profile doesn't exist:
/*
INSERT INTO celebrities (
  name_en,
  name_te,
  slug,
  gender,
  occupation,
  birth_date,
  profile_image,
  image_url,
  tmdb_id,
  is_published,
  created_at,
  updated_at
) VALUES (
  'Srikanth Meka',
  'శ్రీకాంత్ మేక',
  'srikanth-meka',
  'male',
  'actor',
  '1968-03-23',
  'https://image.tmdb.org/t/p/original/YOUR_TMDB_IMAGE_PATH.jpg',  -- Replace with actual URL
  'https://image.tmdb.org/t/p/original/YOUR_TMDB_IMAGE_PATH.jpg',  -- Replace with actual URL
  NULL,  -- Add TMDB ID if you have it
  true,
  NOW(),
  NOW()
) RETURNING id;
*/

-- ============================================================
-- STEP 3: Fix "10th Class Diaries" hero name
-- ============================================================

UPDATE movies
SET 
  hero = 'Srikanth Meka',
  updated_at = NOW()
WHERE (title_en ILIKE '%10th class diaries%' 
   OR slug ILIKE '%10th-class-diaries%'
   OR title_en ILIKE '%10th-class-diaries%')
  AND hero != 'Srikanth Meka';

-- Verify the fix
SELECT 
  id,
  title_en,
  hero,
  release_year
FROM movies
WHERE title_en ILIKE '%10th class diaries%'
   OR slug ILIKE '%10th-class-diaries%';

-- ============================================================
-- STEP 4: Check poster URLs for Srikanth Meka movies
-- ============================================================

-- List all Srikanth Meka movies with their posters
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

-- Check specific movies with wrong posters
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

-- ============================================================
-- STEP 5: Update poster URLs (manual - you need correct URLs)
-- ============================================================

-- Example: Fix Satruvu (2013) poster
-- Replace with correct poster URL for 2013 movie
-- UPDATE movies
-- SET 
--   poster_url = 'https://image.tmdb.org/t/p/w500/CORRECT_POSTER_PATH.jpg',
--   updated_at = NOW()
-- WHERE slug = 'satruvu-2013'
--    OR (title_en ILIKE '%satruvu%' AND release_year = 2013);

-- ============================================================
-- STEP 6: Verify all fixes
-- ============================================================

-- Check profile
SELECT id, name_en, slug, profile_image 
FROM celebrities 
WHERE slug = 'srikanth-meka';

-- Check hero names
SELECT title_en, hero, release_year 
FROM movies 
WHERE hero = 'Srikanth Meka'
ORDER BY release_year DESC
LIMIT 10;

-- ============================================================
-- NOTES:
-- ============================================================
-- 1. To find TMDB profile image:
--    - Search: https://www.themoviedb.org/search?query=Srikanth+Meka
--    - Or use API: GET https://api.themoviedb.org/3/search/person?api_key=YOUR_KEY&query=Srikanth+Meka
--    - Get profile_path from results
--    - Use: https://image.tmdb.org/t/p/original/{profile_path}
--
-- 2. To find correct movie posters:
--    - Search TMDB by title and year
--    - Get poster_path from movie details
--    - Use: https://image.tmdb.org/t/p/w500/{poster_path}
--
-- 3. Alternative sources for posters:
--    - IMP Awards: https://www.impawards.com/intl/india/2013/shatruvu_ver2.html
--    - Ragalahari: https://www.ragalahari.com
--    - Movie galleries
