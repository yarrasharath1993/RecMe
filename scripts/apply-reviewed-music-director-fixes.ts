#!/usr/bin/env npx tsx
/**
 * Apply reviewed music director fixes
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
  slug: string;
  title: string;
  year: number;
  before: string;
  after: string;
  note: string;
}

// Fixes to apply (only those marked as FIXED with after value different from before)
const fixes: Fix[] = [
  // Raj-Koti duo (active until 1994)
  { slug: 'agni-pravesam-1990', title: 'Agni Pravesam', year: 1990, before: 'Koti', after: 'Raj-Koti', note: 'Duo active until 1994' },
  { slug: 'lakshyam-1993', title: 'Lakshyam', year: 1993, before: 'Koti', after: 'Raj-Koti', note: 'Duo active until 1994' },
  { slug: 'varasudu-1993', title: 'Varasudu', year: 1993, before: 'Koti', after: 'Raj-Koti', note: 'Duo active until 1994' },
  { slug: 'chevilo-puvvu-1990', title: 'Chevilo Puvvu', year: 1990, before: 'Koti', after: 'Raj-Koti', note: 'Duo active until 1994' },
  { slug: 'seetharatnam-gari-abbayi-1992', title: 'Seetharatnam Gari Abbayi', year: 1992, before: 'Koti', after: 'Raj-Koti', note: 'Duo active until 1994' },
  { slug: 'alibaba-aradajanu-dongalu-1993', title: 'Alibaba Aradajanu Dongalu', year: 1993, before: 'Koti', after: 'Raj-Koti', note: 'Duo active until 1994' },
  { slug: 'maga-rayudu-1994', title: 'Maga Rayudu', year: 1994, before: 'Koti', after: 'Raj-Koti', note: 'Duo active until 1994' },
  
  // Individual composers (not duos)
  { slug: 'prema-ishq-kaadhal-2013', title: 'Prema ishq kaadhal', year: 2013, before: 'Shravan', after: 'Shravan Bharadwaj', note: 'Individual composer' },
  { slug: 'mantra-2007', title: 'Mantra', year: 2007, before: 'Anand', after: 'Anand Mukherji', note: 'Individual composer' },
  { slug: 'meeku-meere-maaku-meeme-2016', title: 'Meeku Meere Maaku Meeme', year: 2016, before: 'Shravan', after: 'Shravan Bharadwaj', note: 'Individual composer' },
  { slug: 'alias-janaki-2013', title: 'Alias Janaki', year: 2013, before: 'Shravan', after: 'Shravan Bharadwaj', note: 'Individual composer' },
];

async function applyFixes() {
  console.log(chalk.bold('\n🔧 APPLYING REVIEWED MUSIC DIRECTOR FIXES\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  let applied = 0;
  let notFound = 0;
  let errors = 0;
  
  for (const fix of fixes) {
    try {
      const { data, error: fetchError } = await supabase
        .from('movies')
        .select('id, slug, title_en, music_director')
        .eq('slug', fix.slug)
        .single();
      
      if (fetchError || !data) {
        console.log(chalk.red(`❌ Not found: ${fix.slug}`));
        notFound++;
        continue;
      }
      
      if (data.music_director === fix.after) {
        console.log(chalk.yellow(`⚠️  Already fixed: ${fix.title}`));
        continue;
      }
      
      console.log(chalk.yellow(`\n${fix.title} (${fix.year})`));
      console.log(`  ${chalk.red('BEFORE:')} "${data.music_director}"`);
      console.log(`  ${chalk.green('AFTER:')}  "${fix.after}"`);
      console.log(`  ${chalk.blue('NOTE:')} ${fix.note}`);
      
      const { error: updateError } = await supabase
        .from('movies')
        .update({ music_director: fix.after })
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
  console.log(`  Not found: ${chalk.yellow(notFound)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log();
}

applyFixes().catch(console.error);
