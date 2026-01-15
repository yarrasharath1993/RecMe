/**
 * AUTO-FIX ENGINE (v3.0 - Enhanced with Multi-Source Validation)
 * 
 * Confidence scoring and auto-fix rules for actor filmography validation.
 * Based on Venkatesh (76 films) and Nani (31 films) validation sessions.
 * 
 * NEW in v3.0:
 *   - Multi-source orchestration (TMDB, IMDb, Wikipedia, Wikidata)
 *   - Enhanced ghost entry detection and re-attribution
 *   - TMDB ID validation with multi-source search
 *   - Missing film detection with role classification
 *   - Confidence-based auto-fix with configurable thresholds
 * 
 * Confidence Thresholds:
 *   >= 90%: Auto-apply fix
 *   70-89%: Apply + flag for review
 *   < 70%:  Report only, no auto-fix
 * 
 * Features:
 *   - Multi-source validation (TMDB, IMDb, Wikipedia, Wikidata, OMDB)
 *   - TMDB ID validation (checks for wrong language versions)
 *   - Multi-hero support (hero2, supporting_cast with type=hero2)
 *   - Ghost entry re-attribution (don't delete, re-attribute to correct actor)
 *   - Missing film detection with confidence-based auto-add
 *   - Technical credits enrichment (cinematographer, editor, writer)
 * 
 * Usage:
 *   import { calculateFieldConfidence, applyAutoFixes, generateAnomalyReport } from './lib/autofix-engine';
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import chalk from 'chalk';

// Import new multi-source modules
import { fetchFromAllSources, type MultiSourceResult } from './multi-source-orchestrator';
import { analyzeGhostEntry, type GhostEntryAnalysis } from './ghost-reattribution-engine';
import { validateTMDBId as validateTMDBIdNew, type TMDBValidationResult } from './tmdb-id-validator';
import { detectMissingFilms, type MissingFilmDetectionResult } from './missing-film-detector';
import { CONFIDENCE_THRESHOLDS } from './confidence-config';

// ============================================================
// TYPES
// ============================================================

export type IssueType = 
  | 'duplicate'
  | 'spelling_duplicate'  // Telugu transliteration variations (e.g., "Abbai" vs "Abbayi")
  | 'name_variation'      // Hero name spelling variations (e.g., "Chiru" → "Chiranjeevi")
  | 'wrong_attribution'
  | 'no_verification'
  | 'missing_field'
  | 'missing_film'        // Film in TMDB but not in DB
  | 'conflicting_data'
  | 'ghost_entry'
  | 'pre_debut'
  | 'tmdb_wrong_language'
  | 'tmdb_not_found'
  | 'hindi_dub'           // Hindi dubbed version (should be removed)
  | 'placeholder'         // Placeholder/announced film (e.g., "Mega 159")
  | 'wrong_actor_similar_name'  // Similar actor name confusion (e.g., Chiranjeevi vs Chiranjeevi Sarja)
  | 'multi_hero_update';  // Film needs multi-hero update

// Multi-hero support for identifying all lead actors
export interface MultiHeroConfig {
  heroFields: string[];  // ['hero', 'hero2']
  supportingCastTypes: string[];  // ['hero2', 'heroine2']
}

export const MULTI_HERO_CONFIG: MultiHeroConfig = {
  heroFields: ['hero', 'hero2'],
  supportingCastTypes: ['hero2', 'heroine2', 'hero3', 'heroine3'],
};

// TMDB validation rules
export const TMDB_VALIDATION_RULES = {
  validLanguages: ['te', 'ta', 'hi', 'kn', 'ml'], // Telugu + other Indian languages
  primaryLanguage: 'te',
  minTitleSimilarity: 0.7,
};

export interface FieldSources {
  tmdb?: string | null;
  wiki?: string | null;
  imdb?: string | null;
  db?: string | null;
  [key: string]: string | null | undefined;
}

export interface AutoFixIssue {
  id: string;
  type: IssueType;
  movieId: string;
  movieSlug: string;
  movieTitle: string;
  movieYear: number;
  field?: string;
  currentValue?: string | null;
  suggestedValue?: string | null;
  confidence: number;
  sources: FieldSources;
  details: string;
  action: 'auto_fix' | 'flag_review' | 'report_only';
  autoFixApplied?: boolean;
}

export interface AutoFixResult {
  actor: string;
  timestamp: string;
  totalIssues: number;
  autoFixed: number;
  flaggedForReview: number;
  reportOnly: number;
  issues: AutoFixIssue[];
  anomalyReport: AutoFixIssue[];
}

export interface AutoFixOptions {
  confidenceThreshold?: number; // Default: 0.70
  autoApplyThreshold?: number;  // Default: 0.90
  execute?: boolean;
  verbose?: boolean;
  supabase?: SupabaseClient;
}

// ============================================================
// CONFIDENCE SCORING
// ============================================================

/**
 * Normalize a string for comparison
 */
