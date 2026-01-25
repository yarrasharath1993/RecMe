#!/usr/bin/env npx tsx
/**
 * BULK SYNOPSIS TRANSLATION
 * 
 * Translates English synopses to Telugu using AI translation service.
 * Uses Groq LLM (primary) and Google Translate (fallback).
 * 
 * Usage:
 *   npx tsx scripts/enrich-synopsis-bulk.ts --execute --limit=2000
 *   npx tsx scripts/enrich-synopsis-bulk.ts --report-only
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import { translateToTelugu } from '../lib/enrichment/translation-service';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXECUTE = process.argv.includes('--execute');
const REPORT_ONLY = process.argv.includes('--report-only');

const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 2000;

const BATCH_SIZE = 10; // Progress reporting every 10 movies

interface Movie {
  id: string;
  title_en: string;
  title_te?: string;
  release_year?: number;
  synopsis?: string;
  synopsis_te?: string;
}

let stats = {
  processed: 0,
  translated: 0,
  failed: 0,
  skipped: 0,
};

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║         BULK SYNOPSIS TRANSLATION                                    ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  // Load movies needing translation
  console.log(chalk.cyan(`  📋 Loading movies needing Telugu synopsis...`));
  
  const { data: allMovies, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, synopsis, synopsis_te')
    .eq('language', 'Telugu')
    .not('synopsis', 'is', null)
    .is('synopsis_te', null)
    .limit(LIMIT);

  if (error || !allMovies) {
    console.error(chalk.red(`  ❌ Error loading movies: ${error?.message}`));
    return;
  }

  // Filter out empty synopses
  const moviesToProcess = allMovies.filter(m => m.synopsis && m.synopsis.trim().length > 0);

  console.log(chalk.green(`  ✅ Loaded ${moviesToProcess.length} movies to translate\n`));

  // Report mode
  if (REPORT_ONLY) {
    console.log(chalk.cyan(`  📊 SYNOPSIS GAPS:`));
    console.log(chalk.gray(`    Movies with English synopsis: ${moviesToProcess.length}`));
    console.log(chalk.gray(`    Movies needing Telugu translation: ${moviesToProcess.length}\n`));
    
    console.log(chalk.yellow(`  ⚠️  REPORT-ONLY MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
    return;
  }

  if (!EXECUTE) {
    console.log(chalk.yellow(`  ⚠️  DRY RUN MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
    return;
  }

  // Start translation
  console.log(chalk.cyan(`  🔄 Starting translation...\n`));
  const startTime = Date.now();

  for (let i = 0; i < moviesToProcess.length; i++) {
    const movie = moviesToProcess[i];
    stats.processed++;

    try {
      // Translate synopsis
      const translation = await translateToTelugu(movie.synopsis!, { 
        maxLength: 1000,
        context: `Telugu movie "${movie.title_te || movie.title_en}" (${movie.release_year || 'N/A'})` 
      });

      if (translation && translation.text && translation.text.trim().length > 0) {
        // Update database
        const { error: updateError } = await supabase
          .from('movies')
          .update({ synopsis_te: translation.text })
          .eq('id', movie.id);

        if (updateError) {
          console.error(chalk.red(`  ❌ Error updating ${movie.title_en}: ${updateError.message}`));
          stats.failed++;
        } else {
          stats.translated++;
          
          // Log occasionally for progress
          if (stats.translated % BATCH_SIZE === 0) {
            console.log(chalk.green(`  ✓ ${stats.translated} synopses translated (${movie.title_en})`));
          }
        }
      } else {
        console.log(chalk.yellow(`  ⚠️  Translation failed for ${movie.title_en}`));
        stats.failed++;
      }
    } catch (error) {
      console.error(chalk.red(`  ❌ Error translating ${movie.title_en}: ${error}`));
      stats.failed++;
    }

    // Progress update every 50 movies
    if ((i + 1) % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const remaining = moviesToProcess.length - (i + 1);
      const avgPerMin = (i + 1) / parseFloat(elapsed);
      const eta = (remaining / avgPerMin).toFixed(1);
      
      console.log(chalk.cyan(`\n  Progress: ${i + 1}/${moviesToProcess.length}`));
      console.log(chalk.gray(`    Translated: ${stats.translated}, Failed: ${stats.failed}`));
      console.log(chalk.gray(`    Elapsed: ${elapsed} min, ETA: ${eta} min\n`));
    }

    // Small delay to avoid overwhelming the translation service
    await new Promise(r => setTimeout(r, 100));
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Final report
  console.log(chalk.green(`\n  ✅ Translation complete!\n`));

  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            ENRICHMENT COMPLETE!                                      ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.green(`  Total movies processed: ${stats.processed}`));
  console.log(chalk.green(`  Duration: ${duration} minutes\n`));

  console.log(chalk.green(`  ✅ Synopses translated: ${stats.translated}`));
  console.log(chalk.red(`  ❌ Failed: ${stats.failed}`));
  
  const successRate = stats.processed > 0 ? ((stats.translated / stats.processed) * 100).toFixed(1) : 0;
  console.log(chalk.cyan(`  Success rate: ${successRate}%\n`));

  const avgPerMin = stats.processed / parseFloat(duration);
  console.log(chalk.gray(`  Average: ${avgPerMin.toFixed(1)} translations/minute\n`));

  console.log(chalk.cyan(`  💡 Run audit to see improvements:`));
  console.log(chalk.gray(`     npx tsx scripts/audit-movie-data-completeness.ts\n`));
}

main();
