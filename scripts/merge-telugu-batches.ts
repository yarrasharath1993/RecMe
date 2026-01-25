#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import chalk from 'chalk';

const MAIN_CSV = 'movies-missing-telugu-titles-2026-01-14.csv';
const BATCH_DIR = 'telugu-title-batches';

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

function stringifyCSV(rows: MovieRow[]): string {
  const lines = ['Slug,Title (English),Title (Telugu - FILL THIS),Release Year,Hero,Heroine,Director'];
  
  for (const row of rows) {
    const values = [
      row.Slug,
      `"${row.TitleEn.replace(/"/g, '""')}"`,
      row.TitleTe,
      row.ReleaseYear,
      `"${row.Hero.replace(/"/g, '""')}"`,
      `"${row.Heroine.replace(/"/g, '""')}"`,
      `"${row.Director.replace(/"/g, '""')}"`,
    ];
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

async function mergeBatches() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         MERGING TELUGU TITLE BATCHES                                 ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  // Read main CSV
  const mainContent = readFileSync(MAIN_CSV, 'utf-8');
  const mainRecords = parseCSV(mainContent);
  
  console.log(chalk.green(`✓ Loaded main CSV: ${mainRecords.length} movies\n`));

  // Create a map for quick lookup
  const movieMap = new Map<string, MovieRow>();
  mainRecords.forEach(movie => movieMap.set(movie.Slug, movie));

  // Read all batch files
  const batchFiles = readdirSync(BATCH_DIR)
    .filter(f => f.startsWith('batch-') && f.endsWith('.csv'))
    .sort();

  let updatedCount = 0;
  let batchesProcessed = 0;

  for (const batchFile of batchFiles) {
    const batchPath = `${BATCH_DIR}/${batchFile}`;
    const batchContent = readFileSync(batchPath, 'utf-8');
    const batchRecords = parseCSV(batchContent);

    let batchUpdates = 0;

    for (const batchMovie of batchRecords) {
      if (batchMovie.TitleTe && batchMovie.TitleTe.trim().length > 0) {
        const mainMovie = movieMap.get(batchMovie.Slug);
        if (mainMovie) {
          mainMovie.TitleTe = batchMovie.TitleTe;
          batchUpdates++;
          updatedCount++;
        }
      }
    }

    batchesProcessed++;
    if (batchUpdates > 0) {
      console.log(chalk.green(`✓ ${batchFile}: ${batchUpdates} titles merged`));
    } else {
      console.log(chalk.gray(`  ${batchFile}: No new titles`));
    }
  }

  // Write updated main CSV
  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch-merge.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  // Calculate statistics
  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                            SUMMARY                                      '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Batches processed: ${batchesProcessed}`));
  console.log(chalk.green(`✅ New titles merged: ${updatedCount}`));
  console.log(chalk.green(`✅ Total filled: ${filled}/${total} (${percentage}%)`));
  console.log(chalk.yellow(`⏳ Still pending: ${total - filled}\n`));

  // Progress bar
  const barLength = 50;
  const filledBars = Math.round((percentage / 100) * barLength);
  const emptyBars = barLength - filledBars;
  
  console.log(chalk.cyan('Overall Progress:'));
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(emptyBars)) + ` ${percentage}%\n`);

  console.log(chalk.cyan(`📁 Backup saved: ${backupFile}`));
  console.log(chalk.green(`📁 Updated CSV: ${MAIN_CSV}\n`));

  console.log(chalk.green('✅ Batches merged successfully!\n'));
}

mergeBatches().catch(console.error);