export function normalizeValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two values are effectively the same
 */
export function valuesMatch(v1: string | null | undefined, v2: string | null | undefined): boolean {
  const n1 = normalizeValue(v1);
  const n2 = normalizeValue(v2);
  if (n1 === n2) return true;
  
  // Check if one contains the other (for partial matches like "K. Raghavendra Rao" vs "Raghavendra Rao")
  if (n1.length > 3 && n2.length > 3) {
    if (n1.includes(n2) || n2.includes(n1)) return true;
  }
  
  return false;
}

/**
 * Calculate confidence for a field based on multiple sources
 * 
 * Confidence Rules:
 * - All sources agree: 0.95
 * - 2+ sources agree: 0.85
 * - Single reliable source: 0.75
 * - Single source, less reliable: 0.60
 * - Conflict between sources: 0.50
 * - No sources: 0.30
 */
export function calculateFieldConfidence(
  field: string,
  sources: FieldSources
): { confidence: number; bestValue: string | null; agreementCount: number } {
  const values = Object.entries(sources)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([source, value]) => ({ source, value: value as string }));

  if (values.length === 0) {
    return { confidence: 0.30, bestValue: null, agreementCount: 0 };
  }

  // Group by normalized value
  const groups = new Map<string, { sources: string[]; originalValue: string }>();
  for (const { source, value } of values) {
    const normalized = normalizeValue(value);
    if (!groups.has(normalized)) {
      groups.set(normalized, { sources: [], originalValue: value });
    }
    groups.get(normalized)!.sources.push(source);
  }

  // Find the most common value
  let bestGroup = { sources: [] as string[], originalValue: '' };
  for (const group of groups.values()) {
    if (group.sources.length > bestGroup.sources.length) {
      bestGroup = group;
    }
  }

  const agreementCount = bestGroup.sources.length;
  const totalSources = values.length;

  // Source priority (higher = more trusted)
  const sourcePriority: Record<string, number> = {
    tmdb: 0.95,
    wiki: 0.90,
    imdb: 0.85,
    db: 0.70,
  };

  let confidence: number;

  if (groups.size === 1 && agreementCount >= 2) {
    // All sources agree
    confidence = 0.95;
  } else if (agreementCount >= 2) {
    // Majority agree
    confidence = 0.85;
  } else if (agreementCount === 1 && totalSources === 1) {
    // Single source - use source priority
    const sourceKey = bestGroup.sources[0];
    confidence = sourcePriority[sourceKey] || 0.60;
  } else {
    // Conflict - sources disagree
    confidence = 0.50;
  }

  // Adjust for field type
  const fieldReliability: Record<string, number> = {
    director: 1.0,      // Directors are usually accurate
    hero: 0.95,         // Lead actors usually accurate
    heroine: 0.90,      // Heroines sometimes vary
    music_director: 0.85,
    producer: 0.80,
    cinematographer: 0.75,
    editor: 0.70,
    writer: 0.70,
  };

  confidence *= fieldReliability[field] || 0.75;

  return {
    confidence: Math.min(confidence, 1.0),
    bestValue: bestGroup.originalValue,
    agreementCount,
  };
}

// ============================================================
// TMDB ID VALIDATION
// ============================================================

/**
 * Validate a TMDB ID to check if it's the correct movie
 * Returns confidence and suggested action
 */
export function validateTmdbId(
  tmdbDetails: { original_language: string; title: string },
  expectedTitle: string,
  expectedLanguage: string = 'te'
): { isValid: boolean; confidence: number; issue?: string } {
  // Check language
  if (tmdbDetails.original_language !== expectedLanguage) {
    // Allow some Indian languages but flag non-Indian
    if (!TMDB_VALIDATION_RULES.validLanguages.includes(tmdbDetails.original_language)) {
      return {
        isValid: false,
        confidence: 0.95,
        issue: `TMDB movie is ${tmdbDetails.original_language}, expected ${expectedLanguage}`,
      };
    }
    // For other Indian languages, lower confidence
    return {
      isValid: false,
      confidence: 0.80,
      issue: `TMDB movie is ${tmdbDetails.original_language}, expected ${expectedLanguage}`,
    };
  }
  
  // Check title similarity
  const similarity = calculateTitleSimilarity(tmdbDetails.title, expectedTitle);
  if (similarity < TMDB_VALIDATION_RULES.minTitleSimilarity) {
    return {
      isValid: false,
      confidence: 0.70,
      issue: `Title mismatch: TMDB="${tmdbDetails.title}", Expected="${expectedTitle}"`,
    };
  }
  
  return { isValid: true, confidence: 0.95 };
}

