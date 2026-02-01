#!/usr/bin/env npx tsx
/**
 * Fix: Ensure Chiranjeevi is in supporting_cast for Mana Voori Pandavulu (1978)
 * so it shows in his filmography. Run once.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SLUG = 'mana-voori-pandavulu-1978';
const ACTOR_NAME = 'Chiranjeevi';

function hasChiranjeevi(cast: any): boolean {
  if (!Array.isArray(cast)) return false;
  return cast.some(
    (c: any) =>
      (typeof c === 'string' && c.toLowerCase().includes('chiranjeevi')) ||
      (typeof c === 'object' && c?.name && String(c.name).toLowerCase().includes('chiranjeevi'))
  );
}

async function main() {
  const { data: movie, error } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, supporting_cast')
    .eq('slug', SLUG)
    .single();

  if (error || !movie) {
    console.log(chalk.red('Movie not found:'), SLUG, error?.message);
    return;
  }

  console.log(chalk.cyan('Movie:'), movie.title_en, movie.release_year);
  console.log(chalk.gray('supporting_cast:'), JSON.stringify(movie.supporting_cast, null, 2));

  const cast = Array.isArray(movie.supporting_cast) ? [...movie.supporting_cast] : [];
  if (hasChiranjeevi(cast)) {
    console.log(chalk.green('Chiranjeevi already in supporting_cast.'));
    return;
  }

  cast.push({ name: ACTOR_NAME, type: 'supporting', role: 'Parthu' });
  const { error: updateError } = await supabase
    .from('movies')
    .update({ supporting_cast: cast })
    .eq('id', movie.id);

  if (updateError) {
    console.log(chalk.red('Update failed:'), updateError.message);
    return;
  }
  console.log(chalk.green('Added Chiranjeevi to supporting_cast. Refresh profile.'));
}

main().catch(console.error);
