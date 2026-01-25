/**
 * CELEBRITY DUPLICATE AUDIT
 * 
 * Detects duplicate celebrity records using multiple strategies:
 * - Exact normalized name match
 * - Same TMDB ID
 * - Same IMDB ID  
 * - Fuzzy name similarity (>90%)
 * - Same slug prefix patterns
 * 
 * Repurposed from movie duplicate detection system.
 * 
 * Usage:
 *   npx tsx scripts/audit-celebrity-duplicates.ts              # Run audit
 *   npx tsx scripts/audit-celebrity-duplicates.ts --verbose    # Detailed output
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

// Repurpose fuzzy matching functions
import {
  normalizeTitle,
  normalizeAggressively,
  calculateLevenshteinDistance,
  calculateTitleSimilarity,
} from './lib/validators/fuzzy-matcher';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// TYPES
// ============================================================

interface CelebritySummary {
  id: string;
  name_en: string;
  name_te?: string | null;
  slug: string;
  tmdb_id?: number | null;
  imdb_id?: string | null;
  gender?: string | null;
  occupation?: string[] | null;
  trust_score?: number | null;
  is_published?: boolean;
  profile_image?: string | null;
  industry_title?: string | null;
  birth_date?: string | null;
}

interface DuplicatePair {
  celeb1: CelebritySummary;
  celeb2: CelebritySummary;
  matchType: 'exact_name' | 'same_tmdb_id' | 'same_imdb_id' | 'fuzzy_high' | 'fuzzy_medium' | 'same_slug_prefix';
  similarity: number;
  confidence: number;
  reason: string;
  action: 'auto_merge' | 'manual_review' | 'keep_both';
  keepId?: string; // ID of the record to keep
}

interface AuditResult {
  totalCelebrities: number;
  exactDuplicates: DuplicatePair[];
  fuzzyDuplicates: DuplicatePair[];
  tmdbDuplicates: DuplicatePair[];
  imdbDuplicates: DuplicatePair[];
  slugDuplicates: DuplicatePair[];
  summary: {
    autoMerge: number;
    manualReview: number;
    keepBoth: number;
  };
}

// ============================================================
// NAME NORMALIZATION (Adapted for celebrities)
// ============================================================

function normalizeName(name: string): string {
  return normalizeTitle(name);
}

function normalizeNameAggressively(name: string): string {
  return normalizeAggressively(name);
}

function calculateNameSimilarity(name1: string, name2: string): number {
  return calculateTitleSimilarity(name1, name2);
}

// ============================================================
// DUPLICATE DETECTION FUNCTIONS
// ============================================================

/**
 * Find exact name duplicates (normalized)
 */
function findExactNameDuplicates(celebrities: CelebritySummary[]): DuplicatePair[] {
  const duplicates: DuplicatePair[] = [];
  const seen = new Map<string, CelebritySummary>();

  for (const celeb of celebrities) {
    const normalized = normalizeNameAggressively(celeb.name_en);
    
    if (seen.has(normalized)) {
      const existing = seen.get(normalized)!;
      if (existing.id !== celeb.id) {
        const keepRecord = determineRecordToKeep(existing, celeb);
        duplicates.push({
          celeb1: existing,
          celeb2: celeb,
          matchType: 'exact_name',
          similarity: 1.0,
          confidence: 0.98,
          reason: `Exact normalized name match: "${existing.name_en}" vs "${celeb.name_en}"`,
          action: 'auto_merge',
          keepId: keepRecord.id,
        });
      }
    } else {
      seen.set(normalized, celeb);
    }
  }

  return duplicates;
}

/**
 * Find duplicates with same TMDB ID
 */
function findTmdbDuplicates(celebrities: CelebritySummary[]): DuplicatePair[] {
  const duplicates: DuplicatePair[] = [];
  const seen = new Map<number, CelebritySummary>();

  for (const celeb of celebrities) {
    if (!celeb.tmdb_id) continue;

    if (seen.has(celeb.tmdb_id)) {
      const existing = seen.get(celeb.tmdb_id)!;
      if (existing.id !== celeb.id) {
        const keepRecord = determineRecordToKeep(existing, celeb);
        duplicates.push({
          celeb1: existing,
          celeb2: celeb,
          matchType: 'same_tmdb_id',
          similarity: 1.0,
          confidence: 0.99,
          reason: `Same TMDB ID: ${celeb.tmdb_id}`,
          action: 'auto_merge',
          keepId: keepRecord.id,
        });
      }
    } else {
      seen.set(celeb.tmdb_id, celeb);
    }
  }

  return duplicates;
}

