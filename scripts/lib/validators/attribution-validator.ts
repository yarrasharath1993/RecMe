/**
 * ATTRIBUTION VALIDATOR
 * 
 * Validates cast attributions, language/genre data:
 * - Gender mismatches (male in heroine, female in hero)
 * - Impossible pairings (same person as hero & heroine)
 * - Language mismatches with external sources
 * - Genre inconsistencies
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

export interface MovieForAttribution {
  id: string;
  title_en: string;
  release_year?: number | null;
  hero?: string | null;
  heroine?: string | null;
  director?: string | null;
  language?: string | null;
  genres?: string[] | null;
  tmdb_id?: number | null;
  imdb_id?: string | null;
}

export interface Celebrity {
  id: string;
  name_en: string;
  gender?: string | null;
  debut_year?: number | null;
  death_year?: number | null;
  primary_language?: string | null;
}

export interface CastMismatch {
  movieId: string;
  title: string;
  year: number | null;
  actor: string;
  role: 'hero' | 'heroine' | 'hero2' | 'heroine2' | 'director';
  issue: 'wrong_gender' | 'impossible_pairing' | 'deceased_actor';
  reason: string;
  confidence: number;
  recommendedFix: string;
}

export interface LanguageGenreMismatch {
  movieId: string;
  title: string;
  year: number | null;
  field: 'language' | 'genre';
  currentValue: string;
  tmdbValue?: string;
  imdbValue?: string;
  wikipediaValue?: string;
  consensusValue: string;
  confidence: number;
  source: string;
}

export interface AttributionValidationResult {
  castMismatches: CastMismatch[];
  languageMismatches: LanguageGenreMismatch[];
  genreMismatches: LanguageGenreMismatch[];
  totalMoviesChecked: number;
  totalIssuesFound: number;
}

// ============================================================
// CELEBRITY DATABASE UTILITIES
// ============================================================

/**
 * Fetch celebrity info from database
 */
async function getCelebrityInfo(
  supabase: SupabaseClient,
  name: string
): Promise<Celebrity | null> {
  const { data, error } = await supabase
    .from('celebrities')
    .select('id, name_en, gender, debut_year, death_year, primary_language')
    .ilike('name_en', name)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Celebrity;
}

/**
 * Batch fetch celebrities
 */
