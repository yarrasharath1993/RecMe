import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import slugify from 'slugify';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('Supabase credentials not set.'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MovieData {
  title: string;
  altTitle?: string;
  year: number;
  hero: string;
  rating: number;
  source: string;
  notes?: string;
}

const movies: MovieData[] = [
  {
    title: 'Sundaraniki Tondarekkuva',
    altTitle: 'సుందరానికి తొందరెక్కువ',
    year: 2006,
    hero: 'Allari Naresh',
    rating: 5.2,
    source: 'TMDB',
    notes: 'Telugu title correction'
  },
  {
    title: 'Gopi – Goda Meedha Pilli',
    year: 2006,
    hero: 'Allari Naresh',
    rating: 5.4,
    source: 'TMDB'
  },
  {
    title: 'Angala Parameswari',
    year: 2002,
    hero: 'Roja',
    rating: 5.8,
    source: 'IMDb'
  },
  {
    title: 'Shri Krishnarjuna Vijayam',
    year: 1996,
    hero: 'Balakrishna',
    rating: 7.4,
    source: 'TMDB',
    notes: 'Mythological - Singeetam Srinivasa Rao'
  },
  {
    title: 'Raja Muthirai',
    year: 1995,
    hero: 'Arun Pandian',
    rating: 6.0,
    source: 'IMDb'
  },
  {
    title: 'Shubha Lagnam',
    year: 1994,
    hero: 'Jagapathi Babu',
    rating: 7.9,
    source: 'TMDB',
    notes: 'HIGHEST RATED - Cult classic family drama'
  },
  {
    title: 'Shubha Muhurtam',
    year: 1983,
    hero: 'Murali Mohan',
    rating: 6.5,
    source: 'IMDb'
  },
  {
    title: 'Parvathi Parameshwarulu',
    altTitle: 'Paravathi Parameshwarulu',
    year: 1981,
    hero: 'Chandra Mohan',
    rating: 6.8,
    source: 'IndianCine.ma',
    notes: 'Title spelling corrected'
  },
  {
    title: 'Rakta Sambandham',
    year: 1980,
    hero: 'Murali Mohan',
    rating: 7.1,
    source: 'IMDb'
  },
  {
    title: 'Agni Sanskaram',
    year: 1980,
    hero: 'Gummadi',
    rating: 6.2,
    source: 'IndianCine.ma'
  }
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

const DRY_RUN = !process.argv.includes('--execute');

async function main() {
  console.log(chalk.blue('\n🎯 APPLYING FINAL 10 MOVIES - PATH TO 100%!\n'));
  
  if (DRY_RUN) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made'));
    console.log(chalk.yellow('   Run with --execute to apply changes\n'));
  }

  let successCount = 0;
  let errorCount = 0;
  let postersFetchedCount = 0;
  let postersFailedCount = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    console.log(chalk.cyan(`[${i + 1}/10] ${movie.title} (${movie.year}) - ${movie.hero}`));
    if (movie.notes) {
      console.log(chalk.gray(`  📝 ${movie.notes}`));
    }
    console.log(chalk.gray(`  Source: ${movie.source}`));

    // Find movie in database by title (try both versions if alt title exists)
    let existing: any = null;
    let fetchError: any = null;

    // Try primary title
    const { data: data1, error: error1 } = await supabase
      .from('movies')
      .select('id, title_en, slug, our_rating, poster_url, release_year')
      .ilike('title_en', `%${movie.title}%`)
      .eq('release_year', movie.year)
      .maybeSingle();

    if (data1) {
      existing = data1;
    } else if (movie.altTitle) {
      // Try alternate title
      const { data: data2, error: error2 } = await supabase
        .from('movies')
        .select('id, title_en, slug, our_rating, poster_url, release_year')
        .ilike('title_en', `%${movie.altTitle}%`)
        .eq('release_year', movie.year)
        .maybeSingle();
      
      if (data2) {
        existing = data2;
      } else {
        fetchError = error2;
      }
    } else {
      fetchError = error1;
    }

    if (!existing) {
      console.log(chalk.red(`  ✗ Movie not found in database`));
      errorCount++;
      console.log('');
      continue;
    }

    console.log(chalk.gray(`  ID: ${existing.id}`));
    console.log(chalk.yellow(`  Current: "${existing.title_en}" | Rating: ${existing.our_rating || 'NULL'} | Poster: ${existing.poster_url ? 'YES' : 'NO'}`));

    let updatePayload: any = {};
    let changes: string[] = [];

    // Check title change (prefer standardized title)
    if (existing.title_en !== movie.title && movie.title !== movie.altTitle) {
      const newSlug = slugify(movie.title, { lower: true, strict: true }) + `-${movie.year}`;
      
      // Check for slug conflicts
      const { data: conflictCheck } = await supabase
        .from('movies')
        .select('id, title_en')
        .eq('slug', newSlug)
        .neq('id', existing.id)
        .maybeSingle();

      if (!conflictCheck) {
        updatePayload.title_en = movie.title;
        updatePayload.slug = newSlug;
        changes.push(`Title: ${existing.title_en} → ${movie.title}`);
      }
    }

    // Update rating
    if (existing.our_rating !== movie.rating) {
      updatePayload.our_rating = movie.rating;
      changes.push(`Rating: ${existing.our_rating || 'NULL'} → ${movie.rating}`);
    }

    // Fetch poster if not present
    if (!existing.poster_url) {
      console.log(chalk.gray(`  🔍 Fetching poster from ${movie.source}...`));
      
      let posterUrl: string | null = null;
      
      if (movie.source === 'TMDB') {
        posterUrl = await searchTmdbForPoster(movie.title, movie.year);
      }
      
      if (posterUrl) {
        updatePayload.poster_url = posterUrl;
        changes.push(`Poster: Added from ${movie.source}`);
        postersFetchedCount++;
        console.log(chalk.green(`  ✓ Poster found: ${posterUrl.substring(0, 50)}...`));
      } else {
        console.log(chalk.yellow(`  ⚠️  Poster not auto-fetched (${movie.source}), needs manual`));
        postersFailedCount++;
      }
    } else {
      console.log(chalk.gray(`  ⊳ Already has poster`));
    }

    if (Object.keys(updatePayload).length === 0) {
      console.log(chalk.gray(`  ⊳ No changes needed\n`));
      successCount++;
      continue;
    }

    // Display changes
    changes.forEach(change => console.log(chalk.green(`  → ${change}`)));

    if (DRY_RUN) {
      console.log(chalk.cyan(`  ⊳ DRY RUN - Would update\n`));
      successCount++;
    } else {
      updatePayload.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('movies')
        .update(updatePayload)
        .eq('id', existing.id);

      if (updateError) {
        console.log(chalk.red(`  ✗ Update failed: ${updateError.message}\n`));
        errorCount++;
      } else {
        console.log(chalk.green(`  ✓ Updated successfully\n`));
        successCount++;
      }
    }
  }

  console.log(chalk.blue('============================================================'));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('============================================================\n'));
  console.log(chalk.cyan(`Total Movies:            ${movies.length}`));
  console.log(chalk.green(`Success:                 ${successCount}`));
  console.log(chalk.red(`Errors:                  ${errorCount}`));
  console.log(chalk.green(`Posters Auto-Fetched:    ${postersFetchedCount}`));
  console.log(chalk.yellow(`Posters Need Manual:     ${postersFailedCount}\n`));

  if (DRY_RUN) {
    console.log(chalk.yellow('📝 DRY RUN completed - no changes made'));
    console.log(chalk.yellow('   Run with --execute to apply changes\n'));
  } else {
    if (successCount === movies.length) {
      console.log(chalk.green('🎉 ALL 10 MOVIES UPDATED!\n'));
      console.log(chalk.yellow('📤 Next: Publish these movies'));
      console.log(chalk.yellow('   npx tsx scripts/publish-44-validated-movies.ts --execute\n'));
      
      if (postersFailedCount > 0) {
        console.log(chalk.yellow(`⚠️  ${postersFailedCount} posters need manual addition`));
        console.log(chalk.yellow('   These movies have ratings but need poster URLs\n'));
      }
    } else {
      console.log(chalk.yellow('⚠️  Some updates succeeded, check errors above\n'));
    }
  }

  console.log(chalk.blue('============================================================\n'));
}

main().catch(console.error);
