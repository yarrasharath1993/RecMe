/**
 * FilmiBeat Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from FilmiBeat Telugu section.
 * Confidence: 77% (Multi-language entertainment portal)
 */

export interface FilmiBeatCredits {
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

const BASE_URL = 'https://www.filmibeat.com/telugu';
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
    new RegExp(`${label}\\s*:\\s*<[^>]*>([^<]+)<`, 'i'),
    new RegExp(`${label}\\s*:\\s*([A-Z][^<\\n]+?)(?:\\n|<|$)`, 'i'),
    new RegExp(`<span[^>]*>${label}\\s*:?</span>\\s*<span[^>]*>([^<]+)</span>`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      return match[1].trim();
    }
  }
  return null;
}

export async function scrapeFilmiBeatCredits(
  title: string,
  year: number
): Promise<FilmiBeatCredits | null> {
  const slug = normalizeTitle(title);
  
  const urlPatterns = [
    `${BASE_URL}/movies/${slug}/review.html`,
    `${BASE_URL}/movie-review/${slug}.html`,
    `${BASE_URL}/movies/${slug}.html`,
    `${BASE_URL}/telugu/movies/${slug}/review.html`,
    `${BASE_URL}/telugu/movie-review/${slug}.html`,
    `${BASE_URL}/reviews/${slug}.html`,
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
          const credits: FilmiBeatCredits = {
            title,
            year,
            confidence: 0.77,
            source: 'FilmiBeat',
          };
          
          const director = extractValue(html, 'Director|Directed By');
          if (director) credits.director = [director];
          
          const cast: Array<{ name: string; role?: string; order: number }> = [];
          const castStr = extractValue(html, 'Cast|Starring|Star Cast');
          if (castStr) {
            castStr.split(/[,،]/).forEach((name, idx) => {
              const trimmed = name.trim();
              if (trimmed.length > 2 && idx < 15) {
                cast.push({ name: trimmed, order: idx + 1 });
              }
            });
          }
          if (cast.length > 0) credits.cast = cast;
          
          const crew: FilmiBeatCredits['crew'] = {};
          
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
          
          if (Object.keys(crew).length > 0) credits.crew = crew;
          
          const ratingMatch = html.match(/Rating:\s*(\d+(?:\.\d+)?)\s*\/\s*5/i);
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
    console.error(`FilmiBeat scraping failed for ${title}:`, error);
    return null;
  }
}
