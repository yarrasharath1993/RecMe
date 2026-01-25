#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

const MAIN_CSV = 'movies-missing-telugu-titles-2026-01-14.csv';

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

async function auditRemainingMovies() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║              REMAINING MOVIES AUDIT REPORT                           ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const mainContent = readFileSync(MAIN_CSV, 'utf-8');
  const allMovies = parseCSV(mainContent);
  
  const remainingMovies = allMovies.filter(m => !m.TitleTe || m.TitleTe.trim().length === 0);
  
  console.log(chalk.green(`✓ Loaded ${allMovies.length} total movies\n`));
  console.log(chalk.yellow(`⏳ Found ${remainingMovies.length} movies without Telugu titles\n`));

  // Group by year
  const byYear = new Map<string, MovieRow[]>();
  remainingMovies.forEach(movie => {
    const year = movie.ReleaseYear || 'Unknown';
    if (!byYear.has(year)) {
      byYear.set(year, []);
    }
    byYear.get(year)!.push(movie);
  });

  // Sort years descending
  const sortedYears = Array.from(byYear.keys()).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(b) - parseInt(a);
  });

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   BREAKDOWN BY YEAR                                   '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const reportLines: string[] = [];
  reportLines.push('# REMAINING MOVIES REPORT - 2026-01-15\n');
  reportLines.push(`## Summary\n`);
  reportLines.push(`- **Total Movies:** ${allMovies.length}`);
  reportLines.push(`- **Completed:** ${allMovies.length - remainingMovies.length} (${Math.round((allMovies.length - remainingMovies.length) / allMovies.length * 100)}%)`);
  reportLines.push(`- **Remaining:** ${remainingMovies.length} (${Math.round(remainingMovies.length / allMovies.length * 100)}%)\n`);
  reportLines.push(`---\n`);
  reportLines.push(`## Breakdown by Year\n`);

  for (const year of sortedYears) {
    const movies = byYear.get(year)!;
    const percentage = Math.round((movies.length / remainingMovies.length) * 100);
    
    console.log(chalk.yellow(`📅 ${year}: ${movies.length} movies (${percentage}%)`));
    reportLines.push(`### ${year} (${movies.length} movies - ${percentage}%)\n`);
    
    // Show first 10 from each year
    const displayCount = Math.min(10, movies.length);
    for (let i = 0; i < displayCount; i++) {
      const movie = movies[i];
      console.log(chalk.gray(`   ${i + 1}. ${movie.TitleEn} (${movie.Slug})`));
      reportLines.push(`${i + 1}. **${movie.TitleEn}** (\`${movie.Slug}\`)`);
      reportLines.push(`   - Hero: ${movie.Hero || 'N/A'}`);
      reportLines.push(`   - Heroine: ${movie.Heroine || 'N/A'}`);
      reportLines.push(`   - Director: ${movie.Director || 'N/A'}\n`);
    }
    
    if (movies.length > displayCount) {
      console.log(chalk.gray(`   ... and ${movies.length - displayCount} more\n`));
      reportLines.push(`   ... and ${movies.length - displayCount} more\n`);
    } else {
      console.log('');
      reportLines.push('');
    }
  }

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   TOP CATEGORIES                                      '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  reportLines.push(`---\n`);
  reportLines.push(`## Categories Analysis\n`);

  // Category 1: Pre-2018 movies
  const pre2018 = remainingMovies.filter(m => {
    const year = parseInt(m.ReleaseYear);
    return !isNaN(year) && year < 2018;
  });

  console.log(chalk.yellow(`1️⃣  Pre-2018 Movies: ${pre2018.length}`));
  reportLines.push(`### 1. Pre-2018 Movies (${pre2018.length} movies)\n`);
  reportLines.push(`Classic and older releases that need validation.\n`);

  // Category 2: 2021 gaps
  const year2021 = remainingMovies.filter(m => m.ReleaseYear === '2021');
  console.log(chalk.yellow(`2️⃣  2021 Movies: ${year2021.length}`));
  reportLines.push(`### 2. 2021 Movies (${year2021.length} movies)\n`);
  reportLines.push(`Movies from batches 14-16 that weren't found in the main CSV.\n`);

  // Category 3: Upcoming (2025-2026)
  const upcoming = remainingMovies.filter(m => {
    const year = parseInt(m.ReleaseYear);
    return !isNaN(year) && year >= 2025;
  });
  console.log(chalk.yellow(`3️⃣  Upcoming (2025-2026): ${upcoming.length}`));
  reportLines.push(`### 3. Upcoming Movies 2025-2026 (${upcoming.length} movies)\n`);
  reportLines.push(`TBA and unreleased titles.\n`);

  // Category 4: Unknown/TBA year
  const unknownYear = remainingMovies.filter(m => !m.ReleaseYear || m.ReleaseYear === 'Unknown' || m.ReleaseYear.toLowerCase().includes('tba'));
  console.log(chalk.yellow(`4️⃣  Unknown Year: ${unknownYear.length}\n`));
  reportLines.push(`### 4. Unknown Year (${unknownYear.length} movies)\n`);
  reportLines.push(`Movies without clear release year information.\n`);

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   PRIORITY RECOMMENDATIONS                            '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  reportLines.push(`---\n`);
  reportLines.push(`## Priority Recommendations\n`);

  console.log(chalk.green('🔥 HIGH PRIORITY (Focus First):'));
  console.log(chalk.white('   • 2021 movies (23 movies) - Complete recent years'));
  console.log(chalk.white('   • Pre-2018 major releases - Classic important films\n'));
  
  reportLines.push(`### 🔥 HIGH PRIORITY\n`);
  reportLines.push(`1. **2021 Movies (${year2021.length})** - Complete recent years`);
  reportLines.push(`2. **Pre-2018 Major Releases** - Classic important films\n`);

  console.log(chalk.yellow('🟡 MEDIUM PRIORITY:'));
  console.log(chalk.white('   • 2025-2026 upcoming with confirmed details'));
  console.log(chalk.white('   • Pre-2018 mid-tier releases\n'));

  reportLines.push(`### 🟡 MEDIUM PRIORITY\n`);
  reportLines.push(`1. **2025-2026 Upcoming** (${upcoming.length}) - Confirmed releases`);
  reportLines.push(`2. **Pre-2018 Mid-Tier** - Secondary releases\n`);

  console.log(chalk.gray('⚪ LOW PRIORITY:'));
  console.log(chalk.white('   • Unknown year movies'));
  console.log(chalk.white('   • Distant TBA releases\n'));

  reportLines.push(`### ⚪ LOW PRIORITY\n`);
  reportLines.push(`1. **Unknown Year** (${unknownYear.length}) - Need research`);
  reportLines.push(`2. **Distant TBA** - Far future releases\n`);

  // Generate CSV for easy manual filling
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   GENERATING EXPORT FILES                             '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const csvLines = ['Slug,Title (English),Title (Telugu - FILL THIS),Release Year,Hero,Heroine,Director'];
  remainingMovies.forEach(movie => {
    csvLines.push([
      movie.Slug,
      `"${movie.TitleEn.replace(/"/g, '""')}"`,
      '',
      movie.ReleaseYear,
      `"${movie.Hero.replace(/"/g, '""')}"`,
      `"${movie.Heroine.replace(/"/g, '""')}"`,
      `"${movie.Director.replace(/"/g, '""')}"`,
    ].join(','));
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const csvFilename = `REMAINING-${remainingMovies.length}-movies-${timestamp}.csv`;
  const reportFilename = `REMAINING-MOVIES-REPORT-${timestamp}.md`;

  writeFileSync(csvFilename, csvLines.join('\n'));
  writeFileSync(reportFilename, reportLines.join('\n'));

  console.log(chalk.green(`✅ CSV Export: ${csvFilename}`));
  console.log(chalk.green(`✅ Report: ${reportFilename}\n`));

  reportLines.push(`---\n`);
  reportLines.push(`## Export Files\n`);
  reportLines.push(`- **CSV:** \`${csvFilename}\``);
  reportLines.push(`- **Report:** \`${reportFilename}\`\n`);

  // Overwrite report with full content
  writeFileSync(reportFilename, reportLines.join('\n'));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   FINAL STATISTICS                                    '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const completed = allMovies.length - remainingMovies.length;
  const completionPercentage = Math.round((completed / allMovies.length) * 100);

  console.log(chalk.green(`✅ Completed: ${completed}/${allMovies.length} (${completionPercentage}%)`));
  console.log(chalk.yellow(`⏳ Remaining: ${remainingMovies.length}/${allMovies.length} (${100 - completionPercentage}%)`));
  console.log(chalk.cyan(`📊 Progress: ${'█'.repeat(Math.floor(completionPercentage / 2))}${'░'.repeat(50 - Math.floor(completionPercentage / 2))} ${completionPercentage}%\n`));

  console.log(chalk.green.bold('🎉 AUDIT COMPLETE!\n'));
}

auditRemainingMovies().catch(console.error);
