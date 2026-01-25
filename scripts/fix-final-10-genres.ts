#!/usr/bin/env npx tsx
/**
 * Fix Final 10 Non-Standard Genres
 * 
 * Quick fix for the last remaining edge cases
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Final genre mappings
const FINAL_MAPPINGS: Record<string, string | null> = {
  'Classic': 'Drama',           // Classic films are typically dramas
  'Biographical': 'Drama',      // Missed in earlier pass
  'Commercial': 'Action',       // Telugu "commercial" films = mass/action
  'Dance': 'Music',             // Dance-focused = musical
  'Psychological': 'Thriller',  // Psychological thrillers
  'Concert': 'Music',           // Concert films
  'Spy': 'Thriller',            // Spy films are thrillers
  'Spy Thriller': 'Thriller',   // Obvious mapping
  'Children': 'Family',         // Children's films = family
  'Short': null                 // Format, not genre - remove it
};

async function fixFinalGenres() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           FIX FINAL 10 NON-STANDARD GENRES                            ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white('  Genre Mappings:\n'));
  Object.entries(FINAL_MAPPINGS).forEach(([from, to]) => {
    const toDisplay = to === null ? chalk.red('REMOVE') : chalk.green(`→ ${to}`);
    console.log(chalk.gray(`    "${from}" ${toDisplay}`));
  });
  console.log();

  let fixedCount = 0;
  let failedCount = 0;

  const BATCH_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, genres, slug')
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error || !data || data.length === 0) break;

    for (const movie of data) {
      if (!movie.genres || movie.genres.length === 0) continue;

      const hasNonStandard = movie.genres.some((g: string) => g in FINAL_MAPPINGS);
      if (!hasNonStandard) continue;

      const newGenres = new Set<string>();
      movie.genres.forEach((genre: string) => {
        if (genre in FINAL_MAPPINGS) {
          const replacement = FINAL_MAPPINGS[genre];
          if (replacement !== null) {
            newGenres.add(replacement);
          }
          // If null, skip (remove)
        } else {
          newGenres.add(genre);
        }
      });

      const genresArray = Array.from(newGenres);
      
      console.log(chalk.white(`  ${movie.title_en} (${movie.release_year})`));
      console.log(chalk.gray(`    [${movie.genres.join(', ')}] → [${genresArray.join(', ')}]`));

      const { error: updateError } = await supabase
        .from('movies')
        .update({ genres: genresArray })
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`    ✗ Failed: ${updateError.message}`));
        failedCount++;
      } else {
        console.log(chalk.green(`    ✓ Updated`));
        fixedCount++;
      }
    }

    offset += BATCH_SIZE;
    if (data.length < BATCH_SIZE) break;
  }

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   FIX COMPLETE                                        ║
╚═══════════════════════════════════════════════════════════════════════╝

  ✓ Successfully Fixed:     ${fixedCount}
  ✗ Failed:                 ${failedCount}

  ${fixedCount > 0 ? '✅ All non-standard genres fixed!' : '⚠️  No movies needed fixing'}

`));
}

fixFinalGenres();
