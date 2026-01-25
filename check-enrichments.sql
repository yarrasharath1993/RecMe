-- Quick stats query to run in Supabase

-- 1. Overall stats
SELECT * FROM get_enrichment_stats();

-- 2. High-confidence enrichments (ready for quick approval)
SELECT 
  name_en,
  confidence_score,
  CASE 
    WHEN full_bio IS NOT NULL THEN '✓' ELSE '○' 
  END as has_bio,
  CASE 
    WHEN date_of_birth IS NOT NULL THEN '✓' ELSE '○' 
  END as has_dob,
  CASE 
    WHEN family_relationships IS NOT NULL THEN '✓' ELSE '○' 
  END as has_family,
  source_url
FROM celebrity_enrichments_high_confidence
ORDER BY confidence_score DESC
LIMIT 20;

-- 3. Sample enrichment data
SELECT 
  name_en,
  LEFT(full_bio, 100) || '...' as bio_preview,
  date_of_birth,
  place_of_birth,
  occupation,
  awards_count,
  confidence_score
FROM celebrity_enrichments_high_confidence
LIMIT 5;
