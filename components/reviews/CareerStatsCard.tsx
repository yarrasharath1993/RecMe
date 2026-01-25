'use client';

/**
 * CareerStatsCard Component
 * 
 * Premium data visualization card for career statistics.
 * Features: Interactive charts, progress bars, animated counters, gradient backgrounds.
 */

import { 
  Film, Star, TrendingUp, Award, Clock, Sparkles,
  Trophy, Target, Zap, BarChart3, PieChart, Activity
} from 'lucide-react';

interface RoleBreakdown {
  role: string;
  count: number;
  icon?: React.ReactNode;
}

interface CareerStatsCardProps {
  totalMovies: number;
  avgRating: number;
  hitRate: number;
  blockbusters: number;
  classics: number;
  decadesActive: number;
  firstYear: number;
  lastYear: number;
  roleBreakdown?: RoleBreakdown[];
  topGenres?: Array<{ genre: string; count: number }>;
  className?: string;
}

export function CareerStatsCard({
  totalMovies,
  avgRating,
  hitRate,
  blockbusters,
  classics,
  decadesActive,
  firstYear,
  lastYear,
  roleBreakdown,
  topGenres,
  className = '',
}: CareerStatsCardProps) {
  // Determine rating tier
  const ratingTier = avgRating >= 7.5 ? 'excellent' : avgRating >= 6.5 ? 'good' : 'average';
  const hitRateTier = hitRate >= 60 ? 'excellent' : hitRate >= 40 ? 'good' : 'average';

  // Calculate performance score (0-100)
  const performanceScore = Math.min(100, (avgRating / 10) * 50 + (hitRate / 100) * 30 + (blockbusters / Math.max(1, totalMovies / 20)) * 20);

  return (
    <div 
      className={`rounded-2xl overflow-hidden shadow-xl ${className}`}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* Premium Header with Performance Badge */}
      <div 
        className="px-5 py-4 flex items-center justify-between relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,179,8,0.08) 100%)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f97316, #eab308)' }}
          >
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
          Career Statistics
        </h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {firstYear}–{lastYear} • {lastYear - firstYear + 1} years
            </p>
          </div>
        </div>
        
        {/* Performance Score Badge */}
        <div 
          className="px-4 py-2 rounded-xl backdrop-blur-sm"
          style={{
            background: performanceScore >= 80 
              ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))'
              : performanceScore >= 60
              ? 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.1))'
              : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1))',
            border: performanceScore >= 80 ? '1px solid #22c55e' : performanceScore >= 60 ? '1px solid #eab308' : '1px solid #8b5cf6',
          }}
        >
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Performance
          </p>
          <p 
            className="text-xl font-black"
            style={{ color: performanceScore >= 80 ? '#22c55e' : performanceScore >= 60 ? '#eab308' : '#8b5cf6' }}
          >
            {Math.round(performanceScore)}
          </p>
        </div>
      </div>

      {/* Premium Stats Grid with Visual Enhancements */}
      <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Films - Enhanced */}
        <PremiumStatBox
          icon={<Film className="w-6 h-6" />}
          value={totalMovies}
          label="Total Films"
          color="blue"
          subtitle={`~${Math.round(totalMovies / Math.max(1, lastYear - firstYear + 1))} per year`}
        />

        {/* Average Rating - Enhanced */}
        <PremiumStatBox
          icon={<Star className="w-6 h-6" />}
          value={avgRating.toFixed(1)}
          label="Avg Rating"
          color={ratingTier === 'excellent' ? 'green' : ratingTier === 'good' ? 'yellow' : 'gray'}
          suffix="/10"
          subtitle={ratingTier === 'excellent' ? 'Outstanding' : ratingTier === 'good' ? 'Above average' : 'Solid'}
          progress={(avgRating / 10) * 100}
        />

        {/* Hit Rate - Enhanced */}
        <PremiumStatBox
          icon={<Target className="w-6 h-6" />}
          value={Math.round(hitRate)}
          label="Success Rate"
          color={hitRateTier === 'excellent' ? 'green' : hitRateTier === 'good' ? 'yellow' : 'gray'}
          suffix="%"
          subtitle={hitRateTier === 'excellent' ? 'Exceptional' : hitRateTier === 'good' ? 'Strong' : 'Developing'}
          progress={hitRate}
        />

        {/* Blockbusters - Enhanced */}
        <PremiumStatBox
          icon={<Zap className="w-6 h-6" />}
          value={blockbusters}
          label="Blockbusters"
          color="orange"
          subtitle={`${((blockbusters / totalMovies) * 100).toFixed(0)}% of films`}
        />

        {/* Classics - Enhanced */}
        <PremiumStatBox
          icon={<Award className="w-6 h-6" />}
          value={classics}
          label="Classics"
          color="purple"
          subtitle={`${((classics / totalMovies) * 100).toFixed(0)}% of films`}
        />

        {/* Decades - Enhanced */}
        <PremiumStatBox
          icon={<Clock className="w-6 h-6" />}
          value={decadesActive}
          label="Decades Active"
          color="cyan"
          subtitle={decadesActive >= 5 ? 'Legendary' : decadesActive >= 3 ? 'Veteran' : 'Emerging'}
        />
      </div>

      {/* Career Progression Chart */}
      <div 
        className="px-5 py-4 border-t"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Career Progression
          </span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            {decadesActive} decades
          </span>
        </div>
        
        <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div 
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 shadow-lg"
            style={{ 
              width: `${Math.min(100, (decadesActive / 6) * 100)}%`,
              boxShadow: '0 0 20px rgba(249,115,22,0.5)',
            }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Start</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{firstYear}</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Span</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{lastYear - firstYear + 1} yrs</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Current</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{lastYear}</p>
          </div>
        </div>
      </div>

      {/* Role Distribution - Visual Pie Chart Style */}
      {roleBreakdown && roleBreakdown.length > 0 && (
        <div 
          className="px-5 py-4 border-t"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Role Distribution
          </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {roleBreakdown.map((role, idx) => {
              const colors = ['#f97316', '#eab308', '#22c55e', '#8b5cf6', '#06b6d4', '#ec4899'];
              const roleColor = colors[idx % colors.length];
              const percentage = ((role.count / totalMovies) * 100).toFixed(0);
              
              return (
              <div 
                key={role.role}
                  className="flex items-center gap-2 p-3 rounded-xl hover:scale-105 transition-transform cursor-default"
                  style={{ 
                    backgroundColor: `${roleColor}15`,
                    border: `1px solid ${roleColor}30`,
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${roleColor}30` }}
                  >
                    <span className="text-lg font-black" style={{ color: roleColor }}>
                  {role.count}
                </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {role.role}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {percentage}% of total
                    </p>
                  </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Genre Expertise - Enhanced Bars */}
      {topGenres && topGenres.length > 0 && (
        <div 
          className="px-5 py-4 border-t"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Genre Expertise
          </span>
          </div>
          
          <div className="space-y-3">
            {topGenres.slice(0, 5).map((item, idx) => {
              const colors = ['#f97316', '#eab308', '#22c55e', '#8b5cf6', '#06b6d4'];
              const genreColor = colors[idx];
              const percentage = ((item.count / topGenres[0].count) * 100).toFixed(0);
              
              return (
                <div key={item.genre}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: genreColor }}
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {item.genre}
                </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {percentage}%
                      </span>
                      <span className="text-sm font-bold" style={{ color: genreColor }}>
                        {item.count}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div 
                      className="h-full rounded-full transition-all duration-500"
                    style={{ 
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${genreColor}, ${genreColor}dd)`,
                        boxShadow: `0 0 10px ${genreColor}40`,
                    }}
                  />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Premium Stat Box with Progress Bars
function PremiumStatBox({ 
  icon, 
  value, 
  label, 
  color,
  suffix = '',
  subtitle,
  progress,
}: { 
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'cyan' | 'gray';
  suffix?: string;
  subtitle?: string;
  progress?: number;
}) {
  const colorMap = {
    blue: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', icon: '#3b82f6', glow: 'rgba(59, 130, 246, 0.25)' },
    green: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e', icon: '#22c55e', glow: 'rgba(34, 197, 94, 0.25)' },
    yellow: { bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', icon: '#eab308', glow: 'rgba(234, 179, 8, 0.25)' },
    orange: { bg: 'rgba(249, 115, 22, 0.12)', text: '#f97316', icon: '#f97316', glow: 'rgba(249, 115, 22, 0.25)' },
    purple: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6', icon: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.25)' },
    cyan: { bg: 'rgba(6, 182, 212, 0.12)', text: '#06b6d4', icon: '#06b6d4', glow: 'rgba(6, 182, 212, 0.25)' },
    gray: { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)', icon: 'var(--text-tertiary)', glow: 'rgba(100,100,100,0.15)' },
  };

  const colors = colorMap[color];

  return (
    <div 
      className="group relative p-4 rounded-2xl hover:scale-105 transition-all duration-300 cursor-default overflow-hidden"
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.bg}`,
      }}
    >
      {/* Hover Glow Effect */}
      <div 
        className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: colors.glow }}
      />
      
      <div className="relative">
        {/* Icon */}
      <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"
          style={{ backgroundColor: `${colors.icon}20`, color: colors.icon }}
        >
          {icon}
      </div>
        
        {/* Value */}
        <div className="mb-1">
          <p 
            className="text-2xl lg:text-3xl font-black leading-none"
            style={{ color: colors.text }}
          >
            {value}{suffix && <span className="text-lg opacity-70">{suffix}</span>}
      </p>
        </div>
        
        {/* Label */}
        <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </p>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
        
        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${Math.min(100, progress)}%`,
                backgroundColor: colors.icon,
                boxShadow: `0 0 8px ${colors.glow}`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CareerStatsCard;
