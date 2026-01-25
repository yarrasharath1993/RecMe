-- Fix Srikanth Actors - Correct Split
-- 
-- Based on Wikipedia: https://en.wikipedia.org/wiki/Srikanth_(actor,_born_1968)
-- Meka Srikanth (born 1968) = Telugu actor, 120+ Telugu films, debuted 1991
-- Tamil actor Srikanth = Different person, Tamil/Malayalam films
--
-- Strategy: Use movie characteristics to identify which actor:
-- - Telugu movies (especially 1991-2025) = Srikanth Meka
-- - Tamil/Malayalam movies = Tamil actor Srikanth

-- Step 1: Check current celebrity profiles
SELECT id, name_en, name_te, slug, is_published 
FROM celebrities 
WHERE name_en ILIKE '%srikanth%' OR name_te ILIKE '%srikanth%'
ORDER BY name_en;

-- Step 2: Analyze movie distribution by language and year
SELECT 
  language,
  COUNT(*) as movie_count,
  MIN(release_year) as first_year,
  MAX(release_year) as last_year,
  STRING_AGG(DISTINCT hero, ', ' ORDER BY hero) as hero_names
FROM movies
WHERE hero ILIKE '%srikanth%' AND is_published = true
GROUP BY language
ORDER BY movie_count DESC;

-- Step 3: Identify movies that should belong to Srikanth Meka (Telugu actor)
-- These are Telugu movies, especially from 1991 onwards
SELECT 
  id, title_en, hero, release_year, language
FROM movies
WHERE hero ILIKE '%srikanth%' 
  AND is_published = true
  AND (
    language = 'Telugu' 
    OR (language IS NULL AND release_year >= 1991)  -- Default to Telugu if language missing
  )
ORDER BY release_year DESC
LIMIT 50;

-- Step 4: Identify movies that should belong to Tamil actor Srikanth
-- These are Tamil/Malayalam movies
SELECT 
  id, title_en, hero, release_year, language
FROM movies
WHERE hero ILIKE '%srikanth%' 
  AND is_published = true
  AND language IN ('Tamil', 'Malayalam')
ORDER BY release_year DESC
LIMIT 50;

-- Step 5: Update hero names in movies to be more specific
-- Update Telugu movies to say "Srikanth Meka" or "Meka Srikanth" instead of just "Srikanth"
-- This helps the API distinguish them

-- First, let's see which Telugu movies have just "Srikanth" as hero
SELECT 
  id, title_en, hero, release_year
FROM movies
WHERE hero = 'Srikanth'  -- Exact match, not "Srikanth Meka"
  AND language = 'Telugu'
  AND is_published = true
ORDER BY release_year DESC;

-- Update Telugu movies to use "Srikanth Meka" for clarity
-- (Only update if hero is exactly "Srikanth", not if it already says "Srikanth Meka" or "Meka Srikanth")
UPDATE movies
SET 
  hero = 'Srikanth Meka',
  updated_at = NOW()
WHERE hero = 'Srikanth'  -- Exact match only
  AND language = 'Telugu'
  AND is_published = true
  AND release_year >= 1991;  -- Srikanth Meka's career started in 1991

-- Step 6: Ensure celebrity profiles have correct slugs
-- Update/create Tamil actor Srikanth (for Tamil/Malayalam movies)
UPDATE celebrities 
SET 
  slug = 'srikanth',
  name_en = 'Srikanth',
  name_te = 'ஸ்ரீகாந்த்',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM celebrities 
  WHERE (name_en ILIKE '%srikanth%' AND name_en NOT ILIKE '%meka%' AND name_en NOT ILIKE '%addala%')
  OR slug = 'srikanth'
  LIMIT 1
);

-- If Tamil actor Srikanth doesn't exist, create it:
-- INSERT INTO celebrities (
--   name_en, name_te, slug, gender, occupation, is_published, created_at, updated_at
-- ) VALUES (
--   'Srikanth', 'ஸ்ரீகாந்த்', 'srikanth', 'male', 'actor', true, NOW(), NOW()
-- ) RETURNING id;

-- Update/create Srikanth Meka (Telugu actor, born 1968)
UPDATE celebrities 
SET 
  slug = 'srikanth-meka',
  name_en = 'Srikanth Meka',
  name_te = 'శ్రీకాంత్ మేక',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM celebrities 
  WHERE (name_en ILIKE '%srikanth%' AND (name_en ILIKE '%meka%' OR name_en ILIKE '%addala%'))
  OR slug = 'srikanth-meka'
  LIMIT 1
);

-- If Srikanth Meka doesn't exist, create it:
-- INSERT INTO celebrities (
--   name_en, name_te, slug, gender, occupation, birth_date, is_published, created_at, updated_at
-- ) VALUES (
--   'Srikanth Meka', 'శ్రీకాంత్ మేక', 'srikanth-meka', 'male', 'actor', '1968-03-23', true, NOW(), NOW()
-- ) RETURNING id;

-- Step 7: Verify the fix
-- Check celebrity profiles
SELECT id, name_en, name_te, slug, is_published 
FROM celebrities 
WHERE slug IN ('srikanth', 'srikanth-meka')
ORDER BY slug;

-- Check movie distribution after update
SELECT 
  hero,
  language,
  COUNT(*) as movie_count,
  MIN(release_year) as first_year,
  MAX(release_year) as last_year
FROM movies
WHERE hero ILIKE '%srikanth%' AND is_published = true
GROUP BY hero, language
ORDER BY hero, language;

-- Step 8: Test API responses
-- After running this, test:
-- curl "http://localhost:3000/api/profile/srikanth" | jq '.person.name, .all_movies | length'
-- curl "http://localhost:3000/api/profile/srikanth-meka" | jq '.person.name, .all_movies | length'
