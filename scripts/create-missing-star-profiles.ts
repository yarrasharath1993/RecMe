#!/usr/bin/env npx tsx
/**
 * Create Missing Star Profiles: Allu Arjun & Rashmika Mandanna
 * Complete profiles with TMDB enrichment and social media
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import slugify from 'slugify';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface CelebrityData {
  name_en: string;
  name_te: string;
  slug: string;
  tmdb_id: number;
  occupation: string[];
  twitter_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  awards: Array<{
    award_name: string;
    category: string;
    year: number;
    movie?: string;
    is_won: boolean;
  }>;
}

const celebrities: CelebrityData[] = [
  {
    name_en: 'Allu Arjun',
    name_te: 'అల్లు అర్జున్',
    slug: 'allu-arjun',
    tmdb_id: 108916,
    occupation: ['actor'],
    twitter_url: 'https://twitter.com/alluarjun',
    instagram_url: 'https://www.instagram.com/alluarjunonline/',
    facebook_url: 'https://www.facebook.com/AlluArjun',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 2010, movie: 'Arya 2', is_won: true },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 2014, movie: 'Race Gurram', is_won: true },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 2018, movie: 'Ala Vaikunthapurramuloo', is_won: true },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 2021, movie: 'Pushpa: The Rise', is_won: true },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2008, movie: 'Parugu', is_won: true },
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 2010, movie: 'Vedam', is_won: true },
      { award_name: 'SIIMA Award', category: 'Best Actor – Telugu', year: 2013, is_won: true },
      { award_name: 'SIIMA Award', category: 'Best Actor – Telugu', year: 2014, is_won: true },
      { award_name: 'SIIMA Award', category: 'Best Actor – Telugu', year: 2021, is_won: true },
      { award_name: 'Zee Cine Awards Telugu', category: 'Icon of Indian Cinema', year: 2022, is_won: true },
    ],
  },
  {
    name_en: 'Rashmika Mandanna',
    name_te: 'రష్మిక మందన్న',
    slug: 'rashmika-mandanna',
    tmdb_id: 2218023,
    occupation: ['actor'],
    twitter_url: 'https://twitter.com/iamRashmika',
    instagram_url: 'https://www.instagram.com/rashmika_mandanna/',
    facebook_url: 'https://www.facebook.com/RashmikaMandanna',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 2018, movie: 'Geetha Govindam', is_won: true },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Kannada', year: 2017, movie: 'Kirik Party', is_won: true },
      { award_name: 'SIIMA Award', category: 'Best Actress – Kannada', year: 2017, is_won: true },
      { award_name: 'SIIMA Award', category: 'Best Actress – Telugu', year: 2019, is_won: true },
      { award_name: 'SIIMA Award', category: 'Best Actress – Telugu', year: 2022, is_won: true },
      { award_name: 'South Indian International Movie Award', category: 'Female Performer of the Year', year: 2023, is_won: true },
    ],
  },
];

async function fetchTMDBData(tmdbId: number) {
  const response = await fetch(
    `${TMDB_BASE_URL}/person/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`
  );
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }
  
  return await response.json();
}

async function createCelebrityProfile(celeb: CelebrityData) {
  console.log('\n\x1b[36m═══════════════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m Processing:', celeb.name_en, '\x1b[0m');
  console.log('\x1b[36m═══════════════════════════════════════════════════════════\x1b[0m\n');

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('celebrities')
    .select('id, slug')
    .eq('slug', celeb.slug)
    .maybeSingle();

  if (existing) {
    console.log('\x1b[33m⚠ Profile already exists with slug:\x1b[0m', celeb.slug);
    console.log('   Skipping creation, but can update data if needed.');
    return existing.id;
  }

  // Fetch TMDB data
  console.log('📡 Fetching TMDB data...');
  let tmdbData;
  try {
    tmdbData = await fetchTMDBData(celeb.tmdb_id);
    console.log('\x1b[32m✓ TMDB data fetched successfully\x1b[0m');
  } catch (error) {
    console.log('\x1b[31m✗ Failed to fetch TMDB data:\x1b[0m', error);
    tmdbData = {};
  }

  // Create celebrity profile
  const profileData = {
    slug: celeb.slug,
    name_en: celeb.name_en,
    name_te: celeb.name_te,
    tmdb_id: celeb.tmdb_id,
    imdb_id: tmdbData.external_ids?.imdb_id || null,
    short_bio: tmdbData.biography || null,
    birth_date: tmdbData.birthday || null,
    birth_place: tmdbData.place_of_birth || null,
    profile_image: tmdbData.profile_path ? `https://image.tmdb.org/t/p/w500${tmdbData.profile_path}` : null,
    profile_image_source: tmdbData.profile_path ? 'tmdb' : null,
    popularity_score: tmdbData.popularity || 10,
    occupation: celeb.occupation,
    twitter_url: celeb.twitter_url || null,
    instagram_url: celeb.instagram_url || null,
    facebook_url: celeb.facebook_url || null,
    social_links_updated_at: new Date().toISOString(),
    is_published: true,
    is_active: true,
    entity_confidence_score: 95,
    confidence_tier: 'high',
    trust_score: 95,
    freshness_score: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('💾 Creating celebrity profile...');
  const { data: newCeleb, error: celebError } = await supabase
    .from('celebrities')
    .insert(profileData)
    .select('id')
    .single();

  if (celebError) {
    console.log('\x1b[31m✗ Error creating profile:\x1b[0m', celebError.message);
    throw celebError;
  }

  console.log('\x1b[32m✓ Celebrity profile created!\x1b[0m ID:', newCeleb.id);

  // Add awards
  if (celeb.awards && celeb.awards.length > 0) {
    console.log('\n🏆 Adding awards...');
    let awardCount = 0;

    for (const award of celeb.awards) {
      const { error: awardError } = await supabase
        .from('celebrity_awards')
        .insert({
          celebrity_id: newCeleb.id,
          award_name: award.award_name,
          category: award.category,
          year: award.year,
          movie_title: award.movie || null,
          is_won: award.is_won,
          is_nomination: false,
        });

      if (awardError) {
        console.log('\x1b[31m  ✗\x1b[0m', award.award_name, '(' + award.year + ')');
      } else {
        console.log('\x1b[32m  ✓\x1b[0m', award.award_name, '(' + award.year + ')', award.movie ? '[' + award.movie + ']' : '');
        awardCount++;
      }
    }

    console.log('\x1b[32m✓ Added ' + awardCount + ' awards\x1b[0m');
  }

  console.log('\n\x1b[32m✅ ' + celeb.name_en + ' profile complete!\x1b[0m');
  return newCeleb.id;
}

async function main() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║        CREATE MISSING STAR PROFILES (Allu Arjun & Rashmika)          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const celeb of celebrities) {
    try {
      const result = await createCelebrityProfile(celeb);
      if (result) {
        created++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.log('\n\x1b[31m✗ Failed to process ' + celeb.name_en + ':\x1b[0m', error);
      errors++;
    }
  }

  console.log('\n\x1b[36m\x1b[1m╔═══════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m\x1b[1m║                        SUMMARY                                         ║\x1b[0m');
  console.log('\x1b[36m\x1b[1m╚═══════════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  console.log('Profiles Processed:       ', celebrities.length);
  console.log('\x1b[32m✅ Created:               \x1b[0m', created);
  console.log('\x1b[33m⊘ Skipped (Exists):       \x1b[0m', skipped);
  if (errors > 0) {
    console.log('\x1b[31m✗ Errors:                 \x1b[0m', errors);
  }
  console.log('');

  if (created > 0) {
    console.log('\x1b[32m\x1b[1m🎉 New celebrity profiles created successfully!\x1b[0m\n');
  }
}

main().catch(console.error);
