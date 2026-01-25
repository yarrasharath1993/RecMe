#!/usr/bin/env npx tsx
/**
 * GOVERNANCE ENRICHMENT SCRIPT
 * 
 * Applies governance validation and trust scoring to movies and celebrities.
 * This script is designed to be run as part of the enrichment pipeline.
 * 
 * Stages:
 * 1. governanceValidate() - Validate against governance rules
 * 2. trustScoreCompute() - Compute trust scores with breakdown
 * 3. freshnessDecayCheck() - Apply freshness decay
 * 4. confidenceExplain() - Generate explanations
 * 
 * Usage:
 *   npx tsx scripts/enrich-governance.ts --entity=movies --execute
 *   npx tsx scripts/enrich-governance.ts --entity=celebrities --dry
 *   npx tsx scripts/enrich-governance.ts --entity=movies --execute --limit=100
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

// Import governance module
import {
  validateEntity,
  computeTrustScoreBreakdown,
  computeFreshnessStatus,
  explainTrustScore,
  explainValidationResult,
  GOVERNANCE_RULES,
  getEnabledRules,
  type GovernanceValidationResult,
  type TrustScoreBreakdown,
  type FreshnessStatus,
  type GovernanceContentType,
  type ConfidenceTier,
} from '../lib/governance';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const ENTITY = getArg('entity', 'movies') as 'movies' | 'celebrities';
const EXECUTE = hasFlag('execute');
const DRY = hasFlag('dry') || !EXECUTE;
const LIMIT = parseInt(getArg('limit', '100'));
const CONCURRENCY = parseInt(getArg('concurrency', '20'));
const SKIP_VALIDATED = hasFlag('skip-validated');
const VERBOSE = hasFlag('verbose');

// ============================================================
// TYPES
// ============================================================

interface MovieRow {
  id: string;
  title_en: string;
  slug?: string;
  trust_badge?: string;
  data_confidence?: number;
  trust_score?: number;
  content_type?: string;
  confidence_tier?: string;
  freshness_score?: number;
  last_verified_at?: string;
  is_disputed?: boolean;
  governance_flags?: string[];
  source_tier?: number;
  has_tier1_source?: boolean;
  sources_disagree?: boolean;
  box_office_sources?: number;
  age_rating?: string;
  has_violence?: boolean;
  trigger_warnings?: string[];
  cross_verified?: boolean;
  source_languages?: number;
  updated_at?: string;
  created_at?: string;
  // Fields for completeness check
  poster_url?: string;
  hero?: string;
  heroine?: string;
  director?: string;
  music_director?: string;
  primary_genre?: string;
  overview?: string;
  synopsis?: string;
  synopsis_te?: string;
  tagline?: string;
  release_date?: string;
  runtime?: number;
  genres?: string[];
  mood_tags?: string[];
  audience_fit?: Record<string, boolean>;
  box_office?: Record<string, unknown>;
}

interface CelebrityRow {
  id: string;
  name: string;
  slug?: string;
  trust_score?: number;
  entity_confidence_score?: number;
  content_type?: string;
  confidence_tier?: string;
  freshness_score?: number;
  last_verified_at?: string;
  is_disputed?: boolean;
  governance_flags?: string[];
  integrity_rules?: Record<string, unknown>;
  family_relationships?: Record<string, unknown>;
  family_verified?: boolean;
  updated_at?: string;
}

interface GovernanceResult {
  id: string;
  title: string;
  validation: GovernanceValidationResult;
  trustBreakdown: TrustScoreBreakdown | null;
  freshness: FreshnessStatus;
  updates: Record<string, unknown>;
}

// ============================================================
// FIELD COMPLETENESS DEFINITIONS
// ============================================================

const MOVIE_CRITICAL_FIELDS = [
  'title_en',
  'poster_url',
  'hero',
  'director',
  'primary_genre',
  'release_date',
];

const MOVIE_ALL_FIELDS = [
  'title_en',
  'poster_url',
  'hero',
  'heroine',
  'director',
  'music_director',
  'primary_genre',
  'overview',
  'synopsis',
  'synopsis_te',
  'tagline',
  'release_date',
  'runtime',
  'genres',
  'mood_tags',
  'audience_fit',
  'age_rating',
  'box_office',
];

const CELEBRITY_CRITICAL_FIELDS = [
  'name',
  'slug',
  'profession',
];

const CELEBRITY_ALL_FIELDS = [
  'name',
  'slug',
  'profession',
  'image_url',
  'biography',
  'birth_date',
  'birth_place',
];

// ============================================================
// MAIN PROCESSING FUNCTIONS
// ============================================================

/**
 * Process movies for governance
 */
