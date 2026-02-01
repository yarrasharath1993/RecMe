#!/usr/bin/env npx tsx
/**
 * VERIFY CHIRANJEEVI FILMOGRAPHY AGAINST CANONICAL BATCHES 1–4
 *
 * Compares the database to the user-provided canonical filmography (4 batches).
 * Outputs: matched OK, missing from DB, wrong role type, DB-only (not in canonical).
 *
 * Usage:
 *   npx tsx scripts/verify-chiranjeevi-filmography-batches.ts
 *   npx tsx scripts/verify-chiranjeevi-filmography-batches.ts --output=reports/verify-filmography-report.md
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTOR_NAME = 'Chiranjeevi';

/** Canonical entry from user-provided batches */
interface CanonicalEntry {
  year: number | null; // null for "—" (TBA/voice-over)
  movie: string;
  role: string;
  roleType: 'Main Lead' | 'Supporting' | 'Cameo' | 'Guest' | 'Voice Over' | 'Narrator';
}

/** Map user Role Type to DB role_type */
function toDbRoleType(roleType: CanonicalEntry['roleType']): string {
  switch (roleType) {
    case 'Main Lead':
      return 'hero';
    case 'Supporting':
      return 'supporting';
    case 'Cameo':
    case 'Guest':
      return 'cameo';
    case 'Voice Over':
    case 'Narrator':
      return 'other'; // or keep as-is for report
    default:
      return 'hero';
  }
}

/** Normalize title for matching: lowercase, collapse spaces, remove punctuation */
function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Known canonical title -> DB title variants (normalized) for matching */
const TITLE_VARIANTS: [string, string][] = [
  ['rakta bandham', 'rakta sambandham'],
  ['sri rama bantu', 'sri rambantu'],
  ['intlo ramayya veedilo krishnayya', 'intlo ramayya veedhilo krishnayya'],
  ['bandhalu anubandhalu', 'bandalu anubandalu'],
  ['chattam tho poratam', 'chattamtho poratam'],
  ['jwala', 'jwaala'],
  ['rakta sindhuram', 'raktha sindhuram'],
  ['todu dongalu', 'thodu dongalu'],
  ['parvathi parameswarulu', 'paravathi parameshwarulu'],
  ['47 natkal (tamil)', '47 rojulu'],
  ['tiruguleni manishi', 'tirugu leni manishi'],
  ['punnami naagu', 'punnami naag'],
  ['prema tarangalu', 'thathayya premaleelalu'],
  ['chanakya shapadham', 'chanakya shapadham'],
  ['lankeshwarudu', 'lankeswarudu'],
  ['aaj ka goonda raaj (hindi)', 'aaj ka goonda raj'],
  ['andarivaadu', 'andarivadu'],
  ['intiguttu', 'inti guttu'],
  ['allullostunnaru', 'allulu vasthunnaru'],
  ['kodama simham', 'kodama simham'],
  ['manavoori pandavulu', 'mana voori pandavulu'],
  ['mana voori pandavulu', 'manavoori pandavulu'],
];

/** Check if two titles match (normalized contains or equality, or known variant) */
function titleMatches(canonical: string, dbTitle: string): boolean {
  const a = normalizeTitle(canonical);
  const b = normalizeTitle(dbTitle || '');
  if (a === b) return true;
  if (b.includes(a) || a.includes(b)) return true;
  for (const [x, y] of TITLE_VARIANTS) {
    if ((a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x))) return true;
    if (a === x && b === y) return true;
  }
  return false;
}

