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

// 1954 Movies - Audited Data (21 movies)
const FIXES_1954: MovieFix[] = [
  { year: 1954, title: 'Parivartana', director: 'T. Prakash Rao', hero: 'N.T. Rama Rao, Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1954, title: 'Jyothi', director: 'K.B. Tilak', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1954, title: 'Annadata', director: 'Vedantam Raghavayya', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1954, title: 'Jatakaphalam', director: 'R. Nagendra Rao', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1954, title: 'Chakrapani', director: 'P.S. Ramakrishna Rao', hero: 'Akkineni Nageswara Rao', heroine: 'P. Bhanumathi', genre: 'Drama' },
  { year: 1954, title: 'Chandraharam', director: 'K.V. Reddy', hero: 'N.T. Rama Rao', heroine: 'Savitri, S. Varalakshmi', genre: 'Folklore' },
  { year: 1954, title: 'Todu Dongalu', director: 'D. Yoganand', hero: 'N.T. Rama Rao, Gummadi', heroine: '', genre: 'Action' },
  { year: 1954, title: 'Aggi Ramudu', director: 'S.M. Sriramulu Naidu', hero: 'N.T. Rama Rao', heroine: 'P. Bhanumathi', genre: 'Action' },
  { year: 1954, title: 'Rechukka', director: 'P. Pullaiah', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi, Devika', genre: 'Drama' },
  { year: 1954, title: 'Anta Manavalle', director: 'Tapi Chanakya', hero: 'Jaggayya', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1954, title: 'Baalanandam', director: 'K.S. Prakash Rao', hero: 'Relangi', heroine: 'Girija', genre: 'Comedy' },
  { year: 1954, title: 'Sati Sakkubai', director: 'Vedantam Raghavayya', hero: 'S.V. Ranga Rao', heroine: 'Anjali Devi', genre: 'Devotional' },
  { year: 1954, title: 'Amara Sandhesam', director: 'Adurthi Subba Rao', hero: 'Amarnath', heroine: 'Sriranjani', genre: 'Drama' },
  { year: 1954, title: 'Iddaru Pellalu', director: 'F. Nageswara Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna, Rajasulochana', genre: 'Drama' },
  { year: 1954, title: 'Maa Gopi', director: 'B.S. Ranga', hero: 'N.T. Rama Rao', heroine: 'Savitri, Jamuna', genre: 'Drama' },
  { year: 1954, title: 'Nirupedalu', director: 'T. Prakash Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1954, title: 'Kalahasti Mahatyam', director: 'H.L.N. Simha', hero: 'Rajkumar', heroine: 'Anjali Devi', genre: 'Devotional' },
  { year: 1954, title: 'Palle Paduchu', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Rural Drama' },
  { year: 1954, title: 'Peddamanushulu', director: 'K.V. Reddy', hero: 'C.S.R. Anjaneyulu', heroine: 'Sriranjani', genre: 'Drama' },
  { year: 1954, title: 'Menarikam', director: 'Jampana', hero: 'N.T. Rama Rao', heroine: 'P. Bhanumathi', genre: 'Drama' },
  { year: 1954, title: 'Raju Peda', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Lakshmi Rajyam', genre: 'Drama' },
];

// 1953 Movies - Audited Data (14 movies)
const FIXES_1953: MovieFix[] = [
  { year: 1953, title: 'Pempudu Koduku', director: 'L.V. Prasad', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1953, title: 'Naa Chellelu', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1953, title: 'Puttillu', director: 'Dr. Raja Rao', hero: 'Jamuna', heroine: 'Savitri', genre: 'Drama' },
  { year: 1953, title: 'Bratuku Teruvu', director: 'P.S. Ramakrishna Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri, Jamuna', genre: 'Drama' },
  { year: 1953, title: 'Chandirani', director: 'P. Bhanumathi', hero: 'N.T. Rama Rao', heroine: 'P. Bhanumathi', genre: 'Fantasy' },
  { year: 1953, title: 'Gumastha', director: 'R.M. Krishnaswamy', hero: 'Akkineni Nageswara Rao, Chittoor V. Nagaiah', heroine: '', genre: 'Drama' },
  { year: 1953, title: 'Paradesi', director: 'L.V. Prasad', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1953, title: 'Kanna Talli', director: 'K.S. Prakash Rao', hero: 'Akkineni Nageswara Rao', heroine: 'G. Varalakshmi', genre: 'Drama' },
  { year: 1953, title: 'Prema Lekhalu', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasulochana', genre: 'Romance' },
  { year: 1953, title: 'Lakshmi', director: 'K.B. Nagabhushanam', hero: 'C.S.R. Anjaneyulu', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1953, title: 'Chivarku Migiledhi', director: 'Gutha Ramineedu', hero: 'Kanta Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1953, title: 'Pichi Pullayya', director: 'T. Prakash Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1953, title: 'Pratigna', director: 'H.M. Reddy', hero: 'Kanta Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1953, title: 'Kodarikam', director: 'Vedantam Raghavayya', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
];

// 1951-1952 Movies - Audited Data
const FIXES_1951_1952: MovieFix[] = [
  // 1952
  { year: 1952, title: 'Palletooru', director: 'T. Prakash Rao', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Rural Drama' },
  { year: 1952, title: 'Daasi', director: 'L.V. Prasad', hero: 'N.T. Rama Rao', heroine: 'Lakshmi Rajyam', genre: 'Social Drama' },
  { year: 1952, title: 'Dharma Devatha', director: 'P. Pullaiah', hero: 'N.T. Rama Rao', heroine: 'Santha Kumari, Savitri, Girija', genre: 'Folklore' },
  { year: 1952, title: 'Pelli Chesi Choodu', director: 'L.V. Prasad', hero: 'N.T. Rama Rao', heroine: 'G. Varalakshmi, Savitri', genre: 'Comedy, Classic' },
  { year: 1952, title: 'Aadarsham', director: 'H.L.N. Simha', hero: 'Jaggayya', heroine: 'Savitri', genre: 'Drama' },
  { year: 1952, title: 'Praja Seva', director: 'K. Prabhakar Rao', hero: '', heroine: 'Lakshmi Rajyam, Girija', genre: 'Drama' },
  { year: 1952, title: 'Peda Raithu', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Rural Drama' },
  { year: 1952, title: 'Sahasam', director: 'K.B. Nagabhushanam', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Action' },
  { year: 1952, title: 'Chinna Kodalu', director: 'K. Bapayya', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1952, title: 'Beedala Patlu', director: 'K. Ramnoth', hero: 'Chittoor V. Nagaiah', heroine: 'Lakshmi Rajyam', genre: 'Drama' },
  // 1951
  { year: 1951, title: 'Malliswari', director: 'B.N. Reddy', hero: 'N.T. Rama Rao', heroine: 'P. Bhanumathi', genre: 'Romance, Classic' },
  { year: 1951, title: 'Patala Bhairavi', director: 'K.V. Reddy', hero: 'N.T. Rama Rao', heroine: 'K. Malathi', genre: 'Fantasy, Classic' },
  { year: 1951, title: 'Aada Janma', director: 'G.R. Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1951, title: 'Agni Pareeksha', director: 'K. Varaprasad Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1951, title: 'Navvithe Navaratnalu', director: 'S. Soundararajan', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi, Krishna Kumari', genre: 'Comedy' },
  { year: 1951, title: 'Tilottama', director: 'H.V. Babu', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
];

// 1949-1950 Movies - Audited Data
const FIXES_1949_1950: MovieFix[] = [
  { year: 1950, title: 'Samsaram', director: 'L.V. Prasad', hero: 'N.T. Rama Rao, Akkineni Nageswara Rao', heroine: 'Lakshmi Rajyam', genre: 'Drama' },
  { year: 1950, title: 'Beedala Patlu', director: 'K. Ramnoth', hero: 'Chittoor V. Nagaiah', heroine: 'Tanguturi Suryakumari', genre: 'Drama' },
  { year: 1949, title: 'Mana Desam', director: 'L.V. Prasad', hero: 'Chittoor V. Nagaiah, N.T. Rama Rao', heroine: '', genre: 'Drama' },
  { year: 1949, title: 'Gunasundari Katha', director: 'K.V. Reddy', hero: 'Kasturi Siva Rao', heroine: 'Sriranjani', genre: 'Folklore' },
  { year: 1949, title: 'Keelu Gurram', director: 'Raja of Mirzapuram', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Fantasy' },
  { year: 1949, title: 'Laila Majnu', director: 'P.S. Ramakrishna Rao', hero: 'Akkineni Nageswara Rao', heroine: 'P. Bhanumathi', genre: 'Romance' },
];

// 1945-1948 Movies - Audited Data
const FIXES_1945_1948: MovieFix[] = [
  { year: 1948, title: 'Balaraju', director: 'Ghantasala Balaramaiah', hero: 'Akkineni Nageswara Rao', heroine: 'S. Varalakshmi', genre: 'Drama' },
  { year: 1948, title: 'Drohi', director: 'L.V. Prasad', hero: 'Chittoor V. Nagaiah', heroine: 'G. Varalakshmi', genre: 'Drama' },
  { year: 1948, title: 'Vindhya Rani', director: 'C. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'G. Varalakshmi', genre: 'Drama' },
  { year: 1948, title: 'Ratnamala', director: 'P.S. Ramakrishna Rao', hero: 'Akkineni Nageswara Rao', heroine: 'P. Bhanumathi', genre: 'Drama' },
  { year: 1947, title: 'Palnati Yuddham', director: 'L.V. Prasad', hero: 'Govindarajula Subba Rao', heroine: 'P. Kannamba', genre: 'Historical' },
  { year: 1946, title: 'Tyagayya', director: 'Chittoor V. Nagaiah', hero: 'Chittoor V. Nagaiah', heroine: '', genre: 'Devotional, Biographical' },
  { year: 1945, title: 'Swarga Seema', director: 'B.N. Reddy', hero: 'Chittoor V. Nagaiah', heroine: 'P. Bhanumathi', genre: 'Drama' },
  { year: 1945, title: 'Returning Soldier', director: 'P. Pullaiah', hero: 'Jaggayya', heroine: '', genre: 'Drama' },
];

// 1939-1944 Movies - Audited Data (Early Talkies)
const FIXES_1939_1944: MovieFix[] = [
  { year: 1944, title: 'Oka Roju Raju', director: 'L.V. Prasad', hero: 'Raja Babu', heroine: 'Lakshmi Rajyam', genre: 'Drama' },
  { year: 1944, title: 'Samsara Naradhi', director: 'K.B. Nagabhushanam', hero: 'C.S.R. Anjaneyulu', heroine: '', genre: 'Drama' },
  { year: 1944, title: 'Bhakta Kabiru', director: 'R. Nagendra Rao', hero: 'Chittoor V. Nagaiah', heroine: '', genre: 'Devotional' },
  { year: 1943, title: 'Pantulamma', director: 'Y.V. Rao', hero: 'Mudigonda Lingamurthy', heroine: 'Lakshmi Rajyam', genre: 'Drama' },
  { year: 1943, title: 'Chenchu Lakshmi', director: 'S. Rajinikanth', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1942, title: 'Bhakta Potana', director: 'K.V. Reddy', hero: 'Chittoor V. Nagaiah', heroine: '', genre: 'Devotional, Biographical' },
  { year: 1942, title: 'Bala Nagamma', director: 'C. Pullaiah', hero: 'Govindarajula Subba Rao', heroine: 'Kanchanamala', genre: 'Folklore' },
  { year: 1941, title: 'Dharmapatni', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'Santha Kumari', genre: 'Drama' },
  { year: 1941, title: 'Choodamani', director: 'P. Pullaiah', hero: 'C.S.R. Anjaneyulu', heroine: 'Pushpavalli', genre: 'Drama' },
  { year: 1940, title: 'Illalu', director: 'Gudavalli Ramabrahmam', hero: 'P. Suribabu', heroine: 'Kanchanamala', genre: 'Drama' },
  { year: 1940, title: 'Barrister Parvateesam', director: 'R. Prakash', hero: 'Lanka Satyam', heroine: 'G. Varalakshmi', genre: 'Comedy' },
  { year: 1940, title: 'Viswa Mohini', director: 'Y.V. Rao', hero: 'Chittoor V. Nagaiah', heroine: 'Bezawada Rajaratnam', genre: 'Drama' },
  { year: 1939, title: 'Vande Mataram', director: 'B.N. Reddy', hero: 'Chittoor V. Nagaiah', heroine: 'Kanchanamala', genre: 'Patriotic' },
  { year: 1936, title: 'Sati Tulasi', director: 'Chitrapu Narasimha Rao', hero: 'C.S.R. Anjaneyulu', heroine: '', genre: 'Mythological' },
  { year: 1931, title: 'Bhakta Prahlada', director: 'H.M. Reddy', hero: 'Valluru Subbaiah', heroine: 'Surabhi Kamalabai', genre: 'Mythological, First Telugu Talkie' },
];

async function applyFixes() {
  console.log('=== APPLYING 1931-1954 MOVIE FIXES ===\n');
  
  const allFixes = [
    ...FIXES_1954, 
    ...FIXES_1953, 
    ...FIXES_1951_1952, 
    ...FIXES_1949_1950, 
    ...FIXES_1945_1948,
    ...FIXES_1939_1944
  ];
  
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
      // Try more flexible search - first word
      const firstWord = fix.title.split(' ')[0];
      if (firstWord.length > 3) {
        const { data: flexMovie } = await supabase
          .from('movies')
          .select('id, title_en, slug, release_year, director, hero, heroine')
          .eq('release_year', fix.year)
          .eq('is_published', true)
          .ilike('title_en', `%${firstWord}%`)
          .limit(1)
          .single();
        
        movie = flexMovie;
      }
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
    if (fix.hero !== undefined) updateData.hero = fix.hero || null;
    if (fix.heroine !== undefined) updateData.heroine = fix.heroine || null;
    if (fix.genre) updateData.genres = fix.genre.split(', ').map(g => g.trim());
    
    const { error: updateError } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', movie.id);
    
    if (!updateError) {
      console.log(`OK: ${movie.title_en} (${fix.year}) -> Dir: ${fix.director}, Hero: ${fix.hero || 'N/A'}, Heroine: ${fix.heroine || 'N/A'}`);
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
