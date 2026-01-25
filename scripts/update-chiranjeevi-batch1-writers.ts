import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateBatch1Writers() {
  console.log('📝 Updating Batch 1 (38 films) with writer credits...\n');
  
  let successCount = 0;
  let errorCount = 0;

  const updates = [
    {
      slug: 'waltair-veerayya-2023',
      data: { writer: 'Bobby Kolli' }
    },
    {
      slug: 'bhola-shankar-2023',
      data: { writer: 'Meher Ramesh' }
    },
    {
      slug: 'acharya-2022',
      data: { writer: 'Koratala Siva' }
    },
    {
      slug: 'godfather-2022',
      data: { writer: 'Mohan Raja', producer: 'Konidela Production Company' }
    },
    {
      slug: 'sye-raa-narasimha-reddy-2019',
      data: { writer: 'Paruchuri Brothers', producer: 'Konidela Production Company' }
    },
    {
      slug: 'khaidi-no-150-2017',
      data: { writer: 'V.V. Vinayak', producer: 'Konidela Production Company' }
    },
    {
      slug: 'shankar-dada-zindabad-2007',
      data: { writer: 'Prabhu Deva' }
    },
    {
      slug: 'stalin-2006',
      data: { writer: 'A.R. Murugadoss' }
    },
    {
      slug: 'jai-chiranjeeva-2005',
      data: { writer: 'Trivikram Srinivas' }
    },
    {
      slug: 'andarivadu-2005',
      data: { writer: 'Srinu Vaitla' }
    },
    {
      slug: 'anji-2004',
      data: { writer: 'Kodi Ramakrishna' }
    },
    {
      slug: 'shankar-dada-m-b-b-s-2004',
      data: { writer: 'Jayanth C. Paranjee', producer: 'Gemini Film Circuit' }
    },
    {
      slug: 'tagore-2003',
      data: { writer: 'A.R. Murugadoss' }
    },
    {
      slug: 'indra-2002',
      data: { writer: 'Yandamuri Veerendranath' }
    },
    {
      slug: 'daddy-2001',
      data: { writer: 'Suresh Krissna' }
    },
    {
      slug: 'mrugaraju-2001',
      data: { writer: 'Gunasekhar' }
    },
    {
      slug: 'annayya-2000',
      data: { writer: 'Muthyala Subbaiah' }
    },
    {
      slug: 'sneham-kosam-1999',
      data: { writer: 'K.S. Ravikumar' }
    },
    {
      slug: 'iddaru-mitrulu-1999',
      data: { writer: 'Satyanand' }
    },
    {
      slug: 'bavagaru-bagunnara-1998',
      data: { writer: 'Jayanth C. Paranjee' }
    },
    {
      slug: 'choodalani-vundi-1998',
      data: { writer: 'Gunasekhar' }
    },
    {
      slug: 'master-1997',
      data: { writer: 'Suresh Krissna' }
    },
    {
      slug: 'hitler-1997',
      data: { writer: 'Muthyala Subbaiah' }
    },
    {
      slug: 'rikshavodu-1995',
      data: { writer: 'Puri Jagannadh' }
    },
    {
      slug: 'big-boss-1995',
      data: { writer: 'Vijaya Bapineedu' }
    },
    {
      slug: 'the-gentleman-1994',
      data: { writer: 'Mahesh Bhatt' }
    },
    {
      slug: 'muta-mestri-1993',
      data: { writer: 'Satyanand' }
    },
    {
      slug: 'gharana-mogudu-1992',
      data: { writer: 'Satyanand' }
    },
    {
      slug: 'aapadbandhavudu-1992',
      data: { writer: 'K. Viswanath' }
    },
    {
      slug: 'aaj-ka-goonda-raaj-1992',
      data: { writer: 'Ravi Raja Pinisetty' }
    },
    {
      slug: 'stuvartpuram-dongalu-1991',
      data: { writer: 'Malineni Lakshman' }
    },
    {
      slug: 'gang-leader-1991',
      data: { writer: 'Vijaya Bapineedu' }
    },
    {
      slug: 'stuartpuram-police-station-1991',
      data: { writer: 'Yandamuri Veerendranath' }
    },
    {
      slug: 'rowdy-alludu-1991',
      data: { writer: 'Satyanand' }
    },
    {
      slug: 'kondaveeti-donga-1990',
      data: { writer: 'Yandamuri Veerendranath' }
    },
    {
      slug: 'pratibandh-1990',
      data: { writer: 'Ravi Raja Pinisetty' }
    },
    {
      slug: 'kodama-simham-1990',
      data: { writer: 'Satyanand' }
    },
    {
      slug: 'jagadeka-veerudu-athiloka-sundari-1990',
      data: { writer: 'Jandhyala' }
    }
  ];

  for (const update of updates) {
    const { slug, data } = update;

    const { error } = await supabase
      .from('movies')
      .update(data)
      .eq('slug', slug);

    if (error) {
      console.log(`❌ Error updating ${slug}:`, error.message);
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
  console.log('\n✨ Batch 1 writers updated!\n');
}

updateBatch1Writers().catch(console.error);
