import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { BottomInfoBar } from '@/components/BottomInfoBar';
import { PhotoGalleryStrip } from '@/components/sections/PhotoGalleryStrip';
import { LocalizedHomeSections } from '@/components/LocalizedHomeSections';
import type { Post } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }

  return data || [];
}

async function getPopularPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching popular posts:', error);
    return [];
  }

  return data || [];
}

async function getPostsByCategory(category: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching category posts:', error);
    return [];
  }

  return data || [];
}

async function getHotMedia() {
  const { data } = await supabase
    .from('hot_media')
    .select('*')
    .eq('status', 'approved')
    .order('trending_score', { ascending: false })
    .limit(15);

  return data || [];
}

async function getVideos() {
  // Get posts with video content or from entertainment category
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .or('category.eq.entertainment,has_video.eq.true')
    .order('created_at', { ascending: false })
    .limit(8);

  return (data || []).map((post: Post) => ({
    id: post.id,
    title: post.title,
    thumbnailUrl: post.image_url || post.image_urls?.[0] || `https://picsum.photos/seed/${post.id}/640/360`,
    duration: '3:45', // Placeholder
    views: post.views,
    href: `/post/${post.slug}`,
    category: post.category,
    publishedAt: post.created_at,
  }));
}

export const revalidate = 60;

export default async function HomePage() {
  const [posts, popularPosts, hotMedia, entertainmentPosts, sportsPosts, politicsPosts, videos] = await Promise.all([
    getPosts(),
    getPopularPosts(),
    getHotMedia(),
    getPostsByCategory('entertainment'),
    getPostsByCategory('sports'),
    getPostsByCategory('politics'),
    getVideos(),
  ]);

  const trendingPosts = posts.filter(p => p.category === 'trending').slice(0, 5);
  const featuredPost = posts[0];
  const topStories = posts.slice(1, 5);
  const recentPosts = posts.slice(0, 5);
  const gossipPosts = posts.filter(p => p.category === 'gossip').slice(0, 6);
  
  // New sections data - using posts as fallback for demo
  const crimePosts = posts.slice(0, 4); // Would be getPostsByCategory('crime')
  const viralPosts = posts.slice(0, 6); // Would be getPostsByCategory('viral')

  // Transform hot media for PhotoGalleryStrip
  const hotGalleryItems = hotMedia.map((item: any) => ({
    id: item.id,
    title: item.entity_name || item.title || 'Hot Photo',
    imageUrl: item.thumbnail_url || item.image_url || '',
    href: '/hot',
    category: item.category,
    views: item.views || 0,
  }));

  // Create opinion posts from editorial-style content
  const opinionPosts = posts.slice(0, 4).map((post, idx) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt || post.content?.substring(0, 150),
    author: ['రామకృష్ణ రెడ్డి', 'శ్రీనివాస్ శర్మ', 'లక్ష్మీ నారాయణ', 'సుధాకర్ రావు'][idx % 4],
    authorRole: ['సీనియర్ ఎడిటర్', 'కాలమిస్ట్', 'చీఫ్ ఎడిటర్', 'రాజకీయ విశ్లేషకుడు'][idx % 4],
    publishedAt: post.created_at,
    href: `/post/${post.slug}`,
  }));

  return (
    <main className="aurora-bg" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* ============ HOT CONTENT STRIP ============ */}
      {hotGalleryItems.length > 0 && (
        <section className="py-3 sm:py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="container mx-auto px-3 sm:px-4">
            <PhotoGalleryStrip
              title="✨ Glam Zone"
              items={hotGalleryItems}
              href="/hot"
              cardSize="medium"
              aspectRatio="3:4"
            />
          </div>
        </section>
      )}

      {/* ============ MAIN CONTENT GRID ============ */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <LocalizedHomeSections
          posts={posts}
          popularPosts={popularPosts}
          entertainmentPosts={entertainmentPosts}
          sportsPosts={sportsPosts}
          politicsPosts={politicsPosts}
          hotGalleryItems={hotGalleryItems}
          videos={videos}
          opinionPosts={opinionPosts}
          gossipPosts={gossipPosts}
          trendingPosts={trendingPosts}
          featuredPost={featuredPost}
          topStories={topStories}
          recentPosts={recentPosts}
          crimePosts={crimePosts}
          viralPosts={viralPosts}
        />
      </div>

      {/* ============ VIRAL STRIP ============ */}
      <ViralStrip viralPosts={viralPosts} />

      {/* ============ BOTTOM INFO BAR ============ */}
      <BottomInfoBar />
    </main>
  );
}

// ============ HELPER COMPONENTS ============

function ViralStrip({ viralPosts }: { viralPosts: Post[] }) {
  if (viralPosts.length === 0) return null;

  return (
    <section 
      className="py-4 sm:py-6"
      style={{ background: 'linear-gradient(180deg, var(--bg-secondary), var(--bg-primary))' }}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="text-xl">🎭</span>
            వైరల్ & ట్రెండింగ్
          </h2>
          <Link 
            href="/category/viral"
            className="text-sm font-medium"
            style={{ color: '#ff006e' }}
          >
            అన్నీ చూడండి →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          {viralPosts.map((post, idx) => (
            <Link
              key={post.id}
              href={`/post/${post.slug}`}
              className="group relative rounded-lg overflow-hidden aspect-square electric-border"
            >
              <img
                src={post.image_url || `https://picsum.photos/seed/${post.id}/200/200`}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
              />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <span className="text-[10px] text-white/80 line-clamp-2">
                  {post.title}
                </span>
              </div>
              {idx === 0 && (
                <div 
                  className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white rainbow-text"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  🔥 VIRAL
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
