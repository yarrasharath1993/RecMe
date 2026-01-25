#!/usr/bin/env npx tsx
/**
 * Handle Final Duplicates
 * 
 * 1. Check Baahubali duplicates
 * 2. Check Akasha Ramanna vs Aakasa Ramanna
 * 3. Delete lower-quality duplicates
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

function calculateDataQuality(movie: any): number {
  let score = 0;
  
  if (movie.tmdb_id) score += 15;
  if (movie.imdb_id) score += 15;
  if (movie.director) score += 10;
  if (movie.hero) score += 10;
  if (movie.heroine) score += 10;
  if (movie.genres && movie.genres.length > 0) score += 10;
  if (movie.poster_url) score += 10;
  if (movie.backdrop_url) score += 5;
  if (movie.runtime_minutes) score += 5;
  if (movie.avg_rating) score += 5;
  if (movie.cast_members && movie.cast_members.length > 0) score += 5;
  
  return score;
}

async function findAndHandleDuplicates(execute: boolean) {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║               HANDLE FINAL DUPLICATES                                 ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}\n`);

  const deletedMovies: any[] = [];

  // 1. Check Baahubali duplicates
  console.log(chalk.cyan.bold('  1. Checking Baahubali Duplicates...\n'));

  const { data: baahubali2 } = await supabase
    .from('movies')
    .select('*')
    .ilike('title_en', '%Bāhubali 2%')
    .eq('release_year', 2017);

  if (baahubali2 && baahubali2.length > 1) {
    console.log(chalk.yellow(`     Found ${baahubali2.length} entries for Bāhubali 2: The Conclusion (2017)\n`));
    
    baahubali2.forEach((m, i) => {
      const quality = calculateDataQuality(m);
      console.log(chalk.gray(`     ${i + 1}. ${m.title_en}`));
      console.log(chalk.gray(`        Slug: ${m.slug}`));
      console.log(chalk.gray(`        Quality Score: ${quality}/100`));
      console.log(chalk.gray(`        TMDB ID: ${m.tmdb_id || 'null'}`));
      console.log(chalk.gray(`        Director: ${m.director || 'null'}`));
      console.log(chalk.gray(`        Published: ${m.is_published ? 'Yes' : 'No'}\n`));
    });

    // Find best and worst
    const sorted = [...baahubali2].sort((a, b) => calculateDataQuality(b) - calculateDataQuality(a));
    const keep = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(chalk.green(`     ✓ Keep: ${keep.title_en} (${keep.slug}) - Quality: ${calculateDataQuality(keep)}/100`));
    
    for (const movie of toDelete) {
      console.log(chalk.red(`     ✗ Delete: ${movie.title_en} (${movie.slug}) - Quality: ${calculateDataQuality(movie)}/100`));
      
      if (execute) {
        const { error } = await supabase
          .from('movies')
          .delete()
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`       ❌ Delete failed: ${error.message}`));
        } else {
          console.log(chalk.green(`       ✅ Deleted!`));
          deletedMovies.push({
            title: movie.title_en,
            year: movie.release_year,
            slug: movie.slug,
            reason: 'Duplicate - lower quality',
            quality: calculateDataQuality(movie),
          });
        }
      }
    }
    console.log();
  } else {
    console.log(chalk.green(`     ✓ No duplicates found (${baahubali2?.length || 0} entry)\n`));
  }

  const { data: baahubali1 } = await supabase
    .from('movies')
    .select('*')
    .ilike('title_en', '%Bāhubali%Beginning%')
    .eq('release_year', 2015);

  if (baahubali1 && baahubali1.length > 1) {
    console.log(chalk.yellow(`     Found ${baahubali1.length} entries for Bāhubali: The Beginning (2015)\n`));
    
    baahubali1.forEach((m, i) => {
      const quality = calculateDataQuality(m);
      console.log(chalk.gray(`     ${i + 1}. ${m.title_en}`));
      console.log(chalk.gray(`        Slug: ${m.slug}`));
      console.log(chalk.gray(`        Quality Score: ${quality}/100`));
      console.log(chalk.gray(`        TMDB ID: ${m.tmdb_id || 'null'}`));
      console.log(chalk.gray(`        Director: ${m.director || 'null'}`));
      console.log(chalk.gray(`        Published: ${m.is_published ? 'Yes' : 'No'}\n`));
    });

    const sorted = [...baahubali1].sort((a, b) => calculateDataQuality(b) - calculateDataQuality(a));
    const keep = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(chalk.green(`     ✓ Keep: ${keep.title_en} (${keep.slug}) - Quality: ${calculateDataQuality(keep)}/100`));
    
    for (const movie of toDelete) {
      console.log(chalk.red(`     ✗ Delete: ${movie.title_en} (${movie.slug}) - Quality: ${calculateDataQuality(movie)}/100`));
      
      if (execute) {
        const { error } = await supabase
          .from('movies')
          .delete()
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`       ❌ Delete failed: ${error.message}`));
        } else {
          console.log(chalk.green(`       ✅ Deleted!`));
          deletedMovies.push({
            title: movie.title_en,
            year: movie.release_year,
            slug: movie.slug,
            reason: 'Duplicate - lower quality',
            quality: calculateDataQuality(movie),
          });
        }
      }
    }
    console.log();
  } else {
    console.log(chalk.green(`     ✓ No duplicates found (${baahubali1?.length || 0} entry)\n`));
  }

  // 2. Check Akasha Ramanna vs Aakasa Ramanna
  console.log(chalk.cyan.bold('  2. Checking Akasha Ramanna / Aakasa Ramanna Duplicates...\n'));

  const { data: ramanna } = await supabase
    .from('movies')
    .select('*')
    .or('title_en.ilike.%Akasha Ramanna%,title_en.ilike.%Aakasa Ramanna%');

  if (ramanna && ramanna.length > 1) {
    console.log(chalk.yellow(`     Found ${ramanna.length} entries\n`));
    
    ramanna.forEach((m, i) => {
      const quality = calculateDataQuality(m);
      console.log(chalk.gray(`     ${i + 1}. ${m.title_en} (${m.release_year})`));
      console.log(chalk.gray(`        Slug: ${m.slug}`));
      console.log(chalk.gray(`        Quality Score: ${quality}/100`));
      console.log(chalk.gray(`        TMDB ID: ${m.tmdb_id || 'null'}`));
      console.log(chalk.gray(`        Director: ${m.director || 'null'}`));
      console.log(chalk.gray(`        Published: ${m.is_published ? 'Yes' : 'No'}\n`));
    });

    const sorted = [...ramanna].sort((a, b) => calculateDataQuality(b) - calculateDataQuality(a));
    const keep = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(chalk.green(`     ✓ Keep: ${keep.title_en} (${keep.slug}) - Quality: ${calculateDataQuality(keep)}/100`));
    
    for (const movie of toDelete) {
      console.log(chalk.red(`     ✗ Delete: ${movie.title_en} (${movie.slug}) - Quality: ${calculateDataQuality(movie)}/100`));
      
      if (execute) {
        const { error } = await supabase
          .from('movies')
          .delete()
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`       ❌ Delete failed: ${error.message}`));
        } else {
          console.log(chalk.green(`       ✅ Deleted!`));
          deletedMovies.push({
            title: movie.title_en,
            year: movie.release_year,
            slug: movie.slug,
            reason: 'Duplicate - spelling variation',
            quality: calculateDataQuality(movie),
          });
        }
      }
    }
    console.log();
  } else {
    console.log(chalk.green(`     ✓ No duplicates found (${ramanna?.length || 0} entry)\n`));
  }

  // Summary
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                           SUMMARY                                     ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  if (deletedMovies.length > 0) {
    console.log(chalk.cyan.bold('  🗑️  DELETED MOVIES:\n'));
    deletedMovies.forEach((m, i) => {
      console.log(chalk.red(`  ${i + 1}. ${m.title} (${m.year})`));
      console.log(chalk.gray(`     Slug: ${m.slug}`));
      console.log(chalk.gray(`     Reason: ${m.reason}`));
      console.log(chalk.gray(`     Quality Score: ${m.quality}/100\n`));
    });
  } else {
    console.log(chalk.yellow('  No duplicates found or no deletions performed\n'));
  }

  console.log(chalk.blue(`  Total Deleted: ${deletedMovies.length}\n`));

  if (!execute && deletedMovies.length === 0) {
    console.log(chalk.yellow(`  Run with --execute to apply deletions\n`));
  }

  return deletedMovies;
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  await findAndHandleDuplicates(execute);
}

main().catch(console.error);
