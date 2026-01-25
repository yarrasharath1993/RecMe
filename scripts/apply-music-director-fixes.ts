#!/usr/bin/env npx tsx
/**
 * Apply Music Director Fixes from Manual Review
 * Also fixes data anomalies for director/hero fields
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Manually verified data with music directors and fixes
const VERIFIED_DATA = [
  // Data Anomalies Fixed
  { title: 'Lady Tarzan', year: 1983, director: 'G.K. Mudduraj', music_director: 'Ilaiyaraaja' },
  { title: 'Hyderabad Blues', year: 1998, hero: 'Nagesh Kukunoor', music_director: 'Salim-Sulaiman' },
  { title: 'Sudigundaalu', year: 1968, hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Rakta Sambandham', year: 1962, hero: 'N.T. Rama Rao', music_director: 'Ghantasala' },
  
  // Regular Music Director Updates
  { title: 'Niku Naku Pellanta Tom Tom Tom', year: 2022, music_director: 'P.V.R. Raja' },
  { title: 'Telugu Veera Levara', year: 1995, music_director: 'Koti' },
  { title: 'Desamlo Dongalu Paddaru', year: 2018, music_director: 'Sandy Addanki' },
  { title: 'Kuravanji', year: 1960, music_director: 'T.R. Pappa' },
  { title: 'Soubhagyavathi', year: 1975, music_director: 'K. Chakravarthy' },
  { title: 'Kanchu Kota', year: 1967, music_director: 'T.V. Raju' },
  { title: 'Gopaludu Bhoopaludu', year: 1967, music_director: 'T.V. Raju' },
  { title: 'Mogudu Pellalu', year: 1985, music_director: 'Ramesh Naidu' },
  { title: 'Devadasu', year: 1974, music_director: 'Ramesh Naidu' },
  { title: 'Debbaku Debba', year: 1983, music_director: 'Ilaiyaraaja' },
  { title: 'Beedala Patlu', year: 1952, music_director: 'S.M. Subbaiah Naidu' },
  { title: 'Pantulamma', year: 1943, music_director: 'S. Rajeswara Rao' },
  { title: 'Dharmapatni', year: 1941, music_director: 'S. Rajeswara Rao' },
  { title: 'Ashtalakshmi Vaibhavam', year: 1986, music_director: 'M.S. Viswanathan' },
  { title: 'Desanikokkadu', year: 1983, music_director: 'K. Chakravarthy' },
  { title: 'Devi Kanaykumari', year: 1983, music_director: 'G. Devarajan' },
  { title: 'Kaksha', year: 1980, music_director: 'K. Chakravarthy' },
  { title: 'Garuda Rekhe', year: 1982, music_director: 'Satyam' },
  { title: 'Angadi Bomma', year: 1978, music_director: 'Satyam' },
  { title: 'Manthra Dandam', year: 1985, music_director: 'Satyam' },
  { title: 'Amara Sandhesam', year: 1954, music_director: 'K. Prasad Rao' },
  { title: 'Inikkum Ilamai', year: 1982, music_director: 'Shankar-Ganesh' },
  { title: 'Prema Vijayam', year: 1983, music_director: 'J.V. Raghavulu' },
  { title: 'Kasi Yatra', year: 1983, music_director: 'J.V. Raghavulu' },
  { title: 'Rangoon Rowdy', year: 1979, music_director: 'J.V. Raghavulu' },
  { title: 'Satyaniki Sankellu', year: 1974, music_director: 'Satyam' },
  { title: 'Vayasochina Pilla', year: 1975, music_director: 'Satyam' },
  { title: 'Premalu Pellillu', year: 1974, music_director: 'M.S. Viswanathan' },
  { title: 'Aathmeeyulu', year: 1969, music_director: 'S. Rajeswara Rao' },
  { title: 'Monagadostunnadu Jagratha', year: 1972, music_director: 'Satyam' },
  { title: 'Kaksha Sadistha', year: 1983, music_director: 'Satyam' },
  { title: 'Chandi Chamundi', year: 1983, music_director: 'Satyam' },
  { title: 'Ammayila Sapatham', year: 1975, music_director: 'Satyam' },
  { title: 'Praja Shakthi', year: 1983, music_director: 'Satyam' },
  { title: 'Bhale Rangadu', year: 1969, music_director: 'T.V. Raju' },
  { title: 'Gandaragandudu', year: 1969, music_director: 'T.V. Raju' },
  { title: 'Bandhipotu Bhimanna', year: 1969, music_director: 'T.V. Raju' },
  { title: 'Devadichina Bharta', year: 1968, music_director: 'T.V. Raju' },
  { title: 'Bangaru Bava', year: 1980, music_director: 'Satyam' },
  { title: 'Chandashasanudu', year: 1983, music_director: 'K. Chakravarthy' },
  { title: 'Merupu Veerudu', year: 1970, music_director: 'Satyam' },
  { title: 'Vikramarka Vijayam', year: 1971, music_director: 'Satyam' },
  { title: 'Pakkalo Ballem', year: 1965, music_director: 'T.V. Raju' },
  { title: 'Aggi Veerudu', year: 1969, music_director: 'Vijaya Krishna Murthy' },
  { title: 'Aasha Jeevulu', year: 1962, music_director: 'Viswanathan-Ramamoorthy' },
  { title: 'Sadarama', year: 1956, music_director: 'R. Sudarsanam' },
  { title: 'Anarkali', year: 1955, music_director: 'P. Adinarayana Rao' },
  { title: 'Kalahala Kapuram', year: 1982, music_director: 'J.V. Raghavulu' },
  { title: 'Aadarsham', year: 1952, music_director: 'Ghantasala' },
  { title: 'Antastulu', year: 1965, music_director: 'K.V. Mahadevan' },
  { title: 'Daasi', year: 1952, music_director: 'C.R. Subbaraman' },
  { title: 'Prema ishq kaadhal', year: 2013, music_director: 'Shravan' },
  { title: 'Suputhrudu', year: 1971, music_director: 'K.V. Mahadevan' },
  { title: 'Meena', year: 1973, music_director: 'S. Rajeswara Rao' },
  { title: 'Illu Illalu', year: 1972, music_director: 'K.V. Mahadevan' },
  { title: 'Sati Savitri', year: 1978, music_director: 'S. Rajeswara Rao' },
  { title: 'Pratigna', year: 1953, music_director: 'Ghantasala' },
  { title: 'Evaru Donga', year: 1961, music_director: 'S. Rajeswara Rao' },
  { title: 'Kanyadhanam', year: 1955, music_director: 'M. Venu' },
  { title: 'Pasupu Kumkuma', year: 1955, music_director: 'T.V. Raju' },
  { title: 'Pasi Hrudayalu', year: 1973, music_director: 'G.K. Venkatesh' },
  { title: 'Badrinadh', year: 2011, music_director: 'M.M. Keeravani' },
  { title: 'Yashoda Krishna', year: 1975, music_director: 'S. Rajeswara Rao' },
  { title: 'Manchi Chedu', year: 1963, music_director: 'Viswanathan-Ramamoorthy' },
  { title: 'Annapurna', year: 1960, music_director: 'J.V. Raghavulu' },
  { title: 'Geeta', year: 1973, music_director: 'K.V. Mahadevan' },
  { title: 'Thulambaram', year: 1974, music_director: 'Satyam' },
  { title: 'Amayaka Chakravarthy', year: 1983, music_director: 'Satyam' },
  { title: 'Kottapeta Rowdy', year: 1980, music_director: 'Satyam' },
  { title: 'Abhisyanta Kalapam', year: 1949, music_director: 'S. Rajeswara Rao' },
  { title: 'Vooriki Vupakari', year: 1972, music_director: 'Satyam' },
  { title: 'Mattilo Manikyam', year: 1971, music_director: 'Satyam' },
  { title: 'Bhaktimala', year: 1941, music_director: 'V. Nagayya' },
  { title: 'Kathanayika Molla', year: 1970, music_director: 'S.P. Kodandapani' },
  { title: 'Yuvraju', year: 1982, music_director: 'K. Chakravarthy' },
  { title: 'Potti Pleader', year: 1966, music_director: 'S.P. Kodandapani' },
  { title: 'Patni', year: 1942, music_director: 'V. Nagayya' },
  { title: 'Bhakta Sriyala', year: 1948, music_director: 'Ogirala Ramachandra Rao' },
  { title: 'Sannayi Appanna', year: 1980, music_director: 'Satyam' },
  { title: 'Asha Jyoti', year: 1981, music_director: 'K. Chakravarthy' },
  { title: 'Nindu Samsaram', year: 1968, music_director: 'Master Venu' },
  { title: 'Jagannadha Rathachakralu', year: 1982, music_director: 'Satyam' },
  { title: 'Todu Dongalu', year: 1954, music_director: 'T.V. Raju' },
  { title: 'Manchi Kutumbam', year: 1968, music_director: 'S.P. Kodandapani' },
  { title: 'Paramanandayya Sishyulu', year: 1950, music_director: 'Ogirala Ramachandra Rao' },
  { title: 'Bangaru Chilaka', year: 1985, music_director: 'Satyam' },
  { title: 'Varudhini', year: 1947, music_director: 'S.V. Venkatraman' },
  { title: 'O Amma Katha', year: 1981, music_director: 'Satyam' },
  { title: 'Station Master', year: 1988, music_director: 'M.M. Keeravani' },
  { title: 'Prema Samrat', year: 1987, music_director: 'Satyam' },
  { title: 'Rachayitri', year: 1984, music_director: 'Satyam' },
  { title: 'Bezawada Bebbuli', year: 1983, music_director: 'Satyam' },
  { title: 'Niluvu Dopidi', year: 1968, music_director: 'K.V. Mahadevan' },
  { title: 'Balasanyasamma Katha', year: 1956, music_director: 'S. Rajeswara Rao' },
  { title: 'Rickshaw Raji', year: 1978, music_director: 'Satyam' },
];

async function applyFixes() {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║     APPLY MUSIC DIRECTOR & DATA FIXES FROM MANUAL REVIEW     ║
╚══════════════════════════════════════════════════════════════╝
`));

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const fix of VERIFIED_DATA) {
    // Find the movie
    const { data: movies, error: findError } = await supabase
      .from('movies')
      .select('id, title_en, release_year')
      .eq('release_year', fix.year)
      .ilike('title_en', `%${fix.title.split(' ')[0]}%`)
      .limit(5);

    if (findError) {
      console.log(chalk.red(`Error finding ${fix.title}: ${findError.message}`));
      errors++;
      continue;
    }

    // Find exact or closest match
    const movie = movies?.find(m => 
      m.title_en.toLowerCase() === fix.title.toLowerCase() ||
      m.title_en.toLowerCase().includes(fix.title.toLowerCase()) ||
      fix.title.toLowerCase().includes(m.title_en.toLowerCase())
    );

    if (!movie) {
      console.log(chalk.yellow(`Not found: ${fix.title} (${fix.year})`));
      notFound++;
      continue;
    }

    // Build update object
    const updates: Record<string, any> = {
      music_director: fix.music_director,
    };

    // Add other fixes if present
    if (fix.director) updates.director = fix.director;
    if (fix.hero) updates.hero = fix.hero;

    // Apply update
    const { error: updateError } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movie.id);

    if (updateError) {
      console.log(chalk.red(`Error updating ${fix.title}: ${updateError.message}`));
      errors++;
    } else {
      const extraFixes = [];
      if (fix.director) extraFixes.push(`director=${fix.director}`);
      if (fix.hero) extraFixes.push(`hero=${fix.hero}`);
      const extra = extraFixes.length > 0 ? ` + ${extraFixes.join(', ')}` : '';
      console.log(chalk.green(`✓ ${fix.title} (${fix.year}) → ${fix.music_director}${extra}`));
      updated++;
    }
  }

  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.bold('📊 SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  console.log(`  Total records:  ${VERIFIED_DATA.length}`);
  console.log(`  Updated:        ${chalk.green(updated)}`);
  console.log(`  Not found:      ${chalk.yellow(notFound)}`);
  console.log(`  Errors:         ${chalk.red(errors)}`);

  console.log(chalk.green('\n✅ Done!\n'));
}

applyFixes().catch(console.error);
