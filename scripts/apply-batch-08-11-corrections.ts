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

// Batch 08-11 corrections (135 movies total)
const batch0811Data: Record<string, Partial<MovieRow>> = {
  // Batch 08 (2025 Upcoming - 1of2) - 34 movies
  'lyf-love-your-father-2025': { TitleEn: 'LYF - Love Your Father', TitleTe: 'లవ్ యువర్ ఫాదర్' },
  'the-great-pre-wedding-show-2025': { TitleTe: 'ది గ్రేట్ ప్రీ వెడ్డింగ్ షో' },
  'gandhi-tatha-chettu-2025': { TitleTe: 'గాంధీ తాత చెట్టు' },
  'shivangi-2025': { TitleTe: 'శివంగి', Hero: 'No Hero Lead' },
  'paanch-minar-2025': { TitleTe: 'పాంచ్ మినార్' },
  'oh-bhama-ayyo-rama-2025': { TitleTe: 'ఓ భామ అయ్యో రామ' },
  '14-days-girlfriend-intlo-2025': { TitleEn: '14 Days', TitleTe: '14 డేస్' },
  'mass-jathara-2025': { TitleTe: 'మాస్ జాతర' },
  'mokshapatam-2025': { TitleTe: 'మోక్షపటం' },
  '1000-waala-2025': { TitleTe: '1000 వాలా' },
  '28-degree-celsius-2025': { TitleTe: '28 డిగ్రీ సెల్సియస్' },
  'the-100-2025': { TitleTe: 'ది 100', Hero: 'RK Sagar' },
  'arjun-chakravarthy-2025': { TitleTe: 'అర్జున్ చక్రవర్తి' },
  'dear-uma-2025': { TitleTe: 'డియర్ ఉమ', Heroine: 'Sumaya Reddy' },
  'neeli-megha-shyama-2025': { TitleTe: 'నీలి మేఘ శ్యామ' },
  'jack-2025': { TitleTe: 'జాక్', Heroine: 'Vaishnavi Chaitanya' },
  'sundarakanda-2025': { TitleTe: 'సుందరాకాండ', Heroine: 'Virti Vaghani' },
  'ari-my-name-is-nobody-2025': { TitleEn: 'Ari', TitleTe: 'అరి' },
  'baapu-2025': { TitleTe: 'బాపు' },
  'raju-weds-rambai-2025': { TitleTe: 'రాజు వెడ్స్ రాంబాయ్' },
  'bhairavam-2025': { TitleTe: 'భైరవం', Heroine: 'No Female Lead' },
  'oka-pathakam-prakaaram-2025': { TitleTe: 'ఒక పథకం ప్రకారం' },
  'akkada-ammayi-ikkada-abbayi-2025': { TitleTe: 'అక్కడ అమ్మాయి ఇక్కడ అబ్బాయి' },
  'enuguthondam-ghatikachalam-2025': { TitleEn: 'Ghatikachalam', TitleTe: 'ఘటికాచలం', Hero: 'Nikhil Hemanth', Heroine: 'No Female Lead' },
  'mad-2025': { TitleEn: '(MAD)²', TitleTe: 'మ్యాడ్ స్క్వేర్', Heroine: 'No Female Lead' },
  'chaurya-paatham-2025': { TitleTe: 'చౌర్య పాఠం' },
  'arjun-son-of-vyjayanthi-2025': { TitleTe: 'అర్జున్ సన్ ఆఫ్ వైజయంతి' },
  'mowgli-2025': { TitleTe: 'మోగ్లీ', Heroine: 'No Female Lead' },
  'santhana-prapthirasthu-2025': { TitleTe: 'సంతాన ప్రాప్తిరస్తు' },
  'ramam-raghavam-2025': { TitleTe: 'రామం రాఘవం', Heroine: 'Dhanraj', Director: 'Dhanraj' },
  'shashtipoorthi-2025': { TitleTe: 'షష్టిపూర్తి' },
  'premante-2025': { TitleTe: 'ప్రేమంటే' },
  'chiranjeeva-2025': { TitleTe: 'చిరంజీవ' },
  'hit-the-third-case-2025': { TitleTe: 'హిట్: ది థర్డ్ కేస్' },

  // Batch 09 (2025 Upcoming - 2of2) - 33 movies
  '1111-2025': { TitleEn: '11:11', TitleTe: '11:11' },
  'sankranthiki-vasthunam-2025': { TitleTe: 'సంక్రాంతికి వస్తున్నాం', Heroine: 'Meenakshi Chaudhary' },
  'chaurya-paatam-2025': { TitleTe: 'చౌర్య పాఠం' },
  'hathya-2025': { TitleTe: 'హత్య' },
  'single-2025': { TitleEn: '#Single', TitleTe: '#సింగిల్' },
  'jaat-2025': { TitleTe: 'జాట్' },
  'brahma-anandam-2025': { TitleTe: 'బ్రహ్మ ఆనందం' },
  'the-girlfriend-2025': { TitleTe: 'ది గర్ల్‌ఫ్రెండ్' },
  'kuberaa-2025': { TitleTe: 'కుబేర' },
  'court-state-vs-a-nobody-2025': { TitleEn: 'Court', TitleTe: 'కోర్ట్', Heroine: 'No Female Lead' },
  'eesha-2025': { TitleTe: 'ఈష' },
  'patang-2025': { TitleTe: 'పతంగ్' },
  '8-vasantalu-2025': { TitleTe: '8 వసంతాలు', Hero: 'No Hero Lead' },
  'janata-bar-2025': { TitleTe: 'జనతా బార్', Hero: 'No Hero Lead' },
  'laila-2025': { TitleTe: 'లైలా' },
  'salaar-part-2-shouryaanga-parvam': { TitleEn: 'Salaar: Part 2', TitleTe: 'సలార్: పార్ట్ 2', ReleaseYear: '2026' },
  'solo-boy-2025': { TitleTe: 'సోలో బాయ్', Hero: 'Gouri Priya', Heroine: 'No Hero Lead' },
  'blind-spot-2025': { TitleTe: 'బ్లైండ్ స్పాట్' },
  'dreamcatcher-2025': { TitleTe: 'డ్రీమ్ క్యాచర్' },
  'sikandar-2025': { TitleTe: 'సికందర్' },
  'kishkindhapuri-2025': { TitleTe: 'కిష్కింధపురి' },
  'akhanda-2-thaandavam-2025': { TitleTe: 'అఖండ 2: తాండవం' },
  'paradha-2025': { TitleTe: 'పరద', Hero: 'No Hero Lead' },
  'dilruba-2025': { TitleTe: 'దిల్‌రుబా' },
  'sasivadane-2025': { TitleTe: 'శశివదనే' },
  'uppu-kappurambu-2025': { TitleTe: 'ఉప్పు కప్పురంబు' },
  'pelli-kaani-prasad-2025': { TitleTe: 'పెళ్లి కాని ప్రసాద్', Heroine: 'No Female Lead' },
  'suryapet-junction-2025': { TitleTe: 'సూర్యాపేట జంక్షన్' },
  'mirai-2025': { TitleTe: 'మిరాయ్' },
  'hari-hara-veera-mallu-part-1-sword-vs-spirit-2025': { TitleEn: 'Hari Hara Veera Mallu', TitleTe: 'హరి హర వీర మల్లు', Heroine: 'Nidhhi Agerwal' },

  // Batch 10 (2026 Upcoming - 1of1) - 18 movies
  'honey-2026': { TitleTe: 'హనీ' },
  'psych-siddhartha-2026': { TitleTe: 'సైక్ సిద్ధార్థ' },
  'itllu-arjuna-2026': { TitleTe: 'ఇట్లు అర్జున' },
  'rowdy-janardhana-2026': { TitleTe: 'రౌడీ జనార్దన' },
  'the-paradise-2026': { TitleTe: 'ది పారడైజ్' },
  'sahakutumbaanaam-2026': { TitleTe: 'సహకుటుంబానాం' },
  'rao-bahadur-2026': { TitleTe: 'రావు బహదూర్' },
  'vanaveera-2026': { TitleTe: 'వనవీర' },
  'madham-2026': { TitleTe: 'మధం' },
  'nilakanta-2026': { TitleTe: 'నీలకంఠ' },
  'anantha-2026': { TitleTe: 'అనంత' },
  'the-bed-2026': { TitleTe: 'ది బెడ్' },
  'alcohol-2026': { TitleTe: 'ఆల్కహాల్' },
  'dark-chocolate-2026': { TitleTe: 'డార్క్ చాక్లెట్' },
  'om-shanti-shanti-shantihi-2026': { TitleTe: 'ఓం శాంతి శాంతి శాంతిః' },
  'funky-2026': { TitleTe: 'ఫంకీ', Director: 'Anudeep KV' },
  'seetha-payanam-2026': { TitleTe: 'సీత పయనం' },
  'lenin-2026': { TitleTe: 'లెనిన్' },

  // Batch 11 (2022 - 1of3) - 50 movies
  'krishna-vrinda-vihari-2022': { TitleTe: 'కృష్ణ వ్రింద విహారి' },
  'ranga-ranga-vaibhavanga-2022': { TitleTe: 'రంగ రంగ వైభవంగా' },
  'bujji-ila-raa-2022': { TitleTe: 'బుజ్జీ... ఇలా రా', Hero: 'Dhanraj' },
  'good-luck-sakhi-2022': { TitleTe: 'గుడ్ లక్ సఖి' },
  'vishwak-2022': { TitleTe: 'విశ్వక్', Heroine: 'No Female Lead' },
  'panchatantra-kathalu-2022': { TitleTe: 'పంచతంత్ర కథలు' },
  'viraata-parvam-2022': { TitleTe: 'విరాట పర్వం' },
  'swathimuthyam-2022': { TitleTe: 'స్వాతిముత్యం', Hero: 'Ganesh Bellamkonda' },
  'the-warriorr-2022': { TitleTe: 'ది వారియర్' },
  'kalapuram-2022': { TitleTe: 'కళాపురం' },
  'bhamakalapam-2022': { TitleTe: 'భామాకలాపం', Hero: 'No Hero Lead' },
  'alluri-2022': { TitleTe: 'అల్లూరి' },
  'kerosene-2022': { TitleTe: 'కిరోసిన్' },
  'nathicharami-2022': { TitleTe: 'నతీచరామి' },
  'commitment-2022': { TitleTe: 'కమిట్‌మెంట్', Hero: 'No Hero Lead' },
  'shikaaru-2022': { TitleTe: 'శికారు', Hero: 'No Hero Lead' },
  'dj-tillu-2022': { TitleTe: 'డిజె టిల్లు' },
  'jayamma-panchayathi-2022': { TitleTe: 'జయమ్మ పంచాయితీ', Hero: 'No Hero Lead' },
  'malli-modalaindi-2022': { TitleTe: 'మళ్ళీ మొదలైంది' },
  'highway-2022': { TitleTe: 'హైవే', Heroine: 'Manasa Radhakrishnan' },
  'gurtunda-seetakalam-2022': { TitleTe: 'గుర్తుందా శీతాకాలం' },
  'muthayya-2022': { TitleTe: 'ముత్తయ్య' },
  'yashoda-2022': { TitleTe: 'యశోద', Hero: 'No Hero Lead' },
  'chittam-maharani-2022': { TitleTe: 'చిత్తం మహారాణి' },
  'boyfriend-for-hire-2022': { TitleTe: 'బాయ్‌ఫ్రెండ్ ఫర్ హైర్' },
  'like-share-subscribe-2022': { TitleTe: 'లైక్ షేర్ సబ్‌స్క్రైబ్' },
  'f3-fun-and-frustration-2022': { TitleEn: 'F3', TitleTe: 'ఎఫ్ 3', Hero: 'Venkatesh, Varun Tej', Heroine: 'Tamannaah, Mehreen' },
  '18-pages-2022': { TitleTe: '18 పేజెస్' },
  'bloody-mary-2022': { TitleTe: 'బ్లడీ మేరీ', Hero: 'No Hero Lead' },
  'urvasivo-rakshasivo-2022': { TitleTe: 'ఊర్వశివో రాక్షసివో' },
  'lucky-lakshman-2022': { TitleTe: 'లక్కీ లక్ష్మణ్' },
  'gaalodu-2022': { TitleTe: 'గాలోడు' },
  'nenevaru-2022': { TitleTe: 'నేనెవరు' },
  'panchathantram-2022': { TitleTe: 'పంచతంత్రం' },
  'nachindi-girl-friendu-2022': { TitleTe: 'నచ్చింది గర్ల్ ఫ్రెండూ' },
  'bhala-thandanana-2022': { TitleTe: 'భళా తందనాన' },
  'virgin-story-2022': { TitleTe: 'వర్జిన్ స్టోరీ' },
  'stand-up-rahul-2022': { TitleTe: 'స్టాండ్ అప్ రాహుల్' },
  'andaru-bagundali-andulo-nenundali-2022': { TitleEn: 'Andaru Bagundali...', TitleTe: 'అందరూ బాగుండాలి అందులో నేనుండాలి' },
  'ashoka-vanamlo-arjuna-kalyanam-2022': { TitleTe: 'అశోక వనంలో అర్జున కళ్యాణం' },
  'madhi-2022': { TitleTe: 'మధి' },
  'jagamemaya-2023': { TitleTe: 'జగమేమాయ', ReleaseYear: '2022', Heroine: 'No Hero Lead' },
  'dream-boy-2022': { TitleTe: 'డ్రీమ్ బాయ్' },
  'katha-kanchiki-manam-intiki-2022': { TitleTe: 'కథ కంచికి మనం ఇంటికి' },
  'darja-2022': { TitleTe: 'దర్జా', Hero: 'No Hero Lead' },
  'uniki-2022': { TitleTe: 'ఉనికి' },
  'ghani-2022': { TitleTe: 'గని' },
  'veyi-subhamulu-kalugu-neeku-2022': { TitleTe: 'వేయి శుభములు కలుగు నీకు', Hero: 'Vijay Raja' },
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

async function applyBatch0811Corrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║    APPLYING BATCH 08-11 CORRECTIONS (2025, 2026, 2022 Movies)       ║'));
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
  let titleCorrections = 0;

  console.log(chalk.yellow('📋 Processing 135 movies:\n'));
  console.log(chalk.cyan('   • Batch 08: 2025 Upcoming (1of2) - 34 movies'));
  console.log(chalk.cyan('   • Batch 09: 2025 Upcoming (2of2) - 33 movies'));
  console.log(chalk.cyan('   • Batch 10: 2026 Upcoming (1of1) - 18 movies'));
  console.log(chalk.cyan('   • Batch 11: 2022 Movies (1of3) - 50 movies\n'));

  for (const [slug, correction] of Object.entries(batch0811Data)) {
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
        if (updatedCount <= 20 || updatedCount > (Object.keys(batch0811Data).length - 10)) {
          console.log(chalk.cyan(`${updatedCount}. ${movie.TitleEn} (${slug})`));
          changes.forEach(change => console.log(chalk.gray(`   ${change}`)));
        } else if (updatedCount === 21) {
          console.log(chalk.gray('\n   ... (processing movies 21-125) ...\n'));
        }
      }
    }
  }

  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch08-11.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                      BATCHES 08-11 SUMMARY                            '));
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

  console.log(chalk.green.bold('🎉 BATCHES 08-11 COMPLETE!\n'));
  console.log(chalk.yellow('🎯 Next: Batch 12-13 (2022 remaining, 77 movies)\n'));
}

applyBatch0811Corrections().catch(console.error);
