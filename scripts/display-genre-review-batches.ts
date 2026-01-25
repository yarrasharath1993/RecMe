#!/usr/bin/env npx tsx
/**
 * Display Manual Genre Review in Batches
 * 
 * Shows movies needing genre classification in manageable batches
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

const BATCH_SIZE = 200;

interface MovieEntry {
  number: number;
  title: string;
  year: string;
  director: string;
  hasTmdb: boolean;
  url: string;
}

function parseManualReviewFile(): MovieEntry[] {
  const filePath = resolve(process.cwd(), 'docs/manual-review/MANUAL-GENRE-CLASSIFICATION.txt');
  const content = readFileSync(filePath, 'utf-8');
  
  const movies: MovieEntry[] = [];
  const lines = content.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for numbered entries like "  1. Title (Year) [Status]"
    const match = line.match(/^\s*(\d+)\.\s+(.+?)\s+\((\d{4})\)\s+\[(.+?)\]/);
    
    if (match) {
      const number = parseInt(match[1]);
      const title = match[2];
      const year = match[3];
      const tmdbStatus = match[4];
      const hasTmdb = tmdbStatus.includes('✓ TMDB');
      
      // Next line should have director info
      i++;
      const dirLine = lines[i]?.trim() || '';
      const dirMatch = dirLine.match(/Dir:\s+(.+)/);
      const director = dirMatch ? dirMatch[1] : '✗ No Director';
      
      // Next line should have URL
      i++;
      const urlLine = lines[i]?.trim() || '';
      const url = urlLine.replace('http://localhost:3000/movies/', '');
      
      movies.push({
        number,
        title,
        year,
        director,
        hasTmdb,
        url: urlLine
      });
    }
    
    i++;
  }
  
  return movies;
}

function displayBatch(movies: MovieEntry[], batchNum: number, totalBatches: number) {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           BATCH ${batchNum}/${totalBatches}: GENRE CLASSIFICATION (${movies.length} movies)           ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.gray('Instructions: Research each movie and add genres (Action, Drama, Romance, etc.)\n'));

  movies.forEach((movie) => {
    const tmdbIcon = movie.hasTmdb ? chalk.green('✓ TMDB') : chalk.red('✗ No TMDB');
    
    console.log(chalk.white(`${movie.number.toString().padStart(4)}. ${chalk.cyan(movie.title)} ${chalk.gray(`(${movie.year})`)}`));
    console.log(chalk.gray(`      ${tmdbIcon} | Dir: ${movie.director}`));
    console.log(chalk.gray(`      ${movie.url}`));
    console.log(chalk.yellow(`      Genres: __________________ [ ]\n`));
  });

  console.log(chalk.blue.bold(`═══════════════════════════════════════════════════════════════════════\n`));
}

function displaySummary(movies: MovieEntry[], totalBatches: number) {
  const withTmdb = movies.filter(m => m.hasTmdb).length;
  const withoutTmdb = movies.filter(m => !m.hasTmdb).length;
  const withoutDirector = movies.filter(m => m.director === '✗ No Director').length;

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                         SUMMARY                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white(`  Total movies:              ${chalk.cyan(movies.length)}`));
  console.log(chalk.green(`  With TMDB ID:              ${chalk.cyan(withTmdb)} (${Math.round((withTmdb/movies.length)*100)}%)`));
  console.log(chalk.red(`  Without TMDB ID:           ${chalk.cyan(withoutTmdb)} (${Math.round((withoutTmdb/movies.length)*100)}%)`));
  console.log(chalk.yellow(`  Missing director:          ${chalk.cyan(withoutDirector)}`));
  console.log(chalk.white(`  Total batches:             ${chalk.cyan(totalBatches)} (${BATCH_SIZE} each)\n`));

  console.log(chalk.gray(`  Common genres to use:`));
  console.log(chalk.gray(`    Action, Drama, Romance, Comedy, Thriller, Horror`));
  console.log(chalk.gray(`    Family, Fantasy, Historical, Mythology, Devotional`));
  console.log(chalk.gray(`    Crime, Mystery, Adventure, Musical\n`));
}

async function main() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║        MANUAL GENRE CLASSIFICATION - BATCH DISPLAY                    ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('  Reading manual review file...\n'));

  const movies = parseManualReviewFile();
  const totalBatches = Math.ceil(movies.length / BATCH_SIZE);

  const args = process.argv.slice(2);
  const batchArg = args.find(a => a.startsWith('--batch='));
  const showSummary = args.includes('--summary');

  if (showSummary || (!batchArg && args.length === 0)) {
    displaySummary(movies, totalBatches);
    if (showSummary) return;
  }

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
    
    console.log(chalk.cyan(`  💡 Next batch: npx tsx scripts/display-genre-review-batches.ts --batch=${batchNum + 1}\n`));
  } else {
    console.log(chalk.yellow(`  Usage:\n`));
    console.log(chalk.white(`    Show summary:        npx tsx scripts/display-genre-review-batches.ts --summary`));
    console.log(chalk.white(`    Show specific batch: npx tsx scripts/display-genre-review-batches.ts --batch=N`));
    console.log(chalk.white(`    Show all batches:    npx tsx scripts/display-genre-review-batches.ts --all\n`));
    
    if (args.includes('--all')) {
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, movies.length);
        const batchMovies = movies.slice(start, end);
        displayBatch(batchMovies, i + 1, totalBatches);
      }
    }
  }
}

main();
