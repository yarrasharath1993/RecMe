-- ============================================================
-- MIGRATION 033: Confidence Scoring System
-- ============================================================
-- Adds confidence scoring fields to movies table for tracking
-- data quality and source reliability.
--
-- ADDITIVE ONLY - No destructive changes
-- ============================================================

-- Add confidence fields to movies table
ALTER TABLE movies ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS confidence_breakdown JSONB DEFAULT '{}';
ALTER TABLE movies ADD COLUMN IF NOT EXISTS inference_flags TEXT[] DEFAULT '{}';
ALTER TABLE movies ADD COLUMN IF NOT EXISTS last_confidence_calc TIMESTAMPTZ;

-- Add governance flags (if not exists from previous migrations)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS governance_flags TEXT[] DEFAULT '{}';

-- Comments for documentation
COMMENT ON COLUMN movies.confidence_score IS 
  'Overall data confidence score (0.00-1.00). Calculated from source count, validation consensus, completeness, and external ID presence.';

COMMENT ON COLUMN movies.confidence_breakdown IS 
  'Detailed confidence breakdown by category. Structure: {
    "cast_confidence": 0.95,
    "metadata_confidence": 0.85,
    "image_confidence": 0.90,
    "review_confidence": 0.80,
    "sources": ["tmdb", "wikipedia"],
    "source_count": 2,
    "external_ids": 3,
    "manual_overrides": 0,
    "validation_consensus": 0.90,
    "completeness": 0.85
  }';

COMMENT ON COLUMN movies.inference_flags IS 
  'Array of flags indicating inferred/derived data. Values: "inferred_music_director", "inferred_producer", "inferred_supporting_cast", "low_confidence", "needs_review"';

COMMENT ON COLUMN movies.last_confidence_calc IS 
  'Timestamp of last confidence score calculation. Updated weekly by backfill job.';

COMMENT ON COLUMN movies.governance_flags IS 
  'Data quality and governance flags. Values: "low_confidence", "has_inferences", "needs_review", "disputed_data", "manual_override", "high_quality", "verified"';

-- ============================================================
-- INDEXES
-- ============================================================

-- Index for finding low-confidence movies
CREATE INDEX IF NOT EXISTS idx_movies_confidence_score 
  ON movies(confidence_score) 
  WHERE confidence_score < 0.60;

-- Index for finding movies with inferences
CREATE INDEX IF NOT EXISTS idx_movies_inference_flags 
  ON movies USING GIN (inference_flags) 
  WHERE array_length(inference_flags, 1) > 0;

-- Index for finding movies needing review
CREATE INDEX IF NOT EXISTS idx_movies_governance_flags 
  ON movies USING GIN (governance_flags) 
  WHERE array_length(governance_flags, 1) > 0;

-- Index for confidence calculation tracking
CREATE INDEX IF NOT EXISTS idx_movies_last_confidence_calc 
  ON movies(last_confidence_calc DESC NULLS LAST);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to check if movie needs confidence recalculation
