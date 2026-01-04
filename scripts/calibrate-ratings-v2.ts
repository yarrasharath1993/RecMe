/**
 * Calibrate Ratings V2 - More Nuanced Scoring
 * 
 * Addresses:
 * 1. Too many 9.5 ratings (should be max 5-6 true masterpieces)
 * 2. Uniform boosts creating artificial clusters
 * 3. "Must-watch" applied too liberally
 * 
 * New approach:
 * - TMDB rating is a key differentiator
 * - Boost is proportional to TMDB + year-based decay
 * - 9.0+ reserved for TMDB >= 8.0 or explicit classics
 * - More granular category assignment
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// TRUE Telugu masterpieces that deserve 9.0+ (manually curated)
const VERIFIED_MASTERPIECES = new Set([
  'baahubali-the-beginning-2015',
  'baahubali-2-the-conclusion-2017',
  'rrr-2022',
  'magadheera-2009',
  'mayabazar-1957',
  'pathala-bhairavi-1951',
  'malliswari-1951',
  'sankarabharanam-1980',
  'sagara-sangamam-1983',
  'sri-venkateswara-mahatmyam-1960'
]);

// Known blockbusters that should score 8.0-8.9
const VERIFIED_BLOCKBUSTERS = new Set([
  'athadu-2005',
  'pokiri-2006',
  'dookudu-2011',
  'srimanthudu-2015',
  'rangasthalam-2018',
  'pushpa-the-rise-2021',
  'arjun-reddy-2017',
  'eega-2012',
  'geetha-govindam-2018',
  'ala-vaikunthapurramuloo-2020',
  'fidaa-2017',
  'bommarillu-2006',
  'khaleja-2010',
  'gabbar-singh-2012',
  'attarintiki-daredi-2013',
  'race-gurram-2014',
  'temper-2015',
  'sarrainodu-2016'
]);

function calculateRatingV2(
  slug: string,
  tmdbRating: number,
  releaseYear: number,
  isBlockbusterFlag: boolean,
  isClassicFlag: boolean,
  storyScore: number,
  directionScore: number,
  performanceScores: number[],
  dbOverallRating: number
): { rating: number; category: string; reason: string } {
  
  // Base calculation from AI scores
  const scores: number[] = [];
  const weights: number[] = [];
  
  if (storyScore > 0) { scores.push(storyScore); weights.push(0.25); }
  if (directionScore > 0) { scores.push(directionScore); weights.push(0.25); }
  if (performanceScores.length > 0) {
    const avgPerf = performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length;
    scores.push(avgPerf);
    weights.push(0.20);
  }
  
  // TMDB weight: 30% (increased from 20%)
  // Cap TMDB at 8.5 to prevent suspicious inflated ratings (9.9 for random films)
  if (tmdbRating > 0) {
    const cappedTmdb = Math.min(tmdbRating, 8.5);
    scores.push(cappedTmdb);
    weights.push(0.30);
  }
  
  if (scores.length === 0) {
    return { rating: 6.0, category: 'one-time-watch', reason: 'no_scores' };
  }
  
  // Calculate weighted average
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let baseRating = 0;
  for (let i = 0; i < scores.length; i++) {
    baseRating += scores[i] * (weights[i] / totalWeight);
  }
  
  // === NUANCED BOOST SYSTEM ===
  let boost = 0;
  let reason = 'base_score';
  
  // Tier 1: Verified Masterpieces (manual curation)
  if (VERIFIED_MASTERPIECES.has(slug)) {
    boost = 1.0;
    reason = 'verified_masterpiece';
  }
  // Tier 2: Verified Blockbusters
  else if (VERIFIED_BLOCKBUSTERS.has(slug)) {
    boost = 0.5;
    reason = 'verified_blockbuster';
  }
  // Tier 3: High TMDB + Old = Classic potential
  else if (tmdbRating >= 8.0 && releaseYear < 1995) {
    boost = 0.6;
    reason = 'high_tmdb_classic';
  }
  // Tier 4: Very high TMDB (audience validated)
  else if (tmdbRating >= 8.0) {
    boost = 0.4;
    reason = 'high_tmdb';
  }
  // Tier 5: Flagged blockbuster with decent TMDB
  else if (isBlockbusterFlag && tmdbRating >= 7.0) {
    boost = 0.3;
    reason = 'flagged_blockbuster';
  }
  // Tier 6: Flagged classic with decent TMDB
  else if (isClassicFlag && tmdbRating >= 6.5) {
    boost = 0.3;
    reason = 'flagged_classic';
  }
  // Tier 7: Old film bonus (pre-1980)
  else if (releaseYear < 1980 && tmdbRating >= 6.5) {
    boost = 0.2;
    reason = 'vintage_bonus';
  }
  // Tier 8: Good TMDB general
  else if (tmdbRating >= 7.5) {
    boost = 0.2;
    reason = 'good_tmdb';
  }
  // No boost for lower rated films
  
  let finalRating = baseRating + boost;
  
  // === CEILING ENFORCEMENT ===
  // Only verified masterpieces can reach 9.0+
  if (!VERIFIED_MASTERPIECES.has(slug) && finalRating >= 9.0) {
    finalRating = 8.9;
    reason += '_capped_at_89';
  }
  
  // Cap at 9.5 for everyone
  finalRating = Math.min(9.5, Math.max(5.0, finalRating));
  finalRating = Math.round(finalRating * 10) / 10;
  
  // === CATEGORY ASSIGNMENT (more granular) ===
  let category = 'one-time-watch';
  if (VERIFIED_MASTERPIECES.has(slug) && finalRating >= 9.0) {
    category = 'masterpiece';
  } else if (finalRating >= 8.5) {
    category = 'must-watch';
  } else if (finalRating >= 8.0) {
    category = 'blockbuster';
  } else if (finalRating >= 7.5) {
    category = 'recommended';
  } else if (finalRating >= 7.0) {
    category = 'good';
  } else if (finalRating >= 6.0) {
    category = 'one-time-watch';
  } else {
    category = 'skippable';
  }
  
  return { rating: finalRating, category, reason };
}

async function calibrateV2(applyChanges: boolean = false) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 RATING CALIBRATION V2 ${applyChanges ? '(APPLYING)' : '(DRY RUN)'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Key changes:');
  console.log('  • 9.0+ reserved for verified masterpieces only');
  console.log('  • TMDB rating weight increased to 30%');
  console.log('  • More granular boost tiers');
  console.log('  • New categories: masterpiece, good');
  console.log('');

  // Fetch all reviews
  let allReviews: any[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('movie_reviews')
      .select(`
        id,
        movie_id,
        overall_rating,
        dimensions_json,
        movies!inner(
          title_en,
          slug,
          avg_rating,
          release_year,
          is_blockbuster,
          is_classic
        )
      `)
      .not('dimensions_json', 'is', null)
      .range(offset, offset + 500);

    if (error) { console.error('Error:', error); break; }
    if (!data || data.length === 0) break;
    allReviews = allReviews.concat(data);
    offset += 500;
    if (data.length < 500) break;
  }

  // Filter for reviews with verdict
  const reviewsWithVerdict = allReviews.filter(
    r => r.dimensions_json?.verdict?.final_rating
  );

  console.log(`📊 Found ${reviewsWithVerdict.length} reviews with ratings`);
  console.log('');

  let updated = 0;
  const changes: any[] = [];
  const newDist: Record<string, number> = {
    '9.0+': 0, '8.5-8.9': 0, '8.0-8.4': 0, '7.5-7.9': 0, 
    '7.0-7.4': 0, '6.5-6.9': 0, '<6.5': 0
  };

  for (const review of reviewsWithVerdict) {
    const movie = review.movies;
    const ed = review.dimensions_json;
    const oldRating = ed.verdict?.final_rating || 0;
    const oldCategory = ed.verdict?.category || 'unknown';
    
    // Extract scores
    const storyScore = ed.story_screenplay?.story_score || ed.story_screenplay?.originality_score || 0;
    const directionScore = ed.direction_technicals?.direction_score || 0;
    const perfScores = (ed.performances?.lead_actors || [])
      .map((a: any) => a.score)
      .filter((s: any) => s && s > 0);
    
    const { rating: newRating, category: newCategory, reason } = calculateRatingV2(
      movie.slug,
      movie.avg_rating || 0,
      movie.release_year || 2020,
      movie.is_blockbuster || false,
      movie.is_classic || false,
      storyScore,
      directionScore,
      perfScores,
      review.overall_rating || 0
    );
    
    // Track distribution
    if (newRating >= 9.0) newDist['9.0+']++;
    else if (newRating >= 8.5) newDist['8.5-8.9']++;
    else if (newRating >= 8.0) newDist['8.0-8.4']++;
    else if (newRating >= 7.5) newDist['7.5-7.9']++;
    else if (newRating >= 7.0) newDist['7.0-7.4']++;
    else if (newRating >= 6.5) newDist['6.5-6.9']++;
    else newDist['<6.5']++;
    
    if (Math.abs(oldRating - newRating) > 0.05 || oldCategory !== newCategory) {
      updated++;
      changes.push({
        title: movie.title_en,
        slug: movie.slug,
        oldRating,
        newRating,
        oldCategory,
        newCategory,
        reason,
        tmdb: movie.avg_rating
      });

      if (applyChanges) {
        const updatedDimensions = {
          ...ed,
          verdict: {
            ...ed.verdict,
            final_rating: newRating,
            category: newCategory,
          },
        };

        await supabase
          .from('movie_reviews')
          .update({ dimensions_json: updatedDimensions })
          .eq('id', review.id);
      }
    }
  }

  // Print results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 NEW RATING DISTRIBUTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  Object.entries(newDist).forEach(([range, count]) => {
    const pct = ((count / reviewsWithVerdict.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 5));
    console.log(`${range.padEnd(8)}: ${count.toString().padStart(3)} (${pct.padStart(5)}%) ${bar}`);
  });
  
  console.log('');
  console.log(`Updated: ${updated} / ${reviewsWithVerdict.length}`);
  console.log('');

  // Show top 20 movies (new ratings)
  const topMovies = changes
    .sort((a, b) => b.newRating - a.newRating)
    .slice(0, 20);

  console.log('📊 TOP 20 AFTER RECALIBRATION:');
  console.log('');
  console.log('| # | Rating | Movie                          | TMDB | Category     | Reason            |');
  console.log('|---|--------|--------------------------------|------|--------------|-------------------|');
  topMovies.forEach((m, i) => {
    console.log(`| ${(i+1).toString().padStart(2)} | ${m.newRating.toFixed(1)}   | ${m.title.substring(0,30).padEnd(30)} | ${(m.tmdb || 0).toFixed(1)}  | ${m.newCategory.padEnd(12)} | ${m.reason.substring(0,17)} |`);
  });

  console.log('');
  if (!applyChanges) {
    console.log('⚠️  DRY RUN - Run with --apply to apply changes');
  } else {
    console.log('✅ Changes applied to database!');
  }
}

const applyChanges = process.argv.includes('--apply');
calibrateV2(applyChanges);

