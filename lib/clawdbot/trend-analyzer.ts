import type { TrendInput, TrendAnalysis, TrendSignal } from './types';

export function analyzeTrends(input: TrendInput): TrendAnalysis {
  // Pure function: analyze trends from data points
  
  const signals: TrendSignal[] = detectTrendSignals(input.data_points);

  const top_emerging = signals
    .filter(s => s.signal_type === 'emerging')
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, 10);

  const top_peaking = signals
    .filter(s => s.signal_type === 'peaking')
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 10);

  return {
    period_start: input.period_start,
    period_end: input.period_end,
    signals,
    top_emerging,
    top_peaking,
    summary: generateTrendSummary(signals, top_emerging, top_peaking)
  };
}

// Helper functions (all pure)
function detectTrendSignals(dataPoints: any[]): TrendSignal[] {
  if (dataPoints.length === 0) {
    return [];
  }

  // Group data points by category and entity
  const grouped = new Map<string, any[]>();
  
  dataPoints.forEach(point => {
    const key = `${point.category}:${point.entity_id || 'general'}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(point);
  });

  const signals: TrendSignal[] = [];

  grouped.forEach((points, key) => {
    if (points.length < 2) return; // Need at least 2 points for trend

    // Sort by timestamp
    points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calculate velocity (rate of change)
    const firstValue = points[0].value;
    const lastValue = points[points.length - 1].value;
    const timeSpan = new Date(points[points.length - 1].timestamp).getTime() - 
                     new Date(points[0].timestamp).getTime();
    const days = timeSpan / (1000 * 60 * 60 * 24) || 1;
    
    const rawVelocity = (lastValue - firstValue) / days;
    const maxValue = Math.max(...points.map(p => p.value));
    const minValue = Math.min(...points.map(p => p.value));
    const range = maxValue - minValue || 1;
    
    // Normalize velocity to -1 to 1
    const velocity = Math.max(-1, Math.min(1, rawVelocity / range * 7)); // Scale by week
    
    // Calculate magnitude (0 to 1)
    const magnitude = range / (maxValue || 1);

    // Determine signal type
    let signal_type: 'emerging' | 'peaking' | 'declining' | 'stable';
    if (velocity > 0.3 && magnitude > 0.3) {
      signal_type = 'emerging';
    } else if (velocity > 0.1 && magnitude > 0.5) {
      signal_type = 'peaking';
    } else if (velocity < -0.3) {
      signal_type = 'declining';
    } else {
      signal_type = 'stable';
    }

    // Calculate confidence based on data points and consistency
    const confidence = Math.min(0.95, 0.5 + (points.length / 20) * 0.3 + (1 - Math.abs(velocity)) * 0.15);

    const [category, entityId] = key.split(':');
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    signals.push({
      signal_id: `signal-${key}-${Date.now()}`,
      signal_type,
      category: category as any,
      entity_id: entityId !== 'general' ? entityId : undefined,
      entity_name: firstPoint.entity_name || lastPoint.entity_name,
      velocity,
      magnitude,
      confidence,
      explanation: generateTrendExplanation(signal_type, velocity, magnitude, category, firstPoint.entity_name),
      potential_impact: determineImpact(velocity, magnitude),
      recommended_editorial_angle: generateEditorialAngle(signal_type, category, firstPoint.entity_name)
    });
  });

  return signals;
}

function generateTrendExplanation(
  signalType: string, 
  velocity: number, 
  magnitude: number, 
  category: string,
  entityName?: string
): string {
  const entity = entityName || category;
  const direction = velocity > 0 ? 'increasing' : velocity < 0 ? 'decreasing' : 'stable';
  const strength = magnitude > 0.7 ? 'strong' : magnitude > 0.4 ? 'moderate' : 'weak';

  if (signalType === 'emerging') {
    return `${entity} is showing strong emerging trend with ${strength} ${direction} momentum.`;
  } else if (signalType === 'peaking') {
    return `${entity} is at peak interest with high engagement levels.`;
  } else if (signalType === 'declining') {
    return `${entity} is showing declining interest with ${strength} downward momentum.`;
  } else {
    return `${entity} maintains stable engagement levels.`;
  }
}

function determineImpact(velocity: number, magnitude: number): 'high' | 'medium' | 'low' {
  const combined = Math.abs(velocity) * magnitude;
  if (combined > 0.5) return 'high';
  if (combined > 0.2) return 'medium';
  return 'low';
}

function generateEditorialAngle(
  signalType: string, 
  category: string, 
  entityName?: string
): string | undefined {
  const entity = entityName || category;

  if (signalType === 'emerging') {
    return `Cover the rising popularity of ${entity} and what's driving the trend.`;
  } else if (signalType === 'peaking') {
    return `Feature ${entity} while interest is at its peak - perfect timing for engagement.`;
  } else if (signalType === 'declining') {
    return `Analyze why ${entity} interest is declining and potential recovery strategies.`;
  }

  return undefined;
}

function generateTrendSummary(signals: TrendSignal[], emerging: TrendSignal[], peaking: TrendSignal[]): string {
  const total = signals.length;
  const emerging_count = signals.filter(s => s.signal_type === 'emerging').length;
  const peaking_count = signals.filter(s => s.signal_type === 'peaking').length;
  const declining_count = signals.filter(s => s.signal_type === 'declining').length;
  const stable_count = signals.filter(s => s.signal_type === 'stable').length;

  if (total === 0) {
    return 'No trend signals detected in this period.';
  }

  const parts: string[] = [];
  parts.push(`${total} trend signal${total === 1 ? '' : 's'}`);

  if (emerging_count > 0) {
    parts.push(`${emerging_count} emerging`);
  }
  if (peaking_count > 0) {
    parts.push(`${peaking_count} peaking`);
  }
  if (declining_count > 0) {
    parts.push(`${declining_count} declining`);
  }
  if (stable_count > 0) {
    parts.push(`${stable_count} stable`);
  }

  let summary = `${parts.join(', ')} detected.`;

  if (emerging.length > 0) {
    const top = emerging[0];
    summary += ` Top emerging: ${top.entity_name || top.category} (velocity: ${top.velocity.toFixed(2)}).`;
  }

  if (peaking.length > 0) {
    const top = peaking[0];
    summary += ` Top peaking: ${top.entity_name || top.category} (magnitude: ${top.magnitude.toFixed(2)}).`;
  }

  return summary;
}
