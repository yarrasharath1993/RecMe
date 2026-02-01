#!/usr/bin/env npx tsx
/**
 * EXECUTE CHIRANJEEVI FILMOGRAPHY FIXES
 * 
 * Reads ClawDBot's filmography analysis and executes fixes:
 * - Adds missing movies
 * - Fixes wrong attributions
 * 
 * Requires human approval (or --execute flag)
 * 
 * Usage:
 *   npx tsx scripts/execute-chiranjeevi-fixes.ts --analysis=reports/chiranjeevi-filmography-analysis.json
 *   npx tsx scripts/execute-chiranjeevi-fixes.ts --analysis=reports/chiranjeevi-filmography-analysis.json --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import type { FilmographyAnalysis, MissingMovieRecommendation, WrongAttributionRecommendation } from '../lib/clawdbot/types';
import { classifyActorRole } from './lib/role-classifier';
import type { DiscoveredFilm } from './lib/film-discovery-engine';
// Import existing validation scripts for comprehensive detection
import { validateActorFilmography, type CrossValidationResult } from './lib/filmography-cross-validator';
import { detectAllDuplicates, type MovieSummary } from './lib/validators/duplicate-detector';

dotenv.config({ path: '.env.local' });

const ACTOR_NAME = 'Chiranjeevi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name: string): string => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1].replace(/['"]/g, '') : '';
};

const ANALYSIS_PATH = getArg('analysis') || 'reports/chiranjeevi-filmography-analysis.json';
const EXECUTE = args.includes('--execute');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

/**
 * Generate slug from title and year
 */
function generateSlug(title: string, year: number): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + `-${year}`;
}

/**
 * Prompt user for confirmation
 */
