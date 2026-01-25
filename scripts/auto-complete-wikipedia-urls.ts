import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Known mappings based on user notes and common patterns
const KNOWN_MAPPINGS: Record<string, string> = {
  // Major stars with primary articles
  'Meena': 'https://en.wikipedia.org/wiki/Meena_(actress)',
  'Madhavi': 'https://en.wikipedia.org/wiki/Madhavi_(actress)',
  'Simran': 'https://en.wikipedia.org/wiki/Simran_(actress)',
  'Arjun': 'https://en.wikipedia.org/wiki/Arjun_Sarja',
  'Vishnu': 'https://en.wikipedia.org/wiki/Vishnu_Manchu',
  'Siva': 'https://en.wikipedia.org/wiki/Siva_(director)',
  'Bapu': 'https://en.wikipedia.org/wiki/Bapu_(film_director)',
  'Suhas': 'https://en.wikipedia.org/wiki/Suhas_(actor)',
  'Sarath': 'https://en.wikipedia.org/wiki/Sarath_Kumar',
  'Chandra Mohan': 'https://en.wikipedia.org/wiki/Chandra_Mohan_(Telugu_actor)',
  'Sharada': 'https://en.wikipedia.org/wiki/Sharada_(actress)',
  'Satyanarayana': 'https://en.wikipedia.org/wiki/Kaikala_Satyanarayana',
  'Sukumar': 'https://en.wikipedia.org/wiki/Sukumar_(director)',
  'Gopichand': 'https://en.wikipedia.org/wiki/Gopichand_(actor)',
  'Naresh': 'https://en.wikipedia.org/wiki/Naresh_(actor)',
  'Trisha': 'https://en.wikipedia.org/wiki/Trisha_(actress)',
  'Vikram': 'https://en.wikipedia.org/wiki/Vikram_(actor)',
  'Raasi': 'https://en.wikipedia.org/wiki/Raasi_(actress)',
  'Sneha': 'https://en.wikipedia.org/wiki/Sneha_(actress)',
  'Ramakrishna': 'https://en.wikipedia.org/wiki/Ramakrishna_(Telugu_actor)',
  'Bhanumathi': 'https://en.wikipedia.org/wiki/P._Bhanumathi',
  'Latha': 'https://en.wikipedia.org/wiki/Latha_(actress)',
  'Samantha': 'https://en.wikipedia.org/wiki/Samantha_Ruth_Prabhu',
  'Suman': 'https://en.wikipedia.org/wiki/Suman_(actor)',
  'Roja': 'https://en.wikipedia.org/wiki/Roja_(actress)',
  'Jamuna': 'https://en.wikipedia.org/wiki/Jamuna_(actress)',
  'Amala': 'https://en.wikipedia.org/wiki/Amala_Akkineni',
  'Savitri': 'https://en.wikipedia.org/wiki/Savitri_(actress)',
  'Tarun': 'https://en.wikipedia.org/wiki/Tarun_(actor)',
  'Rajasekhar': 'https://en.wikipedia.org/wiki/Rajasekhar_(actor)',
  'Anjali': 'https://en.wikipedia.org/wiki/Anjali_(actress)',
  'Lakshmi': 'https://en.wikipedia.org/wiki/Lakshmi_(actress)',
  'Suhasini': 'https://en.wikipedia.org/wiki/Suhasini_Maniratnam',
  'Siddharth': 'https://en.wikipedia.org/wiki/Siddharth_(actor)',
  'Ali': 'https://en.wikipedia.org/wiki/Ali_(actor)',
  'Radha': 'https://en.wikipedia.org/wiki/Radha_(actress)',
  'Ram': 'https://en.wikipedia.org/wiki/Ram_Pothineni',
  'Kanchana': 'https://en.wikipedia.org/wiki/Kanchana_(actress)',
  'Karthik': 'https://en.wikipedia.org/wiki/Karthik_(actor)',
  'Rambha': 'https://en.wikipedia.org/wiki/Rambha_(actress)',
  'Trisha Krishnan': 'https://en.wikipedia.org/wiki/Trisha_(actress)',
  'N.T. Rama Rao Jr.': 'https://en.wikipedia.org/wiki/N._T._Rama_Rao_Jr.',
  'Geetha': 'https://en.wikipedia.org/wiki/Geetha_(actress)',
  'Sarath Babu': 'https://en.wikipedia.org/wiki/Sarath_Babu',
  'Mouli': 'https://en.wikipedia.org/wiki/Mouli_(actor)',
  'P. Chandrasekhara Reddy': 'https://en.wikipedia.org/wiki/P._Chandrasekhara_Reddy',
  'Rajani': 'https://en.wikipedia.org/wiki/Rajani_(actress)',
  'K. Bapayya': 'https://en.wikipedia.org/wiki/K._Bapayya',
  'Manjula': 'https://en.wikipedia.org/wiki/Manjula_Vijayakumar',
  'Sada': 'https://en.wikipedia.org/wiki/Sada_(actress)',
  'Janaki': 'https://en.wikipedia.org/wiki/Sowcar_Janaki',
  'Sujatha': 'https://en.wikipedia.org/wiki/Sujatha_(actress)',
  'Poornima': 'https://en.wikipedia.org/wiki/Poornima_Bhagyaraj',
  'Tabu': 'https://en.wikipedia.org/wiki/Tabu_(actress)',
  'Gummadi': 'https://en.wikipedia.org/wiki/Gummadi_Venkateswara_Rao',
  'Aadi': 'https://en.wikipedia.org/wiki/Aadi_(actor)',
  'Abbas': 'https://en.wikipedia.org/wiki/Abbas_(actor)',
  'Ntr': 'https://en.wikipedia.org/wiki/N._T._Rama_Rao',
  'Rekha': 'https://en.wikipedia.org/wiki/Rekha_(actress)',
  'Veera': 'https://en.wikipedia.org/wiki/Veera_(actor)',
  'Ram Charan': 'https://en.wikipedia.org/wiki/Ram_Charan',
  'Bhavana': 'https://en.wikipedia.org/wiki/Bhavana_(Malayalam_actress)',
  'Neelakanta': 'https://en.wikipedia.org/wiki/Neelakanta_(director)',
  'S. D. Lal': 'https://en.wikipedia.org/wiki/S._D._Lall',
  'Kalyani': 'https://en.wikipedia.org/wiki/Kalyani_(actress)',
  'Nandu': 'https://en.wikipedia.org/wiki/Nandu_(actor)',
  'Haranath': 'https://en.wikipedia.org/wiki/Haranath_(actor)',
  'Poorna': 'https://en.wikipedia.org/wiki/Shamna_Kasim',
  'Jayanthi': 'https://en.wikipedia.org/wiki/Jayanthi_(actress)',
  'Archana': 'https://en.wikipedia.org/wiki/Archana_(actress)',
  'Sai Kumar': 'https://en.wikipedia.org/wiki/Sai_Kumar_(Telugu_actor)',
  'Jeeva': 'https://en.wikipedia.org/wiki/Jeeva_(Telugu_actor)',
  'Prema': 'https://en.wikipedia.org/wiki/Prema_(actress)',
  'Tulasi': 'https://en.wikipedia.org/wiki/Tulasi_(actress)',
  'Kaveri': 'https://en.wikipedia.org/wiki/Kaveri_(actress)',
  'Laya': 'https://en.wikipedia.org/wiki/Laya_(actress)',
  'Samyuktha': 'https://en.wikipedia.org/wiki/Samyuktha_Menon',
  'K. Murali Mohan': 'https://en.wikipedia.org/wiki/K._Murali_Mohan_Rao',
  'Bellamkonda Srinivas': 'https://en.wikipedia.org/wiki/Bellamkonda_Sreenivas',
  'Ashwini': 'https://en.wikipedia.org/wiki/Ashwini_(actress)',
  'Srikanth Meka': 'https://en.wikipedia.org/wiki/Meka_Srikanth',
  'Nandu Vijay Krishna': 'https://en.wikipedia.org/wiki/Nandu_(actor)',
  'Anusha': 'https://en.wikipedia.org/wiki/Anusha_(actress)',
  'R. S. Prakash': 'https://en.wikipedia.org/wiki/R._S._Prakash',
  'Veerabhadram': 'https://en.wikipedia.org/wiki/Veerabhadram_Chowdary',
  'Siva Nageshwara Rao': 'https://en.wikipedia.org/wiki/Sivanageswara_Rao',
  'A. Chandra': 'https://en.wikipedia.org/wiki/A._Chandra',
  'Devi Prasad': 'https://en.wikipedia.org/wiki/Devi_Prasad_(director)',
  'Madan': 'https://en.wikipedia.org/wiki/Madan_(director)',
  'Khushboo': 'https://en.wikipedia.org/wiki/Khushbu_Sundar',
  'Ali Basha': 'https://en.wikipedia.org/wiki/Ali_(actor)',
  'Urvashi': 'https://en.wikipedia.org/wiki/Urvashi_(actress)',
  'Kavitha': 'https://en.wikipedia.org/wiki/Kavitha_(actress)',
  'Divya Vani': 'https://en.wikipedia.org/wiki/Divyavani',
  'Ravi Varma': 'https://en.wikipedia.org/wiki/Ravi_Varma_(actor)',
  'Thiruveer Reddy': 'https://en.wikipedia.org/wiki/Thiruveer',
  'Priyanka Sharma': 'https://en.wikipedia.org/wiki/Priyanka_Sharma_(actress)',
  'Sivaji Sontineni': 'https://en.wikipedia.org/wiki/Sivaji_(Telugu_actor)',
  'Abhirami': 'https://en.wikipedia.org/wiki/Abhirami_(actress)',
  'Sasikumar': 'https://en.wikipedia.org/wiki/Sasikumar',
  'Padmini': 'https://en.wikipedia.org/wiki/Padmini_(actress)',
  'Rahul Sankrityan': 'https://en.wikipedia.org/wiki/Rahul_Sankrityan',
  'Krasna': 'https://en.wikipedia.org/wiki/Norman_Krasna',
  'KVAS': 'https://en.wikipedia.org/wiki/K._V._Anand',
  'Camp Sasi': 'https://en.wikipedia.org/wiki/Camp_Sasi',
  'Vasanthkumar Reddy': 'https://en.wikipedia.org/wiki/Vasanth_(director)',
  'Sharath': 'https://en.wikipedia.org/wiki/Sharath_(director)',
  'BVS Rama Rao': 'https://en.wikipedia.org/wiki/B._V._S._Rama_Rao',
  'B Saroja Devi': 'https://en.wikipedia.org/wiki/B._Saroja_Devi',
  'Rajashree': 'https://en.wikipedia.org/wiki/Rajashree_(actress)',
  'V.K. Prakash': 'https://en.wikipedia.org/wiki/V._K._Prakash',
  'Raja Babu': 'https://en.wikipedia.org/wiki/Raja_Babu_(actor)',
  'S S Nayak': 'https://en.wikipedia.org/wiki/S._S._Nayak',
  'Shiva Krishna': 'https://en.wikipedia.org/wiki/Siva_Krishna',
  'G Varalakshmi': 'https://en.wikipedia.org/wiki/G._Varalakshmi',
  // Single letter names
  'Allu': 'https://en.wikipedia.org/wiki/Allu_Ramalingaiah',
  'K': 'https://en.wikipedia.org/wiki/K._Viswanath',
  'B': 'https://en.wikipedia.org/wiki/B._Jaya',
  'Raja': 'https://en.wikipedia.org/wiki/Raja_Abel',
  'Rohit': 'https://en.wikipedia.org/wiki/Rohit_(Telugu_actor)',
  'Ajay': 'https://en.wikipedia.org/wiki/Ajay_(Telugu_actor)',
};

