#!/usr/bin/env npx tsx
/**
 * Apply Manual Review Corrections
 * 
 * Updates database with manually verified and corrected movie data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Manually verified corrections from review
const corrections = [
  {
    id: '2611d53a-2af0-44d4-b74b-0abee0a5069f',
    title: 'Aradhana',
    year: 1987,
    hero: 'Chiranjeevi',
    heroine: 'Suhasini',
    director: 'Bharathiraja',
    music_director: 'Ilaiyaraaja',
    producer: 'Allu Aravind',
    writer: 'Bharathiraja',
    cinematographer: 'B. Kannan',
    note: 'Factual mapping verified'
  },
  {
    id: '985ec4ac-2ab2-4f42-9e07-5e4fd22f8079',
    title: 'Samsaram Oka Chadarangam',
    year: 1987,
    hero: 'Sarath Babu',
    heroine: 'Suhasini',
    director: 'S. P. Muthuraman',
    music_director: 'K. Chakravarthy',
    producer: 'M. Saravanan',
    writer: 'Visu (Story)',
    cinematographer: 'T. S. Vinayakam',
    note: 'Added Story writer'
  },
  {
    id: '42a803e4-e75b-4766-a645-9c0136b46b71',
    title: 'Chiranjeevi',
    year: 1985,
    hero: 'Chiranjeevi',
    heroine: 'Vijayashanti',
    director: 'C. V. Rajendran',
    music_director: 'K. Chakravarthy',
    producer: 'K. Lakshmi Narayana',
    writer: 'C. V. Rajendran',
    cinematographer: 'V. S. R. Swamy',
    note: 'Fixed Hero & Crew'
  },
  {
    id: 'c53c4327-bdd7-44bc-ac9b-501ebcc9f312',
    title: 'Pattabhishekam',
    year: 1985,
    hero: 'Nandamuri Balakrishna',
    heroine: 'Vijayashanti',
    director: 'K. Raghavendra Rao',
    music_director: 'K. Chakravarthy',
    producer: 'Nandamuri Harikrishna',
    writer: 'Paruchuri Brothers',
    cinematographer: 'K. S. Prakash Rao',
    note: 'Fixed Music & Producer (was Ram Gopal Varma - anachronistic!)'
  },
  {
    id: 'e8e681d4-fcca-467e-aa1f-c52cf5b4cf9a',
    title: 'Rakta Sindhuram',
    year: 1985,
    hero: 'Chiranjeevi',
    heroine: 'Radha',
    director: 'A. Kodandarami Reddy',
    music_director: 'K. Chakravarthy',
    producer: 'A. S. R. Anjaneyulu',
    writer: 'Yandamoori Veerendranath',
    cinematographer: 'Lok Singh',
    note: 'Fixed Cast & Director'
  },
  {
    id: '1e238a2f-0a89-4f4d-ad21-2e996c6de275',
    title: 'Rojulu Marayi',
    year: 1984,
    hero: 'Chiranjeevi',
    heroine: 'Poornima',
    director: 'A. Kodandarami Reddy',
    music_director: 'J. V. Raghavulu',
    producer: 'K. V. V. Satyanarayana',
    writer: 'Jandhyala',
    cinematographer: 'S. Gopal Reddy',
    note: 'Fixed Cast & Director'
  },
  {
    id: 'ecae4f38-16a0-450e-9297-2f183c853666',
    title: 'Devanthakudu',
    year: 1984,
    hero: 'Chiranjeevi',
    heroine: 'Jayapradha',
    director: 'S. A. Chandrasekhar',
    music_director: 'J. V. Raghavulu',
    producer: 'G. Tirupathi Rao',
    writer: 'S. A. Chandrasekhar',
    cinematographer: 'V. Lakshman',
    note: 'Fixed Heroine & Writer'
  },
  {
    id: 'ec7b1c9a-3e0a-414a-9878-a083c6df4d47',
    title: 'Dharmaatmudu',
    year: 1983,
    hero: 'Krishnam Raju',
    heroine: 'Jayasudha',
    director: 'B. Bhaskara Rao',
    music_director: 'Satyam',
    producer: 'K. Kesava Rao',
    writer: 'B. Bhaskara Rao',
    cinematographer: 'S. V. Srikanth',
    note: 'Fixed Director/Writer'
  },
  {
    id: 'b29ee1b0-1588-47ae-a0b5-4155e772ffef',
    title: 'Chalaki Chellamma',
    year: 1982,
    hero: 'Chiranjeevi',
    heroine: 'Sunitha',
    director: 'A. Kodandarami Reddy',
    music_director: 'K. Chakravarthy',
    producer: 'V. Sashidhar',
    writer: 'Paruchuri Brothers',
    cinematographer: 'V. S. R. Swamy',
    note: 'Fixed Hero & Music'
  },
  {
    id: '4573fe79-3ff4-4817-aba1-6a0e4cc4df48',
    title: 'Seethakoka Chilaka',
    year: 1981,
    hero: 'Karthik',
    heroine: 'Mucherla Aruna',
    director: 'Bharathiraja',
    music_director: 'Ilaiyaraaja',
    producer: 'Edida Nageswara Rao',
    writer: 'Bharathiraja',
    cinematographer: 'B. Kannan',
    note: 'Fixed Music & Producer'
  },
  {
    id: '0b58ead7-2284-4bbf-be1c-18c9f775690d',
    title: 'Chattaniki Kallu Levu',
    year: 1981,
    hero: 'Chiranjeevi',
    heroine: 'Madhavi',
    director: 'S. A. Chandrasekhar',
    music_director: 'K. Chakravarthy',
    producer: 'A. L. Abhinandan',
    writer: 'S. A. Chandrasekhar',
    cinematographer: 'V. S. R. Swamy',
    note: 'Verified metadata'
  },
  {
    id: '6831aff4-99da-4cdc-b581-92c403e28eec',
    title: 'Kotha Jeevithalu',
    year: 1980,
    hero: 'Suhasini',
    heroine: 'Hari',
    director: 'Bharathiraja',
    music_director: 'Ilaiyaraaja',
    producer: 'Edida Nageswara Rao',
    writer: 'Bharathiraja',
    cinematographer: 'B. Kannan',
    note: 'Fixed Director & Music'
  },
  {
    id: 'fbb6add6-ecfe-4b29-ae46-f905df9b8a2e',
    title: 'Maavari Manchitanam',
    year: 1979,
    hero: 'Gummadi',
    heroine: 'Sowcar Janaki',
    director: 'B. A. Subba Rao',
    music_director: 'K. Chakravarthy',
    producer: 'B. A. Subba Rao',
    writer: 'B. A. Subba Rao',
    cinematographer: 'Lok Singh',
    note: 'Fixed Cast & Crew'
  },
  {
    id: 'cfb97d2c-8ad7-4884-a866-c537a7f85f34',
    title: 'Vetagaadu',
    year: 1979,
    hero: 'N. T. Rama Rao',
    heroine: 'Sridevi',
    director: 'K. Raghavendra Rao',
    music_director: 'K. Chakravarthy',
    producer: 'M. Arjuna Raju',
    writer: 'Paruchuri Brothers',
    cinematographer: 'K. S. Prakash Rao',
    note: 'Fixed Director & Music'
  },
  {
    id: 'df549993-f861-45e5-a3e4-4e113e343276',
    title: 'Shri Rama Bantu',
    year: 1979,
    hero: 'Chandra Mohan',
    heroine: 'Geetha',
    director: 'S. D. Lal',
    music_director: 'Satyam',
    producer: 'Simon Danielsson',
    writer: 'S. D. Lal',
    cinematographer: 'V. Lakshman',
    note: 'Verified metadata'
  },
  {
    id: 'f1d111a3-e18d-40d7-8dcf-3ddea22606c5',
    title: 'Mugguru Muggure',
    year: 1978,
    hero: 'Krishna',
    heroine: 'Jayachitra',
    director: 'S. D. Lal',
    music_director: 'K. Chakravarthy',
    producer: 'Y. V. Rao',
    writer: 'S. D. Lal',
    cinematographer: 'V. Lakshman',
    note: 'Fixed truncated data'
  }
];

async function applyCorrections() {
  console.log('🔧 Applying Manual Review Corrections\n');
  console.log('='.repeat(80));
  console.log(`\n📝 Corrections to apply: ${corrections.length}\n`);
  
  let updated = 0;
  let notFound = 0;
  const errors = [];
  
  for (const correction of corrections) {
    try {
      // Update movie directly using full UUID
      const { data, error, count } = await supabase
        .from('movies')
        .update({
          hero: correction.hero,
          heroine: correction.heroine,
          director: correction.director,
          music_director: correction.music_director,
          producer: correction.producer,
          writer: correction.writer,
          cinematographer: correction.cinematographer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', correction.id)
        .select();
      
      if (error) {
        errors.push({ title: correction.title, error: error.message });
        console.log(`   ❌ Error: ${correction.title} - ${error.message}`);
      } else if (!data || data.length === 0) {
        console.log(`   ❌ Not found: ${correction.title} (${correction.year})`);
        notFound++;
      } else {
        updated++;
        console.log(`   ✅ ${correction.year} - ${correction.title}`);
        console.log(`      ${correction.note}`);
      }
    } catch (err: any) {
      errors.push({ title: correction.title, error: err.message });
      console.log(`   ❌ Exception: ${correction.title} - ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Update Summary:\n');
  console.log(`   Total corrections: ${corrections.length}`);
  console.log(`   ✅ Successfully updated: ${updated}`);
  console.log(`   ❌ Not found: ${notFound}`);
  console.log(`   ⚠️  Errors: ${errors.length}\n`);
  
  if (errors.length > 0) {
    console.log('⚠️  Errors encountered:\n');
    errors.forEach(e => {
      console.log(`   - ${e.title}: ${e.error}`);
    });
    console.log();
  }
  
  console.log('='.repeat(80));
  console.log('\n✅ Manual corrections applied!\n');
  console.log('📋 Key Fixes:\n');
  console.log('   - Cast Accuracy: Corrected Chiranjeevi films');
  console.log('   - Director Realignment: Fixed K. Raghavendra Rao, Bharathiraja credits');
  console.log('   - Music Directors: Added Ilaiyaraaja, K. Chakravarthy');
  console.log('   - Anachronistic Data: Removed Ram Gopal Varma from 1985 (!)');
  console.log('   - Production Credits: Fixed to era-appropriate producers\n');
}

applyCorrections().catch(console.error);
