#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

const CSV_FILE = 'movies-missing-telugu-titles-2026-01-14.csv';

interface MovieRow {
  Slug: string;
  'Title (English)': string;
  'Title (Telugu - FILL THIS)': string;
  'Release Year': string;
  Hero: string;
  Heroine: string;
  Director: string;
}

function parseCSV(content: string): MovieRow[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',');
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
        'Slug': values[0],
        'Title (English)': values[1].replace(/^"|"$/g, ''),
        'Title (Telugu - FILL THIS)': values[2],
        'Release Year': values[3],
        'Hero': values[4].replace(/^"|"$/g, ''),
        'Heroine': values[5].replace(/^"|"$/g, ''),
        'Director': values[6].replace(/^"|"$/g, ''),
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
      `"${row['Title (English)'].replace(/"/g, '""')}"`,
      row['Title (Telugu - FILL THIS)'],
      row['Release Year'],
      `"${row.Hero.replace(/"/g, '""')}"`,
      `"${row.Heroine.replace(/"/g, '""')}"`,
      `"${row.Director.replace(/"/g, '""')}"`,
    ];
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

// Director corrections
const directorCorrections: Record<string, string> = {
  'awe-2018': 'Prasanth Varma',
  'baby-2023': 'Sai Rajesh',
  'jack-2025': 'Bommarillu Bhaskar',
  'euphoria-tba': 'Gunasekhar',
  'maate-mantramu-tba': 'A. Bhimaneni',
  'aatagadharaa-siva-2018': 'Chandra Siddhartha',
};

// Hero corrections
const heroCorrections: Record<string, string> = {
  'kalki-2898-ad-2024': 'Prabhas',
  'kalki-2898-ad-part-2-tba': 'Prabhas',
  'baby-2023': 'Anand Deverakonda',
  'manu-2018': 'Raja Goutham',
};

// Heroine corrections
const heroineCorrections: Record<string, string> = {
  'kalki-2898-ad-2024': 'Deepika Padukone',
  'kalki-2898-ad-part-2-tba': 'Deepika Padukone',
  'devara-2-tba': 'Janhvi Kapoor',
  'maa-nanna-superhero-2024': 'Aarna',
  'baby-2023': 'Vaishnavi Chaitanya',
  'ugram-2023': 'Mirnaa Menon',
  'nene-mukyamantri-2019': 'Unknown',
  'manu-2018': 'Chandini Chowdary',
};

// Duplicate removal (Sharabha)
const duplicateSlugs = ['sharabha-2018']; // Keep sarabha-2018, remove this one

async function fixAnomalies() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         FIXING CSV ANOMALIES                                         ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  // Read CSV
  const csvContent = readFileSync(CSV_FILE, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(chalk.green(`✓ Loaded ${records.length} movies from CSV\n`));

  let directorFixed = 0;
  let heroFixed = 0;
  let heroineFixed = 0;
  let duplicatesRemoved = 0;

  // Apply corrections
  const correctedRecords = records.filter(row => {
    const slug = row.Slug;

    // Remove duplicates
    if (duplicateSlugs.includes(slug)) {
      duplicatesRemoved++;
      console.log(chalk.yellow(`🗑️  Removing duplicate: ${row['Title (English)']} (${slug})`));
      return false;
    }

    // Fix director
    if (directorCorrections[slug]) {
      console.log(chalk.cyan(`📝 Director fix: ${row['Title (English)']}`));
      console.log(chalk.gray(`   Before: ${row.Director}`));
      console.log(chalk.green(`   After:  ${directorCorrections[slug]}`));
      row.Director = directorCorrections[slug];
      directorFixed++;
    }

    // Fix hero
    if (heroCorrections[slug]) {
      console.log(chalk.cyan(`🎭 Hero fix: ${row['Title (English)']}`));
      console.log(chalk.gray(`   Before: ${row.Hero}`));
      console.log(chalk.green(`   After:  ${heroCorrections[slug]}`));
      row.Hero = heroCorrections[slug];
      heroFixed++;
    }

    // Fix heroine
    if (heroineCorrections[slug]) {
      console.log(chalk.cyan(`👸 Heroine fix: ${row['Title (English)']}`));
      console.log(chalk.gray(`   Before: ${row.Heroine}`));
      console.log(chalk.green(`   After:  ${heroineCorrections[slug]}`));
      row.Heroine = heroineCorrections[slug];
      heroineFixed++;
    }

    return true;
  });

  // Write corrected CSV
  const outputCsv = stringifyCSV(correctedRecords);

  const backupFile = CSV_FILE.replace('.csv', '-backup.csv');
  writeFileSync(backupFile, csvContent);
  writeFileSync(CSV_FILE, outputCsv);

  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                            SUMMARY                                      '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✓ Director corrections: ${directorFixed}`));
  console.log(chalk.green(`✓ Hero corrections: ${heroFixed}`));
  console.log(chalk.green(`✓ Heroine corrections: ${heroineFixed}`));
  console.log(chalk.green(`✓ Duplicates removed: ${duplicatesRemoved}`));
  console.log(chalk.green(`✓ Total movies after cleanup: ${correctedRecords.length}`));

  console.log(chalk.cyan(`\n📁 Backup saved: ${backupFile}`));
  console.log(chalk.green(`📁 Corrected CSV: ${CSV_FILE}\n`));

  // Show placeholder warnings
  console.log(chalk.yellow.bold('\n⚠️  PLACEHOLDER WARNINGS:\n'));
  
  const placeholders = correctedRecords.filter(row => 
    row.Slug.includes('aa22xa6') || 
    row.Slug.includes('dq-41') ||
    row['Title (English)'].includes('AA22xA6') ||
    row['Title (English)'].includes('DQ 41')
  );

  placeholders.forEach(row => {
    console.log(chalk.yellow(`   ${row['Title (English)']} (${row.Slug})`));
    console.log(chalk.gray(`   → This is a production placeholder, not a confirmed title\n`));
  });

  console.log(chalk.cyan('✅ All corrections applied successfully!\n'));
}

fixAnomalies().catch(console.error);
