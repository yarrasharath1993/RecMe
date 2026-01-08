#!/usr/bin/env npx tsx
/**
 * KIDS CONTENT IMPORTER
 * 
 * Imports and classifies kids-friendly content:
 * - Moral stories
 * - Mythology tales
 * - Bedtime stories
 * - Educational content
 * 
 * Usage:
 *   npx tsx scripts/content-platform/sectors/kids-import-stories.ts
 *   npx tsx scripts/content-platform/sectors/kids-import-stories.ts --type=mythology
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// STORY TEMPLATES
// ============================================================

interface StoryTemplate {
  title: string;
  titleTe: string;
  body: string;
  bodyTe: string;
  moral: string;
  moralTe: string;
  ageGroup: '0-3' | '4-6' | '7-10' | '11-13';
  subsector: string;
  characters?: string[];
}

const MORAL_STORIES: StoryTemplate[] = [
  {
    title: 'The Honest Woodcutter',
    titleTe: 'నిజాయితీ గల కట్టెలు కొట్టేవాడు',
    body: `Once upon a time, there lived a poor woodcutter near a river. One day, while cutting wood, his axe slipped and fell into the river.

He sat by the river, crying. A fairy appeared and asked what happened. The woodcutter told her about his axe.

The fairy dived into the river and brought out a golden axe. "Is this yours?" she asked.
"No," said the honest woodcutter.

She brought out a silver axe. "Is this yours?"
"No," he said again.

Finally, she brought out his iron axe. "Yes! That's mine!" he exclaimed happily.

The fairy was pleased with his honesty. She gave him all three axes as a reward.`,
    bodyTe: `ఒకప్పుడు ఒక నది ఒడ్డున ఒక పేద కట్టెలు కొట్టేవాడు ఉండేవాడు. ఒకరోజు కట్టెలు కొడుతుండగా అతని గొడ్డలి జారి నదిలో పడిపోయింది.

అతను నది ఒడ్డున కూర్చుని ఏడవసాగాడు. ఒక దేవత ప్రత్యక్షమై ఏం జరిగిందని అడిగింది.

దేవత నదిలో మునిగి బంగారు గొడ్డలి తీసుకువచ్చింది. "ఇది నీదా?" అని అడిగింది.
"కాదు," అని నిజాయితీగా చెప్పాడు.

తర్వాత వెండి గొడ్డలి తీసుకువచ్చింది. "ఇది నీదా?"
"కాదు," అని మళ్ళీ చెప్పాడు.

చివరకు అతని ఇనుప గొడ్డలి తీసుకువచ్చింది. "అవును! అది నాది!" అని సంతోషంగా చెప్పాడు.

దేవత అతని నిజాయితీకి సంతోషించి మూడు గొడ్డళ్ళనూ బహుమతిగా ఇచ్చింది.`,
    moral: 'Honesty is always rewarded.',
    moralTe: 'నిజాయితీకి ఎల్లప్పుడూ బహుమతి ఉంటుంది.',
    ageGroup: '4-6',
    subsector: 'moral_stories',
    characters: ['Woodcutter', 'Fairy'],
  },
  {
    title: 'The Thirsty Crow',
    titleTe: 'దాహంతో ఉన్న కాకి',
    body: `On a hot summer day, a thirsty crow was searching for water. He flew from place to place but couldn't find any water.

Finally, he found a pot with some water. But the water was at the bottom, and his beak couldn't reach it.

The clever crow thought of an idea. He picked up small pebbles one by one and dropped them into the pot.

Slowly, the water level rose. Soon, he could drink the water!`,
    bodyTe: `ఒక వేసవి రోజున, దాహంతో ఉన్న కాకి నీళ్ళ కోసం వెతుకుతోంది. అది ఒక చోటు నుండి మరో చోటుకు ఎగిరింది కానీ నీళ్ళు దొరకలేదు.

చివరకు, కొంచెం నీళ్ళు ఉన్న కుండ కనుగొంది. కానీ నీళ్ళు అడుగున ఉన్నాయి, దాని ముక్కు అందలేదు.

తెలివైన కాకికి ఒక ఆలోచన వచ్చింది. అది చిన్న రాళ్ళను ఒక్కొక్కటిగా తీసుకుని కుండలో వేసింది.

నెమ్మదిగా నీటి మట్టం పెరిగింది. త్వరలో, అది నీళ్ళు తాగగలిగింది!`,
    moral: 'Where there is a will, there is a way.',
    moralTe: 'సంకల్పం ఉంటే దారి కనుగొంటాం.',
    ageGroup: '4-6',
    subsector: 'moral_stories',
    characters: ['Crow'],
  },
];

const MYTHOLOGY_STORIES: StoryTemplate[] = [
  {
    title: 'Lord Ganesha and the Moon',
    titleTe: 'గణేశుడు మరియు చంద్రుడు',
    body: `Lord Ganesha loved modaks (sweet dumplings). One night, after eating many modaks at a feast, he was riding his mouse Mooshika when a snake appeared.

The mouse got scared and threw Ganesha off! Ganesha fell, and all the modaks spilled from his stomach.

The Moon saw this and started laughing at Ganesha. This made Ganesha very angry. He cursed the Moon to disappear forever!

But the Moon apologized and promised never to be proud again. Ganesha softened the curse - the Moon would wax and wane, reminding everyone not to laugh at others.`,
    bodyTe: `గణేశుడికి మోదకాలు అంటే చాలా ఇష్టం. ఒక రాత్రి, విందులో చాలా మోదకాలు తిన్న తర్వాత, అతను తన మూషికంపై వెళ్తుండగా ఒక పాము కనిపించింది.

ఎలుక భయపడి గణేశుడిని పడేసింది! గణేశుడు పడిపోయాడు, మోదకాలు అన్నీ చెల్లాచెదురయ్యాయి.

చంద్రుడు ఇది చూసి గణేశుడిని చూసి నవ్వడం మొదలుపెట్టాడు. గణేశుడికి చాలా కోపం వచ్చింది. చంద్రుడు శాశ్వతంగా కనుమరుగయ్యేలా శపించాడు!

కానీ చంద్రుడు క్షమాపణ చెప్పి మళ్ళీ గర్వించనని వాగ్దానం చేశాడు. గణేశుడు శాపాన్ని తగ్గించాడు - చంద్రుడు పెరిగి తగ్గుతుంటాడు, ఇతరులను చూసి నవ్వకూడదని అందరికీ గుర్తుచేస్తూ.`,
    moral: 'Never mock or laugh at others.',
    moralTe: 'ఇతరులను ఎగతాళి చేయకూడదు లేదా నవ్వకూడదు.',
    ageGroup: '7-10',
    subsector: 'mythology',
    characters: ['Lord Ganesha', 'Moon', 'Mooshika'],
  },
];

// ============================================================
// IMPORT FUNCTIONS
// ============================================================

async function importStories(stories: StoryTemplate[], type: string) {
  console.log(`\n📚 Importing ${type} (${stories.length} stories)...\n`);

  let imported = 0;
  for (const story of stories) {
    const slug = story.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 80);

    // Check if exists
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      console.log(`  ⏭️ Exists: ${story.title}`);
      continue;
    }

    const fullBody = `${story.body}\n\n---\n\n**Moral:** ${story.moral}`;
    const fullBodyTe = `${story.bodyTe}\n\n---\n\n**నీతి:** ${story.moralTe}`;

    const postData = {
      id: uuidv4(),
      title: story.title,
      title_te: story.titleTe,
      slug,
      telugu_body: fullBodyTe,
      body_te: fullBodyTe,
      
      // Content platform fields
      content_type: 'story',
      content_sector: 'kids_family',
      content_subsector: story.subsector,
      audience_profile: 'kids',
      sensitivity_level: 'none',
      age_group: story.ageGroup,
      
      // Verification
      fact_confidence_score: 100, // Stories don't need fact verification
      source_count: 1,
      source_refs: [{ id: '1', sourceName: 'Traditional', trustLevel: 1.0 }],
      verification_status: 'verified',
      
      // Labels - kids content is family safe
      fictional_label: false, // These are moral stories, not speculative
      requires_disclaimer: false,
      
      // Metadata
      tags: ['kids', story.subsector, `age-${story.ageGroup}`, 'moral-story'],
      category: 'entertainment',
      status: 'draft',
      
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('posts').insert(postData);

    if (error) {
      console.error(`  ❌ Error: ${story.title} - ${error.message}`);
    } else {
      console.log(`  ✅ Imported: ${story.title}`);
      imported++;
    }
  }

  return imported;
}

async function migrateExistingStories() {
  console.log('\n🔄 Migrating existing stories to kids_family sector...\n');

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('category', 'moral');

  if (error || !stories) {
    console.log('No existing stories to migrate');
    return;
  }

  let migrated = 0;
  for (const story of stories) {
    // Check if already migrated
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', story.id)
      .single();

    if (existing) continue;

    const postData = {
      id: uuidv4(),
      title: story.title_en || 'Moral Story',
      title_te: story.title_te,
      slug: story.id,
      telugu_body: story.body_te,
      body_te: story.body_te,
      
      content_type: 'story',
      content_sector: 'kids_family',
      content_subsector: 'moral_stories',
      audience_profile: 'kids',
      sensitivity_level: 'none',
      age_group: '4-6',
      
      fact_confidence_score: 100,
      verification_status: 'verified',
      fictional_label: false,
      requires_disclaimer: false,
      
      tags: ['kids', 'moral-story', 'migrated'],
      category: 'entertainment',
      status: story.status,
      
      created_at: story.created_at,
    };

    const { error: insertError } = await supabase.from('posts').insert(postData);

    if (!insertError) {
      console.log(`  ✅ Migrated: ${story.title_te?.slice(0, 40) || story.id}`);
      migrated++;
    }
  }

  console.log(`\n📊 Migrated ${migrated} existing stories`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find(a => a.startsWith('--type='));
  const type = typeArg?.split('=')[1] || 'all';

  console.log('🧒 Kids Content Importer');
  console.log('========================\n');

  let totalImported = 0;

  switch (type) {
    case 'moral':
      totalImported = await importStories(MORAL_STORIES, 'Moral Stories');
      break;
    case 'mythology':
      totalImported = await importStories(MYTHOLOGY_STORIES, 'Mythology');
      break;
    case 'migrate':
      await migrateExistingStories();
      break;
    case 'all':
    default:
      totalImported += await importStories(MORAL_STORIES, 'Moral Stories');
      totalImported += await importStories(MYTHOLOGY_STORIES, 'Mythology');
      await migrateExistingStories();
  }

  console.log(`\n✨ Total imported: ${totalImported} stories`);
  console.log('   View in admin: /admin/content-sectors (select kids_family)');
}

main().catch(console.error);

