#!/usr/bin/env npx tsx
/**
 * APPLY CHIRANJEEVI CANONICAL ATTRIBUTION
 *
 * 1. Fix mis-attributions: set hero = Chiranjeevi where canonical says Main Lead but DB has someone else (or spelling variant).
 * 2. Add cameos: add Chiranjeevi to supporting_cast (type: cameo) for films like Magadheera, Hands Up!, etc.
 * 3. Add supporting: add Chiranjeevi to supporting_cast (type: supporting) where canonical says Supporting.
 *
 * Uses same title matching as verify-chiranjeevi-filmography-batches.ts.
 * Dry-run by default; use --execute to apply.
 *
 * Usage:
 *   npx tsx scripts/apply-chiranjeevi-canonical-attribution.ts
 *   npx tsx scripts/apply-chiranjeevi-canonical-attribution.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTOR_NAME = 'Chiranjeevi';
const EXECUTE = process.argv.includes('--execute');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const TITLE_VARIANTS: [string, string][] = [
  ['rakta bandham', 'rakta sambandham'],
  ['sri rama bantu', 'sri rambantu'],
  ['intlo ramayya veedilo krishnayya', 'intlo ramayya veedhilo krishnayya'],
  ['bandhalu anubandhalu', 'bandalu anubandalu'],
  ['chattam tho poratam', 'chattamtho poratam'],
  ['jwala', 'jwaala'],
  ['rakta sindhuram', 'raktha sindhuram'],
  ['todu dongalu', 'thodu dongalu'],
  ['parvathi parameswarulu', 'paravathi parameshwarulu'],
  ['47 natkal (tamil)', '47 rojulu'],
  ['tiruguleni manishi', 'tirugu leni manishi'],
  ['punnami naagu', 'punnami naag'],
  ['prema tarangalu', 'thathayya premaleelalu'],
  ['chanakya shapadham', 'chanakya shapadham'],
  ['lankeshwarudu', 'lankeswarudu'],
  ['aaj ka goonda raaj (hindi)', 'aaj ka goonda raj'],
  ['andarivaadu', 'andarivadu'],
  ['intiguttu', 'inti guttu'],
  ['allullostunnaru', 'allulu vasthunnaru'],
  ['magadheera', 'magadheera'],
  ['hands up', 'hands up'],
  ['bruce lee the fighter', 'bruce lee the fighter'],
  ['mappillai', 'mappillai'],
  ['manavoori pandavulu', 'mana voori pandavulu'],
  ['mana voori pandavulu', 'manavoori pandavulu'],
];

function titleMatches(canonical: string, dbTitle: string): boolean {
  const a = normalizeTitle(canonical);
  const b = normalizeTitle(dbTitle || '');
  if (a === b) return true;
  // Require at least 4 chars for substring match to avoid "I" matching "Bruce Lee ..."
  if (a.length >= 4 && b.includes(a)) return true;
  if (b.length >= 4 && a.includes(b)) return true;
  // Single-word canonical (e.g. "Puli") must not match longer DB title (e.g. "Pulijoodam")
  const aWords = a.split(/\s+/).filter(Boolean);
  if (aWords.length === 1 && aWords[0].length >= 3) {
    if (b !== a && b.startsWith(a)) return true; // "puli" matches "puli something"
    if (b !== a && b.includes(a)) return false; // "puli" must not match "pulijoodam"
  }
  for (const [x, y] of TITLE_VARIANTS) {
    if ((a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x))) return true;
    if (a === x && b === y) return true;
  }
  return false;
}

/** Canonical entries that need: set hero (Main Lead), add cameo, or add supporting */
const FIXES: Array<{ year: number; title: string; action: 'set_hero' | 'add_cameo' | 'add_supporting' }> = [
  // Main Lead – fix mis-attribution (DB may have different spelling or wrong hero)
  { year: 1980, title: 'Punnami Naagu', action: 'set_hero' },
  { year: 1982, title: 'Intlo Ramayya Veedilo Krishnayya', action: 'set_hero' },
  { year: 1982, title: 'Bandhalu Anubandhalu', action: 'set_hero' },
  { year: 1985, title: 'Chattam Tho Poratam', action: 'set_hero' },
  { year: 1985, title: 'Jwala', action: 'set_hero' },
  { year: 1985, title: 'Rakta Sindhuram', action: 'set_hero' },
  { year: 1986, title: 'Chanakya Shapadham', action: 'set_hero' },
  { year: 1989, title: 'Lankeshwarudu', action: 'set_hero' },
  { year: 1981, title: 'Todu Dongalu', action: 'set_hero' },
  { year: 1981, title: 'Parvathi Parameswarulu', action: 'set_hero' },
  { year: 1983, title: 'Shivudu Shivudu Shivudu', action: 'set_hero' },
  { year: 1980, title: 'Rakta Bandham', action: 'set_hero' },
  { year: 1979, title: 'Sri Rama Bantu', action: 'set_hero' },
  // Cameos – add Chiranjeevi to supporting_cast so they show in filmography
  { year: 2009, title: 'Magadheera', action: 'add_cameo' },
  { year: 2000, title: 'Hands Up!', action: 'add_cameo' },
  { year: 2015, title: 'Bruce Lee - The Fighter', action: 'add_cameo' },
  { year: 1989, title: 'Mappillai', action: 'add_cameo' },
  { year: 1981, title: 'Aadavaallu Meeku Joharlu', action: 'add_cameo' },
  { year: 1979, title: 'Tayaramma Bangarayya', action: 'add_cameo' },
  { year: 1980, title: 'Kottapeta Rowdy', action: 'add_cameo' },
  { year: 1982, title: 'Radha My Darling', action: 'add_cameo' },
  // Supporting – add to supporting_cast
  { year: 1978, title: 'Manavoori Pandavulu', action: 'add_supporting' },
  { year: 1978, title: 'Mana Voori Pandavulu', action: 'add_supporting' },
  { year: 1980, title: 'Kaali', action: 'add_supporting' },
  { year: 1980, title: 'Prema Tarangalu', action: 'add_supporting' },
  { year: 1981, title: 'Tiruguleni Manishi', action: 'add_supporting' },
  { year: 1981, title: '47 Natkal (Tamil)', action: 'add_supporting' },
  { year: 1996, title: 'Sipayi (Kannada)', action: 'add_supporting' },
  { year: 2013, title: 'Jagadguru Adi Shankara', action: 'add_supporting' },
];