/**
 * Calculate similarity between two titles
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeValue(title1);
  const norm2 = normalizeValue(title2);
  
  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;
  
  // Levenshtein distance
  const matrix: number[][] = [];
  const n = norm1.length;
  const m = norm2.length;

  if (n === 0) return m === 0 ? 1 : 0;
  if (m === 0) return 0;

  for (let i = 0; i <= n; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= m; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[n][m];
  const maxLen = Math.max(n, m);
  return 1 - distance / maxLen;
}

// ============================================================
// MULTI-HERO SUPPORT
// ============================================================

/**
 * Extract all heroes from a movie record (handles multi-starrers)
 */
export function extractAllHeroes(movie: {
  hero?: string | null;
  hero2?: string | null;
  supporting_cast?: Array<{ name: string; type?: string }>;
}): string[] {
  const heroes: string[] = [];
  
  // Primary hero(es) - may be comma-separated
  if (movie.hero) {
    heroes.push(...movie.hero.split(',').map(h => h.trim()).filter(Boolean));
  }
  
  // Secondary hero field
  if (movie.hero2) {
    heroes.push(...movie.hero2.split(',').map(h => h.trim()).filter(Boolean));
  }
  
  // Heroes in supporting_cast with type=hero2, hero3, etc.
  if (movie.supporting_cast) {
    for (const cast of movie.supporting_cast) {
      if (cast.type && MULTI_HERO_CONFIG.supportingCastTypes.some(t => cast.type?.toLowerCase().includes(t.toLowerCase().replace(/\d+/, '')))) {
        heroes.push(cast.name.trim());
      }
    }
  }
  
  // Deduplicate
  return [...new Set(heroes)];
}

/**
 * Check if an actor is a lead in the movie (hero or hero2)
 */
export function isActorLead(
  actorName: string,
  movie: {
    hero?: string | null;
    hero2?: string | null;
    supporting_cast?: Array<{ name: string; type?: string }>;
  }
): { isLead: boolean; role: string | null } {
  const actorParts = actorName.toLowerCase().split(' ');
  const lastName = actorParts[actorParts.length - 1];
  
  // Check primary hero
  if (movie.hero) {
    const heroNames = movie.hero.split(',').map(h => h.trim().toLowerCase());
    for (const heroName of heroNames) {
      if (actorParts.every(p => heroName.includes(p)) || heroName.includes(lastName)) {
        return { isLead: true, role: 'hero' };
      }
    }
  }
  
  // Check hero2
  if (movie.hero2) {
    const hero2Names = movie.hero2.split(',').map(h => h.trim().toLowerCase());
    for (const heroName of hero2Names) {
      if (actorParts.every(p => heroName.includes(p)) || heroName.includes(lastName)) {
        return { isLead: true, role: 'hero2' };
      }
    }
  }
  
  // Check supporting_cast for hero2/hero3 roles
  if (movie.supporting_cast) {
    for (const cast of movie.supporting_cast) {
      const castName = cast.name.toLowerCase();
      if (actorParts.every(p => castName.includes(p)) || castName.includes(lastName)) {
        if (cast.type && cast.type.toLowerCase().includes('hero')) {
          return { isLead: true, role: cast.type };
        }
      }
    }
  }
  
  return { isLead: false, role: null };
}

// ============================================================
// AUTO-FIX RULES
// ============================================================

/**
 * Determine the action based on confidence and issue type
 */
/**
 * Auto-fix rules based on Balakrishna filmography fix session learnings:
 * 
 * | Issue Type        | Confidence Threshold | Auto-Fix Action                    |
 * |-------------------|---------------------|-------------------------------------|
 * | spelling_duplicate| >= 95%              | Merge (delete newer)                |
 * | name_variation    | >= 90%              | Standardize name                    |
 * | ghost_entry       | >= 85%              | Reattribute to suggested hero       |
 * | missing_film      | >= 80%              | Add with is_published=false         |
 * | duplicate         | >= 95%              | Delete duplicate                    |
 */
