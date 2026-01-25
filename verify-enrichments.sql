-- Verify Celebrity Enrichments

-- 1. Check how many were applied
SELECT 
  status,
  COUNT(*) as count
FROM celebrity_wiki_enrichments
GROUP BY status
ORDER BY status;

-- 2. View recently updated celebrities with new data
SELECT 
  name_en,
  full_bio IS NOT NULL as has_bio,
  date_of_birth,
  place_of_birth,
  education,
  family_relationships IS NOT NULL as has_family,
  known_for,
  industry_title,
  updated_at
FROM celebrities
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 20;

-- 3. Sample enriched celebrity data
SELECT 
  name_en,
  LEFT(full_bio, 200) || '...' as bio_preview,
  date_of_birth,
  place_of_birth,
  industry_title
FROM celebrities
WHERE full_bio IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;
