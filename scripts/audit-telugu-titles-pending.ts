#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

const CSV_FILE = 'movies-missing-telugu-titles-2026-01-14.csv';

interface MovieRow {
  Slug: string;
  TitleEn: string;
  TitleTe: string;
  ReleaseYear: string;
  Hero: string;
  Heroine: string;
  Director: string;
}

function parseCSV(content: string): MovieRow[] {
  const lines = content.split('\n');
  const rows: MovieRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 7) {
      rows.push({
        Slug: values[0],
        TitleEn: values[1].replace(/^"|"$/g, ''),
        TitleTe: values[2],
        ReleaseYear: values[3],
        Hero: values[4].replace(/^"|"$/g, ''),
        Heroine: values[5].replace(/^"|"$/g, ''),
        Director: values[6].replace(/^"|"$/g, ''),
      });
    }
  }

  return rows;
}

async function auditPending() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         TELUGU TITLES - PENDING AUDIT                                ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const csvContent = readFileSync(CSV_FILE, 'utf-8');
  const records = parseCSV(csvContent);

  const filled = records.filter(r => r.TitleTe && r.TitleTe.trim().length > 0);
  const pending = records.filter(r => !r.TitleTe || r.TitleTe.trim().length === 0);

  console.log(chalk.green(`✅ Filled: ${filled.length} movies`));
  console.log(chalk.yellow(`⏳ Pending: ${pending.length} movies`));
  console.log(chalk.cyan(`📊 Total: ${records.length} movies\n`));

  // Progress bar
  const percentage = Math.round((filled.length / records.length) * 100);
  const barLength = 50;
  const filledBars = Math.round((percentage / 100) * barLength);
  const emptyBars = barLength - filledBars;
  
  console.log(chalk.cyan('Progress:'));
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(emptyBars)) + ` ${percentage}%\n`);

  // Export pending to separate file
  if (pending.length > 0) {
    const pendingLines = [
      'Slug,Title (English),Title (Telugu - FILL THIS),Release Year,Hero,Heroine,Director'
    ];
    
    for (const row of pending) {
      pendingLines.push([
        row.Slug,
        `"${row.TitleEn.replace(/"/g, '""')}"`,
        '',
        row.ReleaseYear,
        `"${row.Hero.replace(/"/g, '""')}"`,
        `"${row.Heroine.replace(/"/g, '""')}"`,
        `"${row.Director.replace(/"/g, '""')}"`,
      ].join(','));
    }
    
    const pendingFile = 'movies-telugu-titles-PENDING.csv';
    writeFileSync(pendingFile, pendingLines.join('\n'));
    console.log(chalk.green(`✓ Exported pending movies: ${pendingFile}\n`));
  }

  // Show first 20 pending
  console.log(chalk.yellow.bold('📝 First 20 Pending Movies:\n'));
  
  pending.slice(0, 20).forEach((movie, index) => {
    console.log(chalk.cyan(`${index + 1}. ${movie.TitleEn} (${movie.ReleaseYear || 'TBA'})`));
    console.log(chalk.gray(`   Slug: ${movie.Slug}`));
    console.log(chalk.gray(`   Hero: ${movie.Hero} | Director: ${movie.Director}\n`));
  });

  if (pending.length > 20) {
    console.log(chalk.gray(`... and ${pending.length - 20} more\n`));
  }

  // Category breakdown
  const tba = pending.filter(m => m.Slug.includes('-tba'));
  const upcoming = pending.filter(m => !m.Slug.includes('-tba') && (!m.ReleaseYear || parseInt(m.ReleaseYear) >= 2025));
  const released = pending.filter(m => !m.Slug.includes('-tba') && m.ReleaseYear && parseInt(m.ReleaseYear) < 2025);

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                        BREAKDOWN                                       '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.yellow(`⏳ TBA/Unreleased: ${tba.length}`));
  console.log(chalk.blue(`🔜 Upcoming (2025+): ${upcoming.length}`));
  console.log(chalk.red(`🎬 Released (Before 2025): ${released.length}`));
  console.log(chalk.green(`✅ Already Filled: ${filled.length}\n`));

  console.log(chalk.cyan('📄 Exported file: movies-telugu-titles-PENDING.csv'));
  console.log(chalk.green('✅ Audit complete!\n'));
}

auditPending().catch(console.error);
