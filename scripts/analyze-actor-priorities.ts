#!/usr/bin/env npx tsx
/**
 * Actor Priority Analyzer
 * 
 * Analyzes all actors and generates a prioritized list based on:
 * - Movie count (impact)
 * - Data completeness
 * - Missing critical fields
 * - Duplicate/attribution issues
 * 
 * Helps decide which actors to process first in batch validation.
 * 
 * Usage:
 *   npx tsx scripts/analyze-actor-priorities.ts
 *   npx tsx scripts/analyze-actor-priorities.ts --min-movies=10
 *   npx tsx scripts/analyze-actor-priorities.ts --top=20
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};

const MIN_MOVIES = parseInt(getArg('min-movies', '5'), 10);
const TOP_N = parseInt(getArg('top', '50'), 10);
const LANGUAGE = getArg('language', 'Telugu');
const OUTPUT_FILE = getArg('output', 'docs/actor-priority-analysis.csv');

interface ActorAnalysis {
  name: string;
  movieCount: number;
  heroCount: number;
  heroineCount: number;
  missingDirectors: number;
  missingPosters: number;
  missingSynopsis: number;
  missingTMDBIds: number;
  missingCrew: number;
  dataCompleteness: number; // 0-100
  priorityScore: number; // Weighted score
  recommendedAction: string;
}

async function analyzeActor(actorName: string): Promise<ActorAnalysis | null> {
  // Fetch all movies for this actor
  const { data: heroMovies } = await supabase
    .from('movies')
    .select('id, title_en, director, poster_url, synopsis, tmdb_id, cinematographer, editor, writer, producer, music_director')
    .eq('language', LANGUAGE)
    .ilike('hero', `%${actorName}%`);
  
  const { data: heroineMovies } = await supabase
    .from('movies')
    .select('id, title_en, director, poster_url, synopsis, tmdb_id, cinematographer, editor, writer, producer, music_director')
    .eq('language', LANGUAGE)
    .ilike('heroine', `%${actorName}%`);
  
  const heroCount = heroMovies?.length || 0;
  const heroineCount = heroineMovies?.length || 0;
  const allMovies = [...(heroMovies || []), ...(heroineMovies || [])];
  
  // Remove duplicates (actor in both hero and heroine)
  const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());
  
  if (uniqueMovies.length < MIN_MOVIES) {
    return null;
  }
  
  // Calculate missing data
  const missingDirectors = uniqueMovies.filter(m => !m.director || m.director === 'Unknown').length;
  const missingPosters = uniqueMovies.filter(m => !m.poster_url || m.poster_url.includes('placeholder')).length;
  const missingSynopsis = uniqueMovies.filter(m => !m.synopsis).length;
  const missingTMDBIds = uniqueMovies.filter(m => !m.tmdb_id).length;
  const missingCrew = uniqueMovies.filter(m => 
    !m.cinematographer && !m.editor && !m.writer && !m.producer && !m.music_director
  ).length;
  
  // Calculate data completeness (0-100)
  const totalFields = uniqueMovies.length * 5; // 5 critical fields per movie
  const filledFields = 
    (uniqueMovies.length - missingDirectors) +
    (uniqueMovies.length - missingPosters) +
    (uniqueMovies.length - missingSynopsis) +
    (uniqueMovies.length - missingTMDBIds) +
    (uniqueMovies.length - missingCrew);
  
  const dataCompleteness = Math.round((filledFields / totalFields) * 100);
  
  // Calculate priority score
  // Higher score = higher priority
  // Factors:
  // 1. Movie count (more movies = higher impact)
  // 2. Data completeness (lower completeness = needs more work)
  // 3. Missing critical fields (director, TMDB ID)
  
  const movieCountScore = Math.min(uniqueMovies.length * 2, 100); // Cap at 50 movies
  const incompletenessScore = 100 - dataCompleteness; // Higher score for less complete data
  const criticalMissingScore = (missingDirectors + missingTMDBIds) * 2; // Directors and TMDB IDs are critical
  
  const priorityScore = Math.round(
    (movieCountScore * 0.5) + // 50% weight on impact
    (incompletenessScore * 0.3) + // 30% weight on data quality
    (criticalMissingScore * 0.2) // 20% weight on critical fields
  );
  
  // Recommend action
  let recommendedAction = 'Full validation';
  if (dataCompleteness >= 95) {
    recommendedAction = 'Quick audit only';
  } else if (dataCompleteness >= 80) {
    recommendedAction = 'Enrichment focus';
  } else if (missingDirectors > uniqueMovies.length * 0.5) {
    recommendedAction = 'Critical - missing directors';
  } else if (missingTMDBIds > uniqueMovies.length * 0.5) {
    recommendedAction = 'High priority - TMDB linking';
  }
  
  return {
    name: actorName,
    movieCount: uniqueMovies.length,
    heroCount,
    heroineCount,
    missingDirectors,
    missingPosters,
    missingSynopsis,
    missingTMDBIds,
    missingCrew,
    dataCompleteness,
    priorityScore,
    recommendedAction,
  };
}

async function main() {
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            ACTOR PRIORITY ANALYZER                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Language: ${LANGUAGE}`);
  console.log(`  Min movies: ${MIN_MOVIES}`);
  console.log(`  Top N: ${TOP_N}`);
  
  // Fetch all celebrities
  console.log(chalk.cyan('\n📥 Fetching actors from database...'));
  
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('name')
    .eq('language', LANGUAGE)
    .order('name');
  
  if (error) {
    console.error(chalk.red('Error fetching celebrities:'), error);
    return;
  }
  
  console.log(chalk.gray(`   Found ${celebrities?.length || 0} celebrities`));
  
  // Analyze each actor
  console.log(chalk.cyan('\n🔍 Analyzing actors...'));
  
  const analyses: ActorAnalysis[] = [];
  let processed = 0;
  
  for (const celeb of celebrities || []) {
    const analysis = await analyzeActor(celeb.name);
    if (analysis) {
      analyses.push(analysis);
    }
    
    processed++;
    if (processed % 10 === 0) {
      console.log(chalk.gray(`   Analyzed ${processed}/${celebrities.length} actors...`));
    }
  }
  
  console.log(chalk.green(`\n✅ Analyzed ${analyses.length} actors with ${MIN_MOVIES}+ movies`));
  
  // Sort by priority score
  analyses.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Take top N
  const topActors = analyses.slice(0, TOP_N);
  
  // Display results
  console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            TOP ${TOP_N} PRIORITY ACTORS                                    ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(chalk.white('\n  Priority | Actor | Movies | Completeness | Action'));
  console.log(chalk.gray('  ' + '─'.repeat(75)));
  
  for (let i = 0; i < Math.min(20, topActors.length); i++) {
    const a = topActors[i];
    const completenessColor = a.dataCompleteness >= 90 ? chalk.green : 
                               a.dataCompleteness >= 70 ? chalk.yellow : 
                               chalk.red;
    
    console.log(`  ${String(i + 1).padStart(3)} | ${a.name.padEnd(25)} | ${String(a.movieCount).padStart(3)} | ${completenessColor(String(a.dataCompleteness) + '%').padEnd(15)} | ${a.recommendedAction}`);
  }
  
  if (topActors.length > 20) {
    console.log(chalk.gray(`  ... and ${topActors.length - 20} more (see CSV report)`));
  }
  
  // Generate CSV report
  console.log(chalk.cyan('\n📝 Generating CSV report...'));
  
  const csvRows = [
    ['Priority_Rank', 'Actor_Name', 'Movie_Count', 'Hero_Count', 'Heroine_Count', 
     'Missing_Directors', 'Missing_Posters', 'Missing_Synopsis', 'Missing_TMDB_IDs', 'Missing_Crew',
     'Data_Completeness_%', 'Priority_Score', 'Recommended_Action'].join(','),
    ...topActors.map((a, idx) => [
      idx + 1,
      `"${a.name}"`,
      a.movieCount,
      a.heroCount,
      a.heroineCount,
      a.missingDirectors,
      a.missingPosters,
      a.missingSynopsis,
      a.missingTMDBIds,
      a.missingCrew,
      a.dataCompleteness,
      a.priorityScore,
      `"${a.recommendedAction}"`,
    ].join(',')),
  ];
  
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, csvRows.join('\n'), 'utf8');
  console.log(chalk.green(`   ✅ ${OUTPUT_FILE}`));
  
  // Summary statistics
  console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY STATISTICS                                        ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  const totalMovies = topActors.reduce((sum, a) => sum + a.movieCount, 0);
  const avgCompleteness = Math.round(topActors.reduce((sum, a) => sum + a.dataCompleteness, 0) / topActors.length);
  const totalMissingDirectors = topActors.reduce((sum, a) => sum + a.missingDirectors, 0);
  const totalMissingTMDBIds = topActors.reduce((sum, a) => sum + a.missingTMDBIds, 0);
  
  console.log(`  Total actors in top ${TOP_N}: ${topActors.length}`);
  console.log(`  Total movies covered: ${totalMovies}`);
  console.log(`  Average data completeness: ${avgCompleteness}%`);
  console.log(`  Total missing directors: ${totalMissingDirectors}`);
  console.log(`  Total missing TMDB IDs: ${totalMissingTMDBIds}`);
  
  // Recommendations
  const criticalActors = topActors.filter(a => a.dataCompleteness < 70);
  const highPriorityActors = topActors.filter(a => a.dataCompleteness >= 70 && a.dataCompleteness < 90);
  const lowPriorityActors = topActors.filter(a => a.dataCompleteness >= 90);
  
  console.log(chalk.yellow(`\n  📊 Breakdown by priority:`));
  console.log(chalk.red(`     Critical (<70% complete): ${criticalActors.length} actors`));
  console.log(chalk.yellow(`     High (70-89% complete): ${highPriorityActors.length} actors`));
  console.log(chalk.green(`     Low (90%+ complete): ${lowPriorityActors.length} actors`));
  
  console.log(chalk.cyan(`\n  💡 Recommendations:`));
  
  if (criticalActors.length > 0) {
    console.log(chalk.yellow(`     1. Start with ${Math.min(10, criticalActors.length)} critical actors:`));
    console.log(chalk.gray(`        ${criticalActors.slice(0, 10).map(a => a.name).join(', ')}`));
    console.log(chalk.gray(`\n        Command: npx tsx scripts/batch-validate-all-actors.ts --actors="${criticalActors.slice(0, 10).map(a => a.name).join(',')}" --mode=full\n`));
  }
  
  if (highPriorityActors.length > 0) {
    console.log(chalk.yellow(`     2. Then process ${highPriorityActors.length} high-priority actors (enrichment focus)`));
    console.log(chalk.gray(`        Command: npx tsx scripts/batch-validate-all-actors.ts --min-movies=${MIN_MOVIES} --mode=full --batch-size=10\n`));
  }
  
  if (lowPriorityActors.length > 0) {
    console.log(chalk.green(`     3. Finally, quick audits for ${lowPriorityActors.length} well-maintained actors`));
    console.log(chalk.gray(`        Command: npx tsx scripts/batch-validate-all-actors.ts --actors="${lowPriorityActors.map(a => a.name).join(',')}" --mode=report\n`));
  }
  
  console.log(chalk.green.bold(`\n✅ Analysis complete!\n`));
}

main().catch(console.error);
