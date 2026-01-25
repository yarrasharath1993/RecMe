#!/usr/bin/env npx tsx
/**
 * Apply auto-fixes with before/after diff display
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

interface Movie {
  id: string;
  slug: string;
  title_en: string;
  release_year: number | null;
  hero: string | null;
  heroine: string | null;
  music_director: string | null;
  supporting_cast: string[] | null;
}

const normalize = (s: any): string => {
  if (s == null) return '';
  if (typeof s === 'string') return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (typeof s === 'object' && s.name) return String(s.name).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
};

// Fixes to apply
const NAME_STANDARDS: Record<string, string> = {
  'jr ntr': 'Jr. NTR',
  'ntr jr': 'Jr. NTR',
  'akkineni nagarjuna': 'Nagarjuna',
  'samantha ruth prabhu': 'Samantha',
  'samantha akkineni': 'Samantha',
  'tamannaah bhatia': 'Tamannaah',
  'tamanna': 'Tamannaah',
};

const MUSIC_DUOS: Record<string, string> = {
  'laxmikant': 'Laxmikant-Pyarelal',
  'pyarelal': 'Laxmikant-Pyarelal',
  'anand': 'Anand-Milind',
  'milind': 'Anand-Milind',
  'nadeem': 'Nadeem-Shravan',
  'shravan': 'Nadeem-Shravan',
};

interface Change {
  slug: string;
  title: string;
  year: number | null;
  field: string;
  before: string;
  after: string;
}

async function applyFixes(): Promise<void> {
  console.log(chalk.bold('\n🔧 APPLYING AUTO-FIXES WITH BEFORE/AFTER DIFF\n'));
  
  // Fetch all movies
  let movies: Movie[] = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('movies')
      .select('id, slug, title_en, release_year, hero, heroine, music_director, supporting_cast')
      .eq('is_published', true)
      .range(offset, offset + 999);
    if (!data?.length) break;
    movies = movies.concat(data as Movie[]);
    if (data.length < 1000) break;
    offset += 1000;
  }
  
  console.log(`Found ${movies.length} movies\n`);
  
  const changes: Change[] = [];
  let fixedCount = 0;
  
  // === FIX 1: Remove lead actors from supporting_cast ===
  console.log(chalk.blue('📋 FIX 1: Remove lead actors from supporting_cast\n'));
  
  for (const m of movies) {
    if (!m.supporting_cast?.length) continue;
    
    const heroNorm = normalize(m.hero);
    const heroineNorm = normalize(m.heroine);
    
    const originalCast = [...m.supporting_cast];
    const newCast = m.supporting_cast.filter(sc => {
      const scNorm = normalize(sc);
      return scNorm !== heroNorm && scNorm !== heroineNorm;
    });
    
    if (newCast.length < originalCast.length) {
      const removed = originalCast.filter(c => !newCast.includes(c));
      
      // Show before/after
      console.log(chalk.yellow(`${m.title_en} (${m.release_year})`));
      console.log(`  ${chalk.red('- supporting_cast:')} ${removed.join(', ')}`);
      console.log(`  ${chalk.green('+ removed from supporting (kept in lead)')}`);
      console.log();
      
      changes.push({
        slug: m.slug,
        title: m.title_en,
        year: m.release_year,
        field: 'supporting_cast',
        before: removed.join(', '),
        after: '[REMOVED - kept as lead]',
      });
      
      // Apply fix
      const { error } = await supabase
        .from('movies')
        .update({ supporting_cast: newCast })
        .eq('id', m.id);
      
      if (!error) fixedCount++;
    }
  }
  
  // === FIX 2: Standardize hero names ===
  console.log(chalk.blue('\n📋 FIX 2: Standardize hero names\n'));
  
  for (const m of movies) {
    if (!m.hero) continue;
    const heroNorm = normalize(m.hero);
    
    if (NAME_STANDARDS[heroNorm] && m.hero !== NAME_STANDARDS[heroNorm]) {
      console.log(chalk.yellow(`${m.title_en} (${m.release_year})`));
      console.log(`  ${chalk.red('- hero:')} ${m.hero}`);
      console.log(`  ${chalk.green('+ hero:')} ${NAME_STANDARDS[heroNorm]}`);
      console.log();
      
      changes.push({
        slug: m.slug,
        title: m.title_en,
        year: m.release_year,
        field: 'hero',
        before: m.hero,
        after: NAME_STANDARDS[heroNorm],
      });
      
      const { error } = await supabase
        .from('movies')
        .update({ hero: NAME_STANDARDS[heroNorm] })
        .eq('id', m.id);
      
      if (!error) fixedCount++;
    }
  }
  
  // === FIX 3: Standardize heroine names ===
  console.log(chalk.blue('\n📋 FIX 3: Standardize heroine names\n'));
  
  for (const m of movies) {
    if (!m.heroine) continue;
    const heroineNorm = normalize(m.heroine);
    
    if (NAME_STANDARDS[heroineNorm] && m.heroine !== NAME_STANDARDS[heroineNorm]) {
      console.log(chalk.yellow(`${m.title_en} (${m.release_year})`));
      console.log(`  ${chalk.red('- heroine:')} ${m.heroine}`);
      console.log(`  ${chalk.green('+ heroine:')} ${NAME_STANDARDS[heroineNorm]}`);
      console.log();
      
      changes.push({
        slug: m.slug,
        title: m.title_en,
        year: m.release_year,
        field: 'heroine',
        before: m.heroine,
        after: NAME_STANDARDS[heroineNorm],
      });
      
      const { error } = await supabase
        .from('movies')
        .update({ heroine: NAME_STANDARDS[heroineNorm] })
        .eq('id', m.id);
      
      if (!error) fixedCount++;
    }
  }
  
  // === FIX 4: Complete music director duos ===
  console.log(chalk.blue('\n📋 FIX 4: Complete music director duos\n'));
  
  for (const m of movies) {
    if (!m.music_director) continue;
    const mdNorm = normalize(m.music_director);
    
    if (MUSIC_DUOS[mdNorm]) {
      console.log(chalk.yellow(`${m.title_en} (${m.release_year})`));
      console.log(`  ${chalk.red('- music_director:')} ${m.music_director}`);
      console.log(`  ${chalk.green('+ music_director:')} ${MUSIC_DUOS[mdNorm]}`);
      console.log();
      
      changes.push({
        slug: m.slug,
        title: m.title_en,
        year: m.release_year,
        field: 'music_director',
        before: m.music_director,
        after: MUSIC_DUOS[mdNorm],
      });
      
      const { error } = await supabase
        .from('movies')
        .update({ music_director: MUSIC_DUOS[mdNorm] })
        .eq('id', m.id);
      
      if (!error) fixedCount++;
    }
  }
  
  // Summary
  console.log(chalk.bold('\n' + '='.repeat(60)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  
  const byField: Record<string, number> = {};
  for (const c of changes) {
    byField[c.field] = (byField[c.field] || 0) + 1;
  }
  
  console.log('Changes by field:');
  for (const [f, c] of Object.entries(byField).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${f.padEnd(20)} ${c}`);
  }
  
  console.log(`\n${chalk.green('✅ Total changes applied:')} ${fixedCount}`);
  console.log();
}

applyFixes().catch(console.error);
