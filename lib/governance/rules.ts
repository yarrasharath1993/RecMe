/**
 * GOVERNANCE RULES ENGINE
 * 
 * Machine-readable rules for content governance.
 * These rules are:
 * - Enforced during enrichment
 * - Logged during validation
 * - Auditable
 * 
 * RULE PHILOSOPHY:
 * - Safety first: Never downgrade content safety
 * - Trust decay: Outdated data loses trust
 * - Source hierarchy: Wiki > Blogs > Fan sites
 * - Explainability: Every score must be explainable
 * - No AI speculation: AI cannot invent facts
 */

import {
  GovernanceRule,
  RuleId,
  RuleCategory,
  RuleSeverity,
  RuleCondition,
  RuleAction,
} from './types';

// ============================================================
// RULE DEFINITIONS
// ============================================================

/**
 * All governance rules
 */
export const GOVERNANCE_RULES: Record<RuleId, GovernanceRule> = {
  // --------------------------------------------------------
  // SOURCE RULES
  // --------------------------------------------------------
  RULE_001: {
    id: 'RULE_001',
    name: 'Primary Source Priority',
    description: 'Wikipedia/official sources are primary; blogs and fan sites are secondary. Tier 1 sources override Tier 3.',
    category: 'source',
    severity: 'medium',
    enabled: true,
    applies_to: ['movies', 'celebrities', 'all'],
    conditions: [
      { field: 'source_tier', operator: 'equals', value: 3 },
      { field: 'has_tier1_source', operator: 'equals', value: false },
    ],
    actions: [
      { type: 'adjust_trust', params: { delta: -0.15 } },
      { type: 'flag', params: { flag: 'needs_primary_source' } },
    ],
    overridable: true,
    override_requires: 'verified_source',
  },

  RULE_002: {
    id: 'RULE_002',
    name: 'Speculative Content Isolation',
    description: 'Speculative content cannot affect trust scores and must be labeled.',
    category: 'content_type',
    severity: 'critical',
    enabled: true,
    applies_to: ['all'],
    conditions: [
      { field: 'content_type', operator: 'equals', value: 'speculative' },
    ],
    actions: [
      { type: 'block', params: { block_trust_update: true } },
      { type: 'flag', params: { flag: 'speculative_content' } },
      { type: 'log', params: { level: 'info' } },
    ],
    overridable: false,
  },

  RULE_003: {
    id: 'RULE_003',
    name: 'Promotions Not Filmography',
    description: 'Promotional appearances (trailer launches, inaugurations) are not acting credits.',
    category: 'entity',
    severity: 'high',
    enabled: true,
    applies_to: ['celebrities'],
    conditions: [
      { field: 'role_type', operator: 'in', value: ['promotion', 'launch', 'inauguration'] },
    ],
    actions: [
      { type: 'block', params: { block_filmography_add: true } },
      { type: 'flag', params: { flag: 'promotion_not_filmography' } },
    ],
    overridable: true,
    override_requires: 'manual_review',
  },

  RULE_004: {
    id: 'RULE_004',
    name: 'Trust Decay',
    description: 'Data older than 180 days without verification decays in trust.',
    category: 'freshness',
    severity: 'medium',
    enabled: true,
    applies_to: ['movies', 'celebrities'],
    conditions: [
      { field: 'days_since_verification', operator: 'greater_than', value: 180 },
    ],
    actions: [
      { type: 'adjust_trust', params: { decay_rate: 0.05, max_decay: 0.20 } },
      { type: 'flag', params: { flag: 'needs_revalidation' } },
    ],
    overridable: false,
  },

  RULE_005: {
    id: 'RULE_005',
    name: 'AI Verified Facts Only',
    description: 'AI summaries may only use verified_fact content type.',
    category: 'ai',
    severity: 'critical',
    enabled: true,
    applies_to: ['all'],
    conditions: [
      { field: 'ai_input', operator: 'equals', value: true },
      { field: 'content_type', operator: 'not_in', value: ['verified_fact', 'archive'] },
    ],
    actions: [
      { type: 'block', params: { block_ai_input: true } },
      { type: 'log', params: { level: 'warning' } },
    ],
    overridable: false,
  },

  RULE_006: {
    id: 'RULE_006',
    name: 'Source Disagreement',
    description: 'When sources disagree, increase uncertainty and flag for review.',
    category: 'trust',
    severity: 'medium',
    enabled: true,
    applies_to: ['movies', 'celebrities'],
    conditions: [
      { field: 'sources_disagree', operator: 'equals', value: true },
    ],
    actions: [
      { type: 'adjust_trust', params: { delta: -0.20 } },
      { type: 'flag', params: { flag: 'source_conflict' } },
      { type: 'require_review', params: { priority: 'high' } },
    ],
    overridable: true,
    override_requires: 'manual_review',
  },

  RULE_007: {
    id: 'RULE_007',
    name: 'Never Downgrade Confidence',
    description: 'Cannot overwrite higher-confidence data with lower-confidence data.',
    category: 'trust',
    severity: 'high',
    enabled: true,
    applies_to: ['all'],
    conditions: [
      { field: 'new_confidence', operator: 'less_than', value: 'existing_confidence' },
    ],
    actions: [
      { type: 'block', params: { block_update: true } },
      { type: 'log', params: { level: 'warning', message: 'Attempted confidence downgrade blocked' } },
    ],
    overridable: true,
    override_requires: 'admin',
  },

  RULE_008: {
    id: 'RULE_008',
    name: 'Family Verification Required',
    description: 'Family relationships require verification from official sources.',
    category: 'entity',
    severity: 'high',
    enabled: true,
    applies_to: ['celebrities'],
    conditions: [
      { field: 'family_relationships', operator: 'is_not_null', value: true },
      { field: 'family_verified', operator: 'equals', value: false },
    ],
    actions: [
      { type: 'flag', params: { flag: 'unverified_family' } },
      { type: 'adjust_trust', params: { delta: -0.10 } },
    ],
    overridable: true,
    override_requires: 'verified_source',
  },

  RULE_009: {
    id: 'RULE_009',
    name: 'Box Office Multi-Source',
    description: 'Box office data requires at least 2 agreeing sources.',
    category: 'trust',
    severity: 'medium',
    enabled: true,
    applies_to: ['movies'],
    conditions: [
      { field: 'box_office_sources', operator: 'less_than', value: 2 },
    ],
    actions: [
      { type: 'flag', params: { flag: 'single_source_box_office' } },
      { type: 'adjust_trust', params: { field: 'box_office', delta: -0.25 } },
    ],
    overridable: false,
  },

  RULE_010: {
    id: 'RULE_010',
    name: 'Age Rating Safety First',
    description: 'Never downgrade age rating to less restrictive. Safety first.',
    category: 'safety',
    severity: 'critical',
    enabled: true,
    applies_to: ['movies'],
    conditions: [
      { field: 'new_age_rating', operator: 'less_than', value: 'existing_age_rating' },
    ],
    actions: [
      { type: 'block', params: { block_update: true } },
      { type: 'log', params: { level: 'error', message: 'Attempted age rating downgrade blocked' } },
    ],
    overridable: true,
    override_requires: 'admin',
  },

  RULE_011: {
    id: 'RULE_011',
    name: 'Conservative Content Warnings',
    description: 'Content warnings must be conservative - better to warn than not.',
    category: 'safety',
    severity: 'high',
    enabled: true,
    applies_to: ['movies'],
    conditions: [
      { field: 'has_violence', operator: 'equals', value: true },
      { field: 'trigger_warnings', operator: 'not_in', value: ['violence'] },
    ],
    actions: [
      { type: 'flag', params: { flag: 'missing_content_warning' } },
      { type: 'require_review', params: { priority: 'medium' } },
    ],
    overridable: false,
  },

  RULE_012: {
    id: 'RULE_012',
    name: 'Disputed Data Flagging',
    description: 'Data with active disputes must be flagged and explained.',
    category: 'trust',
    severity: 'high',
    enabled: true,
    applies_to: ['all'],
    conditions: [
      { field: 'is_disputed', operator: 'equals', value: true },
    ],
    actions: [
      { type: 'flag', params: { flag: 'disputed_data' } },
      { type: 'adjust_trust', params: { delta: -0.30 } },
      { type: 'notify', params: { type: 'disputed_content' } },
    ],
    overridable: false,
  },

  RULE_013: {
    id: 'RULE_013',
    name: 'Entity Integrity Rules',
    description: 'Entity-specific integrity rules (exclude_movies, etc.) must be respected.',
    category: 'entity',
    severity: 'critical',
    enabled: true,
    applies_to: ['celebrities'],
    conditions: [
      { field: 'integrity_rules', operator: 'is_not_null', value: true },
    ],
    actions: [
      { type: 'block', params: { respect_integrity_rules: true } },
    ],
    overridable: true,
    override_requires: 'admin',
  },

  RULE_014: {
    id: 'RULE_014',
    name: 'Freshness Decay Threshold',
    description: 'Apply freshness decay after 180 days without verification.',
    category: 'freshness',
    severity: 'low',
    enabled: true,
    applies_to: ['movies', 'celebrities'],
    conditions: [
      { field: 'days_since_verification', operator: 'greater_than', value: 180 },
    ],
    actions: [
      { type: 'adjust_trust', params: { decay_per_month: 0.02 } },
      { type: 'flag', params: { flag: 'stale_data' } },
    ],
    overridable: false,
  },

  RULE_015: {
    id: 'RULE_015',
    name: 'Cross-Language Verification',
    description: 'Data from different language sources must be cross-verified.',
    category: 'source',
    severity: 'medium',
    enabled: true,
    applies_to: ['movies', 'celebrities'],
    conditions: [
      { field: 'source_languages', operator: 'greater_than', value: 1 },
      { field: 'cross_verified', operator: 'equals', value: false },
    ],
    actions: [
      { type: 'flag', params: { flag: 'needs_cross_language_verification' } },
      { type: 'adjust_trust', params: { delta: -0.10 } },
    ],
    overridable: false,
  },
};

