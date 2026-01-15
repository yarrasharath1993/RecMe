/**
 * WIKIPEDIA INFOBOX PARSER
 * 
 * Parses film infoboxes from Telugu and English Wikipedia to extract technical credits.
 * Wikipedia is an excellent source for Indian cinema technical credits.
 * 
 * Features:
 * - Parses Telugu Wikipedia infoboxes (primary source for Telugu films)
 * - Falls back to English Wikipedia
 * - Extracts cinematographer, editor, writer, producer, music director
 * - Handles multiple formats and field names
 * - Confidence scoring based on data completeness
 * 
 * Infobox fields:
 * - cinematography / camera / cinematographer
 * - editing / editor
 * - writer / screenplay / story / dialogue
 * - producer / producers
 * - music / musicDirector
 */

import { CONFIDENCE_THRESHOLDS } from './confidence-config';

// ============================================================
// TYPES
// ============================================================

export interface WikipediaInfobox {
  cinematographer?: string;
  editor?: string;
  writer?: string; // combines writer, screenplay, story, dialogue
  producer?: string;
  musicDirector?: string;
  director?: string;
  cast?: string[];
  confidence: number;
  source: 'wikipedia';
  language: 'te' | 'en';
}

// ============================================================
// RATE LIMITING
// ============================================================

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests (Wikipedia is generous)

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
}

// ============================================================
// INFOBOX PARSING
// ============================================================

/**
 * Extract field value from infobox content
 * Handles both Telugu and English field names
 */
function extractInfoboxField(content: string, fieldNames: string[]): string | null {
  for (const fieldName of fieldNames) {
    // Match: | fieldName = value
    const pattern = new RegExp(`\\|\\s*${fieldName}\\s*=\\s*([^\\|\\n]+)`, 'i');
    const match = content.match(pattern);
    
    if (match) {
      let value = match[1].trim();
      
      // Clean up wikilinks: [[Name]] or [[Name|Display]]
      value = value.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, link, display) => display || link);
      
      // Remove HTML comments
      value = value.replace(/<!--[\s\S]*?-->/g, '');
      
      // Remove refs
      value = value.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '');
      value = value.replace(/<ref[^>]*\/>/g, '');
      
      // Remove templates (simplified)
      value = value.replace(/\{\{[^\}]+\}\}/g, '');
      
      // Clean up extra whitespace
      value = value.replace(/\s+/g, ' ').trim();
      
      // Remove trailing punctuation
      value = value.replace(/[,;]$/, '').trim();
      
      if (value && value !== '-' && value !== 'N/A') {
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Extract multiple values (for fields like cast, producer that may have multiple people)
 */
function extractInfoboxMultiField(content: string, fieldNames: string[]): string[] | null {
  for (const fieldName of fieldNames) {
    // Match: | fieldName = value (may span multiple lines)
    const pattern = new RegExp(`\\|\\s*${fieldName}\\s*=\\s*([^\\|]+?)(?=\\n\\|)`, 'is');
    const match = content.match(pattern);
    
    if (match) {
      let value = match[1].trim();
      
      // Clean up wikilinks
      value = value.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, link, display) => display || link);
      
      // Remove HTML and refs
      value = value.replace(/<!--[\s\S]*?-->/g, '');
      value = value.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '');
      value = value.replace(/<ref[^>]*\/>/g, '');
      value = value.replace(/\{\{[^\}]+\}\}/g, '');
      
      // Split by common separators
      const items = value.split(/[,\n]/)
        .map(item => item.trim())
        .filter(item => item && item !== '-' && item !== 'N/A' && !item.startsWith('{{'));
      
      if (items.length > 0) {
        return items;
      }
    }
  }
  
  return null;
}

/**
 * Parse Telugu Wikipedia infobox
 */
