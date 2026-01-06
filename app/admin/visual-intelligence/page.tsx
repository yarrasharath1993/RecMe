'use client';

/**
 * VISUAL INTELLIGENCE DASHBOARD
 * 
 * Admin page to verify visual confidence data and smart reviews.
 * Features:
 * - Clickable stat cards for drill-down
 * - Edit, Publish, Delete operations
 * - Filtering by tier/status
 * 
 * Access at: /admin/visual-intelligence
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArchiveCard } from '@/components/ui/ArchiveCard';
import { VisualConfidenceBadge, VisualConfidenceIcon } from '@/components/ui/VisualConfidenceBadge';
import type { ArchiveCardData, VisualTier } from '@/lib/visual-intelligence/types';
import { Plus, Send, Image as ImageIcon } from 'lucide-react';

interface MovieWithVisual {
  id: string;
  title_en: string;
  release_year: number | null;
  poster_url: string | null;
  poster_confidence: number | null;
  poster_visual_type: string | null;
  archive_card_data: ArchiveCardData | null;
  hero: string | null;
  is_published: boolean;
}

interface ReviewWithSmart {
  id: string;
  movie_id: string;
  movies: { title_en: string; release_year: number };
  smart_review: {
    why_to_watch: string[];
    why_to_skip: string[];
    legacy_status: string | null;
    mood_suitability: string[];
    content_warnings: string[];
    derivation_confidence: number;
  } | null;
  needs_human_review: boolean;
}

interface Stats {
  totalMovies: number;
  withConfidence: number;
  tier1: number;
  tier2: number;
  tier3: number;
  totalReviews: number;
  withSmartReview: number;
  needsHumanReview: number;
}

type FilterType = 
  | 'all' 
  | 'with_confidence' 
  | 'tier1' 
  | 'tier2' 
  | 'tier3' 
  | 'all_reviews'
  | 'with_smart_review' 
  | 'needs_human_review';

function getTier(confidence: number | null): VisualTier {
  if (!confidence) return 3;
  if (confidence >= 0.9) return 1;
  if (confidence >= 0.6) return 2;
  return 3;
}

export default function VisualIntelligencePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [movies, setMovies] = useState<MovieWithVisual[]>([]);
  const [reviews, setReviews] = useState<ReviewWithSmart[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'movies' | 'reviews'>('movies');
  
  // Drill-down state
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownFilter, setDrillDownFilter] = useState<FilterType>('all');
  const [drillDownData, setDrillDownData] = useState<MovieWithVisual[] | ReviewWithSmart[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownType, setDrillDownType] = useState<'movies' | 'reviews'>('movies');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  
  // Edit modal
  const [editingItem, setEditingItem] = useState<MovieWithVisual | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/visual-intelligence');
        const data = await res.json();
        setStats(data.stats);
        setMovies(data.movies);
        setReviews(data.reviews);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const fetchDrillDownData = useCallback(async (filter: FilterType, pageNum: number = 1) => {
    setDrillDownLoading(true);
    try {
      const res = await fetch(`/api/admin/visual-intelligence/drill-down?filter=${filter}&page=${pageNum}&pageSize=${pageSize}`);
      const data = await res.json();
      setDrillDownData(data.items);
      setTotalCount(data.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch drill-down data:', error);
    } finally {
      setDrillDownLoading(false);
    }
  }, []);

  const handleStatClick = (filter: FilterType, title: string, type: 'movies' | 'reviews') => {
    setDrillDownFilter(filter);
    setDrillDownTitle(title);
    setDrillDownType(type);
    setShowDrillDown(true);
    setPage(1);
    fetchDrillDownData(filter, 1);
  };

  const handleDelete = async (id: string, type: 'movie' | 'review') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/visual-intelligence/${type}/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        showToast(`${type} deleted successfully`, 'success');
        fetchDrillDownData(drillDownFilter, page);
        // Refresh stats
        const statsRes = await fetch('/api/admin/visual-intelligence');
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      } else {
        showToast(`Failed to delete ${type}`, 'error');
      }
    } catch (error) {
      showToast(`Error deleting ${type}`, 'error');
    }
  };

  const handlePublishToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/visual-intelligence/movie/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !currentStatus }),
      });
      
      if (res.ok) {
        showToast(`Movie ${currentStatus ? 'unpublished' : 'published'} successfully`, 'success');
        fetchDrillDownData(drillDownFilter, page);
      } else {
        showToast('Failed to update publish status', 'error');
      }
    } catch (error) {
      showToast('Error updating publish status', 'error');
    }
  };

  const handleApproveReview = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/visual-intelligence/review/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needs_human_review: false }),
      });
      
      if (res.ok) {
        showToast('Review approved successfully', 'success');
        fetchDrillDownData(drillDownFilter, page);
        // Refresh stats
        const statsRes = await fetch('/api/admin/visual-intelligence');
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      } else {
        showToast('Failed to approve review', 'error');
      }
    } catch (error) {
      showToast('Error approving review', 'error');
    }
  };

  const handleEditSave = async (movie: MovieWithVisual) => {
    try {
      const res = await fetch(`/api/admin/visual-intelligence/movie/${movie.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poster_url: movie.poster_url,
          poster_confidence: movie.poster_confidence,
          poster_visual_type: movie.poster_visual_type,
        }),
      });
      
      if (res.ok) {
        showToast('Movie updated successfully', 'success');
        setShowEditModal(false);
        setEditingItem(null);
        fetchDrillDownData(drillDownFilter, page);
      } else {
        showToast('Failed to update movie', 'error');
      }
    } catch (error) {
      showToast('Error updating movie', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading Visual Intelligence Data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Visual Intelligence Dashboard</h1>
            <p className="text-gray-400">Verify migration and backfill status • Click any card to drill down</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/visual-intelligence/curate"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Archival Image
            </Link>
            <Link
              href="/admin/visual-intelligence/outreach"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 text-sm"
            >
              <Send className="w-4 h-4" />
              Outreach Tracker
            </Link>
          </div>
        </div>

        {/* Stats Cards - Now Clickable */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard 
              label="Total Movies" 
              value={stats.totalMovies} 
              onClick={() => handleStatClick('all', 'All Movies', 'movies')}
            />
            <StatCard 
              label="With Visual Confidence" 
              value={stats.withConfidence} 
              percentage={Math.round(stats.withConfidence / stats.totalMovies * 100)}
              onClick={() => handleStatClick('with_confidence', 'Movies with Visual Confidence', 'movies')}
            />
            <StatCard 
              label="Tier 1 (Original)" 
              value={stats.tier1} 
              color="green" 
              onClick={() => handleStatClick('tier1', 'Tier 1 - Original Posters', 'movies')}
            />
            <StatCard 
              label="Tier 3 (Archive)" 
              value={stats.tier3} 
              color="amber" 
              onClick={() => handleStatClick('tier3', 'Tier 3 - Archive Cards / Placeholders', 'movies')}
            />
            
            <StatCard 
              label="Total Reviews" 
              value={stats.totalReviews} 
              onClick={() => handleStatClick('all_reviews', 'All Reviews', 'reviews')}
            />
            <StatCard 
              label="With Smart Review" 
              value={stats.withSmartReview}
              percentage={Math.round(stats.withSmartReview / stats.totalReviews * 100)}
              onClick={() => handleStatClick('with_smart_review', 'Reviews with Smart Review', 'reviews')}
            />
            <StatCard 
              label="Needs Human Review" 
              value={stats.needsHumanReview} 
              color="amber" 
              onClick={() => handleStatClick('needs_human_review', 'Reviews Needing Human Review', 'reviews')}
            />
            <StatCard 
              label="Tier 2 (Archival)" 
              value={stats.tier2} 
              color="blue" 
              onClick={() => handleStatClick('tier2', 'Tier 2 - Archival Imagery', 'movies')}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('movies')}
            className={`pb-2 px-4 ${activeTab === 'movies' ? 'text-white border-b-2 border-orange-500' : 'text-gray-500'}`}
          >
            Movies with Visual Confidence
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-2 px-4 ${activeTab === 'reviews' ? 'text-white border-b-2 border-orange-500' : 'text-gray-500'}`}
          >
            Smart Reviews
          </button>
        </div>

        {/* Movies Tab */}
        {activeTab === 'movies' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Sample Movies with Visual Confidence</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onEdit={() => {
                  setEditingItem(movie);
                  setShowEditModal(true);
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Sample Smart Reviews</h2>
            
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drill-Down Modal */}
      {showDrillDown && (
        <DrillDownModal
          title={drillDownTitle}
          type={drillDownType}
          data={drillDownData}
          loading={drillDownLoading}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onClose={() => setShowDrillDown(false)}
          onPageChange={(newPage) => fetchDrillDownData(drillDownFilter, newPage)}
          onEdit={(item) => {
            setEditingItem(item as MovieWithVisual);
            setShowEditModal(true);
          }}
          onDelete={(id) => handleDelete(id, drillDownType === 'movies' ? 'movie' : 'review')}
          onPublishToggle={handlePublishToggle}
          onApproveReview={handleApproveReview}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <EditMovieModal
          movie={editingItem}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

// Clickable Stat Card Component
function StatCard({ 
  label, 
  value, 
  percentage, 
  color = 'default',
  onClick,
}: { 
  label: string; 
  value: number; 
  percentage?: number;
  color?: 'default' | 'green' | 'amber' | 'blue';
  onClick?: () => void;
}) {
  const colorClasses = {
    default: 'bg-gray-900 border-gray-800 hover:border-gray-600',
    green: 'bg-green-900/20 border-green-800 hover:border-green-500',
    amber: 'bg-amber-900/20 border-amber-800 hover:border-amber-500',
    blue: 'bg-blue-900/20 border-blue-800 hover:border-blue-500',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border ${colorClasses[color]} text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]`}
    >
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white">
        {value.toLocaleString()}
        {percentage !== undefined && (
          <span className="text-sm text-gray-400 ml-2">({percentage}%)</span>
        )}
      </p>
      <p className="text-xs text-gray-500 mt-1">Click to view list →</p>
    </button>
  );
}

