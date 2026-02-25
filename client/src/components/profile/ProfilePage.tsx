import React, { useState, useEffect } from 'react';
import { User, Key, CreditCard, CheckCircle2, Loader2, Sparkles, Shield } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { cn } from '../../lib/utils';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
}

interface ProfilePageProps {
  onTierChange?: (newTier: string) => void;
}

const TIERS = [
  {
    id: 'free',
    label: 'Free',
    from: '#9ca3af', to: '#6b7280',
    ring: 'ring-gray-300',
    features: ['Migration wizard', 'Manual backups', '1 organization', '5 snapshots'],
  },
  {
    id: 'essentials',
    label: 'Essentials',
    from: '#38bdf8', to: '#0ea5e9',
    ring: 'ring-cyan-400',
    features: ['Everything in Free', 'Version control', 'Drift detection', '3 organizations', '30 snapshots'],
  },
  {
    id: 'professional',
    label: 'Professional',
    from: '#a78bfa', to: '#7c3aed',
    ring: 'ring-violet-400',
    features: ['Everything in Essentials', 'Compliance checks', 'Bulk operations', 'Security posture', '10 organizations'],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    from: '#fbbf24', to: '#f59e0b',
    ring: 'ring-amber-400',
    features: ['Everything in Professional', 'Unlimited organizations', 'Scheduled snapshots', 'Change management', 'Documentation export', 'Cross-region sync'],
  },
  {
    id: 'msp',
    label: 'MSP',
    from: '#3b82f6', to: '#4f46e5',
    ring: 'ring-blue-500',
    features: ['Everything in Enterprise', 'Multi-tenant management', 'White-label', 'Priority support'],
  },
];

// Shared input style
const INPUT = 'w-full px-3 py-2.5 rounded-lg text-sm bg-white/50 border border-white/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all backdrop-blur-sm';
const INPUT_DISABLED = 'w-full px-3 py-2.5 rounded-lg text-sm bg-white/20 border border-white/30 text-muted-foreground opacity-70 cursor-not-allowed';