/** Canonical filmography: Batch 1 (1978–1982) */
const BATCH_1: CanonicalEntry[] = [
  { year: 1978, movie: 'Pranam Khareedu', role: 'Narasimha', roleType: 'Main Lead' },
  { year: 1978, movie: 'Manavoori Pandavulu', role: 'Parthu', roleType: 'Supporting' },
  { year: 1979, movie: 'Kukka Katuku Cheppu Debba', role: 'Shekar', roleType: 'Main Lead' },
  { year: 1979, movie: 'Kotta Alludu', role: 'Jagan', roleType: 'Main Lead' },
  { year: 1979, movie: 'I Love You', role: 'Ramesh', roleType: 'Main Lead' },
  { year: 1979, movie: 'Punadhirallu', role: 'Crane operator', roleType: 'Main Lead' },
  { year: 1979, movie: 'Idi Katha Kaadu', role: 'Subanakar', roleType: 'Supporting' },
  { year: 1979, movie: 'Sri Rama Bantu', role: 'Raghu Ram', roleType: 'Main Lead' },
  { year: 1979, movie: 'Kothala Raayudu', role: 'Satyam', roleType: 'Main Lead' },
  { year: 1979, movie: 'Tayaramma Bangarayya', role: 'Guest', roleType: 'Guest' },
  { year: 1980, movie: 'Agni Samskaram', role: 'Unknown', roleType: 'Main Lead' },
  { year: 1980, movie: 'Kottapeta Rowdy', role: 'Guest', roleType: 'Guest' },
  { year: 1980, movie: 'Chandipriya', role: 'Anil', roleType: 'Main Lead' },
  { year: 1980, movie: 'Aarani Mantalu', role: 'Ravi', roleType: 'Main Lead' },
  { year: 1980, movie: 'Jathara', role: 'Rambabu', roleType: 'Main Lead' },
  { year: 1980, movie: 'Mosagadu', role: 'Seshu', roleType: 'Supporting' },
  { year: 1980, movie: 'Punnami Naagu', role: 'Naagulu', roleType: 'Main Lead' },
  { year: 1980, movie: 'Nakili Manishi', role: 'Prasad / Shyam', roleType: 'Main Lead' },
  { year: 1980, movie: 'Kaali', role: 'GK', roleType: 'Supporting' },
  { year: 1980, movie: 'Love In Singapore', role: 'Suresh', roleType: 'Main Lead' },
  { year: 1980, movie: 'Mogudu Kaavali', role: 'Chiranjeevi', roleType: 'Main Lead' },
  { year: 1980, movie: 'Prema Tarangalu', role: 'Kumar', roleType: 'Supporting' },
  { year: 1980, movie: 'Rakta Bandham', role: 'Tilak', roleType: 'Main Lead' },
  { year: 1981, movie: 'Aadavaallu Meeku Joharlu', role: 'Guest', roleType: 'Guest' },
  { year: 1981, movie: 'Parvathi Parameswarulu', role: 'Mohan', roleType: 'Main Lead' },
  { year: 1981, movie: '47 Natkal (Tamil)', role: 'Kumar', roleType: 'Supporting' },
  { year: 1981, movie: 'Srirasthu Subhamasthu', role: 'Krishna', roleType: 'Main Lead' },
  { year: 1981, movie: 'Nyayam Kavali', role: 'Suresh Kumar', roleType: 'Main Lead' },
  { year: 1981, movie: 'Tiruguleni Manishi', role: 'Kishore', roleType: 'Supporting' },
  { year: 1981, movie: 'Todu Dongalu', role: 'Kishore', roleType: 'Main Lead' },
  { year: 1981, movie: 'Kirayi Rowdylu', role: 'Raja', roleType: 'Main Lead' },
  { year: 1981, movie: 'Chattaniki Kallu Levu', role: 'Vijay', roleType: 'Main Lead' },
  { year: 1981, movie: 'Priya', role: 'Vijay', roleType: 'Main Lead' },
  { year: 1982, movie: 'Patnam Vachina Pativrathalu', role: 'Gopi', roleType: 'Main Lead' },
  { year: 1982, movie: 'Intlo Ramayya Veedilo Krishnayya', role: 'Rajasekharam', roleType: 'Main Lead' },
  { year: 1982, movie: 'Subhalekha', role: 'Narasimha Murthy', roleType: 'Main Lead' },
  { year: 1982, movie: 'Idi Pellantara', role: 'Deepak', roleType: 'Main Lead' },
  { year: 1982, movie: 'Sitadevi', role: 'Unknown', roleType: 'Main Lead' },
  { year: 1982, movie: 'Tingu Rangadu', role: 'Rangadu', roleType: 'Main Lead' },
  { year: 1982, movie: 'Billa Ranga', role: 'Billa / Ranga', roleType: 'Main Lead' },
  { year: 1982, movie: 'Yamakinkarudu', role: 'Vijay', roleType: 'Main Lead' },
  { year: 1982, movie: 'Mondi Ghatam', role: 'Ravindra', roleType: 'Main Lead' },
  { year: 1982, movie: 'Manchu Pallaki', role: 'Sekhar', roleType: 'Main Lead' },
  { year: 1982, movie: 'Bandhalu Anubandhalu', role: 'Inspector Chiranjeevi', roleType: 'Main Lead' },
  { year: 1982, movie: 'Radha My Darling', role: 'Mohan', roleType: 'Main Lead' },
];

