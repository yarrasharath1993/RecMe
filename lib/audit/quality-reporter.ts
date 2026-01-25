/**
 * Data Quality Reporter
 * 
 * Generates comprehensive data quality reports for the platform.
 * Part of the governance audit system.
 */

import { createClient } from '@supabase/supabase-js';
import type { DataQualityReport, AuditSeverity } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const getSupabase = () => createClient(supabaseUrl, supabaseKey);

// Critical fields that should be populated
const CRITICAL_MOVIE_FIELDS = [
  'title',
  'release_date',
  'hero',
  'director',
  'primary_genre',
];

const CRITICAL_CELEBRITY_FIELDS = [
  'name',
  'slug',
];

/**
 * Generate a comprehensive data quality report
 */
export async function generateDataQualityReport(): Promise<DataQualityReport> {
  const supabase = getSupabase();
  
  // Get movie statistics
  const movieStats = await getMovieStatistics(supabase);
  
  // Get celebrity statistics
  const celebrityStats = await getCelebrityStatistics(supabase);
  
  // Calculate overall score
  const overallScore = calculateOverallScore(movieStats, celebrityStats);
  
  // Get top issues
  const topIssues = await getTopIssues(supabase);
  
  // Generate recommendations
  const recommendations = generateRecommendations(movieStats, celebrityStats, topIssues);

  return {
    generated_at: new Date().toISOString(),
    overall_score: overallScore,
    movies: movieStats,
    celebrities: celebrityStats,
    top_issues: topIssues,
    recommendations,
  };
}

async function getMovieStatistics(supabase: any) {
  // Get total count
  const { count: total } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });

  // Get confidence tier counts
  const { data: confidenceCounts } = await supabase
    .from('movies')
    .select('confidence_tier')
    .not('confidence_tier', 'is', null);

  const highConfidence = confidenceCounts?.filter((m: any) => m.confidence_tier === 'high').length || 0;
  const mediumConfidence = confidenceCounts?.filter((m: any) => m.confidence_tier === 'medium').length || 0;
  const lowConfidence = confidenceCounts?.filter((m: any) => m.confidence_tier === 'low').length || 0;

  // Get stale count
  const { count: stale } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .lt('freshness_score', 50);

  // Get disputed count (movies with conflicting data)
  const { data: disputedMovies } = await supabase
    .from('movies')
    .select('id, trust_explanation')
    .not('trust_explanation', 'is', null);

  const disputed = disputedMovies?.filter((m: any) => {
    const explanation = m.trust_explanation as Record<string, unknown> | null;
    return explanation?.reason?.toString().includes('conflict');
  }).length || 0;

  // Get movies missing critical fields
  const { data: moviesWithMissing } = await supabase
    .from('movies')
    .select('id, title, release_date, hero, director, primary_genre');

  const missingCritical = moviesWithMissing?.filter((m: any) => {
    return CRITICAL_MOVIE_FIELDS.some(field => !m[field as keyof typeof m]);
  }).length || 0;

  return {
    total: total || 0,
    high_confidence: highConfidence,
    medium_confidence: mediumConfidence,
    low_confidence: lowConfidence,
    stale: stale || 0,
    disputed,
    missing_critical_fields: missingCritical,
  };
}

