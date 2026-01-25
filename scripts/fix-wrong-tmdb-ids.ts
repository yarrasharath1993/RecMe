#!/usr/bin/env npx tsx
/**
 * Fix wrong TMDB IDs - clear or update based on review
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TMDBFix {
  slug: string;
  title: string;
  current_tmdb_id: number;
  action: 'UPDATE' | 'CLEAR';
  correct_tmdb_id?: number;
  reason: string;
}

const tmdbFixes: TMDBFix[] = [
  { slug: 'payanam-2011', title: 'Payanam', current_tmdb_id: 57271, action: 'UPDATE', correct_tmdb_id: 56434, reason: 'TMDB 57271 is Korean film, correct is 56434' },
  { slug: 'mugguru-monagallu-1983', title: 'Mugguru Monagallu', current_tmdb_id: 279116, action: 'CLEAR', reason: 'TMDB 279116 is 1994 film, 1983 film has no TMDB ID' },
  { slug: 'antaku-mundu-aa-taruvaata-2013', title: 'Antaku Mundu Aa Taruvaata', current_tmdb_id: 215865, action: 'UPDATE', correct_tmdb_id: 216503, reason: 'TMDB 215865 is Filipino film, correct is 216503' },
  { slug: 'agni-jwala-1983', title: 'Agni Jwala', current_tmdb_id: 78957, action: 'CLEAR', reason: 'TMDB 78957 is Tamil Citizen, no TMDB ID for Telugu' },
  { slug: 'sanchalanam-2011', title: 'Sanchalanam', current_tmdb_id: 68412, action: 'CLEAR', reason: 'TMDB 68412 is 3 Backyards, no TMDB ID for Telugu' },
  { slug: 'manchivadu-2011', title: 'Manchivadu', current_tmdb_id: 69412, action: 'CLEAR', reason: 'TMDB 69412 is Paramasivan, no TMDB ID for Telugu' },
  { slug: 'agni-pravesam-1990', title: 'Agni Pravesam', current_tmdb_id: 1146307, action: 'CLEAR', reason: 'TMDB 1146307 is Japanese short, no TMDB ID for Telugu' },
  { slug: 'bharya-bharthala-sawal-1983', title: 'Bharya Bharthala Sawal', current_tmdb_id: 1116140, action: 'CLEAR', reason: 'TMDB 1116140 is French film, no TMDB ID for Telugu' },
  { slug: 'kanne-donga-1983', title: 'Kanne Donga', current_tmdb_id: 434446, action: 'CLEAR', reason: 'TMDB 434446 is French film, no TMDB ID for Telugu' },
  { slug: 'mantri-gari-viyyankudu-1983', title: 'Mantri Gari Viyyankudu', current_tmdb_id: 115002, action: 'UPDATE', correct_tmdb_id: 279313, reason: 'TMDB 115002 is Dutch film, correct is 279313' },
  { slug: 'debbaku-debba-1983', title: 'Debbaku Debba', current_tmdb_id: 1116130, action: 'CLEAR', reason: 'TMDB 1116130 is Indian short, no TMDB ID for Telugu' },
  { slug: 'o-manasa-2015', title: 'O Manasa', current_tmdb_id: 354019, action: 'CLEAR', reason: 'TMDB 354019 is 8-Bit Homicide, no TMDB ID for Telugu' },
  { slug: 'simhapuri-simham-1983', title: 'Simhapuri Simham', current_tmdb_id: 369145, action: 'UPDATE', correct_tmdb_id: 362947, reason: 'TMDB 369145 is Doctor Who, correct is 362947' },
];

async function applyTMDBFixes() {
  console.log(chalk.bold('\n🔧 FIXING WRONG TMDB IDs\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  let updated = 0;
  let cleared = 0;
  let notFound = 0;
  let errors = 0;
  
  for (const fix of tmdbFixes) {
    try {
      const { data, error: fetchError } = await supabase
        .from('movies')
        .select('id, slug, title_en, tmdb_id')
        .eq('slug', fix.slug)
        .single();
      
      if (fetchError || !data) {
        console.log(chalk.red(`❌ Not found: ${fix.slug}`));
        notFound++;
        continue;
      }
      
      if (data.tmdb_id !== fix.current_tmdb_id) {
        console.log(chalk.yellow(`⚠️  TMDB ID mismatch: ${fix.title} (expected ${fix.current_tmdb_id}, found ${data.tmdb_id})`));
        continue;
      }
      
      console.log(chalk.yellow(`\n${fix.title} (${fix.slug})`));
      console.log(`  Current TMDB ID: ${fix.current_tmdb_id}`);
      console.log(`  Reason: ${fix.reason}`);
      
      if (fix.action === 'UPDATE' && fix.correct_tmdb_id) {
        console.log(`  ${chalk.red('BEFORE:')} tmdb_id = ${fix.current_tmdb_id}`);
        console.log(`  ${chalk.green('AFTER:')}  tmdb_id = ${fix.correct_tmdb_id}`);
        
        const { error: updateError } = await supabase
          .from('movies')
          .update({ tmdb_id: fix.correct_tmdb_id })
          .eq('id', data.id);
        
        if (updateError) {
          console.log(chalk.red(`  ❌ Error: ${updateError.message}`));
          errors++;
        } else {
          console.log(chalk.green(`  ✅ Updated`));
          updated++;
        }
      } else if (fix.action === 'CLEAR') {
        console.log(`  ${chalk.red('BEFORE:')} tmdb_id = ${fix.current_tmdb_id}`);
        console.log(`  ${chalk.green('AFTER:')}  tmdb_id = null`);
        
        const { error: updateError } = await supabase
          .from('movies')
          .update({ tmdb_id: null })
          .eq('id', data.id);
        
        if (updateError) {
          console.log(chalk.red(`  ❌ Error: ${updateError.message}`));
          errors++;
        } else {
          console.log(chalk.green(`  ✅ Cleared`));
          cleared++;
        }
      }
    } catch (e: any) {
      console.log(chalk.red(`❌ Unexpected error for ${fix.slug}: ${e.message}`));
      errors++;
    }
  }
  
  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Updated: ${chalk.green(updated)}`);
  console.log(`  Cleared: ${chalk.green(cleared)}`);
  console.log(`  Not found: ${chalk.yellow(notFound)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log();
}

applyTMDBFixes().catch(console.error);
