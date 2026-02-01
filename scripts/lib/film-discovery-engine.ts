/**
 * FILM DISCOVERY ENGINE
 * 
 * Multi-source film discovery and deduplication for complete filmographies.
 * Fixes critical gap where enrichment only processes existing DB entries.
 * 
 * Features:
 * - Fetches filmography from 9+ sources
 * - Normalizes titles (English, Telugu, transliteration)
 * - Deduplicates by title + year
 * - Confidence scoring (1 source: 50%, 2: 75%, 3+: 95%)
 * - Role classification (child, lead, cameo, supporting)
 */

import type { Database } from '../../types/database';

type Movie = Database['public']['Tables']['movies']['Row'];

export type CrewRoleType = 'Producer' | 'Director' | 'Writer' | 'Music Director' | 'Cinematographer' | 'Editor' | 'Choreographer' | 'Lyricist' | 'Art Director' | 'Costume Designer' | 'Production Designer';

export interface DiscoveredFilm {
  title_en: string;
  title_te?: string;
  release_year: number;
  role: 'hero' | 'heroine' | 'supporting' | 'child_actor' | 'cameo' | 'voice';
  sources: string[];
  confidence: number;
  imdb_id?: string;
  tmdb_id?: number;
  language: string;
  character_name?: string;
  credits?: string; // e.g., "Special Appearance", "Guest Role"
  crewRoles?: CrewRoleType[]; // All crew roles (producer, director, writer, etc.)
  languages?: string[]; // Multi-language support
  roleNotes?: string; // Additional role information
}

export interface MissingFilm extends DiscoveredFilm {
  reason: 'not_in_db' | 'different_spelling' | 'missing_year';
  matchedExisting?: Partial<Movie>;
}

export interface WrongAttribution {
  movie: Movie;
  issue: 'not_in_sources' | 'wrong_role' | 'wrong_field' | 'duplicate';
  currentRole?: string;
  correctRole?: string;
  currentField?: string;
  correctField?: string;
  confidence: number;
  discoveredFilm?: DiscoveredFilm;
}

export interface DiscoveryResult {
  actor: string;
  totalFound: number;
  existingInDb: number;
  missing: MissingFilm[];
  duplicatesSkipped: number;
  childActorRoles: number;
  leadRoles: number;
  supportingRoles: number;
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two titles match (handles spelling variations)
 */
function titlesMatch(title1: string, title2: string): boolean {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // Fuzzy match (for minor spelling differences)
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  // If most words match, consider it a match
  const matchingWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);
  
  return matchingWords / totalWords >= 0.7;
}

/**
 * Deduplicate films by title and year
 */
function deduplicateFilms(films: DiscoveredFilm[]): DiscoveredFilm[] {
  const uniqueMap = new Map<string, DiscoveredFilm>();
  
  for (const film of films) {
    const key = `${normalizeTitle(film.title_en)}-${film.release_year}`;
    
    const existing = uniqueMap.get(key);
    if (existing) {
      // Merge sources and use higher confidence
      existing.sources = [...new Set([...existing.sources, ...film.sources])];
      existing.confidence = Math.max(existing.confidence, film.confidence);
      
      // Prefer TMDB ID if available
      if (film.tmdb_id && !existing.tmdb_id) {
        existing.tmdb_id = film.tmdb_id;
      }
      if (film.imdb_id && !existing.imdb_id) {
        existing.imdb_id = film.imdb_id;
      }
      if (film.title_te && !existing.title_te) {
        existing.title_te = film.title_te;
      }
    } else {
      uniqueMap.set(key, { ...film });
    }
  }
  
  return Array.from(uniqueMap.values());
}

/**
 * Calculate confidence based on number of sources
 */
export function calculateConfidence(sourceCount: number): number {
  if (sourceCount >= 3) return 0.95;
  if (sourceCount === 2) return 0.75;
  return 0.50;
}

/**
 * Find films missing from database
 * Note: existingMovies should include movies from ALL fields (hero, heroine, supporting_cast, producer, director, etc.)
 */
export async function findMissingFilms(
  discoveredFilms: DiscoveredFilm[],
  existingMovies: Movie[]
): Promise<MissingFilm[]> {
  const missing: MissingFilm[] = [];
  
  for (const film of discoveredFilms) {
    let found = false;
    let matchedExisting: Partial<Movie> | undefined;
    
    // Check if film exists in database (by title + year)
    for (const existing of existingMovies) {
      const titleMatches = titlesMatch(film.title_en, existing.title_en || '');
      const yearMatches = 
        Math.abs((existing.release_year || 0) - film.release_year) <= 1;
      
      if (titleMatches && yearMatches) {
        found = true;
        matchedExisting = existing;
        break;
      }
    }
    
    if (!found) {
      missing.push({
        ...film,
        reason: 'not_in_db',
        matchedExisting,
      });
    }
  }
  
  return missing;
}

/**
 * Detect wrong attributions (movies in DB but not in sources, or wrong role/field)
 */