async function processMovies(): Promise<void> {
  console.log(chalk.cyan('\n📋 Fetching movies for governance processing...'));
  
  let query = supabase
    .from('movies')
    .select('*')
    .eq('language', 'Telugu')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(LIMIT);
  
  // Skip already validated if flag is set
  if (SKIP_VALIDATED) {
    query = query.or('last_verified_at.is.null,last_verified_at.lt.now()-180d');
  }
  
  const { data: movies, error } = await query;
  
  if (error) {
    console.error(chalk.red('Error fetching movies:'), error);
    return;
  }
  
  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('No movies to process.'));
    return;
  }
  
  console.log(chalk.cyan(`📊 Processing ${movies.length} movies...\n`));
  
  const results: GovernanceResult[] = [];
  let processed = 0;
  let updated = 0;
  let flagged = 0;
  
  // Process in batches
  const batchSize = CONCURRENCY;
  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map((movie) => processMovieGovernance(movie as MovieRow))
    );
    
    results.push(...batchResults);
    
    for (const result of batchResults) {
      processed++;
      
      if (Object.keys(result.updates).length > 0) {
        updated++;
      }
      
      if (result.validation.review_flags.length > 0) {
        flagged++;
      }
      
      // Log progress
      if (VERBOSE || processed % 10 === 0) {
        const progress = Math.round((processed / movies.length) * 100);
        console.log(
          chalk.gray(`  [${progress}%] `) +
          (result.validation.is_valid ? chalk.green('✓') : chalk.red('✗')) +
          ` ${result.title.substring(0, 40).padEnd(40)} ` +
          chalk.cyan(`Trust: ${Math.round(result.trustBreakdown?.final_score || 0)}%`) +
          (result.validation.review_flags.length > 0 
            ? chalk.yellow(` 🚩${result.validation.review_flags.length}`) 
            : '')
        );
      }
    }
    
    // Execute updates if not dry run
    if (EXECUTE && !DRY) {
      await executeBatchUpdates(batch.map((m) => m.id), batchResults);
    }
  }
  
  // Print summary
  printSummary(results, processed, updated, flagged);
}

/**
 * Process a single movie for governance
 */
async function processMovieGovernance(movie: MovieRow): Promise<GovernanceResult> {
  // Calculate field completeness
  const filledFields = MOVIE_ALL_FIELDS.filter((field) => {
    const value = movie[field as keyof MovieRow];
    return value !== null && value !== undefined && value !== '' && value !== 'Unknown';
  });
  
  const criticalMissing = MOVIE_CRITICAL_FIELDS.filter((field) => {
    const value = movie[field as keyof MovieRow];
    return value === null || value === undefined || value === '' || value === 'Unknown';
  });
  
  const fieldCompleteness = {
    filled: filledFields.length,
    total: MOVIE_ALL_FIELDS.length,
    critical_missing: criticalMissing,
  };
  
  // Determine source data
  const sourceData = {
    tier1_count: movie.has_tier1_source ? 1 : 0,
    tier2_count: movie.source_tier === 2 ? 1 : 0,
    tier3_count: movie.source_tier === 3 ? 1 : 0,
  };
  
  // Run governance validation
  const validation = validateEntity('movie', {
    id: movie.id,
    title_en: movie.title_en,
    content_type: movie.content_type,
    trust_score: movie.trust_score || movie.data_confidence,
    data_confidence: movie.data_confidence,
    source_tier: movie.source_tier,
    has_tier1_source: movie.has_tier1_source,
    sources_disagree: movie.sources_disagree,
    days_since_verification: movie.last_verified_at
      ? Math.floor((Date.now() - new Date(movie.last_verified_at).getTime()) / (1000 * 60 * 60 * 24))
      : 365,
    box_office_sources: movie.box_office_sources || 0,
    age_rating: movie.age_rating,
    has_violence: movie.trigger_warnings?.includes('violence'),
    trigger_warnings: movie.trigger_warnings,
    is_disputed: movie.is_disputed,
    cross_verified: movie.cross_verified,
    source_languages: movie.source_languages || 1,
  });
  
  // Compute trust score breakdown
  const trustBreakdown = computeTrustScoreBreakdown(
    {
      id: movie.id,
      data_confidence: movie.data_confidence,
      trust_score: movie.trust_score,
      has_tier1_source: movie.has_tier1_source,
      sources_disagree: movie.sources_disagree,
      days_since_verification: movie.last_verified_at
        ? Math.floor((Date.now() - new Date(movie.last_verified_at).getTime()) / (1000 * 60 * 60 * 24))
        : 365,
    },
    sourceData,
    fieldCompleteness
  );
  
  // Compute freshness
  const freshness = computeFreshnessStatus(
    movie.updated_at,
    movie.last_verified_at
  );
  
  // Determine content type
  let contentType: GovernanceContentType = 'editorial';
  if (trustBreakdown.trust_level === 'verified') {
    contentType = 'verified_fact';
  } else if (freshness.status === 'expired') {
    contentType = 'archive';
  } else if (validation.recommended_content_type) {
    contentType = validation.recommended_content_type;
  }
  
  // Build updates
  const updates: Record<string, unknown> = {
    trust_score: Math.round(trustBreakdown.final_score),
    content_type: contentType,
    confidence_tier: trustBreakdown.confidence_tier,
    freshness_score: freshness.score,
    is_disputed: validation.review_flags.includes('source_conflict') || 
                 validation.review_flags.includes('disputed_data'),
    governance_flags: validation.review_flags,
    trust_explanation: explainTrustScore(trustBreakdown),
  };
  
  // Only update last_verified_at if we're actually validating
  if (!DRY) {
    updates.last_verified_at = new Date().toISOString();
  }
  
  return {
    id: movie.id,
    title: movie.title_en,
    validation,
    trustBreakdown,
    freshness,
    updates,
  };
}

