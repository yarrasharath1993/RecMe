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

// Batch 17 corrections (2020 movies - Before 2021 - 1of6)
const batch17Data: Record<string, Partial<MovieRow>> = {
  'bombhaat-2020': { TitleTe: 'బొంభాట్', Heroine: 'Chandini Chowdary' },
  'anukunnadhi-okkati-aynadhi-okkati-2020': { TitleTe: 'అనుకున్నది ఒక్కటి అయినది ఒక్కటి' },
  'amaram-akhilam-prema-2020': { TitleTe: 'అమరం అఖిలం ప్రేమ' },
  '3-monkeys-2020': { TitleTe: '3 మంకీస్' },
  'thagite-thandana-2020': { TitleTe: 'తాగితే తందన' },
  'middle-class-melodies-2020': { TitleTe: 'మిడిల్ క్లాస్ మెలోడీస్' },
  'pressure-cooker-2020': { TitleTe: 'ప్రెజర్ కుక్కర్' },
  'palasa-1978-2020': { TitleTe: 'పలాస 1978' },
  'entha-manchivaadavuraa-2020': { TitleTe: 'ఎంత మంచివాడవురా!' },
  'prema-pipasi-2020': { TitleTe: 'ప్రేమ పిపాసి' },
  'bhanumathi-and-ramakrishna-2020': { TitleEn: 'Bhanumathi & Ramakrishna', TitleTe: 'భానుమతి & రామకృష్ణ' },
  'run-2020': { TitleTe: 'రన్', Hero: 'Navdeep' },
  'dhira-2020': { TitleTe: 'ధీర', Hero: 'Animated', Heroine: 'No Female Lead' },
  'o-pitta-katha-2020': { TitleTe: 'ఓ పిట్ట కథ' },
  'uma-maheswara-ugra-roopasya-2020': { TitleTe: 'ఉమామహేశ్వర ఉగ్రరూపస్య' },
  'choosi-choodangaane-2020': { TitleTe: 'చూసీ చూడంగానే' },
  'shiva-143-2020': { TitleTe: 'శివ 143' },
  'valayam-2020': { TitleTe: 'వలయం' },
  'savaari-2020': { TitleTe: 'సవారీ' },
  'nishabdham-2020': { TitleTe: 'నిశ్శబ్దం' },
  'aswathama-2020': { TitleTe: 'అశ్వథామ' },
  'guvva-gorinka-2020': { TitleTe: 'గువ్వ గోరింక', Heroine: 'Priyalal' },
  'bheeshma-2020': { TitleTe: 'భీష్మ' },
  'hit-the-first-case-2020': { TitleEn: 'Hit: The First Case', TitleTe: 'హిట్' },
  'jaanu-2020': { TitleTe: 'జాను' },
  'cheema-prema-madhyalo-bhama-2020': { TitleTe: 'చీమ ప్రేమ మధ్యలో భామ' },
  'dubsmash-2020': { TitleTe: 'డబ్ స్మాష్' },
  '302-2020': { TitleTe: '302' },
  'neevalle-nenunna-2020': { TitleTe: 'నీవల్లే నేనున్నా' },
  'madha-2020': { TitleTe: 'మధ' },
  'nirbandham-2020': { TitleTe: 'నిర్బంధం' },
  'dirty-hari-2020': { TitleTe: 'డర్టీ హరి', Hero: 'Shravan Reddy' },
  'meka-suri-2-2020': { TitleTe: 'మేక సూరి 2' },
  'life-anubavinchu-raja-2020': { TitleTe: 'లైఫ్ అనుభవించు రాజా' },
  'oka-chinna-viramam-2020': { TitleTe: 'ఒక చిన్న విరామం' },
  'anaganaga-o-athidhi-2020': { TitleTe: 'అనగనగా ఓ అతిథి' },
  'iit-krishnamurthy-2020': { TitleTe: 'ఐఐటీ కృష్ణమూర్తి' },
  'krishna-and-his-leela-2020': { TitleTe: 'కృష్ణ అండ్ హిజ్ లీలా' },
  'murder-2020': { TitleTe: 'మర్డర్' },
  'degree-college-2020': { TitleTe: 'డిగ్రీ కాలేజీ' },
  'miss-india-2020': { TitleTe: 'మిస్ ఇండియా', Hero: 'No Hero Lead' },
  'metro-kathalu-2020': { TitleTe: 'మెట్రో కథలు' },
  'orey-bujjiga-2020': { TitleTe: 'ఒరేయ్ బుజ్జిగా' },
  'meka-suri-2020': { TitleTe: 'మేక సూరి' },
  'eureka-2020': { TitleTe: 'యురేకా' },
  'ala-vaikunthapurramloo-2020': { TitleTe: 'అల వైకుంఠపురములో' },
  'solo-brathuke-so-better-2020': { TitleTe: 'సోలో బ్రతుకే సో బెటర్', Hero: 'Sai Durgha Tej' },
  'raahu-2020': { TitleTe: 'రాహు' },
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

async function applyBatch17Corrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         APPLYING BATCH 17 CORRECTIONS (2020 Movies)                 ║'));
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

  console.log(chalk.yellow('📋 Processing Batch 17 (2020 - Before 2021 - 1of6):\n'));
  console.log(chalk.cyan('   • 50 movies from 2020\n'));

  for (const [slug, correction] of Object.entries(batch17Data)) {
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
        if (updatedCount <= 15 || updatedCount > 40) {
          console.log(chalk.cyan(`${updatedCount}. ${movie.TitleEn} (${slug})`));
          changes.forEach(change => console.log(chalk.gray(`   ${change}`)));
        } else if (updatedCount === 16) {
          console.log(chalk.gray('\n   ... (processing movies 16-40) ...\n'));
        }
      }
    }
  }

  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch17.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                       BATCH 17 SUMMARY                                '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Movies updated: ${updatedCount}`));
  console.log(chalk.green(`✅ Telugu titles added: ${teluguTitlesAdded}`));
  console.log(chalk.yellow(`✅ Cast corrections: ${castCorrections}`));
  console.log(chalk.yellow(`✅ Director corrections: ${directorCorrections}`));
  console.log(chalk.yellow(`✅ Title corrections: ${titleCorrections}`));
  console.log(chalk.cyan(`\n📊 Total Telugu titles: ${filled}/${total} (${percentage}%)`));
  console.log(chalk.yellow(`⏳ Still pending: ${total - filled}\n`));

  const barLength = 50;
  const filledBars = Math.round((percentage / 100) * barLength);
  const emptyBars = barLength - filledBars;
  
  console.log(chalk.cyan('Overall Progress:'));
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(emptyBars)) + ` ${percentage}%\n`);

  console.log(chalk.cyan(`📁 Backup: ${backupFile}`));
  console.log(chalk.green(`📁 Updated: ${MAIN_CSV}\n`));

  console.log(chalk.green.bold('🎉 BATCH 17 COMPLETE!\n'));
  console.log(chalk.yellow('🎯 Next: Batch 18-22 (Before 2021, 227 movies remaining)\n'));
}

applyBatch17Corrections().catch(console.error);