// Movie Card Component
function MovieCard({ movie, onEdit }: { movie: MovieWithVisual; onEdit: () => void }) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
      <div className="relative">
        {movie.archive_card_data ? (
          <ArchiveCard 
            data={movie.archive_card_data} 
            size="lg"
            aspectRatio="poster"
          />
        ) : movie.poster_url ? (
          <div className="relative aspect-[2/3]">
            <img 
              src={movie.poster_url} 
              alt={movie.title_en}
              className="w-full h-full object-cover"
            />
            <VisualConfidenceBadge
              tier={getTier(movie.poster_confidence)}
              confidence={movie.poster_confidence || undefined}
              visualType={movie.poster_visual_type as any}
              position="top-right"
            />
          </div>
        ) : (
          <div className="aspect-[2/3] bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500">No Poster</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{movie.title_en}</h3>
        <p className="text-sm text-gray-400">{movie.release_year} • {movie.hero || 'Unknown'}</p>
        
        <div className="mt-2 flex items-center gap-2">
          <VisualConfidenceIcon tier={getTier(movie.poster_confidence)} size="sm" />
          <span className="text-sm text-gray-400">
            Confidence: {movie.poster_confidence ? Math.round(movie.poster_confidence * 100) + '%' : 'N/A'}
          </span>
        </div>
        
        <p className="text-xs text-gray-500 mt-1">
          Type: {movie.poster_visual_type || 'Not classified'}
        </p>
        
        <button 
          onClick={onEdit}
          className="mt-3 text-xs text-blue-400 hover:text-blue-300"
        >
          Edit →
        </button>
      </div>
    </div>
  );
}

