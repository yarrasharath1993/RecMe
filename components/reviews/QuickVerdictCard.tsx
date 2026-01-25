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
  TrendingUp,
  AlertTriangle,
  Skull,
  Pill,
  Siren,
  Frown,
} from "lucide-react";
import {
  getWatchRecommendation,
  getWatchLabel,
  getWatchStyle,
} from "@/lib/ratings/editorial-rating";

interface QuickVerdictProps {
  whyWatch?: { reasons?: string[]; best_for?: string[] };
  whySkip?: { reasons?: string[]; not_for?: string[] };
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
  };
  culturalHighlights?: {
    legacy_status?: string;
    cult_status?: boolean;
    memorable_elements?: string[];
  };
  isClassic?: boolean;
  compact?: boolean;
  ageRating?: string;
  audienceFit?: string[];
  watchRecommendation?: string;
  trustScore?: number;
  trustBreakdown?: { badge?: string; explanation?: string };
  boxOfficeCategory?: string;
  contentWarnings?: string[];
}

const getStyleFromRating = (
  rating: number,
  isClassic?: boolean,
  isCult?: boolean
) => {
  const recommendation = getWatchRecommendation(rating, isClassic, isCult);
  const style = getWatchStyle(recommendation);
  const label = getWatchLabel(recommendation);
  return { ...style, label: `${style.icon} ${label}`, recommendation };
};

const getBoxOfficeStyle = (category?: string) => {
  const c = category?.toLowerCase();
  if (c === "blockbuster")
    return {
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-500/10",
      border: "border-yellow-300 dark:border-yellow-500/30",
      label: "Blockbuster",
    };
  if (c === "super-hit" || c === "superhit")
    return {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-500/10",
      border: "border-emerald-300 dark:border-emerald-500/30",
      label: "Super Hit",
    };
  if (c === "hit")
    return {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-500/10",
      border: "border-green-300 dark:border-green-500/30",
      label: "Hit",
    };
  if (c === "above-average" || c === "above average")
    return {
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-500/10",
      border: "border-blue-300 dark:border-blue-500/30",
      label: "Above Avg",
    };
  if (c === "average")
    return {
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-500/10",
      border: "border-gray-300 dark:border-gray-500/30",
      label: "Average",
    };
  if (c === "below-average" || c === "below average")
    return {
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-500/10",
      border: "border-orange-300 dark:border-orange-500/30",
      label: "Below Avg",
    };
  if (c === "flop")
    return {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-500/10",
      border: "border-red-300 dark:border-red-500/30",
      label: "Flop",
    };
  return null;
};

