import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CHIRANJEEVI_ID = 147079;

async function summary() {
  const { data: movies, count } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, slug', { count: 'exact' })
    .ilike('hero', '%Chiranjeevi%')
    .order('release_year', { ascending: false });

  console.log('\n=== CHIRANJEEVI FILMOGRAPHY SUMMARY ===\n');
  console.log(`Total films in DB: ${count}`);
  
  const withTmdb = movies?.filter(m => m.tmdb_id) || [];
  const withoutTmdb = movies?.filter(m => !m.tmdb_id) || [];
  
  console.log(`With TMDB ID: ${withTmdb.length}`);
  console.log(`Without TMDB ID: ${withoutTmdb.length}`);
  
  if (withoutTmdb.length > 0) {
    console.log('\nFilms without TMDB ID:');
    withoutTmdb.slice(0, 10).forEach(m => {
      console.log(`  - ${m.title_en} (${m.release_year})`);
    });
    if (withoutTmdb.length > 10) {
      console.log(`  ... and ${withoutTmdb.length - 10} more`);
    }
  }
  
  // Check ghost entries (films where Chiranjeevi is not in TMDB cast)
  console.log('\nVerifying TMDB linkage...');
  let verified = 0;
  let ghostEntries: any[] = [];
  
  // Sample check - first 20 films with TMDB ID
  for (const movie of withTmdb.slice(0, 20)) {
    const url = `https://api.themoviedb.org/3/movie/${movie.tmdb_id}/credits?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    const hasChiru = data.cast?.some((c: any) => c.id === CHIRANJEEVI_ID);
    if (hasChiru) {
      verified++;
    } else {
      ghostEntries.push(movie);
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`Verified (Chiranjeevi in cast): ${verified}/20 sampled`);
  
  if (ghostEntries.length > 0) {
    console.log(`\nPotential issues (Chiranjeevi not in TMDB cast):`);
    ghostEntries.forEach(m => {
      console.log(`  - ${m.title_en} (${m.release_year}) - TMDB: ${m.tmdb_id}`);
    });
  } else {
    console.log('\n✓ All sampled films have Chiranjeevi properly linked!');
  }
  
  // Year distribution
  const yearDist: Record<string, number> = {};
  movies?.forEach(m => {
    const decade = Math.floor(m.release_year / 10) * 10;
    yearDist[`${decade}s`] = (yearDist[`${decade}s`] || 0) + 1;
  });
  
  console.log('\nDecade distribution:');
  Object.entries(yearDist).sort().forEach(([decade, count]) => {
    console.log(`  ${decade}: ${count} films`);
  });
}

summary();
