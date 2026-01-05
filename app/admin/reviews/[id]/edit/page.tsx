'use client';

/**
 * Admin: Movie Review Editor
 * 
 * Full-featured editor for movie reviews including:
 * - Rating sliders (overall + detailed)
 * - Text areas for verdict, summary, section reviews
 * - Strengths/weaknesses tags
 * - Status controls
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Film,
  Star,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Trash2,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface MovieData {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  release_year?: number;
  poster_url?: string;
  backdrop_url?: string;
  director?: string;
  hero?: string;
  heroine?: string;
  genres?: string[];
  synopsis?: string;
}

interface ReviewData {
  id?: string;
  movie_id: string;
  
  // Ratings
  overall_rating: number;
  direction_rating?: number;
  screenplay_rating?: number;
  acting_rating?: number;
  music_rating?: number;
  cinematography_rating?: number;
  production_rating?: number;
  entertainment_rating?: number;
  
  // Content
  title?: string;
  title_te?: string;
  summary?: string;
  summary_te?: string;
  verdict?: string;
  verdict_te?: string;
  
  // Section Reviews
  direction_review?: string;
  screenplay_review?: string;
  acting_review?: string;
  music_review?: string;
  cinematography_review?: string;
  
  // Tags
  strengths?: string[];
  weaknesses?: string[];
  recommended_for?: string[];
  
  // Meta
  reviewer_type: string;
  reviewer_name: string;
  is_featured: boolean;
  is_spoiler_free: boolean;
  status: string;
  worth_watching: boolean;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ReviewEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: movieId } = use(params);
  const router = useRouter();
  
  const [movie, setMovie] = useState<MovieData | null>(null);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Editable form state
  const [formData, setFormData] = useState<Partial<ReviewData>>({});

  useEffect(() => {
    fetchData();
  }, [movieId]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${movieId}`);
      const json = await res.json();
      
      if (json.success) {
        setMovie(json.movie);
        setReview(json.review);
        
        // Initialize form with existing review or defaults
        setFormData(json.review || {
          movie_id: movieId,
          overall_rating: 7,
          direction_rating: 7,
          screenplay_rating: 7,
          acting_rating: 7,
          music_rating: 7,
          cinematography_rating: 7,
          production_rating: 7,
          entertainment_rating: 7,
          reviewer_type: 'admin',
          reviewer_name: 'TeluguVibes Editor',
          is_featured: false,
          is_spoiler_free: true,
          status: 'draft',
          worth_watching: true,
          strengths: [],
          weaknesses: [],
          recommended_for: [],
        });
      } else {
        setError(json.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const res = await fetch(`/api/admin/reviews/${movieId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          movie_id: movieId,
        }),
      });
      
      const json = await res.json();
      
      if (json.success) {
        setSuccessMessage('Review saved successfully!');
        setReview(json.review);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(json.error || 'Failed to save');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof ReviewData>(field: K, value: ReviewData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Film className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-white text-lg mb-2">Movie Not Found</p>
        <Link
          href="/admin/reviews"
          className="text-orange-400 hover:text-orange-300"
        >
          Back to Reviews
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/reviews"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reviews
          </Link>
          <div className="flex items-center gap-4">
            {movie.poster_url && (
              <img
                src={movie.poster_url}
                alt={movie.title_en}
                className="w-16 h-24 object-cover rounded"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{movie.title_en}</h1>
              {movie.title_te && (
                <p className="text-gray-400">{movie.title_te}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {movie.release_year} • {movie.director} • {movie.genres?.join(', ')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link
            href={`/reviews/${movie.slug}`}
            target="_blank"
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Form Sections */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Ratings */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Ratings
            </h2>
            
            <div className="space-y-4">
              <RatingSlider
                label="Overall"
                value={formData.overall_rating || 7}
                onChange={(v) => updateField('overall_rating', v)}
                isPrimary
              />
              <RatingSlider
                label="Direction"
                value={formData.direction_rating || 7}
                onChange={(v) => updateField('direction_rating', v)}
              />
              <RatingSlider
                label="Screenplay"
                value={formData.screenplay_rating || 7}
                onChange={(v) => updateField('screenplay_rating', v)}
              />
              <RatingSlider
                label="Acting"
                value={formData.acting_rating || 7}
                onChange={(v) => updateField('acting_rating', v)}
              />
              <RatingSlider
                label="Music"
                value={formData.music_rating || 7}
                onChange={(v) => updateField('music_rating', v)}
              />
              <RatingSlider
                label="Cinematography"
                value={formData.cinematography_rating || 7}
                onChange={(v) => updateField('cinematography_rating', v)}
              />
              <RatingSlider
                label="Production"
                value={formData.production_rating || 7}
                onChange={(v) => updateField('production_rating', v)}
              />
              <RatingSlider
                label="Entertainment"
                value={formData.entertainment_rating || 7}
                onChange={(v) => updateField('entertainment_rating', v)}
              />
            </div>
          </div>

          {/* Status Controls */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Review Status</label>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <ToggleSwitch
                label="Worth Watching"
                checked={formData.worth_watching ?? true}
                onChange={(v) => updateField('worth_watching', v)}
              />
              <ToggleSwitch
                label="Featured"
                checked={formData.is_featured ?? false}
                onChange={(v) => updateField('is_featured', v)}
              />
              <ToggleSwitch
                label="Spoiler Free"
                checked={formData.is_spoiler_free ?? true}
                onChange={(v) => updateField('is_spoiler_free', v)}
              />
            </div>
          </div>
        </div>

        {/* Middle & Right Column - Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Summary & Verdict */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Summary & Verdict</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Review Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder={`e.g., "${movie.title_en} - A Cinematic Triumph"`}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Summary (Quick verdict)</label>
                <textarea
                  value={formData.summary || ''}
                  onChange={(e) => updateField('summary', e.target.value)}
                  rows={3}
                  placeholder="2-3 sentences summarizing the movie..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Final Verdict</label>
                <textarea
                  value={formData.verdict || ''}
                  onChange={(e) => updateField('verdict', e.target.value)}
                  rows={4}
                  placeholder="The final recommendation and overall assessment..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section Reviews */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Detailed Reviews</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Direction Review</label>
                <textarea
                  value={formData.direction_review || ''}
                  onChange={(e) => updateField('direction_review', e.target.value)}
                  rows={3}
                  placeholder="Analysis of the director's vision and execution..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Acting Review</label>
                <textarea
                  value={formData.acting_review || ''}
                  onChange={(e) => updateField('acting_review', e.target.value)}
                  rows={3}
                  placeholder="Performance analysis of the cast..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Screenplay Review</label>
                <textarea
                  value={formData.screenplay_review || ''}
                  onChange={(e) => updateField('screenplay_review', e.target.value)}
                  rows={3}
                  placeholder="Story structure, pacing, and dialogue..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Music Review</label>
                <textarea
                  value={formData.music_review || ''}
                  onChange={(e) => updateField('music_review', e.target.value)}
                  rows={3}
                  placeholder="Songs, background score, and overall music quality..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Cinematography Review</label>
                <textarea
                  value={formData.cinematography_review || ''}
                  onChange={(e) => updateField('cinematography_review', e.target.value)}
                  rows={3}
                  placeholder="Visual style, camera work, and production design..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Tags & Categories</h2>
            
            <div className="space-y-4">
              <TagInput
                label="Strengths"
                tags={formData.strengths || []}
                onChange={(tags) => updateField('strengths', tags)}
                placeholder="Add strength (press Enter)"
                color="green"
              />
              
              <TagInput
                label="Weaknesses"
                tags={formData.weaknesses || []}
                onChange={(tags) => updateField('weaknesses', tags)}
                placeholder="Add weakness (press Enter)"
                color="red"
              />
              
              <TagInput
                label="Recommended For"
                tags={formData.recommended_for || []}
                onChange={(tags) => updateField('recommended_for', tags)}
                placeholder="e.g., family, action lovers (press Enter)"
                color="blue"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function RatingSlider({
  label,
  value,
  onChange,
  isPrimary = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  isPrimary?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className={`text-sm ${isPrimary ? 'text-white font-medium' : 'text-gray-400'}`}>
          {label}
        </label>
        <span className={`text-sm font-bold ${
          value >= 8 ? 'text-green-400' :
          value >= 6 ? 'text-yellow-400' :
          value >= 4 ? 'text-orange-400' : 'text-red-400'
        }`}>
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer ${
          isPrimary ? 'bg-orange-900' : 'bg-gray-700'
        } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500`}
      />
    </div>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-400">{label}</span>
      <div
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-gray-700'
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </div>
    </label>
  );
}

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
  color,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  color: 'green' | 'red' | 'blue';
}) {
  const [input, setInput] = useState('');
  
  const colors = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    }
  }

  function removeTag(tagToRemove: string) {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  }

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`px-2 py-1 rounded text-sm border ${colors[color]} flex items-center gap-1`}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-white ml-1"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 text-sm"
      />
    </div>
  );
}

