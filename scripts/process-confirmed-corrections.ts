import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Correction {
  title: string;
  year: number;
  action: 'DELETE' | 'LANGUAGE_FIX' | 'TELUGU_FIX';
  language?: string;
  hero?: string;
  director?: string;
  rating?: number;
}

// Confirmed by user review
const confirmedCorrections: Correction[] = [
  // DELETE (3)
  { title: 'Best Supporting Actor', year: 2007, action: 'DELETE' },
  { title: 'Best Actor', year: 2000, action: 'DELETE' },
  { title: 'Best Supporting Actor', year: 1998, action: 'DELETE' },
  
  // HINDI FILMS (7 confirmed, pattern suggests all should be processed)
  { title: 'Gunda Gardi', year: 1997, action: 'LANGUAGE_FIX', language: 'Hindi', hero: 'Aditya Pancholi', director: 'V. Sai Prasad', rating: 4.2 },
  { title: 'Khuda Gawah', year: 1992, action: 'LANGUAGE_FIX', language: 'Hindi', hero: 'Amitabh Bachchan', director: 'Mukul Anand', rating: 7.3 },
  { title: 'ChaalBaaz', year: 1989, action: 'LANGUAGE_FIX', language: 'Hindi', hero: 'Sridevi', director: 'Pankaj Parashar', rating: 7.2 },
  { title: 'Aaj Ka Arjun', year: 1990, action: 'LANGUAGE_FIX', language: 'Hindi', hero: 'Amitabh Bachchan', director: 'K. C. Bokadia', rating: 6.5 },
  { title: 'Karma', year: 1986, action: 'LANGUAGE_FIX', language: 'Hindi', hero: 'Dilip Kumar', director: 'Subhash Ghai', rating: 7.6 },
  { title: 'Sharaabi', year: 1984, action: 'LANGUAGE_FIX', language: 'Hindi', hero: 'Amitabh Bachchan', director: 'Prakash Mehra', rating: 7.9 },
  { title: 'Solva Sawan', year: 1979, action: 'LANGUAGE_FIX', language: 'Hindi', hero: 'Amol Palekar', director: 'Bharathiraja', rating: 6.5 },
  
  // TAMIL FILMS (6 confirmed)
  { title: 'Ethiri En 3', year: 2012, action: 'LANGUAGE_FIX', language: 'Tamil', hero: 'Srikanth', director: 'Ramkumar', rating: 5.5 },
  { title: 'Porali', year: 2011, action: 'LANGUAGE_FIX', language: 'Tamil', hero: 'M. Sasikumar', director: 'Samuthirakani', rating: 6.8 },
  { title: '16 Vayathinile', year: 1977, action: 'LANGUAGE_FIX', language: 'Tamil', hero: 'Kamal Haasan', director: 'Bharathiraja', rating: 8.4 },
  { title: 'Vasantha Maligai', year: 1972, action: 'LANGUAGE_FIX', language: 'Tamil', hero: 'Sivaji Ganesan', director: 'K. S. Prakash Rao', rating: 8.2 },
  { title: 'Kalathur Kannamma', year: 1960, action: 'LANGUAGE_FIX', language: 'Tamil', hero: 'Gemini Ganesan', director: 'A. Bhimsingh', rating: 7.9 },
  { title: 'Pennin Perumai', year: 1956, action: 'LANGUAGE_FIX', language: 'Tamil', hero: 'Sivaji Ganesan', director: 'P. Pullaiah', rating: 7.2 },
];

async function processCorrections() {
  console.log('🚀 Processing Confirmed Corrections...\n');
  console.log('='.repeat(80));
  
  const results = {
    deleted: [] as string[],
    languageFixed: [] as string[],
    errors: [] as { title: string; error: string }[],
  };
  
  for (const correction of confirmedCorrections) {
    console.log(`\n📽️  ${correction.title} (${correction.year})`);
    console.log(`   Action: ${correction.action}`);
    
    try {
      // Find movie by title and year
      const { data: movies, error: findError } = await supabase
        .from('movies')
        .select('id, title_en, release_year, language')
        .eq('title_en', correction.title)
        .eq('release_year', correction.year)
        .limit(2);
      
      if (findError) {
        console.log(`   ❌ Search error: ${findError.message}`);
        results.errors.push({ title: correction.title, error: findError.message });
        continue;
      }
      
      if (!movies || movies.length === 0) {
        console.log(`   ❌ Not found in database`);
        results.errors.push({ title: correction.title, error: 'Not found' });
        continue;
      }
      
      if (movies.length > 1) {
        console.log(`   ⚠️  Multiple matches found (${movies.length}), using first`);
      }
      
      const movie = movies[0];
      console.log(`   ✓ Found: ${movie.id}`);
      
      if (correction.action === 'DELETE') {
        // Delete from career_milestones first
        await supabase
          .from('career_milestones')
          .delete()
          .eq('movie_id', movie.id);
        
        // Delete movie
        const { error: deleteError } = await supabase
          .from('movies')
          .delete()
          .eq('id', movie.id);
        
        if (deleteError) {
          console.log(`   ❌ Delete failed: ${deleteError.message}`);
          results.errors.push({ title: correction.title, error: deleteError.message });
          continue;
        }
        
        console.log(`   ✅ Deleted!`);
        results.deleted.push(correction.title);
        
      } else if (correction.action === 'LANGUAGE_FIX') {
        // Update language and fill missing data
        const updates: any = {
          language: correction.language,
        };
        
        if (correction.hero) updates.hero = correction.hero;
        if (correction.director) updates.director = correction.director;
        if (correction.rating) updates.our_rating = correction.rating;
        
        const { error: updateError } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', movie.id);
        
        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
          results.errors.push({ title: correction.title, error: updateError.message });
          continue;
        }
        
        console.log(`   ✅ Language updated to: ${correction.language}`);
        results.languageFixed.push(`${correction.title} (${correction.language})`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: correction.title, error: String(error) });
    }
  }
  
  // Final Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n🗑️  Deleted: ${results.deleted.length}`);
  results.deleted.forEach(item => console.log(`   - ${item}`));
  
  console.log(`\n🌐 Language Reclassified: ${results.languageFixed.length}`);
  if (results.languageFixed.length <= 10) {
    results.languageFixed.forEach(item => console.log(`   - ${item}`));
  } else {
    results.languageFixed.slice(0, 10).forEach(item => console.log(`   - ${item}`));
    console.log(`   ... and ${results.languageFixed.length - 10} more`);
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.forEach(item => console.log(`   - ${item.title}: ${item.error}`));
  }
  
  // Get updated counts
  const { count: teluguPublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('language', 'Telugu');
  
  const { count: teluguUnpublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false)
    .eq('language', 'Telugu');
  
  const { count: hindiMovies } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Hindi');
  
  const { count: tamilMovies } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Tamil');
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 DATABASE STATUS');
  console.log('='.repeat(80));
  console.log(`Telugu Published: ${teluguPublished || 'unknown'}`);
  console.log(`Telugu Unpublished: ${teluguUnpublished || 'unknown'}`);
  console.log(`Hindi Movies: ${hindiMovies || 'unknown'}`);
  console.log(`Tamil Movies: ${tamilMovies || 'unknown'}`);
  console.log('='.repeat(80));
  
  return results;
}

processCorrections()
  .then(() => {
    console.log('\n✅ Confirmed corrections applied!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
