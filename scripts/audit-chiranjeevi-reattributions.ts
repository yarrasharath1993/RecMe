#!/usr/bin/env npx tsx
/**
 * AUDIT CHIRANJEEVI REATTRIBUTIONS
 * 
 * Audits all reattributions made to Chiranjeevi's filmography to verify:
 * 1. TMDB IDs are correct (not pointing to wrong language/version)
 * 2. Chiranjeevi is actually in the cast (using proper cross-reference)
 * 3. Reattributions were correct or need to be reverted
 * 
 * Uses existing validation and cross-reference scripts for proper verification.
 * 
 * Usage:
 *   npx tsx scripts/audit-chiranjeevi-reattributions.ts --fix
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { getActorIdentifier, type ActorVerificationResult } from './lib/actor-identifier';
import { crossReferenceWithTMDB } from './validate-actor-movies';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTOR_NAME = 'Chiranjeevi';
const EXECUTE = process.argv.includes('--fix');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

interface AuditResult {
  movieId: string;
  title: string;
  year: number;
  currentHero: string;
  tmdbId: number | null;
  tmdbLanguage: string | null;
  tmdbTitle: string | null;
  tmdbYear: number | null;
  chiranjeeviInCast: boolean;
  confidence: number;
  castOrder: number | null;
  topCast: string[];
  issue: 'wrong_tmdb_id' | 'missing_tmdb' | 'not_in_cast' | 'correct' | 'needs_revert';
  suggestedFix?: {
    action: 'fix_tmdb_id' | 'revert_hero' | 'clear_tmdb' | 'none';
    newTmdbId?: number;
    newHero?: string;
  };
}

/**
 * Get TMDB movie details
 */
