#!/usr/bin/env npx tsx
/**
 * Import manually reviewed music director fixes
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parsed from user's review
const FIXES = [
  // First batch with full data
  { id: 'bb4d0170', slug: 'as-time-echoes', year: 2026, hero: 'Akash Reddy Purma', heroine: null, music: 'Dhanush Dandu' },
  { id: '72f9afc4', slug: 'kalki-2898-ad-part-2', year: 2027, hero: 'Prabhas', heroine: 'Deepika Padukone', music: 'Santhosh Narayanan' },
  { id: '27c2e806', slug: 'mirai', year: 2025, hero: 'Teja Sajja', heroine: 'Ritika Nayak', music: 'Gowra Hari' },
  { id: '9c2982d1', slug: 'nagabandham', year: 2026, hero: 'Virat Karrna', heroine: 'Nabha Natesh', music: 'Abhe' },
  { id: '49842167', slug: 'nakshatra-poratam', year: 1993, hero: 'Suman Talwar', heroine: 'Aamani', music: 'Raj-Koti' },
  { id: 'a2d270c7', slug: 'natudu', year: 2014, hero: 'Navdeep', heroine: 'Kavya Shetty', music: 'Jayasurya Bompem', director: 'NSR Prasad' },
  { id: 'd9c427f3', slug: '100-crores-2024', hero: 'Chetan Kumar', heroine: 'Sakshi Chaudhary', music: 'Sai Kartheek' },
  { id: '758edd4b', slug: '1980-lo-radhekrishna-2024', hero: 'SS Saidulu', heroine: 'Bramarambika Tutika', music: 'ML Raja' },
  { id: '398873f9', slug: 'drill-2024', hero: 'Haranath Policherla', heroine: 'Karunya Chowdary', music: 'DSSK' },
  { id: '98e550b0', slug: 'ruslaan-2024', hero: 'Aayush Sharma', heroine: 'Sushrii Mishra', music: 'Vishal Mishra' },
  { id: '92d305db', slug: 'matti-katha-2023', hero: 'Abhiram', heroine: 'Maya', music: 'Smaran' },
  
  // 2019 batch
  { slug: 'bilalpur-police-station-2019', heroine: 'Saanve Meghana' },
  { slug: 'ek-2019', heroine: 'Nicole Madell' },
  { slug: 'heza-2019', heroine: 'Mumaith Khan' },
  { slug: 'krishna-rao-supermarket-2019', heroine: 'Elsa Ghosh' },
  { slug: 'malli-malli-chusa-2019', heroine: 'Kairavi Thakkar' },
  { slug: 'nenu-aadhi-madyalo-maa-nanna-2019', heroine: 'Renuka' },
  { slug: 'prematho-cheppana-2019', heroine: 'Niharika Konidela' },
  { slug: 'thupaki-ramudu-2019', heroine: 'Priya' },
  { slug: 'yatra-2019', heroine: 'Suhasini Maniratnam' },
  
  // 2018 batch
  { slug: 'anthaku-minchi-2018', heroine: 'Rashmi Gautham' },
  { slug: 'anthervedam-2018', heroine: 'Santoshini' },
  { slug: 'ishtangaa-2018', heroine: 'Tanishq Rajan' },
  { slug: 'kinar-2018', heroine: 'Revathi' },
  { slug: 'masakkali-2018', heroine: 'Shravya' },
  { slug: 'moodu-puvulu-aaru-kayalu-2018', heroine: 'Nikita' },
  { slug: 'parichayam-2018', heroine: 'Simrat Kaur' },
  { slug: 'rachayitha-2018', heroine: 'Sanchita Padukone' },
  { slug: 'sarabha-2018', heroine: 'Mishti Chakraborty' },
  { slug: 'sharabha-2018', title: 'Sarabha', heroine: 'Mishti' },
  { slug: 'sivakasipuram-2018', heroine: 'Priyanka Sharma' },
  
  // 2017 batch
  { slug: 'anaganaga-oka-durga-2017', heroine: 'Kranthi Kumar' },
  { slug: 'e-ee-2017', heroine: 'Naira Shah' },
  { slug: 'jaya-b-2017', heroine: 'Oh Ye-seol' },
  { slug: 'mixture-potlam-2017', heroine: 'Shweta Basu Prasad' },
  { slug: 'muduvandala-muppai-nalugo-katha-2017', heroine: 'Priyanka Augustin' },
  { slug: 'nee-preme-naa-pranam-2017', heroine: 'Sireesha' },
  { slug: 'o-pilla-nee-valla-2017', heroine: 'Monika Singh' },
  { slug: 'shekaram-gari-abbayi-2017', heroine: 'Sai Akshatha' },
  { slug: 'vasham-2017', heroine: 'Swetaa Varma' },
  
  // 2016 batch
  { slug: 'aata-2016', heroine: 'Vandana Gupta' },
  { slug: 'charusheela-2016', heroine: 'Rashmi Gautham' },
  { slug: 'eluka-majaka-2016', heroine: 'Vasundhara' },
  { slug: 'jayammu-nischayammuu-raa-2016', heroine: 'Poorna' },
  { slug: 'karam-dosa-2016', heroine: 'Aditi Singh' },
  { slug: 'l7-2016', heroine: 'Pooja Jhaveri' },
  { slug: 'meeku-meere-maaku-meeme-2016', heroine: 'Avantika Mishra' },
  { slug: 'mister-420-2016', heroine: 'Priyanka Bharadwaja' },
  
  // 2015 batch
  { slug: '1st-iifa-utsavam-2015', heroine: 'Elaine Kao' },
  { slug: 'affair-2015', heroine: 'Dawn Zulueta' },
  { slug: 'best-actors-2015', heroine: 'Erica Fernandes' },
  { slug: 'cinema-chupista-maava-2015', heroine: 'Avika Gor' },
  { slug: 'intelligent-idiots-2015', heroine: 'Sanchita Shetty' },
  { slug: 'o-manasa-2015', heroine: 'Aparna Bajpai' },
  { slug: 'paddanandi-premalo-mari-2015', heroine: 'Vithika Sheru' },
  { slug: 'surya-vs-surya-2015', heroine: 'Tanikella Bharani' },
  { slug: 'yavvanam-oka-fantasy-2015', heroine: 'Shubra Aiyappa' },
  
  // 2014 batch
  { slug: 'choosinodiki-choosinanta-2014', heroine: 'Nagalakshmi' },
  { slug: 'paandavulu-paandavulu-thummeda-2014', heroine: 'Raveena Tandon' },
  { slug: 'vichakshana-2014', heroine: 'Swathi' },
  
  // 2013 batch  
  { slug: 'abbayi-class-ammayi-mass-2013', heroine: 'Hariprriya' },
  { slug: 'bunny-n-cherry-2013', heroine: 'Mahat Raghavendra' },
  { slug: 'kharjooram-2013', heroine: 'Nikitha' },
  { slug: 'man-of-the-match-2013', heroine: 'Mrudula Murali' },
  { slug: 'pavithra-2013', heroine: 'Bhavana' },
  { slug: 'well-if-you-know-me-2015', title: 'Shadow', year: 2013, hero: 'Venkatesh' },
  
  // 2012 batch
  { slug: 'akash-2012', heroine: 'Jyothi' },
  { slug: 'kraanthiveera-sangolli-raayanna-2012', title: 'Sangolli Rayanna', heroine: 'Jaya Prada' },
  { slug: 'sangolli-rayanna-2012', heroine: 'Jaya Prada' },
  { slug: 'kulu-manali-2012', heroine: 'Samiksha' },
  { slug: 'mithunam-2012', heroine: 'Lakshmi' },
  { slug: 'rasaleela-2012', heroine: 'Prathishta' },
  { slug: 'uu-kodathara-ulikki-padathara-2012', heroine: 'Deeksha Seth' },
  { slug: 'yamaho-yama-in-america-2012', title: 'Yamaho Yama', heroine: 'Parvati Melton' },
  
  // 2011 batch
  { slug: 'bhale-mogudu-bhale-pellam-2011', heroine: 'Suhasini' },
  { slug: 'kalabha-mazha-2011', heroine: 'Devika' },
  { slug: 'karalu-miriyalu-2011', heroine: 'Roja' },
  { slug: 'kodipunju-2011', heroine: 'Anchal' },
  { slug: 'lbw-life-before-wedding-2011', heroine: 'Chinmayi Ghatrazu' },
  { slug: 'lokame-kothaga-2011', heroine: 'Aditi Sharma' },
  { slug: 'madatha-kaaja-2011', heroine: 'Sneha Ullal' },
  { slug: 'marana-porali-2011', title: 'Poraali', heroine: 'Swati Reddy' },
  { slug: 'thimmaraju-2011', heroine: 'Bhanu Sri Mehra' },
  { slug: 'vara-prasad-potti-prasad-2011', heroine: 'Vijay Sai' },
  
  // 2010 batch
  { slug: 'anaganaga-oka-aranyam-2010', heroine: 'Sri Ramya' },
  { slug: 'aunty-uncle-nandagopal-2010', heroine: 'Meera Jasmine' },
  { slug: 'betting-bangaraju-2010', heroine: 'Nidhi Subbaiah' },
  { slug: 'bhairava-ips-2010', heroine: 'Mumaith Khan' },
  { slug: 'chalaki-2010', heroine: 'Roma' },
  { slug: 'em-pillo-em-pillado-2010', heroine: 'Pranitha' },
  { slug: 'kaluva-2010', heroine: 'Kajal Aggarwal' },
  { slug: 'kothi-mooka-2010', heroine: 'Shraddha Arya' },
  { slug: 'madhanudu-2010', heroine: 'Saloni' },
  { slug: 'my-name-is-amrutha-2010', heroine: 'Keerthi' },
  { slug: 'prema-rajyam-2010', heroine: 'Meerakrishna' },
  { slug: 'ramdev-2010', heroine: 'Gracy Singh' },
  { slug: 'ranga-the-donga-2010', heroine: 'Vimala Raman' },
  { slug: 'sandadi-2010', heroine: 'Ghazal Thakur' },
  { slug: 'the-desire-2010', heroine: 'Xia Yu' },
  { slug: 'udatha-udatha-ooch-2010', heroine: 'Akshay' },
];

// Additional slugs with music directors from the rest of the CSV
const MUSIC_UPDATES: Record<string, string> = {};

async function importFixes() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      IMPORTING MANUAL REVIEW FIXES                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  let updated = 0;
  let errors = 0;
  
  for (const fix of FIXES) {
    const updateData: Record<string, any> = {};
    
    if (fix.year) updateData.release_year = fix.year;
    if (fix.hero) updateData.hero = fix.hero;
    if (fix.heroine) updateData.heroine = fix.heroine;
    if (fix.heroine === null) updateData.heroine = 'No Female Lead';
    if (fix.music) updateData.music_director = fix.music;
    if (fix.title) updateData.title_en = fix.title;
    if ((fix as any).director) updateData.director = (fix as any).director;
    
    if (Object.keys(updateData).length === 0) continue;
    
    let query = supabase.from('movies').update(updateData);
    
    if (fix.id) {
      query = query.ilike('id', `${fix.id}%`);
    } else if (fix.slug) {
      query = query.eq('slug', fix.slug);
    }
    
    const { data, error } = await query.select('title_en');
    
    if (error) {
      console.log(`  ❌ Error updating ${fix.slug}: ${error.message}`);
      errors++;
    } else if (data && data.length > 0) {
      console.log(`  ✓ ${data[0].title_en}`);
      updated++;
    }
  }
  
  console.log(`\n✅ Updated: ${updated} movies`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);
}

importFixes().catch(console.error);
