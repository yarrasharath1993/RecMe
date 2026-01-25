#!/usr/bin/env npx tsx
/**
 * Audit Unpublished Telugu Movies
 * 
 * Focus on Telugu movies and major stars
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditTeluguUnpublished() {
  console.log('🎬 Auditing Unpublished Telugu Movies\n');
  console.log('='.repeat(80));
  
  // Get Telugu unpublished movies
  const { data: teluguUnpublished } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, our_rating, poster_url')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false });
  
  console.log(`\n📊 Telugu Unpublished Movies: ${teluguUnpublished?.length || 0}\n`);
  
  if (!teluguUnpublished || teluguUnpublished.length === 0) {
    console.log('   No unpublished Telugu movies ✅\n');
    return;
  }
  
  // Categorize
  const complete = teluguUnpublished.filter(m => m.hero && m.our_rating && m.poster_url);
  const completeNoRating = teluguUnpublished.filter(m => m.hero && m.poster_url && !m.our_rating);
  const missingData = teluguUnpublished.filter(m => !m.hero || (!m.our_rating && !m.poster_url));
  
  console.log('📋 Categories:\n');
  console.log(`   ✅ Complete (hero + rating + poster): ${complete.length}`);
  console.log(`   ⚠️  Complete (hero + poster, no rating): ${completeNoRating.length}`);
  console.log(`   ❌ Missing data: ${missingData.length}\n`);
  
  // Group by major stars
  const starCounts = new Map<string, any[]>();
  
  teluguUnpublished.forEach(m => {
    if (!m.hero) return;
    
    const hero = m.hero.toLowerCase();
    const majorStars = [
      'chiranjeevi', 'nagarjuna', 'balakrishna', 'venkatesh', 'krishna',
      'mahesh babu', 'pawan kalyan', 'allu arjun', 'jr ntr', 'ram charan',
      'prabhas', 'ravi teja', 'nani', 'vijay deverakonda', 'ntr',
    ];
    
    for (const star of majorStars) {
      if (hero.includes(star)) {
        if (!starCounts.has(star)) {
          starCounts.set(star, []);
        }
        starCounts.get(star)!.push(m);
        break;
      }
    }
  });
  
  console.log('📊 Unpublished Movies by Major Stars:\n');
  
  const sortedStars = Array.from(starCounts.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedStars.forEach(([star, movies]) => {
    const completeCount = movies.filter(m => m.hero && m.our_rating && m.poster_url).length;
    console.log(`   ${star.toUpperCase()}: ${movies.length} movies (${completeCount} complete)`);
  });
  
  // Nagarjuna detailed
  const nagarjunaMovies = sortedStars.find(([star]) => star === 'nagarjuna')?.[1] || [];
  
  if (nagarjunaMovies.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log(`\n🎯 Nagarjuna's ${nagarjunaMovies.length} Unpublished Telugu Movies:\n`);
    
    nagarjunaMovies.forEach(m => {
      const isComplete = m.hero && m.our_rating && m.poster_url;
      console.log(`   ${m.release_year} - ${m.title_en}`);
      console.log(`      Hero: ${m.hero}`);
      console.log(`      Rating: ${m.our_rating ? `${m.our_rating} ⭐` : '❌'}`);
      console.log(`      Poster: ${m.poster_url ? '✅' : '❌'}`);
      console.log(`      Status: ${isComplete ? '✅ READY TO PUBLISH' : '⚠️  Needs enrichment'}`);
      console.log();
    });
  }
  
  // Check for duplicates with published
  console.log('='.repeat(80));
  console.log('\n🔍 Checking for Potential Duplicates:\n');
  
  const { data: publishedTelugu } = await supabase
    .from('movies')
    .select('title_en, release_year, hero')
    .eq('is_published', true)
    .eq('language', 'Telugu');
  
  const publishedMap = new Map();
  publishedTelugu?.forEach(m => {
    const key = `${m.title_en?.toLowerCase()}-${m.release_year}`;
    publishedMap.set(key, m);
  });
  
  const duplicates = teluguUnpublished.filter(m => {
    const key = `${m.title_en?.toLowerCase()}-${m.release_year}`;
    return publishedMap.has(key);
  });
  
  if (duplicates.length > 0) {
    console.log(`   Found ${duplicates.length} potential duplicates:\n`);
    duplicates.slice(0, 10).forEach(m => {
      console.log(`   ${m.release_year} - ${m.title_en}`);
      console.log(`      Unpublished hero: ${m.hero}`);
      const published = publishedMap.get(`${m.title_en?.toLowerCase()}-${m.release_year}`);
      console.log(`      Published hero: ${published?.hero}`);
      console.log();
    });
    
    if (duplicates.length > 10) {
      console.log(`   ... and ${duplicates.length - 10} more\n`);
    }
  } else {
    console.log('   No duplicates found ✅\n');
  }
  
  console.log('='.repeat(80));
  console.log('\n💡 Recommendations:\n');
  
  console.log(`   1. PUBLISH IMMEDIATELY: ${complete.length} complete Telugu movies`);
  console.log(`      These have all required data (hero, rating, poster)\n`);
  
  console.log(`   2. PUBLISH WITHOUT RATING: ${completeNoRating.length} movies`);
  console.log(`      These have hero and poster, ratings can be added later\n`);
  
  console.log(`   3. REVIEW DUPLICATES: ${duplicates.length} movies`);
  console.log(`      Check if these are true duplicates or alternate versions\n`);
  
  console.log(`   4. ENRICH THEN PUBLISH: ${missingData.length} movies`);
  console.log(`      Need hero or rating/poster data\n`);
  
  // Estimate impact on major stars
  console.log('\n📊 Impact on Profile Pages After Publishing:\n');
  
  for (const [star, movies] of sortedStars) {
    const completeCount = movies.filter(m => m.hero && m.our_rating && m.poster_url).length;
    
    if (completeCount > 0) {
      console.log(`   ${star}: +${completeCount} complete movies to publish`);
    }
  }
  
  console.log('\n');
}

auditTeluguUnpublished().catch(console.error);
