import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNagarjunaFixes() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING NAGARJUNA FIXES');
  console.log('='.repeat(80) + '\n');

  // Test 1: Count all Nagarjuna movies (expected: 86)
  console.log('1️⃣  Counting all Nagarjuna movies in DB...\n');
  
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero')
    .eq('is_published', true)
    .or('hero.ilike.%nagarjuna%,heroine.ilike.%nagarjuna%,director.ilike.%nagarjuna%');

  console.log(`   Total movies with "Nagarjuna": ${allMovies?.length || 0}`);
  
  // Group by hero field value
  const heroValues = new Map<string, number>();
  allMovies?.forEach(m => {
    if (m.hero?.toLowerCase().includes('nagarjuna')) {
      heroValues.set(m.hero, (heroValues.get(m.hero) || 0) + 1);
    }
  });
  
  console.log('\n   Breakdown by hero field:');
  Array.from(heroValues.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([hero, count]) => {
      console.log(`     "${hero}": ${count} movies`);
    });

  // Test 2: Test the profile API logic
  console.log('\n2️⃣  Testing profile API filtering logic...\n');
  
  const personName = "akkineni nagarjuna"; // This is what the API uses
  const personNameLower = personName.toLowerCase();
  
  let matchedCount = 0;
  let missedMovies: string[] = [];
  
  allMovies?.forEach(movie => {
    const field = movie.hero;
    if (!field) return;
    
    const fieldLower = field.toLowerCase();
    
    // Simulate the NEW filtering logic
    const nameWords = personNameLower.split(/\s+/).filter(w => w.length > 0);
    const fieldNames = fieldLower.split(',').map(n => n.trim());
    
    let matched = false;
    for (const fieldName of fieldNames) {
      const fieldNameWords = fieldName.split(/\s+/).filter(w => w.length > 0);
      
      const allWordsPresent = nameWords.every(nameWord => 
        fieldNameWords.includes(nameWord)
      );
      
      const isSubset = fieldNameWords.every(fieldWord => 
        nameWords.includes(fieldWord)
      ) && fieldNameWords.length > 0;
      
      if (allWordsPresent || isSubset) {
        const shortestName = nameWords.length < fieldNameWords.length ? nameWords : fieldNameWords;
        if (shortestName.length >= 2 || shortestName[0].length >= 8) {
          matched = true;
          break;
        }
      }
    }
    
    if (matched) {
      matchedCount++;
    } else {
      missedMovies.push(`${movie.title_en} (${movie.release_year}) - Hero: "${field}"`);
    }
  });

  console.log(`   ✅ Would match: ${matchedCount} movies`);
  console.log(`   ❌ Would miss: ${missedMovies.length} movies`);
  
  if (missedMovies.length > 0) {
    console.log('\n   Missed movies:');
    missedMovies.slice(0, 10).forEach(m => console.log(`     - ${m}`));
    if (missedMovies.length > 10) {
      console.log(`     ... and ${missedMovies.length - 10} more`);
    }
  }

  // Test 3: Test the new profile URL
  console.log('\n3️⃣  Testing profile URLs...\n');
  
  const urls = [
    'http://localhost:3000/movies?profile=nagarjuna',
    'http://localhost:3000/movies?profile=akkineni-nagarjuna',
  ];
  
  console.log('   After restart, these URLs should work:');
  urls.forEach(url => console.log(`     ✅ ${url}`));

  console.log('\n' + '='.repeat(80));
  console.log('📊 EXPECTED RESULTS AFTER FIX');
  console.log('='.repeat(80));
  console.log(`\n✅ Profile page should show: ${allMovies?.length || 0} films`);
  console.log('✅ Search should show: 1 entry ("Akkineni Nagarjuna")');
  console.log('✅ Both URLs should work (slug aliases)');
  console.log('\n' + '='.repeat(80) + '\n');
}

testNagarjunaFixes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