// Review Card Component
function ReviewCard({ review }: { review: ReviewWithSmart }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-white">{review.movies.title_en}</h3>
          <p className="text-sm text-gray-400">{review.movies.release_year}</p>
        </div>
        {review.needs_human_review && (
          <span className="px-2 py-1 text-xs bg-amber-900/50 text-amber-300 rounded">
            Needs Review
          </span>
        )}
      </div>
      
      {review.smart_review && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-green-400 font-medium mb-1">Why to Watch</h4>
            <ul className="text-gray-300 list-disc list-inside">
              {review.smart_review.why_to_watch.slice(0, 3).map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-red-400 font-medium mb-1">Why to Skip</h4>
            <ul className="text-gray-300 list-disc list-inside">
              {review.smart_review.why_to_skip.length > 0 ? (
                review.smart_review.why_to_skip.slice(0, 3).map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))
              ) : (
                <li className="text-gray-500">None identified</li>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="text-blue-400 font-medium mb-1">Legacy Status</h4>
            <p className="text-gray-300 capitalize">
              {review.smart_review.legacy_status?.replace('_', ' ') || 'Not classified'}
            </p>
          </div>
          
          <div>
            <h4 className="text-purple-400 font-medium mb-1">Mood Suitability</h4>
            <div className="flex flex-wrap gap-1">
              {review.smart_review.mood_suitability.slice(0, 4).map((mood, i) => (
                <span key={i} className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded text-xs">
                  {mood}
                </span>
              ))}
            </div>
          </div>
          
          <div className="col-span-2">
            <span className="text-gray-500 text-xs">
              Derivation Confidence: {Math.round(review.smart_review.derivation_confidence * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Drill-Down Modal Component
function DrillDownModal({
  title,
  type,
  data,
  loading,
  page,
  pageSize,
  totalCount,
  onClose,
  onPageChange,
  onEdit,
  onDelete,
  onPublishToggle,
  onApproveReview,
}: {
  title: string;
  type: 'movies' | 'reviews';
  data: MovieWithVisual[] | ReviewWithSmart[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  onClose: () => void;
  onPageChange: (page: number) => void;
  onEdit: (item: MovieWithVisual | ReviewWithSmart) => void;
  onDelete: (id: string) => void;
  onPublishToggle: (id: string, currentStatus: boolean) => void;
  onApproveReview: (id: string) => void;
}) {
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-gray-400">{totalCount.toLocaleString()} items</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : type === 'movies' ? (
            <table className="w-full">
              <thead className="text-left text-gray-400 text-sm border-b border-gray-800">
                <tr>
                  <th className="pb-3 w-16">Poster</th>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Year</th>
                  <th className="pb-3">Hero</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data as MovieWithVisual[]).map((movie) => (
                  <tr key={movie.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3">
                      {movie.poster_url ? (
                        <img 
                          src={movie.poster_url} 
                          alt={movie.title_en}
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="py-3 font-medium text-white">{movie.title_en}</td>
                    <td className="py-3 text-gray-400">{movie.release_year || '?'}</td>
                    <td className="py-3 text-gray-400">{movie.hero || '-'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (movie.poster_confidence || 0) >= 0.9 ? 'bg-green-900/50 text-green-300' :
                        (movie.poster_confidence || 0) >= 0.6 ? 'bg-blue-900/50 text-blue-300' :
                        'bg-amber-900/50 text-amber-300'
                      }`}>
                        {movie.poster_confidence ? Math.round(movie.poster_confidence * 100) + '%' : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-sm">{movie.poster_visual_type || '-'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        movie.is_published ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {movie.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => onEdit(movie)}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onPublishToggle(movie.id, movie.is_published)}
                          className={`px-3 py-1 text-xs rounded ${
                            movie.is_published 
                              ? 'bg-amber-600 hover:bg-amber-500' 
                              : 'bg-green-600 hover:bg-green-500'
                          }`}
                        >
                          {movie.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => onDelete(movie.id)}
                          className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="text-left text-gray-400 text-sm border-b border-gray-800">
                <tr>
                  <th className="pb-3">Movie</th>
                  <th className="pb-3">Year</th>
                  <th className="pb-3">Legacy Status</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data as ReviewWithSmart[]).map((review) => (
                  <tr key={review.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 font-medium text-white">{review.movies.title_en}</td>
                    <td className="py-3 text-gray-400">{review.movies.release_year}</td>
                    <td className="py-3 text-gray-400 capitalize">
                      {review.smart_review?.legacy_status?.replace('_', ' ') || '-'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (review.smart_review?.derivation_confidence || 0) >= 0.7 ? 'bg-green-900/50 text-green-300' :
                        (review.smart_review?.derivation_confidence || 0) >= 0.5 ? 'bg-amber-900/50 text-amber-300' :
                        'bg-red-900/50 text-red-300'
                      }`}>
                        {review.smart_review?.derivation_confidence 
                          ? Math.round(review.smart_review.derivation_confidence * 100) + '%' 
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3">
                      {review.needs_human_review ? (
                        <span className="px-2 py-1 text-xs bg-amber-900/50 text-amber-300 rounded">
                          Needs Review
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-green-900/50 text-green-300 rounded">
                          Approved
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {review.needs_human_review && (
                          <button
                            onClick={() => onApproveReview(review.id)}
                            className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 rounded"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(review.id)}
                          className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-800 flex justify-between items-center">
          <p className="text-gray-400 text-sm">
            Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Movie Modal Component
function EditMovieModal({
  movie,
  onClose,
  onSave,
}: {
  movie: MovieWithVisual;
  onClose: () => void;
  onSave: (movie: MovieWithVisual) => void;
}) {
  const [formData, setFormData] = useState(movie);
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit Movie</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Title</label>
            <input
              type="text"
              value={formData.title_en}
              disabled
              className="w-full bg-gray-800 rounded px-3 py-2 text-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Poster URL</label>
            <input
              type="text"
              value={formData.poster_url || ''}
              onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
              className="w-full bg-gray-800 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Confidence (0-1)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.poster_confidence || 0}
                onChange={(e) => setFormData({ ...formData, poster_confidence: parseFloat(e.target.value) })}
                className="w-full bg-gray-800 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-1">Visual Type</label>
              <select
                value={formData.poster_visual_type || ''}
                onChange={(e) => setFormData({ ...formData, poster_visual_type: e.target.value })}
                className="w-full bg-gray-800 rounded px-3 py-2 text-white"
              >
                <option value="">Select...</option>
                <option value="original_poster">Original Poster</option>
                <option value="archival_still">Archival Still</option>
                <option value="magazine_ad">Magazine Ad</option>
                <option value="song_book_cover">Song Book Cover</option>
                <option value="newspaper_clipping">Newspaper Clipping</option>
                <option value="cassette_cover">Cassette Cover</option>
                <option value="archive_card">Archive Card</option>
                <option value="placeholder">Placeholder</option>
              </select>
            </div>
          </div>
          
          {formData.poster_url && (
            <div>
              <label className="block text-gray-400 text-sm mb-1">Preview</label>
              <img 
                src={formData.poster_url} 
                alt="Preview" 
                className="w-32 h-48 object-cover rounded"
              />
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
