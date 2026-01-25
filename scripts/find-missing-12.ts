import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Complete Wikipedia list: 143 leads + 10 cameos = 153
const WIKI_ALL = [
  // 1978
  { title: 'Pranam Khareedu', year: 1978, type: 'lead' },
  { title: 'Mana Voori Pandavulu', year: 1978, type: 'lead' },
  // 1979
  { title: 'Tayaramma Bangarayya', year: 1979, type: 'cameo' },
  { title: 'Kukka Katuku Cheppu Debba', year: 1979, type: 'lead' },
  { title: 'Kotta Alludu', year: 1979, type: 'lead' },
  { title: 'I Love You', year: 1979, type: 'lead' },
  { title: 'Punadhirallu', year: 1979, type: 'lead' },
  { title: 'Idi Katha Kaadu', year: 1979, type: 'lead' },
  { title: 'Sri Rama Bantu', year: 1979, type: 'lead' },
  { title: 'Kothala Raayudu', year: 1979, type: 'lead' },
  // 1980
  { title: 'Agni Samskaram', year: 1980, type: 'lead' },
  { title: 'Kottapeta Rowdy', year: 1980, type: 'cameo' },
  { title: 'Chandipriya', year: 1980, type: 'lead' },
  { title: 'Aarani Mantalu', year: 1980, type: 'lead' },
  { title: 'Jathara', year: 1980, type: 'lead' },
  { title: 'Mosagadu', year: 1980, type: 'lead' },
  { title: 'Punnami Naagu', year: 1980, type: 'lead' },
  { title: 'Nakili Manishi', year: 1980, type: 'lead' },
  { title: 'Kaali', year: 1980, type: 'lead' },
  { title: 'Thathayya Premaleelalu', year: 1980, type: 'lead' },
  { title: 'Love In Singapore', year: 1980, type: 'lead' },
  { title: 'Prema Tarangalu', year: 1980, type: 'lead' },
  { title: 'Mogudu Kaavali', year: 1980, type: 'lead' },
  { title: 'Rakta Bandham', year: 1980, type: 'lead' },
  // 1981
  { title: 'Aadavaallu Meeku Joharlu', year: 1981, type: 'cameo' },
  { title: 'Parvathi Parameswarulu', year: 1981, type: 'lead' },
  { title: 'Todu Dongalu', year: 1981, type: 'lead' },
  { title: 'Tirugu Leni Manishi', year: 1981, type: 'lead' },
  { title: 'Prema Natakam', year: 1981, type: 'cameo' },
  { title: 'Nyayam Kavali', year: 1981, type: 'lead' },
  { title: 'Oorukichina Maata', year: 1981, type: 'lead' },
  { title: 'Rani Kasula Rangamma', year: 1981, type: 'lead' },
  { title: '47 Rojulu', year: 1981, type: 'lead' },
  { title: 'Srirasthu Subhamasthu', year: 1981, type: 'lead' },
  { title: 'Priya', year: 1981, type: 'lead' },
  { title: 'Chattaniki Kallu Levu', year: 1981, type: 'lead' },
  { title: 'Kirayi Rowdylu', year: 1981, type: 'lead' },
  // 1982
  { title: 'Intlo Ramayya Veedhilo Krishnayya', year: 1982, type: 'lead' },
  { title: 'Subhalekha', year: 1982, type: 'lead' },
  { title: 'Idi Pellantara', year: 1982, type: 'lead' },
  { title: 'Sitadevi', year: 1982, type: 'lead' },
  { title: 'Radha My Darling', year: 1982, type: 'lead' },
  { title: 'Tingu Rangadu', year: 1982, type: 'lead' },
  { title: 'Patnam Vachina Pativrathalu', year: 1982, type: 'lead' },
  { title: 'Billa Ranga', year: 1982, type: 'lead' },
  { title: 'Yamakinkarudu', year: 1982, type: 'lead' },
  { title: 'Mondi Ghatam', year: 1982, type: 'lead' },
  { title: 'Manchu Pallaki', year: 1982, type: 'lead' },
  { title: 'Bandhalu Anubandhalu', year: 1982, type: 'lead' },
  // 1983
  { title: 'Prema Pichollu', year: 1983, type: 'lead' },
  { title: 'Palletoori Monagadu', year: 1983, type: 'lead' },
  { title: 'Abhilasha', year: 1983, type: 'lead' },
  { title: 'Aalaya Sikharam', year: 1983, type: 'lead' },
  { title: 'Sivudu Sivudu Sivudu', year: 1983, type: 'lead' },
  { title: 'Puli Bebbuli', year: 1983, type: 'lead' },
  { title: 'Gudachari No.1', year: 1983, type: 'lead' },
  { title: 'Maga Maharaju', year: 1983, type: 'lead' },
  { title: 'Roshagadu', year: 1983, type: 'lead' },
  { title: 'Maa Inti Premayanam', year: 1983, type: 'cameo' },
  { title: 'Simhapuri Simham', year: 1983, type: 'lead' },
  { title: 'Khaidi', year: 1983, type: 'lead' },
  { title: 'Mantri Gari Viyyankudu', year: 1983, type: 'lead' },
  { title: 'Sangharshana', year: 1983, type: 'lead' },
  // 1984
  { title: 'Allullostunnaru', year: 1984, type: 'lead' },
  { title: 'Goonda', year: 1984, type: 'lead' },
  { title: 'Hero', year: 1984, type: 'lead' },
  { title: 'Devanthakudu', year: 1984, type: 'lead' },
  { title: 'Mahanagaramlo Mayagadu', year: 1984, type: 'lead' },
  { title: 'Challenge', year: 1984, type: 'lead' },
  { title: 'Intiguttu', year: 1984, type: 'lead' },
  { title: 'Naagu', year: 1984, type: 'lead' },
  { title: 'Agni Gundam', year: 1984, type: 'lead' },
  { title: 'Rustum', year: 1984, type: 'lead' },
  // 1985
  { title: 'Chattamtho Poratam', year: 1985, type: 'lead' },
  { title: 'Donga', year: 1985, type: 'lead' },
  { title: 'Chiranjeevi', year: 1985, type: 'lead' },
  { title: 'Jwaala', year: 1985, type: 'lead' },
  { title: 'Puli', year: 1985, type: 'lead' },
  { title: 'Rakta Sindhuram', year: 1985, type: 'lead' },
  { title: 'Adavi Donga', year: 1985, type: 'lead' },
  { title: 'Vijetha', year: 1985, type: 'lead' },
  // 1986-2026 (continuing...)
  { title: 'Kirathakudu', year: 1986, type: 'lead' },
  { title: 'Kondaveeti Raja', year: 1986, type: 'lead' },
  { title: 'Magadheerudu', year: 1986, type: 'lead' },
  { title: 'Veta', year: 1986, type: 'lead' },
  { title: 'Chantabbai', year: 1986, type: 'lead' },
  { title: 'Rakshasudu', year: 1986, type: 'lead' },
  { title: 'Dhairyavanthudu', year: 1986, type: 'lead' },
  { title: 'Chanakya Sapatham', year: 1986, type: 'lead' },
  { title: 'Donga Mogudu', year: 1987, type: 'lead' },
  { title: 'Aradhana', year: 1987, type: 'lead' },
  { title: 'Chakravarthy', year: 1987, type: 'lead' },
  { title: 'Pasivadi Pranam', year: 1987, type: 'lead' },
  { title: 'Swayamkrushi', year: 1987, type: 'lead' },
  { title: 'Jebu Donga', year: 1987, type: 'lead' },
  { title: 'Manchi Donga', year: 1988, type: 'lead' },
  { title: 'Rudraveena', year: 1988, type: 'lead' },
  { title: 'Yamudiki Mogudu', year: 1988, type: 'lead' },
  { title: 'Khaidi No. 786', year: 1988, type: 'lead' },
  { title: 'Marana Mrudangam', year: 1988, type: 'lead' },
  { title: 'Trinetrudu', year: 1988, type: 'lead' },
  { title: 'Yuddha Bhoomi', year: 1988, type: 'lead' },
  { title: 'Attaku Yamudu Ammayiki Mogudu', year: 1989, type: 'lead' },
  { title: 'State Rowdy', year: 1989, type: 'lead' },
  { title: 'Rudranetra', year: 1989, type: 'lead' },
  { title: 'Lankeswarudu', year: 1989, type: 'lead' },
  { title: 'Kondaveeti Donga', year: 1990, type: 'lead' },
  { title: 'Jagadeka Veerudu Athiloka Sundari', year: 1990, type: 'lead' },
  { title: 'Kodama Simham', year: 1990, type: 'lead' },
  { title: 'Raja Vikramarka', year: 1990, type: 'lead' },
  { title: 'Stuartpuram Police Station', year: 1991, type: 'lead' },
  { title: 'Gang Leader', year: 1991, type: 'lead' },
  { title: 'Rowdy Alludu', year: 1991, type: 'lead' },
  { title: 'Gharana Mogudu', year: 1992, type: 'lead' },
  { title: 'Aapadbandhavudu', year: 1992, type: 'lead' },
  { title: 'Muta Mestri', year: 1993, type: 'lead' },
  { title: 'Mechanic Alludu', year: 1993, type: 'lead' },
  { title: 'Mugguru Monagallu', year: 1994, type: 'lead' },
  { title: 'S. P. Parasuram', year: 1994, type: 'lead' },
  { title: 'Alluda Majaka', year: 1995, type: 'lead' },
  { title: 'Big Boss', year: 1995, type: 'lead' },
  { title: 'Rikshavodu', year: 1995, type: 'lead' },
  { title: 'Hitler', year: 1997, type: 'lead' },
  { title: 'Master', year: 1997, type: 'lead' },
  { title: 'Bavagaru Bagunnara?', year: 1998, type: 'lead' },
  { title: 'Choodalani Vundi', year: 1998, type: 'lead' },
  { title: 'Sneham Kosam', year: 1999, type: 'lead' },
  { title: 'Iddaru Mitrulu', year: 1999, type: 'lead' },
  { title: 'Annayya', year: 2000, type: 'lead' },
  { title: 'Hands Up', year: 2000, type: 'cameo' },
  { title: 'Mrugaraju', year: 2001, type: 'lead' },
  { title: 'Sri Manjunatha', year: 2001, type: 'lead' },
  { title: 'Daddy', year: 2001, type: 'lead' },
  { title: 'Indra', year: 2002, type: 'lead' },
  { title: 'Tagore', year: 2003, type: 'lead' },
  { title: 'Anji', year: 2004, type: 'lead' },
  { title: 'Shankar Dada M.B.B.S.', year: 2004, type: 'lead' },
  { title: 'Andarivadu', year: 2005, type: 'lead' },
  { title: 'Jai Chiranjeeva', year: 2005, type: 'lead' },
  { title: 'Stalin', year: 2006, type: 'lead' },
  { title: 'Style', year: 2006, type: 'cameo' },
  { title: 'Shankar Dada Zindabad', year: 2007, type: 'lead' },
  { title: 'Magadheera', year: 2009, type: 'cameo' },
  { title: 'Jagadguru Adi Shankara', year: 2013, type: 'cameo' },
  { title: 'Bruce Lee: The Fighter', year: 2015, type: 'cameo' },
  { title: 'Khaidi No. 150', year: 2017, type: 'lead' },
  { title: 'Sye Raa Narasimha Reddy', year: 2019, type: 'lead' },
  { title: 'Acharya', year: 2022, type: 'lead' },
  { title: 'Godfather', year: 2022, type: 'lead' },
  { title: 'Waltair Veerayya', year: 2023, type: 'lead' },
  { title: 'Bhola Shankar', year: 2023, type: 'lead' },
  { title: 'Mana Shankara Vara Prasad Garu', year: 2026, type: 'lead' },
  { title: 'Vishwambhara', year: 2026, type: 'lead' },
];

