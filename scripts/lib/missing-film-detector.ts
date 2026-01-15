/**
 * MISSING FILM DETECTOR
 * 
 * Detects films missing from our database by comparing with TMDB filmography.
 * Classifies actor's role based on cast order and character information.
 * 
 * Features:
 * - Fetch complete TMDB filmography for an actor
 * - Compare with database films (by TMDB ID and title similarity)
 * - Classify role: Lead (hero/heroine), Support, or Cameo
 * - Calculate confidence score for auto-add
 * - Filter Telugu films only
 * 
 * Role Classification:
 * - Cast order 1-2: Lead (95% confidence)
 * - Cast order 3-5: Support (85% confidence)
 * - Cast order 6-10: Support/Cameo (70% confidence)
 * - Cast order 11+: Cameo (60% confidence)
 * - Character name with "cameo"/"special": Cameo (90% confidence)
 */

import { CONFIDENCE_THRESHOLDS, boostConfidenceForConsensus } from './confidence-config';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// ============================================================
// TYPES
// ============================================================

export interface TMDBActorCredit {
  id: number;
  title: string;
  originalTitle: string;
  originalLanguage: string;
  releaseDate: string;
  releaseYear: number;
  character?: string;
  castOrder: number;
  posterPath?: string;
}

export interface MissingFilm {
  tmdbId: number;
  title: string;
  releaseYear: number;
  role: 'lead' | 'support' | 'cameo';
  castOrder: number;
  character?: string;
  confidence: number;
  reason: string;
  shouldAutoAdd: boolean;
}

export interface MissingFilmAnalysis {
  actorName: string;
  tmdbActorId: number;
  totalTMDBCredits: number;
  teluguCredits: number;
  existingInDB: number;
  missingFilms: MissingFilm[];
  autoAddCandidates: MissingFilm[];
  manualReviewCandidates: MissingFilm[];
}

// ============================================================
// TMDB API
// ============================================================

/**
 * Search for actor on TMDB
 */
export async function searchTMDBActor(actorName: string): Promise<number | null> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not configured');
  }

  try {
    const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(actorName)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    // Return the first result (usually most relevant)
    return data.results[0].id;

  } catch (error) {
    console.error(`TMDB actor search error for ${actorName}:`, error);
    return null;
  }
}

/**
 * Fetch actor's complete filmography from TMDB
 */
