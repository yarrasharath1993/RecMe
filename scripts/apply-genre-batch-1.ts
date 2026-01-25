#!/usr/bin/env npx tsx
/**
 * Apply Genre Classification Batch 1 (Entries 1-52)
 * 
 * Applies manually researched and corrected movie data including:
 * - Corrected titles
 * - Directors
 * - Genres
 * - TMDB IDs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MovieCorrection {
  id: number;
  oldTitle: string;
  newTitle: string;
  slug: string;
  director: string;
  genres: string[];
  tmdbId: number;
  year: number;
}

const corrections: MovieCorrection[] = [
  { id: 1, oldTitle: 'Ilanti Cinema Meereppudu Chusundaru', newTitle: 'Super Raja', slug: 'super-raja-2025', director: 'Super Raja', genres: ['Comedy', 'Adventure'], tmdbId: 1543431, year: 2025 },
  { id: 2, oldTitle: 'Boss', newTitle: 'Boss', slug: 'break-out-2025', director: 'Ra Hee-chan', genres: ['Action', 'Comedy'], tmdbId: 1053231, year: 2025 },
  { id: 3, oldTitle: 'Kotha Rangula Prapancham', newTitle: 'Kotha Rangula Prapancham', slug: 'kotha-rangula-prapancham-2024', director: 'Prudhvi Raj', genres: ['Romance', 'Drama'], tmdbId: 1230101, year: 2024 },
  { id: 4, oldTitle: 'Akkada Varu Ikkada Unnaru', newTitle: 'Akkada Varu Ikkada Unnaru', slug: 'akkada-varu-ikkada-unnaru-2024', director: 'Trivikram Rao Kundurthi', genres: ['Romance', 'Horror'], tmdbId: 1288497, year: 2024 },
  { id: 5, oldTitle: 'Pranaya Godari', newTitle: 'Pranaya Godari', slug: 'pranaya-godari-2024', director: 'PL Vignesh', genres: ['Romance', 'Drama'], tmdbId: 1382436, year: 2024 },
  { id: 6, oldTitle: 'Leela Vinodham', newTitle: 'Leela Vinodham', slug: 'leela-vinodham-2024', director: 'Pavan Sunkara', genres: ['Romance', 'Comedy'], tmdbId: 1396917, year: 2024 },
  { id: 7, oldTitle: 'Bhavanam', newTitle: 'Bhavanam', slug: 'bhavanam-2024', director: 'Balachary Kurella', genres: ['Horror', 'Thriller'], tmdbId: 1278149, year: 2024 },
  { id: 8, oldTitle: 'Brahmmavaram P.S. Paridhilo', newTitle: 'Brahmmavaram P.S. Paridhilo', slug: 'brahmmavaram-p-s-paridhilo-2024', director: 'Imran Sastry', genres: ['Crime', 'Mystery'], tmdbId: 1338870, year: 2024 },
  { id: 9, oldTitle: 'Subramanyam Chigurupati', newTitle: 'Salam Sainika', slug: 'subramanyam-chigurupati-2023', director: 'Subramanyam Chigurupati', genres: ['Drama', 'Action'], tmdbId: 1381313, year: 2023 },
  { id: 10, oldTitle: 'Barla Narayana', newTitle: 'Narayana & Co', slug: 'barla-narayana-2023', director: 'Murali Kishor Abburu', genres: ['Comedy', 'Family'], tmdbId: 1173156, year: 2023 },
  { id: 11, oldTitle: 'Ashtadigbandhanam', newTitle: 'Ashtadigbandhanam', slug: 'ashtadigbandhanam-2023', director: 'Baba PR', genres: ['Action', 'Thriller'], tmdbId: 1186716, year: 2023 },
  { id: 12, oldTitle: 'Ala Ila Ela', newTitle: 'Ala Ila Ela', slug: 'ala-ila-ela-2023', director: 'Raghava Dwarki', genres: ['Romance', 'Drama'], tmdbId: 1148873, year: 2023 },
  { id: 13, oldTitle: 'Salaar: Part 2 – Shouryanga Parvam', newTitle: 'Salaar: Part 2 – Shouryanga Parvam', slug: 'salaar-part-2-shouryanga-parvam-2023', director: 'Prashanth Neel', genres: ['Action', 'Crime'], tmdbId: 1131774, year: 2023 },
  { id: 14, oldTitle: 'Lakshman K Krishna', newTitle: 'Swathimuthyam', slug: 'lakshman-k-krishna-2022', director: 'Lakshman K Krishna', genres: ['Drama', 'Romance'], tmdbId: 935515, year: 2022 },
  { id: 15, oldTitle: 'Bommala Koluvu', newTitle: 'Bommala Koluvu', slug: 'bommala-koluvu-2022', director: 'Subbu Vedula', genres: ['Thriller', 'Mystery'], tmdbId: 966453, year: 2022 },
  { id: 16, oldTitle: 'Gudaputani', newTitle: 'Gudaputani', slug: 'gudaputani-2021', director: 'KM Kumar', genres: ['Mystery', 'Thriller'], tmdbId: 915152, year: 2021 },
  { id: 17, oldTitle: 'Hemanth', newTitle: 'Jhimma', slug: 'hemanth-2021', director: 'Hemant Dhome', genres: ['Drama', 'Comedy'], tmdbId: 890356, year: 2021 },
  { id: 18, oldTitle: 'Family Drama', newTitle: 'Family Drama', slug: 'family-drama-2021', director: 'Meher Tej', genres: ['Thriller', 'Crime'], tmdbId: 891222, year: 2021 },
  { id: 19, oldTitle: 'Check', newTitle: 'Check', slug: 'chandra-sekhar-yeleti-2021', director: 'Chandra Sekhar Yeleti', genres: ['Thriller', 'Action'], tmdbId: 781844, year: 2021 },
  { id: 20, oldTitle: 'Asalem Jarigandi', newTitle: 'Asalem Jarigandi', slug: 'asalem-jarigandi-2021', director: 'Raghu Ram', genres: ['Action', 'Thriller'], tmdbId: 903692, year: 2021 },
  { id: 21, oldTitle: 'Love Story', newTitle: 'Love Story', slug: 'sekhar-kammula-2021', director: 'Sekhar Kammula', genres: ['Romance', 'Drama'], tmdbId: 653601, year: 2021 },
  { id: 22, oldTitle: 'Seetimaarr', newTitle: 'Seetimaarr', slug: 'sampath-nandi-2021', director: 'Sampath Nandi', genres: ['Action', 'Drama'], tmdbId: 630138, year: 2021 },
  { id: 23, oldTitle: 'Most Eligible Bachelor', newTitle: 'Most Eligible Bachelor', slug: 'bhaskar-2021', director: 'Bhaskar', genres: ['Romance', 'Comedy'], tmdbId: 641501, year: 2021 },
  { id: 24, oldTitle: 'Thagite Thandana', newTitle: 'Thagite Thandana', slug: 'thagite-thandana-2020', director: 'Shravan Kumar K.', genres: ['Drama'], tmdbId: 778644, year: 2020 },
  { id: 25, oldTitle: 'Utthara', newTitle: 'Utthara', slug: 'utthara-2020', director: 'Thirupathi Rao', genres: ['Action', 'Thriller'], tmdbId: 691653, year: 2020 },
  { id: 26, oldTitle: 'Prematho Cheppana', newTitle: 'Prematho Cheppana', slug: 'prematho-cheppana-2019', director: 'Ravi Varma', genres: ['Romance'], tmdbId: 649666, year: 2019 },
  { id: 27, oldTitle: 'Ranasthalam', newTitle: 'Ranasthalam', slug: 'ranasthalam-2019', director: 'Sudheer Varma', genres: ['Action'], tmdbId: 413813, year: 2019 },
  { id: 28, oldTitle: 'Aa Nimisham', newTitle: 'Aa Nimisham', slug: 'aa-nimisham-2019', director: 'Kala Rajesh', genres: ['Drama'], tmdbId: 643210, year: 2019 },
  { id: 29, oldTitle: 'Sher', newTitle: 'Sher', slug: 'sher-2019', director: 'Dasari Narayana Rao', genres: ['Action'], tmdbId: 354086, year: 1984 },
  { id: 30, oldTitle: 'Danger Love Story', newTitle: 'Danger Love Story', slug: 'danger-love-story-2019', director: 'Shekar Chandra', genres: ['Romance'], tmdbId: 662664, year: 2019 },
  { id: 31, oldTitle: 'Kishore Kumar', newTitle: 'Chitralahari', slug: 'kishore-kumar-2019', director: 'Kishore Tirumala', genres: ['Drama', 'Comedy'], tmdbId: 588383, year: 2019 },
  { id: 32, oldTitle: 'Hulchul', newTitle: 'Hulchul', slug: 'hulchul-2019', director: 'Sripati Karri', genres: ['Action'], tmdbId: 653613, year: 2019 },
  { id: 33, oldTitle: 'Srinivasa Reddy', newTitle: 'Mathu Vadalara', slug: 'srinivasa-reddy-2019', director: 'Ritesh Rana', genres: ['Thriller', 'Comedy'], tmdbId: 653603, year: 2019 },
  { id: 34, oldTitle: '4 Letters', newTitle: '4 Letters', slug: '4-letters-2019', director: 'R Raghuraj', genres: ['Romance', 'Comedy'], tmdbId: 581290, year: 2019 },
  { id: 35, oldTitle: 'N.T.R: Kathanayukudu', newTitle: 'N.T.R: Kathanayukudu', slug: 'n-t-r-kathanayukudu-2019', director: 'Krish Jagarlamudi', genres: ['Biography', 'Drama'], tmdbId: 550608, year: 2019 },
  { id: 36, oldTitle: 'ch ravi kishore babu', newTitle: 'Mithunam', slug: 'ch-ravi-kishore-babu-2018', director: 'Tanikella Bharani', genres: ['Drama'], tmdbId: 148590, year: 2012 },
  { id: 37, oldTitle: 'Masakkali', newTitle: 'Masakkali', slug: 'masakkali-2018', director: 'Nabi Enugubala', genres: ['Drama'], tmdbId: 511019, year: 2018 },
  { id: 38, oldTitle: 'Juvva', newTitle: 'Juvva', slug: 'juvva-2018', director: 'Trikoti Peta', genres: ['Action', 'Drama'], tmdbId: 497475, year: 2018 },
  { id: 39, oldTitle: '2 Friends', newTitle: '2 Friends', slug: '2-friends-2018', director: 'Srinivas GLB', genres: ['Drama'], tmdbId: 525102, year: 2018 },
  { id: 40, oldTitle: 'Super Sketch', newTitle: 'Super Sketch', slug: 'super-sketch-2018', director: 'Ravi Chavali', genres: ['Thriller', 'Mystery'], tmdbId: 531230, year: 2018 },
  { id: 41, oldTitle: 'Moodu Puvulu Aaru Kayalu', newTitle: 'Moodu Puvulu Aaru Kayalu', slug: 'moodu-puvulu-aaru-kayalu-2018', director: 'Ramaswamy', genres: ['Drama'], tmdbId: 491024, year: 2018 },
  { id: 42, oldTitle: 'Karthikeya', newTitle: 'Karthikeya', slug: 'karthikeya-2018', director: 'Chandoo Mondeti', genres: ['Mystery', 'Thriller'], tmdbId: 295598, year: 2014 },
  { id: 43, oldTitle: 'Howrah Bridge', newTitle: 'Howrah Bridge', slug: 'howrah-bridge-2018', director: 'Rewon Yadu', genres: ['Romance'], tmdbId: 498312, year: 2018 },
  { id: 44, oldTitle: 'My Dear Marthandam', newTitle: 'My Dear Marthandam', slug: 'my-dear-marthandam-2018', director: 'Harish K. V.', genres: ['Comedy', 'Crime'], tmdbId: 556214, year: 2018 },
  { id: 45, oldTitle: 'Kiss Kiss Bang Bang', newTitle: 'Kiss Kiss Bang Bang', slug: 'kiss-kiss-bang-bang-2017', director: 'Karthik Medikonda', genres: ['Thriller'], tmdbId: 493012, year: 2017 },
  { id: 46, oldTitle: 'Vikram Kumar', newTitle: 'Hello!', slug: 'vikram-kumar-2017', director: 'Vikram K. Kumar', genres: ['Action', 'Romance'], tmdbId: 483324, year: 2017 },
  { id: 47, oldTitle: 'Idhi Maa Prema Katha', newTitle: 'Idhi Maa Prema Katha', slug: 'idhi-maa-prema-katha-2017', director: 'Ayodhya Karthik', genres: ['Romance'], tmdbId: 492261, year: 2017 },
  { id: 48, oldTitle: 'Soundarya Rajinikanth', newTitle: 'VIP 2 (Lalkar)', slug: 'soundarya-rajinikanth-2017', director: 'Soundarya Rajinikanth', genres: ['Action', 'Drama'], tmdbId: 445580, year: 2017 },
  { id: 49, oldTitle: 'Eeshwar', newTitle: 'Maya', slug: 'eeshwar-2017', director: 'Eeshwar', genres: ['Horror', 'Thriller'], tmdbId: 363212, year: 2017 },
  { id: 50, oldTitle: 'C/o Surya', newTitle: 'C/o Surya', slug: 'c-o-surya-2017', director: 'Suseenthiran', genres: ['Action', 'Drama'], tmdbId: 481198, year: 2017 },
  { id: 51, oldTitle: 'Nee Preme Naa Pranam', newTitle: 'Nee Preme Naa Pranam', slug: 'nee-preme-naa-pranam-2017', director: 'Rajasekhar', genres: ['Romance'], tmdbId: 451022, year: 2017 },
  { id: 52, oldTitle: 'Rishi', newTitle: 'Rishi', slug: 'rishi-2017', director: 'Bhagya Raj', genres: ['Drama'], tmdbId: 442105, year: 2017 },
];

async function applyCorrections() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           APPLY GENRE BATCH 1 CORRECTIONS (52 movies)                ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  for (const correction of corrections) {
    try {
      console.log(chalk.white(`\n${correction.id.toString().padStart(3)}. ${correction.newTitle} (${correction.year})`));
      
      // Find the movie by slug
      const { data: movie, error: fetchError } = await supabase
        .from('movies')
        .select('id, title_en, director, genres, tmdb_id')
        .eq('slug', correction.slug)
        .single();

      if (fetchError || !movie) {
        console.log(chalk.red(`     ✗ Not found by slug: ${correction.slug}`));
        failCount++;
        errors.push(`${correction.id}. ${correction.newTitle}: Not found`);
        continue;
      }

      // Show what will change
      const changes = [];
      if (movie.title_en !== correction.newTitle) changes.push(`Title: "${movie.title_en}" → "${correction.newTitle}"`);
      if (movie.director !== correction.director) changes.push(`Director: "${movie.director}" → "${correction.director}"`);
      if (JSON.stringify(movie.genres) !== JSON.stringify(correction.genres)) {
        changes.push(`Genres: ${JSON.stringify(movie.genres || [])} → ${JSON.stringify(correction.genres)}`);
      }
      if (movie.tmdb_id !== correction.tmdbId) changes.push(`TMDB: ${movie.tmdb_id || 'null'} → ${correction.tmdbId}`);

      if (changes.length === 0) {
        console.log(chalk.yellow(`     ⊘ No changes needed`));
        successCount++;
        continue;
      }

      // Update the movie
      const { error: updateError } = await supabase
        .from('movies')
        .update({
          title_en: correction.newTitle,
          director: correction.director,
          genres: correction.genres,
          tmdb_id: correction.tmdbId,
          release_year: correction.year,
        })
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`     ✗ Update failed: ${updateError.message}`));
        failCount++;
        errors.push(`${correction.id}. ${correction.newTitle}: ${updateError.message}`);
        continue;
      }

      console.log(chalk.green(`     ✓ Updated successfully`));
      changes.forEach(change => console.log(chalk.gray(`       - ${change}`)));
      successCount++;

    } catch (error) {
      console.log(chalk.red(`     ✗ Error: ${error}`));
      failCount++;
      errors.push(`${correction.id}. ${correction.newTitle}: ${error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 50));
  }

  // Summary
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                           SUMMARY                                     ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white(`  Total movies:              ${chalk.cyan(corrections.length)}`));
  console.log(chalk.green(`  ✓ Successfully updated:    ${chalk.cyan(successCount)}`));
  console.log(chalk.red(`  ✗ Failed:                  ${chalk.cyan(failCount)}`));

  if (errors.length > 0) {
    console.log(chalk.red(`\n  Errors:\n`));
    errors.forEach(err => console.log(chalk.red(`    ${err}`)));
  }

  console.log(chalk.green(`\n  ✅ Batch 1 corrections applied!\n`));
}

applyCorrections();
