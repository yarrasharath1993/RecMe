import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function find27Missing() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 FINDING THE 27 MOVIES THAT PASSED FILTER BUT NO ROLE');
  console.log('='.repeat(80) + '\n');

  const personName = "Akkineni Nagarjuna";
  const personNameLower = personName.toLowerCase();
  const searchTerm = "nagarjuna";

  // Get all movies
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, music_director, producer, writer')
    .eq('is_published', true)
    .or(`hero.ilike.%${searchTerm}%,heroine.ilike.%${searchTerm}%,director.ilike.%${searchTerm}%,music_director.ilike.%${searchTerm}%,producer.ilike.%${searchTerm}%,writer.ilike.%${searchTerm}%`);

  // Apply filtering
  const passed = (allMovies || []).filter(movie => {
    const fields = [movie.hero, movie.heroine, movie.director, movie.music_director, movie.producer, movie.writer];
    
    return fields.some(field => {
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
  });

  console.log(`Total passed filter: ${passed.length}\n`);

  // Now check role matching using .includes() like the API does
  const matchedByRole = passed.filter(m => {
    const hasRole = 
      (m.hero && m.hero.toLowerCase().includes(personNameLower)) ||
      (m.heroine && m.heroine.toLowerCase().includes(personNameLower)) ||
      (m.director && m.director.toLowerCase().includes(personNameLower)) ||
      (m.music_director && m.music_director.toLowerCase().includes(personNameLower)) ||
      (m.producer && m.producer.toLowerCase().includes(personNameLower)) ||
      (m.writer && m.writer.toLowerCase().includes(personNameLower));
    
    return hasRole;
  });

  console.log(`Matched by role (.includes): ${matchedByRole.length}\n`);

  // Find the difference
  const passedIds = new Set(passed.map(m => m.id));
  const matchedIds = new Set(matchedByRole.map(m => m.id));
  
  const missingRoleMovies = passed.filter(m => !matchedIds.has(m.id));

  console.log('❌ MOVIES THAT PASSED FILTER BUT NO ROLE MATCH:\n');
  console.log(`   Found: ${missingRoleMovies.length} movies\n`);
  
  if (missingRoleMovies.length > 0) {
    missingRoleMovies.forEach(m => {
      console.log(`   "${m.title_en}" (${m.release_year})`);
      console.log(`     Hero: "${m.hero || 'N/A'}"`);
      console.log(`     Heroine: "${m.heroine || 'N/A'}"`);
      console.log(`     Director: "${m.director || 'N/A'}"`);
      console.log(`     Music: "${m.music_director || 'N/A'}"`);
      console.log(`     Producer: "${m.producer || 'N/A'}"`);
      console.log(`     Writer: "${m.writer || 'N/A'}"`);
      
      // Debug: check which field matched
      const fields = [m.hero, m.heroine, m.director, m.music_director, m.producer, m.writer];
      fields.forEach((field, idx) => {
        if (field && field.toLowerCase().includes('nagarjuna')) {
          const fieldName = ['Hero', 'Heroine', 'Director', 'Music', 'Producer', 'Writer'][idx];
          console.log(`     ⚠️  Has "nagarjuna" in ${fieldName} but doesn't match "${personNameLower}"`);
        }
      });
      console.log('');
    });
  }

  console.log('='.repeat(80));
  console.log('📊 ANALYSIS');
  console.log('='.repeat(80));
  console.log(`\nPassed filter: ${passed.length}`);
  console.log(`Matched by role: ${matchedByRole.length}`);
  console.log(`Missing: ${missingRoleMovies.length}`);
  console.log('\n' + '='.repeat(80) + '\n');
}

find27Missing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
