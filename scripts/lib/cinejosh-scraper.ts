/**
 * CineJosh Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from CineJosh reviews (cinejosh.com).
 * Confidence: 82% (Telugu-specific source with structured review metadata)
 */

export interface CineJoshCredits {
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
  rating?: number;
  confidence: number;
  source: string;
}

const BASE_URL = 'https://www.cinejosh.com';
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between requests

/**
 * Normalize title for CineJosh URL
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
 * Parse cast from CineJosh HTML
 */
function parseCast(html: string): Array<{ name: string; role?: string; order: number }> {
  const cast: Array<{ name: string; role?: string; order: number }> = [];
  
  // CineJosh patterns - typically in structured cast sections
  // Pattern 1: Cast list with dedicated section
  const castSectionRegex = /<div[^>]*class="[^"]*cast-section[^"]*"[^>]*>(.*?)<\/div>/is;
  const castSectionMatch = html.match(castSectionRegex);
  
  if (castSectionMatch) {
    const castItems = castSectionMatch[1].matchAll(/<div[^>]*class="[^"]*cast-item[^"]*"[^>]*>(.*?)<\/div>/gis);
    
    let order = 0;
    for (const item of castItems) {
      const nameMatch = item[1].match(/<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/span>/i);
      const roleMatch = item[1].match(/<span[^>]*class="[^"]*role[^"]*"[^>]*>([^<]+)<\/span>/i);
      
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
  
  // Pattern 2: Table-based cast list
  if (cast.length === 0) {
    const tableRegex = /<table[^>]*class="[^"]*movie-info[^"]*"[^>]*>.*?<tr[^>]*>.*?<td[^>]*>Cast:?<\/td>.*?<td[^>]*>(.*?)<\/td>/is;
    const tableMatch = html.match(tableRegex);
    
    if (tableMatch) {
      const castText = tableMatch[1].replace(/<[^>]*>/g, '');
      const names = castText.split(/[,،]/);
      
      names.forEach((name, index) => {
        const trimmed = name.trim();
        if (trimmed && trimmed.length > 2 && index < 20) {
          cast.push({
            name: trimmed,
            order: index + 1,
          });
        }
      });
    }
  }
  
  // Pattern 3: Review metadata parsing
  if (cast.length === 0) {
    const heroRegex = /(?:Star Cast|Cast):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
    const heroineRegex = /Heroine:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
    
    const heroMatch = html.match(heroRegex);
    const heroineMatch = html.match(heroineRegex);
    
    if (heroMatch) {
      cast.push({ name: heroMatch[1].trim(), role: 'Hero', order: 1 });
    }
    if (heroineMatch) {
      cast.push({ name: heroineMatch[1].trim(), role: 'Heroine', order: 2 });
    }
  }
  
  return cast;
}

/**
 * Parse crew from CineJosh HTML
 */
function parseCrew(html: string): CineJoshCredits['crew'] {
  const crew: CineJoshCredits['crew'] = {};
  
  // CineJosh crew patterns - typically in movie info table
  const crewPatterns = [
    {
      key: 'cinematographer',
      labels: ['Cinematography', 'Cinematographer', 'Camera', 'DOP'],
    },
    {
      key: 'editor',
      labels: ['Editing', 'Editor', 'Film Editing'],
    },
    {
      key: 'writer',
      labels: ['Story', 'Writer', 'Screenplay', 'Dialogues', 'Script'],
    },
    {
      key: 'producer',
      labels: ['Producer', 'Production', 'Banner'],
    },
    {
      key: 'musicDirector',
      labels: ['Music', 'Music Director', 'Music Composer', 'Songs'],
    },
  ];
  
  for (const pattern of crewPatterns) {
    for (const label of pattern.labels) {
      // Pattern 1: Table row format (most common)
      const tableRegex = new RegExp(
        `<tr[^>]*>\\s*<td[^>]*[^>]*>${label}:?</td>\\s*<td[^>]*>([^<]+)</td>`,
        'is'
      );
      
      const tableMatch = html.match(tableRegex);
      if (tableMatch) {
        const name = tableMatch[1].trim();
        if (name && name.length > 2) {
          crew[pattern.key as keyof typeof crew] = [name];
          break;
        }
      }
      
      // Pattern 2: Div-based format
      const divRegex = new RegExp(
        `<div[^>]*class="[^"]*info-item[^"]*"[^>]*>\\s*<span[^>]*class="[^"]*label[^"]*"[^>]*>${label}:?</span>\\s*<span[^>]*class="[^"]*value[^"]*"[^>]*>([^<]+)</span>`,
        'is'
      );
      
      const divMatch = html.match(divRegex);
      if (divMatch) {
        const name = divMatch[1].trim();
        if (name && name.length > 2) {
          crew[pattern.key as keyof typeof crew] = [name];
          break;
        }
      }
      
      // Pattern 3: Plain text format
      const textRegex = new RegExp(
        `${label}:?\\s*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`,
        'i'
      );
      
      const textMatch = html.match(textRegex);
      if (textMatch) {
        const name = textMatch[1].trim();
        if (name && name.length > 2) {
          crew[pattern.key as keyof typeof crew] = [name];
          break;
        }
      }
    }
  }
  
  return crew;
}

/**
 * Parse director from CineJosh HTML
 */
function parseDirector(html: string): string[] {
  const directors: string[] = [];
  
  // Pattern 1: Table format
  const tableRegex = /<tr[^>]*>\s*<td[^>]*>Director:?<\/td>\s*<td[^>]*>([^<]+)<\/td>/is;
  const tableMatch = html.match(tableRegex);
  
  if (tableMatch) {
    directors.push(tableMatch[1].trim());
  } else {
    // Pattern 2: Div-based format
    const divRegex = /<div[^>]*class="[^"]*info-item[^"]*"[^>]*>\s*<span[^>]*class="[^"]*label[^"]*"[^>]*>Director:?<\/span>\s*<span[^>]*class="[^"]*value[^"]*"[^>]*>([^<]+)<\/span>/is;
    const divMatch = html.match(divRegex);
    
    if (divMatch) {
      directors.push(divMatch[1].trim());
    } else {
      // Pattern 3: Plain text format
      const textRegex = /Director:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
      const textMatch = html.match(textRegex);
      
      if (textMatch) {
        directors.push(textMatch[1].trim());
      }
    }
  }
  
  return directors;
}

/**
 * Parse rating from CineJosh HTML
 */
function parseRating(html: string): number | undefined {
  // CineJosh uses star ratings, typically out of 5
  const ratingRegex = /<div[^>]*class="[^"]*rating[^"]*"[^>]*>.*?(\d+(?:\.\d+)?)\s*\/\s*5/is;
  const match = html.match(ratingRegex);
  
  if (match) {
    return parseFloat(match[1]);
  }
  
  // Alternative pattern
  const altRegex = /<span[^>]*class="[^"]*rating-value[^"]*"[^>]*>(\d+(?:\.\d+)?)<\/span>/i;
  const altMatch = html.match(altRegex);
  
  if (altMatch) {
    return parseFloat(altMatch[1]);
  }
  
  return undefined;
}

/**
 * Scrape CineJosh credits for a Telugu film
 */
export async function scrapeCineJoshCredits(
  title: string,
  year: number
): Promise<CineJoshCredits | null> {
  const slug = normalizeTitle(title);
  
  // CineJosh URL patterns
  const urlPatterns = [
    `${BASE_URL}/review/${slug}-review`,
    `${BASE_URL}/review/${slug}-revie`,
    `${BASE_URL}/review/${slug}`,
    `${BASE_URL}/reviews/${slug}-review`,
    `${BASE_URL}/movies/${slug}`,
    `${BASE_URL}/movie/${slug}`,
    `${BASE_URL}/review/${slug}-${year}`,
  ];
  
  try {
    for (const url of urlPatterns) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TeluguPortal/1.0 (film-data-enrichment)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Verify this is the correct movie by checking year or title
        const yearRegex = new RegExp(`\\b${year}\\b`);
        const titleRegex = new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        
        if (yearRegex.test(html) || titleRegex.test(html)) {
          const credits = parseCineJoshPage(html, title, year);
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
    console.error(`CineJosh scraping failed for ${title} (${year}):`, error);
    return null;
  }
}

/**
 * Parse CineJosh page and extract credits
 */
function parseCineJoshPage(
  html: string,
  title: string,
  year: number
): CineJoshCredits | null {
  const credits: CineJoshCredits = {
    title,
    year,
    confidence: 0.82,
    source: 'CineJosh',
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
  
  // Parse rating
  credits.rating = parseRating(html);
  
  // Check if we got any useful data
  const hasData = credits.director || credits.cast || 
    (credits.crew && Object.keys(credits.crew).length > 0);
  
  if (!hasData) {
    return null;
  }
  
  return credits;
}
