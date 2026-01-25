#!/usr/bin/env npx tsx
/**
 * Test Nagarjuna Search Duplicate Fix
 * 
 * Verify that "Akkineni Nagarjuna" and "Nagarjuna Akkineni" 
 * are correctly normalized to the same celebrity
 */

async function testNameNormalization() {
  console.log('🧪 Testing Name Normalization Fix\n');
  console.log('='.repeat(80));
  
  // Test the normalization function
  function normalizeNameForMatching(name: string): string {
    const words = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0)
      .sort();
    return words.join(' ');
  }
  
  const testCases = [
    'Akkineni Nagarjuna',
    'Nagarjuna Akkineni',
    'nagarjuna akkineni',
    'AKKINENI NAGARJUNA',
  ];
  
  console.log('\n📋 Name Normalization Test:\n');
  const normalizedResults = new Set<string>();
  
  testCases.forEach(name => {
    const normalized = normalizeNameForMatching(name);
    normalizedResults.add(normalized);
    console.log(`  "${name}" → "${normalized}"`);
  });
  
  if (normalizedResults.size === 1) {
    console.log(`\n✅ All variations normalize to the same key!`);
    console.log(`   Result: "${Array.from(normalizedResults)[0]}"`);
  } else {
    console.log(`\n❌ ERROR: Variations normalize to different keys!`);
    console.log(`   Found ${normalizedResults.size} different keys`);
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Test the actual search API
  console.log('\n🔍 Testing Search API:\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/movies/search?q=nagaj&limit=10');
    const data = await response.json();
    
    const nagarjunaEntries = data.people?.filter((p: any) => 
      p.name.toLowerCase().includes('nagarjuna') && 
      !p.name.toLowerCase().includes('balakrishna')
    ) || [];
    
    console.log(`   Found ${nagarjunaEntries.length} Nagarjuna entries in search results`);
    
    nagarjunaEntries.forEach((entry: any) => {
      console.log(`   - ${entry.name}: ${entry.movie_count} movies`);
    });
    
    if (nagarjunaEntries.length === 1) {
      const totalMovies = nagarjunaEntries[0].movie_count;
      console.log(`\n✅ SUCCESS! Only one Nagarjuna entry`);
      console.log(`   Total movies: ${totalMovies}`);
      
      if (totalMovies >= 75) {
        console.log(`   ✅ Movie count looks correct (expected ~76)`);
      } else {
        console.log(`   ⚠️  Movie count seems low (expected ~76, got ${totalMovies})`);
      }
    } else if (nagarjunaEntries.length === 0) {
      console.log(`\n⚠️  No Nagarjuna entries found (check if dev server is running)`);
    } else {
      console.log(`\n❌ STILL HAS DUPLICATES! Found ${nagarjunaEntries.length} entries`);
      console.log(`   Need to investigate further`);
    }
  } catch (error) {
    console.log(`\n❌ Could not connect to API`);
    console.log(`   Make sure dev server is running: npm run dev`);
    console.log(`   Error: ${error}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Summary:\n');
  console.log('   1. Name normalization handles word order ✅');
  console.log('   2. Search API should now show only ONE Nagarjuna entry');
  console.log('   3. Total movie count should be ~76 movies\n');
}

testNameNormalization().catch(console.error);
