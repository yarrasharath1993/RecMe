#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

const MAIN_CSV = 'movies-missing-telugu-titles-2026-01-14.csv';

interface MovieRow {
  Slug: string;
  TitleEn: string;
  TitleTe: string;
  ReleaseYear: string;
  Hero: string;
  Heroine: string;
  Director: string;
}

// Batch 21-22 corrections (2018 movies - Before 2021 - 5of6, 6of6) - FINAL BATCHES!
const batch2122Data: Record<string, Partial<MovieRow>> = {
  // Batch 21 (2018 movies - part 1)
  'kirrak-party-2018': { TitleTe: 'కిర్రాక్ పార్టీ' },
  'jamba-lakidi-pamba-2018': { TitleTe: 'జంబలకిడి పంబ' },
  'taxiwala-2018': { TitleTe: 'టాక్సీవాలా' },
  'manu-2018': { TitleTe: 'మను' },
  'padi-padi-leche-manasu-2018': { TitleTe: 'పడి పడి లేచె మనసు' },
  'kanam-2018': { TitleTe: 'కణం' },
  'saakshyam-2018': { TitleTe: 'సాక్ష్యం', Hero: 'Bellamkonda Srinivas' },
  'rx-100-2018': { TitleTe: 'ఆర్‌ఎక్స్ 100' },
  'shailaja-reddy-alludu-2018': { TitleTe: 'శైలజారెడ్డి అల్లుడు' },
  'co-kancharapalem-2018': { TitleEn: 'C/o Kancharapalem', TitleTe: 'కేరాఫ్ కంచరపాలెం' },
  'ammammagarillu-2018': { TitleTe: 'అమ్మమ్మగారిల్లు' },
  'rangu-2018': { TitleTe: 'రంగు' },
  'karma-kartha-kriya-2018': { TitleTe: 'కర్మ కర్త క్రియ' },
  'ego-2018': { TitleTe: 'ఈగో' },
  'ishtangaa-2018': { TitleTe: 'ఇష్టంగా' },
  'adhugo-2018': { TitleTe: 'అదుగో', Hero: 'Piglet (Lead)' },
  'moodu-puvulu-aaru-kayalu-2018': { TitleTe: 'మూడు పువ్వులు ఆరు కాయలు' },
  'bluff-master-2018': { TitleTe: 'బ్లఫ్ మాస్టర్' },
  'goodachari-2018': { TitleTe: 'గూఢచారి', Heroine: 'Sobhita Dhulipala' },
  'pantham-2018': { TitleTe: 'పంతం' },
  '24-kisses-2018': { TitleTe: '24 కిసెస్' },
  'idi-naa-love-story-2018': { TitleTe: 'ఇది నా లవ్ స్టోరీ' },
  'ee-maaya-peremito-2018': { TitleTe: 'ఈ మాయ పేరేమిటో' },
  'howrah-bridge-2018': { TitleTe: 'హౌరా బ్రిడ్జ్' },
  'lover-2018': { TitleTe: 'లవర్' },
  'mla-2018': { TitleTe: 'ఎమ్మేల్యే' },
  'ye-mantram-vesave-2018': { TitleTe: 'యే మంత్రం వేసావే', Hero: 'Vijay Deverakonda' },
  'sameeram-2018': { TitleTe: 'సమీరం' },
  'enduko-emo-2018': { TitleTe: 'ఎందుకో ఏమో' },
  'chalo-2018': { TitleTe: 'చలో', Heroine: 'Rashmika Mandanna' },
  'natakam-2018': { TitleTe: 'నాటకం' },
  'bhaagamathie-2018': { TitleTe: 'భాగమతి', Hero: 'No Hero Lead' },
  'wo-ram-2018': { TitleEn: 'W/o Ram', TitleTe: 'వైఫ్ ఆఫ్ రామ్' },
  'manasuku-nachindi-2018': { TitleTe: 'మనసుకు నచ్చింది' },
  'brand-babu-2018': { TitleTe: 'బ్రాండ్ బాబు' },
  'my-dear-marthandam-2018': { TitleTe: 'మై డియర్ మార్తాండం' },
  'silly-fellows-2018': { TitleTe: 'సిల్లీ ఫెలోస్', Hero: 'Allari Naresh, Sunil' },
  'tej-i-love-you-2018': { TitleEn: 'Tej... I Love You', TitleTe: 'తేజ్... ఐ లవ్ యు' },
  'krishnarjuna-yudham-2018': { TitleTe: 'కృష్ణార్జున యుద్ధం', Heroine: 'Anupama, Rukshar' },
  'next-enti-2018': { TitleEn: 'Next Enti?', TitleTe: 'నెక్స్ట్ ఏంటి?' },
  'awe-2018': { TitleEn: 'Awe!', TitleTe: 'అ!', Hero: 'Nani (Voice)' },

  // Batch 22 (2018 movies - part 2 - FINAL BATCH!)
  'rangula-ratnam-2018': { TitleTe: 'రంగుల రాట్నం' },
  'neevevaro-2018': { TitleTe: 'నీవెవరో' },
  'sivakasipuram-2018': { TitleTe: 'శివకాశీపురం' },
  'chalakkudykkaran-changathy-2018': { TitleTe: 'చాలకుడిక్కారన్ చంగాతి' },
  'krishnarjuna-yuddham-2018': { TitleTe: 'కృష్ణార్జున యుద్ధం' },
  'antariksham-9000-kmph-2018': { TitleTe: 'అంతరిక్షం 9000 KMPH' },
  'needi-naadi-oke-katha-2018': { TitleTe: 'నీది నాది ఒకే కథ' },
  'hushaaru-2018': { TitleTe: 'హుషారు' },
  'hyderabad-love-story-2018': { TitleTe: 'హైదరాబాద్ లవ్ స్టోరీ' },
  'gayatri-2018': { TitleTe: 'గాయత్రి' },
  'perfect-pati-2018': { TitleEn: 'Perfect Pati (TV Series)', TitleTe: 'పర్ఫెక్ట్ పతి' },
  'devadas-2018': { TitleTe: 'దేవదాస్', Hero: 'Nani, Nagarjuna' },
  'manchi-lakshanalunna-abbayi-2018': { TitleEn: 'MLA', TitleTe: 'ఎమ్మెల్యే' },
  'naa-nuvve-2018': { TitleTe: 'నా నువ్వే' },
  'bhale-manchi-chowka-beram-2018': { TitleTe: 'భలే మంచి చౌక బేరం' },
  'srinivasa-kalyanam-2018': { TitleTe: 'శ్రీనివాస కళ్యాణం', Heroine: 'Raashii Khanna' },
  'sammohanam-2018': { TitleTe: 'సమ్మోహనం' },
  'ee-nagaraniki-emaindi-2018': { TitleEn: 'Ee Nagaraniki Emaindi?', TitleTe: 'ఈ నగరానికి ఏమైంది?' },
  'amoli-2018': { TitleEn: 'Amoli (Documentary)', TitleTe: 'అమోలి', Hero: 'Nani (Telugu Voice)' },
  'parichayam-2018': { TitleTe: 'పరిచయం' },
  'anthervedam-2018': { TitleEn: 'Antarvedam', TitleTe: 'అంతర్వేదం' },
  'naa-peru-surya-naa-illu-india-2018': { TitleEn: 'Naa Peru Surya', TitleTe: 'నా పేరు సూర్య నా ఇల్లు ఇండియా' },
  'rachayitha-2018': { TitleTe: 'రచయిత' },
  'sarabha-2018': { TitleTe: 'శరభ' },
  'mehbooba-2018': { TitleTe: 'మెహబూబా' },
  'hello-guru-prema-kosame-2018': { TitleTe: 'హలో గురు ప్రేమ కోసమే' },
  'amar-akbar-anthony-2018': { TitleTe: 'అమర్ అక్బర్ ఆంటోనీ' },
};

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

