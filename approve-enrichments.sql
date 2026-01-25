-- ============================================================
-- APPROVE HIGH-CONFIDENCE CELEBRITY ENRICHMENTS
-- ============================================================
-- Run this in Supabase SQL Editor before applying enrichments
-- ============================================================

-- Option 1: Auto-approve all high-confidence (>=70%) enrichments
UPDATE celebrity_wiki_enrichments 
SET 
  status = 'approved',
  reviewed_at = NOW()
WHERE 
  confidence_score >= 0.7 
  AND status = 'pending';

-- Check results
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(confidence_score * 100)) as avg_confidence
FROM celebrity_wiki_enrichments
GROUP BY status
ORDER BY status;

-- ============================================================
-- OPTIONAL: Review specific enrichments before approving
-- ============================================================

-- View enrichments by confidence tier
SELECT 
  CASE 
    WHEN confidence_score >= 0.8 THEN '🟢 Excellent (80-100%)'
    WHEN confidence_score >= 0.7 THEN '🟡 High (70-79%)'
    WHEN confidence_score >= 0.5 THEN '🟠 Medium (50-69%)'
    ELSE '🔴 Low (<50%)'
  END as quality_tier,
  COUNT(*) as count,
  ROUND(AVG(confidence_score * 100)) as avg_confidence
FROM celebrity_wiki_enrichments
WHERE status = 'pending'
GROUP BY 
  CASE 
    WHEN confidence_score >= 0.8 THEN '🟢 Excellent (80-100%)'
    WHEN confidence_score >= 0.7 THEN '🟡 High (70-79%)'
    WHEN confidence_score >= 0.5 THEN '🟠 Medium (50-69%)'
    ELSE '🔴 Low (<50%)'
  END
ORDER BY MIN(confidence_score) DESC;

-- ============================================================
-- OPTIONAL: Preview what will be applied
-- ============================================================

SELECT 
  c.name_en,
  e.confidence_score,
  e.full_bio IS NOT NULL as has_bio,
  e.date_of_birth IS NOT NULL as has_dob,
  e.place_of_birth IS NOT NULL as has_birthplace,
  e.family_relationships IS NOT NULL as has_family,
  e.awards_count,
  e.source_url
FROM celebrity_wiki_enrichments e
JOIN celebrities c ON e.celebrity_id = c.id
WHERE e.status = 'approved'
ORDER BY e.confidence_score DESC
LIMIT 30;

-- ============================================================
-- OPTIONAL: Approve specific celebrities by name
-- ============================================================

-- Example: Approve enrichments for specific celebrities
-- UPDATE celebrity_wiki_enrichments e
-- SET status = 'approved', reviewed_at = NOW()
-- FROM celebrities c
-- WHERE e.celebrity_id = c.id
--   AND c.name_en IN ('Chiranjeevi', 'Prabhas', 'Ram Charan')
--   AND e.status = 'pending';

-- ============================================================
-- OPTIONAL: Reject low-quality enrichments
-- ============================================================

-- Example: Reject very low confidence enrichments
-- UPDATE celebrity_wiki_enrichments 
-- SET 
--   status = 'rejected',
--   reviewed_at = NOW(),
--   review_notes = 'Auto-rejected: confidence too low'
-- WHERE 
--   confidence_score < 0.4 
--   AND status = 'pending';
