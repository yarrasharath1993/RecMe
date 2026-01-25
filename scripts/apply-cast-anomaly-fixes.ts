#!/usr/bin/env npx tsx
/**
 * Apply cast anomaly fixes (DUPLICATE_CAST and GENDER_SWAP)
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
  year: number;
  issue_type: 'DUPLICATE_CAST' | 'GENDER_SWAP';
  current_value: string;
  suggested_fix: string;
}

const fixes: Fix[] = [
  // DUPLICATE_CAST fixes
  { id: '07540f9d', slug: 'kaboye-alludu-1987', title: 'Kaboye Alludu', year: 1987, issue_type: 'DUPLICATE_CAST', current_value: 'Rajendra Prasad=Rajendra Prasad', suggested_fix: 'Hero: Rajendra Prasad; Heroine: Shanthi Priya' },
  { id: '5356abfd', slug: 'sabadham-1971', title: 'Sabadham', year: 1971, issue_type: 'DUPLICATE_CAST', current_value: 'K R Vijaya=K R Vijaya', suggested_fix: 'Hero: Ravichandran; Heroine: K R Vijaya' },
  { id: '4ba0b6d2', slug: 'ladies-special-1993', title: 'Ladies Special', year: 1993, issue_type: 'DUPLICATE_CAST', current_value: 'Vani Viswanath=Vani Viswanath', suggested_fix: 'Hero: Suresh; Heroine: Vani Viswanath' },
  { id: '6b65d95e', slug: 'punnami-nagu-2009', title: 'Punnami Nagu', year: 2009, issue_type: 'DUPLICATE_CAST', current_value: 'Mumaith Khan=Mumaith Khan', suggested_fix: 'Hero: Rajiv Kanakala; Heroine: Mumaith Khan' },
  { id: '68b76cbe', slug: 'o-amma-katha-1981', title: 'O Amma Katha', year: 1981, issue_type: 'DUPLICATE_CAST', current_value: 'Sharada=Sharada', suggested_fix: 'Hero: Murali Mohan; Heroine: Sharada' },
  { id: 'ac66122d', slug: 'nimajjanam-1979', title: 'Nimajjanam', year: 1979, issue_type: 'DUPLICATE_CAST', current_value: 'Sharada=Sharada', suggested_fix: 'Hero: Chakrapani; Heroine: Sharada' },
  { id: '4d45fe33', slug: 'dongata-2015', title: 'Dongata', year: 2015, issue_type: 'DUPLICATE_CAST', current_value: 'Lakshmi Manchu=Lakshmi Manchu', suggested_fix: 'Hero: Adivi Sesh; Heroine: Lakshmi Manchu' },
  { id: 'f59600c8', slug: 'avunu-2012', title: 'Avunu', year: 2012, issue_type: 'DUPLICATE_CAST', current_value: 'Poorna=Poorna', suggested_fix: 'Hero: Harshvardhan Rane; Heroine: Poorna' },
  { id: 'ad8e815a', slug: 'mr-medhavi-2008', title: 'Mr. Medhavi', year: 2008, issue_type: 'DUPLICATE_CAST', current_value: 'Genelia D\'Souza=Genelia D\'Souza', suggested_fix: 'Hero: Raja; Heroine: Genelia D\'Souza' },
  { id: '5cdec616', slug: 'indian-beauty-2006', title: 'Indian Beauty', year: 2006, issue_type: 'DUPLICATE_CAST', current_value: 'Brahmanandam=Brahmanandam', suggested_fix: 'Hero: Collin Mcgee; Heroine: Mellisa' },
  { id: 'b1bd8f44', slug: 'jeevana-ganga-1988', title: 'Jeevana Ganga', year: 1988, issue_type: 'DUPLICATE_CAST', current_value: 'Rajendra Prasad=Rajendra Prasad', suggested_fix: 'Hero: Rajendra Prasad; Heroine: Aneeta' },
  { id: 'b6e053d0', slug: 'lanka-2017', title: 'Lanka', year: 2017, issue_type: 'DUPLICATE_CAST', current_value: 'Raai Laxmi=Raai Laxmi', suggested_fix: 'Hero: Saikumar; Heroine: Raai Laxmi' },
  { id: '017a991a', slug: 'dirty-hari-2020', title: 'Dirty Hari', year: 2020, issue_type: 'DUPLICATE_CAST', current_value: 'Ruhani Sharma=Ruhani Sharma', suggested_fix: 'Hero: Shravan Reddy; Heroine: Ruhani Sharma' },
  { id: '811886cc', slug: 'subhalagnam-1994', title: 'Subhalagnam', year: 1994, issue_type: 'DUPLICATE_CAST', current_value: 'Aamani=Aamani', suggested_fix: 'Hero: Jagapathi Babu; Heroine: Aamani' },
  { id: 'd4e7f828', slug: 'maisamma-ips-2007', title: 'Maisamma IPS', year: 2007, issue_type: 'DUPLICATE_CAST', current_value: 'Mumaith Khan=Mumaith Khan', suggested_fix: 'Hero: Sayaji Shinde; Heroine: Mumaith Khan' },
  { id: '1aab7604', slug: 'abhishekam-1998', title: 'Abhishekam', year: 1998, issue_type: 'DUPLICATE_CAST', current_value: 'Rachana Banerjee=Rachana Banerjee', suggested_fix: 'Hero: Suman; Heroine: Rachana Banerjee' },
  { id: 'c1c23ba0', slug: 'pournami-2006', title: 'Pournami', year: 2006, issue_type: 'DUPLICATE_CAST', current_value: 'Trisha Krishnan=Trisha Krishnan', suggested_fix: 'Hero: Prabhas; Heroine: Trisha Krishnan' },
  { id: '6dd488ad', slug: 'mantra-2007', title: 'Mantra', year: 2007, issue_type: 'DUPLICATE_CAST', current_value: 'Charmy Kaur=Charmy Kaur', suggested_fix: 'Hero: Shivaji; Heroine: Charmy Kaur' },
  { id: '96abd3df', slug: 'sri-renukadevi-mahatyam-1978', title: 'Sri Renukadevi Mahatyam', year: 1978, issue_type: 'DUPLICATE_CAST', current_value: 'B. Saroja Devi=B. Saroja Devi', suggested_fix: 'Hero: Jayachitra; Heroine: B. Saroja Devi' },
  { id: '064e67d9', slug: 'missamma-2003', title: 'Missamma', year: 2003, issue_type: 'DUPLICATE_CAST', current_value: 'Bhumika Chawla=Bhumika Chawla', suggested_fix: 'Hero: Sivaji; Heroine: Bhumika Chawla' },
  { id: 'cafa7d86', slug: 'katha-2009', title: 'Katha', year: 2009, issue_type: 'DUPLICATE_CAST', current_value: 'Genelia D\'Souza=Genelia D\'Souza', suggested_fix: 'Hero: Arun Sarma; Heroine: Genelia D\'Souza' },
  { id: 'd4b041d2', slug: 'devi-1999', title: 'Devi', year: 1999, issue_type: 'DUPLICATE_CAST', current_value: 'Prema=Prema', suggested_fix: 'Hero: Pruthvi Raj; Heroine: Prema' },
  { id: '469ef0c5', slug: 'amaravathi-2009', title: 'Amaravathi', year: 2009, issue_type: 'DUPLICATE_CAST', current_value: 'Bhumika Chawla=Bhumika Chawla', suggested_fix: 'Hero: Taraka Ratna; Heroine: Bhumika Chawla' },
  { id: 'a247e5d1', slug: 'daasi-1988', title: 'Daasi', year: 1988, issue_type: 'DUPLICATE_CAST', current_value: 'Archana=Archana', suggested_fix: 'Hero: Bhanu Chander; Heroine: Archana' },
  { id: 'd42f7ec4', slug: 'kerintha-2015', title: 'Kerintha', year: 2015, issue_type: 'DUPLICATE_CAST', current_value: 'Tejaswi Madivada=Tejaswi Madivada', suggested_fix: 'Hero: Sumanth Ashwin; Heroine: Tejaswi Madivada' },
  { id: 'f7d50074', slug: 'chandirani-1953', title: 'Chandirani', year: 1953, issue_type: 'DUPLICATE_CAST', current_value: 'Bhanumathi=Bhanumathi', suggested_fix: 'Hero: N. T. Rama Rao; Heroine: Bhanumathi' },
  { id: '707c6bc3', slug: 'preminchu-2001', title: 'Preminchu', year: 2001, issue_type: 'DUPLICATE_CAST', current_value: 'Laya=Laya', suggested_fix: 'Hero: Laya; Heroine: Srikanth' },
  { id: 'fefa56b3', slug: 'vijayadasami-2007', title: 'Vijayadasami', year: 2007, issue_type: 'DUPLICATE_CAST', current_value: 'Nandamuri Kalyan Ram=Nandamuri Kalyan Ram', suggested_fix: 'Hero: Nandamuri Kalyan Ram; Heroine: Vedhika' },
  { id: '7eb04022', slug: 'mithunam-2012', title: 'Mithunam', year: 2012, issue_type: 'DUPLICATE_CAST', current_value: 'Lakshmi=Lakshmi', suggested_fix: 'Hero: S. P. Balasubrahmanyam; Heroine: Lakshmi' },
  { id: 'd647d89a', slug: 'kokilam-1990', title: 'Kokilam', year: 1990, issue_type: 'DUPLICATE_CAST', current_value: 'Shobana=Shobana', suggested_fix: 'Hero: Bhanu Chander; Heroine: Shobana' },
  { id: 'dcb78d88', slug: 'natyam-2021', title: 'Natyam', year: 2021, issue_type: 'DUPLICATE_CAST', current_value: 'Sandhya Raju=Sandhya Raju', suggested_fix: 'Hero: Sandhya Raju; Heroine: Rohit Reddy' },
  { id: '1217ac54', slug: 'stri-1995', title: 'Stri', year: 1995, issue_type: 'DUPLICATE_CAST', current_value: 'Rohini=Rohini', suggested_fix: 'Hero: Anand; Heroine: Rohini' },
  { id: '81b4aade', slug: 'aunty-1995', title: 'Aunty', year: 1995, issue_type: 'DUPLICATE_CAST', current_value: 'Jayasudha=Jayasudha', suggested_fix: 'Hero: Jayasudha; Heroine: Charan Raj' },
  { id: '4ee61b19', slug: 'chandamama-kathalu-2014', title: 'Chandamama Kathalu', year: 2014, issue_type: 'DUPLICATE_CAST', current_value: 'Lakshmi Manchu=Lakshmi Manchu', suggested_fix: 'Hero: Lakshmi Manchu; Heroine: Adivi Sesh' },
  { id: '5f71cd6e', slug: 'anasuya-2007', title: 'Anasuya', year: 2007, issue_type: 'DUPLICATE_CAST', current_value: 'Bhumika Chawla=Bhumika Chawla', suggested_fix: 'Hero: Ravi Babu; Heroine: Bhumika Chawla' },
  { id: '0dfaa03b', slug: 'vanaja-2006', title: 'Vanaja', year: 2006, issue_type: 'DUPLICATE_CAST', current_value: 'Mamatha Bhukya=Mamatha Bhukya', suggested_fix: 'Hero: Mamatha Bhukya; Heroine: Urmila Dammannagari' },
  
  // GENDER_SWAP fixes
  { id: '67b522d8', slug: 'merupu-daadi-1984', title: 'Merupu Daadi', year: 1984, issue_type: 'GENDER_SWAP', current_value: 'Silk Smitha (Hero)', suggested_fix: 'Move Silk Smitha to Heroine; Hero: Suman' },
  { id: 'b5c120b6', slug: 'ranam-2006', title: 'Ranam', year: 2006, issue_type: 'GENDER_SWAP', current_value: 'Gopichand (Heroine)', suggested_fix: 'Move Gopichand to Hero; Heroine: Kamna Jethmalani' },
  { id: '422b6457', slug: 'sri-bannari-amman-2002', title: 'Sri Bannari Amman', year: 2002, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Karan' },
  { id: '85ab9ba4', slug: 'rajasthan-1999', title: 'Rajasthan', year: 1999, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Sarathkumar' },
  { id: '95f01599', slug: 'osey-ramulamma-1997', title: 'Osey Ramulamma', year: 1997, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Dasari Narayana Rao' },
  { id: '2153b25d', slug: 'kartavyam-1990', title: 'Kartavyam', year: 1990, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Vinod Kumar' },
  { id: '40ba5b4b', slug: 'maga-rayudu-1994', title: 'Maga Rayudu', year: 1994, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Karthik' },
  { id: 'ee46c641', slug: 'jhansi-rani-1988', title: 'Jhansi Rani', year: 1988, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Rajendra Prasad' },
  { id: '32f901bd', slug: 'pratighatana-1985', title: 'Pratighatana', year: 1985, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Chandramohan' },
  { id: '8f26804c', slug: 'sakshi-1989', title: 'Sakshi', year: 1989, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Vinod Kumar' },
  { id: '4021e5b1', slug: 'aahuthi-1988', title: 'Aahuthi', year: 1988, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Rajasekhar' },
  { id: '63691833', slug: 'naayudamma-2006', title: 'Naayudamma', year: 2006, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Srihari' },
  { id: '9f116506', slug: 'karthavyam-1991', title: 'Karthavyam', year: 1991, issue_type: 'GENDER_SWAP', current_value: 'Vijayashanti (Hero)', suggested_fix: 'Move Vijayashanti to Heroine; Hero: Vinod Kumar' },
];

function parseFix(fix: Fix): { hero: string | null; heroine: string | null } {
  if (fix.issue_type === 'DUPLICATE_CAST') {
    // Parse "Hero: X; Heroine: Y"
    const match = fix.suggested_fix.match(/Hero:\s*([^;]+);\s*Heroine:\s*(.+)/);
    if (match) {
      return { hero: match[1].trim(), heroine: match[2].trim() };
    }
  } else if (fix.issue_type === 'GENDER_SWAP') {
    // Parse "Move X to Heroine; Hero: Y" or "Move X to Hero; Heroine: Y"
    if (fix.suggested_fix.includes('Move') && fix.suggested_fix.includes('to Heroine')) {
      const moveMatch = fix.suggested_fix.match(/Move\s+([^;]+)\s+to\s+Heroine;\s*Hero:\s*(.+)/);
      if (moveMatch) {
        return { hero: moveMatch[2].trim(), heroine: moveMatch[1].trim() };
      }
    } else if (fix.suggested_fix.includes('Move') && fix.suggested_fix.includes('to Hero')) {
      const moveMatch = fix.suggested_fix.match(/Move\s+([^;]+)\s+to\s+Hero;\s*Heroine:\s*(.+)/);
      if (moveMatch) {
        return { hero: moveMatch[1].trim(), heroine: moveMatch[2].trim() };
      }
    }
  }
  return { hero: null, heroine: null };
}

async function applyFixes() {
  console.log(chalk.bold('\n🔧 APPLYING CAST ANOMALY FIXES\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  let applied = 0;
  let notFound = 0;
  let errors = 0;
  
  for (const fix of fixes) {
    try {
      const { data, error: fetchError } = await supabase
        .from('movies')
        .select('id, slug, title_en, hero, heroine')
        .eq('slug', fix.slug)
        .single();
      
      if (fetchError || !data) {
        console.log(chalk.red(`❌ Not found: ${fix.slug}`));
        notFound++;
        continue;
      }
      
      const parsed = parseFix(fix);
      if (!parsed.hero && !parsed.heroine) {
        console.log(chalk.yellow(`⚠️  Could not parse fix for: ${fix.title}`));
        continue;
      }
      
      console.log(chalk.yellow(`\n${fix.title} (${fix.year})`));
      console.log(`  Issue: ${fix.issue_type}`);
      console.log(`  ${chalk.red('BEFORE:')} hero="${data.hero || 'N/A'}", heroine="${data.heroine || 'N/A'}"`);
      console.log(`  ${chalk.green('AFTER:')}  hero="${parsed.hero || 'N/A'}", heroine="${parsed.heroine || 'N/A'}"`);
      
      const updatePayload: any = {};
      if (parsed.hero) updatePayload.hero = parsed.hero;
      if (parsed.heroine) updatePayload.heroine = parsed.heroine;
      
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
  console.log(`  Not found: ${chalk.yellow(notFound)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log();
}

applyFixes().catch(console.error);
