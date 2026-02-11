import React from 'react';
import {
  ArrowRightLeft, HardDriveDownload, Activity,
  ShieldCheck, BarChart3,
  Building2, ChevronRight,
  MoveRight, Network, Shield, Settings2,
  CheckCircle2, Circle, Layers, ServerCog,
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
}

// ── Quick access items ──────────────────────────────────────────────
const QUICK_ACCESS: { id: ToolMode; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'migration', label: 'Full Migration',       description: 'Migrate devices and configurations between organizations',   icon: <ArrowRightLeft size={14} /> },
  { id: 'cat9k',    label: 'Cat9K → Meraki',       description: 'Translate IOS-XE running-config to Meraki MS switch config', icon: <ServerCog size={14} /> },
  { id: 'backup',    label: 'Backup Configuration', description: 'Snapshot your org and save to ZIP before any change',        icon: <HardDriveDownload size={14} /> },
  { id: 'drift',     label: 'Drift Detection',      description: 'Detect configuration changes against a saved baseline',      icon: <Activity size={14} /> },
  { id: 'bulk-ops',  label: 'Bulk Operations',       description: 'Push settings across multiple networks simultaneously',      icon: <Layers size={14} /> },
  { id: 'compliance',label: 'Compliance Audit',      description: 'Run PCI DSS, HIPAA, and CIS benchmark checks',              icon: <ShieldCheck size={14} /> },
  { id: 'dashboard', label: 'Analytics',             description: 'Platform usage metrics and operational insights',           icon: <BarChart3 size={14} /> },
];

// ── Platform section summary ────────────────────────────────────────
const PLATFORM_SECTIONS = [
  { label: 'Migration',             count: 3, icon: <MoveRight size={13} /> },
  { label: 'Network Management',    count: 4, icon: <Network size={13} /> },
  { label: 'Security & Compliance', count: 3, icon: <Shield size={13} /> },
  { label: 'Operations',            count: 3, icon: <Settings2 size={13} /> },
];

// ── Getting started checklist ───────────────────────────────────────
const CHECKLIST = [
  { label: 'Connect your Meraki organization', mode: 'organizations' as ToolMode },
  { label: 'Run a configuration backup',       mode: 'backup'        as ToolMode },
  { label: 'Launch your first migration',      mode: 'migration'     as ToolMode },
  { label: 'Set up drift detection baseline',  mode: 'drift'         as ToolMode },
];

// ── Stats ───────────────────────────────────────────────────────────
const STATS = [
  { value: '13',     label: 'Platform tools' },
  { value: '50+',    label: 'Config categories' },
  { value: '~10 min', label: 'Avg migration time' },
  { value: '99.9%',  label: 'Migration success rate' },
];

