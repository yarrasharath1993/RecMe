/**
 * Verify what image is being shown for Teja and who it actually is
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import fetch from 'node-fetch';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

async function verifyTejaImage() {
  console.log('\n🔍 Verifying Teja image...\n');

  // Check celebrity record
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', 'celeb-teja')
    .single();

  console.log('1️⃣  Celebrity record:');
  console.log('   Name:', celebrity?.name_en);
  console.log('   Image URL:', celebrity?.image_url || 'NULL');
  console.log('   Profile Image:', celebrity?.profile_image_url || 'NULL');

  // Check TMDB ID if exists
  if (celebrity?.tmdb_id) {
    console.log('   TMDB ID:', celebrity.tmdb_id);
    
    // Fetch person from TMDB
    const tmdbUrl = `https://api.themoviedb.org/3/person/${celebrity.tmdb_id}?api_key=${TMDB_API_KEY}`;
    const tmdbResponse = await fetch(tmdbUrl);
    const tmdbData = await tmdbResponse.json() as any;
    
    console.log('\n2️⃣  TMDB Person Data:');
    console.log('   Name:', tmdbData.name);
    console.log('   Known For:', tmdbData.known_for_department);
    console.log('   Profile Path:', tmdbData.profile_path);
    if (tmdbData.profile_path) {
      console.log('   Full Image URL:', `https://image.tmdb.org/t/p/w185${tmdbData.profile_path}`);
    }
    console.log('   Biography:', tmdbData.biography?.substring(0, 100) || 'NULL');
  } else {
    console.log('   No TMDB ID found');
    
    // Search TMDB for "Teja"
    console.log('\n2️⃣  Searching TMDB for "Teja"...');
    const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=Teja`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json() as any;
    
    if (searchData.results && searchData.results.length > 0) {
      console.log('   Found', searchData.results.length, 'results:');
      searchData.results.slice(0, 5).forEach((person: any, idx: number) => {
        console.log(`\n   ${idx + 1}. ${person.name}`);
        console.log(`      TMDB ID: ${person.id}`);
        console.log(`      Known For: ${person.known_for_department}`);
        console.log(`      Profile Path: ${person.profile_path || 'NULL'}`);
        if (person.profile_path) {
          console.log(`      Image URL: https://image.tmdb.org/t/p/w185${person.profile_path}`);
        }
      });
    }
  }

  console.log('\n3️⃣  Checking what movies have TMDB IDs...');
  const { data: tejaMovies } = await supabase
    .from('movies')
    .select('title_en, release_year, director, tmdb_id, tmdb_cast_data, tmdb_crew_data')
    .eq('is_published', true)
    .eq('director', 'Teja')
    .not('tmdb_id', 'is', null)
    .order('release_year', { ascending: false })
    .limit(3);

  if (tejaMovies && tejaMovies.length > 0) {
    console.log('   Sample movies with TMDB data:');
    for (const movie of tejaMovies) {
      console.log(`\n   - ${movie.title_en} (${movie.release_year})`);
      console.log(`     TMDB ID: ${movie.tmdb_id}`);
      
      // Check crew data for director
      if (movie.tmdb_crew_data) {
        const crewArray = Array.isArray(movie.tmdb_crew_data) 
          ? movie.tmdb_crew_data 
          : (movie.tmdb_crew_data as any).crew || [];
        const directors = crewArray.filter((person: any) => person.job === 'Director');
        if (directors.length > 0) {
          console.log('     Director from TMDB:');
          directors.forEach((dir: any) => {
            console.log(`       - ${dir.name} (ID: ${dir.id})`);
            if (dir.profile_path) {
              console.log(`         Image: https://image.tmdb.org/t/p/w185${dir.profile_path}`);
            }
          });
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
}

verifyTejaImage().catch(console.error);
