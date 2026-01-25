#!/usr/bin/env npx tsx
/**
 * Import Box Office Ratings from CSV after Manual Review
 * 
 * Applies manual corrections from reviewed CSV file.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const args = process.argv.slice(2);
const getArg = (name: string): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : '';
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const CSV_FILE = getArg('file') || 'box-office-ratings-reviewed.csv';
const EXECUTE = hasFlag('execute');

function parseCSV(content: string): any[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const row: any = {};
      headers.forEach((header, i) => {
        const cleanHeader = header.trim().replace(/^"|"$/g, '');
        const value = values[i]?.replace(/^"|"$/g, '') || '';
        row[cleanHeader] = value;
      });
      
      return row;
    });
}

async function importFromCSV() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           IMPORT BOX OFFICE RATINGS FROM CSV                        ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(`Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}\n`);

  // Read CSV file
  let content: string;
  try {
    content = readFileSync(CSV_FILE, 'utf-8');
    console.log(chalk.green(`✅ Loaded CSV file: ${CSV_FILE}\n`));
  } catch (error) {
    console.log(chalk.red(`❌ Error reading file: ${CSV_FILE}`));
    console.log(chalk.yellow('\nUsage:'));
    console.log('  npx tsx scripts/import-box-office-ratings-csv.ts --file=your-reviewed.csv');
    console.log('  npx tsx scripts/import-box-office-ratings-csv.ts --file=your-reviewed.csv --execute');
    return;
  }

  const rows = parseCSV(content);
  console.log(`Found ${chalk.cyan(rows.length)} rows\n`);

  // Filter rows with suggested ratings
  const updates = rows.filter(row => {
    const suggested = parseFloat(row['Suggested Rating']);
    return !isNaN(suggested) && suggested > 0;
  });

  console.log(`Movies with suggested ratings: ${chalk.cyan(updates.length)}\n`);

  if (updates.length === 0) {
    console.log(chalk.yellow('No updates found. Make sure "Suggested Rating" column is filled.\n'));
    return;
  }

  // Preview changes
  console.log(chalk.bold('═══ CHANGES TO BE APPLIED ═══\n'));

  let applied = 0;
  let errors = 0;

  for (const row of updates) {
    const slug = row['Slug'];
    const currentRating = parseFloat(row['Current Rating']);
    const suggestedRating = parseFloat(row['Suggested Rating']);
    const notes = row['Notes'];

    if (!slug) continue;

    const difference = Math.abs(suggestedRating - currentRating);
    const color = difference >= 1.0 ? chalk.red : difference >= 0.5 ? chalk.yellow : chalk.green;

    console.log(`${row['Title (English)']} (${row['Release Year']})`);
    console.log(`  Category: ${chalk.cyan(row['Box Office Category'])}`);
    console.log(`  Current: ${currentRating} → Suggested: ${color(suggestedRating)} (diff: ${color(difference.toFixed(1))})`);
    if (notes) {
      console.log(`  Notes: ${chalk.gray(notes)}`);
    }

    if (EXECUTE) {
      // Update movie rating
      const { error: movieError } = await supabase
        .from('movies')
        .update({ our_rating: suggestedRating })
        .eq('slug', slug);

      if (movieError) {
        console.log(chalk.red(`  ✗ Error updating movie: ${movieError.message}`));
        errors++;
        continue;
      }

      // Update review rating if exists
      const { data: movie } = await supabase
        .from('movies')
        .select('id')
        .eq('slug', slug)
        .single();

      if (movie) {
        const { error: reviewError } = await supabase
          .from('movie_reviews')
          .update({ overall_rating: suggestedRating })
          .eq('movie_id', movie.id);

        if (reviewError) {
          console.log(chalk.yellow(`  ⚠ Warning: Could not update review`));
        }
      }

      console.log(chalk.green(`  ✓ Updated successfully`));
      applied++;
    } else {
      console.log(chalk.yellow(`  ○ Would update (use --execute to apply)`));
    }

    console.log('');
  }

  console.log(chalk.bold('\n═══ SUMMARY ═══'));
  console.log(`To be updated: ${chalk.cyan(updates.length)}`);
  if (EXECUTE) {
    console.log(`Successfully applied: ${chalk.green(applied)}`);
    console.log(`Errors: ${errors > 0 ? chalk.red(errors) : chalk.green(0)}`);
  }

  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - Use --execute to apply changes'));
  } else {
    console.log(chalk.green('\n✅ All changes applied successfully!'));
  }
}

importFromCSV().catch(console.error);
