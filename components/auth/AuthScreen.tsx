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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-primary)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 150ms',
    boxSizing: 'border-box',
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Left panel — Cisco brand */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-2/5"
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="16" y="16" width="6" height="6" rx="1" />
              <rect x="2" y="16" width="6" height="6" rx="1" />
              <rect x="9" y="2" width="6" height="6" rx="1" />
              <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
              <path d="M12 12V8" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">Meraki</div>
            <div style={{ color: 'var(--sidebar-text-muted)' }} className="text-xs leading-tight">Management Platform</div>
          </div>
        </div>

        {/* Hero text */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Enterprise-grade<br />Meraki management.
          </h2>
          <p style={{ color: 'var(--sidebar-text)' }} className="text-sm leading-relaxed mb-8">
            Migrate, back up, and manage your Cisco Meraki infrastructure with confidence. Built for network engineers and managed service providers.
          </p>

          {/* Feature bullets */}
          {[
            { dot: 'var(--color-primary)', text: 'Version control & snapshot history' },
            { dot: 'var(--meraki-teal)', text: 'PCI DSS, HIPAA & CIS compliance' },
            { dot: 'var(--cisco-orange)', text: 'Bulk operations across networks' },
            { dot: 'var(--color-primary)', text: 'Cross-region synchronization' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 mb-3">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.dot }} />
              <span className="text-sm" style={{ color: 'var(--sidebar-text)' }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p style={{ color: 'var(--sidebar-text-muted)' }} className="text-xs">
          Cisco Meraki Management Platform · Enterprise Edition
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="16" y="16" width="6" height="6" rx="1" />
                <rect x="2" y="16" width="6" height="6" rx="1" />
                <rect x="9" y="2" width="6" height="6" rx="1" />
                <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                <path d="M12 12V8" />
              </svg>
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Meraki Management</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {isLogin ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            {isLogin
              ? 'Enter your credentials to access the platform.'
              : 'Register to start managing your Meraki organization.'}
          </p>

          {/* Tab switcher */}
          <div
            className="flex rounded-lg p-1 mb-6"
            style={{ backgroundColor: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)' }}
          >
            {(['Sign In', 'Sign Up'] as const).map((label, i) => {
              const active = (i === 0) === isLogin;
              return (
                <button
                  key={label}
                  onClick={() => setIsLogin(i === 0)}
                  className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
                  style={{
                    backgroundColor: active ? 'var(--color-surface)' : 'transparent',
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm flex items-start gap-2"
              style={{
                backgroundColor: 'var(--color-error-light)',
                border: '1px solid #f5c0c0',
                color: 'var(--color-error)',
              }}
            >
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={inputStyle}
                  placeholder="John Doe"
                  required={!isLogin}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border-primary)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
                required
                onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border-primary)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                required
                minLength={6}
                onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border-primary)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
              style={{
                backgroundColor: loading ? 'var(--color-primary-hover)' : 'var(--color-primary)',
                opacity: loading ? 0.85 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-secondary)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              {isLogin ? 'Sign up for free' : 'Sign in'}
            </button>
          </p>

          {/* Demo credentials hint */}
          <div
            className="mt-8 p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Demo credentials</p>
            <div className="space-y-1">
              {[
                { label: 'Free tier:', user: 'free@demo.com', pass: 'Demo1234!' },
                { label: 'Enterprise:', user: 'admin@demo.com', pass: 'Admin1234!' },
              ].map(d => (
                <p key={d.user} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{d.label} </span>
                  <span className="font-mono">{d.user}</span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}> / </span>
                  <span className="font-mono">{d.pass}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
