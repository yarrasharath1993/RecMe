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
  genre?: string;
  status?: string;
}

// 1966 Movies - Audited Data
const FIXES_1966: MovieFix[] = [
  { year: 1966, title: 'Aastiparulu', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Jayalalithaa', genre: 'Drama' },
  { year: 1966, title: 'Adugu Jaadalu', director: 'Tapi Chanakya', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1966, title: 'Aggi Barata', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Action, Folklore' },
  { year: 1966, title: 'Bhakta Potana', director: 'K. Kameswara Rao', hero: 'Gummadi', heroine: 'Rajasree', genre: 'Devotional, Drama' },
  { year: 1966, title: 'Bhimanjaneya Yuddham', director: 'S.D. Lal', hero: 'N.T. Rama Rao, Kanta Rao', heroine: '', genre: 'Mythological' },
  { year: 1966, title: 'Chilaka Gorinka', director: 'K. Pratyagatma', hero: 'Krishnam Raju', heroine: 'S. Varalakshmi', genre: 'Drama' },
  { year: 1966, title: 'Dr. Anand', director: 'V. Madhusudhana Rao', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi, Kanchana', genre: 'Drama' },
  { year: 1966, title: 'Hantakulostunnaru Jagratha', director: 'K.S.R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1966, title: 'Kanne Manasulu', director: 'Adurthi Subba Rao', hero: 'Krishna, Ramakrishna', heroine: 'Sandhya Rani', genre: 'Drama' },
  { year: 1966, title: 'Leta Manasulu', director: 'Krishnan-Panju', hero: 'Haranath', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1966, title: 'Loguttu Perumallukeruka', director: 'K.S.R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1966, title: 'Manase Mandiram', director: 'C.V. Sridhar', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri, Jamuna', genre: 'Drama' },
  { year: 1966, title: 'Mangalasutram', director: 'A.K. Velan', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Drama' },
  { year: 1966, title: 'Monagallaku Monagadu', director: 'S.D. Lal', hero: 'Krishna', heroine: 'Jyothi Lakshmi', genre: 'Action' },
  { year: 1966, title: 'Navaratri', director: 'T. Rama Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1966, title: 'Palnati Yuddham', director: 'Gutha Ramineedu', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi, Jamuna', genre: 'Historical' },
  { year: 1966, title: 'Palnati Yudham', director: 'Gutha Ramineedu', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi, Jamuna', genre: 'Historical', status: 'DUPLICATE' },
  { year: 1966, title: 'Pidugu Ramudu', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Action, Folklore' },
  { year: 1966, title: 'Potti Pleader', director: 'K. Hemambaradhara Rao', hero: 'Padmanabham', heroine: 'Geethanjali', genre: 'Comedy' },
  { year: 1966, title: 'Rangula Ratnam', director: 'B.N. Reddy', hero: 'Chandra Mohan', heroine: 'Vanisri, Anjali Devi', genre: 'Drama' },
  { year: 1966, title: 'Sangeeta Lakshmi', director: 'Giduturi Suryam', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1966, title: 'Shakuntala', director: 'K. Kameswara Rao', hero: 'N.T. Rama Rao', heroine: 'B. Saroja Devi', genre: 'Mythological' },
  { year: 1966, title: 'Shrimati', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Devika', genre: 'Drama' },
  { year: 1966, title: 'Srikakula Andhra Maha Vishnu Katha', director: 'A.K. Velan', hero: 'N.T. Rama Rao', heroine: 'Jamuna, S. Varalakshmi', genre: 'Mythological' },
  { year: 1966, title: 'Aada Brathuku', director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Drama' },
];

// 1965 Movies - Audited Data
const FIXES_1965: MovieFix[] = [
  { year: 1965, title: 'Chaduvukonna Bharya', director: 'K.B. Tilak', hero: 'Krishna', heroine: 'Savitri', genre: 'Drama' },
  { year: 1965, title: 'Chandrahasa', director: 'B.S. Ranga', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Folklore' },
  { year: 1965, title: 'Devata', director: 'K. Hemambaradhara Rao', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1965, title: 'Dorikithe Dongalu', director: 'P. Pullaiah', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Action' },
  { year: 1965, title: 'Keelu Bommalu', director: 'C.S. Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1965, title: 'Mangamma Sapatham', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Jamuna, Rajasree', genre: 'Folklore' },
  { year: 1965, title: 'Manushulu Mamathalu', director: 'K. Pratyagatma', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri, Jayalalithaa', genre: 'Drama' },
  { year: 1965, title: 'Pakkalo Ballem', director: 'S.R. Puttanna Kanagal', hero: 'N.T. Rama Rao', heroine: 'Jayalalithaa', genre: 'Drama' },
  { year: 1965, title: 'Prachanda Bhairavi', director: 'C.S. Rao', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1965, title: 'Prameelarjuneeyam', director: 'M. Mallikarjuna Rao', hero: 'N.T. Rama Rao', heroine: 'B. Saroja Devi', genre: 'Mythological' },
  { year: 1965, title: 'Pratignapalana', director: 'C.S. Rao', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1965, title: 'Preminchi Choodu', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasree, Kanchana', genre: 'Romance' },
  { year: 1965, title: 'Sati Sakkubai', director: 'V. Raghavayya', hero: 'S.V. Ranga Rao', heroine: 'Anjali Devi', genre: 'Mythological, Devotional' },
  { year: 1965, title: 'Satya Harishchandra', director: 'K.V. Reddy', hero: 'N.T. Rama Rao', heroine: 'S. Varalakshmi', genre: 'Mythological' },
  { year: 1965, title: 'Sri Simhachala Kshetra Mahima', director: 'B.V. Prasad', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Mythological' },
  { year: 1965, title: 'Sumangali', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1965, title: 'Tene Manasulu', director: 'Adurthi Subba Rao', hero: 'Krishna, Rammohan', heroine: 'Sukanya', genre: 'Drama' },
  { year: 1965, title: 'Thodu Needa', director: 'Adurthi Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi, Jamuna', genre: 'Drama' },
  { year: 1965, title: 'Veelunama', director: 'K. Pratyagatma', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1965, title: 'Veerabhimanyu', director: 'V. Madhusudhana Rao', hero: 'N.T. Rama Rao, Sobhan Babu', heroine: 'Kanchana', genre: 'Mythological' },
  { year: 1965, title: 'Visala Hrudayalu', director: 'T. Rama Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1965, title: 'Zamindar', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
];

// 1964 Movies - Audited Data
const FIXES_1964: MovieFix[] = [
  { year: 1964, title: 'Aatma Balam', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'B. Saroja Devi', genre: 'Drama' },
  { year: 1964, title: 'Amara Shilpi Jakkanna', director: 'Y.R. Swamy', hero: 'Akkineni Nageswara Rao', heroine: 'B. Saroja Devi', genre: 'Historical, Drama' },
  { year: 1964, title: 'Babruvahana', director: 'Samudrala Sr.', hero: 'N.T. Rama Rao', heroine: 'S. Varalakshmi, Rajasree', genre: 'Mythological' },
  { year: 1964, title: 'Bobbili Yuddham', director: 'C. Seetharam', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi', genre: 'Historical' },
  { year: 1964, title: 'Dagudu Moothalu', director: 'Adurthi Subba Rao', hero: 'N.T. Rama Rao', heroine: 'B. Saroja Devi', genre: 'Drama' },
  { year: 1964, title: 'Gudi Gantalu', director: 'V. Madhusudhana Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1964, title: 'Kalavari Kodalu', director: 'K. Hemambaradhara Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1964, title: 'Manchi Manishi', director: 'K. Pratyagatma', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1964, title: 'Pativrata', director: 'M.S. Kota Reddy', hero: 'Kanta Rao', heroine: 'Devika', genre: 'Drama' },
  { year: 1964, title: 'Peetala Meeda Pelli', director: 'B. Bhargava Rao', hero: 'Haranath', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1964, title: 'Pooja Phalamu', director: 'B.N. Reddy', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri, Jamuna', genre: 'Drama' },
  { year: 1964, title: 'Ramudu Bheemudu', director: 'Tapi Chanakya', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Comedy, Drama' },
  { year: 1964, title: 'Sabhash Suri', director: 'I.N. Murthy', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Action' },
  { year: 1964, title: 'Sri Satyanarayana Mahathyam', director: 'S. Rajinikanth', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Mythological' },
  { year: 1964, title: 'Sri Tirupatamma Katha', director: 'B.S. Narayana', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Mythological' },
  { year: 1964, title: 'Vaarasatwam', director: 'Tapi Chanakya', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1964, title: 'Vivaha Bandham', director: 'P.S. Ramakrishna Rao', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi', genre: 'Drama' },
];

async function applyFixes() {
  console.log('=== APPLYING 1964-1966 MOVIE FIXES ===\n');
  
  const allFixes = [...FIXES_1966, ...FIXES_1965, ...FIXES_1964];
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
