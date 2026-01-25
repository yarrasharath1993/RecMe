#!/usr/bin/env npx tsx
/**
 * CONSOLIDATED DISCOVERY REPORT
 * 
 * Generates a master report from all actor discovery CSV files
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface DiscoveredFilm {
  actor: string;
  title: string;
  year: number;
  sources: string[];
  confidence: number;
  role: string;
  inDatabase: boolean;
  wasAdded: boolean;
  reason?: string;
}

function parseCSV(filePath: string, actorName: string): DiscoveredFilm[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  if (lines.length < 2) return [];
  
  const films: DiscoveredFilm[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Parse CSV with quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    
    if (fields.length >= 7) {
      films.push({
        actor: actorName,
        title: fields[0].replace(/"/g, ''),
        year: parseInt(fields[1]) || 0,
        sources: fields[2].replace(/"/g, '').split(';').filter(s => s),
        confidence: parseFloat(fields[3]) || 0,
        role: fields[4].replace(/"/g, ''),
        inDatabase: fields[5].toLowerCase() === 'yes',
        wasAdded: fields[6].toLowerCase() === 'yes',
        reason: fields[7]?.replace(/"/g, '') || undefined,
      });
    }
  }
  
  return films;
}

async function main() {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║              CONSOLIDATED DISCOVERY REPORT                           ║
║              (All Flagged Films from Batch Discovery)                ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  const docsDir = path.join(process.cwd(), 'docs');
  const reportFiles = fs.readdirSync(docsDir)
    .filter(f => f.endsWith('-discovery-report.csv'))
    .map(f => path.join(docsDir, f));

  console.log(`  Found ${chalk.cyan(reportFiles.length)} discovery reports\n`);

  const allFilms: DiscoveredFilm[] = [];
  
  for (const reportFile of reportFiles) {
    const fileName = path.basename(reportFile);
    const actorName = fileName
      .replace('-discovery-report.csv', '')
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    
    const films = parseCSV(reportFile, actorName);
    allFilms.push(...films);
  }

  console.log(`  Total films discovered: ${chalk.cyan(allFilms.length)}\n`);

  // Categorize films
  const alreadyInDb = allFilms.filter(f => f.inDatabase);
  const addedToDB = allFilms.filter(f => f.wasAdded);
  const flaggedForReview = allFilms.filter(f => !f.inDatabase && !f.wasAdded);

  // Group flagged films by reason
  const groupedByReason: Record<string, DiscoveredFilm[]> = {};
  flaggedForReview.forEach(f => {
    const reason = f.reason || 'Unknown';
    if (!groupedByReason[reason]) {
      groupedByReason[reason] = [];
    }
    groupedByReason[reason].push(f);
  });

  // Print summary
  console.log(chalk.yellow.bold('═══════════════════════════════════════════════════════════════════'));
  console.log(chalk.yellow.bold('SUMMARY'));
  console.log(chalk.yellow.bold('═══════════════════════════════════════════════════════════════════\n'));

  console.log(`  ${chalk.green('✓')} Already in database: ${chalk.cyan(alreadyInDb.length)}`);
  console.log(`  ${chalk.green('✓')} Successfully added: ${chalk.cyan(addedToDB.length)}`);
  console.log(`  ${chalk.yellow('⚠')}  Flagged for review: ${chalk.yellow(flaggedForReview.length)}\n`);

  // Breakdown by actor
  const byActor: Record<string, { total: number; added: number; flagged: number }> = {};
  allFilms.forEach(f => {
    if (!byActor[f.actor]) {
      byActor[f.actor] = { total: 0, added: 0, flagged: 0 };
    }
    byActor[f.actor].total++;
    if (f.wasAdded) byActor[f.actor].added++;
    if (!f.inDatabase && !f.wasAdded) byActor[f.actor].flagged++;
  });

  console.log(chalk.yellow.bold('By Actor:\n'));
  Object.entries(byActor)
    .sort((a, b) => b[1].flagged - a[1].flagged)
    .forEach(([actor, stats]) => {
      if (stats.flagged > 0) {
        console.log(`  ${actor.padEnd(30)} - Total: ${stats.total}, Added: ${chalk.green(stats.added)}, Flagged: ${chalk.yellow(stats.flagged)}`);
      }
    });

  // Breakdown by reason
  console.log(chalk.yellow.bold('\n\nFlagged Films by Reason:\n'));
  Object.entries(groupedByReason)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([reason, films]) => {
      console.log(`  ${reason.padEnd(50)} ${chalk.yellow(films.length)} films`);
    });

  // Generate CSV report
  const reportPath = path.join(docsDir, 'CONSOLIDATED-DISCOVERY-REPORT.csv');
  const csvLines = [
    'Actor,Title,Year,Sources,Confidence,Role,In Database,Was Added,Reason',
    ...flaggedForReview.map(f => 
      `"${f.actor}","${f.title}",${f.year},"${f.sources.join(';')}",${f.confidence},"${f.role}",${f.inDatabase ? 'Yes' : 'No'},${f.wasAdded ? 'Yes' : 'No'},"${f.reason || ''}"`
    )
  ];
  
  fs.writeFileSync(reportPath, csvLines.join('\n'));

  // Generate Markdown report
  const mdPath = path.join(docsDir, 'CONSOLIDATED-DISCOVERY-REPORT.md');
  const mdLines = [
    '# Consolidated Discovery Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- **Total Films Discovered**: ${allFilms.length}`,
    `- **Already in Database**: ${alreadyInDb.length}`,
    `- **Successfully Added**: ${addedToDB.length}`,
    `- **Flagged for Review**: ${flaggedForReview.length}`,
    '',
    '## Films Successfully Added',
    '',
    '| Actor | Title | Year | Confidence | Role |',
    '|-------|-------|------|------------|------|',
    ...addedToDB.map(f => `| ${f.actor} | ${f.title} | ${f.year} | ${f.confidence.toFixed(2)} | ${f.role} |`),
    '',
    '## Flagged Films by Actor',
    '',
  ];

  Object.entries(byActor)
    .sort((a, b) => b[1].flagged - a[1].flagged)
    .forEach(([actor, stats]) => {
      if (stats.flagged > 0) {
        mdLines.push(`### ${actor} (${stats.flagged} flagged films)`);
        mdLines.push('');
        mdLines.push('| Title | Year | Sources | Confidence | Role | Reason |');
        mdLines.push('|-------|------|---------|------------|------|--------|');
        
        const actorFilms = flaggedForReview.filter(f => f.actor === actor);
        actorFilms.forEach(f => {
          mdLines.push(`| ${f.title} | ${f.year} | ${f.sources.join(', ')} | ${f.confidence.toFixed(2)} | ${f.role} | ${f.reason || '-'} |`);
        });
        mdLines.push('');
      }
    });

  mdLines.push('## Flagged Films by Reason');
  mdLines.push('');
  
  Object.entries(groupedByReason)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([reason, films]) => {
      mdLines.push(`### ${reason} (${films.length} films)`);
      mdLines.push('');
      mdLines.push('| Actor | Title | Year | Sources | Confidence |');
      mdLines.push('|-------|-------|------|---------|------------|');
      films.slice(0, 20).forEach(f => {
        mdLines.push(`| ${f.actor} | ${f.title} | ${f.year} | ${f.sources.join(', ')} | ${f.confidence.toFixed(2)} |`);
      });
      if (films.length > 20) {
        mdLines.push(`| ... and ${films.length - 20} more | | | | |`);
      }
      mdLines.push('');
    });

  fs.writeFileSync(mdPath, mdLines.join('\n'));

  console.log(chalk.green.bold('\n\n═══════════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('REPORTS GENERATED'));
  console.log(chalk.green.bold('═══════════════════════════════════════════════════════════════════\n'));

  console.log(`  ${chalk.cyan('CSV Report:')} ${reportPath}`);
  console.log(`  ${chalk.cyan('Markdown Report:')} ${mdPath}\n`);
  
  console.log(chalk.gray('  Use these reports to:'));
  console.log(chalk.gray('  • Review films flagged for manual addition'));
  console.log(chalk.gray('  • Identify patterns in missing films'));
  console.log(chalk.gray('  • Decide which films to add manually\n'));
}

main().catch(console.error);
