#!/usr/bin/env npx ts-node
/**
 * Template Evolution CLI
 * 
 * Analyzes template performance and suggests improvements
 * Does NOT use AI to write - AI is a teacher, not a writer
 * 
 * Usage:
 *   pnpm templates:evolve                    # Run evolution analysis
 *   pnpm templates:evolve --dry              # Preview without saving
 *   pnpm templates:evolve --cluster=X        # Analyze specific cluster
 *   pnpm templates:evolve --report           # Generate detailed report
 */

import { 
  ATOMIC_BLOCKS, 
  AtomicBlock, 
  getBlocksByType, 
  updateBlockPerformance 
} from '../lib/templates/atomic-blocks';
import { 
  TEMPLATE_COMPOSITIONS, 
  TemplateComposition,
  recordTemplateOutcome 
} from '../lib/templates/template-evolution';
import { STYLE_CLUSTERS, getClusterById } from '../lib/style/style-clusters';
import { 
  calculateConfidence, 
  ContentForScoring,
  THRESHOLDS 
} from '../lib/style/confidence-gate';
import { 
  suggestBlockImprovements,
  getLearningStats,
  getApplicableLearnings
} from '../lib/style/ai-teacher';

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
  log('bright', '          🔄 Template Evolution System');
  log('cyan', '═══════════════════════════════════════════════════════════');
  console.log('\n');
}

function printBlockAnalysis() {
  log('yellow', '📦 Atomic Block Performance');
  console.log('────────────────────────────────────────────────────────────\n');
  
  // Group by type
  const byType: Record<string, AtomicBlock[]> = {};
  for (const block of ATOMIC_BLOCKS) {
    if (!byType[block.type]) {
      byType[block.type] = [];
    }
    byType[block.type].push(block);
  }
  
  for (const [type, blocks] of Object.entries(byType)) {
    log('bright', `  ${type.toUpperCase()} Blocks (${blocks.length} variants)`);
    
    // Sort by performance
    const sorted = [...blocks].sort((a, b) => 
      (b.performance?.successRate || 0) - (a.performance?.successRate || 0)
    );
    
    for (const block of sorted.slice(0, 3)) {
      const perf = block.performance;
      const successIcon = (perf?.successRate || 0) >= 0.7 ? '✅' : 
                         (perf?.successRate || 0) >= 0.4 ? '🟡' : '🔴';
      
      console.log(`     ${successIcon} ${block.id}`);
      console.log(`        Template: "${block.template.substring(0, 50)}..."`);
      console.log(`        Success: ${((perf?.successRate || 0) * 100).toFixed(0)}% | Uses: ${perf?.usageCount || 0}`);
      console.log(`        Cluster: ${block.styleClusterId}`);
      
      // Get improvement suggestions
      const suggestions = suggestBlockImprovements(block);
      if (suggestions.length > 0) {
        log('dim', `        💡 ${suggestions[0]}`);
      }
      console.log('');
    }
    console.log('');
  }
}

function printTemplateCompositions() {
  log('yellow', '📋 Template Compositions');
  console.log('────────────────────────────────────────────────────────────\n');
  
  for (const comp of TEMPLATE_COMPOSITIONS) {
    const cluster = getClusterById(comp.styleClusterId);
    const confidence = (comp.confidenceScore || 0) * 100;
    
    const scoreIcon = confidence >= 70 ? '🏆' :
                     confidence >= 50 ? '✅' :
                     confidence >= 30 ? '🟡' : '🔴';
    
    log('bright', `  ${scoreIcon} ${comp.name}`);
    console.log(`     Description: ${comp.description}`);
    console.log(`     Style: ${cluster?.name || comp.styleClusterId}`);
    console.log(`     Category: ${comp.category}`);
    console.log(`     Blocks: ${comp.blockSequence.join(' → ')}`);
    console.log(`     Performance:`);
    console.log(`        Confidence: ${confidence.toFixed(0)}%`);
    console.log(`        Uses: ${comp.usageCount || 0}`);
    console.log(`        Success Rate: ${((comp.successRate || 0) * 100).toFixed(0)}%`);
    console.log(`        Active: ${comp.isActive ? 'Yes' : 'No'}`);
    console.log('');
  }
}

