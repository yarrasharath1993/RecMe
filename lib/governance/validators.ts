/**
 * GOVERNANCE VALIDATORS
 * 
 * Validates entities against governance rules.
 * Returns detailed validation results with explanations.
 */

import {
  GovernanceContentType,
  ConfidenceTier,
  TrustLevel,
  RuleId,
  RuleValidationResult,
  GovernanceValidationResult,
  TrustScoreBreakdown,
  FreshnessStatus,
} from './types';

import {
  GOVERNANCE_RULES,
  getEnabledRules,
  getRulesForEntity,
  getCriticalRules,
  evaluateRuleConditions,
  SOURCE_TIER_WEIGHTS,
  FRESHNESS_DECAY,
  AGE_RATING_HIERARCHY,
} from './rules';

// ============================================================
// TYPES FOR VALIDATORS
// ============================================================

interface MovieValidationData {
  id: string;
  title_en?: string;
  content_type?: GovernanceContentType;
  trust_score?: number;
  data_confidence?: number;
  source_tier?: number;
  has_tier1_source?: boolean;
  sources_disagree?: boolean;
  days_since_verification?: number;
  box_office_sources?: number;
  age_rating?: string;
  new_age_rating?: string;
  has_violence?: boolean;
  trigger_warnings?: string[];
  is_disputed?: boolean;
  cross_verified?: boolean;
  source_languages?: number;
  [key: string]: unknown;
}

interface CelebrityValidationData {
  id: string;
  name?: string;
  content_type?: GovernanceContentType;
  trust_score?: number;
  source_tier?: number;
  has_tier1_source?: boolean;
  sources_disagree?: boolean;
  days_since_verification?: number;
  family_relationships?: Record<string, unknown>;
  family_verified?: boolean;
  integrity_rules?: Record<string, unknown>;
  is_disputed?: boolean;
  cross_verified?: boolean;
  source_languages?: number;
  role_type?: string;
  [key: string]: unknown;
}

// ============================================================
// MAIN VALIDATION FUNCTION
// ============================================================

/**
 * Validate an entity against all applicable governance rules
 */
export function validateEntity(
  entityType: 'movie' | 'celebrity' | 'review',
  data: MovieValidationData | CelebrityValidationData
): GovernanceValidationResult {
  const rules = getRulesForEntity(
    entityType === 'movie' ? 'movies' : entityType === 'celebrity' ? 'celebrities' : 'reviews'
  );
  
  const ruleResults: RuleValidationResult[] = [];
  let totalTrustImpact = 0;
  const reviewFlags: string[] = [];
  const criticalFailures: string[] = [];
  
  for (const rule of rules) {
    const conditionsMet = evaluateRuleConditions(rule, data as Record<string, unknown>);
    
    if (conditionsMet) {
      // Rule conditions are met, check what actions to take
      const result = processRuleActions(rule, data as Record<string, unknown>);
      ruleResults.push(result);
      
      if (!result.passed) {
        totalTrustImpact += getTrustImpactFromActions(rule);
        
        // Collect flags
        for (const action of rule.actions) {
          if (action.type === 'flag' && action.params?.flag) {
            reviewFlags.push(action.params.flag as string);
          }
        }
        
        if (rule.severity === 'critical') {
          criticalFailures.push(rule.id);
        }
      }
    } else {
      // Rule doesn't apply or conditions not met - passed
      ruleResults.push({
        rule_id: rule.id,
        passed: true,
        severity: rule.severity,
        message: `Rule conditions not met - not applicable`,
        details: { conditions_evaluated: rule.conditions?.length || 0 },
      });
    }
  }
  
  // Determine overall validity
  const isValid = criticalFailures.length === 0;
  
  // Generate explanation
  const explanation = generateValidationExplanation(ruleResults, criticalFailures, reviewFlags);
  
  // Recommend content type based on validation
  const recommendedContentType = determineContentType(data, ruleResults);
  
  return {
    entity_type: entityType,
    entity_id: data.id,
    timestamp: new Date().toISOString(),
    is_valid: isValid,
    rule_results: ruleResults,
    trust_impact: Math.max(-1, Math.min(1, totalTrustImpact)),
    recommended_content_type: recommendedContentType,
    review_flags: [...new Set(reviewFlags)],
    explanation,
  };
}

// ============================================================
// RULE PROCESSING
// ============================================================

/**
 * Process rule actions and determine pass/fail
 */
