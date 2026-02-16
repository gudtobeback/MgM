import React from 'react';

const SHADOW_LG  = '0 12px 36px rgba(0,0,0,0.11), 0 4px 10px rgba(0,0,0,0.06)';
const GLASS      = { background: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', border: '1px solid rgba(255,255,255,0.85)' } as const;

const PROBLEMS = [
  {
    num: '01',
    title: 'No Native Migration Support',
    description:
      'Cisco Meraki provides zero built-in tooling to migrate devices between dashboard regions or organizations. Every step must be executed manually — in the correct order.',
    stat: '0',
    statLabel: 'built-in migration tools',
    accent: '#dc2626',
    accentBg: '#fef2f2',
  },
  {
    num: '02',
    title: 'High Risk of Configuration Loss',
    description:
      'Manual migration involves dozens of API calls and dashboard steps per device. A single mistake with VLANs, firewall rules, SSIDs, or RADIUS configs can silently break your network.',
    stat: '1 error',
    statLabel: 'can mean full network outage',
    accent: '#d97706',
    accentBg: '#fffbeb',
  },
  {
    num: '03',
    title: 'Extremely Time-Consuming at Scale',
    description:
      'Migrating 20 devices manually takes an entire work day. For 100+ devices, it becomes a multi-day project requiring full administrator focus and careful sequencing across both dashboards.',
    stat: '8–12 hrs',
    statLabel: 'per 20-device migration',
    accent: '#7c3aed',
    accentBg: '#f5f3ff',
  },
  {
    num: '04',
    title: 'Requires Deep API Expertise',
    description:
      'A correct manual migration demands knowledge of Meraki API ordering rules, claim/unclaim propagation delays, rate limits, and per-config restore sequences — knowledge most teams don\'t have.',
    stat: '50+',
    statLabel: 'manual steps per network',
    accent: '#0891b2',
    accentBg: '#ecfeff',
  },
];

export function ProblemSection() {
  return (
    <section style={{ backgroundColor: 'rgb(226, 238, 251)', paddingBottom: '0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            backgroundColor: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '100px',
            fontSize: '11px', fontWeight: 600, color: '#991b1b',
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dc2626', flexShrink: 0 }} />
            The Problem
          </div>
          <h2 style={{
            fontSize: '34px', fontWeight: 800, color: '#0f172a',
            lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: '12px',
          }}>
            Why manual Meraki migration fails every time.
          </h2>
          <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.7, maxWidth: '560px' }}>
            There is no native migration path in Cisco Meraki. This is what every network team
            faces when attempting it without dedicated tooling.
          </p>
        </div>

        {/* Problem cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {PROBLEMS.map((p) => (
            <div
              key={p.num}
              style={{
                ...GLASS,
                borderRadius: '16px',
                boxShadow: SHADOW_LG,
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Top row: number + stat */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '8px',
                  backgroundColor: p.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: p.accent,
                  flexShrink: 0,
                }}>
                  {p.num}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '22px', fontWeight: 800, color: p.accent,
                    letterSpacing: '-0.02em', lineHeight: 1,
                  }}>
                    {p.stat}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px', lineHeight: 1.3 }}>
                    {p.statLabel}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                {p.title}
              </div>

              {/* Description */}
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.75, flex: 1 }}>
                {p.description}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
