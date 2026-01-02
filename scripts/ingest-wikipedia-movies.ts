#!/usr/bin/env npx tsx
/**
 * WIKIPEDIA TELUGU MOVIES INGESTION
 * 
 * Fetches Telugu movie data from Wikipedia lists:
 * https://en.wikipedia.org/wiki/Category:Lists_of_Telugu_films_by_year
 * 
 * Wikipedia has comprehensive lists from 1940 to present (87 years).
 * This script fetches movie titles, directors, cast from these lists.
 * 
 * Usage:
 *   pnpm run movies:ingest:wikipedia
 *   pnpm run movies:ingest:wikipedia --year=2024
 *   pnpm run movies:ingest:wikipedia --from=2020 --to=2025
 *   pnpm run movies:ingest:wikipedia --dry-run
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env if exists
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import {
  validateMovieCandidate,
  canonicalizeTitle,
  ValidationOptions,
  EntityStatus,
} from '../lib/movie-validation';

// ============================================================
// TYPES
// ============================================================

interface WikipediaMovie {
  title: string;
  title_te?: string;
  release_date?: string;
  release_year: number;
  director?: string;
  hero?: string;
  heroine?: string;
  music_director?: string;
  producer?: string;
  genres?: string[];
  wikipedia_url?: string;
}

interface IngestionResult {
  year: number;
  found: number;
  inserted: number;
  skipped: number;
  validated: number;
  rejected: number;
  errors: string[];
  rejectionsByStatus: Record<string, number>;
}

// ============================================================
// CONFIGURATION
// ============================================================

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

// Years with Telugu film lists on Wikipedia (1940-2026)
const AVAILABLE_YEARS = Array.from({ length: 87 }, (_, i) => 1940 + i);

// ============================================================
// SUPABASE CLIENT
// ============================================================

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(url, key);
}

// ============================================================
// WIKIPEDIA API FUNCTIONS
// ============================================================

/**
 * Fetch Wikipedia page content via API
 */
async function fetchWikipediaPage(title: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'revisions',
      rvprop: 'content',
      format: 'json',
      formatversion: '2',
    });
    
    const response = await fetch(`${WIKIPEDIA_API}?${params}`);
    const data = await response.json();
    
    const page = data.query?.pages?.[0];
    if (!page || page.missing) return null;
    
    return page.revisions?.[0]?.content || null;
  } catch (error) {
    console.error(`Error fetching Wikipedia page ${title}:`, error);
    return null;
  }
}

/**
 * Clean wikitext markup to plain text
 */
