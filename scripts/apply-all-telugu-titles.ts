#!/usr/bin/env npx tsx
/**
 * Apply Telugu Titles - Comprehensive Dictionary Approach
 * Uses extensive word mappings for accurate transliteration
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Comprehensive word-to-Telugu dictionary
const DICT: Record<string, string> = {
  // === COMMON TELUGU WORDS ===
  // Family
  'amma': 'అమ్మ', 'nanna': 'నాన్న', 'anna': 'అన్న', 'akka': 'అక్క',
  'chelli': 'చెల్లి', 'tammudu': 'తమ్ముడు', 'babu': 'బాబు', 'bava': 'బావ',
  'mava': 'మావ', 'mavayya': 'మావయ్య', 'attha': 'అత్త', 'thatha': 'తాత',
  'bamma': 'బామ్మ', 'avva': 'అవ్వ', 'vadina': 'వదిన', 'maridi': 'మరిది',
  'alludu': 'అల్లుడు', 'kodalu': 'కోడలు', 'bharya': 'భార్య', 'bharta': 'భర్త',
  'pellam': 'పెళ్ళాం', 'mogudu': 'మొగుడు', 'ammayilu': 'అమ్మాయిలు',
  
  // Marriage/Relationships
  'pelli': 'పెళ్ళి', 'kalyanam': 'కల్యాణం', 'vivahamu': 'వివాహము',
  'prema': 'ప్రేమ', 'premika': 'ప్రేమిక', 'premikudu': 'ప్రేమికుడు',
  'priyudu': 'ప్రియుడు', 'priya': 'ప్రియ', 'priyuralu': 'ప్రియురాలు',
  
  // People
  'abbai': 'అబ్బాయి', 'ammayi': 'అమ్మాయి', 'pilla': 'పిల్ల', 'pillu': 'పిల్లు',
  'pilladu': 'పిల్లాడు', 'koduku': 'కొడుకు', 'koothuru': 'కూతురు',
  'manishi': 'మనిషి', 'manushulu': 'మనుషులు', 'janalu': 'జనాలు',
  'stri': 'స్త్రీ', 'purushudu': 'పురుషుడు',
  
  // Titles
  'raja': 'రాజా', 'raju': 'రాజు', 'rani': 'రాణి', 'devi': 'దేవి',
  'devudu': 'దేవుడు', 'swamy': 'స్వామి', 'swami': 'స్వామి',
  'sri': 'శ్రీ', 'srimathi': 'శ్రీమతి', 'garu': 'గారు',
  'ayya': 'అయ్య', 'rao': 'రావు', 'reddy': 'రెడ్డి', 'naidu': 'నాయుడు',
  'choudhary': 'చౌదరి', 'setty': 'శెట్టి', 'sharma': 'శర్మ',
  
  // Body/Self
  'nenu': 'నేను', 'nuvvu': 'నువ్వు', 'meeru': 'మీరు', 'manam': 'మనం',
  'mana': 'మన', 'naa': 'నా', 'nee': 'నీ', 'mee': 'మీ',
  'vaadu': 'వాడు', 'aame': 'ఆమె', 'vaaru': 'వారు', 'vaallu': 'వాళ్ళు',
  
  // Place
  'illu': 'ఇల్లు', 'intlo': 'ఇంట్లో', 'inti': 'ఇంటి', 'intikokkadu': 'ఇంటికొక్కడు',
  'ooru': 'ఊరు', 'oori': 'ఊరి', 'oorilo': 'ఊరిలో', 'palli': 'పల్లి',
  'nagaram': 'నగరం', 'desam': 'దేశం', 'desamlo': 'దేశంలో',
  'peta': 'పేట', 'puram': 'పురం', 'abad': 'ాబాద్', 'patnam': 'పట్నం',
  
  // Story/Film
  'katha': 'కథ', 'kathalu': 'కథలు', 'charitra': 'చరిత్ర',
  'cinema': 'సినిమా', 'chitram': 'చిత్రం', 'chitralu': 'చిత్రాలు',
  'paata': 'పాట', 'paatalu': 'పాటలు', 'sangeetam': 'సంగీతం',
  
  // Actions
  'ra': 'రా', 'raa': 'రా', 'randi': 'రండి', 'vachchi': 'వచ్చి',
  'po': 'పో', 'povali': 'పోవాలి', 'potunna': 'పోతున్న',
  'vellu': 'వెళ్ళు', 'raa': 'రా', 'osthe': 'ఓస్తే',
  'cheyyi': 'చేయి', 'chesthe': 'చేస్తే', 'cheppandi': 'చెప్పండి',
  'chudandi': 'చూడండి', 'chudu': 'చూడు', 'vinandi': 'వినండి',
  'thelusu': 'తెలుసు', 'undi': 'ఉంది', 'unnaru': 'ఉన్నారు',
  'ledu': 'లేదు', 'leru': 'లేరు', 'ledhu': 'లేధు',
  
  // Adjectives
  'manchi': 'మంచి', 'manchidi': 'మంచిది', 'chala': 'చాలా',
  'baaga': 'బాగా', 'baagundi': 'బాగుంది',
  'pedda': 'పెద్ద', 'chinna': 'చిన్న', 'chinni': 'చిన్ని',
  'kotta': 'కొత్త', 'patha': 'పాత', 'goppa': 'గొప్ప',
  'andham': 'అందం', 'andhamaina': 'అందమైన',
  'sundara': 'సుందర', 'sundari': 'సుందరి',
  
  // Numbers
  'oka': 'ఒక', 'okka': 'ఒక్క', 'okkadu': 'ఒక్కడు', 'okkate': 'ఒక్కటే',
  'rendu': 'రెండు', 'iddaru': 'ఇద్దరు', 'moodu': 'మూడు', 'mugguru': 'ముగ్గురు',
  'nalugu': 'నాలుగు', 'aidu': 'ఐదు', 'aru': 'ఆరు',
  'edu': 'ఏడు', 'enimidi': 'ఎనిమిది', 'tommidi': 'తొమ్మిది', 'padi': 'పది',
  
  // Time
  'roju': 'రోజు', 'rojulu': 'రోజులు', 'raatri': 'రాత్రి', 'pagalu': 'పగలు',
  'udayam': 'ఉదయం', 'saayantram': 'సాయంత్రం', 'sanvatsaram': 'సంవత్సరం',
  'vaaram': 'వారం', 'nelalu': 'నెలలు', 'nela': 'నెల',
  
  // Questions
  'em': 'ఏం', 'emi': 'ఏమి', 'ela': 'ఎలా', 'enduku': 'ఎందుకు',
  'eppudu': 'ఎప్పుడు', 'ekkada': 'ఎక్కడ', 'evaru': 'ఎవరు',
  
  // Demonstratives  
  'ee': 'ఈ', 'aa': 'ఆ', 'adi': 'అది', 'idi': 'ఇది',
  'ikkada': 'ఇక్కడ', 'akkada': 'అక్కడ',
  
  // Postpositions
  'lo': 'లో', 'ki': 'కి', 'ku': 'కు', 'tho': 'తో', 'kosam': 'కోసం',
  'ante': 'అంటే', 'gurinchi': 'గురించి', 'meeda': 'మీద', 'kinda': 'కింద',
  
  // Common Telugu Movie Words
  'rowdy': 'రౌడీ', 'rowdylu': 'రౌడీలు', 'donga': 'దొంగ', 'dongalu': 'దొంగలు',
  'hero': 'హీరో', 'heroine': 'హీరోయిన్', 'villain': 'విలన్',
  'police': 'పోలీస్', 'constable': 'కానిస్టేబుల్', 'inspector': 'ఇన్‌స్పెక్టర్',
  'doctor': 'డాక్టర్', 'master': 'మాస్టర్', 'teacher': 'టీచర్',
  'driver': 'డ్రైవర్', 'pilot': 'పైలట్', 'soldier': 'సోల్జర్',
  'king': 'కింగ్', 'queen': 'క్వీన్', 'prince': 'ప్రిన్స్',
  
  // Emotions/States
  'prema': 'ప్రేమ', 'kopam': 'కోపం', 'dukham': 'దుఃఖం', 'santosham': 'సంతోషం',
  'bhayam': 'భయం', 'aascharyam': 'ఆశ్చర్యం', 'aasha': 'ఆశ',
  
  // Modern/English Words
  'love': 'లవ్', 'story': 'స్టోరీ', 'life': 'లైఫ్', 'style': 'స్టైల్',
  'express': 'ఎక్స్‌ప్రెస్', 'special': 'స్పెషల్', 'super': 'సూపర్',
  'family': 'ఫ్యామిలీ', 'friend': 'ఫ్రెండ్', 'friends': 'ఫ్రెండ్స్',
  'college': 'కాలేజీ', 'school': 'స్కూల్', 'office': 'ఆఫీస్',
  'bank': 'బ్యాంక్', 'hospital': 'హాస్పిటల్', 'hotel': 'హోటల్',
  'game': 'గేమ్', 'show': 'షో', 'star': 'స్టార్', 'party': 'పార్టీ',
  'bus': 'బస్', 'car': 'కార్', 'taxi': 'టాక్సీ', 'train': 'ట్రైన్',
  'part': 'పార్ట్', 'chapter': 'చాప్టర్', 'episode': 'ఎపిసోడ్',
  'mr': 'మిస్టర్', 'mrs': 'మిసెస్', 'miss': 'మిస్', 'dr': 'డా.',
  'the': 'ది', 'a': 'ఎ', 'an': 'ఎన్', 'of': 'ఆఫ్', 'and': 'అండ్',
  'is': 'ఈజ్', 'no': 'నో', 'yes': 'యెస్', 'ok': 'ఓకే', 'okay': 'ఓకే',
  'only': 'ఓన్లీ', 'just': 'జస్ట్', 'very': 'వెరీ', 'so': 'సో',
  'hi': 'హాయ్', 'hello': 'హలో', 'bye': 'బై', 'sorry': 'సారీ', 'thanks': 'థ్యాంక్స్',
  'happy': 'హ్యాపీ', 'lucky': 'లక్కీ', 'crazy': 'క్రేజీ', 'smart': 'స్మార్ట్',
  'double': 'డబుల్', 'single': 'సింగిల్', 'triple': 'ట్రిపుల్',
  'boy': 'బాయ్', 'girl': 'గర్ల్', 'baby': 'బేబీ', 'man': 'మ్యాన్',
  'day': 'డే', 'night': 'నైట్', 'time': 'టైమ్', 'way': 'వే',
  'one': 'వన్', 'two': 'టూ', 'three': 'త్రీ', 'four': 'ఫోర్',
  'first': 'ఫస్ట్', 'second': 'సెకండ్', 'last': 'లాస్ట్',
  'new': 'న్యూ', 'old': 'ఓల్డ్', 'good': 'గుడ్', 'bad': 'బ్యాడ్',
  'big': 'బిగ్', 'small': 'స్మాల్', 'best': 'బెస్ట్', 'great': 'గ్రేట్',
  'true': 'ట్రూ', 'real': 'రియల్', 'fake': 'ఫేక్',
  'action': 'యాక్షన్', 'comedy': 'కామెడీ', 'drama': 'డ్రామా',
  'thriller': 'థ్రిల్లర్', 'horror': 'హారర్', 'romantic': 'రొమాంటిక్',
  'murder': 'మర్డర్', 'mystery': 'మిస్టరీ', 'secret': 'సీక్రెట్',
  'power': 'పవర్', 'force': 'ఫోర్స్', 'energy': 'ఎనర్జీ',
  'tiger': 'టైగర్', 'lion': 'లయన్', 'eagle': 'ఈగిల్',
  'fire': 'ఫైర్', 'water': 'వాటర్', 'sky': 'స్కై', 'sun': 'సన్', 'moon': 'మూన్',
  'gold': 'గోల్డ్', 'silver': 'సిల్వర్', 'diamond': 'డైమండ్',
  'red': 'రెడ్', 'blue': 'బ్లూ', 'black': 'బ్లాక్', 'white': 'వైట్', 'green': 'గ్రీన్',
  'road': 'రోడ్', 'street': 'స్ట్రీట్', 'city': 'సిటీ', 'town': 'టౌన్', 'village': 'విలేజ్',
  'band': 'బ్యాండ్', 'group': 'గ్రూప్', 'team': 'టీమ్', 'gang': 'గ్యాంగ్',
  'wedding': 'వెడ్డింగ్', 'marriage': 'మ్యారేజ్', 'birthday': 'బర్త్‌డే',
  'operation': 'ఆపరేషన్', 'mission': 'మిషన్', 'target': 'టార్గెట్',
  'agent': 'ఏజెంట్', 'chief': 'చీఫ్', 'captain': 'కెప్టెన్', 'major': 'మేజర్',
  'class': 'క్లాస్', 'mass': 'మాస్', 'hit': 'హిట్', 'flop': 'ఫ్లాప్',
  'kb': 'కేబీ', 'dj': 'DJ', 'ib': 'ఐబీ', 'cbi': 'సీబీఐ',
  'vs': 'vs', 'pm': 'PM', 'am': 'AM',
  
  // === SPECIFIC TELUGU MOVIE WORDS ===
  'bangaru': 'బంగారు', 'bangaram': 'బంగారం', 'mutyam': 'ముత్యం', 'mutyalu': 'ముత్యాలు',
  'challani': 'చల్లని', 'vandemataram': 'వందేమాతరం', 'vande': 'వందే', 'mataram': 'మాతరం',
  'bhaktha': 'భక్త', 'bhakti': 'భక్తి', 'daivam': 'దైవం', 'devatha': 'దేవత',
  'sri': 'శ్రీ', 'srimathi': 'శ్రీమతి', 'kumar': 'కుమార్', 'kumari': 'కుమారి',
  'veera': 'వీర', 'veerudu': 'వీరుడు', 'simha': 'సింహ', 'simham': 'సింహం',
  'narasimha': 'నరసింహ', 'krishna': 'కృష్ణ', 'rama': 'రామ', 'ramudu': 'రాముడు',
  'sita': 'సీత', 'savitri': 'సావిత్రి', 'lakshmi': 'లక్ష్మి', 'saraswathi': 'సరస్వతి',
  'ganga': 'గంగ', 'yamuna': 'యమునా', 'godavari': 'గోదావరి', 'krishna': 'కృష్ణ',
  'mahatma': 'మహాత్మ', 'mahendra': 'మహేంద్ర', 'chakravarthy': 'చక్రవర్తి',
  'bheema': 'భీమ', 'arjuna': 'అర్జున', 'dharma': 'ధర్మ', 'karma': 'కర్మ',
  'panduranga': 'పాండురంగ', 'venkateswara': 'వెంకటేశ్వర', 'tirupathi': 'తిరుపతి',
  'aadhi': 'ఆది', 'akhanda': 'అఖండ', 'sankalpa': 'సంకల్ప', 'nirnaya': 'నిర్ణయ',
  'yatra': 'యాత్ర', 'prayanam': 'ప్రయాణం', 'sandesam': 'సందేశం', 'sandadi': 'సందడి',
  'ammoru': 'అమ్మోరు', 'durgamma': 'దుర్గమ్మ', 'gangamma': 'గంగమ్మ',
  'attintiki': 'అత్తింటికి', 'daredi': 'దరేడి', 'maradalu': 'మరదలు',
  'chedugudu': 'చెడుగుడు', 'baadshah': 'బాద్‌షా', 'khiladi': 'ఖిలాడీ',
  'cheppanu': 'చెప్పను', 'adugu': 'అడుగు', 'aatma': 'ఆత్మ', 'athidhi': 'అతిథి',
  'abhilasha': 'అభిలాష', 'aashirwaadam': 'ఆశీర్వాదం', 'abhinandana': 'అభినందన',
  'aaradhana': 'ఆరాధన', 'abhimanyudu': 'అభిమన్యుడు', 'adhikaram': 'అధికారం',
  'agni': 'అగ్ని', 'aham': 'అహం', 'ahuti': 'ఆహుతి', 'akali': 'ఆకలి',
  'anandam': 'ఆనందం', 'andari': 'అందరి', 'annadammula': 'అన్నదమ్ముల',
  'anubandham': 'అనుబంధం', 'anveshana': 'అన్వేషణ', 'aparadhulu': 'అపరాధులు',
  'ardhangi': 'అర్ధాంగి', 'ardhanaari': 'అర్ధనారి', 'asalu': 'అసలు',
  
  // Keep as-is patterns
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', 
  '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
};

// Simple transliteration for unknown words
const SIMPLE_MAP: Record<string, string> = {
  'a': 'ా', 'b': 'బ', 'c': 'క', 'd': 'డ', 'e': 'ె', 'f': 'ఫ', 'g': 'గ',
  'h': 'హ', 'i': 'ి', 'j': 'జ', 'k': 'క', 'l': 'ల', 'm': 'మ', 'n': 'న',
  'o': 'ో', 'p': 'ప', 'q': 'క', 'r': 'ర', 's': 'స', 't': 'ట', 'u': 'ు',
  'v': 'వ', 'w': 'వ', 'x': 'క్స', 'y': 'య', 'z': 'జ',
};

function transliterateSimple(word: string): string {
  let result = '';
  for (const char of word.toLowerCase()) {
    if (SIMPLE_MAP[char]) {
      result += SIMPLE_MAP[char];
    } else if (/\d/.test(char)) {
      result += char;
    } else {
      result += char;
    }
  }
  return result;
}

function convertWord(word: string): string {
  if (!word) return '';
  
  const lower = word.toLowerCase().replace(/[^a-z0-9]/gi, '');
  
  // Check dictionary
  if (DICT[lower]) return DICT[lower];
  
  // Check with common suffixes removed
  const suffixes = ['udu', 'adu', 'ulu', 'alu', 'ani', 'amu', 'lu'];
  for (const suffix of suffixes) {
    if (lower.endsWith(suffix)) {
      const base = lower.slice(0, -suffix.length);
      if (DICT[base]) return DICT[base] + DICT[suffix];
    }
  }
  
  // Keep numbers
  if (/^\d+$/.test(word)) return word;
  
  // Simple transliteration for unknown
  return transliterateSimple(word);
}

function generateTeluguTitle(title: string): string {
  if (!title) return '';
  
  // Clean
  let clean = title.replace(/\s*\(\d{4}\s*(film|చిత్రం)?\)\s*$/gi, '').trim();
  
  // Already Telugu
  if (/[\u0C00-\u0C7F]/.test(clean)) return clean;
  
  // Split and convert
  const words = clean.split(/[\s\-]+/);
  return words.map(convertWord).join(' ');
}

async function processAll(limit: number, dryRun: boolean) {
  console.log(chalk.yellow('\n📊 Fetching all movies needing Telugu titles...\n'));
  
  // Get all missing
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year')
    .eq('is_published', true)
    .or('title_te.is.null,title_te.eq.')
    .order('release_year', { ascending: false })
    .limit(limit);
  
  if (error || !movies) {
    console.log(chalk.red('Error:', error?.message));
    return 0;
  }
  
  console.log(`Found ${movies.length} movies to process\n`);
  
  let updated = 0;
  let batchSize = 100;
  
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const teluguTitle = generateTeluguTitle(movie.title_en);
    
    if (!teluguTitle) continue;
    
    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ title_te: teluguTitle })
        .eq('id', movie.id);
      
      if (!updateError) updated++;
    } else {
      updated++;
    }
    
    // Show progress
    if ((i + 1) % batchSize === 0) {
      console.log(chalk.gray(`  Progress: ${i + 1}/${movies.length} (${((i + 1) / movies.length * 100).toFixed(0)}%)`));
    }
  }
  
  return updated;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 5000;
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║       COMPREHENSIVE TELUGU TITLE APPLICATION                     ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? chalk.yellow('DRY RUN (use --execute to apply)') : chalk.green('EXECUTING')}
Limit: ${limit}
Dictionary size: ${Object.keys(DICT).length} words
`));

  const updated = await processAll(limit, dryRun);
  
  // Show final status
  const { count: total } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);
  
  const { count: withTelugu } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .not('title_te', 'is', null)
    .neq('title_te', '');
  
  const pct = ((withTelugu! / total!) * 100).toFixed(1);
  
  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════

  ${dryRun ? 'Would update' : 'Updated'}: ${updated} movies
  
  Current coverage: ${withTelugu}/${total} (${pct}%)
  
  ${dryRun ? chalk.yellow('Run with --execute to apply changes') : chalk.green('✅ Changes applied!')}
`));
}

main().catch(console.error);
