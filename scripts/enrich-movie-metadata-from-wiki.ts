/**
 * MOVIE METADATA ENRICHMENT FROM WIKIPEDIA
 * 
 * Reads attribution audit CSVs and enriches movie records with:
 * - Synopsis/Overview (from article text)
 * - Genres (from infobox)
 * - Release date (full date)
 * - Runtime (minutes)
 * - Box office data (JSONB)
 * - Trivia (production notes)
 * - Wikidata ID
 * - Certification/Age rating
 * 
 * Outputs to staging table for manual review before applying.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import 'dotenv/config';

// ============================================================
// TYPES
// ============================================================

interface WikiMovieMetadata {
  movieId: string;
  movieTitle: string;
  wikipediaUrl?: string;
  
  // Extracted data
  synopsis?: string;
  overview?: string;
  genres?: string[];
  releaseDate?: string;
  runtimeMinutes?: number;
  certification?: string;
  tagline?: string;
  
  // Box office (JSONB)
  boxOffice?: {
    budget?: string;
    opening?: string;
    lifetimeGross?: string;
    worldwideGross?: string;
    verdict?: string;
  };
  
  // Trivia (JSONB)
  trivia?: {
    productionNotes?: string[];
    shootingLocations?: string[];
    culturalImpact?: string;
    controversies?: string[];
  };
  
  // IDs
  wikidataId?: string;
  
  // Metadata
  confidenceScore: number;
  sourceUrl: string;
  extractedAt: string;
}

interface AuditRow {
  status: string;
  wikipediaTitle: string;
  wikipediaYear: string;
  dbMovieId: string;
  dbTitle: string;
  dbYear: string;
}

// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('Missing Supabase credentials'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// WIKIPEDIA API
// ============================================================

const WIKIPEDIA_API = {
  TELUGU: 'https://te.wikipedia.org/w/api.php',
  ENGLISH: 'https://en.wikipedia.org/w/api.php',
};

const USER_AGENT = 'TeluguPortalBot/1.0 (https://teluguportal.com) Node.js';

let requestCount = 0;
let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  requestCount++;
}

// ============================================================
// WIKIPEDIA FETCHING
// ============================================================

async function searchWikipediaPage(title: string, year: string, language: 'te' | 'en'): Promise<string | null> {
  await rateLimit();
  
  const api = language === 'te' ? WIKIPEDIA_API.TELUGU : WIKIPEDIA_API.ENGLISH;
  const searchQuery = `${title} ${year} film`;
  
  try {
    const searchUrl = `${api}?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    const data = await response.json();
    
    if (!data.query?.search || data.query.search.length === 0) {
      return null;
    }
    
    // Return the first result's title
    return data.query.search[0].title;
  } catch (error) {
    console.error(chalk.red(`Search error for ${title}: ${error}`));
    return null;
  }
}

async function fetchWikipediaPage(pageTitle: string, language: 'te' | 'en'): Promise<string | null> {
  await rateLimit();
  
  const api = language === 'te' ? WIKIPEDIA_API.TELUGU : WIKIPEDIA_API.ENGLISH;
  
  try {
    const pageUrl = `${api}?action=query&titles=${encodeURIComponent(pageTitle)}&prop=revisions|pageprops&rvprop=content&format=json&origin=*`;
    const response = await fetch(pageUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    const data = await response.json();
    
    if (!data.query?.pages) {
      return null;
    }
    
    const pages = Object.values(data.query.pages) as any[];
    if (pages.length === 0 || pages[0].missing) {
      return null;
    }
    
    const page = pages[0];
    const content = page.revisions?.[0]?.['*'] || '';
    const wikidataId = page.pageprops?.wikibase_item || null;
    
    return JSON.stringify({ content, wikidataId });
  } catch (error) {
    console.error(chalk.red(`Fetch error for ${pageTitle}: ${error}`));
    return null;
  }
}

// ============================================================
// PARSING FUNCTIONS
// ============================================================

function extractInfoboxField(content: string, fieldNames: string[]): string | null {
  for (const field of fieldNames) {
    // Pattern: |field = value
    const pattern = new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\|\\}]+)`, 'i');
    const match = content.match(pattern);
    
    if (match && match[1]) {
      let value = match[1].trim();
      
      // Clean up wikitext
      value = value
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')  // [[link|text]] -> text
        .replace(/\[\[([^\]]+)\]\]/g, '$1')              // [[link]] -> link
        .replace(/<ref[^>]*>.*?<\/ref>/g, '')           // Remove refs
        .replace(/{{[^}]+}}/g, '')                       // Remove templates
        .replace(/'''?([^']+)'''?/g, '$1')              // Remove bold/italic
        .trim();
      
      if (value && value.length > 0) {
        return value;
      }
    }
  }
  
  return null;
}

function extractGenres(content: string): string[] {
  const genres: string[] = [];
  
  // Telugu infobox
  const teluguGenre = extractInfoboxField(content, ['వర్గం', 'genre', 'genres']);
  
  if (teluguGenre) {
    // Split by common separators
    const genreList = teluguGenre.split(/[,\n•·]/).map(g => g.trim()).filter(g => g.length > 0);
    genres.push(...genreList);
  }
  
  return genres;
}

function extractReleaseDate(content: string): string | null {
  const dateStr = extractInfoboxField(content, ['విడుదల తేదీ', 'released', 'release date']);
  
  if (!dateStr) return null;
  
  // Try to parse various date formats
  const patterns = [
    /(\d{1,2})\s+(\w+)\s+(\d{4})/,  // 15 August 2023
    /(\d{4})-(\d{2})-(\d{2})/,      // 2023-08-15
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/ // August 15, 2023
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      return dateStr; // Return as-is for now, can be normalized later
    }
  }
  
  return null;
}

function extractRuntime(content: string): number | null {
  const runtimeStr = extractInfoboxField(content, ['నడక', 'runtime', 'running time']);
  
  if (!runtimeStr) return null;
  
  // Extract minutes from various formats
  const minutesMatch = runtimeStr.match(/(\d+)\s*(?:minutes|mins?|నిమిషాలు)/i);
  if (minutesMatch) {
    return parseInt(minutesMatch[1]);
  }
  
  // Extract from "2h 30m" or "2:30" format
  const hoursMatch = runtimeStr.match(/(\d+)\s*(?:hours?|hrs?|h)\s*(\d+)?\s*(?:minutes?|mins?|m)?/i);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    const minutes = hoursMatch[2] ? parseInt(hoursMatch[2]) : 0;
    return hours * 60 + minutes;
  }
  
  return null;
}

function extractBoxOffice(content: string): WikiMovieMetadata['boxOffice'] {
  const boxOffice: WikiMovieMetadata['boxOffice'] = {};
  
  boxOffice.budget = extractInfoboxField(content, ['బడ్జెట్', 'budget']) || undefined;
  boxOffice.lifetimeGross = extractInfoboxField(content, ['కలెక్షన్', 'box office', 'gross']) || undefined;
  
  // Try to extract opening and worldwide from article text
  const openingMatch = content.match(/opening[^.]*?(?:₹|Rs\.?|INR)\s*([\d.,]+\s*(?:crore|lakh|million)?)/i);
  if (openingMatch) {
    boxOffice.opening = openingMatch[1].trim();
  }
  
  const worldwideMatch = content.match(/worldwide[^.]*?(?:₹|Rs\.?|INR)\s*([\d.,]+\s*(?:crore|lakh|million)?)/i);
  if (worldwideMatch) {
    boxOffice.worldwideGross = worldwideMatch[1].trim();
  }
  
  // Extract verdict (Hit, Flop, Blockbuster, etc.)
  const verdictMatch = content.match(/(?:verdict|result|status)[^.]*?\b(blockbuster|superhit|hit|average|flop|disaster)\b/i);
  if (verdictMatch) {
    boxOffice.verdict = verdictMatch[1].trim();
  }
  
  return Object.keys(boxOffice).length > 0 ? boxOffice : undefined;
}

function extractCertification(content: string): string | null {
  const cert = extractInfoboxField(content, ['certification', 'rated', 'rating']);
  
  if (!cert) return null;
  
  // Normalize to Indian rating system
  const normalized = cert.toUpperCase();
  if (normalized.includes('U/A')) return 'U/A';
  if (normalized.includes('UA')) return 'U/A';
  if (normalized === 'U') return 'U';
  if (normalized === 'A') return 'A';
  if (normalized.includes('PG')) return 'U/A';
  
  return cert;
}

function extractSynopsis(content: string): string | null {
  // Extract the first few paragraphs after the infobox
  // Look for == Plot == or == Synopsis == section
  const plotMatch = content.match(/==\s*(?:Plot|Synopsis|Story)\s*==\s*\n([^=]+)/i);
  
  if (plotMatch) {
    let synopsis = plotMatch[1].trim();
    
    // Clean up wikitext
    synopsis = synopsis
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')  // [[link|text]] -> text
      .replace(/\[\[([^\]]+)\]\]/g, '$1')              // [[link]] -> link
      .replace(/<ref[^>]*>.*?<\/ref>/g, '')           // Remove refs
      .replace(/{{[^}]+}}/g, '')                       // Remove templates
      .replace(/'''([^']+)'''/g, '$1')                // Remove bold
      .replace(/''([^']+)''/g, '$1')                  // Remove italic
      .replace(/\n+/g, ' ')                            // Replace newlines with spaces
      .trim();
    
    // Limit to first 500 words
    const words = synopsis.split(/\s+/).slice(0, 500);
    return words.join(' ');
  }
  
  // Fallback: extract first paragraph
  const paragraphs = content.split(/\n\n+/);
  for (const para of paragraphs) {
    if (para.trim().length > 100 && !para.startsWith('|') && !para.startsWith('==')) {
      let text = para
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/<ref[^>]*>.*?<\/ref>/g, '')
        .replace(/{{[^}]+}}/g, '')
        .replace(/'''?([^']+)'''?/g, '$1')
        .trim();
      
      if (text.length > 50) {
        return text.slice(0, 1000);
      }
    }
  }
  
  return null;
}

function extractTrivia(content: string): WikiMovieMetadata['trivia'] {
  const trivia: WikiMovieMetadata['trivia'] = {};
  
  // Look for Production, Filming, or Trivia sections
  const productionMatch = content.match(/==\s*(?:Production|Filming|Development)\s*==\s*\n([^=]+)/i);
  if (productionMatch) {
    const notes = productionMatch[1]
      .split(/\*/)
      .map(note => note.trim())
      .filter(note => note.length > 20 && note.length < 500)
      .slice(0, 5);
    
    if (notes.length > 0) {
      trivia.productionNotes = notes.map(note => 
        note
          .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
          .replace(/\[\[([^\]]+)\]\]/g, '$1')
          .replace(/<ref[^>]*>.*?<\/ref>/g, '')
          .trim()
      );
    }
  }
  
  // Extract reception/impact
  const receptionMatch = content.match(/==\s*(?:Reception|Impact|Legacy)\s*==\s*\n([^=]+)/i);
  if (receptionMatch) {
    const impact = receptionMatch[1]
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/<ref[^>]*>.*?<\/ref>/g, '')
      .trim()
      .slice(0, 500);
    
    if (impact.length > 50) {
      trivia.culturalImpact = impact;
    }
  }
  
  return Object.keys(trivia).length > 0 ? trivia : undefined;
}

