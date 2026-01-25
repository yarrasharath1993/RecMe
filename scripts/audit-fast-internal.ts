#!/usr/bin/env npx tsx
/**
 * FAST INTERNAL AUDIT - No external APIs, in-memory processing
 * Based on patterns that worked before
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
  poster_url: string | null;
  genres: string[] | null;
  language: string | null;
  runtime_minutes: number | null;
  tmdb_id: number | null;
}

interface Issue {
  id: string;
  slug: string;
  title: string;
  year: number | null;
  category: string;
  issue_type: string;
  field: string;
  current_value: string;
  suggested_fix: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  auto_fixable: boolean;
}

// === KNOWN PATTERNS ===

const KNOWN_FEMALE_ACTORS = new Set([
  'sridevi', 'jaya prada', 'savitri', 'soundarya', 'roja', 'meena', 'ramya krishnan',
  'simran', 'tamannaah', 'kajal aggarwal', 'samantha', 'anushka shetty', 'nayanthara',
  'shruti haasan', 'pooja hegde', 'rakul preet singh', 'sai pallavi', 'rashmika mandanna',
  'keerthy suresh', 'trisha', 'ileana dcruz', 'hansika motwani', 'regina cassandra',
  'raashi khanna', 'lavanya tripathi', 'nabha natesh', 'silk smitha', 'vijayashanti',
]);

const KNOWN_MALE_ACTORS = new Set([
  'chiranjeevi', 'nagarjuna', 'venkatesh', 'balakrishna', 'mohan babu', 'krishna',
  'n.t. rama rao', 'sobhan babu', 'krishnam raju', 'suman', 'jagapathi babu',
  'mahesh babu', 'pawan kalyan', 'jr. ntr', 'ram charan', 'allu arjun', 'prabhas',
  'rana daggubati', 'naga chaitanya', 'ravi teja', 'gopichand', 'ntr', 'jr ntr',
  'sundeep kishan', 'nani', 'vijay deverakonda', 'sharwanand', 'sudheer babu',
]);

const NAME_NORMALIZATIONS: Record<string, string> = {
  'jr ntr': 'Jr. NTR',
  'ntr jr': 'Jr. NTR',
  'akkineni nagarjuna': 'Nagarjuna',
  'samantha ruth prabhu': 'Samantha',
  'samantha akkineni': 'Samantha',
  'tamannaah bhatia': 'Tamannaah',
  'tamanna': 'Tamannaah',
};

const MUSIC_DUO_FIXES: Record<string, string> = {
  'laxmikant': 'Laxmikant-Pyarelal',
  'pyarelal': 'Laxmikant-Pyarelal',
  'anand': 'Anand-Milind',
  'milind': 'Anand-Milind',
  'nadeem': 'Nadeem-Shravan',
  'shravan': 'Nadeem-Shravan',
};

// Suspicious title patterns
const AWARD_PATTERNS = ['iifa', 'filmfare', 'nandi awards', 'zee cine', 'mirchi music', 'national award'];
const TV_PATTERNS = ['bigg boss', 'dance india', 'super singer', 'indian idol'];
const DOCUMENTARY_PATTERNS = ['behind the scenes', 'making of', 'documentary'];

const normalize = (s: any): string => {
  if (s == null) return '';
  if (typeof s === 'string') return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (typeof s === 'object' && s.name) return String(s.name).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
};

async function fetchAllMovies(): Promise<Movie[]> {
  console.log(chalk.blue('📊 Fetching all movies...'));
  let all: Movie[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, slug, title_en, title_te, release_year, hero, heroine, director, music_director, supporting_cast, poster_url, genres, language, runtime_minutes, tmdb_id')
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

function runAudit(movies: Movie[]): Issue[] {
  const issues: Issue[] = [];
  const currentYear = new Date().getFullYear();

  for (const m of movies) {
    // 1. GENDER_SWAP: Female actor in hero field
    if (m.hero) {
      const heroNorm = normalize(m.hero);
      if (KNOWN_FEMALE_ACTORS.has(heroNorm)) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          category: 'GENDER_SWAP', issue_type: 'FEMALE_IN_HERO',
          field: 'hero', current_value: m.hero, suggested_fix: 'Move to heroine',
          severity: 'high', auto_fixable: false,
        });
      }
    }

    // 2. GENDER_SWAP: Male actor in heroine field
    if (m.heroine) {
      const heroineNorm = normalize(m.heroine);
      if (KNOWN_MALE_ACTORS.has(heroineNorm)) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          category: 'GENDER_SWAP', issue_type: 'MALE_IN_HEROINE',
          field: 'heroine', current_value: m.heroine, suggested_fix: 'Move to hero',
          severity: 'high', auto_fixable: false,
        });
      }
    }

    // 3. NAME_FORMAT: Standardize names
    if (m.hero) {
      const heroNorm = normalize(m.hero);
      if (NAME_NORMALIZATIONS[heroNorm] && m.hero !== NAME_NORMALIZATIONS[heroNorm]) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          category: 'NAME_FORMAT', issue_type: 'HERO_NAME_VARIANT',
          field: 'hero', current_value: m.hero, suggested_fix: NAME_NORMALIZATIONS[heroNorm],
          severity: 'low', auto_fixable: true,
        });
      }
    }

    if (m.heroine) {
      const heroineNorm = normalize(m.heroine);
      if (NAME_NORMALIZATIONS[heroineNorm] && m.heroine !== NAME_NORMALIZATIONS[heroineNorm]) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          category: 'NAME_FORMAT', issue_type: 'HEROINE_NAME_VARIANT',
          field: 'heroine', current_value: m.heroine, suggested_fix: NAME_NORMALIZATIONS[heroineNorm],
          severity: 'low', auto_fixable: true,
        });
      }
    }

    // 4. MUSIC_DUO: Incomplete duo names
    if (m.music_director) {
      const mdNorm = normalize(m.music_director);
      if (MUSIC_DUO_FIXES[mdNorm]) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          category: 'MUSIC_DUO', issue_type: 'INCOMPLETE_DUO',
          field: 'music_director', current_value: m.music_director, suggested_fix: MUSIC_DUO_FIXES[mdNorm],
          severity: 'low', auto_fixable: true,
        });
      }
    }

    // 5. BAD_SLUG: Wikidata ID as slug
    if (m.slug && /^q\d+(-|$)/i.test(m.slug)) {
      issues.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        category: 'BAD_SLUG', issue_type: 'WIKIDATA_ID_SLUG',
        field: 'slug', current_value: m.slug, suggested_fix: 'Generate proper slug',
        severity: 'medium', auto_fixable: false,
      });
    }

    // 6. SUSPICIOUS_ENTRY: Award shows, TV, documentaries
    const titleLower = (m.title_en || '').toLowerCase();
    for (const pattern of AWARD_PATTERNS) {
      if (titleLower.includes(pattern)) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          category: 'SUSPICIOUS_ENTRY', issue_type: 'AWARD_CEREMONY',
          field: 'title_en', current_value: m.title_en, suggested_fix: 'May not be a movie',
          severity: 'medium', auto_fixable: false,
        });
        break;
      }
    }
    for (const pattern of TV_PATTERNS) {
      if (titleLower.includes(pattern)) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          category: 'SUSPICIOUS_ENTRY', issue_type: 'TV_SHOW',
          field: 'title_en', current_value: m.title_en, suggested_fix: 'May be a TV show',
          severity: 'medium', auto_fixable: false,
        });
        break;
      }
    }
    for (const pattern of DOCUMENTARY_PATTERNS) {
      if (titleLower.includes(pattern)) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          category: 'SUSPICIOUS_ENTRY', issue_type: 'DOCUMENTARY',
          field: 'title_en', current_value: m.title_en, suggested_fix: 'May be a documentary',
          severity: 'low', auto_fixable: false,
        });
        break;
      }
    }

    // 7. TIMELINE: Future year (too far)
    if (m.release_year && m.release_year > currentYear + 3) {
      issues.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        category: 'TIMELINE', issue_type: 'FAR_FUTURE_YEAR',
        field: 'release_year', current_value: String(m.release_year), suggested_fix: `Should be <= ${currentYear + 2}`,
        severity: 'medium', auto_fixable: false,
      });
    }

    // 8. TIMELINE: Too old (before 1910)
    if (m.release_year && m.release_year < 1910) {
      issues.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        category: 'TIMELINE', issue_type: 'IMPOSSIBLE_YEAR',
        field: 'release_year', current_value: String(m.release_year), suggested_fix: 'Year before Indian cinema',
        severity: 'high', auto_fixable: false,
      });
    }

    // 9. PLACEHOLDER: Poster URL
    if (m.poster_url && (m.poster_url.includes('placeholder') || m.poster_url.includes('no_poster'))) {
      issues.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        category: 'PLACEHOLDER', issue_type: 'PLACEHOLDER_POSTER',
        field: 'poster_url', current_value: m.poster_url, suggested_fix: 'Find actual poster',
        severity: 'low', auto_fixable: false,
      });
    }

    // 10. DUPLICATE_CAST: Same actor in hero and heroine
    if (m.hero && m.heroine && normalize(m.hero) === normalize(m.heroine)) {
      issues.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        category: 'DATA_ERROR', issue_type: 'DUPLICATE_CAST',
        field: 'hero/heroine', current_value: `${m.hero}=${m.heroine}`, suggested_fix: 'Fix duplicate',
        severity: 'high', auto_fixable: false,
      });
    }

    // 11. CAST_IN_SUPPORT: Lead actor also in supporting cast
    if (m.supporting_cast?.length && m.hero) {
      const heroNorm = normalize(m.hero);
      for (const sc of m.supporting_cast) {
        if (sc && normalize(sc) === heroNorm) {
          issues.push({
            id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
            category: 'DATA_ERROR', issue_type: 'CAST_IN_SUPPORT',
            field: 'supporting_cast', current_value: m.hero, suggested_fix: 'Remove from supporting cast',
            severity: 'medium', auto_fixable: true,
          });
          break;
        }
      }
    }
    if (m.supporting_cast?.length && m.heroine) {
      const heroineNorm = normalize(m.heroine);
      for (const sc of m.supporting_cast) {
        if (sc && normalize(sc) === heroineNorm) {
          issues.push({
            id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
            category: 'DATA_ERROR', issue_type: 'CAST_IN_SUPPORT',
            field: 'supporting_cast', current_value: m.heroine, suggested_fix: 'Remove from supporting cast',
            severity: 'medium', auto_fixable: true,
          });
          break;
        }
      }
    }

    // 12. MISSING_DATA: Critical fields empty
    if (!m.hero && !m.heroine) {
      issues.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        category: 'MISSING_DATA', issue_type: 'NO_LEAD_CAST',
        field: 'hero/heroine', current_value: '', suggested_fix: 'Add lead cast',
        severity: 'medium', auto_fixable: false,
      });
    }
    if (!m.director) {
      issues.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        category: 'MISSING_DATA', issue_type: 'NO_DIRECTOR',
        field: 'director', current_value: '', suggested_fix: 'Add director',
        severity: 'medium', auto_fixable: false,
      });
    }
  }

  return issues;
}

function exportCSV(issues: Issue[], filename: string) {
  const header = 'id,slug,title,year,category,issue_type,field,current_value,suggested_fix,severity,auto_fixable';
  const rows = issues.map(i => 
    `"${i.id}","${i.slug}","${i.title.replace(/"/g, '""')}",${i.year || 'null'},"${i.category}","${i.issue_type}","${i.field}","${String(i.current_value).replace(/"/g, '""')}","${i.suggested_fix.replace(/"/g, '""')}","${i.severity}",${i.auto_fixable}`
  );
  writeFileSync(filename, [header, ...rows].join('\n'));
  console.log(chalk.cyan(`📄 Exported ${issues.length} issues to ${filename}`));
}

async function main() {
  console.log(chalk.bold('\n🚀 FAST INTERNAL AUDIT\n'));
  const start = Date.now();
  
  const movies = await fetchAllMovies();
  const issues = runAudit(movies);
  
  // Summary
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let autoFixable = 0;
  
  for (const i of issues) {
    byCategory[i.category] = (byCategory[i.category] || 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    if (i.auto_fixable) autoFixable++;
  }
  
  console.log('\n📊 SUMMARY\n');
  console.log('By Category:');
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(20)} ${count}`);
  }
  
  console.log('\nBy Severity:');
  for (const [sev, count] of Object.entries(bySeverity)) {
    const color = sev === 'critical' ? chalk.red : sev === 'high' ? chalk.yellow : sev === 'medium' ? chalk.blue : chalk.gray;
    console.log(`  ${color(sev.padEnd(12))} ${count}`);
  }
  
  console.log(`\nAuto-fixable: ${autoFixable}`);
  console.log(`Manual review: ${issues.length - autoFixable}`);
  console.log(`\nTotal: ${chalk.bold(issues.length)} issues`);
  console.log(`Duration: ${((Date.now() - start) / 1000).toFixed(1)}s\n`);
  
  exportCSV(issues, 'FAST-AUDIT-RESULTS.csv');
  
  // Export auto-fixable
  const autoFix = issues.filter(i => i.auto_fixable);
  if (autoFix.length > 0) {
    exportCSV(autoFix, 'AUTO-FIXABLE.csv');
  }
  
  // Export high severity
  const highSev = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  if (highSev.length > 0) {
    exportCSV(highSev, 'HIGH-SEVERITY.csv');
  }
  
  console.log(chalk.green('\n✅ AUDIT COMPLETE\n'));
}

main().catch(console.error);
