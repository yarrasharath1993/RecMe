'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, BookOpen, Users, Shield, Tag } from 'lucide-react';
import Link from 'next/link';
import type { Category } from '@/types/database';

// Content Sector Definitions
const CONTENT_SECTORS = [
  { value: 'movies_cinema', label: '🎬 Movies & Cinema', icon: '🎬' },
  { value: 'auto_trends', label: '⚡ Auto Trends & Buzz', icon: '⚡' },
  { value: 'actor_industry', label: '🎭 Actor & Industry Stories', icon: '🎭' },
  { value: 'crime_courts', label: '⚖️ Crimes, Courts & Controversies', icon: '⚖️' },
  { value: 'archives_buried', label: '📜 Archives & Buried Truths', icon: '📜' },
  { value: 'what_if_fiction', label: '🌀 What-If & Fiction', icon: '🌀' },
  { value: 'kids_family', label: '🧒 Kids & Family Zone', icon: '🧒' },
  { value: 'pregnancy_wellness', label: '🤱 Pregnancy, Wellness & Family', icon: '🤱' },
  { value: 'food_bachelor', label: '🍳 Food & Bachelor Life', icon: '🍳' },
  { value: 'stories_narratives', label: '📖 Stories & Narratives', icon: '📖' },
  { value: 'general', label: '📰 General', icon: '📰' },
] as const;

const CONTENT_TYPES_BY_SECTOR: Record<string, { value: string; label: string }[]> = {
  movies_cinema: [
    { value: 'review', label: 'Movie Review' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'article', label: 'Article' },
  ],
  auto_trends: [
    { value: 'buzz', label: 'Daily Buzz' },
    { value: 'article', label: 'Article' },
  ],
  actor_industry: [
    { value: 'biography', label: 'Biography' },
    { value: 'interview', label: 'Interview' },
    { value: 'article', label: 'Article' },
  ],
  crime_courts: [
    { value: 'case_study', label: 'Case Study' },
    { value: 'timeline', label: 'Timeline' },
    { value: 'article', label: 'Article' },
  ],
  archives_buried: [
    { value: 'investigation', label: 'Investigation' },
    { value: 'article', label: 'Article' },
  ],
  what_if_fiction: [
    { value: 'alternate_history', label: 'Alternate History' },
    { value: 'speculation', label: 'Speculation' },
    { value: 'article', label: 'Article' },
  ],
  kids_family: [
    { value: 'story', label: 'Story' },
    { value: 'moral_story', label: 'Moral Story' },
    { value: 'mythology', label: 'Mythology' },
    { value: 'bedtime_story', label: 'Bedtime Story' },
    { value: 'guide', label: 'Learning Guide' },
  ],
  pregnancy_wellness: [
    { value: 'guide', label: 'Health Guide' },
    { value: 'article', label: 'Article' },
  ],
  food_bachelor: [
    { value: 'recipe', label: 'Recipe' },
    { value: 'article', label: 'Article' },
  ],
  stories_narratives: [
    { value: 'story', label: 'Story' },
    { value: 'article', label: 'Article' },
  ],
  general: [
    { value: 'article', label: 'Article' },
    { value: 'news', label: 'News' },
  ],
};

const AUDIENCE_PROFILES = [
  { value: 'general', label: 'General Audience' },
  { value: 'kids', label: 'Kids (0-12)' },
  { value: 'family', label: 'Family Friendly' },
  { value: 'adult', label: 'Adult (18+)' },
];

const SENSITIVITY_LEVELS = [
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'sensitive', label: 'Sensitive' },
];