/**
 * Find duplicates with same IMDB ID
 */
function findImdbDuplicates(celebrities: CelebritySummary[]): DuplicatePair[] {
  const duplicates: DuplicatePair[] = [];
  const seen = new Map<string, CelebritySummary>();

  for (const celeb of celebrities) {
    if (!celeb.imdb_id) continue;

    const key = celeb.imdb_id.toLowerCase().trim();
    
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (existing.id !== celeb.id) {
        const keepRecord = determineRecordToKeep(existing, celeb);
        duplicates.push({
          celeb1: existing,
          celeb2: celeb,
          matchType: 'same_imdb_id',
          similarity: 1.0,
          confidence: 0.99,
          reason: `Same IMDB ID: ${celeb.imdb_id}`,
          action: 'auto_merge',
          keepId: keepRecord.id,
        });
      }
    } else {
      seen.set(key, celeb);
    }
  }

  return duplicates;
}

/**
 * Find duplicates with similar slug prefixes
 */
function findSlugPrefixDuplicates(celebrities: CelebritySummary[]): DuplicatePair[] {
  const duplicates: DuplicatePair[] = [];
  const checked = new Set<string>();

  // Group by slug prefix (first part before numbers or special chars)
  const slugGroups = new Map<string, CelebritySummary[]>();

  for (const celeb of celebrities) {
    if (!celeb.slug) continue;
    
    // Extract base slug (remove celeb- prefix and trailing numbers)
    const baseSlug = celeb.slug
      .replace(/^celeb-/, '')
      .replace(/-\d+$/, '')
      .replace(/\d+$/, '');
    
    if (!slugGroups.has(baseSlug)) {
      slugGroups.set(baseSlug, []);
    }
    slugGroups.get(baseSlug)!.push(celeb);
  }

  // Check groups with multiple entries
  for (const [_, group] of slugGroups) {
    if (group.length < 2) continue;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const celeb1 = group[i];
        const celeb2 = group[j];

        const pairKey = [celeb1.id, celeb2.id].sort().join('|');
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        // Calculate name similarity
        const similarity = calculateNameSimilarity(celeb1.name_en, celeb2.name_en);
        
        if (similarity > 0.8) {
          const keepRecord = determineRecordToKeep(celeb1, celeb2);
          duplicates.push({
            celeb1,
            celeb2,
            matchType: 'same_slug_prefix',
            similarity,
            confidence: similarity * 0.9,
            reason: `Similar slug prefix: "${celeb1.slug}" vs "${celeb2.slug}"`,
            action: similarity > 0.95 ? 'auto_merge' : 'manual_review',
            keepId: keepRecord.id,
          });
        }
      }
    }
  }

  return duplicates;
}

/**
 * Find fuzzy name duplicates using similarity matching
 */