function parseTeluguInfobox(content: string): Partial<WikipediaInfobox> {
  const result: Partial<WikipediaInfobox> = {};

  // Director (దర్శకత్వం)
  result.director = extractInfoboxField(content, ['దర్శకత్వం', 'దర్శకుడు', 'director']);

  // Cinematographer (చిత్రీకరణ)
  result.cinematographer = extractInfoboxField(content, ['చిత్రీకరణ', 'cinematography', 'camera']);

  // Editor (సంపాదకుడు / editing)
  result.editor = extractInfoboxField(content, ['సంపాదకుడు', 'editing', 'editor']);

  // Writer (రచయిత / కథ / scenario)
  const writer = extractInfoboxField(content, ['రచయిత', 'కథ', 'scenario', 'writer', 'screenplay', 'story']);
  const screenplay = extractInfoboxField(content, ['స్క్రీన్‌ప్లే', 'screenplay']);
  const dialogue = extractInfoboxField(content, ['సంభాషణలు', 'dialogue']);
  
  // Combine writer fields
  const writers = [writer, screenplay, dialogue].filter(Boolean);
  if (writers.length > 0) {
    result.writer = writers.join(', ');
  }

  // Producer (నిర్మాత)
  const producers = extractInfoboxMultiField(content, ['నిర్మాత', 'నిర్మాతలు', 'producer', 'producers']);
  if (producers && producers.length > 0) {
    result.producer = producers[0]; // Take first producer
  }

  // Music Director (సంగీతం)
  result.musicDirector = extractInfoboxField(content, ['సంగీతం', 'music']);

  // Cast (తారాగణం)
  const cast = extractInfoboxMultiField(content, ['తారాగణం', 'starring', 'cast']);
  if (cast) {
    result.cast = cast;
  }

  return result;
}

/**
 * Parse English Wikipedia infobox
 */
function parseEnglishInfobox(content: string): Partial<WikipediaInfobox> {
  const result: Partial<WikipediaInfobox> = {};

  // Director
  result.director = extractInfoboxField(content, ['director', 'directed by']);

  // Cinematographer
  result.cinematographer = extractInfoboxField(content, ['cinematography', 'camera', 'cinematographer']);

  // Editor
  result.editor = extractInfoboxField(content, ['editing', 'editor', 'edited by']);

  // Writer
  const writer = extractInfoboxField(content, ['writer', 'written by']);
  const screenplay = extractInfoboxField(content, ['screenplay', 'screenplay by']);
  const story = extractInfoboxField(content, ['story', 'story by']);
  const dialogue = extractInfoboxField(content, ['dialogue', 'dialogues']);
  
  // Combine writer fields
  const writers = [writer, screenplay, story, dialogue].filter(Boolean);
  if (writers.length > 0) {
    result.writer = writers.join(', ');
  }

  // Producer
  const producers = extractInfoboxMultiField(content, ['producer', 'producers', 'produced by']);
  if (producers && producers.length > 0) {
    result.producer = producers[0];
  }

  // Music Director
  result.musicDirector = extractInfoboxField(content, ['music', 'music by', 'music director']);

  // Cast
  const cast = extractInfoboxMultiField(content, ['starring', 'cast']);
  if (cast) {
    result.cast = cast;
  }

  return result;
}

// ============================================================
// WIKIPEDIA API
// ============================================================

/**
 * Fetch Wikipedia page content
 */
async function fetchWikipediaPage(
  title: string,
  language: 'te' | 'en'
): Promise<string | null> {
  try {
    await rateLimit();

    const baseUrl = language === 'te' 
      ? 'https://te.wikipedia.org/w/api.php'
      : 'https://en.wikipedia.org/w/api.php';

    const url = `${baseUrl}?action=query&titles=${encodeURIComponent(title)}&prop=revisions&rvprop=content&format=json&origin=*`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TeluguPortal/1.0 (film-database)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const pages = data.query?.pages;
    
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    
    // Check if page exists
    if (page.missing) return null;

    const content = page.revisions?.[0]?.['*'];
    return content || null;

  } catch (error) {
    console.error(`Wikipedia fetch error (${language}):`, error);
    return null;
  }
}