export function detectWrongAttributions(
  discoveredFilms: DiscoveredFilm[],
  existingMovies: Movie[],
  actorName: string
): WrongAttribution[] {
  const wrongAttributions: WrongAttribution[] = [];
  const actorNameLower = actorName.toLowerCase();
  
  // Create a map of discovered films by title+year for quick lookup
  const discoveredMap = new Map<string, DiscoveredFilm>();
  for (const film of discoveredFilms) {
    const key = `${normalizeTitle(film.title_en)}-${film.release_year}`;
    discoveredMap.set(key, film);
  }
  
  for (const existing of existingMovies) {
    const key = `${normalizeTitle(existing.title_en || '')}-${existing.release_year || 0}`;
    const discovered = discoveredMap.get(key);
    
    // Check if actor is attributed in this movie
    const isAttributed = 
      (existing.hero && existing.hero.toLowerCase().includes(actorNameLower)) ||
      (existing.heroine && existing.heroine.toLowerCase().includes(actorNameLower)) ||
      (existing.producer && existing.producer.toLowerCase().includes(actorNameLower)) ||
      (existing.director && existing.director.toLowerCase().includes(actorNameLower)) ||
      (existing.music_director && existing.music_director.toLowerCase().includes(actorNameLower)) ||
      (existing.cinematographer && existing.cinematographer.toLowerCase().includes(actorNameLower)) ||
      (Array.isArray(existing.supporting_cast) && existing.supporting_cast.some((c: any) => 
        (typeof c === 'string' && c.toLowerCase().includes(actorNameLower)) ||
        (typeof c === 'object' && c.name && c.name.toLowerCase().includes(actorNameLower))
      )) ||
      (existing.crew && typeof existing.crew === 'object' && 
       Object.values(existing.crew).some((v: any) => 
         typeof v === 'string' && v.toLowerCase().includes(actorNameLower)
       ));
    
    if (!isAttributed) continue; // Skip movies where actor is not attributed
    
    if (!discovered) {
      // Movie exists in DB but not found in discovered sources
      wrongAttributions.push({
        movie: existing,
        issue: 'not_in_sources',
        confidence: 0.7,
      });
      continue;
    }
    
    // Check if role matches (simplified check - can be enhanced)
    // This is a basic implementation - the ClawDBot analyzer will do more detailed analysis
    const hasCrewRole = discovered.crewRoles && discovered.crewRoles.length > 0;
    const isLeadInDiscovered = discovered.role === 'hero' || discovered.role === 'heroine';
    const isHeroInDB = existing.hero && existing.hero.toLowerCase().includes(actorNameLower);
    const isProducerInDB = existing.producer && existing.producer.toLowerCase().includes(actorNameLower);
    
    // If discovered has crew role but DB has actor role (or vice versa)
    if (hasCrewRole && isHeroInDB && !isLeadInDiscovered) {
      wrongAttributions.push({
        movie: existing,
        issue: 'wrong_role',
        currentRole: 'hero',
        correctRole: discovered.crewRoles?.[0] || 'crew',
        currentField: 'hero',
        correctField: 'producer', // Simplified
        confidence: 0.8,
        discoveredFilm: discovered,
      });
    }
  }
  
  return wrongAttributions;
}

/**
 * Merge films from multiple sources and deduplicate
 */
export function mergeFilmSources(filmsBySource: Record<string, DiscoveredFilm[]>): DiscoveredFilm[] {
  const allFilms: DiscoveredFilm[] = [];
  
  for (const [source, films] of Object.entries(filmsBySource)) {
    for (const film of films) {
      allFilms.push({
        ...film,
        sources: [source],
      });
    }
  }
  
  // Deduplicate
  const deduplicated = deduplicateFilms(allFilms);
  
  // Update confidence scores
  for (const film of deduplicated) {
    film.confidence = calculateConfidence(film.sources.length);
  }
  
  return deduplicated;
}

/**
 * Classify role type based on film metadata
 */
export function classifyRoleType(
  film: DiscoveredFilm,
  actorBirthYear?: number
): 'child_actor' | 'lead' | 'supporting' | 'cameo' | 'voice' {
  // Check if child actor (under 18 at time of filming)
  if (actorBirthYear && (film.release_year - actorBirthYear) < 18) {
    return 'child_actor';
  }
  
  // Check credits for special appearances
  if (film.credits?.toLowerCase().includes('special appearance') ||
      film.credits?.toLowerCase().includes('guest') ||
      film.credits?.toLowerCase().includes('cameo')) {
    return 'cameo';
  }
  
  // Check if voice role
  if (film.credits?.toLowerCase().includes('voice')) {
    return 'voice';
  }
  
  // Default to role from source
  return film.role === 'hero' || film.role === 'heroine' ? 'lead' : 'supporting';
}

/**
 * Generate discovery summary
 */
export function generateDiscoverySummary(
  actor: string,
  discoveredFilms: DiscoveredFilm[],
  existingMovies: Movie[],
  missingFilms: MissingFilm[]
): DiscoveryResult {
  const childActorRoles = discoveredFilms.filter(f => f.role === 'child_actor').length;
  const leadRoles = discoveredFilms.filter(f => 
    f.role === 'hero' || f.role === 'heroine'
  ).length;
  const supportingRoles = discoveredFilms.filter(f => 
    f.role === 'supporting' || f.role === 'cameo'
  ).length;
  
  return {
    actor,
    totalFound: discoveredFilms.length,
    existingInDb: existingMovies.length,
    missing: missingFilms,
    duplicatesSkipped: 0,
    childActorRoles,
    leadRoles,
    supportingRoles,
  };
}
