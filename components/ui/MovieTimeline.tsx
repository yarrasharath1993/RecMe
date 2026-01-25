/**
 * MOVIE TIMELINE COMPONENT
 * 
 * Displays the lifecycle of a movie from announcement to OTT release.
 * Visualizes connected story threads and enables "Continue the story" navigation.
 * 
 * REFACTORED to use design system primitives (Button, Text, Heading)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

// Import design system primitives
import { Button, IconButton } from '@/components/ui/primitives/Button';
import { Text, Heading } from '@/components/ui/primitives/Text';
import { Badge } from '@/components/ui/primitives/Badge';

// ============================================================
// TYPES
// ============================================================

export interface TimelineEvent {
  id: string;
  type: 'announcement' | 'trailer' | 'release' | 'review' | 'ott' | 'awards' | 'milestone';
  title: string;
  date: string;
  description?: string;
  link?: string;
  icon: string;
}

export interface MovieTimelineProps {
  events: TimelineEvent[];
  movieTitle: string;
  className?: string;
}

// ============================================================
// COMPONENT
// ============================================================

export function MovieTimeline({ events, movieTitle, className = '' }: MovieTimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className={`movie-timeline ${className}`}>
      <Heading level="h3" className="mb-4">
        Movie Journey
      </Heading>
      
      <div className="timeline-container relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--border-primary)]" />

        {/* Events */}
        <div className="space-y-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="relative flex items-start gap-4"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center text-2xl z-10">
                {event.icon}
              </div>

              {/* Content */}
              <div className="flex-1 bg-[var(--bg-card)] rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-[var(--border-primary)]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Text as="h4" variant="heading-sm">
                      {event.title}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </div>

                  {event.description && (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                      aria-label={expandedEvent === event.id ? 'Collapse' : 'Expand'}
                      icon={
                        <span className="text-[var(--brand-primary)]">
                          {expandedEvent === event.id ? '▼' : '▶'}
                        </span>
                      }
                    />
                  )}
                </div>

                {/* Expanded description */}
                {expandedEvent === event.id && event.description && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
                    <Text variant="body-sm" color="secondary">
                      {event.description}
                    </Text>
                  </div>
                )}

                {/* Link */}
                {event.link && (
                  <Link
                    href={event.link}
                    className="inline-block mt-3"
                  >
                    <Text variant="caption" color="brand" weight="medium" className="hover:underline">
                      View Details →
                    </Text>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .movie-timeline {
          max-width: 800px;
          margin: 0 auto;
        }

        .timeline-container {
          padding-left: 0;
        }

        @media (max-width: 640px) {
          .timeline-container {
            padding-left: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// CONTINUE THE STORY COMPONENT
// ============================================================

export interface RelatedMovie {
  id: string;
  title: string;
  slug: string;
  posterUrl?: string;
  releaseYear?: number;
  relationship: string; // "Same Actor", "Same Director", "Sequel", etc.
}

export interface ContinueTheStoryProps {
  movies: RelatedMovie[];
  className?: string;
}

export function ContinueTheStory({ movies, className = '' }: ContinueTheStoryProps) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <div className={`continue-the-story ${className}`}>
      <Heading level="h3" className="mb-4">
        Continue the Story
      </Heading>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            href={`/movies/${movie.slug}`}
            className="group relative block overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
          >
            {/* Poster */}
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-64 bg-[var(--bg-tertiary)] flex items-center justify-center">
                <span className="text-[var(--text-tertiary)] text-4xl">🎬</span>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <Text variant="caption" weight="medium" className="text-white">
                  {movie.title}
                </Text>
                {movie.releaseYear && (
                  <Text variant="caption" className="text-white/80">
                    {movie.releaseYear}
                  </Text>
                )}
                <Text variant="caption" color="brand" className="mt-1">
                  {movie.relationship}
                </Text>
              </div>
            </div>

            {/* Relationship badge */}
            <Badge
              variant="primary"
              size="sm"
              className="absolute top-2 right-2"
            >
              {movie.relationship}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// STORY THREAD COMPONENT
// ============================================================

export interface StoryThread {
  id: string;
  title: string;
  description: string;
  movies: RelatedMovie[];
}

export interface StoryThreadsProps {
  threads: StoryThread[];
  className?: string;
}

export function StoryThreads({ threads, className = '' }: StoryThreadsProps) {
  const [activeThread, setActiveThread] = useState<string | null>(threads[0]?.id || null);

  if (!threads || threads.length === 0) {
    return null;
  }

  const currentThread = threads.find(t => t.id === activeThread);

  return (
    <div className={`story-threads ${className}`}>
      <Heading level="h3" className="mb-4">
        Story Threads
      </Heading>

      {/* Thread tabs - Using Button primitives */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {threads.map((thread) => (
          <Button
            key={thread.id}
            onClick={() => setActiveThread(thread.id)}
            variant={activeThread === thread.id ? 'primary' : 'secondary'}
            size="sm"
            className="whitespace-nowrap"
          >
            {thread.title}
          </Button>
        ))}
      </div>

      {/* Thread content */}
      {currentThread && (
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-4 border border-[var(--border-primary)]">
          <Text variant="body-sm" color="secondary" className="mb-4">
            {currentThread.description}
          </Text>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {currentThread.movies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.slug}`}
                className="block group"
              >
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-32 object-cover rounded-lg shadow group-hover:shadow-lg transition-shadow"
                  />
                ) : (
                  <div className="w-full h-32 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
                    <span className="text-[var(--text-tertiary)] text-2xl">🎬</span>
                  </div>
                )}
                <Text variant="caption" weight="medium" className="mt-1 line-clamp-1">
                  {movie.title}
                </Text>
                {movie.releaseYear && (
                  <Text variant="caption" color="tertiary">
                    {movie.releaseYear}
                  </Text>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
