import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Wikipedia filmography parsed - Telugu films only (excluding other language dubs)
const WIKI_FILMS = [
  // 1978
  { title: 'Pranam Khareedu', year: 1978 },
  { title: 'Mana Voori Pandavulu', year: 1978 },
  // 1979
  { title: 'Tayaramma Bangarayya', year: 1979, cameo: true },
  { title: 'Kukka Katuku Cheppu Debba', year: 1979 },
  { title: 'Kotta Alludu', year: 1979 },
  { title: 'I Love You', year: 1979 },
  { title: 'Punadhirallu', year: 1979 },
  { title: 'Idi Katha Kaadu', year: 1979 },
  { title: 'Sri Rama Bantu', year: 1979 },
  { title: 'Kothala Raayudu', year: 1979 },
  // 1980
  { title: 'Agni Samskaram', year: 1980 },
  { title: 'Kottapeta Rowdy', year: 1980, cameo: true },
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
  // 1981
  { title: 'Aadavaallu Meeku Joharlu', year: 1981, cameo: true },
  { title: 'Parvathi Parameswarulu', year: 1981 },
  { title: 'Todu Dongalu', year: 1981 },
  { title: 'Tirugu Leni Manishi', year: 1981 },
  { title: 'Prema Natakam', year: 1981, cameo: true },
  { title: 'Nyayam Kavali', year: 1981 },
  { title: 'Oorukichina Maata', year: 1981 },
  { title: 'Rani Kasula Rangamma', year: 1981 },
  { title: '47 Rojulu', year: 1981 },
  { title: 'Srirasthu Subhamasthu', year: 1981 },
  { title: 'Priya', year: 1981 },
  { title: 'Chattaniki Kallu Levu', year: 1981 },
  { title: 'Kirayi Rowdylu', year: 1981 },
  // 1982
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
  // 1983
  { title: 'Prema Pichollu', year: 1983 },
  { title: 'Palletoori Monagadu', year: 1983 },
  { title: 'Abhilasha', year: 1983 },
  { title: 'Aalaya Sikharam', year: 1983 },
  { title: 'Sivudu Sivudu Sivudu', year: 1983 },
  { title: 'Puli Bebbuli', year: 1983 },
  { title: 'Gudachari No.1', year: 1983 },
  { title: 'Maga Maharaju', year: 1983 },
  { title: 'Roshagadu', year: 1983 },
  { title: 'Maa Inti Premayanam', year: 1983, cameo: true },
  { title: 'Simhapuri Simham', year: 1983 },
  { title: 'Khaidi', year: 1983 },
  { title: 'Mantri Gari Viyyankudu', year: 1983 },
  { title: 'Sangharshana', year: 1983 },
  // 1984
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
  // 1985
  { title: 'Chattamtho Poratam', year: 1985 },
  { title: 'Donga', year: 1985 },
  { title: 'Chiranjeevi', year: 1985 },
  { title: 'Jwaala', year: 1985 },
  { title: 'Puli', year: 1985 },
  { title: 'Rakta Sindhuram', year: 1985 },
  { title: 'Adavi Donga', year: 1985 },
  { title: 'Vijetha', year: 1985 },
  // 1986
  { title: 'Kirathakudu', year: 1986 },
  { title: 'Kondaveeti Raja', year: 1986 },
  { title: 'Magadheerudu', year: 1986 },
  { title: 'Veta', year: 1986 },
  { title: 'Chantabbai', year: 1986 },
  { title: 'Rakshasudu', year: 1986 },
  { title: 'Dhairyavanthudu', year: 1986 },
  { title: 'Chanakya Sapatham', year: 1986 },
  // 1987
  { title: 'Donga Mogudu', year: 1987 },
  { title: 'Aradhana', year: 1987 },
  { title: 'Chakravarthy', year: 1987 },
  { title: 'Pasivadi Pranam', year: 1987 },
  { title: 'Swayamkrushi', year: 1987 },
  { title: 'Jebu Donga', year: 1987 },
  // 1988
  { title: 'Manchi Donga', year: 1988 },
  { title: 'Rudraveena', year: 1988 },
  { title: 'Yamudiki Mogudu', year: 1988 },
  { title: 'Khaidi No. 786', year: 1988 },
  { title: 'Marana Mrudangam', year: 1988 },
  { title: 'Trinetrudu', year: 1988 },
  { title: 'Yuddha Bhoomi', year: 1988 },
  // 1989
  { title: 'Attaku Yamudu Ammayiki Mogudu', year: 1989 },
  { title: 'State Rowdy', year: 1989 },
  { title: 'Rudranetra', year: 1989 },
  { title: 'Lankeswarudu', year: 1989 },
  // 1990
  { title: 'Kondaveeti Donga', year: 1990 },
  { title: 'Jagadeka Veerudu Athiloka Sundari', year: 1990 },
  { title: 'Kodama Simham', year: 1990 },
  { title: 'Raja Vikramarka', year: 1990 },
  // 1991
  { title: 'Stuartpuram Police Station', year: 1991 },
  { title: 'Gang Leader', year: 1991 },
  { title: 'Rowdy Alludu', year: 1991 },
  // 1992
  { title: 'Gharana Mogudu', year: 1992 },
  { title: 'Aapadbandhavudu', year: 1992 },
  // 1993
  { title: 'Muta Mestri', year: 1993 },
  { title: 'Mechanic Alludu', year: 1993 },
  // 1994
  { title: 'Mugguru Monagallu', year: 1994 },
  { title: 'S. P. Parasuram', year: 1994 },
  // 1995
  { title: 'Alluda Majaka', year: 1995 },
  { title: 'Big Boss', year: 1995 },
  { title: 'Rikshavodu', year: 1995 },
  // 1997
  { title: 'Hitler', year: 1997 },
  { title: 'Master', year: 1997 },
  // 1998
  { title: 'Bavagaru Bagunnara?', year: 1998 },
  { title: 'Choodalani Vundi', year: 1998 },
  // 1999
  { title: 'Sneham Kosam', year: 1999 },
  { title: 'Iddaru Mitrulu', year: 1999 },
  // 2000
  { title: 'Annayya', year: 2000 },
  { title: 'Hands Up', year: 2000, cameo: true },
  // 2001
  { title: 'Mrugaraju', year: 2001 },
  { title: 'Sri Manjunatha', year: 2001 },
  { title: 'Daddy', year: 2001 },
  // 2002
  { title: 'Indra', year: 2002 },
  // 2003
  { title: 'Tagore', year: 2003 },
  // 2004
  { title: 'Anji', year: 2004 },
  { title: 'Shankar Dada M.B.B.S.', year: 2004 },
  // 2005
  { title: 'Andarivaadu', year: 2005 },
  { title: 'Jai Chiranjeeva', year: 2005 },
  // 2006
  { title: 'Stalin', year: 2006 },
  { title: 'Style', year: 2006, cameo: true },
  // 2007
  { title: 'Shankar Dada Zindabad', year: 2007 },
  // 2009
  { title: 'Magadheera', year: 2009, cameo: true },
  // 2013
  { title: 'Jagadguru Adi Shankara', year: 2013, cameo: true },
  // 2015
  { title: 'Bruce Lee: The Fighter', year: 2015, cameo: true },
  // 2017
  { title: 'Khaidi No. 150', year: 2017 },
  // 2019
  { title: 'Sye Raa Narasimha Reddy', year: 2019 },
  // 2022
  { title: 'Acharya', year: 2022 },
  { title: 'Godfather', year: 2022 },
  // 2023
  { title: 'Waltair Veerayya', year: 2023 },
  { title: 'Bhola Shankar', year: 2023 },
  // 2026
  { title: 'Mana Shankara Vara Prasad Garu', year: 2026 },
  { title: 'Vishwambhara', year: 2026 },
];

