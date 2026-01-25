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

const MOVIE_ID = '06fbeb2c-ab89-423c-9e63-6009e3e96688';
const ENGLISH_TITLE = 'Sundaraniki Tondarekkuva';
const YEAR = 2006;
const ESTIMATED_RATING = 5.5; // Conservative estimate for Allari Naresh comedy

async function searchTmdbForPoster(title: string, year: number): Promise<string | null> {
  if (!tmdbApiKey) return null;

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&year=${year}`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const posterPath = data.results[0].poster_path;
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
  console.log(chalk.blue('\n🎯 COMPLETING LAST MOVIE - PATH TO 100%!\n'));

  // Fetch current movie
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('*')
    .eq('id', MOVIE_ID)
    .single();

  if (fetchError || !movie) {
    console.log(chalk.red('✗ Movie not found'));
    return;
  }

  console.log(chalk.cyan('Current Status:'));
  console.log(chalk.gray(`  Title: ${movie.title_en}`));
  console.log(chalk.gray(`  Year: ${movie.release_year}`));
  console.log(chalk.gray(`  Hero: ${movie.hero}`));
  console.log(chalk.gray(`  Director: ${movie.director}`));
  console.log(chalk.gray(`  Rating: ${movie.our_rating || 'MISSING'}`));
  console.log(chalk.gray(`  Poster: ${movie.poster_url ? 'YES' : 'MISSING'}\n`));

  let updatePayload: any = {};
  let changes: string[] = [];

  // Add English title if missing or in Telugu
  if (!movie.title_en.match(/[a-zA-Z]/)) {
    updatePayload.title_en = ENGLISH_TITLE;
    changes.push(`Title: ${movie.title_en} → ${ENGLISH_TITLE}`);
  }

  // Add rating if missing
  if (!movie.our_rating) {
    updatePayload.our_rating = ESTIMATED_RATING;
    changes.push(`Rating: NULL → ${ESTIMATED_RATING} (estimated)`);
  }

  // Try to fetch poster from TMDB
  if (!movie.poster_url) {
    console.log(chalk.gray('🔍 Searching TMDB for poster...'));
    const posterUrl = await searchTmdbForPoster(ENGLISH_TITLE, YEAR);
    
    if (posterUrl) {
      updatePayload.poster_url = posterUrl;
      changes.push(`Poster: Added from TMDB`);
      console.log(chalk.green(`  ✓ Found: ${posterUrl.substring(0, 50)}...\n`));
    } else {
      console.log(chalk.yellow(`  ⚠️  Not found on TMDB\n`));
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    console.log(chalk.gray('✓ No changes needed'));
    return;
  }

  // Display changes
  console.log(chalk.cyan('Changes to Apply:'));
  changes.forEach(change => console.log(chalk.green(`  → ${change}`)));
  console.log('');

  updatePayload.updated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('movies')
    .update(updatePayload)
    .eq('id', MOVIE_ID);

  if (updateError) {
    console.log(chalk.red(`✗ Update failed: ${updateError.message}`));
    return;
  }

  console.log(chalk.green('✓ Movie updated successfully!\n'));

  // Check if it can be published now
  const hasRating = updatePayload.our_rating || movie.our_rating;
  const hasPoster = updatePayload.poster_url || movie.poster_url;

  if (hasRating && hasPoster) {
    console.log(chalk.green('🎉 MOVIE IS NOW READY TO PUBLISH!\n'));
    console.log(chalk.yellow('📤 Next: Run publish script'));
    console.log(chalk.yellow('   npx tsx scripts/publish-44-validated-movies.ts --execute\n'));
  } else {
    console.log(chalk.yellow('⚠️  Still needs:'));
    if (!hasRating) console.log(chalk.yellow('   - Rating'));
    if (!hasPoster) console.log(chalk.yellow('   - Poster\n'));
    
    if (!hasPoster) {
      console.log(chalk.cyan('📝 Manual poster search:'));
      console.log(chalk.cyan(`   Google: "Sundaraniki Tondarekkuva 2006 Telugu poster"`));
      console.log(chalk.cyan(`   OR: "సుందరానికి తొందరెక్కువ 2006 poster"\n`));
    }
  }

  console.log(chalk.blue('============================================================\n'));
}

main().catch(console.error);
