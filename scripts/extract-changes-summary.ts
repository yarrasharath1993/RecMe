#!/usr/bin/env npx tsx
/**
 * EXTRACT CHANGES SUMMARY
 * 
 * Parses log files to extract exact list of movies added and deleted
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface Change {
  title: string;
  year: number;
  actor?: string;
  action: 'added' | 'deleted';
  reason?: string;
}

function parseLogFile(logPath: string): Change[] {
  if (!fs.existsSync(logPath)) {
    return [];
  }

  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  const changes: Change[] = [];
  let currentActor = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track current actor
    const actorMatch = line.match(/Processing: (.+)$/);
    if (actorMatch) {
      currentActor = actorMatch[1];
    }

    // Match "✓ Added: Title (Year)"
    const addedMatch = line.match(/✓ Added: (.+?) \((\d{4})\)/);
    if (addedMatch) {
      changes.push({
        title: addedMatch[1],
        year: parseInt(addedMatch[2]),
        actor: currentActor,
        action: 'added',
      });
    }

    // Match deleted entries from cleanup script
    const deletedMatch = line.match(/- (.+?) \((\d{4})\)/);
    if (deletedMatch && i > 0 && lines[i-5]?.includes('Deleting')) {
      changes.push({
        title: deletedMatch[1],
        year: parseInt(deletedMatch[2]),
        action: 'deleted',
        reason: 'Award entry or duplicate',
      });
    }
  }

  return changes;
}

function parseCleanupOutput(content: string): { deleted: Change[]; merged: Change[] } {
  const lines = content.split('\n');
  const deleted: Change[] = [];
  const merged: Change[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Award entries
    const awardMatch = line.match(/- (.+?) \((\d{4})\)/);
    if (awardMatch && lines[i-2]?.includes('award entries')) {
      deleted.push({
        title: awardMatch[1],
        year: parseInt(awardMatch[2]),
        action: 'deleted',
        reason: 'Award entry (not a film)',
      });
    }

    // Duplicates - look for "Deleted: Title (Year)"
    const dupDeleteMatch = line.match(/Deleted: (.+?) \((\d{4})\)/);
    if (dupDeleteMatch) {
      merged.push({
        title: dupDeleteMatch[1],
        year: parseInt(dupDeleteMatch[2]),
        action: 'deleted',
        reason: 'Duplicate (merged into another entry)',
      });
    }
  }

  return { deleted, merged };
}

async function main() {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║              DATABASE CHANGES SUMMARY                                ║
║              (Added & Deleted Movies)                                ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  const logFiles = [
    'batch-all-actors.log',
    'batch-continuous-output.log',
    'batch-turbo-output.log',
    'batch-3-output.log',
  ];

  const allAdded: Change[] = [];
  const allDeleted: Change[] = [];

  // Parse batch processing logs
  for (const logFile of logFiles) {
    const logPath = path.join(process.cwd(), logFile);
    const changes = parseLogFile(logPath);
    
    changes.forEach(c => {
      if (c.action === 'added') {
        allAdded.push(c);
      } else {
        allDeleted.push(c);
      }
    });
  }

  // Parse cleanup script output (from terminal history)
  const cleanupLogPath = path.join(process.cwd(), 'cleanup-output.log');
  if (fs.existsSync(cleanupLogPath)) {
    const content = fs.readFileSync(cleanupLogPath, 'utf-8');
    const { deleted, merged } = parseCleanupOutput(content);
    allDeleted.push(...deleted, ...merged);
  }

  // Deduplicate by title + year
  const uniqueAdded = Array.from(
    new Map(allAdded.map(m => [`${m.title}-${m.year}`, m])).values()
  );
  
  const uniqueDeleted = Array.from(
    new Map(allDeleted.map(m => [`${m.title}-${m.year}`, m])).values()
  );

  // Also parse from cleanup script output in logs
  const batchAllLog = path.join(process.cwd(), 'batch-all-actors.log');
  if (fs.existsSync(batchAllLog)) {
    const content = fs.readFileSync(batchAllLog, 'utf-8');
    
    // Extract from cleanup summary section
    const summaryMatch = content.match(/Award entries deleted: (\d+)([\s\S]*?)Duplicates merged: (\d+)([\s\S]*?)Cleanup complete/);
    if (summaryMatch) {
      const awardsSection = summaryMatch[2];
      const duplicatesSection = summaryMatch[4];
      
      // Parse award entries
      const awardMatches = awardsSection.matchAll(/• (.+?) \((\d{4})\)/g);
      for (const match of awardMatches) {
        uniqueDeleted.push({
          title: match[1],
          year: parseInt(match[2]),
          action: 'deleted',
          reason: 'Award entry (not a film)',
        });
      }
      
      // Parse duplicates
      const dupMatches = duplicatesSection.matchAll(/Deleted: (.+?) \((\d{4})\)/g);
      for (const match of dupMatches) {
        uniqueDeleted.push({
          title: match[1],
          year: parseInt(match[2]),
          action: 'deleted',
          reason: 'Duplicate entry (merged)',
        });
      }
    }
  }

  // Final deduplication
  const finalAdded = Array.from(
    new Map(uniqueAdded.map(m => [`${m.title}-${m.year}`, m])).values()
  ).sort((a, b) => a.actor?.localeCompare(b.actor || '') || 0);

  const finalDeleted = Array.from(
    new Map(uniqueDeleted.map(m => [`${m.title}-${m.year}`, m])).values()
  ).sort((a, b) => (a.reason || '').localeCompare(b.reason || ''));

  // Print summary
  console.log(chalk.green.bold('═══════════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold(`MOVIES ADDED: ${finalAdded.length}`));
  console.log(chalk.green.bold('═══════════════════════════════════════════════════════════════════\n'));

  if (finalAdded.length === 0) {
    console.log(chalk.yellow('  No movies were added in this batch run.\n'));
  } else {
    // Group by actor
    const byActor: Record<string, Change[]> = {};
    finalAdded.forEach(m => {
      const actor = m.actor || 'Unknown';
      if (!byActor[actor]) byActor[actor] = [];
      byActor[actor].push(m);
    });

    Object.entries(byActor).forEach(([actor, movies]) => {
      console.log(chalk.cyan(`  ${actor} (${movies.length} films):`));
      movies.forEach(m => {
        console.log(`    ✓ ${m.title} (${m.year})`);
      });
      console.log('');
    });
  }

  console.log(chalk.red.bold('═══════════════════════════════════════════════════════════════════'));
  console.log(chalk.red.bold(`MOVIES DELETED: ${finalDeleted.length}`));
  console.log(chalk.red.bold('═══════════════════════════════════════════════════════════════════\n'));

  if (finalDeleted.length === 0) {
    console.log(chalk.yellow('  No movies were deleted in this batch run.\n'));
  } else {
    // Group by reason
    const byReason: Record<string, Change[]> = {};
    finalDeleted.forEach(m => {
      const reason = m.reason || 'Unknown';
      if (!byReason[reason]) byReason[reason] = [];
      byReason[reason].push(m);
    });

    Object.entries(byReason).forEach(([reason, movies]) => {
      console.log(chalk.yellow(`  ${reason} (${movies.length} entries):`));
      movies.forEach(m => {
        console.log(`    ✗ ${m.title} (${m.year})`);
      });
      console.log('');
    });
  }

  // Generate CSV report
  const reportPath = path.join(process.cwd(), 'docs', 'DATABASE-CHANGES.csv');
  const csvLines = [
    'Action,Title,Year,Actor,Reason',
    ...finalAdded.map(m => `Added,"${m.title}",${m.year},"${m.actor || ''}",""`),
    ...finalDeleted.map(m => `Deleted,"${m.title}",${m.year},"","${m.reason || ''}"`),
  ];
  
  fs.writeFileSync(reportPath, csvLines.join('\n'));

  console.log(chalk.gray(`\n  Report saved: ${reportPath}\n`));

  // Summary table
  console.log(chalk.cyan.bold('SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════\n'));
  console.log(`  ${chalk.green('Added')}: ${chalk.cyan(finalAdded.length)} films`);
  console.log(`  ${chalk.red('Deleted')}: ${chalk.cyan(finalDeleted.length)} entries (${finalDeleted.filter(d => d.reason?.includes('Award')).length} awards, ${finalDeleted.filter(d => d.reason?.includes('Duplicate')).length} duplicates)`);
  console.log(`  ${chalk.yellow('Net change')}: ${chalk.cyan(finalAdded.length - finalDeleted.length)} films\n`);
}

main().catch(console.error);
