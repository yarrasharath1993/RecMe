'use client';

import { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  ChevronDown,
  ChevronUp,
  Users,
  Sparkles,
  Trophy,
  Flame,
  Globe,
} from "lucide-react";
import {
  getWatchRecommendation,
  getWatchLabel,
  getWatchStyle,
  type WatchRecommendation,
} from "@/lib/ratings/editorial-rating";

interface QuickVerdictProps {
  whyWatch?: {
    reasons?: string[];
    best_for?: string[];
  };
  whySkip?: {
    reasons?: string[];
    not_for?: string[];
  };
  verdict?: {
    en?: string;
    te?: string;
    category?: string;
    final_rating?: number;
    cult?: boolean;
  };
  qualityScore?: number;
  awards?: {
    national_awards?: (string | { award?: string; winner?: string })[];
    filmfare_awards?: (string | { award?: string; winner?: string })[];
    nandi_awards?: (string | { award?: string; winner?: string })[];
    other_awards?: (string | { award?: string; winner?: string })[];
    box_office_records?: string[];
  };
  culturalHighlights?: {
    legacy_status?: string;
    cult_status?: boolean;
  };
  isClassic?: boolean;
  compact?: boolean;
}

// Get dynamic style based on rating
const getStyleFromRating = (
  rating: number,
  isClassic?: boolean,
  isCult?: boolean
) => {
  const recommendation = getWatchRecommendation(rating, isClassic, isCult);
  const style = getWatchStyle(recommendation);
  const label = getWatchLabel(recommendation);

  // Glow effect mapping
  const glowMap: Record<WatchRecommendation, string> = {
    masterpiece: "shadow-yellow-500/20",
    "must-watch": "shadow-amber-500/20",
    "highly-recommended": "shadow-emerald-500/20",
    recommended: "shadow-blue-500/20",
    "worth-watching": "shadow-sky-500/20",
    "one-time-watch": "shadow-gray-500/20",
    skip: "shadow-red-500/20",
  };

  return {
    ...style,
    glow: glowMap[recommendation],
    label: `${style.icon} ${label}`,
    recommendation,
  };
};

