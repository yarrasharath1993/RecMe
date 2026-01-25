#!/usr/bin/env npx tsx
/**
 * Import Awards from Manual Research Batch 5 (FINAL BATCH!)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const awardsData = [
  {
    slug: 'celeb-p-chandrasekhara-reddy',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Director', year: 1985 },
    ]
  },
  {
    slug: 'celeb-ravi-raja-pinisetty',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu (Nomination)', year: 1992, movie: 'Chanti' },
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu (Nomination)', year: 1995, movie: 'Gharana Mogudu' },
    ]
  },
  {
    slug: 'celeb-varun-sandesh',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Male Debut – South (Nomination)', year: 2007, movie: 'Happy Days' },
      { award_name: 'Nandi Award', category: 'Best Actor (Nomination)', year: 2008, movie: 'Kotha Bangaru Lokam' },
    ]
  },
  {
    slug: 'celeb-rajani',
    awards: [
      { award_name: 'Cinema Express Award', category: 'Best Actress', year: 1982 },
      { award_name: 'Cinema Express Award', category: 'Best Actress', year: 1984 },
    ]
  },
];

async function importAwards() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT AWARDS BATCH 5 - FINAL BATCH! 🎉                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m\n');

  let totalAwards = 0;
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const celeb of awardsData) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name_en')
      .eq('slug', celeb.slug)
      .single();

    if (!celebrity) {
      console.log('\x1b[31m✗\x1b[0m Celebrity not found:', celeb.slug);
      errors++;
      continue;
    }

    console.log('\x1b[37m\nProcessing: \x1b[1m' + celebrity.name_en + '\x1b[0m (' + celeb.awards.length + ' awards)');

    for (const award of celeb.awards) {
      totalAwards++;

      // For nominations, we'll store them as is_nomination=true
      const isNomination = award.category?.includes('Nomination');
      const cleanCategory = award.category?.replace(' (Nomination)', '') || award.category;

      const { data: existing } = await supabase
        .from('celebrity_awards')
        .select('id')
        .eq('celebrity_id', celebrity.id)
        .eq('award_name', award.award_name)
        .eq('year', award.year)
        .maybeSingle();

      if (existing) {
        console.log('\x1b[33m  ⊘\x1b[0m', award.award_name, '(' + award.year + ') - Already exists');
        skipped++;
        continue;
      }

      const { error } = await supabase
        .from('celebrity_awards')
        .insert({
          celebrity_id: celebrity.id,
          award_name: award.award_name,
          category: cleanCategory,
          year: award.year,
          movie_title: award.movie || null,
          is_won: !isNomination,
          is_nomination: isNomination,
        });

      if (error) {
        console.log('\x1b[31m  ✗\x1b[0m', award.award_name, '(' + award.year + ') -', error.message);
        errors++;
      } else {
        const suffix = isNomination ? '(Nomination)' : '';
        console.log('\x1b[32m  ✓\x1b[0m', award.award_name, '(' + award.year + ') -', cleanCategory, award.movie ? '[' + award.movie + ']' : '', suffix);
        imported++;
      }
    }
  }

  console.log('\n\x1b[36m\x1b[1m╔═══════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m\x1b[1m║                        SUMMARY                                         ║\x1b[0m');
  console.log('\x1b[36m\x1b[1m╚═══════════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  console.log('Total Awards Processed:   ', totalAwards);
  console.log('\x1b[32m✅ Successfully Imported: \x1b[0m', imported);
  console.log('\x1b[33m⊘ Skipped (Existing):     \x1b[0m', skipped);
  if (errors > 0) {
    console.log('\x1b[31m✗ Errors:                 \x1b[0m', errors);
  }
  console.log('Celebrities Updated:      ', awardsData.length, '\n');
  
  console.log('\x1b[32m\x1b[1m🎊 BATCH 5 COMPLETE! ALL 5 BATCHES FINISHED! 🎊\x1b[0m\n');
}

importAwards().catch(console.error);
