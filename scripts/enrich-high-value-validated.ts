#!/usr/bin/env npx tsx
/**
 * ENRICH HIGH-VALUE VALIDATED MOVIES
 * 
 * Phase 2: 5 Star Hero Movies
 * Phase 3: 17 Classic Movies  
 * Phase 4: 3 Chiranjeevi Early Career Movies
 * 
 * Total: 25 movies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Phase 2: High-Value Star Heroes (5 movies)
const PHASE_2_IDS = [
  '8182275f-e88d-4453-b855-4bb1695ef80c', // Badrinath (2011) - Allu Arjun
  '6212f700-84e3-4c84-bedc-570a48747a3d', // Nizhal Thedum Nenjangal (1982) - Rajinikanth
  '092508fb-f084-443b-aa50-3c6d06b6ec12', // Chennakeshava Reddy (2002) - Balakrishna
  '1d57f0ef-c4ed-4b34-b453-b608ce213ba3', // Chaithanya (1991) - Nagarjuna
  'd20403fb-8432-4565-85c4-961d128206cb', // Well, If You Know Me (2015) - Venkatesh
];

// Phase 3: Classic Movies (17 movies)
const PHASE_3_IDS = [
  'f6069bac-c8e0-43a6-9742-22cd0cb22ac1', // Adarsham (1952) - ANR
  '8892bf0a-d4fb-45c9-8cd6-5ca00fbdd80a', // Bratuku Theruvu (1953) - ANR
  'f86df043-4436-46ee-a4b6-6889d3b29f2e', // Pathini Deivam (1957) - Gemini Ganesan
  '426e74fb-e35c-49c7-b5dd-ec88d9bd53c3', // Padhi Bhakti (1958) - Gemini Ganesan
  'aa6a8a7d-f47e-42a0-b938-3145ad479fb3', // Kaathavaraayan (1958) - Sivaji Ganesan
  '5d95bc5d-9490-4664-abc6-d2a9e29a05a8', // Kuravanji (1960) - Sivaji Ganesan
  '7f0b003c-b15f-4087-9003-0efc1d959658', // Paarthaal Pasi Theerum (1962) - Sivaji Ganesan
  '4bf8c217-ffe2-489d-809d-50a499ac3cd1', // Kai Koduttha Dheivam (1964) - Sivaji Ganesan
  '3bbeed9a-30c4-458c-827a-11f4df9582c4', // Poojaikku Vandha Malar (1965) - Gemini Ganesan
  '2142390d-8c14-4236-9aae-eb20edaa95cd', // Shri Krishna Pandaviyam (1966) - NTR
  '5d98fdb3-4b6e-4037-a7ea-02794d6a00a4', // Shri Krishnavataram (1967) - NTR
  '1196ac9f-472a-446a-9f7b-41b8ad8bdb75', // Iddaru Ammayilu (1972) - ANR
  '2ced2102-12ab-4391-9e5b-40ae526c7b11', // Amma Mata (1972) - Sobhan Babu
  'b7aad561-d88c-44b1-bd47-7076d669d0b5', // Jeevana Theeralu (1977) - Krishnam Raju
  'f0b669a6-227e-46c8-bdca-8778aef704d8', // Q12982331 (1977) - ANR (Bangaru Bommalu)
  '2d2300e8-75f4-40fa-9d89-11b728749949', // Karunai Ullam (1978) - Gemini Ganesan
  '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31', // Q16311395 (1978) - Vijayachander (Karunamayudu)
];

// Phase 4: Chiranjeevi Early Career (3 movies)
const PHASE_4_IDS = [
  'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e', // Q12985478 (1979) - Chiranjeevi (Kothala Raayudu)
  'd230d639-8927-40d7-9889-79f95e18d21f', // Sri Rambantu (1979) - Chiranjeevi
  '95639c8c-fad3-4ef9-b2a3-0e1b06040346', // Aaj Ka Goonda Raj (1992) - Chiranjeevi
];

const ALL_IDS = [...PHASE_2_IDS, ...PHASE_3_IDS, ...PHASE_4_IDS];

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');

async function enrichMovies() {
  console.log(chalk.blue.bold('\n🎬 ENRICH HIGH-VALUE VALIDATED MOVIES\n'));
  console.log(chalk.cyan(`Phase 2 (Star Heroes): ${PHASE_2_IDS.length} movies`));
  console.log(chalk.cyan(`Phase 3 (Classics): ${PHASE_3_IDS.length} movies`));
  console.log(chalk.cyan(`Phase 4 (Chiranjeevi): ${PHASE_4_IDS.length} movies`));
  console.log(chalk.cyan(`Total: ${ALL_IDS.length} movies\n`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  // Fetch movies
  const { data: movies, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, tmdb_id, poster_url, our_rating')
    .in('id', ALL_IDS);
  
  if (fetchError || !movies) {
    console.log(chalk.red(`✗ Error: ${fetchError?.message}`));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${movies.length}/${ALL_IDS.length} movies\n`));
  
  const stats = {
    total: movies.length,
    processed: 0,
    posterAdded: 0,
    ratingAdded: 0,
    noTmdbId: 0,
    failed: 0,
  };
  
  for (const movie of movies) {
    stats.processed++;
    
    const phase = PHASE_2_IDS.includes(movie.id) ? '⭐ P2' :
                  PHASE_3_IDS.includes(movie.id) ? '🎭 P3' : '🎬 P4';
    
    console.log(chalk.cyan(`\n[${stats.processed}/${stats.total}] ${phase} ${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`  Current: Poster=${!!movie.poster_url}, Rating=${!!movie.our_rating}, TMDB=${movie.tmdb_id || 'NULL'}`));
    
    if (!movie.tmdb_id) {
      console.log(chalk.yellow(`  ⚠️  No TMDB ID - cannot enrich`));
      stats.noTmdbId++;
      continue;
    }
    
    try {
      // Fetch from TMDB
      const tmdbUrl = `https://api.themoviedb.org/3/movie/${movie.tmdb_id}?api_key=${process.env.TMDB_API_KEY}`;
      const response = await fetch(tmdbUrl);
      
      if (!response.ok) {
        console.log(chalk.red(`  ✗ TMDB API error: ${response.status}`));
        stats.failed++;
        continue;
      }
      
      const tmdbData = await response.json();
      
      const updates: any = {};
      let changes: string[] = [];
      
      // Add poster if missing
      if (!movie.poster_url && tmdbData.poster_path) {
        updates.poster_url = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
        updates.poster_confidence = 0.8;
        changes.push('Poster');
        stats.posterAdded++;
      }
      
      // Add rating if missing
      if (!movie.our_rating && tmdbData.vote_average) {
        updates.our_rating = parseFloat(tmdbData.vote_average.toFixed(1));
        changes.push('Rating');
        stats.ratingAdded++;
      }
      
      if (changes.length === 0) {
        console.log(chalk.gray(`  → Already complete`));
        continue;
      }
      
      if (EXECUTE) {
        updates.updated_at = new Date().toISOString();
        
        const { error: updateError } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', movie.id);
        
        if (updateError) {
          console.log(chalk.red(`  ✗ Update failed: ${updateError.message}`));
          stats.failed++;
        } else {
          console.log(chalk.green(`  ✓ Updated: ${changes.join(', ')}`));
        }
      } else {
        console.log(chalk.yellow(`  ⊳ Would add: ${changes.join(', ')}`));
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.log(chalk.red(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`));
      stats.failed++;
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('ENRICHMENT SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies:          ${stats.total}`));
  console.log(chalk.white(`Processed:             ${stats.processed}`));
  console.log(chalk.green(`Posters Added:         ${stats.posterAdded}`));
  console.log(chalk.green(`Ratings Added:         ${stats.ratingAdded}`));
  console.log(chalk.yellow(`No TMDB ID:            ${stats.noTmdbId}`));
  console.log(chalk.red(`Failed:                ${stats.failed}`));
  
  const successRate = stats.processed > 0 ? 
    Math.round(((stats.posterAdded + stats.ratingAdded) / (stats.processed * 2)) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:          ${successRate}%`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes made'));
    console.log(chalk.yellow('   Run with --execute to apply'));
  } else {
    console.log(chalk.green('\n✓ Enrichment applied!'));
    console.log(chalk.cyan('\nNext: Run publish script to publish enriched movies'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

enrichMovies()
  .then(() => {
    console.log(chalk.green('✓ Enrichment completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Enrichment failed:'), error);
    process.exit(1);
  });
