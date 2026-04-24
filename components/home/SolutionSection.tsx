import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const SHADOW_LG  = '0 12px 36px rgba(0,0,0,0.11), 0 4px 10px rgba(0,0,0,0.06)';
const SHADOW_XL  = '0 20px 60px rgba(0,0,0,0.14), 0 6px 16px rgba(0,0,0,0.07)';
const GLASS      = { background: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', border: '1px solid rgba(255,255,255,0.85)' } as const;

const COMPARISON = [
  {
    feature: 'Device unclaim and reclaim',
    manual: 'Manual API calls per device',
    automated: 'Fully automated in sequence',
  },
  {
    feature: 'Pre-migration backup',
    manual: 'Not performed — no safety net',
    automated: 'Full org snapshot saved as ZIP',
  },
  {
    feature: 'VLANs, SSIDs, firewall rules',
    manual: 'Manual re-entry in destination dashboard',
    automated: 'Auto-restored from backup data',
  },
  {
    feature: 'RADIUS and switch access policies',
    manual: 'Easily missed — no checklist',
    automated: 'Transferred in pre-config phase',
  },
  {
    feature: 'Cross-region support',
    manual: 'No native path — error-prone',
    automated: 'Built-in: Global, India, Canada, China + more',
  },
  {
    feature: 'Rollback on failure',
    manual: 'Manual — if you know where to start',
    automated: 'Stage-by-stage rollback with one click',
  },
  {
    feature: 'Time for 20 devices',
    manual: '8–12 hours',
    automated: '~10 minutes',
    highlight: true,
  },
];

export function SolutionSection() {
  return (
    <section style={{ backgroundColor: 'rgb(226, 238, 251)' }} id="features">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            backgroundColor: '#e8f5eb', border: '1px solid #bbdfc4',
            borderRadius: '100px',
            fontSize: '11px', fontWeight: 600, color: '#025115',
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', flexShrink: 0 }} />
            The Solution
          </div>
          <h2 style={{
            fontSize: '34px', fontWeight: 800, color: '#0f172a',
            lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: '12px',
          }}>
            Automated migration that just works.
          </h2>
          <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.7, maxWidth: '580px' }}>
            Everything the manual process gets wrong, this platform does automatically — with a full backup,
            staged rollback, and cross-region support built in.
          </p>
        </div>

        {/* Comparison table — raised card */}
        <div style={{
          ...GLASS,
          borderRadius: '20px',
          boxShadow: SHADOW_XL,
          overflow: 'hidden',
        }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #f0f1f3',
          }}>
            <div style={{
              padding: '14px 24px',
              fontSize: '11px', fontWeight: 700, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Capability
            </div>
            <div style={{
              padding: '14px 24px',
              fontSize: '11px', fontWeight: 700, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              borderLeft: '1px solid #f0f1f3',
            }}>
              Manual process
            </div>
            <div style={{
              padding: '14px 24px',
              fontSize: '11px', fontWeight: 700, color: '#2563eb',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              borderLeft: '1px solid #f0f1f3',
            }}>
              Meraki Management
            </div>
          </div>

          {/* Rows */}
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                borderBottom: i < COMPARISON.length - 1 ? '1px solid #f8f9fb' : 'none',
                backgroundColor: row.highlight ? '#f0faf2' : '#ffffff',
              }}
            >
              {/* Feature name */}
              <div style={{
                padding: '18px 24px',
                fontSize: '13px', fontWeight: 600, color: '#111827',
              }}>
                {row.feature}
              </div>

              {/* Manual */}
              <div style={{
                padding: '18px 24px',
                borderLeft: '1px solid #f8f9fb',
                display: 'flex', alignItems: 'flex-start', gap: '8px',
              }}>
                <XCircle size={14} color="#fca5a5" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>
                  {row.manual}
                </span>
              </div>

              {/* Automated */}
              <div style={{
                padding: '18px 24px',
                borderLeft: '1px solid #f8f9fb',
                display: 'flex', alignItems: 'flex-start', gap: '8px',
              }}>
                <CheckCircle2 size={14} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{
                  fontSize: '13px', lineHeight: 1.5,
                  color: row.highlight ? '#025115' : '#374151',
                  fontWeight: row.highlight ? 700 : 400,
                }}>
                  {row.automated}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
