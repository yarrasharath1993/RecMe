#!/usr/bin/env npx tsx
/**
 * Complete Genre Quality Audit (All 7,398 movies)
 * 
 * Paginated fetch to analyze all movies in the database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  genres: string[];
  tmdb_id: number;
  slug: string;
  director?: string;
  hero?: string;
}

async function getAllMoviesPaginated(): Promise<Movie[]> {
  const allMovies: Movie[] = [];
  const BATCH_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  console.log(chalk.white('  Fetching all movies (paginated)...'));

  while (hasMore) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, genres, tmdb_id, slug, director, hero')
      .order('release_year', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('Error fetching movies:', error);
      break;
    }

    if (data && data.length > 0) {
      allMovies.push(...data);
      offset += BATCH_SIZE;
      console.log(chalk.gray(`    Loaded ${allMovies.length.toLocaleString()} movies...`));
      
      if (data.length < BATCH_SIZE) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allMovies;
}

async function runCompleteAudit() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           COMPLETE GENRE QUALITY AUDIT (All Movies)                   ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  const movies = await getAllMoviesPaginated();
  console.log(chalk.green(`  ✓ Loaded ${chalk.cyan(movies.length.toLocaleString())} movies total\n`));

  // Analyze non-standard genres
  const validGenres = new Set([
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
    // Telugu-specific (VALID)
    'Devotional', 'Mythological', 'Social', 'Political', 'Period', 'Musical'
  ]);

  // Non-standard genres to map
  const genreMappings: Record<string, string> = {
    'Art': 'Drama',
    'Biographical': 'Drama',
    'Biography': 'Drama',
    'Mass': 'Action',  // Telugu "mass" films are action-heavy
    'Sports': 'Drama',  // Sports dramas
    'Biopic': 'Drama',
    'Historical': 'History',
    'Sci-Fi': 'Science Fiction',
    'Suspense': 'Thriller',
    'Teen': 'Drama',
    'Supernatural': 'Fantasy',
    'Epic': 'Adventure'
  };

  console.log(chalk.white('  Analyzing genre patterns...\n'));

  const issues = {
    nonStandardGenres: [] as { movie: Movie; badGenres: string[] }[],
    tooManyGenres: [] as Movie[],
    genericDramaOnly: [] as Movie[],
    recentPoorGenres: [] as Movie[],
    tmdbButGeneric: [] as Movie[],
    emptyGenres: [] as Movie[]
  };

  const genreFrequency: Record<string, number> = {};
  const allGenresUsed = new Set<string>();

  movies.forEach(movie => {
    if (!movie.genres || movie.genres.length === 0) {
      issues.emptyGenres.push(movie);
      return;
    }

    // Track all genres used
    movie.genres.forEach(g => {
      allGenresUsed.add(g);
      genreFrequency[g] = (genreFrequency[g] || 0) + 1;
    });

    // Check for non-standard genres
    const badGenres = movie.genres.filter(g => !validGenres.has(g));
    if (badGenres.length > 0) {
      issues.nonStandardGenres.push({ movie, badGenres });
    }

    // Too many genres
    if (movie.genres.length > 3) {
      issues.tooManyGenres.push(movie);
    }

    // Generic drama only
    if (movie.genres.length === 1 && movie.genres[0] === 'Drama') {
      issues.genericDramaOnly.push(movie);
    }

    // Recent movies with poor genres
    if (movie.release_year >= 2020 && 
        (movie.genres.length === 1 && ['Drama', 'Action'].includes(movie.genres[0]))) {
      issues.recentPoorGenres.push(movie);
    }

    // Has TMDB but generic genres
    if (movie.tmdb_id && 
        movie.genres.length === 1 && 
        ['Drama', 'Action'].includes(movie.genres[0])) {
      issues.tmdbButGeneric.push(movie);
    }
  });

  // Display results
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   QUALITY AUDIT RESULTS                               ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white(`  Total Movies:                 ${chalk.cyan(movies.length.toLocaleString())}`));
  console.log(chalk.white(`  Unique Genres Used:           ${chalk.cyan(allGenresUsed.size)}`));
  console.log(chalk.white(`  Average Genres per Movie:     ${chalk.cyan((Object.values(genreFrequency).reduce((a, b) => a + b, 0) / movies.length).toFixed(2))}\n`));

  const totalIssues = 
    issues.nonStandardGenres.length +
    issues.tooManyGenres.length +
    issues.genericDramaOnly.length +
    issues.recentPoorGenres.length +
    issues.tmdbButGeneric.length +
    issues.emptyGenres.length;

  console.log(chalk.yellow.bold('  ISSUES IDENTIFIED:\n'));
  
  if (issues.emptyGenres.length > 0) {
    console.log(chalk.red(`  🔴 Empty Genres:              ${chalk.cyan(issues.emptyGenres.length)} movies`));
  }
  
  if (issues.nonStandardGenres.length > 0) {
    console.log(chalk.red(`  🔴 Non-Standard Genres:       ${chalk.cyan(issues.nonStandardGenres.length)} movies`));
    console.log(chalk.gray(`      (Need mapping to standard genre names)`));
  }
  
  if (issues.recentPoorGenres.length > 0) {
    console.log(chalk.yellow(`  🟡 Recent Poor Genres:        ${chalk.cyan(issues.recentPoorGenres.length)} movies (2020+)`));
    console.log(chalk.gray(`      (New movies with only generic single genre)`));
  }
  
  if (issues.tmdbButGeneric.length > 0) {
    console.log(chalk.yellow(`  🟡 TMDB Available:            ${chalk.cyan(issues.tmdbButGeneric.length)} movies`));
    console.log(chalk.gray(`      (Can be enriched from TMDB API)`));
  }
  
  if (issues.tooManyGenres.length > 0) {
    console.log(chalk.gray(`  ⚪ Too Many Genres:           ${chalk.cyan(issues.tooManyGenres.length)} movies (>3)`));
  }
  
  if (issues.genericDramaOnly.length > 0) {
    console.log(chalk.gray(`  ⚪ Generic Drama Only:        ${chalk.cyan(issues.genericDramaOnly.length)} movies`));
  }

  const qualityScore = ((1 - totalIssues / movies.length) * 100).toFixed(1);
  console.log(chalk.white(`\n  Overall Quality Score:        ${chalk.cyan(qualityScore + '%')}`));

  // Generate fix suggestions report
  console.log(chalk.white('\n  Generating fix suggestions...\n'));

  let fixSuggestions = `# Genre Quality Audit - Fix Suggestions
**Date:** ${new Date().toISOString().split('T')[0]}
**Total Movies:** ${movies.length.toLocaleString()}
**Issues Found:** ${totalIssues.toLocaleString()}
**Quality Score:** ${qualityScore}%

---

## 🔴 CRITICAL: Non-Standard Genres (${issues.nonStandardGenres.length} movies)

These movies use non-standard genre names that should be mapped to standard genres:

### Genre Mapping Suggestions:

\`\`\`
${Object.entries(genreMappings).map(([from, to]) => `"${from}" → "${to}"`).join('\n')}
\`\`\`

### Movies Affected:

`;

  // Group by non-standard genre
  const byBadGenre: Record<string, Movie[]> = {};
  issues.nonStandardGenres.forEach(({ movie, badGenres }) => {
    badGenres.forEach(genre => {
      if (!byBadGenre[genre]) byBadGenre[genre] = [];
      byBadGenre[genre].push(movie);
    });
  });

  Object.entries(byBadGenre).sort((a, b) => b[1].length - a[1].length).forEach(([genre, movies]) => {
    const suggestion = genreMappings[genre] || '❓ NEEDS MAPPING';
    fixSuggestions += `\n#### "${genre}" (${movies.length} movies) → Should be: **${suggestion}**\n\n`;
    movies.slice(0, 10).forEach(movie => {
      fixSuggestions += `- ${movie.title_en} (${movie.release_year}) - Genres: [${movie.genres?.join(', ')}]\n`;
      fixSuggestions += `  \`http://localhost:3000/movies/${movie.slug}\`\n`;
    });
    if (movies.length > 10) {
      fixSuggestions += `\n... and ${movies.length - 10} more\n`;
    }
  });

  fixSuggestions += `\n---\n\n## 🟡 MEDIUM: TMDB Enrichment Opportunities (${issues.tmdbButGeneric.length} movies)\n\n`;
  fixSuggestions += `These movies have TMDB IDs but only generic single genres. Can be auto-enriched:\n\n`;
  issues.tmdbButGeneric.slice(0, 50).forEach(movie => {
    fixSuggestions += `- ${movie.title_en} (${movie.release_year}) - TMDB: ${movie.tmdb_id}\n`;
  });
  if (issues.tmdbButGeneric.length > 50) {
    fixSuggestions += `\n... and ${issues.tmdbButGeneric.length - 50} more\n`;
  }

  fixSuggestions += `\n---\n\n## Top ${Math.min(20, allGenresUsed.size)} Genres by Frequency\n\n`;
  fixSuggestions += `| Genre | Count | Status |\n`;
  fixSuggestions += `|-------|-------|--------|\n`;
  Object.entries(genreFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([genre, count]) => {
      const status = validGenres.has(genre) ? '✅ Valid' : '❌ Non-standard';
      fixSuggestions += `| ${genre} | ${count.toLocaleString()} | ${status} |\n`;
    });

  const reportPath = './docs/manual-review/GENRE-QUALITY-FIX-SUGGESTIONS.md';
  writeFileSync(reportPath, fixSuggestions);
  console.log(chalk.green(`  ✓ Fix suggestions: ${reportPath}`));

  // Generate CSV for non-standard genres
  let csvContent = 'Movie,Year,CurrentGenres,NonStandardGenre,SuggestedGenre,TMDB_ID,URL\n';
  issues.nonStandardGenres.forEach(({ movie, badGenres }) => {
    badGenres.forEach(genre => {
      const suggestion = genreMappings[genre] || 'NEEDS_REVIEW';
      csvContent += `"${movie.title_en}",${movie.release_year},"${movie.genres?.join('; ')}","${genre}","${suggestion}",${movie.tmdb_id || ''},"http://localhost:3000/movies/${movie.slug}"\n`;
    });
  });

  const csvPath = './docs/manual-review/GENRE-NONSTANDARD-FIXES.csv';
  writeFileSync(csvPath, csvContent);
  console.log(chalk.green(`  ✓ CSV for fixes: ${csvPath}`));

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   AUDIT COMPLETE                                      ║
╚═══════════════════════════════════════════════════════════════════════╝

  ✅ Quality Score: ${qualityScore}%
  
  Priority Actions:
  1. Map ${issues.nonStandardGenres.length} movies with non-standard genres
  2. Enrich ${issues.tmdbButGeneric.length} movies from TMDB
  3. Review ${issues.recentPoorGenres.length} recent movies (2020+)
  
  📊 Reports:
     - GENRE-QUALITY-FIX-SUGGESTIONS.md
     - GENRE-NONSTANDARD-FIXES.csv

`));
}

runCompleteAudit();
