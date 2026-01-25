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

// 1969 Movies - Audited Data
const FIXES_1969: MovieFix[] = [
  { year: 1969, title: 'Aadarsa Kutumbam', director: 'K. Pratyagatma', hero: 'Akkineni Nageswara Rao', heroine: 'Jayalalithaa', genre: 'Drama' },
  { year: 1969, title: 'Aatmiyulu', director: 'V. Madhusudhan Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1969, title: 'Adrushtavanthulu', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Jayalalithaa', genre: 'Action, Drama' },
  { year: 1969, title: 'Aggi Pidugu', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Action, Folklore' },
  { year: 1969, title: 'Aggi Veerudu', director: 'B.V. Srinivas', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Action, Folklore' },
  { year: 1969, title: 'Annadammulu', director: 'V. Ramachandra Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1969, title: 'Ardharathiri', director: 'P. Sambasiva Rao', hero: 'Jaggayya', heroine: 'Bharathi', genre: 'Thriller' },
  { year: 1969, title: 'Astulu Anthastulu', director: 'V. Ramachandra Rao', hero: 'Krishna', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1969, title: 'Bandhipotu Bhimanna', director: 'M. Mallikharjuna Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Folklore' },
  { year: 1969, title: 'Bandipotu Bheemanna', director: 'M. Mallikharjuna Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Folklore', status: 'DUPLICATE' },
  { year: 1969, title: 'Bangaru Panjaram', director: 'B.N. Reddy', hero: 'Sobhan Babu', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1969, title: 'Bhale Abbailu', director: 'P. Sambasiva Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Comedy' },
  { year: 1969, title: 'Bhale Mastaru', director: 'S.D. Lal', hero: 'Krishnam Raju', heroine: 'Anjali Devi, Kanchana', genre: 'Comedy' },
  { year: 1969, title: 'Bhale Rangadu', director: 'Tatineni Rama Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1969, title: 'Bhale Thammudu', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'K.R. Vijaya', genre: 'Action' },
  { year: 1969, title: 'Bommalu Cheppina Katha', director: 'G. Viswanatham', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Folklore' },
  { year: 1969, title: 'Buddhimantudu', director: 'Bapu', hero: 'Akkineni Nageswara Rao', heroine: 'Vijaya Nirmala', genre: 'Devotional, Drama' },
  { year: 1969, title: 'Ekaveera', director: 'C.S. Rao', hero: 'N.T. Rama Rao', heroine: 'K.R. Vijaya', genre: 'Historical' },
  { year: 1969, title: 'Gandaragandudu', director: 'K.S.R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Folklore' },
  { year: 1969, title: 'Gandikota Rahasyam', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Jayalalithaa', genre: 'Fantasy, Action' },
  { year: 1969, title: 'Jagath Kiladeelu', director: 'I.N. Murthy', hero: 'Krishna', heroine: 'Vanisri', genre: 'Action, Thriller' },
  { year: 1969, title: 'Jarigina Katha', director: 'K. Babu Rao', hero: 'Krishna', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1969, title: 'Kadaladu Vadaladu', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Jayalalithaa', genre: 'Action, Folklore' },
  { year: 1969, title: 'Karpoora Harathi', director: 'V. Madhusudan Rao', hero: 'Sobhan Babu', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1969, title: 'Kathanayakudu', director: 'K. Hemambaradhara Rao', hero: 'N.T. Rama Rao', heroine: 'Jayalalithaa', genre: 'Political, Drama' },
  { year: 1969, title: 'Love in Andhra', director: 'P. V. Satyanarayana', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Comedy' },
  { year: 1969, title: 'Mahabaludu', director: 'K. S. R. Das', hero: 'Krishna', heroine: 'Vanisri', genre: 'Folklore' },
  { year: 1969, title: 'Mamaku Tagga Kodalu', director: 'C.S. Rao', hero: 'Chalam', heroine: 'Jamuna', genre: 'Drama, Family' },
  { year: 1969, title: 'Manchi Mithrulu', director: 'Tatineni Rama Rao', hero: 'Sobhan Babu, Krishna', heroine: 'Gitanjali', genre: 'Drama' },
  { year: 1969, title: 'Manishichina Maguva', director: 'A. Bhimsingh', hero: 'Murali Mohan', heroine: 'Savitri', genre: 'Drama' },
  { year: 1969, title: 'Manushulu Marali', director: 'V. Madhusudhan Rao', hero: 'Sobhan Babu', heroine: 'Sharada', genre: 'Drama' },
  { year: 1969, title: 'Mathru Devata', director: 'Savitri', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1969, title: 'Muhrutha Balam', director: 'M. Mallikharjuna Rao', hero: 'Jaggayya', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1969, title: 'Natakala Rayudu', director: 'K. Sanjeevi', hero: 'Nagabhushanam', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1969, title: 'Poovanam', director: 'Bapu', hero: 'Sobhan Babu', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1969, title: 'Raja Simha', director: 'K. Vasu', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Action' },
  { year: 1969, title: 'Sabash Satyam', director: 'G. Viswanatham', hero: 'Krishna', heroine: 'Rajasree', genre: 'Sci-Fi, Action' },
  { year: 1969, title: 'Saptaswaralu', director: 'Vedantam Raghavayya', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1969, title: 'Sattekalapu Satteya', director: 'K. Balachander', hero: 'Chalam, Sobhan Babu', heroine: '', genre: 'Drama' },
  { year: 1969, title: 'Shri Rama Katha', director: 'B. Padmanabham', hero: 'Gummadi', heroine: 'Anjali Devi, Sharada', genre: 'Mythological' },
  { year: 1969, title: 'Sipayi Chinnayya', director: 'G. K. Ramu', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Action' },
  { year: 1969, title: 'Takkari Donga Chakkani Chukka', director: 'K. S. R. Doss', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action' },
  { year: 1969, title: 'Ukkupidugu', director: 'K.S.R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Folklore' },
  { year: 1969, title: 'Vichitra Kutumbam', director: 'Adauru Bhujanga Rao', hero: 'Krishna', heroine: 'Kanchana', genre: 'Drama' },
];

// 1968 Movies - Audited Data
const FIXES_1968: MovieFix[] = [
  { year: 1968, title: 'Aggi Meeda Guggilam', director: 'G. Viswanatham', hero: 'Tadepalli Lakshmi Kanta Rao', heroine: 'Rajasree', genre: 'Action, Folklore' },
  { year: 1968, title: 'Asadhyudu', director: 'V. Ramachandra Rao', hero: 'Krishna', heroine: 'K.R. Vijaya', genre: 'Action, Thriller' },
  { year: 1968, title: 'Attagaru Kotha Kodalu', director: 'Akkineni Sanjeevi Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama, Family' },
  { year: 1968, title: 'Bandhavyalu', director: 'S.V. Ranga Rao', hero: 'S.V. Ranga Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1968, title: 'Bandipotu Dongalu', director: 'K.S. Prakash Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Jamuna, Kanchana', genre: 'Action' },
  { year: 1968, title: 'Bangaru Gaajulu', director: 'C.S. Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Bharathi Vishnuvardhan', genre: 'Drama' },
  { year: 1968, title: 'Bangaru Sankellu', director: 'Gutha Ramineedu', hero: 'Haranath', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1968, title: 'Bhagya Chakramu', director: 'K.V. Reddy', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1968, title: 'Bhale Master', director: 'S.D. Lal', hero: 'Akkineni Nageswara Rao', heroine: 'Kanchana', genre: 'Comedy, Drama' },
  { year: 1968, title: 'Bharya', director: 'K.S. Prakash Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1968, title: 'Brahmachari', director: 'Tatineni Rama Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Jayalalithaa', genre: 'Comedy, Drama' },
  { year: 1968, title: 'Chelleli Kosam', director: 'M. Mallikarjuna Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1968, title: 'Chinnari Papalu', director: 'Savitri', hero: 'Jaggayya', heroine: 'Savitri', genre: 'Drama' },
  { year: 1968, title: 'Circar Express', director: 'K.S.R. Das', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Thriller' },
  { year: 1968, title: 'Devadichina Bharta', director: 'P. Padmanabham', hero: 'Krishna', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1968, title: 'Devakanya', director: 'K. Hemambadhara Rao', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1968, title: 'Evaru Monagadu', director: 'R. Sundaram', hero: 'Kanta Rao', heroine: 'Sowcar Janaki', genre: 'Action, Crime' },
  { year: 1968, title: 'Govula Gopanna', director: 'C.S. Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1968, title: 'Kalisochina Adrushtam', director: 'K. Viswanath', hero: 'N.T. Rama Rao', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1968, title: 'Kumkuma Barani', director: 'M. Mallikarjuna Rao', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1968, title: 'Manasamsaram', director: 'C.S. Rao', hero: 'Jaggayya', heroine: 'Savitri', genre: 'Drama' },
  { year: 1968, title: 'Manchi Kutumbam', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Kanchana', genre: 'Drama' },
  { year: 1968, title: 'Nadamanthrapu Siri', director: 'T. Rama Rao', hero: 'Haranath', heroine: 'Vijaya Nirmala', genre: 'Drama' },
  { year: 1968, title: 'Nene Monaganni', director: 'S.D. Lal', hero: 'N.T. Rama Rao', heroine: 'Sheela', genre: 'Action' },
  { year: 1968, title: 'Niluvu Dopidi', director: 'C.S. Rao', hero: 'N.T. Rama Rao, Krishna', heroine: 'Devika, Jayalalitha', genre: 'Action, Drama' },
  { year: 1968, title: 'Nindu Samsaram', director: 'C.S. Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1968, title: 'Paala Manasulu', director: 'S.S.R. Krishna', hero: 'Haranath', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1968, title: 'Panthaalu Pattimpulu', director: 'K.B. Tilak', hero: 'Sobhan Babu', heroine: 'Vanisri', genre: 'Drama' },
  { year: 1968, title: 'Papa Kosam', director: 'G.V.R. Seshagiri Rao', hero: 'Tyagaraju', heroine: 'Baby Rani', genre: 'Drama' },
  { year: 1968, title: 'Pedaraasi Peddamma Katha', director: 'G. Viswanatham', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1968, title: 'Pelliroju', director: 'K. Sanjeevi', hero: 'Haranath', heroine: 'Jamuna', genre: 'Drama, Family' },
  { year: 1968, title: 'Raja Yogam', director: 'B. Vittalacharya', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1968, title: 'Rana Bheri', director: 'Giduthoori Suryam', hero: 'Ramakrishna', heroine: 'Geetanjali, Vijaya Nirmala', genre: 'Folklore, Action' },
  { year: 1968, title: 'Sati Arundhati', director: 'K.V. Nandan Rao', hero: 'Kanta Rao', heroine: 'Jamuna, Anjali Devi', genre: 'Mythological' },
  { year: 1968, title: 'Sudigundaalu', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Vijaya Nirmala', genre: 'Drama', status: 'DUPLICATE' },
  { year: 1968, title: 'Sudigundalu', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Jaggayya', genre: 'Legal, Drama' },
  { year: 1968, title: 'Thalli Prema', director: 'Srikanth', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1968, title: 'Tikka Sankaraiah', director: 'D. Yoganand', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari, Jayalalithaa', genre: 'Comedy' },
  { year: 1968, title: 'Uma Chandi Gowri Shankarula Katha', director: 'K.V. Reddy', hero: 'N.T. Rama Rao', heroine: 'B. Saroja Devi', genre: 'Mythological' },
  { year: 1968, title: 'Undamma Bottu Pedata', director: 'K. Viswanath', hero: 'Krishna', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1968, title: 'Veeranjaneya', director: 'Kamalakara Kameswara Rao', hero: 'Kanta Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1968, title: 'Vintha Kapuram', director: 'K. Sanjeevi', hero: 'Haranath', heroine: 'Jamuna', genre: 'Drama' },
];

// 1967 Movies - Audited Data
const FIXES_1967: MovieFix[] = [
  { year: 1967, title: 'Aada Paduchu', director: 'K. Hemambaradhara Rao', hero: 'N.T. Rama Rao, Sobhan Babu', heroine: 'Chandrakala, Krishna Kumari', genre: 'Drama, Family' },
  { year: 1967, title: 'Bhaktha Prahlada', director: 'Chitrapu Narayana Rao', hero: 'S.V. Ranga Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1967, title: 'Bhuvana Sundari Katha', director: 'C. Pullaiah', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Folklore, Fantasy' },
  { year: 1967, title: 'Chadarangam', director: 'S.V. Ranga Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1967, title: 'Devuni Gelichina Manavudu', director: 'Hunsur Krishnamurthy', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Folklore' },
  { year: 1967, title: 'Dwapayana Kaivalyam', director: 'G.K. Brahmanandam', hero: 'Tadepalli Lakshmi Kanta Rao', heroine: 'Rajasree', genre: 'Mythological' },
  { year: 1967, title: 'Gopaludu Bhoopaludu', director: 'G. Viswanatham', hero: 'N.T. Rama Rao', heroine: 'Jayalalithaa', genre: 'Folklore, Adventure' },
  { year: 1967, title: 'Gruhalakshmi', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'Bhanumathi Ramakrishna', genre: 'Drama' },
  { year: 1967, title: 'Iddaru Monagallu', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Action, Crime' },
  { year: 1967, title: 'Kambojaraju Katha', director: 'Kamalakara Kameswara Rao', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1967, title: 'Kanchu Kota', director: 'C.S. Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari, Savitri', genre: 'Folklore, Action' },
  { year: 1967, title: 'Konte Pilla', director: 'A. Sanjeevi', hero: 'Haranath', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1967, title: 'Maa Vadina', director: 'K. Pratyagatma', hero: 'Gummadi, Haranath', heroine: 'Savitri, Krishna Kumari', genre: 'Drama, Family' },
  { year: 1967, title: 'Marapurani Katha', director: 'V. Madhusudhana Rao', hero: 'Krishna', heroine: 'Kanchana, Vanisri', genre: 'Romance, Drama' },
  { year: 1967, title: 'Nindu Manasulu', director: 'S.D. Lal', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Drama, Action' },
  { year: 1967, title: 'Nirdoshi', director: 'V. Madhusudhana Rao', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Action, Drama' },
  { year: 1967, title: 'Pedda Akkayya', director: 'B.A. Subba Rao', hero: 'Haranath', heroine: 'Krishna Kumari', genre: 'Drama, Family' },
  { year: 1967, title: 'Prana Mithrulu', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri, Kanchana', genre: 'Drama' },
  { year: 1967, title: 'Rahasyam', director: 'Vedantam Raghavayya', hero: 'Akkineni Nageswara Rao', heroine: 'B. Saroja Devi', genre: 'Folklore, Musical' },
  { year: 1967, title: 'Sati Sumathi', director: 'Vedantam Raghavayya', hero: 'Kanta Rao', heroine: 'Anjali Devi, Jamuna', genre: 'Mythological, Devotional' },
  { year: 1967, title: 'Sri Sri Sri Maryada Ramanna', director: 'K. Hemambaradhara Rao', hero: 'Padmanabham', heroine: 'Rajasree, Gitanjali', genre: 'Folklore, Comedy' },
  { year: 1967, title: 'Sudigundalu', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Vijaya Nirmala', genre: 'Legal, Drama' },
  { year: 1967, title: 'Ummadi Kutumbam', director: 'D. Yoganand', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari, Savitri', genre: 'Drama, Family' },
  { year: 1967, title: 'Upayamlo Apayam', director: 'T. Krishna', hero: 'Krishna', heroine: 'Vijaya Nirmala', genre: 'Action, Thriller' },
  { year: 1967, title: 'Vasantha Sena', director: 'B.S. Ranga', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari, Padmini', genre: 'Historical' },
  { year: 1967, title: 'Veera Pooja', director: 'A. Sanjeevi', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
];

async function applyFixes() {
  console.log('=== APPLYING 1967-1969 MOVIE FIXES ===\n');
  
  const allFixes = [...FIXES_1969, ...FIXES_1968, ...FIXES_1967];
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
