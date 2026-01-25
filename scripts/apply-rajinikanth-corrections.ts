#!/usr/bin/env npx tsx
/**
 * APPLY RAJINIKANTH CORRECTIONS
 * 
 * Applies detailed corrections provided by user review:
 * 1. Fix role assignments (Ninaithaale Inikkum, Chandramukhi)
 * 2. Update directors for movies incorrectly listing Rajinikanth as director
 * 3. Update cast information for newly added movies
 * 4. Fix Valli (1993) director to K. Natraj
 * 
 * Usage:
 *   npx tsx scripts/apply-rajinikanth-corrections.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import chalk from 'chalk';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MovieCorrection {
  movieId: string;
  title: string;
  fixes: {
    hero?: string;
    heroine?: string;
    director?: string;
    producer?: string | null;
    language?: string;
    supporting_cast?: string[];
    music_director?: string;
  };
  description: string;
}

// Corrections based on user review
const CORRECTIONS: MovieCorrection[] = [
  // Role fixes
  {
    movieId: '53183cdc-9aec-4d6a-9489-240077ed3532',
    title: 'Ninaithaale Inikkum',
    fixes: {
      hero: 'Kamal Haasan, Rajinikanth', // Both are heroes
    },
    description: 'Both Kamal Haasan and Rajinikanth are heroes',
  },
  {
    movieId: '4690dfc3-6723-45fa-b8fa-a5164b3ef8bb',
    title: 'Chandramukhi',
    fixes: {
      hero: 'Rajinikanth',
      heroine: 'Jyothika', // Jyothika is the heroine
    },
    description: 'Rajinikanth is hero, Jyothika is heroine',
  },
  // Director fixes for movies incorrectly listing Rajinikanth as director
  {
    movieId: '3fb86635-792c-474c-9351-b633cb31dd3f',
    title: 'VIP 2 (Lalkar)',
    fixes: {
      director: 'Soundarya Rajinikanth', // Soundarya/Aishwarya directed
      hero: 'Rajinikanth',
    },
    description: 'Soundarya Rajinikanth directed, Rajinikanth is hero',
  },
  {
    movieId: '3923b89a-e447-4b80-8ac2-e5e7fdfc230a',
    title: 'Velaiyilla Pattathari 2',
    fixes: {
      director: 'Soundarya Rajinikanth',
      hero: 'Rajinikanth',
    },
    description: 'Soundarya Rajinikanth directed, Rajinikanth is hero',
  },
  {
    movieId: 'f858a20c-d9de-42e4-b647-3f031f9daa12',
    title: 'Kochadaiiyaan',
    fixes: {
      director: 'Soundarya Rajinikanth',
      hero: 'Rajinikanth',
    },
    description: 'Soundarya Rajinikanth directed, Rajinikanth is hero',
  },
  {
    movieId: 'dcd4f1d7-01fe-4ed9-b986-8f56df05d866',
    title: '3',
    fixes: {
      director: 'Aishwarya Rajinikanth',
      hero: 'Rajinikanth',
    },
    description: 'Aishwarya Rajinikanth directed, Rajinikanth is hero',
  },
  {
    movieId: '91bf0fa8-49b9-4068-b125-544441217141',
    title: 'Sri Satyanarayana Mahathyam',
    fixes: {
      director: 'K. Raghavendra Rao', // S. Rajinikanth (different person) or K. Raghavendra Rao
      hero: 'Rajinikanth',
    },
    description: 'K. Raghavendra Rao directed, Rajinikanth is hero',
  },
  {
    movieId: '202c48fa-d4a0-41cd-97a5-9b9a2136717d',
    title: 'Sati Sulochana (Indrajeet)',
    fixes: {
      director: 'K. Raghavendra Rao',
      hero: 'Rajinikanth',
    },
    description: 'K. Raghavendra Rao directed, Rajinikanth is hero',
  },
  {
    movieId: '1ecfbea8-1abb-4404-b023-778e74174417',
    title: 'Sree Ramanjaneya Yuddham',
    fixes: {
      director: 'K. Raghavendra Rao',
      hero: 'Rajinikanth',
    },
    description: 'K. Raghavendra Rao directed, Rajinikanth is hero',
  },
  {
    movieId: 'df6461e3-89c0-4619-a341-35fe616e3506',
    title: 'Chenchu Lakshmi',
    fixes: {
      director: 'K. Raghavendra Rao',
      hero: 'Rajinikanth',
    },
    description: 'K. Raghavendra Rao directed, Rajinikanth is hero',
  },
];

// Movie data with cast/crew information
interface MovieData {
  title: string;
  year: number;
  hero: string;
  heroine?: string;
  director: string;
  music_director?: string;
  supporting_cast?: string[];
  producer?: string;
  notes?: string;
}

const MOVIE_DATA: MovieData[] = [
  {
    title: 'Apoorva Raagangal',
    year: 1975,
    hero: 'Kamal Haasan, Rajinikanth',
    director: 'K. Balachander',
    music_director: 'M. S. Viswanathan',
    supporting_cast: ['Srividya', 'Major Sundarrajan'],
  },
  {
    title: 'Avargal',
    year: 1977,
    hero: 'Kamal Haasan, Rajinikanth',
    heroine: 'Sujatha',
    director: 'K. Balachander',
    music_director: 'M. S. Viswanathan',
  },
  {
    title: '16 Vayathinile',
    year: 1977,
    hero: 'Kamal Haasan, Rajinikanth',
    heroine: 'Sridevi',
    director: 'Bharathiraja',
    music_director: 'Ilaiyaraaja',
    notes: 'Rajinikanth as Parattai',
  },
  {
    title: 'Bairavi',
    year: 1978,
    hero: 'Rajinikanth',
    heroine: 'Sripriya',
    director: 'M. Bhaskar',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Geetha'],
    notes: 'First solo lead',
  },
  {
    title: 'Mullum Malarum',
    year: 1978,
    hero: 'Rajinikanth',
    heroine: 'Shoba',
    director: 'Mahendran',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Sarath Babu', 'Fatafat Jayalaxmi'],
  },
  {
    title: 'Aval Appadithan',
    year: 1978,
    hero: 'Kamal Haasan, Rajinikanth',
    heroine: 'Sripriya',
    director: 'C. Rudhraiah',
    music_director: 'Ilaiyaraaja',
  },
  {
    title: 'Allauddinum Albhutha Vilakkum',
    year: 1979,
    hero: 'Kamal Haasan, Rajinikanth',
    heroine: 'Jayabharathi',
    director: 'I. V. Sasi',
    music_director: 'G. Devarajan',
  },
  {
    title: 'Billa',
    year: 1980,
    hero: 'Rajinikanth',
    heroine: 'Sripriya',
    director: 'R. Krishnamurthy',
    music_director: 'M. S. Viswanathan',
    supporting_cast: ['K. Balaji', 'Major Sundarrajan'],
  },
  {
    title: 'Murattu Kaalai',
    year: 1980,
    hero: 'Rajinikanth',
    heroine: 'Rati Agnihotri',
    director: 'S. P. Muthuraman',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Jaishankar', 'Suruli Rajan'],
  },
  {
    title: 'Thillu Mullu',
    year: 1981,
    hero: 'Rajinikanth',
    heroine: 'Madhavi',
    director: 'K. Balachander',
    music_director: 'M. S. Viswanathan',
    supporting_cast: ['Thengai Srinivasan'],
  },
  {
    title: 'Moondru Mugam',
    year: 1982,
    hero: 'Rajinikanth',
    heroine: 'Radhika',
    director: 'A. Jagannathan',
    music_director: 'Shankar–Ganesh',
    supporting_cast: ['Silk Smitha'],
    notes: 'Triple Role',
  },
  {
    title: 'Andhaa Kaanoon',
    year: 1983,
    hero: 'Rajinikanth, Amitabh Bachchan',
    heroine: 'Hema Malini',
    director: 'T. Rama Rao',
    music_director: 'Laxmikant–Pyarelal',
    supporting_cast: ['Reena Roy'],
  },
  {
    title: 'Nallavanukku Nallavan',
    year: 1984,
    hero: 'Rajinikanth',
    heroine: 'Radhika',
    director: 'S. P. Muthuraman',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Karthik', 'Tulasi'],
  },
  {
    title: 'Sri Raghavendrar',
    year: 1985,
    hero: 'Rajinikanth',
    heroine: 'Lakshmi',
    director: 'S. P. Muthuraman',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Vishnuvardhan', 'Ambika'],
  },
  {
    title: 'Geraftaar',
    year: 1985,
    hero: 'Kamal Haasan, Rajinikanth, Amitabh Bachchan',
    heroine: 'Poonam Dhillon',
    director: 'Prayag Raj',
    music_director: 'Bappi Lahiri',
  },
  {
    title: 'Padikkadavan',
    year: 1985,
    hero: 'Rajinikanth',
    heroine: 'Ambika',
    director: 'R. Krishnamurthy',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Sivaji Ganesan'],
  },
  {
    title: 'Mr. Bharath',
    year: 1986,
    hero: 'Rajinikanth',
    heroine: 'Ambika',
    director: 'S. P. Muthuraman',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Sathyaraj', 'Goundamani'],
  },
  {
    title: 'Dosti Dushmani',
    year: 1986,
    hero: 'Jeetendra, Rajinikanth, Rishi Kapoor',
    heroine: 'Bhanupriya',
    director: 'T. Rama Rao',
    music_director: 'Laxmikant–Pyarelal',
  },
  {
    title: 'Velaikaran',
    year: 1987,
    hero: 'Rajinikanth',
    heroine: 'Amala',
    director: 'S. P. Muthuraman',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Sarath Babu', 'Pallavi'],
  },
  {
    title: 'Manithan',
    year: 1987,
    hero: 'Rajinikanth',
    heroine: 'Rubini',
    director: 'S. P. Muthuraman',
    music_director: 'Chandrabose',
    supporting_cast: ['Raghuvaran', 'Sripriya'],
  },
  {
    title: 'Guru Sishyan',
    year: 1988,
    hero: 'Rajinikanth, Prabhu',
    heroine: 'Seetha',
    director: 'S. P. Muthuraman',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Gautami'],
  },
  {
    title: 'Dharmathin Thalaivan',
    year: 1988,
    hero: 'Rajinikanth, Prabhu',
    heroine: 'Kushboo',
    director: 'S. P. Muthuraman',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Suhasini'],
  },
  {
    title: 'Annaamalai',
    year: 1992,
    hero: 'Rajinikanth',
    heroine: 'Kushboo',
    director: 'Suresh Krissna',
    music_director: 'Deva',
    supporting_cast: ['Sarath Babu', 'Radha Ravi'],
  },
  {
    title: 'Valli',
    year: 1993,
    hero: 'Rajinikanth',
    heroine: 'Priya Raman',
    director: 'K. Natraj', // IMPORTANT: K. Natraj directed, not Rajinikanth
    producer: 'Rajinikanth',
    music_director: 'Ilaiyaraaja',
    supporting_cast: ['Harish Kumar'],
    notes: 'Rajinikanth produced and wrote story/screenplay, K. Natraj directed. Extended cameo role.',
  },
  {
    title: 'Baashha',
    year: 1995,
    hero: 'Rajinikanth',
    heroine: 'Nagma',
    director: 'Suresh Krissna',
    music_director: 'Deva',
    supporting_cast: ['Raghuvaran', 'Janagaraj'],
  },
  {
    title: 'Sivaji',
    year: 2007,
    hero: 'Rajinikanth',
    heroine: 'Shriya Saran',
    director: 'S. Shankar',
    music_director: 'A. R. Rahman',
    supporting_cast: ['Vivek', 'Suman'],
  },
  {
    title: 'Ra.One',
    year: 2011,
    hero: 'Shah Rukh Khan, Rajinikanth',
    heroine: 'Kareena Kapoor',
    director: 'Anubhav Sinha',
    music_director: 'Vishal–Shekhar',
    notes: 'Rajinikanth cameo as Chitti',
  },
  {
    title: 'Annaatthe',
    year: 2021,
    hero: 'Rajinikanth',
    heroine: 'Nayanthara',
    director: 'Siva',
    music_director: 'D. Imman',
    supporting_cast: ['Keerthy Suresh', 'Kushboo', 'Meena'],
  },
];

async function applyCorrections(execute: boolean = false): Promise<void> {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  APPLYING RAJINIKANTH CORRECTIONS'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  if (!execute) {
    console.log(chalk.yellow('⚠️  Dry run mode - no changes will be made'));
    console.log(chalk.yellow('   Use --execute flag to apply fixes\n'));
  }

  let fixedCount = 0;
  let errorCount = 0;

  // Apply corrections from audit issues
  for (const correction of CORRECTIONS) {
    console.log(chalk.cyan(`\nFixing: ${correction.title}`));
    console.log(chalk.gray(`  ${correction.description}`));
    console.log(chalk.gray(`  Changes: ${JSON.stringify(correction.fixes, null, 2)}`));

    if (execute) {
      const { error } = await supabase
        .from('movies')
        .update(correction.fixes)
        .eq('id', correction.movieId);

      if (error) {
        console.error(chalk.red(`  ❌ Error: ${error.message}`));
        errorCount++;
      } else {
        console.log(chalk.green(`  ✅ Fixed`));
        fixedCount++;
      }
    } else {
      console.log(chalk.gray(`  [DRY RUN] Would apply: ${JSON.stringify(correction.fixes)}`));
      fixedCount++;
    }
  }

  // Update movie data for newly added movies
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  UPDATING MOVIE CAST/CREW DATA'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  for (const movieData of MOVIE_DATA) {
    // Find movie by title and year
    const { data: movie } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero, heroine, director, music_director')
      .eq('title_en', movieData.title)
      .eq('release_year', movieData.year)
      .single();

    if (!movie) {
      console.log(chalk.yellow(`⏭️  Movie not found: ${movieData.title} (${movieData.year})`));
      continue;
    }

    const updates: any = {};
    let needsUpdate = false;

    // Update hero if different
    if (movieData.hero && movie.hero !== movieData.hero) {
      updates.hero = movieData.hero;
      needsUpdate = true;
    }

    // Update heroine if provided and different
    if (movieData.heroine && movie.heroine !== movieData.heroine) {
      updates.heroine = movieData.heroine;
      needsUpdate = true;
    }

    // Update director if different
    if (movieData.director && movie.director !== movieData.director) {
      updates.director = movieData.director;
      needsUpdate = true;
    }

    // Update music director if provided
    if (movieData.music_director && movie.music_director !== movieData.music_director) {
      updates.music_director = movieData.music_director;
      needsUpdate = true;
    }

    // Update producer if provided
    if (movieData.producer !== undefined) {
      updates.producer = movieData.producer;
      needsUpdate = true;
    }

    // Update supporting cast if provided
    if (movieData.supporting_cast && movieData.supporting_cast.length > 0) {
      updates.supporting_cast = movieData.supporting_cast;
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log(chalk.cyan(`\nUpdating: ${movieData.title} (${movieData.year})`));
      console.log(chalk.gray(`  Updates: ${JSON.stringify(updates, null, 2)}`));
      if (movieData.notes) {
        console.log(chalk.gray(`  Note: ${movieData.notes}`));
      }

      if (execute) {
        const { error } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', movie.id);

        if (error) {
          console.error(chalk.red(`  ❌ Error: ${error.message}`));
          errorCount++;
        } else {
          console.log(chalk.green(`  ✅ Updated`));
          fixedCount++;
        }
      } else {
        console.log(chalk.gray(`  [DRY RUN] Would apply: ${JSON.stringify(updates)}`));
        fixedCount++;
      }
    } else {
      console.log(chalk.gray(`⏭️  No updates needed: ${movieData.title} (${movieData.year})`));
    }
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  if (execute) {
    console.log(chalk.green(`✅ Fixed/Updated: ${fixedCount}`));
    if (errorCount > 0) {
      console.log(chalk.red(`❌ Errors: ${errorCount}`));
    }
  } else {
    console.log(chalk.yellow(`Would fix/update: ${fixedCount}`));
    console.log(chalk.yellow(`\n💡 Run with --execute to apply fixes`));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  await applyCorrections(execute);
  console.log(chalk.green.bold('\n✨ Done!\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