function printClusterCoverage() {
  log('yellow', '🎨 Style Cluster Coverage');
  console.log('────────────────────────────────────────────────────────────\n');
  
  for (const cluster of STYLE_CLUSTERS) {
    const blocks = ATOMIC_BLOCKS.filter(b => b.styleClusterId === cluster.id);
    const templates = TEMPLATE_COMPOSITIONS.filter(t => t.styleClusterId === cluster.id);
    
    const hasHook = blocks.some(b => b.type === 'hook');
    const hasEmotion = blocks.some(b => b.type === 'emotion');
    const hasClosing = blocks.some(b => b.type === 'closing');
    const hasAllTypes = hasHook && hasEmotion && hasClosing;
    
    const coverageIcon = hasAllTypes && templates.length > 0 ? '✅' : '⚠️';
    
    log('bright', `  ${coverageIcon} ${cluster.name} (${cluster.id})`);
    console.log(`     Blocks: ${blocks.length}`);
    console.log(`     Templates: ${templates.length}`);
    console.log(`     Complete: ${hasAllTypes ? 'Yes' : 'Missing block types'}`);
    
    // Show applicable learnings
    const learnings = getApplicableLearnings('hook', cluster.id);
    if (learnings.length > 0) {
      log('dim', `     📚 ${learnings.length} learnings available`);
    }
    console.log('');
  }
}

function printEvolutionSuggestions() {
  log('yellow', '🧬 Evolution Suggestions');
  console.log('────────────────────────────────────────────────────────────\n');
  
  const suggestions: { priority: 'high' | 'medium' | 'low'; message: string }[] = [];
  
  // Check for underperforming blocks
  const poorBlocks = ATOMIC_BLOCKS.filter(b => 
    (b.performance?.usageCount || 0) >= 5 && 
    (b.performance?.successRate || 0) < 0.4
  );
  
  if (poorBlocks.length > 0) {
    suggestions.push({
      priority: 'high',
      message: `${poorBlocks.length} blocks have <40% success rate. Consider replacing or improving.`,
    });
    
    for (const block of poorBlocks.slice(0, 3)) {
      suggestions.push({
        priority: 'medium',
        message: `  └─ ${block.id}: ${((block.performance?.successRate || 0) * 100).toFixed(0)}% success`,
      });
    }
  }
  
  // Check for missing cluster coverage
  for (const cluster of STYLE_CLUSTERS) {
    const hasHook = ATOMIC_BLOCKS.some(b => b.styleClusterId === cluster.id && b.type === 'hook');
    const hasClosing = ATOMIC_BLOCKS.some(b => b.styleClusterId === cluster.id && b.type === 'closing');
    
    if (!hasHook) {
      suggestions.push({
        priority: 'high',
        message: `Missing HOOK block for ${cluster.name} cluster`,
      });
    }
    if (!hasClosing) {
      suggestions.push({
        priority: 'medium',
        message: `Missing CLOSING block for ${cluster.name} cluster`,
      });
    }
  }
  
  // Check for templates with low scores
  const poorTemplates = TEMPLATE_COMPOSITIONS.filter(t => 
    (t.usageCount || 0) >= 3 && (t.confidenceScore || 0) < 0.5
  );
  
  if (poorTemplates.length > 0) {
    suggestions.push({
      priority: 'high',
      message: `${poorTemplates.length} templates averaging <50 confidence. Need revision.`,
    });
  }
  
  // Check AI dependency
  const learningStats = getLearningStats();
  if (learningStats.applicationsTotal === 0) {
    suggestions.push({
      priority: 'low',
      message: 'No AI learnings applied yet. Templates are operating independently.',
    });
  }
  
  // Print suggestions
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  for (const s of sorted) {
    const icon = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢';
    console.log(`  ${icon} [${s.priority.toUpperCase()}] ${s.message}`);
  }
  
  if (suggestions.length === 0) {
    log('green', '  ✅ All templates and blocks are performing well!');
  }
  
  console.log('');
}

