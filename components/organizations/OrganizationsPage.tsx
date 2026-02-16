import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Building2, Plus, Trash2, AlertCircle, Search, Globe, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Organizations
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Connect your Meraki organizations to unlock monitoring, snapshots, and bulk operations.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="shrink-0 rounded-full shadow-lg hover:shadow-xl transition-all">
          <Plus size={18} />
          Add Organization
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Add Organization Form */}
      {showAddForm && (
        <div className="glass-card p-8 border border-white/40 shadow-xl animate-fade-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <Building2 className="text-blue-600" size={20} />
              Connect Organization
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>

          <form onSubmit={handleAddOrg} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Organization ID
                </Label>
                <Input
                  type="text"
                  value={form.merakiOrgId}
                  onChange={e => setForm(f => ({ ...f, merakiOrgId: e.target.value }))}
                  placeholder="123456"
                  required
                  className="bg-white/70"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Organization Name
                </Label>
                <Input
                  type="text"
                  value={form.merakiOrgName}
                  onChange={e => setForm(f => ({ ...f, merakiOrgName: e.target.value }))}
                  placeholder="My Company Network"
                  required
                  className="bg-white/70"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Meraki API Key
              </Label>
              <Input
                type="password"
                value={form.merakiApiKey}
                onChange={e => setForm(f => ({ ...f, merakiApiKey: e.target.value }))}
                placeholder="Your Meraki API key"
                required
                className="bg-white/70 font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Found in Meraki Dashboard → Organization → Settings → API access
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Region
              </Label>
              <div className="relative">
                <select
                  value={form.merakiRegion}
                  onChange={e => setForm(f => ({ ...f, merakiRegion: e.target.value as 'com' | 'in' }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-white/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-shadow appearance-none cursor-pointer"
                >
                  <option value="com">Global (api.meraki.com)</option>
                  <option value="in">India (api.meraki.in)</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground rotate-90 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border/50">
              <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                {submitting ? 'Connecting…' : 'Connect Organization'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Organizations List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
          <Building2 size={40} className="mb-4 opacity-50" />
          <p>Loading organizations...</p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border-2 border-dashed border-border/60 bg-white/20">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <Building2 size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">
            No organizations connected
          </h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Add your Meraki organization to get started with monitoring and snapshots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orgs.map(org => (
            <div
              key={org.id}
              className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-blue-300/50 transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm group-hover:scale-105 transition-transform">
                  <Building2 size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground group-hover:text-blue-700 transition-colors">
                    {org.meraki_org_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <code className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                      {org.meraki_org_id}
                    </code>
                    <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100">
                      <Globe size={10} className="mr-1" />
                      {org.meraki_region === 'in' ? 'India' : 'Global'}
                    </Badge>
                    {org.device_count > 0 && (
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50/50">
                        {org.device_count} devices
                      </Badge>
                    )}
                  </div>
                  {org.last_synced_at && (
                    <div className="text-xs text-muted-foreground mt-1.5">
                      Last synced {new Date(org.last_synced_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {onSelectOrg && (
                  <Button
                    onClick={() => onSelectOrg(org.id, org.meraki_org_name)}
                    className="flex-1 md:flex-none shadow-sm"
                  >
                    Select
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveOrg(org.id, org.meraki_org_name)}
                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  title="Remove organization"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
