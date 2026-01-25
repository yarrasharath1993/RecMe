#!/usr/bin/env npx tsx
/**
 * Analyze Recent Database Changes
 * 
 * Queries database for all changes in the past 7 days
 * and provides comprehensive analysis
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getRecentChanges(days: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString();

  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           DATABASE CHANGES ANALYSIS (Last ${days} Days)                     ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan(`  Analyzing changes since: ${cutoffDate.toISOString().split('T')[0]}\n`));

  // Get all movies updated in the last N days
  const { data: recentMovies, error } = await supabase
    .from('movies')
    .select('*')
    .gte('updated_at', cutoff)
    .order('updated_at', { ascending: false });

  if (error) {
    console.log(chalk.red(`  ❌ Error: ${error.message}\n`));
    return;
  }

  if (!recentMovies || recentMovies.length === 0) {
    console.log(chalk.yellow('  No recent changes found\n'));
    return;
  }

  console.log(chalk.green(`  ✓ Found ${recentMovies.length} movies updated in the last ${days} days\n`));

  // Analyze changes by date
  const changesByDate: Record<string, any[]> = {};
  recentMovies.forEach(movie => {
    const date = movie.updated_at.split('T')[0];
    if (!changesByDate[date]) {
      changesByDate[date] = [];
    }
    changesByDate[date].push(movie);
  });

  // Analyze what fields were updated
  const fieldUpdates: Record<string, number> = {};
  const operations: Record<string, number> = {
    'Hero/Heroine Added': 0,
    'TMDB ID Linked': 0,
    'Director Added': 0,
    'Genres Added': 0,
    'Images Added': 0,
    'Published': 0,
    'Unpublished': 0,
    'Other Updates': 0,
  };

  recentMovies.forEach(movie => {
    if (movie.hero) operations['Hero/Heroine Added']++;
    if (movie.tmdb_id) operations['TMDB ID Linked']++;
    if (movie.director) operations['Director Added']++;
    if (movie.genres && movie.genres.length > 0) operations['Genres Added']++;
    if (movie.poster_url || movie.backdrop_url) operations['Images Added']++;
    if (movie.is_published) operations['Published']++;
  });

  // Print daily breakdown
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  DAILY BREAKDOWN\n'));

  const dates = Object.keys(changesByDate).sort().reverse();
  dates.forEach(date => {
    const movies = changesByDate[date];
    console.log(chalk.yellow(`  ${date}: ${movies.length} movies updated`));
    
    // Sample movies for this date
    const sample = movies.slice(0, 5);
    sample.forEach(m => {
      console.log(chalk.gray(`    - ${m.title_en || m.title_te || 'Untitled'} (${m.release_year || 'N/A'})`));
    });
    if (movies.length > 5) {
      console.log(chalk.gray(`    ... and ${movies.length - 5} more\n`));
    } else {
      console.log();
    }
  });

  // Print operation summary
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  OPERATION SUMMARY\n'));

  Object.entries(operations).forEach(([op, count]) => {
    if (count > 0) {
      console.log(chalk.green(`  ✓ ${op.padEnd(25)}: ${count}`));
    }
  });
  console.log();

  // Analyze patterns
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  PATTERN ANALYSIS\n'));

  // Check for bulk operations
  const tmdbAdded = recentMovies.filter(m => m.tmdb_id).length;
  const heroesAdded = recentMovies.filter(m => m.hero).length;
  const directorsAdded = recentMovies.filter(m => m.director).length;
  const imagesAdded = recentMovies.filter(m => m.poster_url || m.backdrop_url).length;
  const genresAdded = recentMovies.filter(m => m.genres && m.genres.length > 0).length;

  console.log(chalk.cyan('  Field Completion Rates:\n'));
  console.log(chalk.gray(`    TMDB IDs:      ${tmdbAdded}/${recentMovies.length} (${Math.round(tmdbAdded/recentMovies.length*100)}%)`));
  console.log(chalk.gray(`    Heroes:        ${heroesAdded}/${recentMovies.length} (${Math.round(heroesAdded/recentMovies.length*100)}%)`));
  console.log(chalk.gray(`    Directors:     ${directorsAdded}/${recentMovies.length} (${Math.round(directorsAdded/recentMovies.length*100)}%)`));
  console.log(chalk.gray(`    Images:        ${imagesAdded}/${recentMovies.length} (${Math.round(imagesAdded/recentMovies.length*100)}%)`));
  console.log(chalk.gray(`    Genres:        ${genresAdded}/${recentMovies.length} (${Math.round(genresAdded/recentMovies.length*100)}%)\n`));

  // Check for specific actors/directors
  const heroCount: Record<string, number> = {};
  const directorCount: Record<string, number> = {};

  recentMovies.forEach(m => {
    if (m.hero) {
      heroCount[m.hero] = (heroCount[m.hero] || 0) + 1;
    }
    if (m.director) {
      directorCount[m.director] = (directorCount[m.director] || 0) + 1;
    }
  });

  const topHeroes = Object.entries(heroCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topDirectors = Object.entries(directorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (topHeroes.length > 0) {
    console.log(chalk.cyan('  Top 10 Heroes in Recent Updates:\n'));
    topHeroes.forEach(([hero, count], i) => {
      console.log(chalk.gray(`    ${i + 1}. ${hero.padEnd(30)}: ${count} movies`));
    });
    console.log();
  }

  if (topDirectors.length > 0) {
    console.log(chalk.cyan('  Top 10 Directors in Recent Updates:\n'));
    topDirectors.forEach(([director, count], i) => {
      console.log(chalk.gray(`    ${i + 1}. ${director.padEnd(30)}: ${count} movies`));
    });
    console.log();
  }

  // Check for quality improvements
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  QUALITY IMPROVEMENTS\n'));

  const moviesWithMultipleFields = recentMovies.filter(m => {
    let count = 0;
    if (m.tmdb_id) count++;
    if (m.hero) count++;
    if (m.director) count++;
    if (m.genres && m.genres.length > 0) count++;
    if (m.poster_url) count++;
    return count >= 3;
  });

  console.log(chalk.green(`  ✓ ${moviesWithMultipleFields.length} movies with 3+ fields updated (comprehensive enrichment)\n`));

  // Detect bulk operations
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  DETECTED BULK OPERATIONS\n'));

  dates.forEach(date => {
    const movies = changesByDate[date];
    if (movies.length >= 10) {
      const tmdbCount = movies.filter(m => m.tmdb_id).length;
      const heroCount = movies.filter(m => m.hero).length;
      const directorCount = movies.filter(m => m.director).length;
      
      console.log(chalk.yellow(`  ${date} - ${movies.length} movies:`));
      if (tmdbCount > movies.length * 0.7) {
        console.log(chalk.gray(`    → Bulk TMDB enrichment (${tmdbCount} movies)`));
      }
      if (heroCount > movies.length * 0.7) {
        console.log(chalk.gray(`    → Bulk hero attribution (${heroCount} movies)`));
      }
      if (directorCount > movies.length * 0.7) {
        console.log(chalk.gray(`    → Bulk director addition (${directorCount} movies)`));
      }
      console.log();
    }
  });

  // Generate reports
  const reportMD = generateMarkdownReport(recentMovies, changesByDate, operations, days);
  const reportCSV = generateCSVReport(recentMovies);

  const mdPath = resolve(process.cwd(), 'docs/manual-review/RECENT-DB-CHANGES-ANALYSIS.md');
  const csvPath = resolve(process.cwd(), 'docs/manual-review/RECENT-DB-CHANGES-ANALYSIS.csv');

  writeFileSync(mdPath, reportMD);
  writeFileSync(csvPath, reportCSV);

  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════\n'));
  console.log(chalk.green('  ✅ Reports generated:\n'));
  console.log(chalk.gray('     - docs/manual-review/RECENT-DB-CHANGES-ANALYSIS.md'));
  console.log(chalk.gray('     - docs/manual-review/RECENT-DB-CHANGES-ANALYSIS.csv\n'));
}

function generateMarkdownReport(
  movies: any[],
  changesByDate: Record<string, any[]>,
  operations: Record<string, number>,
  days: number
): string {
  let md = `# Recent Database Changes Analysis\n\n`;
  md += `**Period:** Last ${days} days\n`;
  md += `**Analysis Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total Movies Updated:** ${movies.length}\n\n`;
  
  md += `---\n\n## Daily Breakdown\n\n`;
  
  const dates = Object.keys(changesByDate).sort().reverse();
  dates.forEach(date => {
    const dayMovies = changesByDate[date];
    md += `### ${date} (${dayMovies.length} movies)\n\n`;
    
    dayMovies.slice(0, 20).forEach((m, i) => {
      md += `${i + 1}. **${m.title_en || m.title_te || 'Untitled'}** (${m.release_year || 'N/A'})\n`;
      md += `   - Slug: \`${m.slug}\`\n`;
      if (m.tmdb_id) md += `   - TMDB ID: ${m.tmdb_id}\n`;
      if (m.director) md += `   - Director: ${m.director}\n`;
      if (m.hero) md += `   - Hero: ${m.hero}\n`;
      md += `\n`;
    });
    
    if (dayMovies.length > 20) {
      md += `*... and ${dayMovies.length - 20} more movies*\n\n`;
    }
  });
  
  md += `---\n\n## Operation Summary\n\n`;
  
  Object.entries(operations).forEach(([op, count]) => {
    if (count > 0) {
      md += `- **${op}:** ${count}\n`;
    }
  });
  
  md += `\n---\n\n## Statistics\n\n`;
  md += `- Total movies updated: ${movies.length}\n`;
  md += `- Average updates per day: ${Math.round(movies.length / days)}\n`;
  md += `- Movies with TMDB IDs: ${movies.filter(m => m.tmdb_id).length}\n`;
  md += `- Movies with complete data: ${movies.filter(m => m.tmdb_id && m.hero && m.director && m.genres?.length > 0).length}\n`;
  
  return md;
}

function generateCSVReport(movies: any[]): string {
  let csv = 'Date,Title,Year,Slug,TMDB ID,Director,Hero,Heroine,Has Poster,Has Genres,Published\n';
  
  movies.forEach(m => {
    csv += [
      m.updated_at.split('T')[0],
      `"${m.title_en || m.title_te || 'Untitled'}"`,
      m.release_year || '',
      `"${m.slug}"`,
      m.tmdb_id || '',
      `"${m.director || ''}"`,
      `"${m.hero || ''}"`,
      `"${m.heroine || ''}"`,
      m.poster_url ? 'Yes' : 'No',
      m.genres?.length > 0 ? 'Yes' : 'No',
      m.is_published ? 'Yes' : 'No',
    ].join(',') + '\n';
  });
  
  return csv;
}

async function main() {
  const args = process.argv.slice(2);
  const days = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1] || '7');
  
  await getRecentChanges(days);
}

main().catch(console.error);