// ============================================================
// RULE UTILITIES
// ============================================================

/**
 * Get all enabled rules
 */
export function getEnabledRules(): GovernanceRule[] {
  return Object.values(GOVERNANCE_RULES).filter((rule) => rule.enabled);
}

/**
 * Get rules by category
 */
export function getRulesByCategory(category: RuleCategory): GovernanceRule[] {
  return getEnabledRules().filter((rule) => rule.category === category);
}

/**
 * Get rules by severity
 */
export function getRulesBySeverity(severity: RuleSeverity): GovernanceRule[] {
  return getEnabledRules().filter((rule) => rule.severity === severity);
}

/**
 * Get rules applicable to an entity type
 */
export function getRulesForEntity(
  entityType: 'movies' | 'celebrities' | 'reviews'
): GovernanceRule[] {
  return getEnabledRules().filter(
    (rule) => rule.applies_to.includes(entityType) || rule.applies_to.includes('all')
  );
}

/**
 * Get critical rules (must pass for validity)
 */
export function getCriticalRules(): GovernanceRule[] {
  return getEnabledRules().filter((rule) => rule.severity === 'critical');
}

/**
 * Check if a rule can be overridden by a given actor
 */
export function canOverrideRule(rule: GovernanceRule, actor: string): boolean {
  if (!rule.overridable) return false;
  
  switch (rule.override_requires) {
    case 'admin':
      return actor === 'admin';
    case 'verified_source':
      return actor === 'admin' || actor === 'verified_source';
    case 'manual_review':
      return actor === 'admin' || actor === 'reviewer';
    default:
      return false;
  }
}

