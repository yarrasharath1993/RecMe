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

interface MovieToFetch {
  title: string;
  altTitle?: string;
  year: number;
  hero: string;
  currentRating: number;
}

const moviesToFetch: MovieToFetch[] = [
  { title: 'Marana Porali', altTitle: 'Poraali', year: 2011, hero: 'Sasikumar', currentRating: 6.8 },
  { title: 'Kalabha Mazha', year: 2011, hero: 'Sreejith Vijay', currentRating: 5.0 },
  { title: 'Shubhapradam', altTitle: 'Subhapradam', year: 2010, hero: 'Allari Naresh', currentRating: 6.1 },
  { title: 'Betting Bangaraju', altTitle: 'Betting Bangarraju', year: 2010, hero: 'Allari Naresh', currentRating: 5.8 },
  { title: 'Gunda Gardi', year: 1997, hero: 'Aditya Pancholi', currentRating: 4.2 }
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
    // Silent fail, try next source
  }

  return null;
}

async function main() {
  console.log(chalk.blue('\n🎯 FETCHING POSTERS FOR 5 QUICK-WIN MOVIES\n'));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < moviesToFetch.length; i++) {
    const movie = moviesToFetch[i];
    console.log(chalk.cyan(`[${i + 1}/5] ${movie.title} (${movie.year}) - ${movie.hero}`));

    // First, find the movie in database
    const { data: existingMovie, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, slug, poster_url')
      .ilike('title_en', `%${movie.title}%`)
      .eq('release_year', movie.year)
      .maybeSingle();

    if (fetchError || !existingMovie) {
      console.log(chalk.red(`  ✗ Movie not found in database`));
      failCount++;
      continue;
    }

    if (existingMovie.poster_url) {
      console.log(chalk.yellow(`  ⊳ Already has poster: ${existingMovie.poster_url.substring(0, 50)}...`));
      successCount++;
      continue;
    }

    console.log(chalk.gray(`  ID: ${existingMovie.id}`));

    // Try primary title
    let posterUrl = await searchTmdbForPoster(movie.title, movie.year);

    // Try alternate title if primary fails
    if (!posterUrl && movie.altTitle) {
      console.log(chalk.gray(`  Trying alternate title: ${movie.altTitle}...`));
      posterUrl = await searchTmdbForPoster(movie.altTitle, movie.year);
    }

    if (posterUrl) {
      console.log(chalk.green(`  ✓ Found poster via TMDB`));
      console.log(chalk.gray(`    ${posterUrl.substring(0, 60)}...`));

      const { error: updateError } = await supabase
        .from('movies')
        .update({ 
          poster_url: posterUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMovie.id);

      if (updateError) {
        console.log(chalk.red(`  ✗ Failed to update: ${updateError.message}`));
        failCount++;
      } else {
        console.log(chalk.green(`  ✓ Poster added to database`));
        successCount++;
      }
    } else {
      console.log(chalk.red(`  ✗ No poster found`));
      console.log(chalk.yellow(`    Manual search needed: "${movie.title} ${movie.year} ${movie.hero} poster"`));
      failCount++;
    }

    console.log('');
  }

  console.log(chalk.blue('============================================================'));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('============================================================\n'));
  console.log(chalk.cyan(`Total Movies:          5`));
  console.log(chalk.green(`Posters Added:         ${successCount}`));
  console.log(chalk.red(`Failed/Manual Needed:  ${failCount}\n`));

  if (successCount === 5) {
    console.log(chalk.green('🎉 ALL POSTERS FOUND!\n'));
    console.log(chalk.yellow('📤 Next: Publish these movies'));
    console.log(chalk.yellow('   npx tsx scripts/publish-44-validated-movies.ts --execute\n'));
  } else if (successCount > 0) {
    console.log(chalk.yellow('⚠️  Some posters found, others need manual search\n'));
    console.log(chalk.cyan('📝 For movies that failed:'));
    console.log(chalk.cyan('   1. Google: "[Movie Name] [Year] poster"'));
    console.log(chalk.cyan('   2. Right-click image → Copy Image Address'));
    console.log(chalk.cyan('   3. Use apply-manual-fixes.ts to add\n'));
  } else {
    console.log(chalk.red('❌ No posters found automatically\n'));
    console.log(chalk.yellow('Manual search required for all 5 movies'));
  }

  console.log(chalk.blue('============================================================\n'));
}

main().catch(console.error);
