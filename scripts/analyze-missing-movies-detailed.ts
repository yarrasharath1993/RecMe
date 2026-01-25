import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDetailedMissing() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DETAILED ANALYSIS OF MISSING MOVIES');
  console.log('='.repeat(80) + '\n');

  const personName = "Akkineni Nagarjuna";
  const searchTerm = "nagarjuna"; // Last word

  // Step 1: Get ALL movies that have Nagarjuna
  console.log('1️⃣  Getting ALL movies with "nagarjuna" in any field...\n');
  
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, music_director, producer, writer, language')
    .eq('is_published', true)
    .or(`hero.ilike.%${searchTerm}%,heroine.ilike.%${searchTerm}%,director.ilike.%${searchTerm}%,music_director.ilike.%${searchTerm}%,producer.ilike.%${searchTerm}%,writer.ilike.%${searchTerm}%`);

  console.log(`   Total fetched: ${allMovies?.length || 0} movies\n`);

  // Step 2: Apply the EXACT filtering logic from the API
  console.log('2️⃣  Applying filtering logic (like the API does)...\n');
  
  const personNameLower = personName.toLowerCase();
  
  const passed: any[] = [];
  const failed: any[] = [];
  
  (allMovies || []).forEach(movie => {
    const fields = [movie.hero, movie.heroine, movie.director, movie.music_director, movie.producer, movie.writer];
    
    let matchFound = false;
    let matchReason = '';
    
    for (const field of fields) {
      if (!field) continue;
      
      const fieldLower = field.toLowerCase();
      
      // Check 1: Exact match
      if (fieldLower === personNameLower) {
        matchFound = true;
        matchReason = `Exact match in field: "${field}"`;
        break;
      }
      
      // Check 2: Comma-separated list
      const names = fieldLower.split(',').map(n => n.trim());
      if (names.some(n => n === personNameLower)) {
        matchFound = true;
        matchReason = `In comma list: "${field}"`;
        break;
      }
      
      // Check 3: FLEXIBLE word matching
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
            matchFound = true;
            matchReason = `Flexible match: "${field}" (allWords=${allWordsPresent}, subset=${isSubset})`;
            break;
          }
        }
      }
      
      if (matchFound) break;
    }
    
    if (matchFound) {
      passed.push({ ...movie, matchReason });
    } else {
      failed.push(movie);
    }
  });

  console.log(`   ✅ PASSED filtering: ${passed.length} movies`);
  console.log(`   ❌ FAILED filtering: ${failed.length} movies\n`);

  // Step 3: Analyze the FAILED movies
  if (failed.length > 0) {
    console.log('3️⃣  MOVIES THAT FAILED FILTERING:\n');
    console.log('   These movies have "nagarjuna" but don\'t match "Akkineni Nagarjuna":\n');
    
    failed.forEach(m => {
      console.log(`   ❌ "${m.title_en}" (${m.release_year}) [${m.language}]`);
      if (m.hero?.toLowerCase().includes('nagarjuna')) {
        console.log(`      Hero: "${m.hero}"`);
      }
      if (m.heroine?.toLowerCase().includes('nagarjuna')) {
        console.log(`      Heroine: "${m.heroine}"`);
      }
      if (m.director?.toLowerCase().includes('nagarjuna')) {
        console.log(`      Director: "${m.director}"`);
      }
      if (m.music_director?.toLowerCase().includes('nagarjuna')) {
        console.log(`      Music: "${m.music_director}"`);
      }
      if (m.producer?.toLowerCase().includes('nagarjuna')) {
        console.log(`      Producer: "${m.producer}"`);
      }
      if (m.writer?.toLowerCase().includes('nagarjuna')) {
        console.log(`      Writer: "${m.writer}"`);
      }
      console.log('');
    });
  }

  // Step 4: Count by role for PASSED movies
  console.log('4️⃣  Role breakdown for PASSED movies:\n');
  
  const actorMovies = passed.filter(m => 
    m.hero?.toLowerCase().includes(personNameLower)
  );
  const actressMovies = passed.filter(m => 
    m.heroine?.toLowerCase().includes(personNameLower)
  );
  const directorMovies = passed.filter(m => 
    m.director?.toLowerCase().includes(personNameLower)
  );
  const musicDirectorMovies = passed.filter(m => 
    m.music_director?.toLowerCase().includes(personNameLower)
  );
  const producerMovies = passed.filter(m => 
    m.producer?.toLowerCase().includes(personNameLower)
  );
  const writerMovies = passed.filter(m => 
    m.writer?.toLowerCase().includes(personNameLower)
  );

  console.log(`   As Actor: ${actorMovies.length} movies`);
  console.log(`   As Actress: ${actressMovies.length} movies`);
  console.log(`   As Director: ${directorMovies.length} movies`);
  console.log(`   As Music Director: ${musicDirectorMovies.length} movies`);
  console.log(`   As Producer: ${producerMovies.length} movies`);
  console.log(`   As Writer: ${writerMovies.length} movies`);
  
  const totalByRole = actorMovies.length + actressMovies.length + directorMovies.length + 
                      musicDirectorMovies.length + producerMovies.length + writerMovies.length;
  
  console.log(`   Total (by role): ${totalByRole} movies`);

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nQuery fetched: ${allMovies?.length || 0} movies`);
  console.log(`After filtering: ${passed.length} movies`);
  console.log(`Failed filter: ${failed.length} movies`);
  console.log(`Role count: ${totalByRole} movies`);
  console.log(`\nAPI currently shows: 68 movies`);
  console.log(`Expected to show: ${totalByRole} movies`);
  
  if (totalByRole !== 68) {
    console.log(`\n⚠️  Discrepancy: ${Math.abs(totalByRole - 68)} movies difference!`);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

analyzeDetailedMissing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
