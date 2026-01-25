#!/usr/bin/env npx tsx
/**
 * ANALYZE DATA QUALITY ISSUES
 * 
 * Creates actionable reports for manual review of all data quality issues:
 * - Critical missing fields (61 movies)
 * - Data inconsistencies (872 movies)
 * - Statistical outliers (27 movies)
 * 
 * Categorizes issues by fixability and provides recommendations
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MovieIssue {
  id: string;
  title_en: string;
  release_year?: number | null;
  issue_type: string;
  severity: string;
  details: string;
  missing_fields?: string[];
  recommendation: string;
  fixable: 'auto' | 'manual' | 'delete';
}

async function main() {
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            DATA QUALITY ANALYSIS                                     ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const csvPath = 'docs/audit-reports/suspicious-entries.csv';
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  const issues: MovieIssue[] = [];
  const categorized = {
    placeholder_titles: [] as MovieIssue[],
    incomplete_data: [] as MovieIssue[],
    future_releases: [] as MovieIssue[],
    missing_telugu_titles: [] as MovieIssue[],
    other: [] as MovieIssue[],
  };

  // Parse CSV
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 7) {
      const id = parts[0].trim();
      const title = parts[1].replace(/"/g, '').trim();
      const year = parts[2] ? parseInt(parts[2]) : null;
      const issue_type = parts[3].trim();
      const severity = parts[4].trim();
      const details = parts[5].replace(/"/g, '').trim();
      const missing_fields_str = parts[6].replace(/"/g, '').trim();
      const missing_fields = missing_fields_str ? missing_fields_str.split(';') : [];

      let recommendation = '';
      let fixable: 'auto' | 'manual' | 'delete' = 'manual';

      // Categorize
      if (title.length <= 5 && /^[A-Z0-9]+$/.test(title)) {
        // Placeholder titles like "AA22xA6", "VD14"
        recommendation = 'DELETE - Placeholder title, no real movie data';
        fixable = 'delete';
        categorized.placeholder_titles.push({
          id, title_en: title, release_year: year, issue_type, severity,
          details, missing_fields, recommendation, fixable
        });
      } else if (missing_fields.includes('release_year')) {
        // Missing year - check if upcoming or incomplete
        if (title.includes('Pushpa 3') || title.includes('Devara 2') || title.toLowerCase().includes('untitled')) {
          recommendation = 'UPDATE - Upcoming sequel, add year when announced';
          fixable = 'manual';
          categorized.future_releases.push({
            id, title_en: title, release_year: year, issue_type, severity,
            details, missing_fields, recommendation, fixable
          });
        } else {
          recommendation = 'RESEARCH - Find release year from TMDB/IMDb or delete';
          fixable = 'manual';
          categorized.incomplete_data.push({
            id, title_en: title, release_year: year, issue_type, severity,
            details, missing_fields, recommendation, fixable
          });
        }
      } else if (missing_fields.includes('title_te') && !missing_fields.includes('release_year')) {
        recommendation = 'UPDATE - Add Telugu title (use AI translation or TMDB)';
        fixable = 'manual';
        categorized.missing_telugu_titles.push({
          id, title_en: title, release_year: year, issue_type, severity,
          details, missing_fields, recommendation, fixable
        });
      } else {
        recommendation = 'REVIEW - Manual inspection needed';
        fixable = 'manual';
        categorized.other.push({
          id, title_en: title, release_year: year, issue_type, severity,
          details, missing_fields, recommendation, fixable
        });
      }
    }
  }

  // Generate reports
  console.log(chalk.magenta('📊 ANALYSIS SUMMARY\n'));
  console.log(chalk.yellow(`  Placeholder Titles (DELETE): ${categorized.placeholder_titles.length}`));
  console.log(chalk.blue(`  Future Releases (WATCH): ${categorized.future_releases.length}`));
  console.log(chalk.cyan(`  Missing Telugu Titles: ${categorized.missing_telugu_titles.length}`));
  console.log(chalk.gray(`  Incomplete Data (RESEARCH): ${categorized.incomplete_data.length}`));
  console.log(chalk.white(`  Other Issues: ${categorized.other.length}`));

  // Export for manual review
  const reportPath = 'docs/audit-reports/DATA-QUALITY-ACTION-PLAN.md';
  
  let report = `# Data Quality Issues - Action Plan

**Generated**: ${new Date().toISOString()}  
**Total Issues**: ${lines.length - 1}

---

## 🗑️ RECOMMENDED FOR DELETION (${categorized.placeholder_titles.length} movies)

These appear to be placeholder entries with no real movie data:

| ID | Title | Recommendation |
|----|-------|----------------|
`;

  for (const issue of categorized.placeholder_titles.slice(0, 20)) {
    report += `| \`${issue.id.substring(0, 8)}...\` | ${issue.title_en} | ${issue.recommendation} |\n`;
  }

  report += `\n**Action**: Run deletion script or manually remove these ${categorized.placeholder_titles.length} entries.\n\n---\n\n`;

  report += `## ⏳ UPCOMING RELEASES (${categorized.future_releases.length} movies)

These are announced sequels/movies without release dates yet:

| ID | Title | Missing Fields | Recommendation |
|----|-------|----------------|----------------|
`;

  for (const issue of categorized.future_releases) {
    report += `| \`${issue.id.substring(0, 8)}...\` | ${issue.title_en} | ${issue.missing_fields?.join(', ')} | ${issue.recommendation} |\n`;
  }

  report += `\n**Action**: Monitor for release date announcements and update.\n\n---\n\n`;

  report += `## 🔍 NEEDS RESEARCH (${categorized.incomplete_data.length} movies)

These movies have valid titles but missing critical data:

| ID | Title | Missing Fields | Recommendation |
|----|-------|----------------|----------------|
`;

  for (const issue of categorized.incomplete_data.slice(0, 30)) {
    report += `| \`${issue.id.substring(0, 8)}...\` | ${issue.title_en} | ${issue.missing_fields?.join(', ')} | ${issue.recommendation} |\n`;
  }

  report += `\n**Action**: Research on TMDB/IMDb to fill missing fields, or delete if not found.\n\n---\n\n`;

  report += `## 🇮🇳 MISSING TELUGU TITLES (${categorized.missing_telugu_titles.length} movies)

These movies need Telugu translations:

| ID | Title (English) | Year | Recommendation |
|----|-----------------|------|----------------|
`;

  for (const issue of categorized.missing_telugu_titles.slice(0, 20)) {
    report += `| \`${issue.id.substring(0, 8)}...\` | ${issue.title_en} | ${issue.release_year || 'N/A'} | ${issue.recommendation} |\n`;
  }

  report += `\n**Action**: Use AI translation service or TMDB API to fetch Telugu titles.\n\n---\n\n`;

  report += `## 📋 SUMMARY OF ACTIONS

### High Priority (Immediate)
1. **Delete placeholder titles** (${categorized.placeholder_titles.length} movies) - Script available
2. **Research incomplete data** (Top 30 of ${categorized.incomplete_data.length}) - Manual review

### Medium Priority (This Week)
3. **Add Telugu titles** (${categorized.missing_telugu_titles.length} movies) - Use AI translation batch script
4. **Update future releases** (${categorized.future_releases.length} movies) - Monitor announcements

### Low Priority (Next Month)
5. **Review other issues** (${categorized.other.length} movies) - Case-by-case basis

---

## 🚀 Suggested Scripts

### 1. Delete Placeholder Titles
\`\`\`bash
npx tsx scripts/delete-placeholder-movies.ts --execute
\`\`\`

### 2. Batch Add Telugu Titles (AI Translation)
\`\`\`bash
npx tsx scripts/add-telugu-titles-batch.ts --execute
\`\`\`

### 3. Research and Enrich (Semi-Manual)
\`\`\`bash
npx tsx scripts/research-and-enrich.ts --limit=30
\`\`\`

---

**Next Steps**: Start with deletion of placeholder titles, then move to research phase.
`;

  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(chalk.green(`\n  ✅ Action plan saved: ${reportPath}\n`));

  // Also export a simple deletion list
  const deleteListPath = 'docs/audit-reports/movies-to-delete.txt';
  const deleteList = categorized.placeholder_titles.map(m => m.id).join('\n');
  fs.writeFileSync(deleteListPath, deleteList, 'utf-8');
  console.log(chalk.green(`  ✅ Deletion list saved: ${deleteListPath}\n`));
}

main().catch(console.error);
