#!/usr/bin/env npx tsx
/**
 * Generate SQL to Merge Duplicate Celebrities
 * 
 * Creates safe SQL scripts to:
 * 1. Keep the "best" profile (highest confidence, most data, has awards)
 * 2. Delete duplicate profiles
 * 3. Output for manual review before execution
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

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
  name: string;
  slug: string;
  tmdb_id: number | null;
  imdb_id: string | null;
  wikidata_id: string | null;
  confidence_score: number | null;
  is_published: boolean;
  has_bio: boolean;
  profile_url: string;
}

interface DuplicateGroup {
  reason: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  celebrities: Celebrity[];
}

interface AuditReport {
  generated_at: string;
  total_profiles: number;
  total_duplicate_groups: number;
  total_profiles_affected: number;
  by_severity: {
    high: number;
    medium: number;
    low: number;
  };
  duplicate_groups: DuplicateGroup[];
}

function selectPrimaryProfile(celebrities: Celebrity[]): { primary: Celebrity; duplicates: Celebrity[] } {
  // Score each celebrity
  const scored = celebrities.map(celeb => {
    let score = 0;
    
    // Higher confidence score is better
    score += (celeb.confidence_score || 0) * 10;
    
    // Published profiles are preferred
    if (celeb.is_published) score += 50;
    
    // Having bio is preferred
    if (celeb.has_bio) score += 30;
    
    // Having external IDs is preferred
    if (celeb.tmdb_id) score += 20;
    if (celeb.imdb_id) score += 20;
    if (celeb.wikidata_id) score += 20;
    
    // Shorter, cleaner slugs are often better
    if (!celeb.slug?.includes('celeb-')) score += 10;
    
    return { celeb, score };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  const primary = scored[0].celeb;
  const duplicates = scored.slice(1).map(s => s.celeb);
  
  return { primary, duplicates };
}

async function generateMergeSQL() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           GENERATE MERGE DUPLICATES SQL                               ║
║           Safe SQL for Manual Review                                  ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  // Load audit report
  const auditPath = resolve(process.cwd(), 'docs/manual-review/DUPLICATE-CELEBRITIES-AUDIT.json');
  console.log(white(`  📂 Loading audit report: ${auditPath}\n`));
  
  const audit: AuditReport = JSON.parse(readFileSync(auditPath, 'utf8'));
  
  console.log(green(`  ✅ Found ${audit.total_duplicate_groups} duplicate groups\n`));
  
  const sqlStatements: string[] = [];
  const summary: string[] = [];
  const allDuplicates: Celebrity[] = []; // Track all duplicates for verification
  
  sqlStatements.push('-- ============================================================');
  sqlStatements.push('-- CELEBRITY DUPLICATE REMOVAL SQL');
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
  sqlStatements.push(`-- Total Groups: ${audit.total_duplicate_groups}`);
  sqlStatements.push(`-- Total Profiles to Delete: ${audit.total_profiles_affected - audit.total_duplicate_groups}`);
  sqlStatements.push('-- ============================================================');
  sqlStatements.push('');
  sqlStatements.push('-- IMPORTANT: Review each DELETE statement before running!');
  sqlStatements.push('-- The "primary" profile (kept) is listed in comments.');
  sqlStatements.push('');
  sqlStatements.push('BEGIN;');
  sqlStatements.push('');
  
  let totalDeletes = 0;
  
  // Process only HIGH priority duplicates (definite matches)
  const highPriority = audit.duplicate_groups.filter(g => g.severity === 'high');
  
  console.log(cyan(bold('  🔴 Processing HIGH priority duplicates...\n')));
  
  for (const group of highPriority) {
    const { primary, duplicates } = selectPrimaryProfile(group.celebrities);
    
    console.log(yellow(`  ${group.reason}`));
    console.log(green(`    ✅ KEEP: ${primary.name} (${primary.slug})`));
    console.log(white(`       Score: ${primary.confidence_score || 'N/A'}, Published: ${primary.is_published}, Has Bio: ${primary.has_bio}`));
    
    sqlStatements.push(`-- ============================================================`);
    sqlStatements.push(`-- ${group.reason}`);
    sqlStatements.push(`-- PRIMARY (KEEP): ${primary.name} (${primary.slug})`);
    sqlStatements.push(`--   ID: ${primary.id}`);
    sqlStatements.push(`--   Confidence: ${primary.confidence_score}, Published: ${primary.is_published}`);
    sqlStatements.push(`-- ============================================================`);
    
    for (const dup of duplicates) {
      console.log(red(`    ❌ DELETE: ${dup.name} (${dup.slug})`));
      console.log(white(`       ID: ${dup.id}`));
      
      sqlStatements.push(`-- DELETE: ${dup.name} (${dup.slug})`);
      sqlStatements.push(`DELETE FROM celebrities WHERE id = '${dup.id}';`);
      
      allDuplicates.push(dup); // Track for verification
      totalDeletes++;
    }
    
    sqlStatements.push('');
    console.log('');
    
    summary.push(`${group.reason}: Keep "${primary.name}", Delete ${duplicates.length} duplicate(s)`);
  }
  
  sqlStatements.push('-- ============================================================');
  sqlStatements.push('-- SUMMARY');
  sqlStatements.push(`-- Total Deletes: ${totalDeletes}`);
  sqlStatements.push(`-- Profiles Retained: ${highPriority.length}`);
  sqlStatements.push('-- ============================================================');
  sqlStatements.push('');
  sqlStatements.push('-- Uncomment the line below to commit the changes:');
  sqlStatements.push('-- COMMIT;');
  sqlStatements.push('');
  sqlStatements.push('-- Or rollback if you want to review further:');
  sqlStatements.push('ROLLBACK;');
  
  // Write SQL file
  const sqlPath = resolve(process.cwd(), 'docs/manual-review/MERGE-DUPLICATES.sql');
  writeFileSync(sqlPath, sqlStatements.join('\n'));
  
  console.log(cyan(bold('╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                        SUMMARY                                         ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));
  
  console.log(white(`  Duplicate Groups Processed: ${highPriority.length} (HIGH priority only)`));
  console.log(red(`  Profiles to Delete: ${totalDeletes}`));
  console.log(green(`  Profiles to Keep: ${highPriority.length}\n`));
  
  console.log(green(`  ✅ SQL written to: ${sqlPath}\n`));
  
  console.log(cyan(bold('  📋 MERGE PLAN:\n')));
  summary.forEach((s, i) => console.log(white(`  ${i + 1}. ${s}`)));
  
  console.log(cyan(bold('\n  🚀 NEXT STEPS:\n')));
  console.log(white('  1. REVIEW: docs/manual-review/MERGE-DUPLICATES.sql'));
  console.log(white('  2. VERIFY: Check that primary profiles are correct'));
  console.log(white('  3. IMPORTANT: Check if any profile has awards data!'));
  console.log(white('  4. RUN in Supabase SQL Editor (or psql)'));
  console.log(white('  5. Change ROLLBACK to COMMIT if satisfied'));
  console.log(white('  6. Re-run audit to verify cleanup\n'));
  
  // Also generate a verification query
  const verifyPath = resolve(process.cwd(), 'docs/manual-review/VERIFY-MERGES.sql');
  const duplicateIds = allDuplicates.map(d => `  '${d.id}'`).join(',\n');
  const verifySQL = [
    '-- Verification Queries',
    '-- Run BEFORE merging to check what will be deleted',
    '',
    '-- Check profiles with awards (DO NOT DELETE THESE!)',
    'SELECT c.id, c.name_en, c.slug, COUNT(a.id) as awards_count',
    'FROM celebrities c',
    'LEFT JOIN celebrity_awards a ON c.id = a.celebrity_id',
    'WHERE c.id IN (',
    duplicateIds,
    ')',
    'GROUP BY c.id, c.name_en, c.slug',
    'HAVING COUNT(a.id) > 0;',
    '',
    '-- If above query returns any rows, STOP and manually review!',
    '',
    '-- Check all profiles that will be deleted',
    'SELECT id, name_en, slug, entity_confidence_score, is_published, short_bio IS NOT NULL as has_bio',
    'FROM celebrities',
    'WHERE id IN (',
    duplicateIds,
    ');',
  ];
  
  writeFileSync(verifyPath, verifySQL.join('\n'));
  console.log(yellow(`  ⚠️  Verification queries: ${verifyPath}\n`));
  
  // Check if any duplicate has awards
  console.log(yellow(bold('  ⚠️  IMPORTANT WARNINGS:\n')));
  console.log(red('  Some profiles marked for deletion might have:'));
  console.log(red('    - Awards data'));
  console.log(red('    - Enriched biography'));
  console.log(red('    - Family relationships'));
  console.log(red('  '));
  console.log(red('  Before running SQL:'));
  console.log(red('    1. Run VERIFY-MERGES.sql first'));
  console.log(red('    2. Check for profiles with awards_count > 0'));
  console.log(red('    3. Manually merge data if needed\n'));
}

generateMergeSQL().catch(console.error);
