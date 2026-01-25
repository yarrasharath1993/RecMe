/**
 * Check if a movie has reviews and editorial data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkReviews(slug: string) {
  console.log(`\nChecking reviews for: ${slug}\n`);

  // Get movie
  const { data: movie, error } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !movie) {
    console.error('Movie not found:', error?.message);
    return;
  }

  console.log('Movie Info:');
  console.log('  Title:', movie.title_en);
  console.log('  Year:', movie.release_year);
  console.log('  Our Rating:', movie.our_rating);
  console.log('  Avg Rating:', movie.avg_rating);
  console.log('  Published:', movie.is_published);

  // Get reviews
  const { data: reviews } = await supabase
    .from('movie_reviews')
    .select('*')
    .eq('movie_id', movie.id)
    .order('created_at', { ascending: false });

  console.log('\nReviews:');
  console.log('  Count:', reviews?.length || 0);
  
  if (reviews && reviews.length > 0) {
    reviews.forEach((review, idx) => {
      console.log(`\n  Review ${idx + 1}:`);
      console.log('    ID:', review.id);
      console.log('    Status:', review.status);
      console.log('    Featured:', review.is_featured);
      console.log('    Overall Rating:', review.overall_rating);
      console.log('    Has Insights:', !!review.insights);
      console.log('    Has Dimensions:', !!review.dimensions_json);
      
      // Check dimensions_json structure
      if (review.dimensions_json) {
        const dims = review.dimensions_json as any;
        console.log('    Dimensions Keys:', Object.keys(dims).join(', '));
        console.log('    Has Verdict:', !!dims.verdict);
        console.log('    Has Story/Screenplay:', !!dims.story_screenplay);
        console.log('    Has Direction/Technicals:', !!dims.direction_technicals);
        console.log('    Has Performances:', !!dims.performances);
      }
    });
  } else {
    console.log('  ❌ No reviews found');
  }

  console.log('\nRating Card Display Logic:');
  console.log('  Will show rating card:', reviews && reviews.length > 0 && reviews[0]?.dimensions_json ? '✅ YES' : '❌ NO');
  console.log('  Reason:', reviews && reviews.length > 0 && reviews[0]?.dimensions_json ? 'Has editorial review with dimensions' : 'Missing editorial review or dimensions_json');
}

const slug = process.argv[2] || 'pellam-chatu-mogudu-1992';
checkReviews(slug).catch(console.error);
