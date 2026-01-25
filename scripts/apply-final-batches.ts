#!/usr/bin/env npx tsx
/**
 * Apply Final Batches (21-28) - Telugu Titles for 2018 and remaining movies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MovieFix {
  slug: string;
  title_en?: string;
  title_te: string;
  year?: number;
  hero?: string;
  heroine?: string;
  director?: string;
}

// Batch 21 - 2018 Movies (5of6)
const BATCH_21: MovieFix[] = [
  { slug: 'kirrak-party-2018', title_te: 'కిర్రాక్ పార్టీ' },
  { slug: 'jamba-lakidi-pamba-2018', title_te: 'జంబ లకిడి పంబ' },
  { slug: 'taxiwala-2018', title_te: 'టాక్సీవాలా' },
  { slug: 'manu-2018', title_te: 'మను' },
  { slug: 'padi-padi-leche-manasu-2018', title_te: 'పడి పడి లేచే మనసు' },
  { slug: 'kanam-2018', title_te: 'కానం' },
  { slug: 'saakshyam-2018', title_te: 'సాక్ష్యం', hero: 'Bellamkonda Srinivas' },
  { slug: 'rx-100-2018', title_te: 'ఆర్‌ఎక్స్ 100' },
  { slug: 'shailaja-reddy-alludu-2018', title_te: 'శైలజా రెడ్డి అల్లుడు' },
  { slug: 'co-kancharapalem-2018', title_te: 'సీ/ఓ కంచరపాలెం' },
  { slug: 'ammammagarillu-2018', title_te: 'అమ్మమ్మగారిల్లు' },
  { slug: 'rangu-2018', title_te: 'రంగు' },
  { slug: 'karma-kartha-kriya-2018', title_te: 'కర్మ కర్త క్రియ' },
  { slug: 'ego-2018', title_te: 'ఇగో' },
  { slug: 'ishtangaa-2018', title_te: 'ఇష్టంగా' },
  { slug: 'adhugo-2018', title_te: 'అదుగో' },
  { slug: 'moodu-puvulu-aaru-kayalu-2018', title_te: 'మూడు పువ్వులు ఆరు కాయలు' },
  { slug: 'bluff-master-2018', title_te: 'బ్లఫ్ మాస్టర్' },
  { slug: 'goodachari-2018', title_te: 'గూఢచారి' },
  { slug: 'pantham-2018', title_te: 'పంతం' },
  { slug: '24-kisses-2018', title_te: '24 కిస్సెస్' },
  { slug: 'idi-naa-love-story-2018', title_te: 'ఇది నా లవ్ స్టోరీ' },
  { slug: 'ee-maaya-peremito-2018', title_te: 'ఈ మాయా పేరేమిటో' },
  { slug: 'howrah-bridge-2018', title_te: 'హౌరా బ్రిడ్జ్' },
  { slug: 'lover-2018', title_te: 'లవర్' },
  { slug: 'mla-2018', title_te: 'ఎంఎల్ఏ' },
  { slug: 'ye-mantram-vesave-2018', title_te: 'ఏ మంత్రం వేసావే', director: 'Rohith Middha' },
  { slug: 'sameeram-2018', title_te: 'సమీరం' },
  { slug: 'enduko-emo-2018', title_te: 'ఎందుకో ఏమో' },
  { slug: 'chalo-2018', title_te: 'చలో', director: 'Venky Kudumula', heroine: 'Rashmika Mandanna' },
  { slug: 'natakam-2018', title_te: 'నాటకం' },
  { slug: 'aatwaja-2018', title_te: 'ఆత్వజ' },
  { slug: 'aa-bb-kk-2018', title_te: 'ఏ బీ బీ కే కే', hero: 'Rajith' },
  { slug: 'mom-2018', title_te: 'మామ్' },
  { slug: 'maaya-2018', title_te: 'మాయ' },
  { slug: 'bhagmati-2018', title_te: 'భాగమతి', hero: 'No Hero Lead' },
  { slug: 'wo-ram-2018', title_te: 'వైఫ్ ఆఫ్ రామ్' },
  { slug: 'manasuku-nachindi-2018', title_te: 'మనసుకు నచ్చింది' },
  { slug: 'brand-babu-2018', title_te: 'బ్రాండ్ బాబు' },
  { slug: 'keni-2018', title_te: 'కేని' },
  { slug: 'my-dear-marthandam-2018', title_te: 'మై డియర్ మార్తాండం' },
  { slug: 'silly-fellows-2018', title_te: 'సిల్లీ ఫెల్లోస్' },
  { slug: 'tej-i-love-you-2018', title_te: 'తేజ్ ఐ లవ్ యు' },
  { slug: 'krishnarjuna-yudham-2018', title_te: 'కృష్ణార్జున యుద్ధం' },
  { slug: 'desamlo-dongalu-paddaru-2018', title_te: 'దేశంలో దొంగలు పట్టారు' },
  { slug: 'kinar-2018', title_te: 'కినార్' },
  { slug: 'next-enti-2018', title_te: 'నెక్స్ట్ ఏంటి?' },
  { slug: 'sketch-2018', title_te: 'స్కెచ్', hero: 'Vikram' },
  { slug: 'awe-2018', title_te: 'ఆవే!', hero: 'Kajal Aggarwal', heroine: 'Nithya Menen' },
  { slug: 'bhaagamathie-2018', title_te: 'భాగమతి', hero: 'No Hero Lead' },
];

// Batch 22 - 2018 Movies (6of6)
const BATCH_22: MovieFix[] = [
  { slug: 'rangula-ratnam-2018', title_te: 'రంగుల రత్నం' },
  { slug: 'neevevaro-2018', title_te: 'నీవెవరో' },
  { slug: 'sivakasipuram-2018', title_te: 'శివకాశీపురం' },
  { slug: 'chalakkudykkaran-changathy-2018', title_te: 'చలక్కుడిక్కారన్ చంగాతి' },
  { slug: 'krishnarjuna-yuddham-2018', title_te: 'కృష్ణార్జున యుద్ధం' },
  { slug: 'antariksham-9000-kmph-2018', title_te: 'అంతరిక్షం 9000 కి.మీ' },
  { slug: 'needi-naadi-oke-katha-2018', title_te: 'నీది నాది ఒకే కథ' },
  { slug: 'hushaaru-2018', title_te: 'హుషారు' },
  { slug: 'hyderabad-love-story-2018', title_te: 'హైదరాబాద్ లవ్ స్టోరీ' },
  { slug: 'gayatri-2018', title_te: 'గాయత్రి' },
  { slug: 'perfect-pati-2018', title_te: 'పర్ఫెక్ట్ పతి', hero: 'Rishi Kapoor', heroine: 'Jayapradha' },
  { slug: 'devadas-2018', title_te: 'దేవదాసు', hero: 'Nani, Nagarjuna' },
  { slug: 'manchi-lakshanalunna-abbayi-2018', title_te: 'మంచి లక్షణాలున్న అబ్బాయి', hero: 'Nara Rohit', heroine: 'Sree Vishnu' },
  { slug: 'naa-nuvve-2018', title_te: 'నా నువ్వే' },
  { slug: 'bhale-manchi-chowka-beram-2018', title_te: 'భలే మంచి చౌక బేరం' },
  { slug: 'srinivasa-kalyanam-2018', title_te: 'శ్రీనివాస కళ్యాణం', heroine: 'Rashi Khanna' },
  { slug: 'sammohanam-2018', title_te: 'సమ్మోహనం' },
  { slug: 'ee-nagaraniki-emaindi-2018', title_te: 'ఈ నగరానికి ఏమైంది?' },
  { slug: 'amoli-2018', title_te: 'అమోలి' },
  { slug: 'parichayam-2018', title_te: 'పరిచయం' },
  { slug: 'anthervedam-2018', title_te: 'అంతర్వేదం' },
  { slug: 'naa-peru-surya-naa-illu-india-2018', title_te: 'నా పేరు సూర్య - నా ఇల్లు ఇండియా' },
  { slug: 'rachayitha-2018', title_te: 'రచయిత' },
  { slug: 'sarabha-2018', title_te: 'శరభా' },
  { slug: 'mehbooba-2018', title_te: 'మెహబూబా' },
  { slug: 'hello-guru-prema-kosame-2018', title_te: 'హలో గురూ ప్రేమ కోసమే' },
  { slug: 'amar-akbar-anthony-2018', title_te: 'అమర్ అక్బర్ ఆంథోనీ' },
];

// Batch 23 - 2021 Mixed
const BATCH_23: MovieFix[] = [
  { slug: 'crrush-2021', title_te: 'క్రష్' },
  { slug: 'guduputani-2021', title_te: 'గుడుపుతని' },
  { slug: 'lawyer-viswanath-2021', title_te: 'లాయర్ విశ్వనాథ్' },
  { slug: 'chinna-2021', title_te: 'చిన్న' },
  { slug: 'nireekshana-2021', title_te: 'నిరీక్షణ' },
  { slug: 'y-2021', title_te: 'వై', hero: 'No Hero Lead' },
  { slug: 'pranavam-2021', title_te: 'ప్రణవం' },
  { slug: 'chandamama-raave-asap-2021', title_te: 'చందమామ రావే ASAP', hero: 'No Hero Lead' },
  { slug: 'plan-b-2021', title_te: 'ప్లాన్ బి' },
  { slug: 'poster-2021', title_te: 'పోస్టర్' },
  { slug: 'ravana-lanka-2021', title_te: 'రావణ లంక' },
  { slug: 'one-small-story-2021', title_te: 'ఒక చిన్న కథ' },
  { slug: 'chandra-sekhar-yeleti-2021', title_en: 'Check', title_te: 'చెక్' },
  { slug: 'kumar-g-2021', title_te: 'కుమార్ జి' },
  { slug: 'salt-2021', title_te: 'సాల్ట్' },
  { slug: 'surya-2021', title_te: 'సూర్య' },
  { slug: 'mumbai-saga-2021', title_te: 'ముంబై సాగా' },
  { slug: 'hemanth-2021', title_en: 'Jhimma', title_te: 'జిమ్మా' },
  { slug: 'journalist-2021', title_te: 'జర్నలిస్ట్' },
  { slug: 'bhaskar-2021', title_en: 'Most Eligible Bachelor', title_te: 'మోస్ట్ ఎలిజిబుల్ బ్యాచిలర్' },
  { slug: 'sekhar-kammula-2021', title_en: 'Love Story', title_te: 'లవ్ స్టోరీ' },
  { slug: 'madhagaja-2021', title_te: 'మదగజ' },
  { slug: 'asalem-jarigandi-2021', title_te: 'అసలేం జరిగింది' },
  { slug: 'sampath-nandi-2021', title_en: 'Seetimaarr', title_te: 'సీటిమార్' },
  { slug: 'a-ad-infitium-2021', title_en: 'A: Ad Infinitum', title_te: 'ఏ: అడ్ ఇన్ఫినిటమ్' },
  { slug: 'mirugaa-2021', title_te: 'మిరుగా' },
  { slug: 'the-power-2021', title_te: 'ది పవర్' },
  { slug: 'roberrt-2021', title_te: 'రాబర్ట్' },
];

// Batch 24 - 2018 Additional
const BATCH_24: MovieFix[] = [
  { slug: 'subramanyapuram-2018', title_te: 'సుబ్రమణ్యపురం' },
  { slug: 'paper-boy-2018', title_te: 'పేపర్ బాయ్' },
  { slug: 'veera-bhoga-vasantha-rayalu-2018', title_te: 'వీర భోగ వసంత రాయలు' },
  { slug: 'ee-nagariniki-emaindi-2018', title_te: 'ఈ నగరానికి ఏమైంది' },
  { slug: 'chal-mohan-ranga-2018', title_te: 'చల్ మోహన్ రంగ' },
  { slug: 'nartanasala-2018', title_te: 'నర్తనశాల' },
  { slug: 'mercury-2018', title_te: 'మెర్క్యురీ' },
  { slug: 'achari-america-yatra-2018', title_te: 'అచారి అమెరికా యాత్ర' },
  { slug: 'masakkali-2018', title_te: 'మసక్కలి' },
  { slug: 'kartha-karma-kriya-2018', title_te: 'కర్త కర్మ క్రియ' },
  { slug: 'officer-2018', title_te: 'ఆఫీసర్' },
  { slug: 'aatagallu-2018', title_te: 'ఆటగాళ్లు' },
  { slug: 'raa-raa-2018', title_te: 'రా రా' },
  { slug: 'naa-peru-surya-2018', title_te: 'నా పేరు సూర్య' },
  { slug: 'anthaku-minchi-2018', title_te: 'అంతకు మించి' },
  { slug: 'kavacham-2018', title_te: 'కవచం' },
  { slug: 'super-sketch-2018', title_te: 'సూపర్ స్కెచ్' },
  { slug: 'aithe-2-0-2018', title_te: 'ఐతే 2.0' },
  { slug: '2-friends-2018', title_te: '2 ఫ్రెండ్స్' },
  { slug: 'nannu-dochukunduvate-2018', title_te: 'నన్ను దొచుకుందువాటే' },
  { slug: 'juvva-2018', title_te: 'జువ్వా' },
  { slug: 'chi-la-sow-2018', title_te: 'చి లా సౌ' },
  { slug: 'aravinda-sametha-veera-raghava-2018', title_te: 'అరవింద సమేత వీరరాఘవ' },
  { slug: 'raju-gadu-2018', title_te: 'రాజుగాడు' },
  { slug: 'aatagadharaa-siva-2018', title_te: 'ఆటగాధర శివ' },
];

// Batch 27 - Mixed 2022/2023/2026
const BATCH_27: MovieFix[] = [
  { slug: 'lakshman-k-krishna-2022', title_en: 'Swathimuthyam', title_te: 'స్వాతిముత్యం', hero: 'Ganesh' },
  { slug: 'plan-a-plan-b-2022', title_te: 'ప్లాన్ ఏ ప్లాన్ బి' },
  { slug: 'jagamemaya-2022', title_te: 'జగమేమాయ' },
  { slug: 'mangalyam-2022', title_te: 'మాంగల్యం' },
  { slug: 'happy-birthday-2022', title_te: 'హ్యాపీ బర్త్‌డే' },
  { slug: 'abhimanyu-2022', title_en: 'Nikamma', title_te: 'నికమ్మా' },
  { slug: 'pratibimbalu-2022', title_te: 'ప్రతిబింబాలు' },
  { slug: 'thathsama-thathbhava-2023', title_te: 'తథాస్తు తథభావ' },
  { slug: 'salaar-part-2-shouryanga-parvam-2023', title_te: 'సలార్: పార్ట్ 2 – శౌర్యాంగ పర్వం', hero: 'Prabhas', year: 2026 },
  { slug: 'ranger-2026', title_te: 'రేంజర్' },
  { slug: 'lenin-tba', title_te: 'లెనిన్' },
  { slug: 'o-romeo-2026', title_te: 'ఓ రోమియో' },
];

// Batch 28 - 2025 Upcoming
const BATCH_28: MovieFix[] = [
  { slug: 'shambhala-2025', title_te: 'శంభాల' },
  { slug: 'subham-2025', title_te: 'శుభం' },
  { slug: 'oka-brundavanam-2025', title_te: 'ఒక బృందావనం' },
  { slug: 'dhandoraa-2025', title_te: 'ధండోరా' },
  { slug: 'baahubali-the-epic-2025', title_te: 'బాహుబలి: ది ఎపిక్' },
  { slug: 'police-vari-heccharika-2025', title_te: 'పోలీసు వారి హెచ్చరిక' },
  { slug: 'junior-2025', title_te: 'జూనియర్' },
  { slug: 'show-time-2025', title_te: 'షో టైమ్' },
  { slug: 'meghalu-cheppina-prema-katha-2025', title_te: 'మేఘాలు చెప్పిన ప్రేమ కథ' },
  { slug: 'tuk-tuk-2025', title_te: 'టుక్ టుక్', hero: 'No Hero Lead' },
  { slug: 'premistunnaa-2025', title_te: 'ప్రేమిస్తున్నా' },
  { slug: 'elumale-2025', title_te: 'ఎలుమలే' },
  { slug: 'dinasari-2025', title_te: 'దినసరి' },
  { slug: 'blackmail-2025', title_te: 'బ్లాక్‌మెయిల్' },
  { slug: 'konjam-kadhal-konjam-modhal-2025', title_te: 'కొంచెం కాధల్ కొంచెం మొదల్' },
  { slug: 'thala-2025', title_te: 'తల' },
  { slug: 'pontons-heart-2025', title_te: 'పోంటాన్స్ హార్ట్' },
  { slug: 'bhavani-ward-1997-2025', title_te: 'భవానీ వార్డ్ 1997' },
  { slug: 'kingdom-2025', title_te: 'కింగ్‌డమ్' },
  { slug: 'andhra-king-taluka-2025', title_te: 'ఆంధ్ర కింగ్ తాలుకా' },
  { slug: '23-iravai-moodu-2025', title_te: '23 ఇరవై మూడు' },
  { slug: 'thank-you-dear-2025', title_te: 'థాంక్ యు డియర్' },
  { slug: 'ilanti-cinema-meereppudu-chusundaru-2025', title_te: 'ఇలాంటి సినిమా మీరెప్పుడూ చూసుండరు' },
  { slug: '12a-railway-colony-2025', title_te: '12ఎ రైల్వే కాలనీ' },
  { slug: 'dhanraj-2025', title_en: 'Ramam Raghavam', title_te: 'రామం రాఘవం' },
  { slug: 'break-out-2025', title_en: 'Boss', title_te: 'బాస్' },
  { slug: 'super-raja-2025', title_te: 'సూపర్ రాజా' },
];

async function updateMovie(fix: MovieFix): Promise<boolean> {
  const updates: Record<string, any> = { title_te: fix.title_te };
  
  if (fix.title_en) updates.title_en = fix.title_en;
  if (fix.hero) updates.hero = fix.hero;
  if (fix.heroine) updates.heroine = fix.heroine;
  if (fix.director) updates.director = fix.director;
  if (fix.year) updates.release_year = fix.year;
  
  const { error } = await supabase
    .from('movies')
    .update(updates)
    .eq('slug', fix.slug);
  
  return !error;
}

async function processBatch(name: string, fixes: MovieFix[]): Promise<{ updated: number; failed: number }> {
  console.log(chalk.yellow(`\n📦 Processing ${name} (${fixes.length} movies)...`));
  let updated = 0;
  let failed = 0;
  
  for (const fix of fixes) {
    const success = await updateMovie(fix);
    if (success) {
      updated++;
      process.stdout.write(chalk.green('.'));
    } else {
      failed++;
      process.stdout.write(chalk.red('x'));
    }
  }
  
  console.log(`\n   ✅ ${updated} updated, ${failed} failed`);
  return { updated, failed };
}

async function main() {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║       APPLYING FINAL BATCHES (21-28) - 2018 & Remaining          ║
╚══════════════════════════════════════════════════════════════════╝
`));

  let totalUpdated = 0;
  let totalFailed = 0;
  
  const batches = [
    { name: 'Batch 21 (2018 - 5of6)', fixes: BATCH_21 },
    { name: 'Batch 22 (2018 - 6of6)', fixes: BATCH_22 },
    { name: 'Batch 23 (2021 Mixed)', fixes: BATCH_23 },
    { name: 'Batch 24 (2018 Additional)', fixes: BATCH_24 },
    { name: 'Batch 27 (2022/2023/2026 Mixed)', fixes: BATCH_27 },
    { name: 'Batch 28 (2025 Upcoming)', fixes: BATCH_28 },
  ];
  
  for (const batch of batches) {
    const result = await processBatch(batch.name, batch.fixes);
    totalUpdated += result.updated;
    totalFailed += result.failed;
  }
  
  // Get final count
  const { count: remaining } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .or('title_te.is.null,title_te.eq.')
    .eq('is_published', true);
  
  const { count: total } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);
  
  const completed = total! - remaining!;
  const percentage = ((completed / total!) * 100).toFixed(1);
  
  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
                          FINAL SUMMARY                            
═══════════════════════════════════════════════════════════════════
`));
  
  console.log(`  Total updated this run:  ${chalk.green(totalUpdated)}`);
  console.log(`  Failed:                  ${chalk.red(totalFailed)}`);
  console.log(`  
  Telugu titles progress:  ${chalk.cyan(completed)}/${total} (${percentage}%)`);
  console.log(`  Still pending:           ${chalk.yellow(remaining)}`);
  
  const barLength = 50;
  const filledLength = Math.round((completed / total!) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  console.log(`
  Progress: ${bar} ${percentage}%
`);
  
  console.log(chalk.green('✅ Final batches complete!\n'));
}

main().catch(console.error);
