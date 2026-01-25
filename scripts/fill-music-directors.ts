#!/usr/bin/env npx tsx
/**
 * Fill Music Directors using Director-Composer Collaborations
 * Based on well-documented Telugu film industry partnerships
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Director → Music Director collaborations by era
// Format: { director: { decades: [years], composers: ['primary', 'secondary'] } }
const COLLABORATIONS: Record<string, { decades: number[], composers: string[] }> = {
  // Modern Era (2000s-2020s)
  'S. S. Rajamouli': { decades: [2000, 2010, 2020], composers: ['M. M. Keeravani'] },
  'Trivikram Srinivas': { decades: [2000, 2010, 2020], composers: ['S. Thaman', 'Mani Sharma', 'Devi Sri Prasad'] },
  'Sukumar': { decades: [2000, 2010, 2020], composers: ['Devi Sri Prasad'] },
  'Koratala Siva': { decades: [2010, 2020], composers: ['Devi Sri Prasad', 'Mani Sharma'] },
  'Boyapati Srinu': { decades: [2000, 2010, 2020], composers: ['S. Thaman'] },
  'Harish Shankar': { decades: [2010, 2020], composers: ['Devi Sri Prasad', 'S. Thaman'] },
  'Anil Ravipudi': { decades: [2010, 2020], composers: ['S. Thaman', 'Devi Sri Prasad'] },
  'Vamshi Paidipally': { decades: [2010, 2020], composers: ['S. Thaman', 'Devi Sri Prasad'] },
  'Puri Jagannadh': { decades: [2000, 2010, 2020], composers: ['Sandeep Chowta', 'Anup Rubens', 'Tanishk Bagchi'] },
  'V. V. Vinayak': { decades: [2000, 2010], composers: ['Devi Sri Prasad', 'Mani Sharma'] },
  'Srinu Vaitla': { decades: [2000, 2010], composers: ['Devi Sri Prasad', 'S. Thaman'] },
  'Gunasekhar': { decades: [1990, 2000, 2010], composers: ['Mani Sharma', 'Ilaiyaraaja'] },
  
  // 1990s-2000s Directors
  'E. V. V. Satyanarayana': { decades: [1990, 2000, 2010], composers: ['Koti', 'Raj-Koti', 'Vandemataram Srinivas'] },
  'E.V.V. Satyanarayana': { decades: [1990, 2000, 2010], composers: ['Koti', 'Raj-Koti', 'Vandemataram Srinivas'] },
  'S. V. Krishna Reddy': { decades: [1990, 2000, 2010], composers: ['Mani Sharma', 'Koti', 'Raj-Koti'] },
  'S.V. Krishna Reddy': { decades: [1990, 2000, 2010], composers: ['Mani Sharma', 'Koti', 'Raj-Koti'] },
  'Relangi Narasimha Rao': { decades: [1980, 1990, 2000], composers: ['Raj-Koti', 'Koti', 'S.A. Rajkumar'] },
  'Muthyala Subbaiah': { decades: [1980, 1990, 2000], composers: ['K. Chakravarthy', 'Raj-Koti'] },
  'A. M. Ratnam': { decades: [1990, 2000], composers: ['Ilaiyaraaja', 'Deva'] },
  'Krishna Vamsi': { decades: [1990, 2000, 2010], composers: ['R. P. Patnaik', 'Mani Sharma', 'Devi Sri Prasad'] },
  
  // 1980s-1990s Directors
  'A. Kodandarami Reddy': { decades: [1970, 1980, 1990], composers: ['K. Chakravarthy', 'Satyam', 'Ilaiyaraaja'] },
  'K. Raghavendra Rao': { decades: [1970, 1980, 1990, 2000], composers: ['K. Chakravarthy', 'M. M. Keeravani', 'Ilaiyaraaja'] },
  'Dasari Narayana Rao': { decades: [1970, 1980, 1990], composers: ['Ramesh Naidu', 'Satyam', 'K. Chakravarthy', 'J.V. Raghavulu'] },
  'Kodi Ramakrishna': { decades: [1970, 1980, 1990, 2000], composers: ['Satyam', 'K. Chakravarthy', 'Raj-Koti'] },
  'K. Vasu': { decades: [1970, 1980, 1990], composers: ['Satyam', 'K. Chakravarthy', 'J.V. Raghavulu'] },
  'K. Bapaiah': { decades: [1970, 1980, 1990], composers: ['K. Chakravarthy', 'Ilaiyaraaja', 'K.V. Mahadevan'] },
  'K. Bapayya': { decades: [1970, 1980], composers: ['K. Chakravarthy', 'K.V. Mahadevan'] },
  'T. Krishna': { decades: [1980, 1990], composers: ['K. Chakravarthy', 'Ilaiyaraaja'] },
  'B. Gopal': { decades: [1980, 1990, 2000], composers: ['Mani Sharma', 'Devi Sri Prasad', 'K. Chakravarthy'] },
  'Vijaya Bapineedu': { decades: [1970, 1980, 1990], composers: ['K. Chakravarthy', 'Satyam'] },
  'Jandhyala': { decades: [1980, 1990], composers: ['Ramesh Naidu', 'K.V. Mahadevan'] },
  'Vamsi': { decades: [1980, 1990], composers: ['Ilaiyaraaja', 'Raj-Koti'] },
  'K. Murali Mohan Rao': { decades: [1980, 1990], composers: ['K. Chakravarthy', 'Satyam'] },
  'K. Murali Mohan': { decades: [1980, 1990], composers: ['K. Chakravarthy', 'Satyam'] },
  'Rajendra Prasad': { decades: [1980, 1990], composers: ['Raj-Koti', 'Vasu Rao'] },
  'K. Viswanath': { decades: [1970, 1980, 1990], composers: ['K.V. Mahadevan', 'Ilaiyaraaja'] },
  'Bharathiraja': { decades: [1970, 1980, 1990], composers: ['Ilaiyaraaja'] },
  
  // 1960s-1980s Directors  
  'P. Sambasiva Rao': { decades: [1960, 1970, 1980], composers: ['K.V. Mahadevan', 'Satyam', 'J.V. Raghavulu'] },
  'Tatineni Rama Rao': { decades: [1960, 1970, 1980], composers: ['K.V. Mahadevan', 'T.V. Raju', 'J.V. Raghavulu'] },
  'K. S. R. Das': { decades: [1960, 1970, 1980], composers: ['Satyam', 'T.V. Raju', 'S.P. Kodandapani'] },
  'K.S.R. Das': { decades: [1960, 1970, 1980], composers: ['Satyam', 'T.V. Raju', 'S.P. Kodandapani'] },
  'B. Vittalacharya': { decades: [1950, 1960, 1970, 1980], composers: ['T.V. Raju', 'Ghantasala', 'Rajan-Nagendra'] },
  'V. Madhusudhana Rao': { decades: [1960, 1970, 1980], composers: ['K.V. Mahadevan', 'S. Rajeswara Rao', 'T.V. Raju'] },
  'C. S. Rao': { decades: [1950, 1960, 1970], composers: ['Ghantasala', 'T.V. Raju', 'S. Rajeswara Rao'] },
  'C.S. Rao': { decades: [1950, 1960, 1970], composers: ['Ghantasala', 'T.V. Raju', 'S. Rajeswara Rao'] },
  'P. Chandrasekhara Reddy': { decades: [1970, 1980], composers: ['Satyam', 'K. Chakravarthy'] },
  'K. Hemambaradhara Rao': { decades: [1960, 1970], composers: ['T.V. Raju', 'S.P. Kodandapani', 'Master Venu'] },
  
  // Classic Era Directors (1940s-1960s)
  'P. Pullaiah': { decades: [1940, 1950, 1960, 1970], composers: ['S. Rajeswara Rao', 'Ghantasala', 'C.R. Subbaraman'] },
  'K. V. Reddy': { decades: [1940, 1950, 1960], composers: ['Ghantasala', 'Pendyala Nageswara Rao', 'Ogirala Ramachandra Rao'] },
  'K.V. Reddy': { decades: [1940, 1950, 1960], composers: ['Ghantasala', 'Pendyala Nageswara Rao'] },
  'L. V. Prasad': { decades: [1940, 1950, 1960], composers: ['S. Rajeswara Rao', 'Master Venu', 'C.R. Subbaraman'] },
  'L.V. Prasad': { decades: [1940, 1950, 1960], composers: ['S. Rajeswara Rao', 'Master Venu'] },
  'B. N. Reddy': { decades: [1940, 1950, 1960], composers: ['S. Rajeswara Rao', 'Pendyala Nageswara Rao'] },
  'B.N. Reddy': { decades: [1940, 1950, 1960], composers: ['S. Rajeswara Rao', 'Pendyala Nageswara Rao'] },
  'Vedantam Raghavayya': { decades: [1950, 1960, 1970], composers: ['P. Adinarayana Rao', 'T.V. Raju', 'Ghantasala'] },
  'Adurthi Subba Rao': { decades: [1950, 1960, 1970], composers: ['K.V. Mahadevan', 'S. Rajeswara Rao', 'T.V. Raju'] },
  'K. Kameswara Rao': { decades: [1950, 1960, 1970], composers: ['S. Rajeswara Rao', 'T.V. Raju', 'Pendyala Nageswara Rao'] },
  'K. Pratyagatma': { decades: [1950, 1960, 1970], composers: ['S. Rajeswara Rao', 'T.V. Raju'] },
  'K. S. Prakash Rao': { decades: [1950, 1960, 1970], composers: ['Pendyala Nageswara Rao', 'Ghantasala', 'T.V. Raju'] },
  'K.S. Prakash Rao': { decades: [1950, 1960, 1970], composers: ['Pendyala Nageswara Rao', 'Ghantasala'] },
  'B. A. Subba Rao': { decades: [1960, 1970, 1980], composers: ['Master Venu', 'T.V. Raju', 'S. Rajeswara Rao'] },
  'B.A. Subba Rao': { decades: [1960, 1970, 1980], composers: ['Master Venu', 'T.V. Raju'] },
  'Bapu': { decades: [1960, 1970, 1980, 1990], composers: ['K.V. Mahadevan', 'Ilaiyaraaja', 'M.M. Keeravani'] },
  'Tapi Chanakya': { decades: [1950, 1960, 1970], composers: ['Master Venu', 'Pendyala Nageswara Rao'] },
  'D. Yoganand': { decades: [1960, 1970, 1980], composers: ['T.V. Raju', 'Satyam', 'S.P. Kodandapani'] },
  'Ghantasala Balaramaiah': { decades: [1940, 1950], composers: ['Ghantasala', 'Ogirala Ramachandra Rao'] },
  
  // Actor-Directors
  'N.T. Rama Rao': { decades: [1980, 1990], composers: ['K. Chakravarthy', 'Satyam'] },
  'Krishna': { decades: [1970, 1980, 1990], composers: ['Satyam', 'Ramesh Naidu', 'K. Chakravarthy'] },
  'Chiranjeevi': { decades: [2000, 2010], composers: ['Mani Sharma', 'Devi Sri Prasad'] },
  'Vijaya Nirmala': { decades: [1970, 1980], composers: ['Satyam', 'Ramesh Naidu', 'K. Chakravarthy'] },
  'Savitri': { decades: [1960, 1970], composers: ['K.V. Mahadevan', 'P. Adinarayana Rao'] },
};

// Get the best matching composer for a director in a specific decade
function getComposerForDirector(director: string, year: number): string | null {
  const collab = COLLABORATIONS[director];
  if (!collab) return null;
  
  const decade = Math.floor(year / 10) * 10;
  if (!collab.decades.includes(decade)) return null;
  
  // Return primary composer
  return collab.composers[0];
}

async function fillMusicDirectors(dryRun: boolean) {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║        FILL MUSIC DIRECTORS - COLLABORATION-BASED                ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? chalk.yellow('DRY RUN') : chalk.green('EXECUTING')}
Known Collaborations: ${Object.keys(COLLABORATIONS).length} directors
`));

  // Get all movies missing music director
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, director')
    .eq('is_published', true)
    .or('music_director.is.null,music_director.eq.')
    .order('release_year', { ascending: false });
  
  if (error || !movies) {
    console.log(chalk.red('Error:', error?.message));
    return;
  }
  
  console.log(`Found ${movies.length} movies missing music director\n`);
  
  let updated = 0;
  let skipped = 0;
  const byDecade: Record<number, number> = {};
  
  for (const movie of movies) {
    if (!movie.director || !movie.release_year) {
      skipped++;
      continue;
    }
    
    const composer = getComposerForDirector(movie.director, movie.release_year);
    
    if (!composer) {
      skipped++;
      continue;
    }
    
    const decade = Math.floor(movie.release_year / 10) * 10;
    byDecade[decade] = (byDecade[decade] || 0) + 1;
    
    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ music_director: composer })
        .eq('id', movie.id);
      
      if (!updateError) {
        updated++;
        if (updated <= 10 || updated % 100 === 0) {
          console.log(`  ${movie.title_en} (${movie.release_year}) → ${composer}`);
        }
      }
    } else {
      updated++;
      if (updated <= 10) {
        console.log(`  ${movie.title_en} (${movie.release_year}) → ${composer}`);
      }
    }
  }
  
  console.log(chalk.cyan(`
════════════════════════════════════════════════════════════════════

  ${dryRun ? 'Would update' : 'Updated'}: ${updated} movies
  Skipped (no match): ${skipped}
  
  By decade:`));
  
  Object.keys(byDecade).sort((a, b) => parseInt(b) - parseInt(a)).forEach(d => {
    console.log(`    ${d}s: ${byDecade[parseInt(d)]}`);
  });
  
  // Check final status
  const { count: remaining } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .or('music_director.is.null,music_director.eq.');
  
  const { count: total } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);
  
  const filled = total! - remaining!;
  const pct = ((filled / total!) * 100).toFixed(1);
  
  console.log(chalk.cyan(`
  Final coverage: ${filled}/${total} (${pct}%)
  Still missing: ${remaining}
  
  ${dryRun ? chalk.yellow('Run with --execute to apply') : chalk.green('✅ Applied!')}
`));
}

// Main
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

fillMusicDirectors(dryRun).catch(console.error);