// ── Helpers ─────────────────────────────────────────────────────────
function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Main component ──────────────────────────────────────────────────
export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  onSelectMode,
  selectedOrgName,
  userEmail,
}) => {
  const firstName = userEmail ? userEmail.split('@')[0] : null;
  const [qaHovered, setQaHovered] = React.useState<string | null>(null);
  const [clHovered, setClHovered] = React.useState<string | null>(null);

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{
            fontSize: '20px', fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '3px', letterSpacing: '-0.01em',
          }}>
            {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Cisco Meraki Management Platform
            {selectedOrgName && (
              <span style={{ color: '#048a24', fontWeight: 500 }}> · {selectedOrgName}</span>
            )}
          </p>
        </div>
        <div style={{
          fontSize: '12px', color: 'var(--color-text-tertiary)',
          paddingTop: '4px', whiteSpace: 'nowrap',
        }}>
          {formatDate()}
        </div>
      </div>

      {/* ── Org connect banner ──────────────────────────────────── */}
      {!selectedOrgName && (
        <button
          onClick={() => onSelectMode('organizations')}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '14px 18px', marginBottom: '24px',
            backgroundColor: '#f0faf2',
            border: '1px solid #bbdfc4', borderRadius: '6px',
            cursor: 'pointer', textAlign: 'left', transition: 'background 120ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#e0f5e4'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f0faf2'; }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '6px',
            backgroundColor: '#e8f5eb', border: '1px solid #bbdfc4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Building2 size={15} color="#048a24" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#025115', marginBottom: '2px' }}>
              Connect your Meraki organization
            </div>
            <div style={{ fontSize: '12px', color: '#048a24' }}>
              Add an API key to unlock migrations, backups, compliance audits, and all platform tools.
            </div>
          </div>
          <ChevronRight size={14} color="#048a24" style={{ flexShrink: 0 }} />
        </button>
      )}

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '24px',
      }}>
        {STATS.map(s => (
          <div
            key={s.label}
            style={{
              border: '1px solid var(--color-border-primary)',
              borderRadius: '6px',
              padding: '16px 18px',
              backgroundColor: 'var(--color-bg-primary)',
            }}
          >
            <div style={{
              fontSize: '22px', fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '4px',
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom two-column ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* Left — Quick access */}
        <div style={{
          border: '1px solid var(--color-border-primary)',
          borderRadius: '6px', overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 16px',
            backgroundColor: 'var(--color-bg-secondary)',
            borderBottom: '1px solid var(--color-border-primary)',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
            textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)',
          }}>
            Quick Access
          </div>

          {QUICK_ACCESS.map((item, i) => {
            const hovered = qaHovered === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                onMouseEnter={() => setQaHovered(item.id)}
                onMouseLeave={() => setQaHovered(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  width: '100%', padding: '12px 16px',
                  backgroundColor: hovered ? 'var(--color-bg-secondary)' : 'transparent',
                  border: 'none',
                  borderBottom: i < QUICK_ACCESS.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 100ms',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '5px', flexShrink: 0,
                  backgroundColor: hovered ? '#e8f5eb' : 'var(--color-bg-secondary)',
                  border: `1px solid ${hovered ? '#bbdfc4' : 'var(--color-border-subtle)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: hovered ? '#048a24' : 'var(--color-text-secondary)',
                  transition: 'background 100ms, border-color 100ms, color 100ms',
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 600, marginBottom: '2px',
                    color: hovered ? '#048a24' : 'var(--color-text-primary)',
                    transition: 'color 100ms',
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {item.description}
                  </div>
                </div>
                <ChevronRight size={13} style={{
                  color: '#048a24', flexShrink: 0,
                  opacity: hovered ? 0.7 : 0, transition: 'opacity 100ms',
                }} />
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Platform sections overview */}
          <div style={{
            border: '1px solid var(--color-border-primary)',
            borderRadius: '6px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 16px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderBottom: '1px solid var(--color-border-primary)',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
              textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)',
            }}>
              Platform
            </div>
            {PLATFORM_SECTIONS.map((sec, i) => (
              <div
                key={sec.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 16px',
                  borderBottom: i < PLATFORM_SECTIONS.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  backgroundColor: 'var(--color-bg-primary)',
                }}
              >
                <span style={{ color: '#048a24', display: 'flex', flexShrink: 0 }}>{sec.icon}</span>
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {sec.label}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'var(--color-text-tertiary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '4px', padding: '1px 7px',
                }}>
                  {sec.count} tools
                </span>
              </div>
            ))}
          </div>

          {/* Getting started checklist */}
          <div style={{
            border: '1px solid var(--color-border-primary)',
            borderRadius: '6px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 16px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderBottom: '1px solid var(--color-border-primary)',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
              textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)',
            }}>
              Getting Started
            </div>
            {CHECKLIST.map((item, i) => {
              const done = item.mode === 'organizations' && !!selectedOrgName;
              const hovered = clHovered === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => onSelectMode(item.mode)}
                  onMouseEnter={() => setClHovered(item.mode)}
                  onMouseLeave={() => setClHovered(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '10px 16px', border: 'none',
                    borderBottom: i < CHECKLIST.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                    backgroundColor: hovered ? 'var(--color-bg-secondary)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 100ms',
                  }}
                >
                  {done
                    ? <CheckCircle2 size={14} color="#048a24" style={{ flexShrink: 0 }} />
                    : <Circle size={14} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
                  }
                  <span style={{
                    fontSize: '12px', flex: 1,
                    color: done ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                    textDecoration: done ? 'line-through' : 'none',
                    fontWeight: done ? 400 : 500,
                  }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

    </div>
  );
};
