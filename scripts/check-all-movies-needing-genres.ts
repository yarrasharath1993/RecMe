import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllMoviesNeedingGenres() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║        COMPREHENSIVE CHECK: MOVIES NEEDING GENRES (Batch 5+)         ║
╚═══════════════════════════════════════════════════════════════════════╝
`);

  // Get all movies and check genres status
  const { data: allMovies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, genres, slug')
    .order('release_year', { ascending: false });

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  console.log(`  Total movies in database: ${allMovies?.length || 0}\n`);

  // Filter movies with null or empty genres
  const moviesNeedingGenres = allMovies?.filter(movie => 
    !movie.genres || movie.genres.length === 0
  ) || [];

  console.log(`  Movies needing genres: ${moviesNeedingGenres.length}\n`);

  if (moviesNeedingGenres.length > 0) {
    console.log(`  Sample (first 100 by recent year):\n`);
    moviesNeedingGenres.slice(0, 100).forEach((movie, idx) => {
      const tmdbStatus = movie.tmdb_id ? '✓ TMDB' : '✗ No TMDB';
      console.log(`  ${(idx + 1001).toString().padStart(4)}. ${movie.title_en} (${movie.release_year}) [${tmdbStatus}]`);
      console.log(`        http://localhost:3000/movies/${movie.slug}`);
    });
  } else {
    console.log(`  🎉 All movies have genres!\n`);
  }
}

checkAllMoviesNeedingGenres();
