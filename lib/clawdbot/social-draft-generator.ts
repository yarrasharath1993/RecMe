import type { SocialDraft, SocialDraftGeneration, SOSAlert } from './types';

export interface SocialDraftInput {
  validation_analysis?: any;
  governance_analysis?: any;
  confidence_analysis?: any;
  trend_analysis?: any;
  change_summary?: any;
  sos_alerts?: SOSAlert[];
}

export function generateSocialDrafts(input: SocialDraftInput): SocialDraftGeneration {
  // Pure function: generate social media drafts
  
  const drafts: SocialDraft[] = [];

  // Generate SOS alerts
  if (input.sos_alerts && input.sos_alerts.length > 0) {
    drafts.push(...generateSOSDrafts(input.sos_alerts));
  }

  // Generate trend updates
  if (input.trend_analysis) {
    drafts.push(...generateTrendDrafts(input.trend_analysis));
  }

  // Generate change summaries
  if (input.change_summary) {
    drafts.push(...generateChangeDrafts(input.change_summary));
  }

  // Generate validation updates
  if (input.validation_analysis) {
    drafts.push(...generateValidationDrafts(input.validation_analysis));
  }

  return {
    generated_at: new Date().toISOString(),
    drafts,
    summary: generateDraftsSummary(drafts)
  };
}

// Helper functions (all pure)
function generateSOSDrafts(alerts: SOSAlert[]): SocialDraft[] {
  return alerts.map(alert => {
    const isCritical = alert.severity === 'critical';
    const urgencyEmoji = isCritical ? '🚨' : alert.severity === 'high' ? '⚠️' : '📢';
    
    let content = `${urgencyEmoji} ${alert.title}\n\n`;
    content += `${alert.description}\n\n`;
    
    if (alert.affected_entities.length > 0) {
      content += `Affected: ${alert.affected_entities.slice(0, 3).map(e => e.name || e.id).join(', ')}`;
      if (alert.affected_entities.length > 3) {
        content += ` (+${alert.affected_entities.length - 3} more)`;
      }
      content += '\n\n';
    }

    if (alert.recommended_actions.length > 0) {
      content += `Actions: ${alert.recommended_actions.slice(0, 2).join(', ')}\n\n`;
    }

    content += `Urgency: ${alert.urgency}`;

    return {
      draft_id: `draft-sos-${alert.alert_id}`,
      platform: 'telegram',
      type: 'alert',
      content,
      metadata: {
        priority: alert.severity === 'critical' ? 'high' : alert.severity === 'high' ? 'high' : 'medium',
        requires_approval: true, // All SOS alerts require approval
        suggested_send_time: alert.urgency === 'immediate' ? 'now' : undefined,
        tags: [alert.category, alert.severity, 'sos']
      }
    };
  });
}

function generateTrendDrafts(analysis: any): SocialDraft[] {
  const drafts: SocialDraft[] = [];

  if (analysis.top_emerging && analysis.top_emerging.length > 0) {
    const topTrend = analysis.top_emerging[0];
    const content = `🔥 Emerging Trend Alert!\n\n` +
      `${topTrend.entity_name || topTrend.category} is gaining momentum.\n\n` +
      `${topTrend.explanation}\n\n` +
      `📊 Velocity: ${(topTrend.velocity * 100).toFixed(0)}%\n` +
      `📈 Impact: ${topTrend.potential_impact}`;

    drafts.push({
      draft_id: `draft-trend-emerging-${Date.now()}`,
      platform: 'telegram',
      type: 'trend',
      content,
      metadata: {
        priority: topTrend.potential_impact === 'high' ? 'high' : 'medium',
        requires_approval: topTrend.potential_impact === 'high',
        tags: ['trend', 'emerging', topTrend.category]
      }
    });
  }

  if (analysis.top_peaking && analysis.top_peaking.length > 0) {
    const topPeak = analysis.top_peaking[0];
    const content = `📈 Peak Interest!\n\n` +
      `${topPeak.entity_name || topPeak.category} is at peak engagement right now.\n\n` +
      `Perfect timing for coverage! 🎯`;

    drafts.push({
      draft_id: `draft-trend-peaking-${Date.now()}`,
      platform: 'telegram',
      type: 'trend',
      content,
      metadata: {
        priority: 'high',
        requires_approval: false,
        tags: ['trend', 'peaking', topPeak.category]
      }
    });
  }

  return drafts;
}

