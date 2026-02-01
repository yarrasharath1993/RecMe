import type { EditorialIdea, IdeaGeneration } from './types';

export interface IdeaGenerationInput {
  validation_analysis?: any;
  governance_analysis?: any;
  confidence_analysis?: any;
  trend_analysis?: any;
  change_summary?: any;
}

export function generateEditorialIdeas(input: IdeaGenerationInput): IdeaGeneration {
  // Pure function: generate editorial ideas from analyses
  
  const ideas: EditorialIdea[] = [];

  // Generate ideas from validation analysis
  if (input.validation_analysis) {
    ideas.push(...generateIdeasFromValidation(input.validation_analysis));
  }

  // Generate ideas from governance analysis
  if (input.governance_analysis) {
    ideas.push(...generateIdeasFromGovernance(input.governance_analysis));
  }

  // Generate ideas from trend analysis
  if (input.trend_analysis) {
    ideas.push(...generateIdeasFromTrends(input.trend_analysis));
  }

  // Generate ideas from change summary
  if (input.change_summary) {
    ideas.push(...generateIdeasFromChanges(input.change_summary));
  }

  const high_priority_count = ideas.filter(i => i.priority === 'high').length;

  return {
    generated_at: new Date().toISOString(),
    ideas,
    high_priority_count,
    summary: generateIdeasSummary(ideas, high_priority_count)
  };
}

// Helper functions (all pure)
function generateIdeasFromValidation(analysis: any): EditorialIdea[] {
  const ideas: EditorialIdea[] = [];

  if (analysis.overall_health === 'critical') {
    ideas.push({
      idea_id: `idea-validation-critical-${Date.now()}`,
      title: 'Data Quality Crisis: Addressing Critical Validation Issues',
      category: 'analysis',
      priority: 'high',
      rationale: `System has ${analysis.critical_count} critical validation issues requiring immediate attention.`,
      data_points: [
        `${analysis.critical_count} critical issues`,
        `${analysis.high_count} high severity issues`,
        `Overall health: ${analysis.overall_health}`
      ],
      target_audience: 'Technical team and data quality stakeholders',
      estimated_engagement: 'medium',
      related_entities: [],
      suggested_headline: 'Critical Data Quality Issues Detected - Action Required',
      suggested_angle: 'Investigate root causes and implement fixes for critical validation failures'
    });
  }

  if (analysis.explanations && analysis.explanations.length > 0) {
    const topIssue = analysis.explanations[0];
    if (topIssue.severity === 'high' || topIssue.severity === 'critical') {
      ideas.push({
        idea_id: `idea-validation-issue-${Date.now()}`,
        title: `Validation Issue Analysis: ${topIssue.field}`,
        category: 'analysis',
        priority: topIssue.severity === 'critical' ? 'high' : 'medium',
        rationale: `High-severity validation issue in ${topIssue.field} field requires investigation.`,
        data_points: [
          `Field: ${topIssue.field}`,
          `Severity: ${topIssue.severity}`,
          `Recommended action: ${topIssue.recommended_action}`
        ],
        target_audience: 'Data quality team',
        estimated_engagement: 'low',
        related_entities: [],
        suggested_angle: `Analyze why ${topIssue.field} validation is failing and propose solutions`
      });
    }
  }

  return ideas;
}

function generateIdeasFromGovernance(analysis: any): EditorialIdea[] {
  const ideas: EditorialIdea[] = [];

  if (analysis.rejected_count > 0) {
    ideas.push({
      idea_id: `idea-governance-rejected-${Date.now()}`,
      title: 'Governance Review: Rejected Entities Analysis',
      category: 'analysis',
      priority: 'high',
      rationale: `${analysis.rejected_count} entities were rejected by governance system.`,
      data_points: [
        `${analysis.rejected_count} rejected entities`,
        `${analysis.flagged_count} flagged entities`,
        `Total decisions: ${analysis.total_decisions}`
      ],
      target_audience: 'Editorial and quality assurance teams',
      estimated_engagement: 'medium',
      related_entities: [],
      suggested_headline: 'Governance System Rejects Multiple Entities',
      suggested_angle: 'Review rejection patterns and improve data quality standards'
    });
  }

  if (analysis.trust_distribution && analysis.trust_distribution.unverified > 10) {
    ideas.push({
      idea_id: `idea-governance-unverified-${Date.now()}`,
      title: 'Unverified Content: Improving Trust Scores',
      category: 'feature',
      priority: 'medium',
      rationale: `High number of unverified entities (${analysis.trust_distribution.unverified}) suggests need for verification campaign.`,
      data_points: [
        `${analysis.trust_distribution.unverified} unverified entities`,
        `Trust distribution: ${JSON.stringify(analysis.trust_distribution)}`
      ],
      target_audience: 'Content team',
      estimated_engagement: 'low',
      related_entities: [],
      suggested_angle: 'Create content verification initiative to improve trust scores'
    });
  }

  return ideas;
}

