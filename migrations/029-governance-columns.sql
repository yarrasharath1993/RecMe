-- ============================================================
-- MIGRATION 029: Governance Columns
-- ============================================================
-- Adds governance-specific columns to movies and celebrities tables.
-- These columns enable:
-- - Content type classification
-- - Granular trust scoring (0-100)
-- - Explainable trust decisions
-- - Freshness tracking
-- - Confidence tier labeling
-- - Dispute flagging
-- ============================================================

-- ============================================================
-- MOVIES TABLE GOVERNANCE COLUMNS
-- ============================================================

-- Content type classification
ALTER TABLE movies ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'editorial';
COMMENT ON COLUMN movies.content_type IS 'Content type: verified_fact, archive, opinion, editorial, speculative, fan_content, promotional, kids_safe';

-- Granular trust score (0-100, more precise than data_confidence)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50;
COMMENT ON COLUMN movies.trust_score IS 'Trust score 0-100, computed from multiple factors';

-- Trust explanation for transparency
ALTER TABLE movies ADD COLUMN IF NOT EXISTS trust_explanation JSONB DEFAULT '{}';
COMMENT ON COLUMN movies.trust_explanation IS 'JSON explaining trust score: {summary, key_factors[], warnings[], improvements[]}';

-- Freshness score (0-100)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 100;
COMMENT ON COLUMN movies.freshness_score IS 'Freshness score 0-100, decays over time without verification';

-- Last verification timestamp
ALTER TABLE movies ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN movies.last_verified_at IS 'When data was last verified against sources';

-- Explicit confidence tier
ALTER TABLE movies ADD COLUMN IF NOT EXISTS confidence_tier VARCHAR(20) DEFAULT 'medium';
COMMENT ON COLUMN movies.confidence_tier IS 'Confidence tier: high, medium, low, unverified';

-- Dispute flagging
ALTER TABLE movies ADD COLUMN IF NOT EXISTS is_disputed BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN movies.is_disputed IS 'Whether any data is disputed between sources';

ALTER TABLE movies ADD COLUMN IF NOT EXISTS dispute_details JSONB DEFAULT '{}';
COMMENT ON COLUMN movies.dispute_details IS 'Details of any disputes: {field, sources[], values[], severity}';

-- Governance flags for quick filtering
ALTER TABLE movies ADD COLUMN IF NOT EXISTS governance_flags TEXT[] DEFAULT '{}';
COMMENT ON COLUMN movies.governance_flags IS 'Array of governance flags: needs_revalidation, source_conflict, etc.';

-- ============================================================
-- CELEBRITIES TABLE GOVERNANCE COLUMNS
-- ============================================================

-- Entity confidence score (0.0 to 1.0)
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS entity_confidence_score FLOAT DEFAULT 0.5;
COMMENT ON COLUMN celebrities.entity_confidence_score IS 'Overall entity confidence 0.0-1.0';

-- Entity trust explanation
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS entity_trust_explanation JSONB DEFAULT '{}';
COMMENT ON COLUMN celebrities.entity_trust_explanation IS 'JSON explaining trust score: {summary, key_factors[], warnings[], improvements[]}';

-- Content type for celebrity data
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'editorial';
COMMENT ON COLUMN celebrities.content_type IS 'Content type: verified_fact, archive, opinion, editorial, speculative, fan_content';

-- Trust score (0-100)
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50;
COMMENT ON COLUMN celebrities.trust_score IS 'Trust score 0-100, computed from multiple factors';

-- Freshness score
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 100;
COMMENT ON COLUMN celebrities.freshness_score IS 'Freshness score 0-100, decays over time';

-- Last verification timestamp
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN celebrities.last_verified_at IS 'When data was last verified against sources';

-- Confidence tier
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS confidence_tier VARCHAR(20) DEFAULT 'medium';
COMMENT ON COLUMN celebrities.confidence_tier IS 'Confidence tier: high, medium, low, unverified';

-- Dispute flagging
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS is_disputed BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN celebrities.is_disputed IS 'Whether any data is disputed';

-- Governance flags
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS governance_flags TEXT[] DEFAULT '{}';
COMMENT ON COLUMN celebrities.governance_flags IS 'Array of governance flags';

-- ============================================================
-- INDEXES FOR GOVERNANCE QUERIES
-- ============================================================

-- Movies indexes
CREATE INDEX IF NOT EXISTS idx_movies_content_type ON movies(content_type);
CREATE INDEX IF NOT EXISTS idx_movies_trust_score ON movies(trust_score);
CREATE INDEX IF NOT EXISTS idx_movies_confidence_tier ON movies(confidence_tier);
CREATE INDEX IF NOT EXISTS idx_movies_freshness_score ON movies(freshness_score);
CREATE INDEX IF NOT EXISTS idx_movies_is_disputed ON movies(is_disputed) WHERE is_disputed = TRUE;
CREATE INDEX IF NOT EXISTS idx_movies_last_verified ON movies(last_verified_at);
CREATE INDEX IF NOT EXISTS idx_movies_governance_flags ON movies USING GIN(governance_flags);

