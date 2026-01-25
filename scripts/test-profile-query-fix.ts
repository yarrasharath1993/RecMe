import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewQueryStrategy() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING NEW QUERY STRATEGY');
  console.log('='.repeat(80) + '\n');

  const personName = "Akkineni Nagarjuna";
  
  // OLD STRATEGY: Use full name
  console.log('1️⃣  OLD STRATEGY: Query with full name "akkineni nagarjuna"\n');
  const { data: oldResults } = await supabase
    .from('movies')
    .select('id, title_en, hero')
    .eq('is_published', true)
    .or(`hero.ilike.%${personName.toLowerCase()}%`);
  
  console.log(`   Fetched: ${oldResults?.length || 0} movies`);

  // NEW STRATEGY: Use last word (most distinctive)
  const searchTerm = personName.split(/\s+/).pop() || personName;
  console.log(`\n2️⃣  NEW STRATEGY: Query with last word "${searchTerm.toLowerCase()}"\n`);
  
  const { data: newResults } = await supabase
    .from('movies')
    .select('id, title_en, hero')
    .eq('is_published', true)
    .or(`hero.ilike.%${searchTerm.toLowerCase()}%`);
  
  console.log(`   Fetched: ${newResults?.length || 0} movies`);

  // Show what the NEW strategy found
  if (newResults) {
    console.log('\n   Breakdown by hero field:');
    const heroValues = new Map<string, number>();
    newResults.forEach(m => {
      if (m.hero?.toLowerCase().includes('nagarjuna')) {
        heroValues.set(m.hero, (heroValues.get(m.hero) || 0) + 1);
      }
    });
    
    Array.from(heroValues.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([hero, count]) => {
        console.log(`     "${hero}": ${count} movies`);
      });
  }

  // Now test the filtering logic
  console.log('\n3️⃣  Testing NEW filtering logic on fetched movies...\n');
  
  const personNameLower = personName.toLowerCase();
  
  const filtered = (newResults || []).filter(movie => {
    const field = movie.hero;
    if (!field) return false;
    
    const fieldLower = field.toLowerCase();
    
    // Exact match
    if (fieldLower === personNameLower) return true;
    
    // Comma-separated
    const names = fieldLower.split(',').map(n => n.trim());
    if (names.some(n => n === personNameLower)) return true;
    
    // FLEXIBLE matching
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

  console.log(`   After filtering: ${filtered.length} movies matched`);

  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPARISON');
  console.log('='.repeat(80));
  console.log(`\nOLD approach: Fetched ${oldResults?.length || 0}, after filter = ${oldResults?.length || 0}`);
  console.log(`NEW approach: Fetched ${newResults?.length || 0}, after filter = ${filtered.length}`);
  console.log(`\nExpected: 86 movies`);
  console.log(`Got: ${filtered.length} movies`);
  
  if (filtered.length >= 86) {
    console.log('\n✅ SUCCESS! All movies found!');
  } else {
    console.log(`\n⚠️  Still missing ${86 - filtered.length} movies`);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

testNewQueryStrategy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
