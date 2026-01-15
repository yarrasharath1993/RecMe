/**
 * 123Telugu Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from 123telugu.com reviews.
 * Confidence: 81% (Popular Telugu film review site)
 */

export interface Telugu123Credits {
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

const BASE_URL = 'https://www.123telugu.com';
const RATE_LIMIT_DELAY = 1500;

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractSimple(html: string, label: string): string | null {
  const patterns = [
    new RegExp(`${label}\\s*:\\s*<[^>]*>([^<]+)<`, 'i'),
    new RegExp(`${label}\\s*:\\s*([A-Z][^<\\n]+?)(?:\\n|<)`, 'i'),
    new RegExp(`<td[^>]*>${label}\\s*:?</td>\\s*<td[^>]*>([^<]+)</td>`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1].trim().length > 2) {
      return match[1].trim();
    }
  }
  return null;
}

export async function scrape123TeluguCredits(
  title: string,
  year: number
): Promise<Telugu123Credits | null> {
  const slug = normalizeTitle(title);
  
  const urlPatterns = [
    `${BASE_URL}/reviews/${slug}-movie-review`,
    `${BASE_URL}/movie/${slug}`,
    `${BASE_URL}/reviews/${slug}`,
    `${BASE_URL}/${slug}-movie-review`,
    `${BASE_URL}/reviews/${slug}-${year}`,
    `${BASE_URL}/movie-review/${slug}`,
  ];
  
  try {
    for (const url of urlPatterns) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        
        if (new RegExp(`\\b${year}\\b`).test(html)) {
          const credits: Telugu123Credits = {
            title,
            year,
            confidence: 0.81,
            source: '123Telugu',
          };
          
          const director = extractSimple(html, 'Director');
          if (director) credits.director = [director];
          
          const cast: Array<{ name: string; role?: string; order: number }> = [];
          const castStr = extractSimple(html, 'Cast|Star Cast');
          if (castStr) {
            castStr.split(/[,،]/).forEach((name, idx) => {
              const trimmed = name.trim();
              if (trimmed.length > 2) {
                cast.push({ name: trimmed, order: idx + 1 });
              }
            });
          }
          if (cast.length > 0) credits.cast = cast;
          
          const crew: Telugu123Credits['crew'] = {};
          const cinematographer = extractSimple(html, 'Cinematography|Cinematographer');
          if (cinematographer) crew.cinematographer = [cinematographer];
          
          const editor = extractSimple(html, 'Editor|Editing');
          if (editor) crew.editor = [editor];
          
          const writer = extractSimple(html, 'Story|Screenplay|Writer');
          if (writer) crew.writer = [writer];
          
          const producer = extractSimple(html, 'Producer|Production');
          if (producer) crew.producer = [producer];
          
          const music = extractSimple(html, 'Music|Music Director');
          if (music) crew.musicDirector = [music];
          
          if (Object.keys(crew).length > 0) credits.crew = crew;
          
          const ratingMatch = html.match(/Rating:\s*(\d+(?:\.\d+)?)/i);
          if (ratingMatch) credits.rating = parseFloat(ratingMatch[1]);
          
          if (credits.director || credits.cast || credits.crew) {
            return credits;
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
    
    return null;
  } catch (error) {
    console.error(`123Telugu scraping failed for ${title}:`, error);
    return null;
  }
}
