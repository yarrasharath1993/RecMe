/**
 * ACTOR IDENTIFIER - Robust actor identification using TMDB Person ID
 * 
 * This module provides exact actor matching by:
 * 1. Resolving actor name to TMDB Person ID
 * 2. Caching person IDs for performance
 * 3. Using person ID to verify cast membership (not fuzzy name matching)
 * 4. Supporting Telugu-specific name variations
 * 
 * Usage:
 *   const identifier = new ActorIdentifier();
 *   const actorId = await identifier.resolveActorId('Nandamuri Balakrishna');
 *   const isInCast = await identifier.isActorInMovieCast(actorId, tmdbMovieId);
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Cache file for actor IDs
const CACHE_FILE = path.join(__dirname, '../../.actor-id-cache.json');

// ============================================================
// TYPES
// ============================================================

export interface ActorProfile {
  tmdbId: number;
  name: string;
  knownNames: string[];  // Alternative names/spellings
  debutYear?: number;
  teluguFilmCount?: number;
  lastUpdated: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  order: number;
  profile_path: string | null;
}

export interface ActorVerificationResult {
  found: boolean;
  actorTmdbId?: number;
  castOrder?: number;
  character?: string;
  confidence: number;
  matchedName?: string;
}

export interface ActorIdCache {
  [normalizedName: string]: ActorProfile;
}

// ============================================================
// KNOWN ACTOR MAPPINGS (Telugu Cinema)
// ============================================================

/**
 * Actors with MULTIPLE TMDB Person IDs.
 * TMDB sometimes has fragmented data for older actors, with different
 * Person IDs used in different films. We need to check ALL IDs when
 * verifying if an actor is in a movie's cast.
 * 
 * Discovered during Balakrishna filmography fix session where TMDB had:
 * - ID 82459 for newer films
 * - ID 150529 for older films (1980s)
 */
export const KNOWN_ACTOR_MULTIPLE_IDS: Record<string, number[]> = {
  // Nandamuri Family - often have multiple TMDB entries
  'nandamuri balakrishna': [82459, 150529],
  'n.t. rama rao': [35819, 1003933],
  
  // Classic heroes with fragmented TMDB data
  'krishna': [237087, 1088372],
  'sobhan babu': [237086, 1088373],
  'akkineni nageswara rao': [35818, 1088374],
  'anr': [35818, 1088374],
  
  // Add more as discovered during validation
};

/**
 * Pre-mapped TMDB Person IDs for major Telugu actors.
 * This eliminates search ambiguity for well-known actors.
 * For actors with multiple IDs, use the PRIMARY ID here.
 */
