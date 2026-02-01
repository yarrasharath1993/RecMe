/**
 * Validation Report Converter
 * 
 * Converts actor filmography validation results to ClawDBot ValidationReportInput format
 */

import type { ValidationReportInput } from '../types';

export interface ActorValidationIssue {
  id: string;
  movieId?: string;
  slug?: string;
  title?: string;
  year?: number;
  issueType: 'duplicate' | 'wrong_attribution' | 'no_verification' | 'tmdb_issue' | 'missing_field' | 'ghost_entry';
  confidence: number;
  action?: 'auto_fix' | 'flag_review' | 'report_only';
  details?: string;
  duplicate_of?: string;
  field?: string;
  sources?: string[];
}

export interface ActorValidationReport {
  actor: string;
  timestamp: string;
  dbCount?: number;
  tmdbCount?: number;
  wikiCount?: number;
  issues: ActorValidationIssue[];
  summary?: {
    autoFixed?: number;
    flaggedForReview?: number;
    reportOnly?: number;
  };
}

/**
 * Convert actor validation report to ClawDBot ValidationReportInput format
 */
export function convertActorValidationToClawDBot(
  actorReport: ActorValidationReport
): ValidationReportInput {
  const issues = actorReport.issues.map((issue, index) => {
    // Determine severity based on issue type and confidence
    let severity: string;
    if (issue.issueType === 'wrong_attribution' || issue.issueType === 'ghost_entry') {
      severity = issue.confidence >= 0.9 ? 'critical' : 'high';
    } else if (issue.issueType === 'duplicate') {
      severity = issue.confidence >= 0.9 ? 'high' : 'medium';
    } else if (issue.issueType === 'tmdb_issue') {
      severity = 'high';
    } else if (issue.issueType === 'no_verification') {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // Determine field based on issue type
    let field = issue.field || 'unknown';
    if (issue.issueType === 'duplicate') {
      field = 'slug';
    } else if (issue.issueType === 'wrong_attribution' || issue.issueType === 'ghost_entry') {
      field = 'hero';
    } else if (issue.issueType === 'tmdb_issue') {
      field = 'tmdb_id';
    } else if (issue.issueType === 'no_verification') {
      field = 'tmdb_id';
    }

    // Build message
    let message = '';
    if (issue.title && issue.year) {
      message = `${issue.title} (${issue.year})`;
    } else if (issue.slug) {
      message = issue.slug;
    } else {
      message = `Issue ${index + 1}`;
    }

    if (issue.issueType === 'duplicate') {
      message += ` - duplicate of ${issue.duplicate_of || 'unknown'}`;
    } else if (issue.issueType === 'wrong_attribution' || issue.issueType === 'ghost_entry') {
      message += ` - ${actorReport.actor} not found in TMDB cast`;
      if (issue.details) {
        message += `. ${issue.details}`;
      }
    } else if (issue.issueType === 'tmdb_issue') {
      message += ` - ${issue.details || 'TMDB issue detected'}`;
    } else if (issue.issueType === 'no_verification') {
      message += ` - missing TMDB ID`;
    } else if (issue.details) {
      message += ` - ${issue.details}`;
    }

    return {
      id: issue.id || `issue-${index + 1}`,
      severity,
      field,
      message,
      confidence: issue.confidence,
      sources: issue.sources || (issue.issueType === 'wrong_attribution' || issue.issueType === 'tmdb_issue' ? ['TMDB'] : [])
    };
  });

  return {
    report_id: `${actorReport.actor.toLowerCase().replace(/\s+/g, '-')}-validation-${new Date().toISOString().split('T')[0]}`,
    generated_at: actorReport.timestamp || new Date().toISOString(),
    total_issues: issues.length,
    issues
  };
}

/**
 * Convert validation result from validate-actor-movies.ts to ClawDBot format
 */
export function convertValidationResultToClawDBot(
  actor: string,
  validationResult: {
    timestamp: string;
    totalMovies: number;
    duplicates: Array<{
      movie: { title_en: string; release_year: number; slug: string; tmdb_id: number | null };
      details: string;
      confidence: number;
      duplicate_of?: { slug: string };
    }>;
    wrongAttributions: Array<{
      movie: { title_en: string; release_year: number; slug: string; tmdb_id: number | null };
      details: string;
      confidence: number;
    }>;
    noVerification: Array<{
      movie: { title_en: string; release_year: number; slug: string };
    }>;
  }
): ValidationReportInput {
  const issues: ValidationReportInput['issues'] = [];
  let issueIndex = 1;

  // Convert duplicates
  for (const dup of validationResult.duplicates) {
    issues.push({
      id: `duplicate-${issueIndex++}`,
      severity: dup.confidence >= 0.9 ? 'high' : 'medium',
      field: 'slug',
      message: `Duplicate movie: ${dup.movie.title_en} (${dup.movie.release_year}) - duplicate of ${dup.duplicate_of?.slug || 'unknown'}`,
      confidence: dup.confidence,
      sources: ['TMDB']
    });
  }

  // Convert wrong attributions
  for (const wrong of validationResult.wrongAttributions) {
    issues.push({
      id: `wrong-attribution-${issueIndex++}`,
      severity: 'critical',
      field: 'hero',
      message: `Wrong attribution: ${wrong.movie.title_en} (${wrong.movie.release_year}) - ${wrong.details}`,
      confidence: wrong.confidence,
      sources: ['TMDB']
    });
  }

  // Convert no verification
  for (const noVerif of validationResult.noVerification) {
    issues.push({
      id: `no-verification-${issueIndex++}`,
      severity: 'medium',
      field: 'tmdb_id',
      message: `No TMDB verification: ${noVerif.movie.title_en} (${noVerif.movie.release_year}) - missing TMDB ID`,
      confidence: 0.7,
      sources: []
    });
  }

  // Add summary if many no-verification issues
  if (validationResult.noVerification.length > 10) {
    issues.push({
      id: `no-verification-summary`,
      severity: 'low',
      field: 'tmdb_id',
      message: `${validationResult.noVerification.length} movies missing TMDB verification - requires manual review`,
      confidence: 0.6,
      sources: []
    });
  }

  return {
    report_id: `${actor.toLowerCase().replace(/\s+/g, '-')}-validation-${new Date().toISOString().split('T')[0]}`,
    generated_at: validationResult.timestamp,
    total_issues: issues.length,
    issues
  };
}
