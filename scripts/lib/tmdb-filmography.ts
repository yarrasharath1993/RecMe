/**
 * TMDB FILMOGRAPHY FETCHER
 * 
 * Fetches complete filmography for an actor from TMDB API.
 * Primary source for film discovery due to high reliability.
 */

import type { DiscoveredFilm } from './film-discovery-engine';

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBSearchResult {
  id: number;
  name: string;
  known_for_department: string;
}

interface TMDBMovieCredit {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  character?: string;
  original_language: string;
  order?: number;
}

interface TMDBActorCredits {
  cast: TMDBMovieCredit[];
  crew: TMDBMovieCredit[];
}

/**
 * Search for actor by name
 */
async function searchActor(actorName: string): Promise<number | null> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key not found');
    return null;
  }
  
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(actorName)}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Return first result
    if (data.results && data.results.length > 0) {
      const actor = data.results[0] as TMDBSearchResult;
      return actor.id;
    }
    
    return null;
  } catch (error) {
    console.error(`TMDB actor search failed for ${actorName}:`, error);
    return null;
  }
}

/**
 * Fetch actor's movie credits
 */
async function fetchActorCredits(actorId: number): Promise<TMDBActorCredits | null> {
  if (!TMDB_API_KEY) return null;
  
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/person/${actorId}/movie_credits?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error(`TMDB credits fetch failed for actor ${actorId}:`, error);
    return null;
  }
}

/**
 * Convert TMDB credit to DiscoveredFilm
 */
function convertToDiscoveredFilm(credit: TMDBMovieCredit, role: 'hero' | 'heroine' | 'supporting'): DiscoveredFilm | null {
  if (!credit.release_date) return null;
  
  const releaseYear = parseInt(credit.release_date.split('-')[0]);
  if (isNaN(releaseYear)) return null;
  
  // Filter non-Telugu films (we'll enrich later if needed)
  // For now, include all and let downstream filtering handle it
  
  return {
    title_en: credit.title,
    release_year: releaseYear,
    role,
    sources: ['tmdb'],
    confidence: 0.95, // TMDB is highly reliable
    tmdb_id: credit.id,
    language: credit.original_language === 'te' ? 'Telugu' : 'Unknown',
    character_name: credit.character,
  };
}

/**
 * Fetch complete filmography for an actor from TMDB
 */
export async function fetchTMDBFilmography(actorName: string): Promise<DiscoveredFilm[]> {
  // Step 1: Search for actor
  const actorId = await searchActor(actorName);
  if (!actorId) {
    console.log(`TMDB: Actor "${actorName}" not found`);
    return [];
  }
  
  console.log(`TMDB: Found actor ID ${actorId} for "${actorName}"`);
  
  // Step 2: Fetch movie credits
  const credits = await fetchActorCredits(actorId);
  if (!credits) {
    console.log(`TMDB: No credits found for actor ${actorId}`);
    return [];
  }
  
  const films: DiscoveredFilm[] = [];
  
  // Step 3: Convert cast credits to DiscoveredFilm
  for (const credit of credits.cast) {
    // Determine role based on order (lower order = more prominent)
    const role = (credit.order !== undefined && credit.order < 3) ? 'hero' : 'supporting';
    
    const film = convertToDiscoveredFilm(credit, role);
    if (film) {
      films.push(film);
    }
  }
  
  console.log(`TMDB: Found ${films.length} films for "${actorName}"`);
  
  // Filter for Telugu films if we can detect language
  const teluguFilms = films.filter(f => 
    f.language === 'Telugu' || f.language === 'Unknown'
  );
  
  console.log(`TMDB: ${teluguFilms.length} Telugu/Unknown language films`);
  
  return films; // Return all for now, let discovery engine filter
}
