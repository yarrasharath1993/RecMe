#!/usr/bin/env npx tsx
/**
 * Import Telugu Names from Manual Research Batch 5
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
  { slug: 'celeb-kanchanamala', name_te: 'కాంచనమాల' },
  { slug: 'celeb-anil-ravipudi', name_te: 'అనిల్ రావిపూడి' },
  { slug: 'celeb-srihari', name_te: 'శ్రీహరి' },
  { slug: 'celeb-ravali', name_te: 'రవళి' },
  { slug: 'celeb-laya', name_te: 'లయ' },
  { slug: 'celeb-amala-akkineni', name_te: 'అమల అక్కినేని' },
  { slug: 'celeb-lavanya-tripathi', name_te: 'లావణ్య త్రిపాఠి' },
  { slug: 'celeb-kiran-abbavaram', name_te: 'కిరణ్ అబ్బవరం' },
  { slug: 'celeb-pasupuleti-krishna-vamsi', name_te: 'కృష్ణవంశీ' },
  { slug: 'celeb-p-vasu', name_te: 'పి. వాసు' },
  { slug: 'celeb-charmy-kaur', name_te: 'ఛార్మీ కౌర్' },
  { slug: 'celeb-sripriya', name_te: 'శ్రీప్రియ' },
  { slug: 'celeb-nandita-swetha', name_te: 'నందిత శ్వేత' },
  { slug: 'm-radhakrishnan', name_te: 'ఎం. రాధాకృష్ణన్' },
  { slug: 'celeb-t-krishna', name_te: 'టి. కృష్ణ' },
  { slug: 'celeb-akkineni-nagarjuna', name_te: 'అక్కినేని నాగార్జున' },
  { slug: 'y-v-rao', name_te: 'వై. వి. రావు' },
  { slug: 'celeb-tatineni-prakash-rao', name_te: 'తాతినేని ప్రకాశరావు' },
  { slug: 'celeb-k-murali-mohan', name_te: 'కె. మురళీ మోహన్' },
  { slug: 'celeb-tharun-bhascker', name_te: 'తరుణ్ భాస్కర్' },
  { slug: 'celeb-v-ramachandra-rao', name_te: 'వి. రామచంద్రరావు' },
  { slug: 'celeb-saritha', name_te: 'సరిత' },
  { slug: 'celeb-eesha-rebba', name_te: 'ఈషా రెబ్బ' },
  { slug: 'celeb-ruhani-sharma', name_te: 'రుహానీ శర్మ' },
  { slug: 'celeb-ghantasala-balaramayya', name_te: 'ఘంటసాల బలరామయ్య' },
  { slug: 'celeb-shraddha-das', name_te: 'శ్రద్ధా దాస్' },
  { slug: 'celeb-satyadev-kancharana', name_te: 'సత్యదేవ్ కంచరాణ' },
  { slug: 'rajasulochana', name_te: 'రాజసులోచన' },
  { slug: 'celeb-srinivas-avasarala', name_te: 'శ్రీనివాస్ అవసరాల' },
  { slug: 'celeb-sriwass', name_te: 'శ్రీవాస్' },
  { slug: 'celeb-thrigun', name_te: 'త్రిగుణ్' },
  { slug: 'celeb-vinod-kumar', name_te: 'వినోద్ కుమార్' },
  { slug: 'celeb-venu-thottempudi', name_te: 'వేణు తొట్టెంపూడి' },
  { slug: 'celeb-l-v-prasad', name_te: 'ఎల్. వి. ప్రసాద్' },
  { slug: 'celeb-anandhi', name_te: 'ఆనంది' },
  { slug: 'celeb-ashwini', name_te: 'అశ్విని' },
  { slug: 'celeb-b-a-subba-rao', name_te: 'బి. ఎ. సుబ్బారావు' },
  { slug: 'celeb-a-karunakaran', name_te: 'ఎ. కరుణాకరన్' },
  { slug: 'celeb-bellamkonda-srinivas', name_te: 'బెల్లంకొండ శ్రీనివాస్' },
  { slug: 'celeb-c-s-r-anjaneyulu', name_te: 'సి. ఎస్. ఆర్. ఆంజనేయులు' },
  { slug: 'celeb-sampoornesh-babu', name_te: 'సంపూర్ణేష్ బాబు' },
  { slug: 'celeb-anu-emmanuel', name_te: 'అను ఇమ్మాన్యుయేల్' },
  { slug: 'celeb-surender-reddy', name_te: 'సురేందర్ రెడ్డి' },
  { slug: 'celeb-rahul-ravindran', name_te: 'రాహుల్ రవీంద్రన్' },
  { slug: 'celeb-r-s-prakash', name_te: 'ఆర్. ఎస్. ప్రకాష్' },
  { slug: 'celeb-chandra-siddhartha', name_te: 'చంద్ర సిద్ధార్థ' },
  { slug: 'celeb-suman-talwar', name_te: 'సుమన్ తల్వార్' },
  { slug: 'celeb-sairam-shankar', name_te: 'సాయిరామ్ శంకర్' },
  { slug: 'celeb-chandra-mahesh', name_te: 'చంద్ర మహేష్' },
  { slug: 'celeb-nandu-vijay-krishna', name_te: 'నందు విజయ్ కృష్ణ' },
];

async function importTeluguNames() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT TELUGU NAMES BATCH 5                                  ║');
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
