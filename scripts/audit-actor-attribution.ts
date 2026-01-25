#!/usr/bin/env npx tsx
/**
 * ACTOR ATTRIBUTION AUDIT
 * 
 * For each actor, this script:
 * 1. Takes their filmography (from manual Wikipedia review)
 * 2. Searches if movies exist in DB (by title + year fuzzy match)
 * 3. Checks if actor is properly attributed in cast/crew fields
 * 4. Generates per-actor CSV with:
 *    - Movies in DB & properly attributed (✓)
 *    - Movies in DB but NOT attributed (⚠️ NEEDS FIX)
 *    - Movies completely missing (❌)
 * 
 * Usage:
 *   npx tsx scripts/audit-actor-attribution.ts --actor-id=<uuid>
 *   npx tsx scripts/audit-actor-attribution.ts --all
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Actor {
  id: string;
  name_en: string;
  name_te?: string;
  slug: string;
}

interface WikiMovie {
  title: string;
  year: number;
  role?: string;
  director?: string;
  language?: string;
}

interface AuditResult {
  wikiMovie: WikiMovie;
  status: 'attributed' | 'exists_not_attributed' | 'missing';
  dbMovieId?: string;
  dbMovieTitle?: string;
  dbMovieYear?: number;
  currentAttribution?: string;
  matchConfidence?: number;
}

// Normalize title for fuzzy matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity score (0-100)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);
  
  if (s1 === s2) return 100;
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return Math.round(((maxLength - distance) / maxLength) * 100);
}

// Check if actor is attributed in movie
function isActorAttributed(movie: any, actorName: string): boolean {
  const searchName = actorName.toLowerCase();
  
  // Check hero field
  if (movie.hero && movie.hero.toLowerCase().includes(searchName)) {
    return true;
  }
  
  // Check heroine field
  if (movie.heroine && movie.heroine.toLowerCase().includes(searchName)) {
    return true;
  }
  
  // Check cast_members field
  if (movie.cast_members && movie.cast_members.toLowerCase().includes(searchName)) {
    return true;
  }
  
  // Check supporting_cast field
  if (movie.supporting_cast && movie.supporting_cast.toLowerCase().includes(searchName)) {
    return true;
  }
  
  return false;
}

// Get current attribution from movie
function getCurrentAttribution(movie: any, actorName: string): string {
  const searchName = actorName.toLowerCase();
  
  if (movie.hero && movie.hero.toLowerCase().includes(searchName)) {
    return `Hero: ${movie.hero}`;
  }
  if (movie.heroine && movie.heroine.toLowerCase().includes(searchName)) {
    return `Heroine: ${movie.heroine}`;
  }
  if (movie.cast_members && movie.cast_members.toLowerCase().includes(searchName)) {
    return `Cast: ${movie.cast_members}`;
  }
  if (movie.supporting_cast && movie.supporting_cast.toLowerCase().includes(searchName)) {
    return `Supporting: ${movie.supporting_cast}`;
  }
  
  return 'Not attributed';
}

// Search for movie in DB
async function findMovieInDb(
  title: string,
  year: number,
  actorName: string
): Promise<AuditResult['status'] & { movie?: any; confidence?: number }> {
  
  // Try exact year match first
  const { data: exactMatches } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, hero, heroine, cast_members, supporting_cast')
    .eq('release_year', year);
  
  if (exactMatches && exactMatches.length > 0) {
    // Find best title match
    let bestMatch: any = null;
    let bestScore = 0;
    
    for (const movie of exactMatches) {
      const scoreEn = calculateSimilarity(title, movie.title_en || '');
      const scoreTe = movie.title_te ? calculateSimilarity(title, movie.title_te) : 0;
      const score = Math.max(scoreEn, scoreTe);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = movie;
      }
    }
    
    // If good match (>80% similarity)
    if (bestMatch && bestScore >= 80) {
      const isAttributed = isActorAttributed(bestMatch, actorName);
      
      return {
        status: isAttributed ? 'attributed' : 'exists_not_attributed',
        movie: bestMatch,
        confidence: bestScore
      } as any;
    }
  }
  
  // Try +/- 1 year
  const { data: nearMatches } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, hero, heroine, cast_members, supporting_cast')
    .gte('release_year', year - 1)
    .lte('release_year', year + 1);
  
  if (nearMatches && nearMatches.length > 0) {
    let bestMatch: any = null;
    let bestScore = 0;
    
    for (const movie of nearMatches) {
      const scoreEn = calculateSimilarity(title, movie.title_en || '');
      const scoreTe = movie.title_te ? calculateSimilarity(title, movie.title_te) : 0;
      const score = Math.max(scoreEn, scoreTe);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = movie;
      }
    }
    
    // If decent match (>75% similarity)
    if (bestMatch && bestScore >= 75) {
      const isAttributed = isActorAttributed(bestMatch, actorName);
      
      return {
        status: isAttributed ? 'attributed' : 'exists_not_attributed',
        movie: bestMatch,
        confidence: bestScore
      } as any;
    }
  }
  
  // Not found
  return { status: 'missing' } as any;
}

// Audit single actor
async function auditActor(actor: Actor, wikiMovies: WikiMovie[]): Promise<AuditResult[]> {
  console.log(chalk.cyan(`\nAuditing ${actor.name_en}...`));
  console.log(chalk.gray(`  Wikipedia movies: ${wikiMovies.length}`));
  
  const results: AuditResult[] = [];
  
  for (const wikiMovie of wikiMovies) {
    const searchResult = await findMovieInDb(
      wikiMovie.title,
      wikiMovie.year,
      actor.name_en
    );
    
    const result: AuditResult = {
      wikiMovie,
      status: searchResult.status,
      dbMovieId: searchResult.movie?.id,
      dbMovieTitle: searchResult.movie?.title_en,
      dbMovieYear: searchResult.movie?.release_year,
      currentAttribution: searchResult.movie 
        ? getCurrentAttribution(searchResult.movie, actor.name_en)
        : undefined,
      matchConfidence: searchResult.confidence
    };
    
    results.push(result);
  }
  
  return results;
}

// Generate CSV report for actor
function generateActorReport(actor: Actor, results: AuditResult[]): string {
  const attributed = results.filter(r => r.status === 'attributed');
  const needsAttribution = results.filter(r => r.status === 'exists_not_attributed');
  const missing = results.filter(r => r.status === 'missing');
  
  console.log(chalk.green(`  ✓ Attributed: ${attributed.length}`));
  console.log(chalk.yellow(`  ⚠️  Needs attribution: ${needsAttribution.length}`));
  console.log(chalk.red(`  ❌ Missing: ${missing.length}`));
  
  const headers = [
    'Status',
    'Wikipedia Title',
    'Wikipedia Year',
    'DB Movie ID',
    'DB Title',
    'DB Year',
    'Current Attribution',
    'Match Confidence',
    'Action Required'
  ];
  
  const rows: string[][] = [headers];
  
  // Add needs attribution first (highest priority)
  needsAttribution.forEach(r => {
    rows.push([
      '⚠️ NEEDS ATTRIBUTION',
      r.wikiMovie.title,
      r.wikiMovie.year.toString(),
      r.dbMovieId || '',
      r.dbMovieTitle || '',
      r.dbMovieYear?.toString() || '',
      r.currentAttribution || 'Not attributed',
      r.matchConfidence?.toString() || '',
      `Add ${actor.name_en} to cast`
    ]);
  });
  
  // Add missing movies
  missing.forEach(r => {
    rows.push([
      '❌ MISSING',
      r.wikiMovie.title,
      r.wikiMovie.year.toString(),
      '',
      '',
      '',
      '',
      '',
      'Create movie entry'
    ]);
  });
  
  // Add attributed (for reference)
  attributed.forEach(r => {
    rows.push([
      '✓ OK',
      r.wikiMovie.title,
      r.wikiMovie.year.toString(),
      r.dbMovieId || '',
      r.dbMovieTitle || '',
      r.dbMovieYear?.toString() || '',
      r.currentAttribution || '',
      r.matchConfidence?.toString() || '',
      'None'
    ]);
  });
  
  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
}

// Load actor filmography from manual CSV (to be created)
function loadActorFilmography(actorSlug: string): WikiMovie[] {
  const filePath = path.join(process.cwd(), 'filmographies', `${actorSlug}.csv`);
  
  if (!fs.existsSync(filePath)) {
    console.log(chalk.yellow(`  No filmography file found: ${filePath}`));
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  const movies: WikiMovie[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
    if (parts.length < 2) continue;
    
    const movie: WikiMovie = {
      title: parts[0],
      year: parseInt(parts[1]) || 0,
      role: parts[2] || undefined,
      director: parts[3] || undefined,
      language: parts[4] || undefined
    };
    
    if (movie.year > 0) {
      movies.push(movie);
    }
  }
  
  return movies;
}

async function main() {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  ACTOR ATTRIBUTION AUDIT'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Load actor list from audit worksheet
  const worksheetPath = 'ACTOR-AUDIT-WORKSHEET-2026-01-18.csv';
  const worksheet = fs.readFileSync(worksheetPath, 'utf-8');
  const lines = worksheet.split('\n').slice(1); // Skip header
  
  const actors: Actor[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split('","');
    if (parts.length < 13) continue;
    
    actors.push({
      id: parts[12].replace(/"/g, ''),
      name_en: parts[1],
      name_te: parts[2],
      slug: parts[1].toLowerCase().replace(/\s+/g, '-')
    });
  }
  
  console.log(chalk.cyan(`Found ${actors.length} actors to audit\n`));
  
  // Check if filmographies directory exists
  const filmDir = path.join(process.cwd(), 'filmographies');
  if (!fs.existsSync(filmDir)) {
    fs.mkdirSync(filmDir);
    console.log(chalk.yellow(`Created filmographies/ directory`));
    console.log(chalk.yellow(`Place actor filmography CSVs in this directory\n`));
  }
  
  // Process each actor
  const outputDir = path.join(process.cwd(), 'attribution-audits');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  let totalNeedsAttribution = 0;
  let totalMissing = 0;
  let totalAttributed = 0;
  let actorsProcessed = 0;
  
  for (const actor of actors) {
    const wikiMovies = loadActorFilmography(actor.slug);
    
    if (wikiMovies.length === 0) {
      console.log(chalk.gray(`Skipping ${actor.name_en} (no filmography file)`));
      continue;
    }
    
    actorsProcessed++;
    
    const results = await auditActor(actor, wikiMovies);
    
    const attributed = results.filter(r => r.status === 'attributed').length;
    const needsAttribution = results.filter(r => r.status === 'exists_not_attributed').length;
    const missing = results.filter(r => r.status === 'missing').length;
    
    totalAttributed += attributed;
    totalNeedsAttribution += needsAttribution;
    totalMissing += missing;
    
    // Generate report
    const csv = generateActorReport(actor, results);
    const outputFile = path.join(outputDir, `${actor.slug}-attribution-audit.csv`);
    fs.writeFileSync(outputFile, csv);
    
    console.log(chalk.green(`  Saved: ${outputFile}\n`));
    
    // Small delay to avoid overwhelming DB
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  AUDIT SUMMARY'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan(`Actors Processed:           ${actorsProcessed}`));
  console.log(chalk.green(`✓ Properly Attributed:      ${totalAttributed}`));
  console.log(chalk.yellow(`⚠️  Needs Attribution:       ${totalNeedsAttribution}`));
  console.log(chalk.red(`❌ Missing from DB:         ${totalMissing}`));
  
  console.log(chalk.gray(`\nReports saved in: ${outputDir}/\n`));
  
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
