/**
 * Content Decay Detection & Auto-Refresh Engine
 * 
 * Continuously monitors content health and triggers auto-refresh when needed:
 * - Low CTR detection
 * - Engagement drop monitoring
 * - Stale content identification
 * - Auto-refresh triggers (OTT releases, actor trends)
 * - Metadata locking for old movies
 * - Learning loop for pattern detection
 * 
 * Usage:
 *   import { contentDecay } from '@/lib/intelligence/content-decay';
 *   
 *   // Check if content needs refresh
 *   const needsRefresh = contentDecay.analyze(movie);
 *   
 *   // Get decay score
 *   const score = contentDecay.getDecayScore(movie, metrics);
 */

// ============================================================
// TYPES
// ============================================================

interface ContentMetrics {
  views: number;
  clicks: number;
  timeOnPage: number; // seconds
  bounceRate: number; // 0-1
  shareCount: number;
  favoriteCount: number;
  lastViewed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DecayAnalysis {
  decayScore: number; // 0-100 (higher = more decayed)
  status: 'fresh' | 'aging' | 'stale' | 'dead';
  reasons: string[];
  recommendations: string[];
  shouldRefresh: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface RefreshTrigger {
  type: 'ott_release' | 'actor_trend' | 'seasonal' | 'anniversary' | 'manual';
  reason: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface ContentHealth {
  totalContent: number;
  fresh: number;
  aging: number;
  stale: number;
  dead: number;
  avgDecayScore: number;
  needsAttention: number;
}

// ============================================================
// DECAY DETECTION ENGINE
// ============================================================

class ContentDecayEngine {
  // Decay thresholds (configurable)
  private readonly THRESHOLDS = {
    LOW_CTR: 0.02, // 2% click-through rate
    HIGH_BOUNCE: 0.7, // 70% bounce rate
    LOW_TIME: 30, // 30 seconds
    STALE_DAYS: 90, // 90 days without update
    DEAD_DAYS: 180, // 180 days without views
  };

  // Metadata lock rules
  private readonly METADATA_LOCK_YEARS = 20; // Lock movies older than 20 years

  /**
   * Analyze content decay for a single piece of content
   */
  analyze(content: any, metrics: ContentMetrics): DecayAnalysis {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let decayScore = 0;

    // Calculate age in days
    const ageInDays = this.getDaysSince(metrics.createdAt);
    const daysSinceUpdate = this.getDaysSince(metrics.updatedAt);
    const daysSinceView = metrics.lastViewed 
      ? this.getDaysSince(metrics.lastViewed)
      : ageInDays;

    // 1. CTR Analysis (Click-Through Rate)
    const ctr = metrics.clicks / Math.max(metrics.views, 1);
    if (ctr < this.THRESHOLDS.LOW_CTR) {
      decayScore += 20;
      reasons.push(`Low CTR: ${(ctr * 100).toFixed(2)}% (expected: >${(this.THRESHOLDS.LOW_CTR * 100).toFixed(0)}%)`);
      recommendations.push('Update title/thumbnail to improve CTR');
    }

    // 2. Engagement Analysis
    if (metrics.bounceRate > this.THRESHOLDS.HIGH_BOUNCE) {
      decayScore += 15;
      reasons.push(`High bounce rate: ${(metrics.bounceRate * 100).toFixed(0)}%`);
      recommendations.push('Improve content quality or add related content');
    }

    if (metrics.timeOnPage < this.THRESHOLDS.LOW_TIME) {
      decayScore += 15;
      reasons.push(`Low time on page: ${metrics.timeOnPage}s`);
      recommendations.push('Enhance content depth and engagement');
    }

    // 3. Freshness Analysis
    if (daysSinceUpdate > this.THRESHOLDS.STALE_DAYS) {
      decayScore += 20;
      reasons.push(`Stale content: ${daysSinceUpdate} days since update`);
      recommendations.push('Refresh metadata, add recent info (OTT, awards)');
    }

    // 4. View Recency
    if (daysSinceView > this.THRESHOLDS.DEAD_DAYS) {
      decayScore += 30;
      reasons.push(`Dead content: ${daysSinceView} days since last view`);
      recommendations.push('Consider archiving or promoting');
    }

    // 5. Social Signals
    const socialScore = metrics.shareCount + metrics.favoriteCount;
    if (socialScore === 0 && ageInDays > 30) {
      decayScore += 10;
      reasons.push('No social engagement');
      recommendations.push('Promote on social channels');
    }

    // Determine status
    let status: DecayAnalysis['status'];
    if (decayScore >= 70) status = 'dead';
    else if (decayScore >= 50) status = 'stale';
    else if (decayScore >= 30) status = 'aging';
    else status = 'fresh';

    // Determine priority
    let priority: DecayAnalysis['priority'];
    if (decayScore >= 80) priority = 'critical';
    else if (decayScore >= 60) priority = 'high';
    else if (decayScore >= 40) priority = 'medium';
    else priority = 'low';

    return {
      decayScore,
      status,
      reasons,
      recommendations,
      shouldRefresh: decayScore >= 50,
      priority,
    };
  }

  /**
   * Check if metadata should be locked (old movies)
   */
  shouldLockMetadata(movie: any): boolean {
    if (!movie.release_year) return false;
    
    const currentYear = new Date().getFullYear();
    const movieAge = currentYear - movie.release_year;
    
    return movieAge >= this.METADATA_LOCK_YEARS;
  }

  /**
   * Detect auto-refresh triggers
   */
  detectRefreshTriggers(movie: any): RefreshTrigger[] {
    const triggers: RefreshTrigger[] = [];
    const now = new Date();

    // 1. OTT Release Detection
    if (movie.ott_release_date) {
      const ottDate = new Date(movie.ott_release_date);
      const daysSinceOTT = this.getDaysSince(ottDate);
      
      if (daysSinceOTT >= 0 && daysSinceOTT <= 7) {
        triggers.push({
          type: 'ott_release',
          reason: 'Recent OTT release - refresh streaming info',
          priority: 'high',
          metadata: { platform: movie.ott_platforms, releaseDate: movie.ott_release_date },
        });
      }
    }

    // 2. Anniversary Detection (release anniversary)
    if (movie.release_date) {
      const releaseDate = new Date(movie.release_date);
      const isAnniversary = 
        releaseDate.getMonth() === now.getMonth() &&
        releaseDate.getDate() === now.getDate();
      
      if (isAnniversary) {
        const yearsAgo = now.getFullYear() - releaseDate.getFullYear();
        triggers.push({
          type: 'anniversary',
          reason: `${yearsAgo} year anniversary - celebrate and refresh`,
          priority: 'medium',
          metadata: { years: yearsAgo },
        });
      }
    }

    // 3. Seasonal Detection (festival seasons, summer, etc.)
    const month = now.getMonth();
    if (month >= 3 && month <= 5) { // Summer
      if (movie.genres?.includes('Action') || movie.genres?.includes('Adventure')) {
        triggers.push({
          type: 'seasonal',
          reason: 'Summer season - action/adventure content trending',
          priority: 'low',
        });
      }
    }

    // 4. Actor Trend Detection (would need external data)
    // Placeholder for integration with trending APIs
    
    return triggers;
  }

  /**
   * Get content health overview
   */
  getContentHealth(analyses: DecayAnalysis[]): ContentHealth {
    const total = analyses.length;
    const fresh = analyses.filter(a => a.status === 'fresh').length;
    const aging = analyses.filter(a => a.status === 'aging').length;
    const stale = analyses.filter(a => a.status === 'stale').length;
    const dead = analyses.filter(a => a.status === 'dead').length;
    
    const avgDecay = analyses.reduce((sum, a) => sum + a.decayScore, 0) / (total || 1);
    const needsAttention = analyses.filter(a => a.shouldRefresh).length;

    return {
      totalContent: total,
      fresh,
      aging,
      stale,
      dead,
      avgDecayScore: Math.round(avgDecay),
      needsAttention,
    };
  }

  /**
   * Learning loop: analyze patterns from top-performing content
   */
  analyzeTopPerformers(content: Array<{ movie: any; metrics: ContentMetrics }>) {
    const patterns = {
      avgTimeOnPage: 0,
      avgCTR: 0,
      avgBounceRate: 0,
      commonGenres: {} as Record<string, number>,
      commonActors: {} as Record<string, number>,
      successfulUpdateFrequency: 0,
    };

    // Analyze top performers (e.g., top 10% by engagement)
    const sorted = [...content].sort((a, b) => {
      const engagementA = a.metrics.timeOnPage / Math.max(a.metrics.bounceRate, 0.1);
      const engagementB = b.metrics.timeOnPage / Math.max(b.metrics.bounceRate, 0.1);
      return engagementB - engagementA;
    });

    const topPerformers = sorted.slice(0, Math.ceil(sorted.length * 0.1));

    // Calculate averages
    topPerformers.forEach(item => {
      patterns.avgTimeOnPage += item.metrics.timeOnPage;
      patterns.avgCTR += item.metrics.clicks / Math.max(item.metrics.views, 1);
      patterns.avgBounceRate += item.metrics.bounceRate;

      // Track genres
      item.movie.genres?.forEach((genre: string) => {
        patterns.commonGenres[genre] = (patterns.commonGenres[genre] || 0) + 1;
      });

      // Track actors
      [item.movie.hero, item.movie.heroine].filter(Boolean).forEach((actor: string) => {
        patterns.commonActors[actor] = (patterns.commonActors[actor] || 0) + 1;
      });
    });

    const count = topPerformers.length || 1;
    patterns.avgTimeOnPage /= count;
    patterns.avgCTR /= count;
    patterns.avgBounceRate /= count;

    return patterns;
  }

  /**
   * Generate auto-refresh rules based on patterns
   */
  generateAutoRefreshRules(patterns: any) {
    const rules: Array<{ condition: string; action: string; priority: string }> = [];

    // Rule 1: Time on page below pattern average
    rules.push({
      condition: `timeOnPage < ${Math.round(patterns.avgTimeOnPage)}s`,
      action: 'Enhance content depth, add related movies',
      priority: 'medium',
    });

    // Rule 2: CTR below pattern average
    rules.push({
      condition: `CTR < ${(patterns.avgCTR * 100).toFixed(2)}%`,
      action: 'Update thumbnail/title, improve SEO',
      priority: 'high',
    });

    // Rule 3: Bounce rate above pattern average
    rules.push({
      condition: `bounceRate > ${(patterns.avgBounceRate * 100).toFixed(0)}%`,
      action: 'Improve content quality, fix broken links',
      priority: 'medium',
    });

    // Rule 4: Missing popular genres
    const topGenres = Object.entries(patterns.commonGenres)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([genre]) => genre);
    
    rules.push({
      condition: `Missing top genres: ${topGenres.join(', ')}`,
      action: 'Add content from trending genres',
      priority: 'low',
    });

    return rules;
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getDecayScore(content: any, metrics: ContentMetrics): number {
    return this.analyze(content, metrics).decayScore;
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const contentDecay = new ContentDecayEngine();
export default contentDecay;


