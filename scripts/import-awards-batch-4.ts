#!/usr/bin/env npx tsx
/**
 * Import Awards from Manual Research Batch 4
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
    slug: 'celeb-v-nagayya',
    awards: [
      { award_name: 'Padma Shri', category: 'Civilian Honor', year: 1965 },
      { award_name: 'National Film Award', category: 'Best Feature Film in Telugu', year: 1964, movie: 'Ramadasu' },
    ]
  },
  {
    slug: 'celeb-shruti-haasan',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 2014, movie: 'Race Gurram' },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 2015 },
      { award_name: 'SIIMA Award', category: 'Best Actress', year: 2012 },
      { award_name: 'SIIMA Award', category: 'Best Actress', year: 2013 },
      { award_name: 'SIIMA Award', category: 'Best Actress', year: 2014 },
      { award_name: 'SIIMA Award', category: 'Best Actress', year: 2015 },
      { award_name: 'SIIMA Award', category: 'Best Actress', year: 2016 },
      { award_name: 'SIIMA Award', category: 'Best Actress', year: 2017 },
      { award_name: 'SIIMA Award', category: 'Best Actress', year: 2018 },
    ]
  },
  {
    slug: 'celeb-sarath-babu',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 1981 },
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 1988 },
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 1989 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1986 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1990 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1991 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1994 },
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 2000 },
    ]
  },
  {
    slug: 'celeb-krishna-vamsi',
    awards: [
      { award_name: 'National Film Award', category: 'Best Feature Film in Telugu', year: 1996, movie: 'Ninne Pelladatha' },
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu', year: 1996 },
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu', year: 1999 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1996 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1999 },
      { award_name: 'Nandi Award', category: 'Best Screenplay', year: 2003 },
    ]
  },
  {
    slug: 'celeb-geetha',
    awards: [
      { award_name: 'Kerala State Film Award', category: 'Second Best Actress', year: 1990 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Kannada', year: 1984 },
    ]
  },
  {
    slug: 'celeb-sagar',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Director', year: 1999, movie: 'Ramasakkanodu' },
      { award_name: 'Nandi Award', category: 'Best Feature Film', year: 1999, movie: 'Ramasakkanodu' },
    ]
  },
  {
    slug: 'jaggayya',
    awards: [
      { award_name: 'Padma Bhushan', category: 'Civilian Honor', year: 1992 },
      { award_name: 'National Film Award', category: 'Best Actor', year: 1965 },
    ]
  },
  {
    slug: 'celeb-shriya-saran',
    awards: [
      { award_name: 'SIIMA Award', category: 'Best Actress', year: 2017, movie: 'Gautamiputra Satakarni' },
      { award_name: 'ITFA Award', category: 'Best Actress', year: 2017 },
    ]
  },
  {
    slug: 'celeb-nithiin',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Male Debut – South', year: 2002, movie: 'Jayam' },
    ]
  },
  {
    slug: 'celeb-dulquer-salmaan',
    awards: [
      { award_name: 'National Film Award', category: 'Special Mention', year: 2019, movie: 'Mahanati' },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Malayalam', year: 2013 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Malayalam', year: 2015 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Malayalam', year: 2016 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Malayalam', year: 2018 },
      { award_name: 'Kerala State Film Award', category: 'Best Actor', year: 2017 },
      { award_name: 'Kerala State Film Award', category: 'Special Jury Award', year: 2020 },
    ]
  },
  {
    slug: 'celeb-suresh-krissna',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Director', year: 1989, movie: 'Prema' },
    ]
  },
  {
    slug: 'k-balachander',
    awards: [
      { award_name: 'National Film Award', category: 'Best Feature Film in Tamil', year: 1973 },
      { award_name: 'National Film Award', category: 'Best Feature Film in Tamil', year: 1977 },
      { award_name: 'National Film Award', category: 'Best Feature Film in Tamil', year: 1980 },
      { award_name: 'National Film Award', category: 'Best Feature Film in Tamil', year: 1982 },
      { award_name: 'National Film Award', category: 'Best Screenplay', year: 1991 },
      { award_name: 'National Film Award', category: 'Best Feature Film in Tamil', year: 1996 },
      { award_name: 'National Film Award', category: 'Best Feature Film in Tamil', year: 2000 },
      { award_name: 'Dadasaheb Phalke Award', category: 'Lifetime Achievement', year: 2011 },
      { award_name: 'Padma Shri', category: 'Civilian Honor', year: 1987 },
      { award_name: 'Filmfare Award South', category: 'Best Director – Tamil', year: 1974 },
      { award_name: 'Filmfare Award South', category: 'Best Director – Tamil', year: 1977 },
      { award_name: 'Filmfare Award South', category: 'Best Director – Tamil', year: 1978 },
      { award_name: 'Filmfare Award South', category: 'Best Director – Tamil', year: 1980 },
      { award_name: 'Filmfare Award South', category: 'Lifetime Achievement', year: 1998 },
    ]
  },
  {
    slug: 'celeb-prakash-raj',
    awards: [
      { award_name: 'National Film Award', category: 'Best Actor', year: 2007, movie: 'Kanchivaram' },
      { award_name: 'National Film Award', category: 'Best Supporting Actor', year: 1998 },
      { award_name: 'National Film Award', category: 'Best Supporting Actor', year: 2003 },
      { award_name: 'National Film Award', category: 'Best Supporting Actor', year: 2008 },
      { award_name: 'National Film Award', category: 'Best Supporting Actor', year: 2009 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Tamil', year: 2007 },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actor – Telugu', year: 2003 },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actor – Telugu', year: 2008 },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actor – Telugu', year: 2009 },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actor – Kannada', year: 2010 },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actor – Telugu', year: 2011 },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actor – Tamil', year: 2014 },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actor – Telugu', year: 2016 },
      { award_name: 'Nandi Award', category: 'Best Villain', year: 2003 },
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 2008 },
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 2010 },
    ]
  },
];

async function importAwards() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT AWARDS BATCH 4                                        ║');
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
