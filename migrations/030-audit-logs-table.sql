-- Migration: Create audit_logs table for governance audit system
-- Phase 7: Ops, Audit & Future Safety

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  before_state JSONB,
  after_state JSONB,
  source TEXT NOT NULL,
  triggered_by TEXT DEFAULT 'system',
  requires_review BOOLEAN DEFAULT false,
  review_status TEXT DEFAULT 'pending',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_requires_review ON audit_logs(requires_review) WHERE requires_review = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_review_status ON audit_logs(review_status);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_lookup 
  ON audit_logs(entity_type, entity_id, created_at DESC);

-- Add constraint for valid event types
ALTER TABLE audit_logs ADD CONSTRAINT check_event_type 
  CHECK (event_type IN (
    'validation_failure',
    'trust_score_drop',
    'source_conflict',
    'speculative_boundary',
    'data_enrichment',
    'data_update',
    'data_deletion',
    'freshness_decay',
    'revalidation_required',
    'manual_review_flagged',
    'ai_generation',
    'governance_violation'
  ));

-- Add constraint for valid severity levels
ALTER TABLE audit_logs ADD CONSTRAINT check_severity 
  CHECK (severity IN ('info', 'warning', 'error', 'critical'));

-- Add constraint for valid entity types
ALTER TABLE audit_logs ADD CONSTRAINT check_entity_type 
  CHECK (entity_type IN ('movie', 'celebrity', 'review', 'rating', 'system'));

-- Add constraint for valid review status
ALTER TABLE audit_logs ADD CONSTRAINT check_review_status 
  CHECK (review_status IN ('pending', 'reviewed', 'resolved', 'dismissed'));

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_audit_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_audit_logs_updated_at ON audit_logs;
CREATE TRIGGER trigger_audit_logs_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_logs_updated_at();

-- Create view for pending reviews
CREATE OR REPLACE VIEW audit_pending_reviews AS
SELECT 
  id,
  event_type,
  severity,
  entity_type,
  entity_id,
  entity_name,
  message,
  source,
  created_at
FROM audit_logs
WHERE requires_review = true 
  AND review_status = 'pending'
ORDER BY 
  CASE severity 
    WHEN 'critical' THEN 0 
    WHEN 'error' THEN 1 
    WHEN 'warning' THEN 2 
    ELSE 3 
  END,
  created_at DESC;

-- Create view for recent critical issues
CREATE OR REPLACE VIEW audit_critical_issues AS
SELECT 
  id,
  event_type,
  entity_type,
  entity_id,
  entity_name,
  message,
  metadata,
  source,
  created_at
FROM audit_logs
WHERE severity = 'critical'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Create summary view for dashboard
CREATE OR REPLACE VIEW audit_summary_7days AS
SELECT 
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(CASE WHEN requires_review AND review_status = 'pending' THEN 1 END) as pending_reviews
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type, severity
ORDER BY 
  CASE severity 
    WHEN 'critical' THEN 0 
    WHEN 'error' THEN 1 
    WHEN 'warning' THEN 2 
    ELSE 3 
  END,
  event_count DESC;

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Governance audit log for tracking data quality events, validation failures, and system changes';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of audit event (validation_failure, trust_score_drop, etc.)';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level: info, warning, error, critical';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity: movie, celebrity, review, rating, system';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional event-specific data';
COMMENT ON COLUMN audit_logs.before_state IS 'State before the change (for update events)';
COMMENT ON COLUMN audit_logs.after_state IS 'State after the change (for update events)';
COMMENT ON COLUMN audit_logs.requires_review IS 'Flag indicating manual review is needed';
COMMENT ON COLUMN audit_logs.review_status IS 'Current review status: pending, reviewed, resolved, dismissed';
