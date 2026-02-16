import React from 'react';

const SHADOW_LG  = '0 12px 36px rgba(0,0,0,0.11), 0 4px 10px rgba(0,0,0,0.06)';
const SHADOW_XL  = '0 20px 60px rgba(0,0,0,0.14), 0 6px 16px rgba(0,0,0,0.07)';
const GLASS      = { background: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', border: '1px solid rgba(255,255,255,0.85)' } as const;

const STEPS = [
  {
    num: '01',
    title: 'Connect your source dashboard',
    description: 'Select a Meraki region and enter your API key for the organization you want to migrate from. Supports Global, India, Canada, China, and custom endpoints.',
    color: '#2563eb', bg: '#eff6ff',
  },
  {
    num: '02',
    title: 'Connect your destination dashboard',
    description: 'Configure the target region and API key. The wizard validates both connections before allowing you to proceed.',
    color: '#7c3aed', bg: '#f5f3ff',
  },
  {
    num: '03',
    title: 'Select devices and review',
    description: 'Browse your source organization\'s inventory. Select the devices to migrate. The review screen shows a full summary before any change is made.',
    color: '#0891b2', bg: '#ecfeff',
  },
  {
    num: '04',
    title: 'Automatic pre-migration backup',
    description: 'The platform snapshots your source organization — VLANs, firewall rules, SSIDs, RADIUS, group policies, RF profiles — and saves it as a ZIP file.',
    color: '#d97706', bg: '#fffbeb',
  },
  {
    num: '05',
    title: 'Devices are migrated',
    description: 'Devices are removed from the source network, unclaimed, claimed to the destination org, and added to the target network — with timed waits between stages for cloud propagation.',
    color: '#2563eb', bg: '#eff6ff',
  },
  {
    num: '06',
    title: 'Configurations restored automatically',
    description: 'Device-level and network-level configs from the backup are pushed to the destination. Rollback is available at any stage if something goes wrong.',
    color: '#dc2626', bg: '#fef2f2',
  },
];

const STATS = [
  { value: '~10 min', label: 'Average migration time', color: '#2563eb', bg: '#eff6ff' },
  { value: '99.9%',  label: 'Migration success rate',  color: '#2563eb', bg: '#f0fdf4' },
  { value: '50+',    label: 'Configuration categories', color: '#7c3aed', bg: '#f5f3ff' },
  { value: '6',      label: 'Automated stages',          color: '#d97706', bg: '#fffbeb' },
];

export function HowItWorks() {
  return (
    <section style={{ backgroundColor: 'rgb(226, 238, 251)' }} id="how">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: '100px',
            fontSize: '11px', fontWeight: 600, color: '#1d4ed8',
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', flexShrink: 0 }} />
            How It Works
          </div>
          <h2 style={{
            fontSize: '34px', fontWeight: 800, color: '#0f172a',
            lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: '12px',
          }}>
            A six-step automated workflow.
          </h2>
          <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.7, maxWidth: '520px' }}>
            Every migration follows the same structured sequence. No steps skipped, no config missed.
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
          marginBottom: '48px',
        }}>
          {STATS.map((s) => (
            <div key={s.label} style={{
              ...GLASS,
              borderRadius: '14px',
              boxShadow: SHADOW_LG,
              padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Steps grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              style={{
                ...GLASS,
                borderRadius: '16px',
                boxShadow: SHADOW_LG,
                padding: '24px',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
              }}
            >
              {/* Step badge */}
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '10px',
                backgroundColor: step.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: step.color,
                flexShrink: 0,
              }}>
                {step.num}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7 }}>
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
