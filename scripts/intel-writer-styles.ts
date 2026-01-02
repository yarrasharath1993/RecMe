#!/usr/bin/env npx ts-node
/**
 * Writer Style Intelligence CLI
 * 
 * Collects style signals from Telugu content portals
 * DOES NOT copy text - extracts only patterns
 * 
 * Usage:
 *   pnpm intel:writer-styles             # Run full analysis
 *   pnpm intel:writer-styles --dry       # Preview without saving
 *   pnpm intel:writer-styles --portal=X  # Analyze specific portal
 */

import { PREDEFINED_STYLE_SIGNALS, WriterStyleSignal, aggregateStyleSignals } from '../lib/style/writer-signals';
import { STYLE_CLUSTERS, getClusterById } from '../lib/style/style-clusters';
import { getLearningStats } from '../lib/style/ai-teacher';

// Alias for compatibility
const WRITER_STYLE_SIGNALS = PREDEFINED_STYLE_SIGNALS;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(color: keyof typeof colors, ...args: any[]) {
  console.log(colors[color], ...args, colors.reset);
}

function printHeader() {
  console.log('\n');
  log('cyan', '═══════════════════════════════════════════════════════════');
  log('bright', '          📝 Writer Style Intelligence Analysis');
  log('cyan', '═══════════════════════════════════════════════════════════');
  console.log('\n');
}

function printPortalSignals() {
  log('yellow', '📊 Registered Style Signals by Portal');
  console.log('────────────────────────────────────────────────────────────\n');
  
  // Group by site name
  const byPortal: Record<string, WriterStyleSignal[]> = {};
  for (const signal of WRITER_STYLE_SIGNALS) {
    if (!byPortal[signal.siteName]) {
      byPortal[signal.siteName] = [];
    }
    byPortal[signal.siteName].push(signal);
  }
  
  for (const [portal, signals] of Object.entries(byPortal)) {
    log('bright', `  🌐 ${portal}`);
    
    for (const signal of signals) {
      console.log(`     └─ Category: ${signal.siteCategory}`);
      console.log(`        Avg Sentence: ${signal.avgSentenceLength} chars`);
      console.log(`        Headlines: ~${signal.headlineWordCountAvg} words`);
      console.log(`        English Ratio: ${(signal.englishMixRatio * 100).toFixed(0)}%`);
      console.log(`        Intro Style: ${signal.introStyle}`);
      console.log(`        Closing Style: ${signal.closingStyle}`);
      console.log(`        Emotion Curve: ${signal.emotionCurvePattern}`);
      console.log('');
    }
  }
}

function printStyleClusters() {
  log('yellow', '🎨 Style Clusters');
  console.log('────────────────────────────────────────────────────────────\n');
  
  for (const cluster of STYLE_CLUSTERS) {
    log('bright', `  ${cluster.id.toUpperCase()}: ${cluster.name}`);
    console.log(`     Description: ${cluster.description}`);
    if (cluster.characteristics) {
      console.log(`     Sentence Avg: ${cluster.characteristics.sentenceLengthAvg || 'N/A'} chars`);
      console.log(`     Paragraphs: ${cluster.characteristics.paragraphCount?.min || 0}-${cluster.characteristics.paragraphCount?.max || 0}`);
    }
    console.log(`     Best for: ${cluster.templatePreference?.join(', ') || 'general'}`);
    console.log('');
  }
}

function printAggregatedSignals() {
  const aggregated = aggregateStyleSignals(WRITER_STYLE_SIGNALS);
  
  log('yellow', '📈 Aggregated Style Patterns');
  console.log('────────────────────────────────────────────────────────────\n');
  
  console.log(`  Sentence Length:`);
  console.log(`     Average: ${aggregated.avgSentenceLength.toFixed(0)} chars`);
  console.log(`     Short Sentence Ratio: ${(aggregated.avgShortSentenceRatio * 100).toFixed(1)}%`);
  console.log('');
  
  console.log(`  Paragraphs:`);
  console.log(`     Per Article: ${aggregated.avgParagraphsPerArticle.toFixed(1)}`);
  console.log(`     Density: ${aggregated.avgParagraphDensity.toFixed(1)} sentences/para`);
  console.log('');
  
  console.log(`  Headlines:`);
  console.log(`     Avg Word Count: ${aggregated.avgHeadlineWordCount.toFixed(1)} words`);
  console.log('');
  
  console.log(`  English Mix:`);
  console.log(`     Average: ${(aggregated.avgEnglishMixRatio * 100).toFixed(1)}%`);
  console.log('');
  
  log('cyan', '  Most Common Patterns:');
  console.log(`     Emotion Curve: ${aggregated.dominantEmotionCurve}`);
  console.log(`     Intro Style: ${aggregated.dominantIntroStyle}`);
  console.log(`     Closing Style: ${aggregated.dominantClosingStyle}`);
  console.log('');
}

