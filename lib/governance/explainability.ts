/**
 * GOVERNANCE EXPLAINABILITY
 * 
 * Generates human-readable explanations for governance decisions.
 * Every score, flag, and action should be explainable.
 */

import {
  TrustScoreBreakdown,
  TrustExplanation,
  TrustLevel,
  ConfidenceTier,
  RuleValidationResult,
  GovernanceValidationResult,
  FreshnessStatus,
  RuleId,
} from './types';

import { getRule, formatRuleDescription } from './rules';

// ============================================================
// TRUST SCORE EXPLANATION
// ============================================================

/**
 * Generate a human-readable explanation for a trust score
 */
export function explainTrustScore(
  breakdown: TrustScoreBreakdown
): TrustExplanation {
  const keyFactors: TrustExplanation['key_factors'] = [];
  const warnings: string[] = [];
  const improvements: string[] = [];
  
  // Analyze source quality
  if (breakdown.source_quality.tier1_count >= 2) {
    keyFactors.push({
      factor: 'Strong source verification',
      impact: 'positive',
      description: `Verified by ${breakdown.source_quality.tier1_count} authoritative sources (Wikipedia, TMDB, IMDb)`,
    });
  } else if (breakdown.source_quality.tier1_count === 1) {
    keyFactors.push({
      factor: 'Single authoritative source',
      impact: 'neutral',
      description: 'Data from 1 primary source. Additional verification recommended.',
    });
    improvements.push('Add verification from additional authoritative sources');
  } else {
    keyFactors.push({
      factor: 'Limited source verification',
      impact: 'negative',
      description: 'No authoritative sources. Data from community/aggregator sources only.',
    });
    warnings.push('No primary source verification');
    improvements.push('Verify data against Wikipedia or TMDB');
  }
  
  // Analyze freshness
  if (breakdown.freshness.score >= 90) {
    keyFactors.push({
      factor: 'Recent verification',
      impact: 'positive',
      description: `Data verified ${breakdown.freshness.days_since_update} days ago`,
    });
  } else if (breakdown.freshness.score >= 50) {
    keyFactors.push({
      factor: 'Aging data',
      impact: 'neutral',
      description: `Data last verified ${breakdown.freshness.days_since_update} days ago. Trust reduced by ${breakdown.freshness.decay_applied}%`,
    });
    improvements.push('Revalidate data to restore freshness');
  } else {
    keyFactors.push({
      factor: 'Outdated data',
      impact: 'negative',
      description: `Data not verified for ${breakdown.freshness.days_since_update} days. Significant trust decay applied.`,
    });
    warnings.push('Data may be outdated');
    improvements.push('Urgent revalidation needed');
  }
  
  // Analyze completeness
  const completenessPercent = Math.round(breakdown.completeness.score);
  if (completenessPercent >= 80) {
    keyFactors.push({
      factor: 'High data completeness',
      impact: 'positive',
      description: `${completenessPercent}% of fields populated`,
    });
  } else if (completenessPercent >= 50) {
    keyFactors.push({
      factor: 'Partial data',
      impact: 'neutral',
      description: `${completenessPercent}% of fields populated`,
    });
    if (breakdown.completeness.critical_missing.length > 0) {
      warnings.push(`Missing critical fields: ${breakdown.completeness.critical_missing.join(', ')}`);
      improvements.push(`Add missing fields: ${breakdown.completeness.critical_missing.join(', ')}`);
    }
  } else {
    keyFactors.push({
      factor: 'Incomplete data',
      impact: 'negative',
      description: `Only ${completenessPercent}% of fields populated`,
    });
    warnings.push('Significant data gaps');
    improvements.push('Complete required fields for higher trust');
  }
  
  // Analyze validation
  if (breakdown.validation.sources_disagree > 0) {
    keyFactors.push({
      factor: 'Source conflict',
      impact: 'negative',
      description: 'Multiple sources provide conflicting data',
    });
    warnings.push('Data disputed between sources');
    improvements.push('Resolve source conflicts through manual review');
  }
  
  // Analyze rule violations
  if (breakdown.rule_violations.violated_rules.length > 0) {
    keyFactors.push({
      factor: 'Rule violations',
      impact: 'negative',
      description: `${breakdown.rule_violations.violated_rules.length} governance rule(s) violated`,
    });
    warnings.push(`Rules violated: ${breakdown.rule_violations.violated_rules.join(', ')}`);
    improvements.push('Address rule violations to improve trust score');
  }
  
  // Generate summary
  const summary = generateTrustSummary(breakdown.final_score, breakdown.trust_level, keyFactors);
  
  return {
    summary,
    key_factors: keyFactors,
    warnings,
    improvements,
  };
}