export function determineAction(
  issueType: IssueType,
  confidence: number,
  options: AutoFixOptions = {}
): 'auto_fix' | 'flag_review' | 'report_only' {
  const { 
    confidenceThreshold = 0.70, 
    autoApplyThreshold = 0.90 
  } = options;

  // Special rules for certain issue types (based on Balakrishna session learnings)
  switch (issueType) {
    case 'spelling_duplicate':
      // NEW: Telugu transliteration duplicates (e.g., "Abbai" vs "Abbayi")
      // High confidence - auto-fix by merging/deleting the duplicate
      return confidence >= 0.95 ? 'auto_fix' : confidence >= 0.85 ? 'flag_review' : 'report_only';
    
    case 'name_variation':
      // NEW: Hero name spelling variations (e.g., "N. Balakrishna" → "Nandamuri Balakrishna")
      // High confidence - auto-fix by standardizing
      return confidence >= 0.90 ? 'auto_fix' : confidence >= 0.80 ? 'flag_review' : 'report_only';
    
    case 'duplicate':
      // Duplicates with same TMDB ID are always auto-fixable
      return confidence >= 0.95 ? 'auto_fix' : confidence >= 0.80 ? 'flag_review' : 'report_only';
    
    case 'ghost_entry':
      // Ghost entries (wrong actor) need re-attribution, not deletion
      // Based on Venkatesh + Balakrishna sessions: re-attribute to correct actor
      // Lower threshold (85%) since we check ALL TMDB Person IDs now
      return confidence >= 0.85 ? 'auto_fix' : confidence >= confidenceThreshold ? 'flag_review' : 'report_only';
    
    case 'wrong_attribution':
      // Be more conservative with wrong attributions
      return confidence >= 0.95 ? 'auto_fix' : confidence >= 0.85 ? 'flag_review' : 'report_only';
    
    case 'missing_film':
      // NEW: Film in TMDB but not in DB
      // Add with is_published=false for review
      return confidence >= 0.80 ? 'auto_fix' : confidence >= 0.60 ? 'flag_review' : 'report_only';
    
    case 'missing_field':
      // Missing fields are easier to fill
      return confidence >= 0.80 ? 'auto_fix' : confidence >= 0.60 ? 'flag_review' : 'report_only';
    
    case 'conflicting_data':
      // Conflicts always need review
      return confidence >= 0.95 ? 'flag_review' : 'report_only';
    
    case 'pre_debut':
      // Pre-debut films likely misattributed
      return confidence >= autoApplyThreshold ? 'auto_fix' : 'flag_review';
    
    case 'tmdb_wrong_language':
      // TMDB ID pointing to wrong language version
      // High confidence issue - flag for manual fix
      return confidence >= 0.90 ? 'flag_review' : 'report_only';
    
    case 'tmdb_not_found':
      // TMDB ID doesn't exist - needs manual lookup
      return 'report_only';
    
    case 'hindi_dub':
      // Hindi dubbed versions should always be removed
      // High confidence - auto-fix
      return confidence >= 0.90 ? 'auto_fix' : confidence >= 0.80 ? 'flag_review' : 'report_only';
    
    case 'placeholder':
      // Placeholder/announced films should be removed
      return confidence >= 0.90 ? 'auto_fix' : 'flag_review';
    
    case 'wrong_actor_similar_name':
      // Similar actor name confusion (e.g., Chiranjeevi vs Chiranjeevi Sarja)
      // Based on Chiranjeevi session: Kannada films attributed to Telugu Chiranjeevi
      // Need language check for confidence
      return confidence >= 0.95 ? 'auto_fix' : confidence >= 0.80 ? 'flag_review' : 'report_only';
    
    case 'multi_hero_update':
      // Multi-hero films need update but are lower priority
      return confidence >= 0.85 ? 'flag_review' : 'report_only';
    
    default:
      return confidence >= autoApplyThreshold ? 'auto_fix' : confidence >= confidenceThreshold ? 'flag_review' : 'report_only';
  }
}

// ============================================================
// APPLY AUTO-FIXES
// ============================================================

/**
 * Apply auto-fixes to the database
 */
