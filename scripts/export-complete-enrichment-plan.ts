import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function exportCompleteEnrichmentPlan() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 EXPORTING COMPLETE ENRICHMENT PLAN - ALL 123 MOVIES');
  console.log('='.repeat(80) + '\n');

  // Fetch all remaining unpublished Telugu movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, music_director, our_rating, poster_url, synopsis')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false });

  if (error || !movies) {
    console.error('Error:', error);
    return;
  }

  console.log(`📊 Found ${movies.length} unpublished Telugu movies\n`);

  // Categorize ALL movies
  const needsHero = movies.filter(m => !m.hero);
  const needsDirector = movies.filter(m => m.hero && !m.director);
  const needsRating = movies.filter(m => m.hero && m.director && !m.our_rating);
  const readyToPublish = movies.filter(m => m.hero && m.director && m.our_rating);
  const edgeCases = movies.filter(m => m.title_en.includes('Devara') || m.title_en.includes('Jayammu'));

  console.log('📊 COMPLETE CATEGORIZATION:');
  console.log('-'.repeat(80));
  console.log(`🚨 Phase 1 - Needs Hero:          ${needsHero.length} movies`);
  console.log(`📝 Phase 2 - Needs Director:      ${needsDirector.length} movies`);
  console.log(`⭐ Phase 3 - Needs Rating:        ${needsRating.length} movies`);
  console.log(`✅ Phase 4 - Ready to Publish:    ${readyToPublish.length} movies`);
  console.log(`🔧 Phase 5 - Edge Cases:          ${edgeCases.length} movies`);
  console.log('='.repeat(80));

  const csvHeader = 'ID,Title,Year,Hero,Director,Rating,Has Poster,Synopsis (first 100),Missing Data,Research Notes\n';

  // ===== PHASE 1: NEEDS HERO (25 movies) =====
  console.log('\n📝 Phase 1: Exporting movies needing HERO data...');
  let phase1Csv = csvHeader;
  
  needsHero.forEach(m => {
    const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
    const researchNote = getResearchNote(m.title_en, m.release_year);
    phase1Csv += `${m.id},"${m.title_en}",${m.release_year},"MISSING","${m.director || 'MISSING'}",${m.our_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}","HERO","${researchNote}"\n`;
  });
  
  fs.writeFileSync('PHASE-1-NEEDS-HERO.csv', phase1Csv);
  console.log(`✅ Exported: PHASE-1-NEEDS-HERO.csv (${needsHero.length} movies)`);

  // ===== PHASE 2: NEEDS DIRECTOR (7 movies) =====
  console.log('\n📝 Phase 2: Exporting movies needing DIRECTOR data...');
  let phase2Csv = csvHeader;
  
  needsDirector.forEach(m => {
    const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
    const researchNote = getResearchNote(m.title_en, m.release_year);
    phase2Csv += `${m.id},"${m.title_en}",${m.release_year},"${m.hero}","MISSING",${m.our_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}","DIRECTOR","${researchNote}"\n`;
  });
  
  fs.writeFileSync('PHASE-2-NEEDS-DIRECTOR.csv', phase2Csv);
  console.log(`✅ Exported: PHASE-2-NEEDS-DIRECTOR.csv (${needsDirector.length} movies)`);

  // ===== PHASE 3: NEEDS RATING (89 movies) =====
  console.log('\n📝 Phase 3: Exporting movies needing RATING data...');
  let phase3Csv = csvHeader;
  
  needsRating.forEach(m => {
    const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
    const suggestedRating = getSuggestedRating(m);
    phase3Csv += `${m.id},"${m.title_en}",${m.release_year},"${m.hero}","${m.director}",MISSING (suggest: ${suggestedRating}),${m.poster_url ? 'YES' : 'NO'},"${synopsis}","RATING","Suggested: ${suggestedRating}"\n`;
  });
  
  fs.writeFileSync('PHASE-3-NEEDS-RATING.csv', phase3Csv);
  console.log(`✅ Exported: PHASE-3-NEEDS-RATING.csv (${needsRating.length} movies)`);

  // ===== PHASE 4: READY TO PUBLISH (if any remain) =====
  if (readyToPublish.length > 0) {
    console.log('\n📝 Phase 4: Exporting movies READY to publish...');
    let phase4Csv = csvHeader;
    
    readyToPublish.forEach(m => {
      const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
      phase4Csv += `${m.id},"${m.title_en}",${m.release_year},"${m.hero}","${m.director}",${m.our_rating},${m.poster_url ? 'YES' : 'NO'},"${synopsis}","NONE - READY","Verify and publish"\n`;
    });
    
    fs.writeFileSync('PHASE-4-READY-TO-PUBLISH.csv', phase4Csv);
    console.log(`✅ Exported: PHASE-4-READY-TO-PUBLISH.csv (${readyToPublish.length} movies)`);
  }

  // Create master tracking file
  console.log('\n📝 Creating master tracking file...');
  let masterCsv = 'Phase,Count,Status,Priority,Estimated Time\n';
  masterCsv += `Phase 1 - Hero Data,${needsHero.length},CRITICAL,🚨 HIGH,2 hours\n`;
  masterCsv += `Phase 2 - Director Data,${needsDirector.length},HIGH,📝 MEDIUM,30 minutes\n`;
  masterCsv += `Phase 3 - Rating Data,${needsRating.length},MEDIUM,⭐ LOW,3 hours\n`;
  masterCsv += `Phase 4 - Ready to Publish,${readyToPublish.length},READY,✅ NOW,15 minutes\n`;
  masterCsv += `TOTAL,${movies.length},IN PROGRESS,-,~6 hours\n`;
  
  fs.writeFileSync('MASTER-ENRICHMENT-TRACKING.csv', masterCsv);
  console.log(`✅ Exported: MASTER-ENRICHMENT-TRACKING.csv`);

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('🎯 COMPLETE ENRICHMENT ROADMAP');
  console.log('='.repeat(80));
  
  console.log('\n**PHASE 1: HERO DATA (CRITICAL)** 🚨');
  console.log(`   Movies: ${needsHero.length}`);
  console.log(`   Time: 2 hours`);
  console.log(`   File: PHASE-1-NEEDS-HERO.csv`);
  console.log(`   Action: Research on IMDb/Wikipedia, fill in hero names`);
  
  console.log('\n**PHASE 2: DIRECTOR DATA** 📝');
  console.log(`   Movies: ${needsDirector.length}`);
  console.log(`   Time: 30 minutes`);
  console.log(`   File: PHASE-2-NEEDS-DIRECTOR.csv`);
  console.log(`   Action: Quick IMDb lookup for director names`);
  
  console.log('\n**PHASE 3: RATING DATA** ⭐');
  console.log(`   Movies: ${needsRating.length}`);
  console.log(`   Time: 3 hours`);
  console.log(`   File: PHASE-3-NEEDS-RATING.csv`);
  console.log(`   Action: Use suggested ratings or research TMDB/IMDb`);
  
  if (readyToPublish.length > 0) {
    console.log('\n**PHASE 4: READY TO PUBLISH** ✅');
    console.log(`   Movies: ${readyToPublish.length}`);
    console.log(`   Time: 15 minutes`);
    console.log(`   File: PHASE-4-READY-TO-PUBLISH.csv`);
    console.log(`   Action: Quick verification and bulk publish`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 EXECUTION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Movies: ${movies.length}`);
  console.log(`Total Time: ~6 hours`);
  console.log(`Final Result: 5,527 published (99.96%!)`);
  console.log('='.repeat(80));

  console.log('\n💡 WORKFLOW TIPS:');
  console.log('-'.repeat(80));
  console.log('1. Start with Phase 1 (most critical)');
  console.log('2. Use IMDb for hero/director research');
  console.log('3. Phase 3 has suggested ratings - review and adjust');
  console.log('4. Work in batches of 10-20 movies');
  console.log('5. Send corrections as you complete each phase');
  console.log('='.repeat(80));

  return {
    needsHero: needsHero.length,
    needsDirector: needsDirector.length,
    needsRating: needsRating.length,
    readyToPublish: readyToPublish.length,
    total: movies.length,
  };
}

function getResearchNote(title: string, year: number): string {
  if (year >= 2010) return 'Recent film - check IMDb/TMDB';
  if (year >= 2000) return 'Modern era - IMDb should have data';
  if (year >= 1990) return 'Check IMDb or Telugu film databases';
  if (year >= 1980) return 'Classic era - may need deeper research';
  return 'Vintage film - Wikipedia or archives';
}

function getSuggestedRating(movie: any): string {
  const { hero, director, release_year } = movie;
  
  // Check for legendary directors
  const legendaryDirectors = ['K. Viswanath', 'K. Raghavendra Rao', 'Dasari Narayana Rao', 'S. S. Rajamouli', 'Singeetam Srinivasa Rao'];
  if (legendaryDirectors.some(d => director?.includes(d))) return '7.5-8.0';
  
  // Check for legendary actors
  const legendaryActors = ['Chiranjeevi', 'N. T. Rama Rao', 'Akkineni Nageswara Rao', 'Krishnam Raju', 'Sobhan Babu'];
  if (legendaryActors.some(a => hero?.includes(a))) return '7.0-7.5';
  
  // Modern stars
  const modernStars = ['Prabhas', 'Mahesh Babu', 'Allu Arjun', 'Ram Charan', 'Jr NTR'];
  if (modernStars.some(a => hero?.includes(a))) return '6.5-7.5';
  
  // Decade-based defaults
  if (release_year >= 2010) return '6.0-7.0';
  if (release_year >= 2000) return '6.0-6.5';
  if (release_year >= 1990) return '5.5-6.5';
  if (release_year >= 1980) return '6.0-7.0'; // Golden era
  
  return '6.0-7.0'; // Vintage classics
}

exportCompleteEnrichmentPlan()
  .then((result) => {
    if (result) {
      console.log('\n✅ Complete enrichment plan exported! Ready to work through all phases.\n');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
