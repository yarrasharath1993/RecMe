# 🎬 TeluguVibes

**Production-Ready Self-Learning Telugu Entertainment Platform**

A next-generation media platform that learns from trends, users, and editors to continuously evolve while maintaining legal safety and AdSense compliance.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TELUGUVIBES ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Frontend   │    │   Backend    │    │   AI Layer   │       │
│  │   Next.js    │◄──►│   Supabase   │◄──►│  Groq/Gemini │       │
│  │   App Router │    │   Postgres   │    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              SELF-LEARNING INTELLIGENCE               │       │
│  │  • Trend Ingestion (TMDB, YouTube, News)             │       │
│  │  • Topic Clustering & Saturation Detection           │       │
│  │  • Content Performance Learning                       │       │
│  │  • Audience Preference Adaptation                     │       │
│  │  • Entity Popularity Tracking                         │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 📰 Content Management
- **Trending News** - AI-assisted, admin-approved articles
- **Movie Reviews** - Auto-generated with learned emphasis
- **Complete Movie Catalogue** - Past to present Telugu films
- **Historic Intelligence** - Birthdays, anniversaries, retrospectives
- **Hot Media** - Photos, videos, social embeds (legal only)
- **OTT Releases** - Streaming availability tracking

### 🧠 Self-Learning Intelligence
- **Trend Ingestion** - TMDB, YouTube, News APIs, Internal analytics
- **Topic Fatigue Detection** - Avoids oversaturated topics
- **Audience Preferences** - Learns best times, categories, lengths
- **Performance Learning** - Adapts titles, hooks, content style
- **Entity Popularity** - Tracks celebrity & movie buzz

### 🖼️ Legal Image System
- **Priority Sources**: TMDB → Wikimedia → Wikipedia → Unsplash
- **Never Scrapes**: Google Images, IMDb, Pinterest
- **Performance Tracking**: Learns which images engage best
- **License Storage**: Attribution and source tracking

### 📊 Zero-Click SEO
- **Schema.org Markup** - Article, Person, Movie, Q&A
- **Citation Blocks** - Optimized for AI search quotes
- **Answer Summaries** - 40-60 word direct answers
- **Author Entities** - E-E-A-T signal building

### 👤 Human POV Layer
- **Mandatory Human Touch** - Every article needs editor perspective
- **Anti-AI Fatigue** - Tracks what humans add that AI misses
- **Learning System** - Improves AI prompts from patterns

---

## 📁 Project Structure

```
telugu-portal/
├── app/
│   ├── admin/
│   │   ├── intelligence/     # AI Dashboard
│   │   ├── editorial/        # Human POV Editor
│   │   ├── posts/            # Content Management
│   │   ├── celebrities/      # Celebrity Manager
│   │   ├── media/            # Hot Media Manager
│   │   └── reviews/          # Movie Reviews
│   ├── api/
│   │   ├── cron/
│   │   │   ├── intelligence/ # 6-hourly learning cycle
│   │   │   └── on-this-day/  # Daily historic posts
│   │   └── admin/
│   │       ├── intelligence/ # AI APIs
│   │       └── editorial/    # POV & Citation APIs
│   ├── post/[slug]/          # Article pages
│   ├── reviews/              # Review listing & detail
│   └── hot/                  # Hot media gallery
├── components/
│   ├── analytics/            # Browser-native tracking
│   └── ...
├── lib/
│   ├── intelligence/
│   │   ├── trend-ingestion.ts     # Multi-source trends
│   │   ├── learning-engine.ts     # Performance learning
│   │   ├── image-intelligence.ts  # Legal image system
│   │   └── review-pipeline.ts     # Auto reviews
│   ├── editorial/
│   │   ├── human-pov.ts      # Human perspective
│   │   └── zero-click-seo.ts # Citation optimization
│   └── celebrity/            # Historic content
├── supabase-complete-schema.sql  # Full database
└── vercel.json               # Cron configuration
```

---

## 🗄️ Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `posts` | Main content articles |
| `movies` | Complete Telugu film catalogue |
| `celebrities` | Actor/director profiles |
| `movie_reviews` | Film reviews with ratings |

### Intelligence Tables
| Table | Purpose |
|-------|---------|
| `trend_signals` | Raw signals from all sources |
| `topic_clusters` | Merged keywords & saturation |
| `content_performance` | Views, CTR, scroll depth |
| `audience_preferences` | Learned category/time prefs |
| `ai_learnings` | What patterns work/fail |
| `entity_popularity` | Celebrity/movie buzz scores |

