/**
 * IMAGE COMPARATOR
 * 
 * Compare images from different sources to detect duplicates and boost confidence.
 * 
 * Strategies:
 * 1. URL comparison (exact match)
 * 2. URL normalization (handle redirects, CDN variations)
 * 3. Simple hash comparison (for future enhancement)
 */

export type MatchType = 'exact_url' | 'normalized_url' | 'similar_hash' | 'no_match';

export interface ImageMatch {
  source1: string;
  source2: string;
  url1: string;
  url2: string;
  match_type: MatchType;
  similarity_score: number;
  confidence_boost: number;
}

/**
 * Normalize URL for comparison
 * - Remove query parameters
 * - Normalize protocol (http/https)
 * - Handle common CDN variations
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Remove query parameters and fragments
    parsed.search = '';
    parsed.hash = '';
    
    // Normalize protocol to https
    parsed.protocol = 'https:';
    
    // Normalize hostname (remove www.)
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    parsed.hostname = hostname;
    
    // Handle TMDB CDN variations
    if (hostname.includes('themoviedb.org')) {
      // Normalize to standard image.tmdb.org
      parsed.hostname = 'image.tmdb.org';
    }
    
    // Handle Wikimedia CDN variations
    if (hostname.includes('wikimedia.org')) {
      // Normalize to upload.wikimedia.org
      if (hostname.includes('upload')) {
        parsed.hostname = 'upload.wikimedia.org';
      }
    }
    
    return parsed.toString();
  } catch {
    // If URL parsing fails, return original
    return url.toLowerCase();
  }
}

/**
 * Extract image identifier from URL
 * Used for detecting same image from different CDNs
 */
