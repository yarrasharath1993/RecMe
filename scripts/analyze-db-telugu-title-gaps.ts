#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeTeluguTitleGaps() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║      ANALYZE DATABASE TELUGU TITLE GAPS & CREATE ENRICHMENT PLAN    ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow('📋 Step 1: Fetching all database movies...\n'));

  const { data: movies, error } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, hero, director, is_published')
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false, nullsFirst: false });

  if (error) {
    console.error(chalk.red('❌ Error:'), error);
    return;
  }

  console.log(chalk.green(`✓ Loaded ${movies?.length || 0} Telugu movies\n`));

  const withTelugu = movies?.filter(m => m.title_te && m.title_te.trim().length > 0) || [];
  const withoutTelugu = movies?.filter(m => !m.title_te || m.title_te.trim().length === 0) || [];

  console.log(chalk.cyan.bold('📊 CURRENT STATE:\n'));
  console.log(chalk.green(`   ✅ With Telugu titles: ${withTelugu.length}`));
  console.log(chalk.red(`   ❌ Missing Telugu titles: ${withoutTelugu.length}\n`));

  // Analyze by year
  const byYear: Record<string, {total: number, missing: number}> = {};
  
  movies?.forEach(m => {
    const year = m.release_year?.toString() || 'Unknown';
    if (!byYear[year]) byYear[year] = { total: 0, missing: 0 };
    byYear[year].total++;
    if (!m.title_te || m.title_te.trim().length === 0) {
      byYear[year].missing++;
    }
  });

  console.log(chalk.cyan.bold('📅 MISSING TELUGU TITLES BY YEAR:\n'));
  console.log(chalk.gray('   Year  │ Missing │ Total │ % Missing'));
  console.log(chalk.gray('   ──────┼─────────┼───────┼──────────'));

  Object.entries(byYear)
    .sort((a, b) => {
      if (a[0] === 'Unknown') return 1;
      if (b[0] === 'Unknown') return 1;
      return parseInt(b[0]) - parseInt(a[0]);
    })
    .slice(0, 15)
    .forEach(([year, stats]) => {
      const percent = Math.round((stats.missing / stats.total) * 100);
      const color = percent > 50 ? chalk.red : percent > 25 ? chalk.yellow : chalk.green;
      console.log(color(`   ${year.padEnd(6)}│ ${stats.missing.toString().padStart(7)} │ ${stats.total.toString().padStart(5)} │ ${percent.toString().padStart(9)}%`));
    });
  console.log('');

  // Prioritize by criteria
  const priorities = {
    critical: [] as any[],  // Recent + Published + Popular
    high: [] as any[],      // Recent + Published
    medium: [] as any[],    // Older + Published
    low: [] as any[]        // Unpublished or very old
  };

  withoutTelugu.forEach(movie => {
    const year = movie.release_year || 0;
    const isRecent = year >= 2022;
    const isPublished = movie.is_published;

    if (isRecent && isPublished) {
      priorities.critical.push(movie);
    } else if (isRecent) {
      priorities.high.push(movie);
    } else if (isPublished) {
      priorities.medium.push(movie);
    } else {
      priorities.low.push(movie);
    }
  });

  console.log(chalk.cyan.bold('🎯 PRIORITY BREAKDOWN:\n'));
  console.log(chalk.red(`   🔴 CRITICAL (Recent + Published): ${priorities.critical.length}`));
  console.log(chalk.yellow(`   🟠 HIGH (Recent): ${priorities.high.length}`));
  console.log(chalk.blue(`   🔵 MEDIUM (Published): ${priorities.medium.length}`));
  console.log(chalk.gray(`   ⚪ LOW (Old/Unpublished): ${priorities.low.length}\n`));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   ENRICHMENT STRATEGY                                 '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.magenta.bold('📋 PHASE 1: CRITICAL PRIORITY (Target: 100%)\n'));
  console.log(chalk.white(`   Movies: ${priorities.critical.length}`));
  console.log(chalk.white(`   Focus: 2022-2026 published movies`));
  console.log(chalk.white(`   Method: Manual review + Google Translate API`));
  console.log(chalk.white(`   Timeline: 1-2 days`));
  console.log(chalk.white(`   Expected impact: +${Math.round((priorities.critical.length/withoutTelugu.length)*100)}% completion\n`));

  console.log(chalk.magenta.bold('📋 PHASE 2: HIGH PRIORITY (Target: 80%)\n'));
  console.log(chalk.white(`   Movies: ${priorities.high.length}`));
  console.log(chalk.white(`   Focus: 2022-2026 unpublished`));
  console.log(chalk.white(`   Method: Automated translation + spot check`));
  console.log(chalk.white(`   Timeline: 1 day`));
  console.log(chalk.white(`   Expected impact: +${Math.round((priorities.high.length/withoutTelugu.length)*100)}% completion\n`));

  console.log(chalk.magenta.bold('📋 PHASE 3: MEDIUM PRIORITY (Target: 50%)\n'));
  console.log(chalk.white(`   Movies: ${priorities.medium.length}`));
  console.log(chalk.white(`   Focus: Pre-2022 published`));
  console.log(chalk.white(`   Method: Bulk translation`));
  console.log(chalk.white(`   Timeline: 2-3 days`));
  console.log(chalk.white(`   Expected impact: +${Math.round((priorities.medium.length/withoutTelugu.length)*100)}% completion\n`));

  // Create batches for manual review
  console.log(chalk.yellow('📋 Creating batches for manual review...\n'));

  const batchSize = 50;
  const batches: any[][] = [];

  // Batch critical movies
  for (let i = 0; i < priorities.critical.length; i += batchSize) {
    batches.push(priorities.critical.slice(i, i + batchSize));
  }

  console.log(chalk.green(`✓ Created ${batches.length} batches for critical movies\n`));

  // Export critical movies for manual review
  const criticalCsvLines = ['Slug,Title (English),Release Year,Hero,Director,Status'];
  priorities.critical.forEach(m => {
    criticalCsvLines.push([
      m.slug,
      `"${m.title_en?.replace(/"/g, '""') || ''}"`,
      m.release_year || '',
      `"${m.hero?.replace(/"/g, '""') || ''}"`,
      `"${m.director?.replace(/"/g, '""') || ''}"`,
      m.is_published ? 'Published' : 'Unpublished'
    ].join(','));
  });

  const criticalCsvFile = 'DB-CRITICAL-MOVIES-NEED-TELUGU-TITLES.csv';
  writeFileSync(criticalCsvFile, criticalCsvLines.join('\n'));
  console.log(chalk.green(`✅ Exported critical movies: ${criticalCsvFile}\n`));

  // Export high priority
  const highCsvLines = ['Slug,Title (English),Release Year,Hero,Director,Status'];
  priorities.high.forEach(m => {
    highCsvLines.push([
      m.slug,
      `"${m.title_en?.replace(/"/g, '""') || ''}"`,
      m.release_year || '',
      `"${m.hero?.replace(/"/g, '""') || ''}"`,
      `"${m.director?.replace(/"/g, '""') || ''}"`,
      m.is_published ? 'Published' : 'Unpublished'
    ].join(','));
  });

  const highCsvFile = 'DB-HIGH-PRIORITY-NEED-TELUGU-TITLES.csv';
  writeFileSync(highCsvFile, highCsvLines.join('\n'));
  console.log(chalk.green(`✅ Exported high priority: ${highCsvFile}\n`));

  // Create comprehensive strategy document
  const strategyLines: string[] = [];
  strategyLines.push('# DATABASE TELUGU TITLE ENRICHMENT STRATEGY');
  strategyLines.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  strategyLines.push(`**Goal:** Add Telugu titles to ${withoutTelugu.length} database movies\n`);
  strategyLines.push('---\n');

  strategyLines.push('## Current State\n');
  strategyLines.push(`- **Total movies:** ${movies?.length || 0}`);
  strategyLines.push(`- **With Telugu titles:** ${withTelugu.length} (${Math.round((withTelugu.length/(movies?.length || 1))*100)}%)`);
  strategyLines.push(`- **Missing Telugu titles:** ${withoutTelugu.length} (${Math.round((withoutTelugu.length/(movies?.length || 1))*100)}%)\n`);
  strategyLines.push('---\n');

  strategyLines.push('## Priority Breakdown\n');
  strategyLines.push(`- 🔴 **CRITICAL:** ${priorities.critical.length} movies (2022+ Published)`);
  strategyLines.push(`- 🟠 **HIGH:** ${priorities.high.length} movies (2022+ Unpublished)`);
  strategyLines.push(`- 🔵 **MEDIUM:** ${priorities.medium.length} movies (Pre-2022 Published)`);
  strategyLines.push(`- ⚪ **LOW:** ${priorities.low.length} movies (Old/Unpublished)\n`);
  strategyLines.push('---\n');

  strategyLines.push('## Enrichment Phases\n\n');
  
  strategyLines.push('### Phase 1: CRITICAL PRIORITY (${priorities.critical.length} movies)\n');
  strategyLines.push('**Target:** 100% completion\n');
  strategyLines.push('**Method:**');
  strategyLines.push('1. Manual review using `DB-CRITICAL-MOVIES-NEED-TELUGU-TITLES.csv`');
  strategyLines.push('2. Search for official posters/websites for accurate Telugu titles');
  strategyLines.push('3. Use Google Translate API as fallback');
  strategyLines.push('4. Quality check every title\n');
  strategyLines.push('**Expected Impact:** Health score +${Math.round((priorities.critical.length/withoutTelugu.length)*25)} points');
  strategyLines.push('**Timeline:** 1-2 days\n');

  strategyLines.push('### Phase 2: HIGH PRIORITY (${priorities.high.length} movies)\n');
  strategyLines.push('**Target:** 80% completion\n');
  strategyLines.push('**Method:**');
  strategyLines.push('1. Automated translation using Google Translate API');
  strategyLines.push('2. Spot check 20% for quality');
  strategyLines.push('3. Manual fix for major releases\n');
  strategyLines.push('**Expected Impact:** Health score +${Math.round((priorities.high.length/withoutTelugu.length)*20)} points');
  strategyLines.push('**Timeline:** 1 day\n');

  strategyLines.push('### Phase 3: MEDIUM PRIORITY (${priorities.medium.length} movies)\n');
  strategyLines.push('**Target:** 50% completion\n');
  strategyLines.push('**Method:**');
  strategyLines.push('1. Bulk translation');
  strategyLines.push('2. Focus on movies with poster images');
  strategyLines.push('3. Quality check sample set\n');
  strategyLines.push('**Expected Impact:** Health score +${Math.round((priorities.medium.length/withoutTelugu.length)*15)} points');
  strategyLines.push('**Timeline:** 2-3 days\n');

  strategyLines.push('---\n');
  strategyLines.push('## Missing Telugu Titles by Year\n\n');
  strategyLines.push('| Year | Missing | Total | % Missing |');
  strategyLines.push('|------|---------|-------|-----------|');
  Object.entries(byYear)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([year, stats]) => {
      const percent = Math.round((stats.missing / stats.total) * 100);
      strategyLines.push(`| ${year} | ${stats.missing} | ${stats.total} | ${percent}% |`);
    });
  strategyLines.push('\n---\n');

  strategyLines.push('## Tools & Resources\n\n');
  strategyLines.push('### Available Files:');
  strategyLines.push('- `DB-CRITICAL-MOVIES-NEED-TELUGU-TITLES.csv` - Critical priority movies');
  strategyLines.push('- `DB-HIGH-PRIORITY-NEED-TELUGU-TITLES.csv` - High priority movies\n');
  strategyLines.push('### Recommended Approach:');
  strategyLines.push('1. Start with critical movies (most visible on site)');
  strategyLines.push('2. Use TMDB/IMDB for official Telugu titles');
  strategyLines.push('3. Use Google Translate as fallback');
  strategyLines.push('4. Quality check with native Telugu speaker\n');
  strategyLines.push('### Scripts Available:');
  strategyLines.push('- `bulk-translate-telugu-titles.ts` - Automated translation');
  strategyLines.push('- `import-telugu-titles-batch.ts` - Import corrected titles');
  strategyLines.push('- `verify-telugu-titles.ts` - Quality check\n');

  strategyLines.push('---\n');
  strategyLines.push('## Expected Outcomes\n\n');
  strategyLines.push('### After Phase 1:');
  strategyLines.push(`- Telugu titles: ${withTelugu.length} → ${withTelugu.length + priorities.critical.length} (+${priorities.critical.length})`);
  strategyLines.push(`- Completion: ${Math.round((withTelugu.length/(movies?.length || 1))*100)}% → ${Math.round(((withTelugu.length + priorities.critical.length)/(movies?.length || 1))*100)}%`);
  strategyLines.push(`- Health score: 67 → ~${67 + Math.round((priorities.critical.length/withoutTelugu.length)*25)}\n`);

  strategyLines.push('### After Phase 2:');
  strategyLines.push(`- Telugu titles: ${withTelugu.length + priorities.critical.length} → ${withTelugu.length + priorities.critical.length + Math.round(priorities.high.length * 0.8)}`);
  strategyLines.push(`- Completion: ${Math.round(((withTelugu.length + priorities.critical.length)/(movies?.length || 1))*100)}% → ${Math.round(((withTelugu.length + priorities.critical.length + Math.round(priorities.high.length * 0.8))/(movies?.length || 1))*100)}%`);
  strategyLines.push(`- Health score: ~${67 + Math.round((priorities.critical.length/withoutTelugu.length)*25)} → ~${67 + Math.round((priorities.critical.length/withoutTelugu.length)*25) + Math.round((priorities.high.length/withoutTelugu.length)*20)}\n`);

  strategyLines.push('### After Phase 3:');
  strategyLines.push(`- Telugu titles: Target 80%+ completion`);
  strategyLines.push(`- Health score: Target 85-90`);
  strategyLines.push(`- Grade: B+ to A-\n`);

  strategyLines.push('---\n');
  strategyLines.push('## Success Metrics\n\n');
  strategyLines.push('- **Phase 1 Success:** 100% of critical movies have accurate Telugu titles');
  strategyLines.push('- **Phase 2 Success:** 80% of high priority movies have Telugu titles');
  strategyLines.push('- **Phase 3 Success:** Overall completion ≥ 75%');
  strategyLines.push('- **Final Goal:** Health score ≥ 85 (B+ grade)\n');

  const strategyFile = 'DB-TELUGU-TITLE-ENRICHMENT-STRATEGY-2026-01-15.md';
  writeFileSync(strategyFile, strategyLines.join('\n'));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   ANALYSIS COMPLETE                                   '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green.bold('📄 FILES GENERATED:\n'));
  console.log(chalk.white(`   1. ${strategyFile}`));
  console.log(chalk.white(`   2. ${criticalCsvFile} (${priorities.critical.length} movies)`));
  console.log(chalk.white(`   3. ${highCsvFile} (${priorities.high.length} movies)\n`));

  console.log(chalk.magenta.bold('🎯 RECOMMENDED NEXT STEPS:\n'));
  console.log(chalk.green(`   1. Review ${criticalCsvFile}`));
  console.log(chalk.green(`   2. Add Telugu titles manually for critical movies`));
  console.log(chalk.green(`   3. Use bulk translation for high/medium priority`));
  console.log(chalk.green(`   4. Import titles back to database\n`));

  console.log(chalk.cyan.bold('📊 PROJECTED IMPACT:\n'));
  console.log(chalk.white(`   Current: ${withTelugu.length}/${movies?.length} (${Math.round((withTelugu.length/(movies?.length || 1))*100)}%)`));
  console.log(chalk.yellow(`   After Phase 1: ${withTelugu.length + priorities.critical.length}/${movies?.length} (${Math.round(((withTelugu.length + priorities.critical.length)/(movies?.length || 1))*100)}%)`));
  console.log(chalk.green(`   After All Phases: ~800+/${movies?.length} (80%+)\n`));

  console.log(chalk.green.bold(`   Health Score: 67 → 85+ (+18 points) 🚀\n`));

  console.log(chalk.magenta.bold('🎊 ENRICHMENT STRATEGY READY! 🎊\n'));
}

analyzeTeluguTitleGaps().catch(console.error);