export const ProfilePage: React.FC<ProfilePageProps> = ({ onTierChange }) => {
  const [profile, setProfile]           = useState<UserProfile | null>(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [changingTier, setChangingTier] = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [nameForm, setNameForm]         = useState('');
  const [pwForm, setPwForm]             = useState({ current: '', next: '', confirm: '' });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCurrentUser();
      setProfile(data);
      setNameForm(data.full_name || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await apiClient.updateProfile({ fullName: nameForm });
      setSuccess('Display name updated successfully.');
      await loadProfile();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { setError('New passwords do not match.'); return; }
    if (pwForm.next.length < 8)         { setError('Password must be at least 8 characters.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await apiClient.updateProfile({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      setSuccess('Password changed successfully.');
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const changeTier = async (tierId: string) => {
    if (tierId === profile?.subscription_tier) return;
    setChangingTier(true); setError(''); setSuccess('');
    try {
      await apiClient.updateSubscription(tierId);
      const t = TIERS.find(t => t.id === tierId);
      setSuccess(`Subscription changed to ${t?.label ?? tierId}.`);
      setTimeout(() => setSuccess(''), 4000);
      await loadProfile();
      onTierChange?.(tierId);
    } catch (err: any) { setError(err.message); }
    finally { setChangingTier(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-pulse">
        <Loader2 size={40} className="text-blue-500 opacity-50 animate-spin mb-4" />
        <p className="text-sm">Loading your profile...</p>
      </div>
    );
  }

  const currentTier = TIERS.find(t => t.id === profile?.subscription_tier) ?? TIERS[0];
  const initial     = (profile?.email?.[0] ?? '?').toUpperCase();
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Account &amp; Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account settings and subscription plan.</p>
      </div>

      {/* ── Toast messages ────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-red-50/80 border border-red-200/80 text-red-700 text-sm shadow-sm backdrop-blur-sm">
          <Shield size={16} className="shrink-0 mt-0.5 text-red-500" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-green-50/80 border border-green-200/80 text-green-700 text-sm shadow-sm backdrop-blur-sm">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-500" />
          {success}
        </div>
      )}

      {profile && (
        <>
          {/* ── Hero: avatar + identity + current plan ────────────── */}
          <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Large avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{
                background: `linear-gradient(135deg, ${currentTier.from}, ${currentTier.to})`,
                boxShadow: `0 0 0 3px rgba(255,255,255,0.8), 0 0 0 5px ${currentTier.from}50`,
              }}
            >
              {initial}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-xl font-bold text-foreground truncate">{displayName}</p>
                {/* Tier badge */}
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white tracking-wide shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${currentTier.from}, ${currentTier.to})` }}
                >
                  <Sparkles size={10} />
                  {currentTier.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{profile.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                &nbsp;·&nbsp;Status: <span className="font-semibold text-green-600 capitalize">{profile.subscription_status}</span>
              </p>
            </div>
          </div>

          {/* ── Profile information ───────────────────────────────── */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <User size={16} className="text-blue-500" />
              <h2 className="font-semibold text-foreground">Profile Information</h2>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Email address</label>
              <input type="email" value={profile.email} disabled className={INPUT_DISABLED} />
            </div>

            {/* Display name */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Display name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameForm}
                  onChange={e => setNameForm(e.target.value)}
                  placeholder="Enter your name"
                  className={INPUT}
                />
                <button
                  onClick={saveName}
                  disabled={saving || nameForm === (profile.full_name ?? '')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Change password ───────────────────────────────────── */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Key size={16} className="text-amber-500" />
              <h2 className="font-semibold text-foreground">Change Password</h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {([
                { label: 'Current password',     key: 'current' as const },
                { label: 'New password',          key: 'next'    as const },
                { label: 'Confirm new password',  key: 'confirm' as const },
              ] as const).map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type="password"
                    value={pwForm[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    className={INPUT}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={savePassword}
              disabled={saving || !pwForm.current || !pwForm.next}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Update Password'}
            </button>
          </div>

          {/* ── Subscription plan selector ────────────────────────── */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-foreground">Subscription Plan</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Select a plan below. Changes take effect immediately.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TIERS.map(tier => {
                const isActive = profile.subscription_tier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => changeTier(tier.id)}
                    disabled={changingTier || isActive}
                    className={cn(
                      'relative p-4 rounded-xl text-left transition-all duration-200 border overflow-hidden group',
                      isActive
                        ? 'border-transparent shadow-md ring-2 ' + tier.ring
                        : 'border-white/30 bg-white/20 hover:bg-white/40 hover:shadow-md hover:border-white/50'
                    )}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${tier.from}18, ${tier.to}28)`,
                    } : {}}
                  >
                    {/* Gradient top bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                      style={{ background: `linear-gradient(90deg, ${tier.from}, ${tier.to})` }}
                    />

                    <div className="flex items-center justify-between mt-1 mb-3">
                      <div className="flex items-center gap-2">
                        {/* Mini tier avatar */}
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ background: `linear-gradient(135deg, ${tier.from}, ${tier.to})` }}
                        >
                          {tier.id.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground text-sm">{tier.label}</span>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${tier.from}, ${tier.to})` }}>
                          <CheckCircle2 size={9} /> Current
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1.5">
                      {tier.features.slice(0, 3).map(f => (
                        <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <CheckCircle2 size={11} className="shrink-0 mt-0.5" style={{ color: tier.from }} />
                          {f}
                        </li>
                      ))}
                      {tier.features.length > 3 && (
                        <li className="text-xs text-muted-foreground pl-4">
                          +{tier.features.length - 3} more features
                        </li>
                      )}
                    </ul>

                    {!isActive && (
                      <div className="mt-3 text-xs font-semibold text-center py-1.5 rounded-lg transition-colors group-hover:text-white"
                        style={{ background: `linear-gradient(135deg, ${tier.from}20, ${tier.to}20)`, color: tier.from }}>
                        Switch to {tier.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
