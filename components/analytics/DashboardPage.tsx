import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface AnalyticsOverview {
  summary: {
    totalOrganizations: number;
    totalDevices: number;
    totalSnapshots: number;
    lastSnapshotAt: string | null;
  };
  snapshotActivity: { day: string; count: number }[];
  recentActivity: { action: string; created_at: string; details: any; meraki_org_name: string | null }[];
  changesSummary: { created: number; modified: number; deleted: number };
  organizations: {
    id: string;
    meraki_org_name: string;
    device_count: number;
    meraki_region: string;
    snapshot_count: number;
    last_snapshot_at: string | null;
  }[];
}

const ACTION_LABELS: Record<string, string> = {
  'user.login': 'Logged in',
  'organization.connected': 'Connected org',
  'organization.disconnected': 'Disconnected org',
  'backup.created': 'Created backup',
  'bulk.vlan_created': 'Bulk VLAN applied',
  'bulk.firewall_rules_applied': 'Firewall rules applied',
  'change.requested': 'Change requested',
  'change.approved': 'Change approved',
  'change.rejected': 'Change rejected',
};

const ACTION_ICONS: Record<string, string> = {
  'user.login': '🔑',
  'organization.connected': '🏢',
  'backup.created': '💾',
  'bulk.vlan_created': '🔀',
  'bulk.firewall_rules_applied': '🔥',
  'change.requested': '📋',
  'change.approved': '✅',
  'change.rejected': '❌',
};

function SparkBar({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-12">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-[var(--color-primary)] opacity-70 rounded-sm transition-all"
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
          title={`${v} snapshots`}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">{value}</p>
          {sub && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.getAnalyticsOverview();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-[var(--color-text-secondary)]">
        <div className="animate-pulse text-4xl mb-3">📊</div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm max-w-lg mx-auto mt-8">
        {error}
      </div>
    );
  }

  if (!data) return null;

  // Build activity chart data - last 30 days
  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const activityMap = new Map<string, number>(data.snapshotActivity.map(a => [a.day, a.count] as [string, number]));
  const chartValues = last30Days.map(d => activityMap.get(d) ?? 0);

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Analytics Dashboard</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Overview of all connected organizations and activity.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm hover:bg-[var(--color-surface-subtle)]"
        >
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Organizations"
          value={data.summary.totalOrganizations}
          icon="🏢"
        />
        <StatCard
          label="Total Devices"
          value={data.summary.totalDevices.toLocaleString()}
          icon="📡"
        />
        <StatCard
          label="Snapshots"
          value={data.summary.totalSnapshots.toLocaleString()}
          sub={`Last: ${formatDate(data.summary.lastSnapshotAt)}`}
          icon="💾"
        />
        <StatCard
          label="Changes (7d)"
          value={data.changesSummary.created + data.changesSummary.modified + data.changesSummary.deleted}
          sub={`+${data.changesSummary.created} added, ~${data.changesSummary.modified} modified`}
          icon="🔄"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Snapshot Activity Chart */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-5">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Snapshot Activity (Last 30 Days)</h3>
          {chartValues.every(v => v === 0) ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)] text-sm">
              No snapshot activity in the last 30 days.
            </div>
          ) : (
            <>
              <SparkBar values={chartValues} />
              <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mt-2">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </>
          )}

          {/* Changes Summary */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[var(--color-border-primary)]">
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{data.changesSummary.created}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Added</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-600">{data.changesSummary.modified}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Modified</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-red-600">{data.changesSummary.deleted}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Removed</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-5">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Recent Activity</h3>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">No recent activity.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{ACTION_ICONS[item.action] ?? '⚙️'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {ACTION_LABELS[item.action] ?? item.action}
                    </p>
                    {item.meraki_org_name && (
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">{item.meraki_org_name}</p>
                    )}
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Organizations Table */}
      {data.organizations.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[var(--color-border-primary)]">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Organizations Overview</h3>
          </div>
          <table className="w-full">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] px-5 py-3 uppercase tracking-wide">Organization</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-secondary)] px-4 py-3 uppercase tracking-wide">Region</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-secondary)] px-4 py-3 uppercase tracking-wide">Devices</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-secondary)] px-4 py-3 uppercase tracking-wide">Snapshots</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] px-4 py-3 uppercase tracking-wide">Last Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-primary)]">
              {data.organizations.map(org => (
                <tr key={org.id} className="hover:bg-[var(--color-surface-subtle)]">
                  <td className="px-5 py-3">
                    <p className="font-medium text-[var(--color-text-primary)] text-sm">{org.meraki_org_name}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {org.meraki_region === 'in' ? 'India' : 'Global'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-[var(--color-text-primary)]">
                    {org.device_count || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${parseInt(String(org.snapshot_count)) > 0 ? 'text-green-600' : 'text-[var(--color-text-secondary)]'}`}>
                      {org.snapshot_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    {org.last_snapshot_at ? formatDate(org.last_snapshot_at) : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.organizations.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[var(--color-border-primary)] rounded-xl">
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">No Organizations Connected</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Connect a Meraki organization to start seeing analytics.
          </p>
        </div>
      )}
    </div>
  );
};
