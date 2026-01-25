#!/usr/bin/env npx tsx
/**
 * Export Remaining 23 Movies for Review
 * 
 * Identifies and exports the 23 unpublished Telugu movies
 * that are outside the verified range (1953-2018)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportRemaining() {
  console.log('📋 Identifying Remaining 23 Movies for Review\n');
  console.log('='.repeat(80));
  
  // Get all unpublished Telugu movies
  const { data: allUnpublished } = await supabase
    .from('movies')
    .select('*')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .not('title_en', 'is', null)
    .not('release_year', 'is', null)
    .order('release_year', { ascending: false });
  
  if (!allUnpublished) {
    console.log('\n❌ No movies found!\n');
    return;
  }
  
  console.log(`\n📊 Total unpublished Telugu movies: ${allUnpublished.length}\n`);
  
  // Separate verified range vs remaining
  const verifiedRange = allUnpublished.filter(m => 
    m.release_year >= 1953 && m.release_year <= 2018
  );
  
  const remaining = allUnpublished.filter(m => 
    m.release_year < 1953 || m.release_year > 2018
  );
  
  console.log('📋 Breakdown:\n');
  console.log(`   Verified range (1953-2018): ${verifiedRange.length} movies`);
  console.log(`   Outside range: ${remaining.length} movies\n`);
  
  // Further breakdown
  const pre1953 = remaining.filter(m => m.release_year < 1953);
  const post2018 = remaining.filter(m => m.release_year > 2018);
  
  console.log('📅 Remaining Movies Breakdown:\n');
  console.log(`   Pre-1953 (vintage): ${pre1953.length} movies`);
  console.log(`   Post-2018 (recent): ${post2018.length} movies\n`);
  
  if (remaining.length === 0) {
    console.log('✅ All movies are in verified range!\n');
    return;
  }
  
  // Quality analysis of remaining
  const excellent = remaining.filter(m => 
    m.hero && m.director && m.our_rating && m.poster_url
  );
  const good = remaining.filter(m => 
    !excellent.includes(m) && 
    ((m.hero || m.director) && (m.our_rating || m.poster_url))
  );
  const basic = remaining.filter(m => 
    !excellent.includes(m) && !good.includes(m)
  );
  
  console.log('⭐ Quality of Remaining Movies:\n');
  console.log(`   Excellent: ${excellent.length}`);
  console.log(`   Good: ${good.length}`);
  console.log(`   Basic: ${basic.length}\n`);
  
  console.log('='.repeat(80));
  console.log('\n📝 Remaining Movies List:\n');
  
  remaining.forEach(movie => {
    const quality = excellent.includes(movie) ? '⭐⭐⭐' : 
                   good.includes(movie) ? '⭐⭐' : '⭐';
    console.log(`   ${quality} ${movie.release_year} - ${movie.title_en}`);
    console.log(`      Hero: ${movie.hero || 'Missing'}`);
    console.log(`      Director: ${movie.director || 'Missing'}`);
    console.log(`      Rating: ${movie.our_rating || 'Missing'}`);
    console.log(`      Poster: ${movie.poster_url ? 'Yes' : 'No'}`);
    console.log();
  });
  
  // Generate CSV for review
  const headers = [
    'ID',
    'Title (English)',
    'Title (Telugu)',
    'Year',
    'Quality',
    'Hero',
    'Heroine',
    'Director',
    'Music Director',
    'Producer',
    'Our Rating',
    'TMDB Rating',
    'Has Poster',
    'Poster URL',
    'Genres',
    'TMDB ID',
    'IMDb ID',
    'Slug',
    'Issues/Notes'
  ];
  
  const rows = remaining.map(movie => {
    const quality = excellent.includes(movie) ? 'Excellent' : 
                   good.includes(movie) ? 'Good' : 'Basic';
    
    const issues: string[] = [];
    if (!movie.hero) issues.push('No hero');
    if (!movie.director) issues.push('No director');
    if (!movie.our_rating) issues.push('No rating');
    if (!movie.poster_url) issues.push('No poster');
    if (movie.release_year < 1953) issues.push('Pre-1953');
    if (movie.release_year > 2018) issues.push('Post-2018');
    
    return [
      movie.id,
      `"${(movie.title_en || '').replace(/"/g, '""')}"`,
      `"${(movie.title_te || '').replace(/"/g, '""')}"`,
      movie.release_year || '',
      quality,
      `"${(movie.hero || '').replace(/"/g, '""')}"`,
      `"${(movie.heroine || '').replace(/"/g, '""')}"`,
      `"${(movie.director || '').replace(/"/g, '""')}"`,
      `"${(movie.music_director || '').replace(/"/g, '""')}"`,
      `"${(movie.producer || '').replace(/"/g, '""')}"`,
      movie.our_rating || '',
      movie.avg_rating || '',
      movie.poster_url ? 'YES' : 'NO',
      movie.poster_url || '',
      `"${(movie.genres || []).join(', ')}"`,
      movie.tmdb_id || '',
      movie.imdb_id || '',
      movie.slug || '',
      `"${issues.join('; ')}"`,
    ].join(',');
  });
  
  const csv = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync('remaining-23-movies-review.csv', csv);
  
  console.log('='.repeat(80));
  console.log('\n✅ CSV Generated: remaining-23-movies-review.csv\n');
  console.log('📊 Summary:\n');
  console.log(`   Total remaining: ${remaining.length} movies`);
  console.log(`   Pre-1953: ${pre1953.length} movies`);
  console.log(`   Post-2018: ${post2018.length} movies`);
  console.log(`   Excellent quality: ${excellent.length}`);
  console.log(`   Good quality: ${good.length}`);
  console.log(`   Basic quality: ${basic.length}\n`);
  console.log('📋 Next Steps:\n');
  console.log('   1. Open remaining-23-movies-review.csv');
  console.log('   2. Review each movie manually');
  console.log('   3. Provide corrections (if needed)');
  console.log('   4. Decide: Publish all, publish some, or hold for review\n');
}

exportRemaining().catch(console.error);
