import type { ValidationReportInput, ValidationAnalysis, ValidationIssueExplanation } from './types';

export function analyzeValidationReport(input: ValidationReportInput): ValidationAnalysis {
  // Pure function: JSON in → JSON out
  // No side effects, no DB access, no network
  
  const explanations: ValidationIssueExplanation[] = input.issues.map(issue => ({
    issue_id: issue.id,
    severity: classifySeverity(issue.severity),
    field: issue.field,
    explanation: generateExplanation(issue),
    recommended_action: determineAction(issue),
    confidence: issue.confidence ?? 0.5,
    source_disagreement: issue.sources && issue.sources.length > 1 ? issue.sources : undefined
  }));

  const counts = countBySeverity(explanations);
  const overall_health = determineOverallHealth(counts);

  return {
    total_issues: input.total_issues,
    critical_count: counts.critical,
    high_count: counts.high,
    medium_count: counts.medium,
    low_count: counts.low,
    explanations,
    overall_health,
    summary: generateSummary(counts, overall_health)
  };
}

// Helper functions (all pure)
function classifySeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
  const normalized = severity.toLowerCase().trim();
  if (normalized === 'critical' || normalized === 'crit') {
    return 'critical';
  }
  if (normalized === 'high' || normalized === 'h') {
    return 'high';
  }
  if (normalized === 'medium' || normalized === 'med' || normalized === 'm') {
    return 'medium';
  }
  return 'low';
}

function generateExplanation(issue: any): string {
  const field = issue.field || 'unknown field';
  const message = issue.message || 'Validation issue detected';
  const sources = issue.sources && issue.sources.length > 0 
    ? ` Sources: ${issue.sources.join(', ')}.`
    : '';
  const confidence = issue.confidence 
    ? ` Confidence: ${Math.round(issue.confidence * 100)}%.`
    : '';

  return `${message} Field: ${field}.${sources}${confidence}`;
}

function determineAction(issue: any): 'auto_fix' | 'manual_review' | 'investigate' {
  const severity = classifySeverity(issue.severity);
  const confidence = issue.confidence ?? 0.5;
  const hasMultipleSources = issue.sources && issue.sources.length > 1;

  // Critical issues always need investigation
  if (severity === 'critical') {
    return 'investigate';
  }

  // High severity with low confidence needs manual review
  if (severity === 'high' && confidence < 0.7) {
    return 'manual_review';
  }

  // High confidence with multiple sources can be auto-fixed
  if (confidence >= 0.8 && hasMultipleSources) {
    return 'auto_fix';
  }

  // Default to manual review for safety
  return 'manual_review';
}

function countBySeverity(explanations: ValidationIssueExplanation[]): Record<string, number> {
  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  explanations.forEach(exp => {
    counts[exp.severity] = (counts[exp.severity] || 0) + 1;
  });

  return counts;
}

function determineOverallHealth(counts: Record<string, number>): 'healthy' | 'degraded' | 'critical' {
  const total = counts.critical + counts.high + counts.medium + counts.low;
  
  if (total === 0) {
    return 'healthy';
  }

  // Critical threshold: >10% critical issues or >5 critical issues
  if (counts.critical > 5 || (counts.critical / total) > 0.1) {
    return 'critical';
  }

  // Degraded threshold: >20% high+critical issues or >10 high+critical issues
  const highCritical = counts.critical + counts.high;
  if (highCritical > 10 || (highCritical / total) > 0.2) {
    return 'degraded';
  }

  return 'healthy';
}

function generateSummary(counts: Record<string, number>, health: string): string {
  const total = counts.critical + counts.high + counts.medium + counts.low;
  
  if (total === 0) {
    return 'No validation issues detected. System health is optimal.';
  }

  const parts: string[] = [];
  
  if (counts.critical > 0) {
    parts.push(`${counts.critical} critical`);
  }
  if (counts.high > 0) {
    parts.push(`${counts.high} high`);
  }
  if (counts.medium > 0) {
    parts.push(`${counts.medium} medium`);
  }
  if (counts.low > 0) {
    parts.push(`${counts.low} low`);
  }

  const issueList = parts.join(', ');
  const healthStatus = health === 'critical' 
    ? 'requires immediate attention'
    : health === 'degraded'
    ? 'needs review'
    : 'is acceptable';

  return `Found ${total} validation issue${total === 1 ? '' : 's'} (${issueList} severity). Overall health ${healthStatus}.`;
}