export const KNOWN_ACTOR_IDS: Record<string, number> = {
  // Mega Star Family
  'chiranjeevi': 147079,  // Corrected: 147079 is the Telugu Megastar, not 33241
  'ram charan': 1620546,
  'allu arjun': 74510,
  'varun tej': 1471449,
  'sai dharam tej': 1611534,
  'panja vaisshnav tej': 2738589,
  'nagababu': 1024395,
  
  // Nandamuri Family
  'nandamuri balakrishna': 82459,
  'n.t. rama rao jr.': 78749,
  'jr. ntr': 78749,
  'ntr jr': 78749,
  'kalyan ram': 1029097,
  'n.t. rama rao': 35819,
  
  // Akkineni Family
  'akkineni nagarjuna': 35742,
  'nagarjuna': 35742,
  'naga chaitanya': 1136406,
  'akhil akkineni': 1545274,
  'akkineni nageswara rao': 35818,
  'anr': 35818,
  
  // Daggubati Family
  'daggubati venkatesh': 78742,
  'venkatesh': 78742,
  'daggubati rana': 1136405,
  'rana daggubati': 1136405,
  
  // Other Major Heroes
  'prabhas': 136532,
  'mahesh babu': 78750,
  'pawan kalyan': 78740,
  'ravi teja': 82190,
  'nani': 1029055,
  'vijay deverakonda': 1619517,
  'ram pothineni': 1029099,
  'nithiin': 1029096,
  'sharwanand': 1136408,
  'siddharth': 85707,
  'sudheer babu': 1401626,
  'sundeep kishan': 1265096,
  'naveen polishetty': 2366770,
  
  // Classic Heroes
  'krishna': 237087,
  'sobhan babu': 237086,
  'krishnam raju': 237085,
  'mohan babu': 82458,
  'rajendra prasad': 237088,
  'jagapathi babu': 237089,
  
  // Major Heroines
  'samantha ruth prabhu': 1297763,
  'samantha': 1297763,
  'rashmika mandanna': 1903874,
  'pooja hegde': 1401627,
  'anushka shetty': 225194,
  'kajal aggarwal': 225193,
  'tammannaah bhatia': 225195,
  'keerthy suresh': 1611533,
  'sai pallavi': 1611535,
  'shruti haasan': 225192,
  'trisha': 225191,
  
  // Major Directors (for reference)
  's. s. rajamouli': 76788,
  'trivikram srinivas': 237090,
  'sukumar': 237091,
  'koratala siva': 1611536,
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function normalizeActorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special chars
    .replace(/\s+/g, ' ')          // Normalize spaces
    .trim();
}

