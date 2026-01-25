#!/usr/bin/env npx tsx
/**
 * Apply FAST-AUDIT fixes based on user review
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
  slug: string;
  type: 'duplicate_cast' | 'gender_swap' | 'supporting_to_lead' | 'missing_lead' | 'slug' | 'music_director' | 'documentary' | 'name_format';
  hero?: string;
  heroine?: string;
  removeFromSupporting?: string[];
  newSlug?: string;
  musicDirector?: string;
  removeHero?: boolean;
  removeHeroine?: boolean;
  nameFormat?: string;
}

const fixes: Fix[] = [
  // DUPLICATE CAST FIXES
  { slug: 'kaboye-alludu-1987', type: 'duplicate_cast', hero: 'Rajendra Prasad', heroine: 'Shanthi Priya' },
  { slug: 'sabadham-1971', type: 'duplicate_cast', hero: 'Ravichandran', heroine: 'K R Vijaya' },
  { slug: 'ladies-special-1993', type: 'duplicate_cast', hero: 'Suresh', heroine: 'Vani Viswanath' },
  { slug: 'the-desire-2010', type: 'duplicate_cast', hero: 'Xia Yu', heroine: 'Shilpa Shetty' },
  { slug: 'punnami-nagu-2009', type: 'duplicate_cast', hero: 'Rajiv Kanakala', heroine: 'Mumaith Khan' },
  { slug: 'o-amma-katha-1981', type: 'duplicate_cast', hero: 'Murali Mohan', heroine: 'Sharada' },
  { slug: 'agni-pareeksha-1970', type: 'duplicate_cast', hero: 'N. T. Rama Rao', heroine: 'Anjali Devi' },
  { slug: 'devullu-2000', type: 'duplicate_cast', hero: 'Pruthvi', heroine: 'Nitya Shetty' },
  { slug: 'nagadevathe-2000', type: 'duplicate_cast', hero: 'Sai Kumar', heroine: 'Prema' },
  { slug: 'anarkali-1955', type: 'duplicate_cast', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi' },
  { slug: 'dongata-2015', type: 'duplicate_cast', hero: 'Adivi Sesh', heroine: 'Lakshmi Manchu' },
  { slug: 'amma-durgamma-1996', type: 'duplicate_cast', hero: 'Shashikumar', heroine: 'Ooha' },
  { slug: 'buridi-2010', type: 'duplicate_cast', hero: 'Aryan Rajesh', heroine: 'Aishwarya Bhaskar' },
  { slug: 'souten-ki-beti-1989', type: 'duplicate_cast', hero: 'Jeetendra', heroine: 'Rekha' },
  { slug: 'sita-on-the-road-2021', type: 'duplicate_cast', hero: 'Khayyum', heroine: 'Kalpika Ganesh' },
  { slug: 'jatha-kalise-2015', type: 'duplicate_cast', hero: 'Ashwin Babu', heroine: 'Tejaswi Madivada' },
  { slug: 'prema-yuddham-1990', type: 'duplicate_cast', hero: 'Nagarjuna', heroine: 'Amala Akkineni' },
  { slug: 'vishwamitra-2019', type: 'duplicate_cast', hero: 'Satyam Rajesh', heroine: 'Nandita Raj' },
  { slug: 'welcome-obama-2013', type: 'duplicate_cast', hero: 'Ananth Sriram', heroine: 'Urmilla Kothare' },
  { slug: 'avunu-2012', type: 'duplicate_cast', hero: 'Harshvardhan Rane', heroine: 'Poorna' },
  { slug: 'mr-medhavi-2008', type: 'duplicate_cast', hero: 'Raja', heroine: 'Genelia D\'Souza' },
  { slug: 'lanka-2017', type: 'duplicate_cast', hero: 'Saikumar', heroine: 'Raai Laxmi' },
  { slug: 'indian-beauty-2006', type: 'duplicate_cast', hero: 'Collin Mcgee', heroine: 'Mellisa' },
  { slug: 'jeevana-ganga-1988', type: 'duplicate_cast', hero: 'Rajendra Prasad', heroine: 'Aneeta' },
  { slug: 'rendilla-poojari-1993', type: 'duplicate_cast', hero: 'Naresh', heroine: 'Shobana' },
  { slug: 'subhalagnam-1994', type: 'duplicate_cast', hero: 'Jagapathi Babu', heroine: 'Aamani' },
  { slug: 'dirty-hari-2020', type: 'duplicate_cast', hero: 'Shravan Reddy', heroine: 'Ruhani Sharma' },
  { slug: 'jhansi-rani-1988', type: 'duplicate_cast', hero: 'Rajendra Prasad', heroine: 'Vijayashanti' },
  { slug: 'rajasthan-1999', type: 'duplicate_cast', hero: 'Sarathkumar', heroine: 'Vijayashanti' },
  { slug: 'kallukondoru-pennu-1998', type: 'duplicate_cast', hero: 'Rahman', heroine: 'Vijayashanti' },
  { slug: 'osey-ramulamma-1997', type: 'duplicate_cast', hero: 'Dasari Narayana Rao', heroine: 'Vijayashanti' },
  { slug: 'ips-jhansi-2004', type: 'duplicate_cast', hero: 'Suman', heroine: 'Vijayashanti' },
  { slug: 'pratighatana-1985', type: 'duplicate_cast', hero: 'Suman', heroine: 'Vijayashanti' },
  { slug: 'karthavyam-1991', type: 'duplicate_cast', hero: 'Suman', heroine: 'Vijayashanti' },
  { slug: 'chandirani-1953', type: 'duplicate_cast', hero: 'N. T. Rama Rao', heroine: 'Bhanumathi' },
  { slug: 'preminchu-2001', type: 'duplicate_cast', hero: 'Suman', heroine: 'Laya' },
  { slug: 'rowdy-rangamma-1978', type: 'duplicate_cast', hero: 'Krishna', heroine: 'Vijaya Lalitha' },
  { slug: 'mithunam-2012', type: 'duplicate_cast', hero: 'Srinivasa Rao', heroine: 'Lakshmi' },
  { slug: 'kokilam-1990', type: 'duplicate_cast', hero: 'Suresh', heroine: 'Shobana' },
  { slug: 'natyam-2021', type: 'duplicate_cast', hero: 'Sai Tej', heroine: 'Sandhya Raju' },
  { slug: 'neethone-vuntanu-2002', type: 'duplicate_cast', hero: 'Suman', heroine: 'Rachana Banerjee' },
  { slug: 'stri-1995', type: 'duplicate_cast', hero: 'Suman', heroine: 'Rohini' },
  { slug: 'aunty-1995', type: 'duplicate_cast', hero: 'Suman', heroine: 'Jayasudha' },
  { slug: 'chandamama-kathalu-2014', type: 'duplicate_cast', hero: 'Suman', heroine: 'Lakshmi Manchu' },
  { slug: 'vijayadasami-2007', type: 'duplicate_cast', hero: 'Nandamuri Kalyan Ram', heroine: 'Sneha' },
  { slug: 'vanaja-2006', type: 'duplicate_cast', hero: 'Rajesh', heroine: 'Mamatha Bhukya' },
  { slug: 'pournami-2006', type: 'duplicate_cast', hero: 'Prabhas', heroine: 'Trisha Krishnan' },
  { slug: 'missamma-2003', type: 'duplicate_cast', hero: 'Suman', heroine: 'Bhumika Chawla' },
  { slug: 'katha-2009', type: 'duplicate_cast', hero: 'Suman', heroine: 'Genelia D\'Souza' },
  { slug: 'amaravathi-2009', type: 'duplicate_cast', hero: 'Suman', heroine: 'Bhumika Chawla' },
  { slug: 'anasuya-2007', type: 'duplicate_cast', hero: 'Suman', heroine: 'Bhumika Chawla' },
  { slug: 'devadasu-malli-puttadu-1978', type: 'duplicate_cast', hero: 'Suman', heroine: 'Vanisri' },
  { slug: 'mantra-2007', type: 'duplicate_cast', hero: 'Suman', heroine: 'Charmy Kaur' },
  { slug: 'maisamma-ips-2007', type: 'duplicate_cast', hero: 'Suman', heroine: 'Mumaith Khan' },
  { slug: 'sri-renukadevi-mahatyam-1978', type: 'duplicate_cast', hero: 'Suman', heroine: 'B. Saroja Devi' },
  { slug: 'daasi-1988', type: 'duplicate_cast', hero: 'Suman', heroine: 'Archana' },
  { slug: 'mud-people-1991', type: 'duplicate_cast', hero: 'Suman', heroine: 'Archana' },
  { slug: 'nimajjanam-1979', type: 'duplicate_cast', hero: 'Suman', heroine: 'Sharada' },

  // GENDER SWAP FIXES
  { slug: 'merupu-daadi-1984', type: 'gender_swap', hero: 'Suman', heroine: 'Silk Smitha' },
  { slug: 'ranam-2006', type: 'gender_swap', hero: 'Gopichand', heroine: null },
  { slug: 'sri-bannari-amman-2002', type: 'gender_swap', hero: null, heroine: 'Vijayashanti' },
  { slug: 'rajasthan-1999', type: 'gender_swap', hero: 'Sarathkumar', heroine: 'Vijayashanti' },
  { slug: 'kallukondoru-pennu-1998', type: 'gender_swap', hero: 'Rahman', heroine: 'Vijayashanti' },
  { slug: 'osey-ramulamma-1997', type: 'gender_swap', hero: 'Dasari Narayana Rao', heroine: 'Vijayashanti' },
  { slug: 'ips-jhansi-2004', type: 'gender_swap', hero: 'Suman', heroine: 'Vijayashanti' },
  { slug: 'kartavyam-1990', type: 'gender_swap', hero: null, heroine: 'Vijayashanti' },
  { slug: 'maga-rayudu-1994', type: 'gender_swap', hero: null, heroine: 'Vijayashanti' },
  { slug: 'jhansi-rani-1988', type: 'gender_swap', hero: 'Rajendra Prasad', heroine: 'Vijayashanti' },
  { slug: 'pratighatana-1985', type: 'gender_swap', hero: 'Suman', heroine: 'Vijayashanti' },
  { slug: 'karthavyam-1991', type: 'gender_swap', hero: null, heroine: 'Vijayashanti' },
  { slug: 'sakshi-1989', type: 'gender_swap', hero: null, heroine: 'Vijayashanti' },
  { slug: 'aahuthi-1988', type: 'gender_swap', hero: null, heroine: 'Vijayashanti' },
  { slug: 'naayudamma-2006', type: 'gender_swap', hero: null, heroine: 'Vijayashanti' },

  // SUPPORTING TO LEAD - Remove from supporting_cast and add to hero/heroine
  { slug: 'coffee-with-kadhal-2022', type: 'supporting_to_lead', removeFromSupporting: ['Malavika Sharma'], heroine: 'Malavika Sharma' },
  { slug: 'aadi-lakshmi-2006', type: 'supporting_to_lead', removeFromSupporting: ['Sridevi'], heroine: 'Sridevi (Vijaykumar)' },
  { slug: 'poster-2021', type: 'supporting_to_lead', removeFromSupporting: ['Shivaji Raja'], hero: 'Shivaji Raja' },
  { slug: 'kushi-kushiga-2004', type: 'supporting_to_lead', removeFromSupporting: ['Ramya Krishnan'], heroine: 'Ramya Krishnan' },
  { slug: 'parvathi-parameswarulu-1981', type: 'supporting_to_lead', removeFromSupporting: ['Chiranjeevi'], hero: 'Chiranjeevi' },
  { slug: 'nuvvila-2011', type: 'supporting_to_lead', removeFromSupporting: ['Vijay Deverakonda'], hero: 'Vijay Deverakonda' },
  { slug: 'auto-driver-1998', type: 'supporting_to_lead', removeFromSupporting: ['Simran'], heroine: 'Simran' },
  { slug: 'azad-2000', type: 'supporting_to_lead', removeFromSupporting: ['Soundarya'], heroine: 'Soundarya' },
  { slug: 'idi-katha-kaadu-1979', type: 'supporting_to_lead', removeFromSupporting: ['Kamal Haasan'], hero: 'Kamal Haasan' },
  { slug: 'kalki-2898-ad-part-2-tba', type: 'supporting_to_lead', removeFromSupporting: ['Prabhas'], hero: 'Prabhas' },
  { slug: 'snehamante-idera-2001', type: 'supporting_to_lead', removeFromSupporting: ['Bhumika Chawla'], heroine: 'Bhumika Chawla' },
  { slug: 'manasulo-maata-1996', type: 'supporting_to_lead', hero: 'Suresh', heroine: 'Madhoo' },
  { slug: 'vikramarkudu-2006', type: 'supporting_to_lead', removeFromSupporting: ['Anushka Shetty'], heroine: 'Anushka Shetty' },
  { slug: 'moondru-mudichu-1976', type: 'supporting_to_lead', removeFromSupporting: ['Sridevi'], heroine: 'Sridevi' },
  { slug: 'mundadugu-1983', type: 'supporting_to_lead', removeFromSupporting: ['Jaya Prada'], heroine: 'Jaya Prada' },
  { slug: 'kinnerasani-2022', type: 'supporting_to_lead', removeFromSupporting: ['Ann Sheetal'], heroine: 'Ann Sheetal' },
  { slug: 'gayatri-2018', type: 'supporting_to_lead', removeFromSupporting: ['Shriya Saran'], heroine: 'Shriya Saran' },
  { slug: 'all-in-all-azhagu-raja-2013', type: 'supporting_to_lead', removeFromSupporting: ['Kajal Aggarwal'], heroine: 'Kajal Aggarwal' },
  { slug: 'naayak-2013', type: 'supporting_to_lead', removeFromSupporting: ['Amala Paul'], heroine: 'Amala Paul' },
  { slug: 'lakshyam-2007', type: 'supporting_to_lead', removeFromSupporting: ['Anushka Shetty'], heroine: 'Anushka Shetty' },
  { slug: 'madhumasam-2007', type: 'supporting_to_lead', removeFromSupporting: ['Parvati Melton'], heroine: 'Parvati Melton' },
  { slug: 'naa-peru-surya-naa-illu-india-2018', type: 'supporting_to_lead', removeFromSupporting: ['Anu Emmanuel'], heroine: 'Anu Emmanuel' },
  { slug: 'mehbooba-2018', type: 'supporting_to_lead', removeFromSupporting: ['Akash Puri'], hero: 'Akash Puri' },
  { slug: 'devadas-2018', type: 'supporting_to_lead', removeFromSupporting: ['Rashmika Mandanna'], heroine: 'Rashmika Mandanna' },
  { slug: 'the-raja-saab-2026', type: 'supporting_to_lead', removeFromSupporting: ['Nidhhi Agerwal'], heroine: 'Nidhhi Agerwal' },
  { slug: 'yamadonga-2007', type: 'supporting_to_lead', removeFromSupporting: ['Mamta Mohandas'], heroine: 'Mamta Mohandas' },
  { slug: 'pareshan-2023', type: 'supporting_to_lead', removeFromSupporting: ['Pavani Karanam'], heroine: 'Pavani Karanam' },
  { slug: 'bhageeratha-2005', type: 'supporting_to_lead', hero: 'Ravi Teja', heroine: 'Shriya Saran' },
  { slug: 'jai-chiranjeeva-2005', type: 'supporting_to_lead', removeFromSupporting: ['Sameera Reddy'], heroine: 'Sameera Reddy' },
  { slug: 'veerabhadra-2006', type: 'supporting_to_lead', removeFromSupporting: ['Tanushree Dutta'], heroine: 'Tanushree Dutta' },
  { slug: 'game-changer-2025', type: 'supporting_to_lead', removeFromSupporting: ['Kiara Advani'], heroine: 'Kiara Advani' },
  { slug: 'naaga-2003', type: 'supporting_to_lead', removeFromSupporting: ['Sadha'], heroine: 'Sadha' },
  { slug: 'brahma-anandam-2025', type: 'supporting_to_lead', removeFromSupporting: ['Priya Vadlamani'], heroine: 'Priya Vadlamani' },
  { slug: 'sri-anjaneyam-2004', type: 'supporting_to_lead', removeFromSupporting: ['Arjun Sarja'], hero: 'Arjun Sarja' },
  { slug: 'seenu-vasanthi-lakshmi-2004', type: 'supporting_to_lead', removeFromSupporting: ['Navaneet Kaur'], heroine: 'Navaneet Kaur' },
  { slug: 'thipparaa-meesam-2019', type: 'supporting_to_lead', removeFromSupporting: ['Nikki Tamboli'], heroine: 'Nikki Tamboli' },
  { slug: 'vamsodharakudu-2000', type: 'supporting_to_lead', removeFromSupporting: ['Ramya Krishnan'], heroine: 'Ramya Krishnan' },
  { slug: 'bangarraju-2022', type: 'supporting_to_lead', removeFromSupporting: ['Ramya Krishnan'], heroine: 'Ramya Krishnan' },
  { slug: 'paradha-2025', type: 'supporting_to_lead', removeFromSupporting: ['Rag Mayur'], hero: 'Rag Mayur' },
  { slug: 'thammudu-1999', type: 'supporting_to_lead', removeFromSupporting: ['Preeti Jhangiani'], heroine: 'Preeti Jhangiani' },
  { slug: 'meri-warrant-2010', type: 'supporting_to_lead', hero: 'Srikanth', heroine: 'Bhavana' },
  { slug: 'pelli-kani-prasad-2008', type: 'supporting_to_lead', hero: 'Allari Naresh', heroine: 'Rathi' },
  { slug: 'mugguru-2011', type: 'supporting_to_lead', heroine: 'Shraddha Das' },
  { slug: 'hanu-man-2024', type: 'supporting_to_lead', heroine: 'Amritha Aiyer' },
  { slug: 'bavagaru-bagunnara-1998', type: 'supporting_to_lead', removeFromSupporting: ['Rambha'], heroine: 'Rambha' },
  { slug: 'bahubali-2-the-conclusion-2017', type: 'supporting_to_lead', removeFromSupporting: ['Anushka Shetty'], heroine: 'Anushka Shetty' },
  { slug: 'surya-vs-surya-2015', type: 'supporting_to_lead', removeFromSupporting: ['Tridha Choudhury'], heroine: 'Tridha Choudhury' },
  { slug: 'cinema-bandi-2021', type: 'supporting_to_lead', removeFromSupporting: ['Rag Mayur', 'Uma YG'], hero: 'Rag Mayur', heroine: 'Uma YG' },
  { slug: 'spyder-2017', type: 'supporting_to_lead', removeFromSupporting: ['Rakul Preet Singh'], heroine: 'Rakul Preet Singh' },
  { slug: 'mca-2017', type: 'supporting_to_lead', removeFromSupporting: ['Sai Pallavi'], heroine: 'Sai Pallavi' },
  { slug: 'dragon-ntr-2026', type: 'supporting_to_lead', removeFromSupporting: ['Rukmini Vasanth'], heroine: 'Rukmini Vasanth' },
  { slug: 'homam-2008', type: 'supporting_to_lead', removeFromSupporting: ['Mamta Mohandas'], heroine: 'Mamta Mohandas' },
  { slug: 'salaar-part-2-shouryaanga-parvam', type: 'supporting_to_lead', removeFromSupporting: ['Shruti Haasan'], heroine: 'Shruti Haasan' },
  { slug: 'samba-2004', type: 'supporting_to_lead', removeFromSupporting: ['Genelia D\'Souza'], heroine: 'Genelia D\'Souza' },
  { slug: 'skanda-the-attacker-2023', type: 'supporting_to_lead', removeFromSupporting: ['Sreeleela'], heroine: 'Sreeleela' },
  { slug: 'disco-raja-2020', type: 'supporting_to_lead', removeFromSupporting: ['Payal Rajput'], heroine: 'Payal Rajput' },
  { slug: 'chennakesava-reddy-2002', type: 'supporting_to_lead', removeFromSupporting: ['Shriya Saran'], heroine: 'Shriya Saran' },
  { slug: 'ranarangam-2019', type: 'supporting_to_lead', removeFromSupporting: ['Kalyani Priyadarshan'], heroine: 'Kalyani Priyadarshan' },
  { slug: 'andhra-king-taluka-2025', type: 'supporting_to_lead', removeFromSupporting: ['Bhagyashri Borse'], heroine: 'Bhagyashri Borse' },
  { slug: 'kingdom-2025', type: 'supporting_to_lead', removeFromSupporting: ['Bhagyashri Borse'], heroine: 'Bhagyashri Borse' },
  { slug: 'nari-nari-naduma-murari-2026', type: 'supporting_to_lead', removeFromSupporting: ['Samyuktha'], heroine: 'Samyuktha' },
  { slug: 'aakasam-lo-oka-tara-2026', type: 'supporting_to_lead', removeFromSupporting: ['Ruhani Sharma'], heroine: 'Ruhani Sharma' },
  { slug: 'seetharama-raju-1999', type: 'supporting_to_lead', removeFromSupporting: ['Sakshi Shivananda'], heroine: 'Sakshi Shivananda' },
  { slug: 'vakeel-saab-2021', type: 'supporting_to_lead', removeFromSupporting: ['Shruti Haasan'], heroine: 'Shruti Haasan' },
  { slug: 'napoleon-2017', type: 'supporting_to_lead', removeFromSupporting: ['Komalee Prasad'], heroine: 'Komalee Prasad' },
  { slug: 'jaat-2025', type: 'supporting_to_lead', removeFromSupporting: ['Saiyami Kher'], heroine: 'Saiyami Kher' },
  { slug: 'daaku-maharaaj-2025', type: 'supporting_to_lead', removeFromSupporting: ['Pragya Jaiswal'], heroine: 'Pragya Jaiswal' },
  { slug: 'siddhartha-2016', type: 'supporting_to_lead', removeFromSupporting: ['Sagar'], hero: 'Sagar' },
  { slug: 'harom-hara-2024', type: 'supporting_to_lead', removeFromSupporting: ['Malavika Sharma'], heroine: 'Malavika Sharma' },
  { slug: 'jathi-ratnalu-2021', type: 'supporting_to_lead', removeFromSupporting: ['Faria Abdullah'], heroine: 'Faria Abdullah' },
  { slug: 'sitadevi-1982', type: 'supporting_to_lead', removeFromSupporting: ['Chiranjeevi'], hero: 'Chiranjeevi' },
  { slug: 'idi-pellantara-1982', type: 'supporting_to_lead', removeFromSupporting: ['Chiranjeevi'], hero: 'Chiranjeevi' },
  { slug: 'marshal-2019', type: 'supporting_to_lead', removeFromSupporting: ['Megha Chowdhury'], heroine: 'Megha Chowdhury' },
  { slug: 'nambiyaar-2016', type: 'supporting_to_lead', removeFromSupporting: ['Sunaina'], heroine: 'Sunaina' },
  { slug: 'bava-bavamaridi-1993', type: 'supporting_to_lead', removeFromSupporting: ['Malashri'], heroine: 'Malashri' },
  { slug: '1111-2025', type: 'supporting_to_lead', removeFromSupporting: ['Varsha Vishwanath'], heroine: 'Varsha Vishwanath' },
  { slug: 'krish-2021', type: 'supporting_to_lead', removeFromSupporting: ['Musskan Sethi'], heroine: 'Musskan Sethi' },
  { slug: 'mukunda-2014', type: 'supporting_to_lead', removeFromSupporting: ['Pooja Hegde'], heroine: 'Pooja Hegde' },
  { slug: 'ontari-poratam-1989', type: 'supporting_to_lead', removeFromSupporting: ['Rupini'], heroine: 'Rupini' },
  { slug: 'govindudu-andarivaadele-2014', type: 'supporting_to_lead', removeFromSupporting: ['Kajal Aggarwal'], heroine: 'Kajal Aggarwal' },
  { slug: 'nijam-2003', type: 'supporting_to_lead', removeFromSupporting: ['Rakshita'], heroine: 'Rakshita' },
  { slug: 'eega-2012', type: 'supporting_to_lead', removeFromSupporting: ['Nani'], hero: 'Nani' },
  { slug: 'zanjeer-2013', type: 'supporting_to_lead', removeFromSupporting: ['Priyanka Chopra Jonas'], heroine: 'Priyanka Chopra Jonas' },
  { slug: 'bruce-lee-the-fighter-2015', type: 'supporting_to_lead', removeFromSupporting: ['Rakul Preet Singh'], heroine: 'Rakul Preet Singh' },
  { slug: 'sye-raa-narasimha-reddy-2019', type: 'supporting_to_lead', removeFromSupporting: ['Nayanthara'], heroine: 'Nayanthara' },
  { slug: 'anando-brahma-2017', type: 'supporting_to_lead', removeFromSupporting: ['Taapsee Pannu'], heroine: 'Taapsee Pannu' },
  { slug: 'narudi-brathuku-natana-2024', type: 'supporting_to_lead', removeFromSupporting: ['Sruthi Jayan'], heroine: 'Sruthi Jayan' },
  { slug: 'c-o-surya-2017', type: 'supporting_to_lead', removeFromSupporting: ['Mehreen Pirzada'], heroine: 'Mehreen Pirzada' },
  { slug: 'pattabhishekham-1985', type: 'supporting_to_lead', removeFromSupporting: ['Vijayashanti'], heroine: 'Vijayashanti' },
  { slug: 'sultanat-1986', type: 'supporting_to_lead', removeFromSupporting: ['Sridevi'], heroine: 'Sridevi' },
  { slug: 'bhagwaan-dada-1986', type: 'supporting_to_lead', removeFromSupporting: ['Sridevi'], heroine: 'Sridevi' },
  { slug: 'pataal-bhairavi-1985', type: 'supporting_to_lead', removeFromSupporting: ['Jaya Prada'], heroine: 'Jaya Prada' },
  { slug: 'sardar-dharmanna-1987', type: 'supporting_to_lead', removeFromSupporting: ['Mohan Babu', 'Jayasudha'], hero: 'Mohan Babu', heroine: 'Jayasudha' },
  { slug: 'bheemla-nayak-2022', type: 'supporting_to_lead', removeFromSupporting: ['Nithya Menen'], heroine: 'Nithya Menen' },
  { slug: 'dhoni-2012', type: 'supporting_to_lead', removeFromSupporting: ['Radhika Apte'], heroine: 'Radhika Apte' },
  { slug: 'vey-dharuvey-2024', type: 'supporting_to_lead', removeFromSupporting: ['Hebah Patel'], heroine: 'Hebah Patel' },
  { slug: '47-rojulu-1981', type: 'supporting_to_lead', removeFromSupporting: ['Chiranjeevi'], hero: 'Chiranjeevi' },
  { slug: 'kantri-2008', type: 'supporting_to_lead', removeFromSupporting: ['Prakash Raj'], hero: 'Prakash Raj' },
  { slug: 'radha-krishna-2021', type: 'supporting_to_lead', removeFromSupporting: ['Musskan Sethi'], heroine: 'Musskan Sethi' },
  { slug: 'focus-2022', type: 'supporting_to_lead', removeFromSupporting: ['Bhanuchander', 'Suhasini Maniratnam'], hero: 'Bhanuchander', heroine: 'Suhasini Maniratnam' },
  { slug: 'blackmail-2025', type: 'supporting_to_lead', removeFromSupporting: ['Srikanth'], hero: 'Srikanth' },
  { slug: 'maha-samudram-2021', type: 'supporting_to_lead', removeFromSupporting: ['Aditi Rao Hydari'], heroine: 'Aditi Rao Hydari' },
  { slug: 'balamevvadu-2022', type: 'supporting_to_lead', heroine: 'Suhasini Maniratnam' },
  { slug: 'vamsanikokkadu-1996', type: 'supporting_to_lead', removeFromSupporting: ['Aamani'], heroine: 'Aamani' },
  { slug: 'rogue-2017', type: 'supporting_to_lead', removeFromSupporting: ['Mannara Chopra'], heroine: 'Mannara Chopra' },
  { slug: 'khaleja-2010', type: 'supporting_to_lead', removeFromSupporting: ['Anushka Shetty'], heroine: 'Anushka Shetty' },
  { slug: 'nela-ticket-2018', type: 'supporting_to_lead', removeFromSupporting: ['Malavika Sharma'], heroine: 'Malavika Sharma' },
  { slug: 'ghazi-2017', type: 'supporting_to_lead', removeFromSupporting: ['Taapsee Pannu'], heroine: 'Taapsee Pannu' },
  { slug: 'khushi-2001', type: 'supporting_to_lead', removeFromSupporting: ['Kajol'], heroine: 'Kajol' },
  { slug: 'kothaga-maa-prayanam-2019', type: 'supporting_to_lead', removeFromSupporting: ['Jeeva'], hero: 'Jeeva' },
  { slug: 'thathsama-thathbhava-2023', type: 'supporting_to_lead', removeFromSupporting: ['Prajwal Devaraj'], hero: 'Prajwal Devaraj' },
  { slug: 'shashtipoorthi-2025', type: 'supporting_to_lead', removeFromSupporting: ['Archana'], heroine: 'Archana' },
  { slug: 'meka-suri-2-2020', type: 'supporting_to_lead', removeFromSupporting: ['Lirisha Kunapareddy'], heroine: 'Lirisha Kunapareddy' },
  { slug: 'pandurangadu-2008', type: 'supporting_to_lead', removeFromSupporting: ['Tabu'], heroine: 'Tabu' },
  { slug: 'bhari-taraganam-2023', type: 'supporting_to_lead', removeFromSupporting: ['Ali Basha', 'Rekha Nirosha'], hero: 'Ali Basha', heroine: 'Rekha Nirosha' },
  { slug: 'george-reddy-2019', type: 'supporting_to_lead', removeFromSupporting: ['Muskaan Khubchandani'], heroine: 'Muskaan Khubchandani' },
  { slug: 'narthanasala-2020', type: 'supporting_to_lead', removeFromSupporting: ['Soundarya'], heroine: 'Soundarya' },
  { slug: 'shukra-2021', type: 'supporting_to_lead', removeFromSupporting: ['Arvind Krishna'], hero: 'Arvind Krishna' },
  { slug: 'neevalle-nenunna-2020', type: 'supporting_to_lead', removeFromSupporting: ['Jabardasth Ramprasad'], hero: 'Jabardasth Ramprasad' },
  { slug: 'masooda-2022', type: 'supporting_to_lead', removeFromSupporting: ['Thiruveer Reddy'], hero: 'Thiruveer Reddy' },
  { slug: 'sisindri-1995', type: 'supporting_to_lead', removeFromSupporting: ['Tabu'], heroine: 'Tabu' },
  { slug: 'bootcut-balaraju-2024', type: 'supporting_to_lead', removeFromSupporting: ['Sunil Varma'], hero: 'Sunil Varma' },
  { slug: 'priya-1981', type: 'supporting_to_lead', removeFromSupporting: ['Chiranjeevi'], hero: 'Chiranjeevi' },
  { slug: 'masala-2013', type: 'supporting_to_lead', removeFromSupporting: ['Anjali'], heroine: 'Anjali' },
  { slug: 'maya-puthagam-2024', type: 'supporting_to_lead', removeFromSupporting: ['Abarnathi'], heroine: 'Abarnathi' },
  { slug: 'fcuk-father-chitti-umaa-kaarthik-2021', type: 'supporting_to_lead', removeFromSupporting: ['Ammu Abhirami'], heroine: 'Ammu Abhirami' },
  { slug: 'premistunnaa-2025', type: 'supporting_to_lead', removeFromSupporting: ['Subbu Panchu'], hero: 'Subbu Panchu' },
  { slug: 'santhana-prapthirasthu-2025', type: 'supporting_to_lead', removeFromSupporting: ['Tharun Bhascker'], hero: 'Tharun Bhascker' },
  { slug: 'tuk-tuk-2025', type: 'supporting_to_lead', removeFromSupporting: ['Saanve Meghana'], heroine: 'Saanve Meghana' },
  { slug: 'bedurulanka-2012-2023', type: 'supporting_to_lead', removeFromSupporting: ['Neha Shetty'], heroine: 'Neha Shetty' },
  { slug: 'aa-naluguru-2004', type: 'supporting_to_lead', removeFromSupporting: ['Aamani'], heroine: 'Aamani' },
  { slug: 'sontham-2002', type: 'supporting_to_lead', removeFromSupporting: ['Namitha'], heroine: 'Namitha' },
  { slug: 'kandireega-2011', type: 'supporting_to_lead', removeFromSupporting: ['Hansika Motwani'], heroine: 'Hansika Motwani' },
  { slug: 'vimanam-2023', type: 'supporting_to_lead', removeFromSupporting: ['Anasuya Bharadwaj'], heroine: 'Anasuya Bharadwaj' },
  { slug: 'mishan-impossible-2022', type: 'supporting_to_lead', removeFromSupporting: ['Taapsee Pannu'], heroine: 'Taapsee Pannu' },
  { slug: 'alludu-adhurs-2021', type: 'supporting_to_lead', removeFromSupporting: ['Nabha Natesh'], heroine: 'Nabha Natesh' },
  { slug: 'amrutham-chandamama-lo-2014', type: 'supporting_to_lead', removeFromSupporting: ['Inturi Vasu'], hero: 'Inturi Vasu' },
  { slug: 'rajanna-2011', type: 'supporting_to_lead', removeFromSupporting: ['Sneha'], heroine: 'Sneha' },
  { slug: 'chinna-2021', type: 'supporting_to_lead', removeFromSupporting: ['Kulappulli Leela'], heroine: 'Kulappulli Leela' },
  { slug: 'nava-vasantham-2007', type: 'supporting_to_lead', removeFromSupporting: ['Priyamani'], heroine: 'Priyamani' },
  { slug: 'okkadu-migiladu-2017', type: 'supporting_to_lead', removeFromSupporting: ['Anisha Ambrose'], heroine: 'Anisha Ambrose' },
  { slug: 'maayajaalam-2006', type: 'supporting_to_lead', removeFromSupporting: ['Poonam Kaur'], heroine: 'Poonam Kaur' },
  { slug: 'gaami-2024', type: 'supporting_to_lead', removeFromSupporting: ['Harika Pedada'], heroine: 'Harika Pedada' },
  { slug: 'happy-ending-2024', type: 'supporting_to_lead', removeFromSupporting: ['Apoorva Rao'], heroine: 'Apoorva Rao' },
  { slug: 'maa-oori-polimera-2021', type: 'supporting_to_lead', removeFromSupporting: ['Kamakshi Bhaskarla'], heroine: 'Kamakshi Bhaskarla' },
  { slug: 'kotha-kothaga-2022', type: 'supporting_to_lead', removeFromSupporting: ['Pavan Tej Konidela'], hero: 'Pavan Tej Konidela' },
  { slug: 'samarasimha-reddy-1999', type: 'supporting_to_lead', removeFromSupporting: ['Simran'], heroine: 'Simran' },
  { slug: 'mowgli-2025', type: 'supporting_to_lead', removeFromSupporting: ['Mounika Reddy'], heroine: 'Mounika Reddy' },
  { slug: 'rakta-charitra-2010', type: 'supporting_to_lead', removeFromSupporting: ['Radhika Apte'], heroine: 'Radhika Apte' },
  { slug: 'gamanam-2021', type: 'supporting_to_lead', removeFromSupporting: ['Shiva Kandukuri'], hero: 'Shiva Kandukuri' },
  { slug: 'the-trial-2023', type: 'supporting_to_lead', removeFromSupporting: ['Yug Ram'], hero: 'Yug Ram' },
  { slug: 'the-ghazi-attack-2017', type: 'supporting_to_lead', removeFromSupporting: ['Taapsee Pannu'], heroine: 'Taapsee Pannu' },
  { slug: 'police-vari-heccharika-2025', type: 'supporting_to_lead', removeFromSupporting: ['Himaja'], heroine: 'Himaja' },
  { slug: 'goodachari-2018', type: 'supporting_to_lead', removeFromSupporting: ['Supriya Yarlagadda'], heroine: 'Supriya Yarlagadda' },
  { slug: 'andala-ramudu-2006', type: 'supporting_to_lead', removeFromSupporting: ['Brahmanandam'], hero: 'Brahmanandam' },
  { slug: 'pranaya-godari-2024', type: 'supporting_to_lead', removeFromSupporting: ['Sadan Hasan'], hero: 'Sadan Hasan' },
  { slug: 'teen-maar-2011', type: 'supporting_to_lead', removeFromSupporting: ['Sonu Sood'], hero: 'Sonu Sood' },
  { slug: 'chaari-111-2024', type: 'supporting_to_lead', removeFromSupporting: ['Samyuktha Viola Viswanathan'], heroine: 'Samyuktha Viola Viswanathan' },
  { slug: 'veyi-subhamulu-kalugu-neeku-2022', type: 'supporting_to_lead', removeFromSupporting: ['Satyam Rajesh'], hero: 'Satyam Rajesh' },
  { slug: 'nayaki-2016', type: 'supporting_to_lead', removeFromSupporting: ['Ganesh Venkatraman'], hero: 'Ganesh Venkatraman' },
  { slug: 'hrudaya-kaleyam-2014', type: 'supporting_to_lead', removeFromSupporting: ['Ishika Singh'], heroine: 'Ishika Singh' },
  { slug: 'aithe-2003', type: 'supporting_to_lead', removeFromSupporting: ['Pavan Malhotra'], hero: 'Pavan Malhotra' },
  { slug: 'devadasu-2006', type: 'supporting_to_lead', removeFromSupporting: ['Ram Pothineni'], hero: 'Ram Pothineni' },
  { slug: 'karma-kartha-kriya-2018', type: 'supporting_to_lead', removeFromSupporting: ['Sahar Afsha'], heroine: 'Sahar Afsha' },
  { slug: 'tiger-2015', type: 'supporting_to_lead', removeFromSupporting: ['Seerat Kapoor'], heroine: 'Seerat Kapoor' },
  { slug: 'co-kancharapalem-2018', type: 'supporting_to_lead', removeFromSupporting: ['Nitya Sri'], heroine: 'Nitya Sri' },
  { slug: 'yuddam-2014', type: 'supporting_to_lead', removeFromSupporting: ['Tarun'], hero: 'Tarun' },
  { slug: 'paandavulu-paandavulu-thummeda-2014', type: 'supporting_to_lead', removeFromSupporting: ['Hansika Motwani'], heroine: 'Hansika Motwani' },
  { slug: 'raju-maharaju-2009', type: 'supporting_to_lead', removeFromSupporting: ['Surveen Chawla'], heroine: 'Surveen Chawla' },
  { slug: 'pekamedalu-2024', type: 'supporting_to_lead', removeFromSupporting: ['Anusha Nuthula'], heroine: 'Anusha Nuthula' },
  { slug: 'sri-satyanarayana-swamy-2007', type: 'supporting_to_lead', removeFromSupporting: ['Ravali'], heroine: 'Ravali' },
  { slug: 'saakshyam-2018', type: 'supporting_to_lead', removeFromSupporting: ['Ravi Kishan'], hero: 'Ravi Kishan' },
  { slug: 'radha-2017', type: 'supporting_to_lead', removeFromSupporting: ['Lavanya Tripathi'], heroine: 'Lavanya Tripathi' },
  { slug: 'bimbisara-2022', type: 'supporting_to_lead', removeFromSupporting: ['Catherine Tresa'], heroine: 'Catherine Tresa' },
  { slug: 'raaj-2011', type: 'supporting_to_lead', removeFromSupporting: ['Priyamani'], heroine: 'Priyamani' },
  { slug: 'jagamemaya-2022', type: 'supporting_to_lead', removeFromSupporting: ['Babloo Prithiveeraj'], hero: 'Babloo Prithiveeraj' },
  { slug: 'noothi-lo-kappalu-2015', type: 'supporting_to_lead', removeFromSupporting: ['Manoj Nandam'], hero: 'Manoj Nandam' },
  { slug: 'baahubali-the-epic-2025', type: 'supporting_to_lead', removeFromSupporting: ['Anushka Shetty'], heroine: 'Anushka Shetty' },
  { slug: 'jaguar-2016', type: 'supporting_to_lead', removeFromSupporting: ['Brahmanandam'], hero: 'Brahmanandam' },
  { slug: 'chaurya-paatham-2025', type: 'supporting_to_lead', removeFromSupporting: ['Mast Ali'], hero: 'Mast Ali' },
  { slug: 'nuvvante-nakishtam-2005', type: 'supporting_to_lead', removeFromSupporting: ['Anuradha Mehta'], heroine: 'Anuradha Mehta' },
  { slug: 'dhee-2007', type: 'supporting_to_lead', removeFromSupporting: ['Genelia D\'Souza'], heroine: 'Genelia D\'Souza' },
  { slug: 'narasimhudu-2005', type: 'supporting_to_lead', removeFromSupporting: ['Ameesha Patel'], heroine: 'Ameesha Patel' },
  { slug: 'galipatam-2014', type: 'supporting_to_lead', removeFromSupporting: ['Erica Fernandes'], heroine: 'Erica Fernandes' },
  { slug: 'kanabadutaledu-2021', type: 'supporting_to_lead', removeFromSupporting: ['Vaishali Raj'], heroine: 'Vaishali Raj' },
  { slug: 'valayam-2020', type: 'supporting_to_lead', removeFromSupporting: ['Kireeti Damaraju'], hero: 'Kireeti Damaraju' },
  { slug: 'rachcha-2012', type: 'supporting_to_lead', removeFromSupporting: ['Dev Gill'], hero: 'Dev Gill' },
  { slug: 'gaddalakonda-ganesh-2019', type: 'supporting_to_lead', removeFromSupporting: ['Mirnalini Ravi'], heroine: 'Mirnalini Ravi' },
  { slug: 'shiva-143-2020', type: 'supporting_to_lead', removeFromSupporting: ['Sagar Sailesh'], hero: 'Sagar Sailesh' },
  { slug: 'maska-2009', type: 'supporting_to_lead', removeFromSupporting: ['Hansika Motwani'], heroine: 'Hansika Motwani' },
  { slug: 'anaganaga-o-dheerudu-2011', type: 'supporting_to_lead', removeFromSupporting: ['Shruti Haasan'], heroine: 'Shruti Haasan' },
  { slug: 'bommalata-2006', type: 'supporting_to_lead', removeFromSupporting: ['Shriya Saran'], heroine: 'Shriya Saran' },
  { slug: 'boss-2006', type: 'supporting_to_lead', removeFromSupporting: ['Shriya Saran'], heroine: 'Shriya Saran' },
  { slug: 'vidyarthi-2023', type: 'supporting_to_lead', removeFromSupporting: ['Raghu Babu'], hero: 'Raghu Babu' },
  { slug: 'eedo-rakam-aado-rakam-2016', type: 'supporting_to_lead', removeFromSupporting: ['Hebah Patel'], heroine: 'Hebah Patel' },
  { slug: 'right-right-2016', type: 'supporting_to_lead', removeFromSupporting: ['Pooja Jhaveri'], heroine: 'Pooja Jhaveri' },
  { slug: 'sathi-gani-rendu-ekaralu-2023', type: 'supporting_to_lead', removeFromSupporting: ['Aneesha Dama'], heroine: 'Aneesha Dama' },
  { slug: 'uma-maheswara-ugra-roopasya-2020', type: 'supporting_to_lead', removeFromSupporting: ['Roopa Koduvayur'], heroine: 'Roopa Koduvayur' },
  { slug: 'raajadhani-files-2024', type: 'supporting_to_lead', removeFromSupporting: ['Vani Viswanath'], heroine: 'Vani Viswanath' },
  { slug: 'tuntari-2016', type: 'supporting_to_lead', removeFromSupporting: ['Latha Hegde'], heroine: 'Latha Hegde' },
  { slug: 'v-2020', type: 'supporting_to_lead', removeFromSupporting: ['Nivetha Thomas'], heroine: 'Nivetha Thomas' },
  { slug: 'ram-asur-2021', type: 'supporting_to_lead', removeFromSupporting: ['Chandhini Tamilarasan'], heroine: 'Chandhini Tamilarasan' },
  { slug: 'kalyana-ramudu-2003', type: 'supporting_to_lead', removeFromSupporting: ['Prabhu Deva'], hero: 'Prabhu Deva' },
  { slug: 'race-2013', type: 'supporting_to_lead', removeFromSupporting: ['Disha Pandey'], heroine: 'Disha Pandey' },
  { slug: 'jyo-achyutananda-2016', type: 'supporting_to_lead', removeFromSupporting: ['Regina Cassandra'], heroine: 'Regina Cassandra' },
  { slug: 'dhandoraa-2025', type: 'supporting_to_lead', removeFromSupporting: ['Bindu Madhavi'], heroine: 'Bindu Madhavi' },
  { slug: 'run-2020', type: 'supporting_to_lead', removeFromSupporting: ['Pat Healy'], hero: 'Pat Healy' },
  { slug: 'martin-luther-king-2023', type: 'supporting_to_lead', removeFromSupporting: ['Saranya Pradeep'], heroine: 'Saranya Pradeep' },
  { slug: 'rao-bahadur-2026', type: 'supporting_to_lead', removeFromSupporting: ['Deepa Thomas'], heroine: 'Deepa Thomas' },
  { slug: 'nakshatra-poratam-tba', type: 'supporting_to_lead', removeFromSupporting: ['Aamani'], heroine: 'Aamani' },
  { slug: 'oka-pathakam-prakaaram-2025', type: 'supporting_to_lead', removeFromSupporting: ['Ashima Narwal'], heroine: 'Ashima Narwal' },
  { slug: 'mazaka-2025', type: 'supporting_to_lead', removeFromSupporting: ['Ritu Varma'], heroine: 'Ritu Varma' },
  { slug: 'the-100-2025', type: 'supporting_to_lead', removeFromSupporting: ['Anand'], hero: 'Anand' },
  { slug: '1000-waala-2025', type: 'supporting_to_lead', removeFromSupporting: ['Navitha Gangat'], heroine: 'Navitha Gangat' },
  { slug: 'ashta-chamma-2008', type: 'supporting_to_lead', removeFromSupporting: ['Bhargavi'], heroine: 'Bhargavi' },
  { slug: 'jagapathi-2005', type: 'supporting_to_lead', removeFromSupporting: ['Rakshita'], heroine: 'Rakshita' },
  { slug: 'nakshatram-2017', type: 'supporting_to_lead', removeFromSupporting: ['Regina Cassandra'], heroine: 'Regina Cassandra' },
  { slug: 'lakshya-2021', type: 'supporting_to_lead', removeFromSupporting: ['Ketika Sharma'], heroine: 'Ketika Sharma' },
  { slug: 'kathalo-rajakumari-2017', type: 'supporting_to_lead', removeFromSupporting: ['Namitha Pramod'], heroine: 'Namitha Pramod' },
  { slug: 'sapthagiri-llb-2017', type: 'supporting_to_lead', removeFromSupporting: ['Jhansi'], heroine: 'Jhansi' },
  { slug: 'senapathi-2021', type: 'supporting_to_lead', removeFromSupporting: ['Gnaneswari Kandregula'], heroine: 'Gnaneswari Kandregula' },
  { slug: 'prathinidhi-2014', type: 'supporting_to_lead', removeFromSupporting: ['Shubra Aaiyappa'], heroine: 'Shubra Aaiyappa' },
  { slug: 'sri-rama-rajyam-2011', type: 'supporting_to_lead', removeFromSupporting: ['Nayanthara'], heroine: 'Nayanthara' },
  { slug: 'gamyam-2008', type: 'supporting_to_lead', removeFromSupporting: ['Kamalinee Mukherjee'], heroine: 'Kamalinee Mukherjee' },
  { slug: 'brahmi-gadi-katha-2011', type: 'supporting_to_lead', removeFromSupporting: ['Asmita Sood'], heroine: 'Asmita Sood' },
  { slug: 'ahimsa-2023', type: 'supporting_to_lead', removeFromSupporting: ['Kamal Kamaraju'], hero: 'Kamal Kamaraju' },
  { slug: 'mogudu-2011', type: 'supporting_to_lead', removeFromSupporting: ['Shraddha Das'], heroine: 'Shraddha Das' },
  { slug: 'double-ismart-2024', type: 'supporting_to_lead', removeFromSupporting: ['Kavya Thapar'], heroine: 'Kavya Thapar' },
  { slug: 'indrani-epic1-dharam-vs-karam-2024', type: 'supporting_to_lead', removeFromSupporting: ['Franaita Jijina'], heroine: 'Franaita Jijina' },
  { slug: 'mysaa-tba', type: 'supporting_to_lead', removeFromSupporting: ['Guru Somasundaram'], hero: 'Guru Somasundaram' },
  { slug: 'yerra-mandaram-1991', type: 'supporting_to_lead', removeFromSupporting: ['Jayalalita'], heroine: 'Jayalalita' },
  { slug: 'they-call-him-og-2025', type: 'supporting_to_lead', removeFromSupporting: ['Priyanka Arul Mohan'], heroine: 'Priyanka Arul Mohan' },
  { slug: 'dheera-2024', type: 'supporting_to_lead', removeFromSupporting: ['Neha Pathan'], heroine: 'Neha Pathan' },
  { slug: 'shivangi-2025', type: 'supporting_to_lead', removeFromSupporting: ['John Vijay'], hero: 'John Vijay' },
  { slug: 'allare-allari-2007', type: 'supporting_to_lead', removeFromSupporting: ['Parvati Melton'], heroine: 'Parvati Melton' },
  { slug: 'ramnagar-bunny-2024', type: 'supporting_to_lead', removeFromSupporting: ['Richa Joshi'], heroine: 'Richa Joshi' },
  { slug: 'razakar-the-silent-genocide-of-hyderabad-2024', type: 'supporting_to_lead', removeFromSupporting: ['Arav Chowdhary'], hero: 'Arav Chowdhary' },
  { slug: 'lucky-chance-1994', type: 'supporting_to_lead', removeFromSupporting: ['Kanchan'], heroine: 'Kanchan' },
  { slug: 'avatharam-2014', type: 'supporting_to_lead', removeFromSupporting: ['Richard Rishi'], hero: 'Richard Rishi' },
  { slug: 'waltair-veerayya-2023', type: 'supporting_to_lead', removeFromSupporting: ['Shruti Haasan'], heroine: 'Shruti Haasan' },
  { slug: 'naa-peru-surya-2018', type: 'supporting_to_lead', removeFromSupporting: ['Anu Emmanuel'], heroine: 'Anu Emmanuel' },
  { slug: 'tiger-nageswara-rao-2023', type: 'supporting_to_lead', removeFromSupporting: ['Gayatri Bhardwaj'], heroine: 'Gayatri Bhardwaj' },
  { slug: 'bhagavanth-kesari-2023', type: 'supporting_to_lead', removeFromSupporting: ['Sreeleela'], heroine: 'Sreeleela' },
  { slug: 'breathe-2023', type: 'supporting_to_lead', removeFromSupporting: ['Vennela Kishore', 'Aishani Shetty'], hero: 'Vennela Kishore', heroine: 'Aishani Shetty' },
  { slug: 'mail-2021', type: 'supporting_to_lead', removeFromSupporting: ['Sri Gouri Priya Reddy'], heroine: 'Sri Gouri Priya Reddy' },
  { slug: 'dongala-mutha-2011', type: 'supporting_to_lead', removeFromSupporting: ['Lakshmi Manchu'], heroine: 'Lakshmi Manchu' },
  { slug: 'aatagallu-2018', type: 'supporting_to_lead', removeFromSupporting: ['Darshana Banik'], heroine: 'Darshana Banik' },
  { slug: 'nindha-2024', type: 'supporting_to_lead', removeFromSupporting: ['Q. Madhu'], heroine: 'Q. Madhu' },
  { slug: 'mathu-vadalara-2-2024', type: 'supporting_to_lead', removeFromSupporting: ['Faria Abdullah'], heroine: 'Faria Abdullah' },
  { slug: 'krishnamma-2024', type: 'supporting_to_lead', removeFromSupporting: ['Athira Raj'], heroine: 'Athira Raj' },
  { slug: 'abcd-american-born-confused-desi-2019', type: 'supporting_to_lead', removeFromSupporting: ['Rukshar Dhillon'], heroine: 'Rukshar Dhillon' },
  { slug: 'sandeham-2024', type: 'supporting_to_lead', removeFromSupporting: ['Suman Tej'], hero: 'Suman Tej' },
  { slug: 'parakramam-2024', type: 'supporting_to_lead', removeFromSupporting: ['Sruthi Samanvi'], heroine: 'Sruthi Samanvi' },
  { slug: 'padaharella-vayasu-1978', type: 'supporting_to_lead', removeFromSupporting: ['Sridevi'], heroine: 'Sridevi' },
  { slug: 'gaganam-2011', type: 'supporting_to_lead', removeFromSupporting: ['Poonam Kaur'], heroine: 'Poonam Kaur' },
  { slug: 'kartha-karma-kriya-2018', type: 'supporting_to_lead', removeFromSupporting: ['Sahar Afsha'], heroine: 'Sahar Afsha' },
  { slug: 'thotti-gang-2002', type: 'supporting_to_lead', removeFromSupporting: ['Gajala'], heroine: 'Gajala' },
  { slug: 'agent-narasimha117-2024', type: 'supporting_to_lead', removeFromSupporting: ['Kirthi Krishna'], heroine: 'Kirthi Krishna' },
  { slug: 'acharya-2022', type: 'supporting_to_lead', removeFromSupporting: ['Pooja Hegde'], heroine: 'Pooja Hegde' },
  { slug: 'suvarna-sundari-2023', type: 'supporting_to_lead', removeFromSupporting: ['Sai Kumar'], hero: 'Sai Kumar' },
  { slug: 'mentoo-2023', type: 'supporting_to_lead', removeFromSupporting: ['Riya Suman'], heroine: 'Riya Suman' },
  { slug: 'saachi-2023', type: 'supporting_to_lead', removeFromSupporting: ['Ashok Mulavirat'], hero: 'Ashok Mulavirat' },
  { slug: 'ravanasura-2023', type: 'supporting_to_lead', removeFromSupporting: ['Anu Emmanuel'], heroine: 'Anu Emmanuel' },
  { slug: 'maama-mascheendra-2023', type: 'supporting_to_lead', removeFromSupporting: ['Eesha Rebba'], heroine: 'Eesha Rebba' },
  { slug: 'mad-2021', type: 'supporting_to_lead', removeFromSupporting: ['Rajath Raghav'], hero: 'Rajath Raghav' },
  { slug: 'dhamaka-2022', type: 'supporting_to_lead', removeFromSupporting: ['Sreeleela'], heroine: 'Sreeleela' },
  { slug: 'sindhooram-2023', type: 'supporting_to_lead', removeFromSupporting: ['Siva Balaji'], hero: 'Siva Balaji' },
  { slug: 'eenadu-2009', type: 'supporting_to_lead', removeFromSupporting: ['Lakshmi'], heroine: 'Lakshmi' },
  { slug: 'commitment-2022', type: 'supporting_to_lead', removeFromSupporting: ['Amit Kumar Tiwari'], hero: 'Amit Kumar Tiwari' },
  { slug: 'rowdy-rangamma-1978', type: 'supporting_to_lead', removeFromSupporting: ['Vijaya Lalitha'], heroine: 'Vijaya Lalitha' },
  { slug: 'pranam-khareedu-1978', type: 'supporting_to_lead', removeFromSupporting: ['Chiranjeevi'], hero: 'Chiranjeevi' },
  { slug: 'the-warriorr-2022', type: 'supporting_to_lead', removeFromSupporting: ['Krithi Shetty'], heroine: 'Krithi Shetty' },
  { slug: 'achari-america-yatra-2018', type: 'supporting_to_lead', removeFromSupporting: ['Pragya Jaiswal'], heroine: 'Pragya Jaiswal' },
  { slug: 'shakti-2011', type: 'supporting_to_lead', removeFromSupporting: ['Sonu Sood'], hero: 'Sonu Sood' },
  { slug: 'nenu-aadhi-madyalo-maa-nanna-2019', type: 'supporting_to_lead', removeFromSupporting: ['Manoj Nandam'], hero: 'Manoj Nandam' },
  { slug: 'eeshwar-2002', type: 'supporting_to_lead', removeFromSupporting: ['Revathi'], heroine: 'Revathi' },
  { slug: 'sagiletikatha-2023', type: 'supporting_to_lead', removeFromSupporting: ['Vishika Kota'], heroine: 'Vishika Kota' },
  { slug: 'yuddha-bhoomi-1971-beyond-borders-1971', type: 'supporting_to_lead', removeFromSupporting: ['Allu Sirish'], hero: 'Allu Sirish' },
  { slug: 'maa-nanna-superhero-2024', type: 'supporting_to_lead', removeFromSupporting: ['Annie'], heroine: 'Annie' },
  { slug: 'om-bheem-bush-2024', type: 'supporting_to_lead', removeFromSupporting: ['Preity Mukhundhan'], heroine: 'Preity Mukhundhan' },
  { slug: 'rakta-charitra-2-2010', type: 'supporting_to_lead', removeFromSupporting: ['Priyamani'], heroine: 'Priyamani' },
  { slug: 'ee-kathalo-paathralu-kalpitam-2021', type: 'supporting_to_lead', removeFromSupporting: ['I Dream Anjali'], heroine: 'I Dream Anjali' },
  { slug: '3-monkeys-2020', type: 'supporting_to_lead', removeFromSupporting: ['Karunya Chowdary'], heroine: 'Karunya Chowdary' },
  { slug: 'veera-bhoga-vasantha-rayalu-2018', type: 'supporting_to_lead', removeFromSupporting: ['Shriya Saran'], heroine: 'Shriya Saran' },
  { slug: 'paper-boy-2018', type: 'supporting_to_lead', removeFromSupporting: ['Tanya Hope'], heroine: 'Tanya Hope' },
  { slug: 'amaram-akhilam-prema-2020', type: 'supporting_to_lead', removeFromSupporting: ['Vijay Ram'], hero: 'Vijay Ram' },
  { slug: 'balupu-2013', type: 'supporting_to_lead', removeFromSupporting: ['Anjali'], heroine: 'Anjali' },
  { slug: 'saaho-2019', type: 'supporting_to_lead', removeFromSupporting: ['Mandira Bedi'], heroine: 'Mandira Bedi' },
  { slug: 'bujji-ila-raa-2022', type: 'supporting_to_lead', removeFromSupporting: ['Chandhini Tamilarasan'], heroine: 'Chandhini Tamilarasan' },
  { slug: 'anukunnadhi-okkati-aynadhi-okkati-2020', type: 'supporting_to_lead', removeFromSupporting: ['Madhunandan'], hero: 'Madhunandan' },
  { slug: 'tata-birla-madhyalo-laila-2006', type: 'supporting_to_lead', removeFromSupporting: ['Laya'], heroine: 'Laya' },
  { slug: 'panchakshari-2010', type: 'supporting_to_lead', removeFromSupporting: ['Brahmanandam'], hero: 'Brahmanandam' },
  { slug: 'priyuraalu-2021', type: 'supporting_to_lead', removeFromSupporting: ['Kamakshi Bhaskarla'], heroine: 'Kamakshi Bhaskarla' },
  { slug: 'oka-manchi-prema-katha-2024', type: 'supporting_to_lead', removeFromSupporting: ['Samuthirakani'], hero: 'Samuthirakani' },
  { slug: 'spark-2023', type: 'supporting_to_lead', removeFromSupporting: ['Guru Somasundaram'], hero: 'Guru Somasundaram' },
  { slug: 'hunt-2023', type: 'supporting_to_lead', removeFromSupporting: ['Mounika Reddy'], heroine: 'Mounika Reddy' },

  // SLUG FIXES
  { slug: 'q12985478-1979', type: 'slug', newSlug: 'kothala-raayudu-1979' },
  { slug: 'q12982331-1977', type: 'slug', newSlug: 'bangaru-bommalu-1977' },
  { slug: 'q16311395-1978', type: 'slug', newSlug: 'karunamayudu-1978' },

  // MUSIC DIRECTOR FIXES
  { slug: 'prema-ishq-kaadhal-2013', type: 'music_director', musicDirector: 'Shravan Bharadwaj' },
  { slug: 'mantra-2007', type: 'music_director', musicDirector: 'Anand-Milind' },
  { slug: 'meeku-meere-maaku-meeme-2016', type: 'music_director', musicDirector: 'Shravan' }, // Standalone, not duo
  { slug: 'alias-janaki-2013', type: 'music_director', musicDirector: 'Shravan' }, // Standalone, not duo

  // DOCUMENTARY FIXES
  { slug: 'rrr-behind-and-beyond-2024', type: 'documentary', removeHero: true, removeHeroine: true },

  // NAME FORMAT FIXES
  { slug: 'dhammu-2012', type: 'name_format', nameFormat: 'Jr. NTR' },
];

async function removeFromSupportingCast(movieId: string, names: string[]): Promise<void> {
  const { data: movie } = await supabase
    .from('movies')
    .select('supporting_cast')
    .eq('id', movieId)
    .single();

  if (!movie || !movie.supporting_cast) return;

  const supportingCast = Array.isArray(movie.supporting_cast) 
    ? movie.supporting_cast 
    : typeof movie.supporting_cast === 'string' 
      ? JSON.parse(movie.supporting_cast) 
      : [];

  const normalizedNames = names.map(n => n.toLowerCase().trim());
  const filtered = supportingCast.filter((item: any) => {
    const name = typeof item === 'string' ? item : item?.name || '';
    return !normalizedNames.includes(name.toLowerCase().trim());
  });

  await supabase
    .from('movies')
    .update({ supporting_cast: filtered })
    .eq('id', movieId);
}

async function applyFix(fix: Fix): Promise<boolean> {
  try {
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('id, slug, hero, heroine, supporting_cast, music_director')
      .eq('slug', fix.slug)
      .single();

    if (fetchError || !movie) {
      console.log(chalk.red(`❌ Not found: ${fix.slug}`));
      return false;
    }

    const updates: any = {};

    switch (fix.type) {
      case 'duplicate_cast':
        if (fix.hero) updates.hero = fix.hero;
        if (fix.heroine) updates.heroine = fix.heroine;
        break;

      case 'gender_swap':
        if (fix.hero && fix.heroine) {
          // Swap: move current hero to heroine, set new hero
          updates.hero = fix.hero;
          updates.heroine = fix.heroine;
        } else if (fix.heroine) {
          // Move from hero to heroine
          updates.heroine = fix.heroine;
          updates.hero = null;
        } else if (fix.hero) {
          // Move from heroine to hero
          updates.hero = fix.hero;
          updates.heroine = null;
        }
        break;

      case 'supporting_to_lead':
        if (fix.removeFromSupporting) {
          await removeFromSupportingCast(movie.id, fix.removeFromSupporting);
        }
        if (fix.hero) updates.hero = fix.hero;
        if (fix.heroine) updates.heroine = fix.heroine;
        break;

      case 'missing_lead':
        if (fix.hero) updates.hero = fix.hero;
        if (fix.heroine) updates.heroine = fix.heroine;
        break;

      case 'slug':
        if (fix.newSlug) {
          updates.slug = fix.newSlug;
        }
        break;

      case 'music_director':
        if (fix.musicDirector) {
          updates.music_director = fix.musicDirector;
        }
        break;

      case 'documentary':
        if (fix.removeHero) updates.hero = null;
        if (fix.removeHeroine) updates.heroine = null;
        break;

      case 'name_format':
        if (fix.nameFormat) {
          // Update hero field with standardized name
          updates.hero = fix.nameFormat;
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`  ❌ Error: ${updateError.message}`));
        return false;
      }
      return true;
    }

    return false;
  } catch (e: any) {
    console.log(chalk.red(`❌ Unexpected error for ${fix.slug}: ${e.message}`));
    return false;
  }
}

async function applyAllFixes() {
  console.log(chalk.bold('\n🔧 APPLYING FAST-AUDIT FIXES\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');

  let applied = 0;
  let errors = 0;
  let skipped = 0;

  for (const fix of fixes) {
    const result = await applyFix(fix);
    if (result) {
      applied++;
      console.log(chalk.green(`✅ ${fix.slug} (${fix.type})`));
    } else if (result === false && !fix.slug.includes('q')) {
      errors++;
    } else {
      skipped++;
    }
  }

  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Applied: ${chalk.green(applied)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log(`  Skipped: ${chalk.yellow(skipped)}`);
  console.log();
}

applyAllFixes().catch(console.error);
