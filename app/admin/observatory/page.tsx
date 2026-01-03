'use client';

/**
 * SYSTEM OBSERVATORY - PHASE 10
 * 
 * Real-time observability dashboard for TeluguVibes
 * - Data coverage metrics
 * - Quality health checks
 * - Pipeline status
 * - Review confidence heatmap
 * - Content decay detection
 * - Performance metrics
 */

import { useState, useEffect } from 'react';
import { 
  Activity, Database, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Film, Star, Users, FileText, BarChart3, Clock, Zap
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface HealthMetric {
  label: string;
  value: number | string;
  target?: number;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface CoverageStats {
  language: string;
  movies: number;
  target: number;
  percentage: number;
  reviews: number;
  reviewCoverage: number;
}

interface QualityMetric {
  label: string;
  count: number;
  threshold: number;
  status: 'pass' | 'warn' | 'fail';
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ObservatoryPage() {
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Metrics state
  const [coverageStats, setCoverageStats] = useState<CoverageStats[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<HealthMetric[]>([]);

  // Fetch metrics on mount and every 30 seconds
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMetrics() {
    setLoading(true);
    try {
      // In production, these would be real API calls
      // For now, using mock data structure
      
      // Coverage stats
      setCoverageStats([
        { language: 'Telugu', movies: 5862, target: 3000, percentage: 195, reviews: 5800, reviewCoverage: 99 },
        { language: 'English', movies: 552, target: 500, percentage: 110, reviews: 550, reviewCoverage: 99 },
        { language: 'Hindi', movies: 447, target: 500, percentage: 89, reviews: 445, reviewCoverage: 99 },
        { language: 'Tamil', movies: 342, target: 500, percentage: 68, reviews: 340, reviewCoverage: 99 },
        { language: 'Malayalam', movies: 263, target: 500, percentage: 53, reviews: 260, reviewCoverage: 99 },
        { language: 'Kannada', movies: 197, target: 500, percentage: 39, reviews: 195, reviewCoverage: 99 },
      ]);

      // Quality metrics
      setQualityMetrics([
        { label: 'Duplicate Movies', count: 0, threshold: 0, status: 'pass' },
        { label: 'Orphan Movies', count: 0, threshold: 0, status: 'pass' },
        { label: 'Missing Posters', count: 0, threshold: 50, status: 'pass' },
        { label: 'Missing Directors', count: 1949, threshold: 500, status: 'warn' },
        { label: 'Low Confidence Reviews', count: 2400, threshold: 1000, status: 'warn' },
      ]);

      // System health
      setSystemHealth([
        { label: 'Total Movies', value: 7663, status: 'good', trend: 'up' },
        { label: 'Total Reviews', value: 7559, status: 'good', trend: 'up' },
        { label: 'Review Coverage', value: '99%', status: 'good', trend: 'up' },
        { label: 'Celebrities', value: 113, status: 'good', trend: 'up' },
        { label: 'Avg Review Confidence', value: '36%', status: 'warning', trend: 'stable' },
        { label: 'Data Quality Score', value: '85%', status: 'good', trend: 'up' },
      ]);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
      case 'warn':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'pass':
        return 'text-green-500';
      case 'warning':
      case 'warn':
        return 'text-yellow-500';
      case 'critical':
      case 'fail':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Observatory</h1>
          <p className="text-gray-400 mt-1">Real-time data governance & health monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Last updated</p>
            <p className="text-sm font-medium text-white">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="px-4 py-2 bg-[#eab308] text-black rounded-lg hover:bg-[#eab308]/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemHealth.map((metric, idx) => (
          <div key={idx} className="bg-[#141414] border border-[#262626] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{metric.label}</span>
              {getStatusIcon(metric.status)}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{metric.value}</span>
              {metric.trend && (
                <span className={`text-sm mb-1 ${
                  metric.trend === 'up' ? 'text-green-500' : 
                  metric.trend === 'down' ? 'text-red-500' : 
                  'text-gray-500'
                }`}>
                  {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Language Coverage */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-[#eab308]" />
          <h2 className="text-xl font-bold text-white">Language Coverage</h2>
        </div>
        <div className="space-y-4">
          {coverageStats.map((stat) => (
            <div key={stat.language}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{stat.language}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">
                    {stat.movies} / {stat.target}
                  </span>
                  <span className={stat.percentage >= 100 ? 'text-green-500' : 'text-yellow-500'}>
                    {stat.percentage}%
                  </span>
                  <span className="text-gray-500">
                    {stat.reviewCoverage}% reviewed
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#262626] rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    stat.percentage >= 100 ? 'bg-green-500' : 
                    stat.percentage >= 75 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#eab308]" />
          <h2 className="text-xl font-bold text-white">Data Quality Checks</h2>
        </div>
        <div className="space-y-3">
          {qualityMetrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(metric.status)}
                <span className="text-sm font-medium text-white">{metric.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-bold ${getStatusColor(metric.status)}`}>
                  {metric.count}
                </span>
                <span className="text-xs text-gray-500">
                  (threshold: {metric.threshold})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#eab308]" />
          <h2 className="text-xl font-bold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <ActionButton icon={Film} label="Enrich Movies" onClick={() => console.log('Enrich')} />
          <ActionButton icon={Star} label="Generate Reviews" onClick={() => console.log('Reviews')} />
          <ActionButton icon={Users} label="Enrich Celebrities" onClick={() => console.log('Celebrities')} />
          <ActionButton icon={FileText} label="Validate Data" onClick={() => console.log('Validate')} />
          <ActionButton icon={Database} label="Deduplicate" onClick={() => console.log('Dedupe')} />
          <ActionButton icon={TrendingUp} label="Run Pipeline" onClick={() => console.log('Pipeline')} />
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Auto-refreshes every 30 seconds • Last pipeline run: 2 hours ago</p>
      </div>
    </div>
  );
}

// ============================================================
// ACTION BUTTON COMPONENT
// ============================================================

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon: Icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#262626] rounded-lg hover:border-[#eab308] hover:bg-[#141414] transition-colors"
    >
      <Icon className="w-5 h-5 text-[#eab308]" />
      <span className="text-sm font-medium text-white">{label}</span>
    </button>
  );
}