async function getTMDBMovieDetails(tmdbId: number): Promise<any> {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Search TMDB for correct movie ID
 */
async function searchTMDBForMovie(title: string, year: number): Promise<number | null> {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) return null;
  
  try {
    // Search with year
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=te`;
    const response = await fetch(searchUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Find Telugu version
      const teluguMovie = data.results.find((m: any) => 
        m.original_language === 'te' || 
        m.title.toLowerCase().includes(title.toLowerCase())
      );
      if (teluguMovie) return teluguMovie.id;
      
      // Fallback to first result
      return data.results[0].id;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Audit a single movie
 */
async function auditMovie(movie: any): Promise<AuditResult> {
  const identifier = getActorIdentifier();
  let tmdbDetails: any = null;
  let chiranjeeviInCast = false;
  let confidence = 0;
  let castOrder: number | null = null;
  let topCast: string[] = [];
  let tmdbLanguage: string | null = null;
  let tmdbTitle: string | null = null;
  let tmdbYear: number | null = null;
  
  // Get TMDB details if available
  if (movie.tmdb_id) {
    tmdbDetails = await getTMDBMovieDetails(movie.tmdb_id);
    if (tmdbDetails) {
      tmdbLanguage = tmdbDetails.original_language;
      tmdbTitle = tmdbDetails.title;
      tmdbYear = tmdbDetails.release_date ? parseInt(tmdbDetails.release_date.split('-')[0]) : null;
      
      // Check if Chiranjeevi is in cast using proper cross-reference
      const verification = await identifier.verifyActorInMovie(ACTOR_NAME, movie.tmdb_id);
      chiranjeeviInCast = verification.found;
      confidence = verification.confidence;
      castOrder = verification.castOrder || null;
      
      // Get top cast
      const cast = tmdbDetails.credits?.cast || [];
      topCast = cast.slice(0, 5).map((c: any) => c.name);
    }
  }
  
  // Determine issue
  let issue: AuditResult['issue'] = 'correct';
  let suggestedFix: AuditResult['suggestedFix'] | undefined;
  
  // Check if TMDB ID is wrong (wrong language or wrong movie)
  if (movie.tmdb_id && tmdbDetails) {
    const isTelugu = tmdbLanguage === 'te';
    const titleMatch = tmdbTitle && movie.title_en && 
      tmdbTitle.toLowerCase().includes(movie.title_en.toLowerCase().substring(0, 10));
    const yearMatch = tmdbYear && Math.abs(tmdbYear - movie.release_year) <= 1;
    
    if (!isTelugu || !titleMatch || !yearMatch) {
      issue = 'wrong_tmdb_id';
      // Try to find correct TMDB ID
      const correctId = await searchTMDBForMovie(movie.title_en, movie.release_year);
      if (correctId && correctId !== movie.tmdb_id) {
        suggestedFix = {
          action: 'fix_tmdb_id',
          newTmdbId: correctId
        };
      } else {
        suggestedFix = {
          action: 'clear_tmdb'
        };
      }
    } else if (!chiranjeeviInCast && movie.hero && movie.hero.toLowerCase().includes('chiranjeevi')) {
      // Chiranjeevi is marked as hero but not in TMDB cast
      // This could be:
      // 1. TMDB cast is incomplete (common for older films)
      // 2. Wrong TMDB ID
      // 3. Actually wrong attribution
      
      // Check if this is a known Chiranjeevi film by title/year
      const isKnownChiranjeeviFilm = await checkIfKnownChiranjeeviFilm(movie.title_en, movie.release_year);
      
      if (isKnownChiranjeeviFilm) {
        issue = 'wrong_tmdb_id'; // Likely wrong TMDB ID
        const correctId = await searchTMDBForMovie(movie.title_en, movie.release_year);
        if (correctId && correctId !== movie.tmdb_id) {
          suggestedFix = {
            action: 'fix_tmdb_id',
            newTmdbId: correctId
          };
        }
      } else {
        issue = 'not_in_cast';
        // Flag for manual review - don't auto-revert without confirmation
      }
    }
  } else if (!movie.tmdb_id && movie.hero && movie.hero.toLowerCase().includes('chiranjeevi')) {
    issue = 'missing_tmdb';
    // Try to find TMDB ID
    const foundId = await searchTMDBForMovie(movie.title_en, movie.release_year);
    if (foundId) {
      suggestedFix = {
        action: 'fix_tmdb_id',
        newTmdbId: foundId
      };
    }
  }
  
  // Check if hero was incorrectly changed from Chiranjeevi
  if (movie.hero && !movie.hero.toLowerCase().includes('chiranjeevi')) {
    // Check if this should be Chiranjeevi
    const shouldBeChiranjeevi = await checkIfKnownChiranjeeviFilm(movie.title_en, movie.release_year);
    if (shouldBeChiranjeevi) {
      issue = 'needs_revert';
      suggestedFix = {
        action: 'revert_hero',
        newHero: 'Chiranjeevi'
      };
    }
  }
  
  return {
    movieId: movie.id,
    title: movie.title_en,
    year: movie.release_year,
    currentHero: movie.hero || '',
    tmdbId: movie.tmdb_id,
    tmdbLanguage,
    tmdbTitle,
    tmdbYear,
    chiranjeeviInCast,
    confidence,
    castOrder,
    topCast,
    issue,
    suggestedFix
  };
}

/**
 * Check if this is a known Chiranjeevi film (by title/year lookup)
 */
async function checkIfKnownChiranjeeviFilm(title: string, year: number): Promise<boolean> {
  // Known Chiranjeevi films (can be expanded)
  const knownFilms: Record<string, number[]> = {
    'indra': [2002],
    'indrudu': [2002],
    'shankar dada m.b.b.s.': [2004],
    'shankar dada mbbs': [2004],
    'mrugaraju': [2001],
    'sri manjunatha': [2001],
    'manchi donga': [1988],
    'jwaala': [1985],
    'allullostunnaru': [1984],
    'intlo ramayya veedhilo krishnayya': [1982],
    'dhairyavanthudu': [1986],
    'vishwambhara': [2026],
  };
  
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  for (const [knownTitle, years] of Object.entries(knownFilms)) {
    if (normalizedTitle.includes(knownTitle) || knownTitle.includes(normalizedTitle.substring(0, 10))) {
      if (years.includes(year) || years.length === 0) {
        return true;
      }
    }
  }
  
  return false;
}

async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         AUDIT CHIRANJEEVI REATTRIBUTIONS                             ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  // Fetch all Chiranjeevi movies
  console.log(chalk.cyan('Fetching Chiranjeevi movies from database...'));
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, tmdb_id, slug')
    .or(`hero.ilike.%${ACTOR_NAME}%,heroine.ilike.%${ACTOR_NAME}%,producer.ilike.%${ACTOR_NAME}%,director.ilike.%${ACTOR_NAME}%`)
    .order('release_year', { ascending: false });
  
  if (error) {
    console.error(chalk.red(`Error fetching movies: ${error.message}`));
    process.exit(1);
  }
  
  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('No movies found'));
    return;
  }
  
  console.log(chalk.green(`Found ${movies.length} movies\n`));
  
  // Audit each movie
  console.log(chalk.cyan('Auditing movies (this may take a while)...\n'));
  const auditResults: AuditResult[] = [];
  
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    if (VERBOSE || i % 10 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${movies.length} - ${movie.title_en}`);
    }
    
    const result = await auditMovie(movie);
    auditResults.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(chalk.green(`\n\nAudit complete! Analyzing results...\n`));
  
  // Categorize results
  const wrongTmdbIds = auditResults.filter(r => r.issue === 'wrong_tmdb_id');
  const needsRevert = auditResults.filter(r => r.issue === 'needs_revert');
  const notInCast = auditResults.filter(r => r.issue === 'not_in_cast');
  const missingTmdb = auditResults.filter(r => r.issue === 'missing_tmdb');
  const correct = auditResults.filter(r => r.issue === 'correct');
  
  // Print summary
  console.log(chalk.cyan.bold('SUMMARY:'));
  console.log(`  Total movies audited: ${auditResults.length}`);
  console.log(chalk.green(`  ✓ Correct: ${correct.length}`));
  console.log(chalk.yellow(`  ⚠️  Wrong TMDB ID: ${wrongTmdbIds.length}`));
  console.log(chalk.red(`  ❌ Needs revert: ${needsRevert.length}`));
  console.log(chalk.yellow(`  ⚠️  Not in cast (needs review): ${notInCast.length}`));
  console.log(chalk.yellow(`  ⚠️  Missing TMDB ID: ${missingTmdb.length}\n`));
  
  // Show issues
  if (needsRevert.length > 0) {
    console.log(chalk.red.bold('\n❌ MOVIES THAT NEED REVERT:'));
    needsRevert.forEach(r => {
      console.log(chalk.red(`  • ${r.title} (${r.year}) - Current: "${r.currentHero}" → Should be: "Chiranjeevi"`));
    });
  }
  
  if (wrongTmdbIds.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️  MOVIES WITH WRONG TMDB ID:'));
    wrongTmdbIds.slice(0, 10).forEach(r => {
      console.log(chalk.yellow(`  • ${r.title} (${r.year})`));
      console.log(chalk.gray(`    Current TMDB: ${r.tmdbId} (${r.tmdbLanguage || 'unknown'}) - "${r.tmdbTitle}"`));
      if (r.suggestedFix?.newTmdbId) {
        console.log(chalk.green(`    Suggested: ${r.suggestedFix.newTmdbId}`));
      }
    });
    if (wrongTmdbIds.length > 10) {
      console.log(chalk.gray(`    ... and ${wrongTmdbIds.length - 10} more`));
    }
  }
  
  if (notInCast.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️  MOVIES WHERE CHIRANJEEVI NOT IN TMDB CAST (needs review):'));
    notInCast.slice(0, 10).forEach(r => {
      console.log(chalk.yellow(`  • ${r.title} (${r.year})`));
      console.log(chalk.gray(`    TMDB ID: ${r.tmdbId || 'none'}, Top cast: ${r.topCast.join(', ') || 'none'}`));
    });
    if (notInCast.length > 10) {
      console.log(chalk.gray(`    ... and ${notInCast.length - 10} more`));
    }
  }
  
  // Apply fixes if --fix flag
  if (EXECUTE) {
    console.log(chalk.cyan.bold('\n\nAPPLYING FIXES...\n'));
    
    let fixedCount = 0;
    let errorCount = 0;
    
    // Revert incorrect reattributions
    for (const result of needsRevert) {
      if (result.suggestedFix?.action === 'revert_hero' && result.suggestedFix.newHero) {
        const { error } = await supabase
          .from('movies')
          .update({ hero: result.suggestedFix.newHero })
          .eq('id', result.movieId);
        
        if (!error) {
          console.log(chalk.green(`  ✓ Reverted: ${result.title} → ${result.suggestedFix.newHero}`));
          fixedCount++;
        } else {
          console.log(chalk.red(`  ❌ Failed: ${result.title} - ${error.message}`));
          errorCount++;
        }
      }
    }
    
    // Fix wrong TMDB IDs
    for (const result of wrongTmdbIds) {
      if (result.suggestedFix?.action === 'fix_tmdb_id' && result.suggestedFix.newTmdbId) {
        const { error } = await supabase
          .from('movies')
          .update({ tmdb_id: result.suggestedFix.newTmdbId })
          .eq('id', result.movieId);
        
        if (!error) {
          console.log(chalk.green(`  ✓ Fixed TMDB ID: ${result.title} → ${result.suggestedFix.newTmdbId}`));
          fixedCount++;
        } else {
          console.log(chalk.red(`  ❌ Failed: ${result.title} - ${error.message}`));
          errorCount++;
        }
      } else if (result.suggestedFix?.action === 'clear_tmdb') {
        const { error } = await supabase
          .from('movies')
          .update({ tmdb_id: null })
          .eq('id', result.movieId);
        
        if (!error) {
          console.log(chalk.yellow(`  ✓ Cleared TMDB ID: ${result.title}`));
          fixedCount++;
        } else {
          errorCount++;
        }
      }
    }
    
    // Add missing TMDB IDs
    for (const result of missingTmdb) {
      if (result.suggestedFix?.action === 'fix_tmdb_id' && result.suggestedFix.newTmdbId) {
        const { error } = await supabase
          .from('movies')
          .update({ tmdb_id: result.suggestedFix.newTmdbId })
          .eq('id', result.movieId);
        
        if (!error) {
          console.log(chalk.green(`  ✓ Added TMDB ID: ${result.title} → ${result.suggestedFix.newTmdbId}`));
          fixedCount++;
        } else {
          errorCount++;
        }
      }
    }
    
    console.log(chalk.cyan.bold(`\n\nFIXES APPLIED:`));
    console.log(`  Fixed: ${fixedCount}`);
    console.log(`  Errors: ${errorCount}`);
  } else {
    console.log(chalk.yellow('\n\nRun with --fix to apply fixes'));
  }
}

main().catch(console.error);
