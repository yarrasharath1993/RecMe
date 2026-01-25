#!/usr/bin/env npx tsx
/**
 * Import Telugu Names from Manual Research Batch 4
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const teluguNamesData = [
  { slug: 'celeb-sree-vishnu', name_te: 'శ్రీ విష్ణు' },
  { slug: 'celeb-jayanthi', name_te: 'జయంతి' },
  { slug: 'celeb-aamani', name_te: 'ఆమని' },
  { slug: 'celeb-mamta-mohandas', name_te: 'మమతా మోహన్ దాస్' },
  { slug: 'celeb-archana', name_te: 'అర్చన' },
  { slug: 'celeb-suhasini-maniratnam', name_te: 'సుహాసిని మణిరత్నం' },
  { slug: 'celeb-k-s-prakash-rao', name_te: 'కె. ఎస్. ప్రకాశరావు' },
  { slug: 'celeb-raashii-khanna', name_te: 'రాశి ఖన్నా' },
  { slug: 'celeb-sreenu-vaitla', name_te: 'శ్రీను వైట్ల' },
  { slug: 'celeb-poorna', name_te: 'పూర్ణ' },
  { slug: 'celeb-v-madhusudhan-rao', name_te: 'వి. మధుసూధనరావు' },
  { slug: 'celeb-haranath', name_te: 'హరనాథ్' },
  { slug: 'celeb-bharathiraja', name_te: 'భారతీరాజా' },
  { slug: 'celeb-nithya-menen', name_te: 'నిత్యా మీనన్' },
  { slug: 'celeb-nandu', name_te: 'నందు' },
  { slug: 'celeb-sai-kumar', name_te: 'సాయి కుమార్' },
  { slug: 'celeb-samuthirakani', name_te: 'సముద్రఖని' },
  { slug: 'celeb-gautami', name_te: 'గౌతమి' },
  { slug: 'celeb-jeeva', name_te: 'జీవా' },
  { slug: 'celeb-k-vijaya-bhaskar', name_te: 'కె. విజయభాస్కర్' },
  { slug: 'celeb-v-v-vinayak', name_te: 'వి. వి. వినాయక్' },
  { slug: 'celeb-avika-gor', name_te: 'అవికా గోర్' },
  { slug: 'celeb-posani-krishna-murali', name_te: 'పోసాని కృష్ణ మురళి' },
  { slug: 'celeb-sreeleela', name_te: 'శ్రీలీల' },
  { slug: 'celeb-adivi-sesh', name_te: 'అడివి శేష్' },
  { slug: 'celeb-srinivasa-reddy', name_te: 'శ్రీనివాస రెడ్డి' },
  { slug: 'celeb-b-v-prasad', name_te: 'బి. వి. ప్రసాద్' },
  { slug: 'celeb-kota-srinivasa-rao', name_te: 'కోట శ్రీనివాసరావు' },
  { slug: 'celeb-varun-tej', name_te: 'వరుణ్ తేజ్' },
  { slug: 'celeb-sudheer-varma', name_te: 'సుధీర్ వర్మ' },
  { slug: 'celeb-prema', name_te: 'ప్రేమ' },
  { slug: 'celeb-vani-viswanath', name_te: 'వాణీ విశ్వనాథ్' },
  { slug: 'celeb-harish-shankar', name_te: 'హరీష్ శంకర్' },
  { slug: 'celeb-maheswari', name_te: 'మహేశ్వరి' },
  { slug: 'celeb-santosh-shoban', name_te: 'సంతోష్ శోభన్' },
  { slug: 'celeb-lakshmi-manchu', name_te: 'మంచు లక్ష్మి' },
  { slug: 'celeb-payal-rajput', name_te: 'పాయల్ రాజ్ పుత్' },
  { slug: 'celeb-gautham-vasudev-menon', name_te: 'గౌతమ్ వాసుదేవ్ మీనన్' },
  { slug: 'celeb-c-pullaiah', name_te: 'సి.పుల్లయ్య' },
  { slug: 'celeb-v-samudra', name_te: 'వి. సముద్ర' },
  { slug: 'celeb-tanikella-bharani', name_te: 'తనికెళ్ళ భరణి' },
  { slug: 'celeb-tulasi', name_te: 'తులసి' },
  { slug: 'celeb-gajala', name_te: 'గజాల' },
  { slug: 'celeb-kranthi-kumar', name_te: 'క్రాంతి కుమార్' },
  { slug: 'celeb-amala-akkineni', name_te: 'అమల అక్కినేని' },
  { slug: 'celeb-srihari', name_te: 'శ్రీహరి' },
  { slug: 'celeb-anil-ravipudi', name_te: 'అనిల్ రావిపూడి' },
  { slug: 'm-radhakrishnan', name_te: 'ఎం. రాధాకృష్ణన్' },
  { slug: 'celeb-t-krishna', name_te: 'టి. కృష్ణ' },
  { slug: 'celeb-kaveri', name_te: 'కావేరి' },
];

async function importTeluguNames() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT TELUGU NAMES BATCH 4                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const celeb of teluguNamesData) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name_en, name_te')
      .eq('slug', celeb.slug)
      .single();

    if (!celebrity) {
      console.log('\x1b[31m✗\x1b[0m Celebrity not found:', celeb.slug);
      errors++;
      continue;
    }

    if (celebrity.name_te && celebrity.name_te === celeb.name_te) {
      console.log('\x1b[33m  ⊘\x1b[0m', celebrity.name_en, '- Already has Telugu name');
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('celebrities')
      .update({
        name_te: celeb.name_te,
      })
      .eq('id', celebrity.id);

    if (error) {
      console.log('\x1b[31m  ✗\x1b[0m', celebrity.name_en, '-', error.message);
      errors++;
    } else {
      console.log('\x1b[32m  ✓\x1b[0m', celebrity.name_en, '→', celeb.name_te);
      imported++;
    }
  }

  console.log('\n\x1b[36m\x1b[1m╔═══════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m\x1b[1m║                        SUMMARY                                         ║\x1b[0m');
  console.log('\x1b[36m\x1b[1m╚═══════════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  console.log('Total Names Processed:    ', teluguNamesData.length);
  console.log('\x1b[32m✅ Successfully Imported: \x1b[0m', imported);
  console.log('\x1b[33m⊘ Skipped (Existing):     \x1b[0m', skipped);
  if (errors > 0) {
    console.log('\x1b[31m✗ Errors:                 \x1b[0m', errors);
  }
  console.log('');
}

importTeluguNames().catch(console.error);
