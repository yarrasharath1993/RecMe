#!/usr/bin/env npx tsx
/**
 * Export Box Office Ratings to CSV for Manual Review
 * 
 * Exports all movies with box office categories to CSV format
 * for manual review and adjustment.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function exportToCSV() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           EXPORT BOX OFFICE RATINGS TO CSV                          ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  // Fetch all movies with box office categories
  const { data: movies, error } = await supabase
    .from('movies')
    .select(`
      id,
      slug,
      title_en,
      title_te,
      release_year,
      box_office_category,
      our_rating,
      avg_rating,
      genres,
      director,
      hero,
      heroine,
      is_blockbuster,
      is_classic,
      is_underrated
    `)
    .not('box_office_category', 'is', null)
    .order('release_year', { ascending: false })
    .order('our_rating', { ascending: false });

  if (error) {
    console.log(chalk.red(`Error: ${error.message}`));
    return;
  }

  console.log(`Fetched ${chalk.cyan(movies.length)} movies\n`);

  // Fetch reviews for additional context
  const movieIds = movies.map(m => m.id);
  const { data: reviews } = await supabase
    .from('movie_reviews')
    .select('movie_id, overall_rating, dimensions_json')
    .in('movie_id', movieIds);

  const reviewsByMovieId = new Map();
  (reviews || []).forEach(r => {
    reviewsByMovieId.set(r.movie_id, r);
  });

  // Build CSV
  const headers = [
    'Slug',
    'Title (English)',
    'Title (Telugu)',
    'Release Year',
    'Box Office Category',
    'Current Rating',
    'TMDB/Avg Rating',
    'Review Rating',
    'Director',
    'Hero',
    'Heroine',
    'Genres',
    'Is Blockbuster',
    'Is Classic',
    'Is Underrated',
    'Story Score',
    'Direction Score',
    'Performance Score',
    'Suggested Rating',
    'Notes'
  ].join(',');

  const rows = movies.map(movie => {
    const review = reviewsByMovieId.get(movie.id);
    const dims = review?.dimensions_json || {};
    
    const storyScore = dims.story_screenplay?.story_score || '';
    const directionScore = dims.direction_technicals?.direction_score || '';
    const perfScores = (dims.performances?.lead_actors || [])
      .map((a: any) => a.score)
      .filter((s: number) => s > 0);
    const avgPerf = perfScores.length > 0
      ? (perfScores.reduce((a: number, b: number) => a + b, 0) / perfScores.length).toFixed(1)
      : '';

    const genres = Array.isArray(movie.genres) ? movie.genres.join('; ') : '';
    
    return [
      movie.slug,
      `"${(movie.title_en || '').replace(/"/g, '""')}"`,
      `"${(movie.title_te || '').replace(/"/g, '""')}"`,
      movie.release_year || '',
      movie.box_office_category || '',
      movie.our_rating || '',
      movie.avg_rating || '',
      review?.overall_rating || '',
      `"${(movie.director || '').replace(/"/g, '""')}"`,
      `"${(movie.hero || '').replace(/"/g, '""')}"`,
      `"${(movie.heroine || '').replace(/"/g, '""')}"`,
      `"${genres}"`,
      movie.is_blockbuster ? 'TRUE' : 'FALSE',
      movie.is_classic ? 'TRUE' : 'FALSE',
      movie.is_underrated ? 'TRUE' : 'FALSE',
      storyScore,
      directionScore,
      avgPerf,
      '', // Suggested Rating (for manual entry)
      ''  // Notes (for manual entry)
    ].join(',');
  });

  const csv = [headers, ...rows].join('\n');

  // Write to file
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `box-office-ratings-export-${timestamp}.csv`;
  writeFileSync(filename, csv, 'utf-8');

  console.log(chalk.green(`✅ Exported ${movies.length} movies to: ${chalk.bold(filename)}\n`));
  
  console.log(chalk.bold('CSV Columns:'));
  console.log('  - Slug: Movie identifier');
  console.log('  - Title (English/Telugu): Movie titles');
  console.log('  - Release Year: Year of release');
  console.log('  - Box Office Category: industry-hit, blockbuster, super-hit, hit, average, below-average');
  console.log('  - Current Rating: Current our_rating value');
  console.log('  - TMDB/Avg Rating: Average rating from TMDB');
  console.log('  - Review Rating: Rating from editorial review');
  console.log('  - Director, Hero, Heroine: Cast/crew info');
  console.log('  - Genres: Movie genres');
  console.log('  - Is Blockbuster/Classic/Underrated: Boolean flags');
  console.log('  - Story/Direction/Performance Scores: Component scores from reviews');
  console.log('  - Suggested Rating: [EMPTY] Fill in your suggested rating');
  console.log('  - Notes: [EMPTY] Add any notes for changes');
  
  console.log(chalk.yellow.bold('\n📝 Instructions for Review:'));
  console.log('  1. Open the CSV in Excel/Google Sheets');
  console.log('  2. Review each movie rating');
  console.log('  3. Fill "Suggested Rating" column with your corrections');
  console.log('  4. Add notes in "Notes" column if needed');
  console.log('  5. Save the CSV and share it back');
  console.log('  6. We will import and apply your corrections\n');

  // Generate summary stats
  const categories: Record<string, number> = {};
  movies.forEach(m => {
    const cat = m.box_office_category || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  console.log(chalk.bold('Summary by Category:'));
  Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, count]) => {
      console.log(`  ${cat.padEnd(20)} ${count.toString().padStart(4)} movies`);
    });
  
  console.log('');
}

exportToCSV().catch(console.error);
