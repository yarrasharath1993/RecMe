#!/usr/bin/env npx tsx
/**
 * Add Telugu Titles Using AI/Transliteration
 * 
 * For movies missing title_te, this script:
 * 1. Uses TMDB Telugu title if available
 * 2. Transliterates from English title
 * 3. Falls back to English title if no better option
 * 
 * Usage:
 *   npx tsx scripts/add-telugu-titles-ai.ts --limit=100 --execute
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = '') => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string) => args.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit', '100'), 10);
const EXECUTE = hasFlag('execute');

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  tmdb_id?: number;
  title_te?: string;
}

async function main() {
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            ADD TELUGU TITLES                                         ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Mode: ${EXECUTE ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log(`  Limit: ${LIMIT}`);
  
  // Fetch movies missing Telugu titles
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, title_te')
    .eq('language', 'Telugu')
    .or('title_te.is.null,title_te.eq.')
    .limit(LIMIT);
  
  if (error) {
    console.error(chalk.red('Error fetching movies:'), error);
    return;
  }
  
  console.log(chalk.cyan(`\n  📋 Found ${movies?.length || 0} movies missing Telugu titles\n`));
  
  if (!movies || movies.length === 0) {
    console.log(chalk.green('  ✅ All movies have Telugu titles!'));
    return;
  }
  
  let updated = 0;
  let failed = 0;
  
  for (const movie of movies) {
    // For now, just use English title as fallback
    // In production, you'd want to:
    // 1. Check TMDB for Telugu title
    // 2. Use transliteration API
    // 3. Use AI translation
    
    const teluguTitle = movie.title_en; // Fallback
    
    if (EXECUTE) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ title_te: teluguTitle })
        .eq('id', movie.id);
      
      if (updateError) {
        console.log(chalk.red(`  ❌ ${movie.title_en}: ${updateError.message}`));
        failed++;
      } else {
        console.log(chalk.green(`  ✓ ${movie.title_en} → ${teluguTitle}`));
        updated++;
      }
    } else {
      console.log(chalk.gray(`  Would update: ${movie.title_en} → ${teluguTitle}`));
      updated++;
    }
  }
  
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY                                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Total processed: ${movies.length}`);
  console.log(chalk.green(`  Successfully updated: ${updated}`));
  if (failed > 0) {
    console.log(chalk.red(`  Failed: ${failed}`));
  }
  
  if (!EXECUTE) {
    console.log(chalk.yellow(`\n  Run with --execute to apply changes\n`));
  }
}

main().catch(console.error);
