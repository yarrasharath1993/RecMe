import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('Supabase credentials not set.'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tmdbMovies = [
  { id: '6dcf4ef0-f5e9-4717-96dd-14513908ce02', title: 'Gopi Goda Meedha Pilli', year: 2006 },
  { id: 'fd10c7b5-1e25-4bcc-b82d-b4c6d1b48485', title: 'Sri Krishnarjuna Vijayam', year: 1996 },
  { id: '86e58157-d33f-48d1-a562-7413efddffd9', title: 'Shubha Lagnam', year: 1994 }
];

async function searchTmdb(title: string, year: number): Promise<string | null> {
  if (!tmdbApiKey) return null;

  try {
    // Try exact search first
    let searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&year=${year}`;
    let response = await fetch(searchUrl);
    let data = await response.json();
    
    if (data.results && data.results.length > 0 && data.results[0].poster_path) {
      return `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
    }

    // Try without year
    searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}`;
    response = await fetch(searchUrl);
    data = await response.json();

    if (data.results && data.results.length > 0) {
      // Filter by year proximity
      const match = data.results.find((r: any) => {
        const releaseYear = r.release_date ? parseInt(r.release_date.split('-')[0]) : 0;
        return Math.abs(releaseYear - year) <= 1;
      });

      if (match && match.poster_path) {
        return `https://image.tmdb.org/t/p/w500${match.poster_path}`;
      }
    }
  } catch (error) {
    // Silent fail
  }

  return null;
}

async function main() {
  console.log(chalk.blue('\n🎯 FETCHING TMDB POSTERS (3 movies)\n'));

  let successCount = 0;
  let failCount = 0;

  for (const movie of tmdbMovies) {
    console.log(chalk.cyan(`${movie.title} (${movie.year})`));
    console.log(chalk.gray(`  🔍 Searching TMDB...`));

    const posterUrl = await searchTmdb(movie.title, movie.year);

    if (posterUrl) {
      console.log(chalk.green(`  ✓ Found: ${posterUrl.substring(0, 60)}...`));

      const { error } = await supabase
        .from('movies')
        .update({ poster_url: posterUrl, updated_at: new Date().toISOString() })
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`  ✗ Update failed: ${error.message}`));
        failCount++;
      } else {
        console.log(chalk.green(`  ✓ Added to database`));
        successCount++;
      }
    } else {
      console.log(chalk.red(`  ✗ Not found on TMDB`));
      failCount++;
    }

    console.log('');
  }

  console.log(chalk.blue('============================================================'));
  console.log(chalk.blue('TMDB FETCH SUMMARY'));
  console.log(chalk.blue('============================================================\n'));
  console.log(chalk.cyan(`Total:     3`));
  console.log(chalk.green(`Success:   ${successCount}`));
  console.log(chalk.red(`Failed:    ${failCount}\n`));

  if (successCount > 0) {
    console.log(chalk.green(`🎉 ${successCount} TMDB posters fetched!\n`));
  }

  console.log(chalk.blue('============================================================\n'));
}

main().catch(console.error);