async function getCelebrityStatistics(supabase: any) {
  // Get total count
  const { count: total } = await supabase
    .from('celebrities')
    .select('*', { count: 'exact', head: true });

  // Get confidence tier counts
  const { data: confidenceCounts } = await supabase
    .from('celebrities')
    .select('entity_confidence_score');

  const highConfidence = confidenceCounts?.filter((c: any) => 
    c.entity_confidence_score !== null && c.entity_confidence_score >= 80
  ).length || 0;
  const mediumConfidence = confidenceCounts?.filter((c: any) => 
    c.entity_confidence_score !== null && c.entity_confidence_score >= 50 && c.entity_confidence_score < 80
  ).length || 0;
  const lowConfidence = confidenceCounts?.filter((c: any) => 
    c.entity_confidence_score !== null && c.entity_confidence_score < 50
  ).length || 0;

  // Get stale count (not updated in 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const { count: stale } = await supabase
    .from('celebrities')
    .select('*', { count: 'exact', head: true })
    .lt('updated_at', sixMonthsAgo.toISOString());

  // Get incomplete profiles
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name, slug, bio, industry_title, usp');

  const incomplete = celebrities?.filter((c: any) => {
    // Missing critical fields or lacking enriched data
    const hasCritical = CRITICAL_CELEBRITY_FIELDS.every(field => c[field as keyof typeof c]);
    const hasEnriched = c.bio || c.industry_title || c.usp;
    return !hasCritical || !hasEnriched;
  }).length || 0;

  return {
    total: total || 0,
    high_confidence: highConfidence,
    medium_confidence: mediumConfidence,
    low_confidence: lowConfidence,
    stale: stale || 0,
    incomplete_profiles: incomplete,
  };
}

function calculateOverallScore(
  movieStats: DataQualityReport['movies'],
  celebrityStats: DataQualityReport['celebrities']
): number {
  // Weight factors
  const weights = {
    movieConfidence: 0.3,
    celebrityConfidence: 0.2,
    staleness: 0.2,
    completeness: 0.2,
    disputes: 0.1,
  };

  // Calculate movie confidence score (0-100)
  const movieConfidenceScore = movieStats.total > 0
    ? ((movieStats.high_confidence * 100 + movieStats.medium_confidence * 60 + movieStats.low_confidence * 20) / movieStats.total)
    : 0;

  // Calculate celebrity confidence score (0-100)
  const celebrityConfidenceScore = celebrityStats.total > 0
    ? ((celebrityStats.high_confidence * 100 + celebrityStats.medium_confidence * 60 + celebrityStats.low_confidence * 20) / celebrityStats.total)
    : 0;

  // Calculate staleness score (0-100, higher is better)
  const totalEntities = movieStats.total + celebrityStats.total;
  const totalStale = movieStats.stale + celebrityStats.stale;
  const stalenessScore = totalEntities > 0 ? ((totalEntities - totalStale) / totalEntities) * 100 : 0;

  // Calculate completeness score (0-100)
  const missingTotal = movieStats.missing_critical_fields + celebrityStats.incomplete_profiles;
  const completenessScore = totalEntities > 0 ? ((totalEntities - missingTotal) / totalEntities) * 100 : 0;

  // Calculate dispute score (0-100, higher is better)
  const disputeScore = movieStats.total > 0 ? ((movieStats.total - movieStats.disputed) / movieStats.total) * 100 : 0;

  // Calculate weighted average
  const overallScore =
    movieConfidenceScore * weights.movieConfidence +
    celebrityConfidenceScore * weights.celebrityConfidence +
    stalenessScore * weights.staleness +
    completenessScore * weights.completeness +
    disputeScore * weights.disputes;

  return Math.round(overallScore);
}