function normalize(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function findMissing() {
  console.log('\n=== FINDING 12 MISSING FILMS ===\n');
  console.log('Wikipedia total: ' + WIKI_ALL.length + ' (143 leads + 10 cameos)');
  
  // Get all DB films with Chiranjeevi (hero or supporting)
  const { data: heroFilms } = await supabase
    .from('movies')
    .select('title_en, release_year')
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  const { data: supportFilms } = await supabase
    .from('movies')
    .select('title_en, release_year, supporting_cast')
    .not('supporting_cast', 'is', null);
  
  // Build set of films with Chiranjeevi
  const dbFilms = new Set<string>();
  
  heroFilms?.forEach(f => {
    dbFilms.add(normalize(f.title_en));
  });
  
  supportFilms?.forEach(f => {
    const cast = f.supporting_cast || [];
    if (cast.some((c: any) => c.name?.includes('Chiranjeevi'))) {
      dbFilms.add(normalize(f.title_en));
    }
  });
  
  console.log('DB films with Chiranjeevi: ' + dbFilms.size);
  
  // Find missing
  const missing: typeof WIKI_ALL = [];
  
  for (const film of WIKI_ALL) {
    const norm = normalize(film.title);
    if (!dbFilms.has(norm)) {
      missing.push(film);
    }
  }
  
  console.log('\n=== ' + missing.length + ' MISSING FILMS FOR MANUAL REVIEW ===\n');
  console.log('| # | Title | Year | Type |');
  console.log('|---|-------|------|------|');
  
  missing.forEach((f, i) => {
    console.log('| ' + (i + 1) + ' | ' + f.title + ' | ' + f.year + ' | ' + f.type + ' |');
  });
  
  // Check if any exist with different names
  console.log('\n=== CHECKING IF THEY EXIST WITH DIFFERENT NAMES ===\n');
  
  for (const film of missing) {
    const { data } = await supabase
      .from('movies')
      .select('title_en, release_year, hero')
      .ilike('title_en', '%' + film.title.split(' ')[0] + '%')
      .gte('release_year', film.year - 1)
      .lte('release_year', film.year + 1)
      .limit(2);
    
    if (data && data.length > 0) {
      console.log(film.title + ' (' + film.year + '):');
      data.forEach(d => {
        console.log('  → ' + d.title_en + ' (' + d.release_year + ') - hero: ' + d.hero);
      });
    }
  }
}

findMissing();
