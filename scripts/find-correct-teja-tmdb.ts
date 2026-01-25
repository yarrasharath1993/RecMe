/**
 * Find the correct TMDB ID for director Teja
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import fetch from 'node-fetch';

config({ path: resolve(process.cwd(), '.env.local') });

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

async function findCorrectTeja() {
  console.log('\n🔍 Searching TMDB for correct director Teja...\n');

  // Search for Teja
  const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=Teja`;
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json() as any;

  console.log('Found', searchData.results.length, 'results for "Teja":\n');

  for (let i = 0; i < Math.min(10, searchData.results.length); i++) {
    const person = searchData.results[i];
    console.log(`${i + 1}. ${person.name}`);
    console.log(`   TMDB ID: ${person.id}`);
    console.log(`   Known For: ${person.known_for_department}`);
    console.log(`   Popularity: ${person.popularity}`);
    
    if (person.profile_path) {
      console.log(`   Image: https://image.tmdb.org/t/p/w185${person.profile_path}`);
    } else {
      console.log('   Image: NULL');
    }

    // Get known for movies
    if (person.known_for && person.known_for.length > 0) {
      console.log('   Known for movies:');
      person.known_for.forEach((movie: any) => {
        console.log(`      - ${movie.title || movie.name} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
      });
    }
    console.log();
  }

  // Also search for "Teja Telugu director"
  console.log('\n' + '='.repeat(60));
  console.log('Searching for "Teja Telugu director"...\n');
  
  const searchUrl2 = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=Teja Telugu director`;
  const searchResponse2 = await fetch(searchUrl2);
  const searchData2 = await searchResponse2.json() as any;

  console.log('Found', searchData2.results.length, 'results:\n');

  for (let i = 0; i < Math.min(5, searchData2.results.length); i++) {
    const person = searchData2.results[i];
    console.log(`${i + 1}. ${person.name}`);
    console.log(`   TMDB ID: ${person.id}`);
    console.log(`   Known For: ${person.known_for_department}`);
    if (person.profile_path) {
      console.log(`   Image: https://image.tmdb.org/t/p/w185${person.profile_path}`);
    }
    console.log();
  }

  // Check if we can find by checking Jayam (2002) crew
  console.log('\n' + '='.repeat(60));
  console.log('Checking "Jayam" (2002) movie crew for director Teja...\n');
  
  const jayamSearch = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=Jayam&year=2002&language=te`;
  const jayamSearchResponse = await fetch(jayamSearch);
  const jayamData = await jayamSearchResponse.json() as any;

  if (jayamData.results && jayamData.results.length > 0) {
    for (const movie of jayamData.results.slice(0, 3)) {
      console.log(`Movie: ${movie.title} (${movie.release_date?.substring(0, 4)})`);
      console.log(`TMDB ID: ${movie.id}\n`);
      
      // Get credits
      const creditsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`;
      const creditsResponse = await fetch(creditsUrl);
      const creditsData = await creditsResponse.json() as any;
      
      const directors = creditsData.crew.filter((person: any) => person.job === 'Director');
      if (directors.length > 0) {
        console.log('Directors:');
        directors.forEach((dir: any) => {
          console.log(`   - ${dir.name} (TMDB ID: ${dir.id})`);
          if (dir.profile_path) {
            console.log(`     Image: https://image.tmdb.org/t/p/w185${dir.profile_path}`);
          }
        });
        console.log();
      }
    }
  }
}

findCorrectTeja().catch(console.error);
