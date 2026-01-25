/**
 * Freshness Checker
 * 
 * Monitors data freshness and flags stale content for revalidation.
 * Part of the governance audit system.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  FreshnessCheck,
  RevalidationTarget,
  AuditEntityType,
} from './types';
import { logFreshnessDecay } from './logger';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const getSupabase = () => createClient(supabaseUrl, supabaseKey);

// Freshness thresholds in days
const FRESHNESS_THRESHOLDS = {
  movie: {
    optimal: 90,      // Within 3 months - fresh
    acceptable: 180,  // 3-6 months - starting to decay
    stale: 365,       // > 1 year - needs revalidation
  },
  celebrity: {
    optimal: 180,     // Within 6 months - fresh (celebrities update less)
    acceptable: 365,  // 6-12 months - acceptable
    stale: 730,       // > 2 years - needs revalidation
  },
};

/**
 * Calculate freshness score (0-100) based on last verification date
 */
export function calculateFreshnessScore(
  lastVerifiedAt: string | null,
  entityType: AuditEntityType = 'movie'
): number {
  if (!lastVerifiedAt) {
    return 0; // Never verified
  }

  const lastVerified = new Date(lastVerifiedAt);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24));
  
  const thresholds = FRESHNESS_THRESHOLDS[entityType as keyof typeof FRESHNESS_THRESHOLDS] || FRESHNESS_THRESHOLDS.movie;

  if (daysSince <= thresholds.optimal) {
    // 100 to 80 - linear decay within optimal period
    return Math.round(100 - (daysSince / thresholds.optimal) * 20);
  } else if (daysSince <= thresholds.acceptable) {
    // 80 to 50 - faster decay in acceptable period
    const periodDays = thresholds.acceptable - thresholds.optimal;
    const daysInPeriod = daysSince - thresholds.optimal;
    return Math.round(80 - (daysInPeriod / periodDays) * 30);
  } else if (daysSince <= thresholds.stale) {
    // 50 to 20 - continued decay
    const periodDays = thresholds.stale - thresholds.acceptable;
    const daysInPeriod = daysSince - thresholds.acceptable;
    return Math.round(50 - (daysInPeriod / periodDays) * 30);
  } else {
    // Below 20 for very stale data
    return Math.max(0, 20 - Math.floor((daysSince - thresholds.stale) / 90) * 5);
  }
}

/**
 * Get freshness status for all movies
 */
