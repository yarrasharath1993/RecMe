#!/usr/bin/env npx tsx
/**
 * Audit Duplicate Celebrity Profiles
 * 
 * Identifies potential duplicate celebrities based on:
 * - Name similarity (fuzzy matching)
 * - Same TMDB ID
 * - Same IMDb ID
 * - Same Wikidata ID
 * - Similar slug patterns
 * 
 * Generates a report of duplicates for manual review and merging
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function red(text: string) { return `${colors.red}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }

interface Celebrity {
  id: string;
  slug: string;
  name_en: string;
  name_te: string | null;
  tmdb_id: number | null;
  imdb_id: string | null;
  wikidata_id: string | null;
  short_bio: string | null;
  entity_confidence_score: number | null;
  is_published: boolean;
  created_at: string;
}

interface DuplicateGroup {
  reason: string;
  severity: 'high' | 'medium' | 'low';
  celebrities: Celebrity[];
  recommendation: string;
}

// Simple string similarity using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

function similarityScore(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

function normalizeNameForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^celeb/, '')
    .replace(/^the/, '')
    .trim();
}

async function findDuplicates() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              CELEBRITY DUPLICATE DETECTION AUDIT                      ║
║            Identifying Potential Duplicate Profiles                   ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  console.log(white('  📊 Fetching all celebrity profiles...\n'));

  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, slug, name_en, name_te, tmdb_id, imdb_id, wikidata_id, short_bio, entity_confidence_score, is_published, created_at')
    .order('name_en');

  if (error || !celebrities) {
    console.error(red('❌ Error fetching celebrities:'), error);
    return;
  }

  console.log(green(`  ✅ Loaded ${celebrities.length} celebrity profiles\n`));

  const duplicateGroups: DuplicateGroup[] = [];
  const processedIds = new Set<string>();

  // 1. Find exact ID matches (TMDB, IMDb, Wikidata)
  console.log(cyan(bold('  🔍 Checking for exact ID matches...\n')));
  
  const tmdbMap = new Map<number, Celebrity[]>();
  const imdbMap = new Map<string, Celebrity[]>();
  const wikidataMap = new Map<string, Celebrity[]>();

  for (const celeb of celebrities) {
    if (celeb.tmdb_id) {
      if (!tmdbMap.has(celeb.tmdb_id)) tmdbMap.set(celeb.tmdb_id, []);
      tmdbMap.get(celeb.tmdb_id)!.push(celeb);
    }
    if (celeb.imdb_id) {
      if (!imdbMap.has(celeb.imdb_id)) imdbMap.set(celeb.imdb_id, []);
      imdbMap.get(celeb.imdb_id)!.push(celeb);
    }
    if (celeb.wikidata_id) {
      if (!wikidataMap.has(celeb.wikidata_id)) wikidataMap.set(celeb.wikidata_id, []);
      wikidataMap.get(celeb.wikidata_id)!.push(celeb);
    }
  }

  // Report TMDB duplicates
  for (const [tmdbId, celebs] of tmdbMap.entries()) {
    if (celebs.length > 1) {
      celebs.forEach(c => processedIds.add(c.id));
      duplicateGroups.push({
        reason: `Same TMDB ID: ${tmdbId}`,
        severity: 'high',
        celebrities: celebs,
        recommendation: 'MERGE - These are definitely the same person (same TMDB profile)'
      });
      console.log(red(`  ❌ TMDB Duplicate: ${tmdbId}`));
      celebs.forEach(c => console.log(white(`     - ${c.name_en} (${c.slug})`)));
      console.log('');
    }
  }

  // Report IMDb duplicates
  for (const [imdbId, celebs] of imdbMap.entries()) {
    if (celebs.length > 1) {
      celebs.forEach(c => processedIds.add(c.id));
      duplicateGroups.push({
        reason: `Same IMDb ID: ${imdbId}`,
        severity: 'high',
        celebrities: celebs,
        recommendation: 'MERGE - These are definitely the same person (same IMDb profile)'
      });
      console.log(red(`  ❌ IMDb Duplicate: ${imdbId}`));
      celebs.forEach(c => console.log(white(`     - ${c.name_en} (${c.slug})`)));
      console.log('');
    }
  }

  // Report Wikidata duplicates
  for (const [wikidataId, celebs] of wikidataMap.entries()) {
    if (celebs.length > 1) {
      celebs.forEach(c => processedIds.add(c.id));
      duplicateGroups.push({
        reason: `Same Wikidata ID: ${wikidataId}`,
        severity: 'high',
        celebrities: celebs,
        recommendation: 'MERGE - These are definitely the same person (same Wikidata entity)'
      });
      console.log(red(`  ❌ Wikidata Duplicate: ${wikidataId}`));
      celebs.forEach(c => console.log(white(`     - ${c.name_en} (${c.slug})`)));
      console.log('');
    }
  }

  // 2. Find name similarity matches
  console.log(cyan(bold('  🔍 Checking for name similarities...\n')));

  const nameGroups = new Map<string, Celebrity[]>();

  for (const celeb of celebrities) {
    if (processedIds.has(celeb.id)) continue; // Skip already identified duplicates

    const normalizedName = normalizeNameForComparison(celeb.name_en);
    
    // Check against all other celebrities
    for (const other of celebrities) {
      if (celeb.id === other.id) continue;
      if (processedIds.has(other.id)) continue;

      const otherNormalized = normalizeNameForComparison(other.name_en);
      const similarity = similarityScore(normalizedName, otherNormalized);

      // High similarity threshold (>0.85 = likely same person)
      if (similarity > 0.85) {
        const key = [celeb.id, other.id].sort().join('-');
        if (!nameGroups.has(key)) {
          nameGroups.set(key, [celeb, other]);
        }
      }
    }
  }

  // Report name similarity duplicates
  for (const [key, celebs] of nameGroups.entries()) {
    const similarity = similarityScore(
      normalizeNameForComparison(celebs[0].name_en),
      normalizeNameForComparison(celebs[1].name_en)
    );

    celebs.forEach(c => processedIds.add(c.id));

    const severity = similarity > 0.95 ? 'high' : similarity > 0.90 ? 'medium' : 'low';
    
    duplicateGroups.push({
      reason: `Similar names (${Math.round(similarity * 100)}% match)`,
      severity,
      celebrities: celebs,
      recommendation: severity === 'high' 
        ? 'LIKELY DUPLICATE - Review and merge if same person'
        : 'POSSIBLE DUPLICATE - Manual review recommended'
    });

    const color = severity === 'high' ? red : severity === 'medium' ? yellow : white;
    console.log(color(`  ${severity === 'high' ? '❌' : '⚠️'} Name Similarity: ${Math.round(similarity * 100)}%`));
    celebs.forEach(c => console.log(white(`     - ${c.name_en} (${c.slug})`)));
    console.log('');
  }

  // 3. Check for slug variations (e.g., celeb-krishna vs krishna)
  console.log(cyan(bold('  🔍 Checking for slug variations...\n')));

  const slugVariations = new Map<string, Celebrity[]>();

  for (const celeb of celebrities) {
    if (processedIds.has(celeb.id)) continue;
    if (!celeb.slug) continue; // Skip null slugs

    const baseSlug = celeb.slug.replace(/^celeb-/, '');
    
    for (const other of celebrities) {
      if (celeb.id === other.id) continue;
      if (processedIds.has(other.id)) continue;
      if (!other.slug) continue; // Skip null slugs

      const otherBaseSlug = other.slug.replace(/^celeb-/, '');
      
      if (baseSlug === otherBaseSlug) {
        const key = [celeb.id, other.id].sort().join('-');
        if (!slugVariations.has(key)) {
          slugVariations.set(key, [celeb, other]);
        }
      }
    }
  }

  for (const [key, celebs] of slugVariations.entries()) {
    celebs.forEach(c => processedIds.add(c.id));

    duplicateGroups.push({
      reason: 'Slug variation (celeb- prefix difference)',
      severity: 'medium',
      celebrities: celebs,
      recommendation: 'REVIEW - Likely same person with inconsistent slug naming'
    });

    console.log(yellow(`  ⚠️ Slug Variation:`));
    celebs.forEach(c => console.log(white(`     - ${c.name_en} (${c.slug})`)));
    console.log('');
  }

  // Generate summary
  console.log(cyan(bold('╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                        DUPLICATE SUMMARY                               ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  const highSeverity = duplicateGroups.filter(g => g.severity === 'high');
  const mediumSeverity = duplicateGroups.filter(g => g.severity === 'medium');
  const lowSeverity = duplicateGroups.filter(g => g.severity === 'low');

  console.log(white(`  Total Duplicate Groups Found: ${duplicateGroups.length}\n`));
  console.log(red(`  🔴 High Priority (Definite Duplicates): ${highSeverity.length}`));
  console.log(yellow(`  🟡 Medium Priority (Likely Duplicates): ${mediumSeverity.length}`));
  console.log(white(`  ⚪ Low Priority (Possible Duplicates): ${lowSeverity.length}\n`));

  const totalAffected = new Set(duplicateGroups.flatMap(g => g.celebrities.map(c => c.id))).size;
  console.log(white(`  Total Profiles Affected: ${totalAffected} (${Math.round(totalAffected / celebrities.length * 100)}%)\n`));

  // Export detailed report
  const report = {
    generated_at: new Date().toISOString(),
    total_profiles: celebrities.length,
    total_duplicate_groups: duplicateGroups.length,
    total_profiles_affected: totalAffected,
    by_severity: {
      high: highSeverity.length,
      medium: mediumSeverity.length,
      low: lowSeverity.length
    },
    duplicate_groups: duplicateGroups.map(group => ({
      reason: group.reason,
      severity: group.severity,
      recommendation: group.recommendation,
      celebrities: group.celebrities.map(c => ({
        id: c.id,
        name: c.name_en,
        slug: c.slug,
        tmdb_id: c.tmdb_id,
        imdb_id: c.imdb_id,
        wikidata_id: c.wikidata_id,
        confidence_score: c.entity_confidence_score,
        is_published: c.is_published,
        has_bio: !!c.short_bio,
        profile_url: `http://localhost:3000/movies?profile=${c.slug}`
      }))
    }))
  };

  writeFileSync('docs/manual-review/DUPLICATE-CELEBRITIES-AUDIT.json', JSON.stringify(report, null, 2));
  console.log(green('  ✅ Detailed report exported to: docs/manual-review/DUPLICATE-CELEBRITIES-AUDIT.json\n'));

  // Generate merge script suggestions
  if (highSeverity.length > 0) {
    console.log(cyan(bold('  📝 RECOMMENDED ACTIONS:\n')));
    console.log(white('  1. Review high-priority duplicates first'));
    console.log(white('  2. For each group, keep the profile with:'));
    console.log(white('     - Higher entity_confidence_score'));
    console.log(white('     - More complete data (has bio, awards, etc.)'));
    console.log(white('     - Earlier created_at date (original profile)'));
    console.log(white('  3. Use the merge script to consolidate data'));
    console.log(white('  4. Delete duplicate profiles\n'));
  }

  console.log(cyan(bold('  🚀 NEXT STEPS:\n')));
  console.log(white('  1. Review: docs/manual-review/DUPLICATE-CELEBRITIES-AUDIT.json'));
  console.log(white('  2. Run merge script: npx tsx scripts/merge-duplicate-celebrities.ts'));
  console.log(white('  3. Re-run audit to verify cleanup'));
  console.log(white('  4. Proceed with enrichment\n'));

  return { duplicateGroups, totalAffected };
}

findDuplicates().catch(console.error);
