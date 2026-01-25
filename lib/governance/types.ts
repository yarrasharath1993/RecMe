/**
 * GOVERNANCE TYPES
 * 
 * Core type definitions for the content governance system.
 * These types enable machine-readable rules, explainable scores,
 * and safe content classification.
 */

// ============================================================
// CONTENT TYPES
// ============================================================

/**
 * Content type classification for governance
 * Determines how content is treated in terms of trust, display, and AI usage
 */
export type GovernanceContentType = 
  | 'verified_fact'    // Confirmed from multiple authoritative sources
  | 'archive'          // Historical data, may not be current
  | 'opinion'          // Editorial opinion, labeled as such
  | 'editorial'        // Editorial content with some fact basis
  | 'speculative'      // Speculative/unverified, never affects trust
  | 'fan_content'      // Fan-contributed, requires verification
  | 'promotional'      // Promotional content, not filmography
  | 'kids_safe';       // Verified safe for children

/**
 * Confidence tier for quick reference
 */
export type ConfidenceTier = 'high' | 'medium' | 'low' | 'unverified';

/**
 * Trust level for display
 */
export type TrustLevel = 'verified' | 'high' | 'medium' | 'low' | 'unverified';

// ============================================================
// GOVERNANCE RULES
// ============================================================

/**
 * Rule identifier for tracking and auditing
 */
export type RuleId = 
  | 'RULE_001' // Wiki is primary, blogs are secondary
  | 'RULE_002' // Speculative content cannot affect trust score
  | 'RULE_003' // Promotions ≠ filmography
  | 'RULE_004' // Outdated data decays trust
  | 'RULE_005' // AI summaries may only use verified_fact
  | 'RULE_006' // Source disagreement increases uncertainty
  | 'RULE_007' // Never overwrite higher-confidence data with lower
  | 'RULE_008' // Family relationships require verification
  | 'RULE_009' // Box office data requires 2+ sources
  | 'RULE_010' // Age rating safety-first (never downgrade)
  | 'RULE_011' // Content warnings must be conservative
  | 'RULE_012' // Disputed data must be flagged
  | 'RULE_013' // Entity integrity rules must be respected
  | 'RULE_014' // Freshness decay after 180 days
  | 'RULE_015'; // Cross-language data requires verification

/**
 * Rule severity determines how violations are handled
 */
export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Rule category for grouping
 */
export type RuleCategory = 
  | 'trust'           // Trust score related
  | 'content_type'    // Content classification
  | 'source'          // Source handling
  | 'safety'          // Safety and content warnings
  | 'freshness'       // Data freshness
  | 'entity'          // Entity integrity
  | 'ai';             // AI-related rules

/**
 * A governance rule definition
 */
export interface GovernanceRule {
  id: RuleId;
  name: string;
  description: string;
  category: RuleCategory;
  severity: RuleSeverity;
  enabled: boolean;
  
  /** When this rule applies */
  applies_to: ('movies' | 'celebrities' | 'reviews' | 'all')[];
  
  /** Conditions that trigger this rule */
  conditions?: RuleCondition[];
  
  /** Actions to take when rule is violated */
  actions: RuleAction[];
  
  /** Override capability */
  overridable: boolean;
  override_requires?: 'admin' | 'verified_source' | 'manual_review';
}

/**
 * Condition for rule evaluation
 */
export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_null' | 'is_not_null' | 'in' | 'not_in';
  value: unknown;
}

/**
 * Action to take when rule is triggered
 */
export interface RuleAction {
  type: 'block' | 'flag' | 'adjust_trust' | 'require_review' | 'log' | 'notify';
  params?: Record<string, unknown>;
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Result of rule validation
 */
export interface RuleValidationResult {
  rule_id: RuleId;
  passed: boolean;
  severity: RuleSeverity;
  message: string;
  details?: Record<string, unknown>;
  suggested_action?: string;
}

/**
 * Overall validation result for an entity
 */
export interface GovernanceValidationResult {
  entity_type: 'movie' | 'celebrity' | 'review';
  entity_id: string;
  timestamp: string;
  
  /** Did all critical rules pass? */
  is_valid: boolean;
  
  /** Individual rule results */
  rule_results: RuleValidationResult[];
  
  /** Aggregated trust impact */
  trust_impact: number; // -1.0 to +1.0
  
  /** Recommended content type */
  recommended_content_type?: GovernanceContentType;
  
  /** Flags for manual review */
  review_flags: string[];
  
