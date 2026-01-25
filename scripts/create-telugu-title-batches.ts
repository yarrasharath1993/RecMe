#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import chalk from 'chalk';

const CSV_FILE = 'movies-missing-telugu-titles-2026-01-14.csv';
const BATCH_DIR = 'telugu-title-batches';
const BATCH_SIZE = 50;

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

function stringifyCSVBatch(rows: MovieRow[]): string {
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

async function createBatches() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         CREATING TELUGU TITLE BATCHES                                ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const csvContent = readFileSync(CSV_FILE, 'utf-8');
  const allRecords = parseCSV(csvContent);

  // Filter pending movies
  const pending = allRecords.filter(r => !r.TitleTe || r.TitleTe.trim().length === 0);

  console.log(chalk.yellow(`⏳ Total pending: ${pending.length} movies\n`));

  // Create batch directory
  try {
    mkdirSync(BATCH_DIR, { recursive: true });
  } catch (e) {
    // Directory exists
  }

  // Categorize movies
  const recent2024 = pending.filter(m => m.ReleaseYear === '2024');
  const year2023 = pending.filter(m => m.ReleaseYear === '2023');
  const year2022 = pending.filter(m => m.ReleaseYear === '2022');
  const year2021 = pending.filter(m => m.ReleaseYear === '2021');
  const older = pending.filter(m => m.ReleaseYear && parseInt(m.ReleaseYear) < 2021);
  const upcoming2025 = pending.filter(m => m.ReleaseYear === '2025');
  const upcoming2026 = pending.filter(m => m.ReleaseYear === '2026');

  const categories = [
    { name: '2024-Recent', movies: recent2024, priority: 'HIGH' },
    { name: '2023', movies: year2023, priority: 'HIGH' },
    { name: '2025-Upcoming', movies: upcoming2025, priority: 'MEDIUM' },
    { name: '2026-Upcoming', movies: upcoming2026, priority: 'MEDIUM' },
    { name: '2022', movies: year2022, priority: 'MEDIUM' },
    { name: '2021', movies: year2021, priority: 'LOW' },
    { name: 'Before-2021', movies: older, priority: 'LOW' },
  ];

  let totalBatches = 0;
  const batchInfo: any[] = [];

  for (const category of categories) {
    if (category.movies.length === 0) continue;

    const numBatches = Math.ceil(category.movies.length / BATCH_SIZE);
    
    console.log(chalk.cyan(`\n📁 Category: ${category.name}`));
    console.log(chalk.gray(`   Priority: ${category.priority} | Movies: ${category.movies.length} | Batches: ${numBatches}`));

    for (let i = 0; i < numBatches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, category.movies.length);
      const batch = category.movies.slice(start, end);
      
      totalBatches++;
      const filename = `${BATCH_DIR}/batch-${totalBatches.toString().padStart(2, '0')}-${category.name}-${i + 1}of${numBatches}.csv`;
      
      const csv = stringifyCSVBatch(batch);
      writeFileSync(filename, csv);
      
      batchInfo.push({
        batch: totalBatches,
        file: filename.split('/')[1],
        category: category.name,
        priority: category.priority,
        count: batch.length,
        firstMovie: batch[0].TitleEn,
        lastMovie: batch[batch.length - 1].TitleEn,
      });

      console.log(chalk.green(`   ✓ Batch ${totalBatches}: ${batch.length} movies → ${filename.split('/')[1]}`));
    }
  }

  // Create summary guide
  const guide = `# Telugu Titles - Batch Translation Guide

**Date:** ${new Date().toLocaleDateString()}  
**Total Pending:** ${pending.length} movies  
**Total Batches:** ${totalBatches} batches  
**Batch Size:** ~${BATCH_SIZE} movies per batch

---

## 🎯 Batch Overview

| Batch | Category | Priority | Count | File |
|-------|----------|----------|-------|------|
${batchInfo.map(b => `| ${b.batch} | ${b.category} | ${b.priority} | ${b.count} | \`${b.file}\` |`).join('\n')}

---

## 📋 How to Use

### Step 1: Pick a Batch
Start with **HIGH priority** batches (2024, 2023) for maximum impact.

### Step 2: Fill Telugu Titles
Open the batch CSV file and fill the "Title (Telugu - FILL THIS)" column.

### Step 3: Save the Batch
Save your changes after completing each batch.

### Step 4: Import to Main File
Once you've completed batches, let me know and I'll merge them back into the main file.

---

## 🔥 Recommended Order

1. **Start Here:** Batch 1-${batchInfo.filter(b => b.category === '2024-Recent').length} (2024 Recent - HIGH)
2. **Then:** Batch ${batchInfo.filter(b => b.category === '2024-Recent').length + 1}-${batchInfo.filter(b => b.priority === 'HIGH').length} (2023 - HIGH)
3. **Next:** Upcoming 2025-2026 (MEDIUM)
4. **Later:** 2021-2022 (MEDIUM/LOW)
5. **Final:** Before 2021 (LOW)

---

## 📊 Progress Tracking

- [ ] Batch 01 ✓ (${batchInfo[0]?.count || 0} movies)
- [ ] Batch 02 (${batchInfo[1]?.count || 0} movies)
- [ ] Batch 03 (${batchInfo[2]?.count || 0} movies)
... (continue for all ${totalBatches} batches)

---

## 💡 Tips

1. **Focus on one batch at a time** - Don't get overwhelmed
2. **Use Google Translate as reference** - But verify accuracy
3. **Check existing movies** - See how similar titles were translated
4. **Mark unclear ones** - Add a note if you're unsure about a translation
5. **Take breaks** - This is a lot of work!

---

## 📞 Next Steps

After completing batches, run:
\`\`\`bash
npx tsx scripts/merge-telugu-batches.ts
\`\`\`

This will merge all completed batches back into the main CSV file.

---

**You've got this! 🚀**
`;

  writeFileSync(`${BATCH_DIR}/README.md`, guide);

  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                            SUMMARY                                      '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Total batches created: ${totalBatches}`));
  console.log(chalk.yellow(`📁 Location: ./${BATCH_DIR}/`));
  console.log(chalk.cyan(`📖 Guide: ./${BATCH_DIR}/README.md\n`));

  console.log(chalk.cyan('Priority Breakdown:'));
  console.log(chalk.red(`   🔴 HIGH: ${batchInfo.filter(b => b.priority === 'HIGH').length} batches (${batchInfo.filter(b => b.priority === 'HIGH').reduce((sum, b) => sum + b.count, 0)} movies)`));
  console.log(chalk.yellow(`   🟡 MEDIUM: ${batchInfo.filter(b => b.priority === 'MEDIUM').length} batches (${batchInfo.filter(b => b.priority === 'MEDIUM').reduce((sum, b) => sum + b.count, 0)} movies)`));
  console.log(chalk.green(`   🟢 LOW: ${batchInfo.filter(b => b.priority === 'LOW').length} batches (${batchInfo.filter(b => b.priority === 'LOW').reduce((sum, b) => sum + b.count, 0)} movies)\n`));

  console.log(chalk.green('✅ Batches created successfully!\n'));
  console.log(chalk.cyan('📌 Start with Batch 01 (2024 Recent Movies) for maximum impact!\n'));
}

createBatches().catch(console.error);
