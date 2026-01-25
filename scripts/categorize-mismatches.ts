import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface Mismatch {
  actor: string;
  wikiTitle: string;
  wikiYear: number;
  role: string;
  status: string;
  dbTitle: string;
  dbTitleTe: string;
  dbYear: number;
  matchScore: number;
  movieId: string;
  action: string;
}

interface Categorized {
  autoApprove: Mismatch[];
  manualReview: Mismatch[];
  likelyReject: Mismatch[];
}

function parseMismatchesCsv(csvPath: string): Mismatch[] {
  const mismatches: Mismatch[] = [];
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
    
    mismatches.push({
      actor: parts[0],
      wikiTitle: parts[1],
      wikiYear: parseInt(parts[2]) || 0,
      role: parts[3],
      status: parts[4],
      dbTitle: parts[5],
      dbTitleTe: parts[6],
      dbYear: parseInt(parts[7]) || 0,
      matchScore: parseInt(parts[8]) || 0,
      movieId: parts[9],
      action: parts[10]
    });
  }
  
  return mismatches;
}

function categorizeMismatches(mismatches: Mismatch[]): Categorized {
  const autoApprove: Mismatch[] = [];
  const manualReview: Mismatch[] = [];
  const likelyReject: Mismatch[] = [];
  
  for (const m of mismatches) {
    const yearDiff = Math.abs(m.wikiYear - m.dbYear);
    
    // Auto-approve criteria: ±1 year AND 100% title match
    if (yearDiff <= 1 && m.matchScore === 100) {
      autoApprove.push(m);
    }
    // Likely reject: >2 years apart OR low match score with year difference
    else if (yearDiff > 2 || (m.matchScore < 90 && yearDiff > 1)) {
      likelyReject.push(m);
    }
    // Everything else needs manual review
    else {
      manualReview.push(m);
    }
  }
  
  return { autoApprove, manualReview, likelyReject };
}

function generateDecisionCsv(categorized: Categorized): void {
  const headers = [
    'DB Movie ID',
    'Actor',
    'Wikipedia Title',
    'DB Title',
    'Wikipedia Year',
    'DB Year',
    'Year Diff',
    'Match Score',
    'Category',
    'Suggested Decision',
    'Notes',
    'Final Decision (APPROVE/REJECT/RESEARCH)',
    'Reviewer Notes'
  ];
  
  const rows: string[][] = [headers];
  
  // Auto-approve cases
  categorized.autoApprove.forEach(m => {
    const yearDiff = m.wikiYear - m.dbYear;
    rows.push([
      m.movieId,
      m.actor,
      m.wikiTitle,
      m.dbTitle,
      m.wikiYear.toString(),
      m.dbYear.toString(),
      yearDiff.toString(),
      m.matchScore.toString(),
      '✅ AUTO-APPROVE',
      'APPROVE',
      `Same movie - year off by ${Math.abs(yearDiff)}, perfect title match`,
      'APPROVE',
      ''
    ]);
  });
  
  // Manual review cases
  categorized.manualReview.forEach(m => {
    const yearDiff = m.wikiYear - m.dbYear;
    let notes = '';
    
    if (m.matchScore === 100) {
      notes = `Same title, ${Math.abs(yearDiff)} years apart - verify same movie`;
    } else {
      notes = `Similar title (${m.matchScore}% match), ${Math.abs(yearDiff)} years apart`;
    }
    
    rows.push([
      m.movieId,
      m.actor,
      m.wikiTitle,
      m.dbTitle,
      m.wikiYear.toString(),
      m.dbYear.toString(),
      yearDiff.toString(),
      m.matchScore.toString(),
      '⚠️ MANUAL REVIEW',
      'RESEARCH',
      notes,
      '',
      ''
    ]);
  });
  
  // Likely reject cases
  categorized.likelyReject.forEach(m => {
    const yearDiff = m.wikiYear - m.dbYear;
    let notes = '';
    
    if (yearDiff > 2) {
      notes = `${Math.abs(yearDiff)} years apart - likely different movies or remake`;
    } else {
      notes = `Low title match (${m.matchScore}%) - likely different movies`;
    }
    
    rows.push([
      m.movieId,
      m.actor,
      m.wikiTitle,
      m.dbTitle,
      m.wikiYear.toString(),
      m.dbYear.toString(),
      yearDiff.toString(),
      m.matchScore.toString(),
      '❌ LIKELY REJECT',
      'REJECT',
      notes,
      '',
      ''
    ]);
  });
  
  const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  fs.writeFileSync('MISMATCH-DECISIONS.csv', csv);
}

