#!/usr/bin/env npx tsx
/**
 * Re-attribute Correct Heroes
 * 
 * For movies where we removed incorrect hero attribution,
 * now find and add the correct male lead actor.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');

// Movies that were fixed (hero removed) and need correct hero
const MOVIES_TO_FIX = [
  { id: '98bb4726-2efb-47fb-ba2b-8d754dc000d7', title: 'Ranger', year: 2026 },
  { id: '9767447a-4084-4e79-9633-0717a00e3e38', title: 'VVAN', year: 2026 },
  { id: 'a6e90e17-87ba-452b-8e42-f0f5629f6959', title: 'The Girlfriend', year: 2025 },
  { id: 'ce2290ce-e813-4c31-ae80-e1d7ec5aead3', title: 'Fear', year: 2024 },
  { id: '2bf9a911-89ad-4f8f-be79-ad90f0d1a5ee', title: 'Rush', year: 2024 },
  { id: 'fbd020cb-bc9b-4680-b0c8-b555760a7a3a', title: 'Anthima Theerpu', year: 2024 },
  { id: '35514c0c-110a-40dc-b06f-21a5972f7133', title: '105 Minuttess', year: 2024 },
  { id: 'd1d9e511-7304-458e-a817-b39c2088ed26', title: 'Satyabhama', year: 2024 },
  { id: 'eddff649-b360-4fe3-8592-e7291c0beeff', title: 'Tom And Jerry', year: 2024 },
  { id: '24166679-2203-4ffb-97f7-48e25b85db71', title: 'Aranmanai 4', year: 2024 },
  { id: '0c45340d-f37b-4533-a1e2-aa6606fb9ecf', title: 'Sikandar Ka Muqaddar', year: 2024 },
  { id: '1f8fa34e-41ed-4a79-8581-421273cd1d21', title: 'The Trial', year: 2023 },
  { id: '7e667857-1914-4376-aff9-235e6c44de5a', title: 'The Eye', year: 2023 },
  { id: 'cdb7d075-9dc2-4ddf-8fcf-43f14d1c8380', title: 'Ghosty', year: 2023 },
  { id: 'f120b7da-6bd9-40da-90d4-f65d523e7b8a', title: 'Karungaapiyam', year: 2023 },
  { id: '710e3e49-c51b-477c-ba61-ab35d83a27ad', title: 'Plan A Plan B', year: 2022 },
];

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  credits?: {
    cast: Array<{
      name: string;
      character: string;
      gender: number; // 1 = female, 2 = male
      order: number;
    }>;
  };
}

async function searchTMDB(title: string, year: number): Promise<TMDBMovie[]> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: title,
    year: year.toString(),
  });

  const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
  if (!response.ok) return [];
  
  const data = await response.json();
  return data.results || [];
}

async function getTMDBCredits(tmdbId: number): Promise<TMDBMovie['credits']> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
  });

  const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/credits?${params}`);
  if (!response.ok) return undefined;
  
  const data = await response.json();
  return data;
}

async function findCorrectHero(title: string, year: number): Promise<string | null> {
  // Search TMDB
  const results = await searchTMDB(title, year);
  if (results.length === 0) return null;

  // Get the first match
  const movie = results[0];
  
  // Get credits
  const credits = await getTMDBCredits(movie.id);
  if (!credits || !credits.cast) return null;

  // Find the first male actor (gender = 2)
  const maleLeads = credits.cast
    .filter(actor => actor.gender === 2) // Male
    .sort((a, b) => a.order - b.order); // Sort by billing order

  if (maleLeads.length === 0) return null;

  return maleLeads[0].name;
}

async function main() {
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            RE-ATTRIBUTE CORRECT HEROES                               ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${EXECUTE ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log(`  Movies to process: ${MOVIES_TO_FIX.length}\n`);

  let found = 0;
  let updated = 0;
  let notFound = 0;

  for (const movie of MOVIES_TO_FIX) {
    console.log(chalk.cyan(`\n  🎬 ${movie.title} (${movie.year})`));
    
    const hero = await findCorrectHero(movie.title, movie.year);
    
    if (hero) {
      console.log(chalk.green(`     ✓ Found hero: ${hero}`));
      found++;
      
      if (EXECUTE) {
        const { error } = await supabase
          .from('movies')
          .update({ hero })
          .eq('id', movie.id);
        
        if (error) {
          console.log(chalk.red(`     ❌ Failed to update: ${error.message}`));
        } else {
          console.log(chalk.green(`     ✅ Updated in database`));
          updated++;
        }
      }
    } else {
      console.log(chalk.yellow(`     ⊘ Hero not found in TMDB`));
      notFound++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY                                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Total movies: ${MOVIES_TO_FIX.length}`);
  console.log(chalk.green(`  Heroes found: ${found}`));
  console.log(chalk.yellow(`  Not found: ${notFound}`));
  
  if (EXECUTE) {
    console.log(chalk.green(`  Successfully updated: ${updated}`));
  } else {
    console.log(chalk.yellow(`\n  Run with --execute to apply changes\n`));
  }
}

main().catch(console.error);
