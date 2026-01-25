/**
 * Batch Enrich Celebrity Profiles
 * 
 * Enriches all celebrity profiles using multi-source data:
 * - Database movie analysis (co-stars, genres, eras)
 * - TMDB API (images, biography, external IDs)
 * - Wikipedia (birth details, biography)
 * - Derived analytics (hit rate, genre distribution)
 * 
 * Usage:
 *   npx tsx scripts/batch-enrich-celebrity-profiles.ts --dry              # Preview all
 *   npx tsx scripts/batch-enrich-celebrity-profiles.ts --execute          # Enrich all
 *   npx tsx scripts/batch-enrich-celebrity-profiles.ts --execute --limit=10  # First 10
 *   npx tsx scripts/batch-enrich-celebrity-profiles.ts --execute --slug=ntr   # Specific person
 *   npx tsx scripts/batch-enrich-celebrity-profiles.ts --execute --min-movies=20  # Min movie count
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// ============================================================
// TYPES
// ============================================================

interface Celebrity {
  id: string;
  name_en: string;
  name_te?: string;
  slug: string;
  gender?: string;
  tmdb_id?: number;
  imdb_id?: string;
  industry_title?: string;
  short_bio?: string;
  profile_image?: string;
  occupation?: string[];
  birth_date?: string;
  birth_place?: string;
  is_published?: boolean;
}

interface Movie {
  id: string;
  title_en: string;
  slug: string;
  release_year: number;
  hero?: string;
  heroine?: string;
  director?: string;
  supporting_cast?: string;
  genres?: string[];
  primary_genre?: string;
  avg_rating?: number;
  our_rating?: number;
  is_blockbuster?: boolean;
  is_classic?: boolean;
}

interface EnrichmentResult {
  celebrityId: string;
  name: string;
  slug: string;
  success: boolean;
  fieldsUpdated: number;
  error?: string;
}

interface CareerEra {
  name: string;
  years: string;
  themes: string[];
  key_films: string[];
  movie_count: number;
  highlights: string;
}

interface RomanticPairing {
  name: string;
  slug: string;
  count: number;
  highlight: string;
  films: string[];
}

// ============================================================
// INDUSTRY TITLES MAP (Known celebrities)
// ============================================================

const INDUSTRY_TITLES: Record<string, { title: string; usp: string }> = {
  'chiranjeevi': { 
    title: 'Megastar', 
    usp: 'Unparalleled mass connect + Dance revolution — Transformed Telugu cinema' 
  },
  'akkineni-nagarjuna': { 
    title: 'King', 
    usp: 'Versatility across 4 decades + Multi-generational appeal — Action to romance' 
  },
  'ntr': { 
    title: 'Young Tiger / Man of Masses', 
    usp: 'Dance sensation + Mass appeal + RRR global success' 
  },
  'n.t. rama rao jr.': { 
    title: 'Young Tiger / Man of Masses', 
    usp: 'Dance sensation + Mass appeal + RRR global success' 
  },
  'mahesh-babu': { 
    title: 'Superstar / Prince', 
    usp: 'Pan-India appeal + Class + Commercial dominance — Inherited Superstar legacy' 
  },
  'prabhas': { 
    title: 'Rebel Star / Darling / Global Star', 
    usp: 'Baahubali phenomenon + Pan-India pioneer + Diverse genres' 
  },
  'ram-charan': { 
    title: 'Mega Power Star / Global Star', 
    usp: 'RRR global success + Dance excellence + Oscar glory with Naatu Naatu' 
  },
  'allu-arjun': { 
    title: 'Icon Star', 
    usp: 'Pushpa phenomenon + Dance king + Pan-India star — National Award winner' 
  },
  'pawan-kalyan': { 
    title: 'Power Star', 
    usp: 'Mass appeal + Political leader (Deputy CM AP) + Mega family' 
  },
  'balakrishna': { 
    title: 'Nandamuri Balakrishna', 
    usp: 'NTR legacy + Action star + Politician' 
  },
  'nandamuri-balakrishna': { 
    title: 'Nandamuri Balakrishna', 
    usp: 'NTR legacy + Action star + Politician' 
  },
  'venkatesh': { 
    title: 'Victory Venkatesh', 
    usp: 'Family entertainer king + Evergreen appeal + 4 decades career' 
  },
  'daggubati-venkatesh': { 
    title: 'Victory Venkatesh', 
    usp: 'Family entertainer king + Evergreen appeal + 4 decades career' 
  },
  'ravi-teja': { 
    title: 'Mass Maharaja', 
    usp: 'Mass entertainment + Comedy timing + Energy performer' 
  },
  'nani': { 
    title: 'Natural Star', 
    usp: 'Content-driven cinema + Versatile performer + Producer' 
  },
  'vijay-deverakonda': { 
    title: 'Rowdy', 
    usp: 'New-age star + Youth icon + Arjun Reddy phenomenon' 
  },
  'siddharth': { 
    title: 'Actor', 
    usp: 'Multi-lingual star + Unconventional choices' 
  },
  'rana-daggubati': { 
    title: 'Actor', 
    usp: 'Baahubali antagonist + Versatile roles + Producer' 
  },
  'nagarjuna-akkineni': { 
    title: 'King', 
    usp: 'Versatility across 4 decades + Multi-generational appeal' 
  },
  'anr': { 
    title: 'Natasamrat', 
    usp: 'Legendary actor + Romantic hero' 
  },
  'akkineni-nageswara-rao': { 
    title: 'Natasamrat', 
    usp: 'Legendary actor + Romantic hero + Dadasaheb Phalke awardee' 
  },
  'ntr-sr': { 
    title: 'Nandamuri Taraka Rama Rao', 
    usp: 'Legendary star + Mythological roles + CM AP' 
  },
  'n.t. rama rao': { 
    title: 'Nandamuri Taraka Rama Rao', 
    usp: 'Legendary star + Mythological roles + CM AP' 
  },
  'krishna': { 
    title: 'Superstar', 
    usp: 'James Bond of Telugu cinema + Producer + Mahesh Babu father' 
  },
  'sobhan-babu': { 
    title: 'Evergreen Hero', 
    usp: 'Romantic hero + Handsome star' 
  },
  'kamal-haasan': { 
    title: 'Universal Star', 
    usp: 'Method acting + Multi-lingual icon + Padma Bhushan' 
  },
  'rajinikanth': { 
    title: 'Superstar', 
    usp: 'Style icon + Mass appeal + Pan-India phenomenon' 
  },
  'sharwanand': { 
    title: 'Actor', 
    usp: 'Content-driven cinema + Family entertainer specialist' 
  },
  'naga-chaitanya': { 
    title: 'Yuva Samrat', 
    usp: 'Akkineni legacy + Romantic hero + Content choices' 
  },
  'naga-chaitanya-akkineni': { 
    title: 'Yuva Samrat', 
    usp: 'Akkineni legacy + Romantic hero + Content choices' 
  },
  'varun-tej': { 
    title: 'Mega Prince', 
    usp: 'Mega family + Versatile roles' 
  },
  'sai-dharam-tej': { 
    title: 'Supreme Hero', 
    usp: 'Mega family + Mass entertainer' 
  },
  'anushka-shetty': { 
    title: 'Lady Superstar', 
    usp: 'Baahubali Devasena + Size Zero transformation + Multi-lingual' 
  },
  'samantha': { 
    title: 'Samantha Ruth Prabhu', 
    usp: 'Pan-India success + OTT pioneer + Oo Antava phenomenon' 
  },
  'samantha-ruth-prabhu': { 
    title: 'Samantha Ruth Prabhu', 
    usp: 'Pan-India success + OTT pioneer + Oo Antava phenomenon' 
  },
  'nayanthara': { 
    title: 'Lady Superstar', 
    usp: 'South Indian queen + Jawan success + Multi-lingual' 
  },
  'rashmika-mandanna': { 
    title: 'National Crush', 
    usp: 'Pushpa fame + Pan-India appeal + Animal success' 
  },
  'pooja-hegde': { 
    title: 'Actress', 
    usp: 'Pan-India heroine + Bollywood crossover' 
  },
  's.s.-rajamouli': { 
    title: 'Director', 
    usp: 'Baahubali + RRR creator + Oscar winner + Visionary filmmaker' 
  },
  'trivikram-srinivas': { 
    title: 'Director', 
    usp: 'Dialogue wizard + Commercial hits specialist' 
  },
  'sukumar': { 
    title: 'Director', 
    usp: 'Pushpa creator + Visual storyteller + Arya trilogy' 
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function fetchTMDBPerson(tmdbId: number): Promise<Record<string, unknown> | null> {
  if (!TMDB_API_KEY || !tmdbId) return null;
  
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/person/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      profile_image: data.profile_path ? `https://image.tmdb.org/t/p/w500${data.profile_path}` : null,
      biography: data.biography,
      birthday: data.birthday,
      place_of_birth: data.place_of_birth,
      imdb_id: data.imdb_id || data.external_ids?.imdb_id,
      popularity: data.popularity,
      known_for: data.known_for_department,
    };
  } catch {
    return null;
  }
}

async function searchTMDBPerson(name: string): Promise<{ id: number; profile_path?: string } | null> {
  if (!TMDB_API_KEY) return null;
  
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return {
        id: data.results[0].id,
        profile_path: data.results[0].profile_path 
          ? `https://image.tmdb.org/t/p/w500${data.results[0].profile_path}` 
          : undefined
      };
    }
    return null;
  } catch {
    return null;
  }
}

function determineGender(celebrity: Celebrity, movies: Movie[]): string {
  if (celebrity.gender) return celebrity.gender;
  
  // Check if they appear as hero or heroine in movies
  const asHero = movies.filter(m => 
    m.hero?.toLowerCase().includes(celebrity.name_en.toLowerCase())
  ).length;
  
  const asHeroine = movies.filter(m => 
    m.heroine?.toLowerCase().includes(celebrity.name_en.toLowerCase())
  ).length;
  
  if (asHero > asHeroine) return 'male';
  if (asHeroine > asHero) return 'female';
  
  return 'male'; // Default
}

function checkInSupportingCast(supportingCast: unknown, name: string): boolean {
  if (!supportingCast) return false;
  const nameLower = name.toLowerCase();
  
  if (typeof supportingCast === 'string') {
    return supportingCast.toLowerCase().includes(nameLower);
  }
  
  if (Array.isArray(supportingCast)) {
    return supportingCast.some(s => {
      if (typeof s === 'string') return s.toLowerCase().includes(nameLower);
      if (typeof s === 'object' && s !== null && 'name' in s) {
        return String(s.name).toLowerCase().includes(nameLower);
      }
      return false;
    });
  }
  
  return false;
}

function determineOccupation(celebrity: Celebrity, movies: Movie[]): string[] {
  const occupations: string[] = [];
  const nameLower = celebrity.name_en.toLowerCase();
  
  const asHero = movies.filter(m => 
    m.hero?.toLowerCase().includes(nameLower)
  ).length;
  
  const asHeroine = movies.filter(m => 
    m.heroine?.toLowerCase().includes(nameLower)
  ).length;
  
  const asDirector = movies.filter(m => 
    m.director?.toLowerCase().includes(nameLower)
  ).length;
  
  const asSupport = movies.filter(m => 
    checkInSupportingCast(m.supporting_cast, celebrity.name_en)
  ).length;
  
  if (asHero > 0 || asHeroine > 0) occupations.push('actor');
  if (asDirector > 0) occupations.push('director');
  if (asSupport > asHero + asHeroine) occupations.push('character_actor');
  
  return occupations.length > 0 ? occupations : ['actor'];
}

function analyzeCareerEras(movies: Movie[], name: string): CareerEra[] {
  if (movies.length < 5) return [];
  
  const sortedMovies = [...movies].sort((a, b) => a.release_year - b.release_year);
  const firstYear = sortedMovies[0].release_year;
  const lastYear = sortedMovies[sortedMovies.length - 1].release_year;
  const careerSpan = lastYear - firstYear;
  
  if (careerSpan < 10) {
    // Single era for short careers
    return [{
      name: 'Active Era',
      years: `${firstYear}-${lastYear}`,
      themes: ['Film career'],
      key_films: sortedMovies.slice(0, 5).map(m => m.title_en),
      movie_count: movies.length,
      highlights: `${movies.length} films spanning ${careerSpan + 1} years`
    }];
  }
  
  // Divide into eras based on decades
  const eras: CareerEra[] = [];
  const decades: Record<string, Movie[]> = {};
  
  for (const movie of sortedMovies) {
    const decade = Math.floor(movie.release_year / 10) * 10;
    const key = `${decade}s`;
    if (!decades[key]) decades[key] = [];
    decades[key].push(movie);
  }
  
  const decadeKeys = Object.keys(decades).sort();
  
  for (const decade of decadeKeys) {
    const decadeMovies = decades[decade];
    const startYear = Math.min(...decadeMovies.map(m => m.release_year));
    const endYear = Math.max(...decadeMovies.map(m => m.release_year));
    
    const topMovies = decadeMovies
      .sort((a, b) => getMovieRating(b) - getMovieRating(a))
      .slice(0, 5)
      .map(m => m.title_en);
    
    // Derive themes from genres
    const genres = decadeMovies
      .flatMap(m => m.genres || (m.primary_genre ? [m.primary_genre] : []))
      .filter(Boolean);
    const uniqueGenres = [...new Set(genres)].slice(0, 4);
    
    eras.push({
      name: `${decade} Era`,
      years: `${startYear}-${endYear}`,
      themes: uniqueGenres.length > 0 ? uniqueGenres : ['Film career'],
      key_films: topMovies,
      movie_count: decadeMovies.length,
      highlights: `${decadeMovies.length} films in the ${decade}`
    });
  }
  
  return eras;
}

function analyzeRomanticPairings(movies: Movie[], celebrity: Celebrity): RomanticPairing[] {
  const gender = determineGender(celebrity, movies);
  const pairings: Record<string, { count: number; films: string[] }> = {};
  
  for (const movie of movies) {
    const isHero = movie.hero?.toLowerCase().includes(celebrity.name_en.toLowerCase());
    const isHeroine = movie.heroine?.toLowerCase().includes(celebrity.name_en.toLowerCase());
    
    if (gender === 'male' && isHero && movie.heroine) {
      // Get co-heroines
      const heroines = movie.heroine.split(',').map(h => h.trim()).filter(Boolean);
      for (const heroine of heroines) {
        if (heroine.toLowerCase() !== celebrity.name_en.toLowerCase()) {
          if (!pairings[heroine]) pairings[heroine] = { count: 0, films: [] };
          pairings[heroine].count++;
          pairings[heroine].films.push(movie.title_en);
        }
      }
    } else if (gender === 'female' && isHeroine && movie.hero) {
      // Get co-heroes
      const heroes = movie.hero.split(',').map(h => h.trim()).filter(Boolean);
      for (const hero of heroes) {
        if (hero.toLowerCase() !== celebrity.name_en.toLowerCase()) {
          if (!pairings[hero]) pairings[hero] = { count: 0, films: [] };
          pairings[hero].count++;
          pairings[hero].films.push(movie.title_en);
        }
      }
    }
  }
  
  // Sort by count and take top 10
  return Object.entries(pairings)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      count: data.count,
      highlight: data.count >= 5 ? 'Frequent pairing' : 
                 data.count >= 3 ? 'Notable pairing' : 'Occasional pairing',
      films: data.films.slice(0, 5)
    }));
}

function analyzeGenreDistribution(movies: Movie[]): Record<string, number> {
  const genreCounts: Record<string, number> = {};
  
  for (const movie of movies) {
    // Use genres array or primary_genre
    const genreList = movie.genres || (movie.primary_genre ? [movie.primary_genre] : []);
    for (const genre of genreList) {
      const g = genre?.toLowerCase().trim();
      if (g) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    }
  }
  
  return genreCounts;
}

function getMovieRating(movie: Movie): number {
  return movie.our_rating || movie.avg_rating || 0;
}

function generateBrandPillars(
  celebrity: Celebrity, 
  movies: Movie[], 
  eras: CareerEra[],
  pairings: RomanticPairing[]
): string[] {
  const pillars: string[] = [];
  const totalMovies = movies.length;
  const careerSpan = eras.length > 0 
    ? parseInt(eras[eras.length - 1].years.split('-')[1]) - parseInt(eras[0].years.split('-')[0]) + 1
    : 0;
  
  // Industry title if known
  const knownTitle = INDUSTRY_TITLES[celebrity.slug];
  if (knownTitle) {
    pillars.push(`${knownTitle.title} brand`);
  }
  
  // Movie count milestone
  if (totalMovies >= 100) {
    pillars.push(`${totalMovies}+ film legacy`);
  } else if (totalMovies >= 50) {
    pillars.push(`${totalMovies}+ films career`);
  }
  
  // Career span
  if (careerSpan >= 30) {
    pillars.push(`${careerSpan}+ years in cinema`);
  } else if (careerSpan >= 20) {
    pillars.push(`Two-decade career`);
  }
  
  // Top pairing
  if (pairings.length > 0 && pairings[0].count >= 5) {
    pillars.push(`Iconic pairing with ${pairings[0].name}`);
  }
  
  // Genre specialization
  const genres = analyzeGenreDistribution(movies);
  const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0];
  if (topGenre && topGenre[1] >= 10) {
    pillars.push(`${topGenre[0].charAt(0).toUpperCase() + topGenre[0].slice(1)} specialist`);
  }
  
  // Hit rate
  const classics = movies.filter(m => m.is_classic).length;
  const blockbusters = movies.filter(m => m.is_blockbuster).length;
  if (blockbusters >= 5) {
    pillars.push(`${blockbusters} blockbusters`);
  } else if (classics >= 5) {
    pillars.push(`${classics} classics`);
  }
  
  return pillars.slice(0, 6);
}

function generateLegacyImpact(
  celebrity: Celebrity,
  movies: Movie[],
  eras: CareerEra[],
  pairings: RomanticPairing[]
): string {
  const parts: string[] = [];
  const totalMovies = movies.length;
  
  // Career summary
  if (eras.length > 0) {
    const firstYear = eras[0].years.split('-')[0];
    const lastYear = eras[eras.length - 1].years.split('-')[1];
    parts.push(`Career spanning ${firstYear} to ${lastYear} with ${totalMovies} films.`);
  }
  
  // Top movies
  const topRated = movies
    .filter(m => getMovieRating(m) >= 7)
    .sort((a, b) => getMovieRating(b) - getMovieRating(a))
    .slice(0, 3)
    .map(m => m.title_en);
  
  if (topRated.length > 0) {
    parts.push(`Notable films include ${topRated.join(', ')}.`);
  }
  
  // Collaborations
  if (pairings.length > 0 && pairings[0].count >= 3) {
    parts.push(`Memorable collaborations with ${pairings.slice(0, 3).map(p => p.name).join(', ')}.`);
  }
  
  return parts.join(' ');
}

function generateFanCulture(
  celebrity: Celebrity,
  movies: Movie[],
  pairings: RomanticPairing[]
): Record<string, unknown> {
  const knownTitle = INDUSTRY_TITLES[celebrity.slug];
  
  const culture: Record<string, unknown> = {
    fan_identity: knownTitle 
      ? `${knownTitle.title} fans` 
      : `${celebrity.name_en} fans`,
    cultural_titles: knownTitle 
      ? [knownTitle.title, celebrity.name_en + ' Garu'] 
      : [celebrity.name_en + ' Garu'],
    viral_moments: [],
    trivia: [
      `Appeared in ${movies.length} Telugu films`,
      movies[0] ? `Debut film: ${movies[0].title_en} (${movies[0].release_year})` : null,
      pairings[0] ? `Most frequent co-star: ${pairings[0].name} (${pairings[0].count} films)` : null
    ].filter(Boolean),
    entrepreneurial: [],
    tech_edge: null,
    signature_dialogues: [],
    social_links: []
  };
  
  return culture;
}

// ============================================================
// MAIN ENRICHMENT LOGIC
// ============================================================

async function getCelebrityMovies(celebrity: Celebrity): Promise<Movie[]> {
  const name = celebrity.name_en;
  
  // Query without supporting_cast (it's JSONB)
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, hero, heroine, director, supporting_cast, genres, primary_genre, avg_rating, our_rating, is_blockbuster, is_classic')
    .or(`hero.ilike.%${name}%,heroine.ilike.%${name}%,director.ilike.%${name}%`)
    .order('release_year', { ascending: true });
  
  return (movies || []) as Movie[];
}

async function enrichCelebrity(celebrity: Celebrity, dryRun: boolean): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    celebrityId: celebrity.id,
    name: celebrity.name_en,
    slug: celebrity.slug,
    success: false,
    fieldsUpdated: 0
  };
  
  try {
    // Get movies
    const movies = await getCelebrityMovies(celebrity);
    
    if (movies.length === 0) {
      result.error = 'No movies found';
      return result;
    }
    
    // Fetch TMDB data
    let tmdbData: Record<string, unknown> | null = null;
    if (celebrity.tmdb_id) {
      tmdbData = await fetchTMDBPerson(celebrity.tmdb_id);
    } else {
      // Try to search
      const searchResult = await searchTMDBPerson(celebrity.name_en);
      if (searchResult) {
        tmdbData = await fetchTMDBPerson(searchResult.id);
        if (tmdbData) {
          (tmdbData as Record<string, unknown>).tmdb_id = searchResult.id;
        }
      }
    }
    
    // Analyze career
    const gender = determineGender(celebrity, movies);
    const occupation = determineOccupation(celebrity, movies);
    const eras = analyzeCareerEras(movies, celebrity.name_en);
    const pairings = analyzeRomanticPairings(movies, celebrity);
    const brandPillars = generateBrandPillars(celebrity, movies, eras, pairings);
    const legacyImpact = generateLegacyImpact(celebrity, movies, eras, pairings);
    const fanCulture = generateFanCulture(celebrity, movies, pairings);
    
    // Get known industry title
    const knownTitle = INDUSTRY_TITLES[celebrity.slug];
    
    // Build update payload (only update empty fields)
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // Core fields
    if (!celebrity.gender) {
      updatePayload.gender = gender;
      result.fieldsUpdated++;
    }
    
    if (!celebrity.occupation || celebrity.occupation.length === 0) {
      updatePayload.occupation = occupation;
      result.fieldsUpdated++;
    }
    
    if (!celebrity.industry_title && knownTitle) {
      updatePayload.industry_title = knownTitle.title;
      result.fieldsUpdated++;
    }
    
    // TMDB data
    if (tmdbData) {
      if (!celebrity.tmdb_id && tmdbData.tmdb_id) {
        updatePayload.tmdb_id = tmdbData.tmdb_id;
        result.fieldsUpdated++;
      }
      
      if (!celebrity.imdb_id && tmdbData.imdb_id) {
        updatePayload.imdb_id = tmdbData.imdb_id;
        result.fieldsUpdated++;
      }
      
      if (!celebrity.profile_image && tmdbData.profile_image) {
        updatePayload.profile_image = tmdbData.profile_image;
        updatePayload.profile_image_source = 'tmdb';
        result.fieldsUpdated++;
      }
      
      if (!celebrity.short_bio && tmdbData.biography && typeof tmdbData.biography === 'string' && tmdbData.biography.length > 50) {
        updatePayload.short_bio = (tmdbData.biography as string).substring(0, 500);
        result.fieldsUpdated++;
      }
      
      if (!celebrity.birth_date && tmdbData.birthday) {
        updatePayload.birth_date = tmdbData.birthday;
        result.fieldsUpdated++;
      }
      
      if (!celebrity.birth_place && tmdbData.place_of_birth) {
        updatePayload.birth_place = tmdbData.place_of_birth;
        result.fieldsUpdated++;
      }
    }
    
    // Derived analytics (always update these)
    if (eras.length > 0) {
      updatePayload.actor_eras = eras;
      updatePayload.active_years_start = parseInt(eras[0].years.split('-')[0]);
      updatePayload.active_years_end = parseInt(eras[eras.length - 1].years.split('-')[1]);
      result.fieldsUpdated++;
    }
    
    if (pairings.length > 0) {
      updatePayload.romantic_pairings = pairings;
      result.fieldsUpdated++;
    }
    
    if (brandPillars.length > 0) {
      updatePayload.brand_pillars = brandPillars;
      result.fieldsUpdated++;
    }
    
    if (legacyImpact) {
      updatePayload.legacy_impact = legacyImpact;
      result.fieldsUpdated++;
    }
    
    if (knownTitle && !celebrity.industry_title) {
      updatePayload.usp = knownTitle.usp;
      result.fieldsUpdated++;
    }
    
    // Fan culture
    updatePayload.fan_culture = fanCulture;
    result.fieldsUpdated++;
    
    // Trust scores
    const movieCount = movies.length;
    updatePayload.trust_score = Math.min(50 + movieCount, 95);
    updatePayload.entity_confidence_score = Math.min(40 + movieCount, 90);
    updatePayload.freshness_score = 80;
    updatePayload.popularity_score = Math.min(30 + movieCount * 2, 95);
    updatePayload.is_published = true;
    result.fieldsUpdated += 4;
    
    if (dryRun) {
      result.success = true;
      return result;
    }
    
    // Execute update
    const { error: updateError } = await supabase
      .from('celebrities')
      .update(updatePayload)
      .eq('id', celebrity.id);
    
    if (updateError) {
      result.error = updateError.message;
      return result;
    }
    
    result.success = true;
    return result;
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const slugArg = args.find(a => a.startsWith('--slug='));
  const minMoviesArg = args.find(a => a.startsWith('--min-movies='));
  
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
  const targetSlug = slugArg ? slugArg.split('=')[1] : undefined;
  const minMovies = minMoviesArg ? parseInt(minMoviesArg.split('=')[1]) : 5;
  
  console.log(chalk.cyan('\n🎬 Batch Celebrity Profile Enrichment\n'));
  console.log(chalk.gray(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`));
  if (limit) console.log(chalk.gray(`Limit: ${limit}`));
  if (targetSlug) console.log(chalk.gray(`Target: ${targetSlug}`));
  console.log(chalk.gray(`Min movies: ${minMovies}`));
  console.log();
  
  // Fetch celebrities
  let query = supabase
    .from('celebrities')
    .select('id, name_en, name_te, slug, gender, tmdb_id, imdb_id, industry_title, short_bio, profile_image, occupation, birth_date, birth_place, is_published')
    .eq('is_published', true)
    .order('name_en');
  
  if (targetSlug) {
    query = query.eq('slug', targetSlug);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data: celebrities, error } = await query;
  
  if (error) {
    console.error(chalk.red('Error fetching celebrities:'), error.message);
    process.exit(1);
  }
  
  if (!celebrities || celebrities.length === 0) {
    console.log(chalk.yellow('No celebrities found'));
    process.exit(0);
  }
  
  console.log(chalk.blue(`Found ${celebrities.length} celebrities to process\n`));
  
  // Filter by movie count
  const eligibleCelebrities: Celebrity[] = [];
  
  for (const celeb of celebrities) {
    const movies = await getCelebrityMovies(celeb);
    if (movies.length >= minMovies) {
      eligibleCelebrities.push(celeb);
    }
  }
  
  console.log(chalk.blue(`${eligibleCelebrities.length} celebrities have ${minMovies}+ movies\n`));
  
  // Process each celebrity
  const results: EnrichmentResult[] = [];
  let processed = 0;
  
  for (const celebrity of eligibleCelebrities) {
    processed++;
    process.stdout.write(chalk.gray(`[${processed}/${eligibleCelebrities.length}] ${celebrity.name_en.padEnd(30)}`));
    
    const result = await enrichCelebrity(celebrity, dryRun);
    results.push(result);
    
    if (result.success) {
      console.log(chalk.green(`✓ ${result.fieldsUpdated} fields`));
    } else {
      console.log(chalk.red(`✗ ${result.error}`));
    }
    
    // Rate limiting for TMDB
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  // Summary
  console.log(chalk.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.cyan('SUMMARY'));
  console.log(chalk.cyan('═'.repeat(60)));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalFields = results.reduce((sum, r) => sum + r.fieldsUpdated, 0);
  
  console.log(chalk.green(`✓ Successful: ${successful}`));
  console.log(chalk.red(`✗ Failed: ${failed}`));
  console.log(chalk.blue(`Fields updated: ${totalFields}`));
  
  if (dryRun) {
    console.log(chalk.yellow('\n🔍 DRY RUN - No changes made'));
    console.log(chalk.gray('Run with --execute to apply these changes'));
  }
  
  // Save report
  const reportPath = path.join(
    process.cwd(), 
    'docs', 
    'audit-reports', 
    `celebrity-enrichment-${Date.now()}.json`
  );
  
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    mode: dryRun ? 'dry_run' : 'execute',
    summary: { successful, failed, totalFields },
    results
  }, null, 2));
  
  console.log(chalk.gray(`\nReport saved: ${reportPath}`));
  console.log();
}

main().catch(console.error);
