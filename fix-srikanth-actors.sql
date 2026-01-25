-- Fix Srikanth Actors - Separate Tamil actor Srikanth from Srikanth Meka
-- 
-- Tamil actor Srikanth → slug: "srikanth"
-- Srikanth Meka → slug: "srikanth-meka"

-- Step 1: Check current state
SELECT id, name_en, name_te, slug, is_published 
FROM celebrities 
WHERE name_en ILIKE '%srikanth%' OR name_te ILIKE '%srikanth%'
ORDER BY name_en;

-- Step 2: Find movies with "srikanth" as hero to understand the split
SELECT 
  hero, 
  COUNT(*) as movie_count,
  STRING_AGG(DISTINCT language, ', ') as languages,
  MIN(release_year) as first_year,
  MAX(release_year) as last_year
FROM movies
WHERE hero ILIKE '%srikanth%' AND is_published = true
GROUP BY hero
ORDER BY movie_count DESC;

-- Step 3: Update or create Tamil actor Srikanth profile
-- First, check if one exists (you may need to identify the correct ID)
-- If exists, update:
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

-- If doesn't exist, create:
-- INSERT INTO celebrities (
--   name_en, name_te, slug, gender, occupation, is_published, created_at, updated_at
-- ) VALUES (
--   'Srikanth', 'ஸ்ரீகாந்த்', 'srikanth', 'male', 'actor', true, NOW(), NOW()
-- ) RETURNING id;

-- Step 4: Update or create Srikanth Meka profile
-- If exists, update:
UPDATE celebrities 
SET 
  slug = 'srikanth-meka',
  name_en = 'Srikanth Meka',
  name_te = 'శ్రీకాంత్ మేక',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM celebrities 
  WHERE name_en ILIKE '%srikanth%' AND (name_en ILIKE '%meka%' OR name_en ILIKE '%addala%')
  LIMIT 1
);

-- If doesn't exist, create:
-- INSERT INTO celebrities (
--   name_en, name_te, slug, gender, occupation, is_published, created_at, updated_at
-- ) VALUES (
--   'Srikanth Meka', 'శ్రీకాంత్ మేక', 'srikanth-meka', 'male', 'actor', true, NOW(), NOW()
-- ) RETURNING id;

-- Step 5: Verify the fix
SELECT id, name_en, name_te, slug, is_published 
FROM celebrities 
WHERE slug IN ('srikanth', 'srikanth-meka')
ORDER BY slug;

-- Step 6: Check movie distribution (optional - to verify movies are correctly attributed)
-- Tamil Srikanth movies (should be mostly Tamil/Malayalam)
SELECT 
  title_en, 
  hero, 
  release_year, 
  language,
  CASE 
    WHEN title_en ILIKE ANY(ARRAY['%blackmail%', '%dinasari%', '%konjam%', '%mathru%', '%operation%', '%sathamindri%', '%aanandhapuram%', '%maya%', '%bagheera%', '%kannai%', '%echo%', '%amala%', '%pindam%', '%ravanasura%', '%maha%', '%coffee%', '%10th%', '%mirugaa%', '%y%', '%jai%', '%asalem%', '%rocky%', '%raagala%', '%marshal%', '%lie%', '%sowkarpettai%', '%nambiar%', '%sarrainodu%', '%om shanti%', '%kathai%', '%nanban%', '%paagan%', '%hero%', '%nippu%', '%sathurangam%', '%dhada%', '%uppukandam%', '%drohi%', '%rasikkum%', '%police%', '%indira%', '%poo%', '%vallamai%', '%aadavari%', '%mercury%', '%uyir%', '%kizhakku%', '%kana%', '%oru naal%', '%bambara%', '%aayitha%', '%bose%', '%varnajalam%', '%parthiban%', '%priyamana%', '%manasellam%', '%okariki%', '%roja%', '%april%']) 
    THEN 'Tamil Srikanth'
    WHEN hero ILIKE '%meka%' OR hero ILIKE '%addala%'
    THEN 'Srikanth Meka'
    ELSE 'Unknown'
  END as actor_category
FROM movies
WHERE hero ILIKE '%srikanth%' AND is_published = true
ORDER BY release_year DESC
LIMIT 50;