/**
 * Search Wikipedia for a page
 */
async function searchWikipedia(
  searchTerm: string,
  language: 'te' | 'en'
): Promise<string | null> {
  try {
    await rateLimit();

    const baseUrl = language === 'te' 
      ? 'https://te.wikipedia.org/w/api.php'
      : 'https://en.wikipedia.org/w/api.php';

    const url = `${baseUrl}?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TeluguPortal/1.0 (film-database)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const results = data.query?.search;
    
    if (!results || results.length === 0) return null;

    return results[0].title;

  } catch (error) {
    console.error(`Wikipedia search error (${language}):`, error);
    return null;
  }
}

// ============================================================
// MAIN PARSER
// ============================================================

/**
 * Parse Telugu Wikipedia infobox for a film
 * 
 * @param title - Film title
 * @param year - Release year
 * @returns Parsed infobox data or null if not found
 */
export async function parseTeluguWikipediaInfobox(
  title: string,
  year: number
): Promise<WikipediaInfobox | null> {
  try {
    // Try exact title first
    let content = await fetchWikipediaPage(title, 'te');

    // If not found, search
    if (!content) {
      const searchTitle = await searchWikipedia(`${title} ${year}`, 'te');
      if (searchTitle) {
        content = await fetchWikipediaPage(searchTitle, 'te');
      }
    }

    if (!content) return null;

    // Check if it's a film infobox
    if (!content.includes('{{Infobox') && !content.includes('{{చిత్ర పెట్టె')) {
      return null;
    }

    const parsed = parseTeluguInfobox(content);

    // Calculate confidence
    const fields = ['director', 'cinematographer', 'editor', 'writer', 'producer', 'musicDirector'];
    const filledFields = fields.filter(field => parsed[field as keyof typeof parsed]);
    const confidence = CONFIDENCE_THRESHOLDS.SOURCES.wikipedia * (filledFields.length / fields.length);

    return {
      ...parsed,
      confidence,
      source: 'wikipedia',
      language: 'te',
    } as WikipediaInfobox;

  } catch (error) {
    console.error(`Telugu Wikipedia parsing error:`, error);
    return null;
  }
}

/**
 * Parse English Wikipedia infobox for a film
 * 
 * @param title - Film title
 * @param year - Release year
 * @returns Parsed infobox data or null if not found
 */
export async function parseEnglishWikipediaInfobox(
  title: string,
  year: number
): Promise<WikipediaInfobox | null> {
  try {
    // Try exact title first
    let content = await fetchWikipediaPage(title, 'en');

    // If not found, search
    if (!content) {
      const searchTitle = await searchWikipedia(`${title} ${year} film`, 'en');
      if (searchTitle) {
        content = await fetchWikipediaPage(searchTitle, 'en');
      }
    }

    if (!content) return null;

    // Check if it's a film infobox
    if (!content.includes('{{Infobox film')) {
      return null;
    }

    const parsed = parseEnglishInfobox(content);

    // Calculate confidence
    const fields = ['director', 'cinematographer', 'editor', 'writer', 'producer', 'musicDirector'];
    const filledFields = fields.filter(field => parsed[field as keyof typeof parsed]);
    const confidence = CONFIDENCE_THRESHOLDS.SOURCES.wikipedia * (filledFields.length / fields.length);

    return {
      ...parsed,
      confidence,
      source: 'wikipedia',
      language: 'en',
    } as WikipediaInfobox;

  } catch (error) {
    console.error(`English Wikipedia parsing error:`, error);
    return null;
  }
}

/**
 * Parse Wikipedia infobox (tries Telugu first, then English)
 * 
 * @param title - Film title
 * @param year - Release year
 * @returns Parsed infobox data or null if not found
 */
export async function parseWikipediaInfobox(
  title: string,
  year: number
): Promise<WikipediaInfobox | null> {
  // Try Telugu Wikipedia first (better for Telugu films)
  const teData = await parseTeluguWikipediaInfobox(title, year);
  if (teData) return teData;

  // Fall back to English Wikipedia
  const enData = await parseEnglishWikipediaInfobox(title, year);
  return enData;
}

/**
 * Check if actor is in Wikipedia cast list
 * 
 * @param infobox - Parsed infobox data
 * @param actorName - Actor name to search for
 * @returns True if actor is found in cast
 */
export function isActorInWikipediaCast(infobox: WikipediaInfobox, actorName: string): boolean {
  if (!infobox.cast) return false;

  const normalizedName = actorName.toLowerCase().trim();
  
  return infobox.cast.some(castMember => 
    castMember.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(castMember.toLowerCase())
  );
}

// ============================================================
// FILMOGRAPHY TABLE PARSING
// ============================================================

export interface WikipediaFilmographyEntry {
  year: number;
  title: string;
  role?: string;
  notes?: string;
  language?: string;
}

/**
 * Parse filmography table from actor's Wikipedia page
 * 
 * Extracts film list from sections like "Filmography", "Films", "Career"
 * 
 * @param actorName - Actor name to search for
 * @returns Array of films from Wikipedia filmography
 */
export async function fetchWikipediaFilmography(actorName: string): Promise<WikipediaFilmographyEntry[]> {
  await rateLimit();
  
  console.log(`Wikipedia: Fetching filmography for "${actorName}"...`);
  
  try {
    // Try English Wikipedia first (more structured)
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(actorName)}&prop=text&format=json&origin=*`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Telugu-Portal-FilmDiscovery/1.0',
      },
    });
    
    if (!response.ok) {
      console.log(`Wikipedia: Failed to fetch page for "${actorName}"`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error || !data.parse?.text?.['*']) {
      console.log(`Wikipedia: No content found for "${actorName}"`);
      return [];
    }
    
    const html = data.parse.text['*'];
    
    // Parse filmography from HTML
    const films = parseFilmographyFromHTML(html);
    
    console.log(`Wikipedia: Found ${films.length} films in filmography for "${actorName}"`);
    
    return films;
  } catch (error) {
    console.error(`Wikipedia filmography fetch failed for "${actorName}":`, error);
    return [];
  }
}

