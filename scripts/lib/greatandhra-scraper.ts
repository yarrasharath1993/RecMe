/**
 * GreatAndhra Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from GreatAndhra reviews (greatandhra.com).
 * Confidence: 85% (Telugu-specific source with review-based metadata)
 */

export interface GreatAndhraCredits {
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

const BASE_URLS = {
  english: 'https://greatandhra.com',
  telugu: 'https://telugu.greatandhra.com',
};
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between requests

/**
 * Normalize title for GreatAndhra URL
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
 * Parse cast from GreatAndhra HTML
 */
function parseCast(html: string): Array<{ name: string; role?: string; order: number }> {
  const cast: Array<{ name: string; role?: string; order: number }> = [];
  
  // GreatAndhra patterns - typically in review metadata sections
  // Pattern 1: Cast list in review info
  const castInfoRegex = /<div[^>]*class="[^"]*cast-info[^"]*"[^>]*>(.*?)<\/div>/is;
  const castInfoMatch = html.match(castInfoRegex);
  
  if (castInfoMatch) {
    const names = castInfoMatch[1].match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g);
    
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
  
  // Pattern 2: Structured cast table
  if (cast.length === 0) {
    const tableRegex = /<table[^>]*>.*?<tr[^>]*>.*?<td[^>]*>Cast:?<\/td>.*?<td[^>]*>(.*?)<\/td>.*?<\/tr>/is;
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
  
  // Pattern 3: Review text parsing
  if (cast.length === 0) {
    const heroRegex = /(?:Hero|Star|Lead):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
    const heroineRegex = /(?:Heroine|Actress|Female Lead):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
    
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
 * Parse crew from GreatAndhra HTML
 */
function parseCrew(html: string): GreatAndhraCredits['crew'] {
  const crew: GreatAndhraCredits['crew'] = {};
  
  // GreatAndhra crew patterns
  const crewPatterns = [
    {
      key: 'cinematographer',
      labels: ['Cinematography', 'Cinematographer', 'Camera', 'DOP', 'Photography'],
    },
    {
      key: 'editor',
      labels: ['Editing', 'Editor', 'Edited by'],
    },
    {
      key: 'writer',
      labels: ['Story', 'Writer', 'Screenplay', 'Dialogues', 'Written by'],
    },
    {
      key: 'producer',
      labels: ['Producer', 'Production', 'Produced by'],
    },
    {
      key: 'musicDirector',
      labels: ['Music', 'Music Director', 'Music Composer', 'Songs'],
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
        const name = tableMatch[1].trim();
        if (name && name.length > 2) {
          crew[pattern.key as keyof typeof crew] = [name];
          break;
        }
      }
      
      // Pattern 2: Simple label-value format
      const labelRegex = new RegExp(
        `<[^>]*>${label}:?\\s*</[^>]*>\\s*<[^>]*>([^<]+)</[^>]*>`,
        'is'
      );
      
      const labelMatch = html.match(labelRegex);
      if (labelMatch) {
        const name = labelMatch[1].trim();
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
 * Parse director from GreatAndhra HTML
 */
function parseDirector(html: string): string[] {
  const directors: string[] = [];
  
  // Pattern 1: Table format
  const tableRegex = /<tr[^>]*>\s*<td[^>]*>Director:?<\/td>\s*<td[^>]*>([^<]+)<\/td>/is;
  const tableMatch = html.match(tableRegex);
  
  if (tableMatch) {
    directors.push(tableMatch[1].trim());
  } else {
    // Pattern 2: Label-value format
    const labelRegex = /<[^>]*>Director:?\s*<\/[^>]*>\s*<[^>]*>([^<]+)<\/[^>]*>/is;
    const labelMatch = html.match(labelRegex);
    
    if (labelMatch) {
      directors.push(labelMatch[1].trim());
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
 * Scrape GreatAndhra credits for a Telugu film
 */
export async function scrapeGreatAndhraCredits(
  title: string,
  year: number
): Promise<GreatAndhraCredits | null> {
  const slug = normalizeTitle(title);
  const slugNoHyphens = slug.replace(/-/g, '');
  const slugWithYear = `${slug}-${year}`;
  
  // GreatAndhra URL patterns - try both English and Telugu sites with multiple variants
  const urlPatterns = [
    `${BASE_URLS.english}/movies/reviews/${slug}`,
    `${BASE_URLS.english}/movies/reviews/review-${slug}`,
    `${BASE_URLS.english}/movies/reviews/${slugWithYear}`,
    `${BASE_URLS.english}/movies/reviews/${slugNoHyphens}`,
    `${BASE_URLS.telugu}/movies/reviews/${slug}`,
    `${BASE_URLS.telugu}/movies/reviews/review-${slug}`,
    `${BASE_URLS.telugu}/movies/reviews/${slugWithYear}`,
    `${BASE_URLS.english}/movies/${slug}`,
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
          const credits = parseGreatAndhraPage(html, title, year);
          if (credits) {
            return credits;
          }
        }
      }
      
      // Rate limiting between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return null;
  } catch (error) {
    console.error(`GreatAndhra scraping failed for ${title} (${year}):`, error);
    return null;
  }
}

/**
 * Parse GreatAndhra page and extract credits
 */
function parseGreatAndhraPage(
  html: string,
  title: string,
  year: number
): GreatAndhraCredits | null {
  const credits: GreatAndhraCredits = {
    title,
    year,
    confidence: 0.85,
    source: 'GreatAndhra',
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
