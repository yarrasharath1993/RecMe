#!/usr/bin/env npx tsx
/**
 * Find movies where Chiranjeevi appears (hero/supporting_cast) but is_published = false.
 * These won't show in his filmography. Run with --fix to publish them.
 *
 * Usage: npx tsx scripts/find-unpublished-chiranjeevi-movies.ts
 *        npx tsx scripts/find-unpublished-chiranjeevi-movies.ts --fix
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CHIRU = 'Chiranjeevi';
const FIX = process.argv.includes('--fix');

function hasChiru(m: any): boolean {
  const h = (m.hero || '').toLowerCase();
  const hv = (m.heroine || '').toLowerCase();
  if (h.includes('chiranjeevi') || hv.includes('chiranjeevi')) return true;
  const sc = m.supporting_cast;
  if (!Array.isArray(sc)) return false;
  return sc.some(
    (c: any) =>
      (typeof c === 'object' && c?.name && String(c.name).toLowerCase().includes('chiranjeevi')) ||
      (typeof c === 'string' && c.toLowerCase().includes('chiranjeevi'))
  );
}

async function main() {
  // All movies with Chiranjeevi in hero
  const { data: heroRows } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, is_published, hero, supporting_cast')
    .ilike('hero', '%chiranjeevi%');

  // All movies with non-null supporting_cast (we'll filter by Chiranjeevi in JS)
  const allWithSupporting: any[] = [];
  let page = 0;
  const PAGE = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data: pageData } = await supabase
      .from('movies')
      .select('id, title_en, slug, release_year, is_published, hero, supporting_cast')
      .not('supporting_cast', 'is', null)
      .range(page * PAGE, (page + 1) * PAGE - 1);
    const rows = pageData || [];
    allWithSupporting.push(...rows);
    hasMore = rows.length === PAGE;
    page += 1;
  }

  const supportingWithChiru = allWithSupporting.filter(m => hasChiru(m) && !(m.hero || '').toLowerCase().includes('chiranjeevi'));
  const byId = new Map<string, any>();
  for (const m of [...(heroRows || []), ...supportingWithChiru]) {
    byId.set(m.id, m);
  }
  const allChiruMovies = Array.from(byId.values());

  const unpublished = allChiruMovies.filter(m => !m.is_published);

  if (unpublished.length === 0) {
    console.log(chalk.green('No unpublished movies with Chiranjeevi found.'));
    return;
  }

  console.log(chalk.yellow(`Found ${unpublished.length} unpublished movie(s) with Chiranjeevi:\n`));
  unpublished.forEach(m => {
    const role = (m.hero || '').toLowerCase().includes('chiranjeevi') ? 'hero' : 'supporting/cameo';
    console.log(chalk.cyan('  '), m.title_en, `(${m.release_year})`, chalk.gray('—'), role, chalk.gray(m.slug));
  });

  if (FIX) {
    console.log(chalk.cyan('\nPublishing...'));
    for (const m of unpublished) {
      const { error } = await supabase.from('movies').update({ is_published: true }).eq('id', m.id);
      if (error) console.log(chalk.red('  Error', m.slug, error.message));
      else console.log(chalk.green('  Published:'), m.title_en, `(${m.release_year})`);
    }
  } else {
    console.log(chalk.cyan('\nRun with --fix to set is_published = true for these movies.'));
  }
}

main().catch(console.error);
