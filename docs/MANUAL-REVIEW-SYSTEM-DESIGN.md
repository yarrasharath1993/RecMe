# Manual Review System - Design Document
**Version:** 1.0  
**Date:** January 13, 2026  
**Status:** Design Phase

## Overview

A comprehensive admin panel system for manual review and curation of movie data, addressing the critical gaps where automation cannot reach (editorial reviews, tags, content verification).

## Problem Statement

Based on the data audit:
- **6,454 movies** need editorial reviews (99.9% missing)
- **7,397 movies** need trailer verification
- **6,805 movies** need tagging (blockbuster, classic, etc.)
- **500+ movies** have high-priority missing data

Current workflow is ad-hoc with no:
- Priority-based queue
- Field-level editing interface
- Change tracking
- Multi-editor coordination

## System Goals

1. **Efficiency**: Process 100+ movies per day per editor
2. **Quality**: Ensure consistent editorial standards
3. **Tracking**: Full audit log of all changes
4. **Collaboration**: Multiple editors working in parallel
5. **Scalability**: Handle 7,398 movies + growing database

## Architecture

### Component Structure

```
app/admin/
├── review-queue/
│   ├── page.tsx              # Main queue interface
│   ├── [id]/
│   │   └── edit/
│   │       └── page.tsx      # Movie editor
│   └── components/
│       ├── QueueFilters.tsx
│       ├── MovieCard.tsx
│       └── PriorityBadge.tsx
├── dashboard/
│   └── page.tsx              # Admin dashboard with stats
└── api/
    ├── review-queue/
    │   └── route.ts          # Queue API endpoints
    └── movies/
        └── [id]/
            ├── route.ts      # CRUD operations
            └── changelog/
                └── route.ts  # Change history
```

## Database Schema Changes

### New Tables

#### 1. `review_queue` Table
```sql
CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL, -- 1=Critical, 2=High, 3=Medium, 4=Low
  category TEXT NOT NULL, -- 'editorial', 'verification', 'tagging', 'cast'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_review', 'completed', 'skipped'
  assigned_to UUID REFERENCES auth.users(id),
  missing_fields TEXT[], -- Array of field names
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(movie_id, category) -- One queue entry per movie per category
);

CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_priority ON review_queue(priority);
CREATE INDEX idx_review_queue_assigned ON review_queue(assigned_to);
CREATE INDEX idx_review_queue_category ON review_queue(category);
```

#### 2. `movie_changelog` Table
```sql
CREATE TABLE movie_changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  source TEXT, -- 'manual', 'tmdb', 'ai', 'import'
  confidence FLOAT, -- 0.0 to 1.0
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movie_changelog_movie ON movie_changelog(movie_id);
CREATE INDEX idx_movie_changelog_changed_by ON movie_changelog(changed_by);
CREATE INDEX idx_movie_changelog_created ON movie_changelog(created_at DESC);
```

#### 3. `editorial_drafts` Table
```sql
CREATE TABLE editorial_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'review', 'published'
  content JSONB NOT NULL, -- Full review structure
  ai_generated BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_editorial_drafts_status ON editorial_drafts(status);
CREATE INDEX idx_editorial_drafts_movie ON editorial_drafts(movie_id);
```

### Schema Additions to `movies` Table

```sql
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS data_confidence FLOAT DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS field_sources JSONB DEFAULT '{}', -- Track source for each field
ADD COLUMN IF NOT EXISTS review_notes TEXT;

CREATE INDEX idx_movies_data_confidence ON movies(data_confidence);
CREATE INDEX idx_movies_last_reviewed ON movies(last_reviewed_at);
```

## UI/UX Design

