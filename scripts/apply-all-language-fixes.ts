import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface LanguageFix {
  title: string;
  year: number;
  newLanguage: 'Hindi' | 'Tamil' | 'Malayalam' | 'Kannada' | 'Bengali';
  hero?: string;
  director?: string;
  rating?: number;
  notes?: string;
}

// Complete list of all remaining language fixes from user's comprehensive review
const languageFixes: LanguageFix[] = [
  // === HINDI FILMS (Remaining ~20) ===
  { title: 'Thanedaar', year: 1990, newLanguage: 'Hindi', hero: 'Sanjay Dutt', director: 'Raj N. Sippy', rating: 6.2, notes: 'Hindi action' },
  { title: 'Shehzaade', year: 1989, newLanguage: 'Hindi', hero: 'Dharmendra', director: 'Raj N. Sippy', rating: 5.2, notes: 'Hindi action' },
  { title: 'Gair Kanooni', year: 1989, newLanguage: 'Hindi', hero: 'Govinda', director: 'Prayag Raj', rating: 5.8, notes: 'Hindi feat. Sridevi' },
  { title: 'Majboor', year: 1989, newLanguage: 'Hindi', hero: 'Jeetendra', director: 'T. Rama Rao', rating: 5.1, notes: 'Hindi remake' },
  { title: 'Kanoon Ki Awaaz', year: 1989, newLanguage: 'Hindi', hero: 'Shatrughan Sinha', director: 'R. Kumar', rating: 4.9, notes: 'Hindi action' },
  { title: 'Sone Pe Suhaaga', year: 1988, newLanguage: 'Hindi', hero: 'Jeetendra', director: 'K. Bapayya', rating: 5.9, notes: 'Hindi multi-starrer' },
  { title: 'Ghar Ghar Ki Kahani', year: 1988, newLanguage: 'Hindi', hero: 'Govinda', director: 'Kalpataru', rating: 6.3, notes: 'Hindi family drama' },
  { title: 'Majaal', year: 1987, newLanguage: 'Hindi', hero: 'Jeetendra', director: 'K. Bapayya', rating: 6.0, notes: 'Hindi remake' },
  { title: 'Watan Ke Rakhwale', year: 1987, newLanguage: 'Hindi', hero: 'Dharmendra', director: 'T. Rama Rao', rating: 6.2, notes: 'Hindi action' },
  { title: 'Aakhree Raasta', year: 1986, newLanguage: 'Hindi', hero: 'Amitabh Bachchan', director: 'K. Bhagyaraj', rating: 7.5, notes: 'Hindi remake' },
  { title: 'Mera Saathi', year: 1985, newLanguage: 'Hindi', hero: 'Jeetendra', director: 'K. Raghavendra Rao', rating: 5.8, notes: 'Hindi remake' },
  { title: 'Inquilaab', year: 1984, newLanguage: 'Hindi', hero: 'Amitabh Bachchan', director: 'T. Rama Rao', rating: 6.4, notes: 'Hindi political thriller' },
  { title: 'Qayamat', year: 1983, newLanguage: 'Hindi', hero: 'Dharmendra', director: 'Raj N. Sippy', rating: 6.1, notes: 'Hindi remake' },
  { title: 'Amar Deep', year: 1979, newLanguage: 'Hindi', hero: 'Rajesh Khanna', director: 'R. Krishnamurthy', rating: 6.4, notes: 'Hindi remake' },
  { title: 'Seeta Swayamvar', year: 1976, newLanguage: 'Hindi', hero: 'Ravi Kumar', director: 'Bapu', rating: 7.5, notes: 'Hindi version of Bapu film' },
  { title: 'Julie', year: 1975, newLanguage: 'Hindi', hero: 'Lakshmi', director: 'K. S. Sethumadhavan', rating: 7.1, notes: 'Hindi remake of Chattakari' },
  { title: 'Gumrah', year: 1993, newLanguage: 'Hindi', hero: 'Sridevi', director: 'Mahesh Bhatt', rating: 6.9, notes: 'Hindi crime thriller' },
  
  // === TAMIL FILMS (Remaining ~25) ===
  { title: 'Marana Porali', year: 2011, newLanguage: 'Tamil', hero: 'Sasikumar', director: 'Samuthirakani', rating: 6.8, notes: 'Tamil action' },
  { title: 'Pasa Kiligal', year: 2006, newLanguage: 'Tamil', hero: 'Prabhu', director: 'P. Amirdhan', rating: 5.7, notes: 'Tamil family drama' },
  { title: 'Kizhakku Kadarkarai Salai', year: 2006, newLanguage: 'Tamil', hero: 'Srikanth', director: 'S. S. Stanley', rating: 5.2, notes: 'Tamil romantic thriller' },
  { title: 'Kizhakku Kadalkarai Salai', year: 2006, newLanguage: 'Tamil', hero: 'Srikanth', director: 'S. S. Stanley', rating: 5.2, notes: 'Tamil (duplicate title variation)' },
  { title: 'Joot', year: 2004, newLanguage: 'Tamil', hero: 'Srikanth', director: 'Azhagam Perumal', rating: 5.8, notes: 'Tamil action' },
  { title: 'Sonnal Thaan Kaadhala', year: 2001, newLanguage: 'Tamil', hero: 'T. Rajendar', director: 'T. Rajendar', rating: 4.5, notes: 'Tamil romance' },
  { title: 'Mitta Miraasu', year: 2001, newLanguage: 'Tamil', hero: 'Prabhu', director: 'Mu Kalanjiyam', rating: 6.2, notes: 'Tamil action' },
  { title: 'Sandhitha Velai', year: 2000, newLanguage: 'Tamil', hero: 'Karthik Muthuraman', director: 'Ravichandran', rating: 5.4, notes: 'Tamil film' },
  { title: 'Mugham', year: 1999, newLanguage: 'Tamil', hero: 'Nassar', director: 'Gnana Rajasekaran', rating: 7.0, notes: 'Tamil social drama' },
  { title: 'Chinna Raja', year: 1999, newLanguage: 'Tamil', hero: 'Karthik Muthuraman', director: 'Chitra Lakshmanan', rating: 5.7, notes: 'Tamil comedy' },
  { title: 'En Aasai Rasave', year: 1998, newLanguage: 'Tamil', hero: 'Sivaji Ganesan', director: 'Kasthoori Raja', rating: 6.1, notes: 'Tamil drama' },
  { title: 'Uzhaippali', year: 1993, newLanguage: 'Tamil', hero: 'Rajinikanth', director: 'P. Vasu', rating: 7.1, notes: 'Tamil action' },
  { title: 'Chembaruthi', year: 1992, newLanguage: 'Tamil', hero: 'Prashanth', director: 'R. K. Selvamani', rating: 7.0, notes: 'Tamil romance' },
  { title: 'Sattam Oru Sathurangam', year: 1988, newLanguage: 'Tamil', hero: 'Arjun Sarja', director: 'Prathap Pothan', rating: 6.4, notes: 'Tamil thriller' },
  { title: 'Pokkiri Raja', year: 1982, newLanguage: 'Tamil', hero: 'Rajinikanth', director: 'S. P. Muthuraman', rating: 7.3, notes: 'Tamil blockbuster' },
  { title: 'Kallukul Eeram', year: 1980, newLanguage: 'Tamil', hero: 'Aruna', director: 'P. S. Nivas', rating: 6.8, notes: 'Tamil romantic drama' },
  { title: 'Ninaithaale Inikkum', year: 1979, newLanguage: 'Tamil', hero: 'Kamal Haasan', director: 'K. Balachander', rating: 8.1, notes: 'Tamil musical' },
  { title: 'Pilot Premnath', year: 1978, newLanguage: 'Tamil', hero: 'Sivaji Ganesan', director: 'A. C. Tirulokchandar', rating: 6.9, notes: 'Tamil/Sinhalese' },
  { title: 'Amaradeepam', year: 1977, newLanguage: 'Tamil', hero: 'Sivaji Ganesan', director: 'T. Prakash Rao', rating: 6.7, notes: 'Tamil remake' },
  { title: 'Rajapart Rangadurai', year: 1973, newLanguage: 'Tamil', hero: 'Sivaji Ganesan', director: 'P. Madhavan', rating: 7.4, notes: 'Tamil drama' },
  { title: 'Vanangamudi', year: 1957, newLanguage: 'Tamil', hero: 'Sivaji Ganesan', director: 'P. Neelakantan', rating: 7.0, notes: 'Tamil film' },
  
  // === MALAYALAM FILMS (7) ===
  { title: 'Kalabha Mazha', year: 2011, newLanguage: 'Malayalam', hero: 'Sreejith Vijay', director: 'P. Bhaskaran', rating: 5.0, notes: 'Malayalam romantic drama' },
  { title: 'Best Supporting Actor', year: 2016, newLanguage: 'Malayalam', hero: 'Jagapathi Babu', director: 'Alongkod Euepaiboon', notes: 'Malayalam/Thai co-production (actually Oppam Telugu dub)' },
  { title: 'Sesh Sangat', year: 2009, newLanguage: 'Bengali', hero: 'Jaya Prada', director: 'Ashoke Viswanathan', rating: 6.0, notes: 'Bengali social drama' },
  { title: 'Ee Snehatheerathu', year: 2004, newLanguage: 'Malayalam', hero: 'Kunchacko Boban', director: 'P. Sivaprasad', rating: 5.9, notes: 'Malayalam film' },
  { title: 'Archana Aaradhana', year: 1985, newLanguage: 'Malayalam', hero: 'Mammootty', director: 'Sajan', rating: 6.2, notes: 'Malayalam drama' },
  { title: 'Ashwadhamavu', year: 1979, newLanguage: 'Malayalam', hero: 'Madampu Kunjukuttan', director: 'K. R. Mohanan', rating: 7.2, notes: 'Malayalam arthouse' },
  { title: 'Thulaavarsham', year: 1976, newLanguage: 'Malayalam', hero: 'Prem Nazir', director: 'N. Sankaran Nair', rating: 6.5, notes: 'Malayalam drama' },
  { title: 'Poombatta', year: 1971, newLanguage: 'Malayalam', hero: 'Sridevi (Child)', director: 'B. K. Pottekkadu', rating: 7.3, notes: 'Malayalam; Sridevi won award' },
  
  // === KANNADA FILMS (1) ===
  { title: 'Bhakta Kumbara', year: 1974, newLanguage: 'Kannada', hero: 'Dr. Rajkumar', director: 'Hunsur Krishnamurthy', rating: 8.5, notes: 'Kannada devotional masterpiece' },
];