function processRuleActions(
  rule: typeof GOVERNANCE_RULES[RuleId],
  data: Record<string, unknown>
): RuleValidationResult {
  let passed = true;
  let message = '';
  const details: Record<string, unknown> = {};
  
  for (const action of rule.actions) {
    switch (action.type) {
      case 'block':
        passed = false;
        message = `Blocked by ${rule.name}: ${rule.description}`;
        details.block_reason = action.params;
        break;
        
      case 'flag':
        // Flags don't fail validation but are recorded
        details.flags = details.flags || [];
        (details.flags as string[]).push(action.params?.flag as string);
        break;
        
      case 'adjust_trust':
        // Trust adjustments don't fail validation
        details.trust_adjustment = action.params;
        break;
        
      case 'require_review':
        passed = false;
        message = `Requires review: ${rule.name}`;
        details.review_priority = action.params?.priority;
        break;
        
      case 'log':
        details.logged = true;
        break;
        
      case 'notify':
        details.notification_type = action.params?.type;
        break;
    }
  }
  
  if (passed) {
    message = `Rule ${rule.id} evaluated - no blocking actions`;
  }
  
  return {
    rule_id: rule.id,
    passed,
    severity: rule.severity,
    message,
    details,
  };
}

/**
 * Calculate trust impact from rule actions
 */
function getTrustImpactFromActions(rule: typeof GOVERNANCE_RULES[RuleId]): number {
  let impact = 0;
  
  for (const action of rule.actions) {
    if (action.type === 'adjust_trust' && action.params?.delta) {
      impact += action.params.delta as number;
    }
  }
  
  return impact;
}

/**
 * Generate human-readable validation explanation
 */
function generateValidationExplanation(
  results: RuleValidationResult[],
  criticalFailures: string[],
  flags: string[]
): string {
  const parts: string[] = [];
  
  if (criticalFailures.length > 0) {
    parts.push(`❌ CRITICAL: ${criticalFailures.length} critical rule(s) failed: ${criticalFailures.join(', ')}`);
  }
  
  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed);
  
  parts.push(`✅ Passed: ${passed.length}/${results.length} rules`);
  
  if (failed.length > 0) {
    parts.push(`⚠️ Failed: ${failed.map((r) => `${r.rule_id} (${r.severity})`).join(', ')}`);
  }
  
  if (flags.length > 0) {
    parts.push(`🚩 Flags: ${flags.join(', ')}`);
  }
  
  return parts.join('\n');
}

/**
 * Determine content type based on validation results
 */
function determineContentType(
  data: MovieValidationData | CelebrityValidationData,
  results: RuleValidationResult[]
): GovernanceContentType {
  // If already has a valid content type, respect it
  if (data.content_type) {
    return data.content_type;
  }
  
  // Check for speculative flags
  const hasSpeculativeFlag = results.some(
    (r) => r.details?.flags && (r.details.flags as string[]).includes('speculative_content')
  );
  if (hasSpeculativeFlag) {
    return 'speculative';
  }
  
  // Check for unverified family
  const hasUnverifiedFlag = results.some(
    (r) => r.details?.flags && (r.details.flags as string[]).includes('unverified_family')
  );
  if (hasUnverifiedFlag) {
    return 'fan_content';
  }
  
  // Check trust score for verified_fact
  const trustScore = Number(data.trust_score || data.data_confidence || 0);
  if (trustScore >= 0.8 && data.has_tier1_source) {
    return 'verified_fact';
  }
  
  // Default to archive for older data
  if (data.days_since_verification && data.days_since_verification > FRESHNESS_DECAY.OUTDATED_DAYS) {
    return 'archive';
  }
  
  return 'editorial';
}

// ============================================================
// TRUST SCORE VALIDATION
// ============================================================

/**
 * Validate and compute trust score breakdown
 */
