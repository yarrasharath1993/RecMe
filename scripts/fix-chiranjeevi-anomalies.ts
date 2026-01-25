import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixChiranjeeviAnomalies() {
  console.log('🔧 Fixing Chiranjeevi filmography anomalies...\n');
  
  let successCount = 0;
  let errorCount = 0;

  // 2026 Films
  const updates2026 = [
    {
      slug: 'msvp-2026',
      data: {
        title_en: 'Mana Shankara Vara Prasad Garu',
        director: 'Anil Ravipudi',
        crew: { editor: 'Tammi Raju' },
        cinematographer: 'Sameer Reddy',
        writer: 'Anil Ravipudi',
        producer: 'Sahu Garapati',
        tmdb_id: 1146313
      }
    },
    {
      slug: 'mega-159-2026',
      data: {
        title_en: 'Mega 159',
        director: 'Srikanth Odela',
        crew: { editor: 'Naveen Nooli' },
        cinematographer: 'Sathyan Sooryan',
        writer: 'Srikanth Odela',
        producer: 'Sudhakar Cherukuri',
        tmdb_id: 1382410
      }
    },
    {
      slug: 'vishwambhara-2026',
      data: {
        director: 'Vassishta',
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        cinematographer: 'Chota K. Naidu',
        writer: 'Mallidi Vassishta',
        producer: 'Vamsi-Pramod',
        tmdb_id: 1211111
      }
    }
  ];

  // Kannada Films (Chiranjeevi Sarja)
  const kannadaFilms = [
    {
      slug: 'rudra-tandava-2015',
      data: {
        director: 'Guru Deshpande',
        crew: { editor: 'K. M. Prakash' },
        cinematographer: 'Jagadish Vali',
        writer: 'Suseenthiran',
        producer: 'S. Vinod Kumar',
        tmdb_id: 540012
      }
    },
    {
      slug: 'aatagara-2015',
      data: {
        director: 'K. M. Chaitanya',
        crew: { editor: 'P. Haridoss' },
        cinematographer: 'Satya Hegde',
        writer: 'Kannan Parameshwaran',
        producer: 'Dwarakish',
        tmdb_id: 400859
      }
    }
  ];

  // 1990s Films with corrected Editor/Writer
  const films1990s = [
    {
      slug: 'alluda-majaka-1995',
      data: {
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'E.V.V. Satyanarayana'
      }
    },
    {
      slug: 'mugguru-monagallu-1994',
      data: {
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'Satyanand'
      }
    },
    {
      slug: 'sp-parasuram-1994',
      data: {
        crew: { editor: 'Gautham Raju' },
        writer: 'Ravi Raja Pinisetty'
      }
    },
    {
      slug: 'mechanic-alludu-1993',
      data: {
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'Satyanand'
      }
    },
    {
      slug: 'raja-vikramarka-1990',
      data: {
        crew: { editor: 'Gautham Raju' },
        writer: 'Paltu'
      }
    }
  ];

  // 1980s Films with corrected Editor/Writer
  const films1980s = [
    {
      slug: 'attaku-yamudu-ammayiki-mogudu-1989',
      data: {
        crew: { editor: 'Gautham Raju' },
        writer: 'A. Kodandarami Reddy'
      }
    },
    {
      slug: 'manchi-donga-1988',
      data: {
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'Satyanand'
      }
    },
    {
      slug: 'jebu-donga-1987',
      data: {
        crew: { editor: 'Gautham Raju' },
        writer: 'A. Kodandarami Reddy'
      }
    },
    {
      slug: 'veta-1986',
      data: {
        crew: { editor: 'Gautham Raju' },
        writer: 'A. Kodandarami Reddy'
      }
    },
    {
      slug: 'adavi-donga-1985',
      data: {
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'Satyanand'
      }
    },
    {
      slug: 'allullostunnaru-1984',
      data: {
        crew: { editor: 'G.G. Krishna Rao' },
        writer: 'Jandhyala'
      }
    },
    {
      slug: 'agni-gundam-1984',
      data: {
        crew: { editor: 'G.G. Krishna Rao' },
        writer: 'Kranthi Kumar'
      }
    },
    {
      slug: 'challenge-1984',
      data: {
        crew: { editor: 'Gautham Raju' },
        writer: 'Yandamoori Veerendranath'
      }
    },
    {
      slug: 'mantri-gari-viyyankudu-1983',
      data: {
        crew: { editor: 'G.G. Krishna Rao' },
        writer: 'Mullapudi Venkata Ramana'
      }
    },
    {
      slug: 'aalaya-sikharam-1983',
      data: {
        crew: { editor: 'Gautham Raju' },
        writer: 'Kodi Ramakrishna'
      }
    }
  ];

  // Early 1980s Films
  const filmsEarly1980s = [
    {
      slug: 'idi-pellantara-1982',
      data: {
        crew: { editor: 'G.G. Krishna Rao' },
        writer: 'Vijay Bhaskar',
        tmdb_id: 1536091
      }
    },
    {
      slug: 'sitadevi-1982',
      data: {
        crew: { editor: 'K. Balu' },
        cinematographer: 'G. Sivaram',
        writer: 'Eranki Sharma',
        producer: 'Chakravarthy',
        tmdb_id: 114631
      }
    },
    {
      slug: 'radha-my-darling-1982',
      data: {
        crew: { editor: 'K. Satyam' },
        writer: 'Maddhipatla Suri'
      }
    },
    {
      slug: 'mondi-ghatam-1982',
      data: {
        director: 'Raja Chandra',
        crew: { editor: 'Gautham Raju' },
        cinematographer: 'P. Chengaiah',
        writer: 'Satyanand',
        producer: 'Daggubati Bhaskara Rao',
        tmdb_id: 279346
      }
    },
    {
      slug: 'yamakinkarudu-1982',
      data: {
        director: 'Raj Bharat',
        crew: { editor: 'Gautham Raju' },
        writer: 'Raj Bharat',
        tmdb_id: 279345
      }
    }
  ];

  // 1981-1979 Films
  const filmsLate1970s = [
    {
      slug: 'todu-dongalu-1981',
      data: {
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'K. Vasu',
        tmdb_id: 279353
      }
    },
    {
      slug: 'parvathi-parameswarulu-1981',
      data: {
        crew: { editor: 'K. Satyam' },
        cinematographer: 'C. Nageswara Rao',
        writer: 'M. S. Kota Reddy'
      }
    },
    {
      slug: 'tirugu-leni-manishi-1981',
      data: {
        director: 'K. Raghavendra Rao',
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        cinematographer: 'K.S. Prakash',
        writer: 'Satyanand',
        tmdb_id: 313177
      }
    },
    {
      slug: 'kirayi-rowdylu-1981',
      data: {
        crew: { editor: 'Gautham Raju' },
        writer: 'Satyanand'
      }
    },
    {
      slug: 'kotta-alludu-1979',
      data: {
        crew: { editor: 'G.G. Krishna Rao' },
        writer: 'Satyanand',
        tmdb_id: 246011
      }
    }
  ];

  // Combine all updates
  const allUpdates = [
    ...updates2026,
    ...kannadaFilms,
    ...films1990s,
    ...films1980s,
    ...filmsEarly1980s,
    ...filmsLate1970s
  ];

  for (const update of allUpdates) {
    const { slug, data } = update;
    
    // Fetch existing movie to merge crew data
    const { data: existing } = await supabase
      .from('movies')
      .select('crew')
      .eq('slug', slug)
      .single();

    const updatePayload: any = { ...data };
    
    // Merge crew data if it exists
    if (data.crew && existing?.crew) {
      updatePayload.crew = { ...existing.crew, ...data.crew };
    }

    const { error } = await supabase
      .from('movies')
      .update(updatePayload)
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
  console.log(`   📝 Total: ${allUpdates.length}`);
  console.log('\n✨ Anomalies fixed!\n');
}

fixChiranjeeviAnomalies().catch(console.error);