export async function applyAutoFixes(
  issues: AutoFixIssue[],
  options: AutoFixOptions = {}
): Promise<{ applied: number; failed: number; errors: string[] }> {
  const { execute = false, verbose = false } = options;
  
  const supabase = options.supabase || createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = { applied: 0, failed: 0, errors: [] as string[] };

  const autoFixable = issues.filter(i => i.action === 'auto_fix');

  if (verbose) {
    console.log(chalk.cyan(`\n  Applying ${autoFixable.length} auto-fixes...`));
  }

  for (const issue of autoFixable) {
    if (!execute) {
      if (verbose) {
        console.log(chalk.gray(`  [DRY RUN] Would fix: ${issue.movieTitle} - ${issue.type}`));
      }
      results.applied++;
      continue;
    }

    try {
      switch (issue.type) {
        case 'duplicate':
          // Delete the duplicate
          const { error: delError } = await supabase
            .from('movies')
            .delete()
            .eq('id', issue.movieId);
          
          if (delError) throw delError;
          break;

        case 'missing_field':
          // Update the missing field
          if (issue.field && issue.suggestedValue) {
            const updateData: Record<string, string> = {};
            
            // Handle nested crew fields
            if (['editor', 'writer', 'cinematographer', 'choreographer', 'art_director', 'lyricist'].includes(issue.field)) {
              const { data: movie } = await supabase
                .from('movies')
                .select('crew')
                .eq('id', issue.movieId)
                .single();
              
              const crew = movie?.crew || {};
              crew[issue.field] = issue.suggestedValue;
              
              const { error: crewError } = await supabase
                .from('movies')
                .update({ crew })
                .eq('id', issue.movieId);
              
              if (crewError) throw crewError;
            } else {
              updateData[issue.field] = issue.suggestedValue;
              
              const { error: updateError } = await supabase
                .from('movies')
                .update(updateData)
                .eq('id', issue.movieId);
              
              if (updateError) throw updateError;
            }
          }
          break;

        case 'ghost_entry':
        case 'wrong_attribution':
          // Re-attribute to correct actor (don't delete)
          if (issue.suggestedValue) {
            const { error: reattributeError } = await supabase
              .from('movies')
              .update({ hero: issue.suggestedValue })
              .eq('id', issue.movieId);
            
            if (reattributeError) throw reattributeError;
          }
          break;
        
        case 'spelling_duplicate':
          // NEW: Delete the spelling duplicate (keep the one with better data)
          const { error: spellingDelError } = await supabase
            .from('movies')
            .delete()
            .eq('id', issue.movieId);
          
          if (spellingDelError) throw spellingDelError;
          break;
        
        case 'name_variation':
          // NEW: Standardize hero name spelling
          if (issue.suggestedValue) {
            const { error: nameError } = await supabase
              .from('movies')
              .update({ hero: issue.suggestedValue })
              .eq('id', issue.movieId);
            
            if (nameError) throw nameError;
          }
          break;
        
        case 'missing_film':
          // Add missing film with is_published=false
          // Note: This requires more data than just the issue - typically handled separately
          if (verbose) {
            console.log(chalk.yellow(`  Missing film addition requires separate handling: ${issue.movieTitle}`));
          }
          break;
        
        case 'hindi_dub':
        case 'placeholder':
          // Delete Hindi dubs and placeholders
          const { error: dubDelError } = await supabase
            .from('movies')
            .delete()
            .eq('id', issue.movieId);
          
          if (dubDelError) throw dubDelError;
          break;
        
        case 'wrong_actor_similar_name':
          // Reattribute to correct actor (similar name confusion)
          if (issue.suggestedValue) {
            const { error: similarNameError } = await supabase
              .from('movies')
              .update({ hero: issue.suggestedValue })
              .eq('id', issue.movieId);
            
            if (similarNameError) throw similarNameError;
          }
          break;

        default:
          if (verbose) {
            console.log(chalk.yellow(`  Skipping unsupported issue type: ${issue.type}`));
          }
      }

      issue.autoFixApplied = true;
      results.applied++;
      
      if (verbose) {
        console.log(chalk.green(`  ✓ Fixed: ${issue.movieTitle} - ${issue.type}`));
      }
    } catch (error) {
      results.failed++;
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`${issue.movieSlug}: ${errMsg}`);
      
      if (verbose) {
        console.log(chalk.red(`  ✗ Failed: ${issue.movieTitle} - ${errMsg}`));
      }
    }
  }

  return results;
}

// ============================================================
// REPORT GENERATION
// ============================================================

/**
 * Generate anomaly report (issues that need manual review)
 */
export function generateAnomalyReport(
  actor: string,
  issues: AutoFixIssue[],
  outputPath?: string
): { csv: string; json: object } {
  const anomalies = issues.filter(i => i.action === 'flag_review' || i.action === 'report_only');
  
  // Generate CSV
  const csvLines = [
    'Type,Movie,Year,Field,Current Value,Suggested Value,Confidence,Details,Action'
  ];
  
  for (const issue of anomalies) {
    const row = [
      issue.type,
      `"${issue.movieTitle}"`,
      issue.movieYear,
      issue.field || '-',
      `"${issue.currentValue || '-'}"`,
      `"${issue.suggestedValue || '-'}"`,
      `${(issue.confidence * 100).toFixed(0)}%`,
      `"${(issue.details || '').replace(/"/g, '""')}"`,
      issue.action,
    ];
    csvLines.push(row.join(','));
  }
  
  const csv = csvLines.join('\n');
  
  // Generate JSON
  const json = {
    actor,
    timestamp: new Date().toISOString(),
    totalAnomalies: anomalies.length,
    byType: {
      flagged: anomalies.filter(i => i.action === 'flag_review').length,
      reportOnly: anomalies.filter(i => i.action === 'report_only').length,
    },
    byCategory: {
      duplicates: anomalies.filter(i => i.type === 'duplicate').length,
      wrongAttribution: anomalies.filter(i => i.type === 'wrong_attribution').length,
      missingFields: anomalies.filter(i => i.type === 'missing_field').length,
      conflicts: anomalies.filter(i => i.type === 'conflicting_data').length,
    },
    anomalies: anomalies.map(i => ({
      type: i.type,
      movie: i.movieTitle,
      year: i.movieYear,
      slug: i.movieSlug,
      field: i.field,
      currentValue: i.currentValue,
      suggestedValue: i.suggestedValue,
      confidence: i.confidence,
      details: i.details,
      action: i.action,
    })),
  };
  
  // Save files if output path provided
  if (outputPath) {
    const csvPath = outputPath.endsWith('.csv') ? outputPath : `${outputPath}.csv`;
    const jsonPath = csvPath.replace('.csv', '.json');
    
    fs.writeFileSync(csvPath, csv);
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
  }
  
  return { csv, json };
}

