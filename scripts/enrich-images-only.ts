/**
 * Minimal Image Enrichment Script
 * 
 * Fetches ONLY poster/backdrop images from TMDB for movies missing them.
 * This is NOT full ingestion - just image enrichment.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface TMDBSearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

async function searchTMDB(title: string, year: number | null): Promise<TMDBSearchResult | null> {
  try {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY!,
      query: title,
      language: 'te-IN', // Telugu
      include_adult: 'false',
    });
    
    if (year) {
      params.append('year', String(year));
    }

    const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Return first result
      return data.results[0];
    }
    
    // Try without year if no results
    if (year && data.results.length === 0) {
      params.delete('year');
      const retryResponse = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
      const retryData = await retryResponse.json();
      if (retryData.results && retryData.results.length > 0) {
        return retryData.results[0];
      }
    }

    return null;
  } catch (error) {
    console.error(`Error searching TMDB for ${title}:`, error);
    return null;
  }
}

async function enrichImages() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🖼️  MINIMAL IMAGE ENRICHMENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY not found in environment!');
    return;
  }

  const dryRun = process.argv.includes('--dry-run');
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${limit} movies`);
  console.log('');

  // Fetch top movies missing images
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, our_rating')
    .eq('language', 'Telugu')
    .is('poster_url', null)
    .not('our_rating', 'is', null)
    .order('our_rating', { ascending: false })
    .limit(limit);

  if (error || !movies) {
    console.error('Error fetching movies:', error);
    return;
  }

  console.log(`📊 Found ${movies.length} movies missing images\n`);

  let enriched = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    console.log(`\n[${i + 1}/${movies.length}] ${movie.title_en} (${movie.release_year})`);

    // Search TMDB
    const tmdbResult = await searchTMDB(movie.title_en, movie.release_year);

    if (!tmdbResult) {
      console.log(`   ⚠️  Not found on TMDB`);
      notFound++;
      continue;
    }

    const posterUrl = tmdbResult.poster_path 
      ? `${TMDB_IMAGE_BASE}/w500${tmdbResult.poster_path}` 
      : null;
    const backdropUrl = tmdbResult.backdrop_path 
      ? `${TMDB_IMAGE_BASE}/original${tmdbResult.backdrop_path}` 
      : null;

    if (!posterUrl && !backdropUrl) {
      console.log(`   ⚠️  Found but no images available`);
      notFound++;
      continue;
    }

    console.log(`   ✅ TMDB ID: ${tmdbResult.id}`);
    console.log(`   📷 Poster: ${posterUrl ? 'Yes' : 'No'}`);
    console.log(`   🎬 Backdrop: ${backdropUrl ? 'Yes' : 'No'}`);

    if (dryRun) {
      console.log(`   🔍 DRY RUN - Would update`);
      enriched++;
      continue;
    }

    // Update database - only use columns that exist
    const { error: updateError } = await supabase
      .from('movies')
      .update({
        tmdb_id: tmdbResult.id,
        poster_url: posterUrl,
        backdrop_url: backdropUrl,
        ingestion_status: 'partial',
        updated_at: new Date().toISOString(),
      })
      .eq('id', movie.id);

    if (updateError) {
      console.log(`   ❌ Error: ${updateError.message}`);
      errors++;
    } else {
      console.log(`   ✅ Updated!`);
      enriched++;
    }

    // Rate limit - TMDB allows 40 requests per 10 seconds
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ENRICHMENT COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Enriched: ${enriched}`);
  console.log(`  Not found: ${notFound}`);
  console.log(`  Errors: ${errors}`);
  console.log('');

  if (dryRun) {
    console.log('💡 Run without --dry-run to apply changes');
  }
}

enrichImages();

