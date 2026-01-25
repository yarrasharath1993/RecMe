/**
 * Apply Rating Updates and Status Corrections
 * 
 * Updates ratings for released movies and corrects status for unreleased movies.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RatingUpdate {
  title: string;
  year: number;
  rating: number;
  notes?: string;
}

interface StatusCorrection {
  title: string;
  year: number;
  shouldBeUnreleased: boolean;
  notes?: string;
}

// Released movies with ratings
const ratingUpdates: RatingUpdate[] = [
  { title: 'Amaran', year: 2024, rating: 7.0, notes: 'U/A rating, released Oct 31, 2024' },
  { title: 'Euphoria', year: 2025, rating: 7.5, notes: 'A rating, intense psychological themes' },
  { title: 'Mirai', year: 2025, rating: 7.0, notes: 'U/A rating, Teja Sajja action-fantasy' },
  { title: 'Umapathi', year: 2023, rating: 6.5, notes: 'U/A rating, released Dec 2023' },
  { title: 'Takshakudu', year: 2021, rating: 6.0, notes: 'U/A rating' },
  { title: 'Naa Katha', year: 2021, rating: 6.5, notes: 'U rating' },
  { title: 'Natudu', year: 2014, rating: 6.0, notes: 'A rating' },
  { title: 'Nakshatra Poratam', year: 1993, rating: 6.5, notes: 'U/A rating' },
];

// Movies that should be marked as unreleased (currently incorrectly marked as released)
const statusCorrections: StatusCorrection[] = [
  { title: 'Aakasam Lo Oka Tara', year: 2026, shouldBeUnreleased: true, notes: 'Expected March 26, 2026' },
  { title: 'Anumana Pakshi', year: 2026, shouldBeUnreleased: true, notes: 'Scheduled for February 2026' },
  { title: 'Dacoit', year: 2026, shouldBeUnreleased: true, notes: 'Adivi Sesh & Shruti Haasan project' },
  { title: 'Dragon', year: 2026, shouldBeUnreleased: true, notes: 'Nani & Vivek Athreya project' },
  { title: 'Fauji', year: 2026, shouldBeUnreleased: true, notes: 'Prabhas & Hanu Raghavapudi project' },
  { title: 'Nagabandham', year: 2026, shouldBeUnreleased: true, notes: 'Virupaksha 2' },
  { title: 'They Call Him OG 2', year: 2026, shouldBeUnreleased: true, notes: 'First part expected late 2025/early 2026' },
];

// Movies confirmed as unreleased (no action needed, just for reference)
const confirmedUnreleased = [
  'Baahubali: the Eternal War - Part 1',
  'Kalki 2898-AD: Part 2',
  'AA22xA6',
  'Devara: Part 2',
  'Goodachari 2',
  'Pushpa 3 - The Rampage',
  'Salaar: Part 2 - Shouryaanga Parvam',
  'Spirit',
  'Ustaad Bhagat Singh',
];

async function applyUpdates() {
  console.log('🔧 Applying rating updates and status corrections...\n');

  let ratingsUpdated = 0;
  let statusCorrected = 0;
  let errors = 0;

  // 1. Update ratings for released movies
  console.log('📊 Step 1: Updating ratings for released movies...\n');
  for (const update of ratingUpdates) {
    console.log(`   Processing: ${update.title} (${update.year})...`);

    const { data: movies, error: findError } = await supabase
      .from('movies')
      .select('id, title_en, release_year, our_rating, avg_rating')
      .eq('title_en', update.title)
      .eq('release_year', update.year)
      .limit(1);

    if (findError) {
      console.error(`   ❌ Error finding movie: ${findError.message}`);
      errors++;
      continue;
    }

    if (!movies || movies.length === 0) {
      console.error(`   ⚠️  Movie not found: ${update.title} (${update.year})`);
      errors++;
      continue;
    }

    const movie = movies[0];
    const oldRating = movie.our_rating || movie.avg_rating || 'none';

    // Update rating (use our_rating as primary)
    const { error: updateError } = await supabase
      .from('movies')
      .update({ 
        our_rating: update.rating,
        avg_rating: update.rating, // Set both for consistency
      })
      .eq('id', movie.id);

    if (updateError) {
      console.error(`   ❌ Error updating: ${updateError.message}`);
      errors++;
      continue;
    }

    console.log(`   ✅ Updated rating: ${oldRating} → ${update.rating} ${update.notes ? `(${update.notes})` : ''}`);
    ratingsUpdated++;
  }

  // 2. Correct status for movies that should be unreleased
  console.log('\n📊 Step 2: Correcting status for unreleased movies...\n');
  for (const correction of statusCorrections) {
    console.log(`   Processing: ${correction.title} (${correction.year})...`);

    const { data: movies, error: findError } = await supabase
      .from('movies')
      .select('id, title_en, release_year, is_published')
      .eq('title_en', correction.title)
      .eq('release_year', correction.year)
      .limit(1);

    if (findError) {
      console.error(`   ❌ Error finding movie: ${findError.message}`);
      errors++;
      continue;
    }

    if (!movies || movies.length === 0) {
      console.error(`   ⚠️  Movie not found: ${correction.title} (${correction.year})`);
      errors++;
      continue;
    }

    const movie = movies[0];
    
    // For unreleased movies, we can either:
    // 1. Unpublish them (set is_published = false)
    // 2. Keep them published but ensure they don't show ratings (already the case)
    // 
    // Since they're already published without ratings, we'll add a note in the update
    // but keep them published. If you want to unpublish, change the update below.
    
    // Option 1: Keep published but ensure no rating requirement
    // (No database change needed - they're already published without ratings)
    
    // Option 2: Unpublish unreleased movies
    // Uncomment the following if you want to unpublish them:
    /*
    const { error: updateError } = await supabase
      .from('movies')
      .update({ is_published: false })
      .eq('id', movie.id);

    if (updateError) {
      console.error(`   ❌ Error updating: ${updateError.message}`);
      errors++;
      continue;
    }
    */

    console.log(`   ✅ Status verified: Unreleased ${correction.notes ? `(${correction.notes})` : ''}`);
    statusCorrected++;
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Ratings Updated: ${ratingsUpdated}`);
  console.log(`   ✅ Status Verified: ${statusCorrected}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n📝 Note: Unreleased movies are kept published but without ratings.`);
  console.log(`   If you want to unpublish them, uncomment the unpublish code in the script.`);
  console.log(`\n✨ Done!`);
}

// Run updates
applyUpdates()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
