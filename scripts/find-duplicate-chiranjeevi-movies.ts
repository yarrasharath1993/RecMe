#!/usr/bin/env npx tsx
/**
 * Find duplicate or near-duplicate movies in Chiranjeevi's filmography:
 * - Same title + year, different slugs (e.g. andarivaadu-2005 vs andarivadu-2005)
 * - Bruce Lee / I (2015) type mix-ups
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

function hasChiru(m: any): boolean {
  const h = (m.hero || '').toLowerCase();
  const hv = (m.heroine || '').toLowerCase();
  if (h.includes('chiranjeevi') && !h.includes('sarja')) return true;
  if (hv.includes('chiranjeevi') && !hv.includes('sarja')) return true;
  const sc = m.supporting_cast;
  if (!Array.isArray(sc)) return false;
  return sc.some(
    (c: any) =>
      typeof c === 'object' && c?.name && String(c.name).toLowerCase().includes('chiranjeevi') && !String(c.name).toLowerCase().includes('sarja')
  );
}

async function main() {
  // All movies with Chiranjeevi (hero)
  const { data: heroRows } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, hero, supporting_cast')
    .ilike('hero', '%chiranjeevi%')
    .not('hero', 'ilike', '%sarja%');

  const { data: allWithSupporting } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, hero, supporting_cast')
    .not('supporting_cast', 'is', null)
    .limit(5000);

  const supportingWithChiru = (allWithSupporting || []).filter(m => hasChiru(m) && !(m.hero || '').toLowerCase().includes('chiranjeevi'));
  const byId = new Map<string, any>();
  for (const m of [...(heroRows || []), ...supportingWithChiru]) {
    byId.set(m.id, m);
  }
  const all = Array.from(byId.values());

  // Group by normalized (title_lower, year)
  const norm = (t: string) => (t || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const byKey = new Map<string, any[]>();
  for (const m of all) {
    const key = `${norm(m.title_en)}|${m.release_year}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(m);
  }

  console.log(chalk.cyan('Potential duplicates (same title+year, different slugs):\n'));
  let count = 0;
  for (const [key, movies] of byKey) {
    if (movies.length < 2) continue;
    count++;
    const [title, year] = key.split('|');
    console.log(chalk.yellow(`${title} (${year}) — ${movies.length} rows:`));
    movies.forEach(m => console.log(chalk.gray('   '), m.slug, m.hero ? `hero: ${m.hero}` : 'supporting/cameo'));
    console.log('');
  }

  // Specific: Bruce Lee, Andarivaadu
  const bruce = all.filter(m => (m.title_en || '').toLowerCase().includes('bruce lee') || (m.title_en || '').toLowerCase().includes('bruce lee'));
  const andar = all.filter(m => (m.title_en || '').toLowerCase().includes('andariv') || (m.slug || '').includes('andariv'));
  const i2015 = all.filter(m => m.release_year === 2015 && ((m.title_en || '').length <= 5 || (m.title_en || '').toLowerCase() === 'i'));

  if (bruce.length > 0 || andar.length > 1 || i2015.length > 0) {
    console.log(chalk.cyan('Bruce Lee / Andarivaadu / I (2015) check:'));
    if (bruce.length > 0) {
      console.log(chalk.yellow('  Bruce Lee:'), bruce.length);
      bruce.forEach(m => console.log(chalk.gray('    '), m.slug, m.title_en, m.release_year));
    }
    if (andar.length > 1) {
      console.log(chalk.yellow('  Andarivaadu variants:'), andar.length);
      andar.forEach(m => console.log(chalk.gray('    '), m.slug, m.title_en, m.release_year));
    }
    if (i2015.length > 0) {
      console.log(chalk.yellow('  Short title 2015 (possible Bruce Lee mix-up):'));
      i2015.forEach(m => console.log(chalk.gray('    '), m.slug, m.title_en, m.release_year));
    }
  }

  if (count === 0 && andar.length <= 1 && bruce.length <= 1) {
    console.log(chalk.green('No obvious duplicates found in Chiranjeevi filmography set.'));
  }
}

main().catch(console.error);
