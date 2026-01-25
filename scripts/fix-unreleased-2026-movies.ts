/**
 * Fix Unreleased 2026 Movies
 * 
 * Removes ratings from unreleased 2026 movies that have year-based slugs
 * (not -tba slugs) but are still unreleased.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUnreleased2026Movies() {
  console.log('🔍 Finding unreleased 2026 movies with ratings...\n');

  const currentYear = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all 2026 movies with ratings that don't have -tba slugs
  const { data: movies2026, error: findError } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, release_date, our_rating, avg_rating')
    .eq('release_year', 2026)
    .not('slug', 'like', '%-tba')
    .or('our_rating.not.is.null,avg_rating.not.is.null');

  if (findError) {
    console.error('❌ Error finding movies:', findError);
    process.exit(1);
  }

  if (!movies2026 || movies2026.length === 0) {
    console.log('✅ No unreleased 2026 movies with ratings found.');
    return;
  }

  console.log(`Found ${movies2026.length} 2026 movies with ratings:\n`);

  const updates: Array<{ id: string; title: string; slug: string; oldRating: any; reason: string }> = [];

  for (const movie of movies2026) {
    // Check if movie is actually unreleased
    let isUnreleased = false;
    let reason = '';

    if (movie.release_date) {
      const releaseDate = new Date(movie.release_date);
      isUnreleased = releaseDate > today;
      reason = isUnreleased ? `Release date ${movie.release_date} is in the future` : `Release date ${movie.release_date} has passed`;
    } else {
      // No release date but year is 2026 - treat as unreleased
      isUnreleased = true;
      reason = 'No release date, year is 2026 (current year)';
    }

    if (isUnreleased) {
      console.log(`  - ${movie.title_en} (${movie.slug})`);
      console.log(`    Reason: ${reason}`);
      console.log(`    Current ratings: our_rating=${movie.our_rating}, avg_rating=${movie.avg_rating}`);
      
      const { error: updateError } = await supabase
        .from('movies')
        .update({
          our_rating: null,
          avg_rating: null,
        })
        .eq('id', movie.id);

      if (updateError) {
        console.error(`    ❌ Error: ${updateError.message}`);
      } else {
        console.log(`    ✅ Ratings removed`);
        updates.push({
          id: movie.id,
          title: movie.title_en,
          slug: movie.slug,
          oldRating: movie.our_rating || movie.avg_rating,
          reason,
        });
      }
    } else {
      console.log(`  - ${movie.title_en} (${movie.slug}) - SKIPPED (already released)`);
    }
  }

  // Generate report
  const csvHeader = 'Movie ID,Title,Slug,Old Rating,Reason';
  const csvRows = updates.map(u => [
    u.id,
    `"${u.title.replace(/"/g, '""')}"`,
    `"${u.slug}"`,
    u.oldRating,
    `"${u.reason.replace(/"/g, '""')}"`,
  ].join(','));

  const csvContent = [csvHeader, ...csvRows].join('\n');
  const outputPath = path.join(process.cwd(), 'UNRELEASED-2026-MOVIES-FIXED.csv');
  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Ratings removed from ${updates.length} unreleased 2026 movies`);
  console.log(`   📝 Report saved to: ${outputPath}`);
  console.log(`\n✨ Done!`);
}

// Run cleanup
fixUnreleased2026Movies()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
