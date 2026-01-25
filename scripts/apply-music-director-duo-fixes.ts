#!/usr/bin/env npx tsx
/**
 * Apply music director duo fixes based on 1994 split
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

interface MusicDirectorFix {
  slug: string;
  title: string;
  year: number;
  current: string;
  correct: string;
}

const musicDirectorFixes: MusicDirectorFix[] = [
  // Pre-1994: Should be Raj-Koti
  { slug: 'agni-pravesam-1990', title: 'Agni Pravesam', year: 1990, current: 'Koti', correct: 'Raj-Koti' },
  { slug: 'lakshyam-1993', title: 'Lakshyam', year: 1993, current: 'Koti', correct: 'Raj-Koti' },
  { slug: 'varasudu-1993', title: 'Varasudu', year: 1993, current: 'Koti', correct: 'Raj-Koti' },
  { slug: 'chevilo-puvvu-1990', title: 'Chevilo Puvvu', year: 1990, current: 'Koti', correct: 'Raj-Koti' },
  { slug: 'maga-rayudu-1994', title: 'Maga Rayudu', year: 1994, current: 'Koti', correct: 'Raj-Koti' },
  { slug: 'seetharatnam-gari-abbayi-1992', title: 'Seetharatnam Gari Abbayi', year: 1992, current: 'Koti', correct: 'Raj-Koti' },
  { slug: 'alibaba-aradajanu-dongalu-1993', title: 'Alibaba Aradajanu Dongalu', year: 1993, current: 'Koti', correct: 'Raj-Koti' },
  
  // Post-1994: Should be solo Koti or Raj
  { slug: 'telugu-veera-levara-1995', title: 'Telugu Veera Levara', year: 1995, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'ramasakkanodu-1999', title: 'Ramasakkanodu', year: 1999, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'maa-nannaki-pelli-1997', title: 'Maa Nannaki Pelli', year: 1997, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'maa-aavida-meeda-ottu-mee-aavida-chala-manchidi-2001', title: 'Maa Aavida Meeda...', year: 2001, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'premante-inte-2006', title: 'Premante Inte', year: 2006, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'preminchukunnam-pelliki-randi-2004', title: 'Preminchukunnam Pelliki Randi', year: 2004, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'nuvvu-naaku-nachav-2001', title: 'Nuvvu Naaku Nachav', year: 2001, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'chilakapachcha-kaapuram-1995', title: 'Chilakapachcha Kaapuram', year: 1995, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'alluda-majaka-1995', title: 'Alluda Majaka', year: 1995, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'ketu-duplicatu-1995', title: 'Ketu Duplicatu', year: 1995, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'kshetram-2011', title: 'Kshetram', year: 2011, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'nuvvante-naakishtam-2005', title: 'Nuvvante Naakishtam', year: 2005, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'yamajathakudu-1999', title: 'Yamajathakudu', year: 1999, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'vijayam-2003', title: 'Vijayam', year: 2003, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'kathi-kanta-rao-2010', title: 'Kathi Kanta Rao', year: 2010, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'buridi-2010', title: 'Buridi', year: 2010, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'blade-babji-2008', title: 'Blade Babji', year: 2008, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'hitler-1997', title: 'Hitler', year: 1997, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'pape-naa-pranam-1998', title: 'Pape Naa Pranam', year: 1998, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'sisindri-1995', title: 'Sisindri', year: 1995, current: 'Raj-Koti', correct: 'Raj' },
  { slug: 'adavi-dora-1995', title: 'Adavi Dora', year: 1995, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'raaj-2011', title: 'Raaj', year: 2011, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'chinni-chinni-aasa-1999', title: 'Chinni Chinni Aasa', year: 1999, current: 'Raj-Koti', correct: 'Raj' },
  { slug: 'aayanaki-iddaru-1995', title: 'Aayanaki Iddaru', year: 1995, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'nuvve-kavali-2000', title: 'Nuvve Kavali', year: 2000, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'rikshavodu-1995', title: 'Rikshavodu', year: 1995, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'veedekkadi-mogudandi-2001', title: 'Veedekkadi Mogudandi?', year: 2001, current: 'Raj-Koti', correct: 'Koti' },
  { slug: 'mrugam-1996', title: 'Mrugam', year: 1996, current: 'Raj-Koti', correct: 'Raj' },
];

async function applyMusicDirectorFixes() {
  console.log(chalk.bold('\n🔧 APPLYING MUSIC DIRECTOR DUO FIXES (1994 Split)\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  let applied = 0;
  let notFound = 0;
  let errors = 0;
  let alreadyCorrect = 0;
  
  for (const fix of musicDirectorFixes) {
    try {
      const { data, error: fetchError } = await supabase
        .from('movies')
        .select('id, slug, title_en, release_year, music_director')
        .eq('slug', fix.slug)
        .single();
      
      if (fetchError || !data) {
        console.log(chalk.red(`❌ Not found: ${fix.slug}`));
        notFound++;
        continue;
      }
      
      const currentMD = data.music_director || '';
      if (currentMD === fix.correct) {
        alreadyCorrect++;
        continue;
      }
      
      console.log(chalk.yellow(`\n${fix.title} (${data.release_year})`));
      console.log(`  ${chalk.red('BEFORE:')} "${currentMD || 'N/A'}"`);
      console.log(`  ${chalk.green('AFTER:')}  "${fix.correct}"`);
      
      const { error: updateError } = await supabase
        .from('movies')
        .update({ music_director: fix.correct })
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
  console.log(`  Already correct: ${chalk.yellow(alreadyCorrect)}`);
  console.log(`  Not found: ${chalk.yellow(notFound)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log();
}

applyMusicDirectorFixes().catch(console.error);