  /** Explanation for the result */
  explanation: string;
}

// ============================================================
// TRUST SCORING
// ============================================================

/**
 * Trust score breakdown for explainability
 */
export interface TrustScoreBreakdown {
  /** Base score from data completeness */
  base_score: number;
  
  /** Source quality contribution */
  source_quality: {
    score: number;
    tier1_count: number;
    tier2_count: number;
    tier3_count: number;
  };
  
  /** Data freshness contribution */
  freshness: {
    score: number;
    days_since_update: number;
    decay_applied: number;
  };
  
  /** Cross-validation contribution */
  validation: {
    score: number;
    sources_agree: number;
    sources_disagree: number;
    conflicts: string[];
  };
  
  /** Field completeness contribution */
  completeness: {
    score: number;
    filled_fields: number;
    total_fields: number;
    critical_missing: string[];
  };
  
  /** Rule violations penalty */
  rule_violations: {
    penalty: number;
    violated_rules: RuleId[];
  };
  
  /** Final computed score */
  final_score: number;
  
  /** Derived trust level */
  trust_level: TrustLevel;
  
  /** Derived confidence tier */
  confidence_tier: ConfidenceTier;
}

/**
 * Trust explanation for display
 */
export interface TrustExplanation {
  /** Human-readable summary */
  summary: string;
  
  /** Key factors */
  key_factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  
  /** Warnings */
  warnings: string[];
  
  /** Improvement suggestions */
  improvements: string[];
}

// ============================================================
// FRESHNESS
// ============================================================

/**
 * Freshness status for an entity
 */
export interface FreshnessStatus {
  /** Days since last update */
  days_since_update: number;
  
  /** Days since last verification */
  days_since_verification: number;
  
  /** Freshness score (0-100) */
  score: number;
  
  /** Status */
  status: 'fresh' | 'stale' | 'outdated' | 'expired';
  
  /** Needs revalidation */
  needs_revalidation: boolean;
  
  /** Recommended action */
  recommended_action?: string;
}

// ============================================================
// AUDIT
// ============================================================

/**
 * Governance audit log entry
 */
export interface GovernanceAuditEntry {
  id: string;
  timestamp: string;
  entity_type: 'movie' | 'celebrity' | 'review';
  entity_id: string;
  action: 'validation' | 'trust_update' | 'content_type_change' | 'rule_violation' | 'manual_override' | 'freshness_decay';
  actor: 'system' | 'admin' | 'user' | string;
  
  /** Previous state */
  previous_state?: Record<string, unknown>;
  
  /** New state */
  new_state?: Record<string, unknown>;
  
  /** Rules involved */
  rules_applied: RuleId[];
  
  /** Explanation */
  explanation: string;
  
  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================
// ENTITY GOVERNANCE
// ============================================================

/**
 * Entity-specific governance settings
 */
export interface EntityGovernanceConfig {
  /** Content type for this entity */
  content_type: GovernanceContentType;
  
  /** Trust score (0-100) */
  trust_score: number;
  
  /** Trust explanation */
  trust_explanation: TrustExplanation;
  
  /** Freshness score (0-100) */
  freshness_score: number;
  
  /** Last verified timestamp */
  last_verified_at: string | null;
  
  /** Confidence tier */
  confidence_tier: ConfidenceTier;
  
  /** Is disputed */
  is_disputed: boolean;
  
  /** Dispute reason */
  dispute_reason?: string;
  
  /** Manual override status */
  manual_override?: {
    by: string;
    at: string;
    reason: string;
    expires_at?: string;
  };
}

// ============================================================
// AI SAFETY
// ============================================================

/**
 * AI prompt constraints
 */
export interface AiPromptConstraints {
  /** Allowed content types for AI input */
  allowed_content_types: GovernanceContentType[];
  
  /** Excluded content types */
  excluded_content_types: GovernanceContentType[];
  
  /** Minimum trust level for inclusion */
  min_trust_level: TrustLevel;
  
  /** Fields to exclude from AI input */
  excluded_fields: string[];
  
  /** Required disclaimer */
  required_disclaimer?: string;
  
  /** Max speculation allowed */
  max_speculation: 'none' | 'labeled' | 'limited';
}

/**
 * AI output validation result
 */
export interface AiOutputValidation {
  is_valid: boolean;
  violations: {
    type: 'speculation' | 'low_trust' | 'excluded_content' | 'missing_attribution';
    description: string;
  }[];
  warnings: string[];
  required_edits: string[];
}
