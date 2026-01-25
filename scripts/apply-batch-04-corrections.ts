#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

const MAIN_CSV = 'movies-missing-telugu-titles-2026-01-14.csv';
const BATCH_04 = 'telugu-title-batches/batch-04-2024-Recent-4of4.csv';

interface MovieRow {
  Slug: string;
  TitleEn: string;
  TitleTe: string;
  ReleaseYear: string;
  Hero: string;
  Heroine: string;
  Director: string;
}

// All corrections from user's validation
const corrections: Record<string, Partial<MovieRow>> = {
  'the-birthday-boy-2024': {
    TitleTe: 'ది బర్త్ డే బాయ్',
    Director: 'Whisky'
  },
  'matka-2024': {
    TitleTe: 'మట్కా'
  },
  'oka-manchi-prema-katha-2024': {
    TitleTe: 'ఒక మంచి ప్రేమ కథ',
    ReleaseYear: '2025',
    Hero: 'Samuthirakani',
    Heroine: 'Rohini Hattangadi',
    Director: 'Akkineni Kutumba Rao'
  },
  'appudo-ippudo-eppudo-2024': {
    TitleTe: 'అప్పుడో ఇప్పుడో ఎప్పుడో'
  },
  'veeranjaneyulu-vihara-yatra-2024': {
    TitleTe: 'వీరాంజనేయులు విహార యాత్ర'
  },
  'om-bheem-bush-2024': {
    TitleTe: 'ఓం భీమ్ బుష్'
  },
  'maa-nanna-superhero-2024': {
    TitleTe: 'మా నాన్న సూపర్ హీరో'
  },
  'jilebi-2024': {
    TitleTe: 'జిలేబి'
  },
  'sarangadhariya-2024': {
    TitleEn: 'Sarangadhariya',
    TitleTe: 'సరంగధరియ'
  },
  'bhimaa-2024': {
    TitleTe: 'భీమా'
  },
  'roti-kapda-romance-2024': {
    TitleEn: 'Roti Kapda Romance',
    TitleTe: 'రోటీ కపడా రొమాన్స్'
  },
  'kotha-rangula-prapancham-2024': {
    TitleEn: 'Kotha Rangula Prapancham',
    TitleTe: 'కొత్త రంగుల ప్రపంచం'
  },
  'valari-2024': {
    TitleEn: 'Valari',
    TitleTe: 'వలరి'
  },
  'tenant-2024': {
    TitleEn: 'Tenant',
    TitleTe: 'టెనెంట్'
  },
  'honeymoon-express-2024': {
    TitleTe: 'హనీమూన్ ఎక్స్‌ప్రెస్',
    Hero: 'Chaitanya Rao',
    Heroine: 'Hebah Patel',
    Director: 'Bala Rajasekharuni'
  },
  'ambajipeta-marriage-band-2024': {
    TitleTe: 'అంబాజీపేట మ్యారేజ్ బ్యాండ్',
    Heroine: 'Shivani Nagaram'
  },
  'agent-narasimha117-2024': {
    TitleEn: 'Agent Narasimha‐117',
    TitleTe: 'ఏజెంట్ నరసింహ 117'
  },
  'sit-special-investigation-team-2024': {
    TitleEn: 'S.I.T Special Investigation Team',
    TitleTe: 'ఎస్.ఐ.టి స్పెషల్ ఇన్వెస్టిగేషన్ టీం'
  },
  'tillu-2024': {
    TitleTe: 'టిల్లు స్క్వేర్'
  },
  'lifestories-2024': {
    TitleEn: 'LifeStories',
    TitleTe: 'లైఫ్‌స్టోరీస్'
  },
  'omg-o-manchi-ghost-2024': {
    TitleTe: 'ఓ మంచి ఘోస్ట్',
    Heroine: 'Nandita Swetha'
  },
  'aham-reboot-2024': {
    TitleEn: 'Aham Reboot',
    TitleTe: 'అహం రీబూట్'
  },
  'srikakulam-sherlockholmes-2024': {
    TitleEn: 'Srikakulam Sherlockholmes',
    TitleTe: 'శ్రీకాకుళం షెర్లాక్‌హోమ్స్'
  },
  'parakramam-2024': {
    TitleEn: 'Parakramam',
    TitleTe: 'పరాక్రమం'
  },
  'pailam-pilaga-2024': {
    TitleEn: 'Pailam Pilaga',
    TitleTe: 'పైలం పిలగ'
  },
  'bhaje-vaayu-vegam-2024': {
    TitleTe: 'భజే వాయు వేగం',
    Heroine: 'Iswarya Menon'
  },
  'sandeham-2024': {
    TitleEn: 'Sandeham',
    TitleTe: 'సందేహం'
  },
  'krishnamma-2024': {
    TitleEn: 'Krishnamma',
    TitleTe: 'కృష్ణమ్మ'
  },
  'mathu-vadalara-2-2024': {
    TitleTe: 'మత్తు వదలరా 2'
  },
  'alanaati-ramchandrudu-2024': {
    TitleEn: 'Alanaati Ramchandrudu',
    TitleTe: 'ఆలనాటి రామచంద్రుడు'
  },
  'palik-2024': {
    TitleEn: 'Palik',
    TitleTe: 'పాలిక్'
  },
  'vidya-vasula-aham-2024': {
    TitleEn: 'Vidya Vasula Aham',
    TitleTe: 'విద్య వసుల అహం'
  },
  'double-ismart-2024': {
    TitleEn: 'Double iSmart',
    TitleTe: 'డబుల్ ఇస్మార్ట్'
  },
  'indrani-epic1-dharam-vs-karam-2024': {
    TitleEn: 'Indrani - Epic1: Dharam vs Karam',
    TitleTe: 'ఇంద్రాణి - ఎపిక్ 1: ధరం వర్సెస్ కర్మ'
  },
  'kalki-2898-ad-2024': {
    TitleTe: 'కల్కి 2898-AD'
  },
  'sriranga-neethulu-2024': {
    TitleEn: 'Sriranga Neethulu',
    TitleTe: 'శ్రీరంగ నీతులు'
  },
  'dheera-2024': {
    TitleEn: 'Dheera',
    TitleTe: 'ధీర'
  },
  'aay-2024': {
    TitleEn: 'Aay',
    TitleTe: 'ఆయ్'
  },
  'alanaati-ramachandrudu-2024': {
    TitleEn: 'Alanaati Ramachandrudu',
    TitleTe: 'ఆలనాటి రామచంద్రుడు'
  },
  'music-shop-murthy-2024': {
    TitleEn: 'Music Shop Murthy',
    TitleTe: 'మ్యూజిక్ షాప్ మూర్తి'
  },
  'srikakulam-sherlock-holmes-2024': {
    TitleEn: 'Srikakulam Sherlock Holmes',
    TitleTe: 'శ్రీకాకుళం షెర్లాక్ హోమ్స్'
  },
  'dhoom-dhaam-2024': {
    TitleEn: 'Dhoom Dhaam',
    TitleTe: 'ధూం ధాం'
  },
  'yevam-2024': {
    TitleEn: 'Yevam',
    TitleTe: 'ఏవం',
    Hero: 'Vasishta N. Simha',
    Heroine: 'Chandini Chowdary'
  },
  'raju-gari-ammayi-naidu-gari-abbayi-2024': {
    TitleEn: 'Raju Gari Ammayi Naidu Gari Abbayi',
    TitleTe: 'రాజు గారి అమ్మాయి నాయుడు గారి అబ్బాయి'
  },
  'ramnagar-bunny-2024': {
    TitleEn: 'Ramnagar Bunny',
    TitleTe: 'రామ్‌నగర్ బన్నీ'
  },
  'razakar-the-silent-genocide-of-hyderabad-2024': {
    TitleTe: 'రజాకార్',
    Hero: 'Bobby Simha'
  },
  'janaka-aithe-ganaka-2024': {
    TitleEn: 'Janaka Aithe Ganaka',
    TitleTe: 'జనక ఐతే గానక'
  },
  'viraaji-2024': {
    TitleEn: 'Viraaji',
    TitleTe: 'విరాజి'
  },
  'akkada-varu-ikkada-unnaru-2024': {
    TitleEn: 'Akkada Varu Ikkada Unnaru',
    TitleTe: 'అక్కడ వారు ఇక్కడ ఉన్నారు'
  },
  'ground-2024': {
    TitleEn: 'Ground',
    TitleTe: 'గ్రౌండ్'
  },
  'simbaa-2024': {
    TitleTe: 'సింబా'
  },
  'tiragabadara-saami-2024': {
    TitleTe: 'తిరగబడరా సామీ'
  },
  'nindha-2024': {
    TitleTe: 'నింద',
    Heroine: 'Annie'
  },
  'eesaraina-2024': {
    TitleTe: 'ఈసారైనా!?'
  },
  'purushothamudu-2024': {
    TitleTe: 'పురుషోత్తముడు'
  },
  'market-mahalakshmi-2024': {
    TitleTe: 'మార్కెట్ మహాలక్ష్మి'
  },
  'yatra-2-2024': {
    TitleTe: 'యాత్ర 2'
  },
  'usha-parinayam-2024': {
    TitleTe: 'ఉషా పరిణయం',
    Hero: 'Sree Kamal',
    Heroine: 'Tanvi Negi'
  },
  'raajadhani-files-2024': {
    TitleTe: 'రాజధాని ఫైల్స్',
    Heroine: 'Veena'
  },
  'mechanic-rocky-2024': {
    TitleTe: 'మెకానిక్ రాకీ'
  },
  'geethanjali-malli-vachindi-2024': {
    TitleTe: 'గీతాంజలి మళ్ళీ వచ్చింది'
  },
  'sundaram-master-2024': {
    TitleTe: 'సుందరం మాస్టర్'
  },
  'mercy-killing-2024': {
    TitleTe: 'మెర్సీ కిల్లింగ్'
  },
  'pekamedalu-2024': {
    TitleTe: 'పేకమేడలు'
  },
  'chaari-111-2024': {
    TitleTe: 'చారి 111',
    Heroine: 'Samyuktha Viswanathan'
  },
  'pranaya-godari-2024': {
    TitleTe: 'ప్రణయ గోదారి'
  },
  'love-me-if-you-dare-2024': {
    TitleTe: 'లవ్ మీ'
  },
  'crime-reel-2024': {
    TitleTe: 'క్రైమ్ రీల్'
  },
  'happy-ending-2024': {
    TitleTe: 'హ్యాపీ ఎండింగ్',
    Hero: 'Yash Puri'
  },
  'tantra-2024': {
    TitleTe: 'తంత్ర'
  },
  'gaami-2024': {
    TitleTe: 'గామి',
    Heroine: 'Chandini Chowdary'
  },
  'sikandar-ka-muqaddar-2024': {
    TitleTe: 'సికందర్ కా ముకద్దర్'
  },
  'modern-masters-ss-rajamouli-2024': {
    TitleTe: 'మోడ్రన్ మాస్టర్స్: ఎస్.ఎస్. రాజమౌళి',
    Heroine: 'Documentary'
  },
  'siddharth-roy-2024': {
    TitleTe: 'సిద్ధార్థ్ రాయ్',
    Hero: 'Deepak Saroj'
  },
  'bhale-unnade-2024': {
    TitleTe: 'భలే ఉన్నాడే',
    Director: 'J. Sivasai Vardhan'
  },
  'devaki-nandana-vasudeva-2024': {
    TitleTe: 'దేవకీ నందన వాసుదేవ'
  },
  'sabari-2024': {
    TitleTe: 'శబరి',
    Hero: 'No Hero Lead',
    Heroine: 'Varalaxmi Sarathkumar'
  },
  'maya-puthagam-2024': {
    TitleTe: 'మాయ పుస్తకం'
  },
  'bootcut-balaraju-2024': {
    TitleTe: 'బూట్‌కట్ బాలరాజు',
    Hero: 'Sohel',
    Heroine: 'Meghalekha'
  },
  'aarambham-2024': {
    TitleTe: 'ఆరంభం',
    Heroine: 'Supritha Sathyanarayan'
  },
  'mukhya-gamanika-2024': {
    TitleTe: 'ముఖ్య గమనిక',
    Hero: 'Vishwak Sen'
  },
  'ooru-peru-bhairavakona-2024': {
    TitleTe: 'ఊరు పేరు భైరవకోన'
  },
  'fear-2024': {
    TitleTe: 'ఫియర్',
    Hero: 'Vedhika',
    Heroine: 'Arvind Krishna'
  },
  'inti-number-13-2024': {
    TitleTe: 'ఇంటి నంబర్ - 13',
    Hero: 'Naveed',
    Heroine: 'Shivangi Sharma'
  },
  'i-hate-you-2024': {
    TitleTe: 'ఐ హేట్ యూ'
  },
  'pottel-2024': {
    TitleTe: 'పొట్టేల్',
    Hero: 'Yuva Chandraa'
  },
  '35-chinna-katha-kaadu-2024': {
    TitleTe: '35 - చిన్న కథ కాదు',
    Hero: 'Vishwadev'
  },
  'nayanthara-beyond-the-fairy-tale-2024': {
    TitleTe: 'నయనతార: బియాండ్ ది ఫెయిరీ టేల్'
  },
  'sathamindri-mutham-tha-2024': {
    TitleEn: 'Sathamindri Mutham Tha',
    TitleTe: 'సతమింద్రి ముత్తం తా'
  },
  'raju-yadav-2024': {
    TitleTe: 'రాజు యాదవ్'
  },
  'gorre-puranam-2024': {
    TitleTe: 'గొర్రె పురాణం'
  },
  'make-a-wish-2024': {
    TitleEn: 'Make a Wish',
    TitleTe: 'మేక్ ఎ విష్'
  },
  'operation-valentine-2024': {
    TitleTe: 'ఆపరేషన్ వాలెంటైన్',
    Director: 'Shakti Pratap Singh'
  },
  'shivam-bhaje-2024': {
    TitleTe: 'శివం భజే'
  },
  'vey-dharuvey-2024': {
    TitleTe: 'వేయ్ దారువేయ్',
    Heroine: 'Yasha Shivakumar'
  },
  'thalakona-2024': {
    TitleTe: 'తలకోన'
  },
  'drill-2024': {
    TitleEn: 'Drill',
    TitleTe: 'డ్రిల్'
  },
  'bhamakalapam-2-2024': {
    TitleTe: 'భామాకలాపం 2',
    Heroine: 'Sharanya Pradeep'
  },
  'average-student-nani-2024': {
    TitleTe: 'యావరేజ్ స్టూడెంట్ నాని',
    Hero: 'Pawan Kumar',
    Heroine: 'Sneha Malviya',
    Director: 'Pawan Kumar Kothuri'
  },
  'rakshana-2024': {
    TitleTe: 'రక్షణ',
    Hero: 'No Hero Lead',
    Heroine: 'Payal Rajput'
  },
  'uruku-patela-2024': {
    TitleTe: 'ఉరుకు పటేల'
  },
  'mix-up-2024': {
    TitleTe: 'మిక్స్ అప్',
    Hero: 'Adarsh Balakrishna'
  },
  'gangs-of-godavari-2024': {
    TitleTe: 'గ్యాంగ్స్ ఆఫ్ గోదావరి'
  },
  'gam-gam-ganesha-2024': {
    TitleTe: 'గమ్ గమ్ గణేశ'
  },
  'committee-kurrollu-2024': {
    TitleTe: 'కమిటీ కుర్రోళ్లు',
    Heroine: 'Raadhya'
  },
  'prathinidhi-2-2024': {
    TitleTe: 'ప్రతినిధి 2',
    Heroine: 'Siri Lella'
  },
  '105-minuttess-2024': {
    TitleTe: '105 మినిట్స్',
    Hero: 'Single Character'
  },
  'bharathanatyam-2024': {
    TitleTe: 'భరతనాట్యం',
    Hero: 'Surya Teja',
    Heroine: 'Meenakshi Goswami'
  },
  'pushpa-2-the-rule-2024': {
    TitleTe: 'పుష్ప 2 - ది రూల్'
  },
  'viswam-2024': {
    TitleTe: 'విశ్వం'
  },
  'narudi-brathuku-natana-2024': {
    TitleTe: 'నరుడి బ్రతుకు నటన',
    Heroine: 'Shruti Jayan'
  },
  'sarkaaru-noukari-2024': {
    TitleTe: 'సర్కారు నౌకరి',
    Heroine: 'Bhavana Vazhapandal'
  },
  'the-family-star-2024': {
    TitleTe: 'ది ఫ్యామిలీ స్టార్'
  },
  'naa-saami-ranga-2024': {
    TitleTe: 'నా సామి రంగ',
    Hero: 'Nagarjuna Akkineni'
  },
  'bachhala-malli-2024': {
    TitleTe: 'బచ్చల మల్లి'
  },
  'a-goa-tripp-2024': {
    TitleEn: 'A Goa Tripp...',
    TitleTe: 'ఎ గోవా ట్రిప్...'
  },
  'rrr-behind-and-beyond-2024': {
    TitleTe: 'ఆర్.ఆర్.ఆర్: బిహైండ్ & బియాండ్',
    Hero: 'Documentary',
    Heroine: 'Documentary'
  },
  'zebra-2024': {
    TitleTe: 'జీబ్రా',
    Heroine: 'Priya Bhavani Shankar'
  },
  'double-engine-2024': {
    TitleTe: 'డబుల్ ఇంజిన్',
    Hero: 'Myron Mohit',
    Heroine: 'Ritika Singh',
    Director: 'Rohit & Sasi'
  },
  'harom-hara-2024': {
    TitleTe: 'హరోం హర',
    Heroine: 'Malvika Sharma'
  },
  'sam-anton-2024': {
    TitleEn: 'Sam Anton',
    TitleTe: 'సామ్ ఆంటన్'
  },
  'ruslaan-2024': {
    TitleEn: 'Ruslaan',
    TitleTe: 'రుస్లాన్'
  },
  'aa-okkati-adakku-2024': {
    TitleTe: 'ఆ ఒక్కటీ అడక్కు'
  },
  'anandapuram-diaries-2024': {
    TitleTe: 'ఆనందపురం డైరీస్'
  },
  'vedaa-2024': {
    TitleEn: 'Vedaa',
    TitleTe: 'వేదా'
  },
  'kangaroo-2024': {
    TitleEn: 'Kangaroo',
    TitleTe: 'కంగారూ'
  },
  'leela-vinodam-2024': {
    TitleEn: 'Leela Vinodam',
    TitleTe: 'లీలా వినోదం'
  },
  'laggam-2024': {
    TitleTe: 'లగ్గం'
  },
  'utsavam-2024': {
    TitleTe: 'ఉత్సవం',
    Hero: 'Dilip Prakash'
  },
  'sheeshmahal-2024': {
    TitleEn: 'Sheeshmahal',
    TitleTe: 'షీష్‌మహల్'
  },
  'brahmavaram-ps-paridilo-2024': {
    TitleTe: 'బ్రహ్మవరం పి.ఎస్ పరిధిలో',
    Hero: 'Sravanthi',
    Heroine: 'No Hero Lead'
  },
  'operation-laila-2024': {
    TitleEn: 'Operation Laila',
    TitleTe: 'ఆపరేషన్ లైలా'
  },
  'rush-2024': {
    TitleEn: 'Rush',
    TitleTe: 'రష్'
  },
  'parijatha-parvam-2024': {
    TitleTe: 'పారిజాత పర్వం',
    Hero: 'Chaitanya Rao'
  },
  'prasanna-vadanam-2024': {
    TitleTe: 'ప్రసన్న వదనం',
    Heroine: 'Payal Radhakrishna'
  },
  'leela-vinodham-2024': {
    TitleEn: 'Leela Vinodham',
    TitleTe: 'లీలా వినోదం'
  },
  'kalinga-2024': {
    TitleTe: 'కళింగ',
    Hero: 'Dhruva Vaayu',
    Heroine: 'Pragya Nayan',
    Director: 'Dhruva Vaayu'
  },
  'mr-bachchan-2024': {
    TitleTe: 'మిస్టర్ బచ్చన్'
  },
  'kismat-2024': {
    TitleTe: 'కిస్మత్'
  },
  'drinker-sai-2024': {
    TitleTe: 'డ్రింకర్ సాయి',
    Hero: 'Dharma Mahesh'
  },
  '100-crores-2024': {
    TitleEn: '100 Crores',
    TitleTe: '100 కోట్లు'
  },
  'akshara-2024': {
    TitleEn: 'Akshara',
    TitleTe: 'అక్షర'
  },
  'my-dear-donga-2024': {
    TitleTe: 'మై డియర్ దొంగ',
    Heroine: 'Shalini Kondepudi'
  },
  'tom-and-jerry-2024': {
    TitleEn: 'Tom And Jerry',
    TitleTe: 'టామ్ అండ్ జెర్రీ'
  },
  'masthu-shades-unnai-ra-2024': {
    TitleTe: 'మస్తు షేడ్స్ ఉన్నాయ్ రా'
  },
  'maruthi-nagar-subramanyam-2024': {
    TitleTe: 'మారుతి నగర్ సుబ్రహ్మణ్యం'
  },
  'bench-life-2024': {
    TitleTe: 'బెంచ్ లైఫ్',
    Hero: 'Vaibhav Reddy'
  },
  '1980-lo-radhekrishna-2024': {
    TitleEn: '1980 Lo Radhekrishna',
    TitleTe: '1980 లో రాధాకృష్ణ'
  },
  'love-mouli-2024': {
    TitleTe: 'లవ్ మౌళి',
    Heroine: 'Chandini Chowdary'
  },
  'we-love-bad-boys-2024': {
    TitleEn: 'We Love Bad Boys',
    TitleTe: 'వీ లవ్ బ్యాడ్ బాయ్స్'
  },
  'brahmmavaram-p-s-paridhilo-2024': {
    TitleTe: 'బ్రహ్మవరం పి.ఎస్ పరిధిలో',
    Hero: 'Surya Srinivas',
    Heroine: 'Sravanthi Bellamkonda'
  },
  'buddy-2024': {
    TitleTe: 'బడ్డీ'
  },
  'theppa-samudram-2024': {
    TitleTe: 'తెప్ప సముద్రం',
    Hero: 'Arjun Ambati'
  },
  'bhoothaddam-bhaskar-narayana-2024': {
    TitleTe: 'భూతద్దం భాస్కర్ నారాయణ',
    Heroine: 'Rashi Singh'
  },
  'satyabhama-2024': {
    TitleTe: 'సత్యభామ'
  },
  'anthima-theerpu-2024': {
    TitleTe: 'అంతిమ తీర్పు'
  },
  'prasannavadanam-2024': {
    TitleTe: 'ప్రసన్న వదనం',
    Heroine: 'Payal Radhakrishna',
    Director: 'Arjun Y. K.'
  },
  'hanu-man-2024': {
    TitleTe: 'హను-మాన్'
  },
  'bhavanam-2024': {
    TitleTe: 'భవనం',
    Hero: 'Saptagiri'
  },
  'manamey-2024': {
    TitleTe: 'మనమే'
  },
  'operation-raavan-2024': {
    TitleTe: 'ఆపరేషన్ రావణ్'
  },
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

async function applyCorrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         APPLYING BATCH 04 CORRECTIONS                                ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  // Read main CSV
  const mainContent = readFileSync(MAIN_CSV, 'utf-8');
  const mainRecords = parseCSV(mainContent);
  
  const movieMap = new Map<string, MovieRow>();
  mainRecords.forEach(movie => movieMap.set(movie.Slug, movie));

  console.log(chalk.green(`✓ Loaded ${mainRecords.length} movies from main CSV\n`));

  let updatedCount = 0;
  const updateLog: string[] = [];

  // Apply corrections
  for (const [slug, correction] of Object.entries(corrections)) {
    const movie = movieMap.get(slug);
    if (movie) {
      let hasChanges = false;
      const changes: string[] = [];

      if (correction.TitleEn && correction.TitleEn !== movie.TitleEn) {
        changes.push(`EN: "${movie.TitleEn}" → "${correction.TitleEn}"`);
        movie.TitleEn = correction.TitleEn;
        hasChanges = true;
      }

      if (correction.TitleTe && correction.TitleTe !== movie.TitleTe) {
        changes.push(`TE: "${movie.TitleTe || 'EMPTY'}" → "${correction.TitleTe}"`);
        movie.TitleTe = correction.TitleTe;
        hasChanges = true;
      }

      if (correction.ReleaseYear && correction.ReleaseYear !== movie.ReleaseYear) {
        changes.push(`Year: ${movie.ReleaseYear} → ${correction.ReleaseYear}`);
        movie.ReleaseYear = correction.ReleaseYear;
        hasChanges = true;
      }

      if (correction.Hero && correction.Hero !== movie.Hero) {
        changes.push(`Hero: "${movie.Hero}" → "${correction.Hero}"`);
        movie.Hero = correction.Hero;
        hasChanges = true;
      }

      if (correction.Heroine && correction.Heroine !== movie.Heroine) {
        changes.push(`Heroine: "${movie.Heroine}" → "${correction.Heroine}"`);
        movie.Heroine = correction.Heroine;
        hasChanges = true;
      }

      if (correction.Director && correction.Director !== movie.Director) {
        changes.push(`Director: "${movie.Director}" → "${correction.Director}"`);
        movie.Director = correction.Director;
        hasChanges = true;
      }

      if (hasChanges) {
        updatedCount++;
        console.log(chalk.cyan(`✓ ${movie.TitleEn} (${slug})`));
        changes.forEach(change => console.log(chalk.gray(`  ${change}`)));
        updateLog.push(`${movie.TitleEn}: ${changes.join(', ')}`);
      }
    }
  }

  // Write updated CSV
  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch04-corrections.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  // Statistics
  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                            SUMMARY                                      '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Movies updated: ${updatedCount}`));
  console.log(chalk.green(`✅ Telugu titles filled: ${filled}/${total} (${percentage}%)`));
  console.log(chalk.yellow(`⏳ Still pending: ${total - filled}\n`));

  console.log(chalk.cyan(`📁 Backup saved: ${backupFile}`));
  console.log(chalk.green(`📁 Updated CSV: ${MAIN_CSV}\n`));

  // Progress bar
  const barLength = 50;
  const filledBars = Math.round((percentage / 100) * barLength);
  const emptyBars = barLength - filledBars;
  
  console.log(chalk.cyan('Overall Progress:'));
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(emptyBars)) + ` ${percentage}%\n`);

  console.log(chalk.green('✅ All corrections applied successfully!\n'));
}

applyCorrections().catch(console.error);
