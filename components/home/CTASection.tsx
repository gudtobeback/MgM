import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const NEXT_STEPS = [
  'Connect your source Meraki dashboard',
  'Connect your destination dashboard',
  'Select devices and review the plan',
  'Automatic backup runs before any change',
  'Migration and config restore execute automatically',
];

interface CTASectionProps {
  setIsHome: (val: boolean) => void;
}

export function CTASection({ setIsHome }: CTASectionProps) {
  return (
    <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '80px', alignItems: 'start' }}>

          {/* Left — headline + CTA */}
          <div>
            <div style={{
              display: 'inline-block', padding: '3px 10px',
              border: '1px solid #d1d5db', borderRadius: '4px',
              fontSize: '11px', fontWeight: 600, color: '#6b7280',
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px',
            }}>
              Get Started
            </div>

            <h2 style={{
              fontSize: '32px', fontWeight: 700, color: '#111827',
              lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '16px',
            }}>
              Ready to migrate?
            </h2>

            <p style={{
              fontSize: '15px', color: '#6b7280', lineHeight: 1.7,
              marginBottom: '12px', maxWidth: '460px',
            }}>
              The entire wizard takes under 5 minutes to set up. Your devices, configurations, and network
              assignments are handled automatically — no CLI, no manual re-entry.
            </p>

            <p style={{
              fontSize: '14px', color: '#9ca3af', lineHeight: 1.65,
              marginBottom: '36px', maxWidth: '460px',
            }}>
              A full backup of your source organization is taken before any change is made.
              If anything goes wrong, rollback is one click.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setIsHome(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', backgroundColor: '#048a24', color: '#ffffff',
                  border: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Start migration <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setIsHome(false)}
                style={{
                  padding: '10px 20px', backgroundColor: '#ffffff', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: '5px', fontSize: '14px',
                  fontWeight: 500, cursor: 'pointer',
                }}
              >
                Request demo
              </button>
            </div>
          </div>

          {/* Right — "What happens next" panel */}
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
              What happens next
            </div>

            {NEXT_STEPS.map((step, i) => (
              <div
                key={step}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '13px 16px',
                  borderBottom: i < NEXT_STEPS.length - 1 ? '1px solid #f0f1f3' : 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                <CheckCircle2 size={14} color="#048a24" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}

            {/* Stats footer */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}>
              {[
                { value: '~10 min', label: 'Avg. time' },
                { value: '99.9%',   label: 'Success rate' },
              ].map((s, i) => (
                <div key={s.label} style={{
                  padding: '16px',
                  borderRight: i === 0 ? '1px solid #e5e7eb' : 'none',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
