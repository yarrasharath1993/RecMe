/**
 * BookMyShow Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from BookMyShow movie pages.
 * Confidence: 80% (Ticketing platform with verified cast/crew data)
 */

export interface BookMyShowCredits {
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

const BASE_URL = 'https://in.bookmyshow.com';
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

/**
 * Normalize title for BookMyShow URL
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
 * Parse cast from BookMyShow HTML
 */
function parseCast(html: string): Array<{ name: string; role?: string; order: number }> {
  const cast: Array<{ name: string; role?: string; order: number }> = [];
  
  // BookMyShow patterns - typically in dedicated cast sections
  // Pattern 1: Cast list with structured data
  const castSectionRegex = /<section[^>]*class="[^"]*cast-crew[^"]*"[^>]*>(.*?)<\/section>/is;
  const castSectionMatch = html.match(castSectionRegex);
  
  if (castSectionMatch) {
    const castItems = castSectionMatch[1].matchAll(/<div[^>]*class="[^"]*crew-member[^"]*"[^>]*>(.*?)<\/div>/gis);
    
    let order = 0;
    for (const item of castItems) {
      const nameMatch = item[1].match(/<div[^>]*class="[^"]*crew-name[^"]*"[^>]*>([^<]+)<\/div>/i);
      const roleMatch = item[1].match(/<div[^>]*class="[^"]*crew-role[^"]*"[^>]*>([^<]+)<\/div>/i);
      
      if (nameMatch) {
        cast.push({
          name: nameMatch[1].trim(),
          role: roleMatch ? roleMatch[1].trim() : undefined,
          order: order + 1,
        });
        order++;
        
        if (order >= 20) break;
      }
    }
  }
  
  // Pattern 2: JSON-LD structured data
  if (cast.length === 0) {
    const jsonLdRegex = /<script type="application\/ld\+json">(.*?)<\/script>/gis;
    const jsonMatches = html.matchAll(jsonLdRegex);
    
    for (const match of jsonMatches) {
      try {
        const data = JSON.parse(match[1]);
        
        if (data['@type'] === 'Movie' && data.actor) {
          const actors = Array.isArray(data.actor) ? data.actor : [data.actor];
          
          actors.forEach((actor: any, index: number) => {
            if (index < 20) {
              cast.push({
                name: actor.name || actor,
                role: actor.roleName,
                order: index + 1,
              });
            }
          });
          
          if (cast.length > 0) break;
        }
      } catch (e) {
        // Invalid JSON, continue
      }
    }
  }
  
  // Pattern 3: Simple div-based cast list
  if (cast.length === 0) {
    const castListRegex = /<div[^>]*class="[^"]*__cast[^"]*"[^>]*>(.*?)<\/div>/is;
    const castListMatch = html.match(castListRegex);
    
    if (castListMatch) {
      const names = castListMatch[1].matchAll(/<span[^>]*>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)<\/span>/g);
      
      let order = 0;
      for (const nameMatch of names) {
        if (order < 20) {
          cast.push({
            name: nameMatch[1].trim(),
            order: order + 1,
          });
          order++;
        }
      }
    }
  }
  
  return cast;
}

/**
 * Parse crew from BookMyShow HTML
 */
function parseCrew(html: string): BookMyShowCredits['crew'] {
  const crew: BookMyShowCredits['crew'] = {};
  
  // First try JSON-LD structured data
  const jsonLdRegex = /<script type="application\/ld\+json">(.*?)<\/script>/gis;
  const jsonMatches = html.matchAll(jsonLdRegex);
  
  for (const match of jsonMatches) {
    try {
      const data = JSON.parse(match[1]);
      
      if (data['@type'] === 'Movie') {
        // Director
        if (data.director) {
          const directors = Array.isArray(data.director) ? data.director : [data.director];
          crew.cinematographer = directors.map((d: any) => d.name || d);
        }
        
        // Other crew members
        if (data.crew) {
          const crewMembers = Array.isArray(data.crew) ? data.crew : [data.crew];
          
          for (const member of crewMembers) {
            const role = member.jobTitle || member['@type'];
            const name = member.name || member;
            
            if (role && name) {
              const lowerRole = role.toLowerCase();
              
              if (lowerRole.includes('cinematograph') || lowerRole.includes('dop')) {
                crew.cinematographer = [name];
              } else if (lowerRole.includes('edit')) {
                crew.editor = [name];
              } else if (lowerRole.includes('writ') || lowerRole.includes('screen')) {
                crew.writer = [name];
              } else if (lowerRole.includes('produc')) {
                crew.producer = [name];
              } else if (lowerRole.includes('music') || lowerRole.includes('compos')) {
                crew.musicDirector = [name];
              }
            }
          }
        }
      }
    } catch (e) {
      // Invalid JSON, continue
    }
  }
  
  // Fallback to HTML parsing if JSON-LD didn't work
  if (Object.keys(crew).length === 0) {
    const crewPatterns = [
      {
        key: 'cinematographer',
        labels: ['Cinematographer', 'Cinematography', 'DOP'],
      },
      {
        key: 'editor',
        labels: ['Editor', 'Editing'],
      },
      {
        key: 'writer',
        labels: ['Writer', 'Screenplay', 'Story'],
      },
      {
        key: 'producer',
        labels: ['Producer'],
      },
      {
        key: 'musicDirector',
        labels: ['Music Director', 'Music', 'Composer'],
      },
    ];
    
    for (const pattern of crewPatterns) {
      for (const label of pattern.labels) {
        const regex = new RegExp(
          `<div[^>]*class="[^"]*crew-role[^"]*"[^>]*>${label}</div>\\s*<div[^>]*class="[^"]*crew-name[^"]*"[^>]*>([^<]+)</div>`,
          'is'
        );
        
        const match = html.match(regex);
        if (match) {
          const name = match[1].trim();
          if (name && name.length > 2) {
            crew[pattern.key as keyof typeof crew] = [name];
            break;
          }
        }
      }
    }
  }
  
  return crew;
}