/**
 * Parse filmography table from HTML
 */
function parseFilmographyFromHTML(html: string): WikipediaFilmographyEntry[] {
  const films: WikipediaFilmographyEntry[] = [];
  
  // Look for filmography tables (usually have "wikitable" class)
  const tableRegex = /<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  const tables = html.match(tableRegex) || [];
  
  for (const table of tables) {
    // Check if this is a filmography table (contains years and titles)
    if (!table.includes('Year') && !table.includes('Film') && !table.includes('Title')) {
      continue;
    }
    
    // Parse table rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = table.match(rowRegex) || [];
    
    for (const row of rows) {
      // Skip header rows
      if (row.includes('<th')) continue;
      
      // Extract cells
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let match;
      
      while ((match = cellRegex.exec(row)) !== null) {
        const cellContent = match[1]
          .replace(/<[^>]+>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace nbsp
          .trim();
        cells.push(cellContent);
      }
      
      if (cells.length < 2) continue;
      
      // Try to extract year and title
      // Common formats:
      // [Year, Title, Role, Notes]
      // [Year, Title, Language, Role]
      const yearMatch = cells[0].match(/\d{4}/);
      if (!yearMatch) continue;
      
      const year = parseInt(yearMatch[0]);
      const title = cells[1];
      
      if (!title || title.length < 2) continue;
      
      films.push({
        year,
        title,
        role: cells.length > 2 ? cells[2] : undefined,
        notes: cells.length > 3 ? cells[3] : undefined,
        language: cells.length > 2 && cells[2].match(/Telugu|Tamil|Hindi|Kannada|Malayalam/) ? cells[2] : undefined,
      });
    }
  }
  
  return films;
}