/**
 * Generate a summary sentence for trust score
 */
function generateTrustSummary(
  score: number,
  level: TrustLevel,
  factors: TrustExplanation['key_factors']
): string {
  const positiveCount = factors.filter((f) => f.impact === 'positive').length;
  const negativeCount = factors.filter((f) => f.impact === 'negative').length;
  
  const levelDescriptions: Record<TrustLevel, string> = {
    verified: 'This data has been verified from multiple authoritative sources and is highly reliable.',
    high: 'This data comes from reliable sources with good coverage.',
    medium: 'Some data points may need verification. Use with appropriate caution.',
    low: 'Limited sources available. Data should be verified before use.',
    unverified: 'This data has not been verified. Exercise significant caution.',
  };
  
  let summary = `Trust Score: ${Math.round(score)}% (${level}). ${levelDescriptions[level]}`;
  
  if (negativeCount > positiveCount) {
    summary += ' Several factors are reducing the trust score.';
  } else if (positiveCount > negativeCount) {
    summary += ' Multiple positive factors contribute to this score.';
  }
  
  return summary;
}

// ============================================================
// VALIDATION EXPLANATION
// ============================================================

/**
 * Generate detailed explanation for validation result
 */
export function explainValidationResult(
  result: GovernanceValidationResult
): string[] {
  const explanations: string[] = [];
  
  // Overall status
  if (result.is_valid) {
    explanations.push('✅ Validation passed - all critical rules satisfied');
  } else {
    explanations.push('❌ Validation failed - one or more critical rules violated');
  }
  
  // Group results by outcome
  const failed = result.rule_results.filter((r) => !r.passed);
  const passed = result.rule_results.filter((r) => r.passed);
  
  // Explain failures
  if (failed.length > 0) {
    explanations.push('\n📋 Rule Violations:');
    
    for (const failure of failed) {
      const rule = getRule(failure.rule_id);
      if (rule) {
        explanations.push(`  • [${failure.severity.toUpperCase()}] ${rule.name}`);
        explanations.push(`    ${failure.message}`);
        if (failure.suggested_action) {
          explanations.push(`    → Suggested: ${failure.suggested_action}`);
        }
      }
    }
  }
  
  // Explain flags
  if (result.review_flags.length > 0) {
    explanations.push('\n🚩 Review Flags:');
    for (const flag of result.review_flags) {
      explanations.push(`  • ${formatFlag(flag)}`);
    }
  }
  
  // Trust impact
  if (result.trust_impact !== 0) {
    const direction = result.trust_impact > 0 ? '+' : '';
    explanations.push(`\n📊 Trust Impact: ${direction}${Math.round(result.trust_impact * 100)}%`);
  }
  
  // Content type recommendation
  if (result.recommended_content_type) {
    explanations.push(`\n📁 Recommended Content Type: ${formatContentType(result.recommended_content_type)}`);
  }
  
  // Summary stats
  explanations.push(`\n📈 Summary: ${passed.length} passed, ${failed.length} failed out of ${result.rule_results.length} rules`);
  
  return explanations;
}

/**
 * Format a flag for display
 */
