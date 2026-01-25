#!/usr/bin/env npx tsx
/**
 * Generate Manual Genre Classification Batches
 * 
 * Creates batches of movies needing manual genre classification:
 * 1. Movies without TMDB IDs
 * 2. Movies with TMDB IDs but no genres in TMDB
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 60;

async function getMoviesNeedingGenres() {
  // Get all movies and filter those without valid genres
  const { data: allMovies } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, director, hero, heroine, tmdb_id, genres')
    .order('release_year', { ascending: false })
    .limit(500); // Get top 500 most recent

  // Filter movies without genres or with empty genre arrays
  const movies = allMovies?.filter(m => 
    !m.genres || 
    (Array.isArray(m.genres) && m.genres.length === 0)
  ) || [];

  return movies;
}

function generateBatchContent(movies: any[], batchNum: number, totalBatches: number): string {
  const lines = [
    '═══════════════════════════════════════════════════════════════════════',
    `               BATCH ${batchNum}/${totalBatches}: MANUAL GENRE CLASSIFICATION (${movies.length} movies)`,
    '═══════════════════════════════════════════════════════════════════════',
    '',
    'Instructions:',
    '1. Research each movie using Wikipedia, IMDb, or Google',
    '2. Add genres based on movie content',
    '3. Use 1-3 genres per movie',
    '4. Mark √ when completed',
    '',
    'Common genres: Action, Drama, Romance, Comedy, Thriller, Horror,',
    '               Family, Fantasy, Historical, Mythology, Devotional',
    '',
    '═══════════════════════════════════════════════════════════════════════',
    ''
  ];

  movies.forEach((movie, i) => {
    const num = ((batchNum - 1) * BATCH_SIZE) + i + 1;
    const title = movie.title_en || movie.title_te || 'Untitled';
    const hasTmdb = movie.tmdb_id ? '✓ TMDB' : '✗ No TMDB';
    const hasDirector = movie.director ? `Dir: ${movie.director.substring(0, 30)}` : '✗ No Dir';
    const hasHero = movie.hero ? `Hero: ${movie.hero.substring(0, 25)}` : '✗ No Hero';
    
    lines.push(`${num.toString().padStart(3)}. ${title} (${movie.release_year}) [${hasTmdb}]`);
    lines.push(`     ${hasDirector} | ${hasHero}`);
    lines.push(`     http://localhost:3000/movies/${movie.slug}`);
    lines.push(`     Genres: __________________ [ ]`);
    lines.push('');
  });

  return lines.join('\n');
}

async function main() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║        GENERATING MANUAL GENRE CLASSIFICATION BATCHES                 ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('  Fetching movies without genres...\n'));

  const movies = await getMoviesNeedingGenres();

  if (movies.length === 0) {
    console.log(chalk.green('  ✅ All movies have genres!\n'));
    return;
  }

  console.log(chalk.yellow(`  ⚠️  Found ${movies.length} movies needing genre classification\n`));

  // Separate by priority
  const withoutTmdb = movies.filter(m => !m.tmdb_id);
  const withTmdbNoGenres = movies.filter(m => m.tmdb_id);

  console.log(chalk.white(`  Breakdown:`));
  console.log(chalk.red(`    ${withoutTmdb.length} movies without TMDB ID (need full research)`));
  console.log(chalk.yellow(`    ${withTmdbNoGenres.length} movies with TMDB but no genres (easier to classify)\n`));

  // Combine: prioritize movies without TMDB (harder) first
  const allMovies = [...withoutTmdb, ...withTmdbNoGenres];
  const totalBatches = Math.ceil(allMovies.length / BATCH_SIZE);

  console.log(chalk.cyan(`  Creating ${totalBatches} batches...\n`));

  // Create individual batch files
  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, allMovies.length);
    const batchMovies = allMovies.slice(start, end);
    const batchNum = i + 1;

    const content = generateBatchContent(batchMovies, batchNum, totalBatches);
    const filename = `MANUAL-GENRES-BATCH-${batchNum}.txt`;
    const filepath = resolve(process.cwd(), 'docs/manual-review', filename);

    writeFileSync(filepath, content);
    console.log(chalk.green(`  ✓ Created: ${filename} (${batchMovies.length} movies)`));
  }

  // Create master file with all batches
  const masterLines = [
    '═══════════════════════════════════════════════════════════════════════',
    `           MANUAL GENRE CLASSIFICATION - ALL BATCHES`,
    `           ${allMovies.length} movies | ${totalBatches} batches of ${BATCH_SIZE}`,
    '═══════════════════════════════════════════════════════════════════════',
    '',
    'PRIORITY ORDER:',
    `1. Movies without TMDB ID: ${withoutTmdb.length} (Batches 1-${Math.ceil(withoutTmdb.length/BATCH_SIZE)})`,
    `2. Movies with TMDB but no genres: ${withTmdbNoGenres.length}`,
    '',
    'FILES CREATED:',
    ...Array.from({length: totalBatches}, (_, i) => `  - MANUAL-GENRES-BATCH-${i+1}.txt`),
    '',
    'USAGE:',
    '1. Start with Batch 1',
    '2. Research each movie and add genres',
    '3. Mark [ ] as [√] when complete',
    '4. Move to next batch',
    '',
    'COMMON GENRES:',
    '  - Action, Drama, Romance, Comedy',
    '  - Thriller, Horror, Family, Fantasy',
    '  - Historical, Mythology, Devotional',
    '  - Crime, Mystery, Adventure, Musical',
    '',
    'RESEARCH SOURCES:',
    '  - Wikipedia (Telugu/English pages)',
    '  - IMDb',
    '  - Google search',
    '  - Movie reviews and articles',
    '',
    '═══════════════════════════════════════════════════════════════════════',
    ''
  ];

  const masterFilepath = resolve(process.cwd(), 'docs/manual-review/MANUAL-GENRES-MASTER.txt');
  writeFileSync(masterFilepath, masterLines.join('\n'));

  console.log(chalk.green(`\n  ✓ Created master file: MANUAL-GENRES-MASTER.txt`));

  // Summary
  console.log(chalk.cyan.bold(`\n╔═══════════════════════════════════════════════════════════════════════╗`));
  console.log(chalk.cyan.bold(`║                           SUMMARY                                     ║`));
  console.log(chalk.cyan.bold(`╚═══════════════════════════════════════════════════════════════════════╝\n`));

  console.log(chalk.white(`  Total movies:              ${chalk.cyan(allMovies.length)}`));
  console.log(chalk.red(`  Without TMDB ID:           ${chalk.cyan(withoutTmdb.length)} (harder)`));
  console.log(chalk.yellow(`  With TMDB, no genres:      ${chalk.cyan(withTmdbNoGenres.length)} (easier)`));
  console.log(chalk.green(`  Batches created:           ${chalk.cyan(totalBatches)}`));
  console.log(chalk.white(`  Batch size:                ${chalk.cyan(BATCH_SIZE)} movies each`));

  console.log(chalk.gray(`\n  Estimated time: ~${Math.round(allMovies.length * 2)} minutes (2 min per movie average)\n`));

  // Show first batch preview
  console.log(chalk.yellow(`  BATCH 1 PREVIEW (first 5 movies):\n`));
  allMovies.slice(0, 5).forEach((movie, i) => {
    const title = movie.title_en || movie.title_te;
    const status = movie.tmdb_id ? '✓ TMDB' : '✗ No TMDB';
    console.log(chalk.gray(`    ${i + 1}. ${title} (${movie.release_year}) [${status}]`));
  });

  console.log(chalk.cyan(`\n  Start with: docs/manual-review/MANUAL-GENRES-BATCH-1.txt\n`));
}

main();
