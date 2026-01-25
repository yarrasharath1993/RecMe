#!/usr/bin/env npx tsx
/**
 * FIX CRITICAL MISSING FIELDS
 * 
 * Automatically enriches movies with critical missing fields:
 * - release_year
 * - title_te (Telugu title)
 * - director
 * - language
 * 
 * Uses multi-source enrichment (TMDB, IMDb, Wikidata, etc.)
 * 
 * Usage:
 *   npx tsx scripts/fix-critical-missing-fields.ts
 *   npx tsx scripts/fix-critical-missing-fields.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import { fetchFromAllSources } from './lib/multi-source-orchestrator';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CriticalIssue {
  movieId: string;
  title: string;
  missingFields: string[];
}

interface EnrichResult {
  movieId: string;
  title: string;
  missingFields: string[];
  enrichedFields: Record<string, any>;
  success: boolean;
  error?: string;
}

/**
 * Extract critical issues from suspicious-entries.csv
 */
function extractCriticalIssues(): CriticalIssue[] {
  const csvPath = 'docs/audit-reports/suspicious-entries.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(chalk.red(`CSV file not found: ${csvPath}`));
    return [];
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  const issues: CriticalIssue[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 7 && parts[4] === 'critical') {
      const movieId = parts[0].trim();
      const title = parts[1].replace(/"/g, '').trim();
      const missingFieldsStr = parts[6].replace(/"/g, '').trim();
      const missingFields = missingFieldsStr.split(';').filter(f => f);
      
      issues.push({ movieId, title, missingFields });
    }
  }
  
  return issues;
}

/**
 * Enrich a single movie with missing fields
 */
async function enrichMovie(issue: CriticalIssue, execute: boolean): Promise<EnrichResult> {
  console.log(chalk.blue(`\n  Processing: "${issue.title}"`));
  console.log(chalk.gray(`    Missing: ${issue.missingFields.join(', ')}`));
  
  // Fetch current movie data
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('*')
    .eq('id', issue.movieId)
    .single();
  
  if (fetchError || !movie) {
    return {
      movieId: issue.movieId,
      title: issue.title,
      missingFields: issue.missingFields,
      enrichedFields: {},
      success: false,
      error: `Failed to fetch movie: ${fetchError?.message}`,
    };
  }
  
  console.log(chalk.gray(`    Searching external sources...`));
  
  // Try to fetch data from external sources
  try {
    const externalData = await fetchFromAllSources({
      title: movie.title_en,
      year: movie.release_year || undefined,
      language: movie.language || undefined,
      tmdbId: movie.tmdb_id || undefined,
      imdbId: movie.imdb_id || undefined,
    });
    
    const enrichedFields: Record<string, any> = {};
    let foundAny = false;
    
    // Try to fill missing fields
    if (issue.missingFields.includes('release_year') && !movie.release_year) {
      if (externalData.consensusData.year) {
        enrichedFields.release_year = externalData.consensusData.year;
        console.log(chalk.yellow(`    → Found year: ${externalData.consensusData.year}`));
        foundAny = true;
      }
    }
    
    if (issue.missingFields.includes('director') && !movie.director) {
      if (externalData.consensusData.director) {
        enrichedFields.director = externalData.consensusData.director;
        console.log(chalk.yellow(`    → Found director: ${externalData.consensusData.director}`));
        foundAny = true;
      }
    }
    
    if (issue.missingFields.includes('language') && !movie.language) {
      if (externalData.consensusData.language) {
        enrichedFields.language = externalData.consensusData.language;
        console.log(chalk.yellow(`    → Found language: ${externalData.consensusData.language}`));
        foundAny = true;
      }
    }
    
    // For Telugu title, we might need AI translation or external sources
    if (issue.missingFields.includes('title_te') && !movie.title_te) {
      // Skip for now - requires AI translation
      console.log(chalk.gray(`    ⚠ Telugu title needs manual entry or AI translation`));
    }
    
    if (!foundAny) {
      console.log(chalk.red(`    ❌ No data found from external sources`));
      return {
        movieId: movie.id,
        title: issue.title,
        missingFields: issue.missingFields,
        enrichedFields,
        success: false,
        error: 'No external data available',
      };
    }
    
    if (!execute) {
      console.log(chalk.yellow(`    (Dry run - no changes made)`));
      return {
        movieId: movie.id,
        title: issue.title,
        missingFields: issue.missingFields,
        enrichedFields,
        success: true,
      };
    }
    
    // Apply enrichment
    const { error: updateError } = await supabase
      .from('movies')
      .update(enrichedFields)
      .eq('id', movie.id);
    
    if (updateError) {
      console.log(chalk.red(`    ❌ Failed to update: ${updateError.message}`));
      return {
        movieId: movie.id,
        title: issue.title,
        missingFields: issue.missingFields,
        enrichedFields,
        success: false,
        error: updateError.message,
      };
    }
    
    console.log(chalk.green(`    ✅ Enriched with ${Object.keys(enrichedFields).length} fields!`));
    
    return {
      movieId: movie.id,
      title: issue.title,
      missingFields: issue.missingFields,
      enrichedFields,
      success: true,
    };
    
  } catch (error: any) {
    console.log(chalk.red(`    ❌ Error: ${error.message}`));
    return {
      movieId: issue.movieId,
      title: issue.title,
      missingFields: issue.missingFields,
      enrichedFields: {},
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const hasFlag = (name: string): boolean => args.includes(`--${name}`);
  const EXECUTE = hasFlag('execute');
  const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '61', 10);
  
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            FIX CRITICAL MISSING FIELDS                               ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝'));
  
  console.log(chalk.gray(`\n  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`));
  if (!EXECUTE) {
    console.log(chalk.yellow('  (No changes will be made. Use --execute to apply fixes)'));
  }
  
  const issues = extractCriticalIssues().slice(0, LIMIT);
  console.log(chalk.blue(`\n  Found ${issues.length} movies with critical missing fields`));
  
  const results: EnrichResult[] = [];
  let successCount = 0;
  let failCount = 0;
  let fieldsEnriched = 0;
  
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    console.log(chalk.magenta(`\n[${i + 1}/${issues.length}]`));
    
    const result = await enrichMovie(issue, EXECUTE);
    results.push(result);
    
    if (result.success) {
      successCount++;
      fieldsEnriched += Object.keys(result.enrichedFields).length;
    } else {
      failCount++;
    }
    
    // Delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save results
  if (EXECUTE) {
    const logPath = `docs/audit-reports/critical-fields-fix-log-${Date.now()}.json`;
    fs.writeFileSync(logPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(chalk.cyan(`\n  📋 Fix log saved: ${logPath}`));
  }
  
  console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║            ENRICHMENT COMPLETE                                       ║'));
  console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════════════════╝'));
  
  console.log(chalk.gray(`\n  Total movies: ${issues.length}`));
  console.log(chalk.green(`  Successfully enriched: ${successCount}`));
  console.log(chalk.green(`  Total fields added: ${fieldsEnriched}`));
  if (failCount > 0) {
    console.log(chalk.red(`  Failed: ${failCount}`));
  }
  
  if (!EXECUTE) {
    console.log(chalk.yellow(`\n  💡 This was a dry run. Use --execute to apply fixes.`));
  } else {
    console.log(chalk.green(`\n  ✅ All enrichments applied to database!`));
  }
}

main().catch(error => {
  console.error(chalk.red('\n❌ Script failed:'), error);
  process.exit(1);
});
