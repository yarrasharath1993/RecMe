#!/usr/bin/env npx tsx
/**
 * Generate Manual Review Lists
 * 
 * Consolidates all audit reports into prioritized, actionable lists
 * for human review.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const records: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const record: any = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    records.push(record);
  }
  
  return records;
}

interface ReviewItem {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  movieId?: string;
  title: string;
  year?: string;
  issue: string;
  details: string;
  actionNeeded: string;
}

function parseFuzzyDuplicates(csvPath: string): ReviewItem[] {
  if (!fs.existsSync(csvPath)) return [];
  
  const content = fs.readFileSync(csvPath, 'utf8');
  const records = parseCSV(content);
  
  return records.map((r: any) => ({
    category: 'Fuzzy Duplicates',
    priority: parseFloat(r.TitleSimilarity) > 0.95 ? 'high' : 'medium',
    title: `${r.Movie1_Title} vs ${r.Movie2_Title}`,
    year: r.Movie1_Year,
    issue: 'Potential duplicate',
    details: `${r.TitleSimilarity}% title similarity, ${r.LikelyReason}`,
    actionNeeded: 'Review and merge if same movie, or mark as distinct',
  }));
}

function parseSuspiciousEntries(csvPath: string): ReviewItem[] {
  if (!fs.existsSync(csvPath)) return [];
  
  const content = fs.readFileSync(csvPath, 'utf8');
  const records = parseCSV(content);
  
  // Only include entries that need manual review
  return records
    .filter((r: any) => r.Severity === 'critical' || r.Severity === 'high')
    .filter((r: any) => !r.MovieID.includes('deleted')) // Exclude already deleted
    .map((r: any) => ({
      category: 'Data Quality',
      priority: r.Severity as 'critical' | 'high',
      movieId: r.MovieID,
      title: r.Title,
      year: r.Year,
      issue: r.IssueType,
      details: r.Details,
      actionNeeded: 'Research and fix missing fields or delete if invalid',
    }))
    .slice(0, 100); // Limit to top 100
}

function parseAttributionIssues(csvPath: string): ReviewItem[] {
  if (!fs.existsSync(csvPath)) return [];
  
  const content = fs.readFileSync(csvPath, 'utf8');
  const records = parseCSV(content);
  
  // Only unfixed issues
  return records
    .filter((r: any) => r.Issue !== 'fixed')
    .map((r: any) => ({
      category: 'Attribution Issues',
      priority: 'high',
      movieId: r.MovieID,
      title: r.Title,
      year: r.Year,
      issue: r.Reason,
      details: r.Reason,
      actionNeeded: 'Verify cast/crew attribution from reliable sources',
    }));
}

function generateMarkdownReport(items: ReviewItem[], outputPath: string) {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ReviewItem[]>);
  
  let markdown = `# Manual Review List\n\n`;
  markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
  markdown += `This document contains items flagged during the database audit that require human review.\n\n`;
  markdown += `---\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `| Category | Count | Priority Breakdown |\n`;
  markdown += `|----------|-------|-------------------|\n`;
  
  for (const [category, categoryItems] of Object.entries(grouped)) {
    const counts = {
      critical: categoryItems.filter(i => i.priority === 'critical').length,
      high: categoryItems.filter(i => i.priority === 'high').length,
      medium: categoryItems.filter(i => i.priority === 'medium').length,
      low: categoryItems.filter(i => i.priority === 'low').length,
    };
    const breakdown = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([pri, count]) => `${count} ${pri}`)
      .join(', ');
    markdown += `| ${category} | ${categoryItems.length} | ${breakdown} |\n`;
  }
  
  markdown += `\n**Total Items**: ${items.length}\n\n`;
  markdown += `---\n\n`;
  
  // Detail sections
  for (const [category, categoryItems] of Object.entries(grouped)) {
    markdown += `## ${category}\n\n`;
    
    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = categoryItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    for (const item of sorted) {
      const priorityEmoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      };
      
      markdown += `### ${priorityEmoji[item.priority]} ${item.title} (${item.year || 'N/A'})\n\n`;
      markdown += `- **Priority**: ${item.priority.toUpperCase()}\n`;
      if (item.movieId) markdown += `- **Movie ID**: \`${item.movieId}\`\n`;
      markdown += `- **Issue**: ${item.issue}\n`;
      markdown += `- **Details**: ${item.details}\n`;
      markdown += `- **Action Needed**: ${item.actionNeeded}\n\n`;
    }
    
    markdown += `---\n\n`;
  }
  
  fs.writeFileSync(outputPath, markdown, 'utf8');
}

function generateCSVReport(items: ReviewItem[], outputPath: string) {
  const headers = ['Category', 'Priority', 'MovieID', 'Title', 'Year', 'Issue', 'Details', 'ActionNeeded'];
  const rows = items.map(item => [
    item.category,
    item.priority,
    item.movieId || '',
    item.title,
    item.year || '',
    item.issue,
    item.details,
    item.actionNeeded,
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','))
  ].join('\n');
  
  fs.writeFileSync(outputPath, csvContent, 'utf8');
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string, defaultValue: string = '') => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };
  
  const reportDir = getArg('report-dir', path.join(process.cwd(), 'docs', 'audit-reports', 'full-database'));
  const outputMd = getArg('output-md', path.join(reportDir, 'MANUAL-REVIEW-LIST.md'));
  const outputCsv = getArg('output-csv', path.join(reportDir, 'manual-review-list.csv'));
  
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            GENERATE MANUAL REVIEW LISTS                              ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));
  
  console.log(`  Report directory: ${reportDir}\n`);
  
  const allItems: ReviewItem[] = [];
  
  // Parse fuzzy duplicates
  console.log(chalk.cyan('📋 Parsing fuzzy duplicates...'));
  const fuzzyDupsPath = path.join(reportDir, 'fuzzy-duplicates.csv');
  const fuzzyDups = parseFuzzyDuplicates(fuzzyDupsPath);
  allItems.push(...fuzzyDups);
  console.log(chalk.gray(`   Found ${fuzzyDups.length} fuzzy duplicate pairs`));
  
  // Parse suspicious entries
  console.log(chalk.cyan('📋 Parsing suspicious entries...'));
  const suspiciousPath = path.join(reportDir, 'suspicious-entries.csv');
  const suspicious = parseSuspiciousEntries(suspiciousPath);
  allItems.push(...suspicious);
  console.log(chalk.gray(`   Found ${suspicious.length} critical/high priority issues`));
  
  // Parse attribution issues
  console.log(chalk.cyan('📋 Parsing attribution issues...'));
  const attributionPath = path.join(reportDir, 'wrong-cast-attribution.csv');
  const attribution = parseAttributionIssues(attributionPath);
  allItems.push(...attribution);
  console.log(chalk.gray(`   Found ${attribution.length} unfixed attribution issues\n`));
  
  console.log(chalk.green(`✅ Total items for manual review: ${allItems.length}\n`));
  
  // Generate reports
  console.log(chalk.cyan('📝 Generating markdown report...'));
  generateMarkdownReport(allItems, outputMd);
  console.log(chalk.green(`   ✅ ${outputMd}`));
  
  console.log(chalk.cyan('📝 Generating CSV report...'));
  generateCSVReport(allItems, outputCsv);
  console.log(chalk.green(`   ✅ ${outputCsv}\n`));
  
  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            COMPLETE!                                                 ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));
}

main().catch(console.error);
