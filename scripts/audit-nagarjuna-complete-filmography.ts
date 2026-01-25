#!/usr/bin/env npx tsx
/**
 * Complete Filmography Audit for Nagarjuna
 * 
 * Compare database against known 110+ filmography
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Complete filmography from user's reference (110+ movies)
const KNOWN_FILMOGRAPHY = [
  // 1960s - Child Artist
  { year: 1961, title: 'Velugu Needalu', role: 'Child' },
  { year: 1968, title: 'Sudigundalu', role: 'Child' },
  
  // 1980s - Debut as Lead
  { year: 1986, title: 'Vikram', language: 'Telugu' },
  { year: 1986, title: 'Aranyakanda', language: 'Telugu' },
  { year: 1987, title: 'Majnu', language: 'Telugu' },
  { year: 1987, title: 'Sankeertana', language: 'Telugu' },
  { year: 1987, title: 'Collector Gari Abbai', language: 'Telugu' },
  { year: 1987, title: 'Agni Putrudu', language: 'Telugu' },
  { year: 1987, title: 'Kirai Dada', language: 'Telugu' },
  { year: 1988, title: 'Aakhari Poratam', language: 'Telugu' },
  { year: 1988, title: 'Chinababu', language: 'Telugu' },
  { year: 1988, title: 'Murali Krishnudu', language: 'Telugu' },
  { year: 1988, title: 'Janaki Ramudu', language: 'Telugu' },
  { year: 1989, title: 'Vijay', language: 'Telugu' },
  { year: 1989, title: 'Vicky Daada', language: 'Telugu' },
  { year: 1989, title: 'Geetanjali', language: 'Telugu' },
  { year: 1989, title: 'Agni', language: 'Telugu' },
  { year: 1989, title: 'Siva', language: 'Telugu' },
  
  // 1990s
  { year: 1990, title: 'Neti Siddhartha', language: 'Telugu' },
  { year: 1990, title: 'Iddaru Iddare', language: 'Telugu' },
  { year: 1990, title: 'Shiva', language: 'Hindi' },
  { year: 1991, title: 'Nirnayam', language: 'Telugu' },
  { year: 1991, title: 'Chaitanya', language: 'Telugu' },
  { year: 1991, title: 'Shanti Kranti', language: 'Telugu' },
  { year: 1991, title: 'Jaitra Yatra', language: 'Telugu' },
  { year: 1992, title: 'Killer', language: 'Telugu' },
  { year: 1992, title: 'Khuda Gawah', language: 'Hindi' },
  { year: 1992, title: 'Antham', language: 'Telugu' },
  { year: 1992, title: 'Drohi', language: 'Telugu' },
  { year: 1992, title: 'President Gari Pellam', language: 'Telugu' },
  { year: 1993, title: 'Varasudu', language: 'Telugu' },
  { year: 1993, title: 'Allari Alludu', language: 'Telugu' },
  { year: 1994, title: 'Govinda Govinda', language: 'Telugu' },
  { year: 1994, title: 'Hello Brother', language: 'Telugu' },
  { year: 1994, title: 'Criminal', language: 'Telugu' },
  { year: 1995, title: 'Gharana Bullodu', language: 'Telugu' },
  { year: 1995, title: 'Sisindri', language: 'Telugu' },
  { year: 1995, title: 'Vajram', language: 'Telugu' },
  { year: 1996, title: 'Ramudochadu', language: 'Telugu' },
  { year: 1996, title: 'Ninne Pelladata', language: 'Telugu' },
  { year: 1997, title: 'Annamayya', language: 'Telugu' },
  { year: 1997, title: 'Ratchagan', language: 'Tamil' },
  { year: 1998, title: 'Aavida Maa Aavide', language: 'Telugu' },
  { year: 1998, title: 'Auto Driver', language: 'Telugu' },
  { year: 1998, title: 'Angaarey', language: 'Hindi' },
  { year: 1998, title: 'Chandralekha', language: 'Telugu' },
  { year: 1998, title: 'Zakhm', language: 'Hindi' },
  { year: 1999, title: 'Seetharama Raju', language: 'Telugu' },
  { year: 1999, title: 'Ravoyi Chandamama', language: 'Telugu' },
  
  // 2000s
  { year: 2000, title: 'Nuvvu Vasthavani', language: 'Telugu' },
  { year: 2000, title: 'Ninne Premistha', language: 'Telugu' },
  { year: 2000, title: 'Azad', language: 'Telugu' },
  { year: 2001, title: 'Eduruleni Manishi', language: 'Telugu' },
  { year: 2001, title: 'Bava Nachadu', language: 'Telugu' },
  { year: 2001, title: 'Adhipathi', language: 'Telugu' },
  { year: 2001, title: 'Akasa Veedhilo', language: 'Telugu' },
  { year: 2001, title: 'Snehamante Idera', language: 'Telugu' },
  { year: 2002, title: 'Santosham', language: 'Telugu' },
  { year: 2002, title: 'Agni Varsha', language: 'Hindi' },
  { year: 2002, title: 'Manmadhudu', language: 'Telugu' },
  { year: 2003, title: 'Sivamani', language: 'Telugu' },
  { year: 2003, title: 'LOC Kargil', language: 'Hindi' },
  { year: 2004, title: 'Nenunnanu', language: 'Telugu' },
  { year: 2004, title: 'Mass', language: 'Telugu' },
  { year: 2005, title: 'Super', language: 'Telugu' },
  { year: 2006, title: 'Sri Ramadasu', language: 'Telugu' },
  { year: 2006, title: 'Boss', language: 'Telugu' },
  { year: 2007, title: 'Don', language: 'Telugu' },
  { year: 2008, title: 'Krishnarjuna', language: 'Telugu' },
  { year: 2008, title: 'King', language: 'Telugu' },
  
  // 2010s
  { year: 2010, title: 'Kedi', language: 'Telugu' },
  { year: 2010, title: 'Ragada', language: 'Telugu' },
  { year: 2011, title: 'Gaganam', language: 'Telugu' },
  { year: 2011, title: 'Payanam', language: 'Tamil' },
  { year: 2011, title: 'Rajanna', language: 'Telugu' },
  { year: 2012, title: 'Shirdi Sai', language: 'Telugu' },
  { year: 2012, title: 'Damarukam', language: 'Telugu' },
  { year: 2013, title: 'Greeku Veerudu', language: 'Telugu' },
  { year: 2013, title: 'Jagadguru Adi Shankara', language: 'Telugu' },
  { year: 2013, title: 'Bhai', language: 'Telugu' },
  { year: 2014, title: 'Manam', language: 'Telugu' },
  { year: 2016, title: 'Soggade Chinni Nayana', language: 'Telugu' },
  { year: 2016, title: 'Oopiri', language: 'Telugu' },
  { year: 2016, title: 'Thozha', language: 'Tamil' },
  { year: 2017, title: 'Om Namo Venkatesaya', language: 'Telugu' },
  { year: 2017, title: 'Raju Gari Gadhi 2', language: 'Telugu' },
  { year: 2018, title: 'Officer', language: 'Telugu' },
  { year: 2018, title: 'Devadas', language: 'Telugu' },
  { year: 2019, title: 'Manmadhudu 2', language: 'Telugu' },
  
  // 2020s
  { year: 2021, title: 'Wild Dog', language: 'Telugu' },
  { year: 2022, title: 'Bangarraju', language: 'Telugu' },
  { year: 2022, title: 'Brahmāstra', language: 'Hindi' },
  { year: 2022, title: 'The Ghost', language: 'Telugu' },
  { year: 2024, title: 'Naa Saami Ranga', language: 'Telugu' },
  { year: 2025, title: 'Kuberaa', language: 'Telugu' },
  { year: 2025, title: 'Coolie', language: 'Telugu' },
];

async function auditFilmography() {
  console.log('🎬 Nagarjuna Complete Filmography Audit\n');
  console.log('='.repeat(80));
  
  console.log(`\n📊 Known Filmography: ${KNOWN_FILMOGRAPHY.length} movies`);
  
  // Query ALL movies with any variation of Nagarjuna's name
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, language, is_published, hero, heroine, director')
    .or(`hero.ilike.%nagarjuna%,heroine.ilike.%nagarjuna%,director.ilike.%nagarjuna%`)
    .not('hero', 'ilike', '%balakrishna%')
    .not('heroine', 'ilike', '%balakrishna%')
    .order('release_year', { ascending: true });
  
  console.log(`\n📊 Database Movies: ${allMovies?.length || 0} total`);
  
  const publishedMovies = allMovies?.filter(m => m.is_published) || [];
  const unpublishedMovies = allMovies?.filter(m => !m.is_published) || [];
  
  console.log(`   Published: ${publishedMovies.length}`);
  console.log(`   Unpublished: ${unpublishedMovies.length}`);
  
  // Check by language
  const languageCounts = new Map<string, number>();
  allMovies?.forEach(m => {
    const lang = m.language || 'Unknown';
    languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
  });
  
  console.log(`\n📊 Movies by Language:`);
  Array.from(languageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} movies`);
    });
  
  // Find missing movies
  console.log(`\n❌ Missing Movies (in known list but not in database):\n`);
  
  const missingMovies: typeof KNOWN_FILMOGRAPHY = [];
  
  for (const knownMovie of KNOWN_FILMOGRAPHY) {
    const normalizedKnownTitle = knownMovie.title.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    const found = allMovies?.some(dbMovie => {
      const normalizedDbTitle = (dbMovie.title_en || '').toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      
      return normalizedDbTitle === normalizedKnownTitle ||
             normalizedDbTitle.includes(normalizedKnownTitle) ||
             normalizedKnownTitle.includes(normalizedDbTitle);
    });
    
    if (!found) {
      missingMovies.push(knownMovie);
    }
  }
  
  console.log(`   Total missing: ${missingMovies.length} movies\n`);
  
  // Group by decade
  const missingBy1960s = missingMovies.filter(m => m.year >= 1960 && m.year < 1970);
  const missingBy1980s = missingMovies.filter(m => m.year >= 1980 && m.year < 1990);
  const missingBy1990s = missingMovies.filter(m => m.year >= 1990 && m.year < 2000);
  const missingBy2000s = missingMovies.filter(m => m.year >= 2000 && m.year < 2010);
  const missingBy2010s = missingMovies.filter(m => m.year >= 2010 && m.year < 2020);
  const missingBy2020s = missingMovies.filter(m => m.year >= 2020);
  
  if (missingBy1960s.length > 0) {
    console.log(`   1960s (${missingBy1960s.length} missing):`);
    missingBy1960s.forEach(m => console.log(`     ${m.year} - ${m.title} (${m.role || 'Child'})`));
  }
  
  if (missingBy1980s.length > 0) {
    console.log(`\n   1980s (${missingBy1980s.length} missing):`);
    missingBy1980s.forEach(m => console.log(`     ${m.year} - ${m.title}`));
  }
  
  if (missingBy1990s.length > 0) {
    console.log(`\n   1990s (${missingBy1990s.length} missing):`);
    missingBy1990s.forEach(m => console.log(`     ${m.year} - ${m.title}${m.language ? ` (${m.language})` : ''}`));
  }
  
  if (missingBy2000s.length > 0) {
    console.log(`\n   2000s (${missingBy2000s.length} missing):`);
    missingBy2000s.forEach(m => console.log(`     ${m.year} - ${m.title}${m.language ? ` (${m.language})` : ''}`));
  }
  
  if (missingBy2010s.length > 0) {
    console.log(`\n   2010s (${missingBy2010s.length} missing):`);
    missingBy2010s.forEach(m => console.log(`     ${m.year} - ${m.title}${m.language ? ` (${m.language})` : ''}`));
  }
  
  if (missingBy2020s.length > 0) {
    console.log(`\n   2020s (${missingBy2020s.length} missing):`);
    missingBy2020s.forEach(m => console.log(`     ${m.year} - ${m.title}${m.language ? ` (${m.language})` : ''}`));
  }
  
  // Check unpublished movies
  if (unpublishedMovies.length > 0) {
    console.log(`\n⚠️  Unpublished Movies (${unpublishedMovies.length} in database but not shown):\n`);
    unpublishedMovies.forEach(m => {
      console.log(`     ${m.release_year} - ${m.title_en} (${m.language})`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Summary:\n');
  console.log(`   Known Filmography: ${KNOWN_FILMOGRAPHY.length} movies`);
  console.log(`   In Database (Total): ${allMovies?.length || 0} movies`);
  console.log(`   In Database (Published): ${publishedMovies.length} movies`);
  console.log(`   In Database (Unpublished): ${unpublishedMovies.length} movies`);
  console.log(`   Missing from Database: ${missingMovies.length} movies`);
  console.log(`\n   Profile Should Show: ${publishedMovies.length} movies currently`);
  console.log(`   Profile Should Show (Complete): ${KNOWN_FILMOGRAPHY.length - missingMovies.length + unpublishedMovies.length} movies after fixes\n`);
  
  console.log('📝 Actions Needed:\n');
  console.log(`   1. Add ${missingMovies.length} missing movies to database`);
  console.log(`   2. Publish ${unpublishedMovies.length} unpublished movies (if appropriate)`);
  console.log(`   3. Verify profile shows all ${publishedMovies.length} published movies\n`);
}

auditFilmography().catch(console.error);
