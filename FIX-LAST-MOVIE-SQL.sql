-- =============================================================================
-- FIX LAST MOVIE AND REACH 100% TELUGU COMPLETION
-- =============================================================================
-- Run this in Supabase SQL Editor to publish the last movie
-- Movie: Jayammu Nischayammu Raa (2016)
-- Issue: Database index size limitation
-- =============================================================================

-- Step 1: Drop the problematic index temporarily
DROP INDEX IF EXISTS idx_movies_enrichment_quality;

-- Step 2: Publish the last movie
UPDATE movies 
SET is_published = true 
WHERE id = '340635c8-f4a4-410e-aa3f-ed1ba3f314f3';

-- Step 3: Recreate the index with fewer columns (more efficient)
CREATE INDEX idx_movies_enrichment_quality 
ON movies(completeness_score, data_confidence, is_published) 
WHERE completeness_score IS NOT NULL;

-- Step 4: Verify completion
SELECT 
  COUNT(*) FILTER (WHERE is_published = true) as published_count,
  COUNT(*) as total_count,
  ROUND((COUNT(*) FILTER (WHERE is_published = true)::decimal / COUNT(*) * 100), 2) as completion_percentage
FROM movies 
WHERE language = 'Telugu';

-- =============================================================================
-- RESULT: Should show 5529/5529 (100%) Telugu movies published!
-- =============================================================================