function findFuzzyDuplicates(celebrities: CelebritySummary[]): DuplicatePair[] {
  const duplicates: DuplicatePair[] = [];
  const checked = new Set<string>();

  // Only check celebrities with reasonably similar names
  // Group by first letter to reduce comparisons
  const letterGroups = new Map<string, CelebritySummary[]>();

  for (const celeb of celebrities) {
    const firstLetter = celeb.name_en.charAt(0).toLowerCase();
    if (!letterGroups.has(firstLetter)) {
      letterGroups.set(firstLetter, []);
    }
    letterGroups.get(firstLetter)!.push(celeb);
  }

  // Check within each letter group
  for (const [_, group] of letterGroups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const celeb1 = group[i];
        const celeb2 = group[j];

        const pairKey = [celeb1.id, celeb2.id].sort().join('|');
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        // Calculate similarity
        const similarity = calculateNameSimilarity(celeb1.name_en, celeb2.name_en);

        if (similarity >= 0.85 && similarity < 1.0) {
          // Determine action based on similarity and other factors
          let action: 'auto_merge' | 'manual_review' | 'keep_both' = 'manual_review';
          
          // Check if they might be different people (different gender, very different occupations)
          if (celeb1.gender && celeb2.gender && celeb1.gender !== celeb2.gender) {
            action = 'keep_both';
          } else if (similarity > 0.95) {
            action = 'auto_merge';
          } else if (similarity < 0.88) {
            action = 'keep_both';
          }

          const keepRecord = determineRecordToKeep(celeb1, celeb2);
          
          duplicates.push({
            celeb1,
            celeb2,
            matchType: similarity >= 0.95 ? 'fuzzy_high' : 'fuzzy_medium',
            similarity,
            confidence: similarity * 0.85,
            reason: identifyNameVariationReason(celeb1.name_en, celeb2.name_en),
            action,
            keepId: keepRecord.id,
          });
        }
      }
    }
  }

  return duplicates;
}

/**
 * Identify reason for name variation
 */
function identifyNameVariationReason(name1: string, name2: string): string {
  const n1 = name1.toLowerCase();
  const n2 = name2.toLowerCase();

  // Check for spacing differences
  if (n1.replace(/\s+/g, '') === n2.replace(/\s+/g, '')) {
    return 'Spacing difference';
  }

  // Check for period/dot differences
  if (n1.replace(/\./g, '') === n2.replace(/\./g, '')) {
    return 'Punctuation difference (periods)';
  }

  // Check for initial vs full name
  const words1 = n1.split(/\s+/);
  const words2 = n2.split(/\s+/);
  
  if (words1.length !== words2.length) {
    return 'Different name format (initials vs full)';
  }

  // Check for suffix differences (Jr, Sr, etc)
  if (n1.replace(/(jr|sr|ii|iii)\.?$/i, '') === n2.replace(/(jr|sr|ii|iii)\.?$/i, '')) {
    return 'Suffix difference';
  }

  // Transliteration
  const translit1 = n1.replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u');
  const translit2 = n2.replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u');
  if (translit1 === translit2) {
    return 'Transliteration variant';
  }

  return `${Math.round(calculateNameSimilarity(name1, name2) * 100)}% similar names`;
}

/**
 * Determine which record to keep when merging
 */
function determineRecordToKeep(celeb1: CelebritySummary, celeb2: CelebritySummary): CelebritySummary {
  // Score each record based on data completeness
  const score1 = calculateCompletenessScore(celeb1);
  const score2 = calculateCompletenessScore(celeb2);

  // Prefer record with higher trust_score
  if ((celeb1.trust_score || 0) > (celeb2.trust_score || 0) + 10) {
    return celeb1;
  }
  if ((celeb2.trust_score || 0) > (celeb1.trust_score || 0) + 10) {
    return celeb2;
  }

  // Prefer record with better slug (no 'celeb-' prefix)
  const hasCleanSlug1 = celeb1.slug && !celeb1.slug.startsWith('celeb-');
  const hasCleanSlug2 = celeb2.slug && !celeb2.slug.startsWith('celeb-');
  
  if (hasCleanSlug1 && !hasCleanSlug2) return celeb1;
  if (hasCleanSlug2 && !hasCleanSlug1) return celeb2;

  // Prefer more complete record
  return score1 >= score2 ? celeb1 : celeb2;
}

function calculateCompletenessScore(celeb: CelebritySummary): number {
  let score = 0;
  
  if (celeb.name_en) score += 10;
  if (celeb.name_te) score += 5;
  if (celeb.slug) score += 5;
  if (celeb.tmdb_id) score += 15;
  if (celeb.imdb_id) score += 10;
  if (celeb.profile_image) score += 10;
  if (celeb.industry_title) score += 10;
  if (celeb.birth_date) score += 5;
  if (celeb.gender) score += 5;
  if (celeb.occupation && celeb.occupation.length > 0) score += 5;
  if (celeb.trust_score) score += celeb.trust_score / 10;

  return score;
}

