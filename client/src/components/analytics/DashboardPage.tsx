import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { RefreshCw, ArrowUpRight, ArrowDownRight, Activity, Building2, Wifi, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

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
    <div className="flex items-end gap-1 h-16 w-full">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-blue-500/80 hover:bg-blue-600/90 rounded-t-sm transition-all duration-300"
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
          title={`${v} snapshots`}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, icon, trend }: { label: string; value: string | number; sub?: string; icon: string; trend?: 'up' | 'down' }) {
  return (
    <div className="glass-card p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-2 tracking-tight">{value}</p>
        </div>
        <span className="text-2xl p-3 bg-white/50 rounded-2xl shadow-sm">{icon}</span>
      </div>
      {sub && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend === 'up' && <ArrowUpRight size={14} className="text-green-600" />}
          {trend === 'down' && <ArrowDownRight size={14} className="text-red-600" />}
          <span className="text-muted-foreground">{sub}</span>
        </div>
      )}
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
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-pulse">
        <Activity size={48} className="mb-4 text-blue-500 opacity-50" />
        <p className="text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl text-sm max-w-lg mx-auto mt-12 shadow-lg">
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

  // Device Distribution calculations
  const totalDevices = data.summary.totalDevices || 0;
  const sortedOrgs = [...data.organizations].sort((a, b) => (b.device_count || 0) - (a.device_count || 0));
  const globalOrgs = data.organizations.filter(o => o.meraki_region !== 'in');
  const indiaOrgs  = data.organizations.filter(o => o.meraki_region === 'in');
  const globalDevices = globalOrgs.reduce((s, o) => s + (o.device_count || 0), 0);
  const indiaDevices  = indiaOrgs.reduce((s, o) => s + (o.device_count || 0), 0);

  // Network Health calculations
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const healthyOrgs  = data.organizations.filter(o => o.last_snapshot_at && o.last_snapshot_at > sevenDaysAgo);
  const warningOrgs  = data.organizations.filter(o => o.last_snapshot_at && o.last_snapshot_at <= sevenDaysAgo);
  const criticalOrgs = data.organizations.filter(o => !o.last_snapshot_at);
  const healthScore  = data.organizations.length > 0
    ? Math.round((healthyOrgs.length / data.organizations.length) * 100)
    : 0;
  const healthColor  = healthScore >= 80 ? '#16a34a' : healthScore >= 50 ? '#d97706' : '#dc2626';
  const healthLabel  = healthScore >= 80 ? 'Healthy' : healthScore >= 50 ? 'Warning' : 'Critical';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of all connected organizations and activity.</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white border border-white/60 rounded-lg text-sm font-medium shadow-sm transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ── Hero Row: Device Distribution + Network Health ───────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Device Distribution */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Device Distribution</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Devices spread across organizations</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-foreground tracking-tight">{totalDevices.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">total devices</p>
            </div>
          </div>

          {/* Regional split */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100/80">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Global</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{globalDevices.toLocaleString()}</p>
              <p className="text-xs text-blue-500/80 mt-0.5">{globalOrgs.length} org{globalOrgs.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100/80">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">India</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">{indiaDevices.toLocaleString()}</p>
              <p className="text-xs text-purple-500/80 mt-0.5">{indiaOrgs.length} org{indiaOrgs.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Per-org bars */}
          {sortedOrgs.length > 0 ? (
            <div className="space-y-3">
              {sortedOrgs.slice(0, 5).map(org => {
                const pct = totalDevices > 0 ? Math.round(((org.device_count || 0) / totalDevices) * 100) : 0;
                return (
                  <div key={org.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{org.meraki_org_name}</span>
                      <span className="text-sm font-bold text-foreground ml-2">{(org.device_count || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2.5">
                      <div
                        className={cn(
                          "h-2.5 rounded-full transition-all duration-500",
                          org.meraki_region === 'in' ? 'bg-purple-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% of fleet</p>
                  </div>
                );
              })}
              {sortedOrgs.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{sortedOrgs.length - 5} more organization{sortedOrgs.length - 5 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Building2 size={32} className="opacity-20 mb-2" />
              <p className="text-sm">No organizations connected</p>
            </div>
          )}
        </div>

        {/* Network Health */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Network Health</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Snapshot freshness across all orgs</p>
            </div>
            {data.organizations.length > 0 && (
              <div className="text-right">
                <p className="text-4xl font-bold tracking-tight" style={{ color: healthColor }}>{healthScore}%</p>
                <p className="text-xs mt-0.5 font-semibold" style={{ color: healthColor }}>{healthLabel}</p>
              </div>
            )}
          </div>

          {/* Health donut-style ring */}
          {data.organizations.length > 0 ? (
            <>
              {/* Health score bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Overall health score</span>
                  <span className="font-semibold" style={{ color: healthColor }}>{healthScore}%</span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-700"
                    style={{ width: `${healthScore}%`, backgroundColor: healthColor }}
                  />
                </div>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-4 rounded-xl bg-green-50/60 border border-green-100/80">
                  <CheckCircle2 size={22} className="text-green-600 mb-1" />
                  <p className="text-2xl font-bold text-green-700">{healthyOrgs.length}</p>
                  <p className="text-[10px] font-semibold text-green-600/80 uppercase tracking-wide mt-0.5">Healthy</p>
                  <p className="text-[9px] text-green-500/70 text-center mt-0.5">Snapshot &lt; 7d</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-amber-50/60 border border-amber-100/80">
                  <AlertCircle size={22} className="text-amber-600 mb-1" />
                  <p className="text-2xl font-bold text-amber-700">{warningOrgs.length}</p>
                  <p className="text-[10px] font-semibold text-amber-600/80 uppercase tracking-wide mt-0.5">Warning</p>
                  <p className="text-[9px] text-amber-500/70 text-center mt-0.5">Snapshot stale</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-red-50/60 border border-red-100/80">
                  <WifiOff size={22} className="text-red-600 mb-1" />
                  <p className="text-2xl font-bold text-red-700">{criticalOrgs.length}</p>
                  <p className="text-[10px] font-semibold text-red-600/80 uppercase tracking-wide mt-0.5">Critical</p>
                  <p className="text-[9px] text-red-500/70 text-center mt-0.5">Never snapped</p>
                </div>
              </div>

              {/* Per-org health list */}
              <div className="space-y-2">
                {data.organizations.slice(0, 5).map(org => {
                  const isHealthy  = !!org.last_snapshot_at && org.last_snapshot_at > sevenDaysAgo;
                  const isCritical = !org.last_snapshot_at;
                  return (
                    <div key={org.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/30 transition-colors">
                      <span className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        isCritical ? 'bg-red-500' : isHealthy ? 'bg-green-500' : 'bg-amber-500'
                      )} />
                      <span className="text-sm text-foreground truncate flex-1">{org.meraki_org_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {org.last_snapshot_at ? formatDate(org.last_snapshot_at) : 'Never'}
                      </span>
                    </div>
                  );
                })}
                {data.organizations.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{data.organizations.length - 5} more organization{data.organizations.length - 5 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wifi size={36} className="opacity-20 mb-3" />
              <p className="text-sm">No organizations to assess</p>
              <p className="text-xs mt-1 opacity-70">Connect organizations to see health status</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Stats Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Organizations" value={data.summary.totalOrganizations} icon="🏢" />
        <StatCard label="Total Devices" value={data.summary.totalDevices.toLocaleString()} icon="📡" trend="up" sub="Active devices" />
        <StatCard label="Snapshots" value={data.summary.totalSnapshots.toLocaleString()} sub={`Last: ${formatDate(data.summary.lastSnapshotAt)}`} icon="💾" />
        <StatCard label="Changes (7d)" value={data.changesSummary.created + data.changesSummary.modified + data.changesSummary.deleted} sub={`+${data.changesSummary.created} added, ~${data.changesSummary.modified} modified`} icon="🔄" />
      </div>

      {/* ── Activity Chart + Recent Activity ─────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Snapshot Activity Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="font-semibold text-lg text-foreground mb-6">
            Snapshot Activity <span className="text-muted-foreground text-sm font-normal ml-2">(Last 30 Days)</span>
          </h3>
          {chartValues.every(v => v === 0) ? (
            <div className="text-center py-12 text-muted-foreground text-sm bg-secondary/30 rounded-xl border border-secondary">
              No snapshot activity in the last 30 days.
            </div>
          ) : (
            <>
              <div className="px-2">
                <SparkBar values={chartValues} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-4 px-2">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </>
          )}

          {/* Changes Summary */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-border/40">
            <div className="text-center p-4 bg-green-50/50 rounded-xl border border-green-100/50">
              <p className="text-2xl font-bold text-green-600">{data.changesSummary.created}</p>
              <p className="text-xs font-semibold text-green-700/70 uppercase tracking-wide mt-1">Added</p>
            </div>
            <div className="text-center p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
              <p className="text-2xl font-bold text-amber-600">{data.changesSummary.modified}</p>
              <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wide mt-1">Modified</p>
            </div>
            <div className="text-center p-4 bg-red-50/50 rounded-xl border border-red-100/50">
              <p className="text-2xl font-bold text-red-600">{data.changesSummary.deleted}</p>
              <p className="text-xs font-semibold text-red-700/70 uppercase tracking-wide mt-1">Removed</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="glass-card p-0 overflow-hidden flex flex-col h-[500px]">
          <div className="p-5 border-b border-border/40 bg-white/30 backdrop-blur-md sticky top-0 z-10">
            <h3 className="font-semibold text-lg text-foreground">Recent Activity</h3>
          </div>
          <div className="overflow-y-auto p-4 space-y-4 flex-1">
            {data.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                <Activity size={24} className="opacity-20" />
                <p className="text-sm">No recent activity.</p>
              </div>
            ) : (
              data.recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/40 transition-colors group">
                  <div className="text-xl bg-white rounded-lg w-10 h-10 flex items-center justify-center shadow-sm shrink-0 border border-border/50">
                    {ACTION_ICONS[item.action] ?? '⚙️'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                      {ACTION_LABELS[item.action] ?? item.action}
                    </p>
                    {item.meraki_org_name && (
                      <p className="text-xs text-muted-foreground truncate font-medium">{item.meraki_org_name}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/80 mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Organizations Table ───────────────────────────────────────────── */}
      {data.organizations.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-border/40">
            <h3 className="font-semibold text-lg text-foreground">Organizations Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="text-left text-xs font-bold text-muted-foreground px-6 py-4 uppercase tracking-wider">Organization</th>
                  <th className="text-center text-xs font-bold text-muted-foreground px-4 py-4 uppercase tracking-wider">Region</th>
                  <th className="text-center text-xs font-bold text-muted-foreground px-4 py-4 uppercase tracking-wider">Devices</th>
                  <th className="text-center text-xs font-bold text-muted-foreground px-4 py-4 uppercase tracking-wider">Snapshots</th>
                  <th className="text-right text-xs font-bold text-muted-foreground px-6 py-4 uppercase tracking-wider">Last Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.organizations.map(org => (
                  <tr key={org.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground text-sm">{org.meraki_org_name}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "text-[10px] px-2.5 py-1 rounded-full font-bold border",
                        org.meraki_region === 'in'
                          ? "bg-purple-50 text-purple-700 border-purple-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      )}>
                        {org.meraki_region === 'in' ? 'India' : 'Global'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-mono text-muted-foreground">
                      {org.device_count || 0}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "text-sm font-bold",
                        org.snapshot_count > 0 ? 'text-green-600' : 'text-muted-foreground'
                      )}>
                        {org.snapshot_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                      {org.last_snapshot_at ? formatDate(org.last_snapshot_at) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.organizations.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border/60 rounded-2xl bg-white/20">
          <Building2 size={40} className="mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="font-semibold text-lg text-foreground">No Organizations Connected</h3>
          <p className="text-muted-foreground mt-2">Connect a Meraki organization to start seeing analytics.</p>
        </div>
      )}
    </div>
  );
};
