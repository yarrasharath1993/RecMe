#!/usr/bin/env npx tsx
/**
 * Export Movies for Manual Review
 * 
 * Exports all 210 ready-to-publish movies with complete data
 * in CSV batches for manual review
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 50; // 50 movies per CSV file

async function exportForReview() {
  console.log('📋 Exporting Movies for Manual Review\n');
  console.log('='.repeat(80));
  
  // Fetch Telugu unpublished movies (same criteria as publish script)
  const { data: unpublishedMovies } = await supabase
    .from('movies')
    .select('*')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .not('title_en', 'is', null)
    .not('release_year', 'is', null)
    .order('release_year', { ascending: false });
  
  console.log(`\n📊 Total Unpublished Telugu Movies: ${unpublishedMovies?.length || 0}\n`);
  
  if (!unpublishedMovies || unpublishedMovies.length === 0) {
    console.log('✅ No unpublished movies found!\n');
    return;
  }
  
  // Categorize by quality (same as publish script)
  const excellent: any[] = [];
  const good: any[] = [];
  const basic: any[] = [];
  const needsReview: any[] = [];
  
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
  
  // Movies that will be published (excellent + good)
  const toPublish = [...excellent, ...good];
  
  console.log('📋 Quality Breakdown:\n');
  console.log(`   ⭐⭐⭐ Excellent: ${excellent.length}`);
  console.log(`   ⭐⭐   Good: ${good.length}`);
  console.log(`   ⭐     Basic: ${basic.length}`);
  console.log(`   ❌     Needs Review: ${needsReview.length}\n`);
  console.log(`   📝 Ready to Publish: ${toPublish.length} (Excellent + Good)\n`);
  
  // Create review directory
  const reviewDir = 'review-batches';
  if (!fs.existsSync(reviewDir)) {
    fs.mkdirSync(reviewDir);
  }
  
  console.log('='.repeat(80));
  console.log('\n📂 Creating CSV Batches...\n');
  
  // Split into batches and create CSV files
  const batches = Math.ceil(toPublish.length / BATCH_SIZE);
  
  for (let i = 0; i < batches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, toPublish.length);
    const batch = toPublish.slice(start, end);
    
    const fileName = `${reviewDir}/batch-${i + 1}-of-${batches}.csv`;
    
    // CSV Headers (all relevant fields)
    const headers = [
      'ID',
      'Title (English)',
      'Title (Telugu)',
      'Year',
      'Language',
      'Quality',
      'Hero',
      'Heroine',
      'Director',
      'Music Director',
      'Producer',
      'Writer',
      'Cinematographer',
      'Editor',
      'Our Rating',
      'TMDB Rating',
      'Has Poster',
      'Poster URL',
      'Genres',
      'Duration (min)',
      'Synopsis',
      'TMDB ID',
      'IMDb ID',
      'Slug',
      'Created At',
      'Issues/Notes'
    ];
    
    // Generate CSV rows
    const rows = batch.map(movie => {
      const quality = (movie.hero && movie.director && movie.our_rating && movie.poster_url) 
        ? 'Excellent' 
        : 'Good';
      
      const issues: string[] = [];
      if (!movie.hero) issues.push('No hero');
      if (!movie.director) issues.push('No director');
      if (!movie.our_rating) issues.push('No rating');
      if (!movie.poster_url) issues.push('No poster');
      if (!movie.heroine) issues.push('No heroine');
      if (!movie.music_director) issues.push('No music director');
      
      return [
        movie.id,
        `"${(movie.title_en || '').replace(/"/g, '""')}"`,
        `"${(movie.title_te || '').replace(/"/g, '""')}"`,
        movie.release_year || '',
        movie.language || '',
        quality,
        `"${(movie.hero || '').replace(/"/g, '""')}"`,
        `"${(movie.heroine || '').replace(/"/g, '""')}"`,
        `"${(movie.director || '').replace(/"/g, '""')}"`,
        `"${(movie.music_director || '').replace(/"/g, '""')}"`,
        `"${(movie.producer || '').replace(/"/g, '""')}"`,
        `"${(movie.writer || '').replace(/"/g, '""')}"`,
        `"${(movie.cinematographer || '').replace(/"/g, '""')}"`,
        `"${(movie.editor || '').replace(/"/g, '""')}"`,
        movie.our_rating || '',
        movie.avg_rating || '',
        movie.poster_url ? 'YES' : 'NO',
        movie.poster_url || '',
        `"${(movie.genres || []).join(', ')}"`,
        movie.duration_minutes || '',
        `"${(movie.synopsis || '').replace(/"/g, '""').substring(0, 200)}"`,
        movie.tmdb_id || '',
        movie.imdb_id || '',
        movie.slug || '',
        movie.created_at ? new Date(movie.created_at).toISOString().split('T')[0] : '',
        `"${issues.join('; ')}"`,
      ].join(',');
    });
    
    // Write CSV file
    const csv = [headers.join(','), ...rows].join('\n');
    fs.writeFileSync(fileName, csv);
    
    console.log(`   ✅ Batch ${i + 1}: ${fileName} (${batch.length} movies)`);
    console.log(`      Years: ${batch[batch.length - 1].release_year} - ${batch[0].release_year}`);
    console.log(`      Excellent: ${batch.filter(m => m.hero && m.director && m.our_rating && m.poster_url).length}`);
    console.log(`      Good: ${batch.filter(m => !(m.hero && m.director && m.our_rating && m.poster_url)).length}`);
    console.log();
  }
  
  // Create summary file
  const summaryFile = `${reviewDir}/REVIEW-SUMMARY.txt`;
  const summary = `
REVIEW BATCHES SUMMARY
Generated: ${new Date().toISOString()}

Total Movies to Review: ${toPublish.length}
Number of Batches: ${batches}
Movies per Batch: ${BATCH_SIZE}

Quality Breakdown:
- Excellent (⭐⭐⭐): ${excellent.length} movies
- Good (⭐⭐): ${good.length} movies

Files Created:
${Array.from({ length: batches }, (_, i) => 
  `- batch-${i + 1}-of-${batches}.csv (${Math.min(BATCH_SIZE, toPublish.length - i * BATCH_SIZE)} movies)`
).join('\n')}

REVIEW CHECKLIST:
================

For each movie in the CSV files, verify:

1. ✅ Title (English & Telugu)
   - Correct spelling
   - Matches IMDb/TMDB

2. ✅ Year
   - Correct release year
   - Not a future date (unless upcoming)

3. ✅ Hero/Heroine
   - Correct lead actors
   - Proper name format (not duplicate actors)
   - Handle multi-cast (comma-separated if needed)

4. ✅ Director
   - Correct director name
   - Proper spelling

5. ✅ Music Director
   - If missing, add if known

6. ✅ Rating
   - Our editorial rating (1-10)
   - Should reflect movie quality
   - Compare with IMDb/TMDB ratings

7. ✅ Poster
   - Check if poster URL works
   - Good quality image
   - Add if missing

8. ✅ Other Crew
   - Producer, writer, cinematographer, editor
   - Add if easily available

9. ✅ Genres
   - Verify genres are correct
   - Add if missing

10. ✅ Synopsis
    - Brief but informative
    - No spoilers
    - Add if missing

REVIEW PROCESS:
==============

1. Open each CSV in Excel/Google Sheets
2. Review movies row by row
3. Mark issues in "Issues/Notes" column
4. For movies with issues:
   - Look up on IMDb/TMDB
   - Add missing data
   - Fix incorrect data
5. Save changes
6. Report back which movies are ready to publish

QUALITY LEVELS:
==============

Excellent (⭐⭐⭐): Has hero, director, rating, poster
- Safe to publish immediately
- No issues expected

Good (⭐⭐): Has cast/director + rating/poster
- Generally safe to publish
- Minor gaps acceptable
- Review for critical errors only

COMMON ISSUES TO CHECK:
======================

1. Duplicate Actors
   - "Krishna" vs "Superstar Krishna"
   - "Nagarjuna Akkineni" vs "Akkineni Nagarjuna"

2. Wrong Hero
   - Multi-cast movies might have wrong primary hero
   - Special appearances listed as hero

3. Wrong Year
   - Release year vs production year
   - Re-releases with wrong year

4. Missing Telugu Title
   - Add if possible

5. Poor Quality Posters
   - Replace if better available

6. Incorrect Ratings
   - Adjust if seems wrong (0 or 10 are suspicious)

After review, report:
- How many approved for publishing
- How many need fixes
- List of specific issues found
`;
  
  fs.writeFileSync(summaryFile, summary);
  console.log(`   ✅ Summary: ${summaryFile}\n`);
  
  // Create master file (all movies in one CSV)
  const masterFile = `${reviewDir}/ALL-MOVIES-MASTER.csv`;
  const masterHeaders = [
    'ID',
    'Title (English)',
    'Title (Telugu)',
    'Year',
    'Language',
    'Quality',
    'Hero',
    'Heroine',
    'Director',
    'Music Director',
    'Producer',
    'Writer',
    'Cinematographer',
    'Editor',
    'Our Rating',
    'TMDB Rating',
    'Has Poster',
    'Poster URL',
    'Genres',
    'Duration (min)',
    'TMDB ID',
    'IMDb ID',
    'Slug',
    'Issues/Notes'
  ];
  
  const masterRows = toPublish.map(movie => {
    const quality = (movie.hero && movie.director && movie.our_rating && movie.poster_url) 
      ? 'Excellent' 
      : 'Good';
    
    const issues: string[] = [];
    if (!movie.hero) issues.push('No hero');
    if (!movie.director) issues.push('No director');
    if (!movie.our_rating) issues.push('No rating');
    if (!movie.poster_url) issues.push('No poster');
    if (!movie.heroine) issues.push('No heroine');
    if (!movie.music_director) issues.push('No music director');
    
    return [
      movie.id,
      `"${(movie.title_en || '').replace(/"/g, '""')}"`,
      `"${(movie.title_te || '').replace(/"/g, '""')}"`,
      movie.release_year || '',
      movie.language || '',
      quality,
      `"${(movie.hero || '').replace(/"/g, '""')}"`,
      `"${(movie.heroine || '').replace(/"/g, '""')}"`,
      `"${(movie.director || '').replace(/"/g, '""')}"`,
      `"${(movie.music_director || '').replace(/"/g, '""')}"`,
      `"${(movie.producer || '').replace(/"/g, '""')}"`,
      `"${(movie.writer || '').replace(/"/g, '""')}"`,
      `"${(movie.cinematographer || '').replace(/"/g, '""')}"`,
      `"${(movie.editor || '').replace(/"/g, '""')}"`,
      movie.our_rating || '',
      movie.avg_rating || '',
      movie.poster_url ? 'YES' : 'NO',
      movie.poster_url || '',
      `"${(movie.genres || []).join(', ')}"`,
      movie.duration_minutes || '',
      movie.tmdb_id || '',
      movie.imdb_id || '',
      movie.slug || '',
      `"${issues.join('; ')}"`,
    ].join(',');
  });
  
  const masterCsv = [masterHeaders.join(','), ...masterRows].join('\n');
  fs.writeFileSync(masterFile, masterCsv);
  console.log(`   ✅ Master: ${masterFile} (all ${toPublish.length} movies)\n`);
  
  console.log('='.repeat(80));
  console.log('\n✅ Export Complete!\n');
  console.log(`📂 Review Folder: ${reviewDir}/\n`);
  console.log('📝 Files Created:\n');
  console.log(`   - ${batches} batch CSV files (${BATCH_SIZE} movies each)`);
  console.log(`   - 1 master CSV (all ${toPublish.length} movies)`);
  console.log(`   - 1 summary file (review instructions)\n`);
  console.log('='.repeat(80));
  console.log('\n📋 Next Steps:\n');
  console.log('   1. Open review-batches/ folder');
  console.log('   2. Start with batch-1-of-X.csv');
  console.log('   3. Open in Excel/Google Sheets');
  console.log('   4. Review each movie row by row');
  console.log('   5. Mark issues in "Issues/Notes" column');
  console.log('   6. Report back which movies are approved\n');
  console.log('💡 Tip: Read REVIEW-SUMMARY.txt for complete checklist\n');
}

exportForReview().catch(console.error);