### 1. Admin Dashboard (`/admin/dashboard`)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  📊 Data Quality Dashboard                      │
├─────────────────────────────────────────────────┤
│  Overall Health: FAIR ⚠️ (56.3%)                │
│                                                 │
│  ┌───────────┬───────────┬───────────┐          │
│  │ Pending   │ In Review │ Completed │          │
│  │  1,247    │    23     │   6,128   │          │
│  └───────────┴───────────┴───────────┘          │
│                                                 │
│  Quick Actions:                                 │
│  [Start Reviewing]  [View Queue]  [Reports]    │
│                                                 │
│  Recent Activity:                               │
│  ✓ John reviewed "RRR" (5 min ago)             │
│  ✓ Sarah updated "Baahubali" cast (12 min ago) │
│                                                 │
│  Section Completeness:                          │
│  ████████░░ Hero Section (85.9%)                │
│  ██████░░░░ Synopsis (64.7%)                    │
│  ███░░░░░░░ Cast & Crew (34.3%)                 │
│  █░░░░░░░░░ Tags (8.0%)                         │
│  ░░░░░░░░░░ Editorial (0.1%)                    │
└─────────────────────────────────────────────────┘
```

### 2. Review Queue (`/admin/review-queue`)

**Features:**
- Priority-based sorting
- Category filtering
- Search by title/year
- Bulk actions
- "Claim" button to assign to self

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Review Queue (1,247 pending)                  [Filters ▼]  │
├─────────────────────────────────────────────────────────────┤
│  Priority: [All] [Critical] [High] [Medium] [Low]          │
│  Category: [All] [Editorial] [Verification] [Tagging]      │
│  Status:   [Pending] [In Review] [Completed]               │
│  [Search movies...]                           [Bulk Edit]  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔴 CRITICAL │ RRR (2022)                              │  │
│  │ Missing: Editorial Review, Tags                       │  │
│  │ [Claim & Edit]  [Skip]  [Mark Complete]              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🟠 HIGH │ Pushpa (2021)                                │  │
│  │ Missing: Trailer URL, Telugu Synopsis                 │  │
│  │ [Claim & Edit]  [Skip]  [Mark Complete]              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Load More]                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3. Movie Editor (`/admin/review-queue/[id]/edit`)

**Tab-Based Interface:**

#### Tab 1: Basic Info
```
┌──────────────────────────────────────────────────┐
│  [Basic Info] [Cast] [Synopsis] [Media] [Tags]  │
├──────────────────────────────────────────────────┤
│  Title (EN):  [RRR                          ]    │
│  Title (TE):  [ఆర్ ఆర్ ఆర్                   ]    │
│  Year:        [2022        ] Runtime: [182  ]min │
│  Language:    [Telugu ▼    ] Cert:   [UA    ]    │
│  TMDB ID:     [940721      ] ✓ Verified          │
│                                                   │
│  Director:    [S.S. Rajamouli            ]       │
│  [+ Add from TMDB]  [Suggest from AI]            │
│                                                   │
│  Genres:                                          │
│  ☑ Action  ☑ Drama  ☑ Historical                 │
│  ☐ Romance ☐ Thriller ☐ Comedy                   │
│                                                   │
│  [Save Draft]  [Save & Next]  [Publish]          │
└──────────────────────────────────────────────────┘
```

#### Tab 2: Cast & Crew
```
┌──────────────────────────────────────────────────┐
│  [Basic Info] [Cast] [Synopsis] [Media] [Tags]  │
├──────────────────────────────────────────────────┤
│  Hero:        [Ram Charan                    ]   │
│  ├─ Confidence: ████████░░ 85% (TMDB)            │
│  └─ [Update from TMDB]  [Search Online]          │
│                                                   │
│  Heroine:     [Alia Bhatt                    ]   │
│  ├─ Confidence: ████████░░ 85% (TMDB)            │
│  └─ [Update from TMDB]  [Search Online]          │
│                                                   │
│  Music Director: [M. M. Keeravani             ]  │
│  Producer:    [D. V. V. Danayya               ]  │
│  Cinematographer: [K. K. Senthil Kumar        ]  │
│                                                   │
│  Supporting Cast:                                 │
│  • Jr. NTR                                        │
│  • Ajay Devgn                                     │
│  [+ Add More]                                     │
│                                                   │
│  [Save Draft]  [Save & Next]  [Publish]          │
└──────────────────────────────────────────────────┘
```

#### Tab 3: Synopsis & Review
```
┌──────────────────────────────────────────────────┐
│  [Basic Info] [Cast] [Synopsis] [Media] [Tags]  │
├──────────────────────────────────────────────────┤
│  Synopsis (EN):                                   │
│  ┌────────────────────────────────────────────┐  │
│  │ A fearless revolutionary and an officer... │  │
│  │ [500 characters]                           │  │
│  └────────────────────────────────────────────┘  │
│  [Generate with AI]  [Fetch from TMDB]           │
│                                                   │
│  Synopsis (TE):                                   │
│  ┌────────────────────────────────────────────┐  │
│  │ [Empty - needs translation]                │  │
│  └────────────────────────────────────────────┘  │
│  [Translate from EN]  [Generate with AI]         │
│                                                   │
│  Tagline:     [Fire.. Water.. Friendship]        │
│                                                   │
│  Editorial Review: [Draft] [Published]           │
│  [Create New Review]  [View Drafts]              │
│                                                   │
│  [Save Draft]  [Save & Next]  [Publish]          │
└──────────────────────────────────────────────────┘
```

#### Tab 4: Media
```
┌──────────────────────────────────────────────────┐
│  [Basic Info] [Cast] [Synopsis] [Media] [Tags]  │
├──────────────────────────────────────────────────┤
│  Poster:                                          │
│  ┌─────────┐                                      │
│  │ [Image] │  ✓ Verified                          │
│  └─────────┘                                      │
│  [Upload New]  [Fetch from TMDB]                 │
│                                                   │
│  Backdrop:                                        │
│  ┌──────────────────┐                             │
│  │ [Wide Image]     │  ✓ Verified                 │
│  └──────────────────┘                             │
│  [Upload New]  [Fetch from TMDB]                 │
│                                                   │
│  Trailer:                                         │
│  [https://youtube.com/watch?v=...        ]       │
│  ✓ Verified  [Preview]  [Search YouTube]         │
│                                                   │
│  Additional Videos:                               │
│  • Making Video (YouTube)  [X Remove]             │
│  • Songs Jukebox (YouTube) [X Remove]             │
│  [+ Add Video]                                    │
│                                                   │
│  [Save Draft]  [Save & Next]  [Publish]          │
└──────────────────────────────────────────────────┘
```

#### Tab 5: Tags & Classification
```
┌──────────────────────────────────────────────────┐
│  [Basic Info] [Cast] [Synopsis] [Media] [Tags]  │
├──────────────────────────────────────────────────┤
│  Editorial Tags:                                  │
│  ☑ Blockbuster  (Box office: ₹1200 Cr)           │
│  ☐ Classic      (Too recent)                     │
│  ☐ Underrated   (Highly rated, not underrated)   │
│  ☑ Featured     (✓ Recommend for homepage)       │
│                                                   │
│  Audience Tags:                                   │
│  ☑ Family-Friendly  ☑ Action-Packed              │
│  ☑ Epic Scale       ☐ Feel-Good                  │
│  ☑ Awards Winner    ☐ Cult Classic               │
│                                                   │
│  Content Flags:                                   │
│  ☐ Violence  ☐ Adult Themes  ☐ Explicit Content  │
│                                                   │
│  Quality Score: ████████░░ 85%                    │
│  Last Reviewed: 2 days ago by John Doe            │
│                                                   │
│  Review Notes:                                    │
│  ┌────────────────────────────────────────────┐  │
│  │ Verified all cast from TMDB. Synopsis      │  │
│  │ needs Telugu translation.                  │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  [Save Draft]  [Save & Next]  [Publish]          │
└──────────────────────────────────────────────────┘
```

## API Endpoints

### Review Queue API

#### GET `/api/admin/review-queue`
**Query Parameters:**
- `status`: 'pending' | 'in_review' | 'completed' | 'all'
- `priority`: '1' | '2' | '3' | '4' | 'all'
- `category`: 'editorial' | 'verification' | 'tagging' | 'cast' | 'all'
- `assignedTo`: UUID | 'me' | 'unassigned'
- `page`: number
- `limit`: number

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "movie": {
        "id": "uuid",
        "title_en": "RRR",
        "release_year": 2022,
        "poster_url": "..."
      },
      "priority": 1,
      "category": "editorial",
      "status": "pending",
      "missingFields": ["editorial_review", "tags"],
      "assignedTo": null,
      "created_at": "2026-01-13T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 1247,
    "page": 1,
    "limit": 20,
    "pages": 63
  }
}
```

#### POST `/api/admin/review-queue/claim`
**Body:**
```json
{
  "queueId": "uuid"
}
```
**Response:**
```json
{
  "success": true,
  "assignedTo": "user-uuid",
  "status": "in_review"
}
```

#### POST `/api/admin/review-queue/complete`
**Body:**
```json
{
  "queueId": "uuid",
  "notes": "Completed editorial review and tagging"
}
```

### Movie CRUD API

#### PATCH `/api/admin/movies/[id]`
**Body:**
```json
{
  "updates": {
    "director": "S.S. Rajamouli",
    "hero": "Ram Charan",
    "tagline": "Fire.. Water.. Friendship"
  },
  "source": "manual",
  "confidence": 1.0,
  "notes": "Verified from official sources"
}
```

**Response:**
```json
{
  "success": true,
  "movie": { /* updated movie object */ },
  "changelog": [
    {
      "field": "director",
      "oldValue": null,
      "newValue": "S.S. Rajamouli",
      "changedBy": "user-uuid",
      "timestamp": "2026-01-13T10:30:00Z"
    }
  ]
}
```

#### GET `/api/admin/movies/[id]/changelog`
**Response:**
```json
{
  "changes": [
    {
      "id": "uuid",
      "field": "director",
      "oldValue": null,
      "newValue": "S.S. Rajamouli",
      "changedBy": {
        "id": "uuid",
        "name": "John Doe"
      },
      "source": "manual",
      "confidence": 1.0,
      "createdAt": "2026-01-13T10:30:00Z"
    }
  ]
}
```

### AI Assistance API

#### POST `/api/admin/ai/generate-synopsis`
**Body:**
```json
{
  "movieId": "uuid",
  "language": "en" | "te"
}
```

**Response:**
```json
{
  "synopsis": "Generated synopsis text...",
  "confidence": 0.75,
  "source": "ai-gpt4"
}
```

#### POST `/api/admin/ai/suggest-tags`
**Body:**
```json
{
  "movieId": "uuid"
}
```

**Response:**
```json
{
  "tags": {
    "isBlockbuster": { "value": true, "confidence": 0.92, "reason": "Box office > ₹1000 Cr" },
    "isClassic": { "value": false, "confidence": 0.88, "reason": "Released too recently" },
    "isUnderrated": { "value": false, "confidence": 0.75, "reason": "High ratings & visibility" }
  }
}
```

## Workflow

### 1. Daily Workflow for Editors

```
Morning:
1. Open /admin/dashboard
2. Check pending queue size
3. Click "Start Reviewing"
4. System shows highest priority movie

Editor Actions:
5. Review movie data
6. Fill missing fields
7. Use AI suggestions (optional)
8. Verify data quality
9. Add review notes
10. Click "Save & Next"

System Actions:
11. Save changes to database
12. Log all changes to changelog
13. Update review queue status
14. Calculate new quality score
15. Load next movie automatically

End of Day:
16. Review completed count
17. Release unclaimed items
18. View progress stats
```

### 2. Editorial Review Workflow

```
Draft → Review → Publish

Draft Phase:
- AI generates initial draft
- Editor reviews and edits
- Multiple revisions allowed
- Can save as draft

Review Phase:
- Senior editor reviews
- Provides feedback
- Approves or requests changes

Publish Phase:
- Final approval
- Moves to movie_reviews table
- Becomes visible on site
- Can be unpublished if needed
```

## Implementation Plan

### Phase 1: Database Setup (Week 1)
- [ ] Create new tables (review_queue, movie_changelog, editorial_drafts)
- [ ] Add columns to movies table
- [ ] Create indexes
- [ ] Write migration scripts
- [ ] Test with sample data

### Phase 2: API Development (Week 2)
- [ ] Implement review queue endpoints
- [ ] Implement movie CRUD endpoints
- [ ] Implement changelog API
- [ ] Add authentication/authorization
- [ ] Write API tests

### Phase 3: UI Components (Week 3-4)
- [ ] Create admin dashboard
- [ ] Build review queue interface
- [ ] Build movie editor (all tabs)
- [ ] Add AI assistance buttons
- [ ] Implement keyboard shortcuts

### Phase 4: Integration & Testing (Week 5)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Documentation

### Phase 5: Training & Rollout (Week 6)
- [ ] Editor training sessions
- [ ] Create user guide
- [ ] Gradual rollout
- [ ] Monitor usage
- [ ] Gather feedback

## Success Metrics

### Efficiency Metrics
- Average time per movie review: < 5 minutes
- Daily completion rate: 100+ movies per editor
- Queue reduction: 50% in first month

### Quality Metrics
- Data confidence score: > 0.85 average
- Review rejection rate: < 10%
- User reported errors: < 1%

### System Metrics
- API response time: < 200ms
- Page load time: < 2 seconds
- Uptime: > 99.5%

## Future Enhancements

### Phase 2 Features
1. **Mobile app** for on-the-go reviewing
2. **Gamification** (badges, leaderboards)
3. **Community contributions** (moderated)
4. **Machine learning** for auto-tagging
5. **Batch operations** (bulk edit, bulk approve)
6. **Smart suggestions** based on patterns
7. **Video tutorials** integrated in UI
8. **Real-time collaboration** (multiple editors on same movie)

---

*Document Version: 1.0*  
*Status: Ready for Implementation*  
*Estimated Effort: 6 weeks*  
*Expected Launch: March 2026*
