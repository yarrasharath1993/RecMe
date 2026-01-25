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

// You provided this data earlier:
// Sundaraniki Tondarekkuva	2006	Allari Naresh	5.2	TMDB Poster Gallery

const MOVIE_ID = '06fbeb2c-ab89-423c-9e63-6009e3e96688';
const CORRECT_RATING = 5.2; // From your verified data

async function searchTmdb(title: string, year: number): Promise<string | null> {
  if (!tmdbApiKey) return null;

  const searches = [
    'Sundaraniki Tondarekkuva',
    'Sundaraniki Thondarekkuva', 
    'Sundaraniki Tondara Ekkuva'
  ];

  for (const searchTitle of searches) {
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(searchTitle)}&year=${year}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          if (result.poster_path) {
            return `https://image.tmdb.org/t/p/w500${result.poster_path}`;
          }
        }
      }
    } catch (error) {
      // Continue to next search
    }
  }

  return null;
}

async function main() {
  console.log(chalk.blue('\n🎯 FIXING SUNDARANIKI TONDAREKKUVA - FINAL MOVIE!\n'));

  console.log(chalk.gray('📝 Applying your verified data:'));
  console.log(chalk.gray(`  Rating: ${CORRECT_RATING}`));
  console.log(chalk.gray('  Source: TMDB\n'));

  let updatePayload: any = {
    our_rating: CORRECT_RATING,
    updated_at: new Date().toISOString()
  };

  console.log(chalk.gray('🔍 Searching TMDB for poster (multiple variations)...'));
  const posterUrl = await searchTmdb('Sundaraniki Tondarekkuva', 2006);

  if (posterUrl) {
    updatePayload.poster_url = posterUrl;
    console.log(chalk.green(`  ✓ Found: ${posterUrl.substring(0, 60)}...\n`));
  } else {
    console.log(chalk.yellow(`  ⚠️  Not found automatically\n`));
  }

  const { error } = await supabase
    .from('movies')
    .update(updatePayload)
    .eq('id', MOVIE_ID);

  if (error) {
    console.log(chalk.red(`✗ Update failed: ${error.message}`));
    return;
  }

  console.log(chalk.green('✓ Rating updated to 5.2!\n'));

  if (posterUrl) {
    console.log(chalk.green('🎉 MOVIE IS NOW COMPLETE - READY TO PUBLISH!\n'));
    console.log(chalk.yellow('📤 Next: Run publish script'));
    console.log(chalk.yellow('   npx tsx scripts/publish-44-validated-movies.ts --execute\n'));
  } else {
    console.log(chalk.yellow('⚠️  Still needs poster - manual search required\n'));
    console.log(chalk.cyan('📝 Search options:'));
    console.log(chalk.cyan('   1. TMDB: https://www.themoviedb.org/search?query=Sundaraniki+Tondarekkuva'));
    console.log(chalk.cyan('   2. Google: "Sundaraniki Tondarekkuva 2006 Allari Naresh poster"'));
    console.log(chalk.cyan('   3. IMDb: Search for the movie → Photos\n'));
  }

  console.log(chalk.blue('============================================================\n'));
}

main().catch(console.error);
