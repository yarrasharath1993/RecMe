#!/usr/bin/env npx tsx
/**
 * Generate Complete Deletion Log
 * 
 * Compiles all movies deleted during today's data quality fixes
 */

import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

interface DeletedMovie {
  title: string;
  year: number;
  slug: string;
  reason: string;
  batch: string;
  restored?: boolean;
}

const DELETED_MOVIES: DeletedMovie[] = [
  // BATCH 1: Non-Movie Entries (Incomplete Data Phase 1)
  {
    title: 'Padma Vibhushan',
    year: 2011,
    slug: 'padma-vibhushan-2011',
    reason: 'Award show/TV show - not a movie',
    batch: 'Incomplete Data Cleanup',
  },
  {
    title: 'Best Supporting Actress - Tamil',
    year: 2002,
    slug: 'best-supporting-actress-tamil-2002',
    reason: 'Award category - not a movie',
    batch: 'Incomplete Data Cleanup',
  },
  {
    title: 'National Film Awards',
    year: 2003,
    slug: 'national-film-awards-2003',
    reason: 'Award ceremony - not a movie',
    batch: 'Incomplete Data Cleanup',
  },
  {
    title: 'Best Actress - Tamil',
    year: 2001,
    slug: 'best-actress-tamil-2001',
    reason: 'Award category - not a movie',
    batch: 'Incomplete Data Cleanup',
  },
  {
    title: 'Best Actress – Kannada',
    year: 2004,
    slug: 'best-actress-kannada-2004',
    reason: 'Award category - not a movie',
    batch: 'Incomplete Data Cleanup',
  },
  {
    title: 'Indian Idol',
    year: 2021,
    slug: 'indian-idol-2021',
    reason: 'TV show - not a movie',
    batch: 'Incomplete Data Cleanup',
  },
  {
    title: 'Overall Contribution to Telugu Film Industry',
    year: 2007,
    slug: 'overall-contribution-to-telugu-film-industry-2007',
    reason: 'Award/Recognition - not a movie',
    batch: 'Incomplete Data Cleanup',
  },
  {
    title: 'Drama Juniors 4 Telugu',
    year: 2023,
    slug: 'drama-juniors-4-telugu-2023',
    reason: 'TV show - not a movie',
    batch: 'Incomplete Data Cleanup',
  },
  {
    title: 'The Kapil Sharma Show season 2',
    year: 2021,
    slug: 'the-kapil-sharma-show-season-2-2021',
    reason: 'TV show - not a movie',
    batch: 'Incomplete Data Cleanup',
  },
  
  // BATCH 2: Wrong Year Duplicates (Hero Attribution Fixes)
  {
    title: 'Moondram Pirai',
    year: 1981,
    slug: 'moondram-pirai-1981',
    reason: 'Wrong year duplicate - correct movie is 1982/1983',
    batch: 'Hero Attribution Fixes',
  },
  {
    title: 'Meendum Kokila',
    year: 1982,
    slug: 'meendum-kokila-1982',
    reason: 'Wrong year duplicate - correct movie is 1981',
    batch: 'Hero Attribution Fixes',
  },
  {
    title: 'Lamhe',
    year: 1992,
    slug: 'lamhe-1992',
    reason: 'Wrong year duplicate - correct movie is 1991',
    batch: 'Hero Attribution Fixes',
  },
  
  // BATCH 3: Spelling Variations & Duplicates
  {
    title: 'Aakasa Ramanna',
    year: 2010,
    slug: 'aakasa-ramanna-2010',
    reason: 'Initially thought duplicate, but RESTORED - different movie from 1965',
    batch: 'Duplicate Cleanup',
    restored: true,
  },
  {
    title: 'Akasha Ramanna',
    year: 1965,
    slug: 'akasha-ramanna-1965',
    reason: 'Spelling variation duplicate of Aakasa Ramanna (1965)',
    batch: 'Duplicate Cleanup',
  },
];

function generateMarkdownReport(): string {
  let md = `# Complete Deletion Log\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total Deleted:** ${DELETED_MOVIES.filter(m => !m.restored).length}\n`;
  md += `**Total Restored:** ${DELETED_MOVIES.filter(m => m.restored).length}\n`;
  md += `**Net Deletions:** ${DELETED_MOVIES.filter(m => !m.restored).length}\n\n`;
  
  md += `---\n\n`;
  
  // Group by batch
  const batches = [...new Set(DELETED_MOVIES.map(m => m.batch))];
  
  batches.forEach(batch => {
    const movies = DELETED_MOVIES.filter(m => m.batch === batch);
    const deleted = movies.filter(m => !m.restored).length;
    const restored = movies.filter(m => m.restored).length;
    
    md += `## ${batch}\n\n`;
    md += `**Deleted:** ${deleted} | **Restored:** ${restored}\n\n`;
    
    movies.forEach((movie, i) => {
      md += `### ${i + 1}. ${movie.title} (${movie.year})\n\n`;
      md += `- **Slug:** \`${movie.slug}\`\n`;
      md += `- **Reason:** ${movie.reason}\n`;
      if (movie.restored) {
        md += `- **Status:** ✅ **RESTORED** (user confirmed valid movie)\n`;
      } else {
        md += `- **Status:** ❌ Permanently Deleted\n`;
      }
      md += `\n`;
    });
    
    md += `---\n\n`;
  });
  
  return md;
}

