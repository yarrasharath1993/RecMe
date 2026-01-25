import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkNextBatchMovies() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║           CHECKING FOR NEXT BATCH OF MOVIES (After 1000)             ║
╚═══════════════════════════════════════════════════════════════════════╝
`);

  // Get movies needing genres
  const { data: moviesWithoutGenres, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, slug')
    .is('genres', null)
    .order('release_year', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  console.log(`  Total movies without genres: ${moviesWithoutGenres?.length || 0}\n`);

  if (moviesWithoutGenres && moviesWithoutGenres.length > 0) {
    console.log(`  Recent movies needing genres (first 50):\n`);
    moviesWithoutGenres.slice(0, 50).forEach((movie, idx) => {
      const tmdbStatus = movie.tmdb_id ? '✓ TMDB' : '✗ No TMDB';
      console.log(`  ${(idx + 1).toString().padStart(3)}. ${movie.title_en} (${movie.release_year}) [${tmdbStatus}]`);
      console.log(`       http://localhost:3000/movies/${movie.slug}`);
    });

    // Year distribution
    const yearDistribution: Record<string, number> = {};
    moviesWithoutGenres.forEach(movie => {
      const year = movie.release_year?.toString() || 'Unknown';
      yearDistribution[year] = (yearDistribution[year] || 0) + 1;
    });

    console.log(`\n  Year Distribution (Top 10):\n`);
    Object.entries(yearDistribution)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .slice(0, 10)
      .forEach(([year, count]) => {
        console.log(`    ${year}: ${count} movies`);
      });

    // TMDB coverage
    const withTmdb = moviesWithoutGenres.filter(m => m.tmdb_id).length;
    const withoutTmdb = moviesWithoutGenres.length - withTmdb;
    const percentWithTmdb = ((withTmdb / moviesWithoutGenres.length) * 100).toFixed(0);

    console.log(`\n  TMDB Coverage:\n`);
    console.log(`    ✓ With TMDB ID:    ${withTmdb} (${percentWithTmdb}%)`);
    console.log(`    ✗ Without TMDB ID: ${withoutTmdb}`);
  }

  console.log(`\n✅ Check complete!\n`);
}

checkNextBatchMovies();