async function getCelebritiesBatch(
  supabase: SupabaseClient,
  names: string[]
): Promise<Map<string, Celebrity>> {
  const uniqueNames = [...new Set(names.filter(n => n))];
  
  if (uniqueNames.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('celebrities')
    .select('id, name_en, gender, debut_year, death_year, primary_language')
    .in('name_en', uniqueNames);

  if (error || !data) {
    return new Map();
  }

  const map = new Map<string, Celebrity>();
  for (const celeb of data) {
    map.set(celeb.name_en.toLowerCase(), celeb as Celebrity);
  }

  return map;
}

// ============================================================
// CAST ATTRIBUTION VALIDATION
// ============================================================

/**
 * Extract all heroes from a movie (handles multiple heroes)
 */
function extractHeroes(movie: MovieForAttribution): string[] {
  const heroes: string[] = [];
  
  if (movie.hero) {
    // Handle comma-separated heroes
    if (movie.hero.includes(',')) {
      heroes.push(...movie.hero.split(',').map(h => h.trim()).filter(h => h));
    } else {
      heroes.push(movie.hero);
    }
  }
  
  return heroes;
}

/**
 * Extract all heroines from a movie (handles multiple heroines)
 */
function extractHeroines(movie: MovieForAttribution): string[] {
  const heroines: string[] = [];
  
  if (movie.heroine) {
    // Handle comma-separated heroines
    if (movie.heroine.includes(',')) {
      heroines.push(...movie.heroine.split(',').map(h => h.trim()).filter(h => h));
    } else {
      heroines.push(movie.heroine);
    }
  }
  
  return heroines;
}

/**
 * Validate gender attribution
 */
function validateGenderAttribution(
  movie: MovieForAttribution,
  celebrities: Map<string, Celebrity>
): CastMismatch[] {
  const mismatches: CastMismatch[] = [];

  // Check all heroes (should be male)
  const heroes = extractHeroes(movie);
  for (const hero of heroes) {
    const celeb = celebrities.get(hero.toLowerCase());
    if (celeb && celeb.gender && celeb.gender.toLowerCase() === 'female') {
      mismatches.push({
        movieId: movie.id,
        title: movie.title_en,
        year: movie.release_year,
        actor: hero,
        role: 'hero',
        issue: 'wrong_gender',
        reason: `${hero} is female but assigned as hero`,
        confidence: 0.95,
        recommendedFix: 'Move to heroine field or check if correct actor',
      });
    }
  }

  // Check all heroines (should be female)
  const heroines = extractHeroines(movie);
  for (const heroine of heroines) {
    const celeb = celebrities.get(heroine.toLowerCase());
    if (celeb && celeb.gender && celeb.gender.toLowerCase() === 'male') {
      mismatches.push({
        movieId: movie.id,
        title: movie.title_en,
        year: movie.release_year,
        actor: heroine,
        role: 'heroine',
        issue: 'wrong_gender',
        reason: `${heroine} is male but assigned as heroine`,
        confidence: 0.95,
        recommendedFix: 'Move to hero field or check if correct actor',
      });
    }
  }

  return mismatches;
}

/**
 * Validate impossible pairings
 */
function validateImpossiblePairings(
  movie: MovieForAttribution,
  celebrities: Map<string, Celebrity>
): CastMismatch[] {
  const mismatches: CastMismatch[] = [];

  // Extract all heroes and heroines
  const heroes = extractHeroes(movie);
  const heroines = extractHeroines(movie);

  // Check if same person appears as both hero and heroine
  for (const hero of heroes) {
    for (const heroine of heroines) {
      if (hero.toLowerCase() === heroine.toLowerCase()) {
        mismatches.push({
          movieId: movie.id,
          title: movie.title_en,
          year: movie.release_year,
          actor: hero,
          role: 'hero',
          issue: 'impossible_pairing',
          reason: 'Same person listed as both hero and heroine',
          confidence: 1.0,
          recommendedFix: 'Check data entry error',
        });
      }
    }
  }

  // Check if deceased actor in recent film
  const castMembers: Array<{ name: string; role: 'hero' | 'heroine' | 'director' }> = [
    ...heroes.map(name => ({ name, role: 'hero' as const })),
    ...heroines.map(name => ({ name, role: 'heroine' as const })),
  ];

  if (movie.director) {
    castMembers.push({ name: movie.director, role: 'director' });
  }

  for (const { name, role } of castMembers) {
    const celeb = celebrities.get(name.toLowerCase());
    if (celeb && celeb.death_year && movie.release_year) {
      if (movie.release_year > celeb.death_year) {
        mismatches.push({
          movieId: movie.id,
          title: movie.title_en,
          year: movie.release_year,
          actor: name,
          role,
          issue: 'deceased_actor',
          reason: `${name} died in ${celeb.death_year} but movie released in ${movie.release_year}`,
          confidence: 0.90,
          recommendedFix: 'Check movie release year or actor name',
        });
      }
    }
  }

  return mismatches;
}

// ============================================================
// LANGUAGE/GENRE VALIDATION (placeholder for external API calls)
// ============================================================

/**
 * Validate language against external sources
 * Note: This is a placeholder. Full implementation would call TMDB/IMDb APIs
 */
export function validateLanguage(
  movie: MovieForAttribution,
  tmdbData?: any,
  imdbData?: any
): LanguageGenreMismatch | null {
  // This would require actual API calls to TMDB/IMDb
  // For now, just check basic patterns
  
  if (!movie.language) {
    return null;
  }

  // Example: If movie has tmdb_id, we could fetch and compare
  // This is a placeholder for the actual implementation
  
  return null;
}

/**
 * Validate genres against external sources
 * Note: This is a placeholder for full implementation
 */
export function validateGenres(
  movie: MovieForAttribution,
  tmdbData?: any
): LanguageGenreMismatch[] {
  // Placeholder - would require actual TMDB API calls
  return [];
}

// ============================================================
// COMPREHENSIVE ATTRIBUTION VALIDATION
// ============================================================

/**
 * Run all attribution validation checks
 */
export async function validateAttributions(
  supabase: SupabaseClient,
  movies: MovieForAttribution[],
  options: {
    checkGender?: boolean;
    checkImpossiblePairings?: boolean;
    checkLanguage?: boolean;
    checkGenres?: boolean;
  } = {}
): Promise<AttributionValidationResult> {
  const {
    checkGender = true,
    checkImpossiblePairings = true,
    checkLanguage = false, // Disabled by default (requires external API)
    checkGenres = false,   // Disabled by default (requires external API)
  } = options;

  console.log(`Validating attributions for ${movies.length} movies...`);

  // Collect all celebrity names (handle multiple heroes/heroines)
  const allNames: string[] = [];
  for (const movie of movies) {
    allNames.push(...extractHeroes(movie));
    allNames.push(...extractHeroines(movie));
    if (movie.director) allNames.push(movie.director);
  }

  // Batch fetch celebrity data
  console.log('  Fetching celebrity data...');
  const celebrities = await getCelebritiesBatch(supabase, allNames);
  console.log(`  Found ${celebrities.size} celebrities in database`);

  const castMismatches: CastMismatch[] = [];
  const languageMismatches: LanguageGenreMismatch[] = [];
  const genreMismatches: LanguageGenreMismatch[] = [];

  // Process each movie
  for (const movie of movies) {
    // Gender validation
    if (checkGender) {
      const genderIssues = validateGenderAttribution(movie, celebrities);
      castMismatches.push(...genderIssues);
    }

    // Impossible pairings
    if (checkImpossiblePairings) {
      const pairingIssues = validateImpossiblePairings(movie, celebrities);
      castMismatches.push(...pairingIssues);
    }

    // Language validation (if enabled and external data available)
    if (checkLanguage) {
      const langIssue = validateLanguage(movie);
      if (langIssue) {
        languageMismatches.push(langIssue);
      }
    }

    // Genre validation (if enabled)
    if (checkGenres) {
      const genreIssues = validateGenres(movie);
      genreMismatches.push(...genreIssues);
    }
  }

  const totalIssuesFound =
    castMismatches.length +
    languageMismatches.length +
    genreMismatches.length;

  return {
    castMismatches,
    languageMismatches,
    genreMismatches,
    totalMoviesChecked: movies.length,
    totalIssuesFound,
  };
}