### Editorial Tables
| Table | Purpose |
|-------|---------|
| `human_pov` | Editor perspectives |
| `citation_blocks` | Schema.org Q&A |
| `publishing_gates` | Quality checkpoints |

### Media Tables
| Table | Purpose |
|-------|---------|
| `image_registry` | Licensed images with source |
| `media_posts` | Hot photos & social embeds |

---

## 🔄 Learning Cycle

```
Every 6 Hours:
┌─────────────────────────────────────────────────────────┐
│  1. TREND INGESTION                                      │
│     • Fetch from TMDB, YouTube, News APIs               │
│     • Store in trend_signals                            │
│     • Cluster into topic_clusters                       │
├─────────────────────────────────────────────────────────┤
│  2. PERFORMANCE LEARNING                                 │
│     • Analyze high/low performers                       │
│     • Extract title patterns                            │
│     • Learn optimal content length                      │
│     • Store in ai_learnings                             │
├─────────────────────────────────────────────────────────┤
│  3. AUDIENCE PREFERENCES                                 │
│     • Update category preferences                       │
│     • Learn peak traffic hours                          │
│     • Store in audience_preferences                     │
├─────────────────────────────────────────────────────────┤
│  4. ENTITY POPULARITY                                    │
│     • Track celebrity mentions                          │
│     • Score trending actors/movies                      │
│     • Store in entity_popularity                        │
├─────────────────────────────────────────────────────────┤
│  5. REVIEW PIPELINE                                      │
│     • Detect new Telugu movies from TMDB                │
│     • Generate adaptive reviews                         │
│     • Learn from review performance                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- API Keys: TMDB, Groq, YouTube (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/sharath317/teluguvibes.git
cd telugu-portal

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key

# APIs
TMDB_API_KEY=your_tmdb_key
YOUTUBE_API_KEY=your_youtube_key
GNEWS_API_KEY=your_gnews_key
UNSPLASH_ACCESS_KEY=your_unsplash_key

# Cron (Production)
CRON_SECRET=your_cron_secret
```

### Database Setup

```bash
# Run complete schema in Supabase SQL Editor
cat supabase-complete-schema.sql
```

### Run Development Server

```bash
npm run dev
```

---

## 📊 Admin Dashboard

### Intelligence (`/admin/intelligence`)
- Trend heatmap
- Topic fatigue warnings
- AI learnings
- Entity popularity
- Recommendations

### Editorial AI (`/admin/editorial`)
- Human POV editor
- Citation block generator
- Publishing gates
- POV impact metrics

### Posts (`/admin/posts`)
- Create/edit content
- Draft management
- Publish workflow

---

## ⏰ Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `/api/cron/intelligence` | Every 6 hours | Trend ingestion & learning |
| `/api/cron/on-this-day` | Daily 5 AM | Historic content generation |

---

## 🔒 Legal & Safety

### Image Sources (Priority Order)
1. **TMDB** - Movie posters, actor photos
2. **Wikimedia Commons** - Historic images
3. **Wikipedia** - Article thumbnails
4. **Unsplash/Pexels** - Stock photos
5. **AI Generated** - Fallback illustrations

### Never Used
- ❌ Google Images scraping
- ❌ IMDb images
- ❌ Pinterest downloads
- ❌ Instagram image downloads (embed only)

### AdSense Compliance
- All content admin-approved
- Profanity filtering
- Toxicity checks
- Safe image validation

---

## 📈 Performance Metrics

| Metric | Tracked | Used For |
|--------|---------|----------|
| Views | Per post | Content ranking |
| Scroll depth | % of page | Content length optimization |
| Time on page | Seconds | Engagement scoring |
| CTR | From listings | Title optimization |
| Bounce rate | % exits | Quality assessment |
| Shares | Per post | Viral potential |

---

## 🎯 Core Principles

1. **NO auto-publish** - Admin always reviews
2. **NO blind AI** - Pre-generation reasoning required
3. **NO generic output** - Human POV layer mandatory
4. **Legal-first** - Only licensed/embed content
5. **Learn continuously** - Improve from every interaction

---

## 📜 License

MIT License - See LICENSE file

---

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

---

## 📞 Contact

- **Website**: https://teluguvibes.com
- **GitHub**: https://github.com/sharath317/teluguvibes

---

*Built with ❤️ for Telugu cinema fans*
