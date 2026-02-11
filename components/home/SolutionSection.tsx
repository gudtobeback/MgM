import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

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
    <section style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }} id="features">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block', padding: '3px 10px',
            border: '1px solid #d1d5db', borderRadius: '4px',
            fontSize: '11px', fontWeight: 600, color: '#6b7280',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px',
          }}>
            The Solution
          </div>
          <h2 style={{
            fontSize: '32px', fontWeight: 700, color: '#111827',
            lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '12px',
          }}>
            Automated migration that just works.
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.65, maxWidth: '560px' }}>
            Everything the manual process gets wrong, this platform does automatically — with a full backup,
            staged rollback, and cross-region support built in.
          </p>
        </div>

        {/* Comparison table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <div style={{
              padding: '12px 20px',
              fontSize: '11px', fontWeight: 600, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Capability
            </div>
            <div style={{
              padding: '12px 20px',
              fontSize: '11px', fontWeight: 600, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              borderLeft: '1px solid #e5e7eb',
            }}>
              Manual process
            </div>
            <div style={{
              padding: '12px 20px',
              fontSize: '11px', fontWeight: 600, color: '#048a24',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              borderLeft: '1px solid #e5e7eb',
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
                borderBottom: i < COMPARISON.length - 1 ? '1px solid #f0f1f3' : 'none',
                backgroundColor: row.highlight ? '#f0faf2' : '#ffffff',
              }}
            >
              {/* Feature name */}
              <div style={{
                padding: '16px 20px',
                fontSize: '13px', fontWeight: 600, color: '#111827',
              }}>
                {row.feature}
              </div>

              {/* Manual */}
              <div style={{
                padding: '16px 20px',
                borderLeft: '1px solid #f0f1f3',
                display: 'flex', alignItems: 'flex-start', gap: '8px',
              }}>
                <XCircle size={14} color="#d1d5db" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>
                  {row.manual}
                </span>
              </div>

              {/* Automated */}
              <div style={{
                padding: '16px 20px',
                borderLeft: '1px solid #f0f1f3',
                display: 'flex', alignItems: 'flex-start', gap: '8px',
              }}>
                <CheckCircle2 size={14} color="#048a24" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{
                  fontSize: '13px', lineHeight: 1.5,
                  color: row.highlight ? '#025115' : '#374151',
                  fontWeight: row.highlight ? 600 : 400,
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
