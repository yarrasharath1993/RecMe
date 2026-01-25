#!/usr/bin/env npx tsx
/**
 * Print Movies Needing Manual Review
 * 
 * Clean, formatted list of all movies requiring manual review
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

interface ReviewItem {
  category: string;
  title: string;
  year: string;
  issue: string;
  url: string;
}

function loadCSVFiles(): ReviewItem[] {
  const reviewDir = resolve(process.cwd(), 'docs/manual-review');
  const files = readdirSync(reviewDir).filter(f => f.endsWith('.csv'));
  
  const allItems: ReviewItem[] = [];
  
  for (const file of files) {
    const category = file.split('-batch-')[0].replace(/-/g, ' ');
    const csvPath = resolve(reviewDir, file);
    const content = readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.match(/"([^"]*)"/g)?.map(p => p.replace(/"/g, '')) || [];
      if (parts.length < 3) continue;
      
      let title = parts[1] || parts[0];
      let year = parts[2] || '';
      let issue = '';
      let url = '';
      
      // Extract issue and URL based on category
      if (category.includes('wrong hero')) {
        issue = 'Wrong hero attribution - needs TMDB research';
        url = parts[8] || '';
      } else if (category.includes('no tmdb')) {
        issue = 'Not in TMDB - needs Wikipedia/IMDb research';
        url = parts[6] || '';
      } else if (category.includes('incomplete')) {
        issue = `Missing: ${parts[3] || 'multiple fields'}`;
        url = parts[6] || '';
      } else if (category.includes('missing images')) {
        issue = 'Missing poster image';
        url = parts[5] || '';
      } else if (category.includes('duplicate')) {
        title = `${parts[1]} vs ${parts[3]}`;
        issue = 'Potential duplicate - compare and decide';
        url = parts[8] || '';
      }
      
      allItems.push({ category, title, year, issue, url });
    }
  }
  
  return allItems;
}

function printByCategory(items: ReviewItem[], category: string) {
  const filtered = items.filter(item => 
    item.category.toLowerCase().includes(category.toLowerCase())
  );
  
  if (filtered.length === 0) return;
  
  console.log(chalk.blue.bold(`\n${category.toUpperCase()} (${filtered.length} movies)`));
  console.log(chalk.gray('─'.repeat(80)));
  
  filtered.forEach((item, idx) => {
    console.log(chalk.cyan(`${idx + 1}. ${item.title} (${item.year})`));
    console.log(chalk.gray(`   Issue: ${item.issue}`));
    if (item.url) {
      console.log(chalk.gray(`   URL: ${item.url}`));
    }
    console.log();
  });
}

function printSimpleList(items: ReviewItem[]) {
  console.log(chalk.blue.bold('\nALL MOVIES NEEDING REVIEW'));
  console.log(chalk.gray('═'.repeat(80)));
  
  items.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.title} (${item.year}) - ${item.issue}`);
  });
  
  console.log(chalk.gray('\n═'.repeat(80)));
  console.log(chalk.cyan(`Total: ${items.length} movies\n`));
}

function printForSpreadsheet(items: ReviewItem[]) {
  console.log('\nTitle\tYear\tCategory\tIssue\tURL');
  items.forEach(item => {
    console.log(`${item.title}\t${item.year}\t${item.category}\t${item.issue}\t${item.url}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const format = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'detailed';
  const category = args.find(a => a.startsWith('--category='))?.split('=')[1];
  const priority = args.find(a => a.startsWith('--priority='))?.split('=')[1];

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         MOVIES NEEDING MANUAL REVIEW                                 ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  const items = loadCSVFiles();
  
  if (items.length === 0) {
    console.log(chalk.green('  ✅ No movies need manual review!\n'));
    return;
  }

  // Filter by priority if specified
  let filteredItems = items;
  if (priority === 'high') {
    filteredItems = items.filter(i => 
      i.category.includes('duplicate') || 
      i.category.includes('wrong hero')
    );
  } else if (priority === 'medium') {
    filteredItems = items.filter(i => 
      i.category.includes('no tmdb') || 
      i.category.includes('incomplete')
    );
  } else if (priority === 'low') {
    filteredItems = items.filter(i => i.category.includes('images'));
  }

  if (format === 'simple') {
    printSimpleList(filteredItems);
  } else if (format === 'tsv') {
    printForSpreadsheet(filteredItems);
  } else if (category) {
    printByCategory(filteredItems, category);
  } else {
    // Detailed format by category
    const categories = [
      { name: 'Potential Duplicates', key: 'duplicate', priority: 'HIGH ⚡' },
      { name: 'Wrong Hero Gender', key: 'wrong hero', priority: 'HIGH' },
      { name: 'No TMDB ID', key: 'no tmdb', priority: 'MEDIUM' },
      { name: 'Incomplete Data', key: 'incomplete', priority: 'MEDIUM' },
      { name: 'Missing Images', key: 'images', priority: 'LOW' },
    ];

    console.log(chalk.cyan(`  Total movies: ${items.length}\n`));

    for (const cat of categories) {
      const catItems = items.filter(i => i.category.toLowerCase().includes(cat.key));
      if (catItems.length === 0) continue;

      console.log(chalk.blue.bold(`\n${cat.name.toUpperCase()} - Priority: ${cat.priority}`));
      console.log(chalk.gray('─'.repeat(80)));

      catItems.forEach((item, idx) => {
        console.log(chalk.yellow(`${idx + 1}. ${item.title} (${item.year})`));
        console.log(chalk.gray(`   ${item.issue}`));
        console.log(chalk.gray(`   ${item.url}`));
        console.log();
      });
    }
  }

  // Summary
  console.log(chalk.blue.bold('\n' + '═'.repeat(80)));
  console.log(chalk.blue.bold('SUMMARY'));
  console.log(chalk.blue.bold('═'.repeat(80)));

  const byCategory = filteredItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(chalk.cyan(`  ${cat}: ${count} movies`));
  }

  console.log(chalk.cyan(`\n  Total: ${filteredItems.length} movies needing review\n`));

  // Next steps
  console.log(chalk.yellow('NEXT STEPS:'));
  console.log(chalk.gray('  1. Start with HIGH priority items (duplicates, wrong heroes)'));
  console.log(chalk.gray('  2. Research on Wikipedia/IMDb for missing data'));
  console.log(chalk.gray('  3. Use helper scripts for bulk updates'));
  console.log(chalk.gray('\nFormats:'));
  console.log(chalk.gray('  --format=simple     Clean list'));
  console.log(chalk.gray('  --format=tsv        Tab-separated (paste in Excel)'));
  console.log(chalk.gray('  --format=detailed   Full details (default)'));
  console.log(chalk.gray('  --category=<name>   Show specific category only'));
  console.log(chalk.gray('  --priority=<level>  Filter by priority (high/medium/low)\n'));
}

main().catch(console.error);
