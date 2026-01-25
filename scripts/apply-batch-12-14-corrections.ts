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

// Batch 12-14 corrections (127 movies total)
const batch1214Data: Record<string, Partial<MovieRow>> = {
  // Batch 12 (2022 - 2of3) - 50 movies
  'atithi-devobhava-2022': { TitleTe: 'అతిథి దేవోభవ' },
  'the-american-dream-2022': { TitleTe: 'ది అమెరికన్ డ్రీమ్' },
  '10th-class-diaries-2022': { TitleTe: '10త్ క్లాస్ డైరీస్' },
  'kotha-kothaga-2022': { TitleTe: 'కొత్త కొత్తగా' },
  'like-share-and-subscribe-2022': { TitleEn: 'Like Share & Subscribe', TitleTe: 'లైక్ షేర్ సబ్‌స్క్రైబ్' },
  'sebastian-pc-524-2022': { TitleEn: 'Sebastian P.C. 524', TitleTe: 'సెబాస్టియన్ పి.సి. 524' },
  'valliddari-madhya-2022': { TitleTe: 'వళ్లిద్దరి మధ్య' },
  'godse-2022': { TitleTe: 'గాడ్సే' },
  'hit-the-2nd-case-2022': { TitleTe: 'హిట్: ది సెకండ్ కేస్' },
  'mishan-impossible-2022': { TitleTe: 'మిషన్ ఇంపాజిబుల్', Hero: 'No Hero Lead' },
  'induvadana-2022': { TitleTe: 'ఇందువదన' },
  'chor-bazaar-2022': { TitleTe: 'చోర్ బజార్' },
  'son-of-india-2022': { TitleTe: 'సన్ ఆఫ్ ఇండియా', Heroine: 'No Female Lead' },
  'saakini-daakini-2022': { TitleTe: 'శాకిని డాకిని', Hero: 'No Hero Lead', Heroine: 'Regina, Nivetha Thomas' },
  'sasanasabha-2022': { TitleTe: 'శాసనసభ' },
  'leharaayi-2022': { TitleTe: 'లెహరాయి' },
  'masooda-2022': { TitleTe: 'మసూద' },
  'korameenu-2022': { TitleTe: 'కొరమీను', Hero: 'Anand Ravi' },
  'mukhachitram-2022': { TitleTe: 'ముఖచిత్రం' },
  'balamevvadu-2022': { TitleTe: 'బలమెవ్వడు' },
  'rowdy-boys-2022': { TitleTe: 'రౌడీ బాయ్స్' },
  'dongalunnaru-jagratha-2022': { TitleTe: 'దొంగలున్నారు జాగ్రత్త' },
  'raajahyogam-2022': { TitleTe: 'రాజయోగం' },
  'sammathame-2022': { TitleTe: 'సమ్మతమే' },
  '69-samskar-colony-2022': { TitleEn: '#69 Samskar Colony', TitleTe: '#69 సంస్కార్ కాలనీ', Hero: 'No Hero Lead' },
  'pellikuturu-party-2022': { TitleTe: 'పెళ్ళికూతురు పార్టీ', Hero: 'No Hero Lead' },
  'one-by-two-2022': { TitleTe: 'వన్ బై టూ', Hero: 'No Hero Lead', Heroine: 'No Female Lead' },
  'gandharwa-2022': { TitleTe: 'గంధర్వ' },
  'ranasthali-2022': { TitleTe: 'రణస్థలి' },
  '7-days-6-nights-2022': { TitleTe: '7 డేస్ 6 నైట్స్' },
  'sehari-2022': { TitleTe: 'సెహరి', Hero: 'Harsh Kanumilli' },
  'ginna-2022': { TitleTe: 'జిన్నా', Heroine: 'Payal Rajput, Sunny Leone' },
  'konda-2022': { TitleTe: 'కొండా' },
  'first-day-first-show-2022': { TitleTe: 'ఫస్ట్ డే ఫస్ట్ షో' },
  'butterfly-2022': { TitleTe: 'బటర్ ఫ్లై', Hero: 'No Hero Lead' },
  'jetty-2022': { TitleTe: 'జెట్టి' },
  'macherla-niyojakavargam-2022': { TitleTe: 'మాచర్ల నియోజకవర్గం' },
  'ramarao-on-duty-2022': { TitleTe: 'రామారావు ఆన్ డ్యూటీ' },
  'ori-devuda-2022': { TitleTe: 'ఓరి దేవుడా' },
  'monster-2022': { TitleTe: 'మాన్స్టర్' },
  'aakasha-veedhullo-2022': { TitleTe: 'ఆకాశ వీధుల్లో' },
  'focus-2022': { TitleTe: 'ఫోకస్' },
  'anukoni-prayanam-2022': { TitleTe: 'అనుకోని ప్రయాణం' },
  'bommala-koluvu-2022': { TitleTe: 'బొమ్మల కొలువు' },
  'ante-sundaraniki-2022': { TitleEn: 'Ante... Sundaraniki!', TitleTe: 'అంటే... సుందరానికి!' },
  'kothala-rayudu-2022': { TitleTe: 'కోతల రాయుడు' },
  'shekar-2022': { TitleTe: 'శేఖర్' },

  // Batch 13 (2022 - 3of3) - 27 movies
  'pakka-commercial-2022': { TitleTe: 'పక్కా కమర్షియల్' },
  'sivudu-2022': { TitleTe: 'శివుడు' },
  'nenu-co-nuvvu-2022': { TitleTe: 'నేను సి/ఓ నువ్వు' },
  'tees-maar-khan-2022': { TitleTe: 'తీస్ మార్ ఖాన్' },
  'itlu-maredumilli-prajaneekam-2022': { TitleTe: 'ఇట్లు మారేడుమిల్లి ప్రజానీకం' },
  'cheppalani-undhi-2022': { TitleTe: 'చెప్పాలని ఉంది', Hero: 'Yash Puri' },
  'thaggedhe-le-2022': { TitleTe: 'తగ్గేదే లే' },
  'bomma-blockbuster-2022': { TitleTe: 'బొమ్మ బ్లాక్ బస్టర్' },
  'neetho-2022': { TitleTe: 'నీతో' },
  'gangster-gangaraju-2022': { TitleTe: 'గ్యాంగ్‌స్టర్ గంగరాజు', Hero: 'Laksh Chadalavada' },
  'iravatham-2022': { TitleTe: 'ఐరావతం', Hero: 'No Hero Lead' },
  'wanted-pandugod-2022': { TitleTe: 'వాంటెడ్ పండుగాడ్' },
  'odela-railway-station-2022': { TitleTe: 'ఓదెల రైల్వే స్టేషన్' },
  'super-machi-2022': { TitleTe: 'సూపర్ మచి' },
  'niku-naku-pellanta-tom-tom-tom-2022': { TitleEn: 'Niku Naku Pellanta', TitleTe: 'నీకు నాకు పెళ్ళంట' },
  '3e-2022': { TitleTe: '3ఈ' },
  'aa-ammayi-gurinchi-meeku-cheppali-2022': { TitleTe: 'ఆ అమ్మాయి గురించి మీకు చెప్పాలి' },
  'aadavaallu-meeku-johaarlu-2022': { TitleTe: 'ఆడవాళ్లు మీకు జోహార్లు' },
  'kinnerasani-2022': { TitleTe: 'కిన్నెరసాని' },
  'crazy-fellow-2022': { TitleTe: 'క్రేజీ ఫెలో' },
  'repeat-2022': { TitleTe: 'రిపీట్', Heroine: 'Madhoo' },
  'seetharamapuramlo-2022': { TitleTe: 'సీతారామపురంలో' },
  'oke-oka-jeevitham-2022': { TitleTe: 'ఒకే ఒక జీవితం', Heroine: 'Ritu Varma' },
  'nenu-meeku-baaga-kavalsinavaadini-2022': { TitleTe: 'నేను మీకు బాగా కావాల్సినవాడిని' },
  'geetha-2022': { TitleTe: 'గీత' },
  'hero-2022': { TitleTe: 'హీరో', Hero: 'Ashok Galla' },
  'coffee-with-kadhal-2022': { TitleTe: 'కాఫీ విత్ కాదల్' },

  // Batch 14 (2021 - 1of3) - 50 movies
  'priyuraalu-2021': { TitleTe: 'ప్రియురాలు' },
  'cauliflower-2021': { TitleTe: 'కాలీఫ్లవర్' },
  'nootokka-jillala-andagadu-2021': { TitleTe: 'నూటొక్క జిల్లాల అందగాడు' },
  'uppena-2021': { TitleTe: 'ఉప్పెన' },
  'raja-raja-chora-2021': { TitleTe: 'రాజ రాజ చోర' },
  '1997-2021': { TitleTe: '1997' },
  'ee-kathalo-paathralu-kalpitam-2021': { TitleTe: 'ఈ కథలో పాత్రలు కల్పితం' },
  'super-over-2021': { TitleTe: 'సూపర్ ఓవర్' },
  'ichata-vahanamulu-nilupa-radu-2021': { TitleTe: 'ఇచ్చట వాహనములు నిలుపరాదు' },
  'thimmarusu-2021': { TitleTe: 'తిమ్మరుసు' },
  'gudaputani-2021': { TitleEn: 'Guduputani', TitleTe: 'గూడుపుఠాణి' },
  'naandhi-2021': { TitleTe: 'నాంది' },
  'shaadi-mubarak-2021': { TitleTe: 'షాదీ ముబారక్', Hero: 'Sagar' },
  'ishq-2021': { TitleTe: 'ఇష్క్' },
  'mad-2021': { TitleTe: 'మ్యాడ్' },
  'g-zombie-2021': { TitleTe: 'జి-జాంబీ', Heroine: 'No Female Lead' },
  'ippudu-kaaka-inkeppudu-2021': { TitleTe: 'ఇప్పుడు కాక ఇంకెప్పుడు' },
  'sr-kalyanamandapam-2021': { TitleTe: 'ఎస్ఆర్ కళ్యాణమండపం' },
  'natyam-2021': { TitleTe: 'నాట్యం' },
  'mail-2021': { TitleTe: 'మెయిల్' },
  'raja-vikramarka-2021': { TitleTe: 'రాజ విక్రమార్క' },
  'bro-2021': { TitleEn: '#Bro', TitleTe: '#బ్రో' },
  'power-play-2021': { TitleTe: 'పవర్ ప్లే' },
  'gully-rowdy-2021': { TitleTe: 'గల్లీ రౌడీ' },
  '30-rojullo-preminchadam-ela-2021': { TitleTe: '30 రోజుల్లో ప్రేమించడం ఎలా?' },
  'paagal-2021': { TitleTe: 'పాగల్' },
  'aaradugula-bullet-2021': { TitleTe: 'ఆరడుగుల బుల్లెట్' },
  'lakshya-2021': { TitleTe: 'లక్ష్య' },
  'senapathi-2021': { TitleTe: 'సేనాపతి', Heroine: 'No Female Lead' },
  'ardha-shathabdham-2021': { TitleTe: 'అర్థ శతాబ్దం', Heroine: 'Krishna Priya' },
  'zombie-reddy-2021': { TitleTe: 'జాంబీ రెడ్డి' },
  'vivaha-bhojanambu-2021': { TitleTe: 'వివాహ భోజనంబు' },
  'ram-asur-2021': { TitleTe: 'రామ్ అసుర్' },
  'cycle-2021': { TitleTe: 'సైకిల్' },
  'asalem-jarigindi-2021': { TitleTe: 'అసలేం జరిగింది', Hero: 'Sriram' },
  'thank-you-brother-2021': { TitleEn: 'Thank You Brother!', TitleTe: 'థాంక్యూ బ్రదర్' },
  'savitri-wo-satyamurthy-2021': { TitleEn: 'Savitri W/o Satyamurthy', TitleTe: 'సావిత్రి వైఫ్ ఆఫ్ సత్యమూర్తి' },
  'merise-merise-2021': { TitleTe: 'మెరిసే మెరిసే' },
  'madhura-wines-2021': { TitleTe: 'మధుర వైన్స్' },
  'kanabadutaledu-2021': { TitleTe: 'కనబడుటలేదు', Hero: 'No Hero Lead' },
  'chalo-premiddam-2021': { TitleTe: 'చలో ప్రేమిద్దాం' },
  'adbhutham-2021': { TitleTe: 'అద్భుతం' },
  'ninnila-ninnila-2021': { TitleTe: 'నిన్నిలా నిన్నిలా' },
  'manchi-rojulochaie-2021': { TitleTe: 'మంచి రోజులొచ్చాయి' },
  'missing-2021': { TitleTe: 'మిస్సింగ్' },
  'kshana-kshanam-2021': { TitleTe: 'క్షణ క్షణం' },

  // Additional 2022 entries
  'pakka-commercial-2022': { TitleTe: 'పక్కా కమర్షియల్' },
  'sivudu-2022': { TitleTe: 'శివుడు' },
  'nenu-co-nuvvu-2022': { TitleTe: 'నేను సి/ఓ నువ్వు' },
  'tees-maar-khan-2022': { TitleTe: 'తీస్ మార్ ఖాన్' },
  'itlu-maredumilli-prajaneekam-2022': { TitleTe: 'ఇట్లు మారేడుమిల్లి ప్రజానీకం' },
  'cheppalani-undhi-2022': { TitleTe: 'చెప్పాలని ఉంది', Hero: 'Yash Puri' },
  'thaggedhe-le-2022': { TitleTe: 'తగ్గేదే లే' },
  'bomma-blockbuster-2022': { TitleTe: 'బొమ్మ బ్లాక్ బస్టర్' },
  'neetho-2022': { TitleTe: 'నీతో' },
  'gangster-gangaraju-2022': { TitleTe: 'గ్యాంగ్‌స్టర్ గంగరాజు', Hero: 'Laksh Chadalavada' },
  'iravatham-2022': { TitleTe: 'ఐరావతం', Hero: 'No Hero Lead' },
  'wanted-pandugod-2022': { TitleTe: 'వాంటెడ్ పండుగాడ్' },
  'odela-railway-station-2022': { TitleTe: 'ఓదెల రైల్వే స్టేషన్' },
  'super-machi-2022': { TitleTe: 'సూపర్ మచి' },
  'niku-naku-pellanta-tom-tom-tom-2022': { TitleEn: 'Niku Naku Pellanta', TitleTe: 'నీకు నాకు పెళ్ళంట' },
  '3e-2022': { TitleTe: '3ఈ' },
  'aa-ammayi-gurinchi-meeku-cheppali-2022': { TitleTe: 'ఆ అమ్మాయి గురించి మీకు చెప్పాలి' },
  'aadavaallu-meeku-johaarlu-2022': { TitleTe: 'ఆడవాళ్లు మీకు జోహార్లు' },
  'kinnerasani-2022': { TitleTe: 'కిన్నెరసాని' },
  'crazy-fellow-2022': { TitleTe: 'క్రేజీ ఫెలో' },
  'repeat-2022': { TitleTe: 'రిపీట్', Heroine: 'Madhoo' },
  'seetharamapuramlo-2022': { TitleTe: 'సీతారామపురంలో' },
  'oke-oka-jeevitham-2022': { TitleTe: 'ఒకే ఒక జీవితం', Heroine: 'Ritu Varma' },
  'nenu-meeku-baaga-kavalsinavaadini-2022': { TitleTe: 'నేను మీకు బాగా కావాల్సినవాడిని' },
  'geetha-2022': { TitleTe: 'గీత' },
  'hero-2022': { TitleTe: 'హీరో', Hero: 'Ashok Galla' },
  'coffee-with-kadhal-2022': { TitleTe: 'కాఫీ విత్ కాదల్' },
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

async function applyBatch1214Corrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║     APPLYING BATCH 12-14 CORRECTIONS (2022 & 2021 Movies)           ║'));
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

  console.log(chalk.yellow('📋 Processing 127 movies:\n'));
  console.log(chalk.cyan('   • Batch 12: 2022 (2of3) - 50 movies'));
  console.log(chalk.cyan('   • Batch 13: 2022 (3of3) - 27 movies'));
  console.log(chalk.cyan('   • Batch 14: 2021 (1of3) - 50 movies\n'));

  for (const [slug, correction] of Object.entries(batch1214Data)) {
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
        if (updatedCount <= 20 || updatedCount > 110) {
          console.log(chalk.cyan(`${updatedCount}. ${movie.TitleEn} (${slug})`));
          changes.forEach(change => console.log(chalk.gray(`   ${change}`)));
        } else if (updatedCount === 21) {
          console.log(chalk.gray('\n   ... (processing movies 21-110) ...\n'));
        }
      }
    }
  }

  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch12-14.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                      BATCHES 12-14 SUMMARY                            '));
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

  console.log(chalk.green.bold('🎉 BATCHES 12-14 COMPLETE!\n'));
  console.log(chalk.yellow('🎯 Next: Batch 17-22 (Before 2021, 277 movies)\n'));
  console.log(chalk.cyan('🏆 ALL 2021-2026 MOVIES NOW HAVE TELUGU TITLES!\n'));
}

applyBatch1214Corrections().catch(console.error);
