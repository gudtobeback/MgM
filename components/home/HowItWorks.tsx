import React from 'react';

const STEPS = [
  {
    num: '01',
    title: 'Connect your source dashboard',
    description: 'Select a Meraki region and enter your API key for the organization you want to migrate from. Supports Global, India, Canada, China, and custom endpoints.',
  },
  {
    num: '02',
    title: 'Connect your destination dashboard',
    description: 'Configure the target region and API key. The wizard validates both connections before allowing you to proceed.',
  },
  {
    num: '03',
    title: 'Select devices and review',
    description: 'Browse your source organization\'s inventory. Select the devices to migrate. The review screen shows a full summary before any change is made.',
  },
  {
    num: '04',
    title: 'Automatic pre-migration backup',
    description: 'The platform snapshots your source organization — VLANs, firewall rules, SSIDs, RADIUS, group policies, RF profiles — and saves it as a ZIP file.',
  },
  {
    num: '05',
    title: 'Devices are migrated',
    description: 'Devices are removed from the source network, unclaimed, claimed to the destination org, and added to the target network — with timed waits between stages for cloud propagation.',
  },
  {
    num: '06',
    title: 'Configurations restored automatically',
    description: 'Device-level and network-level configs from the backup are pushed to the destination. Rollback is available at any stage if something goes wrong.',
  },
];

const STATS = [
  { value: '~10 min', label: 'Average migration time' },
  { value: '99.9%',  label: 'Migration success rate' },
  { value: '50+',    label: 'Configuration categories' },
  { value: '6',      label: 'Automated stages' },
];

export function HowItWorks() {
  return (
    <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }} id="how">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '80px', alignItems: 'start' }}>

          {/* Left — vertical step list */}
          <div>
            <div style={{ marginBottom: '40px' }}>
              <div style={{
                display: 'inline-block', padding: '3px 10px',
                border: '1px solid #d1d5db', borderRadius: '4px',
                fontSize: '11px', fontWeight: 600, color: '#6b7280',
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px',
              }}>
                How It Works
              </div>
              <h2 style={{
                fontSize: '32px', fontWeight: 700, color: '#111827',
                lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '12px',
              }}>
                A six-step automated workflow.
              </h2>
              <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.65, maxWidth: '500px' }}>
                Every migration follows the same structured sequence. No steps skipped, no config missed.
              </p>
            </div>

            {/* Steps */}
            <div style={{ borderTop: '1px solid #e5e7eb' }}>
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '52px 1fr',
                    gap: '24px',
                    padding: '24px 0',
                    borderBottom: '1px solid #f0f1f3',
                    alignItems: 'start',
                  }}
                >
                  {/* Number */}
                  <div style={{
                    fontSize: '13px', fontWeight: 600, color: '#d1d5db',
                    paddingTop: '2px', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {step.num}
                  </div>

                  {/* Content */}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '5px' }}>
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

          {/* Right — stats column */}
          <div style={{ paddingTop: '104px' }}>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '11px', fontWeight: 600, color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                At a glance
              </div>
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    padding: '20px 16px',
                    borderBottom: i < STATS.length - 1 ? '1px solid #f0f1f3' : 'none',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{
                    fontSize: '22px', fontWeight: 700, color: '#111827',
                    letterSpacing: '-0.02em', lineHeight: 1.2,
                  }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
