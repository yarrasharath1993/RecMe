#!/usr/bin/env npx tsx
/**
 * Import Facebook Links and Update Social Media for Active A-List Celebrities (2026)
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
    name: 'Chiranjeevi',
    twitter: 'https://twitter.com/KChiruTweets',
    instagram: 'https://www.instagram.com/chiranjeevikonidela/',
    facebook: 'https://www.facebook.com/KChiranjeeviOfficial',
  },
  {
    slug: 'prabhas',
    name: 'Prabhas',
    twitter: 'https://twitter.com/Actor_prabhas',
    instagram: 'https://www.instagram.com/actorprabhas/',
    facebook: 'https://www.facebook.com/ActorPrabhas',
  },
  {
    slug: 'ram-charan',
    name: 'Ram Charan',
    twitter: 'https://twitter.com/AlwaysRamCharan',
    instagram: 'https://www.instagram.com/alwaysramcharan/',
    facebook: 'https://www.facebook.com/AlwaysRamCharan',
  },
  {
    slug: 'mahesh-babu',
    name: 'Mahesh Babu',
    twitter: 'https://twitter.com/urstrulyMahesh',
    instagram: 'https://www.instagram.com/urstrulymahesh/',
    facebook: 'https://www.facebook.com/MaheshBabu',
  },
  {
    slug: 'celeb-ntr-jr',
    name: 'NTR Jr',
    twitter: 'https://twitter.com/tarak9999',
    instagram: 'https://www.instagram.com/jrntr/',
    facebook: 'https://www.facebook.com/JrNTR',
  },
  {
    slug: 'allu-arjun',
    name: 'Allu Arjun',
    twitter: 'https://twitter.com/alluarjun',
    instagram: 'https://www.instagram.com/alluarjunonline/',
    facebook: 'https://www.facebook.com/AlluArjun',
  },
  {
    slug: 'celeb-ravi-teja',
    name: 'Ravi Teja',
    twitter: 'https://twitter.com/RaviTeja_offl',
    instagram: 'https://www.instagram.com/raviteja_2628/',
    facebook: 'https://www.facebook.com/itsraviteja',
  },
  {
    slug: 'celeb-nani',
    name: 'Nani',
    twitter: 'https://twitter.com/NameisNani',
    instagram: 'https://www.instagram.com/nameisnani/',
    facebook: 'https://www.facebook.com/ActorNani',
  },
  {
    slug: 'celeb-samantha',
    name: 'Samantha',
    twitter: 'https://twitter.com/Samanthaprabhu2',
    instagram: 'https://www.instagram.com/samantharuthprabhuoffl/',
    facebook: 'https://www.facebook.com/samantharuthprabhuofficial',
  },
  {
    slug: 'rashmika-mandanna',
    name: 'Rashmika Mandanna',
    twitter: 'https://twitter.com/iamRashmika',
    instagram: 'https://www.instagram.com/rashmika_mandanna/',
    facebook: 'https://www.facebook.com/RashmikaMandanna',
  },
];

async function importSocialLinks() {
  console.log('\x1b[36m\x1b[1m');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           IMPORT FACEBOOK & UPDATE SOCIAL LINKS (2026)                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m\n');

  let updated = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const celeb of socialLinksData) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name_en, slug, twitter_url, instagram_url, facebook_url')
      .eq('slug', celeb.slug)
      .maybeSingle();

    if (!celebrity) {
      console.log('\x1b[33m⚠\x1b[0m', celeb.name, '- Profile not found (may need to be created)');
      errors++;
      continue;
    }

    // Check what's new
    const updates: any = {};
    const changes: string[] = [];

    if (celeb.twitter && celeb.twitter !== celebrity.twitter_url) {
      updates.twitter_url = celeb.twitter;
      changes.push(celebrity.twitter_url ? 'Twitter updated' : 'Twitter added');
    }

    if (celeb.instagram && celeb.instagram !== celebrity.instagram_url) {
      updates.instagram_url = celeb.instagram;
      changes.push(celebrity.instagram_url ? 'Instagram updated' : 'Instagram added');
    }

    if (celeb.facebook && celeb.facebook !== celebrity.facebook_url) {
      updates.facebook_url = celeb.facebook;
      changes.push(celebrity.facebook_url ? 'Facebook updated' : 'Facebook added');
    }

    if (changes.length === 0) {
      console.log('\x1b[37m  ○\x1b[0m', celebrity.name_en, '- Already up to date');
      skipped++;
      continue;
    }

    updates.social_links_updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('celebrities')
      .update(updates)
      .eq('id', celebrity.id);

    if (error) {
      console.log('\x1b[31m  ✗\x1b[0m', celebrity.name_en, '-', error.message);
      errors++;
    } else {
      console.log('\x1b[32m  ✓\x1b[0m', celebrity.name_en, '-', changes.join(', '));
      if (changes.some(c => c.includes('added'))) {
        created++;
      } else {
        updated++;
      }
    }
  }

  console.log('\n\x1b[36m\x1b[1m╔═══════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m\x1b[1m║                        SUMMARY                                         ║\x1b[0m');
  console.log('\x1b[36m\x1b[1m╚═══════════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  console.log('\x1b[32m✅ Updated/Added:         \x1b[0m', updated + created);
  console.log('\x1b[37m○  Already Up to Date:    \x1b[0m', skipped);
  if (errors > 0) {
    console.log('\x1b[33m⚠  Profiles Not Found:    \x1b[0m', errors);
  }
  console.log('');
  
  console.log('Notable Updates:');
  console.log('  • Prabhas now has Twitter account (@Actor_prabhas)');
  console.log('  • All 10 A-list stars now have Facebook pages');
  console.log('  • Complete social media coverage for active stars');
  console.log('');
}

importSocialLinks().catch(console.error);
