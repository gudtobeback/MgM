import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { apiClient } from '../../services/apiClient';

interface SnapshotDiff {
  added: any[];
  modified: any[];
  removed: any[];
  summary: {
    totalChanges: number;
    devicesChanged: number;
    networksChanged: number;
  };
}

interface SnapshotDiffViewerProps {
  organizationId: string;
  snapshot1Id: string;
  snapshot2Id: string;
  onClose: () => void;
}

export const SnapshotDiffViewer: React.FC<SnapshotDiffViewerProps> = ({
  organizationId,
  snapshot1Id,
  snapshot2Id,
  onClose,
}) => {
  const [diff, setDiff] = useState<SnapshotDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'added' | 'modified' | 'removed'>('modified');

  useEffect(() => {
    loadDiff();
  }, [snapshot1Id, snapshot2Id]);

  const loadDiff = async () => {
    try {
      setLoading(true);
      const data = await apiClient.compareSnapshots(organizationId, snapshot1Id, snapshot2Id);
      setDiff(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diff');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Comparing snapshots...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-2xl">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2">Error</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!diff) return null;

  const renderChangeItem = (item: any, changeType: 'added' | 'modified' | 'removed') => {
    const isAdded = changeType === 'added';
    const isRemoved = changeType === 'removed';
    const isModified = changeType === 'modified';

    return (
      <div
        key={item.serial || item.id || Math.random()}
        className={`p-4 rounded-lg border ${
          isAdded ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
          isRemoved ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
          'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xl ${
                isAdded ? 'text-green-600' :
                isRemoved ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {isAdded ? '+ ' : isRemoved ? '- ' : '~ '}
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {item.type === 'device' ? 'Device' : 'Network'}: {item.serial || item.id}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                isAdded ? 'bg-green-100 text-green-800' :
                isRemoved ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {isAdded ? 'Added' : isRemoved ? 'Removed' : 'Modified'}
              </span>
            </div>

            {/* Show data for added/removed */}
            {(isAdded || isRemoved) && item.data && (
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {item.data.name && <div>Name: {item.data.name}</div>}
                {item.data.model && <div>Model: {item.data.model}</div>}
                {item.data.mac && <div>MAC: {item.data.mac}</div>}
              </div>
            )}

            {/* Show old vs new for modified */}
            {isModified && (
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white dark:bg-slate-900 p-3 rounded">
                  <div className="text-xs font-semibold text-red-600 mb-2">BEFORE</div>
                  <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-auto">
                    {JSON.stringify(item.old, null, 2)}
                  </pre>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded">
                  <div className="text-xs font-semibold text-green-600 mb-2">AFTER</div>
                  <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-auto">
                    {JSON.stringify(item.new, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Configuration Diff
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Comparing two snapshots
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {diff.summary.totalChanges}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Changes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{diff.added.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Added</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{diff.modified.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Modified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{diff.removed.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Removed</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 pt-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('modified')}
            className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'modified'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Modified ({diff.modified.length})
          </button>
          <button
            onClick={() => setActiveTab('added')}
            className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'added'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Added ({diff.added.length})
          </button>
          <button
            onClick={() => setActiveTab('removed')}
            className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'removed'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Removed ({diff.removed.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {activeTab === 'added' && diff.added.length === 0 && (
              <div className="text-center py-12 text-slate-400">No items added</div>
            )}
            {activeTab === 'added' && diff.added.map(item => renderChangeItem(item, 'added'))}

            {activeTab === 'modified' && diff.modified.length === 0 && (
              <div className="text-center py-12 text-slate-400">No items modified</div>
            )}
            {activeTab === 'modified' && diff.modified.map(item => renderChangeItem(item, 'modified'))}

            {activeTab === 'removed' && diff.removed.length === 0 && (
              <div className="text-center py-12 text-slate-400">No items removed</div>
            )}
            {activeTab === 'removed' && diff.removed.map(item => renderChangeItem(item, 'removed'))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
