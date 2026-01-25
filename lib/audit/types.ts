/**
 * Audit System Types
 * 
 * Defines the structure for audit logs, events, and tracking mechanisms.
 */

export type AuditEventType =
  | 'validation_failure'
  | 'trust_score_drop'
  | 'source_conflict'
  | 'speculative_boundary'
  | 'data_enrichment'
  | 'data_update'
  | 'data_deletion'
  | 'freshness_decay'
  | 'revalidation_required'
  | 'manual_review_flagged'
  | 'ai_generation'
  | 'governance_violation';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AuditEntityType = 'movie' | 'celebrity' | 'review' | 'rating' | 'system';

export interface AuditEvent {
  /** Unique identifier for the audit event */
  id?: string;
  /** Type of audit event */
  event_type: AuditEventType;
  /** Severity level */
  severity: AuditSeverity;
  /** Entity type being audited */
  entity_type: AuditEntityType;
  /** Entity ID (movie_id, celebrity_id, etc.) */
  entity_id?: string;
  /** Entity name for quick reference */
  entity_name?: string;
  /** Detailed message describing the event */
  message: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Before state (for changes) */
  before_state?: Record<string, unknown>;
  /** After state (for changes) */
  after_state?: Record<string, unknown>;
  /** Source of the event (script name, API, etc.) */
  source: string;
  /** User or system that triggered the event */
  triggered_by?: string;
  /** Timestamp */
  created_at?: string;
  /** Whether this requires manual review */
  requires_review?: boolean;
  /** Review status */
  review_status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  /** Reviewer notes */
  reviewer_notes?: string;
}

export interface AuditSummary {
  /** Time period for the summary */
  period: {
    start: string;
    end: string;
  };
  /** Total events by type */
  events_by_type: Record<AuditEventType, number>;
  /** Events by severity */
  events_by_severity: Record<AuditSeverity, number>;
  /** Most affected entities */
  top_affected_entities: Array<{
    entity_type: AuditEntityType;
    entity_id: string;
    entity_name?: string;
    event_count: number;
  }>;
  /** Pending reviews count */
  pending_reviews: number;
  /** Critical issues count */
  critical_issues: number;
}

export interface FreshnessCheck {
  /** Entity type */
  entity_type: AuditEntityType;
  /** Entity ID */
  entity_id: string;
  /** Entity name */
  entity_name?: string;
  /** Last verified timestamp */
  last_verified_at: string | null;
  /** Days since last verification */
  days_since_verification: number;
  /** Current freshness score */
  freshness_score: number;
  /** Is stale (> threshold) */
  is_stale: boolean;
  /** Recommended action */
  recommended_action: 'revalidate' | 'flag_for_review' | 'archive' | 'none';
}

export interface DataQualityReport {
  /** Report generation timestamp */
  generated_at: string;
  /** Overall data quality score */
  overall_score: number;
  /** Movies statistics */
  movies: {
    total: number;
    high_confidence: number;
    medium_confidence: number;
    low_confidence: number;
    stale: number;
    disputed: number;
    missing_critical_fields: number;
  };
  /** Celebrities statistics */
  celebrities: {
    total: number;
    high_confidence: number;
    medium_confidence: number;
    low_confidence: number;
    stale: number;
    incomplete_profiles: number;
  };
  /** Top issues */
  top_issues: Array<{
    issue_type: string;
    count: number;
    severity: AuditSeverity;
    examples: string[];
  }>;
  /** Recommendations */
  recommendations: string[];
}

export interface RevalidationTarget {
  /** Entity type */
  entity_type: AuditEntityType;
  /** Entity ID */
  entity_id: string;
  /** Entity name */
  entity_name?: string;
  /** Reason for revalidation */
  reason: string;
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Fields to revalidate */
  fields_to_check: string[];
  /** Estimated effort */
  estimated_effort: 'quick' | 'moderate' | 'extensive';
}
