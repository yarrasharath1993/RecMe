/**
 * TEMPLATE PUBLISHING CLI
 * 
 * CLI tool for generating and publishing content using templates only.
 * Enforces NO-AI publishing rule.
 * 
 * Usage:
 *   pnpm templates:publish --content-type movie_update --celebrity "Allu Arjun"
 *   pnpm templates:publish --content-type photoshoot --celebrity "Samantha" --no-ai
 *   pnpm templates:publish --profile mass_commercial --dry-run
 */

import {
  generatePublishableContent,
  validateForPublishing,
  getSystemStatus,
  ENFORCEMENT_MODE,
  NO_AI_PUBLISH,
  getProfileById,
  TELUGU_STYLE_PROFILES,
  getGeneratorStats,
  TELUGU_SITE_OBSERVATION_MATRIX,
  type TemplateValues,
} from '../lib/writer-intelligence';

// ============================================================
// CLI ARGUMENTS
// ============================================================

interface CLIArgs {
  contentType: string;
  profileId?: string;
  celebrity?: string;
  celebrityTe?: string;
  movie?: string;
  movieTe?: string;
  event?: string;
  eventTe?: string;
  noAi: boolean;
  dryRun: boolean;
  verbose: boolean;
  showStatus: boolean;
  showProfiles: boolean;
  showSites: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  
  const parsed: CLIArgs = {
    contentType: 'movie_update',
    noAi: true,  // Default to no-AI
    dryRun: false,
    verbose: false,
    showStatus: false,
    showProfiles: false,
    showSites: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--content-type':
      case '-t':
        parsed.contentType = args[++i];
        break;
      case '--profile':
      case '-p':
        parsed.profileId = args[++i];
        break;
      case '--celebrity':
      case '-c':
        parsed.celebrity = args[++i];
        break;
      case '--celebrity-te':
        parsed.celebrityTe = args[++i];
        break;
      case '--movie':
      case '-m':
        parsed.movie = args[++i];
        break;
      case '--movie-te':
        parsed.movieTe = args[++i];
        break;
      case '--event':
      case '-e':
        parsed.event = args[++i];
        break;
      case '--event-te':
        parsed.eventTe = args[++i];
        break;
      case '--no-ai':
        parsed.noAi = true;
        break;
      case '--allow-ai':
        parsed.noAi = false;
        break;
      case '--dry-run':
        parsed.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        parsed.verbose = true;
        break;
      case '--status':
        parsed.showStatus = true;
        break;
      case '--profiles':
        parsed.showProfiles = true;
        break;
      case '--sites':
        parsed.showSites = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }
  
  return parsed;
}

function showHelp(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           TELUGU TEMPLATE PUBLISHING CLI                      ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  pnpm templates:publish [options]

Content Options:
  --content-type, -t <type>   Content type (movie_update, photoshoot, etc.)
  --profile, -p <id>          Style profile ID
  --celebrity, -c <name>      Celebrity name (English)
  --celebrity-te <name>       Celebrity name (Telugu)
  --movie, -m <name>          Movie name (English)
  --movie-te <name>           Movie name (Telugu)
  --event, -e <event>         Event description (English)
  --event-te <event>          Event description (Telugu)

Enforcement Options:
  --no-ai                     Enforce no AI content (default)
  --allow-ai                  Allow AI in audit mode only

Output Options:
  --dry-run                   Generate but don't save
  --verbose, -v               Show detailed output

Info Commands:
  --status                    Show system status
  --profiles                  List all style profiles
  --sites                     List observation sites
  --help, -h                  Show this help

Examples:
  pnpm templates:publish --content-type movie_update -c "Allu Arjun" --movie "Pushpa 2"
  pnpm templates:publish --profile glamour_sensual -c "Samantha" --dry-run
  pnpm templates:publish --status
`);
}

// ============================================================
// MAIN FUNCTIONS
// ============================================================

async function showSystemStatus(): Promise<void> {
  const status = getSystemStatus();
  const templateStats = getGeneratorStats();
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           WRITER INTELLIGENCE SYSTEM STATUS                   ║
╚══════════════════════════════════════════════════════════════╝

🔒 ENFORCEMENT
   Mode: ${status.enforcementMode.toUpperCase()}
   No-AI Publish: ${status.noAiPublishEnabled ? '✅ ENABLED' : '⚠️ DISABLED'}

📝 STYLE PROFILES
   Total: ${status.profileCount} profiles
   
🌐 OBSERVATION SITES
   Total: ${status.observationSitesCount} sites
   Primary: ${TELUGU_SITE_OBSERVATION_MATRIX.filter(s => s.tier === 'primary').length}
   Secondary: ${TELUGU_SITE_OBSERVATION_MATRIX.filter(s => s.tier === 'secondary').length}
   Tertiary: ${TELUGU_SITE_OBSERVATION_MATRIX.filter(s => s.tier === 'tertiary').length}

📄 TEMPLATE LIBRARY
   Hook Templates: ${status.templateCounts.hooks}
   Context Templates: ${status.templateCounts.contexts}
   Emotion Templates: ${status.templateCounts.emotions}
   Closing Templates: ${status.templateCounts.closings}
   Total: ${Object.values(status.templateCounts).reduce((a, b) => a + b, 0)}
`);
}