function formatFlag(flag: string): string {
  const flagDescriptions: Record<string, string> = {
    needs_primary_source: 'Needs verification from authoritative source',
    speculative_content: 'Contains speculative/unverified content',
    promotion_not_filmography: 'Promotional appearance, not acting credit',
    needs_revalidation: 'Data needs revalidation',
    source_conflict: 'Sources provide conflicting information',
    unverified_family: 'Family relationships not verified',
    single_source_box_office: 'Box office from single source only',
    missing_content_warning: 'May need additional content warnings',
    disputed_data: 'Data is disputed or contested',
    stale_data: 'Data may be outdated',
    needs_cross_language_verification: 'Cross-language data needs verification',
  };
  
  return flagDescriptions[flag] || flag.replace(/_/g, ' ');
}

/**
 * Format content type for display
 */
function formatContentType(type: string): string {
  const typeDescriptions: Record<string, string> = {
    verified_fact: 'Verified Fact - confirmed from multiple sources',
    archive: 'Archive - historical data',
    opinion: 'Opinion - editorial viewpoint',
    editorial: 'Editorial - curated content',
    speculative: 'Speculative - unverified content',
    fan_content: 'Fan Content - community contributed',
    promotional: 'Promotional - marketing content',
    kids_safe: 'Kids Safe - verified for children',
  };
  
  return typeDescriptions[type] || type;
}

// ============================================================
// RULE EXPLANATION
// ============================================================

/**
 * Explain why a specific rule was triggered
 */
export function explainRuleTrigger(
  ruleId: RuleId,
  data: Record<string, unknown>
): string {
  const rule = getRule(ruleId);
  if (!rule) {
    return `Unknown rule: ${ruleId}`;
  }
  
  const parts: string[] = [];
  parts.push(`Rule ${ruleId}: ${rule.name}`);
  parts.push(`Description: ${rule.description}`);
  parts.push(`Severity: ${rule.severity.toUpperCase()}`);
  
  if (rule.conditions && rule.conditions.length > 0) {
    parts.push('\nConditions that triggered this rule:');
    for (const condition of rule.conditions) {
      const fieldValue = data[condition.field];
      parts.push(`  • ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`);
      parts.push(`    (Current value: ${JSON.stringify(fieldValue)})`);
    }
  }
  
  parts.push('\nActions to be taken:');
  for (const action of rule.actions) {
    parts.push(`  • ${action.type}${action.params ? `: ${JSON.stringify(action.params)}` : ''}`);
  }
  
  if (rule.overridable) {
    parts.push(`\nThis rule can be overridden by: ${rule.override_requires}`);
  } else {
    parts.push('\nThis rule cannot be overridden.');
  }
  
  return parts.join('\n');
}

// ============================================================
// FRESHNESS EXPLANATION
// ============================================================

/**
 * Explain freshness status
 */
export function explainFreshnessStatus(status: FreshnessStatus): string {
  const parts: string[] = [];
  
  const statusEmojis: Record<FreshnessStatus['status'], string> = {
    fresh: '🟢',
    stale: '🟡',
    outdated: '🟠',
    expired: '🔴',
  };
  
  parts.push(`${statusEmojis[status.status]} Freshness: ${status.status.toUpperCase()} (${status.score}%)`);
  
  if (status.days_since_update !== Infinity) {
    parts.push(`Last updated: ${status.days_since_update} days ago`);
  }
  
  if (status.days_since_verification !== Infinity) {
    parts.push(`Last verified: ${status.days_since_verification} days ago`);
  }
  
  if (status.needs_revalidation) {
    parts.push('⚠️ Revalidation needed');
  }
  
  if (status.recommended_action) {
    parts.push(`Recommended: ${status.recommended_action}`);
  }
  
  return parts.join('\n');
}

// ============================================================
// CONFIDENCE TIER EXPLANATION
// ============================================================

/**
 * Explain what a confidence tier means
 */