const categories: { value: Category; label: string }[] = [
  { value: 'gossip', label: 'గాసిప్' },
  { value: 'sports', label: 'స్పోర్ట్స్' },
  { value: 'politics', label: 'రాజకీయాలు' },
  { value: 'entertainment', label: 'వినోదం' },
  { value: 'trending', label: 'ట్రెండింగ్' },
];

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Basic fields
  const [title, setTitle] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [teluguBody, setTeluguBody] = useState('');
  const [category, setCategory] = useState<Category>('entertainment');
  const [imageUrls, setImageUrls] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Content Platform fields
  const [contentSector, setContentSector] = useState('general');
  const [contentType, setContentType] = useState('article');
  const [audienceProfile, setAudienceProfile] = useState('general');
  const [sensitivityLevel, setSensitivityLevel] = useState('none');
  const [fictionalLabel, setFictionalLabel] = useState(false);
  const [ageGroup, setAgeGroup] = useState('');
  const [tags, setTags] = useState('');

  // Update content type options when sector changes
  useEffect(() => {
    const types = CONTENT_TYPES_BY_SECTOR[contentSector] || CONTENT_TYPES_BY_SECTOR.general;
    if (!types.find(t => t.value === contentType)) {
      setContentType(types[0]?.value || 'article');
    }
  }, [contentSector]);

  // Auto-set fictional label for what_if_fiction sector
  useEffect(() => {
    if (contentSector === 'what_if_fiction') {
      setFictionalLabel(true);
    }
  }, [contentSector]);

  // Auto-set audience for kids content
  useEffect(() => {
    if (contentSector === 'kids_family') {
      setAudienceProfile('kids');
      setSensitivityLevel('none');
    }
  }, [contentSector]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Generate ASCII-only slug - use English title if available
      const titleForSlug = title || 'post';
      const slug = titleForSlug
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[\u0C00-\u0C7F]/g, '') // Remove Telugu characters
        .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with dash
        .replace(/^-+|-+$/g, '')         // Trim dashes
        .slice(0, 80) + '-' + Date.now().toString(36);

      const postData = {
        title: title || titleTe,
        title_te: titleTe || title,
        slug,
        telugu_body: teluguBody,
        body_te: teluguBody,
        category,
        image_url: imageUrls.split('\n').filter(Boolean)[0] || null,
        image_urls: imageUrls.split('\n').filter(Boolean),
        status,
        // Content Platform fields
        content_sector: contentSector,
        content_type: contentType,
        audience_profile: audienceProfile,
        sensitivity_level: sensitivityLevel,
        fictional_label: fictionalLabel,
        age_group: ageGroup || null,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        verification_status: 'draft',
        fact_confidence_score: 70,
        source_count: 1,
        source_refs: [{ id: '1', sourceName: 'Manual Entry', trustLevel: 0.8 }],
        published_at: status === 'published' ? new Date().toISOString() : null,
      };

      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }

      router.push('/admin/posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const currentContentTypes = CONTENT_TYPES_BY_SECTOR[contentSector] || CONTENT_TYPES_BY_SECTOR.general;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/posts"
          className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#737373]" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Create New Content</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Content Sector Selection - Prominent */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-[#0f3460] rounded-xl p-6">
          <label className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <BookOpen className="w-5 h-5 text-[#eab308]" />
            Content Sector
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CONTENT_SECTORS.map((sector) => (
              <button
                key={sector.value}
                type="button"
                onClick={() => setContentSector(sector.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  contentSector === sector.value
                    ? 'border-[#eab308] bg-[#eab308]/10 text-white'
                    : 'border-[#262626] bg-[#141414] text-[#a3a3a3] hover:border-[#404040]'
                }`}
              >
                <span className="text-lg mr-2">{sector.icon}</span>
                <span className="text-sm">{sector.label.replace(/^[^\s]+\s/, '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Type */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#ededed] mb-2">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white focus:border-[#eab308] focus:outline-none"
            >
              {currentContentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#ededed] mb-2">
              Legacy Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white focus:border-[#eab308] focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#ededed] mb-2">
              Title (English)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title in English..."
              className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white placeholder-[#737373] focus:border-[#eab308] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#ededed] mb-2">
              Title (తెలుగు) *
            </label>
            <input
              type="text"
              value={titleTe}
              onChange={(e) => setTitleTe(e.target.value)}
              required
              placeholder="శీర్షిక తెలుగులో రాయండి..."
              className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white placeholder-[#737373] focus:border-[#eab308] focus:outline-none"
            />
          </div>
        </div>

        {/* Telugu Body */}
        <div>
          <label className="block text-sm font-medium text-[#ededed] mb-2">
            Content (విషయం) *
          </label>
          <textarea
            value={teluguBody}
            onChange={(e) => setTeluguBody(e.target.value)}
            required
            rows={12}
            placeholder="వార్త విషయం తెలుగులో రాయండి..."
            className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white placeholder-[#737373] focus:border-[#eab308] focus:outline-none resize-none"
          />
          <p className="text-xs text-[#737373] mt-1">
            Tip: Use double line breaks for paragraphs. Markdown supported.
          </p>
        </div>

        {/* Image URLs */}
        <div>
          <label className="block text-sm font-medium text-[#ededed] mb-2">
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image URLs (one per line)
            </span>
          </label>
          <textarea
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            rows={2}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white placeholder-[#737373] focus:border-[#eab308] focus:outline-none resize-none font-mono text-sm"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-[#ededed] mb-2">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags (comma separated)
            </span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="movie, review, tollywood, 2024"
            className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white placeholder-[#737373] focus:border-[#eab308] focus:outline-none"
          />
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-[#eab308] hover:text-[#fbbf24] transition-colors"
        >
          <Shield className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#ededed] mb-2">
                  <Users className="w-4 h-4" />
                  Audience Profile
                </label>
                <select
                  value={audienceProfile}
                  onChange={(e) => setAudienceProfile(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white focus:border-[#eab308] focus:outline-none"
                >
                  {AUDIENCE_PROFILES.map((profile) => (
                    <option key={profile.value} value={profile.value}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#ededed] mb-2">
                  Sensitivity Level
                </label>
                <select
                  value={sensitivityLevel}
                  onChange={(e) => setSensitivityLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white focus:border-[#eab308] focus:outline-none"
                >
                  {SENSITIVITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {contentSector === 'kids_family' && (
              <div>
                <label className="block text-sm font-medium text-[#ededed] mb-2">
                  Age Group
                </label>
                <input
                  type="text"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  placeholder="e.g., 4-6, 7-10"
                  className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white placeholder-[#737373] focus:border-[#eab308] focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="fictional"
                checked={fictionalLabel}
                onChange={(e) => setFictionalLabel(e.target.checked)}
                className="w-4 h-4 accent-[#eab308]"
              />
              <label htmlFor="fictional" className="text-[#ededed]">
                Mark as Fictional/Speculative Content
              </label>
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-[#ededed] mb-2">
            Status
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={status === 'draft'}
                onChange={() => setStatus('draft')}
                className="w-4 h-4 accent-[#eab308]"
              />
              <span className="text-[#ededed]">Save as Draft</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="published"
                checked={status === 'published'}
                onChange={() => setStatus('published')}
                className="w-4 h-4 accent-[#eab308]"
              />
              <span className="text-[#ededed]">Publish Now</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#eab308] text-black font-bold rounded-lg hover:bg-[#ca9a06] transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Content'}
          </button>
          <Link
            href="/admin/posts"
            className="px-6 py-3 bg-[#262626] text-white rounded-lg hover:bg-[#363636] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
