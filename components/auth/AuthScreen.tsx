import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';

interface AuthScreenProps {
  onSuccess: (user: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await apiClient.login(email, password);
      } else {
        result = await apiClient.register(email, password, fullName);
      }
      onSuccess(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(140deg, #ccd8f0 0%, #d6e2f8 45%, #cfd8ed 100%)',
    }}>

      {/* ── Left panel — deep dark brand panel ─────────────────────────── */}
      <div style={{
        width: '40%',
        minWidth: '380px',
        background: 'linear-gradient(160deg, #0d1b3e 0%, #0a2144 40%, #071830 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decorative orbs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '60px', left: '-40px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.20) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', right: '40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37,99,235,0.45)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="16" y="16" width="6" height="6" rx="1" />
              <rect x="2" y="16" width="6" height="6" rx="1" />
              <rect x="9" y="2" width="6" height="6" rx="1" />
              <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
              <path d="M12 12V8" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '17px', lineHeight: 1.2 }}>Meraki</div>
            <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: 1.2, fontWeight: 500 }}>Management Platform</div>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '100px',
            backgroundColor: 'rgba(37,99,235,0.20)', border: '1px solid rgba(37,99,235,0.35)',
            fontSize: '11px', fontWeight: 600, color: '#93c5fd',
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', flexShrink: 0 }} />
            Enterprise Platform
          </div>

          <h2 style={{
            fontSize: '32px', fontWeight: 800, color: '#f8fafc',
            lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-0.025em',
          }}>
            Enterprise-grade<br />Meraki management.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.75, marginBottom: '32px', maxWidth: '340px' }}>
            Migrate, back up, and manage your Cisco Meraki infrastructure with confidence. Built for network engineers and MSPs.
          </p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', text: 'Version control & snapshot history' },
              { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', text: 'PCI DSS, HIPAA & CIS compliance' },
              { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', text: 'Bulk operations across networks' },
              { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', text: 'Cross-region synchronization' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                  backgroundColor: item.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.color }} />
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ color: '#475569', fontSize: '12px', position: 'relative' }}>
          Cisco Meraki Management Platform · Enterprise Edition
        </p>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        {/* Glass form card */}
        <div style={{
          width: '100%', maxWidth: '400px',
          background: 'linear-gradient(160deg, rgba(240,248,255,0.85) 0%, rgba(220,235,255,0.75) 100%)',
          backdropFilter: 'blur(40px) saturate(200%) brightness(1.05)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(1.05)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.80)',
          boxShadow: '0 24px 64px rgba(0,30,100,0.22), 0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',
          padding: '40px',
        }}>
          <h1 style={{
            fontSize: '24px', fontWeight: 800, color: '#0f172a',
            marginBottom: '6px', letterSpacing: '-0.02em',
          }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '28px', lineHeight: 1.5 }}>
            {isLogin
              ? 'Sign in to your Meraki management account.'
              : 'Register to start managing your Meraki organization.'}
          </p>

          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            padding: '4px',
            borderRadius: '12px',
            backgroundColor: 'rgba(15,23,42,0.08)',
            border: '1px solid rgba(255,255,255,0.50)',
            marginBottom: '24px',
          }}>
            {(['Sign In', 'Sign Up'] as const).map((label, i) => {
              const active = (i === 0) === isLogin;
              return (
                <button
                  key={label}
                  onClick={() => setIsLogin(i === 0)}
                  style={{
                    flex: 1, padding: '8px', fontSize: '13px', fontWeight: 600,
                    borderRadius: '9px', border: 'none', cursor: 'pointer',
                    backgroundColor: active ? '#ffffff' : 'transparent',
                    color: active ? '#0f172a' : '#64748b',
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.90)' : 'none',
                    transition: 'all 150ms',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: '16px', padding: '12px 14px',
              borderRadius: '10px', fontSize: '13px',
              backgroundColor: 'rgba(254,226,226,0.90)',
              border: '1px solid rgba(248,113,113,0.40)',
              color: '#b91c1c',
              display: 'flex', alignItems: 'flex-start', gap: '8px',
            }}>
              <svg style={{ width: '16px', height: '16px', marginTop: '1px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {/* Form fields */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required={!isLogin}
                  style={{
                    width: '100%', padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(148,163,184,0.50)',
                    backgroundColor: 'rgba(255,255,255,0.90)',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.18), inset 0 1px 3px rgba(0,0,0,0.06)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(148,163,184,0.50)';
                    e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.06)';
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(148,163,184,0.50)',
                  backgroundColor: 'rgba(255,255,255,0.90)',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.18), inset 0 1px 3px rgba(0,0,0,0.06)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(148,163,184,0.50)';
                  e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.06)';
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  width: '100%', padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(148,163,184,0.50)',
                  backgroundColor: 'rgba(255,255,255,0.90)',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.18), inset 0 1px 3px rgba(0,0,0,0.06)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(148,163,184,0.50)';
                  e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.06)';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px',
                borderRadius: '10px', border: 'none',
                backgroundColor: '#2563eb', color: '#ffffff',
                fontSize: '14px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.80 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.20)',
                transition: 'box-shadow 150ms, opacity 150ms',
                marginTop: '4px',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 22px rgba(37,99,235,0.55), inset 0 1px 0 rgba(255,255,255,0.20)'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.20)'; }}
            >
              {loading && (
                <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '20px', color: '#475569' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                color: '#2563eb', fontWeight: 700, fontSize: '13px',
                fontFamily: 'inherit', padding: 0,
              }}
            >
              {isLogin ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

          {/* Demo credentials */}
          <div style={{
            marginTop: '24px', padding: '14px 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.60)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.80)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Demo credentials
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { label: 'Free tier:', user: 'free@demo.com', pass: 'Demo1234!' },
                { label: 'Enterprise:', user: 'admin@demo.com', pass: 'Admin1234!' },
              ].map(d => (
                <p key={d.user} style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>{d.label} </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1e293b', fontWeight: 500 }}>{d.user}</span>
                  <span style={{ color: '#94a3b8' }}> / </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1e293b', fontWeight: 500 }}>{d.pass}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
