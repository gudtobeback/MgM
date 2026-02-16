import React from 'react';
import { ArrowRight, CheckCircle2, Shield, Database, Globe, BarChart3, Zap, GitBranch } from 'lucide-react';

const SHADOW_MD  = '0 6px 20px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)';
const SHADOW_LG  = '0 12px 36px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.07)';
const SHADOW_XL  = '0 20px 60px rgba(0,0,0,0.15), 0 6px 16px rgba(0,0,0,0.08)';
const GLASS      = { background: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', border: '1px solid rgba(255,255,255,0.85)' } as const;

interface HeroProps {
  setIsHome: (val: boolean) => void;
}

export const Hero: React.FC<HeroProps> = ({ setIsHome }) => {
  return (
    <section style={{ backgroundColor: 'rgb(226, 238, 251)' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '1200px', margin: '0 auto', padding: '0 40px',
        height: '64px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="16" viewBox="0 0 60 30" fill="none">
            <rect x="0" y="12" width="6" height="6" rx="1" fill="#00bceb" />
            <rect x="9" y="6" width="6" height="12" rx="1" fill="#00bceb" />
            <rect x="18" y="0" width="6" height="18" rx="1" fill="#00bceb" />
            <rect x="27" y="6" width="6" height="12" rx="1" fill="#00bceb" />
            <rect x="36" y="12" width="6" height="6" rx="1" fill="#00bceb" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827', letterSpacing: '-0.01em' }}>
            Meraki Management
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#features" style={{ fontSize: '13px', color: '#4b5563', fontWeight: 500, textDecoration: 'none' }}>Features</a>
          <a href="#how" style={{ fontSize: '13px', color: '#4b5563', fontWeight: 500, textDecoration: 'none' }}>How it works</a>
          <a href="#pricing" style={{ fontSize: '13px', color: '#4b5563', fontWeight: 500, textDecoration: 'none' }}>Pricing</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setIsHome(false)} style={{
            padding: '7px 16px',
            ...GLASS,
            borderRadius: '8px',
            color: '#374151',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: SHADOW_MD,
          }}>
            Sign in
          </button>
          <button onClick={() => setIsHome(false)} style={{
            padding: '7px 16px',
            border: 'none',
            borderRadius: '8px',
            background: '#2563eb',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(4,138,36,0.35)',
          }}>
            Get started
          </button>
        </div>
      </nav>

      {/* Hero body */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '64px 40px 72px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start',
      }}>
        {/* Left */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            backgroundColor: '#e8f5eb',
            border: '1px solid #bbdfc4',
            borderRadius: '100px',
            fontSize: '11px', fontWeight: 600, color: '#025115',
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '24px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', flexShrink: 0 }} />
            Cisco Meraki Enterprise Platform
          </div>

          <h1 style={{
            fontSize: '42px', fontWeight: 800, color: '#0f172a',
            lineHeight: 1.15, marginBottom: '18px', letterSpacing: '-0.03em',
          }}>
            Migrate, manage, and audit
            <br />
            <span style={{ color: '#2563eb' }}>Meraki networks at scale.</span>
          </h1>

          <p style={{
            fontSize: '16px', color: '#4b5563', lineHeight: 1.75,
            marginBottom: '32px', maxWidth: '480px',
          }}>
            A purpose-built operations platform for Cisco Meraki administrators.
            Cross-region migration, automated backup, configuration drift detection,
            and bulk operations — from one dashboard.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '48px' }}>
            <button onClick={() => setIsHome(false)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '11px 22px',
              backgroundColor: '#2563eb', color: '#ffffff',
              border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(4,138,36,0.40)',
            }}>
              Start migration <ArrowRight size={14} />
            </button>
            <button onClick={() => setIsHome(false)} style={{
              padding: '11px 22px',
              ...GLASS,
              color: '#374151',
              borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              boxShadow: SHADOW_MD,
            }}>
              Request demo
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: '0',
            ...GLASS,
            borderRadius: '14px',
            boxShadow: SHADOW_LG,
            overflow: 'hidden',
          }}>
            {[
              { value: '99.9%',   label: 'Migration success' },
              { value: '~10 min', label: 'Average time' },
              { value: '50+',     label: 'Config categories' },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1,
                padding: '18px 20px',
                borderRight: i < 2 ? '1px solid #f0f1f3' : 'none',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px', fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Platform capabilities card */}
        <div style={{
          ...GLASS,
          borderRadius: '20px',
          boxShadow: SHADOW_XL,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #f0f1f3',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '12px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Platform Capabilities
            </span>
            <span style={{
              padding: '3px 10px',
              backgroundColor: '#e8f5eb', border: '1px solid #bbdfc4',
              borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: '#025115',
            }}>
              v1.0
            </span>
          </div>

          {[
            { icon: <Globe size={15} color="#2563eb" />, iconBg: '#eff6ff', title: 'Cross-region migration', desc: 'Global → India, China, Canada and more' },
            { icon: <Shield size={15} color="#7c3aed" />, iconBg: '#f5f3ff', title: 'Pre-migration backup', desc: 'Full org snapshot saved as ZIP before any change' },
            { icon: <Database size={15} color="#0891b2" />, iconBg: '#ecfeff', title: 'Configuration restore', desc: 'Auto-restores VLANs, firewall rules, SSIDs, RADIUS' },
            { icon: <BarChart3 size={15} color="#d97706" />, iconBg: '#fffbeb', title: 'Drift detection', desc: 'Compares live config against saved baseline' },
            { icon: <Zap size={15} color="#2563eb" />, iconBg: '#eff6ff', title: 'Bulk operations', desc: 'Push changes across multiple networks at once' },
            { icon: <GitBranch size={15} color="#dc2626" />, iconBg: '#fef2f2', title: 'Rollback on failure', desc: 'Smart stage-by-stage rollback if migration fails' },
          ].map((cap, i) => (
            <div key={cap.title} style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '14px 20px',
              borderBottom: i < 5 ? '1px solid #f8f9fb' : 'none',
              backgroundColor: '#ffffff',
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                backgroundColor: cap.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: '1px',
              }}>
                {cap.icon}
              </div>
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
