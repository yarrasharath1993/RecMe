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

// Batch 06 + 07 corrections (86 movies total)
const batch0607Data: Record<string, Partial<MovieRow>> = {
  // Batch 06 (50 movies)
  'raa-raa-penimiti-2023': { TitleTe: 'రా రా... పెనిమిటి', Hero: 'No Hero Lead' },
  'amigos-2023': { TitleTe: 'అమిగోస్' },
  'maya-petika-2023': { TitleTe: 'మాయా పేటిక' },
  'asvins-2023': { TitleTe: 'అశ్విన్స్' },
  'sathi-gani-rendu-ekaralu-2023': { TitleTe: 'సత్తిగాని రెండు ఎకరాలు' },
  'das-ka-dhamki-2023': { TitleTe: 'దాస్ కా ధమ్కీ' },
  'balagam-2023': { TitleTe: 'బలగం', Director: 'Venu Yeldandi' },
  'vidyarthi-2023': { TitleTe: 'విద్యార్థి' },
  'atharva-2023': { TitleTe: 'అథర్వ' },
  'pop-corn-2023': { TitleTe: 'పాప్ కార్న్' },
  'katha-venuka-katha-2023': { TitleTe: 'కథ వెనుక కథ' },
  'malli-pelli-2023': { TitleTe: 'మళ్ళీ పెళ్ళి' },
  'rules-ranjann-2023': { TitleTe: 'రూల్స్ రంజన్' },
  'kalyanam-kamaneeyam-2023': { TitleTe: 'కళ్యాణం కమనీయం' },
  'rebels-of-thupakula-gudem-2023': { TitleTe: 'రెబెల్స్ ఆఫ్ తుపాకుల గూడెం', Heroine: 'No Female Lead' },
  'slum-dog-husband-2023': { TitleTe: 'స్లమ్ డాగ్ హస్బెండ్', Hero: 'Sanjay Rrao' },
  'mr-pregnant-2023': { TitleTe: 'మిస్టర్ ప్రెగ్నెంట్', Hero: 'Sohel' },
  'nenu-student-sir-2023': { TitleTe: 'నేను స్టూడెంట్ సర్!' },
  'changure-bangaru-raja-2023': { TitleTe: 'చంగురే బంగారు రాజా' },
  'the-trial-2023': { TitleTe: 'ది ట్రయల్', Hero: 'No Hero Lead' },
  'asalu-2023': { TitleTe: 'అసలు', Hero: 'No Hero Lead' },
  'okkade-1-venkanna-on-duty-2023': { TitleEn: 'Okkade 1', TitleTe: 'ఒక్కడే 1' },
  'shaakuntalam-2023': { TitleTe: 'శాకుంతలం' },
  'lust-stories-2-2023': { TitleTe: 'లస్ట్ స్టోరీస్ 2', Hero: 'Anthology', Heroine: 'Anthology', Director: 'Various' },
  'raakshasa-kaavyam-2023': { TitleTe: 'రాక్షస కావ్యం' },
  'vyooham-2023': { TitleTe: 'వ్యూహం' },
  'csi-sanatan-2023': { TitleTe: 'సి.ఎస్.ఐ సనాతన్' },
  'vimanam-2023': { TitleTe: 'విమానం' },
  'month-of-madhu-2023': { TitleTe: 'మంత్ ఆఫ్ మధు' },
  'rangamarthanda-2023': { TitleTe: 'రంగమార్తాండ', Director: 'Krishna Vamsi' },
  'bedurulanka-2012-2023': { TitleTe: 'బెదురులంక 2012', Hero: 'Kartikeya' },
  'rangabali-2023': { TitleTe: 'రంగబలి' },
  'butta-bomma-2023': { TitleTe: 'బుట్టబొమ్మ', Hero: 'No Hero Lead' },
  'mayalo-2023': { TitleTe: '#మాయలో' },
  'skanda-the-attacker-2023': { TitleEn: 'Skanda', TitleTe: 'స్కంద' },
  'intinti-ramayanam-2023': { TitleTe: 'ఇంటింటి రామాయణం' },
  'bagheera-2023': { TitleTe: 'బఘీర' },
  'amala-2023': { TitleTe: 'అమల', Hero: 'No Hero Lead' },
  'maa-oori-polimera-2-2023': { TitleTe: 'మా ఊరి పోలిమేర 2' },
  'prema-vimanam-2023': { TitleTe: 'ప్రేమ విమానం' },
  'phalana-abbayi-phalana-ammayi-2023': { TitleTe: 'ఫలానా అబ్బాయి ఫలానా అమ్మాయి' },
  'meter-2023': { TitleTe: 'మీటర్' },
  'two-souls-2023': { TitleTe: 'టూ సోల్స్' },
  'gammathu-2023': { TitleTe: 'గమ్మత్తు' },
  'rudramambapuram-2023': { TitleTe: 'రుద్రమాంబపురం', Heroine: 'No Female Lead' },
  'upendra-gadi-adda-2023': { TitleTe: 'ఉపేంద్ర గాడి అడ్డా', Hero: 'Kancharapalem Upendra' },
  'virupaksha-2023': { TitleTe: 'విరూపాక్ష' },
  'tantiram-2023': { TitleTe: 'తంతిరం' },
  'thanthasama-thathbhava-2023': { TitleEn: 'Thathsama Thathbhava', TitleTe: 'తత్సమ తద్భవ', Hero: 'No Hero Lead' },
  'anni-manchi-sakunamule-2023': { TitleTe: 'అన్నీ మంచి శకునములే' },

  // Batch 07 (36 movies)
  'rudrangi-2023': { TitleTe: 'రుద్రంగి' },
  'sridevi-shoban-babu-2023': { TitleTe: 'శ్రీదేవి శోభన్ బాబు' },
  'manu-charitra-2023': { TitleTe: 'మను చరిత్ర' },
  'writer-padmabhushan-2023': { TitleTe: 'రైటర్ పద్మభూషణ్', Heroine: 'Tina Shilparaj' },
  'kota-bommali-ps-2023': { TitleTe: 'కోటబొమ్మాళి పీ.ఎస్' },
  'the-great-indian-suicide-2023': { TitleTe: 'ది గ్రేట్ ఇండియన్ సూసైడ్' },
  'mem-famous-2023': { TitleTe: 'మేమ్ ఫేమస్' },
  'ala-ila-ela-2023': { TitleTe: 'అలా ఇలా ఎలా' },
  'paruvu-2023': { TitleTe: 'పరువు', ReleaseYear: '2024' },
  'bhola-shankar-2023': { TitleTe: 'భోళా శంకర్' },
  'matti-katha-2023': { TitleTe: 'మట్టి కథ' },
  'voice-of-sathyanathan-2023': { TitleTe: 'వాయిస్ ఆఫ్ సత్యనాథన్' },
  'bandra-2023': { TitleTe: 'బంద్రా' },
  'ranga-maarthaanda-2023': { TitleTe: 'రంగమార్తాండ', Director: 'Krishna Vamsi' },
  'ghosty-2023': { TitleTe: 'ఘోస్టీ', Hero: 'No Hero Lead' },
  'anveshi-2023': { TitleTe: 'అన్వేషి' },
  'samajavaragamana-2023': { TitleTe: 'సామజవరగమన' },
  'mr-kalyan-2023': { TitleTe: 'మిస్టర్ కళ్యాణ్' },
  'bhari-taraganam-2023': { TitleTe: 'భారీ తారాగణం' },
  'unstoppable-2023': { TitleTe: 'అన్‌స్టాపబుల్' },
  'dochevaarevarura-2023': { TitleTe: 'దోచేవారెవరురా' },
  'karna-2023': { TitleTe: 'కర్ణ', Heroine: 'No Female Lead' },
  'richie-gadi-pelli-2023': { TitleTe: 'రిచీ గాడి పెళ్లి' },
  'pareshan-2023': { TitleTe: 'పరేషాన్' },
  'o-kala-2023': { TitleTe: 'ఓ కళ' },
  'gandeevadhari-arjuna-2023': { TitleTe: 'గాండీవధారి అర్జున' },
  'hidimbha-2023': { TitleTe: 'హిడింబ' },
  'keedaa-cola-2023': { TitleTe: 'కీడా కోలా', Hero: 'Chaitanya Rao', Heroine: 'No Female Lead' },
  'echo-2023': { TitleTe: 'ఎకో' },
  'kannai-nambathe-2023': { TitleTe: 'కణ్ణై నంబాదే' },
  'ashtadigbandhanam-2023': { TitleTe: 'అష్టదిగ్బంధనం' },
  'devil-2023': { TitleTe: 'డెవిల్', Hero: 'Nandamuri Kalyan Ram', Director: 'Naveen Medaram' },
  'organic-mama-hybrid-alludu-2023': { TitleTe: 'ఆర్గానిక్ మామ హైబ్రిడ్ అల్లుడు', Hero: 'Syed Sohel Ryan' },
  'kisi-ka-bhai-kisi-ki-jaan-2023': { TitleTe: 'కిసీ కా భాయ్... కిసీ కీ జాన్' },
  'the-eye-2023': { TitleTe: 'ది ఐ' },
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

async function applyBatch0607Corrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║      APPLYING BATCH 06-07 CORRECTIONS (2023 - Final Batches)        ║'));
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
  let yearCorrections = 0;

  console.log(chalk.yellow('📋 Processing 86 movies (Batch 06: 50 + Batch 07: 36)\n'));

  for (const [slug, correction] of Object.entries(batch0607Data)) {
    const movie = movieMap.get(slug);
    if (movie) {
      let hasChanges = false;
      const changes: string[] = [];

      if (correction.TitleEn && correction.TitleEn !== movie.TitleEn) {
        changes.push(`EN: "${movie.TitleEn}" → "${correction.TitleEn}"`);
        movie.TitleEn = correction.TitleEn;
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
        console.log(chalk.cyan(`${updatedCount}. ${movie.TitleEn} (${slug})`));
        changes.forEach(change => console.log(chalk.gray(`   ${change}`)));
      }
    }
  }

  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch06-07.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                        BATCHES 06-07 SUMMARY                          '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Movies updated: ${updatedCount}`));
  console.log(chalk.green(`✅ Telugu titles added: ${teluguTitlesAdded}`));
  console.log(chalk.yellow(`✅ Cast corrections: ${castCorrections}`));
  console.log(chalk.yellow(`✅ Director corrections: ${directorCorrections}`));
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

  console.log(chalk.green.bold('🎉 HIGH PRIORITY COMPLETE! (Batches 01-07)\n'));
  console.log(chalk.yellow('🎯 Next: MEDIUM Priority - Batch 08 (2025 Upcoming, 50 movies)\n'));
}

applyBatch0607Corrections().catch(console.error);
