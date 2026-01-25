import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileAPI() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING PROFILE API DIRECTLY');
  console.log('='.repeat(80) + '\n');

  // Get celebrity data
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', 'nagarjuna')
    .single();

  console.log('1️⃣  Celebrity found:');
  console.log(`   Name: ${celebrity?.name_en}`);
  console.log(`   Slug: ${celebrity?.slug}\n`);

  const personName = celebrity?.name_en.toLowerCase() || 'akkineni nagarjuna';
  
  // Simulate the CURRENT profile API query
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, language')
    .eq('is_published', true)
    .or(`hero.ilike.%${personName}%,heroine.ilike.%${personName}%,director.ilike.%${personName}%,music_director.ilike.%${personName}%,producer.ilike.%${personName}%,writer.ilike.%${personName}%`);

  console.log('2️⃣  Movies from database query:');
  console.log(`   Total fetched: ${movies?.length || 0}\n`);

  // Now test the NEW filtering logic
  const personNameLower = personName.toLowerCase();
  
  const filteredMovies = (movies || []).filter(movie => {
    const fields = [movie.hero, movie.director];
    
    return fields.some(field => {
      if (!field) return false;
      
      const fieldLower = field.toLowerCase();
      
      // Exact match
      if (fieldLower === personNameLower) return true;
      
      // Comma-separated list
      const names = fieldLower.split(',').map(n => n.trim());
      if (names.some(n => n === personNameLower)) return true;
      
      // NEW FLEXIBLE matching
      const nameWords = personNameLower.split(/\s+/).filter(w => w.length > 0);
      const fieldNames = fieldLower.split(',').map(n => n.trim());
      
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
            return true;
          }
        }
      }
      
      return false;
    });
  });

  console.log('3️⃣  After NEW filtering logic:');
  console.log(`   Movies matched: ${filteredMovies.length}\n`);

  // Show what got filtered out
  const removed = (movies || []).filter(m => !filteredMovies.includes(m));
  if (removed.length > 0) {
    console.log(`   Filtered OUT: ${removed.length} movies`);
    removed.slice(0, 5).forEach(m => {
      console.log(`     - ${m.title_en} (${m.release_year})`);
      console.log(`       Hero: "${m.hero}"`);
    });
  }

  // Show breakdown by hero value
  console.log('\n4️⃣  Breakdown by hero field:');
  const heroValues = new Map<string, number>();
  filteredMovies.forEach(m => {
    if (m.hero?.toLowerCase().includes('nagarjuna')) {
      heroValues.set(m.hero, (heroValues.get(m.hero) || 0) + 1);
    }
  });
  
  Array.from(heroValues.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([hero, count]) => {
      console.log(`   "${hero}": ${count} movies`);
    });

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULT');
  console.log('='.repeat(80));
  console.log(`\n✅ Database query fetched: ${movies?.length || 0} movies`);
  console.log(`✅ After filtering: ${filteredMovies.length} movies`);
  console.log(`\nExpected: 86 movies`);
  console.log(`Got: ${filteredMovies.length} movies`);
  
  if (filteredMovies.length < 86) {
    console.log(`\n⚠️  Still missing ${86 - filteredMovies.length} movies!`);
  } else {
    console.log('\n🎉 All movies matched!');
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

testProfileAPI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