function generateIdeasFromTrends(analysis: any): EditorialIdea[] {
  const ideas: EditorialIdea[] = [];

  if (analysis.top_emerging && analysis.top_emerging.length > 0) {
    const topTrend = analysis.top_emerging[0];
    ideas.push({
      idea_id: `idea-trend-emerging-${Date.now()}`,
      title: `Emerging Trend: ${topTrend.entity_name || topTrend.category}`,
      category: 'news',
      priority: 'high',
      rationale: `Strong emerging trend detected with velocity ${topTrend.velocity.toFixed(2)} and high potential impact.`,
      data_points: [
        `Trend type: ${topTrend.signal_type}`,
        `Velocity: ${topTrend.velocity.toFixed(2)}`,
        `Magnitude: ${topTrend.magnitude.toFixed(2)}`,
        `Confidence: ${(topTrend.confidence * 100).toFixed(0)}%`
      ],
      target_audience: 'General audience',
      estimated_engagement: 'high',
      related_entities: topTrend.entity_id ? [{ type: topTrend.category, id: topTrend.entity_id, name: topTrend.entity_name || '' }] : [],
      suggested_headline: `${topTrend.entity_name || topTrend.category} is Trending - Here's Why`,
      suggested_angle: topTrend.recommended_editorial_angle || `Cover the rising popularity of ${topTrend.entity_name || topTrend.category}`
    });
  }

  if (analysis.top_peaking && analysis.top_peaking.length > 0) {
    const topPeak = analysis.top_peaking[0];
    ideas.push({
      idea_id: `idea-trend-peaking-${Date.now()}`,
      title: `Peak Interest: ${topPeak.entity_name || topPeak.category}`,
      category: 'feature',
      priority: 'high',
      rationale: `Entity is at peak interest with magnitude ${topPeak.magnitude.toFixed(2)} - perfect timing for coverage.`,
      data_points: [
        `Peak magnitude: ${topPeak.magnitude.toFixed(2)}`,
        `Confidence: ${(topPeak.confidence * 100).toFixed(0)}%`
      ],
      target_audience: 'General audience',
      estimated_engagement: 'high',
      related_entities: topPeak.entity_id ? [{ type: topPeak.category, id: topPeak.entity_id, name: topPeak.entity_name || '' }] : [],
      suggested_headline: `${topPeak.entity_name || topPeak.category} is Hot Right Now`,
      suggested_angle: topPeak.recommended_editorial_angle || `Feature ${topPeak.entity_name || topPeak.category} while interest is at peak`
    });
  }

  return ideas;
}

function generateIdeasFromChanges(summary: any): EditorialIdea[] {
  const ideas: EditorialIdea[] = [];

  if (summary.movies_added > 10) {
    ideas.push({
      idea_id: `idea-changes-movies-${Date.now()}`,
      title: `New Movies Added: ${summary.movies_added} Latest Additions`,
      category: 'list',
      priority: 'medium',
      rationale: `${summary.movies_added} new movies were added to the database.`,
      data_points: [
        `${summary.movies_added} movies added`,
        `${summary.movies_updated} movies updated`
      ],
      target_audience: 'Movie enthusiasts',
      estimated_engagement: 'medium',
      related_entities: [],
      suggested_headline: `Check Out These ${summary.movies_added} New Movies`,
      suggested_angle: 'Create a curated list of newly added movies'
    });
  }

  if (summary.reviews_generated > 20) {
    ideas.push({
      idea_id: `idea-changes-reviews-${Date.now()}`,
      title: `New Reviews: ${summary.reviews_generated} Reviews Generated`,
      category: 'feature',
      priority: 'medium',
      rationale: `Significant number of reviews (${summary.reviews_generated}) were generated.`,
      data_points: [
        `${summary.reviews_generated} reviews generated`,
        `${summary.reviews_enhanced} reviews enhanced`
      ],
      target_audience: 'Review readers',
      estimated_engagement: 'medium',
      related_entities: [],
      suggested_headline: `Fresh Reviews: ${summary.reviews_generated} New Reviews Available`,
      suggested_angle: 'Highlight newly generated reviews and their key insights'
    });
  }

  if (summary.trust_score_improvements > 50) {
    ideas.push({
      idea_id: `idea-changes-trust-${Date.now()}`,
      title: 'Data Quality Improvement: Trust Score Gains',
      category: 'analysis',
      priority: 'low',
      rationale: `Trust scores improved for ${summary.trust_score_improvements} entities.`,
      data_points: [
        `${summary.trust_score_improvements} trust score improvements`,
        `Top contributor: ${summary.top_contributors?.[0]?.source || 'unknown'}`
      ],
      target_audience: 'Technical team',
      estimated_engagement: 'low',
      related_entities: [],
      suggested_angle: 'Report on data quality improvements and verification efforts'
    });
  }

  return ideas;
}

function generateIdeasSummary(ideas: EditorialIdea[], highPriority: number): string {
  const total = ideas.length;
  
  if (total === 0) {
    return 'No editorial ideas generated from current analyses.';
  }

  const byCategory = new Map<string, number>();
  ideas.forEach(idea => {
    byCategory.set(idea.category, (byCategory.get(idea.category) || 0) + 1);
  });

  const categoryParts: string[] = [];
  byCategory.forEach((count, category) => {
    categoryParts.push(`${count} ${category}`);
  });

  let summary = `Generated ${total} editorial idea${total === 1 ? '' : 's'}`;
  
  if (categoryParts.length > 0) {
    summary += ` (${categoryParts.join(', ')})`;
  }

  if (highPriority > 0) {
    summary += `. ${highPriority} high-priority idea${highPriority === 1 ? '' : 's'} require${highPriority === 1 ? 's' : ''} immediate attention.`;
  }

  return summary;
}
