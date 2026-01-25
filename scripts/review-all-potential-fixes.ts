#!/usr/bin/env npx tsx
/**
 * Review all potential fixes - NO AUTO-FIX
 * Shows before/after for manual review
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

// Potential fixes (for review only)
const NAME_STANDARDS: Record<string, string> = {
  'jr ntr': 'Jr. NTR',
  'ntr jr': 'Jr. NTR',
  'akkineni nagarjuna': 'Nagarjuna',
  'samantha ruth prabhu': 'Samantha',
  'samantha akkineni': 'Samantha',
  'tamannaah bhatia': 'Tamannaah',
  'tamanna': 'Tamannaah',
};

// Music director duos - FOR REVIEW ONLY (not auto-fix)
const MUSIC_DUOS: Record<string, string> = {
  'laxmikant': 'Laxmikant-Pyarelal',
  'pyarelal': 'Laxmikant-Pyarelal',
  'anand': 'Anand-Milind',
  'milind': 'Anand-Milind',
  'nadeem': 'Nadeem-Shravan',
  'shravan': 'Nadeem-Shravan',
  'raj': 'Raj-Koti',
  'koti': 'Raj-Koti',
};

async function reviewAllFixes(): Promise<void> {
  console.log(chalk.bold('\n📋 MANUAL REVIEW - ALL POTENTIAL FIXES\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
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
  
  console.log(`Found ${movies.length} movies for review\n`);
  
  const issues: Array<{
    type: string;
    slug: string;
    title: string;
    year: number | null;
    field: string;
    before: string;
    after: string;
    note?: string;
  }> = [];
  
  // === 1. Supporting cast duplicates ===
  console.log(chalk.blue('1️⃣  SUPPORTING CAST - Lead actors in supporting_cast\n'));
  let castCount = 0;
  
  for (const m of movies) {
    if (!m.supporting_cast?.length) continue;
    
    const heroNorm = normalize(m.hero);
    const heroineNorm = normalize(m.heroine);
    
    const removedNames: string[] = [];
    for (const sc of m.supporting_cast) {
      const scNorm = normalize(sc);
      const scName = getName(sc);
      if ((heroNorm && scNorm === heroNorm) || (heroineNorm && scNorm === heroineNorm)) {
        removedNames.push(scName);
      }
    }
    
    if (removedNames.length > 0) {
      issues.push({
        type: 'CAST_DUPLICATE',
        slug: m.slug,
        title: m.title_en,
        year: m.release_year,
        field: 'supporting_cast',
        before: removedNames.join(', '),
        after: '[REMOVE - already in lead]',
        note: `hero="${m.hero || 'N/A'}", heroine="${m.heroine || 'N/A'}"`,
      });
      castCount++;
    }
  }
  
  console.log(`   Found ${castCount} movies with lead actors in supporting_cast\n`);
  
  // === 2. Hero name standardization ===
  console.log(chalk.blue('2️⃣  HERO NAMES - Name variant standardization\n'));
  let heroCount = 0;
  
  for (const m of movies) {
    if (!m.hero) continue;
    const heroNorm = normalize(m.hero);
    
    if (NAME_STANDARDS[heroNorm] && m.hero !== NAME_STANDARDS[heroNorm]) {
      issues.push({
        type: 'NAME_VARIANT',
        slug: m.slug,
        title: m.title_en,
        year: m.release_year,
        field: 'hero',
        before: m.hero,
        after: NAME_STANDARDS[heroNorm],
      });
      heroCount++;
    }
  }
  
  console.log(`   Found ${heroCount} hero name variants\n`);
  
  // === 3. Heroine name standardization ===
  console.log(chalk.blue('3️⃣  HEROINE NAMES - Name variant standardization\n'));
  let heroineCount = 0;
  
  for (const m of movies) {
    if (!m.heroine) continue;
    const heroineNorm = normalize(m.heroine);
    
    if (NAME_STANDARDS[heroineNorm] && m.heroine !== NAME_STANDARDS[heroineNorm]) {
      issues.push({
        type: 'NAME_VARIANT',
        slug: m.slug,
        title: m.title_en,
        year: m.release_year,
        field: 'heroine',
        before: m.heroine,
        after: NAME_STANDARDS[heroineNorm],
      });
      heroineCount++;
    }
  }
  
  console.log(`   Found ${heroineCount} heroine name variants\n`);
  
  // === 4. Music director duos - FOR REVIEW ONLY ===
  console.log(chalk.blue('4️⃣  MUSIC DIRECTOR DUOS - Potential incomplete duos (REVIEW CAREFULLY)\n'));
  let musicCount = 0;
  
  for (const m of movies) {
    if (!m.music_director) continue;
    const mdNorm = normalize(m.music_director);
    
    // Only flag if it's a single name that could be part of a duo
    // But don't auto-fix - needs manual verification
    if (MUSIC_DUOS[mdNorm] && !m.music_director.includes('-') && !m.music_director.includes('–')) {
      issues.push({
        type: 'MUSIC_DUO_REVIEW',
        slug: m.slug,
        title: m.title_en,
        year: m.release_year,
        field: 'music_director',
        before: m.music_director,
        after: MUSIC_DUOS[mdNorm],
        note: '⚠️  VERIFY: May be correct as single name or should be duo',
      });
      musicCount++;
    }
  }
  
  console.log(`   Found ${musicCount} potential music director duo issues (REVIEW REQUIRED)\n`);
  
  // === Print all issues for review ===
  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📝 ALL ISSUES FOR MANUAL REVIEW'));
  console.log('═'.repeat(70) + '\n');
  
  const byType: Record<string, number> = {};
  for (const issue of issues) {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
  }
  
  console.log('Summary by type:');
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type.padEnd(20)} ${count}`);
  }
  
  console.log(chalk.bold(`\nTotal issues: ${issues.length}\n`));
  console.log('═'.repeat(70) + '\n');
  
  // Group by type and print
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, typeof issues>);
  
  for (const [type, typeIssues] of Object.entries(grouped)) {
    console.log(chalk.bold(`\n${type} (${typeIssues.length} issues):`));
    console.log('─'.repeat(70));
    
    for (const issue of typeIssues) {
      console.log(chalk.yellow(`\n${issue.title} (${issue.year || 'N/A'})`));
      console.log(`  Slug: ${issue.slug}`);
      console.log(`  Field: ${issue.field}`);
      console.log(chalk.red(`  BEFORE: "${issue.before}"`));
      console.log(chalk.green(`  AFTER:  "${issue.after}"`));
      if (issue.note) {
        console.log(chalk.blue(`  NOTE: ${issue.note}`));
      }
    }
  }
  
  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('✅ REVIEW COMPLETE - NO CHANGES MADE'));
  console.log('═'.repeat(70) + '\n');
}

reviewAllFixes().catch(console.error);
