import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface OrgOption {
  id: string;
  meraki_org_id: string;
  meraki_org_name: string;
  meraki_region: string;
  device_count: number;
}

interface CrossRegionDiff {
  category: 'networks' | 'devices' | 'vlans' | 'ssids';
  item: string;
  sourceValue: any;
  targetValue: any;
  status: 'only_in_source' | 'only_in_target' | 'differs';
}

interface CrossRegionReport {
  sourceOrg: { id: string; name: string; region: string };
  targetOrg: { id: string; name: string; region: string };
  generatedAt: string;
  summary: Record<string, number>;
  diffs: CrossRegionDiff[];
}

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  only_in_source: { label: 'Source Only', style: 'bg-blue-100 text-blue-700' },
  only_in_target: { label: 'Target Only', style: 'bg-purple-100 text-purple-700' },
  differs: { label: 'Differs', style: 'bg-amber-100 text-amber-700' },
};

const CATEGORY_ICONS: Record<string, string> = {
  networks: '🌐',
  devices: '📡',
  vlans: '🔌',
  ssids: '📶',
};

export const CrossRegionPage: React.FC = () => {
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [sourceOrgId, setSourceOrgId] = useState('');
  const [targetOrgId, setTargetOrgId] = useState('');
  const [report, setReport] = useState<CrossRegionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    setLoadingOrgs(true);
    try {
      const data = await apiClient.listCrossRegionOrgs();
      setOrgs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoadingOrgs(false);
    }
  };

  const compare = async () => {
    if (!sourceOrgId || !targetOrgId) {
      setError('Please select both a source and target organization');
      return;
    }
    if (sourceOrgId === targetOrgId) {
      setError('Source and target organizations must be different');
      return;
    }
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const data = await apiClient.compareOrgs(sourceOrgId, targetOrgId);
      setReport(data);
      setCategoryFilter('all');
    } catch (err: any) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredDiffs = report?.diffs.filter(d =>
    categoryFilter === 'all' || d.category === categoryFilter
  ) ?? [];

  const regionBadge = (region: string) => (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
      region === 'in' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
    }`}>
      {region === 'in' ? '.in' : '.com'}
    </span>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Cross-Region Sync</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Compare configuration snapshots between .com and .in Meraki organizations to identify discrepancies.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Org Selector */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Select Organizations to Compare</h3>
        {loadingOrgs ? (
          <div className="text-sm text-[var(--color-text-secondary)]">Loading organizations...</div>
        ) : orgs.length < 2 ? (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            You need at least two connected organizations to run a cross-region comparison.
            Connect organizations from the Organizations page first.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Source Organization</label>
              <select
                value={sourceOrgId}
                onChange={e => setSourceOrgId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">Select source org...</option>
                {orgs.filter(o => o.id !== targetOrgId).map(o => (
                  <option key={o.id} value={o.id}>
                    [{o.meraki_region.toUpperCase()}] {o.meraki_org_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center pb-1">
              <span className="text-2xl text-[var(--color-text-secondary)]">⇄</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Target Organization</label>
              <select
                value={targetOrgId}
                onChange={e => setTargetOrgId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">Select target org...</option>
                {orgs.filter(o => o.id !== sourceOrgId).map(o => (
                  <option key={o.id} value={o.id}>
                    [{o.meraki_region.toUpperCase()}] {o.meraki_org_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <button
                onClick={compare}
                disabled={loading || !sourceOrgId || !targetOrgId}
                className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Comparing...' : 'Compare Organizations'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {report && (
        <>
          {/* Org headers */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Source', org: report.sourceOrg },
              { label: 'Target', org: report.targetOrg },
            ].map(({ label, org }) => (
              <div key={label} className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{label === 'Source' ? '🔵' : '🟣'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--color-text-primary)]">{label}</span>
                    {regionBadge(org.region)}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{org.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-5">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Comparison Summary</h3>
            {report.diffs.length === 0 ? (
              <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <span className="text-xl">✅</span>
                <span className="font-medium">Configurations are identical across both organizations.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['networks', 'devices', 'vlans', 'ssids'] as const).map(cat => {
                  const catDiffs = report.diffs.filter(d => d.category === cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                      className={`p-4 rounded-xl border text-center transition-colors ${
                        categoryFilter === cat
                          ? 'border-[var(--color-primary)] bg-blue-50'
                          : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      <div className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</div>
                      <div className="text-2xl font-bold text-[var(--color-primary)]">{catDiffs.length}</div>
                      <div className="text-xs text-[var(--color-text-secondary)] capitalize mt-0.5">{cat} differences</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Diff List */}
          {filteredDiffs.length > 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-primary)]">
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {categoryFilter === 'all' ? 'All Differences' : `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Differences`}
                  <span className="ml-2 text-sm font-normal text-[var(--color-text-secondary)]">({filteredDiffs.length})</span>
                </h3>
                {categoryFilter !== 'all' && (
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    Show all
                  </button>
                )}
              </div>

              <div className="divide-y divide-[var(--color-border-primary)]">
                {filteredDiffs.map((diff, i) => (
                  <div key={i}>
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                      onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg">{CATEGORY_ICONS[diff.category]}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{diff.item}</p>
                          <span className="text-xs capitalize text-[var(--color-text-secondary)]">{diff.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[diff.status].style}`}>
                          {STATUS_LABELS[diff.status].label}
                        </span>
                        <span className="text-[var(--color-text-secondary)] text-xs">{expandedIdx === i ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {expandedIdx === i && (
                      <div className="px-4 pb-4 pt-1">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2">Source ({report.sourceOrg.region.toUpperCase()})</p>
                            {diff.sourceValue ? (
                              <pre className="text-xs text-blue-900 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(diff.sourceValue, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-xs text-blue-500 italic">Not present</p>
                            )}
                          </div>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-purple-700 mb-2">Target ({report.targetOrg.region.toUpperCase()})</p>
                            {diff.targetValue ? (
                              <pre className="text-xs text-purple-900 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(diff.targetValue, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-xs text-purple-500 italic">Not present</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-center text-[var(--color-text-secondary)]">
            Comparison based on latest snapshots — Generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
};
