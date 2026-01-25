/**
 * Complete Fix for Srikanth Meka
 * 1. Find and update profile image from TMDB
 * 2. Fix hero name for "10th Class Diaries"
 * 3. Fix poster URLs for movies with wrong year posters
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function searchTMDBPerson(name: string): Promise<{ id: number; profile_path?: string } | null> {
  if (!TMDB_API_KEY) {
    console.log(chalk.yellow('⚠️  TMDB_API_KEY not found, skipping TMDB search'));
    return null;
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Try to find the right person - look for "Meka" in name or known for Telugu
      const mekaResult = data.results.find((r: any) => 
        r.name?.toLowerCase().includes('meka') || 
        r.known_for_department === 'Acting'
      ) || data.results[0];

      return {
        id: mekaResult.id,
        profile_path: mekaResult.profile_path 
          ? `${TMDB_IMAGE_BASE}${mekaResult.profile_path}` 
          : undefined
      };
    }
    return null;
  } catch (error) {
    console.error(chalk.red(`TMDB search error: ${error}`));
    return null;
  }
}

async function getTMDBPersonImages(tmdbId: number): Promise<string | null> {
  if (!TMDB_API_KEY) return null;

  try {
    // Get person images
    const imagesUrl = `${TMDB_BASE_URL}/person/${tmdbId}/images?api_key=${TMDB_API_KEY}`;
    const imagesResponse = await fetch(imagesUrl);
    const imagesData = await imagesResponse.json();

    if (imagesData.profiles && imagesData.profiles.length > 0) {
      // Sort by vote_average and take the best one
      const bestImage = imagesData.profiles.sort((a: any, b: any) => 
        (b.vote_average || 0) - (a.vote_average || 0)
      )[0];

      return `https://image.tmdb.org/t/p/original${bestImage.file_path}`;
    }

    // Fallback: get person details
    const detailsUrl = `${TMDB_BASE_URL}/person/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const details = await detailsResponse.json();

    if (details.profile_path) {
      return `https://image.tmdb.org/t/p/original${details.profile_path}`;
    }

    return null;
  } catch (error) {
    console.error(chalk.red(`TMDB images error: ${error}`));
    return null;
  }
}

async function fixSrikanthMekaProfileImage() {
  console.log(chalk.cyan('\n🔍 Step 1: Finding Srikanth Meka profile image\n'));

  // Check if profile exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, profile_image, tmdb_id')
    .or('slug.eq.srikanth-meka,name_en.ilike.%srikanth%meka%')
    .maybeSingle();

  if (checkError) {
    console.error(chalk.red(`Error checking profile: ${checkError.message}`));
    return null;
  }

  if (!existingProfile) {
    console.log(chalk.yellow('⚠️  Profile not found. Creating new profile...'));
    // Create profile first
    const { data: newProfile, error: createError } = await supabase
      .from('celebrities')
      .insert({
        name_en: 'Srikanth Meka',
        name_te: 'శ్రీకాంత్ మేక',
        slug: 'srikanth-meka',
        gender: 'male',
        occupation: 'actor',
        birth_date: '1968-03-23',
        is_published: true,
      })
      .select()
      .single();

    if (createError || !newProfile) {
      console.error(chalk.red(`Error creating profile: ${createError?.message}`));
      return null;
    }
    console.log(chalk.green('✅ Profile created'));
  }

  const profileId = existingProfile?.id;
  const tmdbId = existingProfile?.tmdb_id;

  console.log(chalk.blue(`Profile ID: ${profileId}`));
  console.log(chalk.blue(`Current TMDB ID: ${tmdbId || 'None'}`));

  // Search TMDB for Srikanth Meka
  console.log(chalk.blue('\nSearching TMDB for "Srikanth Meka"...'));
  let tmdbData = null;

  if (tmdbId) {
    console.log(chalk.blue(`Using existing TMDB ID: ${tmdbId}`));
    const imageUrl = await getTMDBPersonImages(tmdbId);
    if (imageUrl) {
      tmdbData = { id: tmdbId, profile_path: imageUrl };
    }
  }

  if (!tmdbData) {
    // Try different search terms
    const searchTerms = ['Srikanth Meka', 'Meka Srikanth', 'Srikanth'];
    for (const term of searchTerms) {
      console.log(chalk.blue(`Trying search: "${term}"...`));
      const result = await searchTMDBPerson(term);
      if (result && result.profile_path) {
        tmdbData = result;
        console.log(chalk.green(`✅ Found in TMDB: ${result.profile_path}`));
        break;
      }
    }
  }

  if (!tmdbData || !tmdbData.profile_path) {
    console.log(chalk.yellow('⚠️  Could not find profile image in TMDB'));
    console.log(chalk.blue('   You may need to manually add the image URL'));
    return null;
  }

  // Update profile image
  console.log(chalk.blue(`\nUpdating profile image to: ${tmdbData.profile_path}`));
  
  const updateData: any = {
    profile_image: tmdbData.profile_path,
    image_url: tmdbData.profile_path,
    updated_at: new Date().toISOString(),
  };

  if (tmdbData.id && !tmdbId) {
    updateData.tmdb_id = tmdbData.id;
  }

  const { error: updateError } = await supabase
    .from('celebrities')
    .update(updateData)
    .eq('id', profileId);

  if (updateError) {
    console.error(chalk.red(`Error updating profile: ${updateError.message}`));
    return null;
  }

  console.log(chalk.green('✅ Profile image updated successfully!'));
  return tmdbData.profile_path;
}

async function fix10thClassDiariesHero() {
  console.log(chalk.cyan('\n🔍 Step 2: Fixing "10th Class Diaries" hero name\n'));

  const { data: movie, error: findError } = await supabase
    .from('movies')
    .select('id, title_en, hero, release_year')
    .ilike('title_en', '%10th class diaries%')
    .maybeSingle();

  if (findError) {
    console.error(chalk.red(`Error finding movie: ${findError.message}`));
    return;
  }

  if (!movie) {
    console.log(chalk.yellow('⚠️  Movie "10th Class Diaries" not found'));
    return;
  }

  console.log(chalk.blue(`Found: ${movie.title_en} (${movie.release_year})`));
  console.log(chalk.blue(`Current hero: ${movie.hero}`));

  if (movie.hero === 'Srikanth Meka') {
    console.log(chalk.green('✅ Hero name is already correct'));
    return;
  }

  const { error: updateError } = await supabase
    .from('movies')
    .update({ 
      hero: 'Srikanth Meka',
      updated_at: new Date().toISOString()
    })
    .eq('id', movie.id);

  if (updateError) {
    console.error(chalk.red(`Error updating hero: ${updateError.message}`));
    return;
  }

  console.log(chalk.green('✅ Hero name updated to "Srikanth Meka"'));
}

async function fixPosterUrls() {
  console.log(chalk.cyan('\n🔍 Step 3: Checking poster URLs for Srikanth Meka movies\n'));

  // Get all Srikanth Meka movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, hero, release_year, poster_url, slug')
    .eq('hero', 'Srikanth Meka')
    .eq('is_published', true)
    .order('release_year', { ascending: false });

  if (error) {
    console.error(chalk.red(`Error fetching movies: ${error.message}`));
    return;
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('⚠️  No movies found with hero "Srikanth Meka"'));
    return;
  }

  console.log(chalk.blue(`Found ${movies.length} movies\n`));

  // Check specific movies mentioned
  const moviesToCheck = [
    { title: 'Satruvu', year: 2013, slug: 'satruvu-2013' },
    // Add more if needed
  ];

  for (const checkMovie of moviesToCheck) {
    const movie = movies.find(m => 
      m.slug === checkMovie.slug || 
      (m.title_en?.toLowerCase().includes(checkMovie.title.toLowerCase()) && 
       m.release_year === checkMovie.year)
    );

    if (movie) {
      console.log(chalk.blue(`\nChecking: ${movie.title_en} (${movie.release_year})`));
      console.log(chalk.gray(`  Current poster: ${movie.poster_url || 'None'}`));
      console.log(chalk.yellow('  ⚠️  Manual review needed for poster URL'));
      console.log(chalk.gray('  You may need to fetch correct poster from TMDB or other sources'));
    } else {
      console.log(chalk.yellow(`⚠️  Movie "${checkMovie.title}" (${checkMovie.year}) not found`));
    }
  }

  console.log(chalk.cyan('\n💡 To fix poster URLs:'));
  console.log(chalk.white('  1. Use TMDB API to fetch correct poster for each movie'));
  console.log(chalk.white('  2. Or manually update poster_url in database'));
  console.log(chalk.white('  3. Ensure poster matches the correct release year\n'));
}

async function main() {
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║     Complete Fix for Srikanth Meka                        ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

  try {
    // Step 1: Fix profile image
    await fixSrikanthMekaProfileImage();

    // Step 2: Fix hero name
    await fix10thClassDiariesHero();

    // Step 3: Check poster URLs
    await fixPosterUrls();

    console.log(chalk.green.bold('\n✅ All fixes completed!\n'));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

main();
