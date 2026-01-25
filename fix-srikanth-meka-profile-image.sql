-- Fix Srikanth Meka Profile Image
-- 
-- Issue: Profile image is wrong or missing for Srikanth Meka
-- Solution: Check and update the profile_image in celebrities table

-- Step 1: Check current celebrity profile
SELECT 
  id, 
  name_en, 
  name_te, 
  slug, 
  profile_image,
  image_url,
  is_published
FROM celebrities 
WHERE slug = 'srikanth-meka'
   OR name_en ILIKE '%srikanth%meka%'
   OR name_en ILIKE '%meka%srikanth%';

-- Step 2: Check if profile exists with different slug variations
SELECT 
  id, 
  name_en, 
  name_te, 
  slug, 
  profile_image,
  image_url,
  is_published
FROM celebrities 
WHERE name_en ILIKE '%srikanth%' 
  AND (name_en ILIKE '%meka%' OR slug ILIKE '%meka%');

-- Step 3: Update profile_image for Srikanth Meka
-- Replace the URL with the correct image URL for Srikanth Meka
-- You'll need to provide the correct image URL

-- Option A: If profile exists, update it
UPDATE celebrities 
SET 
  profile_image = 'https://example.com/srikanth-meka-correct-image.jpg',  -- Replace with actual URL
  image_url = 'https://example.com/srikanth-meka-correct-image.jpg',     -- Replace with actual URL
  updated_at = NOW()
WHERE slug = 'srikanth-meka'
   OR (name_en ILIKE '%srikanth%' AND name_en ILIKE '%meka%');

-- Option B: If profile doesn't exist, create it with correct image
-- First check if it exists:
-- SELECT id FROM celebrities WHERE slug = 'srikanth-meka';
-- 
-- If no results, create it:
-- INSERT INTO celebrities (
--   name_en,
--   name_te,
--   slug,
--   gender,
--   occupation,
--   birth_date,
--   profile_image,
--   image_url,
--   is_published,
--   created_at,
--   updated_at
-- ) VALUES (
--   'Srikanth Meka',
--   'శ్రీకాంత్ మేక',
--   'srikanth-meka',
--   'male',
--   'actor',
--   '1968-03-23',
--   'https://example.com/srikanth-meka-correct-image.jpg',  -- Replace with actual URL
--   'https://example.com/srikanth-meka-correct-image.jpg', -- Replace with actual URL
--   true,
--   NOW(),
--   NOW()
-- ) RETURNING id;

-- Step 4: Verify the update
SELECT 
  id,
  name_en,
  slug,
  profile_image,
  image_url
FROM celebrities 
WHERE slug = 'srikanth-meka';

-- Step 5: Check what image is currently being used
-- This will help identify if the wrong image is from another celebrity
SELECT 
  id,
  name_en,
  slug,
  profile_image
FROM celebrities 
WHERE profile_image IS NOT NULL
  AND (name_en ILIKE '%srikanth%' OR slug ILIKE '%srikanth%')
ORDER BY name_en;

-- Step 6: If wrong image is from Tamil actor Srikanth, ensure they're separate
-- Check Tamil actor Srikanth's profile
SELECT 
  id,
  name_en,
  slug,
  profile_image
FROM celebrities 
WHERE slug = 'srikanth'
   OR (name_en ILIKE '%srikanth%' AND name_en NOT ILIKE '%meka%' AND name_en NOT ILIKE '%addala%');

-- Notes:
-- 1. You need to find the correct image URL for Srikanth Meka
-- 2. Common sources: TMDB, Wikipedia, official profiles
-- 3. Make sure the image URL is accessible and valid
-- 4. After updating, clear any caches and test the API endpoint