CREATE OR REPLACE FUNCTION needs_confidence_recalc(
  p_movie_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_calc TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
BEGIN
  SELECT last_confidence_calc, updated_at
  INTO v_last_calc, v_updated_at
  FROM movies
  WHERE id = p_movie_id;
  
  -- Recalc if never calculated or if movie updated after last calc
  RETURN (v_last_calc IS NULL) 
    OR (v_updated_at > v_last_calc)
    OR (v_last_calc < NOW() - INTERVAL '7 days'); -- Or >7 days old
END;
$$ LANGUAGE plpgsql;

-- Function to add inference flag
CREATE OR REPLACE FUNCTION add_inference_flag(
  p_movie_id UUID,
  p_flag TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE movies
  SET inference_flags = array_append(
    COALESCE(inference_flags, '{}'::TEXT[]),
    p_flag
  )
  WHERE id = p_movie_id
    AND NOT (p_flag = ANY(COALESCE(inference_flags, '{}'::TEXT[])));
END;
$$ LANGUAGE plpgsql;

-- Function to add governance flag
CREATE OR REPLACE FUNCTION add_governance_flag(
  p_movie_id UUID,
  p_flag TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE movies
  SET governance_flags = array_append(
    COALESCE(governance_flags, '{}'::TEXT[]),
    p_flag
  )
  WHERE id = p_movie_id
    AND NOT (p_flag = ANY(COALESCE(governance_flags, '{}'::TEXT[])));
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VALIDATION CHECK CONSTRAINTS
-- ============================================================

-- Ensure confidence_score is in valid range
ALTER TABLE movies DROP CONSTRAINT IF EXISTS chk_confidence_score_range;
ALTER TABLE movies ADD CONSTRAINT chk_confidence_score_range 
  CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));

-- Ensure confidence_breakdown is an object
ALTER TABLE movies DROP CONSTRAINT IF EXISTS chk_confidence_breakdown_object;
ALTER TABLE movies ADD CONSTRAINT chk_confidence_breakdown_object 
  CHECK (confidence_breakdown IS NULL OR jsonb_typeof(confidence_breakdown) = 'object');

-- ============================================================
-- VIEWS FOR QUALITY MONITORING
-- ============================================================

-- View: Low confidence movies requiring review
CREATE OR REPLACE VIEW low_confidence_movies AS
SELECT 
  id,
  title_en,
  slug,
  confidence_score,
  confidence_breakdown,
  inference_flags,
  governance_flags,
  last_confidence_calc,
  updated_at
FROM movies
WHERE confidence_score < 0.60
  OR 'low_confidence' = ANY(governance_flags)
  OR 'needs_review' = ANY(governance_flags)
ORDER BY confidence_score ASC NULLS FIRST, updated_at DESC;

-- View: Movies with inferences
CREATE OR REPLACE VIEW movies_with_inferences AS
SELECT 
  id,
  title_en,
  slug,
  confidence_score,
  inference_flags,
  array_length(inference_flags, 1) as inference_count,
  last_confidence_calc
FROM movies
WHERE array_length(inference_flags, 1) > 0
ORDER BY array_length(inference_flags, 1) DESC, confidence_score ASC;

-- View: Confidence score distribution
CREATE OR REPLACE VIEW confidence_score_distribution AS
SELECT 
  CASE 
    WHEN confidence_score >= 0.90 THEN '0.90-1.00 (Excellent)'
    WHEN confidence_score >= 0.80 THEN '0.80-0.89 (High)'
    WHEN confidence_score >= 0.70 THEN '0.70-0.79 (Good)'
    WHEN confidence_score >= 0.60 THEN '0.60-0.69 (Medium)'
    WHEN confidence_score >= 0.50 THEN '0.50-0.59 (Low)'
    WHEN confidence_score < 0.50 THEN '0.00-0.49 (Very Low)'
    ELSE 'Not Calculated'
  END as confidence_range,
  COUNT(*) as movie_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM movies), 2) as percentage
FROM movies
GROUP BY 
  CASE 
    WHEN confidence_score >= 0.90 THEN '0.90-1.00 (Excellent)'
    WHEN confidence_score >= 0.80 THEN '0.80-0.89 (High)'
    WHEN confidence_score >= 0.70 THEN '0.70-0.79 (Good)'
    WHEN confidence_score >= 0.60 THEN '0.60-0.69 (Medium)'
    WHEN confidence_score >= 0.50 THEN '0.50-0.59 (Low)'
    WHEN confidence_score < 0.50 THEN '0.00-0.49 (Very Low)'
    ELSE 'Not Calculated'
  END
ORDER BY confidence_range;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE 'Migration 033 (Confidence Scoring) completed successfully';
  RAISE NOTICE 'Added fields: confidence_score, confidence_breakdown, inference_flags, last_confidence_calc';
  RAISE NOTICE 'Created indexes: confidence_score, inference_flags, governance_flags';
  RAISE NOTICE 'Created views: low_confidence_movies, movies_with_inferences, confidence_score_distribution';
  RAISE NOTICE 'Created functions: needs_confidence_recalc(), add_inference_flag(), add_governance_flag()';
END $$;
