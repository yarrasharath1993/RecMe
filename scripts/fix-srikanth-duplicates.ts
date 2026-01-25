/**
 * Fix duplicate Srikanth profiles
 * 
 * This script identifies multiple actors with "srikanth" in their name
 * and ensures proper slug assignment for disambiguation.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Celebrity {
  id: string;
  name_en: string;
  name_te?: string;
  slug: string;
  gender?: string;
  occupation?: string;
  is_published: boolean;
  tmdb_id?: string;
}

interface MovieHero {
  hero: string;
  count: number;
  movies: string[];
}

async function findSrikanthActors() {
  console.log(chalk.cyan('\n🔍 Finding all actors with "srikanth" in name\n'));

  // Find celebrities
  const { data: celebrities, error: celebError } = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, slug, gender, occupation, is_published, tmdb_id')
    .or('name_en.ilike.%srikanth%,name_te.ilike.%srikanth%')
    .order('name_en');

  if (celebError) {
    console.error(chalk.red(`Error fetching celebrities: ${celebError.message}`));
    return;
  }

  console.log(chalk.blue(`Found ${celebrities?.length || 0} celebrity(ies) in database:\n`));
  
  if (celebrities && celebrities.length > 0) {
    celebrities.forEach((celeb, index) => {
      console.log(chalk.white(`${index + 1}. ${celeb.name_en}${celeb.name_te ? ` (${celeb.name_te})` : ''}`));
      console.log(chalk.gray(`   ID: ${celeb.id}`));
      console.log(chalk.gray(`   Slug: ${celeb.slug || 'N/A'}`));
      console.log(chalk.gray(`   Published: ${celeb.is_published ? 'Yes' : 'No'}`));
      console.log('');
    });
  }

  // Find unique hero names from movies
  console.log(chalk.cyan('\n📽️  Finding unique "srikanth" hero names in movies:\n'));

  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('hero, title_en')
    .ilike('hero', '%srikanth%')
    .eq('is_published', true);

  if (moviesError) {
    console.error(chalk.red(`Error fetching movies: ${moviesError.message}`));
    return;
  }

  // Group by hero name
  const heroGroups = new Map<string, { count: number; movies: string[] }>();
  
  movies?.forEach(movie => {
    if (movie.hero) {
      const heroName = movie.hero.trim();
      if (!heroGroups.has(heroName)) {
        heroGroups.set(heroName, { count: 0, movies: [] });
      }
      const group = heroGroups.get(heroName)!;
      group.count++;
      if (group.movies.length < 5) {
        group.movies.push(movie.title_en || 'N/A');
      }
    }
  });

  console.log(chalk.blue(`Found ${heroGroups.size} unique hero name(s) with "srikanth":\n`));

  const heroArray: Array<{ name: string; count: number; movies: string[] }> = [];
  
  heroGroups.forEach((data, heroName) => {
    heroArray.push({ name: heroName, ...data });
    console.log(chalk.white(`${heroName}:`));
    console.log(chalk.gray(`  Movies: ${data.count}`));
    console.log(chalk.gray(`  Sample: ${data.movies.join(', ')}${data.count > 5 ? ` ... and ${data.count - 5} more` : ''}`));
    console.log('');
  });

  // Recommendations
  console.log(chalk.cyan('\n💡 Recommendations:\n'));

  if (heroArray.length > 1) {
    console.log(chalk.yellow('⚠️  Multiple actors found with "srikanth" in name!\n'));
    
    // Sort by movie count (most prominent first)
    heroArray.sort((a, b) => b.count - a.count);
    
    console.log(chalk.white('Suggested slug assignment:\n'));
    
    heroArray.forEach((hero, index) => {
      const baseSlug = hero.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const suggestedSlug = index === 0 ? 'srikanth' : baseSlug;
      
      console.log(chalk.white(`${index + 1}. ${hero.name}`));
      console.log(chalk.gray(`   Suggested slug: ${suggestedSlug}`));
      console.log(chalk.gray(`   Movies: ${hero.count}`));
      console.log('');
    });

    console.log(chalk.cyan('\n📝 Next steps:\n'));
    console.log(chalk.white('1. Identify which "Srikanth" is the main/prominent actor'));
    console.log(chalk.white('2. Ensure that actor has slug = "srikanth" in celebrities table'));
    console.log(chalk.white('3. Give other actors more specific slugs (e.g., "srikanth-meka", "srikanth-addala")'));
    console.log(chalk.white('4. Update slug_aliases if needed for name variations\n'));
  } else if (heroArray.length === 1) {
    console.log(chalk.green('✅ Only one "srikanth" actor found in movies'));
    console.log(chalk.white(`   Name: ${heroArray[0].name}`));
    console.log(chalk.white(`   Movies: ${heroArray[0].count}`));
    console.log(chalk.cyan('\n📝 Action:\n'));
    console.log(chalk.white('Ensure this actor has slug = "srikanth" in celebrities table\n'));
  } else {
    console.log(chalk.yellow('⚠️  No movies found with "srikanth" as hero\n'));
  }

  return { celebrities, heroArray };
}

async function main() {
  try {
    const result = await findSrikanthActors();
    
    if (result && result.heroArray.length > 1) {
      console.log(chalk.cyan('\n🔧 To fix this issue:\n'));
      console.log(chalk.white('1. Run this query to check current slugs:'));
      console.log(chalk.gray('   SELECT id, name_en, slug FROM celebrities WHERE name_en ILIKE \'%srikanth%\';'));
      console.log(chalk.white('\n2. Update the main actor to have slug "srikanth":'));
      console.log(chalk.gray('   UPDATE celebrities SET slug = \'srikanth\' WHERE id = \'<main-actor-id>\';'));
      console.log(chalk.white('\n3. Update other actors with specific slugs:'));
      console.log(chalk.gray('   UPDATE celebrities SET slug = \'srikanth-<surname>\' WHERE id = \'<other-actor-id>\';'));
      console.log('');
    }
    
    console.log(chalk.green('\n✅ Analysis complete\n'));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

main();
