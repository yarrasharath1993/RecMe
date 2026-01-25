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

// Batch 15-16 corrections (72 movies total)
const batch1516Data: Record<string, Partial<MovieRow>> = {
  // Batch 15 (2021 - 2of3) - 42 movies
  'konda-polam-2021': { TitleTe: 'కొండ పొలం' },
  'pelli-sandad-2021': { TitleEn: 'Pelli SandaD', TitleTe: 'పెళ్ళి సందడి' },
  'gamanam-2021': { TitleTe: 'గమనం' },
  'aakashavaani-2021': { TitleTe: 'ఆకాశవాణి' },
  'maa-oori-polimera-2021': { TitleTe: 'మా ఊరి పొలిమేర' },
  'thimmarusu-assignment-vali-2021': { TitleEn: 'Thimmarusu', TitleTe: 'తిమ్మరుసు' },
  'a1-express-2021': { TitleTe: 'ఏ 1 ఎక్స్‌ప్రెస్' },
  'anubhavinchu-raja-2021': { TitleTe: 'అనుభవించు రాజా' },
  'alludu-adhurs-2021': { TitleTe: 'అల్లుడు అదుర్స్' },
  'www-2021': { TitleTe: 'డబ్ల్యూడబ్ల్యూడబ్ల్యూ' },
  'family-drama-2021': { TitleTe: 'ఫ్యామిలీ డ్రామా' },
  'arjuna-phalguna-2021': { TitleTe: 'అర్జున ఫల్గుణ' },
  'chaavu-kaburu-challaga-2021': { TitleTe: 'చావు కబురు చల్లగా' },
  'cinema-bandi-2021': { TitleTe: 'సినిమా బండి', Hero: 'Vikas Vashishta' },
  'fcuk-father-chitti-umaa-kaarthik-2021': { TitleEn: 'Fcuk', TitleTe: 'ఎఫ్.సి.యు.కె' },
  'seetimaarr-2021': { TitleTe: 'సీటీమార్' },
  'shukra-2021': { TitleTe: 'శుక్ర' },
  'mosagallu-2021': { TitleTe: 'మోసగాళ్ళు' },
  'sreekaram-2021': { TitleTe: 'శ్రీకారం' },
  'rang-de-2021': { TitleTe: 'రంగ్ దే' },
  'maha-samudram-2021': { TitleTe: 'మహా సముద్రం', Hero: 'Sharwanand, Siddharth' },
  'romantic-2021': { TitleTe: 'రొమాంటిక్' },
  'radha-krishna-2021': { TitleTe: 'రాధాకృష్ణ', Hero: 'Anurag' },
  'red-2021': { TitleTe: 'రెడ్' },
  'mmof-2021': { TitleTe: 'ఎం.ఎం.ఓ.ఎఫ్' },
  'deyyam-2021': { TitleTe: 'దెయ్యం' },
  'sashi-2021': { TitleTe: 'శశి' },
  'ksheera-sagara-madhanam-2021': { TitleTe: 'క్షీర సాగర మథనం' },
  'maestro-2021': { TitleTe: 'మాస్ట్రో' },
  'kapatadhaari-2021': { TitleTe: 'కపటధారి' },
  'ek-mini-katha-2021': { TitleTe: 'ఏక్ మినీ కథ' },
  'idhe-maa-katha-2021': { TitleTe: 'ఇదే మా కథ' },
  'love-life-pakodi-2021': { TitleTe: 'లవ్ లైఫ్ అండ్ పకోడీ' },
  'amma-deevena-2021': { TitleTe: 'అమ్మ దీవెన' },
  'jai-sena-2021': { TitleTe: 'జై సేన', Heroine: 'No Female Lead' },
  'check-2021': { TitleTe: 'చెక్' },
  'bangaru-bullodu-2021': { TitleTe: 'బంగారు బుల్లోడు' },
  'annapurnamma-gari-manavadu-2021': { TitleTe: 'అన్నపూర్ణమ్మ గారి మనవడు', Hero: 'Baladitya' },
  'tera-venuka-2021': { TitleTe: 'తెర వెనుక' },
  'nenu-leni-na-premakatha-2021': { TitleTe: 'నేను లేని నా ప్రేమకథ' },
  'april-28th-em-jarigindi-2021': { TitleTe: 'ఏప్రిల్ 28 ఏం జరిగింది' },
  'drushyam-2-2021': { TitleTe: 'దృశ్యం 2', Director: 'Jeethu Joseph' },

  // Batch 16 (2021 - 3of3) - 30 movies
  'climax-2021': { TitleTe: 'క్లైమాక్స్', Hero: 'Rajendra Prasad' },
  'saranam-gacchami-2021': { TitleTe: 'శరణం గచ్ఛామి' },
  'krish-2021': { TitleEn: 'Radha Krishna', TitleTe: 'రాధాకృష్ణ' },
  'pachchis-2021': { TitleTe: 'పచ్చీస్' },
  'narappa-2021': { TitleTe: 'నారప్ప' },
  'sita-on-the-road-2021': { TitleTe: 'సీత ఆన్ ది రోడ్', Hero: 'No Hero Lead' },
  'a-ad-infinitum-2021': { TitleEn: 'A (Ad Infinitum)', TitleTe: 'ఏ' },
  'gaali-sampath-2021': { TitleTe: 'గాలి సంపత్', Hero: 'Sree Vishnu' },
  'sridevi-soda-center-2021': { TitleTe: 'శ్రీదేవి సోడా సెంటర్' },
  'itlu-amma-2021': { TitleTe: 'ఇట్లు అమ్మ', Hero: 'No Hero Lead' },
  'bomma-adirindi-dimma-tirigindi-2021': { TitleTe: 'బొమ్మ అదిరింది దిమ్మ తిరిగింది' },
  'raani-2021': { TitleTe: 'రాణి', Hero: 'No Hero Lead' },
  'most-eligible-bachelor-2021': { TitleTe: 'మోస్ట్ ఎలిజిబుల్ బ్యాచిలర్' },
  'love-story-2021': { TitleTe: 'లవ్ స్టోరీ' },
  'net-2021': { TitleTe: 'నెట్' },
  'akshara-2021': { TitleTe: 'అక్షర', Hero: 'No Hero Lead' },
  'the-rose-villa-2021': { TitleTe: 'ది రోజ్ విల్లా' },
  'laabam-2021': { TitleEn: 'Laabam (Dubbed)', TitleTe: 'లాభం' },
  'asalem-jarigindi-2021': { TitleTe: 'అసలేం జరిగింది' },
  'play-back-2021': { TitleTe: 'ప్లే బ్యాక్' },
  'republic-2021': { TitleTe: 'రిపబ్లిక్' },
  'thellavarithe-guruvaram-2021': { TitleTe: 'తెల్లవారితే గురువారం' },
  'ooriki-uttharana-2021': { TitleTe: 'ఊరికి ఉత్తరాన' },
  'pitta-kathalu-2021': { TitleTe: 'పిట్ట కథలు', Hero: 'Anthology', Heroine: 'Various', Director: 'Nag Ashwin et al.' },
  'varudu-kaavalenu-2021': { TitleTe: 'వరుడు కావలేను' },
  'annabelle-sethupathi-2021': { TitleTe: 'అనబెల్ సేతుపతి' },
  'heads-and-tales-2021': { TitleTe: 'హెడ్స్ అండ్ టేల్స్', Hero: 'No Hero Lead' },
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

async function applyBatch1516Corrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         APPLYING BATCH 15-16 CORRECTIONS (2021 Movies)              ║'));
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

  console.log(chalk.yellow('📋 Processing 72 movies:\n'));
  console.log(chalk.cyan('   • Batch 15: 2021 (2of3) - 42 movies'));
  console.log(chalk.cyan('   • Batch 16: 2021 (3of3) - 30 movies\n'));

  for (const [slug, correction] of Object.entries(batch1516Data)) {
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
        if (updatedCount <= 15 || updatedCount > 60) {
          console.log(chalk.cyan(`${updatedCount}. ${movie.TitleEn} (${slug})`));
          changes.forEach(change => console.log(chalk.gray(`   ${change}`)));
        } else if (updatedCount === 16) {
          console.log(chalk.gray('\n   ... (processing movies 16-60) ...\n'));
        }
      }
    }
  }

  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch15-16.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                     BATCHES 15-16 SUMMARY                             '));
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

  console.log(chalk.green.bold('🎉 BATCHES 15-16 COMPLETE!\n'));
  console.log(chalk.yellow('🎯 Remaining: Batches 12-14, 17-22 (459 movies)\n'));
}

applyBatch1516Corrections().catch(console.error);
