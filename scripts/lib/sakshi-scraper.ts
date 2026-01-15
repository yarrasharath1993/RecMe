/**
 * Sakshi Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from Sakshi.com (major Telugu news portal).
 * Confidence: 84% (major Telugu news source with ratings)
 */

export interface SakshiCredits {
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

const BASE_URL = 'https://www.sakshi.com';
const RATE_LIMIT_DELAY = 1500;

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractField(html: string, field: string): string | null {
  const patterns = [
    new RegExp(`${field}\\s*:\\s*([A-Z][^<\\n]+?)(?:\\n|<|;)`, 'i'),
    new RegExp(`<strong>${field}\\s*:?</strong>\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<b>${field}\\s*:?</b>\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<td[^>]*>${field}\\s*:?</td>\\s*<td[^>]*>([^<]+)</td>`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      return match[1].trim().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    }
  }
  return null;
}

export async function scrapeSakshiCredits(
  title: string,
  year: number
): Promise<SakshiCredits | null> {
  const slug = normalizeTitle(title);
  
  // Sakshi URL patterns - note the ID at the end
  const urlPatterns = [
    `${BASE_URL}/telugu-news/movies/${slug}-movie-review-and-rating-telugu`,
    `${BASE_URL}/telugu-news/movies/${slug}-movie-review-telugu`,
    `${BASE_URL}/telugu-news/movies/${slug}-review`,
    `${BASE_URL}/movies/${slug}-review`,
    `${BASE_URL}/cinema/${slug}`,
    `${BASE_URL}/movies/${slug}`,
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
        
        // Verify year
        if (new RegExp(`\\b${year}\\b`).test(html)) {
          const credits: SakshiCredits = {
            title,
            year,
            confidence: 0.84,
            source: 'Sakshi',
          };
          
          // Extract director
          const director = extractField(html, 'Director|దర్శకత్వం');
          if (director) credits.director = [director];
          
          // Extract cast
          const cast: Array<{ name: string; role?: string; order: number }> = [];
          const castStr = extractField(html, 'Cast|Star Cast|కథానాయకుడు');
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
          const crew: SakshiCredits['crew'] = {};
          
          const cinematographer = extractField(html, 'Cinematography|Cinematographer|సినిమాటోగ్రఫీ');
          if (cinematographer) crew.cinematographer = [cinematographer];
          
          const editor = extractField(html, 'Editor|Editing|ఎడిటింగ్');
          if (editor) crew.editor = [editor];
          
          const writer = extractField(html, 'Story|Screenplay|Writer|కథ');
          if (writer) crew.writer = [writer];
          
          const producer = extractField(html, 'Producer|నిర్మాత');
          if (producer) crew.producer = [producer];
          
          const music = extractField(html, 'Music|Music Director|సంగీతం');
          if (music) crew.musicDirector = [music];
          
          if (Object.keys(crew).length > 0) {
            credits.crew = crew;
          }
          
          // Extract rating - Sakshi uses 5-star system
          const ratingMatch = html.match(/Rating\s*:\s*(\d+(?:\.\d+)?)\s*\/\s*5|రేటింగ్\s*:\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*stars/i);
          if (ratingMatch) {
            credits.rating = parseFloat(ratingMatch[1] || ratingMatch[2] || ratingMatch[3]);
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
    console.error(`Sakshi scraping failed for ${title}:`, error);
    return null;
  }
}