export async function checkMoviesFreshness(
  limit: number = 100,
  onlyStale: boolean = false
): Promise<FreshnessCheck[]> {
  try {
    const supabase = getSupabase();
    
    let query = supabase
      .from('movies')
      .select('id, title, last_verified_at, freshness_score')
      .order('last_verified_at', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (onlyStale) {
      // Only get movies with low freshness or null verification date
      query = query.or('last_verified_at.is.null,freshness_score.lt.50');
    }

    const { data: movies, error } = await query;

    if (error || !movies) {
      console.error('[FreshnessChecker] Error fetching movies:', error?.message);
      return [];
    }

    return movies.map(movie => {
      const daysSince = movie.last_verified_at
        ? Math.floor((Date.now() - new Date(movie.last_verified_at).getTime()) / (1000 * 60 * 60 * 24))
        : 9999;
      
      const freshnessScore = calculateFreshnessScore(movie.last_verified_at, 'movie');
      const isStale = freshnessScore < 50;

      let recommendedAction: FreshnessCheck['recommended_action'] = 'none';
      if (movie.last_verified_at === null) {
        recommendedAction = 'flag_for_review';
      } else if (isStale) {
        recommendedAction = 'revalidate';
      } else if (freshnessScore < 70) {
        recommendedAction = 'flag_for_review';
      }

      return {
        entity_type: 'movie' as AuditEntityType,
        entity_id: movie.id,
        entity_name: movie.title,
        last_verified_at: movie.last_verified_at,
        days_since_verification: daysSince,
        freshness_score: freshnessScore,
        is_stale: isStale,
        recommended_action: recommendedAction,
      };
    });
  } catch (err) {
    console.error('[FreshnessChecker] Error:', err);
    return [];
  }
}

/**
 * Get freshness status for all celebrities
 */
export async function checkCelebritiesFreshness(
  limit: number = 100,
  onlyStale: boolean = false
): Promise<FreshnessCheck[]> {
  try {
    const supabase = getSupabase();
    
    let query = supabase
      .from('celebrities')
      .select('id, name, updated_at')
      .order('updated_at', { ascending: true, nullsFirst: true })
      .limit(limit);

    const { data: celebrities, error } = await query;

    if (error || !celebrities) {
      console.error('[FreshnessChecker] Error fetching celebrities:', error?.message);
      return [];
    }

    const results: FreshnessCheck[] = [];
    
    for (const celeb of celebrities) {
      const daysSince = celeb.updated_at
        ? Math.floor((Date.now() - new Date(celeb.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        : 9999;
      
      const freshnessScore = calculateFreshnessScore(celeb.updated_at, 'celebrity');
      const isStale = freshnessScore < 50;

      if (onlyStale && !isStale && celeb.updated_at !== null) {
        continue;
      }

      let recommendedAction: FreshnessCheck['recommended_action'] = 'none';
      if (celeb.updated_at === null) {
        recommendedAction = 'flag_for_review';
      } else if (isStale) {
        recommendedAction = 'revalidate';
      } else if (freshnessScore < 70) {
        recommendedAction = 'flag_for_review';
      }

      results.push({
        entity_type: 'celebrity' as AuditEntityType,
        entity_id: celeb.id,
        entity_name: celeb.name,
        last_verified_at: celeb.updated_at,
        days_since_verification: daysSince,
        freshness_score: freshnessScore,
        is_stale: isStale,
        recommended_action: recommendedAction,
      });
    }

    return results;
  } catch (err) {
    console.error('[FreshnessChecker] Error:', err);
    return [];
  }
}

/**
 * Identify movies needing revalidation
 */
export async function getRevalidationTargets(limit: number = 50): Promise<RevalidationTarget[]> {
  try {
    const supabase = getSupabase();
    
    // Get movies with low trust or freshness scores
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title, trust_score, freshness_score, confidence_tier, last_verified_at')
      .or('trust_score.lt.50,freshness_score.lt.50,confidence_tier.eq.low')
      .order('trust_score', { ascending: true })
      .limit(limit);

    if (error || !movies) {
      console.error('[FreshnessChecker] Error getting revalidation targets:', error?.message);
      return [];
    }

    const targets: RevalidationTarget[] = [];

    for (const movie of movies) {
      const reasons: string[] = [];
      const fieldsToCheck: string[] = [];
      
      if (movie.trust_score !== null && movie.trust_score < 50) {
        reasons.push(`Low trust score (${movie.trust_score})`);
        fieldsToCheck.push('sources', 'ratings', 'cast_crew');
      }
      
      if (movie.freshness_score !== null && movie.freshness_score < 50) {
        reasons.push(`Stale data (freshness: ${movie.freshness_score})`);
        fieldsToCheck.push('release_info', 'box_office', 'streaming');
      }
      
      if (movie.confidence_tier === 'low') {
        reasons.push('Low confidence tier');
        fieldsToCheck.push('all_fields');
      }
      
      if (movie.last_verified_at === null) {
        reasons.push('Never verified');
        fieldsToCheck.push('all_fields');
      }

      // Determine priority
      let priority: RevalidationTarget['priority'] = 'low';
      if (movie.trust_score !== null && movie.trust_score < 30) {
        priority = 'high';
      } else if (movie.freshness_score !== null && movie.freshness_score < 30) {
        priority = 'high';
      } else if (reasons.length >= 2) {
        priority = 'medium';
      }

      // Estimate effort
      let estimatedEffort: RevalidationTarget['estimated_effort'] = 'quick';
      if (fieldsToCheck.includes('all_fields')) {
        estimatedEffort = 'extensive';
      } else if (fieldsToCheck.length > 2) {
        estimatedEffort = 'moderate';
      }

      targets.push({
        entity_type: 'movie',
        entity_id: movie.id,
        entity_name: movie.title,
        reason: reasons.join('; '),
        priority,
        fields_to_check: [...new Set(fieldsToCheck)],
        estimated_effort: estimatedEffort,
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    targets.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return targets;
  } catch (err) {
    console.error('[FreshnessChecker] Error getting revalidation targets:', err);
    return [];
  }
}

/**
 * Update freshness scores for all movies
 */
export async function updateFreshnessScores(
  batchSize: number = 100,
  logDecay: boolean = false
): Promise<number> {
  try {
    const supabase = getSupabase();
    let updated = 0;
    let offset = 0;

    while (true) {
      const { data: movies, error } = await supabase
        .from('movies')
        .select('id, title, last_verified_at, freshness_score')
        .range(offset, offset + batchSize - 1);

      if (error || !movies || movies.length === 0) {
        break;
      }

      const updates: Array<{ id: string; freshness_score: number }> = [];

      for (const movie of movies) {
        const newScore = calculateFreshnessScore(movie.last_verified_at, 'movie');
        const oldScore = movie.freshness_score || 0;

        if (Math.abs(newScore - oldScore) > 5) {
          updates.push({ id: movie.id, freshness_score: newScore });

          // Log significant decay
          if (logDecay && oldScore > 0 && newScore < oldScore - 10) {
            const daysSince = movie.last_verified_at
              ? Math.floor((Date.now() - new Date(movie.last_verified_at).getTime()) / (1000 * 60 * 60 * 24))
              : 9999;
            
            await logFreshnessDecay(
              'movie',
              movie.id,
              movie.title,
              daysSince,
              newScore
            );
          }
        }
      }

      // Batch update
      for (const update of updates) {
        await supabase
          .from('movies')
          .update({ freshness_score: update.freshness_score })
          .eq('id', update.id);
        updated++;
      }

      offset += batchSize;
      
      if (movies.length < batchSize) {
        break;
      }
    }

    return updated;
  } catch (err) {
    console.error('[FreshnessChecker] Error updating freshness scores:', err);
    return 0;
  }
}

/**
 * Get disputed box office entries
 */
export async function getDisputedBoxOffice(): Promise<Array<{
  movie_id: string;
  movie_title: string;
  dispute_details: Record<string, unknown>;
}>> {
  try {
    const supabase = getSupabase();
    
    // Look for movies where box office data conflicts with known sources
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title, worldwide_gross, budget, box_office_status')
      .or('worldwide_gross.is.null,budget.is.null')
      .not('box_office_status', 'is', null)
      .limit(100);

    if (error || !movies) {
      return [];
    }

    return movies
      .filter(m => {
        // Check for potential disputes
        if (m.worldwide_gross && m.budget) {
          // Extremely high ROI might be disputed
          const roi = m.worldwide_gross / m.budget;
          if (roi > 50) return true;
        }
        return m.box_office_status === 'disputed';
      })
      .map(m => ({
        movie_id: m.id,
        movie_title: m.title,
        dispute_details: {
          worldwide_gross: m.worldwide_gross,
          budget: m.budget,
          status: m.box_office_status,
        },
      }));
  } catch (err) {
    console.error('[FreshnessChecker] Error getting disputed box office:', err);
    return [];
  }
}

export default {
  calculateFreshnessScore,
  checkMoviesFreshness,
  checkCelebritiesFreshness,
  getRevalidationTargets,
  updateFreshnessScores,
  getDisputedBoxOffice,
};