// Warning icons config
const getWarningConfig = (warning: string) => {
  const configs: Record<
    string,
    {
      label: string;
      icon: React.ReactNode;
      color: string;
      bg: string;
      border: string;
    }
  > = {
    violence: {
      label: "Violence",
      icon: <Siren className="w-3 h-3" />,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-500/10",
      border: "border-red-300 dark:border-red-500/30",
    },
    death: {
      label: "Death",
      icon: <Skull className="w-3 h-3" />,
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-100 dark:bg-slate-500/10",
      border: "border-slate-300 dark:border-slate-500/30",
    },
    trauma: {
      label: "Trauma",
      icon: <Frown className="w-3 h-3" />,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-500/10",
      border: "border-purple-300 dark:border-purple-500/30",
    },
    "substance-use": {
      label: "Substance Use",
      icon: <Pill className="w-3 h-3" />,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-500/10",
      border: "border-amber-300 dark:border-amber-500/30",
    },
    abuse: {
      label: "Abuse",
      icon: <AlertTriangle className="w-3 h-3" />,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-500/10",
      border: "border-orange-300 dark:border-orange-500/30",
    },
  };
  return configs[warning] || null;
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
  boxOfficeCategory,
  contentWarnings,
}: QuickVerdictProps) {
  const [showSkip, setShowSkip] = useState(false);
  const [showAllReasons, setShowAllReasons] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasWatchReasons = whyWatch?.reasons && whyWatch.reasons.length > 0;
  const hasSkipReasons = whySkip?.reasons && whySkip.reasons.length > 0;
  const hasVerdict = verdict?.en || verdict?.final_rating;
  const hasMemorableElements = culturalHighlights?.memorable_elements?.length;
  const hasContentWarnings = contentWarnings && contentWarnings.length > 0;

  const getAwardText = (
    a: string | { award?: string; winner?: string }
  ): string => {
    if (typeof a === "string") return a;
    return a.award || "";
  };

  const allAwards = [
    ...(awards?.national_awards || []).map((a) => getAwardText(a)),
    ...(awards?.filmfare_awards || []).map((a) => getAwardText(a)),
    ...(awards?.nandi_awards || []).map((a) => getAwardText(a)),
    ...(awards?.other_awards || []).map((a) => getAwardText(a)),
  ].filter(Boolean);

  const hasAwards = allAwards.length > 0;
  const boxOfficeStyle = getBoxOfficeStyle(boxOfficeCategory);

  if (!hasWatchReasons && !hasVerdict && !hasAwards) return null;

  const rating = verdict?.final_rating || 6.0;
  const style = getStyleFromRating(
    rating,
    isClassic,
    culturalHighlights?.cult_status
  );
  const visibleReasons = showAllReasons
    ? whyWatch?.reasons
    : whyWatch?.reasons?.slice(0, 3);
  const hasMoreReasons = (whyWatch?.reasons?.length || 0) > 3;

  if (compact) {
    return (
      <div
        className={`rounded-2xl border ${style.border} overflow-hidden backdrop-blur-sm bg-[var(--bg-secondary)]/80 shadow-lg`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between transition-colors hover:bg-[var(--bg-primary)]/30"
        >
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${style.bg} ${style.text} shadow-sm`}
          >
            <span className="text-xs font-bold tracking-wide">
              {style.label}
            </span>
            {verdict?.final_rating && (
              <>
                <span className="opacity-30">|</span>
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">
                  {verdict.final_rating}
                </span>
              </>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
        {isExpanded && verdict?.en && (
          <div className="px-4 pb-4 border-t border-[var(--border-primary)]/20 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-[var(--text-secondary)] text-xs pt-3 leading-relaxed">
              {verdict.en}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 ${style.border} overflow-hidden backdrop-blur-sm bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]/50 shadow-xl ring-1 ring-black/5 dark:ring-white/5`}
    >
      {/* Premium Header - Compact Single Line */}
      <div className="relative px-4 py-3 border-b border-[var(--border-primary)]/20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] dark:via-white/[0.02] to-transparent pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          {/* Main verdict badge - compact */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${style.bg} ${style.text} shadow-md ring-1 ring-inset ring-black/5 dark:ring-white/10`}
          >
            <span className="text-sm font-bold tracking-wide whitespace-nowrap">
              {style.label}
            </span>
            {verdict?.final_rating && (
              <>
                <span className="opacity-30">|</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-black tabular-nums">
                    {verdict.final_rating}
                    <span className="text-xs font-semibold opacity-70">
                      /10
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Quick badges inline - Cult & Awards only */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {culturalHighlights?.cult_status && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/30">
                <Flame className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                  Cult
                </span>
              </div>
            )}
            {hasAwards && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30">
                <Trophy className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  {allAwards.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Box Office Verdict - Prominent Section */}
      {boxOfficeStyle && (
        <div className="px-4 py-3 border-b border-[var(--border-primary)]/20 bg-[var(--bg-primary)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-wider">
              Box Office Verdict
            </span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${boxOfficeStyle.bg} ${boxOfficeStyle.border}`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${boxOfficeStyle.color}`} />
              <span className={`text-xs font-bold ${boxOfficeStyle.color}`}>
                {boxOfficeStyle.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Verdict Description */}
      {verdict?.en && (
        <div className="px-4 py-3 border-b border-[var(--border-primary)]/20">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {verdict.en}
          </p>
        </div>
      )}

      {/* Content sections */}
      <div className="p-4 space-y-4">
        {/* Why Watch */}
        {hasWatchReasons && (
          <div>
            <h4 className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <ThumbsUp className="w-3.5 h-3.5" />
              Why You Should Watch
            </h4>
            <ul className="space-y-1.5">
              {visibleReasons?.map((reason, i) => (
                <li
                  key={i}
                  className="text-[var(--text-secondary)] text-[13px] flex items-start gap-2 group"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ✓
                  </span>
                  <span className="group-hover:text-[var(--text-primary)] transition-colors">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
            {hasMoreReasons && (
              <button
                onClick={() => setShowAllReasons(!showAllReasons)}
                className="mt-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                {showAllReasons
                  ? "Show less"
                  : `+${(whyWatch?.reasons?.length || 0) - 3} more`}
                {showAllReasons ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Perfect For */}
        {whyWatch?.best_for?.length ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-wider">
                Perfect for
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {whyWatch.best_for.map((tag, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-500/20 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Highlights */}
        {hasMemorableElements ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-wider">
                Highlights
              </span>
            </div>
            <ul className="space-y-1">
              {culturalHighlights?.memorable_elements
                ?.slice(0, 3)
                .map((el, i) => (
                  <li
                    key={i}
                    className="text-[12px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5"
                  >
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">
                      ✨
                    </span>
                    <span>{el}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {/* Content Warnings */}
        {hasContentWarnings && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-wider">
                Content Warnings
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contentWarnings.map((warning, i) => {
                const config = getWarningConfig(warning);
                if (!config) return null;
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border font-medium ${config.bg} ${config.border} ${config.color}`}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Why Skip - Collapsible */}
      {hasSkipReasons && (
        <div className="border-t border-[var(--border-primary)]/20">
          <button
            onClick={() => setShowSkip(!showSkip)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[var(--bg-primary)]/30 transition-colors group"
          >
            <span className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">
              <ThumbsDown className="w-3 h-3 text-orange-600 dark:text-orange-400" />
              Things to consider
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform duration-200 ${
                showSkip ? "rotate-180" : ""
              }`}
            />
          </button>
          {showSkip && (
            <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <ul className="space-y-1.5">
                {whySkip!.reasons!.map((reason, i) => (
                  <li
                    key={i}
                    className="text-[var(--text-secondary)] text-[13px] flex items-start gap-2"
                  >
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">
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

      {/* AI Badge - Subtle */}
      {qualityScore && qualityScore > 0.8 && (
        <div className="px-4 py-2 flex items-center justify-center gap-1.5 text-[10px] border-t border-[var(--border-primary)]/20 bg-gradient-to-r from-purple-100/30 dark:from-purple-500/5 via-transparent to-purple-100/30 dark:to-purple-500/5">
          <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
          <span className="text-[var(--text-tertiary)] font-medium">
            AI-Enhanced
          </span>
        </div>
      )}
    </div>
  );
}
