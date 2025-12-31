'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, TrendingUp, Eye } from 'lucide-react';
import type { Post } from '@/types/database';

interface RecentPostsSidebarProps {
  recentPosts: Post[];
  popularPosts: Post[];
}

export function RecentPostsSidebar({ recentPosts, popularPosts }: RecentPostsSidebarProps) {
  return (
    <aside className="space-y-4">
      {/* Recent Posts */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)'
        }}
      >
        <div
          className="px-3 py-2.5"
          style={{ background: 'linear-gradient(90deg, var(--brand-primary), #ca9a06)' }}
        >
          <h3
            className="font-bold text-sm flex items-center gap-2"
            style={{ color: 'var(--bg-primary)' }}
          >
            <Clock className="w-4 h-4" />
            తాజా వార్తలు
          </h3>
        </div>
        <div className="p-2 space-y-0.5">
          {recentPosts.length > 0 ? (
            recentPosts.map((post, index) => (
              <SmallPostCard key={post.id} post={post} index={index + 1} />
            ))
          ) : (
            <p
              className="text-xs py-4 text-center"
              style={{ color: 'var(--text-tertiary)' }}
            >
              వార్తలు లేవు
            </p>
          )}
        </div>
      </div>

      {/* Popular Posts */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)'
        }}
      >
        <div className="px-3 py-2.5 bg-gradient-to-r from-red-600 to-red-700">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            పాపులర్ వార్తలు
          </h3>
        </div>
        <div className="p-2 space-y-0.5">
          {popularPosts.length > 0 ? (
            popularPosts.map((post, index) => (
              <SmallPostCard key={post.id} post={post} index={index + 1} showViews />
            ))
          ) : (
            <p
              className="text-xs py-4 text-center"
              style={{ color: 'var(--text-tertiary)' }}
            >
              వార్తలు లేవు
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

function SmallPostCard({
  post,
  index,
  showViews = false
}: {
  post: Post;
  index: number;
  showViews?: boolean;
}) {
  const imageUrl = post.image_url || post.image_urls?.[0] || `https://picsum.photos/seed/${post.id}/100/100`;
  const categoryColors: Record<string, string> = {
    gossip: '#ec4899',
    sports: '#22c55e',
    politics: '#3b82f6',
    entertainment: '#a855f7',
    trending: '#f97316',
  };

  return (
    <Link
      href={`/post/${post.slug}`}
      className="flex gap-2 p-1.5 rounded-lg transition-colors group"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {/* Index Number */}
      <div
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{
          background: 'var(--bg-tertiary)',
          color: 'var(--brand-primary)'
        }}
      >
        {index}
      </div>

      {/* Thumbnail */}
      <div
        className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <Image
          src={imageUrl}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          sizes="48px"
        />
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: categoryColors[post.category] || 'var(--brand-primary)' }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className="text-xs font-medium line-clamp-2 transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          {post.title}
        </h4>
        <div
          className="flex items-center gap-1.5 mt-0.5 text-[10px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span className="capitalize">{post.category}</span>
          {showViews && post.views > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Eye className="w-2.5 h-2.5" />
                {post.views.toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// Standalone component for Similar Posts
export function SimilarPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)'
      }}
    >
      <div className="px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          ఇలాంటి వార్తలు
        </h3>
      </div>
      <div className="p-2 space-y-0.5">
        {posts.map((post, index) => (
          <SmallPostCard key={post.id} post={post} index={index + 1} />
        ))}
      </div>
    </div>
  );
}
