import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VALID_GENRES = new Set([
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
  'Devotional', 'Mythological', 'Social', 'Political', 'Period', 'Musical'
]);

async function identifyRemaining() {
  console.log('\n🔍 Identifying remaining non-standard genres...\n');
  
  const BATCH_SIZE = 1000;
  let offset = 0;
  const nonStandard: Record<string, any[]> = {};
  
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, genres, slug, tmdb_id')
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error || !data || data.length === 0) break;

    data.forEach(movie => {
      if (!movie.genres) return;
      movie.genres.forEach((genre: string) => {
        if (!VALID_GENRES.has(genre)) {
          if (!nonStandard[genre]) nonStandard[genre] = [];
          nonStandard[genre].push(movie);
        }
      });
    });

    offset += BATCH_SIZE;
    if (data.length < BATCH_SIZE) break;
  }

  console.log(`Found ${Object.keys(nonStandard).length} non-standard genre names:\n`);
  
  Object.entries(nonStandard).sort((a, b) => b[1].length - a[1].length).forEach(([genre, movies]) => {
    console.log(`\n"${genre}" (${movies.length} movies):`);
    movies.slice(0, 5).forEach(m => {
      console.log(`  - ${m.title_en} (${m.release_year}) [${m.genres.join(', ')}]`);
      console.log(`    http://localhost:3000/movies/${m.slug}`);
    });
    if (movies.length > 5) {
      console.log(`  ... and ${movies.length - 5} more`);
    }
  });
  
  console.log('\n✅ Analysis complete\n');
}

identifyRemaining();
