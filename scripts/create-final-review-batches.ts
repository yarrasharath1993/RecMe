#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
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
  const lines = ['Slug\tTitle (English)\tTitle (Telugu)\tRelease Year\tHero\tHeroine\tDirector'];
  
  for (const row of rows) {
    const values = [
      row.Slug,
      row.TitleEn,
      row.TitleTe || '',
      row.ReleaseYear,
      row.Hero,
      row.Heroine,
      row.Director,
    ];
    lines.push(values.join('\t'));
  }
  
  return lines.join('\n');
}

async function createFinalReviewBatches() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║          CREATING FINAL REVIEW BATCHES (23-28)                      ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const mainContent = readFileSync(MAIN_CSV, 'utf-8');
  const allMovies = parseCSV(mainContent);
  
  const remainingMovies = allMovies.filter(m => !m.TitleTe || m.TitleTe.trim().length === 0);
  
  console.log(chalk.green(`✓ Found ${remainingMovies.length} movies without Telugu titles\n`));

  // Group by year
  const by2021 = remainingMovies.filter(m => m.ReleaseYear === '2021');
  const by2018 = remainingMovies.filter(m => m.ReleaseYear === '2018');
  const by2019 = remainingMovies.filter(m => m.ReleaseYear === '2019');
  const by2020 = remainingMovies.filter(m => m.ReleaseYear === '2020');
  const by2022 = remainingMovies.filter(m => m.ReleaseYear === '2022');
  const by2023 = remainingMovies.filter(m => m.ReleaseYear === '2023');
  const by2025 = remainingMovies.filter(m => m.ReleaseYear === '2025');
  const by2026 = remainingMovies.filter(m => m.ReleaseYear === '2026');

  console.log(chalk.yellow('📊 Distribution:'));
  console.log(chalk.white(`   2021: ${by2021.length} movies`));
  console.log(chalk.white(`   2018: ${by2018.length} movies`));
  console.log(chalk.white(`   2019: ${by2019.length} movies`));
  console.log(chalk.white(`   2020: ${by2020.length} movies`));
  console.log(chalk.white(`   2022: ${by2022.length} movies`));
  console.log(chalk.white(`   2023: ${by2023.length} movies`));
  console.log(chalk.white(`   2025: ${by2025.length} movies`));
  console.log(chalk.white(`   2026: ${by2026.length} movies\n`));

  const batches = [
    {
      number: 23,
      name: '2021-COMPLETE',
      priority: 'HIGH',
      movies: by2021,
      description: 'Complete 2021 - Final 28 movies to reach 100%'
    },
    {
      number: 24,
      name: '2018-COMPLETE',
      priority: 'HIGH',
      movies: by2018,
      description: 'Complete 2018 - All remaining 34 movies'
    },
    {
      number: 25,
      name: '2019-PART-1',
      priority: 'HIGH',
      movies: by2019.slice(0, 30),
      description: '2019 Part 1 - First 30 of 40 movies'
    },
    {
      number: 26,
      name: '2019-PART-2-PLUS-2020',
      priority: 'MEDIUM',
      movies: [...by2019.slice(30), ...by2020],
      description: '2019 Part 2 (10 movies) + Complete 2020 (5 movies)'
    },
    {
      number: 27,
      name: '2022-2023-2026-MIXED',
      priority: 'MEDIUM',
      movies: [...by2022, ...by2023, ...by2026],
      description: 'Mixed Years - 2022 (7) + 2023 (2) + 2026 (3)'
    },
    {
      number: 28,
      name: '2025-UPCOMING',
      priority: 'LOW',
      movies: by2025,
      description: '2025 Upcoming - TBA releases (27 movies)'
    }
  ];

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   CREATING BATCH FILES                                '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const summaryLines: string[] = [];
  summaryLines.push('# FINAL REVIEW BATCHES - MANUAL FILLING GUIDE\n');
  summaryLines.push('## Overview\n');
  summaryLines.push(`- **Total Remaining:** 146 movies (15%)`);
  summaryLines.push(`- **Batches Created:** 6 batches (Batch 23-28)`);
  summaryLines.push(`- **Current Progress:** 853/999 (85%)\n`);
  summaryLines.push('---\n');
  summaryLines.push('## Batch Details\n');

  for (const batch of batches) {
    const filename = `batch-${batch.number}-${batch.name}.csv`;
    const filepath = join(BATCH_DIR, filename);
    
    const priorityColor = batch.priority === 'HIGH' ? chalk.red : 
                         batch.priority === 'MEDIUM' ? chalk.yellow : 
                         chalk.gray;
    
    const priorityEmoji = batch.priority === 'HIGH' ? '🔥' : 
                          batch.priority === 'MEDIUM' ? '🟡' : 
                          '⚪';
    
    console.log(priorityEmoji + ' ' + priorityColor.bold(`Batch ${batch.number}: ${batch.name}`));
    console.log(chalk.white(`   Priority: ${batch.priority}`));
    console.log(chalk.white(`   Movies: ${batch.movies.length}`));
    console.log(chalk.white(`   Description: ${batch.description}`));
    console.log(chalk.cyan(`   File: ${filename}\n`));

    summaryLines.push(`### Batch ${batch.number}: ${batch.name}\n`);
    summaryLines.push(`- **Priority:** ${priorityEmoji} ${batch.priority}`);
    summaryLines.push(`- **Movies:** ${batch.movies.length}`);
    summaryLines.push(`- **Description:** ${batch.description}`);
    summaryLines.push(`- **File:** \`${filename}\`\n`);

    // Show first 5 movies
    summaryLines.push('**Sample movies:**\n');
    for (let i = 0; i < Math.min(5, batch.movies.length); i++) {
      const movie = batch.movies[i];
      summaryLines.push(`${i + 1}. ${movie.TitleEn} (${movie.ReleaseYear}) - ${movie.Hero}`);
    }
    if (batch.movies.length > 5) {
      summaryLines.push(`... and ${batch.movies.length - 5} more\n`);
    }
    summaryLines.push('');

    const csvContent = stringifyCSV(batch.movies);
    writeFileSync(filepath, csvContent);
  }

  summaryLines.push('---\n');
  summaryLines.push('## Priority Order\n');
  summaryLines.push('### 🔥 HIGH PRIORITY (First 3 batches - 92 movies)\n');
  summaryLines.push('1. **Batch 23:** 2021 Complete (28 movies)');
  summaryLines.push('2. **Batch 24:** 2018 Complete (34 movies)');
  summaryLines.push('3. **Batch 25:** 2019 Part 1 (30 movies)\n');
  summaryLines.push('### 🟡 MEDIUM PRIORITY (Next 2 batches - 27 movies)\n');
  summaryLines.push('4. **Batch 26:** 2019 Part 2 + 2020 (15 movies)');
  summaryLines.push('5. **Batch 27:** 2022 + 2023 + 2026 Mixed (12 movies)\n');
  summaryLines.push('### ⚪ LOW PRIORITY (Last batch - 27 movies)\n');
  summaryLines.push('6. **Batch 28:** 2025 Upcoming (27 movies - many TBA)\n');
  summaryLines.push('---\n');
  summaryLines.push('## Instructions\n');
  summaryLines.push('1. Open each batch CSV file in a spreadsheet editor');
  summaryLines.push('2. Fill the "Title (Telugu)" column with Telugu titles');
  summaryLines.push('3. Correct any Hero/Heroine/Director errors you find');
  summaryLines.push('4. Save and provide the completed batch back for import');
  summaryLines.push('5. Focus on HIGH PRIORITY batches first (23-25)\n');
  summaryLines.push('---\n');
  summaryLines.push('## Progress Tracking\n');
  summaryLines.push('- [ ] Batch 23: 2021 Complete (28 movies)');
  summaryLines.push('- [ ] Batch 24: 2018 Complete (34 movies)');
  summaryLines.push('- [ ] Batch 25: 2019 Part 1 (30 movies)');
  summaryLines.push('- [ ] Batch 26: 2019 Part 2 + 2020 (15 movies)');
  summaryLines.push('- [ ] Batch 27: 2022 + 2023 + 2026 Mixed (12 movies)');
  summaryLines.push('- [ ] Batch 28: 2025 Upcoming (27 movies)\n');
  summaryLines.push('---\n');
  summaryLines.push('## Expected Completion\n');
  summaryLines.push('After completing all 6 batches:');
  summaryLines.push('- **Total filled:** 999/999 (100%)');
  summaryLines.push('- **High Priority:** Will reach 92% (92 movies)');
  summaryLines.push('- **All Batches:** Will reach 100% (146 movies)\n');

  const guideFilename = 'FINAL-REVIEW-BATCHES-GUIDE-2026-01-15.md';
  writeFileSync(guideFilename, summaryLines.join('\n'));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   SUMMARY                                             '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Created 6 batch files in ${BATCH_DIR}/`));
  console.log(chalk.green(`✅ Created guide: ${guideFilename}\n`));

  console.log(chalk.yellow('📋 Batch Files Created:\n'));
  for (const batch of batches) {
    const filename = `batch-${batch.number}-${batch.name}.csv`;
    const priorityEmoji = batch.priority === 'HIGH' ? '🔥' : 
                          batch.priority === 'MEDIUM' ? '🟡' : 
                          '⚪';
    console.log(chalk.cyan(`   ${priorityEmoji} ${filename} (${batch.movies.length} movies)`));
  }
  console.log('');

  console.log(chalk.cyan.bold('📊 Progress After Completion:\n'));
  console.log(chalk.white('   Current:  853/999 (85%)'));
  console.log(chalk.white('   After B23-25: 945/999 (95%) - HIGH PRIORITY'));
  console.log(chalk.white('   After B26-27: 972/999 (97%) - MEDIUM PRIORITY'));
  console.log(chalk.green.bold('   After B28: 999/999 (100%) ✨ COMPLETE!\n'));

  console.log(chalk.green.bold('🎉 ALL BATCH FILES CREATED!\n'));
  console.log(chalk.yellow('📝 Next Steps:'));
  console.log(chalk.white('   1. Review the guide file'));
  console.log(chalk.white('   2. Start with HIGH PRIORITY batches (23-25)'));
  console.log(chalk.white('   3. Fill Telugu titles in each batch'));
  console.log(chalk.white('   4. Return completed batches for import\n'));
}

createFinalReviewBatches().catch(console.error);
