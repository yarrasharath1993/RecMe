/**
 * Check for duplicate Srikanth profiles
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSrikanthDuplicates() {
  console.log(chalk.cyan('\n🔍 Checking for duplicate Srikanth profiles\n'));

  // Search for celebrities with "srikanth" in name
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, slug, gender, occupation, is_published, profile_image, tmdb_id')
    .or('name_en.ilike.%srikanth%,name_te.ilike.%srikanth%')
    .order('name_en');

  if (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    return;
  }

  if (!celebrities || celebrities.length === 0) {
    console.log(chalk.yellow('No celebrities found with "srikanth" in name'));
    return;
  }

  console.log(chalk.blue(`Found ${celebrities.length} celebrity(ies) with "srikanth" in name:\n`));

  celebrities.forEach((celeb, index) => {
    console.log(chalk.white(`${index + 1}. ${celeb.name_en}${celeb.name_te ? ` (${celeb.name_te})` : ''}`));
    console.log(chalk.gray(`   ID: ${celeb.id}`));
    console.log(chalk.gray(`   Slug: ${celeb.slug || 'N/A'}`));
    console.log(chalk.gray(`   Gender: ${celeb.gender || 'N/A'}`));
    console.log(chalk.gray(`   Occupation: ${celeb.occupation || 'N/A'}`));
    console.log(chalk.gray(`   Published: ${celeb.is_published ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`   TMDB ID: ${celeb.tmdb_id || 'N/A'}`));
    console.log(chalk.gray(`   Profile Image: ${celeb.profile_image ? 'Yes' : 'No'}`));
    console.log('');
  });

  // Check for movies with "srikanth" as hero
  console.log(chalk.cyan('\n📽️  Checking movies with "srikanth" as hero:\n'));

  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('id, title_en, hero, release_year, slug')
    .ilike('hero', '%srikanth%')
    .eq('is_published', true)
    .order('release_year', { ascending: false })
    .limit(20);

  if (moviesError) {
    console.error(chalk.red(`Error fetching movies: ${moviesError.message}`));
    return;
  }

  if (movies && movies.length > 0) {
    console.log(chalk.blue(`Found ${movies.length} movies (showing first 20):\n`));
    
    // Group by hero name
    const heroGroups = new Map<string, typeof movies>();
    movies.forEach(movie => {
      if (movie.hero) {
        const heroName = movie.hero.toLowerCase();
        if (!heroGroups.has(heroName)) {
          heroGroups.set(heroName, []);
        }
        heroGroups.get(heroName)!.push(movie);
      }
    });

    heroGroups.forEach((movieList, heroName) => {
      console.log(chalk.white(`\n${heroName} (${movieList.length} movies):`));
      movieList.slice(0, 5).forEach(movie => {
        console.log(chalk.gray(`  - ${movie.title_en} (${movie.release_year})`));
      });
      if (movieList.length > 5) {
        console.log(chalk.gray(`  ... and ${movieList.length - 5} more`));
      }
    });
  } else {
    console.log(chalk.yellow('No movies found with "srikanth" as hero'));
  }

  // Check slug variations
  console.log(chalk.cyan('\n🔗 Checking slug variations:\n'));

  const slugs = celebrities
    .map(c => c.slug)
    .filter(Boolean)
    .map(slug => slug?.toLowerCase().replace(/^celeb-/, ''));

  const uniqueSlugs = new Set(slugs);
  
  if (slugs.length !== uniqueSlugs.size) {
    console.log(chalk.yellow('⚠️  Found duplicate slug variations:'));
    const slugCounts = new Map<string, number>();
    slugs.forEach(slug => {
      slugCounts.set(slug!, (slugCounts.get(slug!) || 0) + 1);
    });
    
    slugCounts.forEach((count, slug) => {
      if (count > 1) {
        console.log(chalk.red(`  - "${slug}" appears ${count} times`));
      }
    });
  } else {
    console.log(chalk.green('✅ No duplicate slug variations found'));
  }
}

checkSrikanthDuplicates()
  .then(() => {
    console.log(chalk.green('\n✅ Check complete\n'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  });
