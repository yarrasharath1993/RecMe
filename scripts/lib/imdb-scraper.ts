/**
 * IMDb CREDITS SCRAPER
 * 
 * Scrapes technical credits from IMDb full credits page.
 * Primary source for cinematographer, editor, writer credits for Indian films.
 * 
 * Features:
 * - Scrapes full credits page (`/fullcredits`)
 * - Extracts cast with order and character names
 * - Extracts crew (cinematographer, editor, writer, producer, music, etc.)
 * - Rate limiting and error handling
 * - Confidence scoring based on data completeness
 * 
 * Note: This is web scraping, so it may break if IMDb changes their HTML structure.
 * Always validate results and use as one of multiple sources.
 */

import { CONFIDENCE_THRESHOLDS } from './confidence-config';

// ============================================================
// TYPES
// ============================================================

export interface IMDbCastMember {
  name: string;
  character?: string;
  order: number;
}

export interface IMDbCrewMember {
  name: string;
  job?: string;
}

export interface IMDbCredits {
  imdbId: string;
  cast?: IMDbCastMember[];
  crew?: {
    cinematographer?: string[];
    editor?: string[];
    writer?: string[];
    producer?: string[];
    musicDirector?: string[];
    artDirector?: string[];
    costumeDesigner?: string[];
  };
  confidence: number;
  source: 'imdb';
}

// ============================================================
// RATE LIMITING
// ============================================================

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
}

// ============================================================
// HTML PARSING HELPERS
// ============================================================

/**
 * Extract text content from HTML (basic, no DOM parser needed)
 */
function extractText(html: string, startPattern: RegExp, endPattern: string = '</a>'): string | null {
  const match = html.match(startPattern);
  if (!match) return null;

  const startIndex = match.index! + match[0].length;
  const endIndex = html.indexOf(endPattern, startIndex);
  if (endIndex === -1) return null;

  const text = html.substring(startIndex, endIndex).trim();
  return text.replace(/<[^>]*>/g, '').trim(); // Remove any HTML tags
}

/**
 * Extract all matches of a pattern
 */
function extractAll(html: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  let match;
  const globalPattern = new RegExp(pattern.source, 'g');

  while ((match = globalPattern.exec(html)) !== null) {
    if (match[1]) {
      matches.push(match[1].trim());
    }
  }

  return matches;
}

// ============================================================
// IMDB SCRAPER
// ============================================================

/**
 * Scrape IMDb full credits page
 * 
 * @param imdbId - IMDb ID (e.g., "tt0293508")
 * @returns IMDb credits or null if failed
 */
