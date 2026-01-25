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

// 1973 Movies - Audited Data
const FIXES_1973: MovieFix[] = [
  { year: 1973, title: 'Abhimanavantulu', director: 'K. S. Rami Reddy', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1973, title: 'Andala Ramudu', director: 'Bapu', hero: 'Akkineni Nageswara Rao', heroine: 'Latha', genre: 'Romance, Comedy' },
  { year: 1973, title: 'Bangaru Manasulu', director: 'K. S. Reddy', hero: 'Sobhan Babu', heroine: 'Jayanthi', genre: 'Drama, Family' },
  { year: 1973, title: 'Dabbuki Lokam Dasoham', director: 'D. Yoganand', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama, Satire' },
  { year: 1973, title: 'Desoddharakulu', director: 'C. S. Rao', hero: 'N.T. Rama Rao', heroine: 'Vanisri', genre: 'Action, Drama' },
  { year: 1973, title: 'Dhanama? Daivama?', director: 'C. S. Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1973, title: 'Doctor Babu', director: 'Tatineni Rama Rao', hero: 'Sobhan Babu', heroine: 'Jayalalithaa', genre: 'Drama' },
  { year: 1973, title: 'Gandhi Puttina Desam', director: 'Lakshmi Deepak', hero: 'Krishnam Raju', heroine: 'Prameela', genre: 'Political, Drama' },
  { year: 1973, title: 'Ganga Manga', director: 'V. Madhusudhana Rao', hero: 'Sobhan Babu, Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1973, title: 'Geeta', director: 'K. Hemambadhara Rao', hero: 'Sridhar', heroine: 'Jayanthi', genre: 'Romance' },
  { year: 1973, title: 'Geetaanjali', director: 'A. Sanjeevi', hero: 'Murali Mohan', heroine: 'Sridevi', genre: 'Drama' },
  { year: 1973, title: 'Inti Dongalu', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Crime' },
  { year: 1973, title: 'Jeevana Tarangalu', director: 'Tatineni Rama Rao', hero: 'Sobhan Babu, Krishnam Raju', heroine: 'Vanisri, Lakshmi', genre: 'Romance, Drama' },
  { year: 1973, title: 'Kanna Koduku', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Lakshmi', genre: 'Drama, Family' },
  { year: 1973, title: 'Lokam Marali', director: 'K. Vijayan', hero: 'Jaishankar', heroine: 'Sowcar Janaki', genre: 'Drama', status: 'DUBBED' },
  { year: 1973, title: 'Mamatha', director: 'P. Chandrasekhara Reddy', hero: 'Krishnam Raju', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1973, title: 'Manchi Vallaki Manchivadu', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1973, title: 'Manchivadu', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1973, title: 'Marapurani Manishi', director: 'Tatineni Rama Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Manjula', genre: 'Drama' },
  { year: 1973, title: 'Mayadari Malligadu', director: 'Adurthi Subba Rao', hero: 'Krishna', heroine: 'Jayanthi', genre: 'Action, Drama' },
  { year: 1973, title: 'Meghamala', director: 'B. A. Subba Rao', hero: 'Ramakrishna', heroine: 'Chandrakala', genre: 'Romance' },
  { year: 1973, title: 'Memu Manushulame', director: 'K. Babu Rao', hero: 'Krishnam Raju', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1973, title: 'Nindu Kutumbam', director: 'P. Sambasiva Rao', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama, Family' },
  { year: 1973, title: 'Oka Nari Vanda Thupakulu', director: 'K. V. S. Sarma', hero: 'Tyagaraju', heroine: 'Vijaya Nirmala', genre: 'Action, Western' },
  { year: 1973, title: 'Paropakari', director: 'Y. R. Swamy', hero: 'Rajkumar', heroine: 'Jayanthi', genre: 'Drama', status: 'DUBBED' },
  { year: 1973, title: 'Pasi Hrudayalu', director: 'M. Mallikarjuna Rao', hero: 'Chalam', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1973, title: 'Poola Mala', director: 'P. Chandrasekhara Reddy', hero: 'Ramakrishna', heroine: 'Vijaya Nirmala', genre: 'Romance' },
  { year: 1973, title: 'Puttinillu Mettinillu', director: 'Pattu', hero: 'Sobhan Babu', heroine: 'Lakshmi', genre: 'Drama, Family' },
  { year: 1973, title: 'Samsaram Sagaram', director: 'Dasari Narayana Rao', hero: 'S. V. Ranga Rao, Sarath Babu', heroine: '', genre: 'Drama' },
  { year: 1973, title: 'Sneha Bandham', director: 'K. Babu Rao', hero: 'Krishnam Raju', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1973, title: 'Snehabandam', director: 'P. Sambasiva Rao', hero: 'Murali Mohan', heroine: 'Rojaramani', genre: 'Drama' },
  { year: 1973, title: 'Srivaru Maavaru', director: 'B. S. Narayana', hero: 'Krishna', heroine: 'Vanisri', genre: 'Comedy, Drama' },
  { year: 1973, title: 'Sthri Chandra Kala', director: 'S. S. Devadas', hero: 'Krishnam Raju', heroine: 'Chandrakala', genre: 'Drama' },
  { year: 1973, title: 'Vaade Veedu', director: 'D. Yoganand', hero: 'N.T. Rama Rao', heroine: 'Manjula', genre: 'Mystery, Thriller' },
  { year: 1973, title: 'Vintha Katha', director: 'V. Madhusudhana Rao', hero: 'Chandra Mohan', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1973, title: 'Visali', director: 'K. Babu Rao', hero: 'Jaggayya', heroine: 'Sharada', genre: 'Drama' },
];

// 1972 Movies - Audited Data
const FIXES_1972: MovieFix[] = [
  { year: 1972, title: 'Abbaigaru Ammaigaru', director: 'V. Ramachandra Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama, Comedy' },
  { year: 1972, title: 'Antha Mana Manichike', director: 'Bhanumathi Ramakrishna', hero: 'Krishna', heroine: 'Manjula', genre: 'Drama' },
  { year: 1972, title: 'Bala Bharatam', director: 'Kamalakara Kameswara Rao', hero: 'S. V. Ranga Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1972, title: 'Bale Mosagadu', director: 'P. Sambasiva Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Crime' },
  { year: 1972, title: 'Beedala Patlu', director: 'B. Vittalacharya', hero: 'Akkineni Nageswara Rao', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1972, title: 'Bhale Mosagadu', director: 'P. Sambasiva Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Crime', status: 'DUPLICATE' },
  { year: 1972, title: 'Bharya Biddalu', director: 'Tatineni Rama Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Jayalalithaa', genre: 'Drama, Family' },
  { year: 1972, title: 'Datta Putrudu', director: 'T. Lenin Babu', hero: 'Akkineni Nageswara Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1972, title: 'Guduputani', director: 'Lakshmi Deepak', hero: 'Krishna', heroine: 'Shubha', genre: 'Thriller' },
  { year: 1972, title: 'Hantakulu Devantakulu', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Jyothi Lakshmi', genre: 'Action, Spy' },
  { year: 1972, title: 'Illu Illalu', director: 'P. Sambasiva Rao', hero: 'Sobhan Babu', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1972, title: 'Inspector Bharya', director: 'P. V. Satyanarayana', hero: 'Krishna', heroine: 'Chandra Kala', genre: 'Action, Drama' },
  { year: 1972, title: 'Kattula Rattayya', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Folklore' },
  { year: 1972, title: 'Kodalupilla', director: 'M. Mallikarjuna Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1972, title: 'Koduku Kodalu', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'Vanisri', genre: 'Drama, Family' },
  { year: 1972, title: 'Kula Gowravam', director: 'S. S. R. Krishna', hero: 'N.T. Rama Rao', heroine: 'Jayanthi', genre: 'Drama' },
  { year: 1972, title: 'Maa Inti Velugu', director: 'P. Sambasiva Rao', hero: 'Krishna', heroine: 'Chandra Kala', genre: 'Drama, Family' },
  { year: 1972, title: 'Maa Oori Monagallu', director: 'P. Sambasiva Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Drama' },
  { year: 1972, title: 'Manavudu Danavudu', director: 'P. Chandrasekhara Reddy', hero: 'Sobhan Babu', heroine: 'Sharada', genre: 'Action, Crime' },
  { year: 1972, title: 'Manchi Rojulu Vachchaayi', director: 'V. Madhusudhana Rao', hero: 'Krishna', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1972, title: 'Marapurani Talli', director: 'K. S. Prakash Rao', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1972, title: 'Menakodalu', director: 'B. S. Narayana', hero: 'Krishna', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1972, title: 'Monagadostunnadu Jagartta', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Jyothi Lakshmi', genre: 'Action', status: 'DUPLICATE' },
  { year: 1972, title: 'Monagadostunnadu Jagratha', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Jyothi Lakshmi', genre: 'Action' },
  { year: 1972, title: 'Muhammad Bin Tuglak', director: 'B. V. Prasad', hero: 'Nagabhushanam', heroine: '', genre: 'Political, Satire' },
  { year: 1972, title: 'Neeti-Nijayiti', director: 'C. S. Rao', hero: 'Krishna', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1972, title: 'Nijam Nirupista', director: 'S. D. Lal', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1972, title: 'Praja Nayakudu', director: 'V. Ramachandra Rao', hero: 'Krishna', heroine: 'Bharathi', genre: 'Political, Drama' },
  { year: 1972, title: 'Raitu Kutumbam', director: 'P. Sambasiva Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1972, title: 'Raj Mahal', director: 'B. Harinarayana', hero: 'Krishna, Krishnam Raju', heroine: 'Jyothi Lakshmi', genre: 'Action, Folklore' },
  { year: 1972, title: 'Sabhash Baby', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1972, title: 'Sabhash Vadina', director: 'M. Mallikarjuna Rao', hero: 'Krishna', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1972, title: 'Sampoorna Ramayanam', director: 'Bapu', hero: 'Sobhan Babu', heroine: 'Chandrakala', genre: 'Mythological' },
  { year: 1972, title: 'Sri Krishnanjaneya Yuddham', director: 'C. S. Rao', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Mythological' },
  { year: 1972, title: 'Vichitra Bandham', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1972, title: 'Vinta Dampatulu', director: 'K. Hemambadhara Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Comedy, Drama' },
  { year: 1972, title: 'Vooriki Vupakari', director: 'K. S. R. Das', hero: 'Chalam', heroine: 'Vijaya Nirmala', genre: 'Drama' },
];

async function applyFixes() {
  console.log('=== APPLYING 1972-1973 MOVIE FIXES ===\n');
  
  const allFixes = [...FIXES_1973, ...FIXES_1972];
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
    if (fix.heroine !== undefined) updateData.heroine = fix.heroine || null;
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
