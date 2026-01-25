#!/usr/bin/env npx tsx
/**
 * CALCULATE & UPDATE DATA CONFIDENCE SCORES
 * 
 * Analyzes all movies and calculates confidence scores based on:
 * - Data source reliability
 * - Cross-verification
 * - Manual review status
 * - Data freshness
 * 
 * Updates the data_confidence column for all movies.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import {
  calculateMovieConfidence,
  inferFieldSources,
  updateMovieConfidenceScore,
  getConfidenceBadge,
  type ConfidenceScore
} from './lib/confidence-scoring';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Stats {
  total: number;
  updated: number;
  failed: number;
  by_status: Record<string, number>;
  avg_confidence: number;
}

async function calculateAllConfidenceScores() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           CALCULATE DATA CONFIDENCE SCORES                            ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  const startTime = Date.now();
  const stats: Stats = {
    total: 0,
    updated: 0,
    failed: 0,
    by_status: {},
    avg_confidence: 0
  };

  // Fetch all movies in batches
  console.log(chalk.white('  Loading movies from database...\n'));
  
  const BATCH_SIZE = 500;
  let offset = 0;
  let allMovies: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error || !data || data.length === 0) break;
    
    allMovies.push(...data);
    console.log(chalk.gray(`    Loaded ${allMovies.length} movies...`));
    offset += BATCH_SIZE;
    if (data.length < BATCH_SIZE) break;
  }

  console.log(chalk.green(`  ✓ Loaded ${allMovies.length.toLocaleString()} movies\n`));
  console.log(chalk.white('  Calculating confidence scores...\n'));

  stats.total = allMovies.length;
  let totalConfidence = 0;

  for (let i = 0; i < allMovies.length; i++) {
    const movie = allMovies[i];
    
    // Infer sources from existing data
    const sources = movie.field_sources 
      ? JSON.parse(movie.field_sources)
      : inferFieldSources(movie);
    
    // Calculate confidence score
    const score: ConfidenceScore = calculateMovieConfidence(movie, sources);
    
    // Update in database
    const success = await updateMovieConfidenceScore(supabase, movie.id, score);
    
    if (success) {
      stats.updated++;
      totalConfidence += score.overall;
      
      // Track by verification status
      stats.by_status[score.verification_status] = 
        (stats.by_status[score.verification_status] || 0) + 1;
      
      // Log progress every 100 movies
      if ((i + 1) % 100 === 0) {
        const badge = getConfidenceBadge(score.overall);
        console.log(
          chalk.gray(`    [${i + 1}/${allMovies.length}] ${movie.title_en} `) +
          chalk[badge.color === 'emerald' ? 'green' : badge.color](`${badge.icon} ${(score.overall * 100).toFixed(0)}%`)
        );
      }
    } else {
      stats.failed++;
    }
  }

  stats.avg_confidence = totalConfidence / stats.updated;

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                  CONFIDENCE CALCULATION COMPLETE                      ║
╚═══════════════════════════════════════════════════════════════════════╝

  Total Movies:             ${stats.total.toLocaleString()}
  ✓ Successfully Updated:   ${stats.updated.toLocaleString()}
  ✗ Failed:                 ${stats.failed}
  
  Average Confidence:       ${(stats.avg_confidence * 100).toFixed(1)}%
  
  Verification Status:
  - Expert Verified:        ${stats.by_status['expert_verified'] || 0} (${((stats.by_status['expert_verified'] || 0) / stats.total * 100).toFixed(1)}%)
  - Verified:               ${stats.by_status['verified'] || 0} (${((stats.by_status['verified'] || 0) / stats.total * 100).toFixed(1)}%)
  - Partial:                ${stats.by_status['partial'] || 0} (${((stats.by_status['partial'] || 0) / stats.total * 100).toFixed(1)}%)
  - Unverified:             ${stats.by_status['unverified'] || 0} (${((stats.by_status['unverified'] || 0) / stats.total * 100).toFixed(1)}%)
  
  Duration: ${duration} minutes
  
  ✅ Confidence scores calculated and saved!
  
  Next Steps:
  1. Update UI to display confidence badges
  2. Filter movies by confidence in admin panel
  3. Prioritize low-confidence movies for review

`));
}

calculateAllConfidenceScores().catch(console.error);
