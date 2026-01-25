#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

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

async function auditFinal7Movies() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║          AUDITING FINAL 7 MOVIES (INVALID ENTRIES)                   ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const mainContent = readFileSync(CSV_FILE, 'utf-8');
  const allMovies = parseCsv(mainContent);
  
  // Find movies without valid Telugu titles (empty or "-")
  const remaining = allMovies.filter(m => 
    !m['Title (Telugu - FILL THIS)'] || 
    m['Title (Telugu - FILL THIS)'].trim().length === 0 || 
    m['Title (Telugu - FILL THIS)'] === '-'
  );

  const filled = allMovies.length - remaining.length;
  const total = allMovies.length;

  console.log(chalk.green(`✓ Total movies: ${total}`));
  console.log(chalk.green(`✓ With Telugu titles: ${filled} (${Math.round(filled/total*100)}%)`));
  console.log(chalk.yellow(`⚠ Invalid/Missing: ${remaining.length}\n`));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('              REMAINING 7 INVALID ENTRIES                              '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  remaining.forEach((movie, index) => {
    const isInvalid = movie['Title (English)'].includes('Invalid') || 
                      movie['Title (English)'].includes('TBA') ||
                      movie['Title (English)'].includes('RAPO') ||
                      movie.Hero === '-' ||
                      movie.Director === '-';
    
    const statusColor = isInvalid ? chalk.red : chalk.yellow;
    const statusEmoji = isInvalid ? '❌' : '⚠️';
    
    console.log(statusColor(`${statusEmoji} ${index + 1}. ${movie['Title (English)']} (${movie.Slug})`));
    console.log(chalk.gray(`   Year: ${movie['Release Year']}`));
    console.log(chalk.gray(`   Hero: ${movie.Hero || 'N/A'}`));
    console.log(chalk.gray(`   Heroine: ${movie.Heroine || 'N/A'}`));
    console.log(chalk.gray(`   Director: ${movie.Director || 'N/A'}`));
    console.log(chalk.gray(`   Telugu Title: ${movie['Title (Telugu - FILL THIS)'] || 'EMPTY'}`));
    
    if (isInvalid) {
      console.log(chalk.red.bold('   → RECOMMENDATION: REMOVE (Invalid Entry)'));
    } else {
      console.log(chalk.yellow.bold('   → RECOMMENDATION: NEEDS REVIEW'));
    }
    console.log('');
  });

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('              CATEGORIZATION                                           '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const invalid = remaining.filter(m => 
    m['Title (English)'].includes('Invalid') || 
    m['Title (English)'].includes('TBA') ||
    m['Title (English)'].includes('RAPO') ||
    m.Hero === '-' ||
    m.Director === '-'
  );

  const needsReview = remaining.filter(m => 
    !m['Title (English)'].includes('Invalid') && 
    !m['Title (English)'].includes('TBA') &&
    !m['Title (English)'].includes('RAPO') &&
    m.Hero !== '-' &&
    m.Director !== '-'
  );

  console.log(chalk.red(`❌ INVALID/SHOULD REMOVE: ${invalid.length} movies`));
  invalid.forEach(m => {
    console.log(chalk.gray(`   • ${m['Title (English)']} (${m.Slug})`));
  });
  console.log('');

  console.log(chalk.yellow(`⚠️ NEEDS REVIEW: ${needsReview.length} movies`));
  needsReview.forEach(m => {
    console.log(chalk.gray(`   • ${m['Title (English)']} (${m.Slug})`));
  });
  console.log('');

  // Generate summary CSV
  const summaryLines = ['Category,Slug,Title (English),Release Year,Reason,Recommendation'];
  
  invalid.forEach(m => {
    let reason = 'Invalid project';
    if (m['Title (English)'].includes('Invalid')) reason = 'Marked as Invalid';
    if (m['Title (English)'].includes('TBA')) reason = 'TBA/Working title only';
    if (m.Hero === '-') reason = 'No valid cast data';
    
    summaryLines.push([
      'INVALID',
      m.Slug,
      `"${m['Title (English)'].replace(/"/g, '""')}"`,
      m['Release Year'],
      reason,
      'REMOVE'
    ].join(','));
  });

  needsReview.forEach(m => {
    summaryLines.push([
      'REVIEW',
      m.Slug,
      `"${m['Title (English)'].replace(/"/g, '""')}"`,
      m['Release Year'],
      'May be valid',
      'MANUAL REVIEW'
    ].join(','));
  });

  const summaryFile = 'FINAL-7-MOVIES-REVIEW-2026-01-15.csv';
  writeFileSync(summaryFile, summaryLines.join('\n'));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('              RECOMMENDATION                                           '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.yellow('📋 OPTION 1: Remove all invalid entries'));
  console.log(chalk.white(`   • Removes ${invalid.length} invalid movies`));
  console.log(chalk.white(`   • Final count: ${total - invalid.length} movies`));
  console.log(chalk.white(`   • Achievement: TRUE 100% (${filled}/${total - invalid.length})`));
  console.log(chalk.green.bold('   ✅ RECOMMENDED\n'));

  console.log(chalk.yellow('📋 OPTION 2: Keep marked as invalid'));
  console.log(chalk.white(`   • Keeps all ${remaining.length} entries`));
  console.log(chalk.white(`   • Final count: ${total} movies`));
  console.log(chalk.white(`   • Achievement: 99% (${filled}/${total})`));
  console.log(chalk.gray('   ⚪ Not recommended\n'));

  console.log(chalk.yellow('📋 OPTION 3: Manual review for valid ones'));
  console.log(chalk.white(`   • Review ${needsReview.length} potential movies`));
  console.log(chalk.white(`   • Remove ${invalid.length} confirmed invalid`));
  console.log(chalk.white(`   • Add Telugu titles to valid ones`));
  console.log(chalk.blue('   🔵 Most thorough\n'));

  console.log(chalk.green(`✅ Summary exported: ${summaryFile}\n`));

  console.log(chalk.magenta.bold('🎯 FINAL STATISTICS:\n'));
  console.log(chalk.white(`   Current: ${filled}/${total} (99%)`));
  console.log(chalk.white(`   After Option 1: ${filled}/${total - invalid.length} (${Math.round(filled/(total-invalid.length)*100)}%)`));
  console.log(chalk.white(`   After Option 2: ${filled}/${total} (${Math.round(filled/total*100)}%)`));
  console.log(chalk.white(`   After Option 3: ${filled + needsReview.length}/${total - invalid.length} (${Math.round((filled + needsReview.length)/(total-invalid.length)*100)}%)\n`));
}

auditFinal7Movies().catch(console.error);
