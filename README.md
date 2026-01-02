# 🎬 TeluguVibes

**Production-Ready Self-Learning Telugu Entertainment Platform**

A next-generation media platform with **2,600+ Telugu movies**, AI-powered content generation, and 100% review coverage.

[![GitHub](https://img.shields.io/badge/GitHub-sharath317%2Fteluguvibes-blue)](https://github.com/sharath317/teluguvibes)

---

## 📊 Current Stats

| Metric | Count | Status |
|--------|-------|--------|
| Telugu Movie Index | 2,626 | ✅ Complete |
| Enriched Movies | 1,155 | ✅ Growing |
| Movie Reviews | 1,155 | ✅ 100% Coverage |
| Valid Movies | 82.7% | ✅ Goal Met |
| With Director | 85.3% | ✅ Goal Met |
| With Cast 3+ | 68.5% | ✅ Goal Met |

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              TELUGUVIBES SYSTEM                                       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  DATA SOURCES                    PIPELINES                       OUTPUT              │
│  ─────────────                   ─────────                       ──────              │
│  ┌─────────────┐                                                                     │
│  │   TMDB      │───┐   ┌─────────────────────┐   ┌─────────────────────────────┐    │
│  │  (2,626+    │   │   │   MOVIE PIPELINE    │──▶│ movies (1,155)              │    │
│  │   movies)   │───┼──▶│   • Discovery       │   │ movie_reviews (1,155)       │    │
│  └─────────────┘   │   │   • Validation      │   │ telugu_movie_index (2,626)  │    │
│                    │   │   • Enrichment      │   └─────────────────────────────┘    │
│  ┌─────────────┐   │   │   • Reviews         │                                      │
│  │  WIKIPEDIA  │───┤   └─────────────────────┘                                      │
│  │  (History)  │   │                                                                 │
│  └─────────────┘   │   ┌─────────────────────┐   ┌─────────────────────────────┐    │
│                    │   │  CONTENT PIPELINE   │──▶│ posts (articles)            │    │
│  ┌─────────────┐   │   │   • Trends          │   │ celebrities (profiles)      │    │
│  │   GOOGLE    │───┼──▶│   • AI/Templates    │   │ hot_media (glamour)         │    │
│  │   TRENDS    │   │   │   • Images          │   └─────────────────────────────┘    │
│  └─────────────┘   │   └─────────────────────┘                                      │
│                    │                                                                 │
│  ┌─────────────┐   │   ┌─────────────────────┐                                      │
│  │  WIKIDATA   │───┘   │  LEARNING ENGINE    │──▶ ai_learnings, preferences        │
│  │(Celebrities)│       │   • 6-hourly cycle  │                                      │
│  └─────────────┘       └─────────────────────┘                                      │
│                                                                                       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Full architecture:** [docs/COMPLETE-ARCHITECTURE.md](docs/COMPLETE-ARCHITECTURE.md)

---

## ✨ Key Features

### 🎬 Movie Pipeline (NEW)
- **2,626 Telugu movies** indexed from TMDB (1931-2026)
- **100% review coverage** with multi-axis ratings
- **Smart enrichment** - Cast, crew, posters, backdrops
- **Validation gates** - Only quality data passes

### 📰 Content Generation
- **AI-assisted articles** with Telugu-first templates
- **Entity detection** - Auto-link actors, movies
- **Legal images** - TMDB, Wikipedia, Wikimedia only

### 🔥 Hot Media
- **Glamour content** from legal sources
- **Instagram/YouTube** oEmbed support
- **TMDB backdrops** for full-body images

### 🧠 Self-Learning Intelligence
- **Trend ingestion** every 6 hours
- **Performance learning** - What works, what doesn't
- **Entity popularity** tracking

---

## 🛠️ Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/sharath317/teluguvibes.git
cd telugu-portal

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your keys: SUPABASE, TMDB, etc.

# Run development server
pnpm dev
```

### Movie Pipeline Commands

```bash
# 1. Discover Telugu movies from TMDB
pnpm ingest:tmdb:telugu --status

# 2. Validate movies
pnpm intel:validate:movies --limit=1000

# 3. Enrich with full data
pnpm ingest:movies:smart --limit=500

# 4. Generate reviews (100% coverage)
pnpm reviews:coverage --target=0.95

# 5. Check coverage report
pnpm movies:coverage --full
```

### Content Pipeline Commands

```bash
# Check AI providers
pnpm free:status

# Generate content (preview)
pnpm free:run --dry

# Generate & save
pnpm free:run --mode=smart
```

---

## 📁 Project Structure

```
telugu-portal/
├── app/
│   ├── page.tsx                  # Homepage
│   ├── movies/                   # Movie catalogue
│   ├── reviews/[slug]/           # Movie reviews
│   ├── admin/                    # Admin dashboard (20+ pages)
│   └── api/                      # API routes (40+ endpoints)
│
├── lib/
│   ├── movie-index/              # TMDB discovery
│   ├── movie-validation/         # Validation gates
│   ├── reviews/                  # Review generation
│   ├── pipeline/                 # Content pipelines
│   └── intelligence/             # Learning engine
│
├── scripts/
│   ├── ingest-tmdb-telugu.ts     # Movie discovery
│   ├── validate-movies.ts        # Validation
│   ├── smart-movie-enrichment.ts # Enrichment
│   ├── reviews-coverage.ts       # Review generation
│   └── movie-coverage.ts         # Coverage report
│
└── docs/
    ├── COMPLETE-ARCHITECTURE.md  # Full system docs
    └── MOVIE-PIPELINE-IMPLEMENTATION.md
```

---

## 🗄️ Database Tables

### Core Tables
| Table | Rows | Purpose |
|-------|------|---------|
| `telugu_movie_index` | 2,626 | Canonical TMDB discovery |
| `movies` | 1,155 | Enriched movie data |
| `movie_reviews` | 1,155 | Multi-axis reviews |
| `posts` | Variable | News articles |
| `celebrities` | Variable | Actor/director profiles |

### Intelligence Tables
| Table | Purpose |
|-------|---------|
| `trend_signals` | Raw trend data |
| `ai_learnings` | Pattern storage |
| `entity_popularity` | Buzz scores |

---

## 👤 Admin Dashboard

| Route | Purpose |
|-------|---------|
| `/admin` | Main dashboard |
| `/admin/movie-catalogue` | Movie management |
| `/admin/reviews-coverage` | Review metrics |
| `/admin/posts` | Content management |
| `/admin/celebrities` | Celebrity profiles |
| `/admin/hot-media` | Glamour content |
| `/admin/intelligence` | AI analytics |

---

## 🔒 Legal & Safety

### ✅ Allowed Image Sources
1. TMDB - Movie posters, actor photos
2. Wikimedia Commons - Licensed images
3. Wikipedia - Article thumbnails
4. Unsplash/Pexels - Stock photos
5. Instagram/YouTube - oEmbed only

### ❌ Never Used
- Google Images scraping
- IMDb images
- Pinterest downloads
- Direct Instagram image downloads

---

## 🎯 Core Principles

1. **NO auto-publish** - Admin always reviews
2. **NO blind AI** - Pre-generation reasoning required
3. **95% coverage** - Reviews for all movies enforced
4. **Legal-first** - Only licensed/embed content
5. **Learn continuously** - Improve from every interaction

---

## 📞 Links

- **Website**: https://teluguvibes.com
- **GitHub**: https://github.com/sharath317/teluguvibes
- **Docs**: [COMPLETE-ARCHITECTURE.md](docs/COMPLETE-ARCHITECTURE.md)

---

*Built with ❤️ for Telugu cinema fans*
