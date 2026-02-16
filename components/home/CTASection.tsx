import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const SHADOW_LG  = '0 12px 36px rgba(0,0,0,0.11), 0 4px 10px rgba(0,0,0,0.06)';
const SHADOW_XL  = '0 20px 60px rgba(0,0,0,0.14), 0 6px 16px rgba(0,0,0,0.07)';
const GLASS      = { background: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', border: '1px solid rgba(255,255,255,0.85)' } as const;

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
    <section style={{ backgroundColor: 'rgb(226, 238, 251)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px 96px' }}>

        {/* Big CTA card */}
        <div style={{
          ...GLASS,
          borderRadius: '24px',
          boxShadow: SHADOW_XL,
          padding: '56px',
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '64px',
          alignItems: 'start',
        }}>
          {/* Left — headline + CTA */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px',
              backgroundColor: '#e8f5eb', border: '1px solid #bbdfc4',
              borderRadius: '100px',
              fontSize: '11px', fontWeight: 600, color: '#025115',
              letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '24px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', flexShrink: 0 }} />
              Get Started
            </div>

            <h2 style={{
              fontSize: '38px', fontWeight: 800, color: '#0f172a',
              lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: '20px',
            }}>
              Ready to migrate?
            </h2>

            <p style={{
              fontSize: '16px', color: '#4b5563', lineHeight: 1.75,
              marginBottom: '14px', maxWidth: '480px',
            }}>
              The entire wizard takes under 5 minutes to set up. Your devices, configurations, and network
              assignments are handled automatically — no CLI, no manual re-entry.
            </p>

            <p style={{
              fontSize: '14px', color: '#9ca3af', lineHeight: 1.7,
              marginBottom: '40px', maxWidth: '480px',
            }}>
              A full backup of your source organization is taken before any change is made.
              If anything goes wrong, rollback is one click.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsHome(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '12px 24px',
                  backgroundColor: '#2563eb', color: '#ffffff',
                  border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(4,138,36,0.40)',
                }}
              >
                Start migration <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setIsHome(false)}
                style={{
                  padding: '12px 24px',
                  ...GLASS,
                  color: '#374151',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                  boxShadow: SHADOW_LG,
                }}
              >
                Request demo
              </button>
            </div>
          </div>

          {/* Right — "What happens next" panel */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            border: '1px solid #f0f1f3',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #f0f1f3',
              fontSize: '11px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              What happens next
            </div>

            {NEXT_STEPS.map((step, i) => (
              <div
                key={step}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '13px 20px',
                  borderBottom: i < NEXT_STEPS.length - 1 ? '1px solid #f0f1f3' : 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  backgroundColor: '#e8f5eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '0px',
                }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#2563eb' }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.55 }}>{step}</span>
              </div>
            ))}

            {/* Stats footer */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              borderTop: '1px solid #f0f1f3',
            }}>
              {[
                { value: '~10 min', label: 'Avg. time', color: '#2563eb' },
                { value: '99.9%',   label: 'Success rate', color: '#2563eb' },
              ].map((s, i) => (
                <div key={s.label} style={{
                  padding: '16px 20px',
                  borderRight: i === 0 ? '1px solid #f0f1f3' : 'none',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                }}>
                  <div style={{
                    fontSize: '20px', fontWeight: 800, color: s.color,
                    letterSpacing: '-0.02em',
                  }}>
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
