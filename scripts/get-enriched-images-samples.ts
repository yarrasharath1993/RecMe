#!/usr/bin/env npx tsx
/**
 * GET SAMPLES OF ENRICHED IMAGES
 * 
 * Fetches 20 sample movies from the 291 images enriched today
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSamples() {
  console.log(chalk.cyan.bold('\n📸 Getting Enriched Image Samples\n'));

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Get movies with images updated today (by updated_at timestamp)
  const { data: recentImages, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, poster_url, poster_confidence, archival_source, updated_at')
    .not('poster_url', 'like', '%placeholder%')
    .not('poster_url', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error(chalk.red('  ❌ Error:'), error.message);
    return;
  }

  // Filter for today's updates
  const todayImages = recentImages?.filter((m: any) => {
    return m.updated_at && m.updated_at.startsWith(today);
  }) || [];

  console.log(chalk.green(`  ✅ Found ${todayImages.length} movies with images updated today`));
  console.log(chalk.gray(`  Taking first 20 samples...\n`));

  const samples = todayImages.slice(0, 20);

  // Generate CSV
  const csvContent = [
    'ID,Title (English),Title (Telugu),Year,Image URL,Source,Confidence,Updated At',
    ...samples.map((m: any) => {
      const sourceName = m.archival_source?.source_name || 'TMDB';
      const confidence = m.poster_confidence || 0.95;
      return `${m.id},"${m.title_en}","${m.title_te || '-'}",${m.release_year},"${m.poster_url}","${sourceName}",${confidence},"${m.updated_at}"`;
    })
  ].join('\n');

  const csvPath = path.join(process.cwd(), 'docs', 'ENRICHED-IMAGES-SAMPLES.csv');
  fs.writeFileSync(csvPath, csvContent);
  console.log(chalk.green(`  📄 CSV: ${csvPath}\n`));

  // Generate Markdown
  const markdownContent = `# Enriched Images - 20 Samples

**Generated**: ${new Date().toISOString()}  
**Date**: ${today}  
**Total Enriched**: ${todayImages.length} movies  
**Samples**: 20 movies

---

${samples.map((m: any, i: number) => {
  const sourceName = m.archival_source?.source_name || 'TMDB';
  const confidence = m.poster_confidence || 0.95;
  
  return `## ${i + 1}. ${m.title_en} (${m.release_year})

- **Telugu Title**: ${m.title_te || 'N/A'}
- **Image URL**: ${m.poster_url}
- **Source**: ${sourceName}
- **Confidence**: ${(confidence * 100).toFixed(0)}%
- **Updated**: ${m.updated_at}

![${m.title_en}](${m.poster_url})

---
`;
}).join('\n')}

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Enriched Today | ${todayImages.length} |
| Samples Shown | 20 |
| Main Source | TMDB (${Math.round((samples.filter((s: any) => (s.archival_source?.source_name || 'TMDB') === 'TMDB').length / samples.length) * 100)}%) |

---

*Full list available in ENRICHED-IMAGES-SAMPLES.csv*
`;

  const mdPath = path.join(process.cwd(), 'docs', 'ENRICHED-IMAGES-SAMPLES.md');
  fs.writeFileSync(mdPath, markdownContent);
  console.log(chalk.green(`  📋 Markdown: ${mdPath}\n`));

  // Print console preview
  console.log(chalk.cyan.bold('📸 SAMPLE IMAGES (First 20):'));
  console.log(chalk.cyan('━'.repeat(70)));
  
  samples.forEach((m: any, i: number) => {
    const sourceName = m.archival_source?.source_name || 'TMDB';
    console.log(chalk.white(`\n${i + 1}. ${chalk.bold(m.title_en)} (${m.release_year})`));
    console.log(chalk.gray(`   Telugu: ${m.title_te || 'N/A'}`));
    console.log(chalk.green(`   Source: ${sourceName}`));
    console.log(chalk.blue(`   URL: ${m.poster_url}`));
  });

  console.log(chalk.cyan('\n' + '━'.repeat(70)));
  console.log(chalk.green(`\n✅ ${samples.length} samples exported`));
  console.log(chalk.yellow(`💡 Total enriched today: ${todayImages.length} movies\n`));
}

getSamples().catch(console.error);
