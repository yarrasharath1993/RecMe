#!/usr/bin/env npx tsx
/**
 * Import Family Trees from Manual Research Batch 1
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Family data structure based on research
const familyData = {
  'Nandamuri Dynasty': {
    members: [
      { slug: 'celeb-n-t-rama-rao', relations: { spouse: 'Basavatarakam (deceased), Lakshmi Parvathi', children: ['Harikrishna', 'Balakrishna', 'Ramakrishna Jr'] } },
      { slug: 'celeb-nandamuri-balakrishna', relations: { parents: ['N.T. Rama Rao'], siblings: ['Harikrishna (deceased)'], children: ['Mokshagna', 'Brahmani', 'Tejaswini'] } },
      { slug: 'jr-ntr', relations: { parents: ['Nandamuri Harikrishna (deceased)'], relatives: ['N.T. Rama Rao (grandfather)', 'Kalyan Ram (brother)'] } },
      { slug: 'nandamuri-kalyan-ram', relations: { parents: ['Nandamuri Harikrishna (deceased)'], relatives: ['N.T. Rama Rao (grandfather)', 'Jr NTR (brother)'] } },
    ]
  },
  'Akkineni Dynasty': {
    members: [
      { slug: 'akkineni-nageswara-rao', relations: { spouse: 'Annapurna', children: ['Akkineni Nagarjuna', 'Venkat'] } },
      { slug: 'akkineni-nagarjuna', relations: { parents: ['Akkineni Nageswara Rao'], spouse: 'Amala Akkineni', children: ['Naga Chaitanya', 'Akhil Akkineni'] } },
      { slug: 'naga-chaitanya', relations: { parents: ['Akkineni Nagarjuna', 'Amala Akkineni'], relatives: ['Akkineni Nageswara Rao (grandfather)', 'Akhil Akkineni (brother)'] } },
      { slug: 'akhil-akkineni', relations: { parents: ['Akkineni Nagarjuna', 'Amala Akkineni'], relatives: ['Akkineni Nageswara Rao (grandfather)', 'Naga Chaitanya (brother)'] } },
      { slug: 'celeb-sumanth', relations: { parents: ['Venkat Akkineni'], relatives: ['Akkineni Nageswara Rao (grandfather)', 'Akkineni Nagarjuna (uncle)'] } },
    ]
  },
  'Ghattamaneni Dynasty': {
    members: [
      { slug: 'celeb-krishna', relations: { spouse: 'Indira Devi, Vijaya Nirmala', children: ['Ramesh Babu', 'Mahesh Babu', 'Manjula', 'Padmavathi', 'Priyadarshini'] } },
      { slug: 'mahesh-babu', relations: { parents: ['Krishna', 'Indira Devi'], spouse: 'Namrata Shirodkar', children: ['Gautam Krishna', 'Sitara'], siblings: ['Ramesh Babu (deceased)', 'Manjula'] } },
    ]
  },
  'Daggubati Dynasty': {
    members: [
      { slug: 'celeb-daggubati-venkatesh', relations: { parents: ['D. Ramanaidu'], siblings: ['Suresh Babu'] } },
      { slug: 'rana-daggubati', relations: { parents: ['Suresh Babu'], relatives: ['D. Ramanaidu (grandfather)', 'Daggubati Venkatesh (uncle)'] } },
    ]
  },
  'Allu-Konidela Dynasty': {
    members: [
      { slug: 'chiranjeevi', relations: { spouse: 'Surekha (Allu Aravind sister)', children: ['Ram Charan', 'Sushmita', 'Sreeja'], siblings: ['Pawan Kalyan', 'Nagendra Babu'] } },
      { slug: 'ram-charan', relations: { parents: ['Chiranjeevi', 'Surekha'], spouse: 'Upasana Kamineni' } },
      { slug: 'allu-arjun', relations: { parents: ['Allu Aravind'], relatives: ['Chiranjeevi (uncle)', 'Ram Charan (cousin)'] } },
      { slug: 'pawan-kalyan', relations: { siblings: ['Chiranjeevi', 'Nagendra Babu'] } },
    ]
  },
  'Manchu Dynasty': {
    members: [
      { slug: 'mohan-babu', relations: { spouse: 'Nirmala Devi', children: ['Lakshmi Manchu', 'Vishnu Manchu', 'Manoj Manchu'] } },
      { slug: 'celeb-vishnu', relations: { parents: ['Mohan Babu'], siblings: ['Lakshmi Manchu', 'Manoj Manchu'] } },
    ]
  }
};

async function importFamilyTrees() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT FAMILY TREES BATCH 1                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m\n');

  let updated = 0;
  let errors = 0;
  let notFound = 0;

  for (const [dynasty, data] of Object.entries(familyData)) {
    console.log('\x1b[37m\nProcessing: \x1b[1m' + dynasty + '\x1b[0m (' + data.members.length + ' members)');

    for (const member of data.members) {
      const { data: celeb } = await supabase
        .from('celebrities')
        .select('id, name_en')
        .eq('slug', member.slug)
        .single();

      if (!celeb) {
        console.log('\x1b[33m  ⚠\x1b[0m', member.slug, '- Not found in database');
        notFound++;
        continue;
      }

      const { error } = await supabase
        .from('celebrities')
        .update({ family_relationships: member.relations })
        .eq('id', celeb.id);

      if (error) {
        console.log('\x1b[31m  ✗\x1b[0m', celeb.name_en, '-', error.message);
        errors++;
      } else {
        console.log('\x1b[32m  ✓\x1b[0m', celeb.name_en, '- Family data added');
        updated++;
      }
    }
  }

  console.log('\n\x1b[36m\x1b[1m╔═══════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m\x1b[1m║                        SUMMARY                                         ║\x1b[0m');
  console.log('\x1b[36m\x1b[1m╚═══════════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  console.log('\x1b[32m✅ Successfully Updated: \x1b[0m', updated);
  console.log('\x1b[33m⚠  Not Found:            \x1b[0m', notFound);
  if (errors > 0) {
    console.log('\x1b[31m✗ Errors:                \x1b[0m', errors);
  }
  console.log('Dynasties Processed:     ', Object.keys(familyData).length, '\n');
}

importFamilyTrees().catch(console.error);
