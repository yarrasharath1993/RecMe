#!/usr/bin/env npx tsx
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function systemAudit() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TELUGUVIBES SYSTEM AUDIT & DATA GOVERNANCE            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // === PHASE 1: DATA COVERAGE ===
  console.log('📊 PHASE 1: DATA COVERAGE ANALYSIS\n');
  console.log('───────────────────────────────────────────────────────────');

  const languages = ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'English', 'Kannada'];
  let totalMovies = 0;

  console.log('Language Coverage (movies table):');
  for (const lang of languages) {
    const { count } = await supabase
      .from('movies')
      .select('id', { count: 'exact', head: true })
      .eq('language', lang);
    
    const target = lang === 'Telugu' ? 3000 : 500;
    const status = (count || 0) >= target ? '✅' : '🟡';
    const percentage = ((count || 0) / target * 100).toFixed(1);
    
    console.log(`  ${status} ${lang.padEnd(12)}: ${count || 0} / ${target} (${percentage}%)`);
    totalMovies += (count || 0);
  }
  console.log(`\nTotal Movies: ${totalMovies}\n`);

  // === PHASE 2: DATA QUALITY ===
  console.log('🔍 PHASE 2: DATA QUALITY CHECKS\n');
  console.log('───────────────────────────────────────────────────────────');

  // Check for orphans
  const { data: orphanMovies } = await supabase
    .from('movies')
    .select('id, title')
    .is('tmdb_id', null)
    .limit(10);

  console.log(`\nOrphan Movies (no TMDB ID): ${orphanMovies?.length || 0}`);
  if (orphanMovies && orphanMovies.length > 0) {
    orphanMovies.forEach(m => console.log(`  ⚠️  ${m.title}`));
  }

  // Check for missing images
  const { count: missingPosters } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .is('poster_path', null);

  const { count: missingBackdrops } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .is('backdrop_path', null);

  console.log(`\nMissing Media:`);
  console.log(`  ${missingPosters ? '⚠️' : '✅'}  Posters: ${missingPosters || 0}`);
  console.log(`  ${missingBackdrops ? '⚠️' : '✅'}  Backdrops: ${missingBackdrops || 0}`);

  // Check for missing cast/director
  const { count: missingDirector } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .or('director.is.null,director.eq.Unknown');

  const { count: missingCast } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .or('cast.is.null,cast.eq.{}');

  console.log(`\nMissing Metadata:`);
  console.log(`  ${missingDirector ? '⚠️' : '✅'}  Director: ${missingDirector || 0}`);
  console.log(`  ${missingCast ? '⚠️' : '✅'}  Cast: ${missingCast || 0}`);

  // === PHASE 3: DUPLICATES ===
  console.log('\n🔀 PHASE 3: DUPLICATE DETECTION\n');
  console.log('───────────────────────────────────────────────────────────');

  const { data: duplicateTitles } = await supabase
    .rpc('find_duplicate_movies', {})
    .limit(10);

  console.log(`\nDuplicate Movie Titles: ${duplicateTitles?.length || 0}`);
  if (duplicateTitles && duplicateTitles.length > 0) {
    duplicateTitles.forEach((d: any) => console.log(`  ⚠️  "${d.title}" (${d.count} times)`));
  }

  // === PHASE 4: REVIEW COVERAGE ===
  console.log('\n📝 PHASE 4: REVIEW INTELLIGENCE\n');
  console.log('───────────────────────────────────────────────────────────');

  const { count: totalReviews } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true });

  const { count: aiGeneratedReviews } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('is_ai_generated', true);

  const { count: humanReviews } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('is_ai_generated', false);

  console.log(`\nReview Statistics:`);
  console.log(`  Total Reviews: ${totalReviews || 0}`);
  console.log(`  AI Generated: ${aiGeneratedReviews || 0}`);
  console.log(`  Human Written: ${humanReviews || 0}`);
  console.log(`  Coverage: ${((totalReviews || 0) / totalMovies * 100).toFixed(1)}%`);

  // === PHASE 5: CELEBRITY DATA ===
  console.log('\n🌟 PHASE 5: CELEBRITY & KNOWLEDGE GRAPH\n');
  console.log('───────────────────────────────────────────────────────────');

  const { count: totalCelebs } = await supabase
    .from('celebrities')
    .select('id', { count: 'exact', head: true });

  const { count: celebsWithImages } = await supabase
    .from('celebrities')
    .select('id', { count: 'exact', head: true })
    .not('profile_image', 'is', null);

  console.log(`\nCelebrity Data:`);
  console.log(`  Total Celebrities: ${totalCelebs || 0}`);
  console.log(`  With Profile Images: ${celebsWithImages || 0} (${((celebsWithImages || 0) / (totalCelebs || 1) * 100).toFixed(1)}%)`);

  // === PHASE 6: CONTENT SECTIONS ===
  console.log('\n📚 PHASE 6: CONTENT ECOSYSTEM\n');
  console.log('───────────────────────────────────────────────────────────');

  const { count: stories } = await supabase
    .from('stories')
    .select('id', { count: 'exact', head: true });

  const { count: health } = await supabase
    .from('health_content')
    .select('id', { count: 'exact', head: true });

  const { count: games } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true });

  const { count: posts } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true });

  console.log(`\nContent Sections:`);
  console.log(`  Stories: ${stories || 0}`);
  console.log(`  Health Articles: ${health || 0}`);
  console.log(`  Games: ${games || 0}`);
  console.log(`  Blog Posts: ${posts || 0}`);

  // === SUMMARY ===
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      AUDIT SUMMARY                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const issues: string[] = [];
  
  if (totalMovies < 6500) issues.push('⚠️  Total coverage below target (6500 movies)');
  if (missingPosters && missingPosters > 100) issues.push('⚠️  High poster missing count');
  if (orphanMovies && orphanMovies.length > 0) issues.push('⚠️  Orphan movies detected');
  if ((totalReviews || 0) / totalMovies < 0.8) issues.push('⚠️  Review coverage below 80%');
  if ((celebsWithImages || 0) / (totalCelebs || 1) < 0.5) issues.push('⚠️  Celebrity image coverage below 50%');

  if (issues.length === 0) {
    console.log('✅  System Health: EXCELLENT');
    console.log('✅  No critical issues detected');
  } else {
    console.log('Issues Detected:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }

  console.log('\n📋 Next Actions:');
  console.log('  1. Complete language coverage (500+ each)');
  console.log('  2. Run orphan resolution: pnpm orphan:resolve');
  console.log('  3. Enrich celebrity images: pnpm celebs:enrich:images');
  console.log('  4. Generate missing reviews: pnpm reviews:generate');
  console.log('  5. Validate and deduplicate: pnpm validate:parallel\n');
}

systemAudit().catch(console.error);


