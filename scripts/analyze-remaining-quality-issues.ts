#!/usr/bin/env npx tsx
/**
 * Analyze Remaining Database Quality Issues
 * 
 * Identifies next optimization opportunities across all data quality dimensions
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QualityIssue {
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  description: string;
  estimatedTime: string;
  automatable: boolean;
}

async function analyzeAllQualityIssues() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║        COMPREHENSIVE DATABASE QUALITY ANALYSIS                        ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  const issues: QualityIssue[] = [];

  // Fetch all movies for analysis
  console.log(chalk.white('  Loading all movies for analysis...\n'));
  
  const BATCH_SIZE = 1000;
  let offset = 0;
  let allMovies: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, title_te, release_year, genres, tmdb_id, imdb_id, director, hero, heroine, synopsis_en, synopsis_te, poster_url, backdrop_url, slug')
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error || !data || data.length === 0) break;
    allMovies.push(...data);
    offset += BATCH_SIZE;
    if (data.length < BATCH_SIZE) break;
  }

  console.log(chalk.green(`  ✓ Loaded ${allMovies.length.toLocaleString()} movies\n`));

  // 1. Missing TMDB IDs
  const missingTmdb = allMovies.filter(m => !m.tmdb_id);
  if (missingTmdb.length > 0) {
    issues.push({
      category: 'Missing TMDB IDs',
      priority: 'HIGH',
      count: missingTmdb.length,
      description: `Movies without TMDB linking - limits enrichment capabilities`,
      estimatedTime: `${Math.ceil(missingTmdb.length / 100)} hours`,
      automatable: true
    });
  }

  // 2. Missing Telugu Titles
  const missingTelugu = allMovies.filter(m => !m.title_te);
  if (missingTelugu.length > 0) {
    issues.push({
      category: 'Missing Telugu Titles',
      priority: 'HIGH',
      count: missingTelugu.length,
      description: `Telugu movies without Telugu titles - critical for regional audience`,
      estimatedTime: `${Math.ceil(missingTelugu.length / 200)} hours`,
      automatable: true
    });
  }

  // 3. Missing Directors
  const missingDirector = allMovies.filter(m => !m.director);
  if (missingDirector.length > 0) {
    issues.push({
      category: 'Missing Directors',
      priority: 'HIGH',
      count: missingDirector.length,
      description: `Movies without director information - critical metadata`,
      estimatedTime: `${Math.ceil(missingDirector.length / 100)} hours`,
      automatable: true
    });
  }

  // 4. Missing Cast (Hero/Heroine)
  const missingCast = allMovies.filter(m => !m.hero && !m.heroine);
  if (missingCast.length > 0) {
    issues.push({
      category: 'Missing Cast Information',
      priority: 'HIGH',
      count: missingCast.length,
      description: `Movies without any cast information`,
      estimatedTime: `${Math.ceil(missingCast.length / 100)} hours`,
      automatable: true
    });
  }

  // 5. Missing Synopses (English)
  const missingSynopsisEn = allMovies.filter(m => !m.synopsis_en);
  if (missingSynopsisEn.length > 0) {
    issues.push({
      category: 'Missing English Synopsis',
      priority: 'MEDIUM',
      count: missingSynopsisEn.length,
      description: `Movies without English plot summaries`,
      estimatedTime: `${Math.ceil(missingSynopsisEn.length / 50)} hours`,
      automatable: true
    });
  }

  // 6. Missing Synopses (Telugu)
  const missingSynopsisTe = allMovies.filter(m => !m.synopsis_te);
  if (missingSynopsisTe.length > 0) {
    issues.push({
      category: 'Missing Telugu Synopsis',
      priority: 'MEDIUM',
      count: missingSynopsisTe.length,
      description: `Movies without Telugu plot summaries`,
      estimatedTime: `${Math.ceil(missingSynopsisTe.length / 50)} hours`,
      automatable: true
    });
  }

  // 7. Missing Posters
  const missingPoster = allMovies.filter(m => !m.poster_url || m.poster_url.includes('placeholder'));
  if (missingPoster.length > 0) {
    issues.push({
      category: 'Missing/Placeholder Posters',
      priority: 'MEDIUM',
      count: missingPoster.length,
      description: `Movies without proper poster images`,
      estimatedTime: `${Math.ceil(missingPoster.length / 100)} hours`,
      automatable: true
    });
  }

  // 8. Missing Backdrops
  const missingBackdrop = allMovies.filter(m => !m.backdrop_url);
  if (missingBackdrop.length > 0) {
    issues.push({
      category: 'Missing Backdrop Images',
      priority: 'LOW',
      count: missingBackdrop.length,
      description: `Movies without backdrop/banner images`,
      estimatedTime: `${Math.ceil(missingBackdrop.length / 100)} hours`,
      automatable: true
    });
  }

  // 9. Recent Movies (2020+) Missing Critical Data
  const recentIncomplete = allMovies.filter(m => 
    m.release_year >= 2020 && 
    (!m.synopsis_en || !m.director || !m.hero)
  );
  if (recentIncomplete.length > 0) {
    issues.push({
      category: 'Recent Movies - Incomplete',
      priority: 'HIGH',
      count: recentIncomplete.length,
      description: `Recent high-visibility movies missing critical data`,
      estimatedTime: '2-3 hours',
      automatable: true
    });
  }

  // 10. Old Movies (Pre-1980) Missing Data
  const oldIncomplete = allMovies.filter(m => 
    m.release_year < 1980 && 
    (!m.synopsis_en || !m.director)
  );
  if (oldIncomplete.length > 0) {
    issues.push({
      category: 'Classic Movies - Incomplete',
      priority: 'MEDIUM',
      count: oldIncomplete.length,
      description: `Classic films needing preservation & documentation`,
      estimatedTime: `${Math.ceil(oldIncomplete.length / 50)} hours`,
      automatable: false
    });
  }

  // 11. Potential Duplicates (same title + year)
  const titleYearMap: Record<string, any[]> = {};
  allMovies.forEach(m => {
    const key = `${m.title_en?.toLowerCase()}_${m.release_year}`;
    if (!titleYearMap[key]) titleYearMap[key] = [];
    titleYearMap[key].push(m);
  });
  const potentialDupes = Object.values(titleYearMap).filter(arr => arr.length > 1);
  if (potentialDupes.length > 0) {
    const dupeCount = potentialDupes.reduce((sum, arr) => sum + arr.length - 1, 0);
    issues.push({
      category: 'Potential Duplicates',
      priority: 'MEDIUM',
      count: dupeCount,
      description: `Movies with identical title+year that may be duplicates`,
      estimatedTime: '2-3 hours',
      automatable: false
    });
  }

  // Sort by priority and count
  issues.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.count - a.count;
  });

  // Display results
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   QUALITY ISSUES IDENTIFIED                           ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  let highPriorityCount = 0;
  let mediumPriorityCount = 0;
  let lowPriorityCount = 0;

  issues.forEach((issue, idx) => {
    const priorityColor = issue.priority === 'HIGH' ? chalk.red :
                          issue.priority === 'MEDIUM' ? chalk.yellow : chalk.gray;
    const autoLabel = issue.automatable ? '🤖 AUTO' : '👤 MANUAL';
    
    console.log(priorityColor(`  ${(idx + 1).toString().padStart(2)}. [${issue.priority}] ${issue.category}`));
    console.log(chalk.white(`      ${issue.count.toLocaleString()} movies affected`));
    console.log(chalk.gray(`      ${issue.description}`));
    console.log(chalk.gray(`      ⏱️  ${issue.estimatedTime} | ${autoLabel}\n`));

    if (issue.priority === 'HIGH') highPriorityCount += issue.count;
    if (issue.priority === 'MEDIUM') mediumPriorityCount += issue.count;
    if (issue.priority === 'LOW') lowPriorityCount += issue.count;
  });

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                          SUMMARY                                      ║
╚═══════════════════════════════════════════════════════════════════════╝

  Total Issues:             ${issues.length} categories
  
  🔴 High Priority:         ${highPriorityCount.toLocaleString()} movies
  🟡 Medium Priority:       ${mediumPriorityCount.toLocaleString()} movies
  ⚪ Low Priority:          ${lowPriorityCount.toLocaleString()} movies

  🤖 Automatable:           ${issues.filter(i => i.automatable).length} categories
  👤 Manual Review:         ${issues.filter(i => !i.automatable).length} categories

╔═══════════════════════════════════════════════════════════════════════╗
║                   RECOMMENDED NEXT STEPS                              ║
╚═══════════════════════════════════════════════════════════════════════╝

  Quick Wins (Automatable):
  ${issues.filter(i => i.automatable && i.priority === 'HIGH').slice(0, 3).map((i, idx) => 
    `${idx + 1}. ${i.category} (${i.count} movies)`
  ).join('\n  ')}

  Focus Areas:
  1. Missing TMDB IDs → Enables all other enrichments
  2. Missing Directors → Critical metadata
  3. Recent Movies → High visibility, easy to fix

`));
}

analyzeAllQualityIssues();
