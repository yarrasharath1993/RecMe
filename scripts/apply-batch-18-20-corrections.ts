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

// Batch 18-20 corrections (2019 movies - Before 2021 - 2of6, 3of6, 4of6)
const batch1820Data: Record<string, Partial<MovieRow>> = {
  // Batch 18 (2019 movies - part 1)
  'johaar-2020': { TitleTe: 'జోహార్', ReleaseYear: '2020', Hero: 'Ankith Koyya' },
  'maa-vintha-gaadha-vinuma-2020': { TitleTe: 'మా వింత గాధ వినుమా', ReleaseYear: '2020', Hero: 'Siddu Jonnalagadda' },
  'coronavirus-2020': { TitleTe: 'కరోనావైరస్', ReleaseYear: '2020' },
  'utthara-2020': { TitleTe: 'ఉత్తర', ReleaseYear: '2020' },
  '4-letters-2020': { TitleTe: '4 లెటర్స్', ReleaseYear: '2019' },
  'anaganaga-o-athdhi-2020': { TitleTe: 'అనగనగా ఓ అతిథి', ReleaseYear: '2020' },
  'sita-2019': { TitleTe: 'సీత' },
  'evadu-thakkuva-kaadu-2019': { TitleTe: 'ఎవడూ తక్కువ కాదు' },
  'prati-roju-pandaage-2019': { TitleTe: 'ప్రతి రోజూ పండగే' },
  '2-hours-love-2019': { TitleTe: '2 అవర్స్ లవ్' },
  'rahasyam-2019': { TitleTe: 'రహస్యం' },
  'nenu-aadhi-madyalo-maa-nanna-2019': { TitleTe: 'నేను అది మధ్యలో మా నాన్న' },
  'seven-2019': { TitleTe: 'సెవెన్' },
  'burra-katha-2019': { TitleTe: 'బుర్రకథ' },
  'abcd-american-born-confused-desi-2019': { TitleEn: 'ABCD', TitleTe: 'ఏబీసీడీ' },
  '1st-rank-raju-2019': { TitleTe: 'ఫస్ట్ ర్యాంక్ రాజు' },
  'chanakya-2019': { TitleTe: 'చాణక్య' },
  'ninu-veedani-needanu-nene-2019': { TitleTe: 'నిను వీడని నీడను నేనే' },
  'prema-katha-chitram-2-2019': { TitleTe: 'ప్రేమకథా చిత్రమ్ 2' },
  'software-sudheer-2019': { TitleTe: 'సాఫ్ట్‌వేర్ సుధీర్', Heroine: 'Dhanya Balakrishna' },
  'iddari-lokam-okate-2019': { TitleTe: 'ఇద్దరి లోకం ఒకటే' },
  'mr-majnu-2019': { TitleEn: 'Mr. Majnu', TitleTe: 'మిస్టర్ మజ్ను' },
  'special-2019': { TitleTe: 'స్పెషల్' },
  'aaviri-2019': { TitleTe: 'ఆవిరి', Hero: 'No Hero Lead' },
  'beach-road-chetan-2019': { TitleTe: 'బీచ్ రోడ్ చేతన్', Heroine: 'No Female Lead' },
  'jessie-2019': { TitleTe: 'జెస్సి' },
  'lakshmi-s-ntr-2019': { TitleEn: "Lakshmi's NTR", TitleTe: 'లక్ష్మీస్ ఎన్టీఆర్' },
  'operation-gold-fish-2019': { TitleTe: 'ఆపరేషన్ గోల్డ్ ఫిష్', Heroine: 'Sasha Chettri' },
  'rakshasudu-2019': { TitleTe: 'రాక్షసుడు' },
  'abhinetri-2-2019': { TitleTe: 'అభినేత్రి 2' },
  'raja-vaaru-rani-gaaru-2019': { TitleTe: 'రాజా వారు రాణి గారు', Heroine: 'Rahasya Gorak' },
  'mouname-ishtam-2019': { TitleTe: 'మౌనమే ఇష్టం' },
  'ragala-24-gantallo-2019': { TitleTe: 'రాగాల 24 గంటల్లో', Hero: 'No Hero Lead' },
  'voter-2019': { TitleTe: 'ఓటర్' },
  'gaddalakonda-ganesh-2019': { TitleTe: 'గద్దలకొండ గణేష్' },
  'rama-chakkani-seetha-2019': { TitleTe: 'రామ చక్కని సీత' },
  'tholu-bommalata-2019': { TitleTe: 'తోలుబొమ్మలాట' },
  'danger-love-story-2019': { TitleTe: 'డేంజర్ లవ్ స్టోరీ' },
  'krishna-rao-supermarket-2019': { TitleTe: 'కృష్ణారావు సూపర్ మార్కెట్' },
  'magnet-2019': { TitleTe: 'మాగ్నెట్' },
  'mithai-2019': { TitleTe: 'మిఠాయి', Heroine: 'No Female Lead' },

  // Batch 19 (2019 movies - part 2)
  'chitralahari-2019': { TitleTe: 'చిత్రలహరి' },
  '118-2019': { TitleTe: '118' },
  'thupaki-ramudu-2019': { TitleTe: 'తుపాకి రాముడు' },
  'bailampudi-2019': { TitleTe: 'బైలంపూడి' },
  'dorasaani-2019': { TitleTe: 'దొరసాని', Heroine: 'Shivathmika Rajashekar' },
  'suryakantham-2019': { TitleTe: 'సూర్యకాంతం' },
  'raju-gari-gadhi-3-2019': { TitleTe: 'రాజు గారి గది 3' },
  'amma-rajyam-lo-kadapa-biddalu-2019': { TitleTe: 'అమ్మ రాజ్యంలో కడప బిడ్డలు', Heroine: 'No Female Lead' },
  'dhrushti-2019': { TitleTe: 'దృష్టి' },
  'guna-369-2019': { TitleTe: 'గుణ 369' },
  'malli-malli-chusa-2019': { TitleTe: 'మళ్ళీ మళ్ళీ చూశా' },
  'mallesham-2019': { TitleTe: 'మల్లేశం' },
  'arjun-suravaram-2019': { TitleTe: 'అర్జున్ సురవరం' },
  'kalki-2019': { TitleTe: 'కల్కి', Hero: 'Rajasekhar' },
  'kousalya-krishnamurthy-2019': { TitleTe: 'కౌసల్య కృష్ణమూర్తి', Hero: 'No Hero Lead', Heroine: 'Aishwarya Rajesh' },
  'brochevarevarura-2019': { TitleTe: 'బ్రోచేవారెవరురా' },
  'bilalpur-police-station-2019': { TitleTe: 'బిలాల్‌పూర్ పోలీస్ స్టేషన్' },
  'kathanam-2019': { TitleTe: 'కథనం', Hero: 'No Hero Lead' },
  'heza-2019': { TitleTe: 'హెజా' },
  'manmadhudu-2-2019': { TitleTe: 'మన్మథుడు 2' },
  'yatra-2019': { TitleTe: 'యాత్ర', Heroine: 'No Female Lead' },
  'kothaga-maa-prayanam-2019': { TitleTe: 'కొత్తగా మా ప్రయాణం' },
  'edaina-jaragocchu-2019': { TitleTe: 'ఏదైనా జరగొచ్చు' },
  'bhagya-nagara-veedhullo-gammathu-2019': { TitleTe: 'భాగ్యనగర వీధుల్లో గమ్మత్తు' },
  'agent-sai-srinivasa-athreya-2019': { TitleTe: 'ఏజెంట్ సాయి శ్రీనివాస ఆత్రేయ' },
  'nivaasi-2019': { TitleTe: 'నివాసి' },
  'tenali-ramakrishna-ba-bl-2019': { TitleEn: 'Tenali Ramakrishna BA. BL', TitleTe: 'తెనాలి రామకృష్ణ బిఏ.బిఎల్' },
  'vinara-sodara-veera-kumara-2019': { TitleTe: 'వినరా సోదర వీర కుమార' },
  'kobbari-matta-2019': { TitleTe: 'కొబ్బరి మట్ట' },
  'vishwamitra-2019': { TitleTe: 'విశ్వామిత్ర', Hero: 'No Hero Lead' },
  'ntr-kathanayakudu-2019': { TitleEn: 'N.T.R: Kathanayakudu', TitleTe: 'ఎన్టీఆర్: కథానాయకుడు' },
  'ntr-mahanayakudu-2019': { TitleEn: 'N.T.R: Mahanayakudu', TitleTe: 'ఎన్టీఆర్: మహానాయకుడు' },
  'marshal-2019': { TitleTe: 'మార్షల్' },
  'ismart-shankar-2019': { TitleTe: 'ఇస్మార్ట్ శంకర్' },
  'ranarangam-2019': { TitleTe: 'రణరంగం' },
  'yedu-chepala-kadha-2019': { TitleTe: 'ఏడు చేపల కథ' },
  'sivaranjani-2019': { TitleTe: 'శివరంజని' },
  'chikati-gadilo-chithakotudu-2019': { TitleTe: 'చీకటి గదిలో చితక్కొట్టుడు' },
  'f2-fun-and-frustration-2019': { TitleEn: 'F2', TitleTe: 'ఎఫ్ 2' },
  'evaru-2019': { TitleTe: 'ఎవరు' },
  'where-is-the-venkatalakshmi-2019': { TitleTe: 'వేర్ ఈజ్ ది వెంకటలక్ష్మి', Heroine: 'Laxmi Raai' },
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

async function applyBatch1820Corrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║      APPLYING BATCH 18-20 CORRECTIONS (2019 Movies)                 ║'));
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

  console.log(chalk.yellow('📋 Processing Batches 18-20 (2019-2020 - Before 2021):\n'));
  console.log(chalk.cyan('   • Batch 18: 2019/2020 (2of6) - ~43 movies'));
  console.log(chalk.cyan('   • Batch 19: 2019 (3of6) - ~42 movies'));
  console.log(chalk.cyan('   • Batch 20: 2019 (4of6) - ~42 movies\n'));

  for (const [slug, correction] of Object.entries(batch1820Data)) {
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
        if (updatedCount <= 20 || updatedCount > 65) {
          console.log(chalk.cyan(`${updatedCount}. ${movie.TitleEn} (${slug})`));
          changes.forEach(change => console.log(chalk.gray(`   ${change}`)));
        } else if (updatedCount === 21) {
          console.log(chalk.gray('\n   ... (processing movies 21-65) ...\n'));
        }
      }
    }
  }

  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch18-20.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                     BATCHES 18-20 SUMMARY                             '));
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

  console.log(chalk.green.bold('🎉 BATCHES 18-20 COMPLETE!\n'));
  console.log(chalk.yellow('🎯 Next: Batch 21-22 (Before 2019, ~50 movies remaining)\n'));
}

applyBatch1820Corrections().catch(console.error);