/**
 * Process celebrities for governance
 */
async function processCelebrities(): Promise<void> {
  console.log(chalk.cyan('\n📋 Fetching celebrities for governance processing...'));
  
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('*')
    .limit(LIMIT);
  
  if (error) {
    console.error(chalk.red('Error fetching celebrities:'), error);
    return;
  }
  
  if (!celebrities || celebrities.length === 0) {
    console.log(chalk.yellow('No celebrities to process.'));
    return;
  }
  
  console.log(chalk.cyan(`📊 Processing ${celebrities.length} celebrities...\n`));
  
  let processed = 0;
  let updated = 0;
  let flagged = 0;
  
  for (const celeb of celebrities) {
    const result = await processCelebrityGovernance(celeb as CelebrityRow);
    processed++;
    
    if (Object.keys(result.updates).length > 0) {
      updated++;
    }
    
    if (result.validation.review_flags.length > 0) {
      flagged++;
    }
    
    if (VERBOSE) {
      console.log(
        (result.validation.is_valid ? chalk.green('✓') : chalk.red('✗')) +
        ` ${result.title.substring(0, 30).padEnd(30)} ` +
        chalk.cyan(`Trust: ${Math.round(result.trustBreakdown?.final_score || 0)}%`)
      );
    }
    
    // Execute update
    if (EXECUTE && !DRY) {
      await supabase
        .from('celebrities')
        .update(result.updates)
        .eq('id', celeb.id);
    }
  }
  
  console.log(chalk.cyan(`\n📊 Celebrity Governance Summary:`));
  console.log(`  Processed: ${processed}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Flagged: ${flagged}`);
}

/**
 * Process a single celebrity for governance
 */
async function processCelebrityGovernance(celeb: CelebrityRow): Promise<GovernanceResult> {
  // Calculate field completeness
  const filledFields = CELEBRITY_ALL_FIELDS.filter((field) => {
    const value = celeb[field as keyof CelebrityRow];
    return value !== null && value !== undefined && value !== '';
  });
  
  const fieldCompleteness = {
    filled: filledFields.length,
    total: CELEBRITY_ALL_FIELDS.length,
  };
  
  // Run governance validation
  const validation = validateEntity('celebrity', {
    id: celeb.id,
    name: celeb.name,
    content_type: celeb.content_type,
    trust_score: celeb.trust_score || celeb.entity_confidence_score,
    days_since_verification: celeb.last_verified_at
      ? Math.floor((Date.now() - new Date(celeb.last_verified_at).getTime()) / (1000 * 60 * 60 * 24))
      : 365,
    family_relationships: celeb.family_relationships,
    family_verified: celeb.family_verified,
    integrity_rules: celeb.integrity_rules,
    is_disputed: celeb.is_disputed,
  });
  
  // Compute trust breakdown (simplified for celebrities)
  const trustBreakdown = computeTrustScoreBreakdown(
    {
      id: celeb.id,
      trust_score: celeb.trust_score,
      data_confidence: celeb.entity_confidence_score,
      days_since_verification: celeb.last_verified_at
        ? Math.floor((Date.now() - new Date(celeb.last_verified_at).getTime()) / (1000 * 60 * 60 * 24))
        : 365,
    },
    { tier1_count: 1, tier2_count: 0, tier3_count: 0 },
    fieldCompleteness
  );
  
  // Compute freshness
  const freshness = computeFreshnessStatus(
    celeb.updated_at,
    celeb.last_verified_at
  );
  
  // Build updates
  const updates: Record<string, unknown> = {
    trust_score: Math.round(trustBreakdown.final_score),
    entity_confidence_score: trustBreakdown.final_score / 100,
    confidence_tier: trustBreakdown.confidence_tier,
    freshness_score: freshness.score,
    is_disputed: validation.review_flags.includes('disputed_data'),
    governance_flags: validation.review_flags,
    entity_trust_explanation: explainTrustScore(trustBreakdown),
  };
  
  return {
    id: celeb.id,
    title: celeb.name,
    validation,
    trustBreakdown,
    freshness,
    updates,
  };
}