export function QuickVerdictCard({
  whyWatch,
  whySkip,
  verdict,
  qualityScore,
  awards,
  culturalHighlights,
  isClassic,
  compact = false,
}: QuickVerdictProps) {
  const [showSkip, setShowSkip] = useState(false);
  const [showAllReasons, setShowAllReasons] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasWatchReasons = whyWatch?.reasons && whyWatch.reasons.length > 0;
  const hasSkipReasons = whySkip?.reasons && whySkip.reasons.length > 0;
  const hasVerdict = verdict?.en || verdict?.final_rating;

  // Helper to extract award text (handles both string and {award, winner} objects)
  const getAwardText = (
    a: string | { award?: string; winner?: string }
  ): string => {
    if (typeof a === "string") return a;
    if (a.award && a.winner) return `${a.award} (${a.winner})`;
    return a.award || "";
  };

  // Collect all awards into a flat list for compact display
  const allAwards = [
    ...(awards?.national_awards || []).map((a) => ({
      type: "National",
      award: getAwardText(a),
    })),
    ...(awards?.filmfare_awards || []).map((a) => ({
      type: "Filmfare",
      award: getAwardText(a),
    })),
    ...(awards?.nandi_awards || []).map((a) => ({
      type: "Nandi",
      award: getAwardText(a),
    })),
    ...(awards?.other_awards || []).map((a) => ({
      type: "Award",
      award: getAwardText(a),
    })),
  ].filter((a) => a.award); // Filter out empty awards
  const hasAwards = allAwards.length > 0;
  const hasCulturalHighlights =
    culturalHighlights?.legacy_status || culturalHighlights?.cult_status;

  // Don't render if no content
  if (!hasWatchReasons && !hasVerdict && !hasAwards && !hasCulturalHighlights)
    return null;

  // Get style based on actual rating (not category string)
  const rating = verdict?.final_rating || 6.0;
  const isCult = verdict?.cult || culturalHighlights?.cult_status;
  const style = getStyleFromRating(rating, isClassic, isCult);

  const visibleReasons = showAllReasons
    ? whyWatch?.reasons
    : whyWatch?.reasons?.slice(0, 3);
  const hasMoreReasons = (whyWatch?.reasons?.length || 0) > 3;

  // Compact mode for mobile - collapsible card
  if (compact) {
    return (
      <div
        className={`rounded-xl border ${style.border} overflow-hidden shadow-md`}
        style={{
          background: `linear-gradient(to bottom right, var(--bg-card-gradient-start), var(--bg-card-gradient-end))`,
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2.5 flex items-center justify-between"
        >
          {/* Compact: Single unified badge */}
          {hasVerdict && (
            <div
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${style.bg} ${style.text} font-semibold`}
            >
              <span className="text-[11px] font-bold tracking-wide">
                {style.label}
              </span>
              {verdict?.final_rating && (
                <>
                  <span className="opacity-50 text-xs">|</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[11px] font-bold">
                      {verdict.final_rating}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs">
            <span>{isExpanded ? "Hide" : "Details"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-[var(--border-primary)]/50">
            {/* Verdict text */}
            {verdict?.en && (
              <p className="text-[var(--text-secondary)] text-sm pt-2 leading-relaxed">
                {verdict.en}
              </p>
            )}

            {/* Why Skip in compact */}
            {hasSkipReasons && (
              <div className="pt-2 border-t border-[var(--border-primary)]/50">
                <h4 className="text-[var(--accent-orange)] text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <ThumbsDown className="w-3 h-3" />
                  Consider
                </h4>
                <ul className="space-y-1">
                  {whySkip!.reasons!.slice(0, 2).map((reason, i) => (
                    <li
                      key={i}
                      className="text-[var(--text-secondary)] text-xs flex items-start gap-1.5"
                    >
                      <span className="text-[var(--accent-orange)]">⚠</span>
                      <span className="line-clamp-1">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Awards compact */}
            {hasAwards && (
              <div className="flex gap-1.5 flex-wrap pt-2 border-t border-[var(--border-primary)]/50">
                {allAwards.slice(0, 3).map((item, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 bg-[var(--accent-warning-muted)] text-[var(--accent-warning)] rounded-full border border-[var(--accent-warning)]/30"
                  >
                    🏆{" "}
                    {item.award.length > 20
                      ? item.award.slice(0, 20) + "..."
                      : item.award}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border ${style.border} overflow-hidden shadow-lg ${style.glow}`}
      style={{
        background: `linear-gradient(to bottom right, var(--bg-card-gradient-start), var(--bg-card-gradient-end))`,
      }}
    >
      {/* Header - Single unified recommendation + rating badge */}
      {hasVerdict && (
        <div
          className="p-4 border-b border-[var(--border-primary)]/50"
          style={{
            background: `linear-gradient(to right, var(--bg-card-accent), transparent)`,
          }}
        >
          {/* Single combined badge: Recommendation + Rating */}
          <div
            className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl ${style.bg} ${style.text} shadow-lg`}
          >
            <span className="text-sm font-bold tracking-wide">
              {style.label}
            </span>
            {verdict?.final_rating && (
              <>
                <span className="opacity-50">|</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">
                    {verdict.final_rating}/10
                  </span>
                </div>
              </>
            )}
          </div>
          {verdict?.en && (
            <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">
              {verdict.en}
            </p>
          )}
        </div>
      )}

      {/* Why Watch - Full content, no cropping */}
      {hasWatchReasons && (
        <div className="p-4">
          <h4 className="flex items-center gap-2 text-[var(--accent-success)] font-semibold text-sm mb-3">
            <div className="p-1 rounded bg-[var(--accent-success-muted)]">
              <ThumbsUp className="w-3.5 h-3.5" />
            </div>
            Why You Should Watch
          </h4>
          <ul className="space-y-2">
            {visibleReasons?.map((reason, i) => (
              <li
                key={i}
                className="text-[var(--text-secondary)] text-sm flex items-start gap-2.5 leading-relaxed"
              >
                <span className="text-[var(--accent-success)] mt-0.5 flex-shrink-0">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>

          {/* Show more/less toggle */}
          {hasMoreReasons && (
            <button
              onClick={() => setShowAllReasons(!showAllReasons)}
              className="mt-2 text-[var(--accent-success)] hover:opacity-80 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              {showAllReasons
                ? "Show less"
                : `+${(whyWatch?.reasons?.length || 0) - 3} more reasons`}
              {showAllReasons ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Best For tags */}
          {whyWatch?.best_for && whyWatch.best_for.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border-primary)]/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">
                  Perfect for
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {whyWatch.best_for.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-[var(--accent-success-muted)] text-[var(--accent-success)] rounded-full border border-[var(--accent-success)]/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Awards & Achievements */}
          {hasAwards && (
            <div className="mt-4 pt-3 border-t border-[var(--border-primary)]/50">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-3.5 h-3.5 text-[var(--accent-warning)]" />
                <span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">
                  Awards
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allAwards.slice(0, 5).map((item, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-[var(--accent-warning-muted)] text-[var(--accent-warning)] rounded-full border border-[var(--accent-warning)]/30"
                  >
                    🏆 {item.award}
                  </span>
                ))}
                {allAwards.length > 5 && (
                  <span className="text-xs px-2.5 py-1 text-[var(--accent-warning)]">
                    +{allAwards.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cultural Legacy Highlights */}
          {hasCulturalHighlights && (
            <div className="mt-4 pt-3 border-t border-[var(--border-primary)]/50">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                <span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">
                  Legacy
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {culturalHighlights?.legacy_status && (
                  <span className="text-xs px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium shadow-lg">
                    {culturalHighlights.legacy_status}
                  </span>
                )}
                {culturalHighlights?.cult_status && (
                  <span className="text-xs px-2.5 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full font-medium shadow-lg flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    Cult Classic
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Why Skip - Collapsible with better styling */}
      {hasSkipReasons && (
        <div className="border-t border-[var(--border-primary)]/50">
          <button
            onClick={() => setShowSkip(!showSkip)}
            className="w-full px-4 py-3 flex items-center justify-between text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/30 transition-all"
          >
            <span className="flex items-center gap-2 text-sm">
              <div className="p-1 rounded bg-[var(--accent-orange-muted)]">
                <ThumbsDown className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
              </div>
              <span className="text-[var(--text-secondary)]">
                Things to consider
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showSkip ? "rotate-180" : ""
              }`}
            />
          </button>

          {showSkip && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
              <ul className="space-y-2">
                {whySkip!.reasons!.map((reason, i) => (
                  <li
                    key={i}
                    className="text-[var(--text-secondary)] text-sm flex items-start gap-2.5 leading-relaxed"
                  >
                    <span className="text-[var(--accent-orange)] mt-0.5 flex-shrink-0">
                      ⚠
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Quality indicator */}
      {qualityScore && qualityScore > 0.8 && (
        <div
          className="px-4 py-2 flex items-center justify-center gap-1.5 text-xs border-t border-[var(--border-primary)]/30"
          style={{
            background: `linear-gradient(to right, var(--bg-card-accent), var(--bg-secondary))`,
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-warning)]" />
          <span className="text-[var(--text-tertiary)]">
            AI-Enhanced Editorial Review
          </span>
        </div>
      )}
    </div>
  );
}
