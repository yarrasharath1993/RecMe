/**
 * Fix Srikanth actors - Separate Tamil actor Srikanth from Srikanth Meka
 * 
 * Tamil actor Srikanth → slug: "srikanth"
 * Srikanth Meka → slug: "srikanth-meka"
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tamil actor Srikanth's known movies (from user's list)
const TAMIL_SRIKANTH_MOVIES = [
  'Blackmail', 'Dinasari', 'Konjam Kadhal Konjam Modhal', 'Mathru',
  'Operation Laila', 'Sathamindri Mutham Tha', 'Aanandhapuram Diaries', 'Maya Puthagam',
  'Bagheera', 'Kannai Nambathey', 'Echo', 'Amala', 'Pindam', 'Ravanasura',
  'Maha', 'Coffee with Kadhal', '10th Class Diaries',
  'Mirugaa', 'Y', 'Jai Sena', 'Asalem Jarigindi',
  'Rocky: The Revenge', 'Raagala 24 Gantallo', 'Marshal',
  'Lie',
  'Sowkarpettai', 'Nambiar', 'Sarrainodu',
  'Om Shanti Om',
  'Kathai Thiraikathai Vasanam Iyakkam',
  'Nanban', 'Paagan', 'Hero', 'Nippu',
  'Sathurangam', 'Dhada', 'Uppukandam Brothers Back in Action',
  'Drohi', 'Rasikkum Seemane', 'Police Police',
  'Indira Vizha',
  'Poo', 'Vallamai Tharayo',
  'Aadavari Matalaku Ardhalu Verule',
  'Mercury Pookkal', 'Uyir', 'Kizhakku Kadarkarai Salai',
  'Kana Kandaen', 'Oru Naal Oru Kanavu', 'Bambara Kannaley',
  'Aayitha Ezhuthu', 'Bose', 'Varnajalam',
  'Parthiban Kanavu', 'Priyamana Thozhi', 'Manasellam', 'Okariki Okaru',
  'Roja Kootam', 'April Mathathil'
].map(m => m.toLowerCase());

async function findAndFixSrikanthActors() {
  console.log(chalk.cyan('\n🔍 Finding Srikanth actors and their movies\n'));

  // Step 1: Find all celebrities with "srikanth" in name
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
  
  let tamilSrikanthId: string | null = null;
  let srikanthMekaId: string | null = null;

  if (celebrities && celebrities.length > 0) {
    celebrities.forEach((celeb, index) => {
      console.log(chalk.white(`${index + 1}. ${celeb.name_en}${celeb.name_te ? ` (${celeb.name_te})` : ''}`));
      console.log(chalk.gray(`   ID: ${celeb.id}`));
      console.log(chalk.gray(`   Slug: ${celeb.slug || 'N/A'}`));
      console.log(chalk.gray(`   Published: ${celeb.is_published ? 'Yes' : 'No'}`));
      
      // Try to identify which is which
      const nameLower = celeb.name_en.toLowerCase();
      if (nameLower.includes('meka')) {
        srikanthMekaId = celeb.id;
        console.log(chalk.yellow('   → Identified as: Srikanth Meka'));
      } else if (!nameLower.includes('meka') && !nameLower.includes('addala')) {
        tamilSrikanthId = celeb.id;
        console.log(chalk.yellow('   → Identified as: Tamil actor Srikanth'));
      }
      console.log('');
    });
  }

  // Step 2: Find movies with "srikanth" as hero
  console.log(chalk.cyan('\n📽️  Finding movies with "srikanth" as hero:\n'));

  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('id, title_en, hero, release_year, slug, language')
    .ilike('hero', '%srikanth%')
    .eq('is_published', true)
    .order('release_year', { ascending: false });

  if (moviesError) {
    console.error(chalk.red(`Error fetching movies: ${moviesError.message}`));
    return;
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('No movies found'));
    return;
  }

  console.log(chalk.blue(`Found ${movies.length} movies with "srikanth" in hero field\n`));

  // Categorize movies
  const tamilSrikanthMovies: typeof movies = [];
  const srikanthMekaMovies: typeof movies = [];
  const unknownMovies: typeof movies = [];

  movies.forEach(movie => {
    const titleLower = (movie.title_en || '').toLowerCase();
    const heroLower = (movie.hero || '').toLowerCase();
    
    // Check if it's in Tamil Srikanth's known list
    const isTamilSrikanth = TAMIL_SRIKANTH_MOVIES.some(knownTitle => 
      titleLower.includes(knownTitle) || knownTitle.includes(titleLower)
    );
    
    // Check if hero name contains "meka" or "addala"
    const isMeka = heroLower.includes('meka') || heroLower.includes('addala');
    
    if (isTamilSrikanth || (!isMeka && (movie.language === 'Tamil' || movie.language === 'Malayalam'))) {
      tamilSrikanthMovies.push(movie);
    } else if (isMeka || (!isTamilSrikanth && movie.language === 'Telugu' && !heroLower.includes('tamil'))) {
      srikanthMekaMovies.push(movie);
    } else {
      unknownMovies.push(movie);
    }
  });

  console.log(chalk.green(`✅ Tamil Srikanth movies: ${tamilSrikanthMovies.length}`));
  console.log(chalk.green(`✅ Srikanth Meka movies: ${srikanthMekaMovies.length}`));
  if (unknownMovies.length > 0) {
    console.log(chalk.yellow(`⚠️  Unknown/ambiguous movies: ${unknownMovies.length}`));
    unknownMovies.slice(0, 5).forEach(m => {
      console.log(chalk.gray(`   - ${m.title_en} (${m.release_year}) - Hero: ${m.hero}`));
    });
    if (unknownMovies.length > 5) {
      console.log(chalk.gray(`   ... and ${unknownMovies.length - 5} more`));
    }
  }
  console.log('');

  // Step 3: Recommendations
  console.log(chalk.cyan('\n💡 Recommendations:\n'));

  if (!tamilSrikanthId) {
    console.log(chalk.yellow('⚠️  Tamil actor Srikanth profile not found in celebrities table'));
    console.log(chalk.white('   Action: Create celebrity profile with slug "srikanth"\n'));
  } else {
    console.log(chalk.green(`✅ Tamil actor Srikanth found: ${tamilSrikanthId}`));
    console.log(chalk.white('   Action: Ensure slug is "srikanth"\n'));
  }

  if (!srikanthMekaId) {
    console.log(chalk.yellow('⚠️  Srikanth Meka profile not found in celebrities table'));
    console.log(chalk.white('   Action: Create celebrity profile with slug "srikanth-meka"\n'));
  } else {
    console.log(chalk.green(`✅ Srikanth Meka found: ${srikanthMekaId}`));
    console.log(chalk.white('   Action: Ensure slug is "srikanth-meka"\n'));
  }

  // Step 4: SQL commands
  console.log(chalk.cyan('\n📝 SQL Commands to Fix:\n'));

  if (tamilSrikanthId) {
    console.log(chalk.white('-- Update Tamil actor Srikanth slug'));
    console.log(chalk.gray(`UPDATE celebrities SET slug = 'srikanth', updated_at = NOW() WHERE id = '${tamilSrikanthId}';`));
    console.log('');
  } else {
    console.log(chalk.white('-- Create Tamil actor Srikanth profile'));
    console.log(chalk.gray(`INSERT INTO celebrities (name_en, name_te, slug, gender, occupation, is_published, created_at, updated_at)`));
    console.log(chalk.gray(`VALUES ('Srikanth', 'ஸ்ரீகாந்த்', 'srikanth', 'male', 'actor', true, NOW(), NOW()) RETURNING id;`));
    console.log('');
  }

  if (srikanthMekaId) {
    console.log(chalk.white('-- Update Srikanth Meka slug'));
    console.log(chalk.gray(`UPDATE celebrities SET slug = 'srikanth-meka', updated_at = NOW() WHERE id = '${srikanthMekaId}';`));
    console.log('');
  } else {
    console.log(chalk.white('-- Create Srikanth Meka profile'));
    console.log(chalk.gray(`INSERT INTO celebrities (name_en, name_te, slug, gender, occupation, is_published, created_at, updated_at)`));
    console.log(chalk.gray(`VALUES ('Srikanth Meka', 'శ్రీకాంత్ మేక', 'srikanth-meka', 'male', 'actor', true, NOW(), NOW()) RETURNING id;`));
    console.log('');
  }

  // Summary
  console.log(chalk.cyan('\n📊 Summary:\n'));
  console.log(chalk.white(`Tamil Srikanth movies: ${tamilSrikanthMovies.length}`));
  console.log(chalk.white(`Srikanth Meka movies: ${srikanthMekaMovies.length}`));
  console.log(chalk.white(`Unknown movies: ${unknownMovies.length}`));
  console.log('');
}

findAndFixSrikanthActors()
  .then(() => {
    console.log(chalk.green('\n✅ Analysis complete\n'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  });