function extractTagline(content: string): string | null {
  const tagline = extractInfoboxField(content, ['tagline', 'caption']);
  return tagline && tagline.length > 3 && tagline.length < 200 ? tagline : null;
}

// ============================================================
// MOVIE ENRICHMENT
// ============================================================

async function enrichMovie(movieId: string, movieTitle: string, movieYear: string): Promise<WikiMovieMetadata | null> {
  console.log(chalk.gray(`  → Enriching: ${movieTitle} (${movieYear})`));
  
  // Try Telugu Wikipedia first
  let pageTitle = await searchWikipediaPage(movieTitle, movieYear, 'te');
  let language: 'te' | 'en' = 'te';
  
  // Fallback to English Wikipedia
  if (!pageTitle) {
    pageTitle = await searchWikipediaPage(movieTitle, movieYear, 'en');
    language = 'en';
  }
  
  if (!pageTitle) {
    console.log(chalk.yellow(`    ⚠️  No Wikipedia page found`));
    return null;
  }
  
  const pageData = await fetchWikipediaPage(pageTitle, language);
  if (!pageData) {
    console.log(chalk.yellow(`    ⚠️  Could not fetch page content`));
    return null;
  }
  
  const { content, wikidataId } = JSON.parse(pageData);
  
  // Extract all metadata
  const metadata: WikiMovieMetadata = {
    movieId,
    movieTitle,
    sourceUrl: language === 'te' 
      ? `https://te.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`
      : `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
    
    synopsis: extractSynopsis(content),
    genres: extractGenres(content),
    releaseDate: extractReleaseDate(content),
    runtimeMinutes: extractRuntime(content),
    certification: extractCertification(content),
    tagline: extractTagline(content),
    boxOffice: extractBoxOffice(content),
    trivia: extractTrivia(content),
    wikidataId: wikidataId || undefined,
    
    confidenceScore: 0.7, // Default confidence
    extractedAt: new Date().toISOString(),
  };
  
  // Calculate confidence score
  let confidence = 0;
  if (metadata.synopsis) confidence += 0.25;
  if (metadata.genres && metadata.genres.length > 0) confidence += 0.15;
  if (metadata.releaseDate) confidence += 0.10;
  if (metadata.runtimeMinutes) confidence += 0.10;
  if (metadata.boxOffice) confidence += 0.15;
  if (metadata.wikidataId) confidence += 0.10;
  if (metadata.trivia) confidence += 0.10;
  if (metadata.certification) confidence += 0.05;
  
  metadata.confidenceScore = Math.min(confidence, 1.0);
  
  // Log what was extracted
  const extracted = [];
  if (metadata.synopsis) extracted.push('synopsis');
  if (metadata.genres?.length) extracted.push(`${metadata.genres.length} genres`);
  if (metadata.releaseDate) extracted.push('release date');
  if (metadata.runtimeMinutes) extracted.push(`${metadata.runtimeMinutes}min runtime`);
  if (metadata.boxOffice) extracted.push('box office');
  if (metadata.wikidataId) extracted.push('wikidata ID');
  if (metadata.trivia) extracted.push('trivia');
  if (metadata.certification) extracted.push(`cert: ${metadata.certification}`);
  
  console.log(chalk.green(`    ✓ Extracted: ${extracted.join(', ')} (confidence: ${(metadata.confidenceScore * 100).toFixed(0)}%)`));
  
  return metadata;
}

// ============================================================
// CSV PROCESSING
// ============================================================

function parseCSV(csvContent: string): AuditRow[] {
  const lines = csvContent.split('\n').filter(l => l.trim());
  if (lines.length <= 1) return [];
  
  const rows: AuditRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Parse CSV (handle quoted fields)
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          currentField += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());
    
    if (fields.length >= 8) {
      rows.push({
        status: fields[0],
        wikipediaTitle: fields[1],
        wikipediaYear: fields[2],
        dbMovieId: fields[5],
        dbTitle: fields[6],
        dbYear: fields[7],
      });
    }
  }
  
  return rows;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  MOVIE METADATA ENRICHMENT FROM WIKIPEDIA'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  const auditDir = path.join(process.cwd(), 'attribution-audits');
  
  if (!fs.existsSync(auditDir)) {
    console.error(chalk.red('❌ Attribution audit directory not found!'));
    console.error(chalk.yellow('   Run automated-attribution-audit.ts first.'));
    process.exit(1);
  }
  
  const csvFiles = fs.readdirSync(auditDir).filter(f => f.endsWith('.csv'));
  
  if (csvFiles.length === 0) {
    console.error(chalk.red('❌ No audit CSV files found!'));
    process.exit(1);
  }
  
  console.log(chalk.yellow(`📁 Found ${csvFiles.length} audit files\n`));
  
  // Collect unique movies from all CSVs
  const uniqueMovies = new Map<string, { title: string; year: string }>();
  
  for (const csvFile of csvFiles) {
    const csvPath = path.join(auditDir, csvFile);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);
    
    for (const row of rows) {
      // Only process movies that exist in DB
      if (row.dbMovieId && row.dbTitle && (row.status.includes('ATTRIBUTED') || row.status.includes('EXISTS'))) {
        uniqueMovies.set(row.dbMovieId, {
          title: row.dbTitle,
          year: row.dbYear,
        });
      }
    }
  }
  
  console.log(chalk.green(`✓ Found ${uniqueMovies.size} unique movies to enrich\n`));
  
  // Enrich each movie
  const enrichedMovies: WikiMovieMetadata[] = [];
  let processed = 0;
  let successful = 0;
  
  for (const [movieId, movie] of uniqueMovies.entries()) {
    processed++;
    console.log(chalk.cyan(`\n[${processed}/${uniqueMovies.size}] ${movie.title} (${movie.year})`));
    
    const metadata = await enrichMovie(movieId, movie.title, movie.year);
    
    if (metadata) {
      enrichedMovies.push(metadata);
      successful++;
    }
    
    // Progress update every 10 movies
    if (processed % 10 === 0) {
      console.log(chalk.blue(`\n📊 Progress: ${processed}/${uniqueMovies.size} processed, ${successful} enriched (${((successful/processed)*100).toFixed(1)}%)`));
    }
  }
  
  // Save to JSON file for review
  const outputPath = path.join(process.cwd(), 'movie-wiki-enrichments.json');
  fs.writeFileSync(outputPath, JSON.stringify(enrichedMovies, null, 2));
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('  ✓ ENRICHMENT COMPLETE'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow('Summary:'));
  console.log(chalk.white(`  • Movies processed: ${processed}`));
  console.log(chalk.white(`  • Successfully enriched: ${successful} (${((successful/processed)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Wikipedia requests: ${requestCount}`));
  console.log(chalk.white(`  • Output file: ${outputPath}`));
  
  // Field coverage statistics
  const stats = {
    synopsis: enrichedMovies.filter(m => m.synopsis).length,
    genres: enrichedMovies.filter(m => m.genres?.length).length,
    releaseDate: enrichedMovies.filter(m => m.releaseDate).length,
    runtime: enrichedMovies.filter(m => m.runtimeMinutes).length,
    boxOffice: enrichedMovies.filter(m => m.boxOffice).length,
    trivia: enrichedMovies.filter(m => m.trivia).length,
    wikidataId: enrichedMovies.filter(m => m.wikidataId).length,
    certification: enrichedMovies.filter(m => m.certification).length,
  };
  
  console.log(chalk.yellow('\nField Coverage:'));
  console.log(chalk.white(`  • Synopsis: ${stats.synopsis}/${successful} (${((stats.synopsis/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Genres: ${stats.genres}/${successful} (${((stats.genres/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Release Date: ${stats.releaseDate}/${successful} (${((stats.releaseDate/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Runtime: ${stats.runtime}/${successful} (${((stats.runtime/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Box Office: ${stats.boxOffice}/${successful} (${((stats.boxOffice/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Trivia: ${stats.trivia}/${successful} (${((stats.trivia/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Wikidata ID: ${stats.wikidataId}/${successful} (${((stats.wikidataId/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Certification: ${stats.certification}/${successful} (${((stats.certification/successful)*100).toFixed(1)}%)`));
  
  console.log(chalk.yellow('\n📝 Next steps:'));
  console.log(chalk.white('  1. Review movie-wiki-enrichments.json'));
  console.log(chalk.white('  2. Run migration to create staging tables'));
  console.log(chalk.white('  3. Import enrichments to database for review'));
  console.log();
}

main().catch(console.error);