function main() {
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  CATEGORIZE YEAR/TITLE MISMATCHES'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  const csvPath = path.join(process.cwd(), 'YEAR-TITLE-MISMATCHES.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log(chalk.red('✗ YEAR-TITLE-MISMATCHES.csv not found'));
    process.exit(1);
  }
  
  console.log(chalk.cyan('📖 Reading mismatches...\n'));
  const mismatches = parseMismatchesCsv(csvPath);
  
  console.log(chalk.green(`✓ Found ${mismatches.length} mismatches\n`));
  
  console.log(chalk.yellow('🔍 Categorizing...\n'));
  const categorized = categorizeMismatches(mismatches);
  
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  CATEGORIZATION RESULTS'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.green(`✅ Auto-Approve (Safe):         ${categorized.autoApprove.length} movies`));
  console.log(chalk.gray('   Criteria: ±1 year difference AND 100% title match'));
  console.log(chalk.gray('   Action: Can be automatically attributed\n'));
  
  console.log(chalk.yellow(`⚠️  Manual Review (Uncertain):   ${categorized.manualReview.length} movies`));
  console.log(chalk.gray('   Criteria: ±2 years OR 90-99% title match'));
  console.log(chalk.gray('   Action: Needs human verification\n'));
  
  console.log(chalk.red(`❌ Likely Reject (Different):   ${categorized.likelyReject.length} movies`));
  console.log(chalk.gray('   Criteria: >2 years apart OR <90% match with year diff'));
  console.log(chalk.gray('   Action: Probably different movies\n'));
  
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Generate decision CSV
  generateDecisionCsv(categorized);
  
  console.log(chalk.green('✓ Generated: MISMATCH-DECISIONS.csv\n'));
  
  // Show samples
  console.log(chalk.bold('Sample Auto-Approve Cases:\n'));
  categorized.autoApprove.slice(0, 5).forEach((m, i) => {
    const yearDiff = m.wikiYear - m.dbYear;
    console.log(chalk.gray(`${i + 1}. ${m.actor} in "${m.wikiTitle}" (${m.wikiYear} → ${m.dbYear}, diff: ${yearDiff > 0 ? '+' : ''}${yearDiff})`));
  });
  
  if (categorized.manualReview.length > 0) {
    console.log(chalk.bold('\n\nSample Manual Review Cases:\n'));
    categorized.manualReview.slice(0, 5).forEach((m, i) => {
      const yearDiff = m.wikiYear - m.dbYear;
      console.log(chalk.gray(`${i + 1}. ${m.actor} in "${m.wikiTitle}" vs "${m.dbTitle}" (${m.wikiYear} vs ${m.dbYear}, match: ${m.matchScore}%)`));
    });
  }
  
  console.log(chalk.bold('\n\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  NEXT STEPS'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan('1. Review MISMATCH-DECISIONS.csv'));
  console.log(chalk.gray('   - Auto-approve cases are pre-filled'));
  console.log(chalk.gray('   - Manually review uncertain cases'));
  console.log(chalk.gray('   - Update "Final Decision" column\n'));
  
  console.log(chalk.cyan('2. Apply approved attributions'));
  console.log(chalk.gray('   - Run: npx tsx scripts/apply-mismatch-decisions.ts\n'));
  
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
}

main();
