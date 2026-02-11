import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

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
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    activeColor: 'bg-gray-600',
    features: ['Migration wizard', 'Manual backups', '1 organization', '5 snapshots'],
  },
  {
    id: 'essentials',
    label: 'Essentials',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    activeColor: 'bg-blue-600',
    features: ['Everything in Free', 'Version control', 'Drift detection', '3 organizations', '30 snapshots'],
  },
  {
    id: 'professional',
    label: 'Professional',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    activeColor: 'bg-indigo-600',
    features: ['Everything in Essentials', 'Compliance checks', 'Bulk operations', 'Security posture', '10 organizations'],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    activeColor: 'bg-purple-600',
    features: ['Everything in Professional', 'Unlimited organizations', 'Scheduled snapshots', 'Change management', 'Documentation export', 'Cross-region sync', 'Unlimited usage'],
  },
  {
    id: 'msp',
    label: 'MSP',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    activeColor: 'bg-amber-600',
    features: ['Everything in Enterprise', 'Multi-tenant management', 'White-label', 'Priority support'],
  },
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ onTierChange }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingTier, setChangingTier] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [nameForm, setNameForm] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    loadProfile();
  }, []);

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
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.updateProfile({ fullName: nameForm });
      setSuccess('Name updated');
      await loadProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      setError('New passwords do not match');
      return;
    }
    if (pwForm.next.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.updateProfile({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      setSuccess('Password updated');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeTier = async (tier: string) => {
    if (tier === profile?.subscription_tier) return;
    setChangingTier(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.updateSubscription(tier);
      setSuccess(`Subscription changed to ${tier}`);
      setTimeout(() => setSuccess(''), 4000);
      await loadProfile();
      // Notify parent so header badge updates
      onTierChange?.(tier);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setChangingTier(false);
    }
  };

  const tierConfig = TIERS.find(t => t.id === profile?.subscription_tier) || TIERS[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Account & Profile</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your account settings and subscription.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading profile...</div>
      ) : profile && (
        <>
          {/* Current Plan Banner */}
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${tierConfig.color}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${tierConfig.activeColor} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                {profile.subscription_tier.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-[var(--color-text-primary)]">{tierConfig.label} Plan</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Status: {profile.subscription_status}</p>
              </div>
            </div>
            <div className="text-right text-sm text-[var(--color-text-secondary)]">
              <p>Member since</p>
              <p className="font-medium text-[var(--color-text-primary)]">{new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Profile Information</h3>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Display Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameForm}
                  onChange={e => setNameForm(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  onClick={saveName}
                  disabled={saving}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Change Password</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Current Password', key: 'current' as const },
                { label: 'New Password', key: 'next' as const },
                { label: 'Confirm New Password', key: 'confirm' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{label}</label>
                  <input
                    type="password"
                    value={pwForm[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={savePassword}
              disabled={saving || !pwForm.current || !pwForm.next}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Password'}
            </button>
          </div>

          {/* Subscription Tier Selector */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Subscription Plan</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Select a plan below. Changes take effect immediately.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TIERS.map(tier => {
                const isActive = profile.subscription_tier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => changeTier(tier.id)}
                    disabled={changingTier || isActive}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? `${tier.color} border-opacity-100 ring-2 ring-offset-1 ring-current`
                        : `border-[var(--color-border-primary)] hover:border-[var(--color-primary)] hover:shadow-sm bg-[var(--color-surface-subtle)]`
                    } disabled:cursor-default`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold ${isActive ? '' : 'text-[var(--color-text-primary)]'}`}>
                        {tier.label}
                      </span>
                      {isActive && (
                        <span className="text-xs px-1.5 py-0.5 bg-white bg-opacity-60 rounded font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {tier.features.slice(0, 3).map(f => (
                        <li key={f} className={`text-xs flex items-start gap-1 ${isActive ? 'opacity-80' : 'text-[var(--color-text-secondary)]'}`}>
                          <span className="mt-0.5 flex-shrink-0">✓</span>
                          {f}
                        </li>
                      ))}
                      {tier.features.length > 3 && (
                        <li className={`text-xs ${isActive ? 'opacity-60' : 'text-[var(--color-text-secondary)]'}`}>
                          +{tier.features.length - 3} more...
                        </li>
                      )}
                    </ul>
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
