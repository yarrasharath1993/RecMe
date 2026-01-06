/**
 * CAST CHANGE AUDIT
 * 
 * Centralized audit logging and rollback script generation for cast corrections.
 * 
 * Features:
 * - Track all cast/crew changes with timestamps
 * - Generate SQL rollback scripts
 * - View change history
 * - Apply rollbacks
 * 
 * Usage:
 *   npx tsx scripts/cast-change-audit.ts --view
 *   npx tsx scripts/cast-change-audit.ts --view --actor="Chiranjeevi"
 *   npx tsx scripts/cast-change-audit.ts --generate-rollback --date=2024-01-15
 *   npx tsx scripts/cast-change-audit.ts --apply-rollback=docs/ROLLBACK_2024-01-15.sql
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPES
// ============================================================

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  movieId: string;
  title: string;
  year: number;
  changes: CastChange[];
  propagatedTo: string[];
  validated: boolean;
  source: string;
  userId?: string;
  notes?: string;
}

export interface CastChange {
  field: 'hero' | 'heroine' | 'director';
  oldValue: string | null;
  newValue: string;
  role?: string;
}

interface AuditStats {
  totalChanges: number;
  byField: Record<string, number>;
  bySource: Record<string, number>;
  byDate: Record<string, number>;
  affectedMovies: number;
}

// Audit log file path
const AUDIT_LOG_PATH = 'docs/CAST_AUDIT_LOG.json';

// ============================================================
// AUDIT LOG MANAGEMENT
// ============================================================

function loadAuditLog(): ChangeLogEntry[] {
  try {
    if (fs.existsSync(AUDIT_LOG_PATH)) {
      const content = fs.readFileSync(AUDIT_LOG_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.log('  ⚠️  Could not load audit log, starting fresh');
  }
  return [];
}

function saveAuditLog(entries: ChangeLogEntry[]): void {
  const dir = path.dirname(AUDIT_LOG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(entries, null, 2));
}

/**
 * Add a new entry to the audit log
 */
export function logChange(entry: Omit<ChangeLogEntry, 'id'>): ChangeLogEntry {
  const entries = loadAuditLog();
  
  const newEntry: ChangeLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...entry
  };
  
  entries.push(newEntry);
  saveAuditLog(entries);
  
  return newEntry;
}

/**
 * Log multiple changes at once
 */
export function logChanges(entries: Omit<ChangeLogEntry, 'id'>[]): ChangeLogEntry[] {
  const existingEntries = loadAuditLog();
  
  const newEntries: ChangeLogEntry[] = entries.map(entry => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...entry
  }));
  
  existingEntries.push(...newEntries);
  saveAuditLog(existingEntries);
  
  return newEntries;
}

// ============================================================
// ROLLBACK SCRIPT GENERATION
// ============================================================

/**
 * Generate SQL rollback script for specific entries
 */
export function generateRollbackScript(entries: ChangeLogEntry[]): string {
  const lines: string[] = [
    '-- ============================================================',
    '-- CAST CORRECTION ROLLBACK SCRIPT',
    '-- ============================================================',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Entries: ${entries.length}`,
    `-- Total changes: ${entries.reduce((acc, e) => acc + e.changes.length, 0)}`,
    '-- ============================================================',
    '',
    '-- ⚠️  REVIEW CAREFULLY BEFORE EXECUTING',
    '-- This script will revert the following changes:',
    '',
  ];

  for (const entry of entries) {
    lines.push(`-- ────────────────────────────────────────────────────────`);
    lines.push(`-- Movie: ${entry.title} (${entry.year})`);
    lines.push(`-- Changed: ${entry.timestamp}`);
    lines.push(`-- Source: ${entry.source}`);
    lines.push(`-- ────────────────────────────────────────────────────────`);
    
    for (const change of entry.changes) {
      const oldValue = change.oldValue === null ? 'NULL' : `'${change.oldValue.replace(/'/g, "''")}'`;
      const newValue = `'${change.newValue.replace(/'/g, "''")}'`;
      
      lines.push(`-- Revert ${change.field}: ${change.newValue} → ${change.oldValue || 'NULL'}`);
      lines.push(`UPDATE movies SET ${change.field} = ${oldValue} WHERE id = '${entry.movieId}';`);
    }
    lines.push('');
  }

  lines.push('-- ============================================================');
  lines.push('-- END OF ROLLBACK SCRIPT');
  lines.push('-- ============================================================');

  return lines.join('\n');
}

/**
 * Generate JavaScript rollback script (for complex rollbacks including reviews)
 */
