#!/usr/bin/env npx tsx
/**
 * Import Awards from Manual Research Batch 2
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
    slug: 'celeb-vishnu',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Male Debut – South', year: 2003, movie: 'Vishnu' },
      { award_name: 'Santosh Film Award', category: 'Best Actor', year: 2025 },
    ]
  },
  {
    slug: 'krishna-kumari',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1974, movie: 'Chandana' },
      { award_name: 'Raghupathi Venkaiah Award', category: 'Lifetime Achievement', year: 2003 },
    ]
  },
  {
    slug: 'celeb-siva',
    awards: [
      { award_name: 'Zee Cine Awards Tamil', category: 'Favorite Director', year: 2020, movie: 'Viswasam' },
    ]
  },
  {
    slug: 'celeb-satyanarayana',
    awards: [
      { award_name: 'Raghupathi Venkaiah Award', category: 'Lifetime Achievement', year: 2011 },
      { award_name: 'Filmfare Award South', category: 'Lifetime Achievement', year: 2017 },
      { award_name: 'Nandi Award', category: 'Best Feature Film (Producer)', year: 1994, movie: 'Bangaru Kutumbam' },
    ]
  },
  {
    slug: 'celeb-sarath',
    awards: [
      { award_name: 'Nandi Award', category: 'Best First Film of a Director', year: 1991, movie: 'Amma' },
    ]
  },
  {
    slug: 'celeb-tamannaah-bhatia',
    awards: [
      { award_name: 'Kalaimamani Award', category: 'Arts', year: 2010 },
      { award_name: 'SIIMA Award', category: 'Best Actress (Critics) – Telugu', year: 2014, movie: 'Tadakha' },
      { award_name: 'Santosham Film Award', category: 'Best Actress', year: 2012 },
      { award_name: 'Santosham Film Award', category: 'Best Actress', year: 2016 },
      { award_name: 'Santosham Film Award', category: 'Best Actress', year: 2020 },
    ]
  },
  {
    slug: 'celeb-ram',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Male Debut – South', year: 2006, movie: 'Devadasu' },
      { award_name: 'Zee Cine Awards Telugu', category: 'Sensational Star of the Year', year: 2020 },
    ]
  },
  {
    slug: 'jamuna',
    awards: [
      { award_name: 'Filmfare Award', category: 'Best Supporting Actress – Hindi', year: 1967, movie: 'Milan' },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1968, movie: 'Pandanti Kapuram' },
      { award_name: 'Filmfare Award South', category: 'Lifetime Achievement', year: 2008 },
    ]
  },
  {
    slug: 'celeb-ali',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Child Actor', year: 1981 },
      { award_name: 'Nandi Award', category: 'Best Comedian', year: 1994 },
      { award_name: 'Nandi Award', category: 'Best Comedian', year: 1996 },
      { award_name: 'Filmfare Award South', category: 'Best Comedian – Telugu', year: 2003 },
      { award_name: 'Filmfare Award South', category: 'Best Comedian – Telugu', year: 2005 },
    ]
  },
  {
    slug: 'celeb-vanisri',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1973 },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1974 },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1975 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1973 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1974 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1975 },
      { award_name: 'Raghupathi Venkaiah Award', category: 'Lifetime Achievement', year: 2013 },
    ]
  },
  {
    slug: 'celeb-daggubati-venkatesh',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1988 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1989 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1991 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1995 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1996 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1999 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2007 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1988 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1989 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1991 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1996 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1999 },
      { award_name: 'SIIMA Award', category: 'Best Actor – Telugu', year: 2021 },
    ]
  },
  {
    slug: 'celeb-karthik',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actor – Tamil', year: 1988 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Tamil', year: 1990 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Tamil', year: 1993 },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Actor', year: 1981 },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Actor', year: 1988 },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Actor', year: 1990 },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Actor', year: 1998 },
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 1987, movie: 'Abhinandana' },
    ]
  },
  {
    slug: 'celeb-sukumar',
    awards: [
      { award_name: 'National Film Award', category: 'Best Feature Film – Telugu', year: 2021, movie: 'Uppena' },
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu', year: 2004 },
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu', year: 2018 },
      { award_name: 'Nandi Award', category: 'Best Screenplay', year: 2004 },
      { award_name: 'B.N. Reddy National Award', category: 'Lifetime Achievement', year: 2025 },
    ]
  },
  {
    slug: 'jayasudha',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1979 },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1985 },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1989 },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1991 },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1993 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1976 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1979 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1981 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1985 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1988 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1989 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1996 },
      { award_name: 'Filmfare Award South', category: 'Lifetime Achievement', year: 2010 },
    ]
  },
  {
    slug: 'celeb-anjali',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2010 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2011 },
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 2013, movie: 'Seethamma Vakitlo Sirimalle Chettu' },
      { award_name: 'SIIMA Award', category: 'Best Actress (Critics) – Telugu', year: 2014 },
    ]
  },
  {
    slug: 'celeb-siddharth',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 2006, movie: 'Bommarillu' },
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 2005, movie: 'Nuvvostanante Nenoddantana' },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actor – Tamil', year: 2023 },
    ]
  },
  {
    slug: 'srikanth',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 2011, movie: 'Mahatma' },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1995 },
      { award_name: 'SIIMA Award', category: 'Best Supporting Actor', year: 2016 },
      { award_name: 'SIIMA Award', category: 'Best Supporting Actor', year: 2021 },
    ]
  },
  {
    slug: 'vijaya-nirmala',
    awards: [
      { award_name: 'Raghupathi Venkaiah Award', category: 'Lifetime Achievement', year: 2008 },
      { award_name: 'Guinness World Record', category: 'Most films directed by a female', year: 2002 },
    ]
  },
  {
    slug: 'sridevi',
    awards: [
      { award_name: 'National Film Award', category: 'Best Actress', year: 2017, movie: 'Mom' },
      { award_name: 'Padma Shri', category: 'Civilian Honor', year: 2013 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1991, movie: 'Kshana Kshanam' },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1991 },
    ]
  },
  {
    slug: 'celeb-rajendra-prasad',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1991 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2004 },
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 2015 },
      { award_name: 'SIIMA Award', category: 'Best Supporting Actor', year: 2016 },
      { award_name: 'SIIMA Award', category: 'Best Supporting Actor', year: 2021 },
    ]
  },
];

async function importAwards() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT AWARDS BATCH 2                                        ║');
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
          category: award.category,
          year: award.year,
          movie_title: award.movie || null,
          is_won: true,
          is_nomination: false,
        });

      if (error) {
        console.log('\x1b[31m  ✗\x1b[0m', award.award_name, '(' + award.year + ') -', error.message);
        errors++;
      } else {
        console.log('\x1b[32m  ✓\x1b[0m', award.award_name, '(' + award.year + ') -', award.category, award.movie ? '[' + award.movie + ']' : '');
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
}

importAwards().catch(console.error);
