-- ============================================================
-- MIGRATION 035: Inference Audit Log
-- ============================================================
-- Creates comprehensive audit trail for all automated inferences,
-- pattern-based gap filling, and AI-generated content.
--
-- PURPOSE: Track every inference with evidence, confidence, and
-- review status for:
-- - Data quality governance
-- - Inference accuracy tracking
-- - Manual review workflow
-- - Evidence-based decision making
-- - Compliance and transparency
--
-- ADDITIVE ONLY - No destructive changes
-- ============================================================

-- ============================================================
-- MAIN TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS inference_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity being inferred
  entity_type TEXT NOT NULL, -- 'movie', 'celebrity', 'relation', 'review', 'impact_analysis'
  entity_id UUID NOT NULL, -- ID of the movie, celebrity, or relation
  entity_identifier TEXT, -- Human-readable identifier (movie title, celebrity name)
  field_name TEXT NOT NULL, -- Which field was inferred ('music_director', 'producer', 'supporting_cast', etc.)
  
  -- Inference details
  inference_type TEXT NOT NULL, -- 'auto_fill', 'similarity', 'pattern', 'collaboration', 'confidence_calc', 'impact_analysis', 'counterfactual'
  inferred_value TEXT, -- The value that was inferred (JSON string for complex values)
  previous_value TEXT, -- Previous value if this was an update (NULL if new)
  confidence DECIMAL(3,2) NOT NULL, -- Confidence score (0.00-1.00)
  
  -- Evidence and reasoning
  evidence JSONB NOT NULL DEFAULT '{}', -- Supporting data and reasoning
  -- Example structure:
  -- {
  --   "method": "similarity_based",
  --   "similar_movies": [{"id": "...", "title": "...", "music_director": "...", "similarity": 0.85}],
  --   "pattern_strength": 0.85,
  --   "source_count": 3,
  --   "sources": ["tmdb", "wikipedia"],
  --   "collaboration_count": 5,
  --   "confidence_factors": {
  --     "similarity_score": 0.85,
  --     "pattern_frequency": 0.80,
  --     "source_agreement": 0.90
  --   },
  --   "reasoning": "Found in 4/5 similar movies with same hero+director combo"
  -- }
  
  -- Review workflow
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'disputed', 'auto_approved'
  review_priority TEXT, -- 'high', 'medium', 'low'
  reviewed_by TEXT, -- User ID or system that reviewed
  reviewed_at TIMESTAMPTZ, -- When review was completed
  review_notes TEXT, -- Manual review notes
  
  -- Applied to system
  applied BOOLEAN DEFAULT false, -- Whether this inference was actually applied
  applied_at TIMESTAMPTZ, -- When it was applied
  applied_by TEXT, -- Who/what applied it
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system',
  inference_source TEXT, -- Which script/job created this: 'autofill-music-directors', 'gap-filler', 'impact-analyzer'
  batch_id UUID, -- Group related inferences from same run
  
  -- Constraints
  CONSTRAINT chk_confidence_range CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT chk_entity_type CHECK (entity_type IN ('movie', 'celebrity', 'relation', 'review', 'impact_analysis', 'other')),
  CONSTRAINT chk_inference_type CHECK (inference_type IN ('auto_fill', 'similarity', 'pattern', 'collaboration', 'confidence_calc', 'impact_analysis', 'counterfactual', 'ai_generated', 'other')),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'rejected', 'disputed', 'auto_approved', 'expired')),
  CONSTRAINT chk_review_priority CHECK (review_priority IS NULL OR review_priority IN ('high', 'medium', 'low'))
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_inference_audit_entity 
  ON inference_audit_log(entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_inference_audit_entity_field 
  ON inference_audit_log(entity_id, field_name);

-- Status and workflow queries
CREATE INDEX IF NOT EXISTS idx_inference_audit_status 
  ON inference_audit_log(status);

CREATE INDEX IF NOT EXISTS idx_inference_audit_pending 
  ON inference_audit_log(status, review_priority, created_at DESC) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_inference_audit_approved 
  ON inference_audit_log(status, applied, applied_at DESC) 
  WHERE status = 'approved';

-- Confidence queries
CREATE INDEX IF NOT EXISTS idx_inference_audit_confidence 
  ON inference_audit_log(confidence DESC);

CREATE INDEX IF NOT EXISTS idx_inference_audit_low_confidence 
  ON inference_audit_log(confidence, created_at DESC) 
  WHERE confidence < 0.60;

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_inference_audit_date 
  ON inference_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inference_audit_reviewed_date 
  ON inference_audit_log(reviewed_at DESC) 
  WHERE reviewed_at IS NOT NULL;

-- Source tracking
CREATE INDEX IF NOT EXISTS idx_inference_audit_source 
  ON inference_audit_log(inference_source);

CREATE INDEX IF NOT EXISTS idx_inference_audit_batch 
  ON inference_audit_log(batch_id) 
  WHERE batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inference_audit_type 
  ON inference_audit_log(inference_type);

-- Combined indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inference_audit_status_confidence 
  ON inference_audit_log(status, confidence DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inference_audit_entity_status 
  ON inference_audit_log(entity_type, entity_id, status);

-- Full-text search on reasoning
CREATE INDEX IF NOT EXISTS idx_inference_audit_evidence_gin 
  ON inference_audit_log USING gin (evidence);

CREATE INDEX IF NOT EXISTS idx_inference_audit_identifier_trgm 
  ON inference_audit_log USING gin (entity_identifier gin_trgm_ops);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-set review priority based on confidence
CREATE OR REPLACE FUNCTION set_inference_review_priority()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.review_priority IS NULL THEN
    NEW.review_priority := CASE 
      WHEN NEW.confidence >= 0.65 THEN 'high'
      WHEN NEW.confidence >= 0.55 THEN 'medium'
      ELSE 'low'
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_inference_review_priority
  BEFORE INSERT ON inference_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION set_inference_review_priority();

-- Auto-apply high-confidence inferences (optional, can be disabled)
CREATE OR REPLACE FUNCTION auto_apply_high_confidence_inference()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve if confidence >= 0.80 and from trusted source
  IF NEW.confidence >= 0.80 
     AND NEW.inference_type IN ('similarity', 'collaboration')
     AND NEW.status = 'pending' THEN
    NEW.status := 'auto_approved';
    NEW.reviewed_at := NOW();
    NEW.reviewed_by := 'auto_approval_system';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger is created but not enabled by default
-- Enable with: ALTER TABLE inference_audit_log ENABLE TRIGGER trigger_auto_apply_high_confidence;
CREATE TRIGGER trigger_auto_apply_high_confidence
  BEFORE INSERT ON inference_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION auto_apply_high_confidence_inference();

-- Disable by default (enable manually if needed)
ALTER TABLE inference_audit_log DISABLE TRIGGER trigger_auto_apply_high_confidence;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function: Log a new inference
CREATE OR REPLACE FUNCTION log_inference(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_identifier TEXT,
  p_field_name TEXT,
  p_inference_type TEXT,
  p_inferred_value TEXT,
  p_confidence DECIMAL,
  p_evidence JSONB,
  p_inference_source TEXT DEFAULT 'system',
  p_batch_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO inference_audit_log (
    entity_type,
    entity_id,
    entity_identifier,
    field_name,
    inference_type,
    inferred_value,
    confidence,
    evidence,
    inference_source,
    batch_id
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_entity_identifier,
    p_field_name,
    p_inference_type,
    p_inferred_value,
    p_confidence,
    p_evidence,
    p_inference_source,
    p_batch_id
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Approve an inference
CREATE OR REPLACE FUNCTION approve_inference(
  p_log_id UUID,
  p_reviewed_by TEXT,
  p_review_notes TEXT DEFAULT NULL,
  p_apply BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inference_audit_log
  SET 
    status = 'approved',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    review_notes = COALESCE(p_review_notes, review_notes),
    applied = p_apply,
    applied_at = CASE WHEN p_apply THEN NOW() ELSE NULL END,
    applied_by = CASE WHEN p_apply THEN p_reviewed_by ELSE NULL END
  WHERE id = p_log_id
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Reject an inference
CREATE OR REPLACE FUNCTION reject_inference(
  p_log_id UUID,
  p_reviewed_by TEXT,
  p_review_notes TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inference_audit_log
  SET 
    status = 'rejected',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    review_notes = p_review_notes,
    applied = false
  WHERE id = p_log_id
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Bulk approve high-confidence inferences
CREATE OR REPLACE FUNCTION bulk_approve_high_confidence(
  p_min_confidence DECIMAL DEFAULT 0.70,
  p_reviewed_by TEXT DEFAULT 'bulk_approval_system',
  p_limit INTEGER DEFAULT 100
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE inference_audit_log
  SET 
    status = 'approved',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    applied = true,
    applied_at = NOW(),
    applied_by = p_reviewed_by
  WHERE id IN (
    SELECT id
    FROM inference_audit_log
    WHERE status = 'pending'
      AND confidence >= p_min_confidence
      AND inference_type IN ('similarity', 'collaboration')
    LIMIT p_limit
  );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get pending inferences for review
CREATE OR REPLACE FUNCTION get_pending_inferences_for_review(
  p_min_confidence DECIMAL DEFAULT 0.50,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  entity_identifier TEXT,
  field_name TEXT,
  inferred_value TEXT,
  confidence DECIMAL,
  evidence JSONB,
  review_priority TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ial.id,
    ial.entity_identifier,
    ial.field_name,
    ial.inferred_value,
    ial.confidence,
    ial.evidence,
    ial.review_priority,
    ial.created_at
  FROM inference_audit_log ial
  WHERE ial.status = 'pending'
    AND ial.confidence >= p_min_confidence
  ORDER BY 
    CASE ial.review_priority
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      ELSE 3
    END,
    ial.confidence DESC,
    ial.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get inference statistics
CREATE OR REPLACE FUNCTION get_inference_statistics()
RETURNS TABLE (
  metric TEXT,
  value BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_inferences'::TEXT, COUNT(*)::BIGINT FROM inference_audit_log
  UNION ALL
  SELECT 'pending', COUNT(*)::BIGINT FROM inference_audit_log WHERE status = 'pending'
  UNION ALL
  SELECT 'approved', COUNT(*)::BIGINT FROM inference_audit_log WHERE status = 'approved'
  UNION ALL
  SELECT 'rejected', COUNT(*)::BIGINT FROM inference_audit_log WHERE status = 'rejected'
  UNION ALL
  SELECT 'applied', COUNT(*)::BIGINT FROM inference_audit_log WHERE applied = true
  UNION ALL
  SELECT 'high_confidence', COUNT(*)::BIGINT FROM inference_audit_log WHERE confidence >= 0.70
  UNION ALL
  SELECT 'medium_confidence', COUNT(*)::BIGINT FROM inference_audit_log WHERE confidence >= 0.55 AND confidence < 0.70
  UNION ALL
  SELECT 'low_confidence', COUNT(*)::BIGINT FROM inference_audit_log WHERE confidence < 0.55;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VIEWS FOR ANALYSIS
-- ============================================================

-- View: Review queue with priorities
CREATE OR REPLACE VIEW inference_review_queue AS
SELECT 
  ial.id,
  ial.entity_type,
  ial.entity_identifier,
  ial.field_name,
  ial.inference_type,
  ial.inferred_value,
  ial.confidence,
  ial.evidence,
  ial.review_priority,
  ial.created_at,
  ial.inference_source,
  CASE 
    WHEN ial.confidence >= 0.70 THEN 'Likely correct - quick review'
    WHEN ial.confidence >= 0.60 THEN 'Probably correct - needs verification'
    WHEN ial.confidence >= 0.50 THEN 'Uncertain - careful review needed'
    ELSE 'Low confidence - thorough review required'
  END as recommendation
FROM inference_audit_log ial
WHERE ial.status = 'pending'
ORDER BY 
  CASE ial.review_priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    ELSE 3
  END,
  ial.confidence DESC,
  ial.created_at ASC;

-- View: Inference accuracy metrics (approved vs rejected)
CREATE OR REPLACE VIEW inference_accuracy_metrics AS
SELECT 
  inference_type,
  COUNT(*) as total_inferences,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  ROUND(COUNT(*) FILTER (WHERE status = 'approved') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status IN ('approved', 'rejected')), 0), 2) as approval_rate,
  ROUND(AVG(confidence), 3) as avg_confidence,
  ROUND(AVG(confidence) FILTER (WHERE status = 'approved'), 3) as avg_confidence_approved,
  ROUND(AVG(confidence) FILTER (WHERE status = 'rejected'), 3) as avg_confidence_rejected
FROM inference_audit_log
GROUP BY inference_type
ORDER BY total_inferences DESC;

-- View: Recent inference activity
CREATE OR REPLACE VIEW recent_inference_activity AS
SELECT 
  ial.id,
  ial.entity_identifier,
  ial.field_name,
  ial.inference_type,
  ial.inferred_value,
  ial.confidence,
  ial.status,
  ial.created_at,
  ial.reviewed_at,
  ial.reviewed_by,
  ial.applied
FROM inference_audit_log ial
ORDER BY ial.created_at DESC
LIMIT 100;

-- View: Batch inference summary
CREATE OR REPLACE VIEW batch_inference_summary AS
SELECT 
  ial.batch_id,
  ial.inference_source,
  COUNT(*) as total_inferences,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE applied = true) as applied,
  ROUND(AVG(confidence), 3) as avg_confidence,
  MIN(created_at) as batch_started,
  MAX(created_at) as batch_ended,
  COUNT(DISTINCT entity_id) as entities_affected
FROM inference_audit_log ial
WHERE batch_id IS NOT NULL
GROUP BY ial.batch_id, ial.inference_source
ORDER BY batch_started DESC;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE inference_audit_log IS 
  'Comprehensive audit trail for all automated inferences, pattern-based gap filling, and AI-generated content. Tracks evidence, confidence, and review status for data quality governance.';

COMMENT ON COLUMN inference_audit_log.evidence IS 
  'JSONB object containing all supporting evidence for the inference, including similar movies, pattern strength, source agreement, collaboration history, and reasoning.';

COMMENT ON COLUMN inference_audit_log.confidence IS 
  'Confidence score (0.00-1.00) for this inference. Auto-approval threshold: 0.80+, Manual review: <0.70';

COMMENT ON COLUMN inference_audit_log.review_priority IS 
  'Auto-assigned based on confidence: high (0.65+), medium (0.55-0.64), low (<0.55)';

COMMENT ON COLUMN inference_audit_log.applied IS 
  'Whether this inference was actually written to the database. Can be approved but not yet applied.';

-- ============================================================
-- STATISTICS
-- ============================================================

ANALYZE inference_audit_log;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE 'Migration 035 (Inference Audit Log) completed successfully';
  RAISE NOTICE 'Created table: inference_audit_log with comprehensive inference tracking';
  RAISE NOTICE 'Created indexes: 15 indexes for query optimization';
  RAISE NOTICE 'Created functions: log_inference(), approve_inference(), reject_inference(), bulk_approve_high_confidence(), get_pending_inferences_for_review(), get_inference_statistics()';
  RAISE NOTICE 'Created views: inference_review_queue, inference_accuracy_metrics, recent_inference_activity, batch_inference_summary';
  RAISE NOTICE 'Created triggers: set_inference_review_priority (enabled), auto_apply_high_confidence (disabled by default)';
  RAISE NOTICE 'Next step: Integrate logging calls into inference scripts';
END $$;
