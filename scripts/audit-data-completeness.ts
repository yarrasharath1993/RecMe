#!/usr/bin/env npx tsx
/**
 * Comprehensive Data Completeness Audit
 * 
 * Find all movies with missing critical information:
 * - Directors, Actors, Synopsis, Images, Runtime, etc.
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

interface DataIssue {
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  slug: string;
  title: string;
  year: number;
  issues: string[];
  tmdb_id: number | null;
  completeness_score: number;
}

function calculateCompletenessScore(movie: any): number {
  let score = 0;
  const maxScore = 100;

  // Critical fields (50 points)
  if (movie.title_en || movie.title_te) score += 10;
  if (movie.release_year) score += 5;
  if (movie.director) score += 10;
  if (movie.hero || movie.heroine) score += 10;
  if (movie.poster_url) score += 10;
  if (movie.tmdb_id) score += 5;

  // Important fields (30 points)
  if (movie.synopsis_en || movie.synopsis_te) score += 10;
  if (movie.genres && movie.genres.length > 0) score += 10;
  if (movie.runtime) score += 5;
  if (movie.language) score += 5;

  // Nice to have (20 points)
  if (movie.backdrop_url) score += 5;
  if (movie.imdb_id) score += 5;
  if (movie.supporting_cast && movie.supporting_cast.length > 0) score += 5;
  if (movie.title_te) score += 5;

  return Math.round((score / maxScore) * 100);
}

async function auditDataCompleteness() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           COMPREHENSIVE DATA COMPLETENESS AUDIT                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('  Fetching all movies...\n'));

  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .order('release_year', { ascending: false });

  if (error) {
    console.log(chalk.red(`  ❌ Error: ${error.message}\n`));
    return;
  }

  console.log(chalk.green(`  ✓ Analyzing ${movies?.length || 0} movies\n`));

  const issues: DataIssue[] = [];
  const stats = {
    missingDirector: 0,
    missingHero: 0,
    missingHeroine: 0,
    missingBothCast: 0,
    missingSynopsisEn: 0,
    missingSynopsisTe: 0,
    missingBothSynopsis: 0,
    missingPoster: 0,
    missingBackdrop: 0,
    missingGenres: 0,
    missingRuntime: 0,
    missingLanguage: 0,
    missingTmdbId: 0,
    missingImdbId: 0,
    missingTitleTe: 0,
    criticallyIncomplete: 0,
  };

  movies?.forEach(movie => {
    const movieIssues: string[] = [];
    const title = movie.title_en || movie.title_te || 'Untitled';

    // Check critical fields
    if (!movie.director) {
      movieIssues.push('No director');
      stats.missingDirector++;
    }

    if (!movie.hero) {
      movieIssues.push('No hero');
      stats.missingHero++;
    }

    if (!movie.heroine) {
      movieIssues.push('No heroine');
      stats.missingHeroine++;
    }

    if (!movie.hero && !movie.heroine) {
      stats.missingBothCast++;
    }

    if (!movie.synopsis_en) {
      movieIssues.push('No English synopsis');
      stats.missingSynopsisEn++;
    }

    if (!movie.synopsis_te) {
      movieIssues.push('No Telugu synopsis');
      stats.missingSynopsisTe++;
    }

    if (!movie.synopsis_en && !movie.synopsis_te) {
      stats.missingBothSynopsis++;
    }

    if (!movie.poster_url) {
      movieIssues.push('No poster');
      stats.missingPoster++;
    }

    if (!movie.backdrop_url) {
      movieIssues.push('No backdrop');
      stats.missingBackdrop++;
    }

    if (!movie.genres || movie.genres.length === 0) {
      movieIssues.push('No genres');
      stats.missingGenres++;
    }

    if (!movie.runtime) {
      movieIssues.push('No runtime');
      stats.missingRuntime++;
    }

    if (!movie.language) {
      movieIssues.push('No language');
      stats.missingLanguage++;
    }

    if (!movie.tmdb_id) {
      movieIssues.push('No TMDB ID');
      stats.missingTmdbId++;
    }

    if (!movie.imdb_id) {
      stats.missingImdbId++;
    }

    if (!movie.title_te) {
      movieIssues.push('No Telugu title');
      stats.missingTitleTe++;
    }

    // Calculate completeness
    const completeness = calculateCompletenessScore(movie);

    // Determine priority
    let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
    
    if (completeness < 40) {
      priority = 'Critical';
      stats.criticallyIncomplete++;
    } else if (completeness < 60) {
      priority = 'High';
    } else if (completeness < 80) {
      priority = 'Medium';
    }

    // Only track movies with issues
    if (movieIssues.length > 0) {
      issues.push({
        category: priority === 'Critical' ? 'Critically Incomplete' : 'Needs Enrichment',
        priority,
        slug: movie.slug,
        title,
        year: movie.release_year,
        issues: movieIssues,
        tmdb_id: movie.tmdb_id,
        completeness_score: completeness,
      });
    }
  });

  // Sort by priority and completeness
  issues.sort((a, b) => {
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.completeness_score - b.completeness_score;
  });

  // Display summary
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  DATA COMPLETENESS SUMMARY\n'));

  console.log(chalk.red.bold('  CRITICAL FIELDS:\n'));
  console.log(chalk.gray(`    Missing Director:       ${stats.missingDirector.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing Hero:           ${stats.missingHero.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing Heroine:        ${stats.missingHeroine.toString().padStart(4)}`));
  console.log(chalk.red(`    Missing Both Cast:      ${stats.missingBothCast.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing Poster:         ${stats.missingPoster.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing TMDB ID:        ${stats.missingTmdbId.toString().padStart(4)}`));

  console.log(chalk.yellow.bold('\n  IMPORTANT FIELDS:\n'));
  console.log(chalk.gray(`    Missing English Synopsis: ${stats.missingSynopsisEn.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing Telugu Synopsis:  ${stats.missingSynopsisTe.toString().padStart(4)}`));
  console.log(chalk.yellow(`    Missing Both Synopsis:    ${stats.missingBothSynopsis.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing Genres:           ${stats.missingGenres.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing Runtime:          ${stats.missingRuntime.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing Language:         ${stats.missingLanguage.toString().padStart(4)}`));

  console.log(chalk.blue.bold('\n  NICE TO HAVE:\n'));
  console.log(chalk.gray(`    Missing Backdrop:       ${stats.missingBackdrop.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing IMDB ID:        ${stats.missingImdbId.toString().padStart(4)}`));
  console.log(chalk.gray(`    Missing Telugu Title:   ${stats.missingTitleTe.toString().padStart(4)}`));

  console.log(chalk.red.bold('\n  OVERALL:\n'));
  console.log(chalk.red(`    Critically Incomplete (< 40%): ${stats.criticallyIncomplete}`));
  console.log(chalk.yellow(`    High Priority (40-60%):        ${issues.filter(i => i.priority === 'High').length}`));
  console.log(chalk.blue(`    Medium Priority (60-80%):      ${issues.filter(i => i.priority === 'Medium').length}`));
  console.log(chalk.green(`    Low Priority (80%+):           ${issues.filter(i => i.priority === 'Low').length}`));

  // Generate reports
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  GENERATING REPORTS...\n'));

  // CSV Report
  let csv = 'Priority,Completeness,Year,Title,Issues,TMDB_ID,URL\n';
  issues.forEach(issue => {
    csv += [
      issue.priority,
      `${issue.completeness_score}%`,
      issue.year,
      `"${issue.title}"`,
      `"${issue.issues.join(', ')}"`,
      issue.tmdb_id || '',
      `http://localhost:3000/movies/${issue.slug}`,
    ].join(',') + '\n';
  });

  const csvPath = resolve(process.cwd(), 'docs/manual-review/DATA-COMPLETENESS-AUDIT.csv');
  writeFileSync(csvPath, csv);
  console.log(chalk.green(`  ✅ CSV: docs/manual-review/DATA-COMPLETENESS-AUDIT.csv\n`));

  // Critical issues list
  const criticalIssues = issues.filter(i => i.priority === 'Critical');
  if (criticalIssues.length > 0) {
    let criticalTxt = `CRITICALLY INCOMPLETE MOVIES (${criticalIssues.length})\n`;
    criticalTxt += `Completeness < 40% - Needs immediate attention\n\n`;
    
    criticalIssues.forEach((issue, i) => {
      criticalTxt += `${i + 1}. ${issue.title} (${issue.year}) - ${issue.completeness_score}% complete\n`;
      criticalTxt += `   Issues: ${issue.issues.join(', ')}\n`;
      criticalTxt += `   TMDB ID: ${issue.tmdb_id || 'None'}\n`;
      criticalTxt += `   URL: http://localhost:3000/movies/${issue.slug}\n\n`;
    });

    const criticalPath = resolve(process.cwd(), 'docs/manual-review/CRITICAL-INCOMPLETE-MOVIES.txt');
    writeFileSync(criticalPath, criticalTxt);
    console.log(chalk.red(`  ⚠️  Critical List: docs/manual-review/CRITICAL-INCOMPLETE-MOVIES.txt\n`));
  }

  // High priority issues
  const highPriorityIssues = issues.filter(i => i.priority === 'High');
  if (highPriorityIssues.length > 0) {
    let highTxt = `HIGH PRIORITY MOVIES (${highPriorityIssues.length})\n`;
    highTxt += `Completeness 40-60% - Should be enriched soon\n\n`;
    
    highPriorityIssues.forEach((issue, i) => {
      highTxt += `${i + 1}. ${issue.title} (${issue.year}) - ${issue.completeness_score}% complete\n`;
      highTxt += `   Issues: ${issue.issues.join(', ')}\n`;
      highTxt += `   TMDB ID: ${issue.tmdb_id || 'None'}\n`;
      highTxt += `   URL: http://localhost:3000/movies/${issue.slug}\n\n`;
    });

    const highPath = resolve(process.cwd(), 'docs/manual-review/HIGH-PRIORITY-ENRICHMENT.txt');
    writeFileSync(highPath, highTxt);
    console.log(chalk.yellow(`  ⚠️  High Priority: docs/manual-review/HIGH-PRIORITY-ENRICHMENT.txt\n`));
  }

  // Summary by category
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  TOP ENRICHMENT OPPORTUNITIES:\n'));

  const opportunities = [
    { name: 'Add Director Info', count: stats.missingDirector, priority: 'Critical' },
    { name: 'Add Hero Info', count: stats.missingHero, priority: 'Critical' },
    { name: 'Add Heroine Info', count: stats.missingHeroine, priority: 'Critical' },
    { name: 'Add Posters', count: stats.missingPoster, priority: 'Critical' },
    { name: 'Add English Synopsis', count: stats.missingSynopsisEn, priority: 'High' },
    { name: 'Add Genres', count: stats.missingGenres, priority: 'High' },
    { name: 'Add Runtime', count: stats.missingRuntime, priority: 'Medium' },
    { name: 'Add Language', count: stats.missingLanguage, priority: 'Medium' },
    { name: 'Add Telugu Title', count: stats.missingTitleTe, priority: 'Medium' },
    { name: 'Add Backdrop', count: stats.missingBackdrop, priority: 'Low' },
  ].sort((a, b) => b.count - a.count);

  opportunities.forEach((opp, i) => {
    const color = opp.priority === 'Critical' ? chalk.red : 
                  opp.priority === 'High' ? chalk.yellow : 
                  opp.priority === 'Medium' ? chalk.blue : chalk.gray;
    console.log(color(`  ${(i + 1).toString().padStart(2)}. ${opp.name.padEnd(25)} ${opp.count.toString().padStart(4)} movies`));
  });

  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════════════\n'));

  return { issues, stats };
}

async function main() {
  await auditDataCompleteness();
}

main().catch(console.error);
