#!/usr/bin/env npx tsx
/**
 * Display Movies Needing Manual Genre Classification
 * 
 * Shows movies without TMDB IDs in batches for manual review
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

const BATCH_SIZE = 60;

async function getMoviesNeedingManualReview() {
  // Get movies without TMDB IDs or without genres
  const { data: movies } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, director, hero, heroine, tmdb_id, genres')
    .is('tmdb_id', null)
    .or('genres.is.null,genres.eq.{},genres.eq.[]')
    .order('release_year', { ascending: false })
    .limit(200); // Focus on recent movies first

  return movies || [];
}

function displayBatch(movies: any[], batchNum: number, totalBatches: number) {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║      BATCH ${batchNum}/${totalBatches} - MOVIES NEEDING MANUAL RESEARCH (${movies.length} movies)      ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  movies.forEach((movie, i) => {
    const num = ((batchNum - 1) * BATCH_SIZE) + i + 1;
    const title = movie.title_en || movie.title_te || 'Untitled';
    
    const hasDirector = movie.director && movie.director !== '';
    const hasHero = movie.hero && movie.hero !== '';
    const hasHeroine = movie.heroine && movie.heroine !== '';
    
    console.log(chalk.white(`\n  ${num.toString().padStart(3)}. ${title} ${chalk.gray(`(${movie.release_year})`)}`));
    
    // Data availability
    const status = [];
    if (hasDirector) status.push(chalk.green(`✓ Dir: ${movie.director.substring(0, 25)}`));
    else status.push(chalk.red('✗ No Director'));
    
    if (hasHero) status.push(chalk.green(`✓ Hero: ${movie.hero.substring(0, 25)}`));
    else status.push(chalk.red('✗ No Hero'));
    
    if (hasHeroine) status.push(chalk.yellow(`Heroine: ${movie.heroine.substring(0, 20)}`));
    
    console.log(chalk.gray(`       ${status.join(' | ')}`));
    console.log(chalk.gray(`       http://localhost:3000/movies/${movie.slug}`));
    
    // Suggest likely genres based on patterns
    const likelyGenres = suggestGenres(title, movie.director, movie.hero);
    if (likelyGenres.length > 0) {
      console.log(chalk.cyan(`       💡 Suggested: ${likelyGenres.join(', ')}`));
    }
  });

  console.log(chalk.blue.bold(`\n═══════════════════════════════════════════════════════════════════════\n`));
}

function suggestGenres(title: string, director?: string, hero?: string): string[] {
  const suggestions: string[] = [];
  const lowerTitle = title.toLowerCase();
  const lowerDirector = (director || '').toLowerCase();
  
  // Pattern matching for likely genres
  if (lowerTitle.includes('love') || lowerTitle.includes('prema')) {
    suggestions.push('Romance');
  }
  if (lowerTitle.includes('police') || lowerTitle.includes('cop') || lowerTitle.includes('rowdy')) {
    suggestions.push('Action');
  }
  if (lowerTitle.includes('comedy') || lowerTitle.includes('comedy')) {
    suggestions.push('Comedy');
  }
  if (lowerTitle.includes('horror') || lowerTitle.includes('ghost') || lowerTitle.includes('bhoot')) {
    suggestions.push('Horror');
  }
  if (lowerTitle.includes('family') || lowerTitle.includes('kutumbam')) {
    suggestions.push('Family', 'Drama');
  }
  if (lowerTitle.includes('krishna') || lowerTitle.includes('rama') || lowerTitle.includes('god')) {
    suggestions.push('Mythology');
  }
  if (lowerTitle.includes('history') || lowerTitle.includes('emperor') || lowerTitle.includes('king')) {
    suggestions.push('Historical');
  }
  
  return [...new Set(suggestions)];
}

async function main() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           MOVIES NEEDING MANUAL GENRE CLASSIFICATION                  ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('  Fetching movies without TMDB IDs...\n'));

  const movies = await getMoviesNeedingManualReview();

  if (movies.length === 0) {
    console.log(chalk.green('  ✅ All movies have TMDB IDs or genres!\n'));
    return;
  }

  console.log(chalk.yellow(`  ⚠️  Found ${movies.length} movies needing manual research\n`));

  const args = process.argv.slice(2);
  const batchArg = args.find(a => a.startsWith('--batch='));
  const totalBatches = Math.ceil(movies.length / BATCH_SIZE);

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
    console.log(chalk.yellow(`  💡 Showing all ${totalBatches} batches...\n`));

    for (let i = 0; i < totalBatches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, movies.length);
      const batchMovies = movies.slice(start, end);

      displayBatch(batchMovies, i + 1, totalBatches);
    }
  }

  // Summary
  console.log(chalk.cyan.bold('  GENRE CLASSIFICATION GUIDE:\n'));
  console.log(chalk.white('    Common Genres:'));
  console.log(chalk.gray('      - Action, Drama, Romance, Comedy'));
  console.log(chalk.gray('      - Thriller, Horror, Family, Fantasy'));
  console.log(chalk.gray('      - Historical, Mythology, Devotional'));
  console.log(chalk.gray('      - Crime, Mystery, Adventure, Musical\n'));

  console.log(chalk.white('    Research Sources:'));
  console.log(chalk.gray('      - Wikipedia (Telugu/English)'));
  console.log(chalk.gray('      - IMDb'));
  console.log(chalk.gray('      - Google search'));
  console.log(chalk.gray('      - Movie reviews/articles\n'));

  console.log(chalk.gray(`  To view specific batch: npx tsx scripts/display-manual-review-movies.ts --batch=N\n`));
}

main();
