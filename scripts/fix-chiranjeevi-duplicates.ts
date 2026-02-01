#!/usr/bin/env npx tsx
/**
 * Fix duplicates in Chiranjeevi filmography:
 * 1. Andarivaadu (2005): two rows (andarivaadu-2005, andarivadu-2005) - remove Chiranjeevi from one so only one shows.
 * 2. Bruce Lee / I (2015): if Chiranjeevi was wrongly added to "I" (2015), remove him. Keep only on "Bruce Lee - The Fighter" (2015).
 *
 * Usage: npx tsx scripts/fix-chiranjeevi-duplicates.ts --execute
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXECUTE = process.argv.includes('--execute');

async function main() {
  // 1. Andarivaadu: two slugs for same film
  const { data: andar1 } = await supabase.from('movies').select('id, title_en, slug, hero').eq('slug', 'andarivaadu-2005').single();
  const { data: andar2 } = await supabase.from('movies').select('id, title_en, slug, hero').eq('slug', 'andarivadu-2005').single();

  if (andar1 && andar2) {
    console.log(chalk.cyan('Andarivaadu (2005) duplicate:'), andar1.slug, 'and', andar2.slug);
    // Keep andarivadu-2005, delete andarivaadu-2005 (duplicate row)
    if (EXECUTE) {
      const { error } = await supabase.from('movies').delete().eq('id', andar1.id);
      if (error) {
        console.log(chalk.red('Delete andarivaadu-2005 failed:'), error.message);
      } else {
        console.log(chalk.green('Deleted duplicate andarivaadu-2005. Kept andarivadu-2005.'));
      }
    } else {
      console.log(chalk.yellow('Would delete duplicate: andarivaadu-2005 (keep andarivadu-2005)'));
    }
  }

  // 2. I (2015): remove Chiranjeevi if present (wrong film - Bruce Lee is the cameo film)
  const { data: iRows } = await supabase.from('movies').select('id, title_en, slug, supporting_cast, hero').eq('release_year', 2015).or('title_en.eq.I,slug.eq.i-2015');
  const iMovie = (iRows && iRows.length > 0) ? iRows[0] : null;
  if (iMovie) {
    const cast = Array.isArray(iMovie.supporting_cast) ? [...iMovie.supporting_cast] : [];
    const hasChiru = cast.some((c: any) => typeof c === 'object' && c?.name && String(c.name).toLowerCase().includes('chiranjeevi'));
    if (hasChiru) {
      console.log(chalk.cyan('I (2015): Chiranjeevi in cast (wrong). Removing.'));
      const filtered = cast.filter((c: any) => !(typeof c === 'object' && c?.name && String(c.name).toLowerCase().includes('chiranjeevi')));
      if (EXECUTE) {
        const { error } = await supabase.from('movies').update({ supporting_cast: filtered }).eq('id', iMovie.id);
        if (error) console.log(chalk.red('Update I (2015) failed:'), error.message);
        else console.log(chalk.green('Removed Chiranjeevi from I (2015).'));
      } else {
        console.log(chalk.yellow('Would remove Chiranjeevi from I (2015) supporting_cast.'));
      }
    }
  }

  if (!EXECUTE) console.log(chalk.cyan('\nRun with --execute to apply.'));
}

main().catch(console.error);