async function promptConfirmation(message: string): Promise<boolean> {
  if (EXECUTE) return true; // Auto-approve if --execute flag
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Add missing movie to database
 */
async function addMissingMovie(
  recommendation: MissingMovieRecommendation,
  actorName: string
): Promise<boolean> {
  const slug = generateSlug(recommendation.title_en, recommendation.release_year);
  
  // Check if slug already exists
  const { data: existing } = await supabase
    .from('movies')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (existing) {
    if (VERBOSE) {
      console.log(chalk.yellow(`  ⚠️  Movie "${recommendation.title_en}" already exists (slug: ${slug})`));
    }
    return false;
  }
  
  // Prepare movie data
  const movieData: any = {
    title_en: recommendation.title_en,
    slug,
    release_year: recommendation.release_year,
    language: recommendation.language,
    is_published: false, // Mark as unpublished until enriched
    content_type: 'speculative', // Flag as speculative until verified
  };
  
  // Set actor based on role
  if (recommendation.role === 'hero') {
    movieData.hero = actorName;
  } else if (recommendation.role === 'heroine') {
    movieData.heroine = actorName;
  } else if (recommendation.role === 'cameo') {
    // For cameos, add to supporting_cast with type 'cameo'
    movieData.supporting_cast = [{ name: actorName, type: 'cameo' }];
  } else if (recommendation.role === 'antagonist') {
    // For antagonists, add to supporting_cast with type 'antagonist'
    movieData.supporting_cast = [{ name: actorName, type: 'antagonist' }];
  } else {
    // Supporting, co-lead, etc.
    const roleType = recommendation.role === 'co-lead' ? 'supporting' : recommendation.role;
    movieData.supporting_cast = [{ name: actorName, type: roleType }];
  }
  
  // Handle crew roles
  if (recommendation.crewRoles && recommendation.crewRoles.length > 0) {
    for (const crewRole of recommendation.crewRoles) {
      switch (crewRole) {
        case 'Producer':
          movieData.producer = actorName;
          movieData.producers = [actorName];
          break;
        case 'Director':
          movieData.director = actorName;
          movieData.directors = [actorName];
          break;
        case 'Writer':
          movieData.crew = { ...movieData.crew, writer: actorName };
          break;
        case 'Music Director':
          movieData.music_director = actorName;
          break;
        case 'Cinematographer':
          movieData.cinematographer = actorName;
          break;
        case 'Editor':
          movieData.crew = { ...movieData.crew, editor: actorName };
          break;
        // Add other crew roles as needed
      }
    }
  }
  
  // Insert into database
  const { error } = await supabase
    .from('movies')
    .insert(movieData);
  
  if (error) {
    console.error(chalk.red(`  ❌ Failed to add "${recommendation.title_en}":`, error.message));
    return false;
  }
  
  return true;
}

/**
 * Fix wrong attribution
 */
async function fixWrongAttribution(
  recommendation: WrongAttributionRecommendation,
  actorName: string
): Promise<boolean> {
  const movieId = recommendation.movie_id;
  const actorNameLower = actorName.toLowerCase();
  
  // Fetch current movie data
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .single();
  
  if (fetchError || !movie) {
    console.error(chalk.red(`  ❌ Failed to fetch movie ${movieId}:`, fetchError?.message));
    return false;
  }
  
  const updates: any = {};
  
  // Handle reattribution (remove Chiranjeevi, add correct actors)
  if (recommendation.recommended_action === 'reattribute' && recommendation.correctActors) {
    // Remove Chiranjeevi from all fields
    if (movie.hero && movie.hero.toLowerCase().includes(actorNameLower)) {
      updates.hero = null;
    }
    if (movie.heroine && movie.heroine.toLowerCase().includes(actorNameLower)) {
      updates.heroine = null;
    }
    if (movie.producer && movie.producer.toLowerCase().includes(actorNameLower)) {
      updates.producer = null;
      updates.producers = (movie.producers || []).filter((p: string) => 
        !p.toLowerCase().includes(actorNameLower)
      );
    }
    if (movie.director && movie.director.toLowerCase().includes(actorNameLower)) {
      updates.director = null;
      updates.directors = (movie.directors || []).filter((d: string) => 
        !d.toLowerCase().includes(actorNameLower)
      );
    }
    // Remove from supporting_cast
    if (Array.isArray(movie.supporting_cast)) {
      updates.supporting_cast = movie.supporting_cast.filter((cast: any) => 
        !cast.name?.toLowerCase().includes(actorNameLower)
      );
    }
    
    // Note: correctActors should be added manually or via separate script
    // This function focuses on removing the wrong attribution
    if (VERBOSE) {
      console.log(chalk.gray(`    Note: Reattribute to: ${recommendation.correctActors}`));
    }
  }
  
  // Handle reclassification (change role)
  else if (recommendation.recommended_action === 'reclassify' && recommendation.correctRole) {
    const correctRole = recommendation.correctRole;
    
    // Remove from current field
    if (movie.hero && movie.hero.toLowerCase().includes(actorNameLower)) {
      if (correctRole !== 'hero') {
        updates.hero = null;
      }
    }
    if (movie.heroine && movie.heroine.toLowerCase().includes(actorNameLower)) {
      if (correctRole !== 'heroine') {
        updates.heroine = null;
      }
    }
    if (Array.isArray(movie.supporting_cast)) {
      updates.supporting_cast = movie.supporting_cast.filter((cast: any) => 
        !cast.name?.toLowerCase().includes(actorNameLower)
      );
    }
    
    // Add to correct field based on correctRole
    switch (correctRole) {
      case 'hero':
        updates.hero = actorName;
        break;
      case 'heroine':
        updates.heroine = actorName;
        break;
      case 'co-lead':
      case 'supporting':
      case 'antagonist':
      case 'cameo':
        const supportingCast = Array.isArray(movie.supporting_cast) ? movie.supporting_cast : [];
        const existingEntry = supportingCast.find((cast: any) => 
          cast.name?.toLowerCase().includes(actorNameLower)
        );
        if (!existingEntry) {
          updates.supporting_cast = [...supportingCast, { 
            name: actorName, 
            type: correctRole === 'antagonist' ? 'antagonist' : correctRole === 'cameo' ? 'cameo' : 'supporting'
          }];
        }
        break;
    }
    
    // Update year if specified in notes
    if (recommendation.notes?.includes('Year corrected')) {
      const yearMatch = recommendation.notes.match(/Year corrected to (\d{4})/);
      if (yearMatch) {
        updates.release_year = parseInt(yearMatch[1]);
      }
    }
    
    // Update language if specified
    if (recommendation.language && recommendation.language !== movie.language) {
      updates.language = recommendation.language;
    }
  }
  
  // Handle legacy format (currentField/correctField)
  else {
    // Remove from wrong field
    if (recommendation.currentField) {
      switch (recommendation.currentField) {
        case 'hero':
          if (movie.hero && movie.hero.toLowerCase().includes(actorNameLower)) {
            updates.hero = null;
          }
          break;
        case 'heroine':
          if (movie.heroine && movie.heroine.toLowerCase().includes(actorNameLower)) {
            updates.heroine = null;
          }
          break;
        case 'producer':
          if (movie.producer && movie.producer.toLowerCase().includes(actorNameLower)) {
            updates.producer = null;
            updates.producers = (movie.producers || []).filter((p: string) => 
              !p.toLowerCase().includes(actorNameLower)
            );
          }
          break;
        case 'director':
          if (movie.director && movie.director.toLowerCase().includes(actorNameLower)) {
            updates.director = null;
            updates.directors = (movie.directors || []).filter((d: string) => 
              !d.toLowerCase().includes(actorNameLower)
            );
          }
          break;
      }
    }
    
    // Add to correct field
    if (recommendation.correctField) {
      switch (recommendation.correctField) {
        case 'hero':
          updates.hero = actorName;
          break;
        case 'heroine':
          updates.heroine = actorName;
          break;
        case 'producer':
          updates.producer = actorName;
          updates.producers = [...(movie.producers || []), actorName];
          break;
        case 'director':
          updates.director = actorName;
          updates.directors = [...(movie.directors || []), actorName];
          break;
        case 'supporting_cast':
          const supportingCast = Array.isArray(movie.supporting_cast) ? movie.supporting_cast : [];
          updates.supporting_cast = [...supportingCast, { name: actorName, type: 'supporting' }];
          break;
      }
    }
  }
  
  // Update movie
  const { error } = await supabase
    .from('movies')
    .update(updates)
    .eq('id', movieId);
  
  if (error) {
    console.error(chalk.red(`  ❌ Failed to fix attribution for "${recommendation.title_en}":`, error.message));
    return false;
  }
  
  return true;
}

/**
 * Main execution process
 */
async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         EXECUTE CHIRANJEEVI FILMOGRAPHY FIXES                        ║
║         (Adds missing movies, fixes wrong attributions)               ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  // Load analysis
  if (!fs.existsSync(ANALYSIS_PATH)) {
    console.error(chalk.red(`Error: Analysis file not found: ${ANALYSIS_PATH}`));
    console.log(chalk.yellow(`Run: npm run chiranjeevi:analyze first`));
    process.exit(1);
  }
  
  const analysisData = JSON.parse(fs.readFileSync(ANALYSIS_PATH, 'utf-8'));
  // Handle both formats: wrapped in outputs array or direct analysis object
  let analysis: FilmographyAnalysis;
  if (analysisData.outputs && Array.isArray(analysisData.outputs)) {
    const filmographyOutput = analysisData.outputs.find((o: any) => o.type === 'filmography_analysis');
    if (!filmographyOutput || !filmographyOutput.data) {
      console.error(chalk.red(`Error: No filmography analysis found in outputs`));
      process.exit(1);
    }
    analysis = filmographyOutput.data;
  } else {
    analysis = analysisData;
  }
  
  // Validate analysis structure
  if (!analysis.actor || !analysis.missingMovies || !analysis.wrongAttributions) {
    console.error(chalk.red(`Error: Invalid analysis format`));
    process.exit(1);
  }
  
  console.log(chalk.cyan(`Actor: ${chalk.bold(analysis.actor)}`));
  console.log(chalk.cyan(`Analysis: ${ANALYSIS_PATH}`));
  console.log(chalk.cyan(`Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('REVIEW MODE')}`));
  
  // Show summary
  console.log(chalk.cyan(`\n📊 Summary:`));
  console.log(`  • Missing movies: ${analysis.missingMovies.length}`);
  console.log(`  • Wrong attributions: ${analysis.wrongAttributions.length}`);
  console.log(`  • High priority missing: ${analysis.recommendations.addMovies.length}`);
  console.log(`  • High priority wrong attributions: ${analysis.recommendations.fixAttributions.length}`);
  
  // Show high priority recommendations
  if (analysis.recommendations.addMovies.length > 0) {
    console.log(chalk.cyan(`\n🎬 High Priority Missing Movies:`));
    analysis.recommendations.addMovies.forEach((rec, idx) => {
      console.log(chalk.gray(`  ${idx + 1}. ${rec.title_en} (${rec.release_year}) - ${rec.role}${rec.crewRoles ? ` + ${rec.crewRoles.join(', ')}` : ''}`));
    });
  }
  
  if (analysis.recommendations.fixAttributions.length > 0) {
    console.log(chalk.cyan(`\n⚠️  High Priority Wrong Attributions:`));
    analysis.recommendations.fixAttributions.forEach((rec, idx) => {
      console.log(chalk.gray(`  ${idx + 1}. ${rec.title_en} (${rec.release_year}) - ${rec.explanation}`));
    });
  }
  
  // Prompt for approval
  if (!EXECUTE) {
    const approved = await promptConfirmation(`\nProceed with executing fixes?`);
    if (!approved) {
      console.log(chalk.yellow('Cancelled by user'));
      process.exit(0);
    }
  }
  
  // Step 1: Run comprehensive validation using existing scripts
  console.log(chalk.cyan(`\n🔍 Running comprehensive validation (using existing validation scripts)...`));
  let validationResult: CrossValidationResult | null = null;
  try {
    validationResult = await validateActorFilmography(ACTOR_NAME, {
      maxMovies: 200,
      validateTMDB: true,
      verbose: VERBOSE,
    });
    
    console.log(chalk.gray(`  • Total movies checked: ${validationResult.totalMovies}`));
    console.log(chalk.gray(`  • Issues found: ${validationResult.issues.length}`));
    console.log(chalk.gray(`  • Critical issues: ${validationResult.criticalIssues}`));
    console.log(chalk.gray(`  • High priority issues: ${validationResult.highIssues}`));
    console.log(chalk.gray(`  • Auto-fixable: ${validationResult.autoFixable}`));
  } catch (error) {
    console.log(chalk.yellow(`  ⚠️  Validation script failed (may need TMDB API key): ${error}`));
  }
  
  // Step 2: Detect duplicates using existing duplicate detector
  console.log(chalk.cyan(`\n🔍 Detecting duplicates (using existing duplicate detector)...`));
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, tmdb_id, imdb_id, hero, director')
    .or(`hero.ilike.%${ACTOR_NAME}%,heroine.ilike.%${ACTOR_NAME}%,producer.ilike.%${ACTOR_NAME}%,director.ilike.%${ACTOR_NAME}%`);
  
  let duplicateCount = 0;
  if (allMovies && allMovies.length > 0) {
    const moviesForDupCheck: MovieSummary[] = allMovies.map(m => ({
      id: m.id,
      title_en: m.title_en || '',
      release_year: m.release_year || undefined,
      slug: m.slug || undefined,
      tmdb_id: m.tmdb_id || undefined,
      imdb_id: m.imdb_id || undefined,
      director: m.director || undefined,
      hero: m.hero || undefined,
    }));
    
    const duplicateResult = detectAllDuplicates(moviesForDupCheck, { includeFuzzyMatching: false }); // Skip fuzzy for speed
    duplicateCount = duplicateResult.exactDuplicates.length + duplicateResult.fuzzyDuplicates.length;
    console.log(chalk.gray(`  • Exact duplicates: ${duplicateResult.exactDuplicates.length}`));
    console.log(chalk.gray(`  • Fuzzy duplicates: ${duplicateResult.fuzzyDuplicates.length}`));
    
    if (duplicateCount > 0) {
      console.log(chalk.yellow(`  ⚠️  Found ${duplicateCount} duplicate pairs (use existing merge scripts to fix)`));
      if (VERBOSE && duplicateResult.exactDuplicates.length > 0) {
        duplicateResult.exactDuplicates.slice(0, 5).forEach(dup => {
          console.log(chalk.gray(`    • ${dup.movie1.title_en} (${dup.movie1.release_year}) ↔ ${dup.movie2.title_en} (${dup.movie2.release_year})`));
        });
      }
    }
  }
  
  // Step 3: Execute fixes from ClawDBot analysis
  let addedCount = 0;
  let fixedCount = 0;
  let errors = 0;
  
  // Add missing movies (process both recommendations and main missingMovies array)
  const moviesToAdd = analysis.recommendations.addMovies.length > 0 
    ? analysis.recommendations.addMovies 
    : analysis.missingMovies.filter(m => m.role !== 'delete' && !m.notes?.includes('DUPLICATE'));
  
  if (moviesToAdd.length > 0) {
    console.log(chalk.cyan(`\n✅ Adding ${moviesToAdd.length} missing movies...`));
    for (const rec of moviesToAdd) {
      // Skip duplicates (marked in notes)
      if (rec.notes?.includes('Duplicate') || rec.notes?.includes('merge')) {
        if (VERBOSE) {
          console.log(chalk.yellow(`  ⏭️  Skipping duplicate: ${rec.title_en} (${rec.release_year}) - ${rec.notes}`));
        }
        continue;
      }
      
      const success = await addMissingMovie(rec, ACTOR_NAME);
      if (success) {
        addedCount++;
        console.log(chalk.green(`  ✓ Added: ${rec.title_en} (${rec.release_year}) - ${rec.role}`));
      } else {
        errors++;
        if (VERBOSE) {
          console.log(chalk.yellow(`  ⚠️  Failed or skipped: ${rec.title_en} (${rec.release_year})`));
        }
      }
    }
  }
  
  // Fix wrong attributions (process both recommendations and main wrongAttributions array)
  const attributionsToFix = analysis.recommendations.fixAttributions.length > 0
    ? analysis.recommendations.fixAttributions
    : analysis.wrongAttributions;
  
  if (attributionsToFix.length > 0) {
    console.log(chalk.cyan(`\n🔧 Fixing ${attributionsToFix.length} wrong attributions (from ClawDBot)...`));
    for (const rec of attributionsToFix) {
      const success = await fixWrongAttribution(rec, ACTOR_NAME);
      if (success) {
        fixedCount++;
        console.log(chalk.green(`  ✓ Fixed: ${rec.title_en} (${rec.release_year}) - ${rec.issue}`));
      } else {
        errors++;
        if (VERBOSE) {
          console.log(chalk.yellow(`  ⚠️  Failed: ${rec.title_en} (${rec.release_year})`));
        }
      }
    }
  }
  
  // Fix wrong attributions from comprehensive validation (if available)
  // DISABLED: Validation script can incorrectly suggest reattributions based on incomplete TMDB data
  // Only use ClawDBot analysis for reattributions, validation is for detection only
  if (validationResult && validationResult.issues.length > 0) {
    const wrongAttrIssues = validationResult.issues.filter(i => 
      i.issueType === 'wrong_attribution' && i.confidence >= 0.8 && i.suggestedFix
    );
    
    if (wrongAttrIssues.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Found ${wrongAttrIssues.length} potential wrong attributions from validation (NOT auto-fixing)`));
      console.log(chalk.gray(`    Validation suggestions are for review only - use ClawDBot analysis for reattributions`));
      if (VERBOSE) {
        wrongAttrIssues.slice(0, 5).forEach((issue, idx) => {
          console.log(chalk.gray(`    ${idx + 1}. ${issue.title} (${issue.year}) - ${issue.details}`));
          if (issue.suggestedFix?.action === 'reattribute') {
            console.log(chalk.gray(`       Suggested: ${issue.suggestedFix.newValue} (REVIEW MANUALLY)`));
          }
        });
        if (wrongAttrIssues.length > 5) {
          console.log(chalk.gray(`    ... and ${wrongAttrIssues.length - 5} more`));
        }
      }
      // DO NOT auto-apply validation reattributions - they can be incorrect
      // Only apply delete actions for obvious ghost entries (with very high confidence)
      const deleteIssues = wrongAttrIssues.filter(i => 
        i.suggestedFix?.action === 'delete' && i.confidence >= 0.95
      );
      
      if (deleteIssues.length > 0) {
        console.log(chalk.cyan(`\n🗑️  Deleting ${deleteIssues.length} high-confidence ghost entries...`));
        for (const issue of deleteIssues) {
          const { error } = await supabase
            .from('movies')
            .delete()
            .eq('id', issue.movieId);
          
          if (!error) {
            fixedCount++;
            console.log(chalk.green(`  ✓ Deleted ghost entry: ${issue.title}`));
          } else {
            errors++;
            if (VERBOSE) console.log(chalk.red(`  ❌ Failed: ${issue.title} - ${error.message}`));
          }
        }
      }
    }
  }
  
  // Summary
  console.log(chalk.cyan.bold(`\n╔══════════════════════════════════════════════════════════════════════╗`));
  console.log(chalk.cyan.bold(`║                        EXECUTION SUMMARY                              ║`));
  console.log(chalk.cyan.bold(`╚══════════════════════════════════════════════════════════════════════╝`));
  console.log(`  Movies added: ${addedCount}`);
  console.log(`  Wrong attributions fixed: ${fixedCount}`);
  console.log(`  Duplicates detected: ${duplicateCount} (use existing merge scripts to fix)`);
  if (validationResult) {
    console.log(`  Validation issues found: ${validationResult.issues.length}`);
    console.log(`  Auto-fixable issues: ${validationResult.autoFixable}`);
  }
  console.log(`  Errors: ${errors}`);
  
  if (duplicateCount > 0) {
    console.log(chalk.yellow(`\n💡 Note: ${duplicateCount} duplicates detected. Use existing scripts to merge:`));
    console.log(chalk.gray(`    • scripts/merge-duplicates.ts`));
    console.log(chalk.gray(`    • scripts/lib/validators/duplicate-detector.ts`));
  }
  
  if (errors > 0) {
    console.log(chalk.yellow(`\n⚠️  Some operations failed. Check logs above for details.`));
  }
  
  if (validationResult && validationResult.issues.length > 0) {
    console.log(chalk.cyan(`\n💡 Additional validation issues found. Review:`));
    console.log(chalk.gray(`    • Use scripts/validate-actor-filmography.ts for comprehensive validation`));
    console.log(chalk.gray(`    • Use scripts/automated-attribution-audit.ts for attribution audit`));
  }
}

main().catch(console.error);