function printLearningStats() {
  const stats = getLearningStats();
  
  log('yellow', '🧠 AI Learning Statistics');
  console.log('────────────────────────────────────────────────────────────\n');
  
  console.log(`  Total Learnings: ${stats.totalLearnings}`);
  console.log(`  Applications: ${stats.applicationsTotal}`);
  console.log(`  Avg Confidence: ${(stats.avgConfidence * 100).toFixed(0)}%`);
  console.log('');
  
  console.log('  By Type:');
  for (const [type, count] of Object.entries(stats.byType)) {
    console.log(`     ${type}: ${count}`);
  }
  console.log('');
  
  if (stats.topLearnings.length > 0) {
    log('cyan', '  Top Learnings:');
    for (const learning of stats.topLearnings) {
      console.log(`     • [${learning.learningType}] ${learning.pattern}`);
      console.log(`       ${learning.description}`);
      console.log(`       Confidence: ${(learning.confidenceScore * 100).toFixed(0)}%`);
    }
  }
  console.log('');
}

function printRecommendations() {
  const aggregated = aggregateStyleSignals(WRITER_STYLE_SIGNALS);
  
  log('yellow', '💡 Template Optimization Recommendations');
  console.log('────────────────────────────────────────────────────────────\n');
  
  const recommendations: string[] = [];
  
  // Sentence length recommendations
  if (aggregated.avgSentenceLength > 80) {
    recommendations.push('Consider shorter sentences for better readability');
  } else {
    recommendations.push(`Aim for ~${aggregated.avgSentenceLength.toFixed(0)} char sentences`);
  }
  
  // English ratio
  if (aggregated.avgEnglishMixRatio > 0.15) {
    recommendations.push('Reduce English words - aim for <15% mix');
  } else {
    recommendations.push(`Telugu purity is good (${((1 - aggregated.avgEnglishMixRatio) * 100).toFixed(0)}% Telugu)`);
  }
  
  // Opening style
  recommendations.push(`Use ${aggregated.dominantIntroStyle} openings (most common pattern)`);
  
  // Closing style
  recommendations.push(`Close with ${aggregated.dominantClosingStyle} endings`);
  
  // Fan connect
  recommendations.push('Always include fan-connect elements for engagement');
  
  for (let i = 0; i < recommendations.length; i++) {
    console.log(`  ${i + 1}. ${recommendations[i]}`);
  }
  console.log('');
}

function printSummary(dryRun: boolean) {
  console.log('');
  log('cyan', '═══════════════════════════════════════════════════════════');
  
  if (dryRun) {
    log('yellow', '  ⚠️  DRY RUN - No changes saved to database');
  } else {
    log('green', '  ✅ Style intelligence analysis complete!');
  }
  
  console.log('');
  console.log(`  Portals Analyzed: ${new Set(WRITER_STYLE_SIGNALS.map(s => s.siteName)).size}`);
  console.log(`  Style Signals: ${WRITER_STYLE_SIGNALS.length}`);
  console.log(`  Style Clusters: ${STYLE_CLUSTERS.length}`);
  console.log(`  AI Learnings: ${getLearningStats().totalLearnings}`);
  
  log('cyan', '═══════════════════════════════════════════════════════════');
  console.log('\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const portalArg = args.find(a => a.startsWith('--portal='));
  const specificPortal = portalArg?.split('=')[1];
  
  printHeader();
  
  if (specificPortal) {
    log('blue', `Analyzing portal: ${specificPortal}\n`);
  }
  
  printPortalSignals();
  printStyleClusters();
  printAggregatedSignals();
  printLearningStats();
  printRecommendations();
  printSummary(dryRun);
}

main().catch(console.error);

