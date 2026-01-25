#!/usr/bin/env npx tsx
/**
 * Import Social Links from Manual Research Batch 1
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const socialLinksData = [
  {
    slug: 'srikanth',
    twitter: 'https://twitter.com/actorsrikanth',
    instagram: 'https://www.instagram.com/actorsrikanth/',
    facebook: 'https://www.facebook.com/actorsrikanth',
    website: 'http://srikanthmeka.com'
  },
  {
    slug: 'celeb-daggubati-venkatesh',
    twitter: 'https://twitter.com/VenkyMama',
    instagram: 'https://www.instagram.com/venkymama/',
    facebook: 'https://www.facebook.com/DaggubatiVenkatesh',
    website: null
  },
  {
    slug: 'chiranjeevi',
    twitter: 'https://twitter.com/KChiruTweets',
    instagram: 'https://www.instagram.com/chiranjeevikonidela/',
    facebook: 'https://www.facebook.com/MegastarChiranjeevi',
    website: null
  },
  {
    slug: 'celeb-kamal-haasan',
    twitter: 'https://twitter.com/ikamalhaasan',
    instagram: 'https://www.instagram.com/ikamalhaasan/',
    facebook: 'https://www.facebook.com/ikamalhaasan',
    website: null
  },
  {
    slug: 'celeb-ravi-teja',
    twitter: 'https://twitter.com/RaviTeja_offl',
    instagram: 'https://www.instagram.com/raviteja_2628/',
    facebook: 'https://www.facebook.com/RaviTejaOfficial',
    website: null
  },
  {
    slug: 'celeb-tamannaah-bhatia',
    twitter: 'https://twitter.com/tamannaahspeaks',
    instagram: 'https://www.instagram.com/tamannaahspeaks/',
    facebook: 'https://www.facebook.com/TamannaahOfficial',
    website: null
  },
  {
    slug: 'celeb-nandamuri-balakrishna',
    twitter: null,
    instagram: 'https://www.instagram.com/nandamuribalakrishna_official/',
    facebook: 'https://www.facebook.com/NandamuriBalakrishnaNBK',
    website: 'http://manabalayya.com'
  },
  {
    slug: 'akkineni-nagarjuna',
    twitter: 'https://twitter.com/iamnagarjuna',
    instagram: 'https://www.instagram.com/iamnagarjuna/',
    facebook: 'https://www.facebook.com/ActorNagarjuna',
    website: null
  },
  {
    slug: 'allari-naresh',
    twitter: 'https://twitter.com/allarinaresh',
    instagram: 'https://www.instagram.com/allarinaresh/',
    facebook: 'https://www.facebook.com/AllariNareshOfficial',
    website: null
  },
  {
    slug: 'celeb-ram',
    twitter: 'https://twitter.com/ramsayz',
    instagram: 'https://www.instagram.com/ramsayz/',
    facebook: 'https://www.facebook.com/ActorRamPothineni',
    website: null
  },
];

async function importSocialLinks() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT SOCIAL LINKS BATCH 1                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m\n');

  let updated = 0;
  let errors = 0;

  for (const celeb of socialLinksData) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name_en')
      .eq('slug', celeb.slug)
      .single();

    if (!celebrity) {
      console.log('\x1b[31m✗\x1b[0m Celebrity not found:', celeb.slug);
      errors++;
      continue;
    }

    const { error } = await supabase
      .from('celebrities')
      .update({
        twitter_url: celeb.twitter,
        instagram_url: celeb.instagram,
        facebook_url: celeb.facebook,
        website_url: celeb.website,
      })
      .eq('id', celebrity.id);

    if (error) {
      console.log('\x1b[31m  ✗\x1b[0m', celebrity.name_en, '-', error.message);
      errors++;
    } else {
      const links = [];
      if (celeb.twitter) links.push('Twitter');
      if (celeb.instagram) links.push('Instagram');
      if (celeb.facebook) links.push('Facebook');
      if (celeb.website) links.push('Website');
      console.log('\x1b[32m  ✓\x1b[0m', celebrity.name_en, '-', links.join(', '));
      updated++;
    }
  }

  console.log('\n\x1b[36m\x1b[1m╔═══════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m\x1b[1m║                        SUMMARY                                         ║\x1b[0m');
  console.log('\x1b[36m\x1b[1m╚═══════════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  console.log('\x1b[32m✅ Successfully Updated: \x1b[0m', updated);
  if (errors > 0) {
    console.log('\x1b[31m✗ Errors:                \x1b[0m', errors);
  }
  console.log('');
}

importSocialLinks().catch(console.error);