function cleanWikitext(text: string): string {
  return text
    // Remove style/rowspan/colspan attributes first
    .replace(/style="[^"]*"\s*\|/gi, '')
    .replace(/rowspan="?\d+"?\s*\|/gi, '')
    .replace(/colspan="?\d+"?\s*\|/gi, '')
    .replace(/align="[^"]*"\s*\|/gi, '')
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1') // [[Link|Text]] -> Text
    .replace(/\{\{[^}]+\}\}/g, '') // Remove templates
    .replace(/<ref[^>]*>.*?<\/ref>/gi, '') // Remove refs
    .replace(/<ref[^/>]*\/>/gi, '') // Remove self-closing refs
    .replace(/<[^>]+>/g, '') // Remove HTML
    .replace(/'''?/g, '') // Remove bold/italic
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse movie data from Wikipedia list page content
 * Wikipedia tables typically have columns: Title, Director, Cast, etc.
 */
function parseMovieList(content: string, year: number): WikipediaMovie[] {
  const movies: WikipediaMovie[] = [];
  
  // Split content into lines for easier parsing
  const lines = content.split('\n');
  
  let inTable = false;
  let currentRow: string[] = [];
  let headers: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Start of wikitable
    if (line.includes('wikitable') && line.startsWith('{|')) {
      inTable = true;
      headers = [];
      continue;
    }
    
    // End of table
    if (line === '|}') {
      inTable = false;
      continue;
    }
    
    if (!inTable) continue;
    
    // Header row
    if (line.startsWith('!')) {
      const headerText = line.replace(/^!+\s*/, '').split('!!').map(h => cleanWikitext(h));
      headers.push(...headerText);
      continue;
    }
    
    // Row separator - process previous row
    if (line.startsWith('|-')) {
      if (currentRow.length > 0 && headers.length > 0) {
        const movie = parseTableRow(currentRow, headers, year);
        if (movie) movies.push(movie);
      }
      currentRow = [];
      continue;
    }
    
    // Cell data
    if (line.startsWith('|') && !line.startsWith('|-') && !line.startsWith('|}')) {
      // Handle multiple cells on same line (||)
      const cells = line.substring(1).split('||').map(c => c.trim());
      currentRow.push(...cells);
    }
  }
  
  // Process last row
  if (currentRow.length > 0 && headers.length > 0) {
    const movie = parseTableRow(currentRow, headers, year);
    if (movie) movies.push(movie);
  }
  
  // If no wikitable found, try to find film entries in lists
  if (movies.length === 0) {
    const filmPattern = /\*\s*''\[\[([^\]|]+)(?:\|[^\]]+)?\]\]''/g;
    let match;
    while ((match = filmPattern.exec(content)) !== null) {
      const title = match[1].trim();
      if (title && title.length > 1) {
        movies.push({
          title,
          release_year: year,
          wikipedia_url: `https://en.wikipedia.org/wiki/List_of_Telugu_films_of_${year}`,
        });
      }
    }
  }
  
  return movies;
}

/**
 * Parse a single table row into a movie object
 */
function parseTableRow(cells: string[], headers: string[], year: number): WikipediaMovie | null {
  if (cells.length === 0) return null;
  
  // Find column indices based on headers
  const titleIdx = headers.findIndex(h => /^title$|^film$/i.test(h.trim()));
  const directorIdx = headers.findIndex(h => /director/i.test(h));
  const castIdx = headers.findIndex(h => /cast|starring|actor/i.test(h));
  const musicIdx = headers.findIndex(h => /music|composer/i.test(h));
  const producerIdx = headers.findIndex(h => /producer|production/i.test(h));
  
  // Get title cell - try title column first, otherwise look for first cell that looks like a movie title
  let titleCell: string | undefined;
  
  if (titleIdx >= 0 && cells[titleIdx]) {
    titleCell = cells[titleIdx];
  } else {
    // Find first cell that contains a wiki link and looks like a title
    for (let i = 0; i < Math.min(cells.length, 3); i++) {
      const cell = cells[i] || '';
      // Skip cells that look like rowspan, dates, or production companies
      if (cell.includes('rowspan') || cell.includes('colspan')) continue;
      if (/^(january|february|march|april|may|june|july|august|september|october|november|december|\d+)/i.test(cell)) continue;
      if (/films|productions|movies|cinemas|creations|entertainments?$/i.test(cleanWikitext(cell))) continue;
      
      // Look for cells with wiki links that could be titles
      if (cell.includes('[[') && !cell.includes('Films') && !cell.includes('Productions')) {
        titleCell = cell;
        break;
      }
    }
  }
  
  if (!titleCell) return null;
  
  const title = cleanWikitext(titleCell);
  
  // Skip invalid titles
  if (!title || title.length < 2) return null;
  if (/^\d+$/.test(title)) return null;
  if (/^(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(title)) return null;
  // Skip production companies
  if (/films?$|productions?$|movies?$|cinemas?$|creations?$|entertainments?$|pictures?$|studios?$|arts?$|makers?$|screens?$/i.test(title)) return null;
  if (/mythri|hombale|t-series|geetha|sri lakshmi|uv |zee |anil sunkara|people media|sithara|sree venkateswara|dil raju|matinee|global|suresh|banner|releasing/i.test(title)) return null;
  if (title.includes('rowspan') || title.includes('colspan')) return null;
  if (/^\s*TBA\s*$/i.test(title)) return null;
  if (/^\s*\|\s*$/.test(title)) return null;
  
  const movie: WikipediaMovie = {
    title,
    release_year: year,
    wikipedia_url: `https://en.wikipedia.org/wiki/List_of_Telugu_films_of_${year}`,
  };
  
  // Extract director (skip production companies)
  if (directorIdx >= 0 && cells[directorIdx]) {
    const director = cleanWikitext(cells[directorIdx]);
    if (director && !/films|productions|cinemas/i.test(director)) {
      movie.director = director || undefined;
    }
  }
  
  // Extract cast
  if (castIdx >= 0 && cells[castIdx]) {
    const castStr = cleanWikitext(cells[castIdx]);
    const castParts = castStr.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    if (castParts.length > 0) movie.hero = castParts[0];
    if (castParts.length > 1) movie.heroine = castParts[1];
  }
  
  // Extract music director
  if (musicIdx >= 0 && cells[musicIdx]) {
    const music = cleanWikitext(cells[musicIdx]);
    if (music && !/films|productions|cinemas/i.test(music)) {
      movie.music_director = music || undefined;
    }
  }
  
  return movie;
}

/**
 * Fetch movies for a specific year from Wikipedia
 */
async function fetchMoviesForYear(year: number): Promise<WikipediaMovie[]> {
  const pageTitle = `List_of_Telugu_films_of_${year}`;
  const content = await fetchWikipediaPage(pageTitle);
  
  if (!content) {
    console.log(chalk.yellow(`  No Wikipedia page found for ${year}`));
    return [];
  }
  
  return parseMovieList(content, year);
}

// ============================================================
// DATABASE OPERATIONS
// ============================================================

/**
 * Generate slug from title
 */
function generateSlug(title: string, year: number): string {
  return `${title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${year}`;
}

/**
 * Check if movie already exists
 */
async function movieExists(supabase: any, title: string, year: number): Promise<boolean> {
  const { data } = await supabase
    .from('movies')
    .select('id')
    .eq('title_en', title)
    .eq('release_year', year)
    .limit(1);
  
  return (data?.length || 0) > 0;
}

/**
 * Insert movie into database
 */
async function insertMovie(supabase: any, movie: WikipediaMovie): Promise<boolean> {
  const slug = generateSlug(movie.title, movie.release_year);
  
  // Build insert object with only non-null values
  const insertData: Record<string, any> = {
    title_en: movie.title,
    slug,
    release_year: movie.release_year,
    is_published: true,
  };
  
  if (movie.title_te) insertData.title_te = movie.title_te;
  if (movie.release_date) insertData.release_date = movie.release_date;
  if (movie.director) insertData.director = movie.director;
  if (movie.hero) insertData.hero = movie.hero;
  if (movie.heroine) insertData.heroine = movie.heroine;
  if (movie.music_director) insertData.music_director = movie.music_director;
  if (movie.genres && movie.genres.length > 0) insertData.genres = movie.genres;
  
  const { error } = await supabase
    .from('movies')
    .insert(insertData);
  
  if (error) {
    // Ignore duplicate key errors (slug conflict)
    if (error.code === '23505') return false;
    console.error(`  Error inserting ${movie.title}:`, error.message);
    throw error;
  }
  
  return true;
}

// ============================================================
// MAIN INGESTION
// ============================================================

interface IngestOptions {
  dryRun: boolean;
  validate: boolean;
  strict: boolean;
}

async function ingestYear(year: number, options: IngestOptions): Promise<IngestionResult> {
  const result: IngestionResult = {
    year,
    found: 0,
    inserted: 0,
    skipped: 0,
    validated: 0,
    rejected: 0,
    errors: [],
    rejectionsByStatus: {},
  };
  
  console.log(chalk.cyan(`\n📅 Processing ${year}...`));
  
  const movies = await fetchMoviesForYear(year);
  result.found = movies.length;
  
  if (movies.length === 0) {
    console.log(chalk.gray(`   No movies found for ${year}`));
    return result;
  }
  
  console.log(chalk.gray(`   Found ${movies.length} movies`));
  
  if (options.dryRun) {
    result.inserted = movies.length;
    for (const movie of movies.slice(0, 5)) {
      console.log(chalk.gray(`   - ${movie.title} (${movie.director || 'Unknown director'})`));
    }
    if (movies.length > 5) {
      console.log(chalk.gray(`   ... and ${movies.length - 5} more`));
    }
    return result;
  }
  
  const supabase = getSupabaseClient();
  
  // Validation options for strict mode
  const validationOpts: ValidationOptions = {
    strict: options.strict,
    minCastMembers: options.strict ? 3 : 0,
    requireBothImages: false,
  };
  
  for (const movie of movies) {
    try {
      const exists = await movieExists(supabase, movie.title, movie.release_year);
      if (exists) {
        result.skipped++;
        continue;
      }
      
      // Run validation if enabled
      if (options.validate) {
        const validation = await validateMovieCandidate({
          title_en: movie.title,
          release_year: movie.release_year,
          director: movie.director,
        }, validationOpts);
        
        if (!validation.isValid) {
          result.rejected++;
          result.rejectionsByStatus[validation.status] = 
            (result.rejectionsByStatus[validation.status] || 0) + 1;
          
          if (options.strict) {
            // In strict mode, skip invalid movies
            continue;
          }
          // In non-strict validate mode, log warning but continue
          console.log(chalk.yellow(`   ⚠ ${movie.title}: ${validation.status}`));
        } else {
          result.validated++;
          
          // Enrich with TMDB data if available
          if (validation.tmdbData) {
            const tmdb = validation.tmdbData;
            if (!movie.director && tmdb.credits?.crew) {
              const director = tmdb.credits.crew.find(c => c.job === 'Director');
              if (director) movie.director = director.name;
            }
          }
        }
        
        // Rate limit TMDB API calls
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const inserted = await insertMovie(supabase, movie);
      if (inserted) {
        result.inserted++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      result.errors.push(`${movie.title}: ${error}`);
    }
  }
  
  const statsLine = options.validate
    ? `   ✓ Inserted: ${result.inserted}, Validated: ${result.validated}, Rejected: ${result.rejected}, Skipped: ${result.skipped}`
    : `   ✓ Inserted: ${result.inserted}, Skipped: ${result.skipped}`;
  
  console.log(chalk.green(statsLine));
  
  return result;
}

// ============================================================
// CLI
// ============================================================

interface CLIArgs {
  year?: number;
  from?: number;
  to?: number;
  dryRun: boolean;
  strict: boolean;
  validate: boolean;
  help: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {
    dryRun: false,
    strict: false,
    validate: false,
    help: false,
  };
  
  for (const arg of args) {
    if (arg.startsWith('--year=')) {
      parsed.year = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--from=')) {
      parsed.from = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--to=')) {
      parsed.to = parseInt(arg.split('=')[1]);
    } else if (arg === '--dry-run' || arg === '-d') {
      parsed.dryRun = true;
    } else if (arg === '--strict') {
      parsed.strict = true;
      parsed.validate = true; // Strict implies validate
    } else if (arg === '--validate') {
      parsed.validate = true;
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
  }
  
  return parsed;
}

function showHelp(): void {
  console.log(`
${chalk.bold('Wikipedia Telugu Movies Ingestion')}

Fetches movie data from Wikipedia lists (1940-2026).
Source: https://en.wikipedia.org/wiki/Category:Lists_of_Telugu_films_by_year

${chalk.bold('Usage:')}
  pnpm run movies:ingest:wikipedia [options]

${chalk.bold('Options:')}
  --year=<n>    Ingest specific year only
  --from=<n>    Start year (default: 2020)
  --to=<n>      End year (default: current year)
  --dry-run     Show what would be ingested
  --validate    Validate against TMDB before inserting
  --strict      Strict mode: require TMDB match, director, 3+ cast, and image
  --help        Show this help

${chalk.bold('Examples:')}
  pnpm run movies:ingest:wikipedia --year=2024
  pnpm run movies:ingest:wikipedia --from=2015 --to=2025
  pnpm run movies:ingest:wikipedia --from=1950 --to=1960 --dry-run
  pnpm run movies:ingest:wikipedia --strict --year=2024
`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║         WIKIPEDIA TELUGU MOVIES INGESTION                     ║
╚══════════════════════════════════════════════════════════════╝
`));
  
  const modeLabels: string[] = [];
  if (args.dryRun) modeLabels.push(chalk.yellow('[DRY RUN]'));
  if (args.strict) modeLabels.push(chalk.magenta('[STRICT MODE]'));
  else if (args.validate) modeLabels.push(chalk.blue('[VALIDATE]'));
  
  const modeLabel = modeLabels.length > 0 ? modeLabels.join(' ') + ' ' : '';
  console.log(`${modeLabel}Source: Wikipedia Lists of Telugu Films by Year`);
  console.log(`Available years: 1940-2026 (87 years, ~${87 * 100} estimated movies)\n`);
  
  if (args.strict) {
    console.log(chalk.magenta('🔒 STRICT MODE: Only movies with TMDB match, director, 3+ cast, and image will be inserted.\n'));
  }
  
  // Determine years to process
  let years: number[];
  
  if (args.year) {
    years = [args.year];
  } else {
    const currentYear = new Date().getFullYear();
    const from = args.from || 2020;
    const to = args.to || currentYear;
    years = AVAILABLE_YEARS.filter(y => y >= from && y <= to);
  }
  
  console.log(chalk.gray(`Processing years: ${years[0]} to ${years[years.length - 1]} (${years.length} years)`));
  
  // Process each year
  const results: IngestionResult[] = [];
  const ingestOptions: IngestOptions = {
    dryRun: args.dryRun,
    validate: args.validate,
    strict: args.strict,
  };
  
  for (const year of years) {
    try {
      const result = await ingestYear(year, ingestOptions);
      results.push(result);
      
      // Rate limit Wikipedia API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(chalk.red(`Error processing ${year}:`), error);
      results.push({
        year,
        found: 0,
        inserted: 0,
        skipped: 0,
        validated: 0,
        rejected: 0,
        errors: [String(error)],
        rejectionsByStatus: {},
      });
    }
  }
  
  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.bold('📊 INGESTION SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));
  
  const totalFound = results.reduce((sum, r) => sum + r.found, 0);
  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const totalValidated = results.reduce((sum, r) => sum + r.validated, 0);
  const totalRejected = results.reduce((sum, r) => sum + r.rejected, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  
  // Aggregate rejection reasons
  const allRejections: Record<string, number> = {};
  for (const r of results) {
    for (const [status, count] of Object.entries(r.rejectionsByStatus)) {
      allRejections[status] = (allRejections[status] || 0) + count;
    }
  }
  
  console.log(`   Years processed: ${results.length}`);
  console.log(`   Movies found: ${totalFound}`);
  console.log(chalk.green(`   Movies inserted: ${totalInserted}`));
  if (args.validate) {
    console.log(chalk.blue(`   Movies validated: ${totalValidated}`));
    console.log(chalk.red(`   Movies rejected: ${totalRejected}`));
  }
  console.log(chalk.yellow(`   Movies skipped: ${totalSkipped}`));
  if (totalErrors > 0) {
    console.log(chalk.red(`   Errors: ${totalErrors}`));
  }
  
  // Show rejection breakdown in strict mode
  if (args.strict && Object.keys(allRejections).length > 0) {
    console.log(chalk.magenta('\n   Rejection Reasons:'));
    for (const [status, count] of Object.entries(allRejections).sort((a, b) => b[1] - a[1])) {
      console.log(chalk.gray(`     ${status}: ${count}`));
    }
  }
  
  console.log(chalk.gray(`\n   Source: https://en.wikipedia.org/wiki/Category:Lists_of_Telugu_films_by_year`));
  
  if (args.dryRun) {
    console.log(chalk.yellow('\n   This was a dry run. No data was saved.'));
  }
}

main().catch(console.error);

