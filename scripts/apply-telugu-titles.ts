#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

const CSV_FILE = 'movies-missing-telugu-titles-2026-01-14.csv';

// Telugu titles provided by user
const teluguTitles: Record<string, string> = {
  'aa22xa6-tba': 'అల్లు అర్జున్ - అట్లీ ప్రాజెక్ట్',
  'mysaa-tba': 'మైసా',
  'janakiram-tba': 'జానకిరామ్',
  'anaganaga-oka-rowdy-tba': 'అనగనగా ఒక రౌడీ',
  'sahaa-tba': 'సహా',
  'edhureetha-tba': 'ఎదురీత',
  'devara-2-tba': 'దేవర 2',
  'reppa-tba': 'రెప్ప',
  'as-time-echoes-tba': 'యాజ్ టైమ్ ఎకోస్',
  'umapathi-tba': 'ఉమాపతి',
  'oh-sukumari-tba': 'ఓ..! సుకుమారి',
  'pushpa-3-the-rampage-tba': 'పుష్ప 3 - ది రాంపేజ్',
  'takshakudu-tba': 'తక్షకుడు',
  'comrade-kalyan-tba': 'కామ్రేడ్ కళ్యాణ్',
  'illicit-relationship-tba': 'ఇల్లిసిట్ రిలేషన్ షిప్',
  'euphoria-tba': 'యుఫోరియా',
  'band-melam-tba': 'బ్యాండ్ మేళం',
  'nakshatra-poratam-tba': 'నక్షత్ర పోరాటం',
  'asuragana-rudra-tba': 'అసురగణ రుద్ర',
  'garividi-lakshmi-tba': 'గరివిడి లక్ష్మి',
  'dq-41-tba': 'దుల్కర్ సల్మాన్ 41',
  'hailesso-tba': 'హైలెస్సో',
  'arrtham-tba': 'అర్థం',
  'kirathaka-tba': 'కిరాతక',
  'biker-tba': 'బైకర్',
  'abhiram-tba': 'అభిరామ్',
  'amaran-in-the-city-chapter-1-tba': 'అమరన్ ఇన్ ది సిటీ: చాప్టర్ 1',
  'legacy-tba': 'లెగసీ',
  'maa-inti-bangaram-tba': 'మా ఇంటి బంగారం',
  'hey-bhagawan-tba': 'హే భగవాన్!',
  'maate-mantramu-tba': 'మాటే మంత్రము',
  'natudu-tba': 'నటుడు',
  'bad-boy-karthik-tba': 'బ్యాడ్ బాయ్ కార్తీక్',
  'patta-pagalu-tba': 'పట్టపగలు',
  'they-call-him-og-2-tba': 'దే కాల్ హిమ్ OG 2',
  'what-the-fish-tba': 'వాట్ ద ఫిష్',
  'paramanandham-shishyulu-tba': 'పరమానందం శిష్యులు',
  'naa-katha-tba': 'నా కథ',
  'ene-repeat-tba': 'ENE రిపీట్',
  'kalki-2898-ad-part-2-tba': 'కల్కి 2898-AD: పార్ట్ 2',
  'anumana-pakshi-tba': 'అనుమాన పక్షి',
  'peddarikam-tba': 'పెద్దరికం',
  'vrushakarma-tba': 'వృషకర్మ',
  'haindava-tba': 'హైందవ',
  'mirai-jaithraya-tba': 'మిరాయ్ జైత్రయ',
  'sambarala-yetti-gattu-tba': 'సంబరాల యెట్టి గట్టు',
};

interface MovieRow {
  Slug: string;
  TitleEn: string;
  TitleTe: string;
  ReleaseYear: string;
  Hero: string;
  Heroine: string;
  Director: string;
}

function parseCSV(content: string): MovieRow[] {
  const lines = content.split('\n');
  const rows: MovieRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 7) {
      rows.push({
        Slug: values[0],
        TitleEn: values[1].replace(/^"|"$/g, ''),
        TitleTe: values[2],
        ReleaseYear: values[3],
        Hero: values[4].replace(/^"|"$/g, ''),
        Heroine: values[5].replace(/^"|"$/g, ''),
        Director: values[6].replace(/^"|"$/g, ''),
      });
    }
  }

  return rows;
}

function stringifyCSV(rows: MovieRow[]): string {
  const lines = ['Slug,Title (English),Title (Telugu - FILL THIS),Release Year,Hero,Heroine,Director'];
  
  for (const row of rows) {
    const values = [
      row.Slug,
      `"${row.TitleEn.replace(/"/g, '""')}"`,
      row.TitleTe,
      row.ReleaseYear,
      `"${row.Hero.replace(/"/g, '""')}"`,
      `"${row.Heroine.replace(/"/g, '""')}"`,
      `"${row.Director.replace(/"/g, '""')}"`,
    ];
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

async function applyTeluguTitles() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         APPLYING TELUGU TITLES                                       ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const csvContent = readFileSync(CSV_FILE, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(chalk.green(`✓ Loaded ${records.length} movies from CSV\n`));

  let applied = 0;
  const notFound: string[] = [];

  // Apply Telugu titles
  for (const row of records) {
    if (teluguTitles[row.Slug]) {
      row.TitleTe = teluguTitles[row.Slug];
      applied++;
      console.log(chalk.green(`✓ ${row.TitleEn} → ${row.TitleTe}`));
    }
  }

  // Check for any slugs in teluguTitles that weren't found
  for (const slug of Object.keys(teluguTitles)) {
    if (!records.find(r => r.Slug === slug)) {
      notFound.push(slug);
    }
  }

  // Write updated CSV
  const outputCsv = stringifyCSV(records);
  const backupFile = CSV_FILE.replace('.csv', '-before-telugu-update.csv');
  
  writeFileSync(backupFile, csvContent);
  writeFileSync(CSV_FILE, outputCsv);

  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                            SUMMARY                                      '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const filled = records.filter(r => r.TitleTe && r.TitleTe.trim().length > 0).length;
  const pending = records.length - filled;
  const percentage = Math.round((filled / records.length) * 100);

  console.log(chalk.green(`✅ Telugu titles applied: ${applied}`));
  console.log(chalk.green(`✅ Total filled: ${filled} (${percentage}%)`));
  console.log(chalk.yellow(`⏳ Still pending: ${pending}`));
  
  if (notFound.length > 0) {
    console.log(chalk.red(`\n⚠️  Slugs not found in CSV: ${notFound.length}`));
    notFound.forEach(slug => console.log(chalk.gray(`   - ${slug}`)));
  }

  console.log(chalk.cyan(`\n📁 Backup saved: ${backupFile}`));
  console.log(chalk.green(`📁 Updated CSV: ${CSV_FILE}\n`));

  console.log(chalk.cyan('✅ Telugu titles applied successfully!\n'));
}

applyTeluguTitles().catch(console.error);
