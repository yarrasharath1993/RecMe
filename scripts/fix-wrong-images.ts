/**
 * Fix Wrong Images Script
 * 
 * Investigates and fixes movies with wrong poster images
 * - Checks if poster URL points to wrong movie
 * - Searches for correct images from TMDB
 * - Identifies similar patterns across all movies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// ============================================================
// SETUP
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// ============================================================
// TYPES
// ============================================================

interface Movie {
  id: string;
  title_en: string;
  title_te: string | null;
  release_year: number;
  slug: string;
  poster_url: string | null;
  tmdb_id: number | null;
  director: string | null;
  hero: string | null;
}

interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
}

interface ImageIssue {
  movieId: string;
  title: string;
  slug: string;
  year: number;
  currentUrl: string | null;
  issue: 'wrong_movie' | 'broken' | 'low_quality' | 'mismatch';
  correctUrl?: string;
  tmdbId?: number;
}

// ============================================================
// TMDB FUNCTIONS
// ============================================================

async function searchTMDB(title: string, year?: number): Promise<TMDBMovie | null> {
  try {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      query: title,
      language: 'te-IN',
      include_adult: 'false',
    });

    if (year) {
      params.append('year', year.toString());
      params.append('primary_release_year', year.toString());
    }

    const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;

    // Try to find the best match
    const movies = data.results as TMDBMovie[];
    
    // Exact year match
    if (year) {
      const exactMatch = movies.find(m => {
        const releaseYear = m.release_date ? new Date(m.release_date).getFullYear() : 0;
        return releaseYear === year;
      });
      if (exactMatch) return exactMatch;
    }

    // Return first result
    return movies[0];
  } catch (error) {
    console.error(`TMDB search error for "${title}":`, error);
    return null;
  }
}

async function getTMDBDetails(tmdbId: number): Promise<TMDBMovie | null> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=te-IN`
    );
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch {
    return null;
  }
}

// ============================================================
// IMAGE VALIDATION
// ============================================================

async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

async function detectImageIssue(movie: Movie): Promise<ImageIssue | null> {
  // No poster URL - not an issue for this script
  if (!movie.poster_url) return null;

  const issue: ImageIssue = {
    movieId: movie.id,
    title: movie.title_en,
    slug: movie.slug,
    year: movie.release_year,
    currentUrl: movie.poster_url,
    issue: 'mismatch',
  };

  // Check if image is accessible
  const isAccessible = await isImageAccessible(movie.poster_url);
  if (!isAccessible) {
    issue.issue = 'broken';
    return issue;
  }

  // Check if TMDB ID is present
  if (!movie.tmdb_id) {
    // Try to search TMDB
    const tmdbMovie = await searchTMDB(movie.title_en, movie.release_year);
    if (tmdbMovie && tmdbMovie.poster_path) {
      const correctUrl = `${TMDB_IMAGE_BASE}${tmdbMovie.poster_path}`;
      
      // If current URL doesn't match TMDB URL, it's potentially wrong
      if (movie.poster_url !== correctUrl) {
        issue.issue = 'wrong_movie';
        issue.correctUrl = correctUrl;
        issue.tmdbId = tmdbMovie.id;
        return issue;
      }
    }
  } else {
    // Verify TMDB poster matches
    const tmdbMovie = await getTMDBDetails(movie.tmdb_id);
    if (tmdbMovie && tmdbMovie.poster_path) {
      const correctUrl = `${TMDB_IMAGE_BASE}${tmdbMovie.poster_path}`;
      
      if (movie.poster_url !== correctUrl) {
        issue.issue = 'mismatch';
        issue.correctUrl = correctUrl;
        issue.tmdbId = tmdbMovie.id;
        return issue;
      }
    }
  }

  return null;
}

// ============================================================
// FIX FUNCTION
// ============================================================

async function fixMovieImage(issue: ImageIssue, execute: boolean): Promise<boolean> {
  if (!issue.correctUrl || !issue.tmdbId) return false;

  const updateData: any = {
    poster_url: issue.correctUrl,
    tmdb_id: issue.tmdbId,
    updated_at: new Date().toISOString(),
  };

  if (execute) {
    const { error } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', issue.movieId);

    if (error) {
      console.error(chalk.red(`Error updating movie: ${error.message}`));
      return false;
    }
  }

  return true;
}

// ============================================================
// ANALYSIS
// ============================================================

async function analyzeAllMovies(execute: boolean, focusSlug?: string) {
  console.log(chalk.blue.bold('\n🔍 Analyzing Movie Images\n'));

  // Fetch movies with poster URLs
  let query = supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, slug, poster_url, tmdb_id, director, hero')
    .eq('is_published', true)
    .not('poster_url', 'is', null);

  // If focusing on specific movie
  if (focusSlug) {
    query = query.eq('slug', focusSlug);
  }

  const { data: movies, error } = await query;

  if (error) {
    console.error(chalk.red('Error fetching movies:'), error.message);
    return;
  }

  console.log(chalk.gray(`Found ${movies?.length || 0} movies with posters\n`));

  const issues: ImageIssue[] = [];
  const issuesByType = {
    wrong_movie: [] as ImageIssue[],
    broken: [] as ImageIssue[],
    mismatch: [] as ImageIssue[],
    low_quality: [] as ImageIssue[],
  };

  let processed = 0;
  const total = movies?.length || 0;

  for (const movie of movies || []) {
    processed++;
    
    if (processed % 10 === 0 || focusSlug) {
      console.log(chalk.gray(`Progress: ${processed}/${total}`));
    }

    const issue = await detectImageIssue(movie as Movie);
    
    if (issue) {
      issues.push(issue);
      issuesByType[issue.issue].push(issue);

      if (focusSlug) {
        console.log(chalk.yellow(`\n⚠️  Issue detected for ${issue.title} (${issue.year})`));
        console.log(chalk.gray(`   Type: ${issue.issue}`));
        console.log(chalk.gray(`   Current: ${issue.currentUrl}`));
        if (issue.correctUrl) {
          console.log(chalk.gray(`   Correct: ${issue.correctUrl}`));
        }
      }
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Report
  console.log(chalk.blue.bold('\n📊 Image Issues Report\n'));
  console.log(chalk.white(`Total movies analyzed: ${total}`));
  console.log(chalk.white(`Issues found: ${issues.length}\n`));

  console.log(chalk.cyan('By Type:'));
  console.log(chalk.yellow(`  Wrong Movie: ${issuesByType.wrong_movie.length}`));
  console.log(chalk.red(`  Broken: ${issuesByType.broken.length}`));
  console.log(chalk.magenta(`  Mismatch: ${issuesByType.mismatch.length}`));
  console.log(chalk.blue(`  Low Quality: ${issuesByType.low_quality.length}\n`));

  // Show sample issues
  if (issues.length > 0 && !focusSlug) {
    console.log(chalk.cyan('\n🔍 Sample Issues:\n'));
    issues.slice(0, 10).forEach((issue, idx) => {
      console.log(chalk.white(`${idx + 1}. ${issue.title} (${issue.year})`));
      console.log(chalk.gray(`   Slug: ${issue.slug}`));
      console.log(chalk.gray(`   Issue: ${issue.issue}`));
      console.log(chalk.gray(`   URL: http://localhost:3000/movies/${issue.slug}\n`));
    });
  }

  // Fix issues if execute mode
  if (execute && issues.length > 0) {
    console.log(chalk.blue.bold('\n🔧 Fixing Issues\n'));
    
    let fixed = 0;
    let failed = 0;

    for (const issue of issues) {
      const success = await fixMovieImage(issue, true);
      if (success) {
        fixed++;
        console.log(chalk.green(`✅ Fixed: ${issue.title}`));
      } else {
        failed++;
        console.log(chalk.red(`❌ Failed: ${issue.title}`));
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(chalk.blue.bold('\n📊 Fix Summary\n'));
    console.log(chalk.green(`Fixed: ${fixed}`));
    console.log(chalk.red(`Failed: ${failed}`));
  } else if (issues.length > 0) {
    console.log(chalk.yellow('\n💡 Run with --execute to fix these issues\n'));
  }

  // Export issues to file
  if (issues.length > 0) {
    const fs = await import('fs');
    const outputPath = `./reports/image-issues-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(issues, null, 2));
    console.log(chalk.blue(`\n📄 Full report saved to: ${outputPath}\n`));
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const slugArg = args.find(arg => arg.startsWith('--slug='));
  const focusSlug = slugArg ? slugArg.split('=')[1] : undefined;

  if (execute) {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Will update database'));
  } else {
    console.log(chalk.blue('ℹ️  DRY RUN - No changes will be made'));
  }

  await analyzeAllMovies(execute, focusSlug);
}

main().catch(console.error);
