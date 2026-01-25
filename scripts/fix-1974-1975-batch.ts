import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MovieFix {
  year: number;
  title: string;
  director: string;
  hero: string;
  heroine: string;
  genre: string;
  status?: string;
}

// 1975 Movies - Audited Data
const FIXES_1975: MovieFix[] = [
  { year: 1975, title: 'Aadhani Adrustam', director: 'G. V. R. Seshagiri Rao', hero: 'Chalam', heroine: 'Vijaya Nirmala', genre: 'Drama, Family' },
  { year: 1975, title: 'Abhimanavathi', director: 'P. Dhoondy', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Ammayila Sapatham', director: 'G. V. R. Seshagiri Rao', hero: 'Ramakrishna, Chandra Mohan', heroine: 'Chandrakala, Lakshmi', genre: 'Drama' },
  { year: 1975, title: 'Ammayilu Jagratha', director: 'P. Sambasiva Rao', hero: 'Krishnam Raju', heroine: 'Latha', genre: 'Drama' },
  { year: 1975, title: 'Andaru Manchivare', director: 'S. S. Balan', hero: 'Krishnam Raju', heroine: 'Vijayalalitha', genre: 'Drama' },
  { year: 1975, title: 'Annadammula Anubandham', director: 'S. D. Lal', hero: 'N. T. Rama Rao, Murali Mohan, Nandamuri Balakrishna', heroine: 'Latha, Vanisri, Jayasudha', genre: 'Action, Drama' },
  { year: 1975, title: 'Annadammula Katha', director: 'Dasari Narayana Rao', hero: 'N.T. Rama Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Anuragalu', director: 'K. Vasu', hero: 'Murali Mohan', heroine: 'Jayasudha', genre: 'Drama' },
  { year: 1975, title: 'Babu', director: 'K. Balachander', hero: 'Shobhan Babu', heroine: 'Sujatha', genre: 'Drama' },
  { year: 1975, title: 'Balipeetam', director: 'Dasari Narayana Rao', hero: 'Sobhan Babu', heroine: 'Sharada', genre: 'Drama' },
  { year: 1975, title: 'Bhagasthulu', director: 'K. Viswanath', hero: 'Krishnam Raju', heroine: 'Jayasudha', genre: 'Drama' },
  { year: 1975, title: 'Bharatamlo Oka Ammayi', director: 'Dasari Narayana Rao', hero: 'Murali Mohan', heroine: 'Jayachitra', genre: 'Drama' },
  { year: 1975, title: 'Bharathi', director: 'K. Viswanath', hero: 'Krishnam Raju', heroine: 'Jayasudha', genre: 'Drama' },
  { year: 1975, title: 'Bullemma Sapatham', director: 'Dasari Narayana Rao', hero: 'Krishnam Raju', heroine: 'Deepa', genre: 'Drama' },
  { year: 1975, title: 'Chaduvu Samskaram', director: 'V. Madhusudhana Rao', hero: 'Krishnam Raju', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Challani Thalli', director: 'K.S. Rami Reddy', hero: 'Vijayakanth', heroine: 'Srividya', genre: 'Drama' },
  { year: 1975, title: 'Cheekati Velugulu', director: 'K. Vasu', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Chinninati Kalalu', director: 'K. Vasu', hero: 'Krishnam Raju', heroine: 'Jayasudha', genre: 'Drama' },
  { year: 1975, title: 'Chittamma Chilakamma', director: 'B. Bhaskara Rao', hero: 'Murali Mohan', heroine: 'Jayachitra', genre: 'Drama' },
  { year: 1975, title: 'Cinema Vaibhavam', director: 'Multiple Directors', hero: 'Ensemble Cast', heroine: 'Savitri', genre: 'Drama' },
  { year: 1975, title: 'Devude Digivaste', director: 'Dasari Narayana Rao', hero: 'Krishnam Raju', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Devudu Chesina Pelli', director: 'T. Rama Rao', hero: 'Sobhan Babu', heroine: 'Sharada', genre: 'Drama' },
  { year: 1975, title: 'Devudulanti Manishi', director: 'Dasari Narayana Rao', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Ee Kalam Dampathulu', director: 'D. Yoganand', hero: 'Chandra Mohan', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1975, title: 'Gajula Kishtayya', director: 'K. Vasu', hero: 'Krishna', heroine: 'Latha', genre: 'Drama' },
  { year: 1975, title: 'Gunavanthudu', director: 'K. Vasu', hero: 'N.T. Rama Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Jeevana Jyothi', director: 'K. Viswanath', hero: 'Sobhan Babu', heroine: 'Vanisri', genre: 'Romance, Drama' },
  { year: 1975, title: 'Kathanayakuni Katha', director: 'Dasari Narayana Rao', hero: 'N.T. Rama Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Kothakapuram', director: 'K. Vasu', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1975, title: 'Lakshmana Rekha', director: 'N. Gopala Krishna', hero: 'Chandra Mohan', heroine: 'Jayanthi', genre: 'Drama' },
  { year: 1975, title: 'Maa Inti Devudu', director: 'B. V. Prasad', hero: 'Phani', heroine: 'Vijaya Lalitha', genre: 'Drama' },
  { year: 1975, title: 'Maa Voori Ganga', director: 'K. S. R. Das', hero: 'Satyanarayana', heroine: 'Lakshmi', genre: 'Drama' },
  { year: 1975, title: 'Mallela Manasulu', director: 'Adurthi Subba Rao', hero: 'Sobhan Babu', heroine: 'Jayasudha', genre: 'Drama' },
  { year: 1975, title: 'Moguda? Pellama?', director: 'K. Vasu', hero: 'Krishnam Raju', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1975, title: 'Mutyala Muggu', director: 'Bapu', hero: 'Sridhar', heroine: 'Sangeeta', genre: 'Drama, Family' },
  { year: 1975, title: 'Naaku Swatantram Vachindi', director: 'Lakshmi Deepak', hero: 'Krishnam Raju', heroine: 'Lakshmi', genre: 'Drama' },
  { year: 1975, title: 'Pandanti Samsaram', director: 'Dasari Narayana Rao', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Pichodi Pelli', director: 'Bapu', hero: 'Sobhan Babu', heroine: 'Manjula', genre: 'Drama' },
  { year: 1975, title: 'Puttinti Gowravam', director: 'Dasari Narayana Rao', hero: 'Krishnam Raju', heroine: 'Shubha', genre: 'Drama' },
  { year: 1975, title: 'Raktha Sambandham', director: 'Dasari Narayana Rao', hero: 'Shobhan Babu', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Rakthasambandhalu', director: 'M. Mallikarjuna Rao', hero: 'Krishna', heroine: 'Manjula', genre: 'Drama' },
  { year: 1975, title: 'Ramayya Thandri', director: 'K. Vasu', hero: 'Krishna', heroine: '', genre: 'Drama' },
  { year: 1975, title: 'Ramuni Minchina Ramudu', director: 'M. S. Gopinath', hero: 'N.T. Rama Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Santanam Soubhagyam', director: 'D. S. Prakash Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1975, title: 'Santhanam Soubhagyam', director: 'D. S. Prakash Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama', status: 'DUPLICATE' },
  { year: 1975, title: 'Soubhagyavathi', director: 'P. Chandrasekhara Reddy', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Sri Chamundeswari Mahima', director: 'Addala Narayana Rao', hero: 'Ramakrishna', heroine: 'B. Saroja Devi, Latha', genre: 'Devotional' },
  { year: 1975, title: 'Sri Ramanjaneya Yuddham', director: 'Bapu', hero: 'N.T. Rama Rao', heroine: 'B. Saroja Devi', genre: 'Mythological' },
  { year: 1975, title: 'Swargam Narakam', director: 'Dasari Narayana Rao', hero: 'Dasari Narayana Rao', heroine: 'Annapoorna', genre: 'Drama' },
  { year: 1975, title: 'Teerpu', director: 'Bapu', hero: 'Sobhan Babu', heroine: 'Sharada', genre: 'Drama' },
  { year: 1975, title: 'Thota Ramudu', director: 'Dasari Narayana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1975, title: 'Vaikuntapali', director: 'K. Vasu', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1975, title: 'Vayasochina Pilla', director: 'Lakshmi Deepak', hero: 'Murali Mohan', heroine: 'Lakshmi', genre: 'Drama' },
  { year: 1975, title: 'Yashoda Krishna', director: 'C.S. Rao', hero: 'Ramakrishna', heroine: 'Jamuna', genre: 'Mythological, Devotional' },
];

// 1974 Movies - Audited Data
const FIXES_1974: MovieFix[] = [
  { year: 1974, title: 'Adambaralu Anubandhalu', director: 'C.S. Rao', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama, Family' },
  { year: 1974, title: 'Adapillala Tandri', director: 'K. Vasu', hero: 'Krishnam Raju', heroine: 'Chandrakala', genre: 'Drama' },
  { year: 1974, title: 'Amma Manasu', director: 'K. Viswanath', hero: 'Chalam', heroine: 'Jayanthi', genre: 'Drama' },
  { year: 1974, title: 'Ammayi Pelli', director: 'Bhanumathi Ramakrishna', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi Ramakrishna', genre: 'Comedy, Drama' },
  { year: 1974, title: 'Anaganaga Oka Thandri', director: 'C.S. Rao', hero: 'Krishnam Raju', heroine: 'Bharathi', genre: 'Drama, Family' },
  { year: 1974, title: 'Bangaaru Kalalu', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Lakshmi', genre: 'Romance, Drama' },
  { year: 1974, title: 'Bantrotu Bharya', director: 'Dasari Narayana Rao', hero: 'Chalam', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1974, title: 'Bhoomi Kosam', director: 'K.B. Tilak', hero: 'Gummadi', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1974, title: 'Deeksha', director: 'K. Pratyagatma', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Action' },
  { year: 1974, title: 'Deergha Sumangali', director: 'K. Hemambadhara Rao', hero: 'Krishna', heroine: 'Jamuna', genre: 'Drama, Family' },
  { year: 1974, title: 'Devadasu', director: 'Vijaya Nirmala', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Romance, Drama' },
  { year: 1974, title: 'Dhanavanthulu Gunavanthulu', director: 'K. Varaprasad', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1974, title: 'Dorababu', director: 'Tatineni Rama Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Manjula', genre: 'Action, Drama' },
  { year: 1974, title: 'Evariki Vare Yamuna Theere', director: 'Dasari Narayana Rao', hero: 'Satyanarayana', heroine: 'Rojaramani', genre: 'Drama' },
  { year: 1974, title: 'Gali Patalu', director: 'P. Chandrasekhara Reddy', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1974, title: 'Gowri', director: 'P. Chandrasekhara Reddy', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1974, title: 'Gundelu Teesina Monagaadu', director: 'N.B. Chakravarthi', hero: 'Kanta Rao', heroine: 'Jyothi Lakshmi', genre: 'Action, Crime' },
  { year: 1974, title: 'Inti Kodalu', director: 'Lakshmi Deepak', hero: 'Gummadi', heroine: 'Vanisri', genre: 'Drama, Family' },
  { year: 1974, title: 'Intiniti Katha', director: 'K. Satyam', hero: 'Krishna', heroine: 'Chandrakala', genre: 'Drama' },
  { year: 1974, title: 'Kannavari Kalalu', director: 'S.S. Balan', hero: 'Sobhan Babu', heroine: 'Vanisri', genre: 'Drama, Family' },
  { year: 1974, title: 'Khaidi Babai', director: 'T. Krishna', hero: 'Sobhan Babu', heroine: 'Vanisri', genre: 'Action, Drama' },
  { year: 1974, title: 'Kode Nagu', director: 'K.S. Prakash Rao', hero: 'Shobhan Babu', heroine: 'Chandrakala', genre: 'Drama, Thriller' },
  { year: 1974, title: 'Krishnaveni', director: 'V. Madhusudhana Rao', hero: 'Krishnam Raju', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1974, title: 'Manshulu Mati Bommalu', director: 'B. Bhaskara Rao', hero: 'Krishna', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1974, title: 'Manushullo Devudu', director: 'B.V. Prasad', hero: 'N.T. Rama Rao', heroine: 'Vanisri', genre: 'Action, Drama' },
  { year: 1974, title: 'Nomu', director: 'P. Chandrasekhara Reddy', hero: 'Ramakrishna', heroine: 'Chandrakala', genre: 'Devotional, Drama' },
  { year: 1974, title: 'Palleturi Chinnodu', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Manjula', genre: 'Action, Drama' },
  { year: 1974, title: 'Peddalu Maarali', director: 'P. Chandrasekhara Reddy', hero: 'Krishna', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1974, title: 'Premalu Pellillu', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Jayanthi', genre: 'Romance, Drama' },
  { year: 1974, title: 'Radhamma Pelli', director: 'Dasari Narayana Rao', hero: 'Krishna', heroine: 'Srividya', genre: 'Drama' },
  { year: 1974, title: 'Ram Raheem', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: '', genre: 'Action, Drama' },
  { year: 1974, title: 'Satyaniki Sankellu', director: 'K.S. Prakash Rao', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1974, title: 'Tatamma Kala', director: 'N.T. Rama Rao', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi Ramakrishna', genre: 'Drama' },
  { year: 1974, title: 'Thathamma Kala', director: 'N.T. Rama Rao', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi Ramakrishna', genre: 'Drama', status: 'DUPLICATE' },
  { year: 1974, title: 'Thulambaram', director: 'P. Chandrasekhara Reddy', hero: 'Chalam', heroine: 'Sharada', genre: 'Drama' },
  { year: 1974, title: 'Urvasi', director: 'K. Bapayya', hero: 'Sanjeev Kumar', heroine: 'Sharada', genre: 'Romance' },
  { year: 1974, title: 'Uthama Illalu', director: 'P. Sambasiva Rao', hero: 'Krishna', heroine: 'Chandrakala', genre: 'Drama, Family' },
];

async function applyFixes() {
  console.log('=== APPLYING 1974-1975 MOVIE FIXES ===\n');
  
  const allFixes = [...FIXES_1975, ...FIXES_1974];
  let updated = 0;
  let notFound = 0;
  let duplicatesRemoved = 0;
  
  for (const fix of allFixes) {
    // Generate possible slug variations
    const slugBase = fix.title
      .toLowerCase()
      .replace(/[?!.,'"()]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    // Try to find by title and year first
    let { data: movie, error } = await supabase
      .from('movies')
      .select('id, title_en, slug, release_year, director, hero, heroine')
      .eq('release_year', fix.year)
      .eq('is_published', true)
      .or(`title_en.ilike.%${fix.title}%,slug.ilike.%${slugBase}%`)
      .limit(1)
      .single();
    
    if (error || !movie) {
      // Try more flexible search
      const { data: flexMovie } = await supabase
        .from('movies')
        .select('id, title_en, slug, release_year, director, hero, heroine')
        .eq('release_year', fix.year)
        .eq('is_published', true)
        .ilike('title_en', `%${fix.title.split(' ')[0]}%`)
        .limit(1)
        .single();
      
      movie = flexMovie;
    }
    
    if (!movie) {
      console.log(`NOT FOUND: ${fix.title} (${fix.year})`);
      notFound++;
      continue;
    }
    
    // Handle duplicates
    if (fix.status === 'DUPLICATE') {
      const { error: deleteError } = await supabase
        .from('movies')
        .update({ is_published: false, updated_at: new Date().toISOString() })
        .eq('id', movie.id);
      
      if (!deleteError) {
        console.log(`DUPLICATE REMOVED: ${movie.title_en} (${fix.year})`);
        duplicatesRemoved++;
      }
      continue;
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (fix.director) updateData.director = fix.director;
    if (fix.hero) updateData.hero = fix.hero;
    if (fix.heroine) updateData.heroine = fix.heroine;
    if (fix.genre) updateData.genres = fix.genre.split(', ').map(g => g.trim());
    
    const { error: updateError } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', movie.id);
    
    if (!updateError) {
      console.log(`OK: ${movie.title_en} -> Dir: ${fix.director}, Hero: ${fix.hero}, Heroine: ${fix.heroine || 'N/A'}`);
      updated++;
    } else {
      console.log(`ERR: ${movie.title_en} - ${updateError.message}`);
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total fixes attempted: ${allFixes.length}`);
  console.log(`Successfully updated: ${updated}`);
  console.log(`Duplicates removed: ${duplicatesRemoved}`);
  console.log(`Not found: ${notFound}`);
}

applyFixes().catch(console.error);
