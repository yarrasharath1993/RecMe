#!/usr/bin/env npx tsx
/**
 * Display Movies with TMDB IDs (Auto-enrichable)
 * 
 * Shows the 159 movies that have TMDB IDs and can be automatically enriched
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

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
  }).filter(m => {
    // Only movies with valid numeric TMDB IDs
    const hasTmdbId = m.tmdb_id && m.tmdb_id !== '' && m.tmdb_id !== 'No TMDB ID' && !isNaN(parseInt(m.tmdb_id));
    return m.title && hasTmdbId;
  });
}

function displayMovies(movies: Movie[]) {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║        ${movies.length} MOVIES WITH TMDB IDs - AUTO-ENRICHABLE                    ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('  These movies can be automatically enriched from TMDB\n'));

  // Group by decade
  const byDecade = new Map<string, Movie[]>();
  movies.forEach(movie => {
    const year = parseInt(movie.year);
    const decade = Math.floor(year / 10) * 10;
    const key = `${decade}s`;
    if (!byDecade.has(key)) {
      byDecade.set(key, []);
    }
    byDecade.get(key)!.push(movie);
  });

  // Sort decades descending
  const sortedDecades = Array.from(byDecade.keys()).sort((a, b) => {
    return parseInt(b) - parseInt(a);
  });

  sortedDecades.forEach(decade => {
    const decadeMovies = byDecade.get(decade)!;
    console.log(chalk.yellow.bold(`\n  ═══ ${decade} (${decadeMovies.length} movies) ═══\n`));

    decadeMovies
      .sort((a, b) => parseInt(b.year) - parseInt(a.year))
      .forEach((movie, i) => {
        const hasDirector = movie.director && movie.director !== '';
        const hasHero = movie.hero && movie.hero !== '';
        
        console.log(chalk.white(`  ${movie.year} | ${movie.title}`));
        console.log(chalk.gray(`         TMDB: ${chalk.cyan(movie.tmdb_id)} | ${hasDirector ? chalk.green('✓ Dir') : chalk.red('✗ Dir')} | ${hasHero ? chalk.green('✓ Hero') : chalk.red('✗ Hero')}`));
        if (movie.url) {
          console.log(chalk.gray(`         ${movie.url}`));
        }
        console.log();
      });
  });

  // Summary
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════\n'));
  console.log(chalk.cyan.bold('  ENRICHMENT SUMMARY:\n'));
  
  const withDirector = movies.filter(m => m.director && m.director !== '').length;
  const withHero = movies.filter(m => m.hero && m.hero !== '').length;
  const withHeroine = movies.filter(m => m.heroine && m.heroine !== '').length;
  
  console.log(chalk.green(`  ✓ Total movies:       ${movies.length}`));
  console.log(chalk.green(`  ✓ Have director:      ${withDirector} (${Math.round(withDirector/movies.length*100)}%)`));
  console.log(chalk.green(`  ✓ Have hero:          ${withHero} (${Math.round(withHero/movies.length*100)}%)`));
  console.log(chalk.green(`  ✓ Have heroine:       ${withHeroine} (${Math.round(withHeroine/movies.length*100)}%)`));
  
  console.log(chalk.yellow(`\n  🚀 Ready to auto-enrich genres from TMDB!`));
  console.log(chalk.gray(`\n  To enrich: npx tsx scripts/enrich-genres-from-tmdb.ts --execute\n`));
}

function main() {
  const csvPath = resolve(process.cwd(), 'docs/manual-review/MOVIES-NEEDING-GENRES.csv');
  
  console.log(chalk.cyan('  Loading movies with TMDB IDs...\n'));
  
  const movies = parseCSV(csvPath);
  
  if (movies.length === 0) {
    console.log(chalk.yellow('  No movies with TMDB IDs found!\n'));
    return;
  }
  
  displayMovies(movies);
}

main();
