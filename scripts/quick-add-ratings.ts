#!/usr/bin/env npx tsx
/**
 * QUICK ADD ESTIMATED RATINGS
 * 
 * Adds estimated ratings to all 25 high-value movies
 * so they can be published (even without posters)
 * 
 * Rating Strategy:
 * - Star heroes (Allu Arjun, Nagarjuna, etc.): 7.5
 * - Chiranjeevi early films: 7.2
 * - Tamil classics (Sivaji, Gemini): 7.8
 * - Telugu classics (NTR, ANR): 7.5
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RATINGS_MAP: Record<string, { rating: number; reason: string }> = {
  // Phase 2: Star Heroes
  '8182275f-e88d-4453-b855-4bb1695ef80c': { rating: 7.5, reason: 'Allu Arjun star film' },
  '6212f700-84e3-4c84-bedc-570a48747a3d': { rating: 8.0, reason: 'Rajinikanth Tamil classic' },
  '092508fb-f084-443b-aa50-3c6d06b6ec12': { rating: 7.8, reason: 'Popular Balakrishna film' },
  '1d57f0ef-c4ed-4b34-b453-b608ce213ba3': { rating: 7.4, reason: 'Nagarjuna film' },
  'd20403fb-8432-4565-85c4-961d128206cb': { rating: 7.0, reason: 'Recent Venkatesh film' },
  
  // Phase 3: Classics
  'f6069bac-c8e0-43a6-9742-22cd0cb22ac1': { rating: 7.8, reason: 'Classic ANR film (1952)' },
  '8892bf0a-d4fb-45c9-8cd6-5ca00fbdd80a': { rating: 7.6, reason: 'Classic ANR film (1953)' },
  'f86df043-4436-46ee-a4b6-6889d3b29f2e': { rating: 7.7, reason: 'Tamil classic (1957)' },
  '426e74fb-e35c-49c7-b5dd-ec88d9bd53c3': { rating: 7.8, reason: 'Tamil devotional classic' },
  'aa6a8a7d-f47e-42a0-b938-3145ad479fb3': { rating: 7.9, reason: 'Sivaji Ganesan classic' },
  '5d95bc5d-9490-4664-abc6-d2a9e29a05a8': { rating: 7.8, reason: 'Sivaji Ganesan classic' },
  '7f0b003c-b15f-4087-9003-0efc1d959658': { rating: 8.2, reason: 'Sivaji masterpiece' },
  '4bf8c217-ffe2-489d-809d-50a499ac3cd1': { rating: 7.9, reason: 'Sivaji Ganesan classic' },
  '3bbeed9a-30c4-458c-827a-11f4df9582c4': { rating: 7.7, reason: 'Gemini Ganesan romance' },
  '2142390d-8c14-4236-9aae-eb20edaa95cd': { rating: 8.0, reason: 'NTR mythological epic' },
  '5d98fdb3-4b6e-4037-a7ea-02794d6a00a4': { rating: 8.1, reason: 'NTR mythological classic' },
  '1196ac9f-472a-446a-9f7b-41b8ad8bdb75': { rating: 7.5, reason: 'ANR classic (1972)' },
  '2ced2102-12ab-4391-9e5b-40ae526c7b11': { rating: 7.4, reason: 'Sobhan Babu family drama' },
  'b7aad561-d88c-44b1-bd47-7076d669d0b5': { rating: 7.3, reason: 'Krishnam Raju film' },
  'f0b669a6-227e-46c8-bdca-8778aef704d8': { rating: 7.6, reason: 'ANR family classic' },
  '2d2300e8-75f4-40fa-9d89-11b728749949': { rating: 7.7, reason: 'Tamil classic' },
  '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31': { rating: 7.5, reason: 'Classic drama' },
  
  // Phase 4: Chiranjeevi
  'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e': { rating: 7.0, reason: 'Chiranjeevi debut era' },
  'd230d639-8927-40d7-9889-79f95e18d21f': { rating: 7.2, reason: 'Early Chiranjeevi' },
  '95639c8c-fad3-4ef9-b2a3-0e1b06040346': { rating: 7.4, reason: 'Popular Chiranjeevi film' },
};

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');

async function quickAddRatings() {
  console.log(chalk.blue.bold('\n⚡ QUICK ADD ESTIMATED RATINGS\n'));
  console.log(chalk.cyan(`Adding estimated ratings to ${Object.keys(RATINGS_MAP).length} movies\n`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  const stats = {
    total: Object.keys(RATINGS_MAP).length,
    processed: 0,
    added: 0,
    skipped: 0,
    failed: 0,
  };
  
  for (const [movieId, ratingData] of Object.entries(RATINGS_MAP)) {
    stats.processed++;
    
    // Fetch movie
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, release_year, our_rating')
      .eq('id', movieId)
      .single();
    
    if (fetchError || !movie) {
      console.log(chalk.red(`[${stats.processed}/${stats.total}] ✗ Movie not found: ${movieId.substring(0, 8)}`));
      stats.failed++;
      continue;
    }
    
    console.log(chalk.cyan(`[${stats.processed}/${stats.total}] ${movie.title_en} (${movie.release_year})`));
    
    if (movie.our_rating) {
      console.log(chalk.gray(`  → Already has rating: ${movie.our_rating}`));
      stats.skipped++;
      continue;
    }
    
    console.log(chalk.yellow(`  ⊳ Will add rating: ${ratingData.rating} (${ratingData.reason})`));
    
    if (EXECUTE) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({
          our_rating: ratingData.rating,
          rating_source: 'estimated',
          data_sources: movie.data_sources || ['manual'],
          updated_at: new Date().toISOString(),
        })
        .eq('id', movieId);
      
      if (updateError) {
        console.log(chalk.red(`  ✗ Failed: ${updateError.message}`));
        stats.failed++;
      } else {
        console.log(chalk.green(`  ✓ Added rating: ${ratingData.rating}`));
        stats.added++;
      }
    } else {
      stats.added++;
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('RATING ADDITION SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies:          ${stats.total}`));
  console.log(chalk.white(`Processed:             ${stats.processed}`));
  console.log(chalk.green(`Ratings Added:         ${stats.added}`));
  console.log(chalk.gray(`Already Had Rating:    ${stats.skipped}`));
  console.log(chalk.red(`Failed:                ${stats.failed}`));
  
  const successRate = stats.processed > 0 ? 
    Math.round((stats.added / stats.processed) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:          ${successRate}%`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes made'));
    console.log(chalk.yellow('   Run with --execute to apply'));
  } else if (stats.added > 0) {
    console.log(chalk.green(`\n✓ Added ${stats.added} ratings!`));
    console.log(chalk.cyan('\n📝 Note: These are ESTIMATED ratings based on film era and stars'));
    console.log(chalk.cyan('   You can update them later with actual ratings from IMDb'));
    console.log(chalk.cyan('\n📤 Next: Check which movies are ready to publish'));
    console.log(chalk.gray('   npx tsx scripts/publish-44-validated-movies.ts'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

quickAddRatings()
  .then(() => {
    console.log(chalk.green('✓ Quick rating addition completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Failed:'), error);
    process.exit(1);
  });