export function generateJSRollbackScript(entries: ChangeLogEntry[]): string {
  const lines: string[] = [
    '/**',
    ' * CAST CORRECTION ROLLBACK SCRIPT',
    ` * Generated: ${new Date().toISOString()}`,
    ` * Entries: ${entries.length}`,
    ' */',
    '',
    "import { createClient } from '@supabase/supabase-js';",
    "import * as dotenv from 'dotenv';",
    '',
    "dotenv.config({ path: '.env.local' });",
    '',
    'const supabase = createClient(',
    '  process.env.NEXT_PUBLIC_SUPABASE_URL!,',
    '  process.env.SUPABASE_SERVICE_ROLE_KEY!',
    ');',
    '',
    'async function rollback() {',
    '  const changes = ' + JSON.stringify(entries, null, 2) + ';',
    '',
    '  for (const entry of changes) {',
    '    console.log(`Rolling back: ${entry.title} (${entry.year})`);',
    '    ',
    '    const updates: Record<string, any> = {};',
    '    for (const change of entry.changes) {',
    '      updates[change.field] = change.oldValue;',
    '    }',
    '    ',
    '    const { error } = await supabase',
    '      .from("movies")',
    '      .update(updates)',
    '      .eq("id", entry.movieId);',
    '    ',
    '    if (error) {',
    '      console.error(`  ✗ Failed: ${error.message}`);',
    '    } else {',
    '      console.log(`  ✓ Rolled back`);',
    '    }',
    '  }',
    '}',
    '',
    'rollback().catch(console.error);',
  ];

  return lines.join('\n');
}

// ============================================================
// QUERY AND STATISTICS
// ============================================================

/**
 * Get changes for a specific date range
 */
export function getChangesByDate(
  startDate?: string,
  endDate?: string
): ChangeLogEntry[] {
  const entries = loadAuditLog();
  
  return entries.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    if (startDate && entryDate < new Date(startDate)) return false;
    if (endDate && entryDate > new Date(endDate)) return false;
    return true;
  });
}

/**
 * Get changes for a specific actor
 */
export function getChangesByActor(actorName: string): ChangeLogEntry[] {
  const entries = loadAuditLog();
  const lowerName = actorName.toLowerCase();
  
  return entries.filter(entry => {
    // Check if actor is mentioned in old or new values
    return entry.changes.some(change =>
      change.oldValue?.toLowerCase().includes(lowerName) ||
      change.newValue.toLowerCase().includes(lowerName)
    );
  });
}

/**
 * Get changes for a specific movie
 */
export function getChangesByMovie(movieId: string): ChangeLogEntry[] {
  const entries = loadAuditLog();
  return entries.filter(entry => entry.movieId === movieId);
}

/**
 * Calculate statistics from audit log
 */
export function getAuditStats(): AuditStats {
  const entries = loadAuditLog();
  
  const stats: AuditStats = {
    totalChanges: 0,
    byField: {},
    bySource: {},
    byDate: {},
    affectedMovies: 0
  };

  const movieIds = new Set<string>();

  for (const entry of entries) {
    movieIds.add(entry.movieId);
    stats.bySource[entry.source] = (stats.bySource[entry.source] || 0) + 1;
    
    const date = entry.timestamp.split('T')[0];
    stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    
    for (const change of entry.changes) {
      stats.totalChanges++;
      stats.byField[change.field] = (stats.byField[change.field] || 0) + 1;
    }
  }

  stats.affectedMovies = movieIds.size;
  
  return stats;
}

// ============================================================
// CLI DISPLAY
// ============================================================

function displayChanges(entries: ChangeLogEntry[]): void {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`CHANGE HISTORY (${entries.length} entries)`);
  console.log(`${'─'.repeat(70)}\n`);

  for (const entry of entries.slice(-20)) { // Show last 20
    console.log(`📌 ${entry.title} (${entry.year})`);
    console.log(`   ID: ${entry.movieId}`);
    console.log(`   Time: ${entry.timestamp}`);
    console.log(`   Source: ${entry.source}`);
    
    for (const change of entry.changes) {
      console.log(`   • ${change.field}: "${change.oldValue}" → "${change.newValue}"`);
    }
    
    if (entry.propagatedTo.length > 0) {
      console.log(`   Propagated: ${entry.propagatedTo.join(', ')}`);
    }
    console.log('');
  }

  if (entries.length > 20) {
    console.log(`... and ${entries.length - 20} more entries`);
  }
}

function displayStats(stats: AuditStats): void {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('AUDIT STATISTICS');
  console.log(`${'═'.repeat(70)}\n`);

  console.log(`  Total Changes:     ${stats.totalChanges}`);
  console.log(`  Affected Movies:   ${stats.affectedMovies}`);
  
  console.log('\n  By Field:');
  Object.entries(stats.byField).sort((a, b) => b[1] - a[1]).forEach(([field, count]) => {
    console.log(`    ${field}: ${count}`);
  });

  console.log('\n  By Source:');
  Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
    console.log(`    ${source}: ${count}`);
  });

  console.log('\n  Recent Dates:');
  const recentDates = Object.entries(stats.byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 5);
  recentDates.forEach(([date, count]) => {
    console.log(`    ${date}: ${count} changes`);
  });
}

