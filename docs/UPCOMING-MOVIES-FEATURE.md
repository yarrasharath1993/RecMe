# Upcoming Movies Feature Implementation

**Created**: January 13, 2026  
**Status**: Planning & Implementation

---

## 📋 Overview

Create a dedicated section for upcoming/unreleased Telugu movies (TBA films) to separate them from released films and provide better UX.

---

## 🎯 Goals

1. **Separate TBA movies** from released movies in main listings
2. **Dedicated page** for upcoming releases
3. **Auto-update** release dates from TMDB
4. **Better discovery** of upcoming films
5. **Release date tracking** and notifications

---

## 📊 Current State

- **42 movies** with `release_year = NULL`
- All are marked as `is_published = true`
- All have TMDB IDs (can fetch release dates)
- All slugs end with `-tba`
- Mixed with regular movies in search/browse

---

## 🏗️ Implementation Plan

### Phase 1: Database Schema Updates ✅

#### Option A: Use Existing Fields (Recommended)
- Use `release_year = NULL` as indicator for upcoming movies
- Add computed field for release date status
- No schema changes needed

#### Option B: Add Status Field
```sql
-- Add status column to movies table
ALTER TABLE movies 
ADD COLUMN release_status TEXT DEFAULT 'released' 
CHECK (release_status IN ('released', 'upcoming', 'announced', 'tba'));

-- Update existing TBA movies
UPDATE movies 
SET release_status = 'upcoming' 
WHERE release_year IS NULL AND is_published = true;

-- Create index for performance
CREATE INDEX idx_movies_release_status ON movies(release_status);
```

### Phase 2: API Routes

#### 2.1 Create Upcoming Movies API
**File**: `app/api/movies/upcoming/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const supabase = createClient();

  // Get upcoming movies (NULL release_year or future dates)
  const { data: movies, error, count } = await supabase
    .from('movies')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .eq('language', 'Telugu')
    .is('release_year', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    movies,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
```

#### 2.2 Update Main Movies API
**File**: `app/api/movies/route.ts`

```typescript
// Add filter to exclude upcoming movies from main listings
const { data: movies } = await supabase
  .from('movies')
  .select('*')
  .eq('is_published', true)
  .not('release_year', 'is', null) // Exclude upcoming
  .order('release_year', { ascending: false });
```

### Phase 3: Upcoming Movies Page

#### 3.1 Create Page Component
**File**: `app/upcoming/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import UpcomingMoviesGrid from '@/components/movies/UpcomingMoviesGrid';
import PageHeader from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Upcoming Telugu Movies | Telugu Cinema Portal',
  description: 'Discover upcoming Telugu movies, release dates, and announcements.',
};

export default async function UpcomingMoviesPage() {
  const supabase = createClient();

  const { data: upcomingMovies } = await supabase
    .from('movies')
    .select('*')
    .eq('is_published', true)
    .eq('language', 'Telugu')
    .is('release_year', null)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      <PageHeader
        title="Upcoming Movies"
        subtitle={`${upcomingMovies?.length || 0} upcoming Telugu films`}
        icon="🎬"
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <UpcomingMoviesGrid movies={upcomingMovies || []} />
      </div>
    </main>
  );
}
```

#### 3.2 Create Grid Component
**File**: `components/movies/UpcomingMoviesGrid.tsx`

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Film, User } from 'lucide-react';

interface Movie {
  id: string;
  slug: string;
  title_en: string;
  title_te?: string;
  director?: string;
  poster_url?: string;
  synopsis?: string;
  tmdb_id?: number;
}

