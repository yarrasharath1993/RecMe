#!/usr/bin/env npx tsx
/**
 * EXPORT ALL RECENTLY ENRICHED MOVIES FOR REVIEW
 * 
 * Since the enrichment ran today, this exports:
 * 1. Movies with archival_source acquisition_date from today (images)
 * 2. All movies with LOW confidence synopsis (generated_basic)
 * 3. Summary of current coverage
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

async function exportForReview() {
  console.log(chalk.cyan.bold('\n📝 Exporting Movies for Manual Review\n'));

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Query 1: Get movies enriched with images TODAY
  console.log(chalk.gray(`  Fetching movies with images added today (${today})...\n`));
  
  const { data: imageMovies, error: imageError } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, poster_url, archival_source')
    .not('poster_url', 'like', '%placeholder%')
    .not('poster_url', 'is', null)
    .order('archival_source->acquisition_date', { ascending: false })
    .limit(500);

  if (imageError) {
    console.error(chalk.red('  ❌ Error fetching image movies:'), imageError.message);
  }

  // Filter for today's acquisitions
  const todayImages = imageMovies?.filter((m: any) => {
    const acqDate = m.archival_source?.acquisition_date;
    return acqDate && acqDate.startsWith(today);
  }) || [];

  console.log(chalk.green(`  ✅ Found ${todayImages.length} movies with images added today`));

  // Query 2: Get ALL movies with LOW confidence synopsis (generated_basic)
  console.log(chalk.gray(`  Fetching movies with LOW confidence synopsis...\n`));
  
  const { data: lowConfMovies, error: lowConfError } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, synopsis_te, synopsis_te_source')
    .eq('synopsis_te_source', 'generated_basic')
    .order('release_year', { ascending: false })
    .limit(100);

  if (lowConfError) {
    console.error(chalk.red('  ❌ Error fetching low confidence movies:'), lowConfError.message);
  } else {
    console.log(chalk.yellow(`  ⚠️  Found ${lowConfMovies?.length || 0} movies with LOW confidence synopsis`));
  }

  // Query 3: Get synopsis enriched today (approximate - get recent ones)
  const { data: recentSynopsis, error: synError } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, synopsis_te, synopsis_te_source, updated_at')
    .not('synopsis_te', 'is', null)
    .not('synopsis_te_source', 'eq', 'generated_basic')
    .order('updated_at', { ascending: false })
    .limit(100);

  // Filter for today's updates
  const todaySynopsis = recentSynopsis?.filter((m: any) => {
    return m.updated_at && m.updated_at.startsWith(today);
  }) || [];

  console.log(chalk.green(`  ✅ Found ${todaySynopsis.length} movies with synopsis updated today`));

  // Generate CSV for images enriched today
  if (todayImages.length > 0) {
    const csvContent = [
      'ID,Title (English),Title (Telugu),Year,Image URL,Source,Acquisition Date',
      ...todayImages.map((m: any) => {
        const sourceName = m.archival_source?.source_name || 'unknown';
        const acqDate = m.archival_source?.acquisition_date || 'unknown';
        return `${m.id},"${m.title_en}","${m.title_te || '-'}",${m.release_year},"${m.poster_url}","${sourceName}","${acqDate}"`;
      })
    ].join('\n');

    const imagesPath = path.join(process.cwd(), 'docs', 'ENRICHED-IMAGES-TODAY.csv');
    fs.writeFileSync(imagesPath, csvContent);
    console.log(chalk.green(`\n  📄 Images (Today): ${imagesPath}`));
  }

  // Generate CSV for synopsis enriched today
  if (todaySynopsis.length > 0) {
    const csvContent = [
      'ID,Title (English),Title (Telugu),Year,Synopsis Preview,Source,Updated At',
      ...todaySynopsis.map((m: any) => {
        const synopsisPreview = (m.synopsis_te || '').substring(0, 100).replace(/,/g, ';').replace(/"/g, '""');
        return `${m.id},"${m.title_en}","${m.title_te || '-'}",${m.release_year},"${synopsisPreview}...","${m.synopsis_te_source || '-'}","${m.updated_at}"`;
      })
    ].join('\n');

    const synopsisPath = path.join(process.cwd(), 'docs', 'ENRICHED-SYNOPSIS-TODAY.csv');
    fs.writeFileSync(synopsisPath, csvContent);
    console.log(chalk.green(`  📄 Synopsis (Today): ${synopsisPath}`));
  }

  // Generate CSV for LOW confidence synopsis (MANUAL REVIEW NEEDED)
  if (lowConfMovies && lowConfMovies.length > 0) {
    const csvContent = [
      'ID,Title (English),Title (Telugu),Year,Synopsis (Generated - Needs Review)',
      ...lowConfMovies.map((m: any) => {
        const synopsis = (m.synopsis_te || '').replace(/,/g, ';').replace(/"/g, '""');
        return `${m.id},"${m.title_en}","${m.title_te || '-'}",${m.release_year},"${synopsis}"`;
      })
    ].join('\n');

    const reviewPath = path.join(process.cwd(), 'docs', 'NEEDS-MANUAL-REVIEW-SYNOPSIS.csv');
    fs.writeFileSync(reviewPath, csvContent);
    console.log(chalk.yellow(`  ⚠️  Needs Review: ${reviewPath}`));
  }

  // Generate comprehensive Markdown report
  const markdownContent = `# Movies for Manual Review

**Generated**: ${new Date().toISOString()}  
**Date**: ${today}

---

## 🖼️ IMAGES ENRICHED TODAY (${todayImages.length} movies)

${todayImages.length > 0 ? todayImages.slice(0, 50).map((m: any, i: number) => `
### ${i + 1}. ${m.title_en} (${m.release_year})
- **Telugu Title**: ${m.title_te || 'N/A'}
- **Image URL**: ${m.poster_url}
- **Source**: ${m.archival_source?.source_name || 'Unknown'}
- **Acquired**: ${m.archival_source?.acquisition_date || 'Unknown'}
`).join('\n') : 'No images enriched today.'}

${todayImages.length > 50 ? `\n*Showing first 50 of ${todayImages.length} movies. See CSV for full list.*\n` : ''}

---

## 📝 SYNOPSIS ENRICHED TODAY (${todaySynopsis.length} movies)

${todaySynopsis.length > 0 ? todaySynopsis.slice(0, 30).map((m: any, i: number) => `
### ${i + 1}. ${m.title_en} (${m.release_year})
- **Telugu Title**: ${m.title_te || 'N/A'}
- **Synopsis Preview**: ${(m.synopsis_te || '').substring(0, 150)}...
- **Source**: ${m.synopsis_te_source || 'Unknown'}
- **Updated**: ${m.updated_at}
`).join('\n') : 'No synopsis enriched today.'}

${todaySynopsis.length > 30 ? `\n*Showing first 30 of ${todaySynopsis.length} movies. See CSV for full list.*\n` : ''}

---

## ⚠️ LOW CONFIDENCE SYNOPSIS - NEEDS MANUAL REVIEW (${lowConfMovies?.length || 0} movies)

**Note**: These movies have AI-generated synopses with only 30% confidence. They need proper Telugu synopses from reliable sources.

${lowConfMovies && lowConfMovies.length > 0 ? lowConfMovies.slice(0, 20).map((m: any, i: number) => `
### ${i + 1}. ${m.title_en} (${m.release_year})
- **Telugu Title**: ${m.title_te || 'N/A'}
- **Current Synopsis**: ${m.synopsis_te}
- **Issue**: AI-generated (30% confidence)
- **Action Required**: Find proper Telugu synopsis from Wikipedia, reviews, or official sources
`).join('\n') : 'No low confidence synopsis found.'}

${lowConfMovies && lowConfMovies.length > 20 ? `\n*Showing first 20 of ${lowConfMovies.length} movies. See CSV for full list.*\n` : ''}

---

## 📊 SUMMARY

| Category | Count |
|----------|-------|
| Images Enriched Today | ${todayImages.length} |
| Synopsis Enriched Today | ${todaySynopsis.length} |
| **Needs Manual Review** | **${lowConfMovies?.length || 0}** |

**Total Movies Enriched Today**: ${todayImages.length + todaySynopsis.length}

---

## 📁 EXPORTED FILES

- **ENRICHED-IMAGES-TODAY.csv** - ${todayImages.length} movies with new posters
- **ENRICHED-SYNOPSIS-TODAY.csv** - ${todaySynopsis.length} movies with new synopsis
- **NEEDS-MANUAL-REVIEW-SYNOPSIS.csv** - ${lowConfMovies?.length || 0} movies requiring review

---

*All files are in the \`docs/\` directory*
`;

  const markdownPath = path.join(process.cwd(), 'docs', 'MANUAL-REVIEW-REPORT.md');
  fs.writeFileSync(markdownPath, markdownContent);
  console.log(chalk.cyan(`\n  📋 Full Report: ${markdownPath}`));

  // Final summary
  console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           📊 EXPORT SUMMARY                                          ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  console.log(`  Images Enriched Today:   ${chalk.green(todayImages.length.toString())}`);
  console.log(`  Synopsis Enriched Today: ${chalk.green(todaySynopsis.length.toString())}`);
  console.log(`  Needs Manual Review:     ${chalk.yellow((lowConfMovies?.length || 0).toString())}`);
  console.log(`  Total Enriched:          ${chalk.cyan((todayImages.length + todaySynopsis.length).toString())}`);
  console.log('');
}

exportForReview().catch(console.error);
