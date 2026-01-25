#!/usr/bin/env npx tsx
/**
 * EXPORT ENRICHED MOVIES FOR MANUAL REVIEW
 *
 * Exports movies that were just enriched for synopsis and images
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

interface MovieReview {
  id: string;
  title_en: string;
  title_te?: string;
  release_year: number;
  synopsis_te?: string;
  synopsis_te_source?: string;
  poster_url?: string;
  updated_at: string;
}

async function exportEnrichedMovies() {
  console.log(chalk.cyan.bold('\n📝 Exporting Enriched Movies for Manual Review\n'));

  // Get movies updated in the last 2 hours with new synopsis
  const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000).toISOString();
  
  console.log(chalk.gray(`  Fetching movies updated since: ${twoHoursAgo}\n`));

  // Query 1: Movies with synopsis updated recently
  const { data: synopsisMovies, error: synopsisError } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, synopsis_te, updated_at')
    .gte('updated_at', twoHoursAgo)
    .not('synopsis_te', 'is', null)
    .order('updated_at', { ascending: false });

  if (synopsisError) {
    console.error(chalk.red('  ❌ Error fetching synopsis movies:'), synopsisError.message);
  } else {
    console.log(chalk.green(`  ✅ Found ${synopsisMovies?.length || 0} movies with recent synopsis updates`));
  }

  // Query 2: Movies with images updated recently (not placeholder)
  const { data: imageMovies, error: imageError } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, poster_url, updated_at')
    .gte('updated_at', twoHoursAgo)
    .not('poster_url', 'like', '%placeholder%')
    .not('poster_url', 'is', null)
    .order('updated_at', { ascending: false });

  if (imageError) {
    console.error(chalk.red('  ❌ Error fetching image movies:'), imageError.message);
  } else {
    console.log(chalk.green(`  ✅ Found ${imageMovies?.length || 0} movies with recent image updates`));
  }

  // Query 3: Movies with LOW confidence synopsis (for manual review)
  const { data: lowConfMovies, error: lowConfError } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, synopsis_te, updated_at')
    .gte('updated_at', twoHoursAgo)
    .like('synopsis_te', '%Generated from basic movie information%')
    .order('updated_at', { ascending: false });

  if (lowConfError) {
    console.error(chalk.red('  ❌ Error fetching low confidence movies:'), lowConfError.message);
  } else {
    console.log(chalk.yellow(`  ⚠️  Found ${lowConfMovies?.length || 0} movies with LOW confidence synopsis (needs manual review)`));
  }

  // Generate CSV for synopsis
  if (synopsisMovies && synopsisMovies.length > 0) {
    const csvContent = [
      'ID,Title (English),Title (Telugu),Year,Synopsis Preview,Updated At',
      ...synopsisMovies.map((m: any) => {
        const synopsisPreview = (m.synopsis_te || '').substring(0, 100).replace(/,/g, ';');
        return `${m.id},"${m.title_en}","${m.title_te || '-'}",${m.release_year},"${synopsisPreview}...",${m.updated_at}`;
      })
    ].join('\n');

    const synopsisPath = path.join(process.cwd(), 'docs', 'ENRICHED-SYNOPSIS.csv');
    fs.writeFileSync(synopsisPath, csvContent);
    console.log(chalk.green(`\n  📄 Synopsis CSV: ${synopsisPath}`));
  }

  // Generate CSV for images
  if (imageMovies && imageMovies.length > 0) {
    const csvContent = [
      'ID,Title (English),Title (Telugu),Year,Image URL,Updated At',
      ...imageMovies.map((m: any) => {
        return `${m.id},"${m.title_en}","${m.title_te || '-'}",${m.release_year},"${m.poster_url}",${m.updated_at}`;
      })
    ].join('\n');

    const imagesPath = path.join(process.cwd(), 'docs', 'ENRICHED-IMAGES.csv');
    fs.writeFileSync(imagesPath, csvContent);
    console.log(chalk.green(`  📄 Images CSV: ${imagesPath}`));
  }

  // Generate CSV for LOW confidence (manual review needed)
  if (lowConfMovies && lowConfMovies.length > 0) {
    const csvContent = [
      'ID,Title (English),Title (Telugu),Year,Synopsis (Generated),Updated At',
      ...lowConfMovies.map((m: any) => {
        const synopsis = (m.synopsis_te || '').replace(/,/g, ';');
        return `${m.id},"${m.title_en}","${m.title_te || '-'}",${m.release_year},"${synopsis}",${m.updated_at}`;
      })
    ].join('\n');

    const reviewPath = path.join(process.cwd(), 'docs', 'NEEDS-MANUAL-REVIEW.csv');
    fs.writeFileSync(reviewPath, csvContent);
    console.log(chalk.yellow(`  ⚠️  Manual Review CSV: ${reviewPath}`));
  }

  // Generate Markdown summary
  const markdownContent = `# Enriched Movies - Manual Review

**Generated**: ${new Date().toISOString()}  
**Time Window**: Last 2 hours

---

## 📝 SYNOPSIS ENRICHMENT (${synopsisMovies?.length || 0} movies)

${synopsisMovies && synopsisMovies.length > 0 ? synopsisMovies.map((m: any, i: number) => `
### ${i + 1}. ${m.title_en} (${m.release_year})
- **Telugu Title**: ${m.title_te || 'N/A'}
- **Synopsis Preview**: ${(m.synopsis_te || '').substring(0, 150)}...
- **Updated**: ${m.updated_at}
`).join('\n') : 'No synopsis updates found.'}

---

## 🖼️ IMAGE ENRICHMENT (${imageMovies?.length || 0} movies)

${imageMovies && imageMovies.length > 0 ? imageMovies.map((m: any, i: number) => `
### ${i + 1}. ${m.title_en} (${m.release_year})
- **Telugu Title**: ${m.title_te || 'N/A'}
- **Image URL**: ${m.poster_url}
- **Updated**: ${m.updated_at}
`).join('\n') : 'No image updates found.'}

---

## ⚠️ LOW CONFIDENCE - NEEDS MANUAL REVIEW (${lowConfMovies?.length || 0} movies)

${lowConfMovies && lowConfMovies.length > 0 ? lowConfMovies.map((m: any, i: number) => `
### ${i + 1}. ${m.title_en} (${m.release_year})
- **Telugu Title**: ${m.title_te || 'N/A'}
- **Synopsis**: ${m.synopsis_te}
- **Issue**: Generated from basic information (30% confidence)
- **Action Needed**: Find proper Telugu synopsis from reliable source
- **Updated**: ${m.updated_at}
`).join('\n') : 'No low confidence movies found.'}

---

## 📊 SUMMARY

| Category | Count |
|----------|-------|
| Synopsis Enriched | ${synopsisMovies?.length || 0} |
| Images Enriched | ${imageMovies?.length || 0} |
| Needs Manual Review | ${lowConfMovies?.length || 0} |

**Total Movies Updated**: ${(synopsisMovies?.length || 0) + (imageMovies?.length || 0)}

---

*Files generated for manual review in \`docs/\` directory*
`;

  const markdownPath = path.join(process.cwd(), 'docs', 'ENRICHED-MOVIES-REVIEW.md');
  fs.writeFileSync(markdownPath, markdownContent);
  console.log(chalk.cyan(`\n  📋 Markdown Report: ${markdownPath}`));

  // Final summary
  console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           📊 EXPORT SUMMARY                                          ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  console.log(`  Synopsis Enriched:     ${chalk.green((synopsisMovies?.length || 0).toString())}`);
  console.log(`  Images Enriched:       ${chalk.green((imageMovies?.length || 0).toString())}`);
  console.log(`  Needs Manual Review:   ${chalk.yellow((lowConfMovies?.length || 0).toString())}`);
  console.log(`  Total Updated:         ${chalk.cyan(((synopsisMovies?.length || 0) + (imageMovies?.length || 0)).toString())}`);
  console.log('');
}

exportEnrichedMovies().catch(console.error);