interface WikiCorrection {
  celebId: string;
  name: string;
  currentIssue: string;
  correctedUrl: string;
  status: string;
  notes: string;
}

function parseCSV(content: string): WikiCorrection[] {
  const lines = content.split('\n').filter(line => line.trim());
  const records: WikiCorrection[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(/"([^"]*)"/g);
    if (matches && matches.length >= 6) {
      records.push({
        celebId: matches[0].replace(/"/g, ''),
        name: matches[1].replace(/"/g, ''),
        currentIssue: matches[2].replace(/"/g, ''),
        correctedUrl: matches[3].replace(/"/g, ''),
        status: matches[4].replace(/"/g, ''),
        notes: matches[5].replace(/"/g, ''),
      });
    }
  }
  
  return records;
}

async function autoCompleteWikipediaUrls() {
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  AUTO-COMPLETE WIKIPEDIA URLs'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Read existing corrections
  const csvContent = fs.readFileSync('WIKIPEDIA-URL-CORRECTIONS.csv', 'utf-8');
  const records = parseCSV(csvContent);
  
  // Filter PENDING ones
  const pendingRecords = records.filter(r => r.status === 'PENDING' && r.correctedUrl === 'NEEDS_RESEARCH');
  
  console.log(chalk.cyan(`Found ${pendingRecords.length} celebrities needing URLs\n`));
  
  const autoCompleted: Array<{celebId: string; name: string; url: string; confidence: string}> = [];
  const needsManual: Array<{celebId: string; name: string; reason: string}> = [];
  
  for (const record of pendingRecords) {
    const name = record.name;
    
    if (KNOWN_MAPPINGS[name]) {
      autoCompleted.push({
        celebId: record.celebId,
        name: name,
        url: KNOWN_MAPPINGS[name],
        confidence: 'HIGH',
      });
      console.log(chalk.green(`  ✓ ${name}`));
      console.log(chalk.gray(`    → ${KNOWN_MAPPINGS[name]}`));
    } else {
      needsManual.push({
        celebId: record.celebId,
        name: name,
        reason: 'No known mapping',
      });
      console.log(chalk.yellow(`  ? ${name} - needs manual research`));
    }
  }
  
  // Generate updated CSV
  const updatedRecords = records.map(record => {
    const autoCompletedMatch = autoCompleted.find(a => a.celebId === record.celebId);
    if (autoCompletedMatch) {
      return {
        ...record,
        correctedUrl: autoCompletedMatch.url,
        status: 'AUTO_COMPLETED',
        notes: `Auto-completed with HIGH confidence`,
      };
    }
    return record;
  });
  
  // Write updated CSV
  const csvLines = ['Celebrity ID,Name,Current Issue,Corrected Wikipedia URL,Status,Notes'];
  for (const record of updatedRecords) {
    csvLines.push(`"${record.celebId}","${record.name}","${record.currentIssue}","${record.correctedUrl}","${record.status}","${record.notes}"`);
  }
  
  fs.writeFileSync('WIKIPEDIA-URL-AUTO-COMPLETED.csv', csvLines.join('\n'));
  
  // Write review file
  const reviewLines = ['# Auto-Completed Wikipedia URLs - REVIEW REQUIRED\n'];
  reviewLines.push('## ✅ Auto-Completed (HIGH Confidence)\n');
  reviewLines.push('These URLs were auto-completed based on known patterns. **Please review and approve**:\n');
  
  for (const item of autoCompleted) {
    reviewLines.push(`- **${item.name}**`);
    reviewLines.push(`  - URL: ${item.url}`);
    reviewLines.push(`  - Confidence: ${item.confidence}`);
    reviewLines.push('');
  }
  
  if (needsManual.length > 0) {
    reviewLines.push('\n## ❓ Needs Manual Research\n');
    reviewLines.push('These celebrities still need Wikipedia URLs:\n');
    for (const item of needsManual) {
      reviewLines.push(`- **${item.name}** - ${item.reason}`);
    }
  }
  
  fs.writeFileSync('AUTO-COMPLETED-REVIEW.md', reviewLines.join('\n'));
  
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  SUMMARY'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan('Total Pending:              '), pendingRecords.length);
  console.log(chalk.green('✓ Auto-Completed:           '), autoCompleted.length);
  console.log(chalk.yellow('? Needs Manual Research:    '), needsManual.length);
  
  console.log(chalk.bold('\n📁 Files Created:\n'));
  console.log(chalk.cyan('  • WIKIPEDIA-URL-AUTO-COMPLETED.csv'));
  console.log(chalk.cyan('  • AUTO-COMPLETED-REVIEW.md'));
  
  console.log(chalk.green('\n✅ Auto-completion complete! Review AUTO-COMPLETED-REVIEW.md'));
}

// Main
autoCompleteWikipediaUrls().catch(console.error);
