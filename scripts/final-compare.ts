import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Wikipedia Telugu lead roles (143 films)
const WIKI_LEADS = [
  { title: 'Pranam Khareedu', year: 1978 },
  { title: 'Kukka Katuku Cheppu Debba', year: 1979 },
  { title: 'Kotta Alludu', year: 1979 },
  { title: 'I Love You', year: 1979 },
  { title: 'Punadhirallu', year: 1979 },
  { title: 'Sri Rama Bantu', year: 1979 },
  { title: 'Kothala Raayudu', year: 1979 },
  { title: 'Agni Samskaram', year: 1980 },
  { title: 'Chandipriya', year: 1980 },
  { title: 'Aarani Mantalu', year: 1980 },
  { title: 'Jathara', year: 1980 },
  { title: 'Mosagadu', year: 1980 },
  { title: 'Punnami Naagu', year: 1980 },
  { title: 'Nakili Manishi', year: 1980 },
  { title: 'Kaali', year: 1980 },
  { title: 'Thathayya Premaleelalu', year: 1980 },
  { title: 'Love In Singapore', year: 1980 },
  { title: 'Prema Tarangalu', year: 1980 },
  { title: 'Mogudu Kaavali', year: 1980 },
  { title: 'Rakta Bandham', year: 1980 },
  { title: 'Parvathi Parameswarulu', year: 1981 },
  { title: 'Todu Dongalu', year: 1981 },
  { title: 'Tirugu Leni Manishi', year: 1981 },
  { title: 'Nyayam Kavali', year: 1981 },
  { title: 'Oorukichina Maata', year: 1981 },
  { title: 'Rani Kasula Rangamma', year: 1981 },
  { title: '47 Rojulu', year: 1981 },
  { title: 'Srirasthu Subhamasthu', year: 1981 },
  { title: 'Priya', year: 1981 },
  { title: 'Chattaniki Kallu Levu', year: 1981 },
  { title: 'Kirayi Rowdylu', year: 1981 },
  { title: 'Intlo Ramayya Veedhilo Krishnayya', year: 1982 },
  { title: 'Subhalekha', year: 1982 },
  { title: 'Idi Pellantara', year: 1982 },
  { title: 'Sitadevi', year: 1982 },
  { title: 'Radha My Darling', year: 1982 },
  { title: 'Tingu Rangadu', year: 1982 },
  { title: 'Patnam Vachina Pativrathalu', year: 1982 },
  { title: 'Billa Ranga', year: 1982 },
  { title: 'Yamakinkarudu', year: 1982 },
  { title: 'Mondi Ghatam', year: 1982 },
  { title: 'Manchu Pallaki', year: 1982 },
  { title: 'Bandhalu Anubandhalu', year: 1982 },
  { title: 'Prema Pichollu', year: 1983 },
  { title: 'Palletoori Monagadu', year: 1983 },
  { title: 'Abhilasha', year: 1983 },
  { title: 'Aalaya Sikharam', year: 1983 },
  { title: 'Sivudu Sivudu Sivudu', year: 1983 },
  { title: 'Puli Bebbuli', year: 1983 },
  { title: 'Gudachari No.1', year: 1983 },
  { title: 'Maga Maharaju', year: 1983 },
  { title: 'Roshagadu', year: 1983 },
  { title: 'Simhapuri Simham', year: 1983 },
  { title: 'Khaidi', year: 1983 },
  { title: 'Mantri Gari Viyyankudu', year: 1983 },
  { title: 'Sangharshana', year: 1983 },
  { title: 'Allullostunnaru', year: 1984 },
  { title: 'Goonda', year: 1984 },
  { title: 'Hero', year: 1984 },
  { title: 'Devanthakudu', year: 1984 },
  { title: 'Mahanagaramlo Mayagadu', year: 1984 },
  { title: 'Challenge', year: 1984 },
  { title: 'Intiguttu', year: 1984 },
  { title: 'Naagu', year: 1984 },
  { title: 'Agni Gundam', year: 1984 },
  { title: 'Rustum', year: 1984 },
  { title: 'Chattamtho Poratam', year: 1985 },
  { title: 'Donga', year: 1985 },
  { title: 'Chiranjeevi', year: 1985 },
  { title: 'Jwaala', year: 1985 },
  { title: 'Puli', year: 1985 },
  { title: 'Rakta Sindhuram', year: 1985 },
  { title: 'Adavi Donga', year: 1985 },
  { title: 'Vijetha', year: 1985 },
  { title: 'Kirathakudu', year: 1986 },
  { title: 'Kondaveeti Raja', year: 1986 },
  { title: 'Magadheerudu', year: 1986 },
  { title: 'Veta', year: 1986 },
  { title: 'Chantabbai', year: 1986 },
  { title: 'Rakshasudu', year: 1986 },
  { title: 'Dhairyavanthudu', year: 1986 },
  { title: 'Chanakya Sapatham', year: 1986 },
  { title: 'Donga Mogudu', year: 1987 },
  { title: 'Aradhana', year: 1987 },
  { title: 'Chakravarthy', year: 1987 },
  { title: 'Pasivadi Pranam', year: 1987 },
  { title: 'Swayamkrushi', year: 1987 },
  { title: 'Jebu Donga', year: 1987 },
  { title: 'Manchi Donga', year: 1988 },
  { title: 'Rudraveena', year: 1988 },
  { title: 'Yamudiki Mogudu', year: 1988 },
  { title: 'Khaidi No. 786', year: 1988 },
  { title: 'Marana Mrudangam', year: 1988 },
  { title: 'Trinetrudu', year: 1988 },
  { title: 'Yuddha Bhoomi', year: 1988 },
  { title: 'Attaku Yamudu Ammayiki Mogudu', year: 1989 },
  { title: 'State Rowdy', year: 1989 },
  { title: 'Rudranetra', year: 1989 },
  { title: 'Lankeswarudu', year: 1989 },
  { title: 'Kondaveeti Donga', year: 1990 },
  { title: 'Jagadeka Veerudu Athiloka Sundari', year: 1990 },
  { title: 'Kodama Simham', year: 1990 },
  { title: 'Raja Vikramarka', year: 1990 },
  { title: 'Stuartpuram Police Station', year: 1991 },
  { title: 'Gang Leader', year: 1991 },
  { title: 'Rowdy Alludu', year: 1991 },
  { title: 'Gharana Mogudu', year: 1992 },
  { title: 'Aapadbandhavudu', year: 1992 },
  { title: 'Muta Mestri', year: 1993 },
  { title: 'Mechanic Alludu', year: 1993 },
  { title: 'Mugguru Monagallu', year: 1994 },
  { title: 'S. P. Parasuram', year: 1994 },
  { title: 'Alluda Majaka', year: 1995 },
  { title: 'Big Boss', year: 1995 },
  { title: 'Rikshavodu', year: 1995 },
  { title: 'Hitler', year: 1997 },
  { title: 'Master', year: 1997 },
  { title: 'Bavagaru Bagunnara?', year: 1998 },
  { title: 'Choodalani Vundi', year: 1998 },
  { title: 'Sneham Kosam', year: 1999 },
  { title: 'Iddaru Mitrulu', year: 1999 },
  { title: 'Annayya', year: 2000 },
  { title: 'Mrugaraju', year: 2001 },
  { title: 'Sri Manjunatha', year: 2001 },
  { title: 'Daddy', year: 2001 },
  { title: 'Indra', year: 2002 },
  { title: 'Tagore', year: 2003 },
  { title: 'Anji', year: 2004 },
  { title: 'Shankar Dada M.B.B.S.', year: 2004 },
  { title: 'Andarivadu', year: 2005 },
  { title: 'Jai Chiranjeeva', year: 2005 },
  { title: 'Stalin', year: 2006 },
  { title: 'Shankar Dada Zindabad', year: 2007 },
  { title: 'Khaidi No. 150', year: 2017 },
  { title: 'Sye Raa Narasimha Reddy', year: 2019 },
  { title: 'Acharya', year: 2022 },
  { title: 'Godfather', year: 2022 },
  { title: 'Waltair Veerayya', year: 2023 },
  { title: 'Bhola Shankar', year: 2023 },
  { title: 'Mana Shankara Vara Prasad Garu', year: 2026 },
  { title: 'Vishwambhara', year: 2026 },
];

