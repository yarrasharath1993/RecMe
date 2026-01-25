#!/usr/bin/env npx tsx
/**
 * Restore Nagarjuna Movie Associations
 * 
 * Check if movies are using the old duplicate name and fix them
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CURRENT_NAME = 'Akkineni Nagarjuna'; // Current profile name
const POSSIBLE_OLD_NAMES = [
  'Nagarjuna',
  'Nagarjuna Akkineni',
  'Akkineni Nagarjuna',
];

async function restoreMovieAssociations() {
  console.log('🔍 Checking Nagarjuna Movie Associations\n');
  console.log('='.repeat(80));

  const allMovies = new Set();

  // Check for each possible name variation
  for (const name of POSSIBLE_OLD_NAMES) {
    console.log(`\n📋 Checking for: "${name}"\n`);

    // Check as actor
    const { data: moviesAsActor, count: actorCount } = await supabase
      .from('movies')
      .select('id, title_en, title_te, release_date, actors', { count: 'exact' })
      .contains('actors', [name]);

    if (actorCount && actorCount > 0) {
      console.log(`   Found ${actorCount} movies as actor:`);
      moviesAsActor?.forEach((movie: any) => {
        console.log(`   - ${movie.title_en} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
        allMovies.add(movie.id);
      });
    }

    // Check as producer
    const { data: moviesAsProducer, count: producerCount } = await supabase
      .from('movies')
      .select('id, title_en, release_date, producers', { count: 'exact' })
      .contains('producers', [name]);

    if (producerCount && producerCount > 0) {
      console.log(`   Found ${producerCount} movies as producer:`);
      moviesAsProducer?.forEach((movie: any) => {
        console.log(`   - ${movie.title_en} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
        allMovies.add(movie.id);
      });
    }

    // Check as director
    const { data: moviesAsDirector, count: directorCount } = await supabase
      .from('movies')
      .select('id, title_en, release_date', { count: 'exact' })
      .eq('director', name);

    if (directorCount && directorCount > 0) {
      console.log(`   Found ${directorCount} movies as director:`);
      moviesAsDirector?.forEach((movie: any) => {
        console.log(`   - ${movie.title_en} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
        allMovies.add(movie.id);
      });
    }

    if (!actorCount && !producerCount && !directorCount) {
      console.log(`   No movies found with name "${name}"`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Total unique movies found: ${allMovies.size}`);

  if (allMovies.size > 0) {
    console.log('\n✅ Movie associations are present in database');
    console.log('   The profile should show these movies on the frontend');
    console.log('\n💡 If movies are not showing on the frontend:');
    console.log('   1. Check the API route: /api/profile/[slug]/route.ts');
    console.log('   2. Verify the frontend is querying with correct name');
    console.log('   3. Check EntityProfileLayout component');
  } else {
    console.log('\n⚠️  No movies found for Nagarjuna in database');
    console.log('   This might indicate:');
    console.log('   1. Movies haven\'t been ingested yet');
    console.log('   2. Name format in movies table is different');
    console.log('   3. Data needs to be re-enriched');
  }

  // Check what name format exists in movies table
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 Checking all actor names containing "nagarjuna"...\n');

  const { data: moviesData } = await supabase
    .from('movies')
    .select('actors')
    .not('actors', 'is', null);

  const nagarjunaNames = new Set();
  moviesData?.forEach((movie: any) => {
    if (movie.actors && Array.isArray(movie.actors)) {
      movie.actors.forEach((actor: string) => {
        if (actor.toLowerCase().includes('nagarjuna')) {
          nagarjunaNames.add(actor);
        }
      });
    }
  });

  if (nagarjunaNames.size > 0) {
    console.log('   Found these name variations:');
    Array.from(nagarjunaNames).forEach((name) => {
      console.log(`   - "${name}"`);
    });
  } else {
    console.log('   No movies found with "nagarjuna" in actors array');
  }

  console.log('\n' + '='.repeat(80));
}

restoreMovieAssociations().catch(console.error);
