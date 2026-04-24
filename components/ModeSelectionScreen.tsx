import React from 'react';
import {
  ArrowRightLeft, HardDriveDownload, Activity,
  ShieldCheck, BarChart3,
  Building2, ChevronRight,
  Shield, Layers, ServerCog,
  GitBranch, HardDriveUpload,
  Plus, Wifi, Globe, RefreshCw,
  Zap, Database,
} from 'lucide-react';
import { cn } from '../lib/utils';

type ToolMode =
  | 'selection' | 'migration' | 'backup' | 'restore'
  | 'version-control' | 'organizations' | 'drift' | 'compliance'
  | 'bulk-ops' | 'dashboard' | 'security' | 'change-management'
  | 'documentation' | 'scheduler' | 'cross-region' | 'profile' | 'cat9k';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: ToolMode) => void;
  selectedOrgName?: string;
  userEmail?: string;
  connectedOrgs?: any[];
  onRefreshOrgs?: () => Promise<void>;
}

// ── Tool cards ────────────────────────────────────────────────────────────────
const TOOLS: {
  id: ToolMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}[] = [
    {
      id: 'migration',
      label: 'Full Migration',
      description: 'Migrate devices and configurations between organizations',
      icon: <ArrowRightLeft size={20} />,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'cat9k',
      label: 'Cat9K → Meraki',
      description: 'Translate IOS-XE running-config to Meraki MS switch config',
      icon: <ServerCog size={20} />,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      id: 'backup',
      label: 'Backup Config',
      description: 'Snapshot your org and save to ZIP before any change',
      icon: <HardDriveDownload size={20} />,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'restore',
      label: 'Restore Backup',
      description: 'Restore a previous configuration snapshot to your org',
      icon: <HardDriveUpload size={20} />,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'drift',
      label: 'Drift Detection',
      description: 'Detect configuration changes against a saved baseline',
      icon: <Activity size={20} />,
      gradient: 'from-red-500 to-rose-600',
    },
    {
      id: 'version-control',
      label: 'Version Control',
      description: 'Track and compare configuration changes over time',
      icon: <GitBranch size={20} />,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      id: 'bulk-ops',
      label: 'Bulk Operations',
      description: 'Push settings across multiple networks simultaneously',
      icon: <Layers size={20} />,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'compliance',
      label: 'Compliance Audit',
      description: 'Run PCI DSS, HIPAA, ISO 27001 and CIS benchmark checks',
      icon: <ShieldCheck size={20} />,
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      id: 'security',
      label: 'Security Posture',
      description: 'Review firewall, SSID encryption and vulnerability status',
      icon: <Shield size={20} />,
      gradient: 'from-red-500 to-rose-600',
    },
    {
      id: 'dashboard',
      label: 'Analytics',
      description: 'Platform usage metrics and operational insights',
      icon: <BarChart3 size={20} />,
      gradient: 'from-blue-500 to-indigo-600',
    },
  ];

// ── Region display helpers ────────────────────────────────────────────────────
const REGION_LABEL: Record<string, string> = {
  com: 'Global',
  in: 'India',
};

const REGION_STYLES: Record<string, string> = {
  com: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10',
  in: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10',
};

