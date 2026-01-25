#!/usr/bin/env npx tsx
/**
 * ENHANCED PATTERN-BASED MOVIE AUDIT
 * Patterns learned from manual enrichment sessions
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
  release_year: number;
  hero: string | null;
  heroine: string | null;
  director: string | null;
  music_director: string | null;
  supporting_cast: string[] | null;
  poster_url: string | null;
  synopsis: string | null;
}

interface Issue {
  id: string;
  slug: string;
  title: string;
  year: number;
  pattern: string;
  field: string;
  current_value: string;
  suggested_fix: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  auto_fixable: boolean;
}

// === KNOWN PATTERNS FROM ENRICHMENT SESSIONS ===

// 1. Name Normalization Patterns
const NAME_NORMALIZATIONS: Record<string, string> = {
  'n. t. rama rao': 'N.T. Rama Rao',
  'ntr': 'N.T. Rama Rao',
  'jr ntr': 'Jr. NTR',
  'jr. ntr': 'Jr. NTR',
  'nandamuri taraka rama rao': 'N.T. Rama Rao',
  'akkineni nagarjuna': 'Nagarjuna',
  'nagarjuna akkineni': 'Nagarjuna',
  'chiranjeevi konidela': 'Chiranjeevi',
  'pawan kalyan konidela': 'Pawan Kalyan',
  'ram charan teja': 'Ram Charan',
  'allu arjun stylish': 'Allu Arjun',
  'mahesh babu ghattamaneni': 'Mahesh Babu',
  'samantha ruth prabhu': 'Samantha',
  'samantha akkineni': 'Samantha',
  'tamannaah bhatia': 'Tamannaah',
  'tamanna': 'Tamannaah',
  'kajal aggarwal': 'Kajal Aggarwal',
  'kajal agarwal': 'Kajal Aggarwal',
};

// 2. Music Director Duo Corrections
const MUSIC_DIRECTOR_DUOS: Record<string, string> = {
  'laxmikant shantaram kudalkar': 'Laxmikant–Pyarelal',
  'pyarelal ramprasad sharma': 'Laxmikant–Pyarelal',
  'viswanathan t. k.': 'Viswanathan–Ramamoorthy',
  'raj koti': 'Raj–Koti',
  'nadeem shravan': 'Nadeem–Shravan',
  'anand milind': 'Anand–Milind',
  'shankar ehsaan loy': 'Shankar–Ehsaan–Loy',
  'vishal shekhar': 'Vishal–Shekhar',
  'ajay atul': 'Ajay–Atul',
  'sachin jigar': 'Sachin–Jigar',
};

// 3. Known Female Actors (for swap detection)
const KNOWN_FEMALE_ACTORS = new Set([
  'sridevi', 'jaya prada', 'savitri', 'soundarya', 'roja', 'meena', 'ramya krishnan',
  'simran', 'tamannaah', 'kajal aggarwal', 'samantha', 'anushka shetty', 'nayanthara',
  'shruti haasan', 'pooja hegde', 'rakul preet singh', 'sai pallavi', 'rashmika mandanna',
  'keerthy suresh', 'trisha', 'ileana dcruz', 'hansika motwani', 'regina cassandra',
  'raashi khanna', 'lavanya tripathi', 'nabha natesh', 'shraddha srinath', 'krithi shetty',
  'mrunal thakur', 'sreeleela', 'janhvi kapoor', 'deepika padukone', 'alia bhatt',
]);

// 4. Known Male Actors (for swap detection)
const KNOWN_MALE_ACTORS = new Set([
  'chiranjeevi', 'nagarjuna', 'venkatesh', 'balakrishna', 'mohan babu', 'krishna',
  'n.t. rama rao', 'sobhan babu', 'krishnam raju', 'suman', 'jagapathi babu',
  'mahesh babu', 'pawan kalyan', 'jr. ntr', 'ram charan', 'allu arjun', 'prabhas',
  'ravi teja', 'nani', 'vijay deverakonda', 'naga chaitanya', 'rana daggubati',
  'sharwanand', 'nithin', 'sai dharam tej', 'varun tej', 'sundeep kishan',
  'sudheer babu', 'raj tarun', 'bellamkonda sreenivas', 'aadi', 'sushanth',
]);

// 5. Director-Music Director Known Collaborations
const DIRECTOR_MD_COLLABS: Record<string, string[]> = {
  's.s. rajamouli': ['M.M. Keeravani', 'M. M. Keeravani'],
  'trivikram srinivas': ['S. Thaman', 'Thaman S.'],
  'sukumar': ['Devi Sri Prasad', 'DSP'],
  'koratala siva': ['Devi Sri Prasad', 'DSP'],
  'boyapati srinu': ['S. Thaman', 'Thaman S.'],
  'k. raghavendra rao': ['M.M. Keeravani', 'Koti', 'Raj–Koti'],
  'vv vinayak': ['Devi Sri Prasad', 'S. Thaman'],
  'puri jagannadh': ['Anup Rubens', 'Devi Sri Prasad'],
  'shankar': ['A.R. Rahman'],
  'mani ratnam': ['A.R. Rahman', 'Ilaiyaraaja'],
};

// 6. Actor Career Spans (for timeline validation)
const ACTOR_CAREER_START: Record<string, number> = {
  'chiranjeevi': 1978,
  'nagarjuna': 1986,
  'venkatesh': 1986,
  'balakrishna': 1974,
  'mahesh babu': 1999,
  'pawan kalyan': 1996,
  'jr. ntr': 2001,
  'ram charan': 2007,
  'allu arjun': 2003,
  'prabhas': 2002,
  'vijay deverakonda': 2011,
  'nani': 2008,
  'sridevi': 1967,
  'savitri': 1950,
  'tamannaah': 2005,
  'samantha': 2010,
  'kajal aggarwal': 2004,
};

// 7. Slug Pattern Issues
const SLUG_ISSUES = [
  { pattern: /^q\d+$/, issue: 'Wikidata ID as slug' },
  { pattern: /^[a-f0-9]{8}-/, issue: 'UUID prefix in slug' },
  { pattern: /-song-/, issue: 'Song title in slug' },
  { pattern: /-lyrics-/, issue: 'Lyrics reference in slug' },
  { pattern: /^the-/, issue: 'Article prefix' },
];

async function fetchAllMovies(): Promise<Movie[]> {
  let all: Movie[] = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('movies')
      .select('id, slug, title_en, title_te, release_year, hero, heroine, director, music_director, supporting_cast, poster_url, synopsis')
      .eq('is_published', true)
      .range(offset, offset + 999);
    if (!data?.length) break;
    all = all.concat(data as Movie[]);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

function normalize(v: string | null): string {
  if (!v) return '';
  return v.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

async function runEnhancedAudit(): Promise<Issue[]> {
  console.log(chalk.bold('\n🔍 ENHANCED PATTERN-BASED AUDIT\n'));
  const issues: Issue[] = [];
  const movies = await fetchAllMovies();
  console.log(`  Analyzing ${movies.length} movies...\n`);

  for (const m of movies) {
    // 1. NAME NORMALIZATION CHECK
    for (const [field, value] of Object.entries({ hero: m.hero, heroine: m.heroine, director: m.director })) {
      if (value) {
        const norm = normalize(value);
        if (NAME_NORMALIZATIONS[norm] && NAME_NORMALIZATIONS[norm] !== value) {
          issues.push({
            id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
            pattern: 'NAME_FORMAT', field, current_value: value,
            suggested_fix: NAME_NORMALIZATIONS[norm], severity: 'low', auto_fixable: true
          });
        }
      }
    }

    // 2. MUSIC DIRECTOR DUO CHECK
    if (m.music_director) {
      const mdNorm = normalize(m.music_director);
      for (const [partial, full] of Object.entries(MUSIC_DIRECTOR_DUOS)) {
        if (mdNorm.includes(partial) && m.music_director !== full) {
          issues.push({
            id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
            pattern: 'INCOMPLETE_DUO', field: 'music_director', current_value: m.music_director,
            suggested_fix: full, severity: 'medium', auto_fixable: true
          });
          break;
        }
      }
    }

    // 3. HERO/HEROINE SWAP CHECK
    if (m.hero && KNOWN_FEMALE_ACTORS.has(normalize(m.hero))) {
      issues.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        pattern: 'GENDER_SWAP', field: 'hero', current_value: m.hero,
        suggested_fix: `Move to heroine`, severity: 'high', auto_fixable: false
      });
    }
    if (m.heroine && KNOWN_MALE_ACTORS.has(normalize(m.heroine))) {
      issues.push({
        id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
        pattern: 'GENDER_SWAP', field: 'heroine', current_value: m.heroine,
        suggested_fix: `Move to hero`, severity: 'high', auto_fixable: false
      });
    }

    // 4. ACTOR TIMELINE VALIDATION
    for (const [field, value] of Object.entries({ hero: m.hero, heroine: m.heroine })) {
      if (value) {
        const actorNorm = normalize(value);
        const careerStart = ACTOR_CAREER_START[actorNorm];
        if (careerStart && m.release_year < careerStart) {
          issues.push({
            id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
            pattern: 'TIMELINE_ERROR', field, current_value: `${value} (career: ${careerStart})`,
            suggested_fix: `Verify: ${value} career started ${careerStart}`, severity: 'critical', auto_fixable: false
          });
        }
      }
    }

    // 5. SLUG ISSUES
    for (const { pattern, issue } of SLUG_ISSUES) {
      if (pattern.test(m.slug)) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          pattern: 'BAD_SLUG', field: 'slug', current_value: m.slug,
          suggested_fix: issue, severity: 'medium', auto_fixable: false
        });
      }
    }

    // 6. POSTER URL VALIDATION
    if (m.poster_url) {
      if (m.poster_url.includes('placeholder') || m.poster_url.includes('no-image')) {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          pattern: 'PLACEHOLDER_POSTER', field: 'poster_url', current_value: m.poster_url,
          suggested_fix: 'Find real poster', severity: 'low', auto_fixable: false
        });
      }
    }

    // 7. EMPTY STRING CHECK (should be null)
    for (const [field, value] of Object.entries(m)) {
      if (value === '' || value === 'TBA' || value === 'N/A' || value === 'Unknown') {
        issues.push({
          id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
          pattern: 'EMPTY_VALUE', field, current_value: String(value),
          suggested_fix: 'Set to null or find actual value', severity: 'low', auto_fixable: true
        });
      }
    }

    // 8. CAST IN SUPPORTING CHECK
    if (m.supporting_cast?.length) {
      const heroNorm = normalize(m.hero);
      const heroineNorm = normalize(m.heroine);
      for (const cast of m.supporting_cast) {
        if (typeof cast === 'string') {
          const castNorm = normalize(cast);
          if (castNorm === heroNorm || castNorm === heroineNorm) {
            issues.push({
              id: m.id, slug: m.slug, title: m.title_en, year: m.release_year,
              pattern: 'CAST_DUPLICATE', field: 'supporting_cast', current_value: cast,
              suggested_fix: 'Remove from supporting_cast', severity: 'low', auto_fixable: true
            });
          }
        }
      }
    }

    // 9. DIRECTOR-MD COLLABORATION MISMATCH
    if (m.director && m.music_director) {
      const dirNorm = normalize(m.director);
      const expectedMDs = DIRECTOR_MD_COLLABS[dirNorm];
      if (expectedMDs && m.release_year >= 2000) {
        const mdNorm = normalize(m.music_director);
        const matches = expectedMDs.some(md => normalize(md) === mdNorm);
        // Only flag if it's a very unexpected combo (not auto-fixable, just informational)
      }
    }
  }

  // Summary by pattern
  const patternCounts = new Map<string, number>();
  issues.forEach(i => patternCounts.set(i.pattern, (patternCounts.get(i.pattern) || 0) + 1));

  console.log(chalk.blue('  Pattern Summary:\n'));
  for (const [pattern, count] of [...patternCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${pattern.padEnd(20)} ${count}`);
  }

  return issues;
}

function exportIssues(issues: Issue[]) {
  const header = 'id,slug,title,year,pattern,field,current_value,suggested_fix,severity,auto_fixable';
  const rows = issues.map(i => 
    `${i.id},"${i.slug}","${i.title.replace(/"/g, '""')}",${i.year},${i.pattern},${i.field},"${i.current_value.replace(/"/g, '""')}","${i.suggested_fix.replace(/"/g, '""')}",${i.severity},${i.auto_fixable}`
  );
  writeFileSync('MOVIE-AUDIT-ENHANCED.csv', [header, ...rows].join('\n'));
  console.log(chalk.cyan(`\n📄 Exported ${issues.length} issues to MOVIE-AUDIT-ENHANCED.csv`));
}

async function main() {
  const issues = await runEnhancedAudit();
  exportIssues(issues);
  
  console.log(chalk.green('\n✅ ENHANCED AUDIT COMPLETE\n'));
  console.log(`  Total Issues: ${issues.length}`);
  console.log(`  Critical: ${issues.filter(i => i.severity === 'critical').length}`);
  console.log(`  High: ${issues.filter(i => i.severity === 'high').length}`);
  console.log(`  Auto-fixable: ${issues.filter(i => i.auto_fixable).length}\n`);
}

main().catch(console.error);