/**
 * Get rule by ID
 */
export function getRule(ruleId: RuleId): GovernanceRule | undefined {
  return GOVERNANCE_RULES[ruleId];
}

/**
 * Format rule for display
 */
export function formatRuleDescription(rule: GovernanceRule): string {
  return `[${rule.id}] ${rule.name}: ${rule.description}`;
}

// ============================================================
// RULE CONDITION EVALUATION
// ============================================================

/**
 * Evaluate a single condition against data
 */
export function evaluateCondition(
  condition: RuleCondition,
  data: Record<string, unknown>
): boolean {
  const fieldValue = data[condition.field];
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(condition.value as string);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return false;
    case 'greater_than':
      return (fieldValue as number) > (condition.value as number);
    case 'less_than':
      return (fieldValue as number) < (condition.value as number);
    case 'is_null':
      return fieldValue === null || fieldValue === undefined;
    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    default:
      return false;
  }
}

/**
 * Evaluate all conditions for a rule (AND logic)
 */
export function evaluateRuleConditions(
  rule: GovernanceRule,
  data: Record<string, unknown>
): boolean {
  if (!rule.conditions || rule.conditions.length === 0) {
    return true; // No conditions means always applies
  }
  
  return rule.conditions.every((condition) => evaluateCondition(condition, data));
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Source tier weights for trust calculation
 */
export const SOURCE_TIER_WEIGHTS = {
  1: 1.0,    // Primary (TMDB, IMDb, Wikipedia)
  2: 0.7,    // Aggregators (Rotten Tomatoes)
  3: 0.4,    // Community (Filmibeat, Idlebrain)
  4: 0.2,    // Signals (YouTube views, etc.)
};

/**
 * Freshness decay rates
 */
export const FRESHNESS_DECAY = {
  FRESH_DAYS: 30,        // Days considered fresh
  STALE_DAYS: 90,        // Days considered stale
  OUTDATED_DAYS: 180,    // Days considered outdated
  EXPIRED_DAYS: 365,     // Days considered expired
  DECAY_PER_MONTH: 0.02, // Trust decay per month after stale
  MAX_DECAY: 0.30,       // Maximum trust decay from freshness
};

/**
 * Age rating hierarchy (higher index = more restrictive)
 */
export const AGE_RATING_HIERARCHY = ['U', 'U/A', 'A', 'S'];

/**
 * Minimum sources for different data types
 */
export const MIN_SOURCES_REQUIRED = {
  box_office: 2,
  family_relationships: 1,
  awards: 1,
  filmography: 1,
  biography: 1,
};
