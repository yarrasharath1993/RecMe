#!/usr/bin/env npx tsx
/**
 * Import Awards from Manual Research Batch 1
 * 
 * Usage: npx tsx scripts/import-awards-batch-1.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function red(text: string) { return `${colors.red}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }

// Award data from manual research
const awardsData = [
  {
    slug: 'celeb-murali-mohan',
    name: 'Murali Mohan',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1985, movie: 'O Thandri Theerpu' },
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 2001, movie: 'Preminchu' },
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 2003, movie: 'Vegu Chukkalu' },
      { award_name: 'SIIMA Award', category: 'Lifetime Achievement', year: 2017 },
    ]
  },
  {
    slug: 'celeb-k',
    name: 'K. S. Ravikumar',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Film – Tamil', year: 1998, movie: 'Natpukkaga' },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Director', year: 1994, movie: 'Nattamai' },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Film', year: 1994 },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Film', year: 1998 },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Film', year: 1999 },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Film', year: 2008 },
      { award_name: 'Vijay Award', category: 'Favourite Director', year: 2006 },
    ]
  },
  {
    slug: 'celeb-ramya-krishna',
    name: 'Ramya Krishna',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1998, movie: 'Kante Koothurne Kanu' },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 1999, movie: 'Padayappa' },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actress – Telugu', year: 2009 },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actress – Telugu', year: 2015 },
      { award_name: 'Filmfare Award South', category: 'Best Supporting Actress – Telugu', year: 2017 },
      { award_name: 'Nandi Award', category: 'Best Supporting Actress', year: 2010 },
      { award_name: 'Nandi Award', category: 'Best Supporting Actress', year: 2015 },
      { award_name: 'SIIMA Award', category: 'Best Supporting Actress', year: 2016 },
    ]
  },
  {
    slug: 'kanta-rao',
    name: 'Kanta Rao',
    awards: [
      { award_name: 'Rashtrapati Award', category: 'Best Actor', year: 1961, movie: 'Lava Kusha' },
      { award_name: 'Raghupathi Venkaiah Award', category: 'Lifetime Achievement', year: 2000 },
    ]
  },
  {
    slug: 'celeb-kodi-ramakrishna',
    name: 'Kodi Ramakrishna',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Director', year: 1987, movie: 'Sruthilayalu' },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1991, movie: 'Pelli Pustakam' },
      { award_name: 'Raghupathi Venkaiah Award', category: 'Lifetime Achievement', year: 2012 },
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu', year: 2009, movie: 'Arundhati' },
    ]
  },
  {
    slug: 'celeb-suman',
    name: 'Suman',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1993, movie: 'Bava Bavamaridi' },
      { award_name: 'Tamil Nadu State Film Award', category: 'Best Villain', year: 2007, movie: 'Sivaji' },
    ]
  },
  {
    slug: 'celeb-kodandarami-reddy',
    name: 'A. Kodandarami Reddy',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu (Nominated)', year: 1983, movie: 'Khaidi' },
    ]
  },
  {
    slug: 'celeb-roja',
    name: 'Roja',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actress', year: 1998, movie: 'Swarnakka' },
      { award_name: 'Tamil Nadu State Film Award', category: 'Special Prize', year: 1997, movie: 'Unnidathil Ennai Koduthen' },
    ]
  },
  {
    slug: 'anjali-devi',
    name: 'Anjali Devi',
    awards: [
      { award_name: 'Raghupathi Venkaiah Award', category: 'Lifetime Achievement', year: 1994 },
      { award_name: 'Filmfare Award South', category: 'Lifetime Achievement', year: 1998 },
      { award_name: 'ANR National Award', category: 'Lifetime Achievement', year: 2006 },
    ]
  },
  {
    slug: 'krishnam-raju',
    name: 'Krishnam Raju',
    awards: [
      { award_name: 'National Film Award', category: 'Best Feature Film (Producer)', year: 1986, movie: 'Tandra Paparayudu' },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1977 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1984 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1977 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1978 },
      { award_name: 'Filmfare Award South', category: 'Best Actor – Telugu', year: 1984 },
      { award_name: 'Filmfare Award South', category: 'Lifetime Achievement', year: 2006 },
    ]
  },
  {
    slug: 'celeb-nandamuri-balakrishna',
    name: 'Nandamuri Balakrishna',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2001 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2010 },
      { award_name: 'Nandi Award', category: 'Best Actor', year: 2014 },
      { award_name: 'SIIMA Award', category: 'Best Actor – Telugu', year: 2014, movie: 'Legend' },
    ]
  },
  {
    slug: 'celeb-arjun',
    name: 'Arjun Sarja',
    awards: [
      { award_name: 'Karnataka State Film Award', category: 'Best Actor', year: 1993 },
      { award_name: 'Karnataka State Film Award', category: 'Best Actor', year: 1999 },
      { award_name: 'CineMAA Award', category: 'Best Villain', year: 2012 },
    ]
  },
  {
    slug: 'celeb-b',
    name: 'B. Gopal',
    awards: [
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu', year: 1992 },
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu', year: 1999 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 1997 },
      { award_name: 'Nandi Award', category: 'Best Director', year: 2001 },
    ]
  },
  {
    slug: 'celeb-k-vasu',
    name: 'K. Vasu',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Director', year: 1978 },
    ]
  },
  {
    slug: 'celeb-naresh',
    name: 'Naresh',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Actor', year: 1991, movie: 'Prema Enta Madhuram' },
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 2015 },
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 2017 },
      { award_name: 'Nandi Award', category: 'Special Jury Award', year: 2003 },
    ]
  },
  {
    slug: 'celeb-teja',
    name: 'Teja',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Director', year: 2002, movie: 'Jayam' },
      { award_name: 'Filmfare Award South', category: 'Best Director – Telugu', year: 2002, movie: 'Jayam' },
      { award_name: 'Filmfare Award South', category: 'Best Film - Telugu', year: 2002, movie: 'Jayam' },
    ]
  },
  {
    slug: 'celeb-ajay',
    name: 'Ajay',
    awards: [
      { award_name: 'Nandi Award', category: 'Special Jury Award (Nominated)', year: 2009, movie: 'Vikramarkudu' },
    ]
  },
  {
    slug: 'celeb-ramakrishna',
    name: 'Ramakrishna',
    awards: [
      { award_name: 'Nandi Award', category: 'Best Supporting Actor', year: 1975, movie: 'Gunavanthudu' },
    ]
  },
  {
    slug: 'celeb-lakshmi',
    name: 'Lakshmi',
    awards: [
      { award_name: 'National Film Award', category: 'Best Actress', year: 1977, movie: 'Sila Nerangalil Sila Manithargal' },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1974 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1975 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Telugu', year: 1978 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 1976 },
      { award_name: 'Filmfare Award South', category: 'Best Actress – Tamil', year: 1983 },
      { award_name: 'Filmfare Award South', category: 'Lifetime Achievement', year: 1998 },
    ]
  },
  {
    slug: 'celeb-brahmanandam',
    name: 'Brahmanandam',
    awards: [
      { award_name: 'Padma Shri', category: 'Civilian Honor', year: 2009 },
      { award_name: 'Guinness World Record', category: 'Most screen credits for a living actor', year: 2009 },
      { award_name: 'Nandi Award', category: 'Best Comedian', year: 1987 },
      { award_name: 'Nandi Award', category: 'Best Comedian', year: 1991 },
      { award_name: 'Nandi Award', category: 'Best Comedian', year: 1993 },
      { award_name: 'Nandi Award', category: 'Best Comedian', year: 1994 },
      { award_name: 'Nandi Award', category: 'Best Comedian', year: 2007 },
      { award_name: 'Filmfare Award South', category: 'Best Comedian – Telugu', year: 1992 },
    ]
  },
];

async function importAwards() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           IMPORT AWARDS FROM MANUAL RESEARCH BATCH 1                  ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  let totalAwards = 0;
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let celebritiesUpdated = new Set<string>();

  for (const celeb of awardsData) {
    // Find celebrity by slug
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name_en')
      .eq('slug', celeb.slug)
      .single();

    if (!celebrity) {
      console.log(red(`  ✗ Celebrity not found: ${celeb.slug}`));
      errors++;
      continue;
    }

    console.log(white(`\n  Processing: ${bold(celeb.name)} (${celeb.awards.length} awards)`));

    for (const award of celeb.awards) {
      totalAwards++;

      // Check if award already exists
      const { data: existing } = await supabase
        .from('celebrity_awards')
        .select('id')
        .eq('celebrity_id', celebrity.id)
        .eq('award_name', award.award_name)
        .eq('year', award.year)
        .maybeSingle();

      if (existing) {
        console.log(yellow(`    ⊘ ${award.award_name} (${award.year}) - Already exists`));
        skipped++;
        continue;
      }

      // Insert award
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
        console.log(red(`    ✗ ${award.award_name} (${award.year}) - ${error.message}`));
        errors++;
      } else {
        console.log(green(`    ✓ ${award.award_name} (${award.year}) - ${award.category}${award.movie ? ` [${award.movie}]` : ''}`));
        imported++;
        celebritiesUpdated.add(celebrity.id);
      }
    }
  }

  console.log(cyan(bold('\n╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                        SUMMARY                                         ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  console.log(white(`  Total Awards Processed:    ${totalAwards}`));
  console.log(green(`  ✅ Successfully Imported:  ${imported}`));
  console.log(yellow(`  ⊘ Skipped (Existing):      ${skipped}`));
  if (errors > 0) {
    console.log(red(`  ✗ Errors:                  ${errors}`));
  }
  console.log(white(`  Celebrities Updated:       ${celebritiesUpdated.size}\n`));
}

importAwards().catch(console.error);
