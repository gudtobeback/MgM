import React from 'react';

const PROBLEMS = [
  {
    num: '01',
    title: 'No Native Migration Support',
    description:
      'Cisco Meraki provides zero built-in tooling to migrate devices between dashboard regions or organizations. Every step must be executed manually via the API or dashboard UI — in the correct order.',
    stat: '0',
    statLabel: 'built-in migration tools',
  },
  {
    num: '02',
    title: 'High Risk of Configuration Loss',
    description:
      'Manual migration involves dozens of API calls and dashboard steps per device. A single mistake with VLANs, firewall rules, SSIDs, or RADIUS configs can silently misconfigure your network with no automatic rollback.',
    stat: '1 error',
    statLabel: 'can mean full network outage',
  },
  {
    num: '03',
    title: 'Extremely Time-Consuming at Scale',
    description:
      'Migrating 20 devices manually takes an entire work day. For 100+ devices, it becomes a multi-day project requiring full administrator focus and careful sequencing across both dashboards simultaneously.',
    stat: '8–12 hrs',
    statLabel: 'per 20-device migration',
  },
  {
    num: '04',
    title: 'Requires Deep API Expertise',
    description:
      'A correct manual migration demands knowledge of Meraki API ordering rules, claim/unclaim propagation delays, rate limits, and per-config restore sequences — knowledge most network teams simply don\'t have.',
    stat: '50+',
    statLabel: 'manual steps per network',
  },
];

export function ProblemSection() {
  return (
    <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px' }}>

        {/* Header — left aligned, matches Hero label style */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block', padding: '3px 10px',
            border: '1px solid #d1d5db', borderRadius: '4px',
            fontSize: '11px', fontWeight: 600, color: '#6b7280',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px',
          }}>
            The Problem
          </div>
          <h2 style={{
            fontSize: '32px', fontWeight: 700, color: '#111827',
            lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '12px',
          }}>
            Why manual Meraki migration fails every time.
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.65, maxWidth: '540px' }}>
            There is no native migration path in Cisco Meraki. This is what every network team
            faces when attempting it without dedicated tooling.
          </p>
        </div>

        {/* Problem rows — structured table style */}
        <div style={{ borderTop: '1px solid #e5e7eb' }}>
          {PROBLEMS.map((p) => (
            <div
              key={p.num}
              style={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr 180px',
                gap: '32px',
                alignItems: 'start',
                padding: '28px 0',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              {/* Row number */}
              <div style={{
                fontSize: '13px', fontWeight: 600, color: '#d1d5db',
                paddingTop: '2px', fontVariantNumeric: 'tabular-nums',
              }}>
                {p.num}
              </div>

              {/* Title + description */}
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.7 }}>
                  {p.description}
                </div>
              </div>

              {/* Impact metric — right column */}
              <div style={{ textAlign: 'right', paddingTop: '2px' }}>
                <div style={{
                  fontSize: '20px', fontWeight: 700, color: '#111827',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>
                  {p.stat}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', lineHeight: 1.4 }}>
                  {p.statLabel}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
