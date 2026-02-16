import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Building2, Plus, Trash2, AlertCircle } from 'lucide-react';

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

const selectClass = "w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-shadow";

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

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Organizations
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Connect your Meraki organizations to unlock monitoring, snapshots, and bulk operations.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" className="shrink-0">
          <Plus size={15} />
          Add Organization
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Add Organization Form */}
      {showAddForm && (
        <div className="rounded-xl border p-6 space-y-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-primary)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Connect Organization
          </h3>
          <form onSubmit={handleAddOrg} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  Organization ID
                </Label>
                <Input
                  type="text"
                  value={form.merakiOrgId}
                  onChange={e => setForm(f => ({ ...f, merakiOrgId: e.target.value }))}
                  placeholder="123456"
                  required
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  Organization Name
                </Label>
                <Input
                  type="text"
                  value={form.merakiOrgName}
                  onChange={e => setForm(f => ({ ...f, merakiOrgName: e.target.value }))}
                  placeholder="My Company Network"
                  required
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--color-text-secondary)' }}>
                Meraki API Key
              </Label>
              <Input
                type="password"
                value={form.merakiApiKey}
                onChange={e => setForm(f => ({ ...f, merakiApiKey: e.target.value }))}
                placeholder="Your Meraki API key"
                required
                className="bg-white"
              />
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Found in Meraki Dashboard → Organization → Settings → API access
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--color-text-secondary)' }}>
                Region
              </Label>
              <select
                value={form.merakiRegion}
                onChange={e => setForm(f => ({ ...f, merakiRegion: e.target.value as 'com' | 'in' }))}
                className={selectClass}
              >
                <option value="com">Global (api.meraki.com)</option>
                <option value="in">India (api.meraki.in)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t"
              style={{ borderColor: 'var(--color-border-subtle)' }}>
              <Button type="submit" disabled={submitting} size="sm">
                {submitting ? 'Connecting…' : 'Connect Organization'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Organizations List */}
      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading organizations…
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--color-border-primary)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-surface-subtle)' }}>
            <Building2 size={20} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            No organizations connected
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Add your Meraki organization to get started with monitoring and snapshots.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map(org => (
            <div
              key={org.id}
              className="rounded-xl border p-5 flex items-center justify-between hover:border-[var(--color-primary)] transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-primary)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {org.meraki_org_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      ID: {org.meraki_org_id}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {org.meraki_region === 'in' ? 'India' : 'Global'}
                    </Badge>
                    {org.device_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {org.device_count} devices
                      </Badge>
                    )}
                    {org.last_synced_at && (
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Synced {new Date(org.last_synced_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onSelectOrg && (
                  <Button
                    onClick={() => onSelectOrg(org.id, org.meraki_org_name)}
                    size="sm"
                  >
                    Select
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOrg(org.id, org.meraki_org_name)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  title="Remove organization"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
