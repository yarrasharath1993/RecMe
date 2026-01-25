#!/usr/bin/env npx tsx
/**
 * LINK TMDB IDS FOR HIGH-VALUE VALIDATED MOVIES
 * 
 * Searches TMDB and links movies that are missing TMDB IDs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// All high-value movies that need TMDB linking
const MOVIE_IDS = [
  '8182275f-e88d-4453-b855-4bb1695ef80c', // Badrinath (2011)
  '6212f700-84e3-4c84-bedc-570a48747a3d', // Nizhal Thedum Nenjangal (1982)
  '092508fb-f084-443b-aa50-3c6d06b6ec12', // Chennakeshava Reddy (2002)
  '1d57f0ef-c4ed-4b34-b453-b608ce213ba3', // Chaithanya (1991)
  'd20403fb-8432-4565-85c4-961d128206cb', // Well, If You Know Me (2015)
  'f6069bac-c8e0-43a6-9742-22cd0cb22ac1', // Adarsham (1952)
  'f86df043-4436-46ee-a4b6-6889d3b29f2e', // Pathini Deivam (1957)
  '426e74fb-e35c-49c7-b5dd-ec88d9bd53c3', // Padhi Bhakti (1958)
  'aa6a8a7d-f47e-42a0-b938-3145ad479fb3', // Kaathavaraayan (1958)
  '5d95bc5d-9490-4664-abc6-d2a9e29a05a8', // Kuravanji (1960)
  '7f0b003c-b15f-4087-9003-0efc1d959658', // Paarthaal Pasi Theerum (1962)
  '4bf8c217-ffe2-489d-809d-50a499ac3cd1', // Kai Koduttha Dheivam (1964)
  '3bbeed9a-30c4-458c-827a-11f4df9582c4', // Poojaikku Vandha Malar (1965)
  '2142390d-8c14-4236-9aae-eb20edaa95cd', // Shri Krishna Pandaviyam (1966)
  '5d98fdb3-4b6e-4037-a7ea-02794d6a00a4', // Shri Krishnavataram (1967)
  '2ced2102-12ab-4391-9e5b-40ae526c7b11', // Amma Mata (1972)
  'b7aad561-d88c-44b1-bd47-7076d669d0b5', // Jeevana Theeralu (1977)
  'f0b669a6-227e-46c8-bdca-8778aef704d8', // Bangaru Bommalu (1977)
  '2d2300e8-75f4-40fa-9d89-11b728749949', // Karunai Ullam (1978)
  '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31', // Karunamayudu (1978)
  'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e', // Kothala Raayudu (1979)
  'd230d639-8927-40d7-9889-79f95e18d21f', // Sri Rambantu (1979)
  '95639c8c-fad3-4ef9-b2a3-0e1b06040346', // Aaj Ka Goonda Raj (1992)
];

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');

async function searchTMDB(title: string, year: number, language: string = 'te'): Promise<any | null> {
  try {
    // Search TMDB
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=${language}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Return first result
      return data.results[0];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function linkTMDBIds() {
  console.log(chalk.blue.bold('\n🔗 LINK TMDB IDS FOR HIGH-VALUE MOVIES\n'));
  
  if (!TMDB_API_KEY) {
    console.log(chalk.red('✗ TMDB_API_KEY not found in environment'));
    return;
  }
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  // Fetch movies
  const { data: movies, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, hero, director')
    .in('id', MOVIE_IDS)
    .is('tmdb_id', null); // Only movies without TMDB ID
  
  if (fetchError || !movies) {
    console.log(chalk.red(`✗ Error: ${fetchError?.message}`));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${movies.length} movies without TMDB IDs\n`));
  
  const stats = {
    total: movies.length,
    processed: 0,
    linked: 0,
    notFound: 0,
    failed: 0,
  };
  
  for (const movie of movies) {
    stats.processed++;
    
    console.log(chalk.cyan(`\n[${stats.processed}/${stats.total}] ${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`  Hero: ${movie.hero}, Director: ${movie.director}`));
    
    try {
      // Try Telugu search first
      let tmdbResult = await searchTMDB(movie.title_en, movie.release_year, 'te');
      
      // If not found, try English
      if (!tmdbResult) {
        await new Promise(resolve => setTimeout(resolve, 300));
        tmdbResult = await searchTMDB(movie.title_en, movie.release_year, 'en');
      }
      
      // If still not found, try without year
      if (!tmdbResult) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.title_en)}`;
        const response = await fetch(searchUrl);
        if (response.ok) {
          const data = await response.json();
          // Find closest year match
          tmdbResult = data.results?.find((r: any) => 
            Math.abs(parseInt(r.release_date?.substring(0, 4) || '0') - movie.release_year) <= 2
          );
        }
      }
      
      if (tmdbResult) {
        console.log(chalk.green(`  ✓ Found on TMDB: ${tmdbResult.title} (${tmdbResult.release_date?.substring(0, 4)})`));
        console.log(chalk.gray(`    TMDB ID: ${tmdbResult.id}, Rating: ${tmdbResult.vote_average}`));
        
        if (EXECUTE) {
          const { error: updateError } = await supabase
            .from('movies')
            .update({
              tmdb_id: tmdbResult.id,
              poster_url: tmdbResult.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}` : null,
              poster_confidence: tmdbResult.poster_path ? 0.8 : null,
              our_rating: tmdbResult.vote_average ? parseFloat(tmdbResult.vote_average.toFixed(1)) : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', movie.id);
          
          if (updateError) {
            console.log(chalk.red(`    ✗ Update failed: ${updateError.message}`));
            stats.failed++;
          } else {
            console.log(chalk.green(`    ✓ Linked TMDB ID and added poster + rating`));
            stats.linked++;
          }
        } else {
          console.log(chalk.yellow(`    ⊳ Would link TMDB ID: ${tmdbResult.id}`));
          stats.linked++;
        }
      } else {
        console.log(chalk.yellow(`  ⚠️  Not found on TMDB`));
        stats.notFound++;
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 350));
      
    } catch (error) {
      console.log(chalk.red(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`));
      stats.failed++;
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('TMDB LINKING SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies:          ${stats.total}`));
  console.log(chalk.white(`Processed:             ${stats.processed}`));
  console.log(chalk.green(`Successfully Linked:   ${stats.linked}`));
  console.log(chalk.yellow(`Not Found on TMDB:     ${stats.notFound}`));
  console.log(chalk.red(`Failed:                ${stats.failed}`));
  
  const successRate = stats.processed > 0 ? 
    Math.round((stats.linked / stats.processed) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:          ${successRate}%`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes made'));
    console.log(chalk.yellow('   Run with --execute to apply'));
  } else if (stats.linked > 0) {
    console.log(chalk.green(`\n✓ Linked ${stats.linked} movies!`));
    console.log(chalk.cyan('Next: Run publish script to check which movies are ready'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

linkTMDBIds()
  .then(() => {
    console.log(chalk.green('✓ TMDB linking completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ TMDB linking failed:'), error);
    process.exit(1);
  });
