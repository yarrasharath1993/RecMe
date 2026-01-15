/**
 * Telugu360 Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from Telugu360.com (succinct reviews, OTT tracking).
 * Confidence: 80% (updated ratings, theater and OTT coverage)
 */

export interface Telugu360Credits {
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

const BASE_URL = 'https://www.telugu360.com';
const RATE_LIMIT_DELAY = 1500;

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractValue(html: string, label: string): string | null {
  const patterns = [
    new RegExp(`${label}\\s*:\\s*([A-Z][^<\\n]+?)(?:\\n|<)`, 'i'),
    new RegExp(`<strong>${label}\\s*:?</strong>\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<b>${label}\\s*:?</b>\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<div[^>]*class="[^"]*info[^"]*"[^>]*>.*?${label}\\s*:?.*?<span[^>]*>([^<]+)</span>`, 'is'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      return match[1].trim();
    }
  }
  return null;
}

export async function scrapeTelugu360Credits(
  title: string,
  year: number
): Promise<Telugu360Credits | null> {
  const slug = normalizeTitle(title);
  
  // Telugu360 URL patterns
  const urlPatterns = [
    `${BASE_URL}/movie-reviews/${slug}`,
    `${BASE_URL}/reviews/${year}/${slug}`,
    `${BASE_URL}/reviews/${slug}`,
    `${BASE_URL}/${slug}-review`,
    `${BASE_URL}/movie/${slug}`,
    `${BASE_URL}/${slug}`,
  ];
  
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
        
        if (new RegExp(`\\b${year}\\b`).test(html)) {
          const credits: Telugu360Credits = {
            title,
            year,
            confidence: 0.80,
            source: 'Telugu360',
          };
          
          // Extract director
          const director = extractValue(html, 'Director|Directed By');
          if (director) credits.director = [director];
          
          // Extract cast
          const cast: Array<{ name: string; role?: string; order: number }> = [];
          const castStr = extractValue(html, 'Cast|Star Cast|Starring');
          if (castStr) {
            castStr.split(/[,،]/).forEach((name, idx) => {
              const trimmed = name.trim();
              if (trimmed.length > 2 && idx < 15) {
                cast.push({ name: trimmed, order: idx + 1 });
              }
            });
          }
          if (cast.length > 0) credits.cast = cast;
          
          // Extract crew
          const crew: Telugu360Credits['crew'] = {};
          
          const cinematographer = extractValue(html, 'Cinematography|Cinematographer');
          if (cinematographer) crew.cinematographer = [cinematographer];
          
          const editor = extractValue(html, 'Editor|Editing');
          if (editor) crew.editor = [editor];
          
          const writer = extractValue(html, 'Story|Screenplay|Writer');
          if (writer) crew.writer = [writer];
          
          const producer = extractValue(html, 'Producer|Produced By');
          if (producer) crew.producer = [producer];
          
          const music = extractValue(html, 'Music|Music Director');
          if (music) crew.musicDirector = [music];
          
          if (Object.keys(crew).length > 0) {
            credits.crew = crew;
          }
          
          // Extract rating - Telugu360 uses 5-star system
          const ratingMatch = html.match(/Rating\s*:\s*(\d+(?:\.\d+)?)\s*\/\s*5|(\d+(?:\.\d+)?)\s*stars/i);
          if (ratingMatch) {
            credits.rating = parseFloat(ratingMatch[1] || ratingMatch[2]);
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
    console.error(`Telugu360 scraping failed for ${title}:`, error);
    return null;
  }
}
