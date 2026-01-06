'use client';

import { useState } from 'react';
import { 
  ThumbsUp, ThumbsDown, Star, ChevronDown, ChevronUp, 
  Users, Sparkles, Gem, Trophy, Crown, Medal, Flame, Heart, Globe
} from 'lucide-react';

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
  compact?: boolean;
}

// Category styling with unique icons and colors
const categoryStyles: Record<
  string,
  {
    icon: React.ReactNode;
    bg: string;
    text: string;
    border: string;
    glow: string;
    label: string;
  }
> = {
  masterpiece: {
    icon: <Crown className="w-4 h-4" />,
    bg: "bg-gradient-to-r from-yellow-400 to-amber-500",
    text: "text-black",
    border: "border-yellow-400/50",
    glow: "shadow-yellow-500/20",
    label: "🏆 MASTERPIECE",
  },
  "must-watch": {
    icon: <Sparkles className="w-4 h-4" />,
    bg: "bg-gradient-to-r from-amber-500 to-yellow-500",
    text: "text-black",
    border: "border-amber-400/50",
    glow: "shadow-amber-500/20",
    label: "👑 MUST WATCH",
  },
  "mass-classic": {
    icon: <Gem className="w-4 h-4" />,
    bg: "bg-gradient-to-r from-purple-600 to-pink-600",
    text: "text-[var(--text-primary)]",
    border: "border-purple-500/50",
    glow: "shadow-purple-500/20",
    label: "💎 MASS CLASSIC",
  },
  "highly-recommended": {
    icon: <Star className="w-4 h-4" />,
    bg: "bg-gradient-to-r from-blue-500 to-cyan-500",
    text: "text-[var(--text-primary)]",
    border: "border-blue-400/50",
    glow: "shadow-blue-500/20",
    label: "⭐ HIGHLY RECOMMENDED",
  },
  recommended: {
    icon: <Medal className="w-4 h-4" />,
    bg: "bg-gradient-to-r from-sky-500 to-blue-500",
    text: "text-[var(--text-primary)]",
    border: "border-sky-400/50",
    glow: "shadow-sky-500/20",
    label: "🎖️ RECOMMENDED",
  },
  watchable: {
    icon: <Star className="w-4 h-4" />,
    bg: "bg-gradient-to-r from-gray-500 to-gray-600",
    text: "text-[var(--text-primary)]",
    border: "border-gray-500/50",
    glow: "shadow-gray-500/20",
    label: "📺 WATCHABLE",
  },
  "one-time-watch": {
    icon: <Star className="w-4 h-4" />,
    bg: "bg-gradient-to-r from-gray-600 to-gray-700",
    text: "text-[var(--text-primary)]",
    border: "border-gray-600/50",
    glow: "shadow-gray-600/20",
    label: "📽️ ONE-TIME WATCH",
  },
  "hidden-gem": {
    icon: <Heart className="w-4 h-4" />,
    bg: "bg-gradient-to-r from-emerald-500 to-teal-500",
    text: "text-[var(--text-primary)]",
    border: "border-emerald-400/50",
    glow: "shadow-emerald-500/20",
    label: "💚 HIDDEN GEM",
  },
};

const getStyle = (category?: string) => {
  const normalized = category?.toLowerCase().replace(/\s+/g, "-") || "";
  return categoryStyles[normalized] || categoryStyles["recommended"];
};

export function QuickVerdictCard({
  whyWatch,
  whySkip,
  verdict,
  qualityScore,
  awards,
  culturalHighlights,
  compact = false,
}: QuickVerdictProps) {
  const [showSkip, setShowSkip] = useState(false);
  const [showAllReasons, setShowAllReasons] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasWatchReasons = whyWatch?.reasons && whyWatch.reasons.length > 0;
  const hasSkipReasons = whySkip?.reasons && whySkip.reasons.length > 0;
  const hasVerdict = verdict?.en || verdict?.category;

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

  const style = getStyle(verdict?.category);
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
          <div className="flex items-center gap-2">
            {hasVerdict && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${style.bg} ${style.text}`}
              >
                {style.icon}
                <span className="text-[10px] font-bold">
                  {verdict?.category?.toUpperCase()}
                </span>
              </div>
            )}
            {verdict?.final_rating && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 rounded">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-bold text-xs">
                  {verdict.final_rating}
                </span>
              </div>
            )}
          </div>
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
                <h4 className="text-orange-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <ThumbsDown className="w-3 h-3" />
                  Consider
                </h4>
                <ul className="space-y-1">
                  {whySkip!.reasons!.slice(0, 2).map((reason, i) => (
                    <li
                      key={i}
                      className="text-[var(--text-secondary)] text-xs flex items-start gap-1.5"
                    >
                      <span className="text-orange-400">⚠</span>
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
                    className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 rounded-full border border-yellow-500/30"
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
      {/* Header with Verdict Badge */}
      {hasVerdict && (
        <div
          className="p-4 border-b border-[var(--border-primary)]/50"
          style={{
            background: `linear-gradient(to right, var(--bg-card-accent), transparent)`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${style.bg} ${style.text} shadow-lg`}
              >
                {style.icon}
                <span className="text-xs font-bold tracking-wide">
                  {style.label}
                </span>
              </div>
              {verdict?.cult && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-[var(--text-primary)] shadow-lg">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">CULT</span>
                </div>
              )}
            </div>
            {verdict?.final_rating && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 rounded-lg">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm">
                  {verdict.final_rating}/10
                </span>
              </div>
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
          <h4 className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
            <div className="p-1 rounded bg-emerald-500/20">
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
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>

          {/* Show more/less toggle */}
          {hasMoreReasons && (
            <button
              onClick={() => setShowAllReasons(!showAllReasons)}
              className="mt-2 text-emerald-400 hover:text-emerald-300 text-xs font-medium flex items-center gap-1 transition-colors"
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
                    className="text-xs px-2.5 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-500/30"
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
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">
                  Awards
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allAwards.slice(0, 5).map((item, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded-full border border-amber-500/30"
                  >
                    🏆 {item.award}
                  </span>
                ))}
                {allAwards.length > 5 && (
                  <span className="text-xs px-2.5 py-1 text-yellow-400">
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
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">
                  Legacy
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {culturalHighlights?.legacy_status && (
                  <span className="text-xs px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-[var(--text-primary)] rounded-full font-medium shadow-lg">
                    {culturalHighlights.legacy_status}
                  </span>
                )}
                {culturalHighlights?.cult_status && (
                  <span className="text-xs px-2.5 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 text-[var(--text-primary)] rounded-full font-medium shadow-lg flex items-center gap-1">
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
              <div className="p-1 rounded bg-orange-500/10">
                <ThumbsDown className="w-3.5 h-3.5 text-orange-400" />
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
                    <span className="text-orange-400 mt-0.5 flex-shrink-0">
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
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[var(--text-tertiary)]">
            AI-Enhanced Editorial Review
          </span>
        </div>
      )}
    </div>
  );
}
