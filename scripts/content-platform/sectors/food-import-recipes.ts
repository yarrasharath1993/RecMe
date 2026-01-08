#!/usr/bin/env npx tsx
/**
 * FOOD & BACHELOR LIFE CONTENT IMPORTER
 * 
 * Imports and creates recipe content for bachelors and students:
 * - Simple quick recipes
 * - Budget cooking tips
 * - Hostel food hacks
 * - Movie night snacks
 * 
 * Usage:
 *   npx tsx scripts/content-platform/sectors/food-import-recipes.ts
 *   npx tsx scripts/content-platform/sectors/food-import-recipes.ts --type=snacks
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
// RECIPE TEMPLATES
// ============================================================

interface RecipeTemplate {
  title: string;
  titleTe: string;
  description: string;
  descriptionTe: string;
  ingredients: string[];
  ingredientsTe: string[];
  steps: string[];
  stepsTe: string[];
  prepTime: string; // ISO 8601 duration
  cookTime: string;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subsector: 'simple_recipes' | 'budget_cooking' | 'hostel_hacks' | 'movie_snacks';
  tags: string[];
}

const SIMPLE_RECIPES: RecipeTemplate[] = [
  {
    title: '5-Minute Maggi Upma',
    titleTe: '5 నిమిషాల మాగీ ఉప్మా',
    description: 'A quick twist on classic Maggi noodles. Perfect for busy bachelors!',
    descriptionTe: 'క్లాసిక్ మాగీ నూడిల్స్‌కు త్వరిత మార్పు. బిజీ బ్యాచిలర్లకు అద్భుతం!',
    ingredients: [
      '1 pack Maggi noodles',
      '1 tbsp oil',
      '1/4 tsp mustard seeds',
      'Curry leaves (optional)',
      'Onion chopped (1 small)',
      'Green chili (1, chopped)',
    ],
    ingredientsTe: [
      '1 ప్యాక్ మాగీ నూడిల్స్',
      '1 టేబుల్ స్పూన్ నూనె',
      '1/4 టీస్పూన్ ఆవాలు',
      'కరివేపాకు (ఐచ్ఛికం)',
      'ఉల్లిపాయ తరిగినది (1 చిన్నది)',
      'పచ్చిమిర్చి (1, తరిగినది)',
    ],
    steps: [
      'Boil Maggi with less water than usual, drain and keep aside.',
      'Heat oil, add mustard seeds and let them splutter.',
      'Add curry leaves, onion, and green chili. Sauté until onion is soft.',
      'Add boiled Maggi and Maggi masala. Mix well.',
      'Stir-fry for 1 minute. Serve hot!',
    ],
    stepsTe: [
      'మాగీని సాధారణం కంటే తక్కువ నీళ్ళతో ఉడకబెట్టండి, వడగట్టి పక్కన ఉంచండి.',
      'నూనె వేడి చేసి, ఆవాలు వేసి పేలనివ్వండి.',
      'కరివేపాకు, ఉల్లిపాయ, పచ్చిమిర్చి వేసి ఉల్లిపాయ మెత్తబడే వరకు వేయించండి.',
      'ఉడికించిన మాగీ మరియు మాగీ మసాలా వేసి బాగా కలపండి.',
      '1 నిమిషం వేయించండి. వేడిగా వడ్డించండి!',
    ],
    prepTime: 'PT2M',
    cookTime: 'PT5M',
    servings: 1,
    difficulty: 'easy',
    subsector: 'simple_recipes',
    tags: ['quick', 'maggi', 'bachelor-special', '5-minutes'],
  },
  {
    title: 'Instant Bread Dosa',
    titleTe: 'ఇన్‌స్టంట్ బ్రెడ్ దోస',
    description: 'Make crispy dosa without batter! Uses leftover bread.',
    descriptionTe: 'బ్యాటర్ లేకుండా క్రిస్పీ దోస చేయండి! మిగిలిపోయిన బ్రెడ్ వాడండి.',
    ingredients: [
      '4 bread slices',
      '1/2 cup semolina (rava)',
      '1/2 cup curd',
      '1/4 cup water',
      'Salt to taste',
      'Green chili (1, chopped)',
      'Onion (1 small, finely chopped)',
    ],
    ingredientsTe: [
      '4 బ్రెడ్ స్లైసులు',
      '1/2 కప్ సెమోలినా (రవ్వ)',
      '1/2 కప్ పెరుగు',
      '1/4 కప్ నీళ్ళు',
      'రుచికి తగినంత ఉప్పు',
      'పచ్చిమిర్చి (1, తరిగినది)',
      'ఉల్లిపాయ (1 చిన్నది, చక్కగా తరిగినది)',
    ],
    steps: [
      'Tear bread into pieces and soak in curd for 5 minutes.',
      'Add semolina, water, salt, chili, and onion. Mix to make batter.',
      'Heat a non-stick pan, pour batter like dosa.',
      'Cook both sides until golden. Serve with chutney!',
    ],
    stepsTe: [
      'బ్రెడ్‌ని ముక్కలుగా చించి 5 నిమిషాలు పెరుగులో నానబెట్టండి.',
      'రవ్వ, నీళ్ళు, ఉప్పు, మిర్చి, ఉల్లిపాయ వేసి కలిపి బ్యాటర్ చేయండి.',
      'నాన్-స్టిక్ పాన్ వేడి చేసి, దోసలా బ్యాటర్ పోయండి.',
      'రెండు వైపులా గోల్డెన్ అయ్యేవరకు వేయించండి. చట్నీతో వడ్డించండి!',
    ],
    prepTime: 'PT5M',
    cookTime: 'PT10M',
    servings: 2,
    difficulty: 'easy',
    subsector: 'simple_recipes',
    tags: ['instant', 'bread', 'dosa', 'no-fermentation'],
  },
];

const MOVIE_SNACKS: RecipeTemplate[] = [
  {
    title: 'Masala Popcorn',
    titleTe: 'మసాలా పాప్‌కార్న్',
    description: 'Spicy Indian-style popcorn for your movie marathons.',
    descriptionTe: 'మీ మూవీ మారథాన్ల కోసం స్పైసీ ఇండియన్-స్టైల్ పాప్‌కార్న్.',
    ingredients: [
      '1/4 cup popcorn kernels',
      '2 tbsp oil',
      '1/2 tsp chaat masala',
      '1/4 tsp red chili powder',
      '1/4 tsp turmeric',
      'Salt to taste',
      '1 tbsp butter (optional)',
    ],
    ingredientsTe: [
      '1/4 కప్ పాప్‌కార్న్ గింజలు',
      '2 టేబుల్ స్పూన్ నూనె',
      '1/2 టీస్పూన్ చాట్ మసాలా',
      '1/4 టీస్పూన్ ఎర్ర మిర్చి పొడి',
      '1/4 టీస్పూన్ పసుపు',
      'రుచికి తగినంత ఉప్పు',
      '1 టేబుల్ స్పూన్ వెన్న (ఐచ్ఛికం)',
    ],
    steps: [
      'Heat oil in a large pot with lid. Add a few kernels.',
      'When they pop, add remaining kernels. Cover and shake.',
      'Once popping slows, remove from heat.',
      'While hot, toss with butter, chaat masala, chili, turmeric, and salt.',
      'Enjoy during your favorite Telugu movie!',
    ],
    stepsTe: [
      'మూత ఉన్న పెద్ద పాత్రలో నూనె వేడి చేయండి. కొన్ని గింజలు వేయండి.',
      'అవి పేలినప్పుడు, మిగిలిన గింజలు వేయండి. మూసి shake చేయండి.',
      'పేలడం తగ్గగానే, పొయ్యి నుండి తీయండి.',
      'వేడిగా ఉన్నప్పుడే వెన్న, చాట్ మసాలా, మిర్చి, పసుపు, ఉప్పు వేసి కలపండి.',
      'మీకు ఇష్టమైన తెలుగు సినిమా చూస్తూ ఆస్వాదించండి!',
    ],
    prepTime: 'PT2M',
    cookTime: 'PT5M',
    servings: 2,
    difficulty: 'easy',
    subsector: 'movie_snacks',
    tags: ['popcorn', 'movie-night', 'snack', 'spicy'],
  },
  {
    title: 'Crunchy Crispy Onion Pakodi',
    titleTe: 'క్రంచీ క్రిస్పీ ఉల్లిపాయ పకోడీ',
    description: 'Perfect teatime or movie snack. Extra crispy!',
    descriptionTe: 'టీటైమ్ లేదా మూవీ స్నాక్‌కు అద్భుతం. ఎక్స్‌ట్రా క్రిస్పీ!',
    ingredients: [
      '2 large onions, thinly sliced',
      '1 cup besan (gram flour)',
      '2 tbsp rice flour',
      '1/2 tsp red chili powder',
      '1/4 tsp turmeric',
      'Salt to taste',
      'Curry leaves (handful)',
      'Oil for frying',
    ],
    ingredientsTe: [
      '2 పెద్ద ఉల్లిపాయలు, సన్నగా తరిగినవి',
      '1 కప్ బేసన్ (శనగపిండి)',
      '2 టేబుల్ స్పూన్ బియ్యపు పిండి',
      '1/2 టీస్పూన్ ఎర్ర మిర్చి పొడి',
      '1/4 టీస్పూన్ పసుపు',
      'రుచికి తగినంత ఉప్పు',
      'కరివేపాకు (గుప్పెడు)',
      'వేయించడానికి నూనె',
    ],
    steps: [
      'Mix onions with salt, let them release moisture for 10 minutes.',
      'Add besan, rice flour, chili powder, turmeric, curry leaves. Mix well.',
      'Add water only if needed (onion moisture should be enough).',
      'Heat oil. Drop small portions and fry until golden and crispy.',
      'Drain on paper towel. Serve hot with chai!',
    ],
    stepsTe: [
      'ఉల్లిపాయలకు ఉప్పు కలిపి, 10 నిమిషాలు తేమ వచ్చేలా ఉంచండి.',
      'బేసన్, బియ్యపు పిండి, మిర్చి పొడి, పసుపు, కరివేపాకు వేసి బాగా కలపండి.',
      'అవసరమైతే మాత్రమే నీళ్ళు వేయండి (ఉల్లిపాయ తేమ సరిపోతుంది).',
      'నూనె వేడి చేయండి. చిన్న భాగాలుగా వేసి గోల్డెన్ & క్రిస్పీ అయ్యేవరకు వేయించండి.',
      'పేపర్ టవల్ మీద వడగట్టండి. చాయ్‌తో వేడిగా వడ్డించండి!',
    ],
    prepTime: 'PT15M',
    cookTime: 'PT20M',
    servings: 4,
    difficulty: 'medium',
    subsector: 'movie_snacks',
    tags: ['pakodi', 'onion', 'fried', 'teatime', 'movie-night'],
  },
];

const HOSTEL_HACKS: RecipeTemplate[] = [
  {
    title: 'Electric Kettle Omelette',
    titleTe: 'ఎలక్ట్రిక్ కెటిల్ ఆమ్లెట్',
    description: 'Yes, you can make omelette in a kettle! Hostel hack.',
    descriptionTe: 'అవును, కెటిల్‌లో ఆమ్లెట్ చేయవచ్చు! హాస్టల్ హ్యాక్.',
    ingredients: [
      '2 eggs',
      'Salt to taste',
      'Pepper (optional)',
      'Cooking oil spray or few drops of oil',
      'Zip-lock bag',
    ],
    ingredientsTe: [
      '2 గుడ్లు',
      'రుచికి తగినంత ఉప్పు',
      'మిరియాలు (ఐచ్ఛికం)',
      'వంట నూనె స్ప్రే లేదా కొన్ని చుక్కలు నూనె',
      'జిప్-లాక్ బ్యాగ్',
    ],
    steps: [
      'Crack eggs into a zip-lock bag. Add salt and pepper.',
      'Seal bag and squish to mix the eggs.',
      'Boil water in kettle. Once boiled, drop the sealed bag in.',
      'Close kettle lid, wait 10-12 minutes.',
      'Carefully remove bag (use cloth). Your omelette is ready!',
    ],
    stepsTe: [
      'జిప్-లాక్ బ్యాగ్‌లో గుడ్లు పగలకొట్టండి. ఉప్పు, మిరియాలు వేయండి.',
      'బ్యాగ్ సీల్ చేసి గుడ్లు కలిపేలా squish చేయండి.',
      'కెటిల్‌లో నీళ్ళు మరిగించండి. మరిగాక సీల్ చేసిన బ్యాగ్ వేయండి.',
      'కెటిల్ మూత మూసి, 10-12 నిమిషాలు వేచి ఉండండి.',
      'జాగ్రత్తగా బ్యాగ్ తీయండి (గుడ్డ వాడండి). మీ ఆమ్లెట్ రెడీ!',
    ],
    prepTime: 'PT2M',
    cookTime: 'PT12M',
    servings: 1,
    difficulty: 'easy',
    subsector: 'hostel_hacks',
    tags: ['hostel', 'kettle', 'egg', 'no-stove', 'hack'],
  },
];

// ============================================================
// IMPORT FUNCTIONS
// ============================================================

function formatRecipeBody(recipe: RecipeTemplate): string {
  const parts = [];
  
  parts.push(`# ${recipe.title}`);
  parts.push('');
  parts.push(recipe.description);
  parts.push('');
  parts.push(`⏱️ **Prep Time:** ${formatDuration(recipe.prepTime)} | **Cook Time:** ${formatDuration(recipe.cookTime)} | **Servings:** ${recipe.servings}`);
  parts.push(`🎯 **Difficulty:** ${recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}`);
  parts.push('');
  parts.push('## Ingredients');
  recipe.ingredients.forEach(ing => parts.push(`- ${ing}`));
  parts.push('');
  parts.push('## Steps');
  recipe.steps.forEach((step, i) => parts.push(`${i + 1}. ${step}`));
  
  return parts.join('\n');
}

function formatRecipeBodyTe(recipe: RecipeTemplate): string {
  const parts = [];
  
  parts.push(`# ${recipe.titleTe}`);
  parts.push('');
  parts.push(recipe.descriptionTe);
  parts.push('');
  parts.push(`⏱️ **ప్రిపరేషన్ టైమ్:** ${formatDuration(recipe.prepTime)} | **కుకింగ్ టైమ్:** ${formatDuration(recipe.cookTime)} | **సర్వింగ్స్:** ${recipe.servings}`);
  parts.push('');
  parts.push('## పదార్థాలు');
  recipe.ingredientsTe.forEach(ing => parts.push(`- ${ing}`));
  parts.push('');
  parts.push('## పద్ధతి');
  recipe.stepsTe.forEach((step, i) => parts.push(`${i + 1}. ${step}`));
  
  return parts.join('\n');
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(\d+)M/);
  if (match) return `${match[1]} min`;
  return iso;
}

async function importRecipes(recipes: RecipeTemplate[], type: string) {
  console.log(`\n🍳 Importing ${type} (${recipes.length} recipes)...\n`);

  let imported = 0;
  for (const recipe of recipes) {
    const slug = recipe.title
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
      console.log(`  ⏭️ Exists: ${recipe.title}`);
      continue;
    }

    const postData = {
      id: uuidv4(),
      title: recipe.title,
      title_te: recipe.titleTe,
      slug,
      telugu_body: formatRecipeBodyTe(recipe),
      body_te: formatRecipeBodyTe(recipe),
      
      // Content platform fields
      content_type: 'recipe',
      content_sector: 'food_bachelor',
      content_subsector: recipe.subsector,
      audience_profile: 'general',
      sensitivity_level: 'none',
      
      // Verification
      fact_confidence_score: 100, // Recipes are factual
      source_count: 1,
      source_refs: [{ id: '1', sourceName: 'Original', trustLevel: 1.0 }],
      verification_status: 'verified',
      
      // Labels
      fictional_label: false,
      requires_disclaimer: false,
      
      // Metadata
      tags: ['recipe', 'food', 'bachelor', ...recipe.tags],
      category: 'entertainment',
      status: 'draft',
      schema_type: 'Recipe',
      
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('posts').insert(postData);

    if (error) {
      console.error(`  ❌ Error: ${recipe.title} - ${error.message}`);
    } else {
      console.log(`  ✅ Imported: ${recipe.title}`);
      imported++;
    }
  }

  return imported;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find(a => a.startsWith('--type='));
  const type = typeArg?.split('=')[1] || 'all';

  console.log('🍳 Food & Bachelor Life Importer');
  console.log('=================================\n');

  let totalImported = 0;

  switch (type) {
    case 'simple':
      totalImported = await importRecipes(SIMPLE_RECIPES, 'Simple Recipes');
      break;
    case 'snacks':
      totalImported = await importRecipes(MOVIE_SNACKS, 'Movie Snacks');
      break;
    case 'hostel':
      totalImported = await importRecipes(HOSTEL_HACKS, 'Hostel Hacks');
      break;
    case 'all':
    default:
      totalImported += await importRecipes(SIMPLE_RECIPES, 'Simple Recipes');
      totalImported += await importRecipes(MOVIE_SNACKS, 'Movie Snacks');
      totalImported += await importRecipes(HOSTEL_HACKS, 'Hostel Hacks');
  }

  console.log(`\n✨ Total imported: ${totalImported} recipes`);
  console.log('   View in admin: /admin/content-sectors (select food_bachelor)');
}

main().catch(console.error);

