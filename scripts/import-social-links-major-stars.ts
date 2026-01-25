#!/usr/bin/env npx tsx
/**
 * Import Social Links for Major Telugu Stars (2026)
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
    slug: 'chiranjeevi',
    twitter: 'https://twitter.com/KChiruTweets',
    instagram: 'https://www.instagram.com/chiranjeevikonidela/',
  },
  {
    slug: 'prabhas',
    twitter: null,
    instagram: 'https://www.instagram.com/actorprabhas/',
  },
  {
    slug: 'ram-charan',
    twitter: 'https://twitter.com/AlwaysRamCharan',
    instagram: 'https://www.instagram.com/alwaysramcharan/',
  },
  {
    slug: 'jr-ntr',
    twitter: 'https://twitter.com/tarak9999',
    instagram: 'https://www.instagram.com/jrntr/',
  },
  {
    slug: 'mahesh-babu',
    twitter: 'https://twitter.com/urstrulyMahesh',
    instagram: 'https://www.instagram.com/urstrulymahesh/',
  },
  {
    slug: 'allu-arjun',
    twitter: 'https://twitter.com/alluarjun',
    instagram: 'https://www.instagram.com/alluarjunonline/',
  },
  {
    slug: 'celeb-ravi-teja',
    twitter: 'https://twitter.com/RaviTeja_offl',
    instagram: 'https://www.instagram.com/raviteja_2628/',
  },
  {
    slug: 'samantha-ruth-prabhu',
    twitter: 'https://twitter.com/Samanthaprabhu2',
    instagram: 'https://www.instagram.com/samantharuthprabhuoffl/',
  },
  {
    slug: 'celeb-nani',
    twitter: 'https://twitter.com/NameisNani',
    instagram: 'https://www.instagram.com/nameisnani/',
  },
];

async function importSocialLinks() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT SOCIAL LINKS - MAJOR STARS                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m\n');

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const celeb of socialLinksData) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name_en, twitter_url, instagram_url')
      .eq('slug', celeb.slug)
      .single();

    if (!celebrity) {
      console.log('\x1b[31m✗\x1b[0m Celebrity not found:', celeb.slug);
      errors++;
      continue;
    }

    // Check if already has social links
    if (celebrity.twitter_url && celebrity.instagram_url) {
      console.log('\x1b[33m  ⊘\x1b[0m', celebrity.name_en, '- Already has social links');
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('celebrities')
      .update({
        twitter_url: celeb.twitter || celebrity.twitter_url,
        instagram_url: celeb.instagram || celebrity.instagram_url,
        social_links_updated_at: new Date().toISOString(),
      })
      .eq('id', celebrity.id);

    if (error) {
      console.log('\x1b[31m  ✗\x1b[0m', celebrity.name_en, '-', error.message);
      errors++;
    } else {
      const links = [];
      if (celeb.twitter) links.push('Twitter');
      if (celeb.instagram) links.push('Instagram');
      console.log('\x1b[32m  ✓\x1b[0m', celebrity.name_en, '-', links.join(', '));
      updated++;
    }
  }

  console.log('\n\x1b[36m\x1b[1m╔═══════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m\x1b[1m║                        SUMMARY                                         ║\x1b[0m');
  console.log('\x1b[36m\x1b[1m╚═══════════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  console.log('\x1b[32m✅ Successfully Updated: \x1b[0m', updated);
  console.log('\x1b[33m⊘ Skipped (Already Has): \x1b[0m', skipped);
  if (errors > 0) {
    console.log('\x1b[31m✗ Errors:                \x1b[0m', errors);
  }
  console.log('');
}

importSocialLinks().catch(console.error);
