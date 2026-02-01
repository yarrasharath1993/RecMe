import type { ChangeSummary } from './types';

export interface ChangeSummaryInput {
  period_start: string;
  period_end: string;
  movies_added: number;
  movies_updated: number;
  reviews_generated: number;
  reviews_enhanced: number;
  celebrities_added: number;
  celebrities_updated: number;
  trust_score_improvements: number;
  validation_issues_resolved: number;
  source_contributions: Array<{ source: string; count: number }>;
}

export function generateChangeSummary(input: ChangeSummaryInput): ChangeSummary {
  // Pure function: generate human-readable change summary
  
  const top_contributors = input.source_contributions
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const highlights = generateHighlights(input);

  return {
    period_start: input.period_start,
    period_end: input.period_end,
    movies_added: input.movies_added,
    movies_updated: input.movies_updated,
    reviews_generated: input.reviews_generated,
    reviews_enhanced: input.reviews_enhanced,
    celebrities_added: input.celebrities_added,
    celebrities_updated: input.celebrities_updated,
    trust_score_improvements: input.trust_score_improvements,
    validation_issues_resolved: input.validation_issues_resolved,
    top_contributors,
    summary: generateSummaryText(input, top_contributors),
    highlights
  };
}

// Helper functions (all pure)
function generateHighlights(input: ChangeSummaryInput): string[] {
  const highlights: string[] = [];
  const total = input.movies_added + input.movies_updated + input.reviews_generated + 
                input.reviews_enhanced + input.celebrities_added + input.celebrities_updated;

  if (input.movies_added > 0) {
    highlights.push(`Added ${input.movies_added} new movie${input.movies_added === 1 ? '' : 's'}`);
  }
  if (input.movies_updated > 0) {
    highlights.push(`Updated ${input.movies_updated} existing movie${input.movies_updated === 1 ? '' : 's'}`);
  }
  if (input.reviews_generated > 0) {
    highlights.push(`Generated ${input.reviews_generated} new review${input.reviews_generated === 1 ? '' : 's'}`);
  }
  if (input.reviews_enhanced > 0) {
    highlights.push(`Enhanced ${input.reviews_enhanced} review${input.reviews_enhanced === 1 ? '' : 's'}`);
  }
  if (input.celebrities_added > 0) {
    highlights.push(`Added ${input.celebrities_added} new celebrit${input.celebrities_added === 1 ? 'y' : 'ies'}`);
  }
  if (input.trust_score_improvements > 0) {
    highlights.push(`Improved trust scores for ${input.trust_score_improvements} entit${input.trust_score_improvements === 1 ? 'y' : 'ies'}`);
  }
  if (input.validation_issues_resolved > 0) {
    highlights.push(`Resolved ${input.validation_issues_resolved} validation issue${input.validation_issues_resolved === 1 ? '' : 's'}`);
  }

  if (highlights.length === 0) {
    highlights.push('No significant changes detected in this period');
  }

  return highlights;
}

function generateSummaryText(input: ChangeSummaryInput, contributors: Array<{ source: string; count: number }>): string {
  const parts: string[] = [];
  
  parts.push(`Period: ${input.period_start} to ${input.period_end}`);

  const changes: string[] = [];
  if (input.movies_added > 0) changes.push(`${input.movies_added} movies added`);
  if (input.movies_updated > 0) changes.push(`${input.movies_updated} movies updated`);
  if (input.reviews_generated > 0) changes.push(`${input.reviews_generated} reviews generated`);
  if (input.reviews_enhanced > 0) changes.push(`${input.reviews_enhanced} reviews enhanced`);
  if (input.celebrities_added > 0) changes.push(`${input.celebrities_added} celebrities added`);
  if (input.celebrities_updated > 0) changes.push(`${input.celebrities_updated} celebrities updated`);

  if (changes.length > 0) {
    parts.push(changes.join(', '));
  }

  if (input.trust_score_improvements > 0) {
    parts.push(`${input.trust_score_improvements} trust score improvement${input.trust_score_improvements === 1 ? '' : 's'}`);
  }

  if (input.validation_issues_resolved > 0) {
    parts.push(`${input.validation_issues_resolved} validation issue${input.validation_issues_resolved === 1 ? '' : 's'} resolved`);
  }

  if (contributors.length > 0) {
    const topSource = contributors[0];
    parts.push(`Top contributor: ${topSource.source} (${topSource.count} contributions)`);
  }

  return parts.join('. ') + '.';
}
