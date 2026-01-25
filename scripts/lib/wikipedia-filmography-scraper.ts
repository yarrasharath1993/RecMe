/**
 * ROBUST WIKIPEDIA FILMOGRAPHY SCRAPER
 * 
 * Uses Wikipedia API to get structured data instead of HTML parsing
 */

import * as https from 'https';

interface WikiMovie {
  title: string;
  year: number;
  role?: string;
}

/**
 * Fetch filmography using Wikipedia API parse endpoint
 * More reliable than HTML scraping
 */
export async function fetchFilmographyFromAPI(wikipediaUrl: string): Promise<WikiMovie[]> {
  const movies: WikiMovie[] = [];
  
  try {
    // Extract page title from URL
    const urlMatch = wikipediaUrl.match(/\/wiki\/(.+?)(?:#|$)/);
    if (!urlMatch) return movies;
    
    const pageTitle = decodeURIComponent(urlMatch[1]);
    
    // Use Wikipedia API to get parsed HTML
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&formatversion=2&format=json`;
    
    const html = await fetchJSON(apiUrl);
    if (!html?.parse?.text) return movies;
    
    const content = html.parse.text;
    
    // Parse filmography tables from structured HTML
    return parseFilmographyTables(content);
    
  } catch (error) {
    console.error(`Error fetching filmography from API:`, error);
    return movies;
  }
}

/**
 * Parse filmography tables from Wikipedia HTML
 * Works with various Wikipedia filmography table formats
 */
function parseFilmographyTables(html: string): WikiMovie[] {
  const movies: WikiMovie[] = [];
  
  // Match all tables
  const tableRegex = /<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    
    // Check if this is a filmography table (contains year/title/film keywords)
    const tableText = tableHtml.toLowerCase();
    if (!tableText.includes('year') && !tableText.includes('film') && !tableText.includes('title')) {
      continue;
    }
    
    // Parse rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];
      
      // Skip header rows
      if (rowHtml.includes('<th')) continue;
      
      // Extract all cells
      const cells = extractCells(rowHtml);
      if (cells.length < 2) continue;
      
      // Find year in any of the first 3 cells
      const year = findYear(cells.slice(0, 3));
      if (!year) continue;
      
      // Find title (look for links, check all cells)
      const title = findTitle(cells);
      if (!title || title.length < 2 || title.length > 150) continue;
      
      // Find role if present
      const role = findRole(cells);
      
      movies.push({ title, year, role });
    }
  }
  
  return deduplicateMovies(movies);
}

/**
 * Extract cell contents from table row
 */
function extractCells(rowHtml: string): string[] {
  const cells: string[] = [];
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let cellMatch;
  
  while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
    cells.push(cellMatch[1]);
  }
  
  return cells;
}

/**
 * Find year in cells (looks for 4-digit year between 1900-2030)
 */
function findYear(cells: string[]): number | null {
  for (const cell of cells) {
    const text = stripHtml(cell);
    const yearMatch = text.match(/\b(19[2-9]\d|20[0-3]\d)\b/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
  }
  return null;
}

/**
 * Find movie title in cells
 * Prioritizes linked titles, but falls back to any text
 */
function findTitle(cells: string[]): string | null {
  // First pass: Look for linked titles (most reliable)
  for (const cell of cells) {
    // Try to find title in link
    const linkMatch = cell.match(/<a[^>]+title="([^"]+)"[^>]*>([^<]+)<\/a>/i);
    if (linkMatch) {
      let title = linkMatch[2];
      // Clean up HTML entities
      title = title.replace(/&amp;/g, '&')
                   .replace(/&quot;/g, '"')
                   .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
                   .trim();
      
      if (title && !title.match(/^\d{4}$/)) { // Not just a year
        return title;
      }
    }
  }
  
  // Second pass: Look for bold/italic text (common in film titles)
  for (const cell of cells) {
    const italicMatch = cell.match(/<i[^>]*>([^<]+)<\/i>/i);
    if (italicMatch) {
      const title = stripHtml(italicMatch[1]).trim();
      if (title && title.length > 2 && !title.match(/^\d{4}$/)) {
        return title;
      }
    }
    
    const boldMatch = cell.match(/<b[^>]*>([^<]+)<\/b>/i);
    if (boldMatch) {
      const title = stripHtml(boldMatch[1]).trim();
      if (title && title.length > 2 && !title.match(/^\d{4}$/)) {
        return title;
      }
    }
  }
  
  // Last resort: Look for any text that looks like a title
  // (longer than a few chars, not a year, not a common role word)
  for (const cell of cells) {
    const text = stripHtml(cell).trim();
    if (text.length > 2 && 
        !text.match(/^\d{4}$/) && 
        !text.match(/^(actor|actress|director|producer|writer|yes|no|tba)$/i)) {
      return text;
    }
  }
  
  return null;
}

/**
 * Find role/character information in cells
 */
function findRole(cells: string[]): string | undefined {
  const roleKeywords = /actor|actress|director|producer|writer|music|cinematographer|editor|lyricist|choreographer|lead|hero|heroine|supporting|cameo|guest|special appearance/i;
  
  for (const cell of cells) {
    const text = stripHtml(cell).trim();
    if (roleKeywords.test(text)) {
      return text;
    }
  }
  
  return undefined;
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .trim();
}

/**
 * Remove duplicate movies (same title and year)
 */
function deduplicateMovies(movies: WikiMovie[]): WikiMovie[] {
  const seen = new Set<string>();
  return movies.filter(movie => {
    const key = `${movie.title.toLowerCase()}-${movie.year}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Fetch JSON from URL
 */
function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'TeluguPortalBot/1.0 (https://teluguportal.com)',
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fallback: Direct HTML scraping for when API fails
 */
export async function fetchFilmographyFromHTML(wikipediaUrl: string): Promise<WikiMovie[]> {
  try {
    const html = await fetchHTML(wikipediaUrl);
    return parseFilmographyTables(html);
  } catch (error) {
    console.error(`Error fetching HTML:`, error);
    return [];
  }
}

function fetchHTML(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'TeluguPortalBot/1.0 (https://teluguportal.com)',
        'Accept': 'text/html',
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
