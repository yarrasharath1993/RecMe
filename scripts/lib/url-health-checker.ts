/**
 * URL Health Checker
 * 
 * Batch validation of image URLs with:
 * - Concurrent requests with rate limiting
 * - DNS resolution checking
 * - SSL certificate validation
 * - Content-type verification
 * - Response time tracking
 */

import chalk from 'chalk';

// ============================================================
// TYPES
// ============================================================

export interface UrlHealthResult {
  url: string;
  status: 'healthy' | 'broken' | 'slow' | 'invalid' | 'redirect';
  statusCode?: number;
  contentType?: string;
  responseTimeMs?: number;
  redirectUrl?: string;
  error?: string;
  checkedAt: Date;
}

export interface UrlHealthSummary {
  total: number;
  healthy: number;
  broken: number;
  slow: number;
  invalid: number;
  redirects: number;
  avgResponseTime: number;
  byHost: Record<string, {
    total: number;
    healthy: number;
    broken: number;
  }>;
}

export interface BatchHealthCheckOptions {
  concurrency?: number;
  timeout?: number; // milliseconds
  slowThreshold?: number; // milliseconds
  followRedirects?: boolean;
  onProgress?: (completed: number, total: number, result: UrlHealthResult) => void;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_SLOW_THRESHOLD = 3000; // 3 seconds
const DEFAULT_CONCURRENCY = 10;

// Hosts known to be reliable (skip detailed checks for performance)
const TRUSTED_HOSTS = [
  'image.tmdb.org',
  'www.themoviedb.org',
  'm.media-amazon.com',
  'upload.wikimedia.org',
];

// ============================================================
// SINGLE URL CHECK
// ============================================================

/**
 * Check health of a single URL
 */
export async function checkUrlHealth(
  url: string,
  options: {
    timeout?: number;
    slowThreshold?: number;
    followRedirects?: boolean;
  } = {}
): Promise<UrlHealthResult> {
  const {
    timeout = DEFAULT_TIMEOUT,
    slowThreshold = DEFAULT_SLOW_THRESHOLD,
    followRedirects = true,
  } = options;

  const checkedAt = new Date();

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      url,
      status: 'invalid',
      error: 'Invalid URL format',
      checkedAt,
    };
  }

  // Skip detailed check for trusted hosts (assume healthy)
  if (TRUSTED_HOSTS.some(host => parsedUrl.hostname === host)) {
    return {
      url,
      status: 'healthy',
      responseTimeMs: 0,
      checkedAt,
    };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: followRedirects ? 'follow' : 'manual',
      headers: {
        'User-Agent': 'TeluguPortal-HealthChecker/1.0',
      },
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location') || undefined;
      return {
        url,
        status: 'redirect',
        statusCode: response.status,
        redirectUrl,
        responseTimeMs,
        checkedAt,
      };
    }

    // Check if it's actually an image
    const contentType = response.headers.get('content-type') || '';
    const isImage = contentType.startsWith('image/');

    if (!response.ok) {
      return {
        url,
        status: 'broken',
        statusCode: response.status,
        contentType,
        responseTimeMs,
        error: `HTTP ${response.status}`,
        checkedAt,
      };
    }

    if (!isImage) {
      return {
        url,
        status: 'broken',
        statusCode: response.status,
        contentType,
        responseTimeMs,
        error: `Not an image (${contentType})`,
        checkedAt,
      };
    }

    // Check if slow
    if (responseTimeMs > slowThreshold) {
      return {
        url,
        status: 'slow',
        statusCode: response.status,
        contentType,
        responseTimeMs,
        checkedAt,
      };
    }

    return {
      url,
      status: 'healthy',
      statusCode: response.status,
      contentType,
      responseTimeMs,
      checkedAt,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      url,
      status: 'broken',
      responseTimeMs,
      error: errorMessage.includes('abort') ? 'Timeout' : errorMessage,
      checkedAt,
    };
  }
}

// ============================================================
// BATCH URL CHECK
// ============================================================

/**
 * Check health of multiple URLs with concurrency control
 */
export async function batchCheckUrlHealth(
  urls: string[],
  options: BatchHealthCheckOptions = {}
): Promise<Map<string, UrlHealthResult>> {
  const {
    concurrency = DEFAULT_CONCURRENCY,
    timeout = DEFAULT_TIMEOUT,
    slowThreshold = DEFAULT_SLOW_THRESHOLD,
    followRedirects = true,
    onProgress,
  } = options;

  const results = new Map<string, UrlHealthResult>();
  const uniqueUrls = [...new Set(urls.filter(u => u && u.trim()))];

  let completed = 0;

  // Process in batches
  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    const batch = uniqueUrls.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(url => checkUrlHealth(url, { timeout, slowThreshold, followRedirects }))
    );

    batch.forEach((url, index) => {
      const result = batchResults[index];
      results.set(url, result);
      completed++;
      onProgress?.(completed, uniqueUrls.length, result);
    });

    // Small delay between batches to avoid overwhelming servers
    if (i + concurrency < uniqueUrls.length) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  return results;
}

