/**
 * Letterboxd Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from Letterboxd film pages.
 * Confidence: 92% (verified community data with editorial oversight)
 */

interface LetterboxdCredits {
  title: string;
  year: number;
  director?: string[];
  cast?: Array<{ name: string; role?: string; order: number }>;
  crew?: {
    cinematographer?: string[];
    editor?: string[];
    writer?: string[];
    producer?: string[];
    musicDirector?: string[];
  };
  genres?: string[];
  confidence: number;
  source: string;
}

const BASE_URL = 'https://letterboxd.com';
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between requests

/**
 * Normalize title for Letterboxd URL
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse cast from Letterboxd HTML
 */
function parseCast(html: string): Array<{ name: string; role?: string; order: number }> {
  const cast: Array<{ name: string; role?: string; order: number }> = [];
  
  // Letterboxd uses structured cast lists with data attributes
  const castRegex = /<a[^>]*href="\/actor\/([^"]+)\/"[^>]*>([^<]+)<\/a>/g;
  const roleRegex = /<span[^>]*class="role"[^>]*>([^<]+)<\/span>/g;
  
  let match;
  let order = 0;
  
  while ((match = castRegex.exec(html)) !== null && order < 20) {
    const name = match[2].trim();
    
    // Try to find the associated role
    const roleMatch = roleRegex.exec(html);
    const role = roleMatch ? roleMatch[1].trim() : undefined;
    
    cast.push({ name, role, order: order + 1 });
    order++;
  }
  
  return cast;
}

/**
 * Parse crew from Letterboxd HTML
 */
function parseCrew(html: string): LetterboxdCredits['crew'] {
  const crew: LetterboxdCredits['crew'] = {};
  
  // Director
  const directorMatch = html.match(/<span[^>]*class="[^"]*directorlist[^"]*"[^>]*>(.*?)<\/span>/s);
  if (directorMatch) {
    const directors = Array.from(directorMatch[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g))
      .map(m => m[1].trim());
    if (directors.length > 0) {
      crew.cinematographer = []; // Will be filled from crew page
    }
  }
  
  // Extract crew from crew page patterns
  const crewSections = [
    { key: 'cinematographer', patterns: ['Director of Photography', 'Cinematography'] },
    { key: 'editor', patterns: ['Editor', 'Film Editing'] },
    { key: 'writer', patterns: ['Writer', 'Screenplay', 'Story'] },
    { key: 'producer', patterns: ['Producer'] },
    { key: 'musicDirector', patterns: ['Music', 'Original Music Composer', 'Music Director'] },
  ];
  
  for (const section of crewSections) {
    for (const pattern of section.patterns) {
      const regex = new RegExp(
        `<h3[^>]*>${pattern}</h3>.*?<div[^>]*class="cast-list"[^>]*>(.*?)</div>`,
        's'
      );
      const match = html.match(regex);
      
      if (match) {
        const names = Array.from(match[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g))
          .map(m => m[1].trim());
        
        if (names.length > 0) {
          crew[section.key as keyof typeof crew] = names;
          break; // Use first matching pattern
        }
      }
    }
  }
  
  return crew;
}

/**
 * Parse genres from Letterboxd HTML
 */
function parseGenres(html: string): string[] {
  const genres: string[] = [];
  const genreRegex = /<a[^>]*href="\/films\/genre\/([^"]+)\/"[^>]*>([^<]+)<\/a>/g;
  
  let match;
  while ((match = genreRegex.exec(html)) !== null) {
    genres.push(match[2].trim());
  }
  
  return genres;
}

/**
 * Scrape Letterboxd credits for a Telugu film
 */
export async function scrapeLetterboxdCredits(
  title: string,
  year: number
): Promise<LetterboxdCredits | null> {
  const slug = normalizeTitle(title);
  const filmUrl = `${BASE_URL}/film/${slug}/`;
  const crewUrl = `${BASE_URL}/film/${slug}/crew/`;
  
  try {
    // Fetch main film page
    const filmResponse = await fetch(filmUrl, {
      headers: {
        'User-Agent': 'TeluguPortal/1.0 (film-data-enrichment)',
      },
    });
    
    if (!filmResponse.ok) {
      // Try with year suffix if not found
      const filmUrlWithYear = `${BASE_URL}/film/${slug}-${year}/`;
      const retryResponse = await fetch(filmUrlWithYear, {
        headers: {
          'User-Agent': 'TeluguPortal/1.0 (film-data-enrichment)',
        },
      });
      
      if (!retryResponse.ok) {
        return null;
      }
      
      const html = await retryResponse.text();
      return parseLetterboxdPage(html, title, year, crewUrl);
    }
    
    const html = await filmResponse.text();
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    
    // Fetch crew page for detailed credits
    const crewResponse = await fetch(crewUrl, {
      headers: {
        'User-Agent': 'TeluguPortal/1.0 (film-data-enrichment)',
      },
    });
    
    let crewHtml = '';
    if (crewResponse.ok) {
      crewHtml = await crewResponse.text();
    }
    
    return parseLetterboxdPage(html, title, year, crewUrl, crewHtml);
  } catch (error) {
    console.error(`Letterboxd scraping failed for ${title} (${year}):`, error);
    return null;
  }
}

/**
 * Parse Letterboxd page and extract credits
 */
function parseLetterboxdPage(
  filmHtml: string,
  title: string,
  year: number,
  crewUrl: string,
  crewHtml?: string
): LetterboxdCredits | null {
  // Verify this is a Telugu film (or at least has Telugu in the metadata)
  const isTelugu = filmHtml.toLowerCase().includes('telugu') ||
    filmHtml.toLowerCase().includes('tollywood');
  
  if (!isTelugu) {
    // Still return data but with lower confidence
  }
  
  const credits: LetterboxdCredits = {
    title,
    year,
    confidence: 0.92,
    source: 'Letterboxd',
  };
  
  // Parse director
  const directorMatch = filmHtml.match(/<span[^>]*class="[^"]*directorlist[^"]*"[^>]*>(.*?)<\/span>/s);
  if (directorMatch) {
    credits.director = Array.from(directorMatch[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g))
      .map(m => m[1].trim());
  }
  
  // Parse cast
  const cast = parseCast(filmHtml);
  if (cast.length > 0) {
    credits.cast = cast;
  }
  
  // Parse crew from crew page if available
  if (crewHtml) {
    credits.crew = parseCrew(crewHtml);
  } else {
    // Try to parse crew from main page
    credits.crew = parseCrew(filmHtml);
  }
  
  // Parse genres
  credits.genres = parseGenres(filmHtml);
  
  // Check if we got any useful data
  const hasData = credits.director || credits.cast || 
    (credits.crew && Object.keys(credits.crew).length > 0);
  
  if (!hasData) {
    return null;
  }
  
  // Adjust confidence if not verified Telugu
  if (!isTelugu) {
    credits.confidence = 0.85;
  }
  
  return credits;
}
