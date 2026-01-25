/**
 * ACTOR FILMOGRAPHY AUDIT
 * 
 * Generalized filmography audit for any actor. Based on Chiranjeevi cleanup pattern.
 * 
 * Detects:
 * - Pre-debut films (before career start year)
 * - Likely supporting roles (based on order/year)
 * - Duplicates
 * - Invalid entries (person names as titles)
 * - Misattributed films
 * 
 * Usage:
 *   npx tsx scripts/actor-filmography-audit.ts --actor="Chiranjeevi" --debut=1978
 *   npx tsx scripts/actor-filmography-audit.ts --actor="Krishna" --debut=1965 --output=docs/KRISHNA_AUDIT.csv
 *   npx tsx scripts/actor-filmography-audit.ts --actor="NTR" --validate-wikipedia
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// ============================================================
// TYPES (Exported for programmatic use)
// ============================================================

export interface AuditMovie {
  id: string;
  title_en: string;
  release_year: number;
  hero: string | null;
  heroine: string | null;
  director: string | null;
  our_rating: number | null;
  cast_members: any[];
  tmdb_id?: number;
  slug?: string;
}

export interface MoviePair {
  movie1: { id: string; title: string; year: number };
  movie2: { id: string; title: string; year: number };
  similarity: number;
}

export interface FilmographyAudit {
  actorName: string;
  debutYear: number;
  wikipediaFilmCount: number | null;
  databaseFilmCount: number;
  preDebutFilms: AuditMovie[];
  likelySupportingRoles: AuditMovie[];
  duplicates: MoviePair[];
  invalidEntries: AuditMovie[];
  yearDistribution: Record<number, number>;
  summary: string;
}

// Alias for backwards compatibility
type Movie = AuditMovie;

// Known actor debut years (Exported for programmatic use)
export const KNOWN_DEBUT_YEARS: Record<string, number> = {
  'chiranjeevi': 1978,
  'krishna': 1965,
  'ntr': 1949,
  'n.t. rama rao': 1949,
  'akkineni nageswara rao': 1941,
  'anr': 1941,
  'sobhan babu': 1963,
  'mohan babu': 1977,
  'venkatesh': 1986,
  'daggubati venkatesh': 1986,
  'nagarjuna': 1986,
  'akkineni nagarjuna': 1986,
  'balakrishna': 1974,
  'nandamuri balakrishna': 1974,
  'mahesh babu': 1999,
  'pawan kalyan': 1996,
  'ram charan': 2007,
  'allu arjun': 2003,
  'prabhas': 2002,
  'jr ntr': 2001,
  'ntr jr': 2001,
  // New generation actors
  'nani': 2008,
  'natural star nani': 2008,
  'allari naresh': 2001,
  'ravi teja': 1999,
  'vijay deverakonda': 2011,
  'ram pothineni': 2006,
  'nithiin': 2002,
  'nithin': 2002,
  'sharwanand': 2003,
  'rana daggubati': 2010,
  'varun tej': 2014,
  'naga chaitanya': 2009,
  'akhil akkineni': 2015,
  'sai dharam tej': 2014,
  'bellamkonda sreenivas': 2014,
  'sundeep kishan': 2009,
  'naveen polishetty': 2019,
  'vishwak sen': 2018,
};

// Patterns for detecting invalid entries (production houses, HTML, etc.)
// NOTE: Removed two-word name pattern - too many false positives with valid Telugu titles
const INVALID_PATTERNS = [
  /productions?$/i,
  /films?$/i,
  /entertainments?$/i,
  /creations?$/i,
  /studios?$/i,
  /<[^>]+>/,  // HTML tags
  /\{\{/,     // Wikipedia templates
];

// ============================================================
// DUPLICATE DETECTION (Exported for programmatic use)
// ============================================================

export function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

export function calculateSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;
  
  // Levenshtein distance
  const matrix: number[][] = [];
  const n = norm1.length;
  const m = norm2.length;

  if (n === 0) return m === 0 ? 1 : 0;
  if (m === 0) return 0;

  for (let i = 0; i <= n; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= m; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[n][m];
  const maxLen = Math.max(n, m);
  return 1 - distance / maxLen;
}

export function findDuplicates(movies: AuditMovie[]): MoviePair[] {
  const duplicates: MoviePair[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < movies.length; i++) {
    for (let j = i + 1; j < movies.length; j++) {
      const key = `${movies[i].id}-${movies[j].id}`;
      if (checked.has(key)) continue;
      checked.add(key);

      // Same year or adjacent years
      const yearDiff = Math.abs(movies[i].release_year - movies[j].release_year);
      if (yearDiff > 1) continue;

      const similarity = calculateSimilarity(movies[i].title_en, movies[j].title_en);
      if (similarity >= 0.8) {
        duplicates.push({
          movie1: { id: movies[i].id, title: movies[i].title_en, year: movies[i].release_year },
          movie2: { id: movies[j].id, title: movies[j].title_en, year: movies[j].release_year },
          similarity
        });
      }
    }
  }

  return duplicates;
}

// ============================================================
// INVALID ENTRY DETECTION (Exported for programmatic use)
// ============================================================

export function isInvalidEntry(movie: AuditMovie): boolean {
  const title = movie.title_en;
  
  // Check against known patterns (production houses, HTML, templates)
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(title)) {
      return true;
    }
  }

  // Don't flag two-word titles as person names - too many false positives
  // Telugu film titles like "Ashta Chamma", "Ninnu Kori", "Hi Nanna" are valid
  // Only flag if it exactly matches a known actor/person name pattern
  const knownPersonPatterns = [
    /^(Mr|Mrs|Ms|Dr)\.\s/i,  // Titles like "Mr. X"
    /^[A-Z]\.\s?[A-Z][a-z]+$/,  // "K. Raghavendra" style names
  ];
  
  for (const pattern of knownPersonPatterns) {
    if (pattern.test(title)) {
      return true;
    }
  }

  return false;
}

// ============================================================
// WIKIPEDIA CROSS-REFERENCE
// ============================================================

async function getWikipediaFilmCount(actorName: string): Promise<number | null> {
  try {
    // Search for actor's filmography page
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actorName.replace(/ /g, '_'))}_filmography`;
    
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' }
    });

    if (res.ok) {
      const data = await res.json();
      // Try to extract film count from description
      const match = data.extract?.match(/(\d+)\s*films?/i);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Try alternate: main page
    const altUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actorName.replace(/ /g, '_'))}`;
    const altRes = await fetch(altUrl, { headers: { 'User-Agent': 'TeluguPortal/1.0' } });
    
    if (altRes.ok) {
      const data = await altRes.json();
      const match = data.extract?.match(/(\d+)\s*films?/i);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  } catch (error) {
    console.log(`  ⚠️  Could not fetch Wikipedia data for ${actorName}`);
    return null;
  }
}

// ============================================================
// TMDB VALIDATION
// ============================================================

async function validateWithTMDB(movie: Movie, actorName: string): Promise<{
  isLead: boolean;
  actualHero: string | null;
  order: number | null;
} | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.title_en)}&year=${movie.release_year}&language=en-US`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) return null;

    const tmdbMovie = searchData.results.find((m: any) => m.original_language === 'te') || searchData.results[0];

    const creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbMovie.id}/credits?api_key=${TMDB_API_KEY}`;
    const creditsRes = await fetch(creditsUrl);
    const credits = await creditsRes.json();

    const cast = credits.cast || [];
    const actorEntry = cast.find((c: any) => 
      c.name.toLowerCase().includes(actorName.toLowerCase())
    );

    if (!actorEntry) {
      // Actor not in TMDB cast - likely not in this movie or very minor role
      const actualHero = cast.find((c: any) => c.gender === 2 && c.order === 0);
      return {
        isLead: false,
        actualHero: actualHero?.name || null,
        order: null
      };
    }

    return {
      isLead: actorEntry.order <= 2,
      actualHero: cast[0]?.name || null,
      order: actorEntry.order
    };
  } catch (error) {
    return null;
  }
}

// ============================================================
// MAIN AUDIT FUNCTION
// ============================================================

export async function auditActorFilmography(
  actorName: string,
  options: {
    debutYear?: number;
    validateTMDB?: boolean;
    validateWikipedia?: boolean;
    limit?: number;
  } = {}
): Promise<FilmographyAudit> {
  const { validateTMDB = false, validateWikipedia = true, limit = 500 } = options;
  
  // Get debut year
  let debutYear = options.debutYear;
  if (!debutYear) {
    const normalizedName = actorName.toLowerCase();
    debutYear = KNOWN_DEBUT_YEARS[normalizedName] || 
                Object.entries(KNOWN_DEBUT_YEARS).find(([k]) => 
                  normalizedName.includes(k) || k.includes(normalizedName)
                )?.[1];
  }

  if (!debutYear) {
    console.log(`  ⚠️  Debut year not known for ${actorName}, using 1950`);
    debutYear = 1950;
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`FILMOGRAPHY AUDIT: ${actorName}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`  Debut Year: ${debutYear}`);

  // Fetch movies from database
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, our_rating, cast_members')
    .eq('language', 'Telugu')
    .ilike('hero', `%${actorName}%`)
    .order('release_year', { ascending: true })
    .limit(limit);

  if (error || !movies) {
    throw new Error(`Failed to fetch movies: ${error?.message}`);
  }

  console.log(`  Database films: ${movies.length}`);

  // Wikipedia count
  let wikipediaCount: number | null = null;
  if (validateWikipedia) {
    wikipediaCount = await getWikipediaFilmCount(actorName);
    if (wikipediaCount) {
      console.log(`  Wikipedia films: ~${wikipediaCount}`);
    }
  }

  const audit: FilmographyAudit = {
    actorName,
    debutYear,
    wikipediaFilmCount: wikipediaCount,
    databaseFilmCount: movies.length,
    preDebutFilms: [],
    likelySupportingRoles: [],
    duplicates: [],
    invalidEntries: [],
    yearDistribution: {},
    summary: ''
  };

  // 1. Find pre-debut films
  audit.preDebutFilms = movies.filter(m => m.release_year < debutYear);
  
  // 2. Find duplicates
  audit.duplicates = findDuplicates(movies);

  // 3. Find invalid entries
  audit.invalidEntries = movies.filter(m => isInvalidEntry(m));

  // 4. Year distribution
  for (const movie of movies) {
    const year = movie.release_year || 0;
    audit.yearDistribution[year] = (audit.yearDistribution[year] || 0) + 1;
  }

  // 5. Identify likely supporting roles (optional TMDB validation)
  if (validateTMDB) {
    console.log('\n  Validating with TMDB (this may take a while)...');
    let validated = 0;
    for (const movie of movies) {
      if (validated >= 50) break; // Limit TMDB calls
      
      const validation = await validateWithTMDB(movie, actorName);
      if (validation && !validation.isLead) {
        audit.likelySupportingRoles.push(movie);
      }
      validated++;
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 250));
    }
  } else {
    // Heuristic: films with high order in cast_members
    audit.likelySupportingRoles = movies.filter(m => {
      if (!m.cast_members || m.cast_members.length === 0) return false;
      const actorEntry = m.cast_members.find((c: any) => 
        c.name?.toLowerCase().includes(actorName.toLowerCase())
      );
      return actorEntry && actorEntry.order > 2;
    });
  }

  // Generate summary
  const issues: string[] = [];
  if (audit.preDebutFilms.length > 0) {
    issues.push(`${audit.preDebutFilms.length} pre-debut films`);
  }
  if (audit.duplicates.length > 0) {
    issues.push(`${audit.duplicates.length} potential duplicates`);
  }
  if (audit.invalidEntries.length > 0) {
    issues.push(`${audit.invalidEntries.length} invalid entries`);
  }
  if (audit.likelySupportingRoles.length > 0) {
    issues.push(`${audit.likelySupportingRoles.length} likely supporting roles`);
  }
  if (wikipediaCount && Math.abs(movies.length - wikipediaCount) > 20) {
    issues.push(`Count mismatch: DB=${movies.length}, Wiki=~${wikipediaCount}`);
  }

  audit.summary = issues.length > 0 ? issues.join(', ') : 'No issues found';

  return audit;
}

// ============================================================
// REPORT GENERATION (Exported for programmatic use)
// ============================================================

export function generateCSVReport(audit: FilmographyAudit): string {
  const lines: string[] = [
    'Category,Title,Year,Current Hero,Director,Issue'
  ];

  // Pre-debut films
  for (const movie of audit.preDebutFilms) {
    lines.push(`Pre-Debut,"${movie.title_en}",${movie.release_year},"${movie.hero}","${movie.director}",Before ${audit.debutYear}`);
  }

  // Invalid entries
  for (const movie of audit.invalidEntries) {
    lines.push(`Invalid,"${movie.title_en}",${movie.release_year},"${movie.hero}","${movie.director}",Possibly not a movie`);
  }

  // Likely supporting roles
  for (const movie of audit.likelySupportingRoles) {
    lines.push(`Supporting,"${movie.title_en}",${movie.release_year},"${movie.hero}","${movie.director}",Likely not lead role`);
  }

  // Duplicates
  for (const pair of audit.duplicates) {
    lines.push(`Duplicate,"${pair.movie1.title}",${pair.movie1.year},-,-,"Similar to ${pair.movie2.title} (${pair.movie2.year})"`);
  }

  return lines.join('\n');
}

function printReport(audit: FilmographyAudit): void {
  console.log('\n' + '─'.repeat(70));
  console.log('AUDIT RESULTS');
  console.log('─'.repeat(70));

  console.log(`\n  Summary: ${audit.summary}`);

  if (audit.preDebutFilms.length > 0) {
    console.log(`\n  PRE-DEBUT FILMS (${audit.preDebutFilms.length}):`);
    audit.preDebutFilms.forEach(m => {
      console.log(`    • ${m.title_en} (${m.release_year}) - Before ${audit.debutYear}`);
    });
  }

  if (audit.duplicates.length > 0) {
    console.log(`\n  POTENTIAL DUPLICATES (${audit.duplicates.length}):`);
    audit.duplicates.forEach(d => {
      console.log(`    • "${d.movie1.title}" (${d.movie1.year}) ↔ "${d.movie2.title}" (${d.movie2.year}) [${(d.similarity * 100).toFixed(0)}%]`);
    });
  }

  if (audit.invalidEntries.length > 0) {
    console.log(`\n  INVALID ENTRIES (${audit.invalidEntries.length}):`);
    audit.invalidEntries.forEach(m => {
      console.log(`    • ${m.title_en} (${m.release_year})`);
    });
  }

  if (audit.likelySupportingRoles.length > 0) {
    console.log(`\n  LIKELY SUPPORTING ROLES (${audit.likelySupportingRoles.length}):`);
    audit.likelySupportingRoles.slice(0, 20).forEach(m => {
      console.log(`    • ${m.title_en} (${m.release_year})`);
    });
    if (audit.likelySupportingRoles.length > 20) {
      console.log(`    ... and ${audit.likelySupportingRoles.length - 20} more`);
    }
  }

  // Year distribution
  console.log('\n  YEAR DISTRIBUTION:');
  const decades: Record<string, number> = {};
  for (const [year, count] of Object.entries(audit.yearDistribution)) {
    const decade = Math.floor(parseInt(year) / 10) * 10;
    decades[`${decade}s`] = (decades[`${decade}s`] || 0) + count;
  }
  Object.entries(decades).sort().forEach(([decade, count]) => {
    console.log(`    ${decade}: ${count} films`);
  });
}

// ============================================================
// CLI
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  
  const actorArg = args.find(a => a.startsWith('--actor='));
  const debutArg = args.find(a => a.startsWith('--debut='));
  const outputArg = args.find(a => a.startsWith('--output='));
  const validateTMDB = args.includes('--validate-tmdb');
  const validateWikipedia = args.includes('--validate-wikipedia') || !args.includes('--no-wikipedia');

  if (!actorArg) {
    console.log(`
ACTOR FILMOGRAPHY AUDIT

Usage:
  npx tsx scripts/actor-filmography-audit.ts --actor="Chiranjeevi" --debut=1978
  npx tsx scripts/actor-filmography-audit.ts --actor="Krishna" --debut=1965 --output=docs/KRISHNA_AUDIT.csv
  npx tsx scripts/actor-filmography-audit.ts --actor="NTR" --validate-tmdb

Options:
  --actor=NAME       Actor name to audit (required)
  --debut=YEAR       Debut year (auto-detected for known actors)
  --output=PATH      Output CSV report path
  --validate-tmdb    Cross-reference with TMDB (slower, more accurate)
  --validate-wikipedia  Check Wikipedia film count (default: true)
  --no-wikipedia     Skip Wikipedia validation

Known actors with auto-detected debut years:
${Object.entries(KNOWN_DEBUT_YEARS).map(([name, year]) => `  • ${name}: ${year}`).join('\n')}
`);
    return;
  }

  const actorName = actorArg.split('=')[1];
  const debutYear = debutArg ? parseInt(debutArg.split('=')[1]) : undefined;
  const outputPath = outputArg?.split('=')[1];

  try {
    const audit = await auditActorFilmography(actorName, {
      debutYear,
      validateTMDB,
      validateWikipedia
    });

    printReport(audit);

    if (outputPath) {
      const csv = generateCSVReport(audit);
      fs.writeFileSync(outputPath, csv);
      console.log(`\n  📝 Report saved: ${outputPath}`);
    }

    // Save JSON audit
    const jsonPath = outputPath?.replace('.csv', '.json') || 
                     `docs/${actorName.replace(/\s+/g, '_').toUpperCase()}_AUDIT.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(audit, null, 2));
    console.log(`  📝 Full audit saved: ${jsonPath}`);

  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}


