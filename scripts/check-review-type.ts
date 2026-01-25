/**
 * Check review _type field
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkReviewType(slug: string) {
  // Get movie
  const { data: movie } = await supabase
    .from('movies')
    .select('id, title_en')
    .eq('slug', slug)
    .single();

  if (!movie) {
    console.error('Movie not found');
    return;
  }

  // Get review
  const { data: reviews } = await supabase
    .from('movie_reviews')
    .select('*')
    .eq('movie_id', movie.id)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (!reviews || reviews.length === 0) {
    console.log('No reviews found');
    return;
  }

  const review = reviews[0];
  console.log('Movie:', movie.title_en);
  console.log('Review ID:', review.id);
  console.log('Is Featured:', review.is_featured);
  console.log('Has dimensions_json:', !!review.dimensions_json);

  if (review.dimensions_json) {
    const dims = review.dimensions_json as any;
    console.log('\nDimensions Info:');
    console.log('  _type value:', dims._type);
    console.log('  _type is "editorial_review_v2":', dims._type === 'editorial_review_v2');
    console.log('\n  Expected for rating card: "editorial_review_v2"');
    console.log('  Current value:', JSON.stringify(dims._type));
    
    // Show fix
    if (dims._type !== 'editorial_review_v2') {
      console.log('\n❌ This is why the rating card is not showing!');
      console.log('   The _type needs to be "editorial_review_v2"');
      console.log('   Current value:', dims._type);
    } else {
      console.log('\n✅ _type is correct');
    }
  }
}

const slug = process.argv[2] || 'pellam-chatu-mogudu-1992';
checkReviewType(slug).catch(console.error);
