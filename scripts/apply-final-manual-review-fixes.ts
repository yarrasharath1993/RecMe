#!/usr/bin/env npx tsx
/**
 * Apply final manual review fixes from MANUAL-REVIEW-ITEMS.csv
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Fix {
  id: string;
  slug: string;
  type: 'documentary' | 'standup' | 'animated_short' | 'missing_hero' | 'missing_heroine' | 'bad_slug' | 'suspicious_confirm' | 'poster' | 'year_fix';
  hero?: string | null;
  heroine?: string | null;
  newSlug?: string;
  category?: string;
  note?: string;
  posterUrl?: string;
  year?: number;
}

const fixes: Fix[] = [
  // DOCUMENTARIES & NON-FEATURE FILMS
  { id: '873c2b3e-a7dd-4ef7-a250-a9d2f4902f65', slug: 'koyaanisqatsi-1983', type: 'documentary', hero: null, heroine: null, category: 'Documentary', note: 'Experimental documentary' },
  { id: '9364f5fd-99b1-477b-b710-f9d11035aaac', slug: 'modern-masters-ss-rajamouli-2024', type: 'documentary', heroine: null, category: 'Documentary', note: 'Biographical documentary' },
  { id: 'b5c08365-d3c6-4966-a295-2b7d3413d592', slug: 'ocean-with-david-attenborough-2025', type: 'documentary', heroine: null, category: 'Documentary', note: 'Nature documentary' },
  { id: 'acf194fe-4408-4b2b-9644-3ea74d579879', slug: 'bo-burnham-inside-2021', type: 'standup', heroine: null, category: 'Stand-up Special', note: 'Solo performance' },
  { id: '4276917a-0045-4b76-81f6-269728066f35', slug: 'hannah-gadsby-nanette-2018', type: 'standup', heroine: null, category: 'Stand-up Special', note: 'Solo performance' },
  { id: 'ceb40bb2-dbcd-4eb9-a2b3-2510875484ef', slug: 'john-mulaney-kid-gorgeous-at-radio-city-2018', type: 'standup', heroine: null, category: 'Stand-up Special', note: 'Solo performance' },
  { id: '687561cd-b46f-467c-8c15-4741a9c9e377', slug: 'john-mulaney-new-in-town-2012', type: 'standup', heroine: null, category: 'Stand-up Special', note: 'Solo performance' },
  { id: '2fbc8f58-8a44-4fb5-9d5b-73415cdaeb44', slug: 'george-carlin-it-s-bad-for-ya--2008', type: 'standup', heroine: null, category: 'Stand-up Special', note: 'Solo performance' },
  { id: '447beab7-f068-4110-8af2-053411a79f74', slug: 'louis-c-k-chewed-up-2008', type: 'standup', heroine: null, category: 'Stand-up Special', note: 'Solo performance' },
  { id: '8da0c364-df3f-4f36-b928-0d969f997304', slug: 'george-carlin-jammin-in-new-york-1992', type: 'standup', heroine: null, category: 'Stand-up Special', note: 'Solo performance' },
  { id: 'dc4655b8-0ab6-45ed-8c43-d7107dc2de08', slug: 'bill-hicks-revelations-1993', type: 'standup', heroine: null, category: 'Stand-up Special', note: 'Solo performance' },
  { id: '04fe3514-9717-4dfb-ae9c-7a3c4d750f95', slug: 'kitbull-2019', type: 'animated_short', heroine: null, category: 'Animated Short', note: 'Pixar short' },
  { id: '651eb874-46f6-478d-a324-9b7630a5fb67', slug: 'opal-2020', type: 'animated_short', heroine: null, category: 'Animated Short', note: 'Short film' },
  { id: 'cf48dc2a-a14e-43d5-9488-0fd1f55a7802', slug: 'piper-2016', type: 'animated_short', heroine: null, category: 'Animated Short', note: 'Pixar short' },
  { id: '7cacd9d1-4f91-4c17-803c-1c6f426873f0', slug: 'earthlings-2005', type: 'documentary', heroine: null, category: 'Documentary', note: 'Documentary narrated by Joaquin Phoenix' },
  { id: '845186f1-e99b-4b5e-8cec-5fe5b9c731e5', slug: 'queen-live-at-wembley-stadium-1986', type: 'documentary', heroine: null, category: 'Concert Film', note: 'Concert film' },
  { id: '00bfa782-814f-4445-8644-5d10e72a7255', slug: 'vincent-1982', type: 'animated_short', heroine: null, category: 'Animated Short', note: 'Animated short' },
  { id: 'e46179d7-0116-4d05-9ff2-6fa7043ee737', slug: 'duck-amuck-1953', type: 'animated_short', heroine: null, category: 'Short Film', note: 'Looney Tunes animated short' },
  { id: '059cb5f3-6b39-4627-87c8-1e3aae395cd3', slug: 'dc-showcase-death-2019', type: 'animated_short', category: 'Animated Short', note: 'DC animated short' },
  { id: 'dad2971a-ec65-4c2e-9c9f-cd5d405323e8', slug: 'unlocking-sherlock-2014', type: 'documentary', category: 'TV Documentary', note: 'TV documentary' },
  { id: '4bf3e6e9-856f-453e-bde9-9382875b513c', slug: 'n-a-2019', type: 'documentary', heroine: null, category: 'Music Documentary', note: 'Music documentary' },
  { id: '5e34a4a8-b964-4822-90e7-d76769951bc6', slug: 'baraka-1993', type: 'documentary', heroine: null, category: 'Documentary', note: 'Documentary' },

  // MISSING HERO
  { id: 'ea870716-1028-47e0-9848-e1e887486bf2', slug: 'keni-2018', type: 'missing_hero', hero: 'Parthiban', note: 'Male lead' },
  { id: '63691833-d0c5-413a-87aa-0efc29a68b99', slug: 'naayudamma-2006', type: 'missing_hero', hero: 'Prabhu Deva', note: 'Male lead' },
  { id: '7da9de1e-b388-4468-b116-7ef9ccd40341', slug: 'insaniyat-1994', type: 'missing_hero', hero: 'Amitabh Bachchan', note: 'Male lead' },
  { id: '40ba5b4b-9570-43e5-8b74-7fd8d53c5d13', slug: 'maga-rayudu-1994', type: 'missing_hero', hero: 'Karthik', note: 'Male lead' },
  { id: '8aa3455d-d9a9-48d7-ab30-d95e551f42b8', slug: 'nagina-1986', type: 'missing_hero', hero: 'Rishi Kapoor', note: 'Male lead' },
  { id: '5295522c-545c-4ef4-ade4-2c125ac62d22', slug: 'sadma-1984', type: 'missing_hero', hero: 'Kamal Haasan', note: 'Male lead' },
  { id: '7b15d303-ebc5-4428-a266-f6f11604cc9b', slug: 'priya-1978', type: 'missing_hero', hero: 'Rajinikanth', note: 'Male lead' },
  { id: 'a6fef85e-9f2e-46b4-8fa8-7daf7748546d', slug: 'vanakkathukuriya-kathaliye-1978', type: 'missing_hero', hero: 'Rajinikanth', note: 'Male lead' },

  // MISSING HEROINE
  { id: '5f4d9c51-1e09-4009-9619-aa368c3620e1', slug: 'paramanandham-shishyulu-tba', type: 'missing_heroine', heroine: 'TBA', note: 'Biopic - TBA' },
  { id: '4961d6aa-b74a-4b4b-b9b5-3b58bd017c3b', slug: 'mom-2017', type: 'missing_heroine', heroine: 'Sridevi', note: 'Female lead' },
  { id: '26e8f6de-3a09-4bae-97aa-c5499142fd76', slug: 'mama-manchu-alludu-kanchu-2015', type: 'missing_heroine', heroine: 'Ramya Krishnan', note: 'Female lead' },
  { id: 'df5c63e9-89fa-498f-93ec-9ea92cd305c2', slug: 'family-1996', type: 'missing_heroine', heroine: 'Tomoko Inoue', note: 'Female lead' },
  { id: '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31', slug: 'karunamayudu-1978', type: 'missing_heroine', heroine: 'Sujatha', note: 'Female lead' },
  { id: 'c212cbf8-5145-44b7-8740-a2928fa13c6b', slug: 'hanuman-2005', type: 'missing_heroine', heroine: null, note: 'Animated feature - no traditional heroine' },

  // BAD SLUGS
  { id: '9610fea5-10e1-4d27-8796-8a8e41c6d274', slug: 'qarib-qarib-singlle-2017', type: 'bad_slug', newSlug: 'qarib-qarib-singlle-2017', note: 'Already correct' },
  { id: 'ed71d9e9-2812-429d-938a-e6cb98fbdd5c', slug: 'queen-2014', type: 'bad_slug', newSlug: 'queen-2014', note: 'Already correct' },
  { id: 'edf915ed-6da6-4f3f-afd2-48d1da848edd', slug: 'queen-days-of-our-lives-2011', type: 'bad_slug', newSlug: 'queen-days-of-our-lives-2011', note: 'Already correct' },
  { id: '1da56a37-112f-45ab-9ea6-905c9657a7e8', slug: 'quick-gun-murugan-2009', type: 'bad_slug', newSlug: 'quick-gun-murugan-2009', note: 'Already correct' },
  { id: '66e5c368-a0f3-46c5-ba66-a0a7d38eaf0c', slug: 'qayamat-se-qayamat-tak-1988', type: 'bad_slug', newSlug: 'qayamat-se-qayamat-tak-1988', note: 'Already correct' },
  { id: '845186f1-e99b-4b5e-8cec-5fe5b9c731e5', slug: 'queen-live-at-wembley-stadium-1986', type: 'bad_slug', newSlug: 'queen-live-at-wembley-stadium-1986', note: 'Already correct' },
  { id: '2f2684e9-4ef1-4173-9c5a-4ae3b918959b', slug: 'qayamat-1983', type: 'bad_slug', newSlug: 'qayamat-1983', note: 'Already correct' },

  // YEAR FIX
  { id: '7a937526-3443-4606-840a-0f6343d29a86', slug: 'swetha-5-10-wellington-road-2013', type: 'year_fix', year: 2009, note: 'Correct year is 2009' },
];

async function applyFix(fix: Fix): Promise<boolean> {
  try {
    // Try by slug first (more reliable), then by ID
    let movie;
    
    const { data: movieBySlug, error: errorBySlug } = await supabase
      .from('movies')
      .select('id, slug, hero, heroine, release_year, poster_url')
      .eq('slug', fix.slug)
      .single();
    
    if (!errorBySlug && movieBySlug) {
      movie = movieBySlug;
    } else {
      const { data: movieById, error: errorById } = await supabase
        .from('movies')
        .select('id, slug, hero, heroine, release_year, poster_url')
        .eq('id', fix.id)
        .single();
      
      if (errorById || !movieById) {
        console.log(chalk.red(`❌ Not found: ${fix.slug} (${fix.id})`));
        return false;
      }
      movie = movieById;
    }

    if (!movie) {
      console.log(chalk.red(`❌ Not found: ${fix.slug} (${fix.id})`));
      return false;
    }

    const updates: any = {};

    switch (fix.type) {
      case 'documentary':
      case 'standup':
      case 'animated_short':
        // Note: category column doesn't exist in movies table
        // These are reclassified by having null heroine/hero where appropriate
        if (fix.hero !== undefined) updates.hero = fix.hero;
        if (fix.heroine !== undefined) updates.heroine = fix.heroine;
        break;

      case 'missing_hero':
        if (fix.hero) updates.hero = fix.hero;
        break;

      case 'missing_heroine':
        if (fix.heroine !== undefined) updates.heroine = fix.heroine;
        break;

      case 'bad_slug':
        if (fix.newSlug && fix.newSlug !== fix.slug) {
          updates.slug = fix.newSlug;
        }
        break;

      case 'suspicious_confirm':
        // No action needed - these are confirmed as feature films
        return true;

      case 'poster':
        if (fix.posterUrl) updates.poster_url = fix.posterUrl;
        break;

      case 'year_fix':
        if (fix.year) updates.release_year = fix.year;
        break;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`  ❌ Error: ${updateError.message}`));
        return false;
      }
      return true;
    }

    return false;
  } catch (e: any) {
    console.log(chalk.red(`❌ Unexpected error for ${fix.slug}: ${e.message}`));
    return false;
  }
}

async function applyAllFixes() {
  console.log(chalk.bold('\n🔧 APPLYING FINAL MANUAL REVIEW FIXES\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');

  let applied = 0;
  let errors = 0;
  let skipped = 0;

  for (const fix of fixes) {
    const result = await applyFix(fix);
    if (result) {
      applied++;
      const note = fix.note ? chalk.gray(` (${fix.note})`) : '';
      console.log(chalk.green(`✅ ${fix.slug} (${fix.type})${note}`));
    } else if (result === false) {
      errors++;
    } else {
      skipped++;
    }
  }

  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Applied: ${chalk.green(applied)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log(`  Skipped: ${chalk.yellow(skipped)}`);
  console.log();
}

applyAllFixes().catch(console.error);