// ============================================================
// MAIN AUDIT FUNCTION
// ============================================================

async function runAudit(verbose: boolean): Promise<AuditResult> {
  console.log(chalk.cyan('\n🔍 Celebrity Duplicate Audit\n'));

  // Fetch all celebrities
  console.log(chalk.blue('Fetching celebrities...'));
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, slug, tmdb_id, imdb_id, gender, occupation, trust_score, is_published, profile_image, industry_title, birth_date')
    .eq('is_published', true)
    .order('name_en');

  if (error) {
    throw new Error(`Failed to fetch celebrities: ${error.message}`);
  }

  console.log(chalk.gray(`Found ${celebrities?.length || 0} celebrities\n`));

  const celebs = celebrities as CelebritySummary[];

  // Run all detection methods
  console.log(chalk.blue('Running duplicate detection...'));

  console.log(chalk.gray('  → Checking exact name matches...'));
  const exactDuplicates = findExactNameDuplicates(celebs);
  console.log(chalk.gray(`     Found ${exactDuplicates.length} exact duplicates`));

  console.log(chalk.gray('  → Checking TMDB ID duplicates...'));
  const tmdbDuplicates = findTmdbDuplicates(celebs);
  console.log(chalk.gray(`     Found ${tmdbDuplicates.length} TMDB duplicates`));

  console.log(chalk.gray('  → Checking IMDB ID duplicates...'));
  const imdbDuplicates = findImdbDuplicates(celebs);
  console.log(chalk.gray(`     Found ${imdbDuplicates.length} IMDB duplicates`));

  console.log(chalk.gray('  → Checking slug prefix duplicates...'));
  const slugDuplicates = findSlugPrefixDuplicates(celebs);
  console.log(chalk.gray(`     Found ${slugDuplicates.length} slug duplicates`));

  console.log(chalk.gray('  → Checking fuzzy name matches...'));
  const fuzzyDuplicates = findFuzzyDuplicates(celebs);
  console.log(chalk.gray(`     Found ${fuzzyDuplicates.length} fuzzy duplicates`));

  // Deduplicate results (same pair might be found by multiple methods)
  const allDuplicates = deduplicatePairs([
    ...exactDuplicates,
    ...tmdbDuplicates,
    ...imdbDuplicates,
    ...slugDuplicates,
    ...fuzzyDuplicates,
  ]);

  // Calculate summary
  const summary = {
    autoMerge: allDuplicates.filter(d => d.action === 'auto_merge').length,
    manualReview: allDuplicates.filter(d => d.action === 'manual_review').length,
    keepBoth: allDuplicates.filter(d => d.action === 'keep_both').length,
  };

  const result: AuditResult = {
    totalCelebrities: celebs.length,
    exactDuplicates,
    fuzzyDuplicates,
    tmdbDuplicates,
    imdbDuplicates,
    slugDuplicates,
    summary,
  };

  // Print summary
  console.log(chalk.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.cyan('AUDIT SUMMARY'));
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.white(`Total celebrities: ${celebs.length}`));
  console.log(chalk.white(`Total duplicate pairs found: ${allDuplicates.length}`));
  console.log(chalk.green(`  → Auto-merge candidates: ${summary.autoMerge}`));
  console.log(chalk.yellow(`  → Manual review required: ${summary.manualReview}`));
  console.log(chalk.gray(`  → Keep both (different people): ${summary.keepBoth}`));

  if (verbose) {
    console.log(chalk.cyan('\n--- Duplicate Details ---\n'));
    for (const dup of allDuplicates) {
      const icon = dup.action === 'auto_merge' ? '🔀' : dup.action === 'manual_review' ? '👀' : '✅';
      console.log(`${icon} ${dup.celeb1.name_en} ↔ ${dup.celeb2.name_en}`);
      console.log(chalk.gray(`   Type: ${dup.matchType}, Similarity: ${Math.round(dup.similarity * 100)}%`));
      console.log(chalk.gray(`   Reason: ${dup.reason}`));
      console.log(chalk.gray(`   Action: ${dup.action}, Keep: ${dup.keepId === dup.celeb1.id ? dup.celeb1.name_en : dup.celeb2.name_en}`));
      console.log();
    }
  }

  return result;
}

