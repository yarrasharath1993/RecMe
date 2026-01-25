'use client';

/**
 * ProfileStatsSidebar Component
 * 
 * Compact stats widget for entity profile sidebar.
 * Displays performance score, career timeline, quick stats, and genre breakdown.
 */

import { TrendingUp, Film, Target, Zap, Heart, Clock, Award } from 'lucide-react';

interface CareerStats {
  total_movies: number;
  first_year: number;
  last_year: number;
  decades_active: number;
  avg_rating: number;
  hit_rate: number;
  blockbusters: number;
  classics: number;
}

interface RoleBreakdown {
  role: string;
  count: number;
}

interface GenreData {
  genre: string;
  count: number;
  avg_rating: number;
}

interface ProfileStatsSidebarProps {
  careerStats: CareerStats;
  roleBreakdown?: RoleBreakdown[];
  topGenres?: GenreData[];
  className?: string;
}

export function ProfileStatsSidebar({
  careerStats,
  roleBreakdown = [],
  topGenres = [],
  className = '',
}: ProfileStatsSidebarProps) {
  // Calculate performance score
  const performanceScore = Math.round(
    (careerStats.avg_rating * 10) + 
    (careerStats.hit_rate * 0.3) + 
    (careerStats.blockbusters * 2) + 
    (careerStats.classics * 3)
  );

  // Calculate career progress percentage
  const currentYear = new Date().getFullYear();
  const careerLength = careerStats.last_year - careerStats.first_year + 1;
  const yearsToPresent = currentYear - careerStats.first_year;
  const careerProgress = Math.min(100, (yearsToPresent / Math.max(careerLength, yearsToPresent)) * 100);

  // Get role percentages
  const totalRoleCount = roleBreakdown.reduce((sum, r) => sum + r.count, 0);
  const rolePercentages = roleBreakdown.map(role => ({
    ...role,
    percentage: totalRoleCount > 0 ? (role.count / totalRoleCount) * 100 : 0,
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Performance Score Card */}
      <div 
        className="p-4 rounded-xl backdrop-blur-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06))',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 24px rgba(59, 130, 246, 0.15)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            Performance Score
          </h3>
          <TrendingUp className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-center">
          <div 
            className="text-4xl font-black mb-1"
            style={{ 
              color: '#3b82f6',
              textShadow: '0 2px 20px rgba(59, 130, 246, 0.4)',
            }}
          >
            {performanceScore}
          </div>
          <p className="text-[10px] text-white/60 uppercase tracking-wider">out of 100</p>
        </div>
        
        {/* Performance Indicator */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-white/60">Industry Standing</span>
            <span className="font-bold text-blue-400">
              {performanceScore >= 70 ? 'Excellent' : performanceScore >= 50 ? 'Good' : 'Developing'}
            </span>
          </div>
          <div 
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${performanceScore}%`,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Career Timeline */}
      <div 
        className="p-4 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            Career Timeline
          </h3>
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/60">Started</span>
            <span className="text-base font-bold text-cyan-400">{careerStats.first_year}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div 
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${careerProgress}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                }}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/60">Latest</span>
            <span className="text-base font-bold text-cyan-400">{careerStats.last_year}</span>
          </div>
          
          <div className="pt-2 border-t border-white/10 text-center">
            <p className="text-xl font-bold text-white mb-0.5">
              {careerStats.last_year - careerStats.first_year + 1}
            </p>
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Years Active</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div 
        className="p-4 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">
          Quick Stats
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Hit Rate */}
          <div 
            className="p-2 rounded-lg text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08))',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
          >
            <Target className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-400">{Math.round(careerStats.hit_rate)}%</p>
            <p className="text-[9px] text-white/60 uppercase tracking-wider">Hit Rate</p>
          </div>
          
          {/* Blockbusters */}
          <div 
            className="p-2 rounded-lg text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.08))',
              border: '1px solid rgba(249, 115, 22, 0.2)',
            }}
          >
            <Zap className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-400">{careerStats.blockbusters}</p>
            <p className="text-[9px] text-white/60 uppercase tracking-wider">Blockbusters</p>
          </div>
          
          {/* Classics */}
          <div 
            className="p-2 rounded-lg text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.08))',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <Heart className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-400">{careerStats.classics}</p>
            <p className="text-[9px] text-white/60 uppercase tracking-wider">Classics</p>
          </div>
          
          {/* Decades */}
          <div 
            className="p-2 rounded-lg text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.08))',
              border: '1px solid rgba(6, 182, 212, 0.2)',
            }}
          >
            <Award className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-cyan-400">{careerStats.decades_active}</p>
            <p className="text-[9px] text-white/60 uppercase tracking-wider">Decades</p>
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      {rolePercentages.length > 0 && (
        <div 
          className="p-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">
            Role Distribution
          </h3>
          
          <div className="space-y-2">
            {rolePercentages.slice(0, 3).map((role, idx) => {
              const colors = [
                { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', bar: '#3b82f6' },
                { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', bar: '#f97316' },
                { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', bar: '#8b5cf6' },
              ][idx];
              
              return (
                <div key={role.role}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-white/70">{role.role}</span>
                    <span className="text-[10px] font-bold" style={{ color: colors.text }}>
                      {role.count} ({Math.round(role.percentage)}%)
                    </span>
                  </div>
                  <div 
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${role.percentage}%`,
                        backgroundColor: colors.bar,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Genre Expertise */}
      {topGenres.length > 0 && (
        <div 
          className="p-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">
            Genre Expertise
          </h3>
          
          <div className="space-y-2">
            {topGenres.slice(0, 3).map((genre, idx) => {
              const percentage = (genre.count / careerStats.total_movies) * 100;
              const colors = [
                { text: '#22c55e', bar: 'linear-gradient(90deg, #22c55e, #4ade80)' },
                { text: '#eab308', bar: 'linear-gradient(90deg, #eab308, #fbbf24)' },
                { text: '#f97316', bar: 'linear-gradient(90deg, #f97316, #fb923c)' },
              ][idx];
              
              return (
                <div key={genre.genre}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-white/70">{genre.genre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold" style={{ color: colors.text }}>
                        {genre.count}
                      </span>
                      <span className="text-[9px] text-white/50">
                        ★ {genre.avg_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${percentage}%`,
                        background: colors.bar,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Facts */}
      <div 
        className="p-4 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">
          Quick Facts
        </h3>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-white/60">Debut Year</span>
            <span className="font-bold text-white">{careerStats.first_year}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-white/60">Career Span</span>
            <span className="font-bold text-white">
              {careerStats.last_year - careerStats.first_year + 1} years
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-white/60">Avg Films/Year</span>
            <span className="font-bold text-white">
              {(careerStats.total_movies / (careerStats.last_year - careerStats.first_year + 1)).toFixed(1)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-white/60">Success Rate</span>
            <span className="font-bold text-green-400">
              {Math.round(careerStats.hit_rate)}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-white/60">Decades Active</span>
            <span className="font-bold text-cyan-400">
              {careerStats.decades_active}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