export function computeTrustScoreBreakdown(
  data: MovieValidationData | CelebrityValidationData,
  sourceData: {
    tier1_count?: number;
    tier2_count?: number;
    tier3_count?: number;
  },
  fieldCompleteness: {
    filled: number;
    total: number;
    critical_missing?: string[];
  }
): TrustScoreBreakdown {
  // Base score from existing confidence
  const baseScore = Number(data.data_confidence || data.trust_score || 0.5) * 100;
  
  // Source quality score
  const tier1 = sourceData.tier1_count || 0;
  const tier2 = sourceData.tier2_count || 0;
  const tier3 = sourceData.tier3_count || 0;
  const totalSources = tier1 + tier2 + tier3;
  
  let sourceScore = 0;
  if (totalSources > 0) {
    sourceScore = (
      (tier1 * SOURCE_TIER_WEIGHTS[1] + tier2 * SOURCE_TIER_WEIGHTS[2] + tier3 * SOURCE_TIER_WEIGHTS[3]) /
      totalSources
    ) * 100;
  }
  
  // Freshness score
  const daysSinceUpdate = data.days_since_verification || 0;
  let freshnessScore = 100;
  let decayApplied = 0;
  
  if (daysSinceUpdate > FRESHNESS_DECAY.FRESH_DAYS) {
    const monthsStale = Math.floor((daysSinceUpdate - FRESHNESS_DECAY.FRESH_DAYS) / 30);
    decayApplied = Math.min(monthsStale * FRESHNESS_DECAY.DECAY_PER_MONTH * 100, FRESHNESS_DECAY.MAX_DECAY * 100);
    freshnessScore = Math.max(0, 100 - decayApplied);
  }
  
  // Completeness score
  const completenessScore = (fieldCompleteness.filled / fieldCompleteness.total) * 100;
  
  // Validation score (sources agreement)
  const sourcesAgree = data.sources_disagree ? 0 : 1;
  const validationScore = sourcesAgree * 100;
  
  // Rule violations (from validation)
  const validation = validateEntity(
    'id' in data && typeof data.id === 'string' ? 'movie' : 'celebrity',
    data
  );
  const violatedRules = validation.rule_results
    .filter((r) => !r.passed)
    .map((r) => r.rule_id);
  
  const rulePenalty = Math.abs(validation.trust_impact) * 100;
  
  // Calculate final score (weighted average)
  const finalScore = Math.max(0, Math.min(100,
    baseScore * 0.3 +
    sourceScore * 0.2 +
    freshnessScore * 0.15 +
    validationScore * 0.15 +
    completenessScore * 0.2 -
    rulePenalty
  ));
  
  // Determine trust level and tier
  const trustLevel = getTrustLevel(finalScore);
  const confidenceTier = getConfidenceTier(finalScore);
  
  return {
    base_score: baseScore,
    source_quality: {
      score: sourceScore,
      tier1_count: tier1,
      tier2_count: tier2,
      tier3_count: tier3,
    },
    freshness: {
      score: freshnessScore,
      days_since_update: daysSinceUpdate,
      decay_applied: decayApplied,
    },
    validation: {
      score: validationScore,
      sources_agree: sourcesAgree,
      sources_disagree: data.sources_disagree ? 1 : 0,
      conflicts: data.sources_disagree ? ['source_conflict'] : [],
    },
    completeness: {
      score: completenessScore,
      filled_fields: fieldCompleteness.filled,
      total_fields: fieldCompleteness.total,
      critical_missing: fieldCompleteness.critical_missing || [],
    },
    rule_violations: {
      penalty: rulePenalty,
      violated_rules: violatedRules,
    },
    final_score: finalScore,
    trust_level: trustLevel,
    confidence_tier: confidenceTier,
  };
}

// ============================================================
// FRESHNESS VALIDATION
// ============================================================

/**
 * Compute freshness status for an entity
 */
export function computeFreshnessStatus(
  lastUpdated?: string | Date,
  lastVerified?: string | Date
): FreshnessStatus {
  const now = new Date();
  
  const daysSinceUpdate = lastUpdated
    ? Math.floor((now.getTime() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
    
  const daysSinceVerification = lastVerified
    ? Math.floor((now.getTime() - new Date(lastVerified).getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
  
  // Calculate freshness score
  let score = 100;
  let status: FreshnessStatus['status'] = 'fresh';
  let needsRevalidation = false;
  let recommendedAction: string | undefined;
  
  if (daysSinceVerification > FRESHNESS_DECAY.EXPIRED_DAYS) {
    score = 0;
    status = 'expired';
    needsRevalidation = true;
    recommendedAction = 'Full revalidation required';
  } else if (daysSinceVerification > FRESHNESS_DECAY.OUTDATED_DAYS) {
    score = 25;
    status = 'outdated';
    needsRevalidation = true;
    recommendedAction = 'Revalidation recommended';
  } else if (daysSinceVerification > FRESHNESS_DECAY.STALE_DAYS) {
    score = 50;
    status = 'stale';
    needsRevalidation = true;
    recommendedAction = 'Consider revalidation';
  } else if (daysSinceVerification > FRESHNESS_DECAY.FRESH_DAYS) {
    score = 75;
    status = 'stale';
    recommendedAction = 'Monitor for updates';
  }
  
  return {
    days_since_update: daysSinceUpdate,
    days_since_verification: daysSinceVerification,
    score,
    status,
    needs_revalidation: needsRevalidation,
    recommended_action: recommendedAction,
  };
}

// ============================================================
// AGE RATING VALIDATION
// ============================================================

/**
 * Validate age rating change (safety-first)
 */
export function validateAgeRatingChange(
  currentRating: string | undefined,
  newRating: string
): { valid: boolean; reason: string } {
  if (!currentRating) {
    return { valid: true, reason: 'No existing rating' };
  }
  
  const currentIndex = AGE_RATING_HIERARCHY.indexOf(currentRating);
  const newIndex = AGE_RATING_HIERARCHY.indexOf(newRating);
  
  if (currentIndex === -1 || newIndex === -1) {
    return { valid: true, reason: 'Unknown rating format' };
  }
  
  if (newIndex < currentIndex) {
    return {
      valid: false,
      reason: `Cannot downgrade from ${currentRating} to ${newRating} (RULE_010: Safety first)`,
    };
  }
  
  return { valid: true, reason: 'Rating change allowed' };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getTrustLevel(score: number): TrustLevel {
  if (score >= 90) return 'verified';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'low';
  return 'unverified';
}

function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'unverified';
}

// ============================================================
// EXPORTS
// ============================================================

export type {
  MovieValidationData,
  CelebrityValidationData,
};