function generateCSVReport(): string {
  let csv = 'Title,Year,Slug,Reason,Batch,Status\n';
  
  DELETED_MOVIES.forEach(movie => {
    csv += [
      `"${movie.title}"`,
      movie.year,
      `"${movie.slug}"`,
      `"${movie.reason}"`,
      `"${movie.batch}"`,
      movie.restored ? 'RESTORED' : 'DELETED',
    ].join(',') + '\n';
  });
  
  return csv;
}

function generateConsoleOutput() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║               COMPLETE DELETION LOG                                   ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('  📊 SUMMARY:\n'));
  console.log(chalk.red(`    Total Deleted: ${DELETED_MOVIES.filter(m => !m.restored).length}`));
  console.log(chalk.green(`    Total Restored: ${DELETED_MOVIES.filter(m => m.restored).length}`));
  console.log(chalk.blue(`    Net Deletions: ${DELETED_MOVIES.filter(m => !m.restored).length}\n`));

  const batches = [...new Set(DELETED_MOVIES.map(m => m.batch))];
  
  batches.forEach(batch => {
    const movies = DELETED_MOVIES.filter(m => m.batch === batch);
    const deleted = movies.filter(m => !m.restored).length;
    const restored = movies.filter(m => m.restored).length;
    
    console.log(chalk.blue.bold(`\n═══════════════════════════════════════════════════════════════════════`));
    console.log(chalk.cyan.bold(`  ${batch.toUpperCase()}`));
    console.log(chalk.blue.bold(`═══════════════════════════════════════════════════════════════════════\n`));
    
    console.log(chalk.yellow(`  Deleted: ${deleted} | Restored: ${restored}\n`));
    
    movies.forEach((movie, i) => {
      const status = movie.restored ? chalk.green('✅ RESTORED') : chalk.red('❌ DELETED');
      console.log(chalk.cyan(`  ${i + 1}. ${movie.title} (${movie.year})`));
      console.log(chalk.gray(`     Slug: ${movie.slug}`));
      console.log(chalk.gray(`     Reason: ${movie.reason}`));
      console.log(`     Status: ${status}\n`);
    });
  });

  console.log(chalk.blue.bold(`\n═══════════════════════════════════════════════════════════════════════\n`));
}

function main() {
  // Console output
  generateConsoleOutput();

  // Generate reports
  const mdPath = resolve(process.cwd(), 'docs/manual-review/COMPLETE-DELETION-LOG.md');
  const csvPath = resolve(process.cwd(), 'docs/manual-review/COMPLETE-DELETION-LOG.csv');
  
  writeFileSync(mdPath, generateMarkdownReport());
  writeFileSync(csvPath, generateCSVReport());

  console.log(chalk.green(`  ✅ Reports generated:\n`));
  console.log(chalk.gray(`     - docs/manual-review/COMPLETE-DELETION-LOG.md`));
  console.log(chalk.gray(`     - docs/manual-review/COMPLETE-DELETION-LOG.csv\n`));

  // Summary table
  console.log(chalk.cyan.bold('  📋 DELETION SUMMARY BY CATEGORY:\n'));
  console.log(chalk.gray('  ┌─────────────────────────────────────┬─────────┬──────────┐'));
  console.log(chalk.gray('  │ Category                            │ Deleted │ Restored │'));
  console.log(chalk.gray('  ├─────────────────────────────────────┼─────────┼──────────┤'));
  
  const batches = [...new Set(DELETED_MOVIES.map(m => m.batch))];
  batches.forEach(batch => {
    const movies = DELETED_MOVIES.filter(m => m.batch === batch);
    const deleted = movies.filter(m => !m.restored).length;
    const restored = movies.filter(m => m.restored).length;
    
    const paddedBatch = batch.padEnd(35);
    const paddedDeleted = deleted.toString().padStart(7);
    const paddedRestored = restored.toString().padStart(8);
    
    console.log(chalk.gray(`  │ ${paddedBatch} │${paddedDeleted} │${paddedRestored} │`));
  });
  
  console.log(chalk.gray('  ├─────────────────────────────────────┼─────────┼──────────┤'));
  
  const totalDeleted = DELETED_MOVIES.filter(m => !m.restored).length;
  const totalRestored = DELETED_MOVIES.filter(m => m.restored).length;
  
  console.log(chalk.gray(`  │ ${'TOTAL'.padEnd(35)} │${totalDeleted.toString().padStart(7)} │${totalRestored.toString().padStart(8)} │`));
  console.log(chalk.gray('  └─────────────────────────────────────┴─────────┴──────────┘\n'));
}

main();
