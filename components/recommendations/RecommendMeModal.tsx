'use client';

/**
 * RECOMMEND ME MODAL
 * 
 * Full-screen modal for personalized movie recommendations.
 * - Optional preference selection (languages, genres, moods, era)
 * - Toggle filters (family-friendly, blockbusters, hidden gems)
 * - Results display using SimilarMoviesCarousel
 * - Scroll position preservation
 * - Visual confidence awareness (extended Jan 2026)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Sparkles, ChevronDown, ChevronUp, Film, Loader2,
  Globe, Theater, Heart, Calendar, Star, Flame, Gem, Users, RefreshCw,
  Eye, ImageOff
} from 'lucide-react';
import { SimilarMoviesCarousel, type SimilarSection } from '@/components/reviews/SimilarMoviesCarousel';
import type { MoodPreference, EraPreference, RecommendMePreferences } from '@/lib/movies/recommend-me';
import { applyVisualConfidenceBoost, type SimilarSectionWithVisual } from '@/lib/movies/similarity-engine';
import type { SpecialCategory } from '@/lib/movies/special-categories';
import { getCategoryLabel, getCategoryEmoji } from '@/lib/movies/special-categories';

// ============================================================
// TYPES
// ============================================================

interface RecommendMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional pre-fill from current movie context
  prefillLanguage?: string;
  prefillGenres?: string[];
  prefillEra?: EraPreference;
}

// ============================================================
// CONSTANTS
// ============================================================

const LANGUAGES = [
  { code: 'Telugu', label: 'Telugu', icon: '🎬' },
  { code: 'Hindi', label: 'Hindi', icon: '🇮🇳' },
  { code: 'Tamil', label: 'Tamil', icon: '🎭' },
  { code: 'Malayalam', label: 'Malayalam', icon: '🌟' },
  { code: 'English', label: 'English', icon: '🎥' },
  { code: 'Kannada', label: 'Kannada', icon: '🎪' },
];

const GENRES = [
  'Action', 'Drama', 'Thriller', 'Romance', 'Comedy',
  'Family', 'Crime', 'Fantasy', 'Horror', 'Mystery',
];

const MOODS: { value: MoodPreference; label: string; icon: string }[] = [
  { value: 'feel-good', label: 'Feel Good', icon: '😊' },
  { value: 'intense', label: 'Intense', icon: '🔥' },
  { value: 'emotional', label: 'Emotional', icon: '😢' },
  { value: 'inspirational', label: 'Inspirational', icon: '✨' },
  { value: 'light-hearted', label: 'Light & Fun', icon: '🎉' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'mass', label: 'Mass', icon: '💪' },
  { value: 'thought-provoking', label: 'Mind-Bending', icon: '🧠' },
];

const ERAS: { value: EraPreference; label: string }[] = [
  { value: 'recent', label: '2020s' },
  { value: '2010s', label: '2010s' },
  { value: '2000s', label: '2000s' },
  { value: '90s', label: '90s' },
  { value: 'classics', label: 'Classics' },
];

// ============================================================
// CHIP COMPONENT
// ============================================================

function Chip({
  selected,
  onClick,
  children,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-150 border
        ${selected
          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
          : 'bg-[var(--bg-secondary)]/50 border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-gray-600 hover:text-[var(--text-secondary)]'
        }
      `}
    >
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </button>
  );
}

// ============================================================
// TOGGLE SWITCH
// ============================================================

function Toggle({
  checked,
  onChange,
  label,
  icon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]/30 border border-gray-800 cursor-pointer hover:border-[var(--border-primary)] transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-[var(--text-secondary)]">{icon}</span>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <div
        className={`
          relative w-10 h-6 rounded-full transition-colors
          ${checked ? 'bg-orange-500' : 'bg-[var(--bg-tertiary)]'}
        `}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`
            absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm
            transition-transform duration-150
            ${checked ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </div>
    </label>
  );
}

// ============================================================
// SECTION ACCORDION
// ============================================================

function PreferenceSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-secondary)]">{icon}</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 border-t border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function RecommendMeModal({
  isOpen,
  onClose,
  prefillLanguage,
  prefillGenres,
  prefillEra,
}: RecommendMeModalProps) {
  // Scroll preservation
  const scrollYRef = useRef(0);

  // Preferences state
  const [languages, setLanguages] = useState<string[]>(
    prefillLanguage ? [prefillLanguage] : ['Telugu']
  );
  const [genres, setGenres] = useState<string[]>(prefillGenres || []);
  const [moods, setMoods] = useState<MoodPreference[]>([]);
  const [era, setEra] = useState<EraPreference[]>(prefillEra ? [prefillEra] : []);
  
  // Special categories
  const [specialCategories, setSpecialCategories] = useState<SpecialCategory[]>([]);
  
  // Toggles
  const [familyFriendly, setFamilyFriendly] = useState(false);
  const [blockbustersOnly, setBlockbustersOnly] = useState(false);
  const [hiddenGems, setHiddenGems] = useState(false);
  const [highlyRatedOnly, setHighlyRatedOnly] = useState(false);
  
  // Visual confidence preference (extended Jan 2026)
  const [prioritizeVisuals, setPrioritizeVisuals] = useState(false);

  // Results state
  const [sections, setSections] = useState<SimilarSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle scroll preservation
  useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSections([]);
      setHasSearched(false);
      setError(null);
      // Apply prefills
      if (prefillLanguage) setLanguages([prefillLanguage]);
      if (prefillGenres) setGenres(prefillGenres);
      if (prefillEra) setEra([prefillEra]);
    }
  }, [isOpen, prefillLanguage, prefillGenres, prefillEra]);

  // Toggle helpers
  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleGenre = (genre: string) => {
    setGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleMood = (mood: MoodPreference) => {
    setMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const toggleEra = (e: EraPreference) => {
    setEra(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    );
  };

  const toggleSpecialCategory = (category: SpecialCategory) => {
    setSpecialCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  // Reset all preferences
  const handleReset = () => {
    setLanguages(['Telugu']);
    setGenres([]);
    setMoods([]);
    setEra([]);
    setSpecialCategories([]);
    setFamilyFriendly(false);
    setBlockbustersOnly(false);
    setHiddenGems(false);
    setHighlyRatedOnly(false);
    setPrioritizeVisuals(false);
    setSections([]);
    setHasSearched(false);
    setError(null);
  };

  // Fetch recommendations
  const handleGetRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const prefs: RecommendMePreferences = {
        languages: languages.length > 0 ? languages : undefined,
        genres: genres.length > 0 ? genres : undefined,
        moods: moods.length > 0 ? moods : undefined,
        era: era.length > 0 ? era : undefined,
        specialCategories: specialCategories.length > 0 ? specialCategories : undefined,
        familyFriendly,
        blockbustersOnly,
        hiddenGems,
        highlyRatedOnly,
      };

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      const data = await res.json();

      if (data.success) {
        // Apply visual confidence boost if enabled
        const resultSections = prioritizeVisuals 
          ? applyVisualConfidenceBoost(data.sections)
          : data.sections;
        setSections(resultSections);
      } else {
        setError(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [languages, genres, moods, era, specialCategories, familyFriendly, blockbustersOnly, hiddenGems, highlyRatedOnly, prioritizeVisuals]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalMovies = sections.reduce((sum, s) => sum + s.movies.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[95vh] m-4 bg-[var(--bg-primary)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-orange-950/30 via-gray-900 to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20">
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Recommend Me</h2>
              <p className="text-sm text-[var(--text-secondary)]">Find your perfect movie</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Preferences Section */}
          {!hasSearched && (
            <div className="p-6 space-y-4">
              <p className="text-[var(--text-secondary)] text-sm">
                Select your preferences below, or leave empty for random picks from our catalogue.
                All fields are optional!
              </p>

              {/* Languages */}
              <PreferenceSection
                title="Language"
                icon={<Globe className="w-4 h-4" />}
                defaultOpen={true}
              >
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <Chip
                      key={lang.code}
                      selected={languages.includes(lang.code)}
                      onClick={() => toggleLanguage(lang.code)}
                      icon={lang.icon}
                    >
                      {lang.label}
                    </Chip>
                  ))}
                </div>
              </PreferenceSection>

              {/* Genres */}
              <PreferenceSection
                title="Genre"
                icon={<Theater className="w-4 h-4" />}
                defaultOpen={true}
              >
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <Chip
                      key={genre}
                      selected={genres.includes(genre)}
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                    </Chip>
                  ))}
                </div>
              </PreferenceSection>

              {/* Moods */}
              <PreferenceSection
                title="Mood"
                icon={<Heart className="w-4 h-4" />}
                defaultOpen={false}
              >
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(mood => (
                    <Chip
                      key={mood.value}
                      selected={moods.includes(mood.value)}
                      onClick={() => toggleMood(mood.value)}
                      icon={mood.icon}
                    >
                      {mood.label}
                    </Chip>
                  ))}
                </div>
              </PreferenceSection>

              {/* Era */}
              <PreferenceSection
                title="Era"
                icon={<Calendar className="w-4 h-4" />}
                defaultOpen={false}
              >
                <div className="flex flex-wrap gap-2">
                  {ERAS.map(e => (
                    <Chip
                      key={e.value}
                      selected={era.includes(e.value)}
                      onClick={() => toggleEra(e.value)}
                    >
                      {e.label}
                    </Chip>
                  ))}
                </div>
              </PreferenceSection>

              {/* Special Categories */}
              <PreferenceSection
                title="Watch Mood"
                icon={<Heart className="w-4 h-4" />}
                defaultOpen={false}
              >
                <div className="flex flex-wrap gap-2">
                  {([
                    'stress-buster',
                    'popcorn',
                    'group-watch',
                    'watch-with-special-one',
                    'weekend-binge',
                    'family-night',
                    'laugh-riot',
                    'mind-benders',
                    'cult-classics',
                    'horror-night',
                  ] as SpecialCategory[]).map(category => (
                    <Chip
                      key={category}
                      selected={specialCategories.includes(category)}
                      onClick={() => toggleSpecialCategory(category)}
                      icon={getCategoryEmoji(category)}
                    >
                      {getCategoryLabel(category)}
                    </Chip>
                  ))}
                </div>
              </PreferenceSection>

              {/* Toggles */}
              <PreferenceSection
                title="Special Filters"
                icon={<Star className="w-4 h-4" />}
                defaultOpen={false}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Toggle
                    checked={familyFriendly}
                    onChange={setFamilyFriendly}
                    label="Family Friendly"
                    icon={<Users className="w-4 h-4" />}
                  />
                  <Toggle
                    checked={highlyRatedOnly}
                    onChange={setHighlyRatedOnly}
                    label="Highly Rated Only"
                    icon={<Star className="w-4 h-4" />}
                  />
                  <Toggle
                    checked={blockbustersOnly}
                    onChange={setBlockbustersOnly}
                    label="Blockbusters"
                    icon={<Flame className="w-4 h-4" />}
                  />
                  <Toggle
                    checked={hiddenGems}
                    onChange={setHiddenGems}
                    label="Hidden Gems"
                    icon={<Gem className="w-4 h-4" />}
                  />
                  <Toggle
                    checked={prioritizeVisuals}
                    onChange={setPrioritizeVisuals}
                    label="Quality Posters"
                    icon={<Eye className="w-4 h-4" />}
                  />
                </div>
              </PreferenceSection>
            </div>
          )}

          {/* Results Section */}
          {hasSearched && (
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                  <p className="text-[var(--text-secondary)]">Finding perfect movies for you...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Film className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={handleGetRecommendations}
                    className="px-4 py-2 bg-orange-500 text-[var(--text-primary)] rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Film className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-[var(--text-secondary)] mb-4">No movies found matching your criteria</p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Reset & Try Again
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Results header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        Found {totalMovies} movies for you
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Across {sections.length} categories
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg hover:border-gray-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      New Search
                    </button>
                  </div>

                  {/* Carousel sections */}
                  <SimilarMoviesCarousel sections={sections} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!hasSearched && (
          <div className="px-6 py-4 border-t border-gray-800 bg-[var(--bg-primary)]/80 flex items-center justify-between gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Reset All
            </button>
            <button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Get Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


