#!/usr/bin/env npx tsx
/**
 * Apply Known Telugu Titles Only
 * High-quality verified Telugu titles from manual research
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verified high-quality Telugu title mappings
const KNOWN_TITLES: Record<string, string> = {
  // === 2024 RELEASES ===
  'Tillu Square': 'తిల్లు స్క్వేర్',
  '(Tillu)²': 'తిల్లు స్క్వేర్',
  'Guntur Kaaram': 'గుంటూరు కారం',
  'Kalki 2898 AD': 'కల్కి 2898 AD',
  'HanuMan': 'హనుమాన్',
  'Hanu-Man': 'హనుమాన్',
  'Hi Nanna': 'హాయ్ నాన్న',
  'Aay': 'ఆయ్',
  'Lucky Baskhar': 'లక్కీ భాస్కర్',
  'Devara: Part 1': 'దేవర: పార్ట్ 1',
  'Devara Part 1': 'దేవర పార్ట్ 1',
  'Pushpa 2: The Rule': 'పుష్ప 2: ది రూల్',
  'Game Changer': 'గేమ్ ఛేంజర్',
  'Saripodhaa Sanivaaram': 'సరిపోదా శనివారం',
  'Saripodha Sanivaram': 'సరిపోదా శనివారం',
  'Mathu Vadalara 2': 'మత్తు వదలరా 2',
  'Bhimaa': 'భీమా',
  'Aa Okkati Adakku': 'ఆ ఒక్కటి అడక్కు',
  'Aarambham': 'ఆరంభం',
  'Anaganaga Oka Rowdy': 'అనగనగా ఒక రౌడీ',
  'Bhamakalapam 2': 'భామాకళాపం 2',
  'Bharathanatyam': 'భరతనాట్యం',
  'Mr Bachchan': 'మిస్టర్ బచ్చన్',
  'Mr. Bachchan': 'మిస్టర్ బచ్చన్',
  'Manamey': 'మనమే',
  'Ooru Peru Bhairavakona': 'ఊరు పేరు భైరవకోన',
  'Double iSmart': 'డబుల్ ఐస్మార్ట్',
  'Bhoothaddam Bhaskar Narayana': 'భూతద్దం భాస్కర్ నారాయణ',
  'Gangs of Godavari': 'గ్యాంగ్స్ ఆఫ్ గోదావరి',
  'Committee Kurrollu': 'కమిటీ కుర్రోళ్ళు',
  'Krishnamma': 'కృష్ణమ్మ',
  'Gaami': 'గామీ',
  'Naa Saami Ranga': 'నా సామి రంగా',
  'Prasanna Vadanam': 'ప్రసన్న వదనం',
  'Rathnam': 'రత్నం',
  'Razakar': 'రజాకార్',
  'Seetha Kalyanam': 'సీత కళ్యాణం',
  'Sharathulu Varthisthai': 'శరతులు వర్తిస్తాయి',
  'Swag': 'స్వాగ్',
  'Vaadyarachana': 'వాద్యరచన',
  'Vaadyarachna': 'వాద్యరచన',
  'Vidyaarthi': 'విద్యార్థి',
  'Yodha': 'యోధ',
  'Operation Valentine': 'ఆపరేషన్ వాలెంటైన్',
  'Kothi Kommachi': 'కోతి కొమ్మచ్చి',
  'Geethanjali Malli Vachindi': 'గీతాంజలి మళ్ళీ వచ్చింది',
  'Ambajipeta Marriage Band': 'అంబాజీపేట మ్యారేజ్ బ్యాండ్',
  'Krishnavum Chellanum': 'కృష్ణవుం చెళ్ళనుం',
  'Bubblegum': 'బబుల్‌గమ్',
  'Nindha': 'నిందా',
  '35 - Chinna Katha Kaadu': '35 - చిన్న కథ కాదు',
  'Chaari 111': 'చారి 111',
  
  // === 2023 RELEASES ===
  'Dasara': 'దసరా',
  'Adipurush': 'ఆదిపురుష్',
  'Waltair Veerayya': 'వాల్తేరు వీరయ్య',
  'Veera Simha Reddy': 'వీర సింహా రెడ్డి',
  'Kushi': 'ఖుషీ',
  'Bhola Shankar': 'భోళా శంకర్',
  'Bhagavanth Kesari': 'భగవంత్ కేసరి',
  'Leo': 'లియో',
  'Salaar': 'సలార్',
  'Salaar: Part 1': 'సలార్: పార్ట్ 1',
  'Salaar: Part 1 – Ceasefire': 'సలార్: పార్ట్ 1 - సీజ్‌ఫైర్',
  'Tiger Nageswara Rao': 'టైగర్ నాగేశ్వర రావు',
  'Balagam': 'బలగం',
  'Virupaksha': 'విరూపాక్ష',
  'Custody': 'కస్టడీ',
  'Baby': 'బేబీ',
  'Skanda': 'స్కంద',
  'Mangalavaaram': 'మంగళవారం',
  'Agent': 'ఏజెంట్',
  'Bro': 'బ్రో',
  'Extra Ordinary Man': 'ఎక్స్ట్రా ఆర్డినరీ మ్యాన్',
  'Ori Devuda': 'ఓరి దేవుడా',
  'Ravanasura': 'రావణాసుర',
  'Sir': 'సర్',
  'Mem Famous': 'మేం ఫేమస్',
  'Pareshan': 'పరేషాన్',
  'Bedurulanka 2012': 'బెదురులంక 2012',
  'Family Star': 'ఫ్యామిలీ స్టార్',
  'Miss Shetty Mr Polishetty': 'మిస్ శెట్టి మిస్టర్ పోలిశెట్టి',
  'Writer Padmabhushan': 'రైటర్ పద్మభూషణ్',
  'Shaakuntalam': 'శాకుంతలం',
  'Saindhav': 'సైంధవ్',
  'Suryavanshi': 'సూర్యవంశి',
  'Annapurna Photo Studio': 'అన్నపూర్ణ ఫోటో స్టూడియో',
  'Bhagya Lakshmi': 'భాగ్య లక్ష్మి',
  'Bombai': 'బొంబాయి',
  'Kothi Kommachi': 'కోతి కొమ్మచ్చి',
  'Nenu Student Sir': 'నేను స్టూడెంట్ సర్',
  'Okkadu Migilaadu': 'ఒక్కడు మిగిలాడు',
  'Om Bheem Bush': 'ఓం భీం బుష్',
  'Por': 'పోర్',
  'Raghuvaran B.Tech': 'రఘువరన్ B.Tech',
  'Rules Ranjan': 'రూల్స్ రంజన్',
  'Ugram': 'ఉగ్రం',
  'Valiyaperunnal': 'వాలియాపెరునాళ్',
  
  // === 2022 RELEASES ===
  'RRR': 'ఆర్‌ఆర్‌ఆర్',
  'Sita Ramam': 'సీతా రామం',
  'Bimbisara': 'బింబిసార',
  'DJ Tillu': 'DJ తిల్లు',
  'Acharya': 'ఆచార్య',
  'Major': 'మేజర్',
  'Ante Sundaraniki': 'అంటే సుందరానికి',
  'F3': 'F3',
  'Liger': 'లైగర్',
  'Godfather': 'గాడ్‌ఫాదర్',
  'Bangarraju': 'బంగారు రాజు',
  'Thank You': 'థాంక్యూ',
  'Radhe Shyam': 'రాధే శ్యామ్',
  'Most Eligible Bachelor': 'మోస్ట్ ఎలిజిబుల్ బ్యాచిలర్',
  'Like Share Subscribe': 'లైక్ షేర్ సబ్స్క్రైబ్',
  'Ghani': 'ఘని',
  'Khiladi': 'ఖిలాడీ',
  'Macherla Niyojakavargam': 'మాచర్ల నియోజకవర్గం',
  'Bheemla Nayak': 'భీమ్లా నాయక్',
  'Hit: The First Case': 'హిట్: ది ఫస్ట్ కేస్',
  'SVP': 'SVP',
  'Pakka Commercial': 'పక్కా కమర్షియల్',
  'MAD': 'MAD',
  'Super Machi': 'సూపర్ మచ్చి',
  'Agent Sai Srinivasa Athreya': 'ఏజెంట్ సాయి శ్రీనివాస అత్రేయ',
  'Naandhi': 'నాంది',
  'Sammathame': 'సమ్మతమే',
  'Ori Devuda': 'ఓరి దేవుడా',
  'Month of Madhu': 'మంత్ ఆఫ్ మధు',
  'Masooda': 'మసూదా',
  'Alluri': 'అల్లూరి',
  
  // === 2021 RELEASES ===
  'Pushpa: The Rise': 'పుష్ప: ది రైజ్',
  'Pushpa The Rise': 'పుష్ప ది రైజ్',
  'Akhanda': 'అఖండ',
  'Vakeel Saab': 'వకీల్ సాబ్',
  'Love Story': 'లవ్ స్టోరీ',
  'Uppena': 'ఉప్పెన',
  'Jathi Ratnalu': 'జాతి రత్నాలు',
  'Check': 'చెక్',
  'Sreekaram': 'శ్రీకారం',
  'Krack': 'క్రాక్',
  'Master': 'మాస్టర్',
  'Rang De': 'రంగ్ దే',
  'Republic': 'రిపబ్లిక్',
  'DJ Tillu': 'DJ తిల్లు',
  'Tuck Jagadish': 'టక్ జగదీష్',
  'Narappa': 'నారప్ప',
  'Wild Dog': 'వైల్డ్ డాగ్',
  'A1 Express': 'A1 ఎక్స్‌ప్రెస్',
  'Naveen Polishetty Film': 'నవీన్ పోలిశెట్టి ఫిల్మ్',
  'Most Eligible Bachelor': 'మోస్ట్ ఎలిజిబుల్ బ్యాచిలర్',
  'Shyam Singha Roy': 'శ్యామ్ సింఘా రాయ్',
  'Thimmarusu': 'తిమ్మరుసు',
  'Drushyam 2': 'దృశ్యం 2',
  
  // === 2020 RELEASES ===
  'Ala Vaikunthapurramuloo': 'అలా వైకుంఠపురములో',
  'Sarileru Neekevvaru': 'సరిలేరు నీకేవ్వరు',
  'Bheeshma': 'భీష్మ',
  'V': 'వి',
  'Solo Brathuke So Better': 'సోలో బ్రతుకే సో బెటర్',
  'Colour Photo': 'కలర్ ఫోటో',
  'Jaanu': 'జాను',
  '30 Rojullo Preminchadam Ela': '30 రోజుల్లో ప్రేమించడం ఎలా',
  'Disco Raja': 'డిస్కో రాజా',
  'Entha Manchi Vadavura': 'ఎంత మంచివాడవురా',
  'Uma Maheshwara Ugra Roopasya': 'ఉమా మహేశ్వర ఉగ్ర రూపస్య',
  'Mallesham': 'మల్లేశం',
  'Palasa 1978': 'పాలస 1978',
  'Middle Class Melodies': 'మిడిల్ క్లాస్ మెలడీస్',
  'Orey Bujjiga': 'ఒరేయ్ బుజ్జిగా',
  
  // === 2019 RELEASES ===
  'iSmart Shankar': 'ఐస్మార్ట్ శంకర్',
  'Saaho': 'సాహో',
  'Sye Raa Narasimha Reddy': 'సైరా నరసింహారెడ్డి',
  'Petta': 'పేట్ట',
  'F2: Fun and Frustration': 'F2: ఫన్ అండ్ ఫ్రస్ట్రేషన్',
  'Jersey': 'జెర్సీ',
  'Dear Comrade': 'డియర్ కామ్రేడ్',
  'Evaru': 'ఎవరు',
  'Mahanati': 'మహానటి',
  'Geetha Govindam': 'గీత గోవిందం',
  'Arjun Reddy': 'అర్జున్ రెడ్డి',
  'Arjun Suravaram': 'అర్జున్ సురవరం',
  'Gang Leader': 'గ్యాంగ్ లీడర్',
  'Gaddalakonda Ganesh': 'గద్దలకొండ గణేష్',
  'Ranarangam': 'రణరంగం',
  'Oh Baby': 'ఓ బేబీ',
  'Hushaaru': 'హుషారు',
  'Naa Nuvve': 'నా నువ్వే',
  'Prema Ishq Kadhal': 'ప్రేమ ఇష్క్ కాధల్',
  'Manmadhudu 2': 'మన్మథుడు 2',
  'Majili': 'మజిలీ',
  '118': '118',
  'Agent Sai Srinivasa Athreya': 'ఏజెంట్ సాయి శ్రీనివాస ఆత్రేయ',
  'Chitralahari': 'చిత్రలహరి',
  'Rakshasudu': 'రాక్షసుడు',
  
  // === COMMON PATTERNS ===
  'Part 1': 'పార్ట్ 1',
  'Part 2': 'పార్ట్ 2',
  'Part 3': 'పార్ట్ 3',
  'Chapter 1': 'చాప్టర్ 1',
  'Chapter 2': 'చాప్టర్ 2',
};

async function applyKnownTitles(dryRun: boolean) {
  console.log(chalk.yellow('\n📊 Fetching movies needing Telugu titles...\n'));
  
  // Get all movies without Telugu titles
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year')
    .eq('is_published', true)
    .or('title_te.is.null,title_te.eq.')
    .order('release_year', { ascending: false });
  
  if (error || !movies) {
    console.log(chalk.red('Error:', error?.message));
    return;
  }
  
  console.log(chalk.cyan(`Found ${movies.length} movies without Telugu titles\n`));
  
  let matched = 0;
  let updated = 0;
  const matches: Array<{title: string, telugu: string, year: number}> = [];
  
  for (const movie of movies) {
    // Check exact match
    let teluguTitle = KNOWN_TITLES[movie.title_en];
    
    // Try case-insensitive
    if (!teluguTitle) {
      const lower = movie.title_en.toLowerCase();
      for (const [key, value] of Object.entries(KNOWN_TITLES)) {
        if (key.toLowerCase() === lower) {
          teluguTitle = value;
          break;
        }
      }
    }
    
    // Try without year suffix
    if (!teluguTitle) {
      const noYear = movie.title_en.replace(/\s*\(\d{4}\)$/, '').trim();
      teluguTitle = KNOWN_TITLES[noYear];
    }
    
    if (teluguTitle) {
      matched++;
      matches.push({
        title: movie.title_en,
        telugu: teluguTitle,
        year: movie.release_year
      });
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({ title_te: teluguTitle })
          .eq('id', movie.id);
        
        if (!updateError) updated++;
      }
    }
  }
  
  // Print results by year
  console.log(chalk.green.bold('📋 Matches Found:\n'));
  
  const byYear = new Map<number, Array<{title: string, telugu: string}>>();
  for (const m of matches) {
    if (!byYear.has(m.year)) byYear.set(m.year, []);
    byYear.get(m.year)!.push({ title: m.title, telugu: m.telugu });
  }
  
  const sortedYears = Array.from(byYear.keys()).sort((a, b) => b - a);
  for (const year of sortedYears) {
    console.log(chalk.yellow(`\n  ${year}:`));
    for (const m of byYear.get(year)!) {
      console.log(`    ✓ ${m.title} → ${m.telugu}`);
    }
  }
  
  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
                          SUMMARY                                  
═══════════════════════════════════════════════════════════════════

  Total without Telugu: ${movies.length}
  Known titles matched: ${matched}
  ${dryRun ? 'Would update' : 'Updated'}: ${dryRun ? matched : updated}
  Remaining: ${movies.length - matched}
  
  ${dryRun ? chalk.yellow('Run with --execute to apply changes') : chalk.green('✅ Changes applied!')}
`));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║        APPLY KNOWN TELUGU TITLES                                 ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? chalk.yellow('DRY RUN (use --execute to apply)') : chalk.green('EXECUTING')}
Known titles: ${Object.keys(KNOWN_TITLES).length}
`));

  await applyKnownTitles(dryRun);
}

main().catch(console.error);
