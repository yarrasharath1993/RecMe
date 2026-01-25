#!/usr/bin/env npx tsx
/**
 * MERGE DUPLICATE MOVIES
 * 
 * Safely merges duplicate movie entries while:
 * - Preserving the best data from both entries
 * - Updating all references (reviews, ratings, etc.)
 * - Creating an audit trail
 * - Supporting dry-run mode
 * 
 * Usage:
 *   npx tsx scripts/merge-duplicate-movies.ts --input=docs/audit-reports/exact-duplicates.csv
 *   npx tsx scripts/merge-duplicate-movies.ts --input=docs/audit-reports/exact-duplicates.csv --execute
 *   npx tsx scripts/merge-duplicate-movies.ts --pair=uuid1,uuid2 --execute
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPES
// ============================================================

interface MovieRecord {
  id: string;
  title_en: string;
  title_te?: string | null;
  slug: string;
  release_year?: number | null;
  language?: string | null;
  director?: string | null;
  hero?: string | null;
  heroine?: string | null;
  genres?: string[] | null;
  runtime_minutes?: number | null;
  poster_url?: string | null;
  synopsis_te?: string | null;
  synopsis_en?: string | null;
  tmdb_id?: number | null;
  imdb_id?: string | null;
  avg_rating?: number | null;
  total_reviews?: number | null;
  [key: string]: any;
}

interface MergeDecision {
  keepId: string;
  deleteId: string;
  reason: string;
  mergedData: Partial<MovieRecord>;
}

interface MergeResult {
  success: boolean;
  keepId: string;
  deleteId: string;
  error?: string;
  updatedReferences?: {
    reviews: number;
    ratings: number;
    [key: string]: number;
  };
}

// ============================================================
// DATA QUALITY SCORING
// ============================================================

/**
 * Score a movie record based on data completeness and quality
 */
function scoreMovieQuality(movie: MovieRecord): number {
  let score = 0;

  // Critical fields (20 points each)
  if (movie.title_en) score += 20;
  if (movie.slug) score += 20;
  if (movie.release_year) score += 20;

  // High priority fields (10 points each)
  if (movie.title_te) score += 10;
  if (movie.director) score += 10;
  if (movie.hero || movie.heroine) score += 10;
  if (movie.genres && movie.genres.length > 0) score += 10;

  // Medium priority fields (5 points each)
  if (movie.runtime_minutes) score += 5;
  if (movie.poster_url && !movie.poster_url.includes('placeholder')) score += 5;
  if (movie.synopsis_te) score += 5;
  if (movie.synopsis_en) score += 5;
  if (movie.language) score += 5;

  // External IDs (5 points each)
  if (movie.tmdb_id) score += 5;
  if (movie.imdb_id) score += 5;

  // User engagement (1 point per review/rating)
  if (movie.total_reviews) score += movie.total_reviews;

  return score;
}

/**
 * Decide which movie to keep and which to delete
 */
function decideMerge(movie1: MovieRecord, movie2: MovieRecord): MergeDecision {
  const score1 = scoreMovieQuality(movie1);
  const score2 = scoreMovieQuality(movie2);

  console.log(chalk.gray(`    Score 1: ${score1}, Score 2: ${score2}`));

  let keepId: string;
  let deleteId: string;
  let reason: string;

  // Prefer movie with more data
  if (score1 > score2) {
    keepId = movie1.id;
    deleteId = movie2.id;
    reason = `Movie 1 has better data quality (score ${score1} vs ${score2})`;
  } else if (score2 > score1) {
    keepId = movie2.id;
    deleteId = movie1.id;
    reason = `Movie 2 has better data quality (score ${score2} vs ${score1})`;
  } else {
    // Equal scores - prefer one with reviews or earlier created_at
    if ((movie1.total_reviews || 0) > (movie2.total_reviews || 0)) {
      keepId = movie1.id;
      deleteId = movie2.id;
      reason = 'Movie 1 has more reviews';
    } else if ((movie2.total_reviews || 0) > (movie1.total_reviews || 0)) {
      keepId = movie2.id;
      deleteId = movie1.id;
      reason = 'Movie 2 has more reviews';
    } else {
      // Arbitrary - keep movie1
      keepId = movie1.id;
      deleteId = movie2.id;
      reason = 'Equal quality - keeping first entry';
    }
  }

  // Merge best data from both
  const keep = keepId === movie1.id ? movie1 : movie2;
  const discard = keepId === movie1.id ? movie2 : movie1;

  const mergedData: Partial<MovieRecord> = { ...keep };

  // Take non-null fields from discarded movie if keep movie is missing them
  for (const key of Object.keys(discard)) {
    if (!mergedData[key] && discard[key]) {
      mergedData[key] = discard[key];
    }
  }

  return { keepId, deleteId, reason, mergedData };
}

