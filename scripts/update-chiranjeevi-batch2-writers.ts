import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateBatch2Writers() {
  console.log('📝 Updating Batch 2 (75 films) with writer credits...\n');
  
  let successCount = 0;
  let errorCount = 0;

  const updates = [
    { slug: 'lankeswarudu-1989', data: { writer: 'Dasari Narayana Rao' } },
    { slug: 'state-rowdy-1989', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'rudranetra-1989', data: { writer: 'Yandamoori Veerendranath' } },
    { slug: 'yuddha-bhoomi-1988', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'inspector-pratap-1988', data: { writer: 'Muthyala Subbaiah' } },
    { slug: 'khaidi-no786-1988', data: { writer: 'Vijaya Bapineedu' } },
    { slug: 'trinetrudu-1988', data: { writer: 'A. Kodandarami Reddy' } },
    { slug: 'marana-mrudangam-1988', data: { writer: 'Yandamoori Veerendranath' } },
    { slug: 'rudraveena-1988', data: { writer: 'K. Balachander' } },
    { slug: 'antima-teerpu-1988', data: { writer: 'Dennis Joseph' } },
    { slug: 'yamudiki-mogudu-1988', data: { writer: 'Satyanand' } },
    { slug: 'pasivadi-pranam-1987', data: { writer: 'Satyanand' } },
    { slug: 'aradhana-1987', data: { writer: 'Bharathiraja' } },
    { slug: 'swayamkrushi-1987', data: { writer: 'K. Viswanath', producer: 'Poornodaya Movie Creations' } },
    { slug: 'donga-mogudu-1987', data: { writer: 'Yandamoori Veerendranath' } },
    { slug: 'chakravarthy-1987', data: { writer: 'Paruchuri Brothers', producer: 'Vyjayanthi Movies' } },
    { slug: 'kondaveeti-raja-1986', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'magadheerudu-1986', data: { writer: 'Vijaya Bapineedu' } },
    { slug: 'chantabbai-1986', data: { writer: 'Malladi Venkata Krishna Murthy' } },
    { slug: 'kirathakudu-1986', data: { writer: 'Yandamoori Veerendranath' } },
    { slug: 'dhairyavanthudu-1986', data: { writer: 'Laxmi Deepak' } },
    { slug: 'chanakya-sapatham-1986', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'vijetha-1985', data: { writer: 'Satyanand' } },
    { slug: 'chattamtho-poratam-1985', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'jwala-1985', data: { writer: 'Satyanand', producer: 'Vyjayanthi Movies' } },
    { slug: 'rakta-sindhuram-1985', data: { writer: 'Yandamoori Veerendranath' } },
    { slug: 'donga-1985', data: { writer: 'Satyanand' } },
    { slug: 'koteeswarudu-1984', data: { writer: 'Kommineni' } },
    { slug: 'devanthakudu-1984', data: { writer: 'S. A. Chandrasekhar' } },
    { slug: 'rojulu-marayi-1984', data: { writer: 'G. Ramamohana Rao' } },
    { slug: 'inti-guttu-1984', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'mahanagaramlo-mayagadu-1984', data: { writer: 'Vijaya Bapineedu' } },
    { slug: 'goonda-1984', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'rustum-1984', data: { writer: 'Satyanand' } },
    { slug: 'naagu-1984', data: { writer: 'Tatineni Prasad' } },
    { slug: 'hero-1984', data: { writer: 'Vijaya Bapineedu' } },
    { slug: 'rana-1984', data: { writer: 'Satyanand', music_director: 'K. Chakravarthy' } },
    { slug: 'gudachari-no1-1983', data: { writer: 'Kodi Ramakrishna' } },
    { slug: 'maga-maharaju-1983', data: { writer: 'Vijaya Bapineedu' } },
    { slug: 'palleturi-monagadu-1983', data: { writer: 'S. A. Chandrasekhar' } },
    { slug: 'maro-maya-bazaar-1983', data: { writer: 'C. S. Rao' } },
    { slug: 'puli-bebbuli-1983', data: { writer: 'K. S. R. Das' } },
    { slug: 'sangharshana-1983', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'prema-pichollu-1983', data: { writer: 'A. Kodandarami Reddy' } },
    { slug: 'shivudu-shivudu-shivudu-1983', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'roshagadu-1983', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'simhapuri-simham-1983', data: { writer: 'Kodi Ramakrishna' } },
    { slug: 'khaidi-1983', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'abhilasha-1983', data: { writer: 'Yandamoori Veerendranath' } },
    { slug: 'illanta-sandadi-1982', data: { writer: 'Relangi Narasimha Rao' } },
    { slug: 'jaggu-1982', data: { writer: 'P. Sambasiva Rao' } },
    { slug: 'bandhalu-anubandhalu-1982', data: { writer: 'Bhargava', producer: 'S. P. Bhargava' } },
    { slug: 'tingu-rangadu-1982', data: { writer: 'Satyanand' } },
    { slug: 'subhalekha-1982', data: { writer: 'K. Viswanath' } },
    { slug: 'manchu-pallaki-1982', data: { writer: 'Vamsy' } },
    { slug: 'billa-ranga-1982', data: { writer: 'Paruchuri Brothers' } },
    { slug: 'nyayam-kavali-1981', data: { writer: 'D. Kaluvala' } },
    { slug: 'patnam-vachina-pativrathalu-1981', data: { writer: 'Mouli' } },
    { slug: 'srirasthu-subhamasthu-1981', data: { writer: 'P. Sambasiva Rao' } },
    { slug: 'oorukichina-maata-1981', data: { writer: 'M. Balaiah' } },
    { slug: 'chattaniki-kallu-levu-1981', data: { writer: 'S. A. Chandrasekhar' } },
    { slug: 'punnami-naagu-1980', data: { writer: 'M. Rajendra Prasad' } },
    { slug: 'mogudu-kaavali-1980', data: { writer: 'K. Kattama Raju' } },
    { slug: 'jathara-1980', data: { writer: 'Dhavala Satyam' } },
    { slug: 'agni-samskaram-1980', data: { writer: 'G. V. Prabhakar' } },
    { slug: 'aarani-mantalu-1980', data: { writer: 'K. Vasu' } },
    { slug: 'chandipriya-1980', data: { writer: 'V. Madhusudhan Rao' } },
    { slug: 'rakta-bandham-1980', data: { writer: 'Aluri Ravi' } },
    { slug: 'thathayya-premaleelalu-1980', data: { writer: 'B. V. Prasad' } },
    { slug: 'love-in-singapore-1980', data: { writer: 'O. S. R. Das' } },
    { slug: 'nakili-manishi-1980', data: { writer: 'Satyanand', producer: 'Vijaya Madhavi Combines' } },
    { slug: 'kukka-katuku-cheppu-debba-1979', data: { writer: 'Eeranki Sharma' } },
    { slug: 'sri-rama-bantu-1979', data: { writer: 'I.S. Murthy' } },
    { slug: 'kothala-raayudu-1979', data: { writer: 'K. Vasu' } },
    { slug: 'i-love-you-1979', data: { writer: 'Vayu Nandana Rao' } }
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
  console.log('\n✨ Batch 2 writers updated!\n');
}

updateBatch2Writers().catch(console.error);