function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

async function compare() {
  console.log('\n=== FINAL WIKIPEDIA vs DATABASE COMPARISON ===\n');
  
  const { data: dbFilms } = await supabase
    .from('movies')
    .select('title_en, release_year')
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%')
    .order('release_year');
  
  const dbNormalized = new Map<string, any>();
  dbFilms?.forEach(f => {
    dbNormalized.set(normalizeTitle(f.title_en), f);
  });
  
  // Find missing from DB
  const missing: any[] = [];
  for (const film of WIKI_LEADS) {
    const norm = normalizeTitle(film.title);
    if (!dbNormalized.has(norm)) {
      missing.push(film);
    }
  }
  
  // Find extra in DB
  const wikiNormalized = new Set(WIKI_LEADS.map(f => normalizeTitle(f.title)));
  const extra: any[] = [];
  for (const film of dbFilms || []) {
    if (!wikiNormalized.has(normalizeTitle(film.title_en))) {
      extra.push(film);
    }
  }
  
  console.log(`Database count: ${dbFilms?.length}`);
  console.log(`Wikipedia leads: ${WIKI_LEADS.length}`);
  
  console.log(`\n--- MISSING FROM DATABASE (${missing.length}) ---`);
  missing.forEach(f => console.log(`  - ${f.title} (${f.year})`));
  
  console.log(`\n--- EXTRA IN DATABASE (${extra.length}) ---`);
  extra.forEach(f => console.log(`  - ${f.title_en} (${f.release_year})`));
  
  console.log('\n=== SUMMARY ===');
  console.log(`To reach Wikipedia count: Add ${missing.length}, verify ${extra.length}`);
}

compare();
