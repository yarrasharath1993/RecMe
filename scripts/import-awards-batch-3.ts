#!/usr/bin/env npx tsx
/**
 * Import Awards from Manual Research Batch 3
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
    slug: 'mohan-babu',
    awards: [
      { award_name: 'Padma Shri', category: 'Civilian Honor', year: 2007 },
      { award_name: 'Filmfare Award South', category: 'Lifetime Achievement', year: 2017 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1995, movie: 'Pedarayudu' },
      { award_name: 'CineMAA Award', category: 'Best Supporting Actor', year: 2007, movie: 'Yamadonga' },
    ]
  },
  {
    slug: 'celeb-bhanumathi',
    awards: [
      { award_name: 'Padma Bhushan', category: 'Civilian Honor', year: 2003 },
      { award_name: 'Padma Shri', category: 'Civilian Honor', year: 1966 },
      { award_name: 'National Film Award', category: 'Best Feature Film - Telugu', year: 1969 },
      { award_name: 'National Film Award', category: 'Best Feature Film - Telugu', year: 1975 },
      { award_name: 'National Film Award', category: 'Best Feature Film - Telugu', year: 1977 },
      { award_name: 'Kalaimamani', category: 'Arts', year: 1983 },
      { award_name: 'Raghupathi Venkaiah Award', category: 'Lifetime Achievement', year: 1985 },
    ]
  },
  {
    slug: 'celeb-tarun',
    awards: [
      { award_name: 'National Film Award', category: 'Best Child Artist', year: 1990, movie: 'Anjali' },
      { award_name: 'Nandi Award', category: 'Best Child Actor', year: 1991 },
      { award_name: 'Nandi Award', category: 'Best Child Actor', year: 1992 },
      { award_name: 'Nandi Award', category: 'Best Child Actor', year: 1993 },
    ]
  },
  {
    slug: 'celeb-nani',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 2023, movie: 'Dasara' },
      { award_name: 'Filmfare Award South', category: 'Critics Best Actor – Telugu', year: 2015, movie: 'Bhale Bhale Magadivoy' },
      { award_name: 'Filmfare Award South', category: 'Critics Best Actor – Telugu', year: 2021, movie: 'Shyam Singha Roy' },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2012, movie: 'Yeto Vellipoyindhi Manasu' },
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 2016, movie: 'Gentleman' },
    ]
  },
  {
    slug: 'kanchana',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actress – Kannada', year: 1970 },
      { award_name: 'Nandi Award', category: 'Best Supporting Actress', year: 2004, movie: 'Arjun' },
    ]
  },
  {
    slug: 'celeb-relangi-narasimha-rao',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Director for Children\'s Film', year: 1985 },
    ]
  },
  {
    slug: 'celeb-madhavi',
    awards: [
      { award_name: 'Kerala State Film Award', category: 'Best Actress', year: 1983 },
      { award_name: 'Kerala State Film Award', category: 'Best Actress', year: 1984 },
      { award_name: 'Kerala State Film Award', category: 'Best Actress', year: 1986 },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1993, movie: 'Matru Devo Bhava' },
    ]
  },
  {
    slug: 'celeb-venu',
    awards: [
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 1999, movie: 'Swayamvaram' },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2000 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2001 },
    ]
  },
  {
    slug: 'anushka-shetty',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 2009, movie: 'Arundhati' },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 2014, movie: 'Rudramadevi' },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 2018, movie: 'Baahubali 2' },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 2008, movie: 'Arundhati' },
      { award_name: 'Kalaimamani', category: 'Arts', year: 2011 },
    ]
  },
  {
    slug: 'celeb-trisha',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2005 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2007 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 2007, movie: 'Aadavari Mataluku Arthale Verule' },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2016 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2018 },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 2007, movie: 'Aadavari Mataluku Arthale Verule' },
      { award_name: 'Kalaimamani', category: 'Arts', year: 2010 },
    ]
  },
  {
    slug: 'celeb-sivaji',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Male Dubbing Artist', year: 2005 },
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 2008 },
    ]
  },
  {
    slug: 'celeb-vamsy',
    awards: [
      { award_name: 'National Film Award', category: 'Best Feature Film in Telugu', year: 1984, movie: 'Sitaara' },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1984 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1987 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1991 },
    ]
  },
  {
    slug: 'celeb-muthyala-subbaiah',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Director', year: 1996, movie: 'Pavitra Bandham' },
    ]
  },
  {
    slug: 'celeb-bapu',
    awards: [
      { award_name: 'Padma Shri', category: 'Civilian Honor', year: 2013 },
      { award_name: 'National Film Award', category: 'Best Feature Film in Telugu', year: 1977, movie: 'Muthyala Muggu' },
      { award_name: 'National Film Award', category: 'Best Feature Film in Telugu', year: 1982, movie: 'Meghasandesam' },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1977 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1982 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1987 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1991 },
      { award_name: 'Nandi Award', category: 'Best Story Writer', year: 2005 },
      { award_name: 'Nandi Award', category: 'Best Art Director', year: 2008 },
      { award_name: 'Raghupathi Venkaiah Award', category: 'Lifetime Achievement', year: 2010 },
    ]
  },
  {
    slug: 'celeb-sunil',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2010, movie: 'Maryada Ramanna' },
      { award_name: 'Nandi Award', category: 'Best Comedian', year: 2001, movie: 'Nuvvu Nenu' },
      { award_name: 'Nandi Award', category: 'Best Comedian', year: 2005, movie: 'Andhrudu' },
    ]
  },
  {
    slug: 'celeb-shobana',
    awards: [
      { award_name: 'Padma Shri', category: 'Civilian Honor', year: 2006 },
      { award_name: 'National Film Award', category: 'Best Actress', year: 1994, movie: 'Manichitrathazhu' },
      { award_name: 'National Film Award', category: 'Best Actress', year: 2000, movie: 'Mitr: My Friend' },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Malayalam', year: 1994 },
    ]
  },
  {
    slug: 'nayanthara',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2006 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2010 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 2011, movie: 'Sri Rama Rajyam' },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2013 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 2016 },
      { award_name: 'Nandi Award', category: 'Best Actress', year: 2011, movie: 'Sri Rama Rajyam' },
      { award_name: 'Kalaimamani', category: 'Arts', year: 2010 },
    ]
  },
  {
    slug: 'celeb-ram-gopal-varma',
    awards: [
      { award_name: 'National Film Award', category: 'Best Feature Film in Telugu', year: 1989, movie: 'Siva' },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1989 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1992 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1995 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1998 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 2002 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 2005 },
      { award_name: 'Nandi Award', category: 'Best Screenplay Writer', year: 2007 },
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu', year: 1992 },
    ]
  },
  {
    slug: 'celeb-raasi',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1997, movie: 'Gokulamlo Seetha' },
    ]
  },
  {
    slug: 'celeb-rohit',
    awards: [
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 2001, movie: '6 Teens' },
    ]
  },
];

async function importAwards() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT AWARDS BATCH 3                                        ║');
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
