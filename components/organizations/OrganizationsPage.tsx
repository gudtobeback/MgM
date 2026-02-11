import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface Organization {
  id: string;
  meraki_org_id: string;
  meraki_org_name: string;
  meraki_region: string;
  is_active: boolean;
  last_synced_at: string | null;
  device_count: number;
  created_at: string;
}

interface OrganizationsPageProps {
  onSelectOrg?: (orgId: string, orgName: string) => void;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
);
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
);

export const OrganizationsPage: React.FC<OrganizationsPageProps> = ({ onSelectOrg }) => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    merakiOrgId: '',
    merakiOrgName: '',
    merakiApiKey: '',
    merakiRegion: 'com' as 'com' | 'in',
  });

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listOrganizations();
      setOrgs(data);
    } catch (err) {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await apiClient.createOrganization(form);
      setForm({ merakiOrgId: '', merakiOrgName: '', merakiApiKey: '', merakiRegion: 'com' });
      setShowAddForm(false);
      await loadOrgs();
    } catch (err: any) {
      setError(err.message || 'Failed to add organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveOrg = async (orgId: string, orgName: string) => {
    if (!window.confirm(`Remove "${orgName}" from your dashboard?`)) return;
    try {
      await apiClient.removeOrganization(orgId);
      setOrgs(prev => prev.filter(o => o.id !== orgId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove organization');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Organizations</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Connect your Meraki organizations to unlock monitoring, snapshots, and bulk operations.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <PlusIcon />
          Add Organization
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add Organization Form */}
      {showAddForm && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Connect Organization</h3>
          <form onSubmit={handleAddOrg} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Organization ID
                </label>
                <input
                  type="text"
                  value={form.merakiOrgId}
                  onChange={e => setForm(f => ({ ...f, merakiOrgId: e.target.value }))}
                  placeholder="123456"
                  required
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-surface-subtle)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={form.merakiOrgName}
                  onChange={e => setForm(f => ({ ...f, merakiOrgName: e.target.value }))}
                  placeholder="My Company Network"
                  required
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-surface-subtle)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Meraki API Key
              </label>
              <input
                type="password"
                value={form.merakiApiKey}
                onChange={e => setForm(f => ({ ...f, merakiApiKey: e.target.value }))}
                placeholder="Your Meraki API key"
                required
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-surface-subtle)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Found in Meraki Dashboard &rarr; Organization &rarr; Settings &rarr; API access
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Region
              </label>
              <select
                value={form.merakiRegion}
                onChange={e => setForm(f => ({ ...f, merakiRegion: e.target.value as 'com' | 'in' }))}
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-surface-subtle)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="com">Global (api.meraki.com)</option>
                <option value="in">India (api.meraki.in)</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Connecting...' : 'Connect Organization'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm hover:bg-[var(--color-surface-subtle)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Organizations List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          Loading organizations...
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--color-border-primary)] rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-subtle)] flex items-center justify-center mx-auto mb-4">
            <BuildingIcon />
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">No organizations connected</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Add your Meraki organization to get started with monitoring and snapshots.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map(org => (
            <div
              key={org.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-5 flex items-center justify-between hover:border-[var(--color-primary)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <BuildingIcon />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{org.meraki_org_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[var(--color-text-secondary)]">ID: {org.meraki_org_id}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {org.meraki_region === 'in' ? 'India' : 'Global'}
                    </span>
                    {org.device_count > 0 && (
                      <span className="text-xs text-[var(--color-text-secondary)]">{org.device_count} devices</span>
                    )}
                    {org.last_synced_at && (
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        Synced {new Date(org.last_synced_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onSelectOrg && (
                  <button
                    onClick={() => onSelectOrg(org.id, org.meraki_org_name)}
                    className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-sm rounded-lg hover:opacity-90"
                  >
                    Select
                  </button>
                )}
                <button
                  onClick={() => handleRemoveOrg(org.id, org.meraki_org_name)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove organization"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