async function getTopIssues(supabase: any): Promise<DataQualityReport['top_issues']> {
  const issues: DataQualityReport['top_issues'] = [];

  // Check for movies missing primary genre
  const { data: missingGenre } = await supabase
    .from('movies')
    .select('title')
    .is('primary_genre', null)
    .limit(5);

  if (missingGenre && missingGenre.length > 0) {
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .is('primary_genre', null);

    issues.push({
      issue_type: 'Missing Primary Genre',
      count: count || 0,
      severity: 'warning' as AuditSeverity,
      examples: missingGenre.map((m: any) => m.title),
    });
  }

  // Check for movies missing poster
  const { data: missingPoster } = await supabase
    .from('movies')
    .select('title')
    .is('poster_url', null)
    .limit(5);

  if (missingPoster && missingPoster.length > 0) {
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .is('poster_url', null);

    issues.push({
      issue_type: 'Missing Poster',
      count: count || 0,
      severity: 'info' as AuditSeverity,
      examples: missingPoster.map((m: any) => m.title),
    });
  }

  // Check for movies with low trust score
  const { data: lowTrust } = await supabase
    .from('movies')
    .select('title')
    .lt('trust_score', 30)
    .limit(5);

  if (lowTrust && lowTrust.length > 0) {
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .lt('trust_score', 30);

    issues.push({
      issue_type: 'Low Trust Score',
      count: count || 0,
      severity: 'error' as AuditSeverity,
      examples: lowTrust.map((m: any) => m.title),
    });
  }

  // Check for celebrities without bio
  const { data: missingBio } = await supabase
    .from('celebrities')
    .select('name')
    .is('bio', null)
    .limit(5);

  if (missingBio && missingBio.length > 0) {
    const { count } = await supabase
      .from('celebrities')
      .select('*', { count: 'exact', head: true })
      .is('bio', null);

    issues.push({
      issue_type: 'Celebrity Missing Bio',
      count: count || 0,
      severity: 'info' as AuditSeverity,
      examples: missingBio.map((c: any) => c.name),
    });
  }

  // Sort by severity
  const severityOrder: Record<AuditSeverity, number> = {
    critical: 0,
    error: 1,
    warning: 2,
    info: 3,
  };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return issues;
}

function generateRecommendations(
  movieStats: DataQualityReport['movies'],
  celebrityStats: DataQualityReport['celebrities'],
  topIssues: DataQualityReport['top_issues']
): string[] {
  const recommendations: string[] = [];

  // High priority recommendations
  if (movieStats.low_confidence > movieStats.total * 0.1) {
    recommendations.push(
      `🔴 ${movieStats.low_confidence} movies (${Math.round(movieStats.low_confidence / movieStats.total * 100)}%) have low confidence. Run cross-verification to improve data quality.`
    );
  }

  if (movieStats.stale > movieStats.total * 0.2) {
    recommendations.push(
      `🟡 ${movieStats.stale} movies have stale data. Schedule revalidation for movies not updated in 6+ months.`
    );
  }

  if (movieStats.missing_critical_fields > 0) {
    recommendations.push(
      `🔴 ${movieStats.missing_critical_fields} movies are missing critical fields (title, release_date, hero, director, genre). Prioritize enrichment for these.`
    );
  }

  if (celebrityStats.incomplete_profiles > celebrityStats.total * 0.3) {
    recommendations.push(
      `🟡 ${celebrityStats.incomplete_profiles} celebrity profiles are incomplete. Enrich with bio, industry_title, and USP data.`
    );
  }

  // Issue-specific recommendations
  for (const issue of topIssues) {
    if (issue.severity === 'error' || issue.severity === 'critical') {
      recommendations.push(
        `🔴 Address "${issue.issue_type}" affecting ${issue.count} entities.`
      );
    }
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      '✅ Data quality is good! Continue regular maintenance and monitoring.'
    );
  }

  recommendations.push(
    '📊 Run governance enrichment weekly to maintain trust scores.',
    '🔄 Schedule automated freshness checks monthly.',
    '📝 Review audit logs for validation failures and source conflicts.'
  );

  return recommendations;
}

/**
 * Generate a summary report (lighter weight)
 */
export async function generateQuickReport(): Promise<{
  overall_score: number;
  movies_total: number;
  movies_high_confidence_pct: number;
  celebrities_total: number;
  top_issue: string | null;
}> {
  const report = await generateDataQualityReport();
  
  return {
    overall_score: report.overall_score,
    movies_total: report.movies.total,
    movies_high_confidence_pct: report.movies.total > 0
      ? Math.round((report.movies.high_confidence / report.movies.total) * 100)
      : 0,
    celebrities_total: report.celebrities.total,
    top_issue: report.top_issues[0]?.issue_type || null,
  };
}

export default {
  generateDataQualityReport,
  generateQuickReport,
};
