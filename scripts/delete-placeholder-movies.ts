#!/usr/bin/env npx tsx
/**
 * DELETE PLACEHOLDER MOVIES
 * 
 * Deletes movies with placeholder titles (e.g., "AA22xA6", "VD14")
 * that have no real movie data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const args = process.argv.slice(2);
  const EXECUTE = args.includes('--execute');
  
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            DELETE PLACEHOLDER MOVIES                                 ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.gray(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`));
  if (!EXECUTE) {
    console.log(chalk.yellow('  (No changes will be made. Use --execute to delete)'));
  }
  
  const deleteListPath = 'docs/audit-reports/movies-to-delete.txt';
  
  if (!fs.existsSync(deleteListPath)) {
    console.error(chalk.red(`\n  ❌ Delete list not found: ${deleteListPath}`));
    console.log(chalk.yellow('  Run: npx tsx scripts/analyze-data-quality-issues.ts first'));
    process.exit(1);
  }
  
  const movieIds = fs.readFileSync(deleteListPath, 'utf-8')
    .split('\n')
    .filter(id => id.trim());
  
  console.log(chalk.blue(`\n  Found ${movieIds.length} placeholder movies to delete\n`));
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < movieIds.length; i++) {
    const id = movieIds[i].trim();
    
    // Fetch movie info first
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, release_year')
      .eq('id', id)
      .single();
    
    if (fetchError || !movie) {
      console.log(chalk.red(`  [${i + 1}/${movieIds.length}] ❌ Not found: ${id.substring(0, 8)}...`));
      failCount++;
      continue;
    }
    
    console.log(chalk.gray(`  [${i + 1}/${movieIds.length}] "${movie.title_en}" (${movie.release_year || 'N/A'})`));
    
    if (!EXECUTE) {
      console.log(chalk.yellow(`    → Would delete`));
      successCount++;
      continue;
    }
    
    // Delete the movie
    const { error: deleteError } = await supabase
      .from('movies')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.log(chalk.red(`    ❌ Failed: ${deleteError.message}`));
      failCount++;
    } else {
      console.log(chalk.green(`    ✅ Deleted`));
      successCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║            DELETION COMPLETE                                         ║'));
  console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.gray(`  Total movies: ${movieIds.length}`));
  console.log(chalk.green(`  Successfully deleted: ${successCount}`));
  if (failCount > 0) {
    console.log(chalk.red(`  Failed: ${failCount}`));
  }
  
  if (!EXECUTE) {
    console.log(chalk.yellow(`\n  💡 This was a dry run. Use --execute to delete.`));
  } else {
    console.log(chalk.green(`\n  ✅ All placeholder movies removed from database!`));
  }
}

main().catch(console.error);
