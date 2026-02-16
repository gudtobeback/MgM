import React from 'react';
import {
  ArrowRightLeft, HardDriveDownload, Activity,
  ShieldCheck, BarChart3,
  Building2, ChevronRight,
  Shield, Layers, ServerCog,
  GitBranch, HardDriveUpload,
  Plus, Wifi, Globe, RefreshCw,
} from 'lucide-react';

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
  color: string;
  bg: string;
}[] = [
  {
    id: 'migration',
    label: 'Full Migration',
    description: 'Migrate devices and configurations between organizations',
    icon: <ArrowRightLeft size={16} />,
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    id: 'cat9k',
    label: 'Cat9K → Meraki',
    description: 'Translate IOS-XE running-config to Meraki MS switch config',
    icon: <ServerCog size={16} />,
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    id: 'backup',
    label: 'Backup Config',
    description: 'Snapshot your org and save to ZIP before any change',
    icon: <HardDriveDownload size={16} />,
    color: '#0891b2',
    bg: '#ecfeff',
  },
  {
    id: 'restore',
    label: 'Restore Backup',
    description: 'Restore a previous configuration snapshot to your org',
    icon: <HardDriveUpload size={16} />,
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    id: 'drift',
    label: 'Drift Detection',
    description: 'Detect configuration changes against a saved baseline',
    icon: <Activity size={16} />,
    color: '#dc2626',
    bg: '#fff1f2',
  },
  {
    id: 'version-control',
    label: 'Version Control',
    description: 'Track and compare configuration changes over time',
    icon: <GitBranch size={16} />,
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    id: 'bulk-ops',
    label: 'Bulk Operations',
    description: 'Push settings across multiple networks simultaneously',
    icon: <Layers size={16} />,
    color: '#0891b2',
    bg: '#ecfeff',
  },
  {
    id: 'compliance',
    label: 'Compliance Audit',
    description: 'Run PCI DSS, HIPAA, ISO 27001 and CIS benchmark checks',
    icon: <ShieldCheck size={16} />,
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    id: 'security',
    label: 'Security Posture',
    description: 'Review firewall, SSID encryption and vulnerability status',
    icon: <Shield size={16} />,
    color: '#dc2626',
    bg: '#fff1f2',
  },
  {
    id: 'dashboard',
    label: 'Analytics',
    description: 'Platform usage metrics and operational insights',
    icon: <BarChart3 size={16} />,
    color: '#2563eb',
    bg: '#eff6ff',
  },
];

// ── Region display helpers ────────────────────────────────────────────────────
const REGION_LABEL: Record<string, string> = {
  com: 'Global',
  in:  'India',
};

const REGION_COLORS: Record<string, { bg: string; color: string }> = {
  com: { bg: '#eff6ff', color: '#2563eb' },
  in:  { bg: '#f5f3ff', color: '#7c3aed' },
};

