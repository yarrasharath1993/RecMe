#!/usr/bin/env npx tsx
/**
 * CLEANUP AWARD ENTRIES
 * 
 * Removes award ceremony entries that were incorrectly added as movies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AWARD_PATTERNS = [
  'filmfare-awards',
  'nandi-awards',
  'santosham-film-awards',
  'cinemaa-awards',
  'zee-cine-awards',
  'iifa-awards',
  'screen-awards',
  'awards-ceremony',
  'raghupathi-venkaiah-award',
  'lifetime-achievement-award'
];

async function cleanupAwardEntries(execute: boolean = false) {
  console.log(chalk.cyan.bold('\n🗑️  Award Entries Cleanup Tool\n'));
  console.log(`Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}\n`);

  let totalFound = 0;
  let totalDeleted = 0;
  const toDelete: Array<{ id: string; title: string; year: number }> = [];

  // Find all award entries
  for (const pattern of AWARD_PATTERNS) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, slug, release_year')
      .ilike('slug', `%${pattern}%`)
      .order('title_en', { ascending: true });

    if (!error && data && data.length > 0) {
      console.log(chalk.yellow(`Found ${data.length} entries matching "${pattern}":`));
      data.forEach((m: any) => {
        console.log(chalk.gray(`  - ${m.title_en} (${m.release_year})`));
        toDelete.push({ id: m.id, title: m.title_en, year: m.release_year });
      });
      console.log('');
      totalFound += data.length;
    }
  }

  if (totalFound === 0) {
    console.log(chalk.green('✅ No award entries found. Database is clean!'));
    return;
  }

  console.log(chalk.yellow(`\n📊 Total award entries to delete: ${totalFound}\n`));

  if (!execute) {
    console.log(chalk.yellow('💡 Run with --execute to delete these entries\n'));
    return;
  }

  // Execute deletion
  console.log(chalk.red.bold('🗑️  Deleting entries...\n'));

  for (const entry of toDelete) {
    const { error: deleteError } = await supabase
      .from('movies')
      .delete()
      .eq('id', entry.id);

    if (deleteError) {
      console.error(chalk.red(`  ❌ Failed to delete "${entry.title}":`, deleteError.message));
    } else {
      console.log(chalk.green(`  ✅ Deleted: ${entry.title} (${entry.year})`));
      totalDeleted++;
    }
  }

  console.log(chalk.green.bold(`\n✅ Successfully deleted ${totalDeleted}/${totalFound} award entries\n`));
}

// Parse CLI arguments
const args = process.argv.slice(2);
const execute = args.includes('--execute');

cleanupAwardEntries(execute).catch(console.error);
