import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function exportFinal50Movies() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 EXPORTING FINAL 50 UNPUBLISHED MOVIES');
  console.log('='.repeat(80) + '\n');

  // Fetch all remaining unpublished Telugu movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, music_director, our_rating, poster_url, synopsis, language')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false });

  if (error || !movies) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${movies.length} unpublished Telugu movies\n`);

  // Categorize by completeness
  const excellent = movies.filter(m => m.hero && m.director && m.our_rating && m.poster_url);
  const good = movies.filter(m => m.hero && m.director && m.our_rating && !m.poster_url);
  const needsRating = movies.filter(m => m.hero && m.director && !m.our_rating);
  const needsDirector = movies.filter(m => m.hero && !m.director);
  const needsHero = movies.filter(m => !m.hero);
  const edgeCases = movies.filter(m => m.release_year >= 2026 || m.title_en.includes('Jayammu'));

  console.log('📊 CATEGORIZATION:');
  console.log('-'.repeat(80));
  console.log(`✅ Excellent (hero+director+rating+poster): ${excellent.length}`);
  console.log(`⭐ Good (hero+director+rating, no poster):   ${good.length}`);
  console.log(`📝 Needs Rating (has hero+director):         ${needsRating.length}`);
  console.log(`🎬 Needs Director (has hero):                 ${needsDirector.length}`);
  console.log(`👤 Needs Hero:                                ${needsHero.length}`);
  console.log(`🔧 Edge Cases (unreleased/special):           ${edgeCases.length}`);
  console.log('='.repeat(80) + '\n');

  // Create comprehensive CSV
  const csvHeader = 'Priority,ID,Title,Year,Hero,Director,Rating,Has Poster,Synopsis (first 100),Missing Data,Action Needed\n';
  let csv = csvHeader;

  // Helper function to get priority and action
  const getMetadata = (movie: any) => {
    if (movie.release_year >= 2026) {
      return { priority: '🔧 SKIP', action: 'Unreleased film - update but do not publish' };
    }
    if (movie.title_en.includes('Jayammu')) {
      return { priority: '🔧 MANUAL', action: 'Has index error - needs SQL publish' };
    }
    if (movie.hero && movie.director && movie.our_rating && movie.poster_url) {
      return { priority: '✅ EXCELLENT', action: 'PUBLISH NOW - Complete data' };
    }
    if (movie.hero && movie.director && movie.our_rating) {
      return { priority: '⭐ GOOD', action: 'PUBLISH - Add poster later' };
    }
    if (movie.hero && movie.director) {
      return { priority: '📝 RATING', action: 'Add rating then publish' };
    }
    if (movie.hero) {
      return { priority: '🎬 DIRECTOR', action: 'Research director then publish' };
    }
    return { priority: '👤 HERO', action: 'Research hero first' };
  };

  // Sort by priority
  const sortedMovies = [...movies].sort((a, b) => {
    const priorityOrder = ['✅ EXCELLENT', '⭐ GOOD', '📝 RATING', '🎬 DIRECTOR', '👤 HERO', '🔧 SKIP', '🔧 MANUAL'];
    const aPriority = getMetadata(a).priority;
    const bPriority = getMetadata(b).priority;
    return priorityOrder.indexOf(aPriority) - priorityOrder.indexOf(bPriority);
  });

  // Build CSV
  sortedMovies.forEach(m => {
    const { priority, action } = getMetadata(m);
    const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
    const rating = m.our_rating || '';
    const missing = [];
    if (!m.hero) missing.push('hero');
    if (!m.director) missing.push('director');
    if (!m.our_rating) missing.push('rating');
    if (!m.poster_url) missing.push('poster');

    csv += `${priority},"${m.id}","${m.title_en}",${m.release_year},"${m.hero || 'MISSING'}","${m.director || 'MISSING'}",${m.our_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}","${missing.join(', ')}","${action}"\n`;
  });

  fs.writeFileSync('FINAL-50-MOVIES-REVIEW.csv', csv);
  console.log(`✅ Exported: FINAL-50-MOVIES-REVIEW.csv (${movies.length} movies)\n`);

  // Create separate files for each category
  const createCategoryCSV = (categoryMovies: any[], filename: string, categoryName: string) => {
    if (categoryMovies.length === 0) return;

    let categoryCsv = csvHeader;
    categoryMovies.forEach(m => {
      const { priority, action } = getMetadata(m);
      const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
      const rating = m.our_rating || '';
      const missing = [];
      if (!m.hero) missing.push('hero');
      if (!m.director) missing.push('director');
      if (!m.our_rating) missing.push('rating');
      if (!m.poster_url) missing.push('poster');

      categoryCsv += `${priority},"${m.id}","${m.title_en}",${m.release_year},"${m.hero || 'MISSING'}","${m.director || 'MISSING'}",${m.our_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}","${missing.join(', ')}","${action}"\n`;
    });

    fs.writeFileSync(filename, categoryCsv);
    console.log(`✅ Exported: ${filename} (${categoryMovies.length} movies) - ${categoryName}`);
  };

  createCategoryCSV(excellent, 'FINAL-50-EXCELLENT.csv', 'Ready to publish now');
  createCategoryCSV(good, 'FINAL-50-GOOD.csv', 'Publish without posters');
  createCategoryCSV(needsRating, 'FINAL-50-NEEDS-RATING.csv', 'Add ratings');
  createCategoryCSV(needsDirector, 'FINAL-50-NEEDS-DIRECTOR.csv', 'Research directors');
  createCategoryCSV(needsHero, 'FINAL-50-NEEDS-HERO.csv', 'Research heroes');
  createCategoryCSV(edgeCases, 'FINAL-50-EDGE-CASES.csv', 'Special handling');

  // Summary report
  console.log('\n' + '='.repeat(80));
  console.log('🎯 FINAL 50 MOVIES - ROADMAP TO 100%');
  console.log('='.repeat(80));

  console.log('\n**QUICK WINS (Publish Now)** ✅');
  console.log(`   Excellent Quality: ${excellent.length} movies`);
  console.log(`   Good Quality:      ${good.length} movies`);
  console.log(`   ────────────────────────────────`);
  console.log(`   Can Publish Now:   ${excellent.length + good.length} movies`);
  console.log(`   Estimated Time:    5-10 minutes`);

  console.log('\n**NEEDS RATING** 📝');
  console.log(`   Movies:            ${needsRating.length}`);
  console.log(`   Task:              Assign ratings (5.0-8.0)`);
  console.log(`   Estimated Time:    30-60 minutes`);

  console.log('\n**NEEDS DIRECTOR** 🎬');
  console.log(`   Movies:            ${needsDirector.length}`);
  console.log(`   Task:              Research on IMDb`);
  console.log(`   Estimated Time:    15-30 minutes`);

  console.log('\n**NEEDS HERO** 👤');
  console.log(`   Movies:            ${needsHero.length}`);
  console.log(`   Task:              Research on IMDb`);
  console.log(`   Estimated Time:    30-45 minutes`);

  console.log('\n**EDGE CASES** 🔧');
  console.log(`   Movies:            ${edgeCases.length}`);
  console.log(`   Task:              Skip unreleased, handle special`);
  console.log(`   Estimated Time:    5 minutes`);

  console.log('\n' + '='.repeat(80));
  console.log('📊 TOTAL TIME TO 100%');
  console.log('='.repeat(80));
  console.log(`Total Movies:     ${movies.length}`);
  console.log(`Quick Publish:    ${excellent.length + good.length} movies (5-10 mins)`);
  console.log(`Enrichment Work:  ${needsRating.length + needsDirector.length + needsHero.length} movies (1-2 hours)`);
  console.log(`Skip/Handle:      ${edgeCases.length} movies (5 mins)`);
  console.log(`────────────────────────────────────────────`);
  console.log(`Estimated Total:  1.5-2.5 hours to 100%!`);
  console.log('='.repeat(80));

  console.log('\n💡 RECOMMENDED WORKFLOW:');
  console.log('-'.repeat(80));
  console.log('1. START: Quick publish excellent + good (5-10 mins) → 99.5%+');
  console.log('2. ADD: Ratings for movies with hero+director (30-60 mins)');
  console.log('3. RESEARCH: Missing directors (15-30 mins)');
  console.log('4. RESEARCH: Missing heroes (30-45 mins)');
  console.log('5. FINISH: Handle edge cases (5 mins)');
  console.log('6. CELEBRATE: 100% COMPLETE! 🎉');
  console.log('='.repeat(80));

  return {
    total: movies.length,
    excellent: excellent.length,
    good: good.length,
    needsRating: needsRating.length,
    needsDirector: needsDirector.length,
    needsHero: needsHero.length,
    edgeCases: edgeCases.length,
  };
}

exportFinal50Movies()
  .then((result) => {
    if (result) {
      console.log(`\n✅ Export complete! ${result.total} movies ready for review.\n`);
      console.log(`🚀 Quick Win: ${result.excellent + result.good} movies can be published RIGHT NOW!\n`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
