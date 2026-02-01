import type { ConfidenceDeltaInput, ConfidenceAnalysis, ConfidenceDeltaExplanation } from './types';

export function analyzeConfidenceDelta(input: ConfidenceDeltaInput): ConfidenceAnalysis {
  // Pure function: analyze confidence changes
  
  const explanations: ConfidenceDeltaExplanation[] = input.deltas.map(delta => {
    const delta_value = delta.current_confidence - delta.previous_confidence;
    const delta_percentage = delta.previous_confidence > 0 
      ? (delta_value / delta.previous_confidence) * 100 
      : delta_value > 0 ? 100 : 0;
    
    return {
      entity_id: delta.entity_id,
      entity_type: delta.entity_type as 'movie' | 'celebrity' | 'review',
      previous_confidence: delta.previous_confidence,
      current_confidence: delta.current_confidence,
      delta: delta_value,
      delta_percentage,
      reason: (delta.reason as any) ?? 'unknown',
      explanation: generateConfidenceExplanation(delta, delta_value, delta_percentage),
      significance: determineSignificance(delta_value, delta_percentage)
    };
  });

  const major_improvements = explanations.filter(e => e.significance === 'major' && e.delta > 0).length;
  const major_degradations = explanations.filter(e => e.significance === 'major' && e.delta < 0).length;
  const average_delta = explanations.length > 0
    ? explanations.reduce((sum, e) => sum + e.delta, 0) / explanations.length
    : 0;

  return {
    total_deltas: input.deltas.length,
    major_improvements,
    major_degradations,
    explanations,
    average_delta,
    summary: generateConfidenceSummary(explanations, major_improvements, major_degradations, average_delta)
  };
}

// Helper functions (all pure)
function generateConfidenceExplanation(delta: any, delta_value: number, delta_percentage: number): string {
  const entityType = delta.entity_type || 'entity';
  const reason = delta.reason || 'unknown';
  const direction = delta_value > 0 ? 'increased' : delta_value < 0 ? 'decreased' : 'unchanged';
  const absPercentage = Math.abs(delta_percentage);

  let explanation = `${entityType} confidence ${direction} from ${Math.round(delta.previous_confidence * 100)}% to ${Math.round(delta.current_confidence * 100)}%`;
  
  if (absPercentage > 0) {
    explanation += ` (${direction === 'increased' ? '+' : ''}${absPercentage.toFixed(1)}%)`;
  }

  explanation += `. Reason: ${reason}.`;

  if (Math.abs(delta_value) >= 0.2) {
    explanation += ' This is a significant change.';
  }

  return explanation;
}

function determineSignificance(delta_value: number, delta_percentage: number): 'major' | 'moderate' | 'minor' {
  const absDelta = Math.abs(delta_value);
  const absPercentage = Math.abs(delta_percentage);

  // Major: >20% absolute change or >30% relative change
  if (absDelta >= 0.2 || absPercentage >= 30) {
    return 'major';
  }

  // Moderate: >10% absolute change or >15% relative change
  if (absDelta >= 0.1 || absPercentage >= 15) {
    return 'moderate';
  }

  return 'minor';
}

function generateConfidenceSummary(
  explanations: ConfidenceDeltaExplanation[], 
  improvements: number, 
  degradations: number, 
  average: number
): string {
  const total = explanations.length;
  
  if (total === 0) {
    return 'No confidence changes detected.';
  }

  const improvements_count = explanations.filter(e => e.delta > 0).length;
  const degradations_count = explanations.filter(e => e.delta < 0).length;
  const unchanged_count = explanations.filter(e => e.delta === 0).length;

  const parts: string[] = [];
  parts.push(`${total} confidence change${total === 1 ? '' : 's'}`);

  if (improvements_count > 0) {
    parts.push(`${improvements_count} improvement${improvements_count === 1 ? '' : 's'}`);
  }
  if (degradations_count > 0) {
    parts.push(`${degradations_count} degradation${degradations_count === 1 ? '' : 's'}`);
  }
  if (unchanged_count > 0) {
    parts.push(`${unchanged_count} unchanged`);
  }

  let summary = `${parts.join(', ')}.`;

  if (improvements > 0) {
    summary += ` ${improvements} major improvement${improvements === 1 ? '' : 's'} detected.`;
  }
  if (degradations > 0) {
    summary += ` ${degradations} major degradation${degradations === 1 ? '' : 's'} require${degradations === 1 ? 's' : ''} attention.`;
  }

  summary += ` Average delta: ${average >= 0 ? '+' : ''}${(average * 100).toFixed(1)}%.`;

  return summary;
}
