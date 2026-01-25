#!/usr/bin/env npx tsx
/**
 * Apply learned pattern fixes from review
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Fix {
  id: string;
  slug: string;
  title: string;
  year: number;
  field: string;
  current_value: string;
  suggested_fix: string;
  reasoning: string;
}

const fixes: Fix[] = [
  // Music Director fixes (Raj-Koti split 1994)
  { id: 'de7c0f9e', slug: 'agni-pravesam-1990', title: 'Agni Pravesam', year: 1990, field: 'music_director', current_value: 'Koti', suggested_fix: 'Raj-Koti', reasoning: 'Duo was active until 1994' },
  { id: '32c231ed', slug: 'telugu-veera-levara-1995', title: 'Telugu Veera Levara', year: 1995, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Duo split in 1994; credit is solo' },
  { id: '2898c6f9', slug: 'ramasakkanodu-1999', title: 'Ramasakkanodu', year: 1999, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Duo split in 1994; credit is solo' },
  { id: '67d07825', slug: 'lakshyam-1993', title: 'Lakshyam', year: 1993, field: 'music_director', current_value: 'Koti', suggested_fix: 'Raj-Koti', reasoning: 'Duo was active until 1994' },
  { id: '0a870842', slug: 'maa-nannaki-pelli-1997', title: 'Maa Nannaki Pelli', year: 1997, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Duo split in 1994; credit is solo' },
  { id: '40da3bfd', slug: 'maa-aavida-meeda-ottu-mee-aavida-chala-manchidi-2001', title: 'Maa Aavida Meeda...', year: 2001, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Duo split in 1994; credit is solo' },
  { id: '2e7c4315', slug: 'premante-inte-2006', title: 'Premante Inte', year: 2006, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '095774f5', slug: 'preminchukunnam-pelliki-randi-2004', title: 'Preminchukunnam...', year: 2004, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '58ac2647', slug: 'nuvvu-naaku-nachav-2001', title: 'Nuvvu Naaku Nachav', year: 2001, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '16cca8d2', slug: 'mrugam-1996', title: 'Mrugam', year: 1996, field: 'music_director', current_value: 'Raj', suggested_fix: 'Raj', reasoning: 'Solo credit (post-1994 split)' },
  { id: '888e95bb', slug: 'chilakapachcha-kaapuram-1995', title: 'Chilakapachcha Kaapuram', year: 1995, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: 'd2c6057f', slug: 'alluda-majaka-1995', title: 'Alluda Majaka', year: 1995, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '3f7cf95c', slug: 'ketu-duplicatu-1995', title: 'Ketu Duplicatu', year: 1995, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '17643853', slug: 'kshetram-2011', title: 'Kshetram', year: 2011, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '9ea78b54', slug: 'nuvvante-naakishtam-2005', title: 'Nuvvante Naakishtam', year: 2005, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '2e56ecf8', slug: 'yamajathakudu-1999', title: 'Yamajathakudu', year: 1999, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '101da476', slug: 'varasudu-1993', title: 'Varasudu', year: 1993, field: 'music_director', current_value: 'Koti', suggested_fix: 'Raj-Koti', reasoning: 'Duo was active until 1994' },
  { id: '01970091', slug: 'chevilo-puvvu-1990', title: 'Chevilo Puvvu', year: 1990, field: 'music_director', current_value: 'Koti', suggested_fix: 'Raj-Koti', reasoning: 'Duo was active until 1994' },
  { id: 'e6160d04', slug: 'vijayam-2003', title: 'Vijayam', year: 2003, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: 'af4e9bbd', slug: 'kathi-kanta-rao-2010', title: 'Kathi Kanta Rao', year: 2010, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: 'ead4e6de', slug: 'buridi-2010', title: 'Buridi', year: 2010, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '1af3fa11', slug: 'blade-babji-2008', title: 'Blade Babji', year: 2008, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '2398d3d7', slug: 'hitler-1997', title: 'Hitler', year: 1997, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: 'c76df331', slug: 'pape-naa-pranam-1998', title: 'Pape Naa Pranam', year: 1998, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '40ba5b4b', slug: 'maga-rayudu-1994', title: 'Maga Rayudu', year: 1994, field: 'music_director', current_value: 'Koti', suggested_fix: 'Raj-Koti', reasoning: 'Duo was active until 1994' },
  { id: '6c79d86c', slug: 'seetharatnam-gari-abbayi-1992', title: 'Seetharatnam...', year: 1992, field: 'music_director', current_value: 'Koti', suggested_fix: 'Raj-Koti', reasoning: 'Duo was active until 1994' },
  { id: 'db98d8d1', slug: 'alibaba-aradajanu-dongalu-1993', title: 'Alibaba...', year: 1993, field: 'music_director', current_value: 'Koti', suggested_fix: 'Raj-Koti', reasoning: 'Duo was active until 1994' },
  { id: '744dff31', slug: 'sisindri-1995', title: 'Sisindri', year: 1995, field: 'music_director', current_value: 'Raj', suggested_fix: 'Raj', reasoning: 'Solo credit (post-1994 split)' },
  { id: '07faf829', slug: 'adavi-dora-1995', title: 'Adavi Dora', year: 1995, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '237de891', slug: 'raaj-2011', title: 'Raaj', year: 2011, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit; duo split in 1994' },
  { id: 'cfe70ee3', slug: 'chinni-chinni-aasa-1999', title: 'Chinni Chinni Aasa', year: 1999, field: 'music_director', current_value: 'Raj', suggested_fix: 'Raj', reasoning: 'Solo credit; duo split in 1994' },
  { id: 'a11f8bfe', slug: 'aayanaki-iddaru-1995', title: 'Aayanaki Iddaru', year: 1995, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '087fe5c9', slug: 'nuvve-kavali-2000', title: 'Nuvve Kavali', year: 2000, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: 'c8616f45', slug: 'rikshavodu-1995', title: 'Rikshavodu', year: 1995, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  { id: '1b158286', slug: 'veedekkadi-mogudandi-2001', title: 'Veedekkadi Mogudandi?', year: 2001, field: 'music_director', current_value: 'Koti', suggested_fix: 'Koti', reasoning: 'Solo credit (post-1994 split)' },
  
  // Individual composer fixes
  { id: '7ed9df73', slug: 'prema-ishq-kaadhal-2013', title: 'Prema ishq kaadhal', year: 2013, field: 'music_director', current_value: 'Shravan', suggested_fix: 'Shravan Bharadwaj', reasoning: 'Individual Telugu composer, not Nadeem-Shravan' },
  { id: '2fdb05b2', slug: 'meeku-meere-maaku-meeme-2016', title: 'Meeku Meere...', year: 2016, field: 'music_director', current_value: 'Shravan', suggested_fix: 'Shravan Bharadwaj', reasoning: 'Individual composer, not Nadeem-Shravan' },
  { id: 'c18de86d', slug: 'alias-janaki-2013', title: 'Alias Janaki', year: 2013, field: 'music_director', current_value: 'Shravan', suggested_fix: 'Shravan Bharadwaj', reasoning: 'Individual Telugu composer' },
  { id: '6dd488ad', slug: 'mantra-2007', title: 'Mantra', year: 2007, field: 'music_director', current_value: 'Anand', suggested_fix: 'Anand Mukherji', reasoning: 'Individual composer, not part of Anand-Milind' },
  { id: 'cd987ed4', slug: 'ishq-2012', title: 'Ishq', year: 2012, field: 'music_director', current_value: 'Shankar', suggested_fix: 'Anoop Rubens', reasoning: 'Corrected music director for this 2012 film' },
  
  // Shankar-Ganesh fixes (1970s/80s)
  { id: 'a06ab30a', slug: 'thaayillamal-naanillai-1979', title: 'Thaayillamal Naanillai', year: 1979, field: 'music_director', current_value: 'Shankar', suggested_fix: 'Shankar-Ganesh', reasoning: 'Correct duo for this era' },
  { id: '6bf02cce', slug: 'nenjile-thunivirunthal-1981', title: 'Nenjile Thunivirunthal', year: 1981, field: 'music_director', current_value: 'Shankar', suggested_fix: 'Shankar-Ganesh', reasoning: 'Correct duo for this era' },
  
  // Hero name standardization (Jr. NTR)
  { id: '25938c4e', slug: 'dammu-2012', title: 'Dammu', year: 2012, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized name variant' },
  { id: '84afea0d', slug: 'janatha-garage-2016', title: 'Janatha Garage', year: 2016, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized name variant' },
  { id: '4648b2bd', slug: 'yamadonga-2007', title: 'Yamadonga', year: 2007, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant' },
  { id: '2216e3ab', slug: 'jai-lava-kusa-2017', title: 'Jai Lava Kusa', year: 2017, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant' },
  { id: 'b562ca91', slug: 'devara-part-1-2024', title: 'Devara: Part 1', year: 2024, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant' },
  { id: '40814531', slug: 'samba-2004', title: 'Samba', year: 2004, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant' },
  { id: 'd0796878', slug: 'naa-alludu-2005', title: 'Naa Alludu', year: 2005, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant' },
  { id: '3729ab0b', slug: 'nannaku-prematho-2016', title: 'Nannaku Prematho...', year: 2016, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant' },
  { id: 'af618826', slug: 'rabhasa-2014', title: 'Rabhasa', year: 2014, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized name variant' },
  { id: 'c85c61b9', slug: 'adurs-2010', title: 'Adurs', year: 2010, field: 'hero', current_value: 'N. T. Rama Rao Jr', suggested_fix: 'Jr. NTR', reasoning: 'Standardized name variant' },
  { id: '9b7b604c', slug: 'devara-2-tba', title: 'Devara: Part 2', year: 2026, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant for 2026 release' },
  { id: '88b7c57b', slug: 'aravinda-sametha-veera-raghava-2018', title: 'Aravinda Sametha...', year: 2018, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant' },
  { id: 'fcf9a94e', slug: 'brindavanam-2010', title: 'Brindavanam', year: 2010, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant' },
  { id: 'bdd02173', slug: 'adhurs-2010', title: 'Adhurs', year: 2010, field: 'hero', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Jr. NTR', reasoning: 'Standardized variant' },
  { id: '27111d5e', slug: 'kantri-2008', title: 'Kantri', year: 2008, field: 'heroine', current_value: 'N. T. Rama Rao Jr.', suggested_fix: 'Hansika Motwani', reasoning: 'Corrected field error; Jr. NTR is the hero' },
  { id: '27111d5e', slug: 'kantri-2008', title: 'Kantri', year: 2008, field: 'hero', current_value: '', suggested_fix: 'Jr. NTR', reasoning: 'Move Jr. NTR from heroine to hero' },
  
  // Telugu titles
  { id: 'e2d3f4ec', slug: 'ilanjodigal-1982', title: 'Ilanjodigal', year: 1982, field: 'title_te', current_value: '', suggested_fix: 'ఇలన్జోడిగల్', reasoning: 'Added missing Telugu title' },
  { id: '25f82db4', slug: 'sange-muzhangu-1972', title: 'Sange Muzhangu', year: 1972, field: 'title_te', current_value: '', suggested_fix: 'సంగీ ముజంగు', reasoning: 'Added missing Telugu title' },
  { id: 'fbe0ee14', slug: 'andaru-dongale-1974', title: 'Andaru Dongale', year: 1974, field: 'title_te', current_value: '', suggested_fix: 'అందరూ దొంగలే', reasoning: 'Added missing Telugu title' },
  { id: 'b517ecd9', slug: 'bangaru-panjaram-1969', title: 'Bangaru Panjaram', year: 1969, field: 'title_te', current_value: '', suggested_fix: 'బంగారు పంజరం', reasoning: 'Added missing Telugu title' },
  { id: '37e0ce5f', slug: 'sharada-1973', title: 'Sharada', year: 1973, field: 'title_te', current_value: '', suggested_fix: 'శారద', reasoning: 'Added missing Telugu title' },
  { id: 'f9bba0dc', slug: 'kodama-simham-1990', title: 'Kodama Simham', year: 1990, field: 'title_te', current_value: '', suggested_fix: 'కొదమ సింహం', reasoning: 'Added missing Telugu title' },
  { id: 'af26d3a3', slug: 'raktha-tharpanam-1992', title: 'Raktha Tharpanam', year: 1992, field: 'title_te', current_value: '', suggested_fix: 'రక్త తర్పణం', reasoning: 'Added missing Telugu title' },
  { id: '6bf02cce', slug: 'nenjile-thunivirunthal-1981', title: 'Nenjile Thunivirunthal', year: 1981, field: 'title_te', current_value: '', suggested_fix: 'నెంజిలే తునివిరుంతల్', reasoning: 'Added missing Telugu title' },
  { id: 'a4c01cca', slug: 'tamizh-selvan-1996', title: 'Tamizh Selvan', year: 1996, field: 'title_te', current_value: '', suggested_fix: 'తమిళ్ సెల్వన్', reasoning: 'Added missing Telugu title' },
  { id: '79002c52', slug: 'thiruvilayadal-1965', title: 'Thiruvilayadal', year: 1965, field: 'title_te', current_value: '', suggested_fix: 'తిరువిళైయాడల్', reasoning: 'Added missing Telugu title' },
  { id: 'a4ff9a89', slug: 'vicky-daada-1989', title: 'Vicky Daada', year: 1989, field: 'title_te', current_value: '', suggested_fix: 'విక్కీ దాదా', reasoning: 'Added missing Telugu title' },
  { id: 'e0d66df8', slug: 'dasavatharam-1976', title: 'Dasavatharam', year: 1976, field: 'title_te', current_value: '', suggested_fix: 'దశావతారం', reasoning: 'Added missing Telugu title' },
  { id: '5ab42f8c', slug: 'babu-1971', title: 'Babu', year: 1971, field: 'title_te', current_value: '', suggested_fix: 'బాబు', reasoning: 'Added missing Telugu title' },
  { id: 'c14c944e', slug: 'mooga-manasulu-1964', title: 'Mooga Manasulu', year: 1964, field: 'title_te', current_value: '', suggested_fix: 'మూగ మనసులు', reasoning: 'Added missing Telugu title' },
  { id: '3a00d145', slug: 'kottai-mariamman-2002', title: 'Kottai Mariamman', year: 2002, field: 'title_te', current_value: '', suggested_fix: 'కోట్టై మరియమ్మన్', reasoning: 'Added missing Telugu title' },
  { id: 'aa3fb5d3', slug: 'sankeerthana-1987', title: 'Sankeerthana', year: 1987, field: 'title_te', current_value: '', suggested_fix: 'సంకీర్తన', reasoning: 'Added missing Telugu title' },
  { id: 'd7ea2bdc', slug: 'sita-swayamvar-1976', title: 'Sita Swayamvar', year: 1976, field: 'title_te', current_value: '', suggested_fix: 'సీతా స్వయంవర్', reasoning: 'Added missing Telugu title' },
  { id: '076745f1', slug: 'vallavanukku-vallavan-1965', title: 'Vallavanukku Vallavan', year: 1965, field: 'title_te', current_value: '', suggested_fix: 'వల్లవనుక్కు వల్లవన్', reasoning: 'Added missing Telugu title' },
  { id: '6121afa9', slug: 'netrikan-1981', title: 'Netrikan', year: 1981, field: 'title_te', current_value: '', suggested_fix: 'నెట్రికన్', reasoning: 'Added missing Telugu title' },
  { id: 'a2cb19a1', slug: 'geetanjali-1989', title: 'Geethanjali', year: 1989, field: 'title_te', current_value: '', suggested_fix: 'గీతాంజలి', reasoning: 'Added missing Telugu title' },
  { id: 'd40fc607', slug: 'saagara-sangamam-1983', title: 'Saagara Sangamam', year: 1983, field: 'title_te', current_value: '', suggested_fix: 'సాగర సంగమం', reasoning: 'Added missing Telugu title' },
  { id: '5303c9b2', slug: 'palletoori-monagadu-1983', title: 'Palletoori Monagadu', year: 1983, field: 'title_te', current_value: '', suggested_fix: 'పల్లెటూరి మొనగాడు', reasoning: 'Added missing Telugu title' },
  { id: '9e112fab', slug: 'sr-kalyanamandapam-2021', title: 'SR Kalyanamandapam', year: 2021, field: 'title_te', current_value: '', suggested_fix: 'ఎస్ ఆర్ కళ్యాణమండపం', reasoning: 'Added missing Telugu title' },
  { id: '794250d0', slug: 'pava-mannippu-1961', title: 'Pava Mannippu', year: 1961, field: 'title_te', current_value: '', suggested_fix: 'పావ మన్నిప్పు', reasoning: 'Added missing Telugu title' },
  { id: '340635c8', slug: 'jayammu-nischayammu-raa-2016', title: 'Jayammu Nischayammu Raa', year: 2016, field: 'title_te', current_value: '', suggested_fix: 'జయమ్ము నిశ్చయమ్మురా', reasoning: 'Added missing Telugu title' },
  
  // Documentaries - remove hero/heroine
  { id: '9364f5fd', slug: 'modern-masters-ss-rajamouli-2024', title: 'Modern Masters: SS Rajamouli', year: 2024, field: 'hero', current_value: 'S. S. Rajamouli', suggested_fix: '', reasoning: 'Documentaries should not list interviewees as Hero/Heroine' },
  { id: '9364f5fd', slug: 'modern-masters-ss-rajamouli-2024', title: 'Modern Masters: SS Rajamouli', year: 2024, field: 'heroine', current_value: 'James Cameron', suggested_fix: '', reasoning: 'Documentaries should not list interviewees as Hero/Heroine' },
  { id: 'c6aa0c78', slug: 'rrr-behind-and-beyond-2024', title: 'RRR: Behind & Beyond', year: 2024, field: 'hero', current_value: 'Ram Charan', suggested_fix: '', reasoning: 'Remove leads for documentary' },
  { id: '0c49a2f1', slug: 'nayanthara-beyond-the-fairy-tale-2024', title: 'Nayanthara: Beyond...', year: 2024, field: 'hero', current_value: 'Vignesh Shivan', suggested_fix: '', reasoning: 'Remove leads for documentary' },
  { id: '0c49a2f1', slug: 'nayanthara-beyond-the-fairy-tale-2024', title: 'Nayanthara: Beyond...', year: 2024, field: 'heroine', current_value: 'Nayanthara', suggested_fix: '', reasoning: 'Remove leads for documentary' },
];

async function applyFixes() {
  console.log(chalk.bold('\n🔧 APPLYING LEARNED PATTERN FIXES\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  let applied = 0;
  let notFound = 0;
  let errors = 0;
  let skipped = 0;
  
  for (const fix of fixes) {
    try {
      const { data, error: fetchError } = await supabase
        .from('movies')
        .select('id, slug, title_en, hero, heroine, music_director, title_te')
        .eq('slug', fix.slug)
        .single();
      
      if (fetchError || !data) {
        console.log(chalk.red(`❌ Not found: ${fix.slug}`));
        notFound++;
        continue;
      }
      
      const currentValue = (data as any)[fix.field];
      if (fix.field === 'hero' && fix.slug === 'kantri-2008' && fix.suggested_fix === 'Jr. NTR') {
        // Special handling for Kantri - move from heroine to hero
        const updatePayload: any = { hero: 'Jr. NTR', heroine: 'Hansika Motwani' };
        const { error: updateError } = await supabase
          .from('movies')
          .update(updatePayload)
          .eq('id', data.id);
        
        if (updateError) {
          console.log(chalk.red(`  ❌ Error: ${updateError.message}`));
          errors++;
        } else {
          console.log(chalk.green(`✅ ${fix.title}: Moved Jr. NTR to hero, set Hansika Motwani as heroine`));
          applied++;
        }
        continue;
      }
      
      if (currentValue === fix.suggested_fix || (fix.suggested_fix === '' && !currentValue)) {
        skipped++;
        continue;
      }
      
      console.log(chalk.yellow(`\n${fix.title} (${fix.year})`));
      console.log(`  Field: ${fix.field}`);
      console.log(`  ${chalk.red('BEFORE:')} "${currentValue || 'N/A'}"`);
      console.log(`  ${chalk.green('AFTER:')}  "${fix.suggested_fix || '(empty)'}"`);
      console.log(`  Reason: ${fix.reasoning}`);
      
      const updatePayload: any = {};
      if (fix.suggested_fix === '') {
        updatePayload[fix.field] = null;
      } else {
        updatePayload[fix.field] = fix.suggested_fix;
      }
      
      const { error: updateError } = await supabase
        .from('movies')
        .update(updatePayload)
        .eq('id', data.id);
      
      if (updateError) {
        console.log(chalk.red(`  ❌ Error: ${updateError.message}`));
        errors++;
      } else {
        console.log(chalk.green(`  ✅ Fixed`));
        applied++;
      }
    } catch (e: any) {
      console.log(chalk.red(`❌ Unexpected error for ${fix.slug}: ${e.message}`));
      errors++;
    }
  }
  
  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Applied: ${chalk.green(applied)}`);
  console.log(`  Skipped (already correct): ${chalk.yellow(skipped)}`);
  console.log(`  Not found: ${chalk.yellow(notFound)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log();
}

applyFixes().catch(console.error);