// ============================================================
// MERGE OPERATIONS
// ============================================================

/**
 * Fetch movie record from database
 */
async function fetchMovie(id: string): Promise<MovieRecord | null> {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error(chalk.red(`    ❌ Error fetching movie ${id}:`), error?.message);
    return null;
  }

  return data as MovieRecord;
}

/**
 * Update movie record with merged data
 */
async function updateMovie(id: string, data: Partial<MovieRecord>): Promise<boolean> {
  const { error } = await supabase
    .from('movies')
    .update(data)
    .eq('id', id);

  if (error) {
    console.error(chalk.red(`    ❌ Error updating movie ${id}:`), error.message);
    return false;
  }

  return true;
}

/**
 * Update all references to the deleted movie
 */
async function updateReferences(deleteId: string, keepId: string): Promise<{ reviews: number; ratings: number }> {
  let reviewsUpdated = 0;
  let ratingsUpdated = 0;

  // Update movie_reviews table
  const { data: reviews, error: reviewsError } = await supabase
    .from('movie_reviews')
    .update({ movie_id: keepId })
    .eq('movie_id', deleteId)
    .select();

  if (!reviewsError && reviews) {
    reviewsUpdated = reviews.length;
  }

  // Update user_ratings table (if exists)
  const { data: ratings, error: ratingsError } = await supabase
    .from('user_ratings')
    .update({ movie_id: keepId })
    .eq('movie_id', deleteId)
    .select();

  if (!ratingsError && ratings) {
    ratingsUpdated = ratings.length;
  }

  return { reviews: reviewsUpdated, ratings: ratingsUpdated };
}

/**
 * Delete the duplicate movie
 */
async function deleteMovie(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(chalk.red(`    ❌ Error deleting movie ${id}:`), error.message);
    return false;
  }

  return true;
}

/**
 * Perform the full merge operation
 */
async function mergePair(id1: string, id2: string, execute: boolean): Promise<MergeResult> {
  console.log(chalk.blue(`\n  Merging pair: ${id1.substring(0, 8)}... ↔ ${id2.substring(0, 8)}...`));

  // Fetch both movies
  const movie1 = await fetchMovie(id1);
  const movie2 = await fetchMovie(id2);

  if (!movie1 || !movie2) {
    return {
      success: false,
      keepId: id1,
      deleteId: id2,
      error: 'Failed to fetch one or both movies',
    };
  }

  console.log(chalk.gray(`    Movie 1: "${movie1.title_en}" (${movie1.release_year || 'N/A'})`));
  console.log(chalk.gray(`    Movie 2: "${movie2.title_en}" (${movie2.release_year || 'N/A'})`));

  // Decide which to keep
  const decision = decideMerge(movie1, movie2);
  console.log(chalk.yellow(`    → Decision: Keep ${decision.keepId.substring(0, 8)}... (${decision.reason})`));

  if (!execute) {
    console.log(chalk.yellow(`    (Dry run - no changes made)`));
    return {
      success: true,
      keepId: decision.keepId,
      deleteId: decision.deleteId,
    };
  }

  // Step 1: Update the kept movie with merged data
  console.log(chalk.gray(`    Step 1: Updating kept movie with best data...`));
  const updateSuccess = await updateMovie(decision.keepId, decision.mergedData);
  if (!updateSuccess) {
    return {
      success: false,
      keepId: decision.keepId,
      deleteId: decision.deleteId,
      error: 'Failed to update kept movie',
    };
  }

  // Step 2: Update all references
  console.log(chalk.gray(`    Step 2: Updating references...`));
  const refs = await updateReferences(decision.deleteId, decision.keepId);
  console.log(chalk.gray(`      - Updated ${refs.reviews} reviews`));
  console.log(chalk.gray(`      - Updated ${refs.ratings} ratings`));

  // Step 3: Delete the duplicate
  console.log(chalk.gray(`    Step 3: Deleting duplicate...`));
  const deleteSuccess = await deleteMovie(decision.deleteId);
  if (!deleteSuccess) {
    return {
      success: false,
      keepId: decision.keepId,
      deleteId: decision.deleteId,
      error: 'Failed to delete duplicate movie',
    };
  }

  console.log(chalk.green(`    ✅ Merge complete!`));

  return {
    success: true,
    keepId: decision.keepId,
    deleteId: decision.deleteId,
    updatedReferences: refs,
  };
}

// ============================================================
// CSV PARSING
// ============================================================

interface DuplicatePair {
  id1: string;
  title1: string;
  year1: string;
  id2: string;
  title2: string;
  year2: string;
  matchType: string;
  confidence: string;
}

/**
 * Parse the exact-duplicates.csv file
 */
