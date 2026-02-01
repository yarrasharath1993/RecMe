#!/usr/bin/env npx tsx
/**
 * Apply Chiranjeevi manual review corrections (Batch 1):
 * - Role fixes: 47 Rojulu (Villain), Mosagadu (Villain), I Love You (Hero), Kaali (Supporting), etc.
 * - Remove Chiranjeevi from Rakta Sambandham (not his film)
 * - Merge duplicates: Oorukichchina/Oorukichina Maata, Paravathi/Parvathi, Thodu/Todu Dongalu,
 *   Allullostunnaru/Allulu Vasthunnaru, Inti Guttu/Intiguttu, Bruce Lee / Bruce Lee: The Fighter
 * - Sipayi, Jagadguru Adi Shankara: change to Cameo
 *
 * Usage: npx tsx scripts/apply-chiranjeevi-manual-review-corrections.ts
 *        npx tsx scripts/apply-chiranjeevi-manual-review-corrections.ts --execute
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTOR = 'Chiranjeevi';
const EXECUTE = process.argv.includes('--execute');

function normalizeTitle(t: string): string {
  return (t || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function titleMatches(a: string, b: string): boolean {
  const x = normalizeTitle(a);
  const y = normalizeTitle(b || '');
  if (x === y) return true;
  if (x.length >= 4 && y.includes(x)) return true;
  if (y.length >= 4 && x.includes(y)) return true;
  return false;
}

async function findMovie(title: string, year: number): Promise<{ id: string; slug: string; title_en: string; release_year: number; hero: string | null; supporting_cast: any } | null> {
  const { data: rows } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, hero, supporting_cast')
    .in('release_year', [year, year - 1, year + 1]);
  if (!rows?.length) return null;
  const m = rows.find(r => titleMatches(title, r.title_en || ''));
  return m ? { ...m, supporting_cast: m.supporting_cast ?? [] } : null;
}

async function findMoviesByTitleYear(titlePatterns: string[], year: number): Promise<{ id: string; slug: string; title_en: string; release_year: number; hero: string | null; supporting_cast: any }[]> {
  const { data: rows } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, hero, supporting_cast')
    .eq('release_year', year);
  if (!rows?.length) return [];
  return rows
    .filter(r => titlePatterns.some(t => titleMatches(t, r.title_en || '')))
    .map(r => ({ ...r, supporting_cast: r.supporting_cast ?? [] }));
}

function hasChiruInCast(m: any): boolean {
  const h = (m.hero || '').toLowerCase();
  if (h.includes('chiranjeevi') && !h.includes('sarja')) return true;
  const sc = m.supporting_cast;
  if (!Array.isArray(sc)) return false;
  return sc.some((c: any) => {
    const n = typeof c === 'object' ? c?.name : c;
    return n && String(n).toLowerCase().includes('chiranjeevi') && !String(n).toLowerCase().includes('sarja');
  });
}

function removeChiruFromCast(supporting_cast: any): { cast: any[]; changed: boolean } {
  if (!Array.isArray(supporting_cast)) return { cast: [], changed: false };
  const cast = supporting_cast.filter((c: any) => {
    const n = typeof c === 'object' ? c?.name : c;
    return !(n && String(n).toLowerCase().includes('chiranjeevi') && !String(n).toLowerCase().includes('sarja'));
  });
  return { cast, changed: cast.length !== supporting_cast.length };
}

function ensureChiruInCast(supporting_cast: any, type: string, character?: string): any[] {
  const arr = Array.isArray(supporting_cast) ? [...supporting_cast] : [];
  const existing = arr.findIndex((c: any) => {
    const n = typeof c === 'object' ? c?.name : c;
    return n && String(n).toLowerCase().includes('chiranjeevi');
  });
  const entry = { name: ACTOR, type, ...(character ? { role: character } : {}) };
  if (existing >= 0) {
    arr[existing] = typeof arr[existing] === 'object' ? { ...arr[existing], ...entry } : entry;
    return arr;
  }
  arr.push(entry);
  return arr;
}

function setChiruCastType(supporting_cast: any, newType: string, character?: string): any[] {
  if (!Array.isArray(supporting_cast)) return supporting_cast;
  return supporting_cast.map((c: any) => {
    const n = typeof c === 'object' ? c?.name : c;
    if (!n || !String(n).toLowerCase().includes('chiranjeevi')) return c;
    return typeof c === 'object'
      ? { ...c, type: newType, ...(character != null ? { role: character } : {}) }
      : { name: c, type: newType, ...(character ? { role: character } : {}) };
  });
}

async function main() {
  console.log(chalk.cyan('Chiranjeevi manual review corrections (Batch 1)'));
  console.log(EXECUTE ? chalk.yellow('Mode: EXECUTE\n') : chalk.gray('Mode: dry-run (use --execute to apply)\n'));

  let applied = 0;
  let errors = 0;

  // ---- 1. 47 Rojulu: Villain (antagonist Kumar). Remove from hero, add to supporting_cast as villain ----
  const movie47 = await findMovie('47 Rojulu', 1981);
  if (movie47) {
    const updates: { hero?: string | null; supporting_cast?: any } = {};
    if ((movie47.hero || '').toLowerCase().includes('chiranjeevi')) {
      updates.hero = null; // Lead could be Jayaprada / other; we don't overwrite without data
      const cur = movie47.supporting_cast ?? [];
      updates.supporting_cast = ensureChiruInCast(cur, 'villain', 'Kumar');
    } else {
      const cur = movie47.supporting_cast ?? [];
      updates.supporting_cast = ensureChiruInCast(cur, 'villain', 'Kumar');
    }
    if (Object.keys(updates).length > 0) {
      console.log(chalk.yellow('  47 Rojulu (1981): set Chiranjeevi as Villain (Kumar)'));
      if (EXECUTE) {
        const { error } = await supabase.from('movies').update(updates).eq('id', movie47.id);
        if (error) { console.error(chalk.red('    Error:'), error.message); errors++; } else applied++;
      } else applied++;
    }
  } else {
    console.log(chalk.gray('  47 Rojulu (1981): not found'));
  }

  // ---- 2. Mosagadu (1980): Villain. Ensure in supporting_cast as villain, not hero ----
  const mosagadu = await findMovie('Mosagadu', 1980);
  if (mosagadu) {
    const updates: { hero?: string | null; supporting_cast?: any } = {};
    if ((mosagadu.hero || '').toLowerCase().includes('chiranjeevi')) {
      updates.hero = null;
      updates.supporting_cast = ensureChiruInCast(mosagadu.supporting_cast ?? [], 'villain');
    } else {
      updates.supporting_cast = ensureChiruInCast(mosagadu.supporting_cast ?? [], 'villain');
    }
    if (Object.keys(updates).length > 0) {
      console.log(chalk.yellow('  Mosagadu (1980): set Chiranjeevi as Villain'));
      if (EXECUTE) {
        const { error } = await supabase.from('movies').update(updates).eq('id', mosagadu.id);
        if (error) { console.error(chalk.red('    Error:'), error.message); errors++; } else applied++;
      } else applied++;
    }
  }

  // ---- 3. I Love You (1979): Hero/Anti-hero (lead Ramesh). Set hero, remove from supporting ----
  const iLoveYou = await findMovie('I Love You', 1979);
  if (iLoveYou) {
    const cast = iLoveYou.supporting_cast ?? [];
    const { cast: newCast, changed: castChanged } = removeChiruFromCast(cast);
    const updates: { hero?: string; supporting_cast?: any } = { hero: ACTOR };
    if (castChanged) updates.supporting_cast = newCast;
    console.log(chalk.yellow('  I Love You (1979): set Chiranjeevi as Hero (lead Ramesh)'));
    if (EXECUTE) {
      const { error } = await supabase.from('movies').update(updates).eq('id', iLoveYou.id);
      if (error) { console.error(chalk.red('    Error:'), error.message); errors++; } else applied++;
    } else applied++;
  }

  // ---- 4. Rakta Sambandham: Remove Chiranjeevi (not his film). Set hero = Murali Mohan ----
  const raktaSamb = await findMovie('Rakta Sambandham', 1980);
  if (raktaSamb) {
    const updates: { hero?: string; supporting_cast?: any } = {};
    if ((raktaSamb.hero || '').toLowerCase().includes('chiranjeevi')) updates.hero = 'Murali Mohan';
    const { cast, changed } = removeChiruFromCast(raktaSamb.supporting_cast);
    if (changed) updates.supporting_cast = cast;
    if (Object.keys(updates).length > 0) {
      console.log(chalk.yellow('  Rakta Sambandham (1980): remove Chiranjeevi; set hero Murali Mohan'));
      if (EXECUTE) {
        const { error } = await supabase.from('movies').update(updates).eq('id', raktaSamb.id);
        if (error) { console.error(chalk.red('    Error:'), error.message); errors++; } else applied++;
      } else applied++;
    }
  }

  // ---- 5. Kaali (1980): Supporting (Hero in Telugu, Supporting in Tamil). Move to supporting_cast ----
  const kaali = await findMovie('Kaali', 1980);
  if (kaali && (kaali.hero || '').toLowerCase().includes('chiranjeevi')) {
    const cast = ensureChiruInCast(kaali.supporting_cast ?? [], 'supporting');
    console.log(chalk.yellow('  Kaali (1980): set Chiranjeevi as Supporting'));
    if (EXECUTE) {
      const { error } = await supabase.from('movies').update({ hero: null, supporting_cast: cast }).eq('id', kaali.id);
      if (error) { console.error(chalk.red('    Error:'), error.message); errors++; } else applied++;
    } else applied++;
  }

  // ---- 6. Sipayi (1996): Cameo (not Supporting) ----
  const sipayi = await findMovie('Sipayi', 1996);
  if (sipayi && hasChiruInCast(sipayi)) {
    const newCast = setChiruCastType(sipayi.supporting_cast, 'cameo');
    console.log(chalk.yellow('  Sipayi (1996): change to Cameo'));
    if (EXECUTE) {
      const { error } = await supabase.from('movies').update({ supporting_cast: newCast }).eq('id', sipayi.id);
      if (error) { console.error(chalk.red('    Error:'), error.message); errors++; } else applied++;
    } else applied++;
  }

  // ---- 7. Jagadguru Adi Shankara (2013): Cameo (Lord Shiva) ----
  const jagadguru = await findMovie('Jagadguru Adi Shankara', 2013);
  if (jagadguru && hasChiruInCast(jagadguru)) {
    const newCast = setChiruCastType(jagadguru.supporting_cast, 'cameo', 'Lord Shiva');
    console.log(chalk.yellow('  Jagadguru Adi Shankara (2013): change to Cameo (Lord Shiva)'));
    if (EXECUTE) {
      const { error } = await supabase.from('movies').update({ supporting_cast: newCast }).eq('id', jagadguru.id);
      if (error) { console.error(chalk.red('    Error:'), error.message); errors++; } else applied++;
    } else applied++;
  }

  // ---- 8. Duplicates: keep one (by preferred title), delete the other ----
  const duplicateGroups: { year: number; titles: string[]; keepTitle: string }[] = [
    { year: 1981, titles: ['Oorukichchina Maata', 'Oorukichina Maata'], keepTitle: 'Oorukichina Maata' },
    { year: 1981, titles: ['Paravathi Parameshwarulu', 'Parvathi Parameswarulu'], keepTitle: 'Paravathi Parameshwarulu' },
    { year: 1981, titles: ['Thodu Dongalu', 'Todu Dongalu'], keepTitle: 'Thodu Dongalu' },
    { year: 1984, titles: ['Allullostunnaru', 'Allulu Vasthunnaru'], keepTitle: 'Allullostunnaru' },
    { year: 1984, titles: ['Inti Guttu', 'Intiguttu'], keepTitle: 'Inti Guttu' },
    { year: 2015, titles: ['Bruce Lee', 'Bruce Lee: The Fighter'], keepTitle: 'Bruce Lee: The Fighter' },
  ];

  for (const group of duplicateGroups) {
    const movies = await findMoviesByTitleYear(group.titles, group.year);
    const toKeep = movies.find(m => titleMatches(group.keepTitle, m.title_en || ''));
    const toDelete = toKeep ? movies.filter(m => m.id !== toKeep.id) : movies.slice(1); // keep first, delete rest
    if (toDelete.length === 0) continue;
    for (const m of toDelete) {
      console.log(chalk.yellow(`  Duplicate: delete ${m.title_en} (${m.slug}), keep "${group.keepTitle}"`));
      if (EXECUTE) {
        const { error } = await supabase.from('movies').delete().eq('id', m.id);
        if (error) { console.error(chalk.red('    Error:'), error.message); errors++; } else applied++;
      } else applied++;
    }
  }

  // ---- 9. 47 Rojulu hero: if we set hero = null, set lead to Jayaprada? User said "opposite Jayaprada" - heroine. So hero could stay null or we set heroine. Skip for now; villain is set.

  // ---- 10. Rakta Bandham: optional character "Sub-Inspector Tilak" - we don't store hero character in DB; skip.

  console.log('');
  console.log(chalk.bold('Summary'));
  console.log(`  Applied / would apply: ${applied}`);
  console.log(`  Errors: ${errors}`);
  if (!EXECUTE && applied > 0) {
    console.log(chalk.cyan('\nRun with --execute to apply.'));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
