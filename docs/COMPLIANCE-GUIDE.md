# TeluguVibes Compliance Guide

This guide covers the privacy and compliance layer, including rate limiting, licensing, attribution requirements, and safe data handling.

## Table of Contents

1. [Overview](#overview)
2. [Data Sources and Licenses](#data-sources-and-licenses)
3. [Rate Limiting](#rate-limiting)
4. [Privacy Checks](#privacy-checks)
5. [Content Safety](#content-safety)
6. [Attribution Requirements](#attribution-requirements)
7. [API Usage](#api-usage)
8. [Best Practices](#best-practices)

---

## Overview

The compliance layer ensures all data fetching and processing adheres to:

- **Rate limits** - Respects API quotas and prevents abuse
- **Terms of Service** - Follows each source's ToS
- **Licensing** - Tracks and respects content licenses
- **Privacy** - Detects and handles PII
- **Attribution** - Generates proper source credits

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │ SafeFetcher │   │ Compliance  │   │   Data      │   │ Attribution │     │
│  │             │   │ Validator   │   │  Reviewer   │   │ Generator   │     │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘     │
│         │                 │                 │                 │             │
│         ▼                 ▼                 ▼                 ▼             │
│  • Rate limiting    • License check   • Multi-source    • Credit text      │
│  • robots.txt       • Privacy scan    • Consensus       • HTML/Markdown    │
│  • User-Agent       • Safety check    • Conflict res.   • License info     │
│  • Audit logging    • Usage rights    • Review flags    • Archival cite    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Sources and Licenses

### Tier 1: Official APIs

| Source | License | Commercial Use | Attribution |
|--------|---------|----------------|-------------|
| TMDB | API Terms | Yes (with attribution) | Required |
| OMDB | API Terms | Yes (limited) | Required |
| Wikipedia | CC-BY-SA | Yes | Required (ShareAlike) |
| Wikidata | CC0 | Yes | Not required |
| Google KG | API Terms | Yes | Not required |

### Tier 2: Community/Archive

| Source | License | Commercial Use | Attribution |
|--------|---------|----------------|-------------|
| Internet Archive | Public Domain | Yes | Recommended |
| Wikimedia Commons | Varies (per image) | Check each | Required |
| Letterboxd | Fair Use | Limited | Required |
| Cinemaazi | Archive License | No | Required |

### Tier 3: Telugu Entertainment

| Source | License | Commercial Use | Attribution |
|--------|---------|----------------|-------------|
| MovieBuff | Fair Use | Limited | Required |
| JioSaavn | API Terms | Yes | Required |
| Idlebrain | Fair Use | Limited | Required |
| GreatAndhra | Fair Use | Limited | Required |
| 123Telugu | Fair Use | Limited | Required |

### License Types

```typescript
// Available license types
type LicenseType = 
  | 'public_domain'    // No restrictions
  | 'CC0'              // Creative Commons Zero
  | 'CC-BY'            // Attribution required
  | 'CC-BY-SA'         // Attribution + ShareAlike
  | 'CC-BY-NC'         // Attribution + Non-Commercial
  | 'CC-BY-NC-SA'      // Attribution + NC + ShareAlike
  | 'fair_use'         // Limited use for commentary
  | 'editorial_use'    // Editorial context only
  | 'archive_license'  // Specific archive terms
  | 'permission_granted' // Explicit permission
  | 'api_terms'        // Follow API ToS
  | 'unknown';         // Treat as restricted
```

---

## Rate Limiting

### Configured Limits

| Source | Requests/Second | Burst | Daily Limit |
|--------|-----------------|-------|-------------|
| TMDB | 40 | 50 | - |
| OMDB | 10 | 20 | 1,000 |
| Wikipedia | 100 | 200 | - |
| Wikidata | 50 | 100 | - |
| Google KG | 10 | 20 | 100 |
| MovieBuff | 1 | 3 | - |
| JioSaavn | 2 | 5 | - |
| Telugu Sites | 1 | 3 | - |

### Using the Rate Limiter

```typescript
import { safeFetcher, canFetch } from '@/lib/compliance';

// Check before fetching
const check = await canFetch('tmdb', url);

if (!check.rateLimitOk) {
  console.log(`Rate limited. Wait ${check.requiredDelay}ms`);
}

// Safe fetch handles waiting automatically
const result = await safeFetcher.safeFetch('tmdb', url);
console.log('Remaining tokens:', result.rateLimitRemaining);
```

### Checking Status

```typescript
// Get current rate limit status
const status = safeFetcher.getRateLimitStatus('tmdb');

console.log('Tokens remaining:', status.remaining);
console.log('Daily remaining:', status.dailyRemaining);
console.log('Config:', status.config);
```

---

## Privacy Checks

The compliance layer scans data for personally identifiable information (PII).

### Detected Patterns

| Type | Pattern | Severity |
|------|---------|----------|
| Email | `user@example.com` | High |
| Phone | `+91 9876543210` | High |
| Aadhaar | `1234 5678 9012` | Critical |
| PAN | `ABCDE1234F` | Critical |
| Credit Card | `4111-1111-1111-1111` | Critical |
| Address | `Flat No. 123...` | Medium |
| Pincode | `500001` | Low |

### Sensitive Content

| Type | Examples | Severity |
|------|----------|----------|
| Political | Party names, RSS, VHP | Medium |
| Religious | Temple, mosque, church | Low |
| Caste | Dalit, Brahmin, OBC | Medium |
| Health | HIV, mental illness | High |
| Minor | Child actor, underage | Critical |

### Running Privacy Check

```typescript
import { checkPrivacy } from '@/lib/compliance';

const data = {
  synopsis: 'Movie about...',
  director: 'John Doe (john@email.com)',  // PII detected
};

const result = checkPrivacy(data);

if (!result.safe) {
  console.log('Flagged fields:', result.flaggedFields);
  console.log('Recommendations:', result.recommendations);
}
```

---

## Content Safety

Checks for inappropriate or problematic content.

### Detection Categories

| Category | Severity | Auto-Resolve |
|----------|----------|--------------|
| Copyright | Warning | No |
| Adult | Critical | No |
| Violence | Warning | No |
| Political | Info | Yes |
| Fake/Misleading | Info | Yes |
| Privacy | Warning | No |

### Running Safety Check

```typescript
import { checkContentSafety } from '@/lib/compliance';

const result = await checkContentSafety('Movie description...', 'tmdb');

console.log('Status:', result.status);  // 'approved' | 'needs_review' | 'flagged' | 'blocked'
console.log('Score:', result.score);    // 0-100
console.log('Flags:', result.flags);
```

---

## Attribution Requirements

### Generating Attributions

```typescript
import { attributionGenerator, generateMovieAttributions } from '@/lib/compliance';

// Single source
const attr = attributionGenerator.generateAttribution('tmdb', url);
console.log(attr.text);     // "Source: TMDB (API Terms)"
console.log(attr.html);     // '<span class="attribution">...</span>'
console.log(attr.markdown); // "Source: [TMDB](url) (API Terms)"

// Movie page with multiple sources
const pageAttrs = generateMovieAttributions('Movie Title', '/reviews/slug', [
  { source: 'tmdb', url: '...', contentType: 'image' },
  { source: 'wikipedia', url: '...', contentType: 'text' },
]);

console.log(pageAttrs.footerText);
console.log(pageAttrs.summary.requiresAttribution);
```

### TMDB Attribution (Required)

TMDB requires specific attribution:

```typescript
const tmdbAttr = attributionGenerator.generateTMDBAttribution();
// "This product uses the TMDB API but is not endorsed or certified by TMDB."
```

### Wikipedia Attribution (CC-BY-SA)

```typescript
const wikiAttr = attributionGenerator.generateWikipediaAttribution(articleUrl);
// "Content from Wikipedia, licensed under CC BY-SA 4.0"
```

### Archival Attribution

```typescript
const archiveAttr = attributionGenerator.generateArchivalAttribution('nfai', imageUrl, {
  title: 'Film Still',
  year: 1960,
  photographer: 'Unknown',
});
// "Image: National Film Archive of India (Archive License)"
```

---

## API Usage

### ComplianceGateway

The unified interface for all compliance operations:

```typescript
import { complianceGateway } from '@/lib/compliance';

// Fetch with compliance
const result = await complianceGateway.fetchWithCompliance('tmdb', url, {
  validatePrivacy: true,
  validateSafety: true,
  generateAttribution: true,
});

// Quick check
const quick = complianceGateway.quickCheck('tmdb', data);
// { sourceActive: true, sourceTrusted: true, dataSafe: true, ... }

// Get all active sources
const sources = complianceGateway.getActiveSources();
```

### DataReviewer

Review data from multiple sources:

```typescript
import { dataReviewer, reviewMovieData } from '@/lib/compliance';

const review = await reviewMovieData({
  movieId: 'uuid',
  title: 'Movie Title',
  sources: [
    { source: 'tmdb', data: {...}, url: '...' },
    { source: 'omdb', data: {...}, url: '...' },
  ],
});

console.log('Approved:', review.approved);
console.log('Status:', review.status);
console.log('Consensus:', review.consensus);
console.log('Issues:', review.issues);
```

---

## Best Practices

### 1. Always Use SafeFetcher

```typescript
// ✅ Do
const result = await safeFetcher.safeFetch('tmdb', url);

// ❌ Don't
const result = await fetch(url);  // Bypasses compliance
```

### 2. Check Compliance Before Operations

```typescript
// ✅ Do
const check = await canFetch('tmdb', url);
if (!check.allowed) {
  // Handle gracefully
  return fallbackData;
}

// ❌ Don't
await safeFetcher.safeFetch('tmdb', url);  // Without checking first
```

### 3. Handle Rate Limits Gracefully

```typescript
// ✅ Do
for (const movie of movies) {
  const result = await safeFetcher.safeFetch('tmdb', url);
  if (!result.success && result.error?.includes('rate')) {
    await sleep(1000);  // Additional backoff
    continue;
  }
}
```

### 4. Track Attributions

```typescript
// ✅ Do
const attrs: Attribution[] = [];
for (const source of sources) {
  const result = await safeFetcher.safeFetch(source, url);
  if (result.attribution) {
    attrs.push(result.attribution);
  }
}
// Save attributions with movie data
```

### 5. Validate Before Saving

```typescript
// ✅ Do
const privacy = checkPrivacy(data);
if (!privacy.safe && privacy.flaggedFields.some(f => f.severity === 'critical')) {
  throw new Error('Critical privacy issue');
}

// Clean or mask PII before saving
const cleanData = maskPII(data, privacy.flaggedFields);
await saveMovie(cleanData);
```

### 6. Log Audit Trail

```typescript
// Audit log is automatic with SafeFetcher
// Retrieve logs for reporting:
import { getAuditLog, getAuditStats } from '@/lib/compliance';

const logs = getAuditLog(100);  // Last 100 requests
const stats = getAuditStats();  // By-source statistics
```

### 7. Respect robots.txt

SafeFetcher automatically checks robots.txt for web sources:

```typescript
// Automatic - no action needed
const result = await safeFetcher.safeFetch('letterboxd', url);
if (!result.success && result.error?.includes('robots')) {
  console.log('Blocked by robots.txt');
}
```

---

## Compliance Checklist

Before deploying enrichment pipelines:

- [ ] All fetches go through `SafeFetcher`
- [ ] Rate limits are appropriate for each source
- [ ] Privacy checks are enabled for user-facing data
- [ ] Content safety checks are enabled
- [ ] Attributions are generated and stored
- [ ] TMDB attribution is displayed
- [ ] Wikipedia content follows CC-BY-SA
- [ ] Archival sources have proper credits
- [ ] Audit logging is enabled
- [ ] Error handling doesn't expose internal details