/** Batch 2 (1983–1990) */
const BATCH_2: CanonicalEntry[] = [
  { year: 1983, movie: 'Prema Pichollu', role: 'Ravi', roleType: 'Main Lead' },
  { year: 1983, movie: 'Palletoori Monagadu', role: 'Raju', roleType: 'Main Lead' },
  { year: 1983, movie: 'Abhilasha', role: 'Chiranjeevi', roleType: 'Main Lead' },
  { year: 1983, movie: 'Aalaya Sikharam', role: 'Unknown', roleType: 'Main Lead' },
  { year: 1983, movie: 'Shivudu Shivudu Shivudu', role: 'Shivudu', roleType: 'Main Lead' },
  { year: 1983, movie: 'Puli Bebbuli', role: 'Gopi Krishna', roleType: 'Main Lead' },
  { year: 1983, movie: 'Gudachari No.1', role: 'Vijay', roleType: 'Main Lead' },
  { year: 1983, movie: 'Maga Maharaju', role: 'Raju', roleType: 'Main Lead' },
  { year: 1983, movie: 'Roshagadu', role: 'Unknown', roleType: 'Main Lead' },
  { year: 1983, movie: 'Simhapuri Simham', role: 'Raja Sekharam / Vijay', roleType: 'Main Lead' },
  { year: 1983, movie: 'Khaidi', role: 'Sooryam', roleType: 'Main Lead' },
  { year: 1983, movie: 'Mantri Gari Viyyankudu', role: 'Babji', roleType: 'Main Lead' },
  { year: 1983, movie: 'Sangharshana', role: 'Dilip', roleType: 'Main Lead' },
  { year: 1984, movie: 'Allullostunnaru', role: 'Gopi', roleType: 'Main Lead' },
  { year: 1984, movie: 'Goonda', role: 'Kalidas / Raja', roleType: 'Main Lead' },
  { year: 1984, movie: 'Hero', role: 'Krishna', roleType: 'Main Lead' },
  { year: 1984, movie: 'Devanthakudu', role: 'Vijay', roleType: 'Main Lead' },
  { year: 1984, movie: 'Mahanagaramlo Mayagadu', role: 'Raja', roleType: 'Main Lead' },
  { year: 1984, movie: 'Challenge', role: 'Gandhi', roleType: 'Main Lead' },
  { year: 1984, movie: 'Intiguttu', role: 'Vijay Kumar', roleType: 'Main Lead' },
  { year: 1984, movie: 'Naagu', role: 'Naagu', roleType: 'Main Lead' },
  { year: 1984, movie: 'Rustum', role: 'Ganguly', roleType: 'Main Lead' },
  { year: 1984, movie: 'Agni Gundam', role: 'Vijay', roleType: 'Main Lead' },
  { year: 1985, movie: 'Chattam Tho Poratam', role: 'Ravishankar', roleType: 'Main Lead' },
  { year: 1985, movie: 'Donga', role: 'Phani', roleType: 'Main Lead' },
  { year: 1985, movie: 'Chiranjeevi', role: 'Chiranjeevi', roleType: 'Main Lead' },
  { year: 1985, movie: 'Jwala', role: 'Raju / Yuvaraju', roleType: 'Main Lead' },
  { year: 1985, movie: 'Puli', role: 'Kranthi', roleType: 'Main Lead' },
  { year: 1985, movie: 'Rakta Sindhuram', role: 'Gopi / Gandragoddali', roleType: 'Main Lead' },
  { year: 1985, movie: 'Adavi Donga', role: 'Kalidas', roleType: 'Main Lead' },
  { year: 1985, movie: 'Vijetha', role: 'Madhusudhana Rao', roleType: 'Main Lead' },
  { year: 1986, movie: 'Kirathakudu', role: 'Charan', roleType: 'Main Lead' },
  { year: 1986, movie: 'Kondaveeti Raja', role: 'Raja', roleType: 'Main Lead' },
  { year: 1986, movie: 'Magadheerudu', role: 'Raju', roleType: 'Main Lead' },
  { year: 1986, movie: 'Veta', role: 'Ranapratap Kumar Varma', roleType: 'Main Lead' },
  { year: 1986, movie: 'Chantabbai', role: 'James Pond', roleType: 'Main Lead' },
  { year: 1986, movie: 'Rakshasudu', role: 'Purusha', roleType: 'Main Lead' },
  { year: 1986, movie: 'Dhairyavanthudu', role: 'Kishore', roleType: 'Main Lead' },
  { year: 1986, movie: 'Chanakya Shapadham', role: 'Chanakya', roleType: 'Main Lead' },
  { year: 1987, movie: 'Donga Mogudu', role: 'Ravi Teja / Nagaraju', roleType: 'Main Lead' },
  { year: 1987, movie: 'Aradhana', role: 'Puli Raju', roleType: 'Main Lead' },
  { year: 1987, movie: 'Chakravarthy', role: 'Anji', roleType: 'Main Lead' },
  { year: 1987, movie: 'Pasivadi Pranam', role: 'Madhu', roleType: 'Main Lead' },
  { year: 1987, movie: 'Swayamkrushi', role: 'Sambayya', roleType: 'Main Lead' },
  { year: 1987, movie: 'Jebu Donga', role: 'Chitti Babu', roleType: 'Main Lead' },
];