function generateChangeDrafts(summary: any): SocialDraft[] {
  const drafts: SocialDraft[] = [];

  const highlights = summary.highlights || [];
  if (highlights.length > 0) {
    const topHighlights = highlights.slice(0, 3);
    const content = `📊 System Update\n\n` +
      `${topHighlights.join('\n')}\n\n` +
      `Period: ${new Date(summary.period_start).toLocaleDateString()} - ${new Date(summary.period_end).toLocaleDateString()}`;

    drafts.push({
      draft_id: `draft-change-summary-${Date.now()}`,
      platform: 'telegram',
      type: 'summary',
      content,
      metadata: {
        priority: 'low',
        requires_approval: false,
        tags: ['update', 'summary']
      }
    });
  }

  if (summary.movies_added > 0) {
    const content = `🎬 New Movies Added!\n\n` +
      `We've added ${summary.movies_added} new movie${summary.movies_added === 1 ? '' : 's'} to our database.\n\n` +
      `Check them out! 👉`;

    drafts.push({
      draft_id: `draft-movies-added-${Date.now()}`,
      platform: 'telegram',
      type: 'update',
      content,
      metadata: {
        priority: summary.movies_added > 10 ? 'medium' : 'low',
        requires_approval: false,
        tags: ['movies', 'update']
      }
    });
  }

  return drafts;
}

function generateValidationDrafts(analysis: any): SocialDraft[] {
  const drafts: SocialDraft[] = [];

  if (analysis.overall_health === 'critical') {
    const content = `⚠️ System Alert\n\n` +
      `Critical validation issues detected: ${analysis.critical_count} critical, ${analysis.high_count} high severity.\n\n` +
      `Action required. Please review.`;

    drafts.push({
      draft_id: `draft-validation-critical-${Date.now()}`,
      platform: 'telegram',
      type: 'alert',
      content,
      metadata: {
        priority: 'high',
        requires_approval: true,
        tags: ['validation', 'alert', 'critical']
      }
    });
  } else if (analysis.overall_health === 'degraded') {
    const content = `📢 System Status\n\n` +
      `Validation health is degraded: ${analysis.high_count} high severity issues.\n\n` +
      `Review recommended.`;

    drafts.push({
      draft_id: `draft-validation-degraded-${Date.now()}`,
      platform: 'telegram',
      type: 'alert',
      content,
      metadata: {
        priority: 'medium',
        requires_approval: false,
        tags: ['validation', 'status']
      }
    });
  }

  return drafts;
}

function generateDraftsSummary(drafts: SocialDraft[]): string {
  const total = drafts.length;
  
  if (total === 0) {
    return 'No social media drafts generated.';
  }

  const byType = new Map<string, number>();
  const byPriority = new Map<string, number>();
  const requiresApproval = drafts.filter(d => d.metadata.requires_approval).length;

  drafts.forEach(draft => {
    byType.set(draft.type, (byType.get(draft.type) || 0) + 1);
    byPriority.set(draft.metadata.priority, (byPriority.get(draft.metadata.priority) || 0) + 1);
  });

  const typeParts: string[] = [];
  byType.forEach((count, type) => {
    typeParts.push(`${count} ${type}`);
  });

  let summary = `Generated ${total} social media draft${total === 1 ? '' : 's'}`;
  
  if (typeParts.length > 0) {
    summary += ` (${typeParts.join(', ')})`;
  }

  if (requiresApproval > 0) {
    summary += `. ${requiresApproval} draft${requiresApproval === 1 ? '' : 's'} require${requiresApproval === 1 ? 's' : ''} approval before sending.`;
  }

  return summary;
}
