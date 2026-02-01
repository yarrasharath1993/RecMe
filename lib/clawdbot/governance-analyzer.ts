import type { GovernanceReportInput, GovernanceAnalysis, GovernanceDecisionExplanation } from './types';

export function analyzeGovernanceReport(input: GovernanceReportInput): GovernanceAnalysis {
  // Pure function: analyze governance decisions
  
  const explanations: GovernanceDecisionExplanation[] = input.decisions.map(decision => ({
    entity_id: decision.entity_id,
    entity_type: decision.entity_type as 'movie' | 'celebrity' | 'review',
    decision: decision.decision as 'approved' | 'flagged' | 'rejected',
    rule_violations: decision.rule_violations ?? [],
    trust_score: decision.trust_score ?? 0,
    trust_level: (decision.trust_level as any) ?? 'unverified',
    explanation: generateGovernanceExplanation(decision),
    recommended_action: generateRecommendation(decision)
  }));

  const distribution = calculateTrustDistribution(explanations);

  return {
    total_decisions: input.decisions.length,
    approved_count: explanations.filter(e => e.decision === 'approved').length,
    flagged_count: explanations.filter(e => e.decision === 'flagged').length,
    rejected_count: explanations.filter(e => e.decision === 'rejected').length,
    explanations,
    trust_distribution: distribution,
    summary: generateGovernanceSummary(explanations, distribution)
  };
}

// Helper functions (all pure)
function generateGovernanceExplanation(decision: any): string {
  const entityType = decision.entity_type || 'entity';
  const decisionType = decision.decision || 'unknown';
  const trustScore = decision.trust_score ?? 0;
  const trustLevel = decision.trust_level || 'unverified';
  const violations = decision.rule_violations || [];

  let explanation = `${entityType} decision: ${decisionType}. Trust score: ${Math.round(trustScore * 100)}% (${trustLevel}).`;

  if (violations.length > 0) {
    explanation += ` Rule violations: ${violations.join(', ')}.`;
  } else if (decisionType === 'approved') {
    explanation += ' No rule violations detected.';
  }

  return explanation;
}

function generateRecommendation(decision: any): string {
  const decisionType = decision.decision || 'unknown';
  const violations = decision.rule_violations || [];
  const trustScore = decision.trust_score ?? 0;

  if (decisionType === 'approved') {
    if (trustScore >= 0.9) {
      return 'Entity is verified and ready for publication.';
    } else if (trustScore >= 0.75) {
      return 'Entity is approved but consider additional verification for critical fields.';
    } else {
      return 'Entity is approved but monitor for data quality improvements.';
    }
  }

  if (decisionType === 'flagged') {
    if (violations.length > 0) {
      return `Review flagged entity. Address rule violations: ${violations.join(', ')}.`;
    }
    if (trustScore < 0.6) {
      return 'Improve data quality and source verification before approval.';
    }
    return 'Manual review recommended due to governance concerns.';
  }

  if (decisionType === 'rejected') {
    if (violations.length > 0) {
      return `Entity rejected. Critical rule violations must be resolved: ${violations.join(', ')}.`;
    }
    return 'Entity rejected. Data quality does not meet governance standards.';
  }

  return 'Review entity status and governance compliance.';
}

function calculateTrustDistribution(explanations: GovernanceDecisionExplanation[]): Record<string, number> {
  const distribution: Record<string, number> = {
    verified: 0,
    high: 0,
    medium: 0,
    low: 0,
    unverified: 0
  };

  explanations.forEach(exp => {
    distribution[exp.trust_level] = (distribution[exp.trust_level] || 0) + 1;
  });

  return distribution;
}

function generateGovernanceSummary(explanations: GovernanceDecisionExplanation[], distribution: Record<string, number>): string {
  const total = explanations.length;
  const approved = explanations.filter(e => e.decision === 'approved').length;
  const flagged = explanations.filter(e => e.decision === 'flagged').length;
  const rejected = explanations.filter(e => e.decision === 'rejected').length;

  const parts: string[] = [];
  parts.push(`${total} governance decision${total === 1 ? '' : 's'}`);
  parts.push(`${approved} approved`);
  if (flagged > 0) parts.push(`${flagged} flagged`);
  if (rejected > 0) parts.push(`${rejected} rejected`);

  const trustParts: string[] = [];
  Object.entries(distribution).forEach(([level, count]) => {
    if (count > 0) {
      trustParts.push(`${count} ${level}`);
    }
  });

  let summary = `${parts.join(', ')}. Trust distribution: ${trustParts.join(', ')}.`;

  if (rejected > 0) {
    summary += ` ${rejected} entity${rejected === 1 ? '' : 'ies'} require${rejected === 1 ? 's' : ''} immediate attention.`;
  } else if (flagged > 0) {
    summary += ` ${flagged} entity${flagged === 1 ? '' : 'ies'} need${flagged === 1 ? 's' : ''} review.`;
  } else {
    summary += ' All entities meet governance standards.';
  }

  return summary;
}