export default function UpcomingMoviesGrid({ movies }: { movies: Movie[] }) {
  const [filter, setFilter] = useState<'all' | 'announced' | 'production'>('all');

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-gray-700 pb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All ({movies.length})
        </button>
        <button
          onClick={() => setFilter('announced')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'announced'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Announced
        </button>
        <button
          onClick={() => setFilter('production')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'production'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          In Production
        </button>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            href={`/movies/${movie.slug}`}
            className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 hover:ring-2 hover:ring-orange-500 transition-all"
          >
            {/* Poster */}
            {movie.poster_url ? (
              <Image
                src={movie.poster_url}
                alt={movie.title_en}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <Film className="w-16 h-16 text-gray-600" />
              </div>
            )}

            {/* TBA Badge */}
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              TBA
            </div>

            {/* Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3">
              <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
                {movie.title_en}
              </h3>
              {movie.title_te && (
                <p className="text-xs text-gray-300 line-clamp-1 mb-2">
                  {movie.title_te}
                </p>
              )}
              {movie.director && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <User className="w-3 h-3" />
                  <span className="truncate">{movie.director}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {movies.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">No upcoming movies found</p>
        </div>
      )}
    </div>
  );
}
```

### Phase 4: Navigation Updates

#### 4.1 Add to Main Navigation
**File**: `components/navigation/Header.tsx`

```typescript
const navLinks = [
  { href: '/movies', label: 'Movies' },
  { href: '/upcoming', label: 'Upcoming', badge: upcomingCount }, // NEW
  { href: '/hot', label: 'Trending' },
  { href: '/category', label: 'Categories' },
  // ... other links
];
```

#### 4.2 Add to Homepage
**File**: `app/page.tsx`

```typescript
// Add Upcoming Movies Section
<section className="mb-12">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
      <Calendar className="w-6 h-6 text-orange-500" />
      Coming Soon
    </h2>
    <Link
      href="/upcoming"
      className="text-orange-500 hover:text-orange-400 text-sm font-medium"
    >
      View All →
    </Link>
  </div>
  <UpcomingMoviesCarousel movies={upcomingMovies} />
</section>
```

### Phase 5: TMDB Release Date Sync

#### 5.1 Create Sync Script
**File**: `scripts/sync-upcoming-release-dates.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY!;

async function syncReleaseDates() {
  console.log('🔄 Syncing release dates from TMDB...\n');

  // Get all upcoming movies
  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, tmdb_id')
    .is('release_year', null)
    .not('tmdb_id', 'is', null);

  if (!movies || movies.length === 0) {
    console.log('No upcoming movies to sync');
    return;
  }

  console.log(`Found ${movies.length} upcoming movies\n`);

  let updated = 0;
  let noDate = 0;
  let errors = 0;

  for (const movie of movies) {
    try {
      // Fetch from TMDB
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.tmdb_id}?api_key=${TMDB_API_KEY}`
      );
      const tmdbData = await response.json();

      if (tmdbData.release_date) {
        const releaseYear = new Date(tmdbData.release_date).getFullYear();
        
        // Update movie
        const { error } = await supabase
          .from('movies')
          .update({ 
            release_year: releaseYear,
            updated_at: new Date().toISOString()
          })
          .eq('id', movie.id);

        if (error) {
          console.log(`❌ ${movie.title_en}: ${error.message}`);
          errors++;
        } else {
          console.log(`✅ ${movie.title_en}: ${releaseYear}`);
          updated++;
        }
      } else {
        console.log(`⚠️  ${movie.title_en}: No release date on TMDB`);
        noDate++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.log(`❌ ${movie.title_en}: ${error}`);
      errors++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SYNC SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  No date: ${noDate}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('═══════════════════════════════════════════════════════════════');
}

syncReleaseDates();
```

#### 5.2 Add to package.json
```json
{
  "scripts": {
    "sync:upcoming": "tsx scripts/sync-upcoming-release-dates.ts"
  }
}
```

### Phase 6: SEO & Meta

#### 6.1 Update Sitemap
**File**: `app/sitemap.ts`

```typescript
// Add upcoming movies page
{
  url: `${baseUrl}/upcoming`,
  lastModified: new Date(),
  changeFrequency: 'daily',
  priority: 0.9,
}
```

#### 6.2 Update robots.txt
```txt
# Allow upcoming page
Allow: /upcoming
```

---

## 🎨 Design Considerations

### Visual Elements
- **Badge**: Orange "TBA" badge on poster
- **Status Indicator**: "Announced" / "In Production" / "Post-Production"
- **Release Date**: Show estimated date if available
- **Countdown**: Days until release (if date confirmed)

### Sorting Options
- Recently announced (default)
- Most anticipated (by views/clicks)
- By director
- By production house

### Filters
- Status: All / Announced / Production / Post-Production
- Director
- Genre (if available)
- Language variant (Telugu / Dubbed)

---

## 📈 Analytics & Tracking

### Metrics to Track
- Views per upcoming movie
- Click-through rate
- Most anticipated movies
- Search queries for upcoming films

### Implementation
```typescript
// Track upcoming movie views
import { trackEvent } from '@/lib/analytics';

trackEvent('upcoming_movie_view', {
  movie_id: movie.id,
  movie_title: movie.title_en,
  source: 'upcoming_page'
});
```

---

## 🔄 Maintenance

### Automated Tasks
1. **Daily**: Sync release dates from TMDB
2. **Weekly**: Check for newly announced movies
3. **On Release**: Move from upcoming to released
4. **Monthly**: Clean up old TBA entries

### Cron Job Setup
```typescript
// vercel.json or netlify.toml
{
  "crons": [
    {
      "path": "/api/cron/sync-upcoming",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## 🚀 Rollout Plan

### Week 1: Infrastructure
- [ ] Database schema updates (if needed)
- [ ] API route creation
- [ ] TMDB sync script

### Week 2: UI Development
- [ ] Upcoming page component
- [ ] Grid/card components
- [ ] Navigation updates

### Week 3: Integration
- [ ] Homepage section
- [ ] Search integration
- [ ] Filter implementation

### Week 4: Polish & Launch
- [ ] SEO optimization
- [ ] Analytics setup
- [ ] Testing
- [ ] Documentation
- [ ] Launch! 🎉

---

## 📝 Migration Script

**File**: `scripts/migrate-upcoming-movies.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateUpcoming() {
  console.log('🔄 Migrating upcoming movies...\n');

  // Option 1: Just leave them with NULL years (recommended)
  console.log('✅ Movies with NULL release_year are already set up correctly');
  console.log('   They will automatically appear in /upcoming page');
  console.log('   And be filtered out from main movie listings\n');

  // Option 2: If you want to add a status field
  // Uncomment and run this:
  /*
  const { data, error } = await supabase
    .from('movies')
    .update({ release_status: 'upcoming' })
    .is('release_year', null)
    .eq('is_published', true)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`✅ Updated ${data.length} movies to 'upcoming' status`);
  }
  */
}

migrateUpcoming();
```

---

## 🎯 Success Metrics

- [ ] 42 upcoming movies visible on `/upcoming`
- [ ] Main movie pages exclude upcoming movies
- [ ] TMDB sync runs successfully
- [ ] Release dates auto-update
- [ ] Navigation clearly shows "Upcoming" section
- [ ] Good UX for discovering upcoming films

---

## 📚 References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Filters](https://supabase.com/docs/reference/javascript/filter)
- [TMDB API](https://developers.themoviedb.org/3)

---

**Status**: Ready for implementation  
**Priority**: Medium  
**Estimated Time**: 2-3 weeks
