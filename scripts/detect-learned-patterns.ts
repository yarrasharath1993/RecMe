#!/usr/bin/env npx tsx
/**
 * LEARNED PATTERN DETECTOR
 * Patterns learned from 200+ manual corrections
 * 
 * Patterns:
 * 1. FEMALE_LEAD_MISCLASSIFIED - Female-centric films with heroine in hero field
 * 2. LEGACY_COLUMN_SHIFT - 1970s-80s films with systematic field swaps
 * 3. MULTI_LANGUAGE_INCONSISTENCY - Same film, different data across languages
 * 4. ANTHOLOGY_SEGMENT_LEAD - Anthology film segment leads
 * 5. NAME_VARIANT_MISMATCH - Standardization issues
 * 6. MUSIC_DIRECTOR_DUO_INCOMPLETE - Missing duo partner
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Movie {
  id: string;
  slug: string;
  title_en: string;
  title_te: string | null;
  release_year: number | null;
  hero: string | null;
  heroine: string | null;
  director: string | null;
  music_director: string | null;
  supporting_cast: string[] | null;
  genres: string[] | null;
  language: string | null;
}

interface LearnedPattern {
  id: string;
  slug: string;
  title: string;
  year: number | null;
  pattern: string;
  pattern_type: string;
  field: string;
  current_value: string;
  suggested_fix: string;
  confidence: number;
  reasoning: string;
}

const normalize = (s: any): string => {
  if (s == null) return '';
  if (typeof s === 'string') return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
};

// === LEARNED PATTERNS FROM MANUAL ENRICHMENT ===

// Pattern 1: Female-centric films where heroine should be in heroine field
// These are films where the female lead is the protagonist
const FEMALE_CENTRIC_INDICATORS = [
  'ammoru', 'arundhati', 'rudhramadevi', 'oh baby', 'yashoda', 'anaamika',
  'chandramukhi', 'nagina', 'bhaagamathie', 'devi', 'abhinetri', 'lakshmi bomb',
  'english vinglish', 'mom', 'chandralekha', 'anthapuram',
];

// Pattern 2: Known female actors who are often misclassified
const FEMALE_LEADS_OFTEN_MISCLASSIFIED = new Set([
  'sridevi', 'jaya prada', 'soundarya', 'anushka shetty', 'samantha',
  'tamannaah', 'kajal aggarwal', 'shruti haasan', 'ramya krishnan',
  'savitri', 'meena', 'roja', 'nayanthara', 'lavanya tripathi',
]);

// Pattern 3: Male actors who appear in heroine field due to legacy data shifts
const LEGACY_MALE_ACTORS = new Set([
  'sobhan babu', 'krishnam raju', 'krishna', 'chiranjeevi', 'suman',
  'jagapathi babu', 'ravi teja', 'sundeep kishan', 'prabhas', 'rana daggubati',
  'naga chaitanya', 'mohan babu',
]);

// Pattern 4: Name standardization mappings (learned from corrections)
const NAME_STANDARDS: Record<string, string> = {
  'jr ntr': 'Jr. NTR',
  'ntr jr': 'Jr. NTR',
  'n t rama rao jr': 'Jr. NTR',
  'nandamuri taraka rama rao jr': 'Jr. NTR',
  'akkineni nagarjuna': 'Nagarjuna',
  'nagarjuna akkineni': 'Nagarjuna',
  'samantha ruth prabhu': 'Samantha',
  'samantha akkineni': 'Samantha',
  'tamannaah bhatia': 'Tamannaah',
  'tamanna bhatia': 'Tamannaah',
  'tamanna': 'Tamannaah',
  'kajal agarwal': 'Kajal Aggarwal',
  'ram charan teja': 'Ram Charan',
  'allu arjun stylish': 'Allu Arjun',
  'pawan kalyan konidela': 'Pawan Kalyan',
  'chiranjeevi konidela': 'Chiranjeevi',
  'mahesh babu ghattamaneni': 'Mahesh Babu',
};

// Pattern 5: Music director duo completions
const MUSIC_DUOS: Record<string, string> = {
  'laxmikant': 'Laxmikant-Pyarelal',
  'pyarelal': 'Laxmikant-Pyarelal',
  'laxmikant shantaram kudalkar': 'Laxmikant-Pyarelal',
  'anand': 'Anand-Milind',
  'milind': 'Anand-Milind',
  'nadeem': 'Nadeem-Shravan',
  'shravan': 'Nadeem-Shravan',
  'raj': 'Raj-Koti',
  'koti': 'Raj-Koti',
  'shankar': 'Shankar-Ehsaan-Loy',
  'ehsaan': 'Shankar-Ehsaan-Loy',
  'loy': 'Shankar-Ehsaan-Loy',
  'vishal': 'Vishal-Shekhar',
  'shekhar': 'Vishal-Shekhar',
  'sachin': 'Sachin-Jigar',
  'jigar': 'Sachin-Jigar',
  'ajay': 'Ajay-Atul',
  'atul': 'Ajay-Atul',
};

// Pattern 6: Anthology/Documentary/Special category titles
const SPECIAL_CATEGORY_PATTERNS = [
  { pattern: /behind.*beyond|behind the scenes|making of/i, type: 'DOCUMENTARY' },
  { pattern: /lust stories|pitta kathalu|ajeeb daastaans|sillu karupatti/i, type: 'ANTHOLOGY' },
  { pattern: /modern masters|beyond the fairy tale/i, type: 'DOCUMENTARY' },
];

async function fetchAllMovies(): Promise<Movie[]> {
  console.log(chalk.blue('📊 Fetching all movies...'));
  let all: Movie[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, slug, title_en, title_te, release_year, hero, heroine, director, music_director, supporting_cast, genres, language')
      .eq('is_published', true)
      .range(offset, offset + 999);
    
    if (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      break;
    }
    if (!data?.length) break;
    all = all.concat(data as Movie[]);
    if (data.length < 1000) break;
    offset += 1000;
  }
  
  console.log(`   Found ${all.length} movies\n`);
  return all;
}

function detectPatterns(movies: Movie[]): LearnedPattern[] {
  const patterns: LearnedPattern[] = [];
  
  for (const m of movies) {
    const titleLower = (m.title_en || '').toLowerCase();
    const slugLower = (m.slug || '').toLowerCase();
    const heroNorm = normalize(m.hero);
    const heroineNorm = normalize(m.heroine);
    
    // === PATTERN 1: Female-centric film misclassification ===
    // Check if title suggests female-centric film but female actor is in hero field
    const isFemalecentricTitle = FEMALE_CENTRIC_INDICATORS.some(ind => 
      titleLower.includes(ind) || slugLower.includes(ind.replace(/\s+/g, '-'))
    );
    
    if (isFemalecentricTitle && m.hero && FEMALE_LEADS_OFTEN_MISCLASSIFIED.has(heroNorm)) {
      patterns.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        pattern: 'FEMALE_LEAD_MISCLASSIFIED',
        pattern_type: 'FEMALE_CENTRIC_FILM',
        field: 'hero',
        current_value: m.hero,
        suggested_fix: 'Move to heroine field',
        confidence: 0.90,
        reasoning: `Title "${m.title_en}" suggests female-centric film, ${m.hero} should be in heroine field`,
      });
    }
    
    // === PATTERN 2: Legacy column shift (1970s-80s films) ===
    if (m.release_year && m.release_year >= 1970 && m.release_year <= 1990) {
      if (m.heroine && LEGACY_MALE_ACTORS.has(heroineNorm)) {
        patterns.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          pattern: 'LEGACY_COLUMN_SHIFT',
          pattern_type: 'MALE_IN_HEROINE_70S_80S',
          field: 'heroine',
          current_value: m.heroine,
          suggested_fix: 'Move to hero field',
          confidence: 0.85,
          reasoning: `Legacy ${m.release_year} film has male actor ${m.heroine} in heroine field - likely column shift`,
        });
      }
    }
    
    // === PATTERN 3: Name standardization ===
    if (m.hero && NAME_STANDARDS[heroNorm] && m.hero !== NAME_STANDARDS[heroNorm]) {
      patterns.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        pattern: 'NAME_VARIANT_MISMATCH',
        pattern_type: 'HERO_NAME_VARIANT',
        field: 'hero',
        current_value: m.hero,
        suggested_fix: NAME_STANDARDS[heroNorm],
        confidence: 0.95,
        reasoning: `Standardize "${m.hero}" to "${NAME_STANDARDS[heroNorm]}"`,
      });
    }
    
    if (m.heroine && NAME_STANDARDS[heroineNorm] && m.heroine !== NAME_STANDARDS[heroineNorm]) {
      patterns.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        pattern: 'NAME_VARIANT_MISMATCH',
        pattern_type: 'HEROINE_NAME_VARIANT',
        field: 'heroine',
        current_value: m.heroine,
        suggested_fix: NAME_STANDARDS[heroineNorm],
        confidence: 0.95,
        reasoning: `Standardize "${m.heroine}" to "${NAME_STANDARDS[heroineNorm]}"`,
      });
    }
    
    // === PATTERN 4: Music director duo incomplete ===
    if (m.music_director) {
      const mdNorm = normalize(m.music_director);
      // Check for single-name duos
      if (MUSIC_DUOS[mdNorm] && m.music_director.toLowerCase() !== MUSIC_DUOS[mdNorm].toLowerCase()) {
        patterns.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          pattern: 'MUSIC_DIRECTOR_DUO_INCOMPLETE',
          pattern_type: 'INCOMPLETE_DUO',
          field: 'music_director',
          current_value: m.music_director,
          suggested_fix: MUSIC_DUOS[mdNorm],
          confidence: 0.90,
          reasoning: `"${m.music_director}" is part of duo "${MUSIC_DUOS[mdNorm]}"`,
        });
      }
    }
    
    // === PATTERN 5: Anthology/Documentary categorization ===
    for (const { pattern, type } of SPECIAL_CATEGORY_PATTERNS) {
      if (pattern.test(m.title_en || '')) {
        // Check if hero/heroine are set incorrectly for documentaries
        if (type === 'DOCUMENTARY' && (m.hero || m.heroine)) {
          patterns.push({
            id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
            pattern: 'ANTHOLOGY_SEGMENT_LEAD',
            pattern_type: type,
            field: 'hero/heroine',
            current_value: `${m.hero || ''}/${m.heroine || ''}`,
            suggested_fix: 'Remove leads (documentary/special)',
            confidence: 0.75,
            reasoning: `"${m.title_en}" appears to be a ${type.toLowerCase()}, may not need traditional hero/heroine`,
          });
        }
        break;
      }
    }
    
    // === PATTERN 6: Duplicate detection by similar title ===
    // Already handled by fast-internal audit
    
    // === PATTERN 7: Telugu title missing for Telugu films ===
    if (m.language === 'Telugu' && !m.title_te) {
      patterns.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        pattern: 'MISSING_TELUGU_TITLE',
        pattern_type: 'TELUGU_TITLE_REQUIRED',
        field: 'title_te',
        current_value: '',
        suggested_fix: 'Add Telugu title',
        confidence: 0.80,
        reasoning: `Telugu film "${m.title_en}" is missing Telugu title`,
      });
    }
  }
  
  return patterns;
}

function exportCSV(patterns: LearnedPattern[], filename: string) {
  const header = 'id,slug,title,year,pattern,pattern_type,field,current_value,suggested_fix,confidence,reasoning';
  const rows = patterns.map(p => 
    `"${p.id}","${p.slug}","${p.title.replace(/"/g, '""')}",${p.year || 'null'},"${p.pattern}","${p.pattern_type}","${p.field}","${String(p.current_value).replace(/"/g, '""')}","${p.suggested_fix.replace(/"/g, '""')}",${p.confidence},"${p.reasoning.replace(/"/g, '""')}"`
  );
  writeFileSync(filename, [header, ...rows].join('\n'));
  console.log(chalk.cyan(`📄 Exported ${patterns.length} patterns to ${filename}`));
}

async function main() {
  console.log(chalk.bold('\n🔍 LEARNED PATTERN DETECTOR\n'));
  console.log('   Based on 200+ manual corrections\n');
  
  const start = Date.now();
  const movies = await fetchAllMovies();
  const patterns = detectPatterns(movies);
  
  // Summary
  const byPattern: Record<string, number> = {};
  const byType: Record<string, number> = {};
  
  for (const p of patterns) {
    byPattern[p.pattern] = (byPattern[p.pattern] || 0) + 1;
    byType[p.pattern_type] = (byType[p.pattern_type] || 0) + 1;
  }
  
  console.log('\n📊 SUMMARY\n');
  console.log('By Pattern:');
  for (const [pat, count] of Object.entries(byPattern).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${pat.padEnd(35)} ${count}`);
  }
  
  console.log('\nBy Type:');
  for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(30)} ${c}`);
  }
  
  const autoFixable = patterns.filter(p => 
    p.pattern === 'NAME_VARIANT_MISMATCH' || 
    p.pattern === 'MUSIC_DIRECTOR_DUO_INCOMPLETE'
  ).length;
  
  console.log(`\nAuto-fixable: ${autoFixable}`);
  console.log(`Manual review: ${patterns.length - autoFixable}`);
  console.log(`\nTotal: ${chalk.bold(patterns.length)} patterns detected`);
  console.log(`Duration: ${((Date.now() - start) / 1000).toFixed(1)}s\n`);
  
  exportCSV(patterns, 'LEARNED-PATTERNS-RESULTS.csv');
  
  // Export auto-fixable
  const autoFix = patterns.filter(p => 
    p.pattern === 'NAME_VARIANT_MISMATCH' || 
    p.pattern === 'MUSIC_DIRECTOR_DUO_INCOMPLETE'
  );
  if (autoFix.length > 0) {
    exportCSV(autoFix, 'LEARNED-AUTO-FIXABLE.csv');
  }
  
  // Export high-confidence for review
  const highConfidence = patterns.filter(p => p.confidence >= 0.85);
  if (highConfidence.length > 0) {
    exportCSV(highConfidence, 'LEARNED-HIGH-CONFIDENCE.csv');
  }
  
  console.log(chalk.green('\n✅ LEARNED PATTERN DETECTION COMPLETE\n'));
}

main().catch(console.error);
