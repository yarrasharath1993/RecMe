import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyAllUpdates() {
  console.log('🔄 Applying all reviewed data updates...\n');
  let successCount = 0;
  let errorCount = 0;

  const updates = [
    { slug: 'msvp-2026', data: { writer: 'Anil Ravipudi' }},
    { slug: 'mega-159-2026', data: { cinematographer: 'Sathyan Sooryan', crew: { editor: 'Naveen Nooli' }, writer: 'Srikanth Odela', tmdb_id: 1382410 }},
    { slug: 'vishwambhara-2026', data: { writer: 'Mallidi Vassishta' }},
    { slug: 'auto-jaani-2026', data: { cinematographer: 'Shyam K. Naidu', crew: { editor: 'S. R. Shekhar' }, writer: 'Puri Jagannadh', producer: 'Puri Jagannadh', tmdb_id: 341935 }},
    { slug: 'rudra-tandava-2015', data: { music_director: 'V. Harikrishna', cinematographer: 'Jagadish Vali', crew: { editor: 'K. M. Prakash' }, writer: 'Suseenthiran', producer: 'S. Vinod Kumar' }},
    { slug: 'aatagara-2015', data: { music_director: 'Anoop Seelin', cinematographer: 'Satya Hegde', crew: { editor: 'P. Haridoss' }, writer: 'Kannan Parameshwaran', producer: 'Dwarakish' }},
    { slug: 'alluda-majaka-1995', data: { crew: { editor: 'Kotagiri Venkateswara Rao' }}},
    { slug: 'mugguru-monagallu-1994', data: { writer: 'Satyanand' }},
    { slug: 'sp-parasuram-1994', data: { crew: { editor: 'Gautham Raju' }}},
    { slug: 'mechanic-alludu-1993', data: { crew: { editor: 'Kotagiri Venkateswara Rao' }}},
    { slug: 'raja-vikramarka-1990', data: { crew: { editor: 'Gautham Raju' }}},
    { slug: 'attaku-yamudu-ammayiki-mogudu-1989', data: { crew: { editor: 'Gautham Raju' }}},
    { slug: 'manchi-donga-1988', data: { writer: 'Satyanand' }},
    { slug: 'jebu-donga-1987', data: { crew: { editor: 'Gautham Raju' }, writer: 'A. Kodandarami Reddy' }},
    { slug: 'veta-1986', data: { writer: 'A. Kodandarami Reddy' }},
    { slug: 'adavi-donga-1985', data: { writer: 'Satyanand' }},
    { slug: 'allullostunnaru-1984', data: { crew: { editor: 'G.G. Krishna Rao' }}},
    { slug: 'agni-gundam-1984', data: { crew: { editor: 'G.G. Krishna Rao' }}},
    { slug: 'challenge-1984', data: { crew: { editor: 'Gautham Raju' }}},
    { slug: 'mantri-gari-viyyankudu-1983', data: { crew: { editor: 'G.G. Krishna Rao' }}},
    { slug: 'aalaya-sikharam-1983', data: { crew: { editor: 'Gautham Raju' }}},
    { slug: 'idi-pellantara-1982', data: { writer: 'Vijay Bhaskar' }},
    { slug: 'sitadevi-1982', data: { crew: { editor: 'K. Balu' }, writer: 'Eranki Sharma' }},
    { slug: 'radha-my-darling-1982', data: { crew: { editor: 'K. Satyam' }}},
    { slug: 'mondi-ghatam-1982', data: { crew: { editor: 'Gautham Raju' }, writer: 'Satyanand' }},
    { slug: 'yamakinkarudu-1982', data: { crew: { editor: 'Gautham Raju' }, writer: 'Raj Bharat' }},
    { slug: 'todu-dongalu-1981', data: { writer: 'K. Vasu' }},
    { slug: 'parvathi-parameswarulu-1981', data: { crew: { editor: 'K. Satyam' }, writer: 'M. S. Kota Reddy' }},
    { slug: 'tirugu-leni-manishi-1981', data: { writer: 'Satyanand' }},
    { slug: 'kirayi-rowdylu-1981', data: { writer: 'Satyanand' }},
    { slug: 'kotta-alludu-1979', data: { writer: 'Satyanand' }}
  ];

  for (const { slug, data } of updates) {
    const { data: existing } = await supabase
      .from('movies')
      .select('crew')
      .eq('slug', slug)
      .single();

    const updatePayload: any = { ...data };
    
    if (data.crew && existing?.crew) {
      updatePayload.crew = { ...existing.crew, ...data.crew };
    }

    const { error } = await supabase
      .from('movies')
      .update(updatePayload)
      .eq('slug', slug);

    if (error) {
      console.log(`❌ ${slug}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`✅ Updated ${slug}`);
      successCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${updates.length}`);
  console.log('\n✨ All updates complete!\n');
}

applyAllUpdates().catch(console.error);
