/**
 * Fix Actor Image Posters
 * 
 * Identifies and fixes movies where poster_url points to actor/actress images
 * instead of actual movie posters. Common patterns:
 * - Wikipedia Commons URLs with person names (e.g., Vanisri.jpg, Krishna.jpg)
 * - TMDB person images used as posters
 * - Generic headshots instead of movie posters
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

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// ============================================================
// TYPES
// ============================================================

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  slug: string;
  poster_url: string | null;
  director: string | null;
  hero: string | null;
  heroine: string | null;
  tmdb_id: number | null;
}

interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
}

interface SuspiciousImage {
  movieId: string;
  title: string;
  slug: string;
  year: number;
  currentUrl: string;
  reason: string;
  correctUrl?: string;
  tmdbId?: number;
}

// ============================================================
// DETECTION PATTERNS
// ============================================================

const ACTOR_NAME_PATTERNS = [
  // Telugu actors/actresses
  'vanisri', 'krishna', 'chiranjeevi', 'balakrishna', 'nagarjuna',
  'venkatesh', 'mahesh', 'pawan', 'allu', 'ramcharan', 'ntr',
  'savitri', 'jayalalitha', 'jamuna', 'rajasree', 'vijayashanti',
  'soundarya', 'simran', 'sangeetha', 'anjali', 'samantha',
  // Common patterns
  'actor', 'actress', 'person', 'portrait', 'headshot',
  'celebrity', 'star', 'artist', 'profile'
];

function isSuspiciousImageUrl(url: string, movie: Movie): { suspicious: boolean; reason: string } {
  const urlLower = url.toLowerCase();
  
  // Get filename without extension
  const filename = url.split('/').pop()?.toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/, '') || '';

  // Check for Wikipedia/Wikimedia Commons person images
  if (urlLower.includes('wikipedia.org') || urlLower.includes('wikimedia.org')) {
    // Check if URL or filename contains actor/actress names
    const hasActorName = ACTOR_NAME_PATTERNS.some(pattern => {
      return urlLower.includes(pattern) || filename.includes(pattern);
    });

    if (hasActorName) {
      return { 
        suspicious: true, 
        reason: 'Wikipedia Commons URL contains actor/actress name' 
      };
    }

    // Check if filename matches hero/heroine name (more flexible matching)
    if (movie.hero) {
      const heroWords = movie.hero.toLowerCase().split(' ');
      for (const word of heroWords) {
        if (word.length > 3 && filename.includes(word)) {
          return {
            suspicious: true,
            reason: `Filename matches hero name: ${movie.hero}`
          };
        }
      }
    }
    
    if (movie.heroine) {
      const heroineWords = movie.heroine.toLowerCase().split(' ');
      for (const word of heroineWords) {
        if (word.length > 3 && filename.includes(word)) {
          return {
            suspicious: true,
            reason: `Filename matches heroine name: ${movie.heroine}`
          };
        }
      }
    }
  }

  // Check for TMDB person images (profile images instead of posters)
  if (urlLower.includes('tmdb.org') && urlLower.includes('/profile/')) {
    return {
      suspicious: true,
      reason: 'TMDB person profile image used as poster'
    };
  }

  return { suspicious: false, reason: '' };
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

    const movies = data.results as TMDBMovie[];
    
    // Exact year match
    if (year) {
      const exactMatch = movies.find(m => {
        const releaseYear = m.release_date ? new Date(m.release_date).getFullYear() : 0;
        return releaseYear === year;
      });
      if (exactMatch) return exactMatch;
    }

    return movies[0];
  } catch (error) {
    console.error(`TMDB search error for "${title}":`, error);
    return null;
  }
}

// ============================================================
// ANALYSIS
// ============================================================

async function analyzeMovies(execute: boolean) {
  console.log(chalk.blue.bold('\n🔍 Analyzing Movie Posters for Actor Images\n'));

  // Fetch all published movies with poster URLs
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, poster_url, director, hero, heroine, tmdb_id')
    .eq('is_published', true)
    .not('poster_url', 'is', null)
    .order('release_year', { ascending: true }); // Oldest first to catch classic movies

  if (error) {
    console.error(chalk.red('Error fetching movies:'), error.message);
    return;
  }

  console.log(chalk.gray(`Analyzing ${movies?.length || 0} movies with posters\n`));

  const suspicious: SuspiciousImage[] = [];
  let processed = 0;

  for (const movie of movies || []) {
    processed++;

    if (processed % 50 === 0) {
      console.log(chalk.gray(`Progress: ${processed}/${movies?.length}`));
    }

    const detection = isSuspiciousImageUrl(movie.poster_url!, movie as Movie);

    if (detection.suspicious) {
      const issue: SuspiciousImage = {
        movieId: movie.id,
        title: movie.title_en,
        slug: movie.slug,
        year: movie.release_year,
        currentUrl: movie.poster_url!,
        reason: detection.reason,
      };

      // Try to find correct poster from TMDB
      const tmdbMovie = await searchTMDB(movie.title_en, movie.release_year);
      if (tmdbMovie && tmdbMovie.poster_path) {
        issue.correctUrl = `${TMDB_IMAGE_BASE}${tmdbMovie.poster_path}`;
        issue.tmdbId = tmdbMovie.id;
      }

      suspicious.push(issue);

      console.log(chalk.yellow(`\n⚠️  ${issue.title} (${issue.year})`));
      console.log(chalk.gray(`   Reason: ${issue.reason}`));
      console.log(chalk.gray(`   Current: ${issue.currentUrl}`));
      if (issue.correctUrl) {
        console.log(chalk.green(`   Correct: ${issue.correctUrl}`));
      }
      console.log(chalk.gray(`   URL: http://localhost:3000/movies/${issue.slug}`));

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Summary
  console.log(chalk.blue.bold('\n\n📊 Analysis Summary\n'));
  console.log(chalk.white(`Total movies analyzed: ${movies?.length || 0}`));
  console.log(chalk.yellow(`Suspicious images found: ${suspicious.length}`));
  console.log(chalk.green(`Corrections available: ${suspicious.filter(s => s.correctUrl).length}\n`));

  // Group by reason
  const byReason: Record<string, number> = {};
  suspicious.forEach(s => {
    byReason[s.reason] = (byReason[s.reason] || 0) + 1;
  });

  console.log(chalk.cyan('Issues by Type:'));
  Object.entries(byReason).forEach(([reason, count]) => {
    console.log(chalk.gray(`  ${reason}: ${count}`));
  });

  // Fix if execute mode
  if (execute && suspicious.length > 0) {
    console.log(chalk.blue.bold('\n\n🔧 Fixing Issues\n'));

    const fixable = suspicious.filter(s => s.correctUrl && s.tmdbId);
    console.log(chalk.yellow(`Attempting to fix ${fixable.length} movies...\n`));

    let fixed = 0;
    let failed = 0;

    for (const issue of fixable) {
      try {
        const { error: updateError } = await supabase
          .from('movies')
          .update({
            poster_url: issue.correctUrl,
            tmdb_id: issue.tmdbId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', issue.movieId);

        if (updateError) {
          console.log(chalk.red(`❌ ${issue.title}: ${updateError.message}`));
          failed++;
        } else {
          console.log(chalk.green(`✅ ${issue.title}`));
          fixed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.log(chalk.red(`❌ ${issue.title}: ${error}`));
        failed++;
      }
    }

    console.log(chalk.blue.bold('\n📊 Fix Summary\n'));
    console.log(chalk.green(`Fixed: ${fixed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(chalk.yellow(`Unable to fix (no TMDB match): ${suspicious.length - fixable.length}`));
  } else if (suspicious.length > 0) {
    console.log(chalk.yellow('\n💡 Run with --execute to fix these issues\n'));
  }

  // Export report
  if (suspicious.length > 0) {
    const fs = await import('fs');
    const timestamp = new Date().toISOString().split('T')[0];
    const outputPath = `./reports/actor-image-posters-${timestamp}.json`;
    
    fs.writeFileSync(outputPath, JSON.stringify(suspicious, null, 2));
    console.log(chalk.blue(`\n📄 Full report saved to: ${outputPath}\n`));

    // Also create a TSV for easy review
    const tsvPath = `./reports/actor-image-posters-${timestamp}.tsv`;
    const tsvContent = [
      'Title\tYear\tSlug\tReason\tCurrent URL\tCorrect URL\tPage URL',
      ...suspicious.map(s => 
        `${s.title}\t${s.year}\t${s.slug}\t${s.reason}\t${s.currentUrl}\t${s.correctUrl || 'N/A'}\thttp://localhost:3000/movies/${s.slug}`
      )
    ].join('\n');
    
    fs.writeFileSync(tsvPath, tsvContent);
    console.log(chalk.blue(`📄 TSV report saved to: ${tsvPath}\n`));
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  if (execute) {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Will update database\n'));
  } else {
    console.log(chalk.blue('ℹ️  DRY RUN - No changes will be made\n'));
  }

  await analyzeMovies(execute);
}

main().catch(console.error);
