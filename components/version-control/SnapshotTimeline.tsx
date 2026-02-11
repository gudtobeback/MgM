import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { apiClient } from '../../services/apiClient';
import { formatDistance } from 'date-fns';

interface Snapshot {
  id: string;
  organizationId: string;
  snapshotType: 'manual' | 'scheduled' | 'pre-change' | 'post-change';
  snapshotData: any;
  snapshotMetadata?: any;
  sizeBytes: number;
  createdBy?: string;
  createdAt: string;
  notes?: string;
}

interface SnapshotTimelineProps {
  organizationId: string;
  onCompare?: (snapshot1Id: string, snapshot2Id: string) => void;
  onView?: (snapshot: Snapshot) => void;
}

export const SnapshotTimeline: React.FC<SnapshotTimelineProps> = ({
  organizationId,
  onCompare,
  onView,
}) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);

  useEffect(() => {
    loadSnapshots();
  }, [organizationId]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listSnapshots(organizationId, { limit: 50 });
      setSnapshots(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      setCreating(true);
      setError('');
      const newSnapshot = await apiClient.createSnapshot(organizationId, 'manual', 'Manual snapshot');
      setSnapshots([newSnapshot, ...snapshots]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create snapshot');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectSnapshot = (snapshotId: string) => {
    if (selectedSnapshots.includes(snapshotId)) {
      setSelectedSnapshots(selectedSnapshots.filter(id => id !== snapshotId));
    } else {
      if (selectedSnapshots.length < 2) {
        setSelectedSnapshots([...selectedSnapshots, snapshotId]);
      } else {
        // Replace the oldest selection
        setSelectedSnapshots([selectedSnapshots[1], snapshotId]);
      }
    }
  };

  const handleCompare = () => {
    if (selectedSnapshots.length === 2 && onCompare) {
      onCompare(selectedSnapshots[0], selectedSnapshots[1]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual': return 'bg-blue-500';
      case 'scheduled': return 'bg-green-500';
      case 'pre-change': return 'bg-yellow-500';
      case 'post-change': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'manual': return '👤';
      case 'scheduled': return '⏰';
      case 'pre-change': return '⚠️';
      case 'post-change': return '✅';
      default: return '📸';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading snapshots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configuration Snapshots</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Version control for your Meraki configuration
          </p>
        </div>
        <div className="flex gap-3">
          {selectedSnapshots.length === 2 && (
            <Button onClick={handleCompare} variant="outline">
              Compare Selected
            </Button>
          )}
          <Button onClick={handleCreateSnapshot} disabled={creating}>
            {creating ? 'Creating...' : '+ Create Snapshot'}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Selection Info */}
      {selectedSnapshots.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            {selectedSnapshots.length} snapshot{selectedSnapshots.length > 1 ? 's' : ''} selected
            {selectedSnapshots.length === 2 && ' - Click "Compare Selected" to see differences'}
          </p>
        </div>
      )}

      {/* Timeline */}
      {snapshots.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No Snapshots Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Create your first snapshot to start tracking configuration changes
          </p>
          <Button onClick={handleCreateSnapshot} disabled={creating}>
            Create First Snapshot
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-700"></div>

          {/* Snapshot Cards */}
          <div className="space-y-4">
            {snapshots.map((snapshot, index) => (
              <div
                key={snapshot.id}
                className={`relative pl-20 transition-all ${
                  selectedSnapshots.includes(snapshot.id)
                    ? 'bg-blue-50 dark:bg-blue-900/20 -mx-4 px-4 py-2 rounded-lg'
                    : ''
                }`}
              >
                {/* Timeline Dot */}
                <div className={`absolute left-6 top-6 w-5 h-5 rounded-full ${getTypeColor(snapshot.snapshotType)} flex items-center justify-center`}>
                  <span className="text-xs">{getTypeIcon(snapshot.snapshotType)}</span>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Snapshot #{snapshots.length - index}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(snapshot.snapshotType)} text-white`}>
                          {snapshot.snapshotType}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDistance(new Date(snapshot.createdAt), new Date(), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                          </svg>
                          {formatBytes(snapshot.sizeBytes)}
                        </div>
                      </div>

                      {snapshot.notes && (
                        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                          {snapshot.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={selectedSnapshots.includes(snapshot.id)}
                        onChange={() => handleSelectSnapshot(snapshot.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView && onView(snapshot)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
