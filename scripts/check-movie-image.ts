/**
 * Check Movie Image
 * Quick script to check a specific movie's image data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkMovie(slug: string) {
  console.log(`\nChecking movie: ${slug}\n`);

  const { data: movie, error } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !movie) {
    console.error('Movie not found:', error?.message);
    return;
  }

  console.log('Movie Data:');
  console.log('  ID:', movie.id);
  console.log('  Title (EN):', movie.title_en);
  console.log('  Title (TE):', movie.title_te);
  console.log('  Year:', movie.release_year);
  console.log('  Director:', movie.director);
  console.log('  Hero:', movie.hero);
  console.log('  Heroine:', movie.heroine);
  console.log('  TMDB ID:', movie.tmdb_id);
  console.log('  IMDB ID:', movie.imdb_id);
  console.log('\n  Poster URL:', movie.poster_url);
  console.log('  Backdrop URL:', movie.backdrop_url);
  
  console.log('\n  Published:', movie.is_published);
  console.log('  Slug:', movie.slug);
  console.log('\n  Page URL: http://localhost:3000/movies/' + movie.slug);
}

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: npx tsx scripts/check-movie-image.ts <slug>');
  process.exit(1);
}

checkMovie(slug).catch(console.error);