export async function fetchTMDBActorFilmography(
  actorId: number
): Promise<TMDBActorCredit[]> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not configured');
  }

  try {
    const url = `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.cast) {
      return [];
    }

    // Map to our format
    const credits: TMDBActorCredit[] = data.cast.map((credit: any, index: number) => ({
      id: credit.id,
      title: credit.title,
      originalTitle: credit.original_title,
      originalLanguage: credit.original_language,
      releaseDate: credit.release_date || '',
      releaseYear: credit.release_date ? parseInt(credit.release_date.split('-')[0]) : 0,
      character: credit.character,
      castOrder: credit.order !== undefined ? credit.order : index,
      posterPath: credit.poster_path,
    }));

    // Sort by release date (newest first)
    credits.sort((a, b) => {
      if (!a.releaseDate && !b.releaseDate) return 0;
      if (!a.releaseDate) return 1;
      if (!b.releaseDate) return -1;
      return b.releaseDate.localeCompare(a.releaseDate);
    });

    return credits;

  } catch (error) {
    console.error(`TMDB filmography fetch error for actor ${actorId}:`, error);
    return [];
  }
}

// ============================================================
// ROLE CLASSIFICATION
// ============================================================

/**
 * Classify actor's role based on cast order and character name
 */
export function classifyActorRole(
  castOrder: number,
  character?: string
): { role: 'lead' | 'support' | 'cameo'; confidence: number; reason: string } {
  // Check character name for special appearances
  if (character) {
    const charLower = character.toLowerCase();
    if (charLower.includes('cameo') || charLower.includes('special appearance') || charLower.includes('guest')) {
      return {
        role: 'cameo',
        confidence: 0.90,
        reason: 'Character indicates special appearance',
      };
    }
  }

  // Classify by cast order
  if (castOrder <= 2) {
    return {
      role: 'lead',
      confidence: 0.95,
      reason: 'Top 2 billing indicates lead role',
    };
  }

  if (castOrder <= 5) {
    return {
      role: 'support',
      confidence: 0.85,
      reason: 'Top 5 billing indicates supporting role',
    };
  }

  if (castOrder <= 10) {
    return {
      role: 'support',
      confidence: 0.70,
      reason: 'Top 10 billing indicates supporting/minor role',
    };
  }

  return {
    role: 'cameo',
    confidence: 0.60,
    reason: 'Lower billing indicates cameo/minor role',
  };
}

// ============================================================
// TITLE SIMILARITY
// ============================================================

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate title similarity (0-1)
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  // Exact match
  if (norm1 === norm2) return 1.0;

  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;

  // Levenshtein distance (simplified)
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  
  const maxDistance = Math.floor(longer.length * 0.3); // Allow 30% difference
  
  let distance = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer[i] !== shorter[i]) distance++;
  }
  distance += longer.length - shorter.length;

  if (distance > maxDistance) return 0;

  return 1 - (distance / longer.length);
}

// ============================================================
// MISSING FILM DETECTION
// ============================================================

/**
 * Detect missing films for an actor
 * 
 * @param actorName - Actor name to search for
 * @param existingFilms - Array of existing films in database
 * @returns Analysis of missing films
 */
export async function detectMissingFilms(
  actorName: string,
  existingFilms: Array<{ tmdb_id?: number; title_en: string; release_year: number }>
): Promise<MissingFilmAnalysis | null> {
  // Search for actor on TMDB
  const actorId = await searchTMDBActor(actorName);
  
  if (!actorId) {
    console.error(`Actor not found on TMDB: ${actorName}`);
    return null;
  }

  // Fetch complete filmography
  const filmography = await fetchTMDBActorFilmography(actorId);

  // Filter Telugu films only
  const teluguFilms = filmography.filter(film => film.originalLanguage === 'te');

  // Create a set of existing film identifiers for quick lookup
  const existingTMDBIds = new Set(existingFilms.map(f => f.tmdb_id).filter(Boolean));
  const existingTitles = new Set(existingFilms.map(f => normalizeTitle(f.title_en)));

  // Detect missing films
  const missingFilms: MissingFilm[] = [];

  for (const film of teluguFilms) {
    // Skip if film has no year
    if (!film.releaseYear || film.releaseYear < 1900) continue;

    // Check if film exists by TMDB ID
    if (existingTMDBIds.has(film.id)) continue;

    // Check if film exists by title similarity
    const existingFilm = existingFilms.find(ef => {
      const similarity = calculateTitleSimilarity(ef.title_en, film.title);
      const yearMatch = Math.abs(ef.release_year - film.releaseYear) <= 1; // Allow ±1 year
      return similarity >= 0.8 && yearMatch;
    });

    if (existingFilm) continue;

    // Film is missing - classify role
    const { role, confidence, reason } = classifyActorRole(film.castOrder, film.character);

    // Determine if should auto-add
    const shouldAutoAdd = confidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX.add_missing;

    missingFilms.push({
      tmdbId: film.id,
      title: film.title,
      releaseYear: film.releaseYear,
      role,
      castOrder: film.castOrder,
      character: film.character,
      confidence,
      reason,
      shouldAutoAdd,
    });
  }

  // Sort by confidence (highest first)
  missingFilms.sort((a, b) => b.confidence - a.confidence);

  // Split into auto-add and manual review candidates
  const autoAddCandidates = missingFilms.filter(f => f.shouldAutoAdd);
  const manualReviewCandidates = missingFilms.filter(f => !f.shouldAutoAdd);

  return {
    actorName,
    tmdbActorId: actorId,
    totalTMDBCredits: filmography.length,
    teluguCredits: teluguFilms.length,
    existingInDB: existingFilms.length,
    missingFilms,
    autoAddCandidates,
    manualReviewCandidates,
  };
}

/**
 * Generate report for missing films
 */
export function generateMissingFilmsReport(analysis: MissingFilmAnalysis): string {
  const lines: string[] = [];

  lines.push(`# Missing Films Analysis: ${analysis.actorName}`);
  lines.push('');
  lines.push(`TMDB Actor ID: ${analysis.tmdbActorId}`);
  lines.push(`Total TMDB Credits: ${analysis.totalTMDBCredits}`);
  lines.push(`Telugu Credits: ${analysis.teluguCredits}`);
  lines.push(`Existing in DB: ${analysis.existingInDB}`);
  lines.push(`Missing Films: ${analysis.missingFilms.length}`);
  lines.push('');

  if (analysis.autoAddCandidates.length > 0) {
    lines.push(`## Auto-Add Candidates (${analysis.autoAddCandidates.length})`);
    lines.push('');
    lines.push('| Title | Year | Role | Cast Order | Confidence | Reason |');
    lines.push('|-------|------|------|------------|------------|--------|');

    for (const film of analysis.autoAddCandidates) {
      lines.push(`| ${film.title} | ${film.releaseYear} | ${film.role} | ${film.castOrder} | ${(film.confidence * 100).toFixed(0)}% | ${film.reason} |`);
    }

    lines.push('');
  }

  if (analysis.manualReviewCandidates.length > 0) {
    lines.push(`## Manual Review Required (${analysis.manualReviewCandidates.length})`);
    lines.push('');
    lines.push('| Title | Year | Role | Cast Order | Confidence | Reason |');
    lines.push('|-------|------|------|------------|------------|--------|');

    for (const film of analysis.manualReviewCandidates) {
      lines.push(`| ${film.title} | ${film.releaseYear} | ${film.role} | ${film.castOrder} | ${(film.confidence * 100).toFixed(0)}% | ${film.reason} |`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get TMDB movie details for a missing film (for adding to database)
 */
export async function getTMDBMovieDetails(tmdbId: number): Promise<{
  title: string;
  releaseYear: number;
  director?: string;
  posterUrl?: string;
  genres?: string[];
} | null> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not configured');
  }

  try {
    // Get movie details
    const movieUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const movieResponse = await fetch(movieUrl);
    const movieData = await movieResponse.json();

    // Get credits
    const creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
    const creditsResponse = await fetch(creditsUrl);
    const creditsData = await creditsResponse.json();

    const director = creditsData.crew?.find((c: any) => c.job === 'Director')?.name;
    const posterUrl = movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : undefined;
    const genres = movieData.genres?.map((g: any) => g.name) || [];

    return {
      title: movieData.title,
      releaseYear: movieData.release_date ? parseInt(movieData.release_date.split('-')[0]) : 0,
      director,
      posterUrl,
      genres,
    };

  } catch (error) {
    console.error(`TMDB movie details fetch error for ${tmdbId}:`, error);
    return null;
  }
}
