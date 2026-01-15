/**
 * IdleBrain Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from IdleBrain (idlebrain.com).
 * Confidence: 88% (Telugu-specific source with accurate transliterations)
 */

export interface IdlebrainCredits {
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
  confidence: number;
  source: string;
}

const BASE_URL = 'https://idlebrain.com';
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between requests

/**
 * Normalize title for IdleBrain URL
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?]/g, '')
    .replace(/\s+/g, '')
    .replace(/the/g, '')
    .replace(/--+/g, '');
}

/**
 * Parse cast from IdleBrain HTML
 */
function parseCast(html: string): Array<{ name: string; role?: string; order: number }> {
  const cast: Array<{ name: string; role?: string; order: number }> = [];
  
  // IdleBrain patterns - typically in tables or structured divs
  // Pattern 1: Table-based cast list
  const tableRegex = /<table[^>]*>.*?Cast:?.*?<\/table>/is;
  const tableMatch = html.match(tableRegex);
  
  if (tableMatch) {
    const rows = tableMatch[0].match(/<tr[^>]*>(.*?)<\/tr>/gis);
    
    if (rows) {
      let order = 0;
      for (const row of rows) {
        const cells = row.match(/<td[^>]*>(.*?)<\/td>/gis);
        
        if (cells && cells.length >= 2) {
          const nameCell = cells[0].replace(/<[^>]*>/g, '').trim();
          const roleCell = cells[1] ? cells[1].replace(/<[^>]*>/g, '').trim() : undefined;
          
          if (nameCell && nameCell.length > 2) {
            cast.push({
              name: nameCell,
              role: roleCell,
              order: order + 1,
            });
            order++;
            
            if (order >= 20) break;
          }
        }
      }
    }
  }
  
  // Pattern 2: Div-based cast list
  if (cast.length === 0) {
    const castSectionRegex = /<div[^>]*class="[^"]*cast[^"]*"[^>]*>(.*?)<\/div>/is;
    const castSection = html.match(castSectionRegex);
    
    if (castSection) {
      const names = castSection[1].match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g);
      
      if (names) {
        names.forEach((name, index) => {
          if (index < 20) {
            cast.push({
              name: name.trim(),
              order: index + 1,
            });
          }
        });
      }
    }
  }
  
  // Pattern 3: Review text parsing (common in IdleBrain reviews)
  if (cast.length === 0) {
    const heroRegex = /(?:Hero|Star|Cast):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
    const heroineRegex = /(?:Heroine|Actress):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
    
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
 * Parse crew from IdleBrain HTML
 */
function parseCrew(html: string): IdlebrainCredits['crew'] {
  const crew: IdlebrainCredits['crew'] = {};
  
  // IdleBrain crew patterns - typically labeled fields
  const crewPatterns = [
    {
      key: 'cinematographer',
      labels: ['Cinematography', 'Cinematographer', 'Camera', 'DOP'],
    },
    {
      key: 'editor',
      labels: ['Editing', 'Editor'],
    },
    {
      key: 'writer',
      labels: ['Story', 'Writer', 'Screenplay', 'Dialogues'],
    },
    {
      key: 'producer',
      labels: ['Producer', 'Production'],
    },
    {
      key: 'musicDirector',
      labels: ['Music', 'Music Director', 'Music Composer'],
    },
  ];
  
  for (const pattern of crewPatterns) {
    for (const label of pattern.labels) {
      // Pattern 1: Table row format
      const tableRegex = new RegExp(
        `<tr[^>]*>\\s*<td[^>]*>${label}:?</td>\\s*<td[^>]*>([^<]+)</td>`,
        'is'
      );
      
      const tableMatch = html.match(tableRegex);
      if (tableMatch) {
        crew[pattern.key as keyof typeof crew] = [tableMatch[1].trim()];
        break;
      }
      
      // Pattern 2: Simple text format
      const textRegex = new RegExp(
        `${label}:?\\s*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`,
        'i'
      );
      
      const textMatch = html.match(textRegex);
      if (textMatch) {
        crew[pattern.key as keyof typeof crew] = [textMatch[1].trim()];
        break;
      }
      
      // Pattern 3: Div-based format
      const divRegex = new RegExp(
        `<div[^>]*>\\s*${label}:?\\s*</div>\\s*<div[^>]*>([^<]+)</div>`,
        'is'
      );
      
      const divMatch = html.match(divRegex);
      if (divMatch) {
        crew[pattern.key as keyof typeof crew] = [divMatch[1].trim()];
        break;
      }
    }
  }
  
  return crew;
}

/**
 * Parse director from IdleBrain HTML
 */
function parseDirector(html: string): string[] {
  const directors: string[] = [];
  
  // Pattern 1: Table format
  const tableRegex = /<tr[^>]*>\s*<td[^>]*>Director:?<\/td>\s*<td[^>]*>([^<]+)<\/td>/is;
  const tableMatch = html.match(tableRegex);
  
  if (tableMatch) {
    directors.push(tableMatch[1].trim());
  } else {
    // Pattern 2: Simple text format
    const textRegex = /Director:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
    const textMatch = html.match(textRegex);
    
    if (textMatch) {
      directors.push(textMatch[1].trim());
    } else {
      // Pattern 3: Div format
      const divRegex = /<div[^>]*>\s*Director:?\s*<\/div>\s*<div[^>]*>([^<]+)<\/div>/is;
      const divMatch = html.match(divRegex);
      
      if (divMatch) {
        directors.push(divMatch[1].trim());
      }
    }
  }
  
  return directors;
}

/**
 * Scrape IdleBrain credits for a Telugu film
 */
export async function scrapeIdlebrainCredits(
  title: string,
  year: number
): Promise<IdlebrainCredits | null> {
  const slug = normalizeTitle(title);
  const slugNoHyphens = slug.replace(/-/g, '');
  
  // IdleBrain URL patterns
  const urlPatterns = [
    `${BASE_URL}/movie/archive/${slug}.html`,
    `${BASE_URL}/movie/reviews/${slug}.html`,
    `${BASE_URL}/movies/${slug}.html`,
    `${BASE_URL}/movie/archive/${slugNoHyphens}.html`,
    `${BASE_URL}/movie/${slug}.html`,
    `${BASE_URL}/review/${slug}.html`,
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
        
        // Verify this is the correct movie by checking year
        const yearRegex = new RegExp(`\\b${year}\\b`);
        if (!yearRegex.test(html)) {
          continue;
        }
        
        const credits = parseIdlebrainPage(html, title, year);
        if (credits) {
          return credits;
        }
      }
      
      // Rate limiting between attempts
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
    
    return null;
  } catch (error) {
    console.error(`IdleBrain scraping failed for ${title} (${year}):`, error);
    return null;
  }
}

/**
 * Parse IdleBrain page and extract credits
 */
function parseIdlebrainPage(
  html: string,
  title: string,
  year: number
): IdlebrainCredits | null {
  const credits: IdlebrainCredits = {
    title,
    year,
    confidence: 0.88,
    source: 'IdleBrain',
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
  
  // Check if we got any useful data
  const hasData = credits.director || credits.cast || 
    (credits.crew && Object.keys(credits.crew).length > 0);
  
  if (!hasData) {
    return null;
  }
  
  return credits;
}