-- Celebrities indexes
CREATE INDEX IF NOT EXISTS idx_celebrities_content_type ON celebrities(content_type);
CREATE INDEX IF NOT EXISTS idx_celebrities_trust_score ON celebrities(trust_score);
CREATE INDEX IF NOT EXISTS idx_celebrities_confidence_tier ON celebrities(confidence_tier);
CREATE INDEX IF NOT EXISTS idx_celebrities_is_disputed ON celebrities(is_disputed) WHERE is_disputed = TRUE;
CREATE INDEX IF NOT EXISTS idx_celebrities_governance_flags ON celebrities USING GIN(governance_flags);

-- ============================================================
-- GOVERNANCE AUDIT LOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS governance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  actor VARCHAR(100) DEFAULT 'system',
  previous_state JSONB,
  new_state JSONB,
  rules_applied TEXT[],
  explanation TEXT,
  metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE governance_audit_log IS 'Audit log for all governance actions';

CREATE INDEX IF NOT EXISTS idx_governance_audit_entity ON governance_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_action ON governance_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_governance_audit_created ON governance_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_governance_audit_rules ON governance_audit_log USING GIN(rules_applied);

-- ============================================================
-- DISPUTE TRACKING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS data_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  primary_source VARCHAR(100),
  primary_value JSONB,
  conflicting_sources JSONB, -- [{source: string, value: any}]
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open', -- open, reviewing, resolved, dismissed
  resolution TEXT,
  resolved_by VARCHAR(100),
  resolved_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE data_disputes IS 'Tracks data disputes between sources';

CREATE INDEX IF NOT EXISTS idx_disputes_entity ON data_disputes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON data_disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_severity ON data_disputes(severity);

-- ============================================================
-- UPDATE FUNCTIONS
-- ============================================================

-- Function to update freshness score based on last_verified_at
CREATE OR REPLACE FUNCTION update_freshness_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_verified_at IS NOT NULL THEN
    -- Calculate days since verification
    DECLARE
      days_since INTEGER;
    BEGIN
      days_since := EXTRACT(DAY FROM (NOW() - NEW.last_verified_at));
      
      -- Calculate freshness score (100 if fresh, decays over time)
      IF days_since <= 30 THEN
        NEW.freshness_score := 100;
      ELSIF days_since <= 90 THEN
        NEW.freshness_score := 75;
      ELSIF days_since <= 180 THEN
        NEW.freshness_score := 50;
      ELSIF days_since <= 365 THEN
        NEW.freshness_score := 25;
      ELSE
        NEW.freshness_score := 0;
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to movies
DROP TRIGGER IF EXISTS trigger_movies_freshness ON movies;
CREATE TRIGGER trigger_movies_freshness
  BEFORE INSERT OR UPDATE OF last_verified_at ON movies
  FOR EACH ROW
  EXECUTE FUNCTION update_freshness_score();

-- Apply trigger to celebrities
DROP TRIGGER IF EXISTS trigger_celebrities_freshness ON celebrities;
CREATE TRIGGER trigger_celebrities_freshness
  BEFORE INSERT OR UPDATE OF last_verified_at ON celebrities
  FOR EACH ROW
  EXECUTE FUNCTION update_freshness_score();

-- ============================================================
-- INITIAL DATA MIGRATION
-- ============================================================

-- Set initial trust_score based on existing data_confidence
UPDATE movies 
SET trust_score = COALESCE(ROUND(data_confidence * 100), 50)
WHERE trust_score IS NULL OR trust_score = 50;

-- Set initial confidence_tier based on existing trust_badge
UPDATE movies 
SET confidence_tier = CASE 
  WHEN trust_badge IN ('verified', 'high') THEN 'high'
  WHEN trust_badge = 'medium' THEN 'medium'
  WHEN trust_badge = 'low' THEN 'low'
  ELSE 'medium'
END
WHERE confidence_tier IS NULL OR confidence_tier = 'medium';

-- Set initial last_verified_at based on updated_at
UPDATE movies
SET last_verified_at = updated_at
WHERE last_verified_at IS NULL AND updated_at IS NOT NULL;

-- Set content_type for movies with high confidence as verified_fact
UPDATE movies
SET content_type = 'verified_fact'
WHERE trust_badge = 'verified' AND content_type = 'editorial';

-- ============================================================
-- DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN movies.content_type IS E'Content type determines governance rules applied:\n- verified_fact: Multiple authoritative sources, safe for AI\n- archive: Historical data, may be outdated\n- editorial: Curated content with some verification\n- speculative: Unverified, never affects trust score\n- fan_content: Community contributed, needs verification\n- promotional: Marketing content, not filmography\n- kids_safe: Verified safe for children';

COMMENT ON COLUMN movies.trust_score IS E'Trust score calculation:\n- Base: 30% from data_confidence\n- Sources: 20% from source tier quality\n- Freshness: 15% from verification age\n- Validation: 15% from source agreement\n- Completeness: 20% from field coverage\n- Minus: Rule violation penalties';

COMMENT ON COLUMN movies.governance_flags IS E'Common flags:\n- needs_primary_source: Missing authoritative source\n- needs_revalidation: Data is stale\n- source_conflict: Sources disagree\n- disputed_data: Active dispute\n- speculative_content: Contains speculation\n- missing_content_warning: May need warnings';