async function findMovieByTitleAndYear(title: string, year: number): Promise<{ id: string; title_en: string; release_year: number; hero: string | null; supporting_cast: any } | null> {
  const { data: rows } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, supporting_cast')
    .in('release_year', [year, year - 1, year + 1]);

  if (!rows?.length) return null;
  const match = rows.find((m) => titleMatches(title, m.title_en || ''));
  return match ? { ...match, supporting_cast: match.supporting_cast ?? [] } : null;
}

function hasChiranjeeviInSupportingCast(supporting_cast: any): boolean {
  if (!Array.isArray(supporting_cast)) return false;
  const nameLower = ACTOR_NAME.toLowerCase();
  return supporting_cast.some(
    (c: any) =>
      (typeof c === 'string' && c.toLowerCase().includes(nameLower)) ||
      (typeof c === 'object' && c?.name?.toLowerCase().includes(nameLower))
  );
}

async function main() {
  console.log(chalk.cyan('Chiranjeevi canonical attribution fixes'));
  console.log(EXECUTE ? chalk.yellow('Mode: EXECUTE (will update DB)\n') : chalk.gray('Mode: dry-run (use --execute to apply)\n'));

  let applied = 0;
  let skipped = 0;
  let notFound = 0;

  for (const fix of FIXES) {
    const movie = await findMovieByTitleAndYear(fix.title, fix.year);
    if (!movie) {
      if (VERBOSE) console.log(chalk.gray(`  Not found: ${fix.year} ${fix.title}`));
      notFound++;
      continue;
    }

    if (fix.action === 'set_hero') {
      const currentHero = (movie.hero || '').trim();
      const isChiranjeevi = currentHero.toLowerCase().includes('chiranjeevi');
      if (isChiranjeevi) {
        if (VERBOSE) console.log(chalk.gray(`  OK hero already: ${movie.title_en} (${fix.year})`));
        skipped++;
        continue;
      }
      console.log(chalk.yellow(`  Fix hero: ${movie.title_en} (${fix.year})  current="${currentHero || '(empty)'}" -> Chiranjeevi`));
      if (EXECUTE) {
        const { error } = await supabase.from('movies').update({ hero: ACTOR_NAME }).eq('id', movie.id);
        if (error) {
          console.error(chalk.red(`    Error: ${error.message}`));
        } else {
          applied++;
        }
      } else {
        applied++;
      }
      continue;
    }

    if (fix.action === 'add_cameo' || fix.action === 'add_supporting') {
      if (hasChiranjeeviInSupportingCast(movie.supporting_cast)) {
        if (VERBOSE) console.log(chalk.gray(`  Already in cast: ${movie.title_en} (${fix.year})`));
        skipped++;
        continue;
      }
      const type = fix.action === 'add_cameo' ? 'cameo' : 'supporting';
      console.log(chalk.yellow(`  Add ${type}: ${movie.title_en} (${fix.year})  -> Chiranjeevi`));
      const cast = Array.isArray(movie.supporting_cast) ? [...movie.supporting_cast] : [];
      cast.push({ name: ACTOR_NAME, type, role: type === 'cameo' ? 'Guest' : undefined });
      if (EXECUTE) {
        const { error } = await supabase.from('movies').update({ supporting_cast: cast }).eq('id', movie.id);
        if (error) {
          console.error(chalk.red(`    Error: ${error.message}`));
        } else {
          applied++;
        }
      } else {
        applied++;
      }
    }
  }

  console.log('');
  console.log(chalk.bold('Summary'));
  console.log(`  Would apply / applied: ${applied}`);
  console.log(`  Skipped (already correct): ${skipped}`);
  console.log(`  Not found: ${notFound}`);
  if (!EXECUTE && applied > 0) {
    console.log(chalk.cyan('\nRun with --execute to apply these changes.'));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
