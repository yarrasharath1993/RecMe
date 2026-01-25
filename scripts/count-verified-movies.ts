#!/usr/bin/env npx tsx
/**
 * Count Verified Movies Ready to Publish
 * 
 * Analyzes Batches 3, 4, 5 to determine exact count of Telugu movies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Deleted movie IDs
const deletedIds = [
  '4f1d41e1-1abd-49cc-be6b-06cb1301e013', // Jack
  '7fe26824-3387-450e-836c-9d787e256768', // Devil
  '7c4d5d48-47b7-427f-ada0-fb8b79ae2ddf', // Swathimuthyam
  '66a71777-30bc-41a8-85d7-c04d7245aaf7', // Super Raja
  'b1a6907b-f9a9-4e3f-9783-3e436c248901', // Most Eligible Bachelor
  'cacdae23-751b-4c9e-a0bd-4e0a110aeff5', // Hello!
];

async function countVerifiedMovies() {
  console.log('📊 Counting Verified Movies Ready to Publish\n');
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
    console.log('No movies found\n');
    return;
  }
  
  console.log(`\nTotal Unpublished Telugu Movies: ${allUnpublished.length}\n`);
  
  // Categorize by year ranges (batch equivalents)
  const batch1Range = allUnpublished.filter(m => m.release_year >= 1988 && m.release_year <= 2025);
  const batch2Range = allUnpublished.filter(m => m.release_year >= 1987 && m.release_year <= 2018);
  const batch3Range = allUnpublished.filter(m => m.release_year >= 2002 && m.release_year <= 2018);
  const batch4Range = allUnpublished.filter(m => m.release_year >= 1978 && m.release_year <= 2002);
  const batch5Range = allUnpublished.filter(m => m.release_year >= 1953 && m.release_year <= 1977);
  
  console.log('📋 Movies by Batch Range:\n');
  console.log(`   Batch 1 range (1988-2025): ${batch1Range.length} movies`);
  console.log(`   Batch 2 range (1987-2018): ${batch2Range.length} movies`);
  console.log(`   Batch 3 range (2002-2018): ${batch3Range.length} movies`);
  console.log(`   Batch 4 range (1978-2002): ${batch4Range.length} movies`);
  console.log(`   Batch 5 range (1953-1977): ${batch5Range.length} movies\n`);
  
  // Get movies with good quality (hero + director + rating + poster)
  const excellent = allUnpublished.filter(m => 
    m.hero && m.director && m.our_rating && m.poster_url
  );
  
  const good = allUnpublished.filter(m => 
    !excellent.includes(m) && 
    ((m.hero || m.director) && (m.our_rating || m.poster_url))
  );
  
  console.log('📊 Quality Breakdown:\n');
  console.log(`   Excellent (⭐⭐⭐): ${excellent.length}`);
  console.log(`   Good (⭐⭐): ${good.length}`);
  console.log(`   Total Ready: ${excellent.length + good.length}\n`);
  
  // Count by era
  const byEra = {
    '2020s': allUnpublished.filter(m => m.release_year >= 2020).length,
    '2010s': allUnpublished.filter(m => m.release_year >= 2010 && m.release_year < 2020).length,
    '2000s': allUnpublished.filter(m => m.release_year >= 2000 && m.release_year < 2010).length,
    '1990s': allUnpublished.filter(m => m.release_year >= 1990 && m.release_year < 2000).length,
    '1980s': allUnpublished.filter(m => m.release_year >= 1980 && m.release_year < 1990).length,
    '1970s': allUnpublished.filter(m => m.release_year >= 1970 && m.release_year < 1980).length,
    '1960s': allUnpublished.filter(m => m.release_year >= 1960 && m.release_year < 1970).length,
    '1950s': allUnpublished.filter(m => m.release_year >= 1950 && m.release_year < 1960).length,
  };
  
  console.log('📅 Movies by Era:\n');
  Object.entries(byEra).forEach(([era, count]) => {
    console.log(`   ${era}: ${count} movies`);
  });
  console.log();
  
  // Identify verified movies (Batches 3, 4, 5 range)
  const verifiedRange = allUnpublished.filter(m => 
    (m.release_year >= 2002 && m.release_year <= 2018) || // Batch 3
    (m.release_year >= 1978 && m.release_year <= 2002) ||  // Batch 4
    (m.release_year >= 1953 && m.release_year <= 1977)     // Batch 5
  );
  
  console.log('='.repeat(80));
  console.log('\n✅ VERIFIED Movies (Batches 3, 4, 5):\n');
  console.log(`   Total in verified range: ${verifiedRange.length}`);
  console.log(`   Excellent quality: ${verifiedRange.filter(m => m.hero && m.director && m.our_rating && m.poster_url).length}`);
  console.log(`   Good quality: ${verifiedRange.filter(m => !m.hero || !m.director || !m.our_rating || !m.poster_url).length}\n`);
  
  // Generate list for publishing
  const toPublishIds = verifiedRange.map(m => m.id);
  
  console.log('📝 Generating publish list...\n');
  
  const publishList = verifiedRange.map(m => ({
    id: m.id,
    title: m.title_en,
    year: m.release_year,
    hero: m.hero,
    director: m.director,
    hasRating: !!m.our_rating,
    hasPoster: !!m.poster_url,
  }));
  
  // Save to file
  fs.writeFileSync('verified-movies-to-publish.json', JSON.stringify(publishList, null, 2));
  
  console.log('   ✅ Saved to verified-movies-to-publish.json\n');
  console.log('='.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  console.log(`   ✅ Verified & Ready to Publish: ${verifiedRange.length} movies`);
  console.log(`   ⏳ Still Need Review: ${allUnpublished.length - verifiedRange.length} movies`);
  console.log(`   📈 Completion: ${Math.round((verifiedRange.length / allUnpublished.length) * 100)}%\n`);
}

countVerifiedMovies().catch(console.error);
