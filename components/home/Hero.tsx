import React from 'react';
import { ArrowRight, CheckCircle2, Shield, Database, Globe, BarChart3 } from 'lucide-react';

interface HeroProps {
  setIsHome: (val: boolean) => void;
}

export const Hero: React.FC<HeroProps> = ({ setIsHome }) => {
  return (
    <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '1200px', margin: '0 auto', padding: '0 40px',
        height: '60px', borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="16" viewBox="0 0 60 30" fill="none">
            <rect x="0" y="12" width="6" height="6" rx="1" fill="#00bceb" />
            <rect x="9" y="6" width="6" height="12" rx="1" fill="#00bceb" />
            <rect x="18" y="0" width="6" height="18" rx="1" fill="#00bceb" />
            <rect x="27" y="6" width="6" height="12" rx="1" fill="#00bceb" />
            <rect x="36" y="12" width="6" height="6" rx="1" fill="#00bceb" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827', letterSpacing: '-0.01em' }}>Meraki Management</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setIsHome(false)} style={{
            padding: '7px 16px', border: '1px solid #d1d5db', borderRadius: '5px',
            background: '#ffffff', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}>Sign in</button>
          <button onClick={() => setIsHome(false)} style={{
            padding: '7px 16px', border: 'none', borderRadius: '5px',
            background: '#048a24', color: '#ffffff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>Get started</button>
        </div>
      </nav>

      {/* Hero body */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '72px 40px 64px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start',
      }}>
        {/* Left */}
        <div>
          <div style={{
            display: 'inline-block', padding: '3px 10px',
            border: '1px solid #d1d5db', borderRadius: '4px',
            fontSize: '11px', fontWeight: 600, color: '#6b7280',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            Cisco Meraki Enterprise Platform
          </div>

          <h1 style={{
            fontSize: '38px', fontWeight: 700, color: '#111827',
            lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-0.02em',
          }}>
            Migrate, manage, and audit<br />
            <span style={{ color: '#048a24' }}>Meraki networks at scale.</span>
          </h1>

          <p style={{
            fontSize: '16px', color: '#6b7280', lineHeight: 1.7,
            marginBottom: '28px', maxWidth: '460px',
          }}>
            A purpose-built operations platform for Cisco Meraki administrators.
            Cross-region migration, automated backup, configuration drift detection,
            and bulk operations — from one dashboard.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
            <button onClick={() => setIsHome(false)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', backgroundColor: '#048a24', color: '#ffffff',
              border: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>
              Start migration <ArrowRight size={14} />
            </button>
            <button onClick={() => setIsHome(false)} style={{
              padding: '10px 20px', backgroundColor: '#ffffff', color: '#374151',
              border: '1px solid #d1d5db', borderRadius: '5px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            }}>
              Request demo
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
            {[
              { value: '99.9%',  label: 'Migration success rate' },
              { value: '~10 min', label: 'Average migration time' },
              { value: '50+',    label: 'Configuration categories' },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1, paddingRight: '24px', marginRight: '24px',
                borderRight: i < 2 ? '1px solid #e5e7eb' : 'none',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Platform capabilities panel */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px', backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Capabilities
            </span>
            <span style={{
              padding: '2px 8px', backgroundColor: '#e8f5eb', border: '1px solid #bbdfc4',
              borderRadius: '3px', fontSize: '11px', fontWeight: 600, color: '#025115',
            }}>v1.0</span>
          </div>

          {[
            { icon: <Globe size={15} color="#048a24" />, title: 'Cross-region migration', desc: 'Global → India, China, Canada and more' },
            { icon: <Shield size={15} color="#048a24" />, title: 'Pre-migration backup', desc: 'Full org snapshot saved as ZIP before any change' },
            { icon: <Database size={15} color="#048a24" />, title: 'Configuration restore', desc: 'Auto-restores VLANs, firewall rules, SSIDs, RADIUS' },
            { icon: <BarChart3 size={15} color="#048a24" />, title: 'Drift detection', desc: 'Compares live config against saved baseline' },
            { icon: <CheckCircle2 size={15} color="#048a24" />, title: 'Bulk operations', desc: 'Push changes across multiple networks at once' },
            { icon: <Shield size={15} color="#048a24" />, title: 'Rollback on failure', desc: 'Smart stage-by-stage rollback if migration fails' },
          ].map((cap, i) => (
            <div key={cap.title} style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '14px 20px',
              borderBottom: i < 5 ? '1px solid #f0f1f3' : 'none',
              backgroundColor: '#ffffff',
            }}>
              <div style={{ marginTop: '1px', flexShrink: 0 }}>{cap.icon}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{cap.title}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{cap.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
