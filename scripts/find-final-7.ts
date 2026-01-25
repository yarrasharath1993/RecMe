import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Complete Wikipedia list (153 films)
const WIKI_ALL = [
  // 1978
  { title: 'Pranam Khareedu', year: 1978 },
  { title: 'Mana Voori Pandavulu', year: 1978 },
  // 1979
  { title: 'Tayaramma Bangarayya', year: 1979 },
  { title: 'Kukka Katuku Cheppu Debba', year: 1979 },
  { title: 'Kotta Alludu', year: 1979 },
  { title: 'I Love You', year: 1979 },
  { title: 'Punadhirallu', year: 1979 },
  { title: 'Idi Katha Kaadu', year: 1979 },
  { title: 'Sri Rama Bantu', year: 1979 },
  { title: 'Kothala Raayudu', year: 1979 },
  // 1980
  { title: 'Agni Samskaram', year: 1980 },
  { title: 'Kottapeta Rowdy', year: 1980 },
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
  { title: 'Aadavaallu Meeku Joharlu', year: 1981 },
  { title: 'Parvathi Parameswarulu', year: 1981 },
  { title: 'Todu Dongalu', year: 1981 },
  { title: 'Tirugu Leni Manishi', year: 1981 },
  { title: 'Prema Natakam', year: 1981 },
  { title: 'Nyayam Kavali', year: 1981 },
  { title: 'Oorukichina Maata', year: 1981 },
  { title: 'Rani Kasula Rangamma', year: 1981 },
  { title: '47 Rojulu', year: 1981 },
  { title: 'Srirasthu Subhamasthu', year: 1981 },
  { title: 'Priya', year: 1981 },
  { title: 'Chattaniki Kallu Levu', year: 1981 },
  { title: 'Kirayi Rowdylu', year: 1981 },
  { title: 'Ranuva Veeran', year: 1981 },
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
  { title: 'Maa Inti Premayanam', year: 1983 },
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
  // 1996
  { title: 'Sipayi', year: 1996 },
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
  { title: 'Hands Up', year: 2000 },
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
  { title: 'Andarivadu', year: 2005 },
  { title: 'Jai Chiranjeeva', year: 2005 },
  // 2006
  { title: 'Stalin', year: 2006 },
  { title: 'Style', year: 2006 },
  // 2007
  { title: 'Shankar Dada Zindabad', year: 2007 },
  // 2009
  { title: 'Magadheera', year: 2009 },
  // 2013
  { title: 'Jagadguru Adi Shankara', year: 2013 },
  // 2015
  { title: 'Bruce Lee: The Fighter', year: 2015 },
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

function normalize(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

async function findMissing() {
  console.log('\n=== FINDING FINAL 7 MISSING FILMS ===\n');
  console.log('Wikipedia total: ' + WIKI_ALL.length);
  
  // Get all DB films with Chiranjeevi
  const { data: heroFilms } = await supabase
    .from('movies')
    .select('title_en, release_year')
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  const { data: allMovies } = await supabase
    .from('movies')
    .select('title_en, release_year, supporting_cast')
    .not('supporting_cast', 'is', null);
  
  // Build set of films with Chiranjeevi
  const dbFilmsNorm = new Set<string>();
  const dbFilmsList: string[] = [];
  
  heroFilms?.forEach(f => {
    dbFilmsNorm.add(normalize(f.title_en));
    dbFilmsList.push(f.title_en);
  });
  
  allMovies?.forEach(f => {
    const cast = f.supporting_cast || [];
    if (cast.some((c: any) => c.name?.includes('Chiranjeevi'))) {
      dbFilmsNorm.add(normalize(f.title_en));
      if (!dbFilmsList.includes(f.title_en)) {
        dbFilmsList.push(f.title_en);
      }
    }
  });
  
  console.log('DB films with Chiranjeevi: ' + dbFilmsNorm.size);
  
  // Find missing
  const missing: typeof WIKI_ALL = [];
  
  for (const film of WIKI_ALL) {
    const norm = normalize(film.title);
    if (!dbFilmsNorm.has(norm)) {
      // Check alternate spellings
      const found = dbFilmsList.some(dbTitle => {
        const dbNorm = normalize(dbTitle);
        // Check if similar (allowing small differences)
        return dbNorm.includes(norm.substring(0, 6)) || norm.includes(dbNorm.substring(0, 6));
      });
      
      if (!found) {
        missing.push(film);
      }
    }
  }
  
  console.log('\n=== ' + missing.length + ' MISSING FILMS ===\n');
  
  missing.forEach((f, i) => {
    console.log((i + 1) + '. ' + f.title + ' (' + f.year + ')');
  });
  
  // Check if they exist in DB at all (with different hero)
  console.log('\n=== CHECKING IF THEY EXIST IN DB ===\n');
  
  for (const film of missing) {
    const { data } = await supabase
      .from('movies')
      .select('title_en, release_year, hero')
      .ilike('title_en', '%' + film.title.split(' ')[0] + '%')
      .gte('release_year', film.year - 1)
      .lte('release_year', film.year + 1)
      .limit(1);
    
    if (data && data.length > 0) {
      console.log(film.title + ' (' + film.year + '):');
      console.log('  Found: ' + data[0].title_en + ' (' + data[0].release_year + ') - hero: ' + data[0].hero);
    } else {
      console.log(film.title + ' (' + film.year + '): NOT IN DATABASE');
    }
  }
}

findMissing();