/**
 * Parse director from BookMyShow HTML
 */
function parseDirector(html: string): string[] {
  const directors: string[] = [];
  
  // Pattern 1: JSON-LD structured data
  const jsonLdRegex = /<script type="application\/ld\+json">(.*?)<\/script>/gis;
  const jsonMatches = html.matchAll(jsonLdRegex);
  
  for (const match of jsonMatches) {
    try {
      const data = JSON.parse(match[1]);
      
      if (data['@type'] === 'Movie' && data.director) {
        const directorData = Array.isArray(data.director) ? data.director : [data.director];
        directors.push(...directorData.map((d: any) => d.name || d));
        
        if (directors.length > 0) break;
      }
    } catch (e) {
      // Invalid JSON, continue
    }
  }
  
  // Pattern 2: HTML parsing
  if (directors.length === 0) {
    const directorRegex = /<div[^>]*class="[^"]*crew-role[^"]*"[^>]*>Director<\/div>\s*<div[^>]*class="[^"]*crew-name[^"]*"[^>]*>([^<]+)<\/div>/is;
    const match = html.match(directorRegex);
    
    if (match) {
      directors.push(match[1].trim());
    }
  }
  
  return directors;
}

/**
 * Parse genres from BookMyShow HTML
 */
function parseGenres(html: string): string[] {
  const genres: string[] = [];
  
  // Pattern 1: JSON-LD structured data
  const jsonLdRegex = /<script type="application\/ld\+json">(.*?)<\/script>/gis;
  const jsonMatches = html.matchAll(jsonLdRegex);
  
  for (const match of jsonMatches) {
    try {
      const data = JSON.parse(match[1]);
      
      if (data['@type'] === 'Movie' && data.genre) {
        const genreData = Array.isArray(data.genre) ? data.genre : [data.genre];
        genres.push(...genreData);
        
        if (genres.length > 0) break;
      }
    } catch (e) {
      // Invalid JSON, continue
    }
  }
  
  // Pattern 2: HTML parsing
  if (genres.length === 0) {
    const genreRegex = /<div[^>]*class="[^"]*__genre[^"]*"[^>]*>(.*?)<\/div>/is;
    const match = html.match(genreRegex);
    
    if (match) {
      const genreMatches = match[1].matchAll(/<span[^>]*>([^<]+)<\/span>/g);
      for (const genreMatch of genreMatches) {
        genres.push(genreMatch[1].trim());
      }
    }
  }
  
  return genres;
}

/**
 * Scrape BookMyShow credits for a Telugu film
 */
export async function scrapeBookMyShowCredits(
  title: string,
  year: number
): Promise<BookMyShowCredits | null> {
  const slug = normalizeTitle(title);
  const slugNoHyphens = slug.replace(/-/g, '');
  
  // BookMyShow URL patterns - includes city prefixes and variations
  const cities = ['hyderabad', 'vizag', 'vijayawada', 'guntur', 'bangalore'];
  const urlPatterns: string[] = [];
  
  // Try with city prefixes
  for (const city of cities) {
    urlPatterns.push(`${BASE_URL}/movies/${slug}/${city}`);
    urlPatterns.push(`${BASE_URL}/${city}/movies/${slug}`);
  }
  // Try without city
  urlPatterns.push(`${BASE_URL}/movies/${slug}`);
  urlPatterns.push(`${BASE_URL}/movie/${slug}`);
  urlPatterns.push(`${BASE_URL}/movies/${slugNoHyphens}`);
  
  try {
    for (const url of urlPatterns) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Verify this is the correct movie by checking year or title
        const yearRegex = new RegExp(`\\b${year}\\b`);
        const titleRegex = new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        
        if (yearRegex.test(html) || titleRegex.test(html)) {
          const credits = parseBookMyShowPage(html, title, year);
          if (credits) {
            return credits;
          }
        }
      }
      
      // Rate limiting between attempts
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
    
    return null;
  } catch (error) {
    console.error(`BookMyShow scraping failed for ${title} (${year}):`, error);
    return null;
  }
}

/**
 * Parse BookMyShow page and extract credits
 */
function parseBookMyShowPage(
  html: string,
  title: string,
  year: number
): BookMyShowCredits | null {
  const credits: BookMyShowCredits = {
    title,
    year,
    confidence: 0.80,
    source: 'BookMyShow',
  };
  
  // Parse director
  const directors = parseDirector(html);
  if (directors.length > 0) {
    credits.director = directors;
  }
  
  // Parse cast
  const cast = parseCast(html);
  if (cast.length > 0) {
    credits.cast = cast;
  }
  
  // Parse crew
  credits.crew = parseCrew(html);
  
  // Parse genres
  const genres = parseGenres(html);
  if (genres.length > 0) {
    credits.genres = genres;
  }
  
  // Check if we got any useful data
  const hasData = credits.director || credits.cast || 
    (credits.crew && Object.keys(credits.crew).length > 0);
  
  if (!hasData) {
    return null;
  }
  
  return credits;
}
