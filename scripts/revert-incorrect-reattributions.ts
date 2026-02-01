#!/usr/bin/env npx tsx
/**
 * REVERT INCORRECT REATTRIBUTIONS
 * 
 * Reverts the 10 incorrect reattributions made by the validation script.
 * These are Chiranjeevi's actual films that were incorrectly changed.
 * 
 * Usage:
 *   npx tsx scripts/revert-incorrect-reattributions.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXECUTE = process.argv.includes('--execute');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

interface ReversionTask {
  title: string;
  year: number;
  movieId?: string; // Will be looked up if not provided
  correctHero: string; // Should be "Chiranjeevi"
}

const INCORRECT_REATTRIBUTIONS: Array<{ title: string; year: number; wrongHero: string }> = [
  { title: 'Vishwambhara', year: 2026, wrongHero: 'Su Ling Chan' },
  { title: 'Shankar Dada M.B.B.S.', year: 2004, wrongHero: 'Omid Djalili' },
  { title: 'Indra', year: 2002, wrongHero: 'Makoto Shinkai' },
  { title: 'Mrugaraju', year: 2001, wrongHero: 'Silvio Orlando' },
  { title: 'Sri Manjunatha', year: 2001, wrongHero: 'Mo Willems' },
  { title: 'Manchi Donga', year: 1988, wrongHero: 'Burton Cummings' },
  { title: 'Dhairyavanthudu', year: 1996, wrongHero: 'Éric Antoine' },
  { title: 'Jwaala', year: 1985, wrongHero: 'Mahendra Sandhu' },
  { title: 'Allullostunnaru', year: 1984, wrongHero: 'Lucio Dalla' },
  { title: 'Intlo Ramayya Veedhilo Krishnayya', year: 1982, wrongHero: 'Ada Choi Siu-Fan' },
];

async function findMovieId(title: string, year: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero')
    .ilike('title_en', `%${title}%`)
    .eq('release_year', year)
    .limit(1)
    .single();
  
  if (error || !data) {
    if (VERBOSE) {
      console.log(chalk.yellow(`  ⚠️  Could not find movie: ${title} (${year})`));
    }
    return null;
  }
  
  return data.id;
}

async function revertReattribution(title: string, year: number, wrongHero: string): Promise<boolean> {
  const movieId = await findMovieId(title, year);
  
  if (!movieId) {
    return false;
  }
  
  // Fetch current movie data
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero')
    .eq('id', movieId)
    .single();
  
  if (fetchError || !movie) {
    console.error(chalk.red(`  ❌ Failed to fetch movie ${title}:`, fetchError?.message));
    return false;
  }
  
  // Check if hero is currently the wrong person
  if (movie.hero && movie.hero.toLowerCase().includes(wrongHero.toLowerCase())) {
    // Revert to Chiranjeevi
    const { error } = await supabase
      .from('movies')
      .update({ hero: 'Chiranjeevi' })
      .eq('id', movieId);
    
    if (error) {
      console.error(chalk.red(`  ❌ Failed to revert "${title}":`, error.message));
      return false;
    }
    
    console.log(chalk.green(`  ✓ Reverted: ${title} (${year}) - Changed from "${movie.hero}" to "Chiranjeevi"`));
    return true;
  } else {
    if (VERBOSE) {
      console.log(chalk.yellow(`  ⏭️  Skipped: ${title} (${year}) - Hero is "${movie.hero}" (not "${wrongHero}")`));
    }
    return true; // Already correct or different issue
  }
}

async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         REVERT INCORRECT REATTRIBUTIONS                              ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(chalk.cyan(`Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`));
  console.log(chalk.cyan(`Films to revert: ${INCORRECT_REATTRIBUTIONS.length}\n`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made\n'));
    console.log(chalk.cyan('Planned reversions:'));
    INCORRECT_REATTRIBUTIONS.forEach((task, idx) => {
      console.log(chalk.gray(`\n${idx + 1}. ${task.title} (${task.year})`));
      console.log(chalk.red(`   Current (WRONG): ${task.wrongHero}`));
      console.log(chalk.green(`   Will revert to: Chiranjeevi`));
    });
    console.log(chalk.yellow('\nRun with --execute to apply changes'));
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (const task of INCORRECT_REATTRIBUTIONS) {
    const result = await revertReattribution(task.title, task.year, task.wrongHero);
    if (result) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  console.log(chalk.cyan.bold(`\n╔══════════════════════════════════════════════════════════════════════╗`));
  console.log(chalk.cyan.bold(`║                        SUMMARY                                        ║`));
  console.log(chalk.cyan.bold(`╚══════════════════════════════════════════════════════════════════════╝`));
  console.log(`  Successfully reverted: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Skipped: ${skippedCount}`);
  
  if (errorCount === 0) {
    console.log(chalk.green(`\n✅ All incorrect reattributions have been reverted!`));
  }
}

main().catch(console.error);