async function applyAllLanguageFixes() {
  console.log('🌐 Applying All Remaining Language Fixes...\n');
  console.log('='.repeat(80));
  console.log(`Total movies to process: ${languageFixes.length}`);
  console.log('='.repeat(80));
  
  const results = {
    fixed: [] as string[],
    notFound: [] as string[],
    errors: [] as { title: string; error: string }[],
  };
  
  // Group by language for reporting
  const byLanguage = {
    Hindi: [] as string[],
    Tamil: [] as string[],
    Malayalam: [] as string[],
    Kannada: [] as string[],
    Bengali: [] as string[],
  };
  
  for (const fix of languageFixes) {
    console.log(`\n🌐 ${fix.title} (${fix.year}) → ${fix.newLanguage}`);
    
    try {
      // Find movie by title and year
      const { data: movies, error: findError } = await supabase
        .from('movies')
        .select('id, title_en, release_year, language')
        .eq('title_en', fix.title)
        .eq('release_year', fix.year)
        .limit(2);
      
      if (findError) {
        console.log(`   ❌ Search error: ${findError.message}`);
        results.errors.push({ title: fix.title, error: findError.message });
        continue;
      }
      
      if (!movies || movies.length === 0) {
        console.log(`   ⚠️  Not found in database`);
        results.notFound.push(fix.title);
        continue;
      }
      
      if (movies.length > 1) {
        console.log(`   ⚠️  Multiple matches (${movies.length}), using first`);
      }
      
      const movie = movies[0];
      console.log(`   ✓ Found: ${movie.language} → ${fix.newLanguage}`);
      
      // Prepare updates
      const updates: any = {
        language: fix.newLanguage,
      };
      
      if (fix.hero) updates.hero = fix.hero;
      if (fix.director) updates.director = fix.director;
      if (fix.rating) updates.our_rating = fix.rating;
      
      // Apply updates
      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);
      
      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
        results.errors.push({ title: fix.title, error: updateError.message });
        continue;
      }
      
      console.log(`   ✅ Updated to ${fix.newLanguage}`);
      results.fixed.push(fix.title);
      byLanguage[fix.newLanguage].push(fix.title);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: fix.title, error: String(error) });
    }
  }
  
  // Final Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n✅ Successfully Reclassified: ${results.fixed.length}/${languageFixes.length}`);
  
  console.log(`\n📊 By Language:`);
  Object.entries(byLanguage).forEach(([lang, movies]) => {
    if (movies.length > 0) {
      console.log(`\n   ${lang}: ${movies.length} movies`);
      if (movies.length <= 5) {
        movies.forEach(m => console.log(`      - ${m}`));
      } else {
        movies.slice(0, 5).forEach(m => console.log(`      - ${m}`));
        console.log(`      ... and ${movies.length - 5} more`);
      }
    }
  });
  
  if (results.notFound.length > 0) {
    console.log(`\n⚠️  Not Found: ${results.notFound.length}`);
    results.notFound.slice(0, 10).forEach(item => console.log(`   - ${item}`));
    if (results.notFound.length > 10) {
      console.log(`   ... and ${results.notFound.length - 10} more`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.slice(0, 5).forEach(item => console.log(`   - ${item.title}: ${item.error}`));
    if (results.errors.length > 5) {
      console.log(`   ... and ${results.errors.length - 5} more`);
    }
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
  
  const { count: malayalamMovies } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Malayalam');
  
  const { count: kannadaMovies } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Kannada');
  
  const { count: bengaliMovies } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Bengali');
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 FINAL DATABASE STATUS');
  console.log('='.repeat(80));
  console.log(`Telugu Published:    ${teluguPublished || 'unknown'}`);
  console.log(`Telugu Unpublished:  ${teluguUnpublished || 'unknown'}`);
  console.log(`Hindi Movies:        ${hindiMovies || 'unknown'}`);
  console.log(`Tamil Movies:        ${tamilMovies || 'unknown'}`);
  console.log(`Malayalam Movies:    ${malayalamMovies || 'unknown'}`);
  console.log(`Kannada Movies:      ${kannadaMovies || 'unknown'}`);
  console.log(`Bengali Movies:      ${bengaliMovies || 'unknown'}`);
  console.log('='.repeat(80));
  
  return { results, byLanguage };
}

applyAllLanguageFixes()
  .then(({ results }) => {
    console.log('\n✅ All language fixes applied!');
    console.log(`\n🎉 ${results.fixed.length} movies reclassified!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
