#!/usr/bin/env npx tsx
/**
 * Display Movies Needing Genres in Batches
 * 
 * Shows 60 movies at a time for manual genre classification
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

const BATCH_SIZE = 60;

interface Movie {
  year: string;
  title: string;
  director: string;
  hero: string;
  heroine: string;
  tmdb_id: string;
  status: string;
  url: string;
}

function parseCSV(csvPath: string): Movie[] {
  const content = readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    // Simple CSV parser (handles quoted fields)
    const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const fields = matches.map(f => f.replace(/^"|"$/g, '').trim());
    
    return {
      year: fields[0] || '',
      title: fields[1] || '',
      director: fields[2] || '',
      hero: fields[3] || '',
      heroine: fields[4] || '',
      tmdb_id: fields[5] || '',
      status: fields[6] || '',
      url: fields[7] || ''
    };
  }).filter(m => m.title); // Filter out empty rows
}

function displayBatch(movies: Movie[], batchNum: number, totalBatches: number) {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              BATCH ${batchNum}/${totalBatches} - MOVIES NEEDING GENRES (${movies.length} movies)              ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  movies.forEach((movie, i) => {
    const num = ((batchNum - 1) * BATCH_SIZE) + i + 1;
    
    // Status indicator
    const hasDirector = movie.director && movie.director !== '';
    const hasHero = movie.hero && movie.hero !== '';
    const hasTmdb = movie.tmdb_id && movie.tmdb_id !== '';
    
    const statusIcon = hasTmdb ? chalk.yellow('🔗') : chalk.red('❌');
    
    console.log(chalk.white(`\n  ${num.toString().padStart(3)}. ${movie.title} ${chalk.gray(`(${movie.year})`)} ${statusIcon}`));
    
    // Show what data is available/missing
    const dataStatus = [];
    if (hasDirector) dataStatus.push(chalk.green(`Dir: ${movie.director.substring(0, 20)}`));
    else dataStatus.push(chalk.red('No Director'));
    
    if (hasHero) dataStatus.push(chalk.green(`Hero: ${movie.hero.substring(0, 20)}`));
    else dataStatus.push(chalk.red('No Hero'));
    
    if (hasTmdb) dataStatus.push(chalk.yellow(`TMDB: ${movie.tmdb_id}`));
    else dataStatus.push(chalk.red('No TMDB'));
    
    console.log(chalk.gray(`       ${dataStatus.join(' | ')}`));
    console.log(chalk.gray(`       ${movie.url}`));
  });

  console.log(chalk.blue.bold(`\n═══════════════════════════════════════════════════════════════════════\n`));
}

function main() {
  const csvPath = resolve(process.cwd(), 'docs/manual-review/MOVIES-NEEDING-GENRES.csv');
  
  console.log(chalk.cyan('  Loading movies from CSV...\n'));
  
  const movies = parseCSV(csvPath);
  const totalBatches = Math.ceil(movies.length / BATCH_SIZE);
  
  console.log(chalk.green(`  ✓ Loaded ${movies.length} movies\n`));
  console.log(chalk.cyan(`  Divided into ${totalBatches} batches of ${BATCH_SIZE} movies each\n`));
  
  // Show batch selection
  const args = process.argv.slice(2);
  const batchArg = args.find(a => a.startsWith('--batch='));
  
  if (batchArg) {
    const batchNum = parseInt(batchArg.split('=')[1]);
    if (batchNum < 1 || batchNum > totalBatches) {
      console.log(chalk.red(`  ❌ Invalid batch number. Must be 1-${totalBatches}\n`));
      return;
    }
    
    const start = (batchNum - 1) * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, movies.length);
    const batchMovies = movies.slice(start, end);
    
    displayBatch(batchMovies, batchNum, totalBatches);
  } else {
    // Show all batches
    console.log(chalk.yellow(`  💡 Tip: Use --batch=N to view a specific batch (1-${totalBatches})\n`));
    console.log(chalk.gray(`  Showing all batches...\n`));
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, movies.length);
      const batchMovies = movies.slice(start, end);
      
      displayBatch(batchMovies, i + 1, totalBatches);
      
      // Pause between batches (except last one)
      if (i < totalBatches - 1) {
        console.log(chalk.gray(`  Press Enter to continue to next batch...\n`));
      }
    }
  }
  
  // Summary by category
  console.log(chalk.cyan.bold('  SUMMARY BY CATEGORY:\n'));
  
  const withTmdb = movies.filter(m => m.tmdb_id).length;
  const withoutTmdb = movies.filter(m => !m.tmdb_id).length;
  const withDirector = movies.filter(m => m.director).length;
  const withHero = movies.filter(m => m.hero).length;
  
  console.log(chalk.yellow(`    Has TMDB ID:      ${withTmdb} movies (can enrich from TMDB)`));
  console.log(chalk.red(`    No TMDB ID:       ${withoutTmdb} movies (need manual research)`));
  console.log(chalk.green(`    Has Director:     ${withDirector} movies`));
  console.log(chalk.green(`    Has Hero:         ${withHero} movies`));
  
  console.log(chalk.gray(`\n  To view specific batch: npx tsx scripts/display-genres-batches.ts --batch=1\n`));
}

main();