/** Batch 3 (1988–1999) */
const BATCH_3: CanonicalEntry[] = [
  { year: 1988, movie: 'Manchi Donga', role: 'Veerendra', roleType: 'Main Lead' },
  { year: 1988, movie: 'Rudraveena', role: 'Suryanarayana Sastry', roleType: 'Main Lead' },
  { year: 1988, movie: 'Yamudiki Mogudu', role: 'Kali / Balu', roleType: 'Main Lead' },
  { year: 1988, movie: 'Khaidi No.786', role: 'Gopi', roleType: 'Main Lead' },
  { year: 1988, movie: 'Marana Mrudangam', role: 'Janardhan / Johnny', roleType: 'Main Lead' },
  { year: 1988, movie: 'Trinetrudu', role: 'Abhimanyu', roleType: 'Main Lead' },
  { year: 1988, movie: 'Yudda Bhoomi', role: 'Vijay', roleType: 'Main Lead' },
  { year: 1989, movie: 'Attaku Yamudu Ammayiki Mogudu', role: 'Kalyan', roleType: 'Main Lead' },
  { year: 1989, movie: 'State Rowdy', role: 'Kalicharan / Prithvi', roleType: 'Main Lead' },
  { year: 1989, movie: 'Rudranetra', role: 'Nethra', roleType: 'Main Lead' },
  { year: 1989, movie: 'Lankeshwarudu', role: 'Shankar', roleType: 'Main Lead' },
  { year: 1989, movie: 'Mappillai', role: 'Himself', roleType: 'Cameo' },
  { year: 1990, movie: 'Kondaveeti Donga', role: 'Raja', roleType: 'Main Lead' },
  { year: 1990, movie: 'Jagadeka Veerudu Athiloka Sundari', role: 'Raju', roleType: 'Main Lead' },
  { year: 1990, movie: 'Kodama Simham', role: 'Bharath', roleType: 'Main Lead' },
  { year: 1990, movie: 'Pratibandh (Hindi)', role: 'Siddhanth', roleType: 'Main Lead' },
  { year: 1990, movie: 'Raja Vikramarka', role: 'Raja Vikramarka', roleType: 'Main Lead' },
  { year: 1991, movie: 'Stuartpuram Police Station', role: 'Rana Pratap', roleType: 'Main Lead' },
  { year: 1991, movie: 'Gang Leader', role: 'Rajaram', roleType: 'Main Lead' },
  { year: 1991, movie: 'Rowdy Alludu', role: 'Kalyan / Johnny', roleType: 'Main Lead' },
  { year: 1992, movie: 'Gharana Mogudu', role: 'Raju', roleType: 'Main Lead' },
  { year: 1992, movie: 'Aaj Ka Goonda Raaj (Hindi)', role: 'Raja', roleType: 'Main Lead' },
  { year: 1992, movie: 'Aapadbandhavudu', role: 'Madhava', roleType: 'Main Lead' },
  { year: 1993, movie: 'Muta Mestri', role: 'Subhash Chandra Bose', roleType: 'Main Lead' },
  { year: 1993, movie: 'Mechanic Alludu', role: 'Ravi', roleType: 'Main Lead' },
  { year: 1994, movie: 'Mugguru Monagallu', role: 'Prudhvi / Vikram / Dattatreya', roleType: 'Main Lead' },
  { year: 1994, movie: 'S.P. Parasuram', role: 'Parasuram', roleType: 'Main Lead' },
  { year: 1994, movie: 'The Gentleman (Hindi)', role: 'Vijay', roleType: 'Main Lead' },
  { year: 1995, movie: 'Alluda Majaka', role: 'Sitaramudu / Mr. Toyota', roleType: 'Main Lead' },
  { year: 1995, movie: 'Big Boss', role: 'Surendra', roleType: 'Main Lead' },
  { year: 1995, movie: 'Rikshavodu', role: 'Raju / Dharma Rayudu', roleType: 'Main Lead' },
  { year: 1996, movie: 'Sipayi (Kannada)', role: 'Major Chandrakanth', roleType: 'Supporting' },
  { year: 1997, movie: 'Hitler', role: 'Madhava Rao', roleType: 'Main Lead' },
  { year: 1997, movie: 'Master', role: 'Raj Kumar', roleType: 'Main Lead' },
  { year: 1998, movie: 'Bavagaru Bagunnara?', role: 'Raju', roleType: 'Main Lead' },
  { year: 1998, movie: 'Choodalani Vundi', role: 'Ramakrishna', roleType: 'Main Lead' },
  { year: 1999, movie: 'Sneham Kosam', role: 'Simhadri / Chinnayya', roleType: 'Main Lead' },
  { year: 1999, movie: 'Iddaru Mitrulu', role: 'Vijay', roleType: 'Main Lead' },
];

