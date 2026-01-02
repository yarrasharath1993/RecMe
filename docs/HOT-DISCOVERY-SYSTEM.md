# Hot & Glamour Discovery System

## Overview

The Hot & Glamour Discovery System automatically discovers, validates, and ranks Telugu/Indian celebrities for the Hot section. It uses metadata-only sources and maintains legal compliance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOT DISCOVERY PIPELINE                        │
└─────────────────────────────────────────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Wikidata   │      │    TMDB     │      │   Google    │
│   SPARQL    │      │    API      │      │   Trends    │
└─────────────┘      └─────────────┘      └─────────────┘
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                              ▼
                 ┌─────────────────────┐
                 │  Entity Discovery   │
                 │  (lib/hot/entity-   │
                 │   discovery.ts)     │
                 └─────────────────────┘
                              │
                              ▼
                 ┌─────────────────────┐
                 │  Social Resolution  │
                 │  (lib/social/       │
                 │   source-adapters)  │
                 └─────────────────────┘
                              │
                              ▼
                 ┌─────────────────────┐
                 │  Ranking Engine     │
                 │  (lib/hot/ranking-  │
                 │   engine.ts)        │
                 └─────────────────────┘
                              │
                              ▼
                 ┌─────────────────────┐
                 │  Hot Candidates     │
                 │  (v_hot_glamour_    │
                 │   candidates view)  │
                 └─────────────────────┘
```

## Components

### 1. Entity Discovery (`lib/hot/entity-discovery.ts`)

Automatically discovers Telugu celebrities from:
- **Wikidata**: SPARQL queries for actresses/models/anchors
- **TMDB**: Popular actresses search

```bash
# Preview discovery
pnpm run discover --dry

# Discover from Wikidata only
pnpm run discover --source=wikidata --limit=50

# Full pipeline
pnpm run discover --verbose
```

### 2. Social Handle Resolution (`lib/social/`)

Resolves official social handles using:
- Wikidata properties (P2003, P2002, P2397)
- TMDB external_ids API
- Wikipedia external links

Priority:
1. Instagram (highest glamour value)
2. YouTube
3. Twitter/X
4. TikTok
5. Snapchat (metadata only - no embed)

### 3. Ranking Engine (`lib/hot/ranking-engine.ts`)

Calculates hot_score using:

```
hot_score = 
  (popularity_score * 0.3) +
  (instagram_present * 15) +
  (youtube_present * 10) +
  (twitter_present * 5) +
  (tmdb_popularity / 5, max 20) +
  (trend_score * 0.1) +
  (glamour_weight * 15) +
  (embed_safety * 10)
```

### 4. Hot Candidates View

SQL materialized view combining all metrics:

```sql
SELECT * FROM v_hot_glamour_candidates
WHERE is_eligible = true
ORDER BY hot_score DESC
LIMIT 20;
```

## CLI Commands

### Discovery Commands

| Command | Description |
|---------|-------------|
| `pnpm discover` | Full discovery pipeline |
| `pnpm discover:dry` | Preview mode |
| `pnpm discover:wikidata` | Wikidata source only |
| `pnpm discover:rank` | Recalculate rankings only |
| `pnpm discover:full` | Verbose output |

### Hot Content Ingestion

| Command | Description |
|---------|-------------|
| `pnpm hot:ingest --dry` | Preview hot content (no DB writes) |
| `pnpm hot:ingest --smart` | Smart update (preserve high performers) |
| `pnpm hot:ingest --full` | Full ingestion with all sources |
| `pnpm hot:ingest --refresh` | Refresh stale metadata |
| `pnpm hot:reset --confirm` | Archive & rebuild all hot content |

### Glamour Image Fetching

| Command | Description |
|---------|-------------|
| `pnpm glamour:fetch` | Fetch glamour images from TMDB |
| `pnpm glamour:fetch:dry` | Preview mode (no DB writes) |
| `pnpm glamour:fetch:clean` | Clean existing TMDB images first |

### Social Handle Ingestion

| Command | Description |
|---------|-------------|
| `pnpm ingest:social` | Full social handle ingestion |
| `pnpm ingest:social --dry` | Preview mode |
| `pnpm ingest:social --platform=instagram,tiktok` | Specific platforms |
| `pnpm ingest:social --celebrity=Rashmika` | Single celebrity |

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `celebrities` | Master celebrity data |
| `celebrity_social_profiles` | Verified social handles |
| `hot_media` | Hot content entries |
| `hot_image_references` | Image sources with licensing |
| `entity_discovery_log` | Discovery run logs |

### Views

| View | Purpose |
|------|---------|
| `v_hot_glamour_candidates` | Pre-computed rankings |
| `v_social_profiles_hot_priority` | Social profiles by glam priority |

## Validation Rules

### Eligibility Criteria

- ✅ Minimum 1 verified social profile
- ✅ At least one embeddable platform (Instagram/YouTube/Twitter)
- ✅ Popularity score ≥ 30
- ✅ Hot score ≥ 40 (configurable)

### Safety Checks

- ✅ No explicit keywords
- ✅ No political content flags
- ✅ Image license verified
- ✅ Face identity match

### Status Flags

| Status | Description |
|--------|-------------|
| ✅ READY | Passes all validations |
| ⚠️ NEEDS_REWORK | Requires adjustments |
| ❌ REJECTED | Failed validation |

## Legal Compliance

### What We DO:
- ✅ Use Wikidata SPARQL (public API)
- ✅ Use TMDB API (licensed)
- ✅ Use Instagram oEmbed
- ✅ Use YouTube oEmbed
- ✅ Store metadata only

### What We DON'T:
- ❌ Scrape social media pages
- ❌ Download copyrighted images
- ❌ Copy captions/content
- ❌ Access private accounts
- ❌ Store scraped data

## Configuration

### Ranking Config

```typescript
const DEFAULT_RANKING_CONFIG = {
  instagramWeight: 15,
  youtubeWeight: 10,
  tmdbWeight: 20,
  trendWeight: 10,
  glamourWeight: 15,
  embedSafetyWeight: 10,
  
  minScoreForEligibility: 40,
  minSocialProfiles: 1,
  minConfidence: 0.6,
  
  topNCandidates: 50,
};
```

### Platform Priority

```typescript
const HOT_CONTENT_PLATFORM_PRIORITY = [
  'instagram',  // Best for glamour
  'tiktok',     // Good for viral
  'youtube',    // Good for longer content
  'twitter',    // Good for news
  'facebook',   // Lower priority
];
```

## Image Intelligence

### Source Priority

The system uses multiple sources for glamour images with the following priority:

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMAGE SOURCE PRIORITY                        │
└─────────────────────────────────────────────────────────────────┘
       1. Instagram oEmbed (authenticated)
       2. TMDB Movie Backdrops (full-body, scene shots)
       3. TMDB Tagged Images (events, photoshoots)
       4. YouTube Thumbnails
       5. Wikimedia Commons (CC licensed)
       6. TMDB Profile Images (fallback)
       7. AI-generated glam art (last resort)
```