function showProfiles(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           TELUGU STYLE PROFILES                               ║
╚══════════════════════════════════════════════════════════════╝
`);
  
  for (const profile of TELUGU_STYLE_PROFILES) {
    console.log(`
📋 ${profile.id}
   Name: ${profile.nameEn} (${profile.name})
   Rhythm: ${profile.rhythm}
   Emotion: ${profile.emotionalIntensity}
   English Mix: ${profile.englishWordTolerance}
   Glamour: ${profile.glamourTolerance}
   Word Count: ${profile.targetWordCount.min}-${profile.targetWordCount.max}
   Confidence: ${(profile.confidenceScore * 100).toFixed(0)}%
   Content Types: ${profile.contentTypes.slice(0, 3).join(', ')}${profile.contentTypes.length > 3 ? '...' : ''}
`);
  }
}

function showObservationSites(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           OBSERVATION SITE MATRIX                             ║
╚══════════════════════════════════════════════════════════════╝

⚠️ LEGAL NOTE: Only RSS feeds, sitemaps, and HTML structure are observed.
   NO article content is read or stored.
`);
  
  const byTier = {
    primary: TELUGU_SITE_OBSERVATION_MATRIX.filter(s => s.tier === 'primary'),
    secondary: TELUGU_SITE_OBSERVATION_MATRIX.filter(s => s.tier === 'secondary'),
    tertiary: TELUGU_SITE_OBSERVATION_MATRIX.filter(s => s.tier === 'tertiary'),
  };
  
  console.log('\n🟢 PRIMARY SITES (High-quality, writer-driven)');
  for (const site of byTier.primary) {
    console.log(`   • ${site.domain} [${site.category}]`);
    console.log(`     Signals: ${site.signalsToObserve.join(', ')}`);
  }
  
  console.log('\n🟡 SECONDARY SITES (Entertainment/Cinema)');
  for (const site of byTier.secondary) {
    console.log(`   • ${site.domain} [${site.category}]`);
  }
  
  console.log('\n🔵 TERTIARY SITES (Digital-first/Specialized)');
  for (const site of byTier.tertiary) {
    console.log(`   • ${site.domain} [${site.category}]`);
  }
}

async function generateContent(args: CLIArgs): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           TEMPLATE-BASED CONTENT GENERATION                   ║
╚══════════════════════════════════════════════════════════════╝
`);
  
  // Build template values
  const values: TemplateValues = {
    celebrity_name: args.celebrity || 'Star',
    celebrity_name_te: args.celebrityTe || args.celebrity || 'స్టార్',
    movie_name: args.movie,
    movie_name_te: args.movieTe || args.movie,
    event: args.event || 'లేటెస్ట్ అప్‌డేట్',
    event_te: args.eventTe || args.event || 'తాజా వార్త',
  };
  
  console.log('📋 Generation Parameters:');
  console.log(`   Content Type: ${args.contentType}`);
  console.log(`   Profile: ${args.profileId || 'auto-selected'}`);
  console.log(`   Celebrity: ${values.celebrity_name}`);
  console.log(`   Movie: ${values.movie_name || 'N/A'}`);
  console.log(`   Event: ${values.event}`);
  console.log(`   No-AI Mode: ${args.noAi ? '✅' : '⚠️'}`);
  console.log(`   Dry Run: ${args.dryRun ? 'Yes' : 'No'}`);
  
  // Generate content
  console.log('\n⏳ Generating content...\n');
  
  try {
    const result = await generatePublishableContent(
      args.contentType,
      values,
      { profileId: args.profileId }
    );
    
    console.log('✅ Content Generated!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📰 TITLE: ${result.article.title}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(result.article.body);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Stats
    console.log('📊 METRICS:');
    console.log(`   Word Count: ${result.article.totalWordCount}`);
    console.log(`   Paragraphs: ${result.article.paragraphs.length}`);
    console.log(`   Emotion Score: ${result.article.overallEmotionScore.toFixed(1)}/100`);
    console.log(`   Template Confidence: ${(result.article.templateConfidence * 100).toFixed(1)}%`);
    console.log(`   Profile Used: ${result.profile.nameEn}`);
    
    // Publishing gate
    console.log('\n🚦 PUBLISHING GATE:');
    console.log(`   Allowed: ${result.publishingApproval.allowed ? '✅ YES' : '❌ NO'}`);
    console.log(`   Source: ${result.publishingApproval.source}`);
    console.log(`   Human Review: ${result.publishingApproval.requiresHumanReview ? 'Required' : 'Not required'}`);
    console.log(`   Reason: ${result.publishingApproval.reason}`);
    
    if (!args.dryRun && result.publishingApproval.allowed) {
      console.log('\n📤 Would save to database... (implement in production)');
    } else if (args.dryRun) {
      console.log('\n📤 Dry run - content not saved.');
    } else {
      console.log('\n❌ Content not approved for publishing.');
    }
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const args = parseArgs();
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║       TELUGUVIBES WRITER INTELLIGENCE SYSTEM                  ║
║       Template-First • No-AI Publishing • Telugu Native       ║
╚══════════════════════════════════════════════════════════════╝
`);
  
  // Check enforcement
  if (!NO_AI_PUBLISH && args.noAi) {
    console.log('⚠️  WARNING: NO_AI_PUBLISH env var is not set. Using default (enabled).\n');
  }
  
  console.log(`🔒 Enforcement Mode: ${ENFORCEMENT_MODE.toUpperCase()}`);
  console.log(`🚫 No-AI Publish: ${NO_AI_PUBLISH ? 'ENABLED' : 'DISABLED'}\n`);
  
  // Handle info commands
  if (args.showStatus) {
    await showSystemStatus();
    return;
  }
  
  if (args.showProfiles) {
    showProfiles();
    return;
  }
  
  if (args.showSites) {
    showObservationSites();
    return;
  }
  
  // Generate content
  await generateContent(args);
}

main().catch(console.error);