/**
 * Print summary to console
 */
export function printAutoFixSummary(result: AutoFixResult): void {
  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════════
📊 AUTO-FIX SUMMARY: ${result.actor}
═══════════════════════════════════════════════════════════════════════
`));

  console.log(`  Total issues found: ${chalk.yellow(result.totalIssues)}`);
  console.log(`  Auto-fixed: ${chalk.green(result.autoFixed)}`);
  console.log(`  Flagged for review: ${chalk.yellow(result.flaggedForReview)}`);
  console.log(`  Report only: ${chalk.gray(result.reportOnly)}`);

  if (result.anomalyReport.length > 0) {
    console.log(chalk.yellow(`\n  ⚠️  ${result.anomalyReport.length} items need manual review`));
    console.log(chalk.gray(`     See anomaly report for details`));
  } else {
    console.log(chalk.green(`\n  ✓ All issues resolved automatically`));
  }
}

// ============================================================
// ENHANCED MULTI-SOURCE VALIDATION (v3.0)
// ============================================================

/**
 * Validate and enrich a field using multi-source orchestration
 * Uses the new multi-source-orchestrator to fetch from all sources in parallel
 * 
 * @param movie - The movie to validate/enrich
 * @param field - The field to validate (e.g., 'cinematographer', 'editor')
 * @returns Enhanced field sources with consensus and confidence
 */
export async function validateFieldMultiSource(
  movie: {
    title_en: string;
    release_year: number;
    tmdb_id?: number;
    imdb_id?: string;
  },
  field: string
): Promise<MultiSourceResult | null> {
  try {
    const results = await fetchFromAllSources(movie, [field]);
    return results.find(r => r.field === field) || null;
  } catch (error) {
    console.error(`Multi-source validation failed for ${field}:`, error);
    return null;
  }
}

/**
 * Validate a movie's ghost entry status using multi-source verification
 * Uses the new ghost-reattribution-engine
 * 
 * @param movie - The movie to check
 * @param actorName - The actor attributed to the movie
 * @returns Ghost entry analysis with re-attribution suggestions
 */
export async function validateGhostEntry(
  movie: {
    id: string;
    slug: string;
    title_en: string;
    release_year: number;
    tmdb_id?: number;
    imdb_id?: string;
  },
  actorName: string
): Promise<GhostEntryAnalysis> {
  return await analyzeGhostEntry({
    movieId: movie.id,
    title: movie.title_en,
    releaseYear: movie.release_year,
    currentActor: actorName,
    tmdbId: movie.tmdb_id,
    imdbId: movie.imdb_id,
  });
}

/**
 * Validate a TMDB ID using multi-source verification
 * Uses the new tmdb-id-validator
 * 
 * @param movie - The movie to validate
 * @param currentTmdbId - The TMDB ID to validate
 * @returns TMDB validation result with suggested corrections
 */
export async function validateTmdbIdEnhanced(
  movie: {
    title_en: string;
    release_year: number;
    hero: string;
  },
  currentTmdbId: number
): Promise<TMDBValidationResult> {
  return await validateTMDBIdNew(movie, currentTmdbId);
}

/**
 * Detect missing films for an actor using multi-source verification
 * Uses the new missing-film-detector
 * 
 * @param actorName - The actor to check
 * @param existingFilms - Films already in the database
 * @returns Analysis of missing films with auto-add candidates
 */
export async function detectMissingFilmsEnhanced(
  actorName: string,
  existingFilms: Array<{
    id?: string;
    tmdb_id?: number;
    title_en: string;
    release_year: number;
  }>
): Promise<MissingFilmDetectionResult | null> {
  return await detectMissingFilms(actorName, existingFilms);
}

/**
 * Generate enhanced auto-fix issues using multi-source validation
 * Integrates all new modules for comprehensive validation
 * 
 * @param actor - The actor to validate
 * @param movies - Movies to validate
 * @returns Auto-fix issues with enhanced confidence scoring
 */
export async function generateEnhancedAutoFixIssues(
  actor: string,
  movies: Array<{
    id: string;
    slug: string;
    title_en: string;
    release_year: number;
    hero?: string;
    heroine?: string;
    director?: string;
    music_director?: string;
    producer?: string;
    cinematographer?: string;
    editor?: string;
    writer?: string;
    tmdb_id?: number;
    imdb_id?: string;
    supporting_cast?: Array<{ name: string; type?: string }>;
  }>
): Promise<AutoFixIssue[]> {
  const issues: AutoFixIssue[] = [];

  console.log(chalk.cyan(`\n🔍 Running enhanced multi-source validation for ${actor}...\n`));

  // 1. Ghost Entry Detection
  console.log(chalk.gray('  Checking for ghost entries...'));
  for (const movie of movies) {
    const ghostAnalysis = await validateGhostEntry(movie, actor);
    
    if (ghostAnalysis.isGhost && ghostAnalysis.reattribution) {
      issues.push({
        id: `ghost-${movie.id}`,
        type: 'ghost_entry',
        movieId: movie.id,
        movieSlug: movie.slug,
        movieTitle: movie.title_en,
        movieYear: movie.release_year,
        field: 'hero',
        currentValue: actor,
        suggestedValue: ghostAnalysis.reattribution.suggestedActor,
        confidence: ghostAnalysis.reattribution.confidence,
        sources: {
          tmdb: ghostAnalysis.reattribution.sources.find(s => s.source === 'tmdb')?.actor || null,
          imdb: ghostAnalysis.reattribution.sources.find(s => s.source === 'imdb')?.actor || null,
          wikipedia: ghostAnalysis.reattribution.sources.find(s => s.source === 'wikipedia')?.actor || null,
        },
        details: ghostAnalysis.reattribution.reason,
        action: ghostAnalysis.reattribution.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX.reattribute
          ? 'auto_fix'
          : ghostAnalysis.reattribution.confidence >= CONFIDENCE_THRESHOLDS.FLAG_FOR_REVIEW.reattribute
          ? 'flag_review'
          : 'report_only',
      });
    }
  }

  // 2. TMDB ID Validation
  console.log(chalk.gray('  Validating TMDB IDs...'));
  for (const movie of movies) {
    if (movie.tmdb_id && movie.hero) {
      const tmdbValidation = await validateTmdbIdEnhanced(
        {
          title_en: movie.title_en,
          release_year: movie.release_year,
          hero: movie.hero,
        },
        movie.tmdb_id
      );

      if (!tmdbValidation.isValid) {
        issues.push({
          id: `tmdb-${movie.id}`,
          type: tmdbValidation.issues.includes('wrong_language') ? 'tmdb_wrong_language' : 'conflicting_data',
          movieId: movie.id,
          movieSlug: movie.slug,
          movieTitle: movie.title_en,
          movieYear: movie.release_year,
          field: 'tmdb_id',
          currentValue: movie.tmdb_id.toString(),
          suggestedValue: tmdbValidation.suggestedId?.toString() || null,
          confidence: tmdbValidation.confidence,
          sources: {},
          details: tmdbValidation.reason,
          action: tmdbValidation.action === 'replace' && tmdbValidation.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX.fix_tmdb_id
            ? 'auto_fix'
            : tmdbValidation.action === 'clear'
            ? 'flag_review'
            : 'report_only',
        });
      }
    }
  }

  // 3. Technical Credits Validation
  console.log(chalk.gray('  Validating technical credits...'));
  const technicalFields = ['cinematographer', 'editor', 'writer', 'producer', 'music_director'];
  
  for (const movie of movies.slice(0, 5)) { // Limit to 5 movies for performance
    for (const field of technicalFields) {
      const currentValue = (movie as any)[field];
      
      if (!currentValue) {
        const multiSourceResult = await validateFieldMultiSource(movie, field);
        
        if (multiSourceResult?.consensus && multiSourceResult.consensusConfidence >= CONFIDENCE_THRESHOLDS.FLAG_FOR_REVIEW.fill_tech_credits) {
          issues.push({
            id: `tech-${movie.id}-${field}`,
            type: 'missing_field',
            movieId: movie.id,
            movieSlug: movie.slug,
            movieTitle: movie.title_en,
            movieYear: movie.release_year,
            field,
            currentValue: null,
            suggestedValue: multiSourceResult.consensus,
            confidence: multiSourceResult.consensusConfidence,
            sources: multiSourceResult.sources.reduce((acc, s) => ({
              ...acc,
              [s.sourceId]: s.value,
            }), {}),
            details: `Multi-source consensus from ${multiSourceResult.sources.length} source(s)`,
            action: multiSourceResult.action === 'auto_apply'
              ? 'auto_fix'
              : multiSourceResult.action === 'flag_conflict'
              ? 'flag_review'
              : 'report_only',
          });
        }
      }
    }
    
    // Delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  // 4. Missing Films Detection
  console.log(chalk.gray('  Detecting missing films...'));
  const missingFilmsAnalysis = await detectMissingFilmsEnhanced(actor, movies);
  
  if (missingFilmsAnalysis) {
    for (const missing of missingFilmsAnalysis.autoAddCandidates) {
      issues.push({
        id: `missing-${missing.tmdbId}`,
        type: 'missing_field',
        movieId: '',
        movieSlug: '',
        movieTitle: missing.title,
        movieYear: missing.releaseYear,
        field: 'movie',
        currentValue: null,
        suggestedValue: `Add ${missing.title} (${missing.releaseYear}) as ${missing.role}`,
        confidence: missing.confidence,
        sources: { tmdb: missing.title },
        details: missing.details,
        action: missing.action === 'auto_add' ? 'auto_fix' : 'flag_review',
      });
    }
  }

  console.log(chalk.green(`✓ Enhanced validation complete: ${issues.length} issues found\n`));

  return issues;
}

/**
 * Apply enhanced auto-fixes to the database
 * Integrates with the new multi-source validation modules
 * 
 * @param issues - Issues to apply
 * @param options - Options including supabase client
 * @returns Updated auto-fix result
 */
export async function applyEnhancedAutoFixes(
  issues: AutoFixIssue[],
  options: AutoFixOptions
): Promise<AutoFixResult> {
  const { supabase, execute = false } = options;
  
  let appliedCount = 0;
  const updatedIssues = [...issues];

  if (!execute || !supabase) {
    console.log(chalk.yellow('  Dry run mode - no changes will be applied'));
    return {
      actor: '',
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      autoFixed: 0,
      flaggedForReview: issues.filter(i => i.action === 'flag_review').length,
      reportOnly: issues.filter(i => i.action === 'report_only').length,
      issues: updatedIssues,
      anomalyReport: issues.filter(i => i.action !== 'auto_fix'),
    };
  }

  console.log(chalk.cyan('\n📝 Applying enhanced auto-fixes...\n'));

  for (const issue of updatedIssues) {
    if (issue.action !== 'auto_fix') continue;

    try {
      let success = false;

      switch (issue.type) {
        case 'ghost_entry':
          // Re-attribute to correct actor
          if (issue.suggestedValue) {
            const { error } = await supabase
              .from('movies')
              .update({ hero: issue.suggestedValue })
              .eq('id', issue.movieId);
            success = !error;
            if (success) {
              console.log(chalk.green(`  ✓ Re-attributed "${issue.movieTitle}" to ${issue.suggestedValue}`));
            }
          }
          break;

        case 'tmdb_wrong_language':
        case 'conflicting_data':
          // Fix TMDB ID
          if (issue.field === 'tmdb_id' && issue.suggestedValue) {
            const { error } = await supabase
              .from('movies')
              .update({ tmdb_id: parseInt(issue.suggestedValue) })
              .eq('id', issue.movieId);
            success = !error;
            if (success) {
              console.log(chalk.green(`  ✓ Updated TMDB ID for "${issue.movieTitle}"`));
            }
          }
          break;

        case 'missing_field':
          // Fill missing technical credit
          if (issue.field && issue.field !== 'movie' && issue.suggestedValue) {
            const updateData = { [issue.field]: issue.suggestedValue };
            const { error } = await supabase
              .from('movies')
              .update(updateData)
              .eq('id', issue.movieId);
            success = !error;
            if (success) {
              console.log(chalk.green(`  ✓ Filled ${issue.field} for "${issue.movieTitle}"`));
            }
          }
          // Note: Adding new films requires more complex logic (handled separately)
          break;
      }

      if (success) {
        issue.autoFixApplied = true;
        appliedCount++;
      }
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to apply fix for "${issue.movieTitle}":`, error));
    }
  }

  console.log(chalk.green(`\n✓ Applied ${appliedCount} auto-fixes\n`));

  return {
    actor: '',
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    autoFixed: appliedCount,
    flaggedForReview: issues.filter(i => i.action === 'flag_review').length,
    reportOnly: issues.filter(i => i.action === 'report_only').length,
    issues: updatedIssues,
    anomalyReport: updatedIssues.filter(i => !i.autoFixApplied && i.action !== 'report_only'),
  };
}