// ============================================================
// SUMMARY GENERATION
// ============================================================

/**
 * Generate summary from health check results
 */
export function generateHealthSummary(
  results: Map<string, UrlHealthResult>
): UrlHealthSummary {
  const summary: UrlHealthSummary = {
    total: results.size,
    healthy: 0,
    broken: 0,
    slow: 0,
    invalid: 0,
    redirects: 0,
    avgResponseTime: 0,
    byHost: {},
  };

  let totalResponseTime = 0;
  let responsesWithTime = 0;

  results.forEach((result, url) => {
    // Count by status
    switch (result.status) {
      case 'healthy':
        summary.healthy++;
        break;
      case 'broken':
        summary.broken++;
        break;
      case 'slow':
        summary.slow++;
        break;
      case 'invalid':
        summary.invalid++;
        break;
      case 'redirect':
        summary.redirects++;
        break;
    }

    // Track response time
    if (result.responseTimeMs !== undefined) {
      totalResponseTime += result.responseTimeMs;
      responsesWithTime++;
    }

    // Group by host
    try {
      const host = new URL(url).hostname;
      if (!summary.byHost[host]) {
        summary.byHost[host] = { total: 0, healthy: 0, broken: 0 };
      }
      summary.byHost[host].total++;
      if (result.status === 'healthy' || result.status === 'slow') {
        summary.byHost[host].healthy++;
      } else {
        summary.byHost[host].broken++;
      }
    } catch {
      // Invalid URL, skip host grouping
    }
  });

  summary.avgResponseTime = responsesWithTime > 0 
    ? Math.round(totalResponseTime / responsesWithTime) 
    : 0;

  return summary;
}

/**
 * Get broken URLs from results
 */
export function getBrokenUrls(results: Map<string, UrlHealthResult>): UrlHealthResult[] {
  return Array.from(results.values()).filter(r => r.status === 'broken' || r.status === 'invalid');
}

/**
 * Get slow URLs from results
 */
export function getSlowUrls(results: Map<string, UrlHealthResult>): UrlHealthResult[] {
  return Array.from(results.values()).filter(r => r.status === 'slow');
}

// ============================================================
// REPORTING
// ============================================================

/**
 * Print health check summary to console
 */
export function printHealthSummary(summary: UrlHealthSummary): void {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  URL HEALTH CHECK SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  console.log(`  Total URLs:     ${summary.total}`);
  console.log(`  Healthy:        ${chalk.green(summary.healthy.toString())}`);
  console.log(`  Broken:         ${chalk.red(summary.broken.toString())}`);
  console.log(`  Slow:           ${chalk.yellow(summary.slow.toString())}`);
  console.log(`  Invalid:        ${chalk.red(summary.invalid.toString())}`);
  console.log(`  Redirects:      ${chalk.blue(summary.redirects.toString())}`);
  console.log(`  Avg Response:   ${summary.avgResponseTime}ms`);

  // Host breakdown (top 10 by issues)
  const hostsByIssues = Object.entries(summary.byHost)
    .filter(([, stats]) => stats.broken > 0)
    .sort((a, b) => b[1].broken - a[1].broken)
    .slice(0, 10);

  if (hostsByIssues.length > 0) {
    console.log(chalk.cyan('\n  Top Hosts with Issues:'));
    hostsByIssues.forEach(([host, stats]) => {
      const pct = Math.round((stats.broken / stats.total) * 100);
      console.log(`    ${host}: ${stats.broken}/${stats.total} broken (${pct}%)`);
    });
  }
}

/**
 * Print broken URLs details
 */
export function printBrokenUrls(results: UrlHealthResult[], limit: number = 20): void {
  if (results.length === 0) {
    console.log(chalk.green('\n  ✓ No broken URLs found'));
    return;
  }

  console.log(chalk.red(`\n  Broken URLs (${results.length} total):`));
  
  results.slice(0, limit).forEach(result => {
    const shortUrl = result.url.length > 60 
      ? result.url.substring(0, 60) + '...' 
      : result.url;
    console.log(chalk.red(`    ✗ ${shortUrl}`));
    console.log(chalk.gray(`      Error: ${result.error || 'Unknown'}`));
  });

  if (results.length > limit) {
    console.log(chalk.gray(`    ... and ${results.length - limit} more`));
  }
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Extract unique hosts from URLs
 */
export function extractHosts(urls: string[]): string[] {
  const hosts = new Set<string>();
  urls.forEach(url => {
    try {
      hosts.add(new URL(url).hostname);
    } catch {
      // Skip invalid URLs
    }
  });
  return Array.from(hosts);
}

/**
 * Filter URLs by host
 */
export function filterByHost(urls: string[], host: string): string[] {
  return urls.filter(url => {
    try {
      return new URL(url).hostname === host;
    } catch {
      return false;
    }
  });
}

/**
 * Check if host is trusted (skip health check)
 */
export function isTrustedHost(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return TRUSTED_HOSTS.some(host => hostname === host);
  } catch {
    return false;
  }
}