// Other language films (not Telugu originals)
const OTHER_LANG = [
  { title: '47 Natkal', year: 1981, lang: 'Tamil' },
  { title: 'Ranuva Veeran', year: 1981, lang: 'Tamil' },
  { title: 'Mappillai', year: 1989, lang: 'Tamil', cameo: true },
  { title: 'Pratibandh', year: 1990, lang: 'Hindi' },
  { title: 'Aaj Ka Goonda Raaj', year: 1992, lang: 'Hindi' },
  { title: 'The Gentleman', year: 1994, lang: 'Hindi' },
  { title: 'Sipayi', year: 1996, lang: 'Kannada' },
];

function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

async function compare() {
  console.log('\n=== CHIRANJEEVI FILMOGRAPHY COMPARISON ===\n');
  console.log(`Wikipedia Telugu films: ${WIKI_FILMS.length}`);
  console.log(`Wikipedia cameos/special appearances: ${WIKI_FILMS.filter(f => f.cameo).length}`);
  console.log(`Wikipedia lead roles: ${WIKI_FILMS.filter(f => !f.cameo).length}`);
  console.log(`Other language films: ${OTHER_LANG.length}`);
  
  // Get DB films
  const { data: dbMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug')
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%')
    .order('release_year');
  
  console.log(`\nDatabase films: ${dbMovies?.length || 0}`);
  
  // Create normalized maps
  const wikiMap = new Map<string, typeof WIKI_FILMS[0]>();
  WIKI_FILMS.forEach(f => {
    const key = `${normalizeTitle(f.title)}-${f.year}`;
    wikiMap.set(key, f);
  });
  
  const dbMap = new Map<string, { id: any; title_en: any; release_year: any; slug: any }>();
  dbMovies?.forEach((m: any) => {
    const key = `${normalizeTitle(m.title_en)}-${m.release_year}`;
    dbMap.set(key, m);
  });
  
  // Find missing from DB
  const missingFromDb: typeof WIKI_FILMS = [];
  for (const film of WIKI_FILMS) {
    const key = `${normalizeTitle(film.title)}-${film.year}`;
    if (!dbMap.has(key)) {
      // Try alternate year (±1)
      const altKey1 = `${normalizeTitle(film.title)}-${film.year - 1}`;
      const altKey2 = `${normalizeTitle(film.title)}-${film.year + 1}`;
      if (!dbMap.has(altKey1) && !dbMap.has(altKey2)) {
        missingFromDb.push(film);
      }
    }
  }
  
  // Find extra in DB
  const extraInDb: typeof dbMovies = [];
  for (const movie of dbMovies || []) {
    const key = `${normalizeTitle(movie.title_en)}-${movie.release_year}`;
    if (!wikiMap.has(key)) {
      // Try alternate year
      const altKey1 = `${normalizeTitle(movie.title_en)}-${movie.release_year - 1}`;
      const altKey2 = `${normalizeTitle(movie.title_en)}-${movie.release_year + 1}`;
      if (!wikiMap.has(altKey1) && !wikiMap.has(altKey2)) {
        // Check if it's an other language film
        const isOtherLang = OTHER_LANG.some(o => 
          normalizeTitle(o.title) === normalizeTitle(movie.title_en) &&
          Math.abs(o.year - movie.release_year) <= 1
        );
        if (!isOtherLang) {
          extraInDb.push(movie);
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('MISSING FROM DATABASE (in Wikipedia, not in DB)');
  console.log('='.repeat(60));
  if (missingFromDb.length === 0) {
    console.log('None! All Wikipedia films are in the database.');
  } else {
    missingFromDb.forEach(f => {
      const note = f.cameo ? ' (cameo)' : '';
      console.log(`  - ${f.title} (${f.year})${note}`);
    });
    console.log(`\nTotal missing: ${missingFromDb.length}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('EXTRA IN DATABASE (in DB, not in Wikipedia)');
  console.log('='.repeat(60));
  if (extraInDb.length === 0) {
    console.log('None! All DB films are in Wikipedia.');
  } else {
    extraInDb.forEach(m => {
      console.log(`  - ${m.title_en} (${m.release_year}) [${m.slug}]`);
    });
    console.log(`\nTotal extra: ${extraInDb.length}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Wikipedia Telugu films (lead + cameos): ${WIKI_FILMS.length}`);
  console.log(`Database films: ${dbMovies?.length || 0}`);
  console.log(`Missing from DB: ${missingFromDb.length}`);
  console.log(`Extra in DB: ${extraInDb.length}`);
  
  const effectiveWiki = WIKI_FILMS.length;
  const effectiveDb = (dbMovies?.length || 0) - extraInDb.length + missingFromDb.length;
  console.log(`\nAfter corrections, DB would have: ${effectiveDb} films`);
}

compare();
