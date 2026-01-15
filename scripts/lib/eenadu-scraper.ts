/**
 * Eenadu Scraper for Telugu Film Data
 * 
 * Scrapes cast and crew information from Eenadu.net (major Telugu news portal).
 * Confidence: 86% (major Telugu news source with structured reviews)
 */

export interface EenaduCredits {
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

const BASE_URL = 'https://www.eenadu.net';
const RATE_LIMIT_DELAY = 1500;

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractFieldFromTelugu(html: string, fieldName: string): string | null {
  // Patterns for Telugu and English field extraction
  const patterns = [
    // Telugu and English labels
    new RegExp(`(?:${fieldName}|దర్శకత్వం|దర్శకుడు|సంగీతం|నిర్మాత|కథ)\\s*:\\s*([^<\\n;]+)`, 'i'),
    new RegExp(`<strong>(?:${fieldName})[^<]*</strong>\\s*:\\s*([^<\\n]+)`, 'i'),
    new RegExp(`<b>(?:${fieldName})[^<]*</b>\\s*:\\s*([^<\\n]+)`, 'i'),
    // Table format
    new RegExp(`<td[^>]*>\\s*(?:${fieldName})\\s*:?\\s*</td>\\s*<td[^>]*>([^<]+)</td>`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      // Clean up Telugu/English mixed content
      return match[1].trim().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    }
  }
  
  return null;
}

export async function scrapeEenaduCredits(
  title: string,
  year: number
): Promise<EenaduCredits | null> {
  const slug = normalizeTitle(title);
  
  // Eenadu URL patterns - includes category/ID codes
  const urlPatterns = [
    `${BASE_URL}/telugu-news/movies/${slug}-movie-review-in-telugu`,
    `${BASE_URL}/movies/${slug}-review`,
    `${BASE_URL}/telugu-news/movies/${slug}`,
    `${BASE_URL}/cinema/${slug}`,
    `${BASE_URL}/movies/${slug}`,
  ];
  
  try {
    for (const urlBase of urlPatterns) {
      // Try the base URL and with year
      for (const url of [urlBase, `${urlBase}-${year}`]) {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Verify year and title
          if (new RegExp(`\\b${year}\\b`).test(html)) {
            const credits: EenaduCredits = {
              title,
              year,
              confidence: 0.86,
              source: 'Eenadu',
            };
            
            // Extract director
            const director = extractFieldFromTelugu(html, 'Director|దర్శకత్వం|దర్శకుడు');
            if (director) credits.director = [director];
            
            // Extract cast - try multiple patterns
            const castPattern = /<div[^>]*class="[^"]*cast[^"]*"[^>]*>(.*?)<\/div>|Cast\s*:\s*([^<\n]+)|కథానాయకుడు\s*:\s*([^<\n]+)/is;
            const castMatch = html.match(castPattern);
            const cast: Array<{ name: string; role?: string; order: number }> = [];
            
            if (castMatch) {
              const castText = (castMatch[1] || castMatch[2] || castMatch[3] || '').replace(/<[^>]*>/g, '');
              const names = castText.split(/[,،]/);
              names.forEach((name, idx) => {
                const trimmed = name.trim();
                if (trimmed.length > 2 && idx < 15) {
                  cast.push({ name: trimmed, order: idx + 1 });
                }
              });
            }
            if (cast.length > 0) credits.cast = cast;
            
            // Extract crew
            const crew: EenaduCredits['crew'] = {};
            
            const cinematographer = extractFieldFromTelugu(html, 'Cinematography|Cinematographer|సినిమాటోగ్రఫీ');
            if (cinematographer) crew.cinematographer = [cinematographer];
            
            const editor = extractFieldFromTelugu(html, 'Editor|Editing|ఎడిటింగ్');
            if (editor) crew.editor = [editor];
            
            const writer = extractFieldFromTelugu(html, 'Story|Screenplay|Writer|కథ|రచన');
            if (writer) crew.writer = [writer];
            
            const producer = extractFieldFromTelugu(html, 'Producer|నిర్మాత');
            if (producer) crew.producer = [producer];
            
            const music = extractFieldFromTelugu(html, 'Music|సంగీతం');
            if (music) crew.musicDirector = [music];
            
            if (Object.keys(crew).length > 0) {
              credits.crew = crew;
            }
            
            // Extract rating
            const ratingMatch = html.match(/Rating\s*:\s*(\d+(?:\.\d+)?)\s*\/\s*5|రేటింగ్\s*:\s*(\d+(?:\.\d+)?)/i);
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
    }
    
    return null;
  } catch (error) {
    console.error(`Eenadu scraping failed for ${title}:`, error);
    return null;
  }
}
