import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CHIRANJEEVI_ID = 147079;

async function findCorrectTmdbId(title: string, year: number): Promise<number | null> {
  // Search TMDB for Telugu version
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
  const res = await fetch(url);
  const data = await res.json();
  
  // Find Telugu version with Chiranjeevi in cast
  for (const movie of data.results || []) {
    if (movie.original_language !== 'te') continue;
    
    // Verify Chiranjeevi is in cast
    const castUrl = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`;
    const castRes = await fetch(castUrl);
    const castData = await castRes.json();
    
    const hasChiru = castData.cast?.some((c: any) => c.id === CHIRANJEEVI_ID);
    if (hasChiru) {
      return movie.id;
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  return null;
}

async function fixTmdbIds() {
  console.log('\n=== FIXING CHIRANJEEVI TMDB IDs ===\n');
  
  // Get all Chiranjeevi films with TMDB IDs
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, slug')
    .ilike('hero', '%Chiranjeevi%')
    .not('tmdb_id', 'is', null)
    .order('release_year', { ascending: true });
  
  if (!movies) {
    console.log('No movies found');
    return;
  }
  
  console.log(`Found ${movies.length} films with TMDB IDs\n`);
  
  let fixed = 0;
  let correct = 0;
  let notFound = 0;
  let errors: string[] = [];
  
  for (const movie of movies) {
    process.stdout.write(`Checking "${movie.title_en}" (${movie.release_year})... `);
    
    // Check if current TMDB ID is valid for Chiranjeevi
    const currentUrl = `https://api.themoviedb.org/3/movie/${movie.tmdb_id}/credits?api_key=${TMDB_API_KEY}`;
    const currentRes = await fetch(currentUrl);
    const currentData = await currentRes.json();
    
    const hasChiruInCurrent = currentData.cast?.some((c: any) => c.id === CHIRANJEEVI_ID);
    
    if (hasChiruInCurrent) {
      console.log('✓ Correct');
      correct++;
      await new Promise(r => setTimeout(r, 100));
      continue;
    }
    
    // Find correct ID
    const correctId = await findCorrectTmdbId(movie.title_en, movie.release_year);
    
    if (!correctId) {
      console.log('? Not found on TMDB');
      notFound++;
      await new Promise(r => setTimeout(r, 100));
      continue;
    }
    
    if (correctId === movie.tmdb_id) {
      console.log('✓ Already correct');
      correct++;
      continue;
    }
    
    // Update to correct ID
    console.log(`Fixing ${movie.tmdb_id} → ${correctId}`);
    
    const { error } = await supabase
      .from('movies')
      .update({ tmdb_id: correctId })
      .eq('id', movie.id);
    
    if (error) {
      errors.push(`${movie.slug}: ${error.message}`);
    } else {
      fixed++;
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total films: ${movies.length}`);
  console.log(`Already correct: ${correct}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Not found on TMDB: ${notFound}`);
  console.log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
}

fixTmdbIds();
