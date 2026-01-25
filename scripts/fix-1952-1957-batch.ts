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

// 1957 Movies - Audited Data (19 movies)
const FIXES_1957: MovieFix[] = [
  { year: 1957, title: 'Bhagya Rekha', director: 'B.N. Reddy', hero: 'N.T. Rama Rao', heroine: 'Jamuna, Sowcar Janaki', genre: 'Drama' },
  { year: 1957, title: 'Bhale Ammayilu', director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', heroine: 'Savitri, Rajasulochana', genre: 'Drama' },
  { year: 1957, title: 'Bhale Baava', director: 'K.S. Prakash Rao', hero: 'Jaggayya', heroine: 'Rajasulochana', genre: 'Drama' },
  { year: 1957, title: 'Dhampathyam', director: 'A. Narayana Rao', hero: 'Relangi', heroine: 'G. Varalakshmi', genre: 'Drama' },
  { year: 1957, title: 'Kutumba Gowravam', director: 'B.S. Ranga', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1957, title: 'Nala Damayanthi', director: 'Kemparaj Urs', hero: 'Kemparaj Urs', heroine: 'P. Bhanumathi', genre: 'Mythological' },
  { year: 1957, title: 'Parasakthi', director: 'Krishnan-Panju', hero: 'Sivaji Ganesan', heroine: 'Pandari Bai', genre: 'Drama' },
  { year: 1957, title: 'Peddarikalu', director: 'Tapi Chanakya', hero: 'N.T. Rama Rao, Jaggayya', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1957, title: 'Repu Needhe', director: 'K. Bhaskar Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasulochana', genre: 'Drama' },
  { year: 1957, title: 'Sankalpam', director: 'C.V. Ranganatha Dasu', hero: 'N.T. Rama Rao', heroine: 'Rajasulochana', genre: 'Drama' },
  { year: 1957, title: 'Sarangadhara', director: 'V.S. Raghavan', hero: 'N.T. Rama Rao', heroine: 'P. Bhanumathi, Rajasulochana', genre: 'Mythological' },
  { year: 1957, title: 'Sati Anasuya', director: 'K.B. Nagabhushanam', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1957, title: 'Sati Savitri', director: 'K.B. Nagabhushanam', hero: 'N.T. Rama Rao', heroine: 'S. Varalakshmi', genre: 'Mythological' },
  { year: 1957, title: 'Swayamprabha', director: 'P. Sreedhar', hero: 'N.T. Rama Rao', heroine: 'Rajasulochana', genre: 'Drama' },
  { year: 1957, title: 'Thodi Kodallu', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama, Classic' },
  { year: 1957, title: 'Vadhante Dabbu', director: 'Y.R. Swamy', hero: 'N.T. Rama Rao', heroine: 'Jamuna, Sowcar Janaki', genre: 'Drama' },
  { year: 1957, title: 'Varudu Kavali', director: 'P.S. Ramakrishna Rao', hero: 'Jaggayya', heroine: 'P. Bhanumathi', genre: 'Drama' },
  { year: 1957, title: 'Veera Kankanam', director: 'G.R. Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari, Jamuna', genre: 'Drama' },
  { year: 1957, title: 'Vinayaka Chaviti', director: 'Samudrala Sr.', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Mythological' },
];

// 1956 Movies - Audited Data (8 movies)
const FIXES_1956: MovieFix[] = [
  { year: 1956, title: 'Amara Deepam', director: 'T. Prakash Rao', hero: 'Sivaji Ganesan', heroine: 'Savitri, Padmini', genre: 'Drama' },
  { year: 1956, title: 'Ashtaaishwaryalu', director: 'E.S.N. Murthy', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1956, title: 'Balasanyasamma Katha', director: 'P. Pullaiah', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1956, title: 'Bhakta Markandeya', director: 'B.S. Ranga', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1956, title: 'Chintamani', director: 'P.S. Ramakrishna Rao', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi, Jamuna', genre: 'Drama' },
  { year: 1956, title: 'Iddaru Pellalu', director: 'F. Nageswara Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna, Rajasulochana', genre: 'Drama' },
  { year: 1956, title: 'Nirupedalu', director: 'T. Prakash Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1956, title: 'Tenali Ramakrishna', director: 'B.S. Ranga', hero: 'N.T. Rama Rao, Akkineni Nageswara Rao', heroine: 'Bhanumathi, Jamuna', genre: 'Comedy, Historical' },
];

// 1955 Movies - Audited Data (10 movies)
const FIXES_1955: MovieFix[] = [
  { year: 1955, title: 'Aggi Ramudu', director: 'S.M. Sriramulu Naidu', hero: 'N.T. Rama Rao', heroine: 'Bhanumathi', genre: 'Action' },
  { year: 1955, title: 'Anta Manavalle', director: 'Tapi Chanakya', hero: 'Jaggayya', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1955, title: 'Beedala Patlu', director: 'B. Vittalacharya', hero: 'Akkineni Nageswara Rao', heroine: 'Sowcar Janaki', genre: 'Drama' },
  { year: 1955, title: 'Missamma', director: 'L.V. Prasad', hero: 'N.T. Rama Rao, Akkineni Nageswara Rao', heroine: 'Savitri, Jamuna', genre: 'Comedy, Classic' },
  { year: 1955, title: 'Kanyasulkam', director: 'P. Pullaiah', hero: 'N.T. Rama Rao', heroine: 'Savitri, Sowcar Janaki', genre: 'Drama, Classic' },
  { year: 1955, title: 'Ardhangi', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao, Jaggayya', heroine: 'Savitri', genre: 'Drama' },
  { year: 1955, title: 'Donga Ramudu', director: 'K.V. Reddy', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri, Jamuna', genre: 'Action, Adventure' },
  { year: 1955, title: 'Jayasimha', director: 'D. Yoganand', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi, Waheeda Rehman', genre: 'Historical' },
  { year: 1955, title: 'Raju Peda', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Lakshmi Rajyam', genre: 'Drama' },
  { year: 1955, title: 'Santhanam', director: 'C.V. Ranganatha Dasu', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri, Rajasulochana', genre: 'Drama' },
  { year: 1955, title: 'Vadina', director: 'M.V. Raman', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri, Pandari Bai', genre: 'Drama' },
];

// 1952 Movies - Audited Data (6 movies)
const FIXES_1952: MovieFix[] = [
  { year: 1952, title: 'Pelli Chesi Choodu', director: 'L.V. Prasad', hero: 'N.T. Rama Rao', heroine: 'G. Varalakshmi, Savitri', genre: 'Comedy, Classic' },
  { year: 1952, title: 'Palletooru', director: 'Tatineni Prakash Rao', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Rural Drama' },
  { year: 1952, title: 'Daasi', director: 'C.V. Ranganatha Das', hero: 'N.T. Rama Rao', heroine: 'Lakshmi Rajyam', genre: 'Social Drama' },
  { year: 1952, title: 'Dharma Devatha', director: 'P. Pullaiah', hero: 'Mudigonda Lingamurthy', heroine: 'Santha Kumari', genre: 'Folklore' },
  { year: 1952, title: 'Kanchana', director: 'S.M. Sriramulu Naidu', hero: 'K.R. Ramasamy', heroine: 'Padmini, Anjali Devi', genre: 'Drama' },
  { year: 1952, title: 'Tingu Ranga', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'G. Varalakshmi', genre: 'Comedy' },
];

async function applyFixes() {
  console.log('=== APPLYING 1952-1957 MOVIE FIXES ===\n');
  
  const allFixes = [...FIXES_1957, ...FIXES_1956, ...FIXES_1955, ...FIXES_1952];
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
