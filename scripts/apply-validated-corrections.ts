#!/usr/bin/env npx tsx
/**
 * Apply Validated Corrections
 * 
 * Apply user's manual corrections from RECENT-MOVIES-BATCH-1.tsv validation
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

interface Correction {
  oldTitle?: string;
  newTitle: string;
  year: number;
  director?: string;
  hero?: string;
  heroine?: string;
  genres?: string[];
  notes: string;
}

const corrections: Correction[] = [
  // Title corrections
  {
    oldTitle: 'Dhanraj',
    newTitle: 'Ramam Raghavam',
    year: 2025,
    director: 'Dhanraj Koranani',
    hero: 'Samuthirakani',
    heroine: 'Mokksha',
    genres: ['Drama', 'Thriller'],
    notes: 'Corrected title from director name to actual movie title'
  },
  {
    oldTitle: 'Super Raja',
    newTitle: 'Ilanti Cinema Meereppudu Chusundaru',
    year: 2025,
    director: 'Super Raja',
    hero: 'Super Raja',
    heroine: 'Chandana Palanki',
    genres: ['Drama'],
    notes: 'Corrected title - unique single-shot film'
  },
  {
    oldTitle: 'Break Out',
    newTitle: 'Boss',
    year: 2025,
    director: 'Ra Hee-chan',
    hero: 'Jo Woo-jin',
    heroine: '황우슬혜',
    genres: ['Action', 'Comedy'],
    notes: 'Corrected Korean film title'
  },
  {
    oldTitle: 'Praveen Kumar VSS',
    newTitle: 'Prasannavadanam',
    year: 2024,
    director: 'Sukumar Bandreddi',
    hero: 'Suhas',
    heroine: 'Ruhani Sharma',
    genres: ['Thriller'],
    notes: 'Corrected title from director name'
  },
  {
    oldTitle: 'Chandra Sekhar Yeleti',
    newTitle: 'Check',
    year: 2021,
    director: 'Chandra Sekhar Yeleti',
    hero: 'Nithiin',
    heroine: 'Rakul Preet Singh',
    genres: ['Thriller', 'Drama'],
    notes: 'Fixed title/director swap'
  },
  {
    oldTitle: 'Sampath Nandi',
    newTitle: 'Seetimaarr',
    year: 2021,
    director: 'Sampath Nandi',
    hero: 'Gopichand',
    heroine: 'Tamannaah Bhatia',
    genres: ['Action', 'Sports'],
    notes: 'Fixed title/director swap'
  },
  {
    oldTitle: 'Sekhar Kammula',
    newTitle: 'Love Story',
    year: 2021,
    director: 'Sekhar Kammula',
    hero: 'Naga Chaitanya Akkineni',
    heroine: 'Sai Pallavi',
    genres: ['Romance', 'Drama'],
    notes: 'Fixed title/director swap'
  },
  {
    oldTitle: 'Bhaskar',
    newTitle: 'Most Eligible Bachelor',
    year: 2021,
    director: 'Bhaskar',
    hero: 'Akhil Akkineni',
    heroine: 'Pooja Hegde',
    genres: ['Romance', 'Comedy'],
    notes: 'Fixed title/director swap'
  },
  
  // Director/Cast corrections only
  {
    newTitle: 'Bench Life',
    year: 2024,
    director: 'Manasa Sharma',
    hero: 'Vaibhav',
    heroine: 'Ritika Singh',
    genres: ['Comedy', 'Drama'],
    notes: 'Corrected director name'
  },
  {
    newTitle: 'Jilebi',
    year: 2023,
    director: 'K. Vijaya Bhaskar',
    hero: 'Sree Kamal',
    heroine: 'Shivani Rajashekar',
    genres: ['Comedy'],
    notes: 'Corrected director and cast'
  },
  {
    newTitle: 'Srikakulam Sherlock Holmes',
    year: 2024,
    director: 'Writer Mohan',
    hero: 'Vennela Kishore',
    heroine: 'Aditi Gautam',
    genres: ['Comedy', 'Thriller'],
    notes: 'Corrected hero to Vennela Kishore'
  },
  {
    newTitle: 'Vanaveera',
    year: 2026,
    director: 'Avinash Thiruveedhula',
    hero: 'Avinash Thiruveedhula',
    heroine: 'Simran Choudhary',
    genres: ['Action', 'Mythology'],
    notes: 'Updated genre to Mythological Action'
  }
];

async function applyCorrections() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              APPLYING VALIDATED CORRECTIONS                           ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  let successCount = 0;
  let errorCount = 0;

  for (const correction of corrections) {
    const searchTitle = correction.oldTitle || correction.newTitle;
    
    console.log(chalk.cyan(`\n  Processing: ${searchTitle} (${correction.year})`));
    console.log(chalk.gray(`  Note: ${correction.notes}\n`));

    // Find the movie
    const { data: movies, error: searchError } = await supabase
      .from('movies')
      .select('id, slug, title_en, director, hero, heroine, genres')
      .eq('release_year', correction.year)
      .ilike('title_en', `%${searchTitle}%`);

    if (searchError || !movies || movies.length === 0) {
      console.log(chalk.red(`    ❌ Movie not found: ${searchTitle}\n`));
      errorCount++;
      continue;
    }

    const movie = movies[0];
    console.log(chalk.gray(`    Found: ${movie.title_en} (ID: ${movie.id})`));

    // Build update object
    const updates: any = {};
    
    if (correction.oldTitle && correction.newTitle !== movie.title_en) {
      updates.title_en = correction.newTitle;
      console.log(chalk.yellow(`    → Title: "${movie.title_en}" → "${correction.newTitle}"`));
    }
    
    if (correction.director && correction.director !== movie.director) {
      updates.director = correction.director;
      console.log(chalk.yellow(`    → Director: "${movie.director || 'None'}" → "${correction.director}"`));
    }
    
    if (correction.hero && correction.hero !== movie.hero) {
      updates.hero = correction.hero;
      console.log(chalk.yellow(`    → Hero: "${movie.hero || 'None'}" → "${correction.hero}"`));
    }
    
    if (correction.heroine && correction.heroine !== movie.heroine) {
      updates.heroine = correction.heroine;
      console.log(chalk.yellow(`    → Heroine: "${movie.heroine || 'None'}" → "${correction.heroine}"`));
    }
    
    if (correction.genres) {
      updates.genres = correction.genres;
      const oldGenres = movie.genres && movie.genres.length > 0 ? movie.genres.join(', ') : 'None';
      console.log(chalk.yellow(`    → Genres: "${oldGenres}" → "${correction.genres.join(', ')}"`));
    }

    // Apply updates if there are any
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`    ❌ Error: ${updateError.message}\n`));
        errorCount++;
      } else {
        console.log(chalk.green(`    ✅ Updated successfully\n`));
        successCount++;
      }
    } else {
      console.log(chalk.gray(`    ℹ️  No changes needed\n`));
    }
  }

  // Summary
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  SUMMARY\n'));

  console.log(chalk.green(`  ✅ Success:        ${successCount}`));
  console.log(chalk.red(`  ❌ Errors:         ${errorCount}`));
  console.log(chalk.blue.bold(`  ━━━━━━━━━━━━━━━━━━━━`));
  console.log(chalk.blue(`  Total Processed: ${corrections.length}\n`));

  if (successCount > 0) {
    console.log(chalk.green(`  🎉 ${successCount} movies corrected based on manual validation!\n`));
  }

  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════\n'));
}

async function main() {
  await applyCorrections();
}

main().catch(console.error);
