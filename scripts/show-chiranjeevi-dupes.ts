import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { detectSpellingDuplicates } from './lib/filmography-cross-validator';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function showDuplicates() {
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, tmdb_id, slug, poster_url, is_published')
    .ilike('hero', '%Chiranjeevi%');

  const dupes = detectSpellingDuplicates(movies as any);
  
  console.log('\n=== CHIRANJEEVI SPELLING DUPLICATES ===\n');
  
  for (let i = 0; i < dupes.length; i++) {
    const d = dupes[i];
    console.log(`${i + 1}. "${d.movie1.title_en}" (${d.movie1.release_year})`);
    console.log(`   vs "${d.movie2.title_en}" (${d.movie2.release_year})`);
    console.log(`   Similarity: ${(d.similarity * 100).toFixed(0)}%`);
    console.log(`   Movie 1: slug=${d.movie1.slug}, tmdb_id=${d.movie1.tmdb_id || 'null'}`);
    console.log(`   Movie 2: slug=${d.movie2.slug}, tmdb_id=${d.movie2.tmdb_id || 'null'}`);
    console.log('');
  }
  
  console.log(`Total: ${dupes.length} duplicate pairs\n`);
}

showDuplicates();
