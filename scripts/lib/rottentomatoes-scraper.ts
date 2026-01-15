/**
 * Rotten Tomatoes Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from Rotten Tomatoes film pages.
 * Confidence: 90% (verified by RT editorial team)
 */

export interface RottenTomatoesCredits {
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

const BASE_URL = 'https://www.rottentomatoes.com';
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

/**
 * Normalize title for Rotten Tomatoes URL slug
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?]/g, '')
    .replace(/\s+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generate multiple URL variants for RT
 */
function generateRTUrlVariants(title: string, year: number): string[] {
  const baseSlug = normalizeTitle(title);
  const withoutThe = normalizeTitle(title.replace(/^the\s+/i, ''));
  const hyphenated = baseSlug.replace(/_/g, '-');
  
  return [
    `/m/${baseSlug}`,
    `/m/${baseSlug}_${year}`,
    `/m/${hyphenated}`,
    `/m/${hyphenated}_${year}`,
    `/m/${withoutThe}`,
    `/m/${withoutThe}_${year}`,
    `/m/${baseSlug.replace(/_/g, '')}`, // No separators
  ];
}

/**
 * Parse cast from Rotten Tomatoes HTML
 */
function parseCast(html: string): Array<{ name: string; role?: string; order: number }> {
  const cast: Array<{ name: string; role?: string; order: number }> = [];
  
  // RT uses different patterns for cast
  // Pattern 1: Cast list with data-qa attributes
  const castListRegex = /<div[^>]*data-qa="cast-crew-item"[^>]*>(.*?)<\/div>/gs;
  const nameRegex = /<a[^>]*data-qa="cast-crew-name"[^>]*>([^<]+)<\/a>/;
  const roleRegex = /<span[^>]*data-qa="cast-crew-character-name"[^>]*>([^<]+)<\/span>/;
  
  const matches = html.matchAll(castListRegex);
  let order = 0;
  
  for (const match of matches) {
    const section = match[1];
    const nameMatch = section.match(nameRegex);
    const roleMatch = section.match(roleRegex);
    
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
  
  // Fallback pattern for older RT pages
  if (cast.length === 0) {
    const actorRegex = /<div[^>]*class="[^"]*cast-item[^"]*"[^>]*>.*?<span[^>]*class="[^"]*actor-name[^"]*"[^>]*>([^<]+)<\/span>.*?<span[^>]*class="[^"]*character-name[^"]*"[^>]*>([^<]+)<\/span>/gs;
    
    const legacyMatches = html.matchAll(actorRegex);
    let legacyOrder = 0;
    
    for (const match of legacyMatches) {
      cast.push({
        name: match[1].trim(),
        role: match[2].trim(),
        order: legacyOrder + 1,
      });
      legacyOrder++;
      
      if (legacyOrder >= 20) break;
    }
  }
  
  return cast;
}

/**
 * Parse crew from Rotten Tomatoes HTML
 */
function parseCrew(html: string): RottenTomatoesCredits['crew'] {
  const crew: RottenTomatoesCredits['crew'] = {};
  
  // RT crew sections with specific roles
  const crewPatterns = [
    {
      key: 'cinematographer',
      titles: ['Cinematographer', 'Cinematography', 'Director of Photography'],
    },
    {
      key: 'editor',
      titles: ['Film Editing', 'Editor'],
    },
    {
      key: 'writer',
      titles: ['Screenwriter', 'Writer', 'Screenplay'],
    },
    {
      key: 'producer',
      titles: ['Producer'],
    },
    {
      key: 'musicDirector',
      titles: ['Original Music', 'Music', 'Composer'],
    },
  ];
  
  for (const pattern of crewPatterns) {
    for (const title of pattern.titles) {
      // Pattern for crew sections
      const regex = new RegExp(
        `<div[^>]*>\\s*${title}\\s*</div>.*?<a[^>]*data-qa="cast-crew-name"[^>]*>([^<]+)</a>`,
        'is'
      );
      
      const match = html.match(regex);
      if (match) {
        crew[pattern.key as keyof typeof crew] = [match[1].trim()];
        break;
      }
      
      // Alternative pattern with different HTML structure
      const altRegex = new RegExp(
        `<span[^>]*class="[^"]*crew-role[^"]*"[^>]*>${title}</span>.*?<span[^>]*class="[^"]*crew-name[^"]*"[^>]*>([^<]+)</span>`,
        'is'
      );
      
      const altMatch = html.match(altRegex);
      if (altMatch) {
        crew[pattern.key as keyof typeof crew] = [altMatch[1].trim()];
        break;
      }
    }
  }
  
  return crew;
}

/**
 * Parse director from Rotten Tomatoes HTML
 */
function parseDirector(html: string): string[] {
  const directors: string[] = [];
  
  // Pattern 1: Modern RT with data-qa attributes
  const directorRegex = /<div[^>]*>\\s*Director\\s*<\/div>.*?<a[^>]*data-qa="cast-crew-name"[^>]*>([^<]+)<\/a>/is;
  const match = html.match(directorRegex);
  
  if (match) {
    directors.push(match[1].trim());
  } else {
    // Pattern 2: Legacy format
    const legacyRegex = /<p[^>]*class="[^"]*director[^"]*"[^>]*>.*?<a[^>]*>([^<]+)<\/a>/is;
    const legacyMatch = html.match(legacyRegex);
    
    if (legacyMatch) {
      directors.push(legacyMatch[1].trim());
    }
  }
  
  return directors;
}

/**
 * Scrape Rotten Tomatoes credits for a Telugu film
 */
export async function scrapeRottenTomatoesCredits(
  title: string,
  year: number
): Promise<RottenTomatoesCredits | null> {
  const urlVariants = generateRTUrlVariants(title, year);
  
  try {
    // Try each URL variant
    for (const urlPath of urlVariants) {
      const movieUrl = `${BASE_URL}${urlPath}`;
      const castCrewUrl = `${BASE_URL}${urlPath}/cast-and-crew`;
      
      const mainResponse = await fetch(movieUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      if (mainResponse.ok) {
        const mainHtml = await mainResponse.text();
        
        // Verify it's the right movie by checking year
        if (new RegExp(`\\b${year}\\b`).test(mainHtml)) {
          // Try to get cast & crew page
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
          
          const castCrewResponse = await fetch(castCrewUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });
          
          const html = castCrewResponse.ok ? await castCrewResponse.text() : mainHtml;
          return parseRottenTomatoesPage(html, title, year);
        }
      }
      
      // Rate limiting between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return null;
  } catch (error) {
    console.error(`Rotten Tomatoes scraping failed for ${title} (${year}):`, error);
    return null;
  }
}

/**
 * Parse Rotten Tomatoes page and extract credits
 */
function parseRottenTomatoesPage(
  html: string,
  title: string,
  year: number
): RottenTomatoesCredits | null {
  const credits: RottenTomatoesCredits = {
    title,
    year,
    confidence: 0.90,
    source: 'RottenTomatoes',
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