async function applyBatch2122Corrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║   🎉 APPLYING FINAL BATCHES 21-22 (2018 Movies) 🎉                  ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const mainContent = readFileSync(MAIN_CSV, 'utf-8');
  const mainRecords = parseCSV(mainContent);
  
  const movieMap = new Map<string, MovieRow>();
  mainRecords.forEach(movie => movieMap.set(movie.Slug, movie));

  console.log(chalk.green(`✓ Loaded ${mainRecords.length} movies from main CSV\n`));

  let updatedCount = 0;
  let teluguTitlesAdded = 0;
  let castCorrections = 0;
  let directorCorrections = 0;
  let titleCorrections = 0;
  let yearCorrections = 0;

  console.log(chalk.yellow('📋 Processing FINAL Batches 21-22 (2018 - Before 2021):\n'));
  console.log(chalk.cyan('   • Batch 21: 2018 (5of6) - ~41 movies'));
  console.log(chalk.cyan('   • Batch 22: 2018 (6of6) - ~27 movies'));
  console.log(chalk.magenta.bold('   • THIS IS THE FINAL BATCH! 🎊\n'));

  for (const [slug, correction] of Object.entries(batch2122Data)) {
    const movie = movieMap.get(slug);
    if (movie) {
      let hasChanges = false;
      const changes: string[] = [];

      if (correction.TitleEn && correction.TitleEn !== movie.TitleEn) {
        changes.push(`EN: "${movie.TitleEn}" → "${correction.TitleEn}"`);
        movie.TitleEn = correction.TitleEn;
        titleCorrections++;
        hasChanges = true;
      }

      if (correction.TitleTe && correction.TitleTe !== movie.TitleTe) {
        changes.push(`TE: "${movie.TitleTe || 'EMPTY'}" → "${correction.TitleTe}"`);
        movie.TitleTe = correction.TitleTe;
        teluguTitlesAdded++;
        hasChanges = true;
      }

      if (correction.ReleaseYear && correction.ReleaseYear !== movie.ReleaseYear) {
        changes.push(`Year: ${movie.ReleaseYear} → ${correction.ReleaseYear}`);
        movie.ReleaseYear = correction.ReleaseYear;
        yearCorrections++;
        hasChanges = true;
      }

      if (correction.Hero && correction.Hero !== movie.Hero) {
        changes.push(`Hero: "${movie.Hero}" → "${correction.Hero}"`);
        movie.Hero = correction.Hero;
        castCorrections++;
        hasChanges = true;
      }

      if (correction.Heroine && correction.Heroine !== movie.Heroine) {
        changes.push(`Heroine: "${movie.Heroine}" → "${correction.Heroine}"`);
        movie.Heroine = correction.Heroine;
        castCorrections++;
        hasChanges = true;
      }

      if (correction.Director && correction.Director !== movie.Director) {
        changes.push(`Director: "${movie.Director}" → "${correction.Director}"`);
        movie.Director = correction.Director;
        directorCorrections++;
        hasChanges = true;
      }

      if (hasChanges) {
        updatedCount++;
        if (updatedCount <= 15 || updatedCount > 55) {
          console.log(chalk.cyan(`${updatedCount}. ${movie.TitleEn} (${slug})`));
          changes.forEach(change => console.log(chalk.gray(`   ${change}`)));
        } else if (updatedCount === 16) {
          console.log(chalk.gray('\n   ... (processing movies 16-55) ...\n'));
        }
      }
    }
  }

  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch21-22-FINAL.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('              🎉 FINAL BATCHES 21-22 SUMMARY 🎉                        '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Movies updated: ${updatedCount}`));
  console.log(chalk.green(`✅ Telugu titles added: ${teluguTitlesAdded}`));
  console.log(chalk.yellow(`✅ Cast corrections: ${castCorrections}`));
  console.log(chalk.yellow(`✅ Director corrections: ${directorCorrections}`));
  console.log(chalk.yellow(`✅ Title corrections: ${titleCorrections}`));
  console.log(chalk.yellow(`✅ Year corrections: ${yearCorrections}`));
  console.log(chalk.cyan(`\n📊 Total Telugu titles: ${filled}/${total} (${percentage}%)`));
  console.log(chalk.yellow(`⏳ Still pending: ${total - filled}\n`));

  const barLength = 50;
  const filledBars = Math.round((percentage / 100) * barLength);
  const emptyBars = barLength - filledBars;
  
  console.log(chalk.cyan('Overall Progress:'));
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(emptyBars)) + ` ${percentage}%\n`);

  console.log(chalk.cyan(`📁 Backup: ${backupFile}`));
  console.log(chalk.green(`📁 Updated: ${MAIN_CSV}\n`));

  if (percentage >= 85) {
    console.log(chalk.green.bold('🎉🎊 BATCHES 21-22 COMPLETE! 🎊🎉\n'));
    console.log(chalk.magenta.bold('🏆 ALL 22 BATCHES PROCESSED! 🏆\n'));
    console.log(chalk.yellow.bold('📊 PROJECT NEARLY COMPLETE!\n'));
  } else {
    console.log(chalk.green.bold('🎉 BATCHES 21-22 COMPLETE!\n'));
    console.log(chalk.yellow(`🎯 Remaining: ${total - filled} movies\n`));
  }
}

applyBatch2122Corrections().catch(console.error);
