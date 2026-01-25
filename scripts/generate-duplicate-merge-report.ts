#!/usr/bin/env npx tsx
/**
 * Generate Final Duplicate Merge Report
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DuplicateRecord {
  type: string;
  category: string;
  id1: string;
  id2: string;
  slug1: string;
  slug2: string;
  name1: string;
  name2: string;
  year1?: number | null;
  year2?: number | null;
  match_type: string;
  confidence: number;
  reason: string;
  action: string;
  data_completeness1: string;
  data_completeness2: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const REJECTED_PAIRS = new Set<string>([
  'madonna-the-confessions-tour-2006|sundaraniki-thondarekkuva-2006',
  'the-king-of-kings-2025|andhra-king-taluka-2025',
  'radha-krishna-2021|krish-2021',
  'arjun-reddy-2017|dwaraka-2017',
  'ranasthalam-2019|abhinetri-2016',
  'dhruva-2016|dhuruvangal-pathinaaru-2016',
  'mental-madhilo-2017|appatlo-okadundevadu-2016',
  'ooriki-uttharana-2021|utthara-2020',
  'govindudu-andarivadele-2014|yevadu-2014',
  'friends-book-2012|gunde-jhallumandi-2008',
  'vikramarkudu-2006|vikram-2005',
  'anand-2004|anandamanandamaye-2004',
  'pelli-kani-prasad-2008|pelli-kani-prasad-2003',
  'avunanna-kadanna-2005|avuna-2003',
  'evaru-2019|seshu-2002',
  'khushi-2001|kabhi-khushi-kabhie-gham-2001',
  'pelli-1997|maa-nannaki-pelli-1997',
  'drohi-2010|drohi-1996',
  'swami-vivekananda-1998|swami-vivekananda-1994',
  'mukundan-unni-associates-2022|kundan-1993',
  'peddarikam-tba|peddarikam-1992',
  'priyathama-neevachata-kusalama-2013|priyathama-1992',
  'nee-thodu-kavali-2002|parishkaram-1991',
  'bobbili-vamsam-1999|shatruvu-1991',
  'led-zeppelin-celebration-day-2012|anna-thammudu-1990',
  'poola-rangadu-2012|poola-rangadu-1989',
  'neninthe-2010|vicky-daada-1989',
  'comedy-express-2010|abhinandana-1988',
  'state-rowdy-1989|yuddha-bhoomi-1988',
  'naa-style-veru-2009|vishwanatha-nayakudu-1987',
  'mutha-mestri-1993|chanakya-sapatham-1986',
  'nee-kosam-1999|aranyakanda-1986',
  'kaashmora-2016|kashmora-1986',
  'ramu-1987|adavi-donga-1985',
  'indhu-1994|rakta-sindhuram-1985',
  'nireekshana-1986|s-p-bhayankar-1984',
  'kanchana-2-2015|kanchana-ganga-1984',
  'mitrudu-2009|amayakudu-kadhu-asadhyudu-1983',
  'maga-maharaju-1983|sivudu-sivudu-sivudu-1983',
  'puli-1985|mantri-gari-viyyankudu-1983',
  'gopala-krishnudu-1982|ekalavya-1982',
  'illale-devatha-1985|devata-1982',
  'manchu-pallaki-1982|mondi-ghatam-1982',
  'satyabhama-2024|satyabhama-1981',
  'thodu-needa-1983|prema-pichchi-1981',
  'manasulo-maata-1999|jathagadu-1981',
  'donga-sachinollu-2008|challenge-ramudu-1980',
  'bhadradri-ramudu-2004|bebbuli-1980',
  'ee-charithra-ye-siratho-1982|nijam-1980',
  'mesthri-2009|buchi-babu-1980',
  'pistha-2009|guru-1980',
  'tiger-harischandra-prasad-2003|akbar-salim-anarkali-1979',
  'vaana-2008|melu-kolupu-1978',
  'ammoru-1995|mundadugu-1978',
  'vara-prasad-potti-prasad-2011|bangaru-manishi-1976',
  'vamsi-2000|vemulawada-bheemakavi-1976',
  'iddaru-iddare-1990|iddaru-iddare-1976',
  'andaru-dongale-dorikithe-2004|andaru-dongale-1974',
  'poola-rangadu-2012|poola-rangadu-1967',
  'rama-rama-krishna-krishna-2010|bangaru-thimmaraju-1964',
  'sita-rama-kalyanam-1986|seetha-rama-kalyanam-1961',
  'appu-chesi-pappu-koodu-2008|appu-chesi-pappu-koodu-1959',
  'v-for-vendetta-2006|vivah-2006',
  'bangaru-kutumbam-1994|brahmachari-mogudu-1994',
  'bangaru-kutumbam-1994|yamaleela-1994',
]);

function shouldReject(slug1: string, slug2: string): boolean {
  const key1 = `${slug1}|${slug2}`;
  const key2 = `${slug2}|${slug1}`;
  return REJECTED_PAIRS.has(key1) || REJECTED_PAIRS.has(key2);
}

async function generateReport() {
  console.log(chalk.bold('\n📊 GENERATING DUPLICATE MERGE REPORT\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  const csvPath = resolve(process.cwd(), 'DUPLICATES-AUDIT-RESULTS.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);
  const records: DuplicateRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const record: any = {};
    headers.forEach((header, idx) => {
      let value = values[idx] || '';
      value = value.replace(/^"|"$/g, '');
      record[header.trim()] = value;
    });
    
    if (record.year1) {
      const year = parseInt(record.year1);
      record.year1 = isNaN(year) ? null : year;
    }
    if (record.year2) {
      const year = parseInt(record.year2);
      record.year2 = isNaN(year) ? null : year;
    }
    
    records.push(record as DuplicateRecord);
  }
  
  const report: string[] = [];
  report.push('# DUPLICATE MERGE FINAL REPORT');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push('');
  report.push('## Summary');
  report.push('');
  
  let totalRecords = 0;
  let merged = 0;
  let rejected = 0;
  let errors = 0;
  let notFound = 0;
  
  const mergedList: Array<{ kept: string; deleted: string; reason: string }> = [];
  const rejectedList: Array<{ pair: string; reason: string }> = [];
  const errorList: Array<{ pair: string; error: string }> = [];
  
  for (const record of records) {
    if (record.type !== 'movie') continue;
    totalRecords++;
    
    if (shouldReject(record.slug1, record.slug2)) {
      rejected++;
      rejectedList.push({
        pair: `${record.name1} (${record.year1}) ↔ ${record.name2} (${record.year2})`,
        reason: 'False positive - different films',
      });
      continue;
    }
    
    // Check if movies still exist
    const { data: movie1 } = await supabase
      .from('movies')
      .select('id, slug, title_en')
      .eq('id', record.id1)
      .single();
    
    const { data: movie2 } = await supabase
      .from('movies')
      .select('id, slug, title_en')
      .eq('id', record.id2)
      .single();
    
    if (!movie1 && !movie2) {
      notFound++;
      continue;
    }
    
    if (!movie1 || !movie2) {
      // One was deleted (successfully merged)
      merged++;
      const kept = movie1 ? record.name1 : record.name2;
      const deleted = movie1 ? record.name2 : record.name1;
      mergedList.push({
        kept,
        deleted,
        reason: record.reason,
      });
    } else {
      // Both still exist (error case)
      errors++;
      errorList.push({
        pair: `${record.name1} (${record.year1}) ↔ ${record.name2} (${record.year2})`,
        error: 'Both movies still exist - merge failed',
      });
    }
  }
  
  report.push(`- **Total duplicate pairs found:** ${totalRecords}`);
  report.push(`- **Successfully merged:** ${merged}`);
  report.push(`- **Rejected (false positives):** ${rejected}`);
  report.push(`- **Errors (still need fixing):** ${errors}`);
  report.push(`- **Not found (already processed):** ${notFound}`);
  report.push('');
  
  report.push('## Successfully Merged Duplicates');
  report.push('');
  report.push('| Kept | Deleted | Reason |');
  report.push('|------|---------|--------|');
  mergedList.forEach(item => {
    report.push(`| ${item.kept} | ${item.deleted} | ${item.reason.substring(0, 50)}... |`);
  });
  report.push('');
  
  if (rejectedList.length > 0) {
    report.push('## Rejected Pairs (False Positives)');
    report.push('');
    report.push('| Pair | Reason |');
    report.push('|------|--------|');
    rejectedList.forEach(item => {
      report.push(`| ${item.pair} | ${item.reason} |`);
    });
    report.push('');
  }
  
  if (errorList.length > 0) {
    report.push('## Errors (Need Manual Review)');
    report.push('');
    report.push('| Pair | Error |');
    report.push('|------|-------|');
    errorList.forEach(item => {
      report.push(`| ${item.pair} | ${item.error} |`);
    });
    report.push('');
  }
  
  // Write report
  const reportPath = resolve(process.cwd(), 'DUPLICATE-MERGE-FINAL-REPORT.md');
  writeFileSync(reportPath, report.join('\n'));
  
  console.log(chalk.green(`✅ Report generated: DUPLICATE-MERGE-FINAL-REPORT.md\n`));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Total pairs: ${totalRecords}`);
  console.log(`  Successfully merged: ${chalk.green(merged)}`);
  console.log(`  Rejected (false positives): ${chalk.yellow(rejected)}`);
  console.log(`  Errors (need fixing): ${chalk.red(errors)}`);
  console.log(`  Not found (already processed): ${chalk.gray(notFound)}`);
  console.log();
}

generateReport().catch(console.error);