export async function scrapeIMDbCredits(
  imdbId: string
): Promise<IMDbCredits | null> {
  if (!imdbId || !imdbId.startsWith('tt')) {
    return null;
  }

  try {
    await rateLimit();

    const url = `https://www.imdb.com/title/${imdbId}/fullcredits`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      console.error(`IMDb request failed: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Parse cast
    const cast: IMDbCastMember[] = [];
    const castSection = html.match(/<table class="cast_list"[^>]*>([\s\S]*?)<\/table>/);
    
    if (castSection) {
      const castRows = castSection[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
      
      for (let i = 0; i < castRows.length; i++) {
        const row = castRows[i];
        
        // Skip header row
        if (row.includes('<th')) continue;

        // Extract actor name
        const nameMatch = row.match(/<a href="\/name\/nm\d+"[^>]*>(.*?)<\/a>/);
        if (!nameMatch) continue;
        
        const name = nameMatch[1].trim();

        // Extract character name
        const charMatch = row.match(/<td class="character"[^>]*>([\s\S]*?)<\/td>/);
        let character: string | undefined;
        
        if (charMatch) {
          character = charMatch[1]
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }

        cast.push({
          name,
          character,
          order: i,
        });
      }
    }

    // Parse crew sections
    const crew: IMDbCredits['crew'] = {};

    // Cinematographer (Director of Photography)
    const cinematographerSection = html.match(/Cinematography by[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
    if (cinematographerSection) {
      crew.cinematographer = extractAll(cinematographerSection[1], /<a href="\/name\/nm\d+"[^>]*>(.*?)<\/a>/);
    }

    // Editor (Film Editing)
    const editorSection = html.match(/Film Editing by[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
    if (editorSection) {
      crew.editor = extractAll(editorSection[1], /<a href="\/name\/nm\d+"[^>]*>(.*?)<\/a>/);
    }

    // Writer
    const writerSection = html.match(/Writing Credits[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
    if (writerSection) {
      crew.writer = extractAll(writerSection[1], /<a href="\/name\/nm\d+"[^>]*>(.*?)<\/a>/);
    }

    // Producer
    const producerSection = html.match(/Produced by[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
    if (producerSection) {
      crew.producer = extractAll(producerSection[1], /<a href="\/name\/nm\d+"[^>]*>(.*?)<\/a>/);
    }

    // Music Director (Music by / Original Music by)
    const musicSection = html.match(/(?:Music by|Original Music by)[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
    if (musicSection) {
      crew.musicDirector = extractAll(musicSection[1], /<a href="\/name\/nm\d+"[^>]*>(.*?)<\/a>/);
    }

    // Art Director (Art Direction by)
    const artSection = html.match(/Art Direction by[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
    if (artSection) {
      crew.artDirector = extractAll(artSection[1], /<a href="\/name\/nm\d+"[^>]*>(.*?)<\/a>/);
    }

    // Costume Designer (Costume Design by)
    const costumeSection = html.match(/Costume Design by[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
    if (costumeSection) {
      crew.costumeDesigner = extractAll(costumeSection[1], /<a href="\/name\/nm\d+"[^>]*>(.*?)<\/a>/);
    }

    // Calculate confidence based on data completeness
    let dataPoints = 0;
    let filledPoints = 0;

    // Count cast data
    dataPoints += 1;
    if (cast.length > 0) filledPoints += 1;

    // Count crew data
    const crewFields = ['cinematographer', 'editor', 'writer', 'producer', 'musicDirector'];
    dataPoints += crewFields.length;
    
    for (const field of crewFields) {
      if (crew[field as keyof typeof crew] && crew[field as keyof typeof crew]!.length > 0) {
        filledPoints += 1;
      }
    }

    const completeness = dataPoints > 0 ? filledPoints / dataPoints : 0;
    const confidence = CONFIDENCE_THRESHOLDS.SOURCES.imdb * completeness;

    return {
      imdbId,
      cast: cast.length > 0 ? cast : undefined,
      crew: Object.keys(crew).length > 0 ? crew : undefined,
      confidence,
      source: 'imdb',
    };

  } catch (error) {
    console.error(`IMDb scraping error for ${imdbId}:`, error);
    return null;
  }
}

/**
 * Search IMDb for a Telugu film and get its IMDb ID
 * 
 * @param title - Film title
 * @param year - Release year
 * @returns IMDb ID or null if not found
 */
export async function searchIMDbId(
  title: string,
  year: number
): Promise<string | null> {
  try {
    await rateLimit();

    // IMDb search URL
    const searchQuery = encodeURIComponent(`${title} ${year} Telugu`);
    const url = `https://www.imdb.com/find?q=${searchQuery}&s=tt&ttype=ft`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract first result's IMDb ID
    const match = html.match(/\/title\/(tt\d+)\//);
    if (match) {
      return match[1];
    }

    return null;
  } catch (error) {
    console.error(`IMDb search error for ${title} (${year}):`, error);
    return null;
  }
}

/**
 * Get technical credits for a film (finds IMDb ID if needed)
 * 
 * @param title - Film title
 * @param year - Release year
 * @param imdbId - Optional IMDb ID (if already known)
 * @returns IMDb credits or null if failed
 */
export async function getTechnicalCredits(
  title: string,
  year: number,
  imdbId?: string
): Promise<IMDbCredits | null> {
  // If IMDb ID not provided, search for it
  if (!imdbId) {
    imdbId = await searchIMDbId(title, year);
    if (!imdbId) {
      return null;
    }
  }

  // Scrape credits
  return await scrapeIMDbCredits(imdbId);
}

/**
 * Extract primary credit (first person listed) for a crew role
 */
export function getPrimaryCrew(
  credits: IMDbCredits,
  role: 'cinematographer' | 'editor' | 'writer' | 'producer' | 'musicDirector'
): string | null {
  const crewList = credits.crew?.[role];
  return crewList && crewList.length > 0 ? crewList[0] : null;
}

/**
 * Check if an actor is in the cast
 * 
 * @param credits - IMDb credits
 * @param actorName - Actor name to search for
 * @returns True if actor is found in cast
 */
export function isActorInCast(credits: IMDbCredits, actorName: string): boolean {
  if (!credits.cast) return false;

  const normalizedName = actorName.toLowerCase().trim();
  
  return credits.cast.some(castMember => 
    castMember.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(castMember.name.toLowerCase())
  );
}

/**
 * Get actor's role based on cast order and character name
 * 
 * @param credits - IMDb credits
 * @param actorName - Actor name
 * @returns Role classification or null if not found
 */
export function getActorRole(
  credits: IMDbCredits,
  actorName: string
): { role: 'lead' | 'support' | 'cameo'; order: number; character?: string } | null {
  if (!credits.cast) return null;

  const normalizedName = actorName.toLowerCase().trim();
  
  const castMember = credits.cast.find(cm => 
    cm.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(cm.name.toLowerCase())
  );

  if (!castMember) return null;

  // Classify role based on cast order
  let role: 'lead' | 'support' | 'cameo';
  
  if (castMember.order <= 2) {
    role = 'lead';
  } else if (castMember.order <= 10) {
    role = 'support';
  } else {
    role = 'cameo';
  }

  // Check character name for special appearances
  if (castMember.character) {
    const charLower = castMember.character.toLowerCase();
    if (charLower.includes('cameo') || charLower.includes('special') || charLower.includes('guest')) {
      role = 'cameo';
    }
  }

  return {
    role,
    order: castMember.order,
    character: castMember.character,
  };
}