/** Batch 4 (2000–2026 + voice-over) */
const BATCH_4: CanonicalEntry[] = [
  { year: 2000, movie: 'Annayya', role: 'Rajaram', roleType: 'Main Lead' },
  { year: 2000, movie: 'Hands Up!', role: 'Himself', roleType: 'Cameo' },
  { year: 2001, movie: 'Mrugaraju', role: 'Raju', roleType: 'Main Lead' },
  { year: 2001, movie: 'Sri Manjunatha', role: 'Lord Shiva', roleType: 'Main Lead' },
  { year: 2001, movie: 'Daddy', role: 'Raj Kumar', roleType: 'Main Lead' },
  { year: 2002, movie: 'Indra', role: 'Indra Sena Reddy', roleType: 'Main Lead' },
  { year: 2003, movie: 'Tagore', role: 'Ravindranath Tagore', roleType: 'Main Lead' },
  { year: 2004, movie: 'Anji', role: 'Anji', roleType: 'Main Lead' },
  { year: 2004, movie: 'Shankar Dada M.B.B.S.', role: 'Shankar Prasad', roleType: 'Main Lead' },
  { year: 2005, movie: 'Andarivaadu', role: 'Govindarajulu / Siddharth', roleType: 'Main Lead' },
  { year: 2005, movie: 'Jai Chiranjeeva', role: 'Satyanarayana Murthy', roleType: 'Main Lead' },
  { year: 2006, movie: 'Stalin', role: 'Stalin', roleType: 'Main Lead' },
  { year: 2007, movie: 'Shankar Dada Zindabad', role: 'Shankar Prasad', roleType: 'Main Lead' },
  { year: 2009, movie: 'Magadheera', role: 'Boss', roleType: 'Cameo' },
  { year: 2013, movie: 'Jagadguru Adi Shankara', role: 'Lord Shiva', roleType: 'Supporting' },
  { year: 2015, movie: 'Bruce Lee - The Fighter', role: 'Himself', roleType: 'Cameo' },
  { year: 2017, movie: 'Khaidi No. 150', role: 'Seenu / Shankar', roleType: 'Main Lead' },
  { year: 2019, movie: 'Sye Raa Narasimha Reddy', role: 'Narasimha Reddy', roleType: 'Main Lead' },
  { year: 2022, movie: 'Acharya', role: 'Acharya', roleType: 'Main Lead' },
  { year: 2022, movie: 'GodFather', role: 'Brahma / Abram Qureshi', roleType: 'Main Lead' },
  { year: 2023, movie: 'Waltair Veerayya', role: 'Waltair Veerayya', roleType: 'Main Lead' },
  { year: 2023, movie: 'Bhola Shankar', role: 'Bhola Shankar', roleType: 'Main Lead' },
  { year: 2025, movie: 'Vishwambhara', role: 'Vishwa', roleType: 'Main Lead' },
  { year: 2026, movie: 'Mana Shankara Vara Prasad Garu', role: 'Shankara Vara Prasad', roleType: 'Main Lead' },
  { year: 2026, movie: 'Chiranjeevi-Srikanth Odela Project', role: 'TBA', roleType: 'Main Lead' },
  { year: null, movie: 'Hanuman (Telugu)', role: 'Hanuman', roleType: 'Voice Over' },
  { year: null, movie: 'Rudhramadevi', role: 'Narrator', roleType: 'Narrator' },
  { year: null, movie: 'Brahmāstra (Telugu)', role: 'Narrator', roleType: 'Narrator' },
];