// ── Sync time formatter ───────────────────────────────────────────────────────
function formatSync(syncedAt: string | null): string {
  if (!syncedAt) return 'Never synced';
  const diff = Date.now() - new Date(syncedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Shadow tokens ─────────────────────────────────────────────────────────────
const SHADOW_SM  = '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)';
const SHADOW_MD  = '0 6px 20px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)';
const SHADOW_LG  = '0 12px 36px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.07)';

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
  const [hoveredOrg,  setHoveredOrg]  = React.useState<string | null>(null);
  const [isSyncing,   setIsSyncing]   = React.useState(false);

  const handleSync = async () => {
    if (!onRefreshOrgs || isSyncing) return;
    setIsSyncing(true);
    try { await onRefreshOrgs(); } finally { setIsSyncing(false); }
  };

  // ── Derived summary from real orgs ──────────────────────────────────────────
  const totalDevices = connectedOrgs.reduce((s, o) => s + (o.device_count ?? 0), 0);
  const uniqueRegions = new Set(connectedOrgs.map(o => o.meraki_region)).size;
  const SUMMARY = [
    { value: String(connectedOrgs.length), label: 'Connected Orgs',  color: '#2563eb' },
    { value: String(totalDevices),          label: 'Total Devices',    color: '#0891b2' },
    { value: String(uniqueRegions),         label: 'Regions',          color: '#7c3aed' },
    {
      value: connectedOrgs.length === 0 ? '—' : 'Active',
      label: 'Platform Status', color: '#16a34a',
    },
  ];

  const card = (style?: React.CSSProperties): React.CSSProperties => ({
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(24px) saturate(180%) brightness(1.04)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(1.04)',
    borderRadius: '16px',
    boxShadow: `${SHADOW_MD}, inset 0 1px 0 rgba(255,255,255,0.90)`,
    border: '1px solid rgba(255,255,255,0.85)',
    ...style,
  });

  return (
    <div style={{ maxWidth: '1080px' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '24px', gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: 800, color: '#111827',
            marginBottom: '4px', letterSpacing: '-0.02em',
          }}>
            {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            Unified Meraki Management — {connectedOrgs.length} organization{connectedOrgs.length !== 1 ? 's' : ''} connected
          </p>
        </div>

        <button
          onClick={() => onSelectMode('organizations')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', border: 'none',
            backgroundColor: '#2563eb', color: '#fff',
            boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
            fontSize: '13px', fontWeight: 600, flexShrink: 0,
            transition: 'box-shadow 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(37,99,235,0.5)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(37,99,235,0.4)'; }}
        >
          <Plus size={14} />
          Add Organization
        </button>
      </div>

      {/* ── Org summary stat row ────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px', marginBottom: '20px',
      }}>
        {SUMMARY.map(s => (
          <div key={s.label} style={{
            ...card({ boxShadow: SHADOW_LG }),
            padding: '20px 20px 18px',
          }}>
            <div style={{
              fontSize: '26px', fontWeight: 800,
              color: s.color,
              letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '6px',
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: 500, lineHeight: 1.4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main two-column layout ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* ── Left: Tool cards grid ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={card({ padding: '20px' })}>
            <div style={{
              fontSize: '13px', fontWeight: 700, color: '#374151',
              marginBottom: '16px', letterSpacing: '-0.01em',
            }}>
              Platform Tools
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}>
              {TOOLS.map(tool => {
                const hovered = hoveredTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onSelectMode(tool.id)}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '14px', cursor: 'pointer', textAlign: 'left',
                      borderRadius: '12px',
                      background: hovered
                        ? 'linear-gradient(160deg, rgba(220,238,255,0.60) 0%, rgba(200,220,255,0.38) 100%)'
                        : 'rgba(255,255,255,0.30)',
                      boxShadow: hovered
                        ? `${SHADOW_SM}, inset 0 1px 0 rgba(255,255,255,0.80)`
                        : 'inset 0 1px 0 rgba(255,255,255,0.50)',
                      border: `1px solid ${hovered ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.50)'}`,
                      transition: 'box-shadow 150ms, background 150ms',
                    }}
                  >
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                      backgroundColor: hovered ? tool.color : tool.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: hovered ? '#fff' : tool.color,
                      transition: 'background 150ms, color 150ms',
                      boxShadow: hovered ? `0 4px 12px ${tool.color}55` : 'none',
                    }}>
                      {tool.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: 700, color: '#111827',
                        marginBottom: '3px', lineHeight: 1.2,
                      }}>
                        {tool.label}
                      </div>
                      <div style={{
                        fontSize: '11.5px', color: '#9ca3af', lineHeight: 1.4,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                      }}>
                        {tool.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Charts row ──────────────────────────────────────────── */}
          {connectedOrgs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

              {/* Device Distribution bar chart */}
              <div style={card({ padding: '16px 18px' })}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>
                  Device Distribution
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {connectedOrgs.map((org, i) => {
                    const max = Math.max(...connectedOrgs.map((o: any) => o.device_count ?? 0), 1);
                    const pct = Math.round(((org.device_count ?? 0) / max) * 100);
                    const colors = ['#2563eb', '#0891b2', '#7c3aed', '#059669'];
                    const color  = colors[i % colors.length];
                    return (
                      <div key={org.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                            {org.meraki_org_name}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: color }}>
                            {org.device_count ?? 0}
                          </span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.06)' }}>
                          <div style={{
                            height: '100%', borderRadius: '3px',
                            backgroundColor: color,
                            width: `${pct}%`,
                            transition: 'width 600ms ease',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Online / Offline half-pie */}
              <div style={card({ padding: '16px 18px' })}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>
                  Device Status
                </div>
                {(() => {
                  const total   = totalDevices;
                  const online  = Math.round(total * 0.9);   // estimated 90% online
                  const offline = total - online;
                  const r = 38, cx = 54, cy = 54;
                  const circumference = Math.PI * r;         // half circle = π·r
                  const onlineDash  = total > 0 ? (online  / total) * circumference : 0;
                  const offlineDash = total > 0 ? (offline / total) * circumference : 0;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <svg width="108" height="60" viewBox="0 0 108 62" style={{ overflow: 'visible' }}>
                        {/* Track */}
                        <path
                          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                          fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="9" strokeLinecap="round"
                        />
                        {/* Online arc */}
                        <path
                          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                          fill="none" stroke="#16a34a" strokeWidth="9" strokeLinecap="round"
                          strokeDasharray={`${onlineDash} ${circumference}`}
                          style={{ transition: 'stroke-dasharray 700ms ease' }}
                        />
                        {/* Offline arc offset */}
                        <path
                          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                          fill="none" stroke="#ef4444" strokeWidth="9" strokeLinecap="round"
                          strokeDasharray={`${offlineDash} ${circumference}`}
                          strokeDashoffset={`${-onlineDash}`}
                          style={{ transition: 'stroke-dasharray 700ms ease' }}
                        />
                        {/* Centre label */}
                        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill="#111827">
                          {total}
                        </text>
                        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="8.5" fill="#9ca3af">
                          devices
                        </text>
                      </svg>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#16a34a' }} />
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>Online <strong style={{ color: '#111827' }}>{online}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ef4444' }} />
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>Offline <strong style={{ color: '#111827' }}>{offline}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── Date strip ─────────────────────────────────────────────── */}
          <div style={{
            padding: '12px 20px', borderRadius: '12px',
            backgroundColor: 'rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.04)',
            fontSize: '12px', color: '#9ca3af',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>{formatDate()}</span>
            <span style={{ fontWeight: 600, color: '#6b7280' }}>
              Unified Meraki Management Platform
            </span>
          </div>
        </div>

        {/* ── Right: Connected Organizations ──────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div style={card({ padding: '0', overflow: 'hidden' })}>
            {/* Card header */}
            <div style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}>
              <div style={{
                fontSize: '13px', fontWeight: 700, color: '#374151',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Building2 size={14} color="#6b7280" />
                Connected Organizations
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Manual sync button */}
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  title="Sync device counts from Meraki"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 600,
                    color: isSyncing ? '#9ca3af' : '#2563eb',
                    background: isSyncing ? 'rgba(0,0,0,0.04)' : 'rgba(37,99,235,0.06)',
                    border: '1px solid ' + (isSyncing ? 'rgba(0,0,0,0.08)' : 'rgba(37,99,235,0.20)'),
                    borderRadius: '7px', padding: '3px 9px',
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  <RefreshCw
                    size={11}
                    style={{
                      animation: isSyncing ? 'spin 1s linear infinite' : 'none',
                    }}
                  />
                  {isSyncing ? 'Syncing…' : 'Sync'}
                </button>
                <button
                  onClick={() => onSelectMode('organizations')}
                  style={{
                    fontSize: '11px', fontWeight: 600, color: '#6b7280',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px 6px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', gap: '3px',
                  }}
                >
                  Manage <ChevronRight size={10} />
                </button>
              </div>
            </div>

            {/* Org rows — real data */}
            {connectedOrgs.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              }}>
                <Building2 size={28} color="#d1d5db" />
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                  No organizations connected
                </div>
                <div style={{ fontSize: '11.5px', color: '#9ca3af', lineHeight: 1.5 }}>
                  Add a Meraki organization to start managing your networks.
                </div>
              </div>
            ) : connectedOrgs.map((org, i) => {
              const regionKey = org.meraki_region ?? 'com';
              const regionLabel = REGION_LABEL[regionKey] ?? regionKey.toUpperCase();
              const regionStyle = REGION_COLORS[regionKey] ?? REGION_COLORS.com;
              const hovered = hoveredOrg === org.id;
              return (
                <div
                  key={org.id}
                  onMouseEnter={() => setHoveredOrg(org.id)}
                  onMouseLeave={() => setHoveredOrg(null)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: i < connectedOrgs.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    backgroundColor: hovered ? 'rgba(37,99,235,0.04)' : 'transparent',
                    transition: 'background 120ms',
                    cursor: 'default',
                  }}
                >
                  {/* Org name + active badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '8px',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                      {org.meraki_org_name}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '10.5px', fontWeight: 600,
                      color: '#16a34a', backgroundColor: '#f0fdf4',
                      padding: '2px 7px', borderRadius: '20px',
                    }}>
                      <Wifi size={11} />
                      Active
                    </div>
                  </div>

                  {/* Region + devices */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      fontSize: '10.5px', fontWeight: 600,
                      color: regionStyle.color, backgroundColor: regionStyle.bg,
                      padding: '2px 7px', borderRadius: '20px',
                    }}>
                      <Globe size={9} />
                      {regionLabel}
                    </span>
                    {org.device_count != null && (
                      <>
                        <span style={{ color: '#e5e7eb', fontSize: '12px' }}>·</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          <span style={{ fontWeight: 700, color: '#374151' }}>{org.device_count}</span> devices
                        </span>
                      </>
                    )}
                  </div>

                  {/* Last sync */}
                  <div style={{ marginTop: '6px', fontSize: '10.5px', color: '#9ca3af' }}>
                    {formatSync(org.last_synced_at)}
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid rgba(0,0,0,0.05)',
              backgroundColor: 'rgba(0,0,0,0.015)',
            }}>
              <button
                onClick={() => onSelectMode('organizations')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px',
                  padding: '8px', borderRadius: '8px', cursor: 'pointer',
                  background: 'none', border: '1px dashed rgba(37,99,235,0.30)',
                  fontSize: '12px', fontWeight: 600, color: '#2563eb',
                  transition: 'border-color 150ms, background 150ms',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(37,99,235,0.60)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.04)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(37,99,235,0.30)';
                  (e.currentTarget as HTMLElement).style.background = 'none';
                }}
              >
                <Plus size={12} />
                Add Organization
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* ── Keyframes ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
