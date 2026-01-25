import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Rate limiting helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TMDBAlternativeTitle {
  iso_3166_1: string;
  title: string;
  type: string;
}

async function fetchTeluguTitle(tmdbId: number): Promise<string | null> {
  try {
    // First try to get alternative titles
    const altResponse = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/alternative_titles?api_key=${TMDB_API_KEY}`
    );
    
    if (altResponse.ok) {
      const altData = await altResponse.json();
      const titles: TMDBAlternativeTitle[] = altData.titles || [];
      
      // Look for Telugu title (India - IN)
      const teluguTitle = titles.find(t => 
        t.iso_3166_1 === 'IN' && 
        (t.type === 'Telugu' || t.title.match(/[\u0C00-\u0C7F]/)) // Telugu Unicode range
      );
      
      if (teluguTitle) {
        return teluguTitle.title;
      }
      
      // Look for any Indian title with Telugu characters
      const indianTitle = titles.find(t => 
        t.iso_3166_1 === 'IN' && t.title.match(/[\u0C00-\u0C7F]/)
      );
      
      if (indianTitle) {
        return indianTitle.title;
      }
    }
    
    // Try to get translations
    const transResponse = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/translations?api_key=${TMDB_API_KEY}`
    );
    
    if (transResponse.ok) {
      const transData = await transResponse.json();
      const translations = transData.translations || [];
      
      // Look for Telugu translation
      const teluguTrans = translations.find((t: any) => 
        t.iso_639_1 === 'te' || t.name === 'Telugu'
      );
      
      if (teluguTrans?.data?.title) {
        return teluguTrans.data.title;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Manual Telugu title mappings for popular movies
const MANUAL_TELUGU_TITLES: Record<string, string> = {
  // Classic films
  'Bhakta Prahlada': 'భక్త ప్రహ్లాద',
  'Malliswari': 'మల్లీశ్వరి',
  'Patala Bhairavi': 'పాతాళ భైరవి',
  'Devadasu': 'దేవదాసు',
  'Missamma': 'మిస్సమ్మ',
  'Mayabazar': 'మాయాబజార్',
  'Narthanasala': 'నర్తనశాల',
  'Lava Kusa': 'లవ కుశ',
  'Gundamma Katha': 'గుండమ్మ కథ',
  'Jagadeka Veeruni Katha': 'జగదేక వీరుని కథ',
  
  // NTR Era
  'Sri Krishnarjuna Yuddham': 'శ్రీ కృష్ణార్జున యుద్ధం',
  'Bobbili Yuddham': 'బొబ్బిలి యుద్ధం',
  'Daana Veera Soora Karna': 'దాన వీర శూర కర్ణ',
  'Vetagadu': 'వేటగాడు',
  'Driver Ramudu': 'డ్రైవర్ రాముడు',
  'Kondaveeti Simham': 'కొండవీటి సింహం',
  'Sardar Paparayudu': 'సర్దార్ పాపారాయుడు',
  
  // ANR Era
  'Devadasu': 'దేవదాసు',
  'Mooga Manasulu': 'మూగ మనసులు',
  'Doctor Chakravarthy': 'డాక్టర్ చక్రవర్తి',
  'Premabhishekam': 'ప్రేమాభిషేకం',
  'Meghasandesam': 'మేఘసందేశం',
  
  // Chiranjeevi Era
  'Khaidi': 'ఖైదీ',
  'Kondaveeti Donga': 'కొండవీటి దొంగ',
  'Jagadeka Veerudu Athiloka Sundari': 'జగదేక వీరుడు అతిలోక సుందరి',
  'Gang Leader': 'గ్యాంగ్ లీడర్',
  'Gharana Mogudu': 'ఘరానా మొగుడు',
  'Mutamestri': 'ముఠా మేస్త్రీ',
  'Indra': 'ఇంద్ర',
  'Tagore': 'ఠాగూర్',
  'Shankar Dada MBBS': 'శంకర్ దాదా MBBS',
  'Stalin': 'స్టాలిన్',
  'Khaidi No. 150': 'ఖైదీ నంబర్ 150',
  'Sye Raa Narasimha Reddy': 'సైరా నరసింహా రెడ్డి',
  'Godfather': 'గాడ్‌ఫాదర్',
  'Waltair Veerayya': 'వాల్టేర్ వీరయ్య',
  
  // Pawan Kalyan
  'Gabbar Singh': 'గబ్బర్ సింగ్',
  'Attarintiki Daredi': 'అత్తారింటికి దారేది',
  'Gopala Gopala': 'గోపాల గోపాల',
  'Sardaar Gabbar Singh': 'సర్దార్ గబ్బర్ సింగ్',
  'Vakeel Saab': 'వకీల్ సాబ్',
  'Bheemla Nayak': 'భీమ్లా నాయక్',
  
  // Mahesh Babu
  'Pokiri': 'పొకిరి',
  'Athadu': 'అతడు',
  'Dookudu': 'దూకుడు',
  'Businessman': 'బిజినెస్‌మ్యాన్',
  'Seethamma Vakitlo Sirimalle Chettu': 'సీతమ్మ వాకిట్లో సిరిమల్లె చెట్టు',
  '1 Nenokkadine': '1 నేనొక్కడినే',
  'Srimanthudu': 'శ్రీమంతుడు',
  'Brahmotsavam': 'బ్రహ్మోత్సవం',
  'Spyder': 'స్పైడర్',
  'Bharat Ane Nenu': 'భరత్ అనే నేను',
  'Maharshi': 'మహర్షి',
  'Sarileru Neekevvaru': 'సరిలేరు నీకెవ్వరు',
  'Sarkaru Vaari Paata': 'సర్కారు వారి పాట',
  'Guntur Kaaram': 'గుంటూరు కారం',
  
  // Prabhas
  'Mirchi': 'మిర్చి',
  'Baahubali: The Beginning': 'బాహుబలి: ది బిగినింగ్',
  'Baahubali 2: The Conclusion': 'బాహుబలి 2: ది కన్‌క్లూజన్',
  'Saaho': 'సాహో',
  'Radhe Shyam': 'రాధే శ్యామ్',
  'Adipurush': 'ఆదిపురుష్',
  'Salaar': 'సలార్',
  'Kalki 2898 AD': 'కల్కి 2898 AD',
  
  // Allu Arjun
  'Arya': 'ఆర్య',
  'Bunny': 'బన్నీ',
  'Happy': 'హ్యాపీ',
  'Desamuduru': 'దేశముదురు',
  'Parugu': 'పరుగు',
  'Arya 2': 'ఆర్య 2',
  'Vedam': 'వేదం',
  'Badrinath': 'బద్రీనాథ్',
  'Julayi': 'జులాయి',
  'Iddarammayilatho': 'ఇద్దరమ్మాయిలతో',
  'Race Gurram': 'రేస్ గుర్రం',
  'S/O Satyamurthy': 'S/O సత్యమూర్తి',
  'Sarrainodu': 'సర్రైనోడు',
  'Duvvada Jagannadham': 'దువ్వాడ జగన్నాథం',
  'Naa Peru Surya': 'నా పేరు సూర్య',
  'Ala Vaikunthapurramuloo': 'అల వైకుంఠపురములో',
  'Pushpa: The Rise': 'పుష్ప: ది రైజ్',
  'Pushpa 2: The Rule': 'పుష్ప 2: ది రూల్',
  
  // NTR Jr
  'Student No. 1': 'స్టూడెంట్ నంబర్ 1',
  'Simhadri': 'సింహాద్రి',
  'Andhrawala': 'ఆంధ్రావాల',
  'Rakhi': 'రాఖీ',
  'Yamadonga': 'యమదొంగ',
  'Kantri': 'కంట్రీ',
  'Adhurs': 'అధుర్స్',
  'Brindavanam': 'బృందావనం',
  'Baadshah': 'బాద్‌షా',
  'Ramayya Vasthavayya': 'రామయ్య వస్తావయ్యా',
  'Temper': 'టెంపర్',
  'Nannaku Prematho': 'నాన్నకు ప్రేమతో',
  'Janatha Garage': 'జనతా గ్యారేజ్',
  'Jai Lava Kusa': 'జై లవ కుశ',
  'Aravindha Sametha Veera Raghava': 'అరవింద సమేత వీర రాఘవ',
  'RRR': 'RRR',
  'Devara: Part 1': 'దేవర: పార్ట్ 1',
  
  // Ram Charan
  'Chirutha': 'చిరుత',
  'Magadheera': 'మగధీర',
  'Orange': 'ఆరెంజ్',
  'Racha': 'రచ్చ',
  'Naayak': 'నాయక్',
  'Yevadu': 'ఎవడు',
  'Govindudu Andarivadele': 'గోవిందుడు అందరివాడేలే',
  'Bruce Lee': 'బ్రూస్ లీ',
  'Dhruva': 'ధ్రువ',
  'Rangasthalam': 'రంగస్థలం',
  'Vinaya Vidheya Rama': 'వినయ విధేయ రామ',
  'Game Changer': 'గేమ్ ఛేంజర్',
  
  // Naga Chaitanya
  'Josh': 'జోష్',
  'Ye Maaya Chesave': 'యే మాయ చేసావే',
  'Sukumarudu': 'సుకుమారుడు',
  'Manam': 'మనం',
  'Premam': 'ప్రేమం',
  'Majili': 'మజిలీ',
  'Love Story': 'లవ్ స్టోరీ',
  'Bangarraju': 'బంగార్రాజు',
  'Thank You': 'థాంక్ యూ',
  'Laal Singh Chaddha': 'లాల్ సింగ్ చడ్ఢా',
  'Custody': 'కస్టడీ',
  
  // Vijay Deverakonda
  'Pelli Choopulu': 'పెళ్ళి చూపులు',
  'Arjun Reddy': 'అర్జున్ రెడ్డి',
  'Geetha Govindam': 'గీతా గోవిందం',
  'NOTA': 'నోటా',
  'Taxiwaala': 'టాక్సీవాలా',
  'Dear Comrade': 'డియర్ కామ్రేడ్',
  'World Famous Lover': 'వరల్డ్ ఫేమస్ లవర్',
  'Liger': 'లైగర్',
  'Kushi': 'ఖుషీ',
  
  // Ravi Teja
  'Idiot': 'ఇడియట్',
  'Amma Nanna O Tamila Ammayi': 'అమ్మ నాన్న ఓ తమిళ అమ్మాయి',
  'Venky': 'వెంకీ',
  'Vikramarkudu': 'విక్రమార్కుడు',
  'Dubai Seenu': 'దుబాయ్ సీను',
  'Krishna': 'కృష్ణ',
  'Kick': 'కిక్',
  'Mirapakay': 'మిరపకాయ',
  'Balupu': 'బలుపు',
  'Power': 'పవర్',
  'Bengal Tiger': 'బెంగాల్ టైగర్',
  'Raja The Great': 'రాజా ది గ్రేట్',
  'Nela Ticket': 'నేల టిక్కెట్',
  'Disco Raja': 'డిస్కో రాజా',
  'Krack': 'క్రాక్',
  'Khiladi': 'ఖిలాడీ',
  'Dhamaka': 'ధమాకా',
  'Tiger Nageswara Rao': 'టైగర్ నాగేశ్వర రావు',
  'Eagle': 'ఈగిల్',
  
  // Nani
  'Ride': 'రైడ్',
  'Bheemili Kabaddi Jattu': 'భీమిలి కబడ్డీ జట్టు',
  'Ala Modalaindi': 'అలా మొదలైంది',
  'Pilla Zamindar': 'పిల్ల జమీందార్',
  'Eega': 'ఈగ',
  'Yeto Vellipoyindhi Manasu': 'ఏటో వెళ్ళిపోయింది మనసు',
  'Paisa': 'పైసా',
  'Yevade Subramanyam': 'ఎవడే సుబ్రమణ్యం',
  'Bhale Bhale Magadivoy': 'భలే భలే మగాడివోయ్',
  'Krishna Gaadi Veera Prema Gaadha': 'కృష్ణ గాడి వీర ప్రేమ గాధ',
  'Gentleman': 'జంటిల్‌మ్యాన్',
  'Nenu Local': 'నేను లోకల్',
  'MCA': 'MCA',
  'Devadas': 'దేవదాస్',
  'Jersey': 'జెర్సీ',
  'Gang Leader': 'గ్యాంగ్ లీడర్',
  'V': 'వి',
  'Tuck Jagadish': 'టక్ జగదీష్',
  'Shyam Singha Roy': 'శ్యామ్ సింఘా రాయ్',
  'Ante Sundaraniki': 'అంతే సుందరానికి',
  'Dasara': 'దసరా',
  'Hi Nanna': 'హాయ్ నాన్నా',
  'Saripodhaa Sanivaaram': 'సరిపోదా శనివారం',
  
  // Nagarjuna
  'Vikram': 'విక్రమ్',
  'Shiva': 'శివ',
  'Geethanjali': 'గీతాంజలి',
  'Nirnayam': 'నిర్ణయం',
  'President Gari Pellam': 'ప్రెసిడెంట్ గారి పెళ్ళం',
  'Allari Alludu': 'అల్లరి అల్లుడు',
  'Hello Brother': 'హలో బ్రదర్',
  'Ninne Pelladatha': 'నిన్నే పెళ్ళాడతా',
  'Nuvvu Naaku Nachav': 'నువ్వు నాకు నచ్చావ్',
  'Mass': 'మాస్',
  'Super': 'సూపర్',
  'King': 'కింగ్',
  'Bhai': 'భాయ్',
  'Oopiri': 'ఊపిరి',
  'Manmadhudu 2': 'మన్మధుడు 2',
  'Wild Dog': 'వైల్డ్ డాగ్',
  'Bangarraju': 'బంగార్రాజు',
  'The Ghost': 'ది ఘోస్ట్',
  
  // Recent Blockbusters
  'HIT: The First Case': 'HIT: ది ఫస్ట్ కేస్',
  'HIT: The Second Case': 'HIT: ది సెకండ్ కేస్',
  'Bimbisara': 'బింబిసార',
  'Sita Ramam': 'సీతా రామం',
  'Karthikeya 2': 'కార్తికేయ 2',
  'Ante Sundaraniki': 'అంతే సుందరానికి',
  'Major': 'మేజర్',
  'Virata Parvam': 'విరాట పర్వం',
  'Liger': 'లైగర్',
  'Agent': 'ఏజెంట్',
  'Veera Simha Reddy': 'వీర సింహా రెడ్డి',
  'Waltair Veerayya': 'వాల్టేర్ వీరయ్య',
  'Skanda': 'స్కంద',
  'Extra Ordinary Man': 'ఎక్స్ట్రా ఆర్డినరీ మ్యాన్',
  'Bhagavanth Kesari': 'భగవంత్ కేసరి',
  'Guntur Kaaram': 'గుంటూర్ కారం',
  'Hanu-Man': 'హనుమాన్',
  'Tillu Square': 'టిల్లు స్క్వేర్',
};

async function enrichTeluguTitles() {
  console.log('=== ENRICHING TELUGU TITLES ===\n');
  
  if (!TMDB_API_KEY) {
    console.error('TMDB_API_KEY not found! Using manual titles only.');
  }
  
  // Get movies missing Telugu title
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, tmdb_id, release_year')
    .eq('is_published', true)
    .is('title_te', null)
    .order('release_year', { ascending: false });
  
  if (error || !movies) {
    console.error('Error fetching movies:', error);
    return;
  }
  
  console.log(`📊 Movies missing Telugu title: ${movies.length}\n`);
  
  let updated = 0;
  let manualUpdates = 0;
  let tmdbUpdates = 0;
  let failed = 0;
  
  // First pass: Apply manual titles
  console.log('📝 APPLYING MANUAL TELUGU TITLES...\n');
  
  for (const movie of movies) {
    const manualTitle = MANUAL_TELUGU_TITLES[movie.title_en];
    
    if (manualTitle) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ title_te: manualTitle, updated_at: new Date().toISOString() })
        .eq('id', movie.id);
      
      if (!updateError) {
        console.log(`✓ ${movie.title_en} → ${manualTitle}`);
        manualUpdates++;
        updated++;
      }
    }
  }
  
  console.log(`\n📊 Manual titles applied: ${manualUpdates}\n`);
  
  // Second pass: Try TMDB API for remaining movies
  if (TMDB_API_KEY) {
    console.log('🌐 FETCHING FROM TMDB API...\n');
    
    // Get remaining movies without Telugu title
    const { data: remainingMovies } = await supabase
      .from('movies')
      .select('id, title_en, tmdb_id, release_year')
      .eq('is_published', true)
      .is('title_te', null)
      .not('tmdb_id', 'is', null)
      .order('release_year', { ascending: false })
      .limit(200); // Limit to avoid rate limits
    
    if (remainingMovies && remainingMovies.length > 0) {
      let processed = 0;
      
      for (const movie of remainingMovies) {
        if (!movie.tmdb_id) continue;
        
        const teluguTitle = await fetchTeluguTitle(movie.tmdb_id);
        
        if (teluguTitle && teluguTitle.match(/[\u0C00-\u0C7F]/)) { // Only if contains Telugu chars
          const { error: updateError } = await supabase
            .from('movies')
            .update({ title_te: teluguTitle, updated_at: new Date().toISOString() })
            .eq('id', movie.id);
          
          if (!updateError) {
            console.log(`✓ ${movie.title_en} → ${teluguTitle}`);
            tmdbUpdates++;
            updated++;
          }
        }
        
        processed++;
        
        // Progress update every 20 movies
        if (processed % 20 === 0) {
          console.log(`   Processed ${processed}/${remainingMovies.length}...`);
        }
        
        // Rate limiting - 40 requests per 10 seconds max
        await sleep(300);
      }
    }
    
    console.log(`\n📊 TMDB titles fetched: ${tmdbUpdates}\n`);
  }
  
  console.log('=== SUMMARY ===');
  console.log(`Total updated: ${updated}`);
  console.log(`  - Manual: ${manualUpdates}`);
  console.log(`  - TMDB: ${tmdbUpdates}`);
  console.log(`Remaining without Telugu title: ${movies.length - updated}`);
}

enrichTeluguTitles().catch(console.error);
