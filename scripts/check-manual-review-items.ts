#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkManualReview() {
  console.log(chalk.bold('\n🔍 CHECKING ITEMS REQUIRING MANUAL REVIEW\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');

  const items = [
    { slug: '1st-iifa-utsavam-2015', title: '1st IIFA Utsavam', issue: 'Award Ceremony - User marked as REJECTED' },
    { slug: 'siddhalingeshwara-mahima-1981', title: 'Siddhalingeshwara Mahima', issue: 'Missing lead cast' },
    { slug: 'manasulo-maata-1996', title: 'Manasulo Maata', issue: 'Missing lead cast (should be fixed)' },
    { slug: 'meri-warrant-2010', title: 'Meri Warrant', issue: 'Missing lead cast (should be fixed)' },
  ];

  for (const item of items) {
    const { data } = await supabase
      .from('movies')
      .select('id, slug, title_en, hero, heroine, release_year')
      .eq('slug', item.slug)
      .single();

    if (!data) {
      console.log(chalk.red(`❌ ${item.title}: Not found in database`));
      continue;
    }

    const hasLeadCast = data.hero || data.heroine;
    const status = hasLeadCast ? chalk.green('✅ FIXED') : chalk.yellow('⚠️  NEEDS REVIEW');

    console.log(`${status} ${item.title} (${data.release_year})`);
    console.log(`   Issue: ${item.issue}`);
    console.log(`   Hero: ${data.hero || 'MISSING'}`);
    console.log(`   Heroine: ${data.heroine || 'MISSING'}`);
    console.log();
  }

  console.log(chalk.bold('═'.repeat(70)));
  console.log(chalk.bold('\n📋 SUMMARY\n'));
  console.log('Items that may need manual review:');
  console.log('  1. "1st IIFA Utsavam" - Award ceremony (user rejected fix)');
  console.log('  2. "Siddhalingeshwara Mahima" - Missing lead cast (needs research)');
  console.log();
}

checkManualReview().catch(console.error);
