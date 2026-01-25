#!/usr/bin/env npx tsx
/**
 * Smart Telugu Transliteration
 * Uses proper phonetic mapping for Telugu script
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Known high-quality title mappings
const KNOWN_TITLES: Record<string, string> = {
  // 2024 hits
  'Tillu Square': 'తిల్లు స్క్వేర్',
  '(Tillu)²': '(తిల్లు)²',
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
  'Mathu Vadalara 2': 'మత్తు వదలరా 2',
  'Bhimaa': 'భీమా',
  'Aa Okkati Adakku': 'ఆ ఒక్కటి అడక్కు',
  'Aarambham': 'ఆరంభం',
  'Anaganaga Oka Rowdy': 'అనగనగా ఒక రౌడీ',
  'Bhamakalapam 2': 'భామాకళాపం 2',
  'Bharathanatyam': 'భరతనాట్యం',
  'Mr Bachchan': 'మిస్టర్ బచ్చన్',
  'Manamey': 'మనమే',
  'Ooru Peru Bhairavakona': 'ఊరు పేరు భైరవకోన',
  'Double iSmart': 'డబుల్ ఐస్మార్ట్',
  'Saripodha Sanivaram': 'సరిపోదా శనివారం',
  
  // 2023 hits
  'Dasara': 'దసరా',
  'Adipurush': 'ఆదిపురుష్',
  'Waltair Veerayya': 'వాల్తేరు వీరయ్య',
  'Veera Simha Reddy': 'వీర సింహా రెడ్డి',
  'Kushi': 'ఖుషి',
  'Bhola Shankar': 'భోళా శంకర్',
  'Bhagavanth Kesari': 'భగవంత్ కేసరి',
  'Leo': 'లియో',
  'Salaar': 'సలార్',
  'Salaar: Part 1': 'సలార్: పార్ట్ 1',
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
  
  // Common patterns
  '100 Crores': '100 కోట్లు',
  'Part 1': 'పార్ట్ 1',
  'Part 2': 'పార్ట్ 2',
  'Chapter 1': 'చాప్టర్ 1',
  'Chapter 2': 'చాప్టర్ 2',
};

// Comprehensive word mappings
const WORD_MAP: Record<string, string> = {
  // Common Telugu words (romanized)
  'prema': 'ప్రేమ', 'katha': 'కథ', 'kathalu': 'కథలు',
  'raja': 'రాజా', 'raju': 'రాజు', 'rani': 'రాణి',
  'devi': 'దేవి', 'devudu': 'దేవుడు',
  'ram': 'రామ్', 'rama': 'రామ', 'krishna': 'కృష్ణ',
  'babu': 'బాబు', 'amma': 'అమ్మ', 'nanna': 'నాన్న',
  'anna': 'అన్న', 'akka': 'అక్క', 'chelli': 'చెల్లి',
  'pelli': 'పెళ్ళి', 'pellam': 'పెళ్ళాం', 'mogudu': 'మొగుడు',
  'nenu': 'నేను', 'nuvvu': 'నువ్వు', 'meeru': 'మీరు',
  'vaadu': 'వాడు', 'adi': 'అది', 'idi': 'ఇది',
  'ee': 'ఈ', 'aa': 'ఆ', 'oka': 'ఒక', 'okka': 'ఒక్క',
  'manchi': 'మంచి', 'pilla': 'పిల్ల', 'pillu': 'పిల్లు',
  'abbai': 'అబ్బాయి', 'ammayi': 'అమ్మాయి',
  'intlo': 'ఇంట్లో', 'oori': 'ఊరి', 'ooru': 'ఊరు',
  'peru': 'పేరు', 'kalam': 'కలం',
  'ante': 'అంటే', 'kosam': 'కోసం',
  'ledu': 'లేదు', 'undi': 'ఉంది',
  'lo': 'లో', 'ki': 'కి', 'ku': 'కు',
  'ra': 'రా', 'randi': 'రండి',
  'cheyyandi': 'చెయ్యండి',
  'mana': 'మన', 'manam': 'మనం',
  'naaku': 'నాకు', 'niku': 'నీకు',
  'ala': 'అలా', 'ila': 'ఇలా',
  'ela': 'ఎలా', 'enduku': 'ఎందుకు',
  'eppudu': 'ఎప్పుడు', 'akkada': 'అక్కడ',
  'ikkada': 'ఇక్కడ', 'ekkada': 'ఎక్కడ',
  'vaalu': 'వాళ్ళు', 'vaallu': 'వాళ్ళు',
  'garu': 'గారు', 'ayya': 'అయ్య',
  'thatha': 'తాత', 'bamma': 'బామ్మ',
  'mavayya': 'మావయ్య', 'attha': 'అత్త',
  'chinnodu': 'చిన్నోడు', 'peddodu': 'పెద్దోడు',
  
  // Common English words
  'the': 'ది', 'a': 'ఎ', 'an': 'ఎన్',
  'of': 'ఆఫ్', 'and': 'అండ్', 'or': 'ఆర్',
  'in': 'ఇన్', 'on': 'ఆన్', 'at': 'ఎట్',
  'to': 'టు', 'for': 'ఫర్', 'from': 'ఫ్రమ్',
  'is': 'ఈజ్', 'are': 'ఆర్', 'was': 'వాజ్',
  'love': 'లవ్', 'story': 'స్టోరీ',
  'life': 'లైఫ్', 'time': 'టైమ్',
  'day': 'డే', 'night': 'నైట్',
  'king': 'కింగ్', 'queen': 'క్వీన్',
  'man': 'మ్యాన్', 'boy': 'బాయ్',
  'girl': 'గర్ల్', 'baby': 'బేబీ',
  'mr': 'మిస్టర్', 'mrs': 'మిసెస్',
  'dr': 'డాక్టర్', 'sir': 'సర్',
  'super': 'సూపర్', 'hero': 'హీరో',
  'star': 'స్టార్', 'game': 'గేమ్',
  'police': 'పోలీస్', 'doctor': 'డాక్టర్',
  'family': 'ఫ్యామిలీ', 'college': 'కాలేజ్',
  'school': 'స్కూల్', 'cinema': 'సినిమా',
  'express': 'ఎక్స్‌ప్రెస్', 'train': 'ట్రైన్',
  'bus': 'బస్', 'car': 'కార్',
  'taxi': 'టాక్సీ', 'driver': 'డ్రైవర్',
  'double': 'డబుల్', 'single': 'సింగిల్',
  'smart': 'స్మార్ట్', 'crazy': 'క్రేజీ',
  'new': 'న్యూ', 'old': 'ఓల్డ్',
  'good': 'గుడ్', 'bad': 'బ్యాడ్',
  'happy': 'హ్యాపీ', 'lucky': 'లక్కీ',
  'tiger': 'టైగర్', 'lion': 'లయన్',
  'agent': 'ఏజెంట్', 'chief': 'చీఫ్',
  'captain': 'కెప్టెన్', 'major': 'మేజర్',
  'blue': 'బ్లూ', 'red': 'రెడ్',
  'black': 'బ్లాక్', 'white': 'వైట్',
  'world': 'వరల్డ్', 'city': 'సిటీ',
  'town': 'టౌన్', 'village': 'విలేజ్',
  'band': 'బ్యాండ్', 'marriage': 'మ్యారేజ్',
  'wedding': 'వెడ్డింగ్', 'party': 'పార్టీ',
  'murder': 'మర్డర్', 'mystery': 'మిస్టరీ',
  'horror': 'హారర్', 'action': 'యాక్షన్',
  'comedy': 'కామెడీ', 'drama': 'డ్రామా',
  'romance': 'రొమాన్స్', 'thriller': 'థ్రిల్లర్',
};

// Phonetic syllable mappings
const SYLLABLES: [string, string][] = [
  // Consonant clusters
  ['chh', 'ఛ'], ['ch', 'చ'], ['sh', 'శ'], ['th', 'త'],
  ['ph', 'ఫ'], ['kh', 'ఖ'], ['gh', 'ఘ'], ['dh', 'ధ'],
  ['bh', 'భ'], ['jh', 'ఝ'], ['nh', 'ణ'],
  ['tr', 'ట్ర'], ['pr', 'ప్ర'], ['br', 'బ్ర'],
  ['kr', 'క్ర'], ['gr', 'గ్ర'], ['dr', 'డ్ర'],
  ['st', 'స్ట'], ['sp', 'స్ప'], ['sk', 'స్క'],
  ['sw', 'స్వ'], ['sm', 'స్మ'], ['sn', 'స్న'],
  
  // Vowel combinations
  ['aa', 'ా'], ['ee', 'ీ'], ['ii', 'ీ'],
  ['oo', 'ూ'], ['uu', 'ూ'], ['ai', 'ై'],
  ['au', 'ౌ'], ['ou', 'ౌ'], ['ei', 'ే'],
  ['oa', 'ోఅ'], ['ea', 'ీ'],
  
  // Endings
  ['am', 'ం'], ['an', 'న్'], ['ar', 'ర్'],
  ['al', 'ల్'], ['as', 'స్'], ['at', 'ట్'],
  ['ak', 'క్'], ['ad', 'డ్'], ['ap', 'ప్'],
  ['er', 'ర్'], ['or', 'ర్'], ['ur', 'ర్'],
  ['ing', 'ింగ్'], ['tion', 'షన్'],
];

function transliterate(text: string): string {
  if (!text) return '';
  
  // Check known titles first
  const cleanTitle = text.replace(/\s*\(\d{4}\s*(film|చిత్రం)?\)\s*$/gi, '').trim();
  if (KNOWN_TITLES[cleanTitle]) return KNOWN_TITLES[cleanTitle];
  
  // Check case-insensitive
  const lower = cleanTitle.toLowerCase();
  for (const [key, value] of Object.entries(KNOWN_TITLES)) {
    if (key.toLowerCase() === lower) return value;
  }
  
  // Split into words
  const words = cleanTitle.split(/[\s\-]+/);
  const result: string[] = [];
  
  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/gi, '');
    
    // Check word map
    if (WORD_MAP[cleanWord]) {
      result.push(WORD_MAP[cleanWord]);
      continue;
    }
    
    // Keep numbers
    if (/^\d+$/.test(word)) {
      result.push(word);
      continue;
    }
    
    // Keep special chars
    if (/^[^a-zA-Z0-9]+$/.test(word)) {
      result.push(word);
      continue;
    }
    
    // Transliterate the word
    result.push(transliterateWord(word));
  }
  
  return result.join(' ');
}

function transliterateWord(word: string): string {
  // Keep prefix/suffix special chars
  const prefix = word.match(/^[^a-zA-Z0-9]+/)?.[0] || '';
  const suffix = word.match(/[^a-zA-Z0-9]+$/)?.[0] || '';
  let clean = word.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '');
  
  if (!clean) return word;
  
  let result = clean.toLowerCase();
  
  // Apply syllable patterns (longest first)
  for (const [pattern, replacement] of SYLLABLES) {
    result = result.replace(new RegExp(pattern, 'g'), replacement);
  }
  
  // Single character mappings
  const CHARS: Record<string, string> = {
    'a': 'ా', 'b': 'బ', 'c': 'క', 'd': 'డ', 'e': 'ె',
    'f': 'ఫ', 'g': 'గ', 'h': 'హ', 'i': 'ి', 'j': 'జ',
    'k': 'క', 'l': 'ల', 'm': 'మ', 'n': 'న', 'o': 'ో',
    'p': 'ప', 'q': 'క', 'r': 'ర', 's': 'స', 't': 'ట',
    'u': 'ు', 'v': 'వ', 'w': 'వ', 'x': 'క్స', 'y': 'య', 'z': 'జ',
  };
  
  let final = '';
  for (const char of result) {
    if (CHARS[char]) {
      final += CHARS[char];
    } else if (/[\u0C00-\u0C7F]/.test(char)) {
      final += char; // Already Telugu
    } else if (/[0-9]/.test(char)) {
      final += char;
    } else {
      final += char;
    }
  }
  
  return prefix + final + suffix;
}

async function processYear(year: number, limit: number, dryRun: boolean) {
  console.log(chalk.yellow(`\n📆 Processing ${year}...`));
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year')
    .eq('is_published', true)
    .eq('release_year', year)
    .or('title_te.is.null,title_te.eq.')
    .order('title_en')
    .limit(limit);
  
  if (error || !movies) {
    console.log(chalk.red('Error:', error?.message));
    return { processed: 0, updated: 0 };
  }
  
  let updated = 0;
  const results: string[] = [];
  
  for (const movie of movies) {
    const teluguTitle = transliterate(movie.title_en);
    
    if (!teluguTitle) continue;
    
    const isKnown = KNOWN_TITLES[movie.title_en] || 
      Object.keys(KNOWN_TITLES).some(k => k.toLowerCase() === movie.title_en.toLowerCase());
    
    const marker = isKnown ? '✓' : '~';
    console.log(`  ${marker} ${movie.title_en} → ${teluguTitle}`);
    results.push(`${movie.slug},${movie.title_en},${year},${teluguTitle}`);
    
    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ title_te: teluguTitle })
        .eq('id', movie.id);
      
      if (!updateError) updated++;
    } else {
      updated++;
    }
  }
  
  // Save CSV for review
  if (results.length > 0) {
    fs.appendFileSync('telugu-titles-generated.csv', results.join('\n') + '\n');
  }
  
  return { processed: movies.length, updated };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const yearArg = args.find(a => a.startsWith('--year='));
  const years = yearArg 
    ? [parseInt(yearArg.split('=')[1])]
    : [2024, 2023, 2022];
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;
  
  // Initialize CSV
  fs.writeFileSync('telugu-titles-generated.csv', 'slug,title_en,year,title_te\n');
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║        SMART TELUGU TRANSLITERATION                              ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? chalk.yellow('DRY RUN (use --execute to apply)') : chalk.green('EXECUTING')}
Years: ${years.join(', ')}
Limit per year: ${limit}

Legend: ✓ = Known title, ~ = Transliterated
`));

  let totalProcessed = 0;
  let totalUpdated = 0;
  
  for (const year of years) {
    const result = await processYear(year, limit, dryRun);
    totalProcessed += result.processed;
    totalUpdated += result.updated;
  }
  
  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════

  Total processed: ${totalProcessed}
  ${dryRun ? 'Would update' : 'Updated'}: ${totalUpdated}
  
  Generated CSV: telugu-titles-generated.csv
  
  ${dryRun ? chalk.yellow('Run with --execute to apply changes') : chalk.green('✅ Changes applied!')}
`));
}

main().catch(console.error);