### Image Scoring Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Legal Safety | 30% | License verification |
| Glamour Suitability | 25% | Full-body, events, fashion |
| Freshness | 20% | Recent content preferred |
| Engagement Likelihood | 15% | Based on past performance |
| Identity Match | 10% | Celebrity face verification |

### Auto-Reject Rules

Images are automatically rejected if:
- ❌ License unclear or missing
- ❌ Resolution < 400x600 pixels
- ❌ Face mismatch with celebrity
- ❌ Non-editorial usage risk
- ❌ Aspect ratio unsuitable (headshots only)

## AI Glamour Content

### Content Structure

The AI generates Telugu-first glamour content with this structure:

```
1. Hook (2-3 emotional Telugu lines)
2. Why trending now
3. Glamour angle (photoshoot/beach/event/nostalgia)
4. Social buzz summary
5. Past relevance (movies, IPL, awards)
6. Closing fan-connect line
```

### Caption Generation

```typescript
// Example AI-generated caption
{
  hook: "తెలుగు తెరపై మెరిసిన సమంత అందాల విందు! ✨",
  whyTrending: "లేటెస్ట్ ఫ్యాషన్ లుక్‌తో సోషల్ మీడియాలో ట్రెండింగ్",
  glamourAngle: "ఈ ఫోటోషూట్‌లో తన గ్లామర్‌తో అందరినీ ఆకట్టుకుంటున్నారు",
  socialBuzz: "#Samantha #Glamour - ఫ్యాన్స్ నుండి అద్భుతమైన రెస్పాన్స్",
  closingNote: "మరిన్ని అప్‌డేట్స్ కోసం చూస్తూ ఉండండి! 🔥"
}
```

## Browser Personalization

### Features

Zero-backend personalization for the Hot section:

| Feature | Description |
|---------|-------------|
| Viewed Celebrities | Tracks which celebrities user views |
| Intensity Preference | 1-5 scale for content boldness |
| Favorite Toggle | Heart button to save favorites |
| Category Interests | Tracks preferred categories |
| Scroll Depth | Engagement analytics |

### Implementation

```typescript
// lib/browser/glamour-personalization.ts
import { useHotPersonalization } from '@/lib/browser/useHotPersonalization';

function HotGallery() {
  const {
    trackView,
    trackClick,
    toggleFavorite,
    personalizeContent,
    setIntensity,
  } = useHotPersonalization();
  
  // Content automatically reordered based on interests
  const personalizedPosts = personalizeContent(posts);
}
```

### Personalization Data (localStorage)

```json
{
  "version": 1,
  "viewedCelebrities": [
    {"name": "Samantha", "views": 12, "interestScore": 85}
  ],
  "favoriteCelebrities": ["Rashmika Mandanna"],
  "intensityPreference": 3,
  "totalViews": 45,
  "categoryInterests": [
    {"category": "fashion", "views": 15, "interestScore": 72}
  ]
}
```

### GDPR Compliance

- ✅ All data stored in localStorage only
- ✅ No server-side tracking
- ✅ Clear data function available
- ✅ Export data function available
- ✅ No login required

## Admin Portal

### Hot Media Management

Access: `/admin/hot-media`

| Feature | Description |
|---------|-------------|
| Bulk Actions | Approve, reject, delete multiple items |
| Variant Switcher | Pick best AI-generated caption |
| Confidence Badges | Green/Yellow/Red indicators |
| One-click Regenerate | Re-run AI on single item |
| Status Filters | Filter by READY/NEEDS_REWORK/REJECTED |

### Status Badge Colors

| Color | Confidence | Action Required |
|-------|------------|-----------------|
| 🟢 Green | ≥80% | Ready to publish |
| 🟡 Yellow | 60-79% | Review recommended |
| 🔴 Red | <60% | Manual review needed |

## Maintenance

### Daily Tasks (Automated)
- Refresh materialized view every 15 minutes
- Update trending scores from analytics
- Update browser personalization rankings

### Weekly Tasks
- Run `pnpm discover --source=wikidata` for new celebrities
- Run `pnpm glamour:fetch` for new images
- Review flagged content in admin

### Monthly Tasks
- Audit image licenses
- Review blocking rules
- Update ranking weights if needed
- Clean up low-performing content

## Monitoring

### Key Metrics
- Eligible candidates count
- Average hot_score
- Social profile coverage
- Content approval rate
- Personalization engagement rate

### Alerts
- Discovery errors
- Low confidence scores
- License verification failures
- High rejection rates