export function explainConfidenceTier(tier: ConfidenceTier): string {
  const explanations: Record<ConfidenceTier, string> = {
    high: 'HIGH CONFIDENCE: Data is well-sourced, recently verified, and passes all governance rules. Safe for use in AI summaries and editorial content.',
    medium: 'MEDIUM CONFIDENCE: Data has some verification but may have gaps. Suitable for display with appropriate caveats.',
    low: 'LOW CONFIDENCE: Limited sources or verification. Data should be used cautiously and clearly labeled.',
    unverified: 'UNVERIFIED: Data has not been verified. Should not be used in AI summaries. Display with strong disclaimers.',
  };
  
  return explanations[tier];
}

/**
 * Explain what a trust level means
 */
export function explainTrustLevel(level: TrustLevel): string {
  const explanations: Record<TrustLevel, string> = {
    verified: 'VERIFIED (90%+): Confirmed from multiple authoritative sources. Highest reliability.',
    high: 'HIGH (70-89%): From reliable sources with good coverage. Generally trustworthy.',
    medium: 'MEDIUM (50-69%): Some data points may need verification. Use with appropriate caution.',
    low: 'LOW (30-49%): Limited sources available. Data should be verified before critical use.',
    unverified: 'UNVERIFIED (<30%): Not verified from any authoritative source. Exercise significant caution.',
  };
  
  return explanations[level];
}

// ============================================================
// DISPUTE EXPLANATION
// ============================================================

/**
 * Explain a data dispute
 */
export function explainDispute(
  field: string,
  sources: { name: string; value: unknown }[]
): string {
  const parts: string[] = [];
  parts.push(`⚠️ DATA DISPUTE: ${field}`);
  parts.push('Different sources provide conflicting values:');
  
  for (const source of sources) {
    parts.push(`  • ${source.name}: ${JSON.stringify(source.value)}`);
  }
  
  parts.push('\nThis dispute affects trust scoring and requires manual review.');
  parts.push('The system will not automatically resolve conflicting data.');
  
  return parts.join('\n');
}

// ============================================================
// AI SAFETY EXPLANATION
// ============================================================

/**
 * Explain why content is excluded from AI input
 */
export function explainAiExclusion(
  reason: 'low_trust' | 'speculative' | 'disputed' | 'rule_violation',
  details: Record<string, unknown>
): string {
  const explanations: Record<string, string> = {
    low_trust: `Content excluded from AI due to low trust score (${details.score || 'unknown'}%). AI summaries only use high-confidence data.`,
    speculative: 'Content excluded from AI because it is marked as speculative. AI cannot present speculation as fact.',
    disputed: 'Content excluded from AI because it is disputed. AI cannot present contested data without resolution.',
    rule_violation: `Content excluded from AI due to rule violation: ${details.rule || 'unknown'}`,
  };
  
  return explanations[reason] || `Content excluded from AI: ${reason}`;
}

// ============================================================
// BATCH EXPLANATION
// ============================================================

/**
 * Generate a summary for batch validation
 */
export function explainBatchValidation(
  results: GovernanceValidationResult[]
): string {
  const passed = results.filter((r) => r.is_valid).length;
  const failed = results.length - passed;
  
  const allFlags = results.flatMap((r) => r.review_flags);
  const flagCounts = allFlags.reduce((acc, flag) => {
    acc[flag] = (acc[flag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const parts: string[] = [];
  parts.push(`📊 BATCH VALIDATION SUMMARY`);
  parts.push(`Total: ${results.length} entities`);
  parts.push(`✅ Passed: ${passed} (${Math.round(passed / results.length * 100)}%)`);
  parts.push(`❌ Failed: ${failed} (${Math.round(failed / results.length * 100)}%)`);
  
  if (Object.keys(flagCounts).length > 0) {
    parts.push('\nTop flags:');
    const sortedFlags = Object.entries(flagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [flag, count] of sortedFlags) {
      parts.push(`  • ${formatFlag(flag)}: ${count}`);
    }
  }
  
  return parts.join('\n');
}
