#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CSV_FILE = 'movies-missing-telugu-titles-2026-01-14.csv';

interface MovieData {
  Slug: string;
  'Title (English)': string;
  'Title (Telugu - FILL THIS)': string;
  'Release Year': string;
  Hero: string;
  Heroine: string;
  Director: string;
}

function parseCsv(csvString: string): MovieData[] {
  const lines = csvString.split('\n');
  const movies: MovieData[] = [];

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
      movies.push({
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

  return movies;
}

async function analyzeMismatch() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         ANALYZE CSV vs DATABASE MISMATCH                             ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow('📋 Step 1: Loading CSV data...\n'));
  
  const csvContent = readFileSync(CSV_FILE, 'utf8');
  const csvMovies = parseCsv(csvContent);
  
  console.log(chalk.green(`✓ CSV contains ${csvMovies.length} movies\n`));

  console.log(chalk.yellow('📋 Step 2: Loading database data...\n'));

  const { data: dbMovies, error } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, hero, director')
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false });

  if (error) {
    console.error(chalk.red('❌ Error:'), error);
    return;
  }

  console.log(chalk.green(`✓ Database contains ${dbMovies?.length || 0} Telugu movies\n`));

  console.log(chalk.yellow('📋 Step 3: Analyzing overlap and differences...\n'));

  const csvSlugs = new Set(csvMovies.map(m => m.Slug));
  const dbSlugs = new Set(dbMovies?.map(m => m.slug) || []);

  const inBoth: string[] = [];
  const onlyInCsv: string[] = [];
  const onlyInDb: string[] = [];

  // Check CSV movies
  csvMovies.forEach(m => {
    if (dbSlugs.has(m.Slug)) {
      inBoth.push(m.Slug);
    } else {
      onlyInCsv.push(m.Slug);
    }
  });

  // Check DB movies
  dbMovies?.forEach(m => {
    if (!csvSlugs.has(m.slug)) {
      onlyInDb.push(m.slug);
    }
  });

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   OVERLAP ANALYSIS                                    '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ In BOTH CSV and Database: ${inBoth.length}`));
  console.log(chalk.yellow(`🔵 Only in CSV (not in DB): ${onlyInCsv.length}`));
  console.log(chalk.red(`🔴 Only in Database (not in CSV): ${onlyInDb.length}\n`));

  const csvPercent = Math.round((inBoth.length / csvMovies.length) * 100);
  const dbPercent = Math.round((inBoth.length / (dbMovies?.length || 1)) * 100);

  console.log(chalk.cyan('📊 Overlap Percentages:\n'));
  console.log(chalk.white(`   CSV movies in DB: ${inBoth.length}/${csvMovies.length} (${csvPercent}%)`));
  console.log(chalk.white(`   DB movies in CSV: ${inBoth.length}/${dbMovies?.length || 0} (${dbPercent}%)\n`));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   YEAR DISTRIBUTION                                   '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  // Analyze by year
  const csvByYear: Record<string, number> = {};
  const dbByYear: Record<string, number> = {};

  csvMovies.forEach(m => {
    const year = m['Release Year'] || 'Unknown';
    csvByYear[year] = (csvByYear[year] || 0) + 1;
  });

  dbMovies?.forEach(m => {
    const year = m.release_year?.toString() || 'Unknown';
    dbByYear[year] = (dbByYear[year] || 0) + 1;
  });

  const allYears = new Set([...Object.keys(csvByYear), ...Object.keys(dbByYear)]);
  const sortedYears = Array.from(allYears).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return 1;
    return parseInt(b) - parseInt(a);
  });

  console.log(chalk.yellow('📅 Movies by Year (CSV vs DB):\n'));
  console.log(chalk.gray('   Year  │  CSV  │  DB   │ Difference'));
  console.log(chalk.gray('   ──────┼───────┼───────┼───────────'));
  
  sortedYears.slice(0, 15).forEach(year => {
    const csv = csvByYear[year] || 0;
    const db = dbByYear[year] || 0;
    const diff = csv - db;
    const diffColor = diff > 0 ? chalk.green : diff < 0 ? chalk.red : chalk.gray;
    
    console.log(`   ${year.padEnd(6)}│ ${csv.toString().padStart(5)} │ ${db.toString().padStart(5)} │ ${diffColor(diff > 0 ? '+' + diff : diff.toString())}`);
  });
  console.log('');

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   SAMPLE COMPARISONS                                  '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green('✅ Sample movies in BOTH (first 10):\n'));
  inBoth.slice(0, 10).forEach(slug => {
    const csvMovie = csvMovies.find(m => m.Slug === slug);
    const dbMovie = dbMovies?.find(m => m.slug === slug);
    console.log(chalk.white(`   • ${csvMovie?.['Title (English)']} (${slug})`));
    console.log(chalk.gray(`     CSV: ${csvMovie?.['Release Year']} | DB: ${dbMovie?.release_year || 'N/A'}`));
  });
  console.log('');

  console.log(chalk.yellow('🔵 Sample movies ONLY in CSV (first 15):\n'));
  onlyInCsv.slice(0, 15).forEach(slug => {
    const movie = csvMovies.find(m => m.Slug === slug);
    console.log(chalk.white(`   • ${movie?.['Title (English)']} (${slug}) - ${movie?.['Release Year']}`));
  });
  console.log('');

  console.log(chalk.red('🔴 Sample movies ONLY in DATABASE (first 15):\n'));
  onlyInDb.slice(0, 15).forEach(slug => {
    const movie = dbMovies?.find(m => m.slug === slug);
    console.log(chalk.white(`   • ${movie?.title_en} (${slug}) - ${movie?.release_year || 'N/A'}`));
  });
  console.log('');

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   RECOMMENDATIONS                                     '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  if (onlyInCsv.length > 900) {
    console.log(chalk.red.bold('🚨 CRITICAL ISSUE: Your CSV and Database are COMPLETELY DIFFERENT!\n'));
    console.log(chalk.yellow('This suggests:\n'));
    console.log(chalk.white('   1. The CSV contains a curated/updated list of movies'));
    console.log(chalk.white('   2. The database contains old/different movie data'));
    console.log(chalk.white('   3. These are likely from different sources or time periods\n'));
    
    console.log(chalk.cyan.bold('🎯 RECOMMENDED ACTIONS:\n'));
    console.log(chalk.green('   Option 1: REPLACE database with CSV data (if CSV is authoritative)'));
    console.log(chalk.white('     → Delete old movies from DB'));
    console.log(chalk.white('     → Import all 995 movies from CSV\n'));
    
    console.log(chalk.yellow('   Option 2: MERGE both datasets'));
    console.log(chalk.white('     → Keep existing DB movies'));
    console.log(chalk.white('     → Add 930 new movies from CSV'));
    console.log(chalk.white('     → Result: ~1930 total movies\n'));
    
    console.log(chalk.blue('   Option 3: MANUAL REVIEW'));
    console.log(chalk.white('     → Review which movies should stay'));
    console.log(chalk.white('     → Selective import/deletion\n'));
  } else if (onlyInCsv.length > 100) {
    console.log(chalk.yellow.bold('⚠️  MODERATE ISSUE: Significant differences between CSV and DB\n'));
    console.log(chalk.white('Recommend reviewing the differences and deciding on merge strategy.\n'));
  } else {
    console.log(chalk.green.bold('✅ MINOR DIFFERENCES: Mostly aligned\n'));
    console.log(chalk.white('You can safely import the missing movies from CSV.\n'));
  }

  // Generate detailed report
  const reportLines: string[] = [];
  reportLines.push('# CSV vs DATABASE MISMATCH ANALYSIS');
  reportLines.push(`**Date:** ${new Date().toISOString().slice(0, 10)}\n`);
  reportLines.push('---\n');

  reportLines.push('## Summary\n');
  reportLines.push(`- **CSV Movies:** ${csvMovies.length}`);
  reportLines.push(`- **Database Movies:** ${dbMovies?.length || 0}`);
  reportLines.push(`- **In Both:** ${inBoth.length} (${csvPercent}% of CSV, ${dbPercent}% of DB)`);
  reportLines.push(`- **Only in CSV:** ${onlyInCsv.length}`);
  reportLines.push(`- **Only in DB:** ${onlyInDb.length}\n`);
  reportLines.push('---\n');

  reportLines.push('## Year Distribution\n');
  reportLines.push('| Year | CSV | DB | Difference |');
  reportLines.push('|------|-----|----|-----------:|');
  sortedYears.forEach(year => {
    const csv = csvByYear[year] || 0;
    const db = dbByYear[year] || 0;
    const diff = csv - db;
    reportLines.push(`| ${year} | ${csv} | ${db} | ${diff > 0 ? '+' : ''}${diff} |`);
  });
  reportLines.push('\n---\n');

  reportLines.push(`## Movies Only in CSV (${onlyInCsv.length})\n`);
  onlyInCsv.forEach(slug => {
    const movie = csvMovies.find(m => m.Slug === slug);
    reportLines.push(`- ${movie?.['Title (English)']} (\`${slug}\`) - ${movie?.['Release Year']}`);
  });
  reportLines.push('\n---\n');

  reportLines.push(`## Movies Only in Database (${onlyInDb.length})\n`);
  onlyInDb.forEach(slug => {
    const movie = dbMovies?.find(m => m.slug === slug);
    reportLines.push(`- ${movie?.title_en} (\`${slug}\`) - ${movie?.release_year || 'N/A'}`);
  });
  reportLines.push('\n---\n');

  const reportFile = 'CSV-DB-MISMATCH-ANALYSIS-2026-01-15.md';
  writeFileSync(reportFile, reportLines.join('\n'));
  console.log(chalk.green(`✅ Detailed report saved: ${reportFile}\n`));

  console.log(chalk.magenta.bold('🎊 ANALYSIS COMPLETE! 🎊\n'));
}

analyzeMismatch().catch(console.error);
