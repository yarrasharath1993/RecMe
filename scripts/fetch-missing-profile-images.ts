/**
 * Fetch Missing Profile Images
 * 
 * Fetches TMDB images for celebrities who are missing profile_image
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface Celebrity {
  id: string;
  name_en: string;
  slug: string;
  tmdb_id?: number;
  profile_image?: string;
}

async function searchTMDBPerson(name: string): Promise<any | null> {
  if (!TMDB_API_KEY) {
    console.warn(chalk.yellow('⚠️  TMDB_API_KEY not found'));
    return null;
  }

  try {
    const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
  } catch (error) {
    console.error(`Error searching TMDB for ${name}:`, error);
  }

  return null;
}

async function getTMDBPersonDetails(tmdbId: number): Promise<any | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const url = `${TMDB_BASE_URL}/person/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching TMDB details for ${tmdbId}:`, error);
    return null;
  }
}

async function fetchMissingImages() {
  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           FETCH MISSING PROFILE IMAGES                                ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  // Get celebrities without profile images
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, tmdb_id, profile_image')
    .is('profile_image', null)
    .order('name_en');

  if (error) {
    console.error(chalk.red('Error fetching celebrities:'), error);
    return;
  }

  if (!celebrities || celebrities.length === 0) {
    console.log(chalk.green('✅ All celebrities have profile images!'));
    return;
  }

  console.log(chalk.white(`  Found ${celebrities.length} celebrities without profile images\n`));

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (let i = 0; i < celebrities.length; i++) {
    const celeb = celebrities[i] as Celebrity;
    const progress = `[${i + 1}/${celebrities.length}]`;

    let tmdbData: any = null;

    // Try to get TMDB data
    if (celeb.tmdb_id) {
      tmdbData = await getTMDBPersonDetails(celeb.tmdb_id);
    } else {
      // Search for TMDB ID
      const searchResult = await searchTMDBPerson(celeb.name_en);
      if (searchResult) {
        tmdbData = searchResult;
        // Update TMDB ID in database
        await supabase
          .from('celebrities')
          .update({ tmdb_id: searchResult.id })
          .eq('id', celeb.id);
      }
    }

    if (tmdbData && tmdbData.profile_path) {
      const profileImage = `${TMDB_IMAGE_BASE}${tmdbData.profile_path}`;
      
      // Update profile image
      const { error: updateError } = await supabase
        .from('celebrities')
        .update({ profile_image: profileImage })
        .eq('id', celeb.id);

      if (updateError) {
        console.log(`  ${progress} ${celeb.name_en}`.padEnd(40) + chalk.red('✗ update failed'));
        skipped++;
      } else {
        console.log(`  ${progress} ${celeb.name_en}`.padEnd(40) + chalk.green('✓ image added'));
        updated++;
      }
    } else {
      console.log(`  ${progress} ${celeb.name_en}`.padEnd(40) + chalk.yellow('⊘ no image found'));
      notFound++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                        SUMMARY                                         ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.green(`  ✅ Images added: ${updated}`));
  console.log(chalk.yellow(`  ⊘ Not found: ${notFound}`));
  console.log(chalk.red(`  ✗ Skipped: ${skipped}\n`));
}

fetchMissingImages();
