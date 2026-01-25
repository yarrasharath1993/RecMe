#!/usr/bin/env npx tsx
/**
 * Publish Quality Movies from Batches 3, 4, 5
 * 
 * Publishes 197 movies with "Excellent" or "Good" quality:
 * - Excellent: Has hero + director + rating + poster
 * - Good: Has (hero OR director) AND (rating OR poster)
 * - Range: 1953-2018 (Batches 3, 4, 5)
 * - Language: Telugu only
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function publishQualityMovies() {
  console.log('🚀 Publishing Quality Movies (Batches 3, 4, 5)\n');
  console.log('='.repeat(80));
  
  // Fetch unpublished Telugu movies in verified range
  const { data: allMovies } = await supabase
    .from('movies')
    .select('*')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .not('title_en', 'is', null)
    .not('release_year', 'is', null)
    .gte('release_year', 1953)
    .lte('release_year', 2018)
    .order('release_year', { ascending: false });
  
  if (!allMovies || allMovies.length === 0) {
    console.log('\n❌ No movies found in range!\n');
    return;
  }
  
  console.log(`\n📊 Total movies in range (1953-2018): ${allMovies.length}\n`);
  
  // Categorize by quality
  const excellent: any[] = [];
  const good: any[] = [];
  const basic: any[] = [];
  
  for (const movie of allMovies) {
    const hasHero = !!movie.hero;
    const hasDirector = !!movie.director;
    const hasRating = !!movie.our_rating;
    const hasPoster = !!movie.poster_url;
    
    if (hasHero && hasDirector && hasRating && hasPoster) {
      excellent.push(movie);
    } else if ((hasHero || hasDirector) && (hasRating || hasPoster)) {
      good.push(movie);
    } else {
      basic.push(movie);
    }
  }
  
  const toPublish = [...excellent, ...good];
  
  console.log('📋 Quality Breakdown:\n');
  console.log(`   ⭐⭐⭐ Excellent: ${excellent.length} movies`);
  console.log(`      (hero + director + rating + poster)`);
  console.log(`   ⭐⭐   Good: ${good.length} movies`);
  console.log(`      (hero/director + rating/poster)`);
  console.log(`   ⭐     Basic: ${basic.length} movies (NOT publishing)`);
  console.log(`      (missing key data)\n`);
  console.log(`   📝 Total to publish: ${toPublish.length} movies\n`);
  
  // Breakdown by decade
  const byDecade: any = {};
  toPublish.forEach(movie => {
    const decade = Math.floor(movie.release_year / 10) * 10;
    if (!byDecade[decade]) byDecade[decade] = [];
    byDecade[decade].push(movie);
  });
  
  console.log('📅 Movies by Decade:\n');
  Object.keys(byDecade).sort().reverse().forEach(decade => {
    console.log(`   ${decade}s: ${byDecade[decade].length} movies`);
  });
  console.log();
  
  // Major stars impact
  const starCounts: any = {};
  toPublish.forEach(movie => {
    if (movie.hero) {
      const heroes = movie.hero.split(',').map((h: string) => h.trim());
      heroes.forEach((hero: string) => {
        starCounts[hero] = (starCounts[hero] || 0) + 1;
      });
    }
  });
  
  const topStars = Object.entries(starCounts)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 10);
  
  console.log('🌟 Top 10 Stars Impacted:\n');
  topStars.forEach(([star, count]) => {
    console.log(`   ${star}: +${count} movies`);
  });
  console.log();
  
  console.log('='.repeat(80));
  console.log('\n⚠️  CONFIRMATION REQUIRED\n');
  console.log(`Publishing ${toPublish.length} movies will:\n`);
  console.log(`   ✅ Make them visible on the website`);
  console.log(`   ✅ Update star filmographies`);
  console.log(`   ✅ Improve search results`);
  console.log(`   ✅ Increase database completeness\n`);
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  // 3 second delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('='.repeat(80));
  console.log('\n🎬 Publishing Movies...\n');
  
  let published = 0;
  const errors: any[] = [];
  const publishedList: any[] = [];
  
  for (const movie of toPublish) {
    try {
      const { error } = await supabase
        .from('movies')
        .update({
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', movie.id);
      
      if (error) {
        errors.push({ id: movie.id, title: movie.title_en, error: error.message });
        console.log(`   ❌ ${movie.release_year} - ${movie.title_en}: ${error.message}`);
      } else {
        published++;
        publishedList.push({
          id: movie.id,
          title: movie.title_en,
          year: movie.release_year,
          hero: movie.hero,
          director: movie.director,
          quality: excellent.includes(movie) ? 'Excellent' : 'Good',
        });
        
        // Only log every 10th movie to avoid spam
        if (published % 10 === 0) {
          console.log(`   ✅ Progress: ${published}/${toPublish.length} movies published...`);
        }
      }
    } catch (err: any) {
      errors.push({ id: movie.id, title: movie.title_en, error: err.message });
    }
  }
  
  console.log(`   ✅ Progress: ${published}/${toPublish.length} movies published.\n`);
  
  // Save published list
  fs.writeFileSync('published-movies-batch-3-4-5.json', JSON.stringify(publishedList, null, 2));
  
  console.log('='.repeat(80));
  console.log('\n📊 Publication Summary:\n');
  console.log(`   Movies in range: ${allMovies.length}`);
  console.log(`   Quality movies: ${toPublish.length}`);
  console.log(`   ✅ Successfully published: ${published}`);
  console.log(`   ❌ Errors: ${errors.length}\n`);
  
  if (errors.length > 0) {
    console.log('⚠️  Errors encountered:\n');
    errors.slice(0, 10).forEach(e => {
      console.log(`   - ${e.title}: ${e.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more\n`);
    }
    console.log();
    
    // Save errors to file
    fs.writeFileSync('publish-errors.json', JSON.stringify(errors, null, 2));
    console.log('   ⚠️  Full error list saved to publish-errors.json\n');
  }
  
  console.log('='.repeat(80));
  console.log('\n🎉 PUBLICATION COMPLETE!\n');
  console.log('📋 What was published:\n');
  console.log(`   ⭐⭐⭐ Excellent: ${excellent.filter(m => publishedList.find(p => p.id === m.id)).length} movies`);
  console.log(`   ⭐⭐   Good: ${good.filter(m => publishedList.find(p => p.id === m.id)).length} movies\n`);
  console.log('📅 Era Breakdown:\n');
  
  const publishedByDecade: any = {};
  publishedList.forEach(movie => {
    const decade = Math.floor(movie.year / 10) * 10;
    if (!publishedByDecade[decade]) publishedByDecade[decade] = [];
    publishedByDecade[decade].push(movie);
  });
  
  Object.keys(publishedByDecade).sort().reverse().forEach(decade => {
    console.log(`   ${decade}s: ${publishedByDecade[decade].length} movies`);
  });
  console.log();
  
  console.log('🌟 Impact:\n');
  console.log(`   ✅ ${published} quality-verified movies now live`);
  console.log(`   ✅ Spans 65+ years of Telugu cinema (1953-2018)`);
  console.log(`   ✅ Major stars' filmographies updated`);
  console.log(`   ✅ Historical classics preserved`);
  console.log(`   ✅ Modern films represented\n`);
  console.log('📁 Files Created:\n');
  console.log(`   ✅ published-movies-batch-3-4-5.json (${published} movies)`);
  if (errors.length > 0) {
    console.log(`   ⚠️  publish-errors.json (${errors.length} errors)\n`);
  }
  console.log();
  console.log('='.repeat(80));
  console.log('\n🎯 Next Steps:\n');
  console.log('   1. ✅ Verify movies appear on website');
  console.log('   2. ✅ Check profile pages (Chiranjeevi, NTR, Krishna, Balakrishna)');
  console.log('   3. ✅ Test search functionality');
  console.log('   4. ⏳ Review Batches 1 & 2 (23 remaining movies)');
  console.log('   5. 🎉 Celebrate - You\'ve published 197 movies!\n');
  console.log('💡 To restart server and see changes:');
  console.log('   npm run dev\n');
}

publishQualityMovies().catch(console.error);
