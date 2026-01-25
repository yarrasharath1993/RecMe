#!/usr/bin/env npx tsx
/**
 * Apply TMDB validation fixes (only UPDATE actions)
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

interface Fix {
  id: string;
  slug: string;
  title: string;
  field: string;
  db_value: string;
  tmdb_value: string;
  action: string;
}

const fixes: Fix[] = [
  // UPDATE actions only
  { id: 'f8b96466-024c-4d02-8a09-fffb160f34cb', slug: 'aatagadu-1980', title: 'Aatagadu', field: 'director', db_value: 'T. Rama Rao', tmdb_value: 'Rama Rao Tatineni', action: 'UPDATE' },
  { id: '97aec26f-f735-4dc8-91af-15d154c31483', slug: 'lava-kusa-1963', title: 'Lava Kusa', field: 'director', db_value: 'C. Pullayya, C.S. Rao', tmdb_value: 'Chittajalu Pullayya', action: 'KEEP DB' }, // Actually KEEP DB
  { id: '29218ade-c41f-448c-aa67-f8fc2d9397e6', slug: 'sakthi-2011', title: 'Sakthi', field: 'hero', db_value: 'Jr. NTR', tmdb_value: 'N.T. Rama Rao Jr.', action: 'UPDATE' },
  { id: 'ceaeee6f-363e-43ca-a3f1-8ea374d85ab5', slug: 'ananda-bhairavi-1983', title: 'Ananda Bhairavi', field: 'director', db_value: 'Jandhyala', tmdb_value: 'Jandhyala Subramanya Sastry', action: 'UPDATE' },
  { id: '32c231ed-8459-4832-9292-9198bb1e7e4d', slug: 'telugu-veera-levara-1995', title: 'Telugu Veera Levara', field: 'director', db_value: 'E. V. V. Satyanarayana', tmdb_value: 'E.V.V. Satyanarayana', action: 'UPDATE' },
  { id: '9c701b1d-c9f9-4784-9a83-68c26c96fa7e', slug: 'neti-bharatam-1983', title: 'Neti Bharatam', field: 'director', db_value: 'K. Vasu', tmdb_value: 'T Krishna', action: 'UPDATE' },
  { id: '0ba322b9-306f-4a75-8104-1141a6058ff6', slug: 'manjal-mahimai-1959', title: 'Manjal Mahimai', field: 'hero', db_value: 'Akkineni Nageswara Rao', tmdb_value: 'Nageshwara Rao Akkineni', action: 'UPDATE' },
  { id: '45e977ad-ee60-4fd5-8277-27baea08b871', slug: 'suswagatham-1997', title: 'Suswagatham', field: 'hero', db_value: 'Srikanth', tmdb_value: 'Pawan Kalyan', action: 'UPDATE' },
  { id: 'b1d54e41-8ce7-4ecc-80f6-0427e1dba538', slug: 'dongaata-1997', title: 'Dongaata', field: 'hero', db_value: 'Jagapathi Babu', tmdb_value: 'Jagapati Babu', action: 'UPDATE' },
  { id: 'ad52496e-805b-4999-83bd-434e712ae60c', slug: 'ashtalakshmi-vaibhavam-1986', title: 'Ashtalakshmi Vaibhavam', field: 'director', db_value: 'Suresh Krissna', tmdb_value: 'K. Kameshwara Rao', action: 'UPDATE' },
];

async function applyFixes() {
  console.log(chalk.bold('\n🔧 APPLYING TMDB VALIDATION FIXES\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  let applied = 0;
  let notFound = 0;
  let errors = 0;
  let skipped = 0;
  
  for (const fix of fixes) {
    try {
      if (fix.action !== 'UPDATE') {
        skipped++;
        continue;
      }
      
      const { data, error: fetchError } = await supabase
        .from('movies')
        .select('id, slug, title_en, hero, heroine, director')
        .eq('slug', fix.slug)
        .single();
      
      if (fetchError || !data) {
        console.log(chalk.red(`❌ Not found: ${fix.slug}`));
        notFound++;
        continue;
      }
      
      const currentValue = (data as any)[fix.field];
      if (currentValue === fix.tmdb_value) {
        console.log(chalk.yellow(`⚠️  Already correct: ${fix.title} (${fix.field})`));
        continue;
      }
      
      console.log(chalk.yellow(`\n${fix.title} (${fix.slug})`));
      console.log(`  Field: ${fix.field}`);
      console.log(`  ${chalk.red('BEFORE:')} "${currentValue || 'N/A'}"`);
      console.log(`  ${chalk.green('AFTER:')}  "${fix.tmdb_value}"`);
      
      const updatePayload: any = {};
      updatePayload[fix.field] = fix.tmdb_value;
      
      const { error: updateError } = await supabase
        .from('movies')
        .update(updatePayload)
        .eq('id', data.id);
      
      if (updateError) {
        console.log(chalk.red(`  ❌ Error: ${updateError.message}`));
        errors++;
      } else {
        console.log(chalk.green(`  ✅ Fixed`));
        applied++;
      }
    } catch (e: any) {
      console.log(chalk.red(`❌ Unexpected error for ${fix.slug}: ${e.message}`));
      errors++;
    }
  }
  
  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Applied: ${chalk.green(applied)}`);
  console.log(`  Skipped (KEEP DB): ${chalk.yellow(skipped)}`);
  console.log(`  Not found: ${chalk.yellow(notFound)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log();
}

applyFixes().catch(console.error);
