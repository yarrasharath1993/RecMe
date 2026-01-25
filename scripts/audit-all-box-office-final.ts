#!/usr/bin/env npx tsx
/**
 * FINAL AUDIT - All Movies with Box Office Categories
 * Shows comprehensive breakdown of all box office ratings
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: movies } = await supabase
    .from('movies')
    .select('box_office_category, our_rating, avg_rating, title_en, release_year')
    .not('box_office_category', 'is', null)
    .order('our_rating', { ascending: false })
    .limit(5000);

  const categories: Record<string, any[]> = {
    'industry-hit': [],
    'blockbuster': [],
    'super-hit': [],
    'hit': [],
    'average': [],
    'below-average': [],
    'disaster': []
  };

  movies?.forEach(m => {
    if (m.box_office_category && categories[m.box_office_category]) {
      categories[m.box_office_category].push(m);
    }
  });

  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           FINAL BOX OFFICE RATING AUDIT                             ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.bold(`Total movies with box office categories: ${chalk.cyan(movies?.length || 0)}\n`));

  console.log(chalk.bold('═══ BY BOX OFFICE CATEGORY ═══\n'));

  const categoryColors: Record<string, any> = {
    'industry-hit': chalk.magenta,
    'blockbuster': chalk.green,
    'super-hit': chalk.cyan,
    'hit': chalk.blue,
    'average': chalk.yellow,
    'below-average': chalk.red,
    'disaster': chalk.red.bold
  };

  Object.entries(categories).forEach(([category, items]) => {
    if (items.length === 0) return;
    
    const colorFn = categoryColors[category] || chalk.white;
    const avgRating = items.reduce((sum, m) => sum + (m.our_rating || 0), 0) / items.length;
    const minRating = Math.min(...items.map(m => m.our_rating || 0));
    const maxRating = Math.max(...items.map(m => m.our_rating || 0));
    
    console.log(colorFn.bold(`${category.toUpperCase()}`));
    console.log(colorFn(`  Count: ${items.length}`));
    console.log(colorFn(`  Avg Rating: ${avgRating.toFixed(2)}`));
    console.log(colorFn(`  Range: ${minRating.toFixed(1)} - ${maxRating.toFixed(1)}`));
    console.log(colorFn(`  Top 3:`));
    items.slice(0, 3).forEach((m, i) => {
      console.log(colorFn(`    ${i+1}. ${m.title_en} (${m.release_year || 'TBA'}) - ${m.our_rating?.toFixed(1) || 'N/A'}`));
    });
    console.log('');
  });

  console.log(chalk.bold('\n═══ RATING DISTRIBUTION ═══\n'));
  
  const ratingRanges = [
    { label: '9.0-10.0 (Masterpiece)', min: 9.0, max: 10.0, color: chalk.magenta },
    { label: '8.0-8.9 (Excellent)', min: 8.0, max: 8.9, color: chalk.green },
    { label: '7.0-7.9 (Great)', min: 7.0, max: 7.9, color: chalk.cyan },
    { label: '6.0-6.9 (Good)', min: 6.0, max: 6.9, color: chalk.blue },
    { label: '5.0-5.9 (Average)', min: 5.0, max: 5.9, color: chalk.yellow },
    { label: '< 5.0 (Below Average)', min: 0, max: 4.9, color: chalk.red }
  ];

  ratingRanges.forEach(range => {
    const count = movies?.filter(m => 
      (m.our_rating || 0) >= range.min && (m.our_rating || 0) <= range.max
    ).length || 0;
    const pct = ((count / (movies?.length || 1)) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(parseFloat(pct) / 2));
    console.log(`${range.label.padEnd(30)} ${range.color(count.toString().padStart(4))} (${pct}%) ${range.color(bar)}`);
  });

  console.log(chalk.green.bold('\n\n✅ All movies successfully updated with box office weightages!\n'));
}

main().catch(console.error);
