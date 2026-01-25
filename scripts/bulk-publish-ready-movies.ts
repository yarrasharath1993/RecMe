#!/usr/bin/env npx tsx
/**
 * Bulk Publish Ready Movies
 * 
 * Publishes all movies that have sufficient data:
 * - Required: title, year, language
 * - Recommended: hero/director, rating OR poster
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');
const TELUGU_ONLY = process.argv.includes('--telugu-only');

interface PublishCriteria {
  minQuality: 'basic' | 'good' | 'excellent';
}

async function bulkPublishMovies(criteria: PublishCriteria = { minQuality: 'good' }) {
  console.log('📢 Bulk Publishing Ready Movies\n');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '✅ LIVE'}`);
  console.log(`Scope: ${TELUGU_ONLY ? '🎬 Telugu Only' : '🌍 All Languages'}`);
  console.log(`Quality: ${criteria.minQuality}\n`);
  
  // Fetch unpublished movies
  let query = supabase
    .from('movies')
    .select('id, title_en, release_year, language, hero, heroine, director, our_rating, poster_url, created_at')
    .eq('is_published', false)
    .not('title_en', 'is', null)
    .not('release_year', 'is', null)
    .not('language', 'is', null);
  
  if (TELUGU_ONLY) {
    query = query.eq('language', 'Telugu');
  }
  
  const { data: unpublishedMovies } = await query.order('release_year', { ascending: false });
  
  console.log(`📊 Total Unpublished: ${unpublishedMovies?.length || 0}\n`);
  
  if (!unpublishedMovies || unpublishedMovies.length === 0) {
    console.log('✅ No unpublished movies found!\n');
    return;
  }
  
  // Categorize by quality
  const excellent: any[] = [];  // Has everything
  const good: any[] = [];       // Has hero/director + (rating OR poster)
  const basic: any[] = [];      // Has hero/director only
  const needsReview: any[] = []; // Missing critical data
  
  for (const movie of unpublishedMovies) {
    const hasHero = !!movie.hero;
    const hasDirector = !!movie.director;
    const hasRating = !!movie.our_rating;
    const hasPoster = !!movie.poster_url;
    
    if (hasHero && hasDirector && hasRating && hasPoster) {
      excellent.push(movie);
    } else if ((hasHero || hasDirector) && (hasRating || hasPoster)) {
      good.push(movie);
    } else if (hasHero || hasDirector) {
      basic.push(movie);
    } else {
      needsReview.push(movie);
    }
  }
  
  console.log('📋 Quality Categories:\n');
  console.log(`   ⭐⭐⭐ Excellent (hero + director + rating + poster): ${excellent.length}`);
  console.log(`   ⭐⭐   Good (cast/director + rating/poster): ${good.length}`);
  console.log(`   ⭐     Basic (has cast or director only): ${basic.length}`);
  console.log(`   ❌     Needs Review (missing critical data): ${needsReview.length}\n`);
  
  // Select what to publish based on criteria
  let toPublish: any[] = [];
  
  switch (criteria.minQuality) {
    case 'excellent':
      toPublish = excellent;
      break;
    case 'good':
      toPublish = [...excellent, ...good];
      break;
    case 'basic':
      toPublish = [...excellent, ...good, ...basic];
      break;
  }
  
  console.log(`✅ Movies Ready to Publish: ${toPublish.length}\n`);
  
  if (toPublish.length === 0) {
    console.log('   No movies meet the quality criteria\n');
    return;
  }
  
  // Group by language for reporting
  const byLanguage = new Map<string, any[]>();
  toPublish.forEach(m => {
    const lang = m.language || 'Unknown';
    if (!byLanguage.has(lang)) {
      byLanguage.set(lang, []);
    }
    byLanguage.get(lang)!.push(m);
  });
  
  console.log('📊 By Language:\n');
  Array.from(byLanguage.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([lang, movies]) => {
      console.log(`   ${lang}: ${movies.length} movies`);
    });
  
  // Group by major Telugu stars
  if (TELUGU_ONLY || byLanguage.has('Telugu')) {
    console.log('\n📊 Telugu Movies by Star:\n');
    
    const teluguMovies = toPublish.filter(m => m.language === 'Telugu');
    const starCounts = new Map<string, number>();
    
    teluguMovies.forEach(m => {
      if (!m.hero) return;
      
      const hero = m.hero.toLowerCase();
      const majorStars = [
        'chiranjeevi', 'nagarjuna', 'balakrishna', 'venkatesh', 'krishna',
        'mahesh babu', 'pawan kalyan', 'allu arjun', 'jr ntr', 'ram charan',
        'prabhas', 'ravi teja', 'nani', 'vijay deverakonda',
      ];
      
      for (const star of majorStars) {
        if (hero.includes(star)) {
          starCounts.set(star, (starCounts.get(star) || 0) + 1);
          break;
        }
      }
    });
    
    Array.from(starCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([star, count]) => {
        console.log(`   ${star}: +${count} movies`);
      });
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would publish the following movies:\n');
    
    // Show sample
    const samples = toPublish.slice(0, 20);
    samples.forEach(m => {
      console.log(`   ${m.release_year} - ${m.title_en} (${m.language})`);
      console.log(`      Hero: ${m.hero || 'N/A'}, Director: ${m.director || 'N/A'}`);
      console.log(`      Rating: ${m.our_rating || 'N/A'}, Poster: ${m.poster_url ? '✅' : '❌'}`);
    });
    
    if (toPublish.length > 20) {
      console.log(`\n   ... and ${toPublish.length - 20} more\n`);
    }
    
    console.log('\n📝 To publish, run without --dry-run:\n');
    console.log(`   npx tsx scripts/bulk-publish-ready-movies.ts ${TELUGU_ONLY ? '--telugu-only' : ''}\n`);
    
  } else {
    console.log('\n⏳ Publishing movies...\n');
    
    const batchSize = 100;
    let published = 0;
    let errors = 0;
    
    for (let i = 0; i < toPublish.length; i += batchSize) {
      const batch = toPublish.slice(i, i + batchSize);
      const ids = batch.map(m => m.id);
      
      const { error } = await supabase
        .from('movies')
        .update({ is_published: true })
        .in('id', ids);
      
      if (error) {
        console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1}: Error - ${error.message}`);
        errors += batch.length;
      } else {
        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: Published ${batch.length} movies`);
        published += batch.length;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Publishing Complete!\n');
    console.log(`   Published: ${published} movies`);
    if (errors > 0) {
      console.log(`   Errors: ${errors} movies`);
    }
  }
  
  // Generate manual review list
  if (needsReview.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log(`\n📝 Manual Review Required: ${needsReview.length} movies\n`);
    console.log('   Generating review file: manual-review-needed.csv\n');
    
    const fs = await import('fs');
    const csv = [
      'ID,Title,Year,Language,Hero,Director,Rating,Poster,Issue',
      ...needsReview.map(m => {
        const issues: string[] = [];
        if (!m.hero && !m.director) issues.push('No cast/director');
        if (!m.our_rating && !m.poster_url) issues.push('No rating/poster');
        
        return [
          m.id,
          `"${m.title_en}"`,
          m.release_year,
          m.language,
          m.hero || 'MISSING',
          m.director || 'MISSING',
          m.our_rating || 'MISSING',
          m.poster_url ? 'YES' : 'MISSING',
          issues.join('; ')
        ].join(',');
      })
    ].join('\n');
    
    fs.writeFileSync('manual-review-needed.csv', csv);
    console.log('   ✅ File created: manual-review-needed.csv\n');
  }
  
  console.log('='.repeat(80));
  console.log('\n💡 Summary:\n');
  console.log(`   Total Unpublished: ${unpublishedMovies.length}`);
  console.log(`   Ready to Publish: ${toPublish.length} (${Math.round(toPublish.length/unpublishedMovies.length*100)}%)`);
  console.log(`   Need Review: ${needsReview.length} (${Math.round(needsReview.length/unpublishedMovies.length*100)}%)`);
  console.log(`   ${DRY_RUN ? 'Would publish' : 'Published'}: ${toPublish.length} movies\n`);
}

// Parse quality criteria from args
const minQuality = process.argv.includes('--excellent') ? 'excellent' :
                   process.argv.includes('--basic') ? 'basic' : 'good';

bulkPublishMovies({ minQuality }).catch(console.error);