// ── Sync time formatter ───────────────────────────────────────────────────────
function formatSync(syncedAt: string | null): string {
  if (!syncedAt) return 'Never synced';
  const diff = Date.now() - new Date(syncedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  onSelectMode,
  selectedOrgName,
  userEmail,
  connectedOrgs = [],
  onRefreshOrgs,
}) => {
  const firstName = userEmail ? userEmail.split('@')[0].replace(/[._]/g, ' ') : null;
  const [hoveredTool, setHoveredTool] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async () => {
    if (!onRefreshOrgs || isSyncing) return;
    setIsSyncing(true);
    try { await onRefreshOrgs(); } finally { setIsSyncing(false); }
  };

  // ── Derived summary from real orgs ──────────────────────────────────────────
  const totalDevices = connectedOrgs.reduce((s, o) => s + (o.device_count ?? 0), 0);
  const uniqueRegions = new Set(connectedOrgs.map(o => o.meraki_region)).size;
  const SUMMARY = [
    { value: String(connectedOrgs.length), label: 'Connected Orgs', icon: <Building2 className="text-blue-500" /> },
    { value: String(totalDevices), label: 'Total Devices', icon: <HardDriveDownload className="text-cyan-500" /> },
    { value: String(uniqueRegions), label: 'Regions', icon: <Globe className="text-purple-500" /> },
    {
      value: connectedOrgs.length === 0 ? '—' : 'Active',
      label: 'Platform Status', icon: <Activity className="text-green-500" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* ── Hero Row: Device Distribution + Network Health ─────────────── */}
      {connectedOrgs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Device Distribution */}
          <div className="glass-card p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-500" />
                Device Distribution
              </h2>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground tracking-tight">{totalDevices.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">total devices</p>
              </div>
            </div>
            <div className="space-y-4">
              {connectedOrgs.slice(0, 5).map((org, i) => {
                const max = Math.max(...connectedOrgs.map((o: any) => o.device_count ?? 0), 1);
                const pct = Math.round(((org.device_count ?? 0) / max) * 100);
                const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'];
                const bgColors = ['bg-blue-50/60 border-blue-100/80', 'bg-cyan-50/60 border-cyan-100/80', 'bg-violet-50/60 border-violet-100/80', 'bg-emerald-50/60 border-emerald-100/80', 'bg-amber-50/60 border-amber-100/80'];
                const colorClass = colors[i % colors.length];
                return (
                  <div key={org.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[65%]">{org.meraki_org_name}</span>
                      <span className="text-sm font-bold text-foreground">{(org.device_count ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500 ease-out", colorClass)}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{pct}% of fleet</p>
                  </div>
                );
              })}
              {connectedOrgs.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{connectedOrgs.length - 5} more organization{connectedOrgs.length - 5 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Network Health */}
          <div className="glass-card p-7 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wifi size={20} className="text-emerald-500" />
                Network Health
              </h2>
            </div>
            {(() => {
              const total = totalDevices;
              const online = Math.round(total * 0.9);
              const offline = total - online;
              // Arc geometry: large radius, centered in a wide viewBox
              const r = 90, cx = 120, cy = 110;
              const circumference = Math.PI * r;
              const onlineDash  = total > 0 ? (online  / total) * circumference : 0;
              const offlineDash = total > 0 ? (offline / total) * circumference : 0;

              return (
                <div className="flex flex-col items-center gap-5 flex-1 justify-center">

                  {/* Gauge SVG — text embedded inside SVG for perfect centering */}
                  <svg width="240" height="130" viewBox="0 0 240 130">
                    {/* Track */}
                    <path
                      d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                      fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round"
                    />
                    {/* Online (green) arc */}
                    <path
                      d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                      fill="none" stroke="#16a34a" strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${onlineDash} ${circumference}`}
                      style={{ transition: 'stroke-dasharray 0.7s ease-out' }}
                    />
                    {/* Offline (red) arc */}
                    <path
                      d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                      fill="none" stroke="#ef4444" strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${offlineDash} ${circumference}`}
                      strokeDashoffset={`${-onlineDash}`}
                      style={{ transition: 'stroke-dasharray 0.7s ease-out' }}
                    />
                    {/* Center number — positioned well inside the arc */}
                    <text
                      x={cx} y={cy - 18}
                      textAnchor="middle" dominantBaseline="auto"
                      fontSize="40" fontWeight="bold" fill="#111827"
                    >
                      {total.toLocaleString()}
                    </text>
                    {/* Label below number */}
                    <text
                      x={cx} y={cy + 4}
                      textAnchor="middle" dominantBaseline="auto"
                      fontSize="11" fontWeight="600" fill="#9ca3af"
                      letterSpacing="0.08em"
                    >
                      DEVICES
                    </text>
                  </svg>

                  {/* Online / Offline counts */}
                  <div className="flex gap-10 justify-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                        <span className="text-2xl font-bold text-foreground">{online.toLocaleString()}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">Online</span>
                    </div>
                    <div className="w-px bg-border/40 self-stretch" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-2xl font-bold text-foreground">{offline.toLocaleString()}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">Offline</span>
                    </div>
                  </div>

                  {/* Uptime bar */}
                  <div className="w-full space-y-1.5">
                    <div className="w-full bg-secondary/40 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-green-500 transition-all duration-700"
                        style={{ width: total > 0 ? `${Math.round((online / total) * 100)}%` : '0%' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {total > 0 ? Math.round((online / total) * 100) : 0}% uptime estimated
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Org summary stat row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {SUMMARY.map((s, i) => (
          <div key={s.label} className="glass-card p-5 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform duration-200">
            <div className="mb-2 p-3 rounded-full bg-blue-50/50 group-hover:bg-blue-50 transition-colors">
              {s.icon}
            </div>
            <div className="text-3xl font-bold text-foreground tracking-tight mb-1">
              {s.value}
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: Tool cards grid ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Layers className="text-blue-500" size={20} />
              Platform Tools
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TOOLS.map((tool, index) => {
                const hovered = hoveredTool === tool.id;
                const delayClass = index < 5 ? `delay-${(index + 1) * 100}` : '';
                return (
                  <button
                    key={tool.id}
                    onClick={() => onSelectMode(tool.id)}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                    className={cn(
                      "group relative flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-300 border border-transparent animate-fade-in-up backwards",
                      delayClass,
                      hovered ? "bg-white/60 shadow-md scale-[1.02] border-white/40" : "bg-white/20 hover:bg-white/40 border-white/20"
                    )}
                    style={{ animationFillMode: 'both' }}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-all duration-200 bg-gradient-to-br",
                      tool.gradient,
                      hovered ? "shadow-lg scale-110" : ""
                    )}>
                      {tool.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                        {tool.label}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: Connected Organizations ──────────────────────────── */}
        <div className="flex flex-col gap-6">

          <div className="glass-card overflow-hidden flex flex-col h-full max-h-[600px]">
            {/* Card header */}
            <div className="p-4 border-b border-border/40 bg-white/40 backdrop-blur-sm flex items-center justify-between">
              <div className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Building2 size={16} className="text-muted-foreground" />
                Organizations
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    isSyncing
                      ? "bg-secondary text-muted-foreground cursor-not-allowed"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  )}
                >
                  <RefreshCw
                    size={12}
                    className={cn(isSyncing && "animate-spin")}
                  />
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </button>
              </div>
            </div>

            {/* Org rows — real data */}
            <div className="overflow-y-auto p-2 space-y-1 flex-1">
              {connectedOrgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Building2 size={24} className="text-muted-foreground/50" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">No organizations</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Add a Meraki organization to start managing your networks.
                  </p>
                  <button
                    onClick={() => onSelectMode('organizations')}
                    className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Connect Now
                  </button>
                </div>
              ) : (
                connectedOrgs.map((org, i) => {
                  const regionKey = org.meraki_region ?? 'com';
                  const regionLabel = REGION_LABEL[regionKey] ?? regionKey.toUpperCase();
                  const regionClass = REGION_STYLES[regionKey] ?? REGION_STYLES.com;

                  return (
                    <div
                      key={org.id}
                      className="p-3 rounded-lg hover:bg-white/60 transition-colors border border-transparent hover:border-white/40 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                          {org.meraki_org_name}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          <Wifi size={8} /> Active
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md", regionClass)}>
                          <Globe size={10} /> {regionLabel}
                        </span>
                        {org.device_count != null && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                            <span className="font-semibold text-foreground">{org.device_count}</span> devices
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Synced {formatSync(org.last_synced_at)}</span>
                        {/* <button className="opacity-0 group-hover:opacity-100 text-blue-600 hover:underline flex items-center gap-0.5 transition-opacity">
                                            Manage <ChevronRight size={10} />
                                        </button> */}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-border/40 bg-white/40 backdrop-blur-sm">
              <button
                onClick={() => onSelectMode('organizations')}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-blue-300/50 bg-blue-50/30 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
              >
                <Plus size={14} /> Add Organization
              </button>
            </div>
          </div>

          {/* ── Date strip ─────────────────────────────────────────────── */}
          <div className="glass-card px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">{formatDate()}</span>
            <span className="opacity-70">v1.0.0</span>
          </div>

        </div>
      </div>

    </div>
  );
};
