#!/usr/bin/env npx tsx
/**
 * COMPREHENSIVE ALL-ACTORS FILMOGRAPHY AUDIT
 * 
 * Audits EVERY actor in the system by:
 * 1. Fetching their Wikipedia filmography
 * 2. Comparing with our database
 * 3. Finding missing movies
 * 4. Detecting incorrectly attributed movies
 * 5. Generating prioritized CSV for manual review
 * 
 * Repurposes existing mechanisms from Rajinikanth/Krishna/Nagarjuna audits
 * 
 * Usage:
 *   npx tsx scripts/audit-all-actors-filmography.ts                  # Full audit (all actors)
 *   npx tsx scripts/audit-all-actors-filmography.ts --top=50         # Top 50 actors by popularity
 *   npx tsx scripts/audit-all-actors-filmography.ts --limit=10       # First 10 actors (testing)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import chalk from 'chalk';
import * as https from 'https';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// TYPES
// ============================================================

interface Actor {
  id: string;
  name_en: string;
  name_te?: string;
  slug: string;
  occupation: string;
  popularity_score?: number;
  wikipedia_url?: string;
  tmdb_id?: number;
}

interface Movie {
  id: string;
  title_en: string;
  title_te?: string;
  release_year: number;
  director?: string;
  hero?: string;
  language?: string;
}

interface WikipediaMovie {
  title: string;
  year: number;
  director?: string;
  language?: string;
  role?: string;
}

interface MissingMovie {
  actorId: string;
  actorName: string;
  actorPopularity: number;
  title: string;
  year: number;
  director?: string;
  language?: string;
  role?: string;
  confidence: number;
  source: 'wikipedia' | 'tmdb';
}

interface WrongAttribution {
  actorId: string;
  actorName: string;
  movieId: string;
  movieTitle: string;
  issue: 'wrong_role' | 'wrong_director' | 'wrong_language';
  currentValue: string;
  expectedValue: string;
  confidence: number;
}

interface ActorAuditResult {
  actor: Actor;
  totalMoviesInDb: number;
  totalMoviesInWikipedia: number;
  missingMovies: MissingMovie[];
  wrongAttributions: WrongAttribution[];
  processingTime: number;
  error?: string;
}

// ============================================================
// WIKIPEDIA SCRAPING
// ============================================================

async function fetchWikipediaHTML(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseFilmographyFromHTML(html: string, actorName: string): WikipediaMovie[] {
  const movies: WikipediaMovie[] = [];
  
  // Look for filmography sections
  const filmographyPatterns = [
    /(?:<h2[^>]*>|<h3[^>]*>).*?(?:Filmography|Films|Career|Movies).*?(?:<\/h2>|<\/h3>)/gi,
    /(?:<span[^>]*>).*?(?:Filmography|Films|Career|Movies).*?(?:<\/span>)/gi
  ];
  
  let filmographyStart = -1;
  for (const pattern of filmographyPatterns) {
    const match = html.match(pattern);
    if (match && match.index) {
      filmographyStart = match.index;
      break;
    }
  }
  
  if (filmographyStart === -1) {
    return movies; // No filmography section found
  }
  
  // Extract content after filmography section (next ~10000 chars)
  const section = html.substring(filmographyStart, filmographyStart + 10000);
  
  // Parse table rows or list items
  const rowPattern = /<tr[^>]*>(.*?)<\/tr>/gis;
  const cellPattern = /<td[^>]*>(.*?)<\/td>/gis;
  const yearPattern = /\b(19\d{2}|20\d{2})\b/;
  
  let match;
  while ((match = rowPattern.exec(section)) !== null) {
    const row = match[1];
    const cells: string[] = [];
    
    let cellMatch;
    while ((cellMatch = cellPattern.exec(row)) !== null) {
      const cellContent = cellMatch[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellContent);
    }
    
    if (cells.length >= 2) {
      // Try to find year
      let year = 0;
      for (const cell of cells) {
        const yearMatch = cell.match(yearPattern);
        if (yearMatch) {
          year = parseInt(yearMatch[1]);
          break;
        }
      }
      
      if (year > 1900 && year < 2030) {
        // Likely a movie entry - extract title
        const title = cells.find(c => c.length > 3 && !yearPattern.test(c) && !c.match(/director|role|language/i));
        if (title) {
          movies.push({
            title: title.trim(),
            year,
            director: cells.find(c => c.toLowerCase().includes('direct') && c !== title),
            language: cells.find(c => /(telugu|tamil|hindi|malayalam|kannada)/i.test(c)),
            role: cells.find(c => /(hero|lead|actor|actress)/i.test(c))
          });
        }
      }
    }
  }
  
  return movies;
}

async function getWikipediaFilmography(actor: Actor): Promise<WikipediaMovie[]> {
  try {
    // Try multiple Wikipedia URL patterns
    const urls = [
      actor.wikipedia_url,
      `https://en.wikipedia.org/wiki/${actor.name_en.replace(/\s+/g, '_')}`,
      `https://en.wikipedia.org/wiki/${actor.slug}`,
      `https://en.wikipedia.org/wiki/${actor.name_en.replace(/\s+/g, '_')}_(actor)`
    ].filter(Boolean);
    
    for (const url of urls) {
      try {
        const html = await fetchWikipediaHTML(url!);
        const movies = parseFilmographyFromHTML(html, actor.name_en);
        if (movies.length > 0) {
          console.log(chalk.gray(`  Found ${movies.length} movies in Wikipedia filmography`));
          return movies;
        }
      } catch (error) {
        // Try next URL
        continue;
      }
    }
    
    return [];
  } catch (error) {
    console.log(chalk.red(`  Wikipedia fetch error: ${error}`));
    return [];
  }
}

// ============================================================
// DATABASE QUERIES
// ============================================================

async function getAllActors(limit?: number, top?: number): Promise<Actor[]> {
  let query = supabase
    .from('celebrities')
    .select('id, name_en, name_te, slug, occupation, popularity_score, wikipedia_url, tmdb_id')
    .eq('is_published', true)
    .contains('occupation', ['actor']);
  
  if (top) {
    query = query.order('popularity_score', { ascending: false, nullsFirst: false }).limit(top);
  } else if (limit) {
    query = query.limit(limit);
  } else {
    query = query.order('popularity_score', { ascending: false, nullsFirst: false });
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(chalk.red('Error fetching actors:'), error);
    return [];
  }
  
  return (data || []) as Actor[];
}

async function getActorMovies(actorId: string, actorName: string): Promise<Movie[]> {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, director, hero, language')
    .or(`hero.ilike.%${actorName}%,heroine.ilike.%${actorName}%`)
    .eq('is_published', true);
  
  if (error) {
    console.error(chalk.red(`Error fetching movies for ${actorName}:`), error);
    return [];
  }
  
  return (data || []) as Movie[];
}

// ============================================================
// COMPARISON LOGIC
// ============================================================

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titlesMatch(title1: string, title2: string, year1: number, year2: number): boolean {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // Close year and similar title
  if (Math.abs(year1 - year2) <= 1) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    if (norm1.replace(/\s/g, '') === norm2.replace(/\s/g, '')) return true;
  }
  
  return false;
}

function findMissingMovies(
  actor: Actor,
  dbMovies: Movie[],
  wikiMovies: WikipediaMovie[]
): MissingMovie[] {
  const missing: MissingMovie[] = [];
  
  for (const wikiMovie of wikiMovies) {
    // Check if movie exists in database
    const exists = dbMovies.some(dbMovie => 
      titlesMatch(dbMovie.title_en, wikiMovie.title, dbMovie.release_year, wikiMovie.year)
    );
    
    if (!exists) {
      // Calculate confidence based on data quality
      let confidence = 70;
      if (wikiMovie.director) confidence += 10;
      if (wikiMovie.language) confidence += 10;
      if (wikiMovie.year >= 1950 && wikiMovie.year <= new Date().getFullYear()) confidence += 10;
      
      missing.push({
        actorId: actor.id,
        actorName: actor.name_en,
        actorPopularity: actor.popularity_score || 0,
        title: wikiMovie.title,
        year: wikiMovie.year,
        director: wikiMovie.director,
        language: wikiMovie.language,
        role: wikiMovie.role || 'Actor',
        confidence: Math.min(confidence, 95),
        source: 'wikipedia'
      });
    }
  }
  
  return missing;
}

function findWrongAttributions(
  actor: Actor,
  dbMovies: Movie[],
  wikiMovies: WikipediaMovie[]
): WrongAttribution[] {
  const issues: WrongAttribution[] = [];
  
  for (const dbMovie of dbMovies) {
    const wikiMatch = wikiMovies.find(wm => 
      titlesMatch(dbMovie.title_en, wm.title, dbMovie.release_year, wm.year)
    );
    
    if (wikiMatch) {
      // Check director mismatch
      if (wikiMatch.director && dbMovie.director) {
        const dbDirector = normalizeTitle(dbMovie.director);
        const wikiDirector = normalizeTitle(wikiMatch.director);
        
        if (dbDirector !== wikiDirector && !dbDirector.includes(wikiDirector) && !wikiDirector.includes(dbDirector)) {
          issues.push({
            actorId: actor.id,
            actorName: actor.name_en,
            movieId: dbMovie.id,
            movieTitle: dbMovie.title_en,
            issue: 'wrong_director',
            currentValue: dbMovie.director,
            expectedValue: wikiMatch.director,
            confidence: 80
          });
        }
      }
      
      // Check language mismatch
      if (wikiMatch.language && dbMovie.language) {
        const dbLang = normalizeTitle(dbMovie.language);
        const wikiLang = normalizeTitle(wikiMatch.language);
        
        if (dbLang !== wikiLang) {
          issues.push({
            actorId: actor.id,
            actorName: actor.name_en,
            movieId: dbMovie.id,
            movieTitle: dbMovie.title_en,
            issue: 'wrong_language',
            currentValue: dbMovie.language,
            expectedValue: wikiMatch.language,
            confidence: 85
          });
        }
      }
    }
  }
  
  return issues;
}

// ============================================================
// AUDIT ACTOR
// ============================================================

async function auditActor(actor: Actor): Promise<ActorAuditResult> {
  const startTime = Date.now();
  
  console.log(chalk.cyan(`\n[${actor.popularity_score || 0}] Auditing ${actor.name_en}...`));
  
  try {
    // Get movies from database
    const dbMovies = await getActorMovies(actor.id, actor.name_en);
    console.log(chalk.gray(`  Database: ${dbMovies.length} movies`));
    
    // Get movies from Wikipedia
    const wikiMovies = await getWikipediaFilmography(actor);
    console.log(chalk.gray(`  Wikipedia: ${wikiMovies.length} movies`));
    
    // Find discrepancies
    const missingMovies = findMissingMovies(actor, dbMovies, wikiMovies);
    const wrongAttributions = findWrongAttributions(actor, dbMovies, wikiMovies);
    
    if (missingMovies.length > 0) {
      console.log(chalk.yellow(`  ⚠️  ${missingMovies.length} missing movies found`));
    }
    if (wrongAttributions.length > 0) {
      console.log(chalk.yellow(`  ⚠️  ${wrongAttributions.length} attribution issues found`));
    }
    if (missingMovies.length === 0 && wrongAttributions.length === 0) {
      console.log(chalk.green(`  ✅ No issues found`));
    }
    
    return {
      actor,
      totalMoviesInDb: dbMovies.length,
      totalMoviesInWikipedia: wikiMovies.length,
      missingMovies,
      wrongAttributions,
      processingTime: Date.now() - startTime
    };
    
  } catch (error: any) {
    console.log(chalk.red(`  ❌ Error: ${error.message}`));
    return {
      actor,
      totalMoviesInDb: 0,
      totalMoviesInWikipedia: 0,
      missingMovies: [],
      wrongAttributions: [],
      processingTime: Date.now() - startTime,
      error: error.message
    };
  }
}

// ============================================================
// CSV GENERATION
// ============================================================

function generateMissingMoviesCSV(results: ActorAuditResult[]): string {
  const headers = [
    'Actor Name',
    'Actor Popularity',
    'Movie Title',
    'Year',
    'Director',
    'Language',
    'Role',
    'Confidence',
    'Source',
    'Actor ID'
  ];
  
  const rows: string[][] = [headers];
  
  for (const result of results) {
    for (const missing of result.missingMovies) {
      rows.push([
        missing.actorName,
        missing.actorPopularity.toString(),
        missing.title,
        missing.year.toString(),
        missing.director || '',
        missing.language || '',
        missing.role || '',
        missing.confidence.toString(),
        missing.source,
        missing.actorId
      ]);
    }
  }
  
  return rows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function generateAttributionIssuesCSV(results: ActorAuditResult[]): string {
  const headers = [
    'Actor Name',
    'Movie Title',
    'Issue Type',
    'Current Value',
    'Expected Value',
    'Confidence',
    'Movie ID',
    'Actor ID'
  ];
  
  const rows: string[][] = [headers];
  
  for (const result of results) {
    for (const issue of result.wrongAttributions) {
      rows.push([
        issue.actorName,
        issue.movieTitle,
        issue.issue,
        issue.currentValue,
        issue.expectedValue,
        issue.confidence.toString(),
        issue.movieId,
        issue.actorId
      ]);
    }
  }
  
  return rows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function generateSummaryCSV(results: ActorAuditResult[]): string {
  const headers = [
    'Actor Name',
    'Popularity',
    'Movies in DB',
    'Movies in Wikipedia',
    'Missing Movies',
    'Attribution Issues',
    'Processing Time (ms)',
    'Status'
  ];
  
  const rows: string[][] = [headers];
  
  for (const result of results) {
    rows.push([
      result.actor.name_en,
      (result.actor.popularity_score || 0).toString(),
      result.totalMoviesInDb.toString(),
      result.totalMoviesInWikipedia.toString(),
      result.missingMovies.length.toString(),
      result.wrongAttributions.length.toString(),
      result.processingTime.toString(),
      result.error ? 'Error' : 'Success'
    ]);
  }
  
  return rows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const topArg = args.find(a => a.startsWith('--top='));
  
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
  const top = topArg ? parseInt(topArg.split('=')[1]) : undefined;
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  ALL-ACTORS FILMOGRAPHY AUDIT'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  if (top) {
    console.log(chalk.yellow(`Auditing top ${top} actors by popularity\n`));
  } else if (limit) {
    console.log(chalk.yellow(`Auditing first ${limit} actors (testing mode)\n`));
  } else {
    console.log(chalk.yellow('Auditing ALL actors in the system\n'));
  }
  
  // Get all actors
  console.log(chalk.cyan('Fetching actors from database...'));
  const actors = await getAllActors(limit, top);
  console.log(chalk.green(`✓ Found ${actors.length} actors\n`));
  
  if (actors.length === 0) {
    console.log(chalk.red('No actors found. Exiting.'));
    return;
  }
  
  // Audit each actor
  const results: ActorAuditResult[] = [];
  
  for (let i = 0; i < actors.length; i++) {
    const actor = actors[i];
    console.log(chalk.gray(`\nProgress: ${i + 1}/${actors.length}`));
    
    const result = await auditActor(actor);
    results.push(result);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate CSVs
  console.log(chalk.cyan('\n\nGenerating CSV reports...'));
  
  const missingMoviesCSV = generateMissingMoviesCSV(results);
  const attributionIssuesCSV = generateAttributionIssuesCSV(results);
  const summaryCSV = generateSummaryCSV(results);
  
  const timestamp = new Date().toISOString().split('T')[0];
  
  fs.writeFileSync(`ALL-ACTORS-MISSING-MOVIES-${timestamp}.csv`, missingMoviesCSV);
  fs.writeFileSync(`ALL-ACTORS-ATTRIBUTION-ISSUES-${timestamp}.csv`, attributionIssuesCSV);
  fs.writeFileSync(`ALL-ACTORS-AUDIT-SUMMARY-${timestamp}.csv`, summaryCSV);
  
  // Summary statistics
  const totalMissingMovies = results.reduce((sum, r) => sum + r.missingMovies.length, 0);
  const totalAttributionIssues = results.reduce((sum, r) => sum + r.wrongAttributions.length, 0);
  const actorsWithIssues = results.filter(r => r.missingMovies.length > 0 || r.wrongAttributions.length > 0).length;
  const actorsWithErrors = results.filter(r => r.error).length;
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  AUDIT SUMMARY'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan(`Total Actors Audited:        ${results.length}`));
  console.log(chalk.cyan(`Actors with Issues:          ${actorsWithIssues}`));
  console.log(chalk.cyan(`Actors with Errors:          ${actorsWithErrors}`));
  console.log(chalk.yellow(`\nTotal Missing Movies:        ${totalMissingMovies}`));
  console.log(chalk.yellow(`Total Attribution Issues:    ${totalAttributionIssues}`));
  
  console.log(chalk.green(`\n✓ Generated reports:`));
  console.log(chalk.gray(`  - ALL-ACTORS-MISSING-MOVIES-${timestamp}.csv`));
  console.log(chalk.gray(`  - ALL-ACTORS-ATTRIBUTION-ISSUES-${timestamp}.csv`));
  console.log(chalk.gray(`  - ALL-ACTORS-AUDIT-SUMMARY-${timestamp}.csv`));
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════\n'));
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
