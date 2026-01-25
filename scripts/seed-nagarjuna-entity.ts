/**
 * Seed Nagarjuna Entity Data
 * 
 * Populates the celebrities table with rich entity page data for Akkineni Nagarjuna.
 * This serves as a template for other celebrity entity pages.
 * 
 * Usage:
 *   npx tsx scripts/seed-nagarjuna-entity.ts --dry     # Preview changes
 *   npx tsx scripts/seed-nagarjuna-entity.ts --execute # Apply changes
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// NAGARJUNA ENTITY DATA
// ============================================================

// Only include fields that exist in the celebrities table schema
// Key column names: name_en (not name), profile_image (not image_url)
const NAGARJUNA_DATA = {
  // Core identity (name_en is the primary name column)
  slug: 'akkineni-nagarjuna',
  name_en: 'Akkineni Nagarjuna',
  name_te: 'అక్కినేని నాగార్జున',
  
  // Industry identity (from migration 028)
  industry_title: 'The Celluloid Scientist',
  usp: 'Extreme genre versatility + technical modernism — One of the rare Telugu actors to reinvent across decades',
  
  // Brand pillars (JSONB from migration 028)
  brand_pillars: [
    'Reinvented across decades (1986-2026)',
    'Mass-Class-Devotional versatility',
    'Ageless brand in mid-60s',
    'Technical modernism pioneer'
  ],
  
  // Legacy impact (from migration 028)
  legacy_impact: `Modernized Telugu cinema aesthetics with Shiva (1989), introducing gritty realism and changing action grammar. 
Helped normalize urban romance and realism (Geethanjali, Ninne Pelladata). 
Owned the devotional biopic space when peers avoided it (Annamayya, Sri Ramadasu, Shirdi Sai, Om Namo Venkatesaya). 
First major Telugu star to successfully host a prime-time TV show (Meelo Evaru Koteeswarudu).`,
  
  // Family relationships (Dynasty graph)
  family_relationships: {
    father: {
      name: 'Akkineni Nageswara Rao',
      slug: 'akkineni-nageswara-rao',
      relation: 'Patriarch, cultural icon, founder of Annapurna Studios'
    },
    spouse: {
      name: 'Amala Akkineni',
      slug: 'amala-akkineni',
      relation: 'Wife, actress, philanthropist'
    },
    sons: [
      { name: 'Naga Chaitanya', slug: 'naga-chaitanya', relation: 'Son, actor' },
      { name: 'Akhil Akkineni', slug: 'akhil-akkineni', relation: 'Son, actor' }
    ],
    nephews: [
      { name: 'Sumanth', slug: 'sumanth', relation: 'Nephew, actor' },
      { name: 'Sushanth', slug: 'sushanth', relation: 'Nephew, actor' }
    ],
    industry_connection: {
      name: 'Daggubati Family',
      relation: 'Linked through marriage (Grandson of D. Ramanaidu)'
    }
  },
  
  // Romantic pairings (On-screen chemistry)
  romantic_pairings: [
    { 
      name: 'Amala Akkineni', 
      slug: 'amala-akkineni', 
      count: 5, 
      highlight: 'Real-to-reel authenticity',
      films: ['Shiva', 'Nirnayam', 'President Gari Pellam', 'Rakshana', 'Chaitanya']
    },
    { 
      name: 'Ramya Krishnan', 
      slug: 'ramya-krishnan', 
      count: 8, 
      highlight: 'Most frequent & versatile pairing',
      films: ['Criminal', 'Hello Brother', 'Gharana Bullodu', 'Azad']
    },
    { 
      name: 'Tabu', 
      slug: 'tabu', 
      count: 3, 
      highlight: 'National romantic wave',
      films: ['Ninne Pelladata', 'Aavida Maa Aavide', 'Sisindri']
    },
    { 
      name: 'Soundarya', 
      slug: 'soundarya', 
      count: 5, 
      highlight: 'Family-oriented, emotional chemistry',
      films: ['Nuvvu Vastavani', 'Eduruleni Manishi', 'Santosham']
    },
    {
      name: 'Simran',
      slug: 'simran',
      count: 3,
      highlight: 'Turn-of-millennium hits',
      films: ['Seetharama Raju', 'Azad', 'Snehamante Idera']
    },
    {
      name: 'Anushka Shetty',
      slug: 'anushka-shetty',
      count: 2,
      highlight: 'Modern era pairing',
      films: ['Super', 'Don']
    }
  ],
  
  // Actor-specific career eras
  actor_eras: [
    {
      name: 'Golden Era',
      years: '1986-2000',
      themes: ['Raw action', 'Romance', 'Devotion', 'Industry reset'],
      key_films: [
        'shiva-1989',
        'geethanjali-1989',
        'nirnayam-1991',
        'criminal-1995',
        'ninne-pelladata-1996',
        'annamayya-1997',
        'nuvvu-vastavani-2000'
      ],
      highlights: 'Shiva (1989) introduced steady-cam and realistic violence to India. Geethanjali won National Award. Ninne Pelladata created national romantic wave.'
    },
    {
      name: 'Experimental Era',
      years: '2001-2020',
      themes: ['Urban comedy', 'Dual roles', 'Genre mixing', 'Risk-taking'],
      key_films: [
        'manmadhudu-2002',
        'mass-2004',
        'super-2005',
        'sri-ramadasu-2006',
        'king-2008',
        'manam-2014',
        'soggade-chinni-nayana-2016',
        'oopiri-2016'
      ],
      highlights: 'Manmadhudu established urban rom-com template. Soggade Chinni Nayana blended rural fantasy with mass appeal. Oopiri tackled social themes.'
    },
    {
      name: 'Pan-Indian Era',
      years: '2021-2026',
      themes: ['Scale', 'Grey roles', 'Reinvention', 'Antagonist experiments'],
      key_films: [
        'wild-dog-2021',
        'bangarraju-2022',
        'brahmastra-2022',
        'the-ghost-2022',
        'naa-saami-ranga-2024',
        'kuberaa-2025',
        'coolie-2025'
      ],
      highlights: 'Brahmastra (2022) brought global visibility. Kuberaa (2025) marks high-concept thriller. Coolie (2025) - first major antagonist role as Simon Xavier.'
    }
  ],
  
  // Integrity rules (What NOT to include)
  integrity_rules: {
    exclude_movies: ['30-rojullo-preminchadam-ela-2021'],
    notes: [
      'Only launched the trailer for 30 Rojullo, no acting role',
      'Do NOT list Andarivadu (Chiranjeevi film)',
      'Clearly flag Coolie as antagonist role',
      'Kuberaa features grey/morally complex role'
    ],
    flag_as_antagonist: ['coolie-2025'],
    flag_as_grey_role: ['kuberaa-2025']
  },
  
  // Fan culture and trivia (JSONB field from migration 028)
  // Note: Including social_links and signature_dialogues in fan_culture since 
  // dedicated columns may not exist yet
  fan_culture: {
    fan_identity: 'Urban/Class fanbase',
    cultural_titles: [
      'Greeku Veerudu (Post Ninne Pelladata)',
      'King of Romance',
      'Celluloid Scientist'
    ],
    viral_moments: [
      'Shiva cycle-chain scene — ritual recreation by fans',
      'Hello Brother comedy sequences',
      'Mass (2004) 4K re-release in 2024 broke records'
    ],
    entrepreneurial: [
      'Annapurna Studios',
      'International Film School (ISFT)',
      'Hospitality & real estate ventures'
    ],
    tech_edge: 'Automobile Engineering graduate (USA), personally involved in vehicle and stunt tech decisions',
    trivia: [
      'One of the first Telugu actors to work with Ram Gopal Varma',
      'Introduced steady-cam shots to Telugu cinema',
      'Close personal friendship with Amitabh Bachchan',
      'Has worked across 4 decades spanning 1980s to 2020s',
      'Owned the devotional biopic monopoly: Annamayya, Sri Ramadasu, Shirdi Sai, Om Namo Venkatesaya'
    ],
    // Social links stored in fan_culture
    social_links: [
      { platform: 'instagram', url: 'https://instagram.com/iaboredman', handle: 'iaboredman' },
      { platform: 'twitter', url: 'https://twitter.com/iaboredman', handle: 'iaboredman' },
      { platform: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Nagarjuna_Akkineni' },
      { platform: 'imdb', url: 'https://www.imdb.com/name/nm0006916/' }
    ],
    // Signature dialogues for the carousel
    signature_dialogues: [
      { dialogue: 'నా స్టైల్ వేరు', movie_title: 'King', movie_slug: 'king-2008', year: 2008 },
      { dialogue: 'I am telling you man!', movie_title: 'Hello Brother', movie_slug: 'hello-brother-1994', year: 1994 },
      { dialogue: 'ఏంటి ఇది, Love aa?', movie_title: 'Manmadhudu', movie_slug: 'manmadhudu-2002', year: 2002 }
    ],
    // Biography stored in fan_culture
    biography: `Akkineni Nagarjuna is one of Telugu cinema's most versatile and enduring stars. Son of legendary actor Akkineni Nageswara Rao (ANR), he made his debut in 1986 and has since starred in over 100 films spanning action, romance, comedy, and devotional genres.`,
    biography_te: `అక్కినేని నాగార్జున తెలుగు సినిమాలో అత్యంత బహుముఖ ప్రజ్ఞాశాలి మరియు సుదీర్ఘ నటులలో ఒకరు. ఆయన తండ్రి అక్కినేని నాగేశ్వరరావు (ANR) ప్రఖ్యాత నటుడు.`
  }
};

// ============================================================
// MAIN FUNCTION
// ============================================================

async function seedNagarjunaEntity(dryRun: boolean): Promise<void> {
  console.log(chalk.cyan('\n🎬 Seeding Nagarjuna Entity Data\n'));
  console.log(chalk.gray(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'EXECUTE'}\n`));

  try {
    // Check if celebrity already exists
    const { data: existing } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .eq('slug', NAGARJUNA_DATA.slug)
      .single();

    if (existing) {
      console.log(chalk.yellow(`⚠️  Celebrity "${existing.name}" already exists (ID: ${existing.id})`));
      console.log(chalk.gray('   Will UPDATE existing record\n'));
    } else {
      console.log(chalk.green('✓ Celebrity not found, will INSERT new record\n'));
    }

    // Display data summary
    console.log(chalk.blue('📊 Entity Data Summary:'));
    console.log(chalk.gray(`   Name: ${NAGARJUNA_DATA.name_en}`));
    console.log(chalk.gray(`   Industry Title: ${NAGARJUNA_DATA.industry_title}`));
    console.log(chalk.gray(`   Brand Pillars: ${NAGARJUNA_DATA.brand_pillars.length} items`));
    console.log(chalk.gray(`   Family Members: ${Object.keys(NAGARJUNA_DATA.family_relationships).length} relationships`));
    console.log(chalk.gray(`   Romantic Pairings: ${NAGARJUNA_DATA.romantic_pairings.length} co-stars`));
    console.log(chalk.gray(`   Career Eras: ${NAGARJUNA_DATA.actor_eras.length} eras`));
    console.log(chalk.gray(`   Trivia Items: ${NAGARJUNA_DATA.fan_culture.trivia?.length || 0} facts`));
    console.log();

    if (dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN - Showing data to be inserted/updated:\n'));
      console.log(chalk.gray(JSON.stringify(NAGARJUNA_DATA, null, 2)));
      console.log(chalk.yellow('\n✓ Dry run complete. Run with --execute to apply changes.'));
      return;
    }

    // Insert or Update the celebrity data
    let data, error;
    
    if (existing) {
      // Update existing record
      const result = await supabase
        .from('celebrities')
        .update({
          ...NAGARJUNA_DATA,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('celebrities')
        .insert({
          ...NAGARJUNA_DATA,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    console.log(chalk.green('✓ Successfully seeded Nagarjuna entity data!'));
    console.log(chalk.gray(`   Celebrity ID: ${data.id}`));
    console.log(chalk.gray(`   Slug: ${data.slug}`));
    console.log(chalk.gray(`   Industry Title: ${data.industry_title}`));

    // Verify the data
    console.log(chalk.blue('\n📋 Verification:'));
    
    const { data: verify } = await supabase
      .from('celebrities')
      .select('industry_title, brand_pillars, actor_eras, family_relationships, fan_culture')
      .eq('slug', NAGARJUNA_DATA.slug)
      .single();

    if (verify) {
      console.log(chalk.green('   ✓ industry_title: ' + (verify.industry_title ? 'SET' : 'EMPTY')));
      console.log(chalk.green('   ✓ brand_pillars: ' + (verify.brand_pillars?.length || 0) + ' items'));
      console.log(chalk.green('   ✓ actor_eras: ' + (verify.actor_eras?.length || 0) + ' eras'));
      console.log(chalk.green('   ✓ family_relationships: ' + Object.keys(verify.family_relationships || {}).length + ' relations'));
      console.log(chalk.green('   ✓ fan_culture: ' + (verify.fan_culture?.trivia?.length || 0) + ' trivia items'));
    }

    console.log(chalk.green('\n✅ Entity page data seeded successfully!'));
    console.log(chalk.blue(`\n🔗 View profile at: /movies?profile=${NAGARJUNA_DATA.slug}`));

  } catch (error) {
    console.error(chalk.red('\n❌ Error seeding entity data:'), error);
    process.exit(1);
  }
}

// ============================================================
// CLI ENTRY POINT
// ============================================================

const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

seedNagarjunaEntity(isDryRun).catch(console.error);
