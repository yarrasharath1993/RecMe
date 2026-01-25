#!/usr/bin/env npx tsx
/**
 * ADD MISSING RAJINIKANTH MOVIES
 * 
 * 1. Deletes the incorrect "K. Balachander" (1984) movie
 * 2. Adds all missing Rajinikanth movies from Wikipedia filmography
 * 
 * Usage:
 *   npx tsx scripts/add-rajinikanth-missing-movies.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import { slugifyWithYear } from '../lib/utils/slugify';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple CSV parser
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  const records: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
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
    
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = (values[idx] || '').replace(/^"|"$/g, '');
    });
    records.push(record);
  }
  
  return records;
}

async function deleteKBalachanderMovie(): Promise<boolean> {
  console.log(chalk.cyan('\n🗑️  Deleting incorrect "K. Balachander" (1984) movie...'));
  
  const { data: movie, error: findError } = await supabase
    .from('movies')
    .select('id, title_en, release_year')
    .eq('title_en', 'K. Balachander')
    .eq('release_year', 1984)
    .single();

  if (findError || !movie) {
    console.log(chalk.yellow('  ⚠️  Movie not found or already deleted'));
    return false;
  }

  console.log(chalk.gray(`  Found: ${movie.title_en} (${movie.release_year})`));

  // Delete associated records first (if any)
  // Then delete the movie
  const { error: deleteError } = await supabase
    .from('movies')
    .delete()
    .eq('id', movie.id);

  if (deleteError) {
    console.error(chalk.red(`  ❌ Error deleting: ${deleteError.message}`));
    return false;
  }

  console.log(chalk.green('  ✅ Deleted successfully'));
  return true;
}

async function addMissingMovies(execute: boolean = false): Promise<void> {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  ADDING MISSING RAJINIKANTH MOVIES'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  if (!execute) {
    console.log(chalk.yellow('⚠️  Dry run mode - no changes will be made'));
    console.log(chalk.yellow('   Use --execute flag to add movies\n'));
  }

  // Load missing movies from CSV
  const csvPath = path.join(process.cwd(), 'RAJINIKANTH-MISSING-MOVIES.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(chalk.red('RAJINIKANTH-MISSING-MOVIES.csv not found.'));
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const missingMovies = parseCSV(csvContent);

  console.log(chalk.yellow(`Loaded ${missingMovies.length} missing movies from CSV\n`));

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const movie of missingMovies) {
    const title = movie.Title;
    const year = parseInt(movie.Year, 10);
    const director = movie.Director;
    const language = movie.Language;

    if (!title || !year || !director || !language) {
      console.log(chalk.yellow(`⏭️  Skipping incomplete entry: ${title || 'Unknown'}`));
      skippedCount++;
      continue;
    }

    const slug = slugifyWithYear(title, year);

    // Check if movie already exists
    const { data: existing } = await supabase
      .from('movies')
      .select('id, title_en, hero')
      .eq('slug', slug)
      .single();

    if (existing) {
      // Check if Rajinikanth is already in hero field
      const hasRajini = existing.hero?.toLowerCase().includes('rajinikanth');
      
      if (hasRajini) {
        console.log(chalk.gray(`⏭️  Already exists: ${title} (${year})`));
        skippedCount++;
        continue;
      } else {
        // Update to add Rajinikanth as hero
        if (execute) {
          const currentHero = existing.hero || '';
          const updatedHero = currentHero ? `${currentHero}, Rajinikanth` : 'Rajinikanth';
          
          const { error: updateError } = await supabase
            .from('movies')
            .update({ hero: updatedHero })
            .eq('id', existing.id);

          if (updateError) {
            console.error(chalk.red(`  ❌ Error updating ${title}: ${updateError.message}`));
            errorCount++;
          } else {
            console.log(chalk.green(`  ✅ Updated: ${title} (${year}) - Added Rajinikanth as hero`));
            updatedCount++;
          }
        } else {
          console.log(chalk.gray(`  [DRY RUN] Would update: ${title} (${year}) - Add Rajinikanth as hero`));
          updatedCount++;
        }
        continue;
      }
    }

    // Prepare movie data
    const movieData: any = {
      title_en: title,
      slug: slug,
      release_year: year,
      director: director,
      language: language,
      hero: 'Rajinikanth',
      is_published: true, // Publish these as they're from Wikipedia
    };

    // Special handling for movies where Rajinikanth is director/writer/producer
    if (title === 'Valli') {
      movieData.director = 'Rajinikanth';
      movieData.hero = 'Rajinikanth';
      // Note: Also writer, but we don't have a writer field
    }

    if (title === 'Baba') {
      movieData.director = 'Suresh Krissna';
      movieData.hero = 'Rajinikanth';
      movieData.producer = 'Rajinikanth';
      // Note: Also writer
    }

    console.log(chalk.cyan(`\nAdding: ${title} (${year})`));
    console.log(chalk.gray(`  Director: ${director}`));
    console.log(chalk.gray(`  Language: ${language}`));
    console.log(chalk.gray(`  Slug: ${slug}`));

    if (execute) {
      const { error: insertError } = await supabase
        .from('movies')
        .insert(movieData);

      if (insertError) {
        console.error(chalk.red(`  ❌ Error: ${insertError.message}`));
        errorCount++;
      } else {
        console.log(chalk.green(`  ✅ Added successfully`));
        addedCount++;
      }
    } else {
      console.log(chalk.gray(`  [DRY RUN] Would add: ${JSON.stringify(movieData, null, 2)}`));
      addedCount++;
    }
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  if (execute) {
    console.log(chalk.green(`✅ Added: ${addedCount}`));
    console.log(chalk.green(`✅ Updated: ${updatedCount}`));
    if (skippedCount > 0) {
      console.log(chalk.yellow(`⏭️  Skipped: ${skippedCount}`));
    }
    if (errorCount > 0) {
      console.log(chalk.red(`❌ Errors: ${errorCount}`));
    }
  } else {
    console.log(chalk.yellow(`Would add: ${addedCount}`));
    console.log(chalk.yellow(`Would update: ${updatedCount}`));
    console.log(chalk.yellow(`Would skip: ${skippedCount}`));
    console.log(chalk.yellow(`\n💡 Run with --execute to apply changes`));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  // Step 1: Delete the incorrect "K. Balachander" movie
  if (execute) {
    await deleteKBalachanderMovie();
  } else {
    console.log(chalk.yellow('\n⚠️  Dry run - would delete "K. Balachander" (1984)'));
  }

  // Step 2: Add missing movies
  await addMissingMovies(execute);

  console.log(chalk.green.bold('\n✨ Done!\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
