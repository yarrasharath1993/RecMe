#!/usr/bin/env npx tsx
/**
 * GENERATE ACTOR AUDIT WORKSHEET
 * 
 * Creates a prioritized CSV of all actors for manual filmography audit.
 * Repurposes the successful Rajinikanth audit approach.
 * 
 * Generates:
 * 1. Actor list with DB movie counts
 * 2. Wikipedia URLs for manual lookup
 * 3. Priority scores based on popularity vs movie count
 * 4. Template for recording missing movies
 * 
 * Usage:
 *   npx tsx scripts/generate-actor-audit-sheet.ts                  # All actors
 *   npx tsx scripts/generate-actor-audit-sheet.ts --top=100        # Top 100 by priority
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ActorAuditInfo {
  id: string;
  name_en: string;
  name_te?: string;
  slug: string;
  occupation: string[];
  popularity_score: number;
  tmdb_id?: number;
  wikipedia_url?: string;
  moviesInDb: number;
  expectedMinMovies: number;
  priorityScore: number;
  wikipediaFilmographyUrl: string;
  tmdbUrl?: string;
}

async function getAllActors(topN?: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, slug, occupation, popularity_score, tmdb_id, wikipedia_url')
    .eq('is_published', true)
    .contains('occupation', ['actor'])
    .order('popularity_score', { ascending: false, nullsFirst: false });
  
  if (error) {
    console.error(chalk.red('Error fetching actors:'), error);
    return [];
  }
  
  if (topN) {
    return (data || []).slice(0, topN);
  }
  
  return data || [];
}

function extractSearchName(fullName: string): string {
  // Extract the key part of the name for matching
  // "Akkineni Nagarjuna" -> "Nagarjuna"
  // "N.T. Rama Rao Jr." -> "Rama Rao Jr"
  // "Pawan Kalyan" -> "Pawan Kalyan"
  
  const parts = fullName.split(' ');
  
  // If first part is single letter or initial (like "N.T."), skip it
  if (parts.length > 1 && (parts[0].length <= 3 || parts[0].includes('.'))) {
    return parts.slice(1).join(' ');
  }
  
  // If first part looks like a family name (all caps or ends with "i"), use last part
  if (parts.length > 1 && (parts[0] === parts[0].toUpperCase() || parts[0].endsWith('i'))) {
    return parts[parts.length - 1];
  }
  
  return fullName;
}

async function getActorMovieCount(actorName: string): Promise<number> {
  // Try both full name and extracted key name
  const searchName = extractSearchName(actorName);
  
  // Count movies where actor is hero (try both names)
  const { count: heroCount1 } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', `%${actorName}%`);
  
  const { count: heroCount2 } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', `%${searchName}%`);
  
  // Count movies where actor is heroine
  const { count: heroineCount1 } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('heroine', `%${actorName}%`);
  
  const { count: heroineCount2 } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('heroine', `%${searchName}%`);
  
  // Take the max count (full name or extracted name, whichever matches more)
  const heroMax = Math.max(heroCount1 || 0, heroCount2 || 0);
  const heroineMax = Math.max(heroineCount1 || 0, heroineCount2 || 0);
  
  return heroMax + heroineMax;
}

function calculateExpectedMovies(popularityScore: number): number {
  // Heuristic: actors with high popularity typically have many movies
  if (popularityScore >= 95) return 50;  // Legends (Chiranjeevi, NTR, Krishna)
  if (popularityScore >= 90) return 40;  // Major stars
  if (popularityScore >= 80) return 30;  // Popular actors
  if (popularityScore >= 70) return 20;  // Established actors
  if (popularityScore >= 60) return 15;  // Known actors
  if (popularityScore >= 50) return 10;  // Supporting actors
  return 5;
}

function calculatePriorityScore(popularity: number, dbCount: number, expected: number): number {
  // Higher priority = likely has missing movies
  const popularityWeight = popularity / 10;
  const missingMovies = Math.max(0, expected - dbCount);
  const ratio = expected > 0 ? (dbCount / expected) : 1;
  
  // Priority is higher when:
  // - High popularity
  // - Low DB count relative to expected
  // - Large absolute gap
  
  return Math.round(popularityWeight + (missingMovies * 2) + ((1 - ratio) * 20));
}

function generateWikipediaUrl(actorName: string, existingUrl?: string): string {
  if (existingUrl) return existingUrl;
  
  const formattedName = actorName.replace(/\s+/g, '_');
  return `https://en.wikipedia.org/wiki/${formattedName}`;
}

function generateFilmographyUrl(actorName: string): string {
  const formattedName = actorName.replace(/\s+/g, '_');
  return `https://en.wikipedia.org/wiki/${formattedName}_filmography`;
}

function generateTmdbUrl(tmdbId?: number): string {
  if (!tmdbId) return '';
  return `https://www.themoviedb.org/person/${tmdbId}`;
}

async function generateAuditSheet() {
  const args = process.argv.slice(2);
  const topArg = args.find(a => a.startsWith('--top='));
  const topN = topArg ? parseInt(topArg.split('=')[1]) : undefined;
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  GENERATING ACTOR FILMOGRAPHY AUDIT WORKSHEET'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  if (topN) {
    console.log(chalk.yellow(`Generating for top ${topN} actors by popularity\n`));
  } else {
    console.log(chalk.yellow('Generating for ALL actors\n'));
  }
  
  // Fetch all actors
  console.log(chalk.cyan('Fetching actors...'));
  const actors = await getAllActors(topN);
  console.log(chalk.green(`✓ Found ${actors.length} actors\n`));
  
  // Gather audit info for each actor
  console.log(chalk.cyan('Analyzing actors and counting movies...\n'));
  const auditInfo: ActorAuditInfo[] = [];
  
  for (let i = 0; i < actors.length; i++) {
    const actor = actors[i];
    const movieCount = await getActorMovieCount(actor.name_en);
    const expected = calculateExpectedMovies(actor.popularity_score || 0);
    const priority = calculatePriorityScore(
      actor.popularity_score || 0,
      movieCount,
      expected
    );
    
    auditInfo.push({
      id: actor.id,
      name_en: actor.name_en,
      name_te: actor.name_te,
      slug: actor.slug,
      occupation: actor.occupation,
      popularity_score: actor.popularity_score || 0,
      tmdb_id: actor.tmdb_id,
      wikipedia_url: actor.wikipedia_url,
      moviesInDb: movieCount,
      expectedMinMovies: expected,
      priorityScore: priority,
      wikipediaFilmographyUrl: generateFilmographyUrl(actor.name_en),
      tmdbUrl: generateTmdbUrl(actor.tmdb_id)
    });
    
    if ((i + 1) % 10 === 0) {
      console.log(chalk.gray(`  Processed ${i + 1}/${actors.length} actors...`));
    }
  }
  
  // Sort by priority score (highest first)
  auditInfo.sort((a, b) => b.priorityScore - a.priorityScore);
  
  console.log(chalk.green(`\n✓ Analysis complete\n`));
  
  // Generate main audit sheet CSV
  const mainHeaders = [
    'Priority',
    'Actor Name (EN)',
    'Actor Name (TE)',
    'Popularity',
    'Movies in DB',
    'Expected Min',
    'Gap',
    'Wikipedia URL',
    'Filmography Page',
    'TMDB URL',
    'Status',
    'Notes',
    'Actor ID'
  ];
  
  const mainRows: string[][] = [mainHeaders];
  
  auditInfo.forEach((actor, index) => {
    const gap = Math.max(0, actor.expectedMinMovies - actor.moviesInDb);
    mainRows.push([
      (index + 1).toString(),
      actor.name_en,
      actor.name_te || '',
      actor.popularity_score.toString(),
      actor.moviesInDb.toString(),
      actor.expectedMinMovies.toString(),
      gap.toString(),
      generateWikipediaUrl(actor.name_en, actor.wikipedia_url),
      actor.wikipediaFilmographyUrl,
      actor.tmdbUrl || '',
      gap > 0 ? 'NEEDS REVIEW' : 'OK',
      '',
      actor.id
    ]);
  });
  
  const mainCSV = mainRows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  // Generate missing movies template CSV
  const templateHeaders = [
    'Actor Name',
    'Actor ID',
    'Movie Title',
    'Year',
    'Director',
    'Language',
    'Role',
    'Source',
    'Confidence',
    'Notes'
  ];
  
  const templateRows: string[][] = [templateHeaders];
  
  // Add 5 empty rows for each high-priority actor
  auditInfo.slice(0, 50).forEach(actor => {
    for (let i = 0; i < 5; i++) {
      templateRows.push([
        actor.name_en,
        actor.id,
        '',  // Movie Title - to be filled
        '',  // Year - to be filled
        '',  // Director - to be filled
        'Telugu',  // Language - default
        'Actor',   // Role - default
        'Wikipedia',  // Source
        '80',  // Confidence - default
        ''  // Notes
      ]);
    }
  });
  
  const templateCSV = templateRows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  // Write files
  const timestamp = new Date().toISOString().split('T')[0];
  const mainFile = `ACTOR-AUDIT-WORKSHEET-${timestamp}.csv`;
  const templateFile = `MISSING-MOVIES-TEMPLATE-${timestamp}.csv`;
  
  fs.writeFileSync(mainFile, mainCSV);
  fs.writeFileSync(templateFile, templateCSV);
  
  // Summary statistics
  const needsReview = auditInfo.filter(a => a.moviesInDb < a.expectedMinMovies);
  const criticalGap = auditInfo.filter(a => (a.expectedMinMovies - a.moviesInDb) >= 20);
  const moderateGap = auditInfo.filter(a => {
    const gap = a.expectedMinMovies - a.moviesInDb;
    return gap >= 10 && gap < 20;
  });
  
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  AUDIT SUMMARY'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan(`Total Actors:                 ${auditInfo.length}`));
  console.log(chalk.yellow(`Need Review:                  ${needsReview.length}`));
  console.log(chalk.red(`  Critical Gap (20+):         ${criticalGap.length}`));
  console.log(chalk.yellow(`  Moderate Gap (10-19):       ${moderateGap.length}`));
  console.log(chalk.green(`  Minor/No Gap:               ${auditInfo.length - needsReview.length}\n`));
  
  console.log(chalk.cyan('Top 10 Priority Actors:\n'));
  auditInfo.slice(0, 10).forEach((actor, i) => {
    const gap = actor.expectedMinMovies - actor.moviesInDb;
    console.log(chalk.yellow(`${i + 1}. ${actor.name_en}`));
    console.log(chalk.gray(`   Popularity: ${actor.popularity_score} | In DB: ${actor.moviesInDb} | Expected: ${actor.expectedMinMovies} | Gap: ${gap}`));
    console.log(chalk.gray(`   ${actor.wikipediaFilmographyUrl}\n`));
  });
  
  console.log(chalk.green(`✓ Generated files:`));
  console.log(chalk.gray(`  1. ${mainFile} - Main audit worksheet`));
  console.log(chalk.gray(`  2. ${templateFile} - Template for recording missing movies\n`));
  
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  NEXT STEPS'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow('1. Open the audit worksheet CSV'));
  console.log(chalk.yellow('2. For each high-priority actor:'));
  console.log(chalk.gray('   - Visit their Wikipedia filmography page'));
  console.log(chalk.gray('   - Compare with movies in our DB'));
  console.log(chalk.gray('   - Record missing movies in the template CSV'));
  console.log(chalk.yellow('3. Review the completed template'));
  console.log(chalk.yellow('4. Import missing movies into the database\n'));
  
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
}

generateAuditSheet().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
