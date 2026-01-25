#!/usr/bin/env npx tsx
/**
 * FIX RAJINIKANTH DATA ISSUES
 * 
 * Applies fixes identified by audit-rajinikanth-filmography.ts
 * 
 * Usage:
 *   npx tsx scripts/fix-rajinikanth-data.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import chalk from 'chalk';
// Simple CSV parser
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  const records: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    records.push(record);
  }
  
  return records;
}
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Fix {
  movieId: string;
  type: string;
  currentTitle?: string;
  fixes: {
    title_en?: string;
    director?: string | null;
    language?: string;
    hero?: string;
    heroine?: string;
    producer?: string | null;
  };
  description: string;
}

// Known correct titles for problematic movies
const CORRECT_TITLES: Record<string, string> = {
  'K. Balachander': 'Achamillai Achamillai', // 1984 K. Balachander film with Rajinikanth and Jaya Prada
};

// Known correct directors for movies with wrong roles
const CORRECT_DIRECTORS: Record<string, string> = {
  'VIP 2 (Lalkar)': 'Soundarya Rajinikanth',
  'Velaiyilla Pattathari 2': 'Dhanush',
  'Kochadaiiyaan': 'Soundarya Rajinikanth',
  '3': 'Aishwarya R. Dhanush',
  'Sri Satyanarayana Mahathyam': 'K. Raghavendra Rao',
  'Sati Sulochana (Indrajeet)': 'K. Raghavendra Rao',
  'Sree Ramanjaneya Yuddham': 'K. Raghavendra Rao',
  'Chenchu Lakshmi': 'K. Raghavendra Rao',
};

async function loadFixes(): Promise<Fix[]> {
  const csvPath = path.join(process.cwd(), 'RAJINIKANTH-AUDIT-ISSUES.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(chalk.red('RAJINIKANTH-AUDIT-ISSUES.csv not found. Run audit first.'));
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  const fixes: Fix[] = [];

  for (const record of records) {
    const fix: Fix = {
      movieId: record['Movie ID'],
      type: record['Type'],
      currentTitle: record['Current Title'],
      fixes: {},
      description: record['Description'],
    };

    // Wrong title - use known correct titles
    if (record['Type'] === 'wrong_title') {
      const correctTitle = CORRECT_TITLES[record['Current Title']];
      if (correctTitle) {
        fix.fixes.title_en = correctTitle;
      }
    }

    // Wrong director
    if (record['Type'] === 'wrong_director' && record['Expected Director']) {
      fix.fixes.director = record['Expected Director'];
    }

    // Wrong language
    if (record['Type'] === 'wrong_language') {
      const title = record['Current Title'];
      if (title === 'Moondru Mudichu') fix.fixes.language = 'Tamil';
      else if (title === 'ChaalBaaz') fix.fixes.language = 'Hindi';
      else if (title === 'Mannan') fix.fixes.language = 'Tamil';
    }

    // Wrong role - remove from director/producer, add as hero
    if (record['Type'] === 'wrong_role' && record['Expected Role'] === 'Hero') {
      const title = record['Current Title'];
      const correctDirector = CORRECT_DIRECTORS[title];
      
      // Get current movie data
      const { data: movie } = await supabase
        .from('movies')
        .select('director, producer, hero, heroine')
        .eq('id', fix.movieId)
        .single();

      if (movie) {
        // Remove Rajinikanth from director if present
        if (movie.director?.toLowerCase().includes('rajinikanth')) {
          if (correctDirector) {
            fix.fixes.director = correctDirector;
          } else {
            fix.fixes.director = null; // Will need manual identification
          }
        }
        // Remove from producer if present
        if (movie.producer?.toLowerCase().includes('rajinikanth')) {
          fix.fixes.producer = null;
        }
        // Add as hero if not already
        if (!movie.hero?.toLowerCase().includes('rajinikanth')) {
          if (movie.hero && movie.hero.toLowerCase() !== 'rajinikanth') {
            fix.fixes.hero = movie.hero + ', Rajinikanth';
          } else {
            fix.fixes.hero = 'Rajinikanth';
          }
        }
      }
    }

    if (Object.keys(fix.fixes).length > 0) {
      fixes.push(fix);
    }
  }

  return fixes;
}

async function applyFixes(execute: boolean = false): Promise<void> {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  FIXING RAJINIKANTH DATA ISSUES'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  if (!execute) {
    console.log(chalk.yellow('⚠️  Dry run mode - no changes will be made'));
    console.log(chalk.yellow('   Use --execute flag to apply fixes\n'));
  }

  const fixes = await loadFixes();
  console.log(chalk.yellow('Loaded ' + fixes.length + ' fixes to apply\n'));

  let fixedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const fix of fixes) {
    // Skip fixes that require manual identification (director is null)
    if (fix.fixes.director === null && fix.type === 'wrong_role') {
      console.log(chalk.yellow('⏭️  Skipping "' + (fix.currentTitle || 'Unknown') + '" - director needs manual identification'));
      skippedCount++;
      continue;
    }

    console.log(chalk.cyan('\nFixing: ' + (fix.currentTitle || fix.movieId)));
    console.log(chalk.gray('  Type: ' + fix.type));
    console.log(chalk.gray('  Description: ' + fix.description));
    console.log(chalk.gray('  Changes: ' + JSON.stringify(fix.fixes, null, 2)));

    if (execute) {
      const { error } = await supabase
        .from('movies')
        .update(fix.fixes)
        .eq('id', fix.movieId);

      if (error) {
        console.error(chalk.red('  ❌ Error: ' + error.message));
        errorCount++;
      } else {
        console.log(chalk.green('  ✅ Fixed'));
        fixedCount++;
      }
    } else {
      console.log(chalk.gray('  [DRY RUN] Would apply: ' + JSON.stringify(fix.fixes)));
    }
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  if (execute) {
    console.log(chalk.green('✅ Fixed: ' + fixedCount));
    if (errorCount > 0) {
      console.log(chalk.red('❌ Errors: ' + errorCount));
    }
    if (skippedCount > 0) {
      console.log(chalk.yellow('⏭️  Skipped (needs manual review): ' + skippedCount));
    }
  } else {
    console.log(chalk.yellow('Would fix: ' + fixedCount));
    console.log(chalk.yellow('Would skip: ' + skippedCount));
    console.log(chalk.yellow('\n💡 Run with --execute to apply fixes'));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  await applyFixes(execute);
  console.log(chalk.green.bold('\n✨ Done!\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
