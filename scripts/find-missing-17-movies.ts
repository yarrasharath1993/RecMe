import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findMissingMovies() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 FINDING THE MISSING 17 MOVIES');
  console.log('='.repeat(80) + '\n');

  // Get ALL Nagarjuna movies (we know there are 86)
  console.log('1️⃣  Getting all movies with "Nagarjuna" in hero field...\n');
  
  const { data: allNagarjunaMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero')
    .eq('is_published', true)
    .or('hero.ilike.%nagarjuna%');

  console.log(`   Total movies with Nagarjuna: ${allNagarjunaMovies?.length || 0}`);

  // Show breakdown
  const heroValues = new Map<string, any[]>();
  allNagarjunaMovies?.forEach(m => {
    if (m.hero?.toLowerCase().includes('nagarjuna')) {
      if (!heroValues.has(m.hero)) {
        heroValues.set(m.hero, []);
      }
      heroValues.get(m.hero)!.push(m);
    }
  });

  console.log('\n   Breakdown by hero field:\n');
  Array.from(heroValues.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([hero, movies]) => {
      console.log(`   "${hero}": ${movies.length} movies`);
    });

  // Now simulate what the API does
  console.log('\n2️⃣  Simulating API query with last word "nagarjuna"...\n');
  
  const personName = "Akkineni Nagarjuna";
  const searchTerm = "nagarjuna"; // Last word
  
  const { data: apiMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero')
    .eq('is_published', true)
    .or(`hero.ilike.%${searchTerm}%`);

  console.log(`   API would fetch: ${apiMovies?.length || 0} movies`);

  // Apply filtering
  const personNameLower = personName.toLowerCase();
  
  const filtered = (apiMovies || []).filter(movie => {
    const field = movie.hero;
    if (!field) return false;
    
    const fieldLower = field.toLowerCase();
    
    if (fieldLower === personNameLower) return true;
    
    const names = fieldLower.split(',').map(n => n.trim());
    if (names.some(n => n === personNameLower)) return true;
    
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

  console.log(`   After filtering: ${filtered.length} movies would match\n`);

  // Find the difference
  const allIds = new Set((allNagarjunaMovies || []).map(m => m.id));
  const filteredIds = new Set(filtered.map(m => m.id));
  
  const missingMovies = (allNagarjunaMovies || []).filter(m => !filteredIds.has(m.id));

  console.log('3️⃣  MISSING MOVIES:\n');
  if (missingMovies.length > 0) {
    console.log(`   Found ${missingMovies.length} missing movies:\n`);
    missingMovies.forEach(m => {
      console.log(`   ❌ "${m.title_en}" (${m.release_year})`);
      console.log(`      Hero field: "${m.hero}"`);
      console.log('');
    });
  } else {
    console.log('   No missing movies! ✅\n');
  }

  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal Nagarjuna movies: ${allNagarjunaMovies?.length || 0}`);
  console.log(`API would return: ${filtered.length}`);
  console.log(`Missing: ${missingMovies.length}`);
  console.log('\n' + '='.repeat(80) + '\n');
}

findMissingMovies()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
