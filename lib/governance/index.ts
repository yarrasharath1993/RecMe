/**
 * GOVERNANCE MODULE
 * 
 * Content governance system for Telugu Portal.
 * Provides:
 * - Machine-readable rules
 * - Entity validation
 * - Trust scoring with explainability
 * - Freshness decay
 * - AI safety controls
 * 
 * Usage:
 * ```typescript
 * import { 
 *   validateEntity, 
 *   computeTrustScoreBreakdown, 
 *   explainTrustScore 
 * } from '@/lib/governance';
 * 
 * // Validate a movie
 * const result = validateEntity('movie', movieData);
 * 
 * // Get trust breakdown
 * const breakdown = computeTrustScoreBreakdown(movieData, sourceData, completeness);
 * 
 * // Get human-readable explanation
 * const explanation = explainTrustScore(breakdown);
 * ```
 */

// ============================================================
// TYPE EXPORTS
// ============================================================

export type {
  // Content types
  GovernanceContentType,
  ConfidenceTier,
  TrustLevel,
  
  // Rules
  RuleId,
  RuleSeverity,
  RuleCategory,
  GovernanceRule,
  RuleCondition,
  RuleAction,
  
  // Validation
  RuleValidationResult,
  GovernanceValidationResult,
  
  // Trust scoring
  TrustScoreBreakdown,
  TrustExplanation,
  
  // Freshness
  FreshnessStatus,
  
  // Audit
  GovernanceAuditEntry,
  
  // Entity governance
  EntityGovernanceConfig,
  
  // AI safety
  AiPromptConstraints,
  AiOutputValidation,
} from './types';

// ============================================================
// RULES EXPORTS
// ============================================================

export {
  // Rules
  GOVERNANCE_RULES,
  
  // Rule utilities
  getEnabledRules,
  getRulesByCategory,
  getRulesBySeverity,
  getRulesForEntity,
  getCriticalRules,
  canOverrideRule,
  getRule,
  formatRuleDescription,
  
  // Condition evaluation
  evaluateCondition,
  evaluateRuleConditions,
  
  // Constants
  SOURCE_TIER_WEIGHTS,
  FRESHNESS_DECAY,
  AGE_RATING_HIERARCHY,
  MIN_SOURCES_REQUIRED,
} from './rules';

// ============================================================
// VALIDATOR EXPORTS
// ============================================================

export {
  // Main validation
  validateEntity,
  
  // Trust scoring
  computeTrustScoreBreakdown,
  
  // Freshness
  computeFreshnessStatus,
  
  // Age rating
  validateAgeRatingChange,
  
  // Types
  type MovieValidationData,
  type CelebrityValidationData,
} from './validators';

// ============================================================
// EXPLAINABILITY EXPORTS
// ============================================================

export {
  // Trust explanations
  explainTrustScore,
  
  // Validation explanations
  explainValidationResult,
  
  // Rule explanations
  explainRuleTrigger,
  
  // Freshness explanations
  explainFreshnessStatus,
  
  // Tier explanations
  explainConfidenceTier,
  explainTrustLevel,
  
  // Dispute explanations
  explainDispute,
  
  // AI safety explanations
  explainAiExclusion,
  
  // Batch explanations
  explainBatchValidation,
} from './explainability';

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

import { validateEntity, computeTrustScoreBreakdown } from './validators';
import { explainTrustScore, explainValidationResult } from './explainability';
import type { TrustScoreBreakdown, GovernanceValidationResult } from './types';

/**
 * Full governance check with explanation
 * Combines validation, trust scoring, and explanation in one call
 */
export function fullGovernanceCheck(
  entityType: 'movie' | 'celebrity' | 'review',
  data: Record<string, unknown>,
  sourceData?: {
    tier1_count?: number;
    tier2_count?: number;
    tier3_count?: number;
  },
  fieldCompleteness?: {
    filled: number;
    total: number;
    critical_missing?: string[];
  }
): {
  validation: GovernanceValidationResult;
  trustBreakdown: TrustScoreBreakdown | null;
  explanation: string[];
} {
  // Validate entity
  const validation = validateEntity(entityType, data as never);
  
  // Compute trust breakdown if we have source data
  let trustBreakdown: TrustScoreBreakdown | null = null;
  if (sourceData && fieldCompleteness) {
    trustBreakdown = computeTrustScoreBreakdown(
      data as never,
      sourceData,
      fieldCompleteness
    );
  }
  
  // Generate explanations
  const explanation = explainValidationResult(validation);
  
  if (trustBreakdown) {
    const trustExplanation = explainTrustScore(trustBreakdown);
    explanation.push('', '--- Trust Score Details ---');
    explanation.push(trustExplanation.summary);
    explanation.push(...trustExplanation.warnings.map((w) => `⚠️ ${w}`));
    explanation.push(...trustExplanation.improvements.map((i) => `💡 ${i}`));
  }
  
  return {
    validation,
    trustBreakdown,
    explanation,
  };
}

/**
 * Quick trust check - returns simple pass/fail with score
 */
export function quickTrustCheck(
  entityType: 'movie' | 'celebrity' | 'review',
  data: Record<string, unknown>
): {
  isValid: boolean;
  trustLevel: string;
  score: number;
  flags: string[];
} {
  const validation = validateEntity(entityType, data as never);
  
  // Extract trust info from validation
  const trustScore = (data.trust_score as number) || (data.data_confidence as number) || 0.5;
  const trustLevel = getTrustLevelFromScore(trustScore * 100);
  
  return {
    isValid: validation.is_valid,
    trustLevel,
    score: Math.round(trustScore * 100),
    flags: validation.review_flags,
  };
}

function getTrustLevelFromScore(score: number): string {
  if (score >= 90) return 'verified';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'low';
  return 'unverified';
}

/**
 * Check if content is safe for AI usage
 */
export function isAiSafe(data: Record<string, unknown>): {
  safe: boolean;
  reason?: string;
} {
  const contentType = data.content_type as string;
  const trustScore = (data.trust_score as number) || (data.data_confidence as number) || 0;
  const isDisputed = data.is_disputed as boolean;
  
  // RULE_005: AI only uses verified_fact
  if (contentType === 'speculative') {
    return { safe: false, reason: 'Speculative content excluded from AI (RULE_002, RULE_005)' };
  }
  
  if (isDisputed) {
    return { safe: false, reason: 'Disputed content excluded from AI (RULE_012)' };
  }
  
  if (trustScore < 0.5) {
    return { safe: false, reason: `Low trust score (${Math.round(trustScore * 100)}%) - AI requires ≥50%` };
  }
  
  return { safe: true };
}
