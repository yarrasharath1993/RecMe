#!/usr/bin/env npx tsx
/**
 * Revert incorrect music director duo fixes
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

// Revert these specific incorrect fixes
const REVERTS = [
  { slug: 'prema-ishq-kaadhal-2013', from: 'Nadeem-Shravan', to: 'Shravan' },
  { slug: 'mantra-2007', from: 'Anand-Milind', to: 'Anand' },
  { slug: 'meeku-meere-maaku-meeme-2016', from: 'Nadeem-Shravan', to: 'Shravan' },
  { slug: 'alias-janaki-2013', from: 'Nadeem-Shravan', to: 'Shravan' },
];

async function revert() {
  console.log(chalk.bold('\n🔄 REVERTING INCORRECT MUSIC DIRECTOR FIXES\n'));
  
  for (const r of REVERTS) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, slug, title_en, music_director')
      .eq('slug', r.slug)
      .single();
    
    if (error || !data) {
      console.log(chalk.red(`❌ Not found: ${r.slug}`));
      continue;
    }
    
    if (data.music_director === r.from) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ music_director: r.to })
        .eq('id', data.id);
      
      if (updateError) {
        console.log(chalk.red(`❌ Error reverting ${r.slug}: ${updateError.message}`));
      } else {
        console.log(chalk.green(`✅ ${data.title_en}: "${r.from}" → "${r.to}"`));
      }
    } else {
      console.log(chalk.yellow(`⚠️  ${data.title_en}: Already "${data.music_director}" (expected "${r.from}")`));
    }
  }
  
  console.log(chalk.green('\n✅ REVERTS COMPLETE\n'));
}

revert().catch(console.error);
