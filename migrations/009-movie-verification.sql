-- ============================================================
-- MOVIE VERIFICATION TABLE
-- Cross-reference verification system for movie data
-- ============================================================

-- Create the movie_verification table
CREATE TABLE IF NOT EXISTS movie_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  
  -- Verification status
  last_verified_at TIMESTAMPTZ,
  verification_version INT DEFAULT 1,
  overall_confidence DECIMAL(3,2) CHECK (overall_confidence >= 0 AND overall_confidence <= 1),
  data_quality_grade TEXT CHECK (data_quality_grade IN ('A','B','C','D','F')),
  
  -- Verified facts (JSONB)
  -- Structure: { field: { value, confidence, sources[], verificationLevel } }
  verified_facts JSONB DEFAULT '{}',
  
  -- Discrepancies awaiting resolution
  -- Structure: [{ field, severity, sources[], recommendedValue, requiresManualReview }]
  pending_discrepancies JSONB DEFAULT '[]',
  
  -- Resolution history
  -- Structure: [{ field, previousValue, newValue, resolvedBy, resolvedAt, reason }]
  resolution_history JSONB DEFAULT '[]',
  
  -- Raw source data for audit trail
  -- Structure: { source: { data, fetchedAt, confidence } }
  source_data JSONB DEFAULT '{}',
  
  -- Flags
  needs_manual_review BOOLEAN DEFAULT false,
  auto_apply_eligible BOOLEAN DEFAULT true,
  is_stale BOOLEAN DEFAULT false,
  
  -- Metadata
  sources_used TEXT[] DEFAULT '{}',
  fields_verified INT DEFAULT 0,
  discrepancy_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint on movie_id
  CONSTRAINT unique_movie_verification UNIQUE (movie_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_movie_verification_movie_id 
  ON movie_verification(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_verification_confidence 
  ON movie_verification(overall_confidence);

CREATE INDEX IF NOT EXISTS idx_movie_verification_grade 
  ON movie_verification(data_quality_grade);

CREATE INDEX IF NOT EXISTS idx_movie_verification_needs_review 
  ON movie_verification(needs_manual_review) 
  WHERE needs_manual_review = true;

CREATE INDEX IF NOT EXISTS idx_movie_verification_stale 
  ON movie_verification(is_stale) 
  WHERE is_stale = true;

CREATE INDEX IF NOT EXISTS idx_movie_verification_last_verified 
  ON movie_verification(last_verified_at);

-- GIN index for JSONB queries on verified_facts
CREATE INDEX IF NOT EXISTS idx_movie_verification_facts_gin 
  ON movie_verification USING gin(verified_facts);

-- GIN index for JSONB queries on pending_discrepancies
CREATE INDEX IF NOT EXISTS idx_movie_verification_discrepancies_gin 
  ON movie_verification USING gin(pending_discrepancies);

-- ============================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_movie_verification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_movie_verification_timestamp ON movie_verification;

CREATE TRIGGER trigger_update_movie_verification_timestamp
  BEFORE UPDATE ON movie_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_verification_timestamp();

-- ============================================================
-- TRIGGER: Mark as stale after 90 days
-- ============================================================

CREATE OR REPLACE FUNCTION check_verification_staleness()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_verified_at IS NOT NULL AND 
     NEW.last_verified_at < NOW() - INTERVAL '90 days' THEN
    NEW.is_stale = true;
  ELSE
    NEW.is_stale = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_verification_staleness ON movie_verification;

CREATE TRIGGER trigger_check_verification_staleness
  BEFORE INSERT OR UPDATE ON movie_verification
  FOR EACH ROW
  EXECUTE FUNCTION check_verification_staleness();

-- ============================================================
-- VIEW: Verification Summary
-- ============================================================

CREATE OR REPLACE VIEW movie_verification_summary AS
SELECT 
  mv.id,
  mv.movie_id,
  m.title_en as title,
  m.release_year,
  mv.overall_confidence,
  mv.data_quality_grade,
  mv.fields_verified,
  mv.discrepancy_count,
  mv.needs_manual_review,
  mv.is_stale,
  mv.last_verified_at,
  array_length(mv.sources_used, 1) as source_count
FROM movie_verification mv
JOIN movies m ON m.id = mv.movie_id;

-- ============================================================
-- VIEW: Movies Needing Verification
-- ============================================================

CREATE OR REPLACE VIEW movies_needing_verification AS
SELECT 
  m.id,
  m.title_en as title,
  m.release_year,
  mv.overall_confidence,
  mv.last_verified_at,
  mv.is_stale,
  CASE 
    WHEN mv.id IS NULL THEN 'never_verified'
    WHEN mv.is_stale THEN 'stale'
    WHEN mv.needs_manual_review THEN 'needs_review'
    WHEN mv.overall_confidence < 0.7 THEN 'low_confidence'
    ELSE 'ok'
  END as verification_status
FROM movies m
LEFT JOIN movie_verification mv ON m.id = mv.movie_id
WHERE mv.id IS NULL 
   OR mv.is_stale = true 
   OR mv.needs_manual_review = true
   OR mv.overall_confidence < 0.7
ORDER BY 
  CASE 
    WHEN mv.id IS NULL THEN 1
    WHEN mv.is_stale THEN 2
    WHEN mv.needs_manual_review THEN 3
    ELSE 4
  END,
  m.release_year DESC;

-- ============================================================
-- FUNCTION: Upsert verification data
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_movie_verification(
  p_movie_id UUID,
  p_verified_facts JSONB,
  p_pending_discrepancies JSONB,
  p_source_data JSONB,
  p_overall_confidence DECIMAL,
  p_data_quality_grade TEXT,
  p_needs_manual_review BOOLEAN,
  p_sources_used TEXT[]
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_fields_verified INT;
  v_discrepancy_count INT;
BEGIN
  -- Calculate counts
  SELECT COUNT(*) INTO v_fields_verified FROM jsonb_object_keys(p_verified_facts);
  SELECT jsonb_array_length(p_pending_discrepancies) INTO v_discrepancy_count;
  
  -- Upsert
  INSERT INTO movie_verification (
    movie_id,
    verified_facts,
    pending_discrepancies,
    source_data,
    overall_confidence,
    data_quality_grade,
    needs_manual_review,
    sources_used,
    fields_verified,
    discrepancy_count,
    last_verified_at,
    verification_version
  ) VALUES (
    p_movie_id,
    p_verified_facts,
    p_pending_discrepancies,
    p_source_data,
    p_overall_confidence,
    p_data_quality_grade,
    p_needs_manual_review,
    p_sources_used,
    v_fields_verified,
    v_discrepancy_count,
    NOW(),
    1
  )
  ON CONFLICT (movie_id) DO UPDATE SET
    verified_facts = EXCLUDED.verified_facts,
    pending_discrepancies = EXCLUDED.pending_discrepancies,
    source_data = EXCLUDED.source_data,
    overall_confidence = EXCLUDED.overall_confidence,
    data_quality_grade = EXCLUDED.data_quality_grade,
    needs_manual_review = EXCLUDED.needs_manual_review,
    sources_used = EXCLUDED.sources_used,
    fields_verified = EXCLUDED.fields_verified,
    discrepancy_count = EXCLUDED.discrepancy_count,
    last_verified_at = NOW(),
    verification_version = movie_verification.verification_version + 1
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Get verified value for a field
-- ============================================================

CREATE OR REPLACE FUNCTION get_verified_value(
  p_movie_id UUID,
  p_field TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT verified_facts -> p_field INTO v_result
  FROM movie_verification
  WHERE movie_id = p_movie_id
    AND overall_confidence >= 0.7
    AND (verified_facts -> p_field ->> 'confidence')::DECIMAL >= 0.75;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE movie_verification IS 'Stores cross-reference verification data for movies';
COMMENT ON COLUMN movie_verification.verified_facts IS 'JSONB object with verified facts per field';
COMMENT ON COLUMN movie_verification.pending_discrepancies IS 'JSONB array of discrepancies needing resolution';
COMMENT ON COLUMN movie_verification.resolution_history IS 'JSONB array of resolution history for audit';
COMMENT ON COLUMN movie_verification.source_data IS 'Raw source data for audit trail';

