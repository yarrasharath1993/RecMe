#!/usr/bin/env npx tsx
/**
 * Apply auto-fixes with before/after diff display - V2
 * Handles both string and object supporting_cast
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
  supporting_cast: any[] | null;
}

const normalize = (s: any): string => {
  if (s == null) return '';
  if (typeof s === 'string') return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (typeof s === 'object' && s.name) return String(s.name).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
};

const getName = (item: any): string => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item.name) return item.name;
  return String(item);
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
  
  let castFixCount = 0;
  let heroFixCount = 0;
  let heroineFixCount = 0;
  let musicFixCount = 0;
  
  // === FIX 1: Remove lead actors from supporting_cast ===
  console.log(chalk.blue('📋 FIX 1: Remove lead actors from supporting_cast'));
  console.log(chalk.gray('─'.repeat(50)) + '\n');
  
  for (const m of movies) {
    if (!m.supporting_cast?.length) continue;
    
    const heroNorm = normalize(m.hero);
    const heroineNorm = normalize(m.heroine);
    
    const removedNames: string[] = [];
    const newCast = m.supporting_cast.filter(sc => {
      const scNorm = normalize(sc);
      const scName = getName(sc);
      if ((heroNorm && scNorm === heroNorm) || (heroineNorm && scNorm === heroineNorm)) {
        removedNames.push(scName);
        return false;
      }
      return true;
    });
    
    if (removedNames.length > 0) {
      console.log(chalk.yellow(`${m.title_en} (${m.release_year || 'N/A'})`));
      console.log(`  ${chalk.red('BEFORE:')} supporting_cast contains: ${removedNames.join(', ')}`);
      console.log(`  ${chalk.green('AFTER:')}  removed (already in lead: hero="${m.hero}", heroine="${m.heroine}")`);
      console.log();
      
      const { error } = await supabase
        .from('movies')
        .update({ supporting_cast: newCast })
        .eq('id', m.id);
      
      if (!error) castFixCount++;
    }
  }
  
  // === FIX 2: Standardize hero names ===
  console.log(chalk.blue('\n📋 FIX 2: Standardize hero names'));
  console.log(chalk.gray('─'.repeat(50)) + '\n');
  
  for (const m of movies) {
    if (!m.hero) continue;
    const heroNorm = normalize(m.hero);
    
    if (NAME_STANDARDS[heroNorm] && m.hero !== NAME_STANDARDS[heroNorm]) {
      console.log(chalk.yellow(`${m.title_en} (${m.release_year || 'N/A'})`));
      console.log(`  ${chalk.red('BEFORE:')} hero = "${m.hero}"`);
      console.log(`  ${chalk.green('AFTER:')}  hero = "${NAME_STANDARDS[heroNorm]}"`);
      console.log();
      
      const { error } = await supabase
        .from('movies')
        .update({ hero: NAME_STANDARDS[heroNorm] })
        .eq('id', m.id);
      
      if (!error) heroFixCount++;
    }
  }
  
  // === FIX 3: Standardize heroine names ===
  console.log(chalk.blue('\n📋 FIX 3: Standardize heroine names'));
  console.log(chalk.gray('─'.repeat(50)) + '\n');
  
  for (const m of movies) {
    if (!m.heroine) continue;
    const heroineNorm = normalize(m.heroine);
    
    if (NAME_STANDARDS[heroineNorm] && m.heroine !== NAME_STANDARDS[heroineNorm]) {
      console.log(chalk.yellow(`${m.title_en} (${m.release_year || 'N/A'})`));
      console.log(`  ${chalk.red('BEFORE:')} heroine = "${m.heroine}"`);
      console.log(`  ${chalk.green('AFTER:')}  heroine = "${NAME_STANDARDS[heroineNorm]}"`);
      console.log();
      
      const { error } = await supabase
        .from('movies')
        .update({ heroine: NAME_STANDARDS[heroineNorm] })
        .eq('id', m.id);
      
      if (!error) heroineFixCount++;
    }
  }
  
  // === FIX 4: Complete music director duos ===
  console.log(chalk.blue('\n📋 FIX 4: Complete music director duos'));
  console.log(chalk.gray('─'.repeat(50)) + '\n');
  
  for (const m of movies) {
    if (!m.music_director) continue;
    const mdNorm = normalize(m.music_director);
    
    if (MUSIC_DUOS[mdNorm]) {
      console.log(chalk.yellow(`${m.title_en} (${m.release_year || 'N/A'})`));
      console.log(`  ${chalk.red('BEFORE:')} music_director = "${m.music_director}"`);
      console.log(`  ${chalk.green('AFTER:')}  music_director = "${MUSIC_DUOS[mdNorm]}"`);
      console.log();
      
      const { error } = await supabase
        .from('movies')
        .update({ music_director: MUSIC_DUOS[mdNorm] })
        .eq('id', m.id);
      
      if (!error) musicFixCount++;
    }
  }
  
  // Summary
  console.log(chalk.bold('\n' + '═'.repeat(60)));
  console.log(chalk.bold('📊 SUMMARY'));
  console.log('═'.repeat(60) + '\n');
  
  console.log(`  supporting_cast cleaned:     ${chalk.green(castFixCount)}`);
  console.log(`  hero names standardized:     ${chalk.green(heroFixCount)}`);
  console.log(`  heroine names standardized:  ${chalk.green(heroineFixCount)}`);
  console.log(`  music director duos fixed:   ${chalk.green(musicFixCount)}`);
  console.log();
  console.log(`  ${chalk.bold('TOTAL FIXES APPLIED:')}         ${chalk.green(castFixCount + heroFixCount + heroineFixCount + musicFixCount)}`);
  console.log();
}

applyFixes().catch(console.error);