/**
 * Execute batch updates to database
 */
async function executeBatchUpdates(
  ids: string[],
  results: GovernanceResult[]
): Promise<void> {
  for (let i = 0; i < ids.length; i++) {
    const result = results[i];
    if (!result) continue;
    
    const { error } = await supabase
      .from(ENTITY)
      .update(result.updates)
      .eq('id', result.id);
    
    if (error) {
      console.error(chalk.red(`Error updating ${result.title}:`), error.message);
    }
  }
}

/**
 * Print summary of governance processing
 */
function printSummary(
  results: GovernanceResult[],
  processed: number,
  updated: number,
  flagged: number
): void {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║                    GOVERNANCE PROCESSING SUMMARY                      ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  📊 Total Processed: ${processed}`);
  console.log(`  ✅ Valid: ${results.filter(r => r.validation.is_valid).length}`);
  console.log(`  ❌ Invalid: ${results.filter(r => !r.validation.is_valid).length}`);
  console.log(`  🚩 Flagged for Review: ${flagged}`);
  console.log(`  📝 Updates Applied: ${DRY ? 0 : updated}`);
  
  // Trust score distribution
  const trustDistribution = {
    verified: 0,
    high: 0,
    medium: 0,
    low: 0,
    unverified: 0,
  };
  
  for (const result of results) {
    const level = result.trustBreakdown?.trust_level || 'unverified';
    trustDistribution[level]++;
  }
  
  console.log(chalk.cyan('\n  Trust Score Distribution:'));
  for (const [level, count] of Object.entries(trustDistribution)) {
    const pct = Math.round((count / results.length) * 100);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    const colorFn = level === 'verified' ? chalk.green : 
                    level === 'high' ? chalk.blue :
                    level === 'medium' ? chalk.yellow :
                    level === 'low' ? chalk.red : chalk.gray;
    console.log(`    ${level.padEnd(12)} [${bar}] ${colorFn(`${pct}%`)} (${count})`);
  }
  
  // Top flags
  const flagCounts: Record<string, number> = {};
  for (const result of results) {
    for (const flag of result.validation.review_flags) {
      flagCounts[flag] = (flagCounts[flag] || 0) + 1;
    }
  }
  
  if (Object.keys(flagCounts).length > 0) {
    console.log(chalk.cyan('\n  Top Governance Flags:'));
    const sortedFlags = Object.entries(flagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [flag, count] of sortedFlags) {
      console.log(`    🚩 ${flag}: ${count}`);
    }
  }
  
  // Average trust score
  const avgTrust = results.reduce((sum, r) => sum + (r.trustBreakdown?.final_score || 0), 0) / results.length;
  console.log(chalk.cyan(`\n  Average Trust Score: ${Math.round(avgTrust)}%`));
  
  if (DRY) {
    console.log(chalk.yellow('\n  ⚠️ DRY RUN - No changes were made. Use --execute to apply updates.'));
  }
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║                    GOVERNANCE ENRICHMENT v1.0                         ║
╠══════════════════════════════════════════════════════════════════════╣
║   Stages:                                                            ║
║   1. governanceValidate() - Validate against rules                   ║
║   2. trustScoreCompute()  - Compute trust with breakdown             ║
║   3. freshnessDecayCheck() - Apply freshness decay                   ║
║   4. confidenceExplain() - Generate explanations                     ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Entity: ${ENTITY}`);
  console.log(`  Mode: ${DRY ? chalk.yellow('DRY RUN') : chalk.green('EXECUTE')}`);
  console.log(`  Limit: ${LIMIT}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Active Rules: ${getEnabledRules().length}/${Object.keys(GOVERNANCE_RULES).length}`);
  
  if (ENTITY === 'movies') {
    await processMovies();
  } else if (ENTITY === 'celebrities') {
    await processCelebrities();
  } else {
    console.error(chalk.red(`Unknown entity type: ${ENTITY}`));
  }
}

main().catch(console.error);
