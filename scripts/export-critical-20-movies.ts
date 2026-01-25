import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function exportCritical20() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 EXPORTING CRITICAL 20 MOVIES (NEEDS HERO/DIRECTOR)');
  console.log('='.repeat(80) + '\n');

  // Fetch remaining unpublished Telugu movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, our_rating, poster_url, synopsis')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false });

  if (error || !movies) {
    console.error('Error:', error);
    return;
  }

  console.log(`📊 Found ${movies.length} remaining unpublished Telugu movies\n`);

  // Categorize by critical missing data
  const needsHero = movies.filter(m => !m.hero);
  const needsDirector = movies.filter(m => m.hero && !m.director); // Has hero but missing director
  const needsBoth = movies.filter(m => !m.hero && !m.director);
  const needsRating = movies.filter(m => m.hero && m.director && !m.our_rating);
  const readyToPublish = movies.filter(m => m.hero && m.director && m.our_rating);

  console.log('📊 CATEGORIZATION:');
  console.log('-'.repeat(80));
  console.log(`🚨 CRITICAL - Needs Both Hero & Director:  ${needsBoth.length}`);
  console.log(`👤 HIGH - Needs Hero Only:                 ${needsHero.length - needsBoth.length}`);
  console.log(`🎬 HIGH - Needs Director Only:              ${needsDirector.length}`);
  console.log(`⭐ MEDIUM - Needs Rating Only:              ${needsRating.length}`);
  console.log(`✅ READY - Can Publish Now:                 ${readyToPublish.length}`);
  console.log('='.repeat(80));

  // Get top 20 critical movies (prioritize those missing hero/director)
  const critical20 = [
    ...needsBoth.slice(0, 10),
    ...needsHero.filter(m => m.director).slice(0, 5),
    ...needsDirector.slice(0, 5),
  ].slice(0, 20);

  console.log(`\n📝 Selected ${critical20.length} critical movies for review\n`);

  // Export to CSV
  const csvHeader = 'ID,Title,Year,Hero,Director,Rating,Has Poster,Synopsis (first 100 chars),MISSING DATA,PRIORITY\n';
  let csv = csvHeader;

  critical20.forEach((m, index) => {
    const missing = [];
    let priority = 'HIGH';
    
    if (!m.hero && !m.director) {
      missing.push('HERO', 'DIRECTOR');
      priority = 'CRITICAL';
    } else if (!m.hero) {
      missing.push('HERO');
      priority = 'HIGH';
    } else if (!m.director) {
      missing.push('DIRECTOR');
      priority = 'HIGH';
    }

    const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
    
    csv += `${m.id},"${m.title_en}",${m.release_year},"${m.hero || 'MISSING'}","${m.director || 'MISSING'}",${m.our_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}","${missing.join(', ')}",${priority}\n`;
  });

  fs.writeFileSync('CRITICAL-20-MOVIES-REVIEW.csv', csv);
  console.log('✅ Exported: CRITICAL-20-MOVIES-REVIEW.csv\n');

  // Also export the "ready to publish" movies
  if (readyToPublish.length > 0) {
    let readyCsv = csvHeader;
    readyToPublish.forEach(m => {
      const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
      readyCsv += `${m.id},"${m.title_en}",${m.release_year},"${m.hero}","${m.director}",${m.our_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}","NONE - READY",PUBLISH NOW\n`;
    });
    fs.writeFileSync('READY-TO-PUBLISH-NOW.csv', readyCsv);
    console.log(`✅ Exported: READY-TO-PUBLISH-NOW.csv (${readyToPublish.length} movies)\n`);
  }

  // Export remaining needs rating (for later)
  if (needsRating.length > 0) {
    let ratingCsv = csvHeader;
    needsRating.slice(0, 50).forEach(m => {
      const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
      ratingCsv += `${m.id},"${m.title_en}",${m.release_year},"${m.hero}","${m.director}",${m.our_rating || 'MISSING'},${m.poster_url ? 'YES' : 'NO'},"${synopsis}","RATING",MEDIUM\n`;
    });
    fs.writeFileSync('NEEDS-RATING-BATCH.csv', ratingCsv);
    console.log(`✅ Exported: NEEDS-RATING-BATCH.csv (${Math.min(needsRating.length, 50)} movies)\n`);
  }

  // Summary
  console.log('='.repeat(80));
  console.log('🎯 ENRICHMENT ROADMAP');
  console.log('='.repeat(80));
  console.log(`\n**STEP 1: CRITICAL 20 (${critical20.length} movies)**`);
  console.log('   → Manual research for hero/director data');
  console.log('   → Estimated time: 1-2 hours');
  console.log('   → File: CRITICAL-20-MOVIES-REVIEW.csv');
  
  if (readyToPublish.length > 0) {
    console.log(`\n**STEP 2: READY TO PUBLISH (${readyToPublish.length} movies)**`);
    console.log('   → Already have hero + director + rating');
    console.log('   → Just needs verification and publish');
    console.log('   → Estimated time: 15 minutes');
    console.log('   → File: READY-TO-PUBLISH-NOW.csv');
  }
  
  if (needsRating.length > 0) {
    console.log(`\n**STEP 3: NEEDS RATING (${needsRating.length} movies)**`);
    console.log('   → Has hero + director, needs rating');
    console.log('   → Can use TMDB API or manual estimation');
    console.log('   → Estimated time: 2-3 hours');
    console.log('   → File: NEEDS-RATING-BATCH.csv');
  }

  const totalCritical = critical20.length;
  const totalReady = readyToPublish.length;
  const totalRating = needsRating.length;
  const remaining = movies.length - totalCritical - totalReady - totalRating;

  console.log(`\n**SUMMARY:**`);
  console.log(`   Critical (Hero/Director): ${totalCritical}`);
  console.log(`   Ready to Publish:         ${totalReady}`);
  console.log(`   Needs Rating:             ${totalRating}`);
  console.log(`   Other:                    ${remaining}`);
  console.log(`   ────────────────────────────────`);
  console.log(`   TOTAL UNPUBLISHED:        ${movies.length}`);
  console.log('='.repeat(80));

  console.log('\n🎯 RECOMMENDED WORKFLOW:');
  console.log('-'.repeat(80));
  console.log('1. Review CRITICAL-20-MOVIES-REVIEW.csv');
  console.log('2. Research and add hero/director data');
  console.log('3. Apply corrections (I\'ll create script)');
  console.log('4. Publish the updated movies');
  console.log('5. Move to READY-TO-PUBLISH-NOW.csv');
  console.log('6. Verify and bulk publish');
  console.log('7. Tackle NEEDS-RATING-BATCH.csv');
  console.log('8. Estimate ratings or use TMDB API');
  console.log('='.repeat(80));

  return {
    critical20,
    readyToPublish,
    needsRating,
    totalUnpublished: movies.length,
  };
}

exportCritical20()
  .then((result) => {
    if (result) {
      console.log('\n✅ Export complete! Ready for manual review.\n');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