function extractImageIdentifier(url: string): string | null {
  // TMDB image hash
  const tmdbMatch = url.match(/\/([a-zA-Z0-9]+)\.(jpg|jpeg|png|webp)$/);
  if (tmdbMatch) {
    return tmdbMatch[1];
  }
  
  // Wikimedia file name
  const wikiMatch = url.match(/File:([^?#]+)/i);
  if (wikiMatch) {
    return wikiMatch[1];
  }
  
  // Internet Archive identifier
  const iaMatch = url.match(/archive\.org\/download\/([^/]+)/);
  if (iaMatch) {
    return iaMatch[1];
  }
  
  // Generic filename extraction
  const filenameMatch = url.match(/\/([^/?#]+)\.(jpg|jpeg|png|webp|gif)$/i);
  if (filenameMatch) {
    return filenameMatch[1];
  }
  
  return null;
}

/**
 * Compare two image URLs
 */
export function compareImageUrls(
  url1: string,
  url2: string,
  source1: string,
  source2: string
): ImageMatch {
  // Exact URL match
  if (url1 === url2) {
    return {
      source1,
      source2,
      url1,
      url2,
      match_type: 'exact_url',
      similarity_score: 1.0,
      confidence_boost: 0.05,
    };
  }
  
  // Normalized URL match
  const normalized1 = normalizeUrl(url1);
  const normalized2 = normalizeUrl(url2);
  
  if (normalized1 === normalized2) {
    return {
      source1,
      source2,
      url1,
      url2,
      match_type: 'normalized_url',
      similarity_score: 0.95,
      confidence_boost: 0.05,
    };
  }
  
  // Identifier match (same image, different CDN)
  const id1 = extractImageIdentifier(url1);
  const id2 = extractImageIdentifier(url2);
  
  if (id1 && id2 && id1.toLowerCase() === id2.toLowerCase()) {
    return {
      source1,
      source2,
      url1,
      url2,
      match_type: 'similar_hash',
      similarity_score: 0.85,
      confidence_boost: 0.03,
    };
  }
  
  // No match
  return {
    source1,
    source2,
    url1,
    url2,
    match_type: 'no_match',
    similarity_score: 0.0,
    confidence_boost: 0.0,
  };
}

/**
 * Compare baseline image against multiple validate-only sources
 */
export function compareAgainstValidateSources(
  baselineUrl: string,
  baselineSource: string,
  validateImages: Array<{ url: string; source: string }>
): {
  matches: ImageMatch[];
  agreement_count: number;
  total_confidence_boost: number;
  confirmed_by: string[];
} {
  const matches: ImageMatch[] = [];
  let totalBoost = 0;
  const confirmedBy: string[] = [];
  
  for (const validateImg of validateImages) {
    const match = compareImageUrls(
      baselineUrl,
      validateImg.url,
      baselineSource,
      validateImg.source
    );
    
    matches.push(match);
    
    if (match.match_type !== 'no_match') {
      totalBoost += match.confidence_boost;
      confirmedBy.push(validateImg.source);
    }
  }
  
  return {
    matches,
    agreement_count: confirmedBy.length,
    total_confidence_boost: Math.min(totalBoost, 0.05), // Cap at +0.05
    confirmed_by: confirmedBy,
  };
}

/**
 * Compare multiple ingest/enrich sources to find agreement
 */
export function compareIngestSources(
  images: Array<{ url: string; source: string; confidence: number }>
): {
  clusters: Array<{
    urls: string[];
    sources: string[];
    agreement_count: number;
    average_confidence: number;
    confidence_boost: number;
  }>;
  best_cluster: {
    urls: string[];
    sources: string[];
    agreement_count: number;
    confidence_boost: number;
  } | null;
} {
  if (images.length === 0) {
    return { clusters: [], best_cluster: null };
  }
  
  // Group similar images into clusters
  const clusters: Array<{
    urls: string[];
    sources: string[];
    confidences: number[];
  }> = [];
  
  for (const img of images) {
    let addedToCluster = false;
    
    // Try to add to existing cluster
    for (const cluster of clusters) {
      const match = compareImageUrls(
        img.url,
        cluster.urls[0],
        img.source,
        cluster.sources[0]
      );
      
      if (match.match_type !== 'no_match') {
        cluster.urls.push(img.url);
        cluster.sources.push(img.source);
        cluster.confidences.push(img.confidence);
        addedToCluster = true;
        break;
      }
    }
    
    // Create new cluster if not added
    if (!addedToCluster) {
      clusters.push({
        urls: [img.url],
        sources: [img.source],
        confidences: [img.confidence],
      });
    }
  }
  
  // Calculate cluster metrics
  const processedClusters = clusters.map(cluster => {
    const agreementCount = cluster.sources.length;
    const avgConfidence = cluster.confidences.reduce((a, b) => a + b, 0) / cluster.confidences.length;
    
    // Boost confidence based on agreement
    // +0.03 for each additional source (2+ sources)
    const boost = agreementCount >= 2 ? 0.03 * (agreementCount - 1) : 0;
    
    return {
      urls: cluster.urls,
      sources: cluster.sources,
      agreement_count: agreementCount,
      average_confidence: avgConfidence,
      confidence_boost: Math.min(boost, 0.10), // Cap at +0.10
    };
  });
  
  // Find best cluster (most agreement, highest confidence)
  const bestCluster = processedClusters.length > 0
    ? processedClusters.reduce((best, current) => {
        if (current.agreement_count > best.agreement_count) {
          return current;
        }
        if (current.agreement_count === best.agreement_count && 
            current.average_confidence > best.average_confidence) {
          return current;
        }
        return best;
      })
    : null;
  
  return {
    clusters: processedClusters,
    best_cluster: bestCluster,
  };
}

/**
 * Check if URL appears to be AI-generated
 * (for future enhancement with ML-based detection)
 */
export function detectAIGenerated(url: string, sourceId: string): {
  is_ai_generated: boolean;
  confidence: number;
  reason: string | null;
} {
  // Simple heuristics for now
  const aiPatterns = [
    /midjourney/i,
    /dall-?e/i,
    /stable-?diffusion/i,
    /ai-generated/i,
    /synthetic/i,
  ];
  
  for (const pattern of aiPatterns) {
    if (pattern.test(url)) {
      return {
        is_ai_generated: true,
        confidence: 0.9,
        reason: 'AI generation detected in URL',
      };
    }
  }
  
  // Check if source is marked as AI
  if (sourceId === 'ai' || sourceId === 'ai_inference') {
    return {
      is_ai_generated: true,
      confidence: 1.0,
      reason: 'Source is AI inference',
    };
  }
  
  return {
    is_ai_generated: false,
    confidence: 0.0,
    reason: null,
  };
}

/**
 * Generate confidence adjustment based on multi-source validation
 */
export function calculateMultiSourceConfidence(
  baselineUrl: string,
  baselineSource: string,
  baselineConfidence: number,
  validateOnlyImages: Array<{ url: string; source: string }>,
  ingestImages: Array<{ url: string; source: string; confidence: number }>
): {
  final_confidence: number;
  validate_only_boost: number;
  multi_source_boost: number;
  confirmed_by: string[];
  agreement_sources: string[];
} {
  let finalConfidence = baselineConfidence;
  let validateOnlyBoost = 0;
  let multiSourceBoost = 0;
  let confirmedBy: string[] = [];
  let agreementSources: string[] = [];
  
  // Phase 1: Check validate-only sources for confirmation
  if (validateOnlyImages.length > 0) {
    const validateResult = compareAgainstValidateSources(
      baselineUrl,
      baselineSource,
      validateOnlyImages
    );
    
    validateOnlyBoost = validateResult.total_confidence_boost;
    confirmedBy = validateResult.confirmed_by;
  }
  
  // Phase 2: Check ingest/enrich sources for agreement
  if (ingestImages.length > 0) {
    const ingestResult = compareIngestSources(ingestImages);
    
    if (ingestResult.best_cluster && ingestResult.best_cluster.agreement_count >= 2) {
      multiSourceBoost = ingestResult.best_cluster.confidence_boost;
      agreementSources = ingestResult.best_cluster.sources;
    }
  }
  
  // Apply boosts
  finalConfidence += validateOnlyBoost + multiSourceBoost;
  
  // Cap at 0.98 (never 1.0)
  finalConfidence = Math.min(finalConfidence, 0.98);
  
  return {
    final_confidence: finalConfidence,
    validate_only_boost: validateOnlyBoost,
    multi_source_boost: multiSourceBoost,
    confirmed_by: confirmedBy,
    agreement_sources: agreementSources,
  };
}
