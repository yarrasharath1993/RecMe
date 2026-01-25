import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateFinalDisplayData() {
  console.log('📝 Updating Chiranjeevi final display data...\n');
  
  let successCount = 0;
  let errorCount = 0;

  const updates = [
    // BATCH 3: 1987-1995 Films
    {
      slug: 'rikshavodu-1995',
      data: {
        our_rating: 6.5,
        supporting_cast: [
          { name: 'Paresh Rawal', character: 'G.K. Rao', type: 'supporting' },
          { name: 'Brahmanandam', type: 'supporting' },
          { name: 'Kota Srinivasa Rao', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'stuvartpuram-dongalu-1991',
      data: {
        our_rating: 6.0,
        supporting_cast: [
          { name: 'Mohan Babu', type: 'supporting' },
          { name: 'Satyanarayana', type: 'supporting' },
          { name: 'Sharat Saxena', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'pratibandh-1990',
      data: {
        our_rating: 8.0,
        supporting_cast: [
          { name: 'Rami Reddy', character: 'Anna', type: 'supporting' },
          { name: 'J.V. Somayajulu', type: 'supporting' },
          { name: 'Kulbhushan Kharbanda', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'jebu-donga-1987',
      data: {
        our_rating: 7.0
      }
    },

    // BATCH 4: 1980s Supporting Cast
    {
      slug: 'donga-1985',
      data: {
        supporting_cast: [
          { name: 'Rao Gopal Rao', character: 'Ravi', type: 'supporting' },
          { name: 'Gollapudi Maruti Rao', type: 'supporting' },
          { name: 'Silk Smitha', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'adavi-donga-1985',
      data: {
        supporting_cast: [
          { name: 'Sharada', character: 'Mother', type: 'supporting' },
          { name: 'Rao Gopal Rao', character: 'Jaggu', type: 'supporting' },
          { name: 'Jaggayya', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'rustum-1984',
      data: {
        supporting_cast: [
          { name: 'Rao Gopal Rao', type: 'supporting' },
          { name: 'Satyanarayana', character: 'Gangu', type: 'supporting' },
          { name: 'Allu Ramalingaiah', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'inti-guttu-1984',
      data: {
        supporting_cast: [
          { name: 'Rao Gopal Rao', type: 'supporting' },
          { name: 'Satyanarayana', type: 'supporting' },
          { name: 'Giribabu', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'palleturi-monagadu-1983',
      data: {
        supporting_cast: [
          { name: 'Gollapudi Maruti Rao', type: 'supporting' },
          { name: 'Jaggayya', type: 'supporting' },
          { name: 'Ranganath', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'jaggu-1982',
      data: {
        supporting_cast: [
          { name: 'Gummadi', type: 'supporting' },
          { name: 'Rao Gopal Rao', type: 'supporting' },
          { name: 'Silk Smitha', type: 'supporting' }
        ]
      }
    },

    // BATCH 5: Early 1982 Films
    {
      slug: 'radha-my-darling-1982',
      data: {
        tagline: 'A Melody of Misunderstandings.',
        synopsis: 'A romantic drama exploring the trust issues between a young couple and their family interference.',
        our_rating: 5.5,
        supporting_cast: [
          { name: 'Gummadi', type: 'supporting' },
          { name: 'S. Varalakshmi', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'mondi-ghatam-1982',
      data: {
        tagline: 'The Stubborn Path to Justice.',
        synopsis: 'A rebellious young man takes on a corrupted legal system to clear his family\'s name.',
        our_rating: 6.0,
        supporting_cast: [
          { name: 'Kaikala Satyanarayana', type: 'supporting' },
          { name: 'Allu Ramalingaiah', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'yamakinkarudu-1982',
      data: {
        tagline: 'Death\'s Messenger Arrives.',
        synopsis: 'An action thriller where an undercover agent infiltrates a dangerous gang to avenge his brother.',
        our_rating: 7.5,
        supporting_cast: [
          { name: 'Satyanarayana', type: 'supporting' },
          { name: 'Sarath Babu', type: 'supporting' },
          { name: 'Jayasudha', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'illanta-sandadi-1982',
      data: {
        synopsis: 'A comedy of errors involving a household where three couples live under one roof with secrets.',
        our_rating: 6.5,
        supporting_cast: [
          { name: 'Nutan Prasad', type: 'supporting' },
          { name: 'P.L. Narayana', type: 'supporting' }
        ]
      }
    },

    // BATCH 6: 1979-1981 Supporting Cast
    {
      slug: 'todu-dongalu-1981',
      data: {
        supporting_cast: [
          { name: 'Krishna', character: 'Dual Lead', type: 'hero2' },
          { name: 'Gummadi', type: 'supporting' },
          { name: 'Rao Gopal Rao', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'srirasthu-subhamasthu-1981',
      data: {
        supporting_cast: [
          { name: 'Nutan Prasad', type: 'supporting' },
          { name: 'Allu Ramalingaiah', type: 'supporting' },
          { name: 'Rohini', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'tirugu-leni-manishi-1981',
      data: {
        supporting_cast: [
          { name: 'N.T. Rama Rao', character: 'Lead', type: 'hero2' },
          { name: 'Satyanarayana', type: 'supporting' },
          { name: 'Bob Christo', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'kirayi-rowdylu-1981',
      data: {
        supporting_cast: [
          { name: 'Mohan Babu', type: 'supporting' },
          { name: 'Rao Gopal Rao', type: 'supporting' },
          { name: 'Prabhakar Reddy', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'thathayya-premaleelalu-1980',
      data: {
        supporting_cast: [
          { name: 'Buddu Krishna Rao', type: 'supporting' },
          { name: 'Nutan Prasad', type: 'supporting' },
          { name: 'Kaikala Satyanarayana', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'rakta-bandham-1980',
      data: {
        supporting_cast: [
          { name: 'Kaikala Satyanarayana', type: 'supporting' },
          { name: 'Giribabu', type: 'supporting' },
          { name: 'Allu Ramalingaiah', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'nakili-manishi-1980',
      data: {
        supporting_cast: [
          { name: 'Satyanarayana', character: 'Rama Rao', type: 'supporting' },
          { name: 'Mohan Babu', type: 'supporting' },
          { name: 'Kavitha', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'punnami-naagu-1980',
      data: {
        supporting_cast: [
          { name: 'Narasimha Raju', type: 'supporting' },
          { name: 'Padmanabham', type: 'supporting' },
          { name: 'Dhulipala', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'kukka-katuku-cheppu-debba-1979',
      data: {
        supporting_cast: [
          { name: 'Narayana Rao', type: 'supporting' },
          { name: 'Pallavi', type: 'supporting' },
          { name: 'Hemasundar', type: 'supporting' }
        ]
      }
    },
    {
      slug: 'kothala-raayudu-1979',
      data: {
        supporting_cast: [
          { name: 'Madhavi', type: 'supporting' },
          { name: 'Gummadi', type: 'supporting' },
          { name: 'Allu Ramalingaiah', type: 'supporting' }
        ]
      }
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
  console.log('\n✨ Final display data updated!\n');
}

updateFinalDisplayData().catch(console.error);