function deduplicatePairs(pairs: DuplicatePair[]): DuplicatePair[] {
  const seen = new Set<string>();
  const unique: DuplicatePair[] = [];

  for (const pair of pairs) {
    const key = [pair.celeb1.id, pair.celeb2.id].sort().join('|');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(pair);
    }
  }

  return unique;
}

// ============================================================
// REPORT GENERATION
// ============================================================

function generateReports(result: AuditResult): void {
  const reportDir = path.join(process.cwd(), 'docs', 'audit-reports');
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = Date.now();

  // Generate exact duplicates CSV
  const exactCsv = generateCsv([
    ...result.exactDuplicates,
    ...result.tmdbDuplicates,
    ...result.imdbDuplicates,
  ].filter(d => d.action === 'auto_merge'));
  
  fs.writeFileSync(
    path.join(reportDir, `celebrity-duplicates-exact-${timestamp}.csv`),
    exactCsv
  );

  // Generate fuzzy duplicates CSV (manual review)
  const fuzzyCsv = generateCsv([
    ...result.fuzzyDuplicates,
    ...result.slugDuplicates,
  ].filter(d => d.action === 'manual_review'));
  
  fs.writeFileSync(
    path.join(reportDir, `celebrity-duplicates-fuzzy-${timestamp}.csv`),
    fuzzyCsv
  );

  // Generate summary JSON
  const summaryJson = {
    timestamp: new Date().toISOString(),
    totalCelebrities: result.totalCelebrities,
    duplicateCounts: {
      exact: result.exactDuplicates.length,
      tmdb: result.tmdbDuplicates.length,
      imdb: result.imdbDuplicates.length,
      slug: result.slugDuplicates.length,
      fuzzy: result.fuzzyDuplicates.length,
    },
    actionCounts: result.summary,
    duplicates: deduplicatePairs([
      ...result.exactDuplicates,
      ...result.tmdbDuplicates,
      ...result.imdbDuplicates,
      ...result.slugDuplicates,
      ...result.fuzzyDuplicates,
    ]).map(d => ({
      name1: d.celeb1.name_en,
      id1: d.celeb1.id,
      slug1: d.celeb1.slug,
      name2: d.celeb2.name_en,
      id2: d.celeb2.id,
      slug2: d.celeb2.slug,
      matchType: d.matchType,
      similarity: d.similarity,
      action: d.action,
      keepId: d.keepId,
      reason: d.reason,
    })),
  };

  fs.writeFileSync(
    path.join(reportDir, `celebrity-duplicates-summary-${timestamp}.json`),
    JSON.stringify(summaryJson, null, 2)
  );

  console.log(chalk.green('\n📄 Reports generated:'));
  console.log(chalk.gray(`  → ${reportDir}/celebrity-duplicates-exact-${timestamp}.csv`));
  console.log(chalk.gray(`  → ${reportDir}/celebrity-duplicates-fuzzy-${timestamp}.csv`));
  console.log(chalk.gray(`  → ${reportDir}/celebrity-duplicates-summary-${timestamp}.json`));
}

function generateCsv(pairs: DuplicatePair[]): string {
  const header = 'name1,id1,slug1,name2,id2,slug2,match_type,similarity,confidence,action,keep_id,reason';
  
  const rows = pairs.map(p => {
    const escapeCsv = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    return [
      escapeCsv(p.celeb1.name_en),
      escapeCsv(p.celeb1.id),
      escapeCsv(p.celeb1.slug || ''),
      escapeCsv(p.celeb2.name_en),
      escapeCsv(p.celeb2.id),
      escapeCsv(p.celeb2.slug || ''),
      escapeCsv(p.matchType),
      p.similarity.toFixed(4),
      p.confidence.toFixed(4),
      escapeCsv(p.action),
      escapeCsv(p.keepId || ''),
      escapeCsv(p.reason),
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

// ============================================================
// CLI
// ============================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');

  try {
    const result = await runAudit(verbose);
    generateReports(result);
    console.log(chalk.cyan('\n✅ Audit complete!\n'));
  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

main();
