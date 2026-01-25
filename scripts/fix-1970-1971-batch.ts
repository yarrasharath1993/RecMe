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

// 1971 Movies - Audited Data
const FIXES_1971: MovieFix[] = [
  { year: 1971, title: 'Adrusta Jathakudu', director: 'K. Hemambadhara Rao', hero: 'N.T. Rama Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1971, title: 'Amaayakuraalu', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Kanchana, Sharada', genre: 'Drama' },
  { year: 1971, title: 'Anuradha', director: 'P. Chandrasekhara Reddy', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1971, title: 'Athalu Kodallu', director: 'P. Sambasiva Rao', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama, Family' },
  { year: 1971, title: 'Bangaru Kutumbam', director: 'K. S. Prakash Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1971, title: 'Bangaru Talli', director: 'Tapi Chanakya', hero: 'Sobhan Babu', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1971, title: 'Bhagyavantudu', director: 'C. S. Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1971, title: 'Bhale Papa', director: 'K. S. Prakash Rao', hero: 'N.T. Rama Rao', heroine: 'K. R. Vijaya', genre: 'Drama' },
  { year: 1971, title: 'Bomma Borusa', director: 'K. Balachander', hero: 'Chandra Mohan', heroine: 'S. Varalakshmi', genre: 'Comedy' },
  { year: 1971, title: 'Chinnanati Snehitulu', director: 'K. Viswanath', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Drama' },
  { year: 1971, title: 'Gudachari 003', director: 'P. Sambasiva Rao', hero: 'Krishna', heroine: 'Jayalalithaa', genre: 'Spy, Thriller' },
  { year: 1971, title: 'Jeevitha Chakram', director: 'C. S. Rao', hero: 'N.T. Rama Rao', heroine: 'Vanisri, Sharada', genre: 'Drama' },
  { year: 1971, title: 'Manasu Mangalyam', director: 'K. Pratyagatma', hero: 'Akkineni Nageswara Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1971, title: 'Master Kiladi', director: 'M. Mallikarjuna Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1971, title: 'Nammaka Drohulu', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Chandana', genre: 'Action, Crime' },
  { year: 1971, title: 'Nindu Dampathulu', director: 'K. Viswanath', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama, Family' },
  { year: 1971, title: 'Pagabattina Paduchu', director: 'S. D. Lal', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1971, title: 'Pattukunte Laksha', director: 'B. O. Subba Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Mystery' },
  { year: 1971, title: 'Pavitra Hrudayalu', director: 'A. Bhimsingh', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1971, title: 'Pethamdaarlu', director: 'C. S. Rao', hero: 'N.T. Rama Rao, Sobhan Babu', heroine: 'Savitri, Vijaya Nirmala', genre: 'Action, Drama' },
  { year: 1971, title: 'Prema Jeevulu', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1971, title: 'Prema Nagar', director: 'K. S. Prakash Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Vanisri', genre: 'Romance, Drama' },
  { year: 1971, title: 'Raitu Bidda', director: 'B. A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1971, title: 'Raitu Kutumbam', director: 'P. Sambasiva Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1971, title: 'Rajakota Rahasyam', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Folklore, Action' },
  { year: 1971, title: 'Ramalayam', director: 'K. Bapayya', hero: 'Sobhan Babu', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1971, title: 'Rangeli Raja', director: 'C. S. Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Kanchana, Lakshmi', genre: 'Drama' },
  { year: 1971, title: 'Sampoorna Ramayanam', director: 'Bapu', hero: 'Sobhan Babu', heroine: 'Chandra Kala', genre: 'Mythological' },
  { year: 1971, title: 'Sati Ansuya', director: 'B. A. Subba Rao', hero: 'Gummadi', heroine: 'Jamuna, Sharada', genre: 'Mythological' },
  { year: 1971, title: 'Sisindri Chittibabu', director: 'A. Sanjeevi', hero: 'Sobhan Babu', heroine: 'Sharada', genre: 'Drama' },
  { year: 1971, title: 'Sri Krishna Satya', director: 'K. V. Reddy', hero: 'N.T. Rama Rao', heroine: 'Jayalalithaa', genre: 'Mythological' },
  { year: 1971, title: 'Suputhrudu', director: 'Tatineni Rama Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Lakshmi', genre: 'Drama' },
  { year: 1971, title: 'Varalakshmi Vratam', director: 'B. Vittalacharya', hero: 'Krishna', heroine: 'Savitri', genre: 'Folklore, Devotional' },
  { year: 1971, title: 'Vichithra Kutumbam', director: 'K. S. Prakash Rao', hero: 'N.T. Rama Rao, Krishna, Sobhan Babu', heroine: 'Savitri', genre: 'Drama, Family' },
  { year: 1971, title: 'Vikramarka Vijayam', director: 'G. Viswanatham', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
];

// 1970 Movies - Audited Data
const FIXES_1970: MovieFix[] = [
  { year: 1970, title: 'Agni Pariksha', director: 'K. Varaprasada Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1970, title: 'Akhandudu', director: 'V. Ramachandra Rao', hero: 'Krishna', heroine: 'Bharathi', genre: 'Action, Romance' },
  { year: 1970, title: 'Allude Menalludu', director: 'P. Pullaiah', hero: 'Krishna, Krishnam Raju', heroine: 'Vijaya Nirmala', genre: 'Drama, Family' },
  { year: 1970, title: 'Amma Kosam', director: 'B. V. Prasad', hero: 'Krishnam Raju, Krishna', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1970, title: 'Andarki Monagadu', director: 'M. Mallikarjuna Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1970, title: 'Balaraju Katha', director: 'Bapu', hero: 'M. Prabhakar Reddy', heroine: 'Chayadevi', genre: 'Drama' },
  { year: 1970, title: 'Chitti Chellelu', director: 'M. Krishnan Nair', hero: 'N.T. Rama Rao', heroine: 'Vanisri', genre: 'Drama, Family' },
  { year: 1970, title: 'Dharma Daata', director: 'A. Sanjeevi', hero: 'Akkineni Nageswara Rao', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1970, title: 'Drohi', director: 'K. Bapayya', hero: 'Jaggayya', heroine: 'K. R. Vijaya, Vanisri', genre: 'Crime, Drama' },
  { year: 1970, title: 'Jai Jawan', director: 'D. Yoganand', hero: 'Akkineni Nageswara Rao, Krishnam Raju', heroine: 'Bharathi, Manjula', genre: 'Patriotic, Drama' },
  { year: 1970, title: 'Lakshmi Kataksham', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Rajasree, K. R. Vijaya', genre: 'Folklore, Fantasy' },
  { year: 1970, title: 'Maa Nanna Nirdhoshi', director: 'K. V. Nandana Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1970, title: 'Maayani Mamata', director: 'Kamalakara Kameswara Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasree, Lakshmi', genre: 'Drama' },
  { year: 1970, title: 'Malli Pelli', director: 'C.S. Rao', hero: 'Y.V. Rao', heroine: 'Kanchanamala', genre: 'Drama' },
  { year: 1970, title: 'Marina Manishi', director: 'C. S. Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1970, title: 'Merupu Veerudu', director: 'B. Vittalacharya', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Action, Folklore' },
  { year: 1970, title: 'Oke Kutumbham', director: 'A. Bhimsingh', hero: 'N.T. Rama Rao', heroine: 'Lakshmi, Rajasree', genre: 'Drama' },
  { year: 1970, title: 'Pachhani Samsaram', director: 'Lakshmi Deepak', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama, Family' },
  { year: 1970, title: 'Paga Sadista', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1970, title: 'Pelli Koothuru', director: 'V. Ramachandra Rao', hero: 'Chandra Mohan', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1970, title: 'Pelli Sambandham', director: 'K. Varaprasada Rao', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1970, title: 'Pettandarulu', director: 'C. S. Rao', hero: 'N.T. Rama Rao, Sobhan Babu', heroine: 'Savitri, Vijaya Nirmala', genre: 'Drama' },
  { year: 1970, title: 'Rendu Kutumbala Katha', director: 'P. Sambasiva Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama, Family' },
  { year: 1970, title: 'Sambarala Rambabu', director: 'G. V. R. Seshagiri Rao', hero: 'Chalam', heroine: 'Sharada', genre: 'Comedy, Drama' },
  { year: 1970, title: 'Thaali Bottu', director: 'M. Mallikarjuna Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
];

async function applyFixes() {
  console.log('=== APPLYING 1970-1971 MOVIE FIXES ===\n');
  
  const allFixes = [...FIXES_1971, ...FIXES_1970];
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
