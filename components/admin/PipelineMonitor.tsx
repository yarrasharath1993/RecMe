'use client';

/**
 * PipelineMonitor Component
 * 
 * Real-time monitoring of enrichment pipelines:
 * - Progress bar with percentage
 * - Current status and ETA
 * - Error display
 * - Start/Cancel controls
 */

import React, { useState, useEffect, useCallback } from 'react';

interface PipelineProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
}

interface Pipeline {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  progress: PipelineProgress;
  options: Record<string, unknown>;
  results?: {
    successCount: number;
    failureCount: number;
    errors: string[];
  };
}

interface PipelineMonitorProps {
  onPipelineComplete?: (pipeline: Pipeline) => void;
  pollingInterval?: number;
}

const PIPELINE_TYPES = [
  { id: 'full_enrich', name: 'Full Enrichment', description: 'Enrich all fields from all sources', icon: '🔄' },
  { id: 'images_only', name: 'Images Only', description: 'Fetch missing posters and backdrops', icon: '🖼️' },
  { id: 'reviews_only', name: 'Reviews Only', description: 'Generate missing reviews', icon: '📝' },
  { id: 'verification', name: 'Verification', description: 'Cross-reference and verify data', icon: '✅' },
  { id: 'cast_crew', name: 'Cast & Crew', description: 'Enrich cast and crew data', icon: '👥' },
];

export function PipelineMonitor({
  onPipelineComplete,
  pollingInterval = 3000,
}: PipelineMonitorProps) {
  const [activePipelines, setActivePipelines] = useState<Pipeline[]>([]);
  const [recentPipelines, setRecentPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pipeline start options
  const [selectedType, setSelectedType] = useState<string>('full_enrich');
  const [options, setOptions] = useState<{
    limit: number;
    language: string;
    yearFrom?: number;
    yearTo?: number;
  }>({
    limit: 100,
    language: 'Telugu',
  });

  // Fetch pipeline status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/pipeline');
      if (response.ok) {
        const data = await response.json();
        setActivePipelines(data.activePipelines || []);
        setRecentPipelines(data.recentPipelines || []);

        // Check for completions
        data.recentPipelines?.forEach((pipeline: Pipeline) => {
          if (pipeline.status === 'completed' && onPipelineComplete) {
            onPipelineComplete(pipeline);
          }
        });
      }
    } catch (err) {
      console.error('Error fetching pipeline status:', err);
    }
  }, [onPipelineComplete]);

  // Poll for updates
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollingInterval]);

  // Start a new pipeline
  const startPipeline = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          type: selectedType,
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to start pipeline');
      } else {
        fetchStatus();
      }
    } catch (err) {
      setError('Failed to start pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a pipeline
  const cancelPipeline = async (pipelineId: string) => {
    try {
      const response = await fetch('/api/admin/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          pipelineId,
        }),
      });

      if (response.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error('Error cancelling pipeline:', err);
    }
  };

  const formatDuration = (startedAt: string, completedAt?: string): string => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getStatusColor = (status: Pipeline['status']): string => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'cancelled': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="pipeline-monitor space-y-6">
      {/* Start New Pipeline */}
      <div className="p-4 border rounded-lg dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Start New Pipeline</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Pipeline type selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Pipeline Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              disabled={isLoading}
            >
              {PIPELINE_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {PIPELINE_TYPES.find(t => t.id === selectedType)?.description}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Limit</label>
              <input
                type="number"
                value={options.limit}
                onChange={(e) => setOptions({ ...options, limit: parseInt(e.target.value) || 100 })}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                min={1}
                max={500}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <select
                value={options.language}
                onChange={(e) => setOptions({ ...options, language: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                disabled={isLoading}
              >
                <option value="Telugu">Telugu</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="">All Languages</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2 mb-4 text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        <button
          onClick={startPipeline}
          disabled={isLoading || activePipelines.length > 0}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Starting...' : activePipelines.length > 0 ? 'Pipeline Running...' : 'Start Pipeline'}
        </button>
      </div>

      {/* Active Pipelines */}
      {activePipelines.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Pipelines</h3>
          {activePipelines.map(pipeline => (
            <div key={pipeline.id} className="p-4 border rounded-lg dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium">
                    {PIPELINE_TYPES.find(t => t.id === pipeline.type)?.icon}{' '}
                    {PIPELINE_TYPES.find(t => t.id === pipeline.type)?.name || pipeline.type}
                  </span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(pipeline.status)}`}>
                    {pipeline.status}
                  </span>
                </div>
                <button
                  onClick={() => cancelPipeline(pipeline.id)}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${pipeline.progress.percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {pipeline.progress.completed} / {pipeline.progress.total} 
                  {pipeline.progress.failed > 0 && ` (${pipeline.progress.failed} failed)`}
                </span>
                <span>{pipeline.progress.percentage}% • {formatDuration(pipeline.startedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Pipelines */}
      {recentPipelines.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Recent Pipelines</h3>
          <div className="space-y-2">
            {recentPipelines.map(pipeline => (
              <div 
                key={pipeline.id} 
                className="p-3 border rounded dark:border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(pipeline.status)}`}>
                    {pipeline.status}
                  </span>
                  <span className="font-medium">
                    {PIPELINE_TYPES.find(t => t.id === pipeline.type)?.name || pipeline.type}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {pipeline.results && (
                    <span className="mr-4">
                      ✓ {pipeline.results.successCount} / ✗ {pipeline.results.failureCount}
                    </span>
                  )}
                  <span>{formatDuration(pipeline.startedAt, pipeline.completedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activePipelines.length === 0 && recentPipelines.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No pipelines running. Start a new pipeline above.</p>
        </div>
      )}
    </div>
  );
}

export default PipelineMonitor;

