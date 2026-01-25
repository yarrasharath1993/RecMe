import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function analyzeGenreDistribution() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║              GENRE DISTRIBUTION ANALYSIS                              ║
╚═══════════════════════════════════════════════════════════════════════╝
`);

  // Get all movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, genres')
    .order('release_year', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\nSample of 100 most recent movies:\n`);

  // Analyze genre patterns
  const genreCount: Record<string, number> = {};
  const emptyGenres: any[] = [];
  const singleGenre: any[] = [];
  const multiGenre: any[] = [];

  movies?.forEach((movie, idx) => {
    const genres = movie.genres || [];
    
    if (genres.length === 0) {
      emptyGenres.push(movie);
    } else if (genres.length === 1) {
      singleGenre.push(movie);
    } else {
      multiGenre.push(movie);
    }

    // Count each genre
    genres.forEach((genre: string) => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    if (idx < 20) {
      console.log(`  ${(idx + 1).toString().padStart(2)}. ${movie.title_en} (${movie.release_year})`);
      console.log(`      Genres: [${genres.join(', ')}]`);
    }
  });

  console.log(`\n... and ${movies.length - 20} more\n`);

  console.log(`\n╔═══════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                   GENRE STATISTICS                                    ║`);
  console.log(`╚═══════════════════════════════════════════════════════════════════════╝\n`);

  console.log(`  Movies with:
    Empty genres:     ${emptyGenres.length}
    Single genre:     ${singleGenre.length}
    Multiple genres:  ${multiGenre.length}
`);

  console.log(`\n  Top Genres (in sample):\n`);
  Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([genre, count]) => {
      const bar = '█'.repeat(Math.floor(count / 2));
      console.log(`    ${genre.padEnd(20)} ${count.toString().padStart(3)} ${bar}`);
    });

  console.log(`\n✅ Analysis complete!\n`);
}

analyzeGenreDistribution();
