import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCompleteFlow() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DEBUGGING COMPLETE PROFILE API FLOW');
  console.log('='.repeat(80) + '\n');

  const personName = "Akkineni Nagarjuna";
  const searchTerm = personName.split(/\s+/).pop() || personName;

  // Step 1: Fetch movies with broad query
  console.log('1️⃣  STEP 1: Database query (broad)\n');
  const { data: mainMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, music_director, producer, writer, supporting_cast')
    .eq('is_published', true)
    .or(`hero.ilike.%${searchTerm}%,heroine.ilike.%${searchTerm}%,director.ilike.%${searchTerm}%,music_director.ilike.%${searchTerm}%,producer.ilike.%${searchTerm}%,writer.ilike.%${searchTerm}%`);

  console.log(`   Fetched from DB: ${mainMovies?.length || 0} movies\n`);

  // Step 2: Apply filtering logic (from route.ts)
  console.log('2️⃣  STEP 2: Apply filtering logic\n');
  
  const personNameLower = personName.toLowerCase();
  
  const filteredMainMovies = (mainMovies || []).filter(movie => {
    const fields = [movie.hero, movie.heroine, movie.director, movie.music_director, movie.producer, movie.writer];
    
    return fields.some(field => {
      if (!field) return false;
      
      const fieldLower = field.toLowerCase();
      
      // Check if person name appears as:
      // 1. Exact match
      if (fieldLower === personNameLower) return true;
      
      // 2. In a comma-separated list (e.g., "Krishna, Sobhan Babu")
      const names = fieldLower.split(',').map(n => n.trim());
      if (names.some(n => n === personNameLower)) return true;
      
      // 3. FLEXIBLE word matching - handles any word order!
      const nameWords = personNameLower.split(/\s+/).filter(w => w.length > 0);
      const fieldNames = fieldLower.split(',').map(n => n.trim());
      
      for (const fieldName of fieldNames) {
        const fieldNameWords = fieldName.split(/\s+/).filter(w => w.length > 0);
        
        // Check if ALL words from person name exist in this field name (any order)
        const allWordsPresent = nameWords.every(nameWord => 
          fieldNameWords.includes(nameWord)
        );
        
        // Also check if field name is just a subset (e.g., "Nagarjuna" matches when searching "Akkineni Nagarjuna")
        const isSubset = fieldNameWords.every(fieldWord => 
          nameWords.includes(fieldWord)
        ) && fieldNameWords.length > 0;
        
        if (allWordsPresent || isSubset) {
          // Additional check: prevent "Teja" from matching "Ravi Teja"
          const shortestName = nameWords.length < fieldNameWords.length ? nameWords : fieldNameWords;
          if (shortestName.length >= 2 || shortestName[0].length >= 8) {
            return true;
          }
        }
      }
      
      return false;
    });
  });

  console.log(`   After filtering: ${filteredMainMovies.length} movies\n`);

  // Show what got filtered out
  const removed = (mainMovies || []).filter(m => !filteredMainMovies.includes(m));
  if (removed.length > 0) {
    console.log(`   ❌ FILTERED OUT: ${removed.length} movies\n`);
    removed.forEach(m => {
      console.log(`     "${m.title_en}" (${m.release_year})`);
      console.log(`       Hero: "${m.hero || 'N/A'}"`);
      console.log(`       Heroine: "${m.heroine || 'N/A'}"`);
      console.log(`       Director: "${m.director || 'N/A'}"`);
      console.log(`       Music: "${m.music_director || 'N/A'}"`);
      console.log('');
    });
  }

  // Step 3: Check supporting cast movies
  console.log('3️⃣  STEP 3: Check supporting_cast field\n');
  
  const { data: supportingCastMovies } = await supabase
    .from('movies')
    .select('id, title_en, supporting_cast')
    .eq('is_published', true)
    .not('supporting_cast', 'is', null);

  const mainMovieIds = new Set(filteredMainMovies.map(m => m.id));
  const personNameLowerForSupporting = personName.toLowerCase();
  
  const additionalSupportingMovies = (supportingCastMovies || []).filter(movie => {
    if (mainMovieIds.has(movie.id)) return false;
    
    const cast = Array.isArray(movie.supporting_cast) ? movie.supporting_cast : [];
    return cast.some((member: any) => 
      typeof member === 'object' && 
      member.name?.toLowerCase().includes(personNameLowerForSupporting)
    );
  });

  console.log(`   Found in supporting_cast: ${additionalSupportingMovies.length} additional movies\n`);

  // Step 4: Count by role
  console.log('4️⃣  STEP 4: Categorize by role\n');
  
  const allMovies = [...filteredMainMovies, ...additionalSupportingMovies];
  
  const actorMovies = allMovies.filter(m => 
    m.hero?.toLowerCase().includes(personName.toLowerCase())
  );
  const actressMovies = allMovies.filter(m => 
    m.heroine?.toLowerCase().includes(personName.toLowerCase())
  );
  const directorMovies = allMovies.filter(m => 
    m.director?.toLowerCase().includes(personName.toLowerCase())
  );
  const musicDirectorMovies = allMovies.filter(m => 
    m.music_director?.toLowerCase().includes(personName.toLowerCase())
  );
  const producerMovies = allMovies.filter(m => 
    m.producer?.toLowerCase().includes(personName.toLowerCase())
  );
  const writerMovies = allMovies.filter(m => 
    m.writer?.toLowerCase().includes(personName.toLowerCase())
  );

  console.log(`   As Actor: ${actorMovies.length}`);
  console.log(`   As Actress: ${actressMovies.length}`);
  console.log(`   As Director: ${directorMovies.length}`);
  console.log(`   As Music Director: ${musicDirectorMovies.length}`);
  console.log(`   As Producer: ${producerMovies.length}`);
  console.log(`   As Writer: ${writerMovies.length}`);

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n1. Database fetched: ${mainMovies?.length || 0} movies`);
  console.log(`2. After filtering: ${filteredMainMovies.length} movies`);
  console.log(`3. Supporting cast: +${additionalSupportingMovies.length} movies`);
  console.log(`4. Total movies: ${allMovies.length} movies`);
  console.log(`\nExpected: 86 movies`);
  console.log(`Got: ${allMovies.length} movies`);
  
  if (allMovies.length < 86) {
    console.log(`\n⚠️  MISSING: ${86 - allMovies.length} movies!`);
  } else {
    console.log('\n✅ All movies accounted for!');
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

debugCompleteFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
