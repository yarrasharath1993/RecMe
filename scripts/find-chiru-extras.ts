import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Wikipedia's complete lead roles list (143 films)
const WIKI_LEADS = new Set([
  'Pranam Khareedu', 'Kukka Katuku Cheppu Debba', 'Kotta Alludu', 'I Love You',
  'Punadhirallu', 'Sri Rama Bantu', 'Kothala Raayudu', 'Agni Samskaram',
  'Chandipriya', 'Aarani Mantalu', 'Jathara', 'Mosagadu', 'Punnami Naagu',
  'Nakili Manishi', 'Kaali', 'Thathayya Premaleelalu', 'Love In Singapore',
  'Prema Tarangalu', 'Mogudu Kaavali', 'Rakta Bandham', 'Parvathi Parameswarulu',
  'Todu Dongalu', 'Tirugu Leni Manishi', 'Nyayam Kavali', 'Oorukichina Maata',
  'Rani Kasula Rangamma', '47 Rojulu', 'Srirasthu Subhamasthu', 'Priya',
  'Chattaniki Kallu Levu', 'Kirayi Rowdylu', 'Intlo Ramayya Veedhilo Krishnayya',
  'Subhalekha', 'Idi Pellantara', 'Sitadevi', 'Radha My Darling', 'Tingu Rangadu',
  'Patnam Vachina Pativrathalu', 'Billa Ranga', 'Yamakinkarudu', 'Mondi Ghatam',
  'Manchu Pallaki', 'Bandhalu Anubandhalu', 'Prema Pichollu', 'Palletoori Monagadu',
  'Abhilasha', 'Aalaya Sikharam', 'Sivudu Sivudu Sivudu', 'Puli Bebbuli',
  'Gudachari No.1', 'Maga Maharaju', 'Roshagadu', 'Simhapuri Simham', 'Khaidi',
  'Mantri Gari Viyyankudu', 'Sangharshana', 'Allullostunnaru', 'Goonda', 'Hero',
  'Devanthakudu', 'Mahanagaramlo Mayagadu', 'Challenge', 'Intiguttu', 'Naagu',
  'Agni Gundam', 'Rustum', 'Chattamtho Poratam', 'Donga', 'Chiranjeevi', 'Jwaala',
  'Puli', 'Rakta Sindhuram', 'Adavi Donga', 'Vijetha', 'Kirathakudu',
  'Kondaveeti Raja', 'Magadheerudu', 'Veta', 'Chantabbai', 'Rakshasudu',
  'Dhairyavanthudu', 'Chanakya Sapatham', 'Donga Mogudu', 'Aradhana', 'Chakravarthy',
  'Pasivadi Pranam', 'Swayamkrushi', 'Jebu Donga', 'Manchi Donga', 'Rudraveena',
  'Yamudiki Mogudu', 'Khaidi No. 786', 'Marana Mrudangam', 'Trinetrudu',
  'Yuddha Bhoomi', 'Attaku Yamudu Ammayiki Mogudu', 'State Rowdy', 'Rudranetra',
  'Lankeswarudu', 'Kondaveeti Donga', 'Jagadeka Veerudu Athiloka Sundari',
  'Kodama Simham', 'Raja Vikramarka', 'Stuartpuram Police Station', 'Gang Leader',
  'Rowdy Alludu', 'Gharana Mogudu', 'Aapadbandhavudu', 'Muta Mestri',
  'Mechanic Alludu', 'Mugguru Monagallu', 'S. P. Parasuram', 'Alluda Majaka',
  'Big Boss', 'Rikshavodu', 'Hitler', 'Master', 'Bavagaru Bagunnara?',
  'Choodalani Vundi', 'Sneham Kosam', 'Iddaru Mitrulu', 'Annayya', 'Mrugaraju',
  'Sri Manjunatha', 'Daddy', 'Indra', 'Tagore', 'Anji', 'Shankar Dada M.B.B.S.',
  'Andarivadu', 'Jai Chiranjeeva', 'Stalin', 'Shankar Dada Zindabad',
  'Khaidi No. 150', 'Sye Raa Narasimha Reddy', 'Acharya', 'Godfather',
  'Waltair Veerayya', 'Bhola Shankar', 'Mana Shankara Vara Prasad Garu', 'Vishwambhara',
]);

function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

async function findExtras() {
  console.log('\n=== FINDING EXTRA FILMS IN DATABASE ===\n');
  
  const { data: dbFilms } = await supabase
    .from('movies')
    .select('title_en, release_year, hero')
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%')
    .order('release_year');
  
  console.log(`Database films: ${dbFilms?.length}`);
  console.log(`Wikipedia leads: ${WIKI_LEADS.size}`);
  
  // Find films in DB not in Wikipedia leads
  const extras: any[] = [];
  const wikiNormalized = new Set(Array.from(WIKI_LEADS).map(normalizeTitle));
  
  for (const film of dbFilms || []) {
    const norm = normalizeTitle(film.title_en);
    if (!wikiNormalized.has(norm)) {
      extras.push(film);
    }
  }
  
  console.log(`\nExtra films in DB (not in Wikipedia lead list): ${extras.length}`);
  console.log('These might be supporting roles incorrectly marked as lead:\n');
  
  extras.forEach(f => {
    console.log(`  - ${f.title_en} (${f.release_year}) - hero: ${f.hero}`);
  });
}

findExtras();