function printNoAIGateStatus() {
  log('yellow', '🚫 No-AI Gate Status');
  console.log('────────────────────────────────────────────────────────────\n');
  
  console.log(`  Confidence Thresholds:`);
  console.log(`     READY (Auto-publish):    ≥ ${THRESHOLDS.READY}`);
  console.log(`     REFINEMENT (No AI):      ≥ ${THRESHOLDS.REFINEMENT}`);
  console.log(`     AI HELP (Optional):      ≥ ${THRESHOLDS.AI_HELP}`);
  console.log(`     REJECTED:                < ${THRESHOLDS.AI_HELP}`);
  console.log('');
  
  // Simulate some content scoring
  const testContents: ContentForScoring[] = [
    {
      content: 'రష్మిక మందన్న! బాలీవుడ్‌లో సత్తా చాటుతున్న తెలుగు అమ్మాయి. పుష్ప మూవీ తర్వాత ఆమె స్టార్డమ్ అంతా ఇంతా కాదు. ఫ్యాన్స్ హృదయాలను గెలుచుకుంటూ ముందుకు సాగుతోంది మన రష్మిక.',
      contentType: 'glamour',
      clusterId: 'emotional_soft',
    },
    {
      content: 'Breaking: IPL లో సెంచరీ కొట్టాడు! ఫ్యాన్స్ సంతోషంలో మునిగిపోయారు.',
      contentType: 'sports',
      clusterId: 'mass_punchy',
    },
  ];
  
  console.log(`  Sample Content Scoring:`);
  for (const content of testContents) {
    const result = calculateConfidence(content);
    const statusIcon = result.canPublish ? '✅' : result.needsAI ? '🤖' : '📝';
    
    console.log(`     ${statusIcon} Score: ${result.score} | Status: ${result.status}`);
    console.log(`        Type: ${content.contentType}`);
    console.log(`        Needs AI: ${result.needsAI ? 'Yes' : 'No'}`);
  }
  console.log('');
  
  log('cyan', '  Goal: Minimize AI dependency through strong templates');
  console.log('');
}

function generateReport(detailed: boolean) {
  if (!detailed) return;
  
  log('yellow', '📊 Detailed Evolution Report');
  console.log('────────────────────────────────────────────────────────────\n');
  
  // Block performance matrix
  console.log('  Block Performance Matrix:');
  console.log('  ┌──────────────┬────────────┬─────────┬──────────┐');
  console.log('  │ Block ID     │ Type       │ Uses    │ Success  │');
  console.log('  ├──────────────┼────────────┼─────────┼──────────┤');
  
  for (const block of ATOMIC_BLOCKS.slice(0, 10)) {
    const uses = (block.performance?.usageCount || 0).toString().padStart(5);
    const success = ((block.performance?.successRate || 0) * 100).toFixed(0).padStart(6) + '%';
    console.log(`  │ ${block.id.padEnd(12).substring(0, 12)} │ ${block.type.padEnd(10)} │ ${uses}   │ ${success}  │`);
  }
  
  console.log('  └──────────────┴────────────┴─────────┴──────────┘');
  console.log('');
  
  // Template success distribution
  const successDistribution = {
    excellent: TEMPLATE_COMPOSITIONS.filter(t => (t.confidenceScore || 0) >= 0.75).length,
    good: TEMPLATE_COMPOSITIONS.filter(t => (t.confidenceScore || 0) >= 0.5 && (t.confidenceScore || 0) < 0.75).length,
    needsWork: TEMPLATE_COMPOSITIONS.filter(t => (t.confidenceScore || 0) < 0.5).length,
  };
  
  console.log('  Template Success Distribution:');
  console.log(`     Excellent (≥75): ${'█'.repeat(successDistribution.excellent)} ${successDistribution.excellent}`);
  console.log(`     Good (50-74):    ${'█'.repeat(successDistribution.good)} ${successDistribution.good}`);
  console.log(`     Needs Work (<50): ${'█'.repeat(successDistribution.needsWork)} ${successDistribution.needsWork}`);
  console.log('');
}

function printSummary(dryRun: boolean) {
  console.log('');
  log('cyan', '═══════════════════════════════════════════════════════════');
  
  if (dryRun) {
    log('yellow', '  ⚠️  DRY RUN - No changes saved');
  } else {
    log('green', '  ✅ Template evolution analysis complete!');
  }
  
  console.log('');
  console.log(`  Atomic Blocks: ${ATOMIC_BLOCKS.length}`);
  console.log(`  Template Compositions: ${TEMPLATE_COMPOSITIONS.length}`);
  console.log(`  Style Clusters: ${STYLE_CLUSTERS.length}`);
  
  const avgSuccess = TEMPLATE_COMPOSITIONS.reduce((sum, t) => sum + (t.successRate || 0), 0) / 
                    (TEMPLATE_COMPOSITIONS.length || 1);
  console.log(`  Avg Template Success: ${(avgSuccess * 100).toFixed(0)}%`);
  
  log('cyan', '═══════════════════════════════════════════════════════════');
  console.log('\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const detailed = args.includes('--report');
  const clusterArg = args.find(a => a.startsWith('--cluster='));
  const specificCluster = clusterArg?.split('=')[1];
  
  printHeader();
  
  if (specificCluster) {
    log('blue', `Analyzing cluster: ${specificCluster}\n`);
  }
  
  printBlockAnalysis();
  printTemplateCompositions();
  printClusterCoverage();
  printEvolutionSuggestions();
  printNoAIGateStatus();
  generateReport(detailed);
  printSummary(dryRun);
}

main().catch(console.error);

