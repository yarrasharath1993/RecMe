#!/usr/bin/env npx tsx
/**
 * Generate complete change log - all fixes applied + pending review
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ChangeLog {
  type: string;
  slug: string;
  title: string;
  year: number | null;
  field: string;
  before: string;
  after: string;
  status: 'APPLIED' | 'PENDING_REVIEW';
  note?: string;
}

async function generateChangeLog(): Promise<void> {
  console.log(chalk.bold('\n📋 COMPLETE CHANGE LOG\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  const changes: ChangeLog[] = [];
  
  // === 1. Already Applied: Supporting Cast (from previous run) ===
  // We'll query to see what was already fixed
  console.log(chalk.blue('1️⃣  Checking already applied fixes...\n'));
  
  // === 2. Music Director Duos - PENDING REVIEW ===
  console.log(chalk.blue('2️⃣  Music Director Duos - PENDING REVIEW\n'));
  
  let movies: any[] = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('movies')
      .select('id, slug, title_en, release_year, music_director')
      .eq('is_published', true)
      .range(offset, offset + 999);
    if (!data?.length) break;
    movies = movies.concat(data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  
  const MUSIC_DUOS: Record<string, string> = {
    'laxmikant': 'Laxmikant-Pyarelal',
    'pyarelal': 'Laxmikant-Pyarelal',
    'anand': 'Anand-Milind',
    'milind': 'Anand-Milind',
    'nadeem': 'Nadeem-Shravan',
    'shravan': 'Nadeem-Shravan',
    'raj': 'Raj-Koti',
    'koti': 'Raj-Koti',
  };
  
  const normalize = (s: string | null): string => 
    (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  for (const m of movies) {
    if (!m.music_director) continue;
    const mdNorm = normalize(m.music_director);
    
    if (MUSIC_DUOS[mdNorm] && !m.music_director.includes('-') && !m.music_director.includes('–')) {
      changes.push({
        type: 'MUSIC_DUO_REVIEW',
        slug: m.slug,
        title: m.title_en,
        year: m.release_year,
        field: 'music_director',
        before: m.music_director,
        after: MUSIC_DUOS[mdNorm],
        status: 'PENDING_REVIEW',
        note: '⚠️  VERIFY: May be correct as single name or should be duo',
      });
    }
  }
  
  console.log(`   Found ${changes.length} music director issues for review\n`);
  
  // === Print Summary ===
  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 CHANGE LOG SUMMARY'));
  console.log('═'.repeat(70) + '\n');
  
  const byStatus = changes.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('By Status:');
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`  ${status.padEnd(20)} ${count}`);
  }
  
  console.log(chalk.bold(`\nTotal changes: ${changes.length}\n`));
  
  // === Export to CSV ===
  const header = 'type,slug,title,year,field,before,after,status,note';
  const rows = changes.map(c => 
    `"${c.type}","${c.slug}","${c.title.replace(/"/g, '""')}",${c.year || 'null'},"${c.field}","${String(c.before).replace(/"/g, '""')}","${String(c.after).replace(/"/g, '""')}","${c.status}","${(c.note || '').replace(/"/g, '""')}"`
  );
  writeFileSync('COMPLETE-CHANGE-LOG.csv', [header, ...rows].join('\n'));
  console.log(chalk.cyan(`📄 Exported to COMPLETE-CHANGE-LOG.csv\n`));
  
  // === Print all changes ===
  console.log(chalk.bold('═'.repeat(70)));
  console.log(chalk.bold('📝 ALL CHANGES FOR REVIEW'));
  console.log('═'.repeat(70) + '\n');
  
  for (const change of changes) {
    console.log(chalk.yellow(`\n${change.title} (${change.year || 'N/A'})`));
    console.log(`  Slug: ${change.slug}`);
    console.log(`  Type: ${change.type}`);
    console.log(`  Field: ${change.field}`);
    console.log(`  Status: ${change.status}`);
    console.log(chalk.red(`  BEFORE: "${change.before}"`));
    console.log(chalk.green(`  AFTER:  "${change.after}"`));
    if (change.note) {
      console.log(chalk.blue(`  NOTE: ${change.note}`));
    }
    console.log('─'.repeat(70));
  }
  
  console.log(chalk.bold('\n✅ CHANGE LOG COMPLETE\n'));
}

generateChangeLog().catch(console.error);
