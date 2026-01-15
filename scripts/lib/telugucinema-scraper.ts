/**
 * TeluguCinema Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from TeluguCinema.com.
 * Confidence: 79% (Dedicated Telugu cinema news and reviews)
 */

export interface TeluguCinemaCredits {
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

const BASE_URL = 'https://www.telugucinema.com';
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
    new RegExp(`${field}\\s*:\\s*([A-Z][^<\\n,]+)`, 'i'),
    new RegExp(`<strong>${field}</strong>\\s*:\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<b>${field}</b>\\s*:\\s*([^<\\n]+)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1].trim().length > 2) {
      return match[1].trim().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    }
  }
  return null;
}

export async function scrapeTeluguCinemaCredits(
  title: string,
  year: number
): Promise<TeluguCinemaCredits | null> {
  const slug = normalizeTitle(title);
  
  const urlPatterns = [
    `${BASE_URL}/tc/${slug}-movie-review`,
    `${BASE_URL}/movie-reviews/${slug}`,
    `${BASE_URL}/tc/${slug}`,
    `${BASE_URL}/reviews/${slug}`,
    `${BASE_URL}/movie/${slug}`,
    `${BASE_URL}/tc/${slug}-review`,
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
          const credits: TeluguCinemaCredits = {
            title,
            year,
            confidence: 0.79,
            source: 'TeluguCinema',
          };
          
          const director = extractField(html, 'Director|Directed by');
          if (director) credits.director = [director];
          
          const cast: Array<{ name: string; role?: string; order: number }> = [];
          const castStr = extractField(html, 'Cast|Starring');
          if (castStr) {
            castStr.split(/[,،]/).forEach((name, idx) => {
              const trimmed = name.trim();
              if (trimmed.length > 2 && idx < 15) {
                cast.push({ name: trimmed, order: idx + 1 });
              }
            });
          }
          if (cast.length > 0) credits.cast = cast;
          
          const crew: TeluguCinemaCredits['crew'] = {};
          
          const cinematographer = extractField(html, 'Cinematography|Cinematographer|Camera');
          if (cinematographer) crew.cinematographer = [cinematographer];
          
          const editor = extractField(html, 'Editor|Editing');
          if (editor) crew.editor = [editor];
          
          const writer = extractField(html, 'Story|Screenplay|Writer|Script');
          if (writer) crew.writer = [writer];
          
          const producer = extractField(html, 'Producer|Produced by');
          if (producer) crew.producer = [producer];
          
          const music = extractField(html, 'Music|Music Director|Composer');
          if (music) crew.musicDirector = [music];
          
          if (Object.keys(crew).length > 0) credits.crew = crew;
          
          if (credits.director || credits.cast || credits.crew) {
            return credits;
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
    
    return null;
  } catch (error) {
    console.error(`TeluguCinema scraping failed for ${title}:`, error);
    return null;
  }
}
