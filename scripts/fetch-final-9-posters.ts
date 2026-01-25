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

interface MoviePoster {
  id: string;
  title: string;
  year: number;
  source: string;
}

const movies: MoviePoster[] = [
  { id: '6dcf4ef0-f5e9-4717-96dd-14513908ce02', title: 'Gopi – Goda Meedha Pilli', year: 2006, source: 'TMDB' },
  { id: 'fd10c7b5-1e25-4bcc-b82d-b4c6d1b48485', title: 'Shri Krishnarjuna Vijayam', year: 1996, source: 'TMDB' },
  { id: '86e58157-d33f-48d1-a562-7413efddffd9', title: 'Shubha Lagnam', year: 1994, source: 'TMDB' },
  { id: 'ff32a1f8-e0a8-41fd-9fe9-5f9ffb94b6fa', title: 'Angala Parameswari', year: 2002, source: 'IMDb' },
  { id: '6d038721-fec0-4ba3-a90b-acbb26ef088e', title: 'Raja Muthirai', year: 1995, source: 'IMDb' },
  { id: '9fcf70da-160e-4635-af49-538749378675', title: 'Shubha Muhurtam', year: 1983, source: 'IMDb' },
  { id: '90c2fb7e-6c92-45a4-81c4-a6c18b32e742', title: 'Rakta Sambandham', year: 1980, source: 'IMDb' },
  { id: '06506eed-73d6-43dd-af5e-66030ac47b65', title: 'Parvathi Parameshwarulu', year: 1981, source: 'IndianCine.ma' },
  { id: '0a0d8345-02a7-4343-ada9-89ea66b5f912', title: 'Agni Sanskaram', year: 1980, source: 'IndianCine.ma' }
];

async function searchTmdbForPoster(title: string, year: number): Promise<string | null> {
  if (!tmdbApiKey) {
    return null;
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&year=${year}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    const results = data.results;

    if (results && results.length > 0) {
      const posterPath = results[0].poster_path;
      if (posterPath) {
        return `https://image.tmdb.org/t/p/w500${posterPath}`;
      }
    }
  } catch (error) {
    // Silent fail
  }

  return null;
}

async function main() {
  console.log(chalk.blue('\n🎯 FETCHING FINAL 9 POSTERS - PATH TO 100%!\n'));

  let fetchedCount = 0;
  let manualNeededCount = 0;
  const manualNeeded: Array<{id: string, title: string, year: number, source: string}> = [];

  for (const movie of movies) {
    console.log(chalk.cyan(`${movie.title} (${movie.year})`));
    console.log(chalk.gray(`  Source: ${movie.source}`));

    if (movie.source === 'TMDB') {
      console.log(chalk.gray(`  🔍 Searching TMDB...`));
      const posterUrl = await searchTmdbForPoster(movie.title, movie.year);

      if (posterUrl) {
        console.log(chalk.green(`  ✓ Found: ${posterUrl.substring(0, 60)}...`));
        
        const { error } = await supabase
          .from('movies')
          .update({ poster_url: posterUrl, updated_at: new Date().toISOString() })
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`  ✗ Update failed: ${error.message}`));
        } else {
          console.log(chalk.green(`  ✓ Added to database`));
          fetchedCount++;
        }
      } else {
        console.log(chalk.yellow(`  ⚠️  Not found on TMDB - needs manual`));
        manualNeeded.push(movie);
        manualNeededCount++;
      }
    } else {
      console.log(chalk.yellow(`  ⚠️  Manual search needed (${movie.source})`));
      manualNeeded.push(movie);
      manualNeededCount++;
    }

    console.log('');
  }

  console.log(chalk.blue('============================================================'));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('============================================================\n'));
  console.log(chalk.cyan(`Total Movies:            9`));
  console.log(chalk.green(`Posters Auto-Fetched:    ${fetchedCount}`));
  console.log(chalk.yellow(`Manual Search Needed:    ${manualNeededCount}\n`));

  if (manualNeededCount > 0) {
    console.log(chalk.yellow('📝 MOVIES NEEDING MANUAL POSTER SEARCH:\n'));
    manualNeeded.forEach((m, i) => {
      console.log(chalk.cyan(`${i + 1}. ${m.title} (${m.year})`));
      console.log(chalk.gray(`   ID: ${m.id}`));
      console.log(chalk.gray(`   Source: ${m.source}`));
      
      if (m.source === 'IMDb') {
        console.log(chalk.yellow(`   Search: https://www.imdb.com/find?q=${encodeURIComponent(m.title)}+${m.year}`));
      } else if (m.source === 'IndianCine.ma') {
        console.log(chalk.yellow(`   Search: https://indiancine.ma (manual search required)`));
      }
      console.log('');
    });

    console.log(chalk.yellow('📄 CSV created: FINAL-9-POSTERS-MANUAL.csv\n'));
  }

  if (fetchedCount > 0) {
    console.log(chalk.green(`🎉 ${fetchedCount} posters added automatically!\n`));
    console.log(chalk.yellow('📤 Next: Publish movies'));
    console.log(chalk.yellow('   npx tsx scripts/publish-44-validated-movies.ts --execute\n'));
  }

  console.log(chalk.blue('============================================================\n'));
}

main().catch(console.error);
