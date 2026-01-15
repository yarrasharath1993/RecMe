/**
 * Tupaki Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from Tupaki.com reviews.
 * Confidence: 83% (Telugu-specific with structured reviews)
 */

export interface TupakiCredits {
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

const BASE_URL = 'https://www.tupaki.com';
const RATE_LIMIT_DELAY = 1500;

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractFieldValue(html: string, fieldName: string): string | null {
  // Pattern: Field name followed by colon and value
  const patterns = [
    new RegExp(`${fieldName}\\s*:\\s*([A-Z][^<\\n]+)`, 'i'),
    new RegExp(`<b>${fieldName}\\s*:\\s*</b>\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<strong>${fieldName}\\s*:\\s*</strong>\\s*([^<\\n]+)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1].trim().length > 2) {
      return match[1].trim();
    }
  }
  
  return null;
}

export async function scrapeTupakiCredits(
  title: string,
  year: number
): Promise<TupakiCredits | null> {
  const slug = normalizeTitle(title);
  
  const urlPatterns = [
    `${BASE_URL}/movies-reviews/movie/review/${slug}`,
    `${BASE_URL}/movie-reviews/${slug}`,
    `${BASE_URL}/reviews/${slug}`,
    `${BASE_URL}/movies-reviews/movie/${slug}`,
    `${BASE_URL}/movie-reviews/${slug}-${year}`,
    `${BASE_URL}/movies-reviews/review/${slug}`,
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
          const credits: TupakiCredits = {
            title,
            year,
            confidence: 0.83,
            source: 'Tupaki',
          };
          
          // Extract director
          const director = extractFieldValue(html, 'Director');
          if (director) credits.director = [director];
          
          // Extract cast
          const cast: Array<{ name: string; role?: string; order: number }> = [];
          const hero = extractFieldValue(html, 'Cast');
          if (hero) {
            const names = hero.split(/[,،]/);
            names.forEach((name, idx) => {
              const trimmed = name.trim();
              if (trimmed.length > 2) {
                cast.push({ name: trimmed, order: idx + 1 });
              }
            });
          }
          if (cast.length > 0) credits.cast = cast;
          
          // Extract crew
          const crew: TupakiCredits['crew'] = {};
          
          const cinematographer = extractFieldValue(html, 'Cinematography');
          if (cinematographer) crew.cinematographer = [cinematographer];
          
          const editor = extractFieldValue(html, 'Editor');
          if (editor) crew.editor = [editor];
          
          const writer = extractFieldValue(html, 'Story|Screenplay|Writer');
          if (writer) crew.writer = [writer];
          
          const producer = extractFieldValue(html, 'Producer');
          if (producer) crew.producer = [producer];
          
          const music = extractFieldValue(html, 'Music');
          if (music) crew.musicDirector = [music];
          
          if (Object.keys(crew).length > 0) {
            credits.crew = crew;
          }
          
          // Extract rating
          const ratingMatch = html.match(/Rating:\s*(\d+(?:\.\d+)?)\s*\/\s*5/i);
          if (ratingMatch) {
            credits.rating = parseFloat(ratingMatch[1]);
          }
          
          if (credits.director || credits.cast || credits.crew) {
            return credits;
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return null;
  } catch (error) {
    console.error(`Tupaki scraping failed for ${title}:`, error);
    return null;
  }
}
