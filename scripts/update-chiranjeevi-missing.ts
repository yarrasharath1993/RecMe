import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateMissingData() {
  console.log('🔄 Updating Chiranjeevi missing data...\n');
  let successCount = 0;
  let errorCount = 0;

  const updates = [
    {
      slug: 'punadhirallu-1979',
      data: {
        music_director: 'Afzal Ali',
        crew: { editor: 'K. Balu' },
        writer: 'Rajkumar'
      }
    },
    {
      slug: 'kotta-alludu-1979',
      data: {
        cinematographer: 'S. Navakanth',
        crew: { editor: 'G.G. Krishna Rao' },
        writer: 'Satyanand'
      }
    },
    {
      slug: 'mogudu-kaavali-1980',
      data: {
        music_director: 'J.V. Raghavulu'
      }
    },
    {
      slug: 'rani-kasula-rangamma-1981',
      data: {
        crew: { editor: 'G.G. Krishna Rao' },
        writer: 'Satyanand'
      }
    },
    {
      slug: 'tirugu-leni-manishi-1981',
      data: {
        heroine: 'Rati Agnihotri',
        cinematographer: 'K.S. Prakash',
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'Satyanand',
        producer: 'K. Devi Vara Prasad',
        tmdb_id: 313177,
        our_rating: 6.0
      }
    },
    {
      slug: 'parvathi-parameswarulu-1981',
      data: {
        heroine: 'Swapna',
        music_director: 'Satyam',
        cinematographer: 'C. Nageswara Rao',
        producer: 'S. Venkat Ratnam',
        tmdb_id: 417242
      }
    },
    {
      slug: 'todu-dongalu-1981',
      data: {
        music_director: 'K. Chakravarthy',
        cinematographer: 'V.S.R. Swamy',
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'Satyanand',
        producer: 'Y.V. Rao'
      }
    },
    {
      slug: 'intlo-ramayya-veedhilo-krishnayya-1982',
      data: {
        crew: { editor: 'G.G. Krishna Rao' },
        writer: 'Kodi Ramakrishna'
      }
    },
    {
      slug: 'radha-my-darling-1982',
      data: {
        our_rating: 6.5
      }
    },
    {
      slug: 'idi-pellantara-1982',
      data: {
        heroine: 'Radhika',
        director: 'Vijay Bhaskar',
        music_director: 'K. Chakravarthy',
        cinematographer: 'V.S.R. Swamy',
        crew: { editor: 'G.G. Krishna Rao' },
        writer: 'Satyanand',
        producer: 'Kranthi Kumar'
      }
    },
    {
      slug: 'sitadevi-1982',
      data: {
        heroine: 'Sujatha',
        director: 'Eranki Sharma',
        music_director: 'M.S. Viswanathan',
        cinematographer: 'G. Sivaram',
        producer: 'Chakravarthy'
      }
    },
    {
      slug: 'adavi-donga-1985',
      data: {
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'Paruchuri Brothers',
        our_rating: 8.2
      }
    },
    {
      slug: 'rakshasudu-1986',
      data: {
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'Yandamoori Veerendranath'
      }
    },
    {
      slug: 'vishwambhara-2026',
      data: {
        heroine: 'Vijayashanti',
        music_director: 'M.M. Keeravani',
        cinematographer: 'Chota K. Naidu',
        crew: { editor: 'Kotagiri Venkateswara Rao' },
        writer: 'Vassishta',
        producer: 'Vamsi-Pramod',
        tmdb_id: 121111
      }
    },
    {
      slug: 'mega-159-2026',
      data: {
        music_director: 'Santhosh Narayanan',
        writer: 'Srikanth Odela',
        producer: 'Sudhakar Cherukuri'
      }
    },
    {
      slug: 'auto-jaani-2026',
      data: {
        music_director: 'Anirudh',
        writer: 'Puri Jagannadh'
      }
    }
  ];

  for (const update of updates) {
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

  // Add new entry for Mana Shankara Vara Prasad Garu
  const msvpExists = await supabase
    .from('movies')
    .select('id')
    .eq('slug', 'msvp-2026')
    .single();

  if (!msvpExists.data) {
    const { error } = await supabase
      .from('movies')
      .insert({
        title_en: 'Mana Shankara Vara Prasad Garu',
        slug: 'msvp-2026',
        release_year: 2026,
        hero: 'Chiranjeevi',
        heroine: 'Nayanthara',
        director: 'Anil Ravipudi',
        music_director: 'Bheems Ceciroleo',
        cinematographer: 'C. Ram Prasad',
        crew: { editor: 'Tammi Raju' },
        writer: 'Anil Ravipudi',
        producer: 'Dil Raju',
        tmdb_id: 160001,
        genres: ['Comedy', 'Action'],
        our_rating: 8.5,
        language: 'Telugu'
      });

    if (error) {
      console.log(`❌ Error adding MSVP:`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Added new entry: Mana Shankara Vara Prasad Garu (2026)`);
      successCount++;
    }
  } else {
    console.log(`ℹ️  MSVP already exists, skipping...`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${updates.length + 1}`);
  console.log('\n✨ Update complete!\n');
}

updateMissingData().catch(console.error);
