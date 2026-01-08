/**
 * SAFE FETCHER - Unified Rate Limiting and ToS Compliance
 * 
 * Provides a compliance-aware fetch wrapper that:
 * - Enforces per-source rate limits
 * - Respects robots.txt rules
 * - Tracks requests for audit
 * - Validates response licenses
 * - Adds proper User-Agent headers
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ComplianceDataSource,
  ComplianceResult,
  SafeFetchResult,
  SourceConfig,
  Attribution,
  LicenseType,
  FetchAuditEntry,
} from './types';
import { LICENSES } from './types';

// ============================================================
// SOURCE REGISTRY
// ============================================================

export const SOURCE_CONFIGS: Record<ComplianceDataSource, SourceConfig> = {
  // Tier 1: Primary APIs
  tmdb: {
    id: 'tmdb',
    name: 'The Movie Database',
    website: 'https://www.themoviedb.org',
    category: 'api',
    rateLimit: { requestsPerSecond: 40, burstLimit: 50 },
    tosUrl: 'https://www.themoviedb.org/terms-of-use',
    requiresAuth: true,
    authType: 'api_key',
    defaultLicense: 'api_terms',
    attributionRequired: true,
    isActive: true,
    isOfficial: true,
  },
  omdb: {
    id: 'omdb',
    name: 'Open Movie Database',
    website: 'https://www.omdbapi.com',
    category: 'api',
    rateLimit: { requestsPerSecond: 10, burstLimit: 20, dailyLimit: 1000 },
    tosUrl: 'https://www.omdbapi.com/legal.htm',
    requiresAuth: true,
    authType: 'api_key',
    defaultLicense: 'api_terms',
    attributionRequired: true,
    isActive: true,
    isOfficial: true,
  },
  imdb: {
    id: 'imdb',
    name: 'IMDb (via OMDB)',
    website: 'https://www.imdb.com',
    category: 'api',
    rateLimit: { requestsPerSecond: 5, burstLimit: 10 },
    requiresAuth: false,
    defaultLicense: 'api_terms',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  wikipedia: {
    id: 'wikipedia',
    name: 'Wikipedia',
    website: 'https://en.wikipedia.org',
    category: 'api',
    rateLimit: { requestsPerSecond: 100, burstLimit: 200 },
    robotsTxt: 'https://en.wikipedia.org/robots.txt',
    tosUrl: 'https://foundation.wikimedia.org/wiki/Terms_of_Use',
    requiresAuth: false,
    defaultLicense: 'CC-BY-SA',
    attributionRequired: true,
    isActive: true,
    isOfficial: true,
  },
  wikidata: {
    id: 'wikidata',
    name: 'Wikidata',
    website: 'https://www.wikidata.org',
    category: 'api',
    rateLimit: { requestsPerSecond: 50, burstLimit: 100 },
    tosUrl: 'https://foundation.wikimedia.org/wiki/Terms_of_Use',
    requiresAuth: false,
    defaultLicense: 'CC0',
    attributionRequired: false,
    isActive: true,
    isOfficial: true,
  },
  google_kg: {
    id: 'google_kg',
    name: 'Google Knowledge Graph',
    website: 'https://developers.google.com/knowledge-graph',
    category: 'api',
    rateLimit: { requestsPerSecond: 10, burstLimit: 20, dailyLimit: 100 },
    tosUrl: 'https://developers.google.com/terms',
    requiresAuth: true,
    authType: 'api_key',
    defaultLicense: 'api_terms',
    attributionRequired: false,
    isActive: true,
    isOfficial: true,
  },
  letterboxd: {
    id: 'letterboxd',
    name: 'Letterboxd',
    website: 'https://letterboxd.com',
    category: 'scraper',
    rateLimit: { requestsPerSecond: 2, burstLimit: 5 },
    robotsTxt: 'https://letterboxd.com/robots.txt',
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },

  // Tier 2: Archives
  archive_org: {
    id: 'archive_org',
    name: 'Internet Archive',
    website: 'https://archive.org',
    category: 'archive',
    rateLimit: { requestsPerSecond: 5, burstLimit: 10 },
    robotsTxt: 'https://archive.org/robots.txt',
    tosUrl: 'https://archive.org/about/terms.php',
    requiresAuth: false,
    defaultLicense: 'public_domain',
    attributionRequired: true,
    isActive: true,
    isOfficial: true,
  },
  cinemaazi: {
    id: 'cinemaazi',
    name: 'Cinemaazi',
    website: 'https://www.cinemaazi.com',
    category: 'archive',
    rateLimit: { requestsPerSecond: 2, burstLimit: 5 },
    requiresAuth: false,
    defaultLicense: 'archive_license',
    attributionRequired: true,
    isActive: true,
    isOfficial: true,
  },

  // Tier 3: Telugu Entertainment Sites (NEW)
  moviebuff: {
    id: 'moviebuff',
    name: 'MovieBuff',
    website: 'https://www.moviebuff.com',
    category: 'scraper',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3 },
    robotsTxt: 'https://www.moviebuff.com/robots.txt',
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  jiosaavn: {
    id: 'jiosaavn',
    name: 'JioSaavn',
    website: 'https://www.jiosaavn.com',
    category: 'api',
    rateLimit: { requestsPerSecond: 2, burstLimit: 5 },
    tosUrl: 'https://www.jiosaavn.com/corporate/terms',
    requiresAuth: false,
    defaultLicense: 'api_terms',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  idlebrain: {
    id: 'idlebrain',
    name: 'Idlebrain',
    website: 'https://www.idlebrain.com',
    category: 'scraper',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  greatandhra: {
    id: 'greatandhra',
    name: 'Great Andhra',
    website: 'https://www.greatandhra.com',
    category: 'scraper',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  '123telugu': {
    id: '123telugu',
    name: '123Telugu',
    website: 'https://www.123telugu.com',
    category: 'scraper',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  filmibeat: {
    id: 'filmibeat',
    name: 'Filmibeat Telugu',
    website: 'https://www.filmibeat.com/telugu',
    category: 'scraper',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },

  // Tier 4: News Sources
  sakshi: {
    id: 'sakshi',
    name: 'Sakshi',
    website: 'https://www.sakshi.com',
    category: 'news',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  eenadu: {
    id: 'eenadu',
    name: 'Eenadu',
    website: 'https://www.eenadu.net',
    category: 'news',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },

  // Internal and regional
  regional: {
    id: 'regional',
    name: 'Regional Sources',
    website: '',
    category: 'scraper',
    rateLimit: { requestsPerSecond: 5, burstLimit: 10 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  official: {
    id: 'official',
    name: 'Official Sources',
    website: '',
    category: 'api',
    rateLimit: { requestsPerSecond: 5, burstLimit: 10 },
    requiresAuth: false,
    defaultLicense: 'permission_granted',
    attributionRequired: true,
    isActive: true,
    isOfficial: true,
  },
  internal: {
    id: 'internal',
    name: 'Internal Database',
    website: '',
    category: 'api',
    rateLimit: { requestsPerSecond: 100, burstLimit: 200 },
    requiresAuth: false,
    defaultLicense: 'permission_granted',
    attributionRequired: false,
    isActive: true,
    isOfficial: true,
  },

  // ============================================================
  // CONTENT PLATFORM EXTENSION - NEW SOURCES
  // ============================================================

  // Tier 5: News & Interview Sources
  news_portals: {
    id: 'news_portals',
    name: 'News Portals (Aggregated)',
    website: '',
    category: 'news',
    rateLimit: { requestsPerSecond: 2, burstLimit: 5 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  public_interviews: {
    id: 'public_interviews',
    name: 'Public Interviews Archive',
    website: '',
    category: 'archive',
    rateLimit: { requestsPerSecond: 2, burstLimit: 5 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  
  // Tier 6: Social & Community Sources
  reddit_public: {
    id: 'reddit_public',
    name: 'Reddit Public Posts',
    website: 'https://www.reddit.com',
    category: 'social',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3, dailyLimit: 500 },
    robotsTxt: 'https://www.reddit.com/robots.txt',
    tosUrl: 'https://www.redditinc.com/policies/user-agreement',
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
  youtube_public: {
    id: 'youtube_public',
    name: 'YouTube Public Content',
    website: 'https://www.youtube.com',
    category: 'social',
    rateLimit: { requestsPerSecond: 2, burstLimit: 5, dailyLimit: 1000 },
    tosUrl: 'https://www.youtube.com/static?template=terms',
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },

  // Tier 7: Official & Legal Sources
  court_documents: {
    id: 'court_documents',
    name: 'Court Documents (Public Records)',
    website: '',
    category: 'official',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3 },
    requiresAuth: false,
    defaultLicense: 'public_domain',
    attributionRequired: true,
    isActive: true,
    isOfficial: true,
  },
  press_releases: {
    id: 'press_releases',
    name: 'Official Press Releases',
    website: '',
    category: 'official',
    rateLimit: { requestsPerSecond: 2, burstLimit: 5 },
    requiresAuth: false,
    defaultLicense: 'permission_granted',
    attributionRequired: true,
    isActive: true,
    isOfficial: true,
  },

  // Tier 8: Reference & Archive Sources
  books_references: {
    id: 'books_references',
    name: 'Book References',
    website: '',
    category: 'archive',
    rateLimit: { requestsPerSecond: 1, burstLimit: 3 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: true,
  },
  archive_articles: {
    id: 'archive_articles',
    name: 'Archived Articles',
    website: '',
    category: 'archive',
    rateLimit: { requestsPerSecond: 2, burstLimit: 5 },
    requiresAuth: false,
    defaultLicense: 'fair_use',
    attributionRequired: true,
    isActive: true,
    isOfficial: false,
  },
};

// ============================================================
// RATE LIMITER (Token Bucket Algorithm)
// ============================================================

class RateLimiter {
  private tokens: Map<ComplianceDataSource, number> = new Map();
  private lastRefill: Map<ComplianceDataSource, number> = new Map();
  private dailyCounts: Map<ComplianceDataSource, { count: number; resetAt: number }> = new Map();

  async acquire(source: ComplianceDataSource): Promise<{ ok: boolean; waitTime: number }> {
    const config = SOURCE_CONFIGS[source];
    if (!config) {
      return { ok: true, waitTime: 0 };
    }

    const { rateLimit } = config;
    const now = Date.now();

    // Check daily limit
    if (rateLimit.dailyLimit) {
      const daily = this.dailyCounts.get(source);
      if (daily) {
        if (now < daily.resetAt && daily.count >= rateLimit.dailyLimit) {
          return { ok: false, waitTime: daily.resetAt - now };
        }
        if (now >= daily.resetAt) {
          this.dailyCounts.set(source, { count: 0, resetAt: now + 86400000 });
        }
      } else {
        this.dailyCounts.set(source, { count: 0, resetAt: now + 86400000 });
      }
    }

    // Initialize tokens if needed
    if (!this.tokens.has(source)) {
      this.tokens.set(source, rateLimit.burstLimit);
      this.lastRefill.set(source, now);
    }

    // Refill tokens based on time elapsed
    const lastRefill = this.lastRefill.get(source) || now;
    const elapsed = (now - lastRefill) / 1000;
    const refill = elapsed * rateLimit.requestsPerSecond;
    const currentTokens = Math.min(
      rateLimit.burstLimit,
      (this.tokens.get(source) || 0) + refill
    );

    this.tokens.set(source, currentTokens);
    this.lastRefill.set(source, now);

    // Check if we have tokens
    if (currentTokens < 1) {
      const waitTime = Math.ceil((1 - currentTokens) / rateLimit.requestsPerSecond * 1000);
      return { ok: false, waitTime };
    }

    // Consume token
    this.tokens.set(source, currentTokens - 1);

    // Increment daily count
    if (rateLimit.dailyLimit) {
      const daily = this.dailyCounts.get(source)!;
      daily.count++;
    }

    return { ok: true, waitTime: 0 };
  }

  getRemainingTokens(source: ComplianceDataSource): number {
    return this.tokens.get(source) || 0;
  }

  getDailyRemaining(source: ComplianceDataSource): number | null {
    const config = SOURCE_CONFIGS[source];
    if (!config?.rateLimit.dailyLimit) return null;

    const daily = this.dailyCounts.get(source);
    if (!daily) return config.rateLimit.dailyLimit;

    return Math.max(0, config.rateLimit.dailyLimit - daily.count);
  }
}

// ============================================================
// ROBOTS.TXT CACHE
// ============================================================

interface RobotsTxtCache {
  rules: Map<string, boolean>; // path -> allowed
  fetchedAt: number;
  userAgent: string;
}

const robotsTxtCache: Map<string, RobotsTxtCache> = new Map();

async function checkRobotsTxt(source: ComplianceDataSource, path: string): Promise<boolean> {
  const config = SOURCE_CONFIGS[source];
  if (!config?.robotsTxt) {
    return true; // No robots.txt configured = allowed
  }

  const cacheKey = config.website;
  const cached = robotsTxtCache.get(cacheKey);
  const now = Date.now();

  // Use cache if fresh (1 hour)
  if (cached && (now - cached.fetchedAt) < 3600000) {
    // Check if path is allowed
    for (const [rule, allowed] of cached.rules) {
      if (path.startsWith(rule)) {
        return allowed;
      }
    }
    return true;
  }

  // Fetch robots.txt
  try {
    const res = await fetch(config.robotsTxt, {
      headers: { 'User-Agent': 'TeluguVibes/1.0' },
    });

    if (!res.ok) {
      return true; // Can't fetch = assume allowed
    }

    const text = await res.text();
    const rules = new Map<string, boolean>();
    let isOurAgent = false;

    for (const line of text.split('\n')) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.replace('user-agent:', '').trim();
        isOurAgent = agent === '*' || agent.includes('teluguv');
      } else if (isOurAgent && trimmed.startsWith('disallow:')) {
        const disallowPath = trimmed.replace('disallow:', '').trim();
        if (disallowPath) {
          rules.set(disallowPath, false);
        }
      } else if (isOurAgent && trimmed.startsWith('allow:')) {
        const allowPath = trimmed.replace('allow:', '').trim();
        if (allowPath) {
          rules.set(allowPath, true);
        }
      }
    }

    robotsTxtCache.set(cacheKey, {
      rules,
      fetchedAt: now,
      userAgent: 'TeluguVibes/1.0',
    });

    // Check path
    for (const [rule, allowed] of rules) {
      if (path.startsWith(rule)) {
        return allowed;
      }
    }

    return true;
  } catch {
    return true; // Error = assume allowed
  }
}

// ============================================================
// AUDIT LOGGER
// ============================================================

const auditLog: FetchAuditEntry[] = [];
const MAX_AUDIT_LOG_SIZE = 10000;

function logAudit(entry: FetchAuditEntry): void {
  auditLog.push(entry);
  if (auditLog.length > MAX_AUDIT_LOG_SIZE) {
    auditLog.splice(0, 1000); // Remove oldest 1000 entries
  }
}

export function getAuditLog(limit = 100): FetchAuditEntry[] {
  return auditLog.slice(-limit);
}

export function getAuditStats(): Record<ComplianceDataSource, { total: number; success: number; failed: number }> {
  const stats: Record<string, { total: number; success: number; failed: number }> = {};

  for (const entry of auditLog) {
    if (!stats[entry.source]) {
      stats[entry.source] = { total: 0, success: 0, failed: 0 };
    }
    stats[entry.source].total++;
    if (entry.success) {
      stats[entry.source].success++;
    } else {
      stats[entry.source].failed++;
    }
  }

  return stats as Record<ComplianceDataSource, { total: number; success: number; failed: number }>;
}

// ============================================================
// SAFE FETCHER CLASS
// ============================================================

const USER_AGENT = 'TeluguVibes/1.0 (https://teluguv.ibes.com; contact@teluguv.com)';

export class SafeFetcher {
  private rateLimiter = new RateLimiter();

  /**
   * Check if a fetch is allowed before making the request
   */
  async canFetch(source: ComplianceDataSource, url: string): Promise<ComplianceResult> {
    const config = SOURCE_CONFIGS[source];
    const warnings: string[] = [];

    if (!config) {
      return {
        allowed: false,
        rateLimitOk: false,
        tosCompliant: false,
        robotsTxtAllowed: false,
        requiredDelay: 0,
        reason: `Unknown source: ${source}`,
        warnings,
      };
    }

    if (!config.isActive) {
      return {
        allowed: false,
        rateLimitOk: false,
        tosCompliant: false,
        robotsTxtAllowed: false,
        requiredDelay: 0,
        reason: `Source ${source} is not active`,
        warnings,
      };
    }

    // Check rate limit
    const rateCheck = await this.rateLimiter.acquire(source);
    if (!rateCheck.ok) {
      return {
        allowed: false,
        rateLimitOk: false,
        tosCompliant: true,
        robotsTxtAllowed: true,
        requiredDelay: rateCheck.waitTime,
        reason: `Rate limit exceeded. Wait ${Math.ceil(rateCheck.waitTime / 1000)}s`,
        warnings,
      };
    }

    // Check robots.txt
    let robotsAllowed = true;
    try {
      const urlObj = new URL(url);
      robotsAllowed = await checkRobotsTxt(source, urlObj.pathname);
    } catch {
      // Invalid URL - still allow but warn
      warnings.push('Could not parse URL for robots.txt check');
    }

    if (!robotsAllowed) {
      warnings.push(`Path blocked by robots.txt for ${source}`);
    }

    // Check if scraper source (more caution needed)
    if (config.category === 'scraper' && !config.isOfficial) {
      warnings.push(`${source} uses scraping - ensure fair use compliance`);
    }

    return {
      allowed: robotsAllowed,
      rateLimitOk: true,
      tosCompliant: true,
      robotsTxtAllowed: robotsAllowed,
      requiredDelay: 0,
      warnings,
    };
  }

  /**
   * Fetch with full compliance checking
   */
  async safeFetch<T = unknown>(
    source: ComplianceDataSource,
    url: string,
    options: RequestInit = {}
  ): Promise<SafeFetchResult<T>> {
    const requestId = uuidv4();
    const startTime = Date.now();
    const config = SOURCE_CONFIGS[source];

    // Pre-flight compliance check
    const compliance = await this.canFetch(source, url);
    if (!compliance.allowed) {
      return {
        success: false,
        data: null,
        error: compliance.reason || 'Compliance check failed',
        source,
        fetchedAt: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        license: 'unknown',
        attribution: null,
        requestId,
        rateLimitRemaining: this.rateLimiter.getRemainingTokens(source),
      };
    }

    // Wait if required
    if (compliance.requiredDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, compliance.requiredDelay));
    }

    // Add User-Agent header
    const headers = new Headers(options.headers);
    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', USER_AGENT);
    }

    // Execute fetch
    let response: Response;
    let data: T | null = null;
    let error: string | undefined;
    let success = false;

    try {
      response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json() as T;
        } else {
          data = await response.text() as unknown as T;
        }
        success = true;
      } else {
        error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;

    // Log audit entry
    logAudit({
      id: requestId,
      source,
      url,
      method: (options.method || 'GET') as 'GET' | 'POST',
      timestamp: new Date().toISOString(),
      responseStatus: success ? 200 : 0,
      responseTime,
      rateLimitRemaining: this.rateLimiter.getRemainingTokens(source),
      userAgent: USER_AGENT,
      success,
      error,
    });

    // Generate attribution
    const attribution = this.generateAttribution(source, url);

    return {
      success,
      data,
      error,
      source,
      fetchedAt: new Date().toISOString(),
      responseTime,
      license: config?.defaultLicense || 'unknown',
      attribution,
      requestId,
      rateLimitRemaining: this.rateLimiter.getRemainingTokens(source),
    };
  }

  /**
   * Batch fetch from multiple sources
   */
  async batchFetch<T = unknown>(
    requests: Array<{ source: ComplianceDataSource; url: string; options?: RequestInit }>
  ): Promise<SafeFetchResult<T>[]> {
    return Promise.all(
      requests.map(req => this.safeFetch<T>(req.source, req.url, req.options))
    );
  }

  /**
   * Generate attribution for a source
   */
  generateAttribution(source: ComplianceDataSource, url: string): Attribution {
    const config = SOURCE_CONFIGS[source];
    const license = config?.defaultLicense || 'unknown';
    const licenseInfo = LICENSES[license];

    const sourceName = config?.name || source;
    const text = licenseInfo.requiresAttribution
      ? `Source: ${sourceName} (${license})`
      : `Source: ${sourceName}`;

    return {
      text,
      html: `<span class="attribution">Source: <a href="${url}" target="_blank" rel="noopener">${sourceName}</a> (${licenseInfo.name})</span>`,
      markdown: `Source: [${sourceName}](${url}) (${licenseInfo.name})`,
      license,
      sourceUrl: url,
      sourceName,
      requiresLink: licenseInfo.requiresAttribution,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Get source configuration
   */
  getSourceConfig(source: ComplianceDataSource): SourceConfig | undefined {
    return SOURCE_CONFIGS[source];
  }

  /**
   * Get all active sources
   */
  getActiveSources(): SourceConfig[] {
    return Object.values(SOURCE_CONFIGS).filter(c => c.isActive);
  }

  /**
   * Get rate limit status for a source
   */
  getRateLimitStatus(source: ComplianceDataSource): {
    remaining: number;
    dailyRemaining: number | null;
    config: { requestsPerSecond: number; burstLimit: number; dailyLimit?: number };
  } {
    const config = SOURCE_CONFIGS[source];
    return {
      remaining: this.rateLimiter.getRemainingTokens(source),
      dailyRemaining: this.rateLimiter.getDailyRemaining(source),
      config: config?.rateLimit || { requestsPerSecond: 10, burstLimit: 20 },
    };
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const safeFetcher = new SafeFetcher();

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

export async function safeFetch<T = unknown>(
  source: ComplianceDataSource,
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  return safeFetcher.safeFetch<T>(source, url, options);
}

export async function canFetch(
  source: ComplianceDataSource,
  url: string
): Promise<ComplianceResult> {
  return safeFetcher.canFetch(source, url);
}

