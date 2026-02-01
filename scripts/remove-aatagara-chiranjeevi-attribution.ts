#!/usr/bin/env npx tsx
/**
 * Remove wrong attribution: Aatagara (2015) stars Chiranjeevi Sarja, not Megastar Chiranjeevi.
 * Updates the movie so Chiranjeevi (Megastar) is removed and hero = Chiranjeevi Sarja.
 *
 * Usage: npx tsx scripts/remove-aatagara-chiranjeevi-attribution.ts --execute
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MEGASTAR = 'Chiranjeevi'; // name we want to REMOVE
const CORRECT_HERO = 'Chiranjeevi Sarja';
const SLUG = 'aatagara-2015';
const EXECUTE = process.argv.includes('--execute');

async function main() {
  const { data: movie, error: fetchErr } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, hero, supporting_cast')
    .eq('slug', SLUG)
    .single();

  if (fetchErr || !movie) {
    console.log(chalk.red('Movie not found:'), SLUG, fetchErr?.message);
    return;
  }

  console.log(chalk.cyan('Movie:'), movie.title_en, `(${movie.release_year})`);
  console.log(chalk.gray('  Current hero:'), movie.hero);
  console.log(chalk.gray('  supporting_cast:'), JSON.stringify(movie.supporting_cast));

  const updates: Record<string, unknown> = {};

  // Set hero to Chiranjeevi Sarja (remove Megastar Chiranjeevi)
  if ((movie.hero || '').toLowerCase().includes('chiranjeevi') && !(movie.hero || '').toLowerCase().includes('sarja')) {
    updates.hero = CORRECT_HERO;
  }

  // Remove Chiranjeevi (Megastar) from supporting_cast if present
  if (Array.isArray(movie.supporting_cast)) {
    const filtered = movie.supporting_cast.filter((c: any) => {
      const name = typeof c === 'string' ? c : (c?.name || '');
      return !String(name).toLowerCase().includes('chiranjeevi') || String(name).toLowerCase().includes('sarja');
    });
    if (filtered.length !== movie.supporting_cast.length) {
      updates.supporting_cast = filtered;
    }
  }

  if (Object.keys(updates).length === 0) {
    console.log(chalk.yellow('No Chiranjeevi (Megastar) attribution found to remove. Hero may already be Chiranjeevi Sarja.'));
    return;
  }

  if (!EXECUTE) {
    console.log(chalk.yellow('\nWould apply:'), updates);
    console.log(chalk.cyan('Run with --execute to apply.'));
    return;
  }

  const { error: updateErr } = await supabase.from('movies').update(updates).eq('id', movie.id);
  if (updateErr) {
    console.log(chalk.red('Update failed:'), updateErr.message);
    return;
  }
  console.log(chalk.green('\nDone. Aatagara (2015) now attributed to Chiranjeevi Sarja; removed from Megastar Chiranjeevi filmography.'));
}

main().catch(console.error);
