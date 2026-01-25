#!/usr/bin/env npx tsx
/**
 * Audit Unpublished Movies Pattern
 * 
 * Find why movies are unpublished and identify similar patterns
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditUnpublishedMovies() {
  console.log('🔍 Auditing Unpublished Movies Pattern\n');
  console.log('='.repeat(80));
  
  // Get all unpublished movies
  const { data: unpublishedMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, language, our_rating, poster_url, created_at')
    .eq('is_published', false)
    .order('release_year', { ascending: false });
  
  console.log(`\n📊 Total Unpublished Movies: ${unpublishedMovies?.length || 0}\n`);
  
  if (!unpublishedMovies || unpublishedMovies.length === 0) {
    console.log('   No unpublished movies found ✅\n');
    return;
  }
  
  // Analyze patterns
  const reasons = {
    missingData: [] as any[],
    missingPoster: [] as any[],
    missingRating: [] as any[],
    oldMovies: [] as any[],
    recentMovies: [] as any[],
    duplicateSuspects: [] as any[],
    complete: [] as any[],
  };
  
  for (const movie of unpublishedMovies) {
    let hasIssue = false;
    
    // Check for missing critical data
    if (!movie.hero && !movie.director) {
      reasons.missingData.push(movie);
      hasIssue = true;
    }
    
    // Check for missing poster
    if (!movie.poster_url) {
      reasons.missingPoster.push(movie);
      hasIssue = true;
    }
    
    // Check for missing rating
    if (!movie.our_rating) {
      reasons.missingRating.push(movie);
      hasIssue = true;
    }
    
    // Check if very old (pre-1980)
    if (movie.release_year && movie.release_year < 1980) {
      reasons.oldMovies.push(movie);
    }
    
    // Check if very recent (2024+)
    if (movie.release_year && movie.release_year >= 2024) {
      reasons.recentMovies.push(movie);
    }
    
    // If no issues found, might be complete but unpublished
    if (!hasIssue) {
      reasons.complete.push(movie);
    }
  }
  
  // Find potential duplicates in unpublished
  const publishedMovies = await supabase
    .from('movies')
    .select('title_en, release_year')
    .eq('is_published', true);
  
  const publishedTitles = new Map();
  publishedMovies.data?.forEach(m => {
    const key = `${m.title_en?.toLowerCase()}-${m.release_year}`;
    publishedTitles.set(key, true);
  });
  
  unpublishedMovies.forEach(m => {
    const key = `${m.title_en?.toLowerCase()}-${m.release_year}`;
    if (publishedTitles.has(key)) {
      reasons.duplicateSuspects.push(m);
    }
  });
  
  // Print results
  console.log('📋 Analysis by Category:\n');
  
  if (reasons.complete.length > 0) {
    console.log(`\n✅ COMPLETE but Unpublished (${reasons.complete.length} movies):`);
    console.log('   These have all data but are not published - SAFE TO PUBLISH\n');
    reasons.complete.forEach(m => {
      console.log(`   ${m.release_year} - ${m.title_en}`);
      console.log(`      Hero: ${m.hero || 'N/A'}`);
      console.log(`      Director: ${m.director || 'N/A'}`);
      console.log(`      Rating: ${m.our_rating || 'N/A'}`);
      console.log(`      Poster: ${m.poster_url ? '✅' : '❌'}`);
      console.log();
    });
  }
  
  if (reasons.duplicateSuspects.length > 0) {
    console.log(`\n⚠️  POTENTIAL DUPLICATES (${reasons.duplicateSuspects.length} movies):`);
    console.log('   Same title+year exists in published movies\n');
    reasons.duplicateSuspects.forEach(m => {
      console.log(`   ${m.release_year} - ${m.title_en}`);
    });
  }
  
  if (reasons.missingData.length > 0) {
    console.log(`\n❌ MISSING CRITICAL DATA (${reasons.missingData.length} movies):`);
    console.log('   Missing hero AND director - needs data enrichment\n');
    reasons.missingData.slice(0, 10).forEach(m => {
      console.log(`   ${m.release_year} - ${m.title_en}`);
    });
    if (reasons.missingData.length > 10) {
      console.log(`   ... and ${reasons.missingData.length - 10} more\n`);
    }
  }
  
  if (reasons.missingPoster.length > 0) {
    console.log(`\n📷 MISSING POSTER (${reasons.missingPoster.length} movies):`);
    console.log('   No poster_url - can be published without poster\n');
  }
  
  if (reasons.missingRating.length > 0) {
    console.log(`\n⭐ MISSING RATING (${reasons.missingRating.length} movies):`);
    console.log('   No our_rating - can be published without rating\n');
  }
  
  if (reasons.oldMovies.length > 0) {
    console.log(`\n🕰️  OLD MOVIES (${reasons.oldMovies.length} pre-1980):`);
    console.log('   Very old movies, might need verification\n');
    reasons.oldMovies.slice(0, 5).forEach(m => {
      console.log(`   ${m.release_year} - ${m.title_en}`);
    });
  }
  
  if (reasons.recentMovies.length > 0) {
    console.log(`\n🆕 RECENT/UPCOMING (${reasons.recentMovies.length} movies 2024+):`);
    console.log('   Recent or upcoming releases\n');
    reasons.recentMovies.forEach(m => {
      console.log(`   ${m.release_year} - ${m.title_en}`);
    });
  }
  
  // Group by celebrity
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Unpublished Movies by Celebrity:\n');
  
  const celebrityCounts = new Map<string, number>();
  unpublishedMovies.forEach(m => {
    const hero = m.hero || 'Unknown';
    celebrityCounts.set(hero, (celebrityCounts.get(hero) || 0) + 1);
  });
  
  const sortedCelebrities = Array.from(celebrityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  
  sortedCelebrities.forEach(([name, count]) => {
    console.log(`   ${name}: ${count} unpublished movies`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Recommendations:\n');
  
  console.log(`   1. SAFE TO PUBLISH: ${reasons.complete.length} movies`);
  console.log(`      These have all required data\n`);
  
  console.log(`   2. REVIEW DUPLICATES: ${reasons.duplicateSuspects.length} movies`);
  console.log(`      Check if these are alternate versions or true duplicates\n`);
  
  console.log(`   3. ENRICH DATA: ${reasons.missingData.length} movies`);
  console.log(`      Need hero/director information before publishing\n`);
  
  console.log(`   4. CONSIDER PUBLISHING: ${reasons.missingPoster.length} without posters`);
  console.log(`      Posters can be added later\n`);
  
  // Check Nagarjuna's unpublished specifically
  const nagarjunaUnpublished = unpublishedMovies.filter(m => 
    m.hero?.toLowerCase().includes('nagarjuna') || 
    m.heroine?.toLowerCase().includes('nagarjuna')
  );
  
  if (nagarjunaUnpublished.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log(`\n🎯 Nagarjuna's Unpublished Movies (${nagarjunaUnpublished.length}):\n`);
    
    nagarjunaUnpublished.forEach(m => {
      const isComplete = m.hero && (m.poster_url || m.our_rating);
      console.log(`   ${m.release_year} - ${m.title_en}`);
      console.log(`      Status: ${isComplete ? '✅ Ready to publish' : '⚠️  Needs enrichment'}`);
      console.log(`      Hero: ${m.hero || '❌'}`);
      console.log(`      Rating: ${m.our_rating || '❌'}`);
      console.log(`      Poster: ${m.poster_url ? '✅' : '❌'}`);
      
      // Check if duplicate
      const key = `${m.title_en?.toLowerCase()}-${m.release_year}`;
      if (publishedTitles.has(key)) {
        console.log(`      ⚠️  DUPLICATE: Same movie exists as published!`);
      }
      console.log();
    });
  }
}

auditUnpublishedMovies().catch(console.error);