const ALL_CANONICAL: CanonicalEntry[] = [...BATCH_1, ...BATCH_2, ...BATCH_3, ...BATCH_4];

type DbRoleSource = 'hero' | 'heroine' | 'supporting_cast';
interface DbMovie {
  id: string;
  title_en: string | null;
  release_year: number | null;
  hero: string | null;
  heroine: string | null;
  supporting_cast: any;
}

interface MatchResult {
  canonical: CanonicalEntry;
  status: 'matched' | 'missing' | 'wrong_role' | 'title_mismatch';
  dbMovie?: DbMovie;
  dbRole?: DbRoleSource;
  expectedRole: string;
}

async function fetchChiranjeeviMovies(): Promise<DbMovie[]> {
  const { data: heroMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, supporting_cast')
    .ilike('hero', `%${ACTOR_NAME}%`);

  const { data: heroineMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, supporting_cast')
    .ilike('heroine', `%${ACTOR_NAME}%`);

  const { data: allWithSupporting } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, supporting_cast')
    .not('supporting_cast', 'is', null);

  const supportingFiltered = (allWithSupporting || []).filter((m: DbMovie) => {
    if (!m.supporting_cast || !Array.isArray(m.supporting_cast)) return false;
    const str = JSON.stringify(m.supporting_cast).toLowerCase();
    return str.includes('chiranjeevi');
  });

  const byId = new Map<string, DbMovie>();
  for (const m of [...(heroMovies || []), ...(heroineMovies || []), ...supportingFiltered]) {
    byId.set(m.id, m);
  }
  return Array.from(byId.values());
}

function getDbRole(movie: DbMovie): { role: DbRoleSource; raw?: string } | null {
  if (movie.hero && movie.hero.toLowerCase().includes('chiranjeevi')) return { role: 'hero', raw: movie.hero };
  if (movie.heroine && movie.heroine.toLowerCase().includes('chiranjeevi')) return { role: 'heroine', raw: movie.heroine };
  if (movie.supporting_cast && Array.isArray(movie.supporting_cast)) {
    for (const c of movie.supporting_cast) {
      const name = typeof c === 'string' ? c : (c && c.name);
      if (name && String(name).toLowerCase().includes('chiranjeevi')) return { role: 'supporting_cast', raw: name };
    }
  }
  return null;
}

function findDbMovieForEntry(entry: CanonicalEntry, dbMovies: DbMovie[]): DbMovie | undefined {
  if (entry.year == null) {
    return dbMovies.find((m) => titleMatches(entry.movie, m.title_en || ''));
  }
  const sameYear = dbMovies.filter((m) => m.release_year != null && Math.abs(m.release_year - entry.year!) <= 1);
  for (const m of sameYear) {
    if (titleMatches(entry.movie, m.title_en || '')) return m;
  }
  return undefined;
}

function runVerification(dbMovies: DbMovie[]): MatchResult[] {
  const results: MatchResult[] = [];
  const expectedRole = (e: CanonicalEntry) => toDbRoleType(e.roleType);

  for (const entry of ALL_CANONICAL) {
    const dbMovie = findDbMovieForEntry(entry, dbMovies);
    const expected = expectedRole(entry);

    if (!dbMovie) {
      results.push({ canonical: entry, status: 'missing', expectedRole: expected });
      continue;
    }

    const dbRoleInfo = getDbRole(dbMovie);
    if (!dbRoleInfo) {
      results.push({ canonical: entry, status: 'wrong_role', dbMovie, expectedRole: expected });
      continue;
    }

    const roleOk =
      (expected === 'hero' && dbRoleInfo.role === 'hero') ||
      ((expected === 'supporting' || expected === 'cameo' || expected === 'other') && dbRoleInfo.role === 'supporting_cast');
    if (roleOk) {
      results.push({ canonical: entry, status: 'matched', dbMovie, dbRole: dbRoleInfo.role, expectedRole: expected });
    } else {
      results.push({ canonical: entry, status: 'wrong_role', dbMovie, dbRole: dbRoleInfo.role, expectedRole: expected });
    }
  }
  return results;
}

function markDbMoviesMatched(results: MatchResult[]): Set<string> {
  const matchedIds = new Set<string>();
  for (const r of results) {
    if (r.status === 'matched' && r.dbMovie) matchedIds.add(r.dbMovie.id);
  }
  return matchedIds;
}

function buildReport(results: MatchResult[], dbMovies: DbMovie[], matchedIds: Set<string>): string {
  const matched = results.filter((r) => r.status === 'matched');
  const missing = results.filter((r) => r.status === 'missing');
  const wrongRole = results.filter((r) => r.status === 'wrong_role');
  const dbOnly = dbMovies.filter((m) => !matchedIds.has(m.id));

  let md = `# Chiranjeevi Filmography Verification Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `| Status | Count |\n|--------|-------|\n`;
  md += `| Matched (OK) | ${matched.length} |\n`;
  md += `| Missing from DB | ${missing.length} |\n`;
  md += `| Wrong role type | ${wrongRole.length} |\n`;
  md += `| In DB but not in canonical list | ${dbOnly.length} |\n\n`;

  if (missing.length > 0) {
    md += `## Missing from database (canonical list)\n\n`;
    md += `| Year | Movie | Role | Expected DB role |\n|------|-------|------|------------------|\n`;
    for (const r of missing) {
      md += `| ${r.canonical.year ?? '—'} | ${r.canonical.movie} | ${r.canonical.role} | ${r.expectedRole} |\n`;
    }
    md += `\n`;
  }

  if (wrongRole.length > 0) {
    md += `## Wrong role type (canonical vs DB)\n\n`;
    md += `| Year | Movie | Canonical role | Expected | DB has | DB title |\n|------|-------|----------------|----------|--------|----------|\n`;
    for (const r of wrongRole) {
      const dbTitle = r.dbMovie?.title_en ?? '';
      const dbHas = r.dbRole ?? '—';
      md += `| ${r.canonical.year ?? '—'} | ${r.canonical.movie} | ${r.canonical.roleType} | ${r.expectedRole} | ${dbHas} | ${dbTitle} |\n`;
    }
    md += `\n`;
  }

  if (dbOnly.length > 0) {
    md += `## In DB but not in canonical list (review)\n\n`;
    md += `| Year | DB Title | Attribution |\n|------|----------|-------------|\n`;
    for (const m of dbOnly) {
      const info = getDbRole(m);
      md += `| ${m.release_year ?? '—'} | ${m.title_en ?? ''} | ${info?.role ?? '?'} |\n`;
    }
    md += `\n`;
  }

  md += `## Matched (${matched.length})\n\n`;
  md += `| Year | Movie | Role type |\n|------|-------|----------|\n`;
  for (const r of matched.slice(0, 80)) {
    md += `| ${r.canonical.year ?? '—'} | ${r.canonical.movie} | ${r.canonical.roleType} |\n`;
  }
  if (matched.length > 80) md += `| ... | (${matched.length - 80} more) | |\n`;
  return md;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1].replace(/['"]/g, '') : '';
  };
  const outputPath = getArg('output') || 'reports/verify-chiranjeevi-filmography-report.md';

  console.log(chalk.cyan('Fetching Chiranjeevi movies from DB...'));
  const dbMovies = await fetchChiranjeeviMovies();
  console.log(chalk.green(`Found ${dbMovies.length} DB movies.\n`));

  const results = runVerification(dbMovies);
  const matchedIds = markDbMoviesMatched(results);

  const matched = results.filter((r) => r.status === 'matched');
  const missing = results.filter((r) => r.status === 'missing');
  const wrongRole = results.filter((r) => r.status === 'wrong_role');
  const dbOnly = dbMovies.filter((m) => !matchedIds.has(m.id));

  console.log(chalk.bold('Summary'));
  console.log(`  Matched (OK): ${matched.length}`);
  console.log(`  Missing from DB: ${missing.length}`);
  console.log(`  Wrong role type: ${wrongRole.length}`);
  console.log(`  In DB only (not in canonical): ${dbOnly.length}`);

  if (missing.length > 0) {
    console.log(chalk.yellow('\nMissing from DB:'));
    missing.slice(0, 15).forEach((r) => console.log(`  ${r.canonical.year} ${r.canonical.movie} (${r.expectedRole})`));
    if (missing.length > 15) console.log(`  ... and ${missing.length - 15} more`);
  }
  if (wrongRole.length > 0) {
    console.log(chalk.yellow('\nWrong role:'));
    wrongRole.forEach((r) => console.log(`  ${r.canonical.movie}: expected ${r.expectedRole}, DB has ${r.dbRole ?? '?'}`));
  }

  const report = buildReport(results, dbMovies, matchedIds);
  const dir = path.dirname(outputPath);
  if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, report, 'utf8');
  console.log(chalk.green(`\nReport written to ${outputPath}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
