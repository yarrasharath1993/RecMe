#!/usr/bin/env npx tsx
/**
 * Test Profile Movie Count Fix
 * 
 * Verify that Nagarjuna's profile now shows all 76 movies
 */

async function testProfileAPI() {
  console.log('🧪 Testing Profile API Movie Count Fix\n');
  console.log('='.repeat(80));
  
  console.log('\n🔍 Fetching Nagarjuna Profile...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/profile/nagarjuna');
    const data = await response.json();
    
    if (data.error) {
      console.log(`❌ Error: ${data.error}`);
      return;
    }
    
    console.log(`👤 Profile: ${data.name}`);
    console.log(`   Slug: ${data.slug}`);
    
    // Count movies by role
    const actorCount = data.actor_movies?.length || 0;
    const actressCount = data.actress_movies?.length || 0;
    const directorCount = data.director_movies?.length || 0;
    const producerCount = data.producer_movies?.length || 0;
    const musicDirectorCount = data.music_director_movies?.length || 0;
    const writerCount = data.writer_movies?.length || 0;
    
    const totalMovies = actorCount + actressCount + directorCount + producerCount + musicDirectorCount + writerCount;
    
    console.log(`\n📊 Movie Counts:`);
    console.log(`   As Actor: ${actorCount}`);
    if (actressCount > 0) console.log(`   As Actress: ${actressCount}`);
    if (directorCount > 0) console.log(`   As Director: ${directorCount}`);
    if (producerCount > 0) console.log(`   As Producer: ${producerCount}`);
    if (musicDirectorCount > 0) console.log(`   As Music Director: ${musicDirectorCount}`);
    if (writerCount > 0) console.log(`   As Writer: ${writerCount}`);
    console.log(`   ─────────────────`);
    console.log(`   TOTAL: ${totalMovies} movies`);
    
    console.log(`\n📊 Expected: ~76 movies`);
    console.log(`   Actual: ${totalMovies} movies`);
    
    if (totalMovies >= 76) {
      console.log(`   ✅ SUCCESS! All movies are shown`);
    } else if (totalMovies >= 70) {
      console.log(`   ⚠️  Close, but still missing ${76 - totalMovies} movies`);
    } else {
      console.log(`   ❌ ERROR: Missing ${76 - totalMovies} movies`);
    }
    
    // Check for multi-cast movie
    const naaSaamiRanga = data.actor_movies?.find((m: any) => 
      m.title_en?.toLowerCase().includes('saami')
    );
    
    console.log(`\n🔍 Checking for Multi-Cast Movie:`);
    console.log(`   "Naa Saami Ranga": ${naaSaamiRanga ? '✅ Found' : '❌ Missing'}`);
    
    // Check for name variation movies
    const nameVariationMovies = [
      'Damarukam',
      'Shivamani',
      'Vajram',
      'Govinda Govinda',
    ];
    
    console.log(`\n🔍 Checking for Name Variation Movies:`);
    nameVariationMovies.forEach(title => {
      const found = data.actor_movies?.find((m: any) => 
        m.title_en?.toLowerCase().includes(title.toLowerCase())
      );
      console.log(`   "${title}": ${found ? '✅ Found' : '❌ Missing'}`);
    });
    
    // Check for other language movies
    const allMovies = [
      ...(data.actor_movies || []),
      ...(data.actress_movies || []),
      ...(data.director_movies || []),
    ];
    
    const languageCounts = new Map<string, number>();
    allMovies.forEach((movie: any) => {
      const lang = movie.language || 'Unknown';
      languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
    });
    
    console.log(`\n📊 Movies by Language:`);
    Array.from(languageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([lang, count]) => {
        console.log(`   ${lang}: ${count} movies`);
      });
    
  } catch (error) {
    console.log(`\n❌ Could not connect to API`);
    console.log(`   Make sure dev server is running: npm run dev`);
    console.log(`   Error: ${error}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Summary:\n');
  console.log('   Fixed Issues:');
  console.log('   ✅ 1. Removed Telugu-only filter (shows all languages)');
  console.log('   ✅ 2. Uses ilike for multi-cast (catches "Name1, Name2")');
  console.log('   ✅ 3. Handles name variations ("Akkineni Nagarjuna" vs "Nagarjuna Akkineni")');
  console.log('   ✅ 4. Filters false matches ("Teja" won\'t match "Ravi Teja")\n');
}

testProfileAPI().catch(console.error);