// ============================================================
// CLI
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  
  const viewMode = args.includes('--view');
  const statsMode = args.includes('--stats');
  const generateRollback = args.includes('--generate-rollback');
  const applyRollbackArg = args.find(a => a.startsWith('--apply-rollback='));
  const actorArg = args.find(a => a.startsWith('--actor='));
  const dateArg = args.find(a => a.startsWith('--date='));
  const startDateArg = args.find(a => a.startsWith('--start-date='));
  const endDateArg = args.find(a => a.startsWith('--end-date='));
  const movieArg = args.find(a => a.startsWith('--movie='));

  console.log('\n' + '═'.repeat(70));
  console.log('CAST CHANGE AUDIT');
  console.log('═'.repeat(70));

  if (statsMode) {
    const stats = getAuditStats();
    displayStats(stats);
    return;
  }

  if (viewMode) {
    let entries: ChangeLogEntry[];
    
    if (actorArg) {
      const actorName = actorArg.split('=')[1];
      entries = getChangesByActor(actorName);
      console.log(`\nChanges involving: ${actorName}`);
    } else if (movieArg) {
      const movieId = movieArg.split('=')[1];
      entries = getChangesByMovie(movieId);
      console.log(`\nChanges for movie: ${movieId}`);
    } else if (startDateArg || endDateArg) {
      const startDate = startDateArg?.split('=')[1];
      const endDate = endDateArg?.split('=')[1];
      entries = getChangesByDate(startDate, endDate);
      console.log(`\nChanges from ${startDate || 'beginning'} to ${endDate || 'now'}`);
    } else {
      entries = loadAuditLog();
    }
    
    displayChanges(entries);
    return;
  }

  if (generateRollback) {
    let entries: ChangeLogEntry[];
    
    if (dateArg) {
      const date = dateArg.split('=')[1];
      entries = getChangesByDate(date, date + 'T23:59:59');
      console.log(`\nGenerating rollback for date: ${date}`);
    } else if (startDateArg || endDateArg) {
      const startDate = startDateArg?.split('=')[1];
      const endDate = endDateArg?.split('=')[1];
      entries = getChangesByDate(startDate, endDate);
    } else {
      // Last 24 hours by default
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      entries = getChangesByDate(yesterday);
      console.log('\nGenerating rollback for last 24 hours');
    }

    if (entries.length === 0) {
      console.log('  No changes found for the specified period');
      return;
    }

    // Generate SQL rollback
    const sqlScript = generateRollbackScript(entries);
    const sqlPath = `docs/ROLLBACK_${new Date().toISOString().split('T')[0]}.sql`;
    fs.writeFileSync(sqlPath, sqlScript);
    console.log(`\n  📝 SQL rollback saved: ${sqlPath}`);

    // Generate JS rollback
    const jsScript = generateJSRollbackScript(entries);
    const jsPath = sqlPath.replace('.sql', '.ts');
    fs.writeFileSync(jsPath, jsScript);
    console.log(`  📝 JS rollback saved: ${jsPath}`);

    console.log(`\n  Total entries: ${entries.length}`);
    console.log(`  Total changes: ${entries.reduce((acc, e) => acc + e.changes.length, 0)}`);
    return;
  }

  if (applyRollbackArg) {
    const rollbackPath = applyRollbackArg.split('=')[1];
    
    if (!fs.existsSync(rollbackPath)) {
      console.log(`  ✗ Rollback file not found: ${rollbackPath}`);
      return;
    }

    if (rollbackPath.endsWith('.ts')) {
      console.log('\n  To apply JS rollback, run:');
      console.log(`    npx tsx ${rollbackPath}`);
    } else if (rollbackPath.endsWith('.sql')) {
      console.log('\n  To apply SQL rollback, run the script in your database client.');
      console.log('  Preview:');
      const content = fs.readFileSync(rollbackPath, 'utf-8');
      console.log(content.split('\n').slice(0, 30).join('\n'));
      if (content.split('\n').length > 30) {
        console.log('\n  ... (truncated)');
      }
    }
    return;
  }

  // Default: show help
  console.log(`
Usage:
  View changes:
    npx tsx scripts/cast-change-audit.ts --view
    npx tsx scripts/cast-change-audit.ts --view --actor="Chiranjeevi"
    npx tsx scripts/cast-change-audit.ts --view --movie=movie-id
    npx tsx scripts/cast-change-audit.ts --view --start-date=2024-01-01 --end-date=2024-01-31

  Statistics:
    npx tsx scripts/cast-change-audit.ts --stats

  Generate rollback:
    npx tsx scripts/cast-change-audit.ts --generate-rollback
    npx tsx scripts/cast-change-audit.ts --generate-rollback --date=2024-01-15
    npx tsx scripts/cast-change-audit.ts --generate-rollback --start-date=2024-01-01

  Apply rollback:
    npx tsx scripts/cast-change-audit.ts --apply-rollback=docs/ROLLBACK_2024-01-15.ts

Audit log location: ${AUDIT_LOG_PATH}
`);
}

if (require.main === module) {
  main().catch(console.error);
}