function parseDuplicatesCSV(filePath: string): DuplicatePair[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  // Skip header
  const pairs: DuplicatePair[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 8) {
      pairs.push({
        id1: parts[0].trim(),
        title1: parts[1].replace(/"/g, '').trim(),
        year1: parts[2].trim(),
        id2: parts[4].trim(),
        title2: parts[5].replace(/"/g, '').trim(),
        year2: parts[6].trim(),
        matchType: parts[8]?.trim() || '',
        confidence: parts[9]?.trim() || '',
      });
    }
  }

  return pairs;
}

// ============================================================
// AUDIT TRAIL
// ============================================================

interface MergeLog {
  timestamp: string;
  keepId: string;
  deleteId: string;
  keepTitle: string;
  deleteTitle: string;
  reason: string;
  success: boolean;
  error?: string;
  updatedReferences?: {
    reviews: number;
    ratings: number;
  };
}

const mergeLogs: MergeLog[] = [];

function logMerge(
  movie1: MovieRecord | null,
  movie2: MovieRecord | null,
  result: MergeResult
): void {
  mergeLogs.push({
    timestamp: new Date().toISOString(),
    keepId: result.keepId,
    deleteId: result.deleteId,
    keepTitle: movie1?.title_en || movie2?.title_en || 'Unknown',
    deleteTitle: movie1?.id === result.deleteId ? movie1?.title_en : movie2?.title_en || 'Unknown',
    reason: 'Data quality score',
    success: result.success,
    error: result.error,
    updatedReferences: result.updatedReferences,
  });
}

function saveMergeLogs(outputDir: string): void {
  const logPath = path.join(outputDir, `merge-log-${Date.now()}.json`);
  fs.writeFileSync(logPath, JSON.stringify(mergeLogs, null, 2), 'utf-8');
  console.log(chalk.cyan(`\n  📋 Merge log saved: ${logPath}`));
}

// ============================================================
// MAIN FUNCTION
// ============================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  const getArg = (name: string, defaultValue: string = ''): string => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };

  const hasFlag = (name: string): boolean => args.includes(`--${name}`);

  const INPUT_FILE = getArg('input', 'docs/audit-reports/exact-duplicates.csv');
  const PAIR = getArg('pair'); // Format: "id1,id2"
  const EXECUTE = hasFlag('execute');
  const OUTPUT_DIR = getArg('output-dir', 'docs/audit-reports');

  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            MERGE DUPLICATE MOVIES                                    ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝'));

  console.log(chalk.gray(`\n  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`));
  if (!EXECUTE) {
    console.log(chalk.yellow('  (No changes will be made. Use --execute to apply merges)'));
  }

  // Single pair merge
  if (PAIR) {
    const [id1, id2] = PAIR.split(',');
    if (!id1 || !id2) {
      console.error(chalk.red('\n  ❌ Invalid pair format. Use: --pair=uuid1,uuid2'));
      process.exit(1);
    }

    const result = await mergePair(id1, id2, EXECUTE);
    if (!result.success) {
      console.error(chalk.red(`\n  ❌ Merge failed: ${result.error}`));
      process.exit(1);
    }

    console.log(chalk.green('\n  ✅ Merge operation complete!'));
    return;
  }

  // Batch merge from CSV
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(chalk.red(`\n  ❌ Input file not found: ${INPUT_FILE}`));
    process.exit(1);
  }

  console.log(chalk.gray(`\n  Input file: ${INPUT_FILE}`));

  const pairs = parseDuplicatesCSV(INPUT_FILE);
  console.log(chalk.blue(`\n  Found ${pairs.length} duplicate pairs to merge`));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    console.log(chalk.magenta(`\n[${i + 1}/${pairs.length}] Processing: "${pair.title1}" ↔ "${pair.title2}"`));

    const movie1 = await fetchMovie(pair.id1);
    const movie2 = await fetchMovie(pair.id2);

    const result = await mergePair(pair.id1, pair.id2, EXECUTE);
    logMerge(movie1, movie2, result);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Save audit trail
  if (EXECUTE) {
    saveMergeLogs(OUTPUT_DIR);
  }

  console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║            MERGE COMPLETE                                            ║'));
  console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════════════════╝'));

  console.log(chalk.gray(`\n  Total pairs: ${pairs.length}`));
  console.log(chalk.green(`  Successful: ${successCount}`));
  if (failCount > 0) {
    console.log(chalk.red(`  Failed: ${failCount}`));
  }

  if (!EXECUTE) {
    console.log(chalk.yellow(`\n  💡 This was a dry run. Use --execute to apply changes.`));
  } else {
    console.log(chalk.green(`\n  ✅ All merges applied to database!`));
  }
}

// Run the script
main().catch(error => {
  console.error(chalk.red('\n❌ Script failed:'), error);
  process.exit(1);
});
