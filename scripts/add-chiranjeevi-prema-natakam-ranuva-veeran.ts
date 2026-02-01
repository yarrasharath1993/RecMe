#!/usr/bin/env npx tsx
/**
 * Add Chiranjeevi's missing acted roles (per manual review):
 * 1. Prema Natakam (1981): cameo as himself (special appearance)
 * 2. Ranuva Veeran (1981): Tamil film, key antagonist opposite Rajinikanth
 *
 * Usage: npx tsx scripts/add-chiranjeevi-prema-natakam-ranuva-veeran.ts
 *        npx tsx scripts/add-chiranjeevi-prema-natakam-ranuva-veeran.ts --execute
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

async function findMovie(title: string, year: number): Promise<{ id: string; slug: string; title_en: string; release_year: number; hero: string | null; supporting_cast: any; is_published: boolean } | null> {
  const { data: rows } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, hero, supporting_cast, is_published')
    .in('release_year', [year, year - 1, year + 1]);
  if (!rows?.length) return null;
  const m = rows.find(r => titleMatches(title, r.title_en || ''));
  return m ? { ...m, supporting_cast: m.supporting_cast ?? [] } : null;
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

async function main() {
  console.log(chalk.cyan('Add Chiranjeevi: Prema Natakam (cameo), Ranuva Veeran (antagonist)'));
  console.log(EXECUTE ? chalk.yellow('Mode: EXECUTE\n') : chalk.gray('Mode: dry-run (use --execute to apply)\n'));

  let applied = 0;

  // ---- 1. Prema Natakam (1981): cameo as himself ----
  const prema = await findMovie('Prema Natakam', 1981);
  if (prema) {
    const updates: { hero?: string | null; supporting_cast: any } = {
      supporting_cast: ensureChiruInCast(prema.supporting_cast, 'cameo', 'Himself'),
    };
    // If Chiranjeevi is in hero, move to cameo only (lead = Murali Mohan per sources)
    if ((prema.hero || '').toLowerCase().includes('chiranjeevi') && !(prema.hero || '').toLowerCase().includes('sarja')) {
      const parts = (prema.hero || '').split(',').map(p => p.trim()).filter(p => p && !p.toLowerCase().includes('chiranjeevi'));
      updates.hero = parts.length > 0 ? parts.join(', ') : 'Murali Mohan';
    }
    if (!prema.is_published) (updates as any).is_published = true;
    console.log(chalk.yellow(`  Prema Natakam (1981): add Chiranjeevi cameo as Himself${updates.hero != null ? '; set hero = ' + updates.hero : ''}`));
    if (EXECUTE) {
      const { error } = await supabase.from('movies').update(updates).eq('id', prema.id);
      if (error) {
        console.error(chalk.red('    Error:'), error.message);
      } else {
        applied++;
      }
    } else {
      applied++;
    }
  } else {
    console.log(chalk.yellow('  Prema Natakam (1981): movie not found – inserting'));
    if (EXECUTE) {
      const { error } = await supabase.from('movies').insert({
        slug: 'prema-natakam-1981',
        title_en: 'Prema Natakam',
        release_year: 1981,
        hero: 'Murali Mohan',
        director: 'K. Vasu',
        language: 'Telugu',
        is_published: true,
        supporting_cast: [{ name: ACTOR, type: 'cameo', role: 'Himself' }],
      });
      if (error) {
        console.error(chalk.red('    Error:'), error.message);
      } else {
        applied++;
      }
    } else {
      applied++;
    }
  }

  // ---- 2. Ranuva Veeran (1981): Tamil, antagonist opposite Rajinikanth ----
  const ranuva = await findMovie('Ranuva Veeran', 1981);
  if (ranuva) {
    const newCast = ensureChiruInCast(ranuva.supporting_cast, 'villain');
    console.log(chalk.yellow('  Ranuva Veeran (1981): add Chiranjeevi as Villain (antagonist)'));
    if (EXECUTE) {
      const updates: { supporting_cast: any; is_published?: boolean } = { supporting_cast: newCast };
      if (!ranuva.is_published) updates.is_published = true;
      const { error } = await supabase.from('movies').update(updates).eq('id', ranuva.id);
      if (error) {
        console.error(chalk.red('    Error:'), error.message);
      } else {
        applied++;
      }
    } else {
      applied++;
    }
  } else {
    console.log(chalk.yellow('  Ranuva Veeran (1981): movie not found – inserting (Tamil, Rajinikanth hero)'));
    if (EXECUTE) {
      const { error } = await supabase.from('movies').insert({
        slug: 'ranuva-veeran-1981',
        title_en: 'Ranuva Veeran',
        release_year: 1981,
        hero: 'Rajinikanth',
        heroine: 'Sridevi',
        director: 'S.P. Muthuraman',
        language: 'Tamil',
        is_published: true,
        supporting_cast: [{ name: ACTOR, type: 'villain' }],
      });
      if (error) {
        console.error(chalk.red('    Error:'), error.message);
      } else {
        applied++;
      }
    } else {
      applied++;
    }
  }

  console.log('');
  console.log(chalk.bold('Summary'));
  console.log(`  Applied / would apply: ${applied}`);
  if (!EXECUTE && applied > 0) {
    console.log(chalk.cyan('\nRun with --execute to apply.'));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
