/**
 * Auto-Generate Filmography Data
 * 
 * Analyzes movie data to generate:
 * - Actor eras (debut year, peak years, recent activity)
 * - Romantic pairings (frequent co-stars)
 * - Brand pillars (career patterns)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Celebrity {
  id: string;
  name_en: string;
  slug: string;
  occupation?: string[];
  actor_eras?: any;
  romantic_pairings?: any[];
  brand_pillars?: any[];
}

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  hero?: string;
  heroine?: string;
  director?: string;
  supporting_cast?: string[];
}

function calculateActorEras(movies: Movie[]): any {
  if (!movies || movies.length === 0) return null;

  const years = movies.map(m => m.release_year).filter(y => y > 1900 && y < 2030);
  if (years.length === 0) return null;

  years.sort((a, b) => a - b);
  
  const debutYear = years[0];
  const latestYear = years[years.length - 1];
  const careerSpan = latestYear - debutYear + 1;

  // Calculate peak years (years with most movies)
  const yearCounts: Record<number, number> = {};
  years.forEach(year => {
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  const peakYears = Object.entries(yearCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([year]) => parseInt(year));

  return {
    debut_year: debutYear,
    peak_years: peakYears,
    latest_year: latestYear,
    career_span_years: careerSpan,
    active_decades: getActiveDecades(years)
  };
}

function getActiveDecades(years: number[]): string[] {
  const decades = new Set<string>();
  years.forEach(year => {
    const decade = `${Math.floor(year / 10) * 10}s`;
    decades.add(decade);
  });
  return Array.from(decades).sort();
}

function calculateRomanticPairings(celebSlug: string, movies: Movie[], allCelebrities: Map<string, string>): any[] {
  const pairings: Record<string, { count: number; movies: string[] }> = {};

  movies.forEach(movie => {
    let coStars: string[] = [];
    
    // Collect potential co-stars
    if (movie.hero && movie.hero !== celebSlug) coStars.push(movie.hero);
    if (movie.heroine && movie.heroine !== celebSlug) coStars.push(movie.heroine);
    
    if (coStars.length === 0) return;

    coStars.forEach(coStar => {
      if (!pairings[coStar]) {
        pairings[coStar] = { count: 0, movies: [] };
      }
      pairings[coStar].count++;
      pairings[coStar].movies.push(movie.title_en);
    });
  });

  // Filter to significant pairings (3+ movies) and convert to array
  return Object.entries(pairings)
    .filter(([_, data]) => data.count >= 3)
    .map(([coStarSlug, data]) => ({
      co_star_slug: coStarSlug,
      co_star_name: allCelebrities.get(coStarSlug) || coStarSlug,
      movie_count: data.count,
      notable_films: data.movies.slice(0, 5)
    }))
    .sort((a, b) => b.movie_count - a.movie_count)
    .slice(0, 10); // Top 10 pairings
}

async function autoGenerateFilmographyData() {
  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           AUTO-GENERATE FILMOGRAPHY DATA                              ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  // Load all celebrities
  const { data: celebrities, error: celebError } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, occupation, actor_eras, romantic_pairings, brand_pillars');

  if (celebError || !celebrities) {
    console.error(chalk.red('Error loading celebrities:'), celebError);
    return;
  }

  console.log(chalk.white(`  Loaded ${celebrities.length} celebrities\n`));

  // Create slug->name map
  const celebMap = new Map<string, string>();
  celebrities.forEach(c => celebMap.set(c.slug, c.name_en));

  // Load all movies with cast
  const { data: movies, error: movieError } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, supporting_cast')
    .eq('is_published', true);

  if (movieError || !movies) {
    console.error(chalk.red('Error loading movies:'), movieError);
    return;
  }

  console.log(chalk.white(`  Loaded ${movies.length} published movies\n`));

  let erasGenerated = 0;
  let pairingsGenerated = 0;

  for (let i = 0; i < celebrities.length; i++) {
    const celeb = celebrities[i] as Celebrity;
    const progress = `[${i + 1}/${celebrities.length}]`;

    // Filter movies featuring this celebrity
    const celebMovies = movies.filter(m => 
      m.hero === celeb.slug || 
      m.heroine === celeb.slug || 
      m.director === celeb.slug ||
      (m.supporting_cast && Array.isArray(m.supporting_cast) && m.supporting_cast.includes(celeb.slug))
    ) as Movie[];

    if (celebMovies.length === 0) {
      console.log(`  ${progress} ${celeb.name_en}`.padEnd(40) + chalk.gray('⊘ no movies'));
      continue;
    }

    const updates: any = {};
    const changes: string[] = [];

    // Generate actor eras if missing
    if (!celeb.actor_eras) {
      const eras = calculateActorEras(celebMovies);
      if (eras) {
        updates.actor_eras = eras;
        changes.push('eras');
        erasGenerated++;
      }
    }

    // Generate romantic pairings if missing (actors/actresses only)
    const isActor = celeb.occupation?.some(occ => 
      ['actor', 'actress'].includes(occ.toLowerCase())
    );
    
    if (isActor && (!celeb.romantic_pairings || celeb.romantic_pairings.length === 0)) {
      const pairings = calculateRomanticPairings(celeb.slug, celebMovies, celebMap);
      if (pairings.length > 0) {
        updates.romantic_pairings = pairings;
        changes.push('pairings');
        pairingsGenerated++;
      }
    }

    // Update database if changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('celebrities')
        .update(updates)
        .eq('id', celeb.id);

      if (updateError) {
        console.log(`  ${progress} ${celeb.name_en}`.padEnd(40) + chalk.red('✗ update failed'));
      } else {
        console.log(`  ${progress} ${celeb.name_en}`.padEnd(40) + chalk.green(`✓ ${changes.join(', ')}`));
      }
    } else {
      console.log(`  ${progress} ${celeb.name_en}`.padEnd(40) + chalk.gray('⊘ no changes'));
    }
  }

  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                        SUMMARY                                         ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.green(`  ✅ Actor eras generated: ${erasGenerated}`));
  console.log(chalk.green(`  ✅ Romantic pairings generated: ${pairingsGenerated}\n`));
}

autoGenerateFilmographyData();
