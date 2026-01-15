/**
 * Gulte Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from Gulte.com (humor + technical analysis).
 * Confidence: 82% (engaging reviews with technical filmmaking details)
 */

export interface GulteCredits {
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

const BASE_URL = 'https://www.gulte.com';
const RATE_LIMIT_DELAY = 1500;

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractData(html: string, field: string): string | null {
  const patterns = [
    new RegExp(`${field}\\s*:\\s*([A-Z][^<\\n]+?)(?:\\n|<)`, 'i'),
    new RegExp(`<strong>${field}\\s*:?</strong>\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<b>${field}\\s*:?</b>\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<span[^>]*>${field}\\s*:?</span>\\s*<span[^>]*>([^<]+)</span>`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      return match[1].trim();
    }
  }
  return null;
}

export async function scrapeGulteCredits(
  title: string,
  year: number
): Promise<GulteCredits | null> {
  const slug = normalizeTitle(title);
  
  // Gulte URL patterns
  const urlPatterns = [
    `${BASE_URL}/movie-reviews/${slug}`,
    `${BASE_URL}/movies/${slug}-review`,
    `${BASE_URL}/reviews/${slug}`,
    `${BASE_URL}/${slug}-review`,
    `${BASE_URL}/movie/${slug}`,
    `${BASE_URL}/cinema/${slug}`,
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
          const credits: GulteCredits = {
            title,
            year,
            confidence: 0.82,
            source: 'Gulte',
          };
          
          // Extract director
          const director = extractData(html, 'Director|Directed by');
          if (director) credits.director = [director];
          
          // Extract cast
          const cast: Array<{ name: string; role?: string; order: number }> = [];
          const castStr = extractData(html, 'Cast|Starring|Star Cast');
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
          const crew: GulteCredits['crew'] = {};
          
          const cinematographer = extractData(html, 'Cinematography|Cinematographer|Camera');
          if (cinematographer) crew.cinematographer = [cinematographer];
          
          const editor = extractData(html, 'Editor|Editing|Film Editing');
          if (editor) crew.editor = [editor];
          
          const writer = extractData(html, 'Story|Screenplay|Writer|Script');
          if (writer) crew.writer = [writer];
          
          const producer = extractData(html, 'Producer|Produced by');
          if (producer) crew.producer = [producer];
          
          const music = extractData(html, 'Music|Music Director|Composer');
          if (music) crew.musicDirector = [music];
          
          if (Object.keys(crew).length > 0) {
            credits.crew = crew;
          }
          
          // Extract rating
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
    console.error(`Gulte scraping failed for ${title}:`, error);
    return null;
  }
}
