/**
 * M9News Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from M9.news reviews.
 * Confidence: 75% (Telugu news portal with structured reviews)
 */

export interface M9NewsCredits {
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

const BASE_URL = 'https://www.m9.news';
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
    new RegExp(`<b>${field}\\s*:?</b>\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<strong>${field}\\s*:?</strong>\\s*([^<\\n]+)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      return match[1].trim();
    }
  }
  return null;
}

export async function scrapeM9NewsCredits(
  title: string,
  year: number
): Promise<M9NewsCredits | null> {
  const slug = normalizeTitle(title);
  
  const urlPatterns = [
    `${BASE_URL}/reviews/${slug}`,
    `${BASE_URL}/movie-reviews/${slug}`,
    `${BASE_URL}/movie/${slug}`,
    `${BASE_URL}/reviews/${slug}-review`,
    `${BASE_URL}/${slug}`,
    `${BASE_URL}/movies/${slug}`,
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
          const credits: M9NewsCredits = {
            title,
            year,
            confidence: 0.75,
            source: 'M9News',
          };
          
          const director = extractData(html, 'Director');
          if (director) credits.director = [director];
          
          const cast: Array<{ name: string; role?: string; order: number }> = [];
          const castStr = extractData(html, 'Cast');
          if (castStr) {
            castStr.split(/[,،]/).forEach((name, idx) => {
              const trimmed = name.trim();
              if (trimmed.length > 2 && idx < 15) {
                cast.push({ name: trimmed, order: idx + 1 });
              }
            });
          }
          if (cast.length > 0) credits.cast = cast;
          
          const crew: M9NewsCredits['crew'] = {};
          
          const cinematographer = extractData(html, 'Cinematography|Cinematographer');
          if (cinematographer) crew.cinematographer = [cinematographer];
          
          const editor = extractData(html, 'Editor|Editing');
          if (editor) crew.editor = [editor];
          
          const writer = extractData(html, 'Story|Screenplay|Writer');
          if (writer) crew.writer = [writer];
          
          const producer = extractData(html, 'Producer');
          if (producer) crew.producer = [producer];
          
          const music = extractData(html, 'Music|Music Director');
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
    console.error(`M9News scraping failed for ${title}:`, error);
    return null;
  }
}
