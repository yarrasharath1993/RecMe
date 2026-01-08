'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X, Clock, Upload, Trash2, RefreshCw } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/browser';

interface BatchPost {
  id: string;
  title: string;
  title_te?: string;
  slug: string;
  status: string;
  content_sector?: string;
  content_type?: string;
  fact_confidence_score?: number;
  verification_status?: string;
}

interface Batch {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
  post_ids: string[];
}

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createBrowserClient();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [posts, setPosts] = useState<BatchPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchBatchDetails();
  }, [id]);

  async function fetchBatchDetails() {
    setLoading(true);
    try {
      // For now, fetch posts that match this batch ID or are in draft status
      // In a full implementation, you'd have a batches table
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, title, title_te, slug, status, content_sector, content_type, fact_confidence_score, verification_status')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Simulate batch info
      setBatch({
        id: id,
        name: `Batch ${id}`,
        description: 'Content batch for publishing',
        status: 'draft',
        created_at: new Date().toISOString(),
        post_ids: postsData?.map(p => p.id) || [],
      });

      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching batch:', error);
      setMessage({ type: 'error', text: 'Failed to load batch details' });
    } finally {
      setLoading(false);
    }
  }

  async function publishBatch() {
    if (!posts.length) {
      setMessage({ type: 'error', text: 'No posts to publish' });
      return;
    }

    setPublishing(true);
    setMessage(null);

    try {
      const postIds = posts.map(p => p.id);
      
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .in('id', postIds);

      if (error) throw error;

      setMessage({ type: 'success', text: `Successfully published ${posts.length} posts!` });
      
      // Refresh the list
      fetchBatchDetails();
    } catch (error) {
      console.error('Error publishing batch:', error);
      setMessage({ type: 'error', text: 'Failed to publish batch' });
    } finally {
      setPublishing(false);
    }
  }

  async function removeFromBatch(postId: string) {
    setPosts(posts.filter(p => p.id !== postId));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#262626] rounded animate-pulse" />
        <div className="h-64 bg-[#262626] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/batch-publish"
            className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#737373]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{batch?.name || 'Batch Details'}</h1>
            <p className="text-sm text-[#737373]">{batch?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBatchDetails}
            className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-[#737373]" />
          </button>
          <button
            onClick={publishBatch}
            disabled={publishing || posts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            {publishing ? 'Publishing...' : `Publish All (${posts.length})`}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/50 text-green-400'
            : 'bg-red-500/10 border border-red-500/50 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Batch Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="text-3xl font-bold text-white">{posts.length}</div>
          <div className="text-sm text-[#737373]">Total Posts</div>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="text-3xl font-bold text-green-400">
            {posts.filter(p => p.verification_status === 'verified').length}
          </div>
          <div className="text-sm text-[#737373]">Verified</div>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="text-3xl font-bold text-yellow-400">
            {posts.filter(p => p.verification_status !== 'verified').length}
          </div>
          <div className="text-sm text-[#737373]">Pending Review</div>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400">
            {Math.round(posts.reduce((sum, p) => sum + (p.fact_confidence_score || 0), 0) / (posts.length || 1))}%
          </div>
          <div className="text-sm text-[#737373]">Avg Confidence</div>
        </div>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-bold text-white mb-2">No draft posts available</h2>
          <p className="text-[#737373] mb-6">
            All posts have been published or there are no drafts to batch.
          </p>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#eab308] text-black font-bold rounded-lg hover:bg-[#ca9a06] transition-colors"
          >
            Create New Post
          </Link>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#262626]">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#737373]">Title</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#737373]">Sector</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#737373]">Confidence</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#737373]">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#737373]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-[#262626] hover:bg-[#1a1a1a]">
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <div className="text-white truncate">{post.title_te || post.title}</div>
                      <div className="text-xs text-[#737373] mt-1">{post.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-[#262626] rounded text-xs text-[#ededed]">
                      {post.content_sector || 'general'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      (post.fact_confidence_score || 0) >= 70 ? 'text-green-400' :
                      (post.fact_confidence_score || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {post.fact_confidence_score || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      post.verification_status === 'verified'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {post.verification_status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => removeFromBatch(post.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Remove from batch"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