function generateNameVariations(name: string): string[] {
  const variations: string[] = [normalizeActorName(name)];
  const parts = name.split(' ');
  
  // First name only
  if (parts.length > 1) {
    variations.push(normalizeActorName(parts[parts.length - 1])); // Last name
    variations.push(normalizeActorName(parts[0])); // First name
    
    // Without middle names
    if (parts.length > 2) {
      variations.push(normalizeActorName(`${parts[0]} ${parts[parts.length - 1]}`));
    }
  }
  
  // Handle "Jr." suffix
  if (name.toLowerCase().includes('jr')) {
    variations.push(normalizeActorName(name.replace(/jr\.?/gi, '').trim()));
  }
  
  // Handle initials (e.g., "N.T. Rama Rao")
  const withoutInitials = name.replace(/\b[A-Z]\.\s*/g, '');
  if (withoutInitials !== name) {
    variations.push(normalizeActorName(withoutInitials));
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

async function fetchTMDB(endpoint: string): Promise<any> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not configured');
  }
  
  try {
    const url = `${TMDB_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        // Rate limited - wait and retry
        await new Promise(r => setTimeout(r, 1000));
        return fetchTMDB(endpoint);
      }
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('TMDB fetch error:', error);
    return null;
  }
}

// ============================================================
// ACTOR IDENTIFIER CLASS
// ============================================================

export class ActorIdentifier {
  private cache: ActorIdCache = {};
  private cacheLoaded: boolean = false;
  
  constructor() {
    this.loadCache();
  }
  
  /**
   * Load actor ID cache from disk
   */
  private loadCache(): void {
    if (this.cacheLoaded) return;
    
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const data = fs.readFileSync(CACHE_FILE, 'utf-8');
        this.cache = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load actor cache:', error);
      this.cache = {};
    }
    this.cacheLoaded = true;
  }
  
  /**
   * Save actor ID cache to disk
   */
  private saveCache(): void {
    try {
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.warn('Could not save actor cache:', error);
    }
  }
  
  /**
   * Resolve actor name to TMDB Person ID
   * Uses known mappings first, then searches TMDB
   */
  async resolveActorId(actorName: string): Promise<number | null> {
    const normalizedName = normalizeActorName(actorName);
    
    // 1. Check known actor mappings first
    if (KNOWN_ACTOR_IDS[normalizedName]) {
      return KNOWN_ACTOR_IDS[normalizedName];
    }
    
    // Check variations in known actors
    const variations = generateNameVariations(actorName);
    for (const variation of variations) {
      if (KNOWN_ACTOR_IDS[variation]) {
        return KNOWN_ACTOR_IDS[variation];
      }
    }
    
    // 2. Check cache
    if (this.cache[normalizedName]) {
      return this.cache[normalizedName].tmdbId;
    }
    
    // 3. Search TMDB
    const actorId = await this.searchTMDBActor(actorName);
    
    if (actorId) {
      // Cache the result
      this.cache[normalizedName] = {
        tmdbId: actorId,
        name: actorName,
        knownNames: variations,
        lastUpdated: new Date().toISOString(),
      };
      this.saveCache();
    }
    
    return actorId;
  }
  
  /**
   * Search TMDB for an actor, prioritizing Telugu film actors
   */
  private async searchTMDBActor(actorName: string): Promise<number | null> {
    const searchResult = await fetchTMDB(
      `/search/person?query=${encodeURIComponent(actorName)}&language=en-US`
    );
    
    if (!searchResult?.results?.length) {
      return null;
    }
    
    // Score each result based on Telugu film presence
    const scoredResults: Array<{ id: number; score: number; name: string }> = [];
    
    for (const person of searchResult.results.slice(0, 5)) {
      // Get their movie credits
      const credits = await fetchTMDB(`/person/${person.id}/movie_credits`);
      await new Promise(r => setTimeout(r, 100)); // Rate limit
      
      if (!credits?.cast) continue;
      
      // Count Telugu films
      const teluguCount = credits.cast.filter(
        (c: any) => c.original_language === 'te'
      ).length;
      
      // Calculate score
      let score = teluguCount * 10; // 10 points per Telugu film
      
      // Bonus for exact name match
      if (person.name.toLowerCase() === actorName.toLowerCase()) {
        score += 50;
      }
      
      // Bonus for popularity
      score += (person.popularity || 0);
      
      scoredResults.push({
        id: person.id,
        score,
        name: person.name,
      });
    }
    
    // Sort by score and return the best match
    scoredResults.sort((a, b) => b.score - a.score);
    
    if (scoredResults.length > 0 && scoredResults[0].score > 0) {
      return scoredResults[0].id;
    }
    
    // Fallback to first result if no Telugu films found
    return searchResult.results[0]?.id || null;
  }
  
  /**
   * Check if an actor (by TMDB Person ID) is in a movie's cast
   * This is the definitive check - uses IDs, not name matching
   */
  async isActorInMovieCast(
    actorTmdbId: number,
    movieTmdbId: number
  ): Promise<ActorVerificationResult> {
    const credits = await fetchTMDB(`/movie/${movieTmdbId}/credits`);
    
    if (!credits?.cast) {
      return { found: false, confidence: 0 };
    }
    
    // Find actor by TMDB Person ID (exact match)
    const actorInCast = credits.cast.find(
      (c: CastMember) => c.id === actorTmdbId
    );
    
    if (actorInCast) {
      return {
        found: true,
        actorTmdbId,
        castOrder: actorInCast.order,
        character: actorInCast.character,
        confidence: 1.0,  // 100% confidence - ID match
        matchedName: actorInCast.name,
      };
    }
    
    return {
      found: false,
      actorTmdbId,
      confidence: 0.95, // High confidence actor is NOT in this film
    };
  }
  
  /**
   * Check if an actor is in a movie's cast using ALL known TMDB IDs.
   * Some actors have multiple TMDB Person IDs (fragmented data in older films).
   * This method checks all known IDs for the actor.
   */
  async isActorInMovieCastMultiId(
    actorName: string,
    movieTmdbId: number
  ): Promise<ActorVerificationResult> {
    const normalizedName = normalizeActorName(actorName);
    
    // Get all known IDs for this actor
    const multipleIds = KNOWN_ACTOR_MULTIPLE_IDS[normalizedName];
    const primaryId = KNOWN_ACTOR_IDS[normalizedName];
    
    // Build list of all IDs to check
    const idsToCheck: number[] = [];
    if (multipleIds) {
      idsToCheck.push(...multipleIds);
    }
    if (primaryId && !idsToCheck.includes(primaryId)) {
      idsToCheck.push(primaryId);
    }
    
    // If no known IDs, fall back to resolving
    if (idsToCheck.length === 0) {
      const resolvedId = await this.resolveActorId(actorName);
      if (resolvedId) {
        idsToCheck.push(resolvedId);
      }
    }
    
    if (idsToCheck.length === 0) {
      // Couldn't find any IDs - fall back to name matching
      return this.fallbackNameMatch(actorName, movieTmdbId);
    }
    
    // Get movie credits once
    const credits = await fetchTMDB(`/movie/${movieTmdbId}/credits`);
    
    if (!credits?.cast) {
      return { found: false, confidence: 0 };
    }
    
    // Check all IDs
    for (const actorId of idsToCheck) {
      const actorInCast = credits.cast.find(
        (c: CastMember) => c.id === actorId
      );
      
      if (actorInCast) {
        return {
          found: true,
          actorTmdbId: actorId,
          castOrder: actorInCast.order,
          character: actorInCast.character,
          confidence: 1.0,  // 100% confidence - ID match
          matchedName: actorInCast.name,
        };
      }
    }
    
    return {
      found: false,
      actorTmdbId: idsToCheck[0],
      confidence: 0.95, // High confidence actor is NOT in this film
    };
  }
  
  /**
   * Get all TMDB Person IDs for an actor (including alternate IDs)
   */
  getAllActorIds(actorName: string): number[] {
    const normalizedName = normalizeActorName(actorName);
    const ids: number[] = [];
    
    // Check multiple IDs first
    if (KNOWN_ACTOR_MULTIPLE_IDS[normalizedName]) {
      ids.push(...KNOWN_ACTOR_MULTIPLE_IDS[normalizedName]);
    }
    
    // Add primary ID if not already included
    if (KNOWN_ACTOR_IDS[normalizedName] && !ids.includes(KNOWN_ACTOR_IDS[normalizedName])) {
      ids.push(KNOWN_ACTOR_IDS[normalizedName]);
    }
    
    // Check variations
    const variations = generateNameVariations(actorName);
    for (const variation of variations) {
      if (KNOWN_ACTOR_MULTIPLE_IDS[variation]) {
        for (const id of KNOWN_ACTOR_MULTIPLE_IDS[variation]) {
          if (!ids.includes(id)) ids.push(id);
        }
      }
      if (KNOWN_ACTOR_IDS[variation] && !ids.includes(KNOWN_ACTOR_IDS[variation])) {
        ids.push(KNOWN_ACTOR_IDS[variation]);
      }
    }
    
    return ids;
  }
  
  /**
   * Verify if an actor is in a movie's cast by name
   * First resolves actor to TMDB ID, then checks cast
   */
  async verifyActorInMovie(
    actorName: string,
    movieTmdbId: number
  ): Promise<ActorVerificationResult> {
    const actorId = await this.resolveActorId(actorName);
    
    if (!actorId) {
      // Couldn't resolve actor - fall back to name matching
      return this.fallbackNameMatch(actorName, movieTmdbId);
    }
    
    return this.isActorInMovieCast(actorId, movieTmdbId);
  }
  
  /**
   * Fallback name matching when TMDB Person ID can't be resolved
   * Uses more sophisticated matching than simple includes()
   */
  private async fallbackNameMatch(
    actorName: string,
    movieTmdbId: number
  ): Promise<ActorVerificationResult> {
    const credits = await fetchTMDB(`/movie/${movieTmdbId}/credits`);
    
    if (!credits?.cast) {
      return { found: false, confidence: 0 };
    }
    
    const normalizedActor = normalizeActorName(actorName);
    const actorVariations = generateNameVariations(actorName);
    
    // Check each cast member
    for (const member of credits.cast) {
      const normalizedCast = normalizeActorName(member.name);
      const castVariations = generateNameVariations(member.name);
      
      // Check for any matching variations
      for (const actorVar of actorVariations) {
        for (const castVar of castVariations) {
          if (actorVar === castVar || 
              actorVar.includes(castVar) || 
              castVar.includes(actorVar)) {
            return {
              found: true,
              actorTmdbId: member.id,
              castOrder: member.order,
              character: member.character,
              confidence: 0.85, // Lower confidence - name match, not ID
              matchedName: member.name,
            };
          }
        }
      }
    }
    
    return {
      found: false,
      confidence: 0.75, // Medium confidence - couldn't verify either way
    };
  }
  
  /**
   * Get top cast members for a movie
   */
  async getMovieCast(
    movieTmdbId: number,
    limit: number = 10
  ): Promise<CastMember[]> {
    const credits = await fetchTMDB(`/movie/${movieTmdbId}/credits`);
    
    if (!credits?.cast) {
      return [];
    }
    
    return credits.cast.slice(0, limit).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character || '',
      order: c.order,
      profile_path: c.profile_path,
    }));
  }
  
  /**
   * Get actor profile from cache or TMDB
   */
  async getActorProfile(actorName: string): Promise<ActorProfile | null> {
    const normalizedName = normalizeActorName(actorName);
    
    // Check cache first
    if (this.cache[normalizedName]) {
      return this.cache[normalizedName];
    }
    
    // Resolve ID and build profile
    const actorId = await this.resolveActorId(actorName);
    if (!actorId) return null;
    
    // Fetch person details
    const person = await fetchTMDB(`/person/${actorId}`);
    if (!person) return null;
    
    // Fetch their Telugu films
    const credits = await fetchTMDB(`/person/${actorId}/movie_credits`);
    const teluguFilms = credits?.cast?.filter(
      (c: any) => c.original_language === 'te'
    ) || [];
    
    // Find debut year (earliest Telugu film)
    let debutYear: number | undefined;
    for (const film of teluguFilms) {
      if (film.release_date) {
        const year = parseInt(film.release_date.split('-')[0]);
        if (!debutYear || year < debutYear) {
          debutYear = year;
        }
      }
    }
    
    const profile: ActorProfile = {
      tmdbId: actorId,
      name: person.name,
      knownNames: [normalizedName, ...generateNameVariations(actorName)],
      debutYear,
      teluguFilmCount: teluguFilms.length,
      lastUpdated: new Date().toISOString(),
    };
    
    // Cache it
    this.cache[normalizedName] = profile;
    this.saveCache();
    
    return profile;
  }
  
  /**
   * Get all Telugu films for an actor from TMDB
   * Checks ALL known TMDB Person IDs for the actor to get complete filmography
   */
  async getActorTeluguFilmography(
    actorName: string
  ): Promise<Array<{
    tmdbId: number;
    title: string;
    year: number;
    character: string;
    castOrder: number;
  }>> {
    // Get all known IDs for this actor
    const allIds = this.getAllActorIds(actorName);
    
    // If no known IDs, try resolving
    if (allIds.length === 0) {
      const resolvedId = await this.resolveActorId(actorName);
      if (resolvedId) {
        allIds.push(resolvedId);
      }
    }
    
    if (allIds.length === 0) return [];
    
    // Collect films from all IDs
    const filmMap = new Map<number, {
      tmdbId: number;
      title: string;
      year: number;
      character: string;
      castOrder: number;
    }>();
    
    for (const actorId of allIds) {
      const credits = await fetchTMDB(`/person/${actorId}/movie_credits`);
      if (!credits?.cast) continue;
      
      for (const c of credits.cast) {
        if (c.original_language === 'te' && !filmMap.has(c.id)) {
          filmMap.set(c.id, {
            tmdbId: c.id,
            title: c.title,
            year: c.release_date ? parseInt(c.release_date.split('-')[0]) : 0,
            character: c.character || '',
            castOrder: c.order ?? 999,
          });
        }
      }
      
      // Rate limit between API calls
      await new Promise(r => setTimeout(r, 100));
    }
    
    return Array.from(filmMap.values()).sort((a, b) => a.year - b.year);
  }
  
  /**
   * Get the expected film count for an actor from TMDB
   * Uses all known Person IDs to get accurate count
   */
  async getExpectedFilmCount(actorName: string): Promise<{
    total: number;
    byId: Array<{ id: number; count: number }>;
  }> {
    const allIds = this.getAllActorIds(actorName);
    
    if (allIds.length === 0) {
      const resolvedId = await this.resolveActorId(actorName);
      if (resolvedId) {
        allIds.push(resolvedId);
      }
    }
    
    const byId: Array<{ id: number; count: number }> = [];
    const seenMovieIds = new Set<number>();
    
    for (const actorId of allIds) {
      const credits = await fetchTMDB(`/person/${actorId}/movie_credits`);
      if (!credits?.cast) continue;
      
      const teluguFilms = credits.cast.filter((c: any) => c.original_language === 'te');
      byId.push({ id: actorId, count: teluguFilms.length });
      
      for (const film of teluguFilms) {
        seenMovieIds.add(film.id);
      }
      
      await new Promise(r => setTimeout(r, 100));
    }
    
    return {
      total: seenMovieIds.size,
      byId,
    };
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let actorIdentifierInstance: ActorIdentifier | null = null;

export function getActorIdentifier(): ActorIdentifier {
  if (!actorIdentifierInstance) {
    actorIdentifierInstance = new ActorIdentifier();
  }
  return actorIdentifierInstance;
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Quick check if actor is in movie cast
 */
export async function isActorInMovie(
  actorName: string,
  movieTmdbId: number
): Promise<boolean> {
  const identifier = getActorIdentifier();
  const result = await identifier.verifyActorInMovie(actorName, movieTmdbId);
  return result.found;
}

/**
 * Get actor's TMDB Person ID
 */
export async function getActorTmdbId(actorName: string): Promise<number | null> {
  const identifier = getActorIdentifier();
  return identifier.resolveActorId(actorName);
}

/**
 * Get suggested correct hero for a movie
 * (When current attribution is wrong)
 */
export async function getSuggestedHero(
  movieTmdbId: number
): Promise<string | null> {
  const identifier = getActorIdentifier();
  const cast = await identifier.getMovieCast(movieTmdbId, 1);
  return cast[0]?.name || null;
}

/**
 * Check if actor is in movie cast using ALL known TMDB IDs
 * More thorough than isActorInMovie - handles actors with multiple TMDB entries
 */
export async function isActorInMovieMultiId(
  actorName: string,
  movieTmdbId: number
): Promise<boolean> {
  const identifier = getActorIdentifier();
  const result = await identifier.isActorInMovieCastMultiId(actorName, movieTmdbId);
  return result.found;
}

/**
 * Get all TMDB Person IDs for an actor
 */
export function getAllActorTmdbIds(actorName: string): number[] {
  const identifier = getActorIdentifier();
  return identifier.getAllActorIds(actorName);
}

/**
 * Get expected film count from TMDB for an actor
 */
export async function getExpectedActorFilmCount(
  actorName: string
): Promise<number> {
  const identifier = getActorIdentifier();
  const result = await identifier.getExpectedFilmCount(actorName);
  return result.total;
}

/**
 * Check if an actor has multiple known TMDB Person IDs
 */
export function hasMultipleTmdbIds(actorName: string): boolean {
  const normalizedName = normalizeActorName(actorName);
  return !!KNOWN_ACTOR_MULTIPLE_IDS[normalizedName];
}
