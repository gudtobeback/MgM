import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface DriftItem {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  changeType: 'added' | 'modified' | 'removed';
  field?: string;
  oldValue?: any;
  newValue?: any;
  detectedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DriftReport {
  organizationId: string;
  baselineSnapshotId: string;
  baselineCreatedAt: string;
  totalDrifts: number;
  criticalDrifts: number;
  highDrifts: number;
  drifts: DriftItem[];
  checkedAt: string;
}

interface DriftDetectionPageProps {
  organizationId: string;
  organizationName?: string;
}

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const CHANGE_STYLES = {
  added: 'text-green-700 bg-green-50',
  modified: 'text-yellow-700 bg-yellow-50',
  removed: 'text-red-700 bg-red-50',
};

const RESOURCE_ICONS: Record<string, string> = {
  device: '📡',
  network: '🌐',
  vlan: '🔀',
  ssid: '📶',
  firewall: '🔥',
};

export const DriftDetectionPage: React.FC<DriftDetectionPageProps> = ({ organizationId, organizationName }) => {
  const [report, setReport] = useState<DriftReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    runDriftCheck();
  }, [organizationId]);

  const runDriftCheck = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.detectDrift(organizationId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run drift detection. Make sure you have at least 2 snapshots.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrifts = report?.drifts.filter(d => filter === 'all' || d.severity === filter) ?? [];

  const severityCounts = report ? {
    critical: report.drifts.filter(d => d.severity === 'critical').length,
    high: report.drifts.filter(d => d.severity === 'high').length,
    medium: report.drifts.filter(d => d.severity === 'medium').length,
    low: report.drifts.filter(d => d.severity === 'low').length,
  } : { critical: 0, high: 0, medium: 0, low: 0 };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Drift Detection</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {organizationName ? `${organizationName} — ` : ''}Detects unauthorized configuration changes between snapshots.
          </p>
        </div>
        <button
          onClick={runDriftCheck}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Scanning...' : 'Run Drift Check'}
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-[var(--color-text-secondary)]">
          <div className="animate-pulse text-4xl mb-3">🔍</div>
          <p>Comparing snapshots for configuration drift...</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{report.totalDrifts}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Total Changes</p>
            </div>
            <button
              onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}
              className={`border rounded-xl p-4 text-center transition-all ${filter === 'critical' ? 'ring-2 ring-red-500' : 'bg-[var(--color-surface)] border-[var(--color-border-primary)]'}`}
            >
              <p className="text-3xl font-bold text-red-600">{severityCounts.critical}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Critical</p>
            </button>
            <button
              onClick={() => setFilter(filter === 'high' ? 'all' : 'high')}
              className={`border rounded-xl p-4 text-center transition-all ${filter === 'high' ? 'ring-2 ring-orange-500' : 'bg-[var(--color-surface)] border-[var(--color-border-primary)]'}`}
            >
              <p className="text-3xl font-bold text-orange-600">{severityCounts.high}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">High</p>
            </button>
            <button
              onClick={() => setFilter(filter === 'medium' ? 'all' : 'medium')}
              className={`border rounded-xl p-4 text-center transition-all ${filter === 'medium' ? 'ring-2 ring-yellow-500' : 'bg-[var(--color-surface)] border-[var(--color-border-primary)]'}`}
            >
              <p className="text-3xl font-bold text-yellow-600">{severityCounts.medium}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Medium</p>
            </button>
          </div>

          {/* Baseline info */}
          {report.baselineCreatedAt && (
            <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-lg px-4 py-2 flex items-center justify-between">
              <span>Baseline snapshot: {new Date(report.baselineCreatedAt).toLocaleString()}</span>
              <span>Last checked: {new Date(report.checkedAt).toLocaleString()}</span>
            </div>
          )}

          {/* No drift */}
          {report.totalDrifts === 0 && (
            <div className="text-center py-16 border border-dashed border-green-200 bg-green-50 rounded-xl">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold text-green-800">No Drift Detected</h3>
              <p className="text-sm text-green-700 mt-1">
                Configuration matches the baseline snapshot. No unauthorized changes found.
              </p>
            </div>
          )}

          {/* Drift Items */}
          {filteredDrifts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  Detected Changes {filter !== 'all' && `(${filter})`}
                </h3>
                {filter !== 'all' && (
                  <button onClick={() => setFilter('all')} className="text-sm text-[var(--color-primary)] hover:underline">
                    Show all
                  </button>
                )}
              </div>
              {filteredDrifts.map((drift, idx) => (
                <div key={idx} className={`bg-[var(--color-surface)] border rounded-xl p-4 border-l-4 ${
                  drift.severity === 'critical' ? 'border-l-red-500' :
                  drift.severity === 'high' ? 'border-l-orange-500' :
                  drift.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-400'
                } border-[var(--color-border-primary)]`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{RESOURCE_ICONS[drift.resourceType] ?? '⚙️'}</span>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">{drift.resourceName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_STYLES[drift.severity]}`}>
                            {drift.severity}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${CHANGE_STYLES[drift.changeType]}`}>
                            {drift.changeType}
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            {drift.resourceType}
                          </span>
                          {drift.field && (
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              field: <code className="bg-gray-100 px-1 rounded">{drift.field}</code>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(drift.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {drift.changeType === 'modified' && (drift.oldValue !== undefined || drift.newValue !== undefined) && (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-red-50 rounded p-2">
                        <p className="font-medium text-red-700 mb-1">Before</p>
                        <code className="text-red-600">{JSON.stringify(drift.oldValue)}</code>
                      </div>
                      <div className="bg-green-50 rounded p-2">
                        <p className="font-medium text-green-700 mb-1">After</p>
                        <code className="text-green-600">{JSON.stringify(drift.newValue)}</code>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && !report && !error && (
        <div className="text-center py-16 border border-dashed border-[var(--color-border-primary)] rounded-xl">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">Ready to Scan</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Click "Run Drift Check" to compare your latest snapshots and detect unauthorized changes.
          </p>
        </div>
      )}
    </div>
  );
};
