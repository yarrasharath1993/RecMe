/**
 * Remove Ratings from TBA Movies
 * 
 * Removes all ratings from movies with -tba slugs (unreleased movies).
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeTbaRatings() {
  console.log('🔍 Finding movies with -tba slugs that have ratings...\n');

  // Find all movies with -tba slugs
  const { data: tbaMovies, error: findError } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, our_rating, avg_rating')
    .like('slug', '%-tba')
    .or('our_rating.not.is.null,avg_rating.not.is.null');

  if (findError) {
    console.error('❌ Error finding movies:', findError);
    process.exit(1);
  }

  if (!tbaMovies || tbaMovies.length === 0) {
    console.log('✅ No TBA movies with ratings found.');
    return;
  }

  console.log(`Found ${tbaMovies.length} TBA movies with ratings:\n`);

  const updates: Array<{ id: string; title: string; oldRating: any }> = [];

  for (const movie of tbaMovies) {
    const hasRating = movie.our_rating || movie.avg_rating;
    if (hasRating) {
      console.log(`  - ${movie.title_en} (${movie.slug})`);
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
          oldRating: movie.our_rating || movie.avg_rating,
        });
      }
    }
  }

  // Generate report
  const csvHeader = 'Movie ID,Title,Slug,Old Rating';
  const csvRows = updates.map(u => [
    u.id,
    `"${u.title.replace(/"/g, '""')}"`,
    `"${tbaMovies.find(m => m.id === u.id)?.slug || ''}"`,
    u.oldRating,
  ].join(','));

  const csvContent = [csvHeader, ...csvRows].join('\n');
  const outputPath = path.join(process.cwd(), 'TBA-MOVIES-RATINGS-REMOVED.csv');
  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Ratings removed from ${updates.length} movies`);
  console.log(`   📝 Report saved to: ${outputPath}`);
  console.log(`\n✨ Done!`);
}

// Run cleanup
removeTbaRatings()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
