#!/usr/bin/env npx tsx
/**
 * Test Search Performance
 * 
 * Verify the optimized search API returns correct results quickly
 */

async function testSearch(query: string) {
  console.log(`\n🔍 Searching for: "${query}"`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`http://localhost:3000/api/movies/search?q=${query}&limit=10`);
    const data = await response.json();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`\n📊 Results:`);
    console.log(`   Movies: ${data.movies?.length || 0}`);
    console.log(`   People: ${data.people?.length || 0}`);
    
    if (data.people && data.people.length > 0) {
      console.log(`\n👥 Top People:`);
      data.people.forEach((person: any) => {
        console.log(`   ${person.name}: ${person.movie_count} movies (${person.role}, rating: ${person.avg_rating.toFixed(1)})`);
      });
    }
    
    // Performance check
    if (duration < 1000) {
      console.log(`\n✅ Performance: EXCELLENT (<1 second)`);
    } else if (duration < 2000) {
      console.log(`\n⚠️  Performance: ACCEPTABLE (1-2 seconds)`);
    } else {
      console.log(`\n❌ Performance: SLOW (>${Math.round(duration/1000)} seconds)`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Error:`, error);
    console.log(`\n💡 Make sure dev server is running: npm run dev`);
  }
}

async function runTests() {
  console.log('🧪 Testing Search API Performance\n');
  console.log('='.repeat(60));
  
  // Test 1: Krishna (should show ~370+ movies)
  const krishnaResults = await testSearch('kris');
  
  if (krishnaResults?.people) {
    const krishna = krishnaResults.people.find((p: any) => p.name.toLowerCase() === 'krishna');
    if (krishna) {
      console.log(`\n📊 Krishna Movie Count:`);
      console.log(`   Found: ${krishna.movie_count} movies`);
      console.log(`   Expected: ~365-372 movies`);
      
      if (krishna.movie_count >= 350) {
        console.log(`   ✅ CORRECT!`);
      } else if (krishna.movie_count >= 100) {
        console.log(`   ⚠️  Better, but still missing some`);
      } else {
        console.log(`   ❌ INCORRECT (too low)`);
      }
    }
  }
  
  // Test 2: Nagarjuna
  await testSearch('naga');
  
  // Test 3: Chiranjeevi
  await testSearch('chira');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Tests complete!\n');
}

runTests().catch(console.error);
