import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface ChangeRequest {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  change_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  planned_at: string | null;
  affected_resources: any;
  notes: string | null;
  requested_by_email: string;
  approved_by_email: string | null;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ChangeManagementPageProps {
  organizationId: string;
  organizationName?: string;
}

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: string }> = {
  pending: { label: 'Pending Review', style: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  approved: { label: 'Approved', style: 'bg-green-100 text-green-800', icon: '✅' },
  rejected: { label: 'Rejected', style: 'bg-red-100 text-red-800', icon: '❌' },
  completed: { label: 'Completed', style: 'bg-blue-100 text-blue-700', icon: '🏁' },
  cancelled: { label: 'Cancelled', style: 'bg-gray-100 text-gray-600', icon: '🚫' },
};

const CHANGE_TYPES = ['vlan', 'firewall', 'ssid', 'device', 'network', 'firmware', 'other'];

export const ChangeManagementPage: React.FC<ChangeManagementPageProps> = ({ organizationId, organizationName }) => {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    changeType: 'network',
    plannedAt: '',
  });

  useEffect(() => {
    loadChanges();
  }, [organizationId, statusFilter]);

  const loadChanges = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.listChanges(
        organizationId,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setChanges(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.createChangeRequest(organizationId, {
        title: form.title,
        description: form.description,
        changeType: form.changeType,
        plannedAt: form.plannedAt || undefined,
      });
      setForm({ title: '', description: '', changeType: 'network', plannedAt: '' });
      setShowForm(false);
      await loadChanges();
    } catch (err: any) {
      setError(err.message || 'Failed to create change request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (changeId: string, action: string, notes?: string) => {
    try {
      await apiClient.updateChangeRequest(organizationId, changeId, action, notes);
      await loadChanges();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} change request`);
    }
  };

  const counts = {
    all: changes.length,
    pending: changes.filter(c => c.status === 'pending').length,
    approved: changes.filter(c => c.status === 'approved').length,
    completed: changes.filter(c => c.status === 'completed').length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Change Management</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {organizationName ? `${organizationName} — ` : ''}Track and approve network configuration changes.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          + New Request
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* New Change Form */}
      {showForm && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">New Change Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Add Guest VLAN to all branch sites"
                required
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what will change, why, and the impact..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Change Type</label>
                <select
                  value={form.changeType}
                  onChange={e => setForm(f => ({ ...f, changeType: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {CHANGE_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Planned Date (optional)</label>
                <input
                  type="datetime-local"
                  value={form.plannedAt}
                  onChange={e => setForm(f => ({ ...f, plannedAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm hover:bg-[var(--color-surface-subtle)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'completed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] border border-[var(--color-border-primary)]'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {counts[s as keyof typeof counts] > 0 && (
              <span className="ml-1.5 text-xs opacity-75">({counts[s as keyof typeof counts]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Change Requests List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading change requests...</div>
      ) : changes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--color-border-primary)] rounded-xl">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">No Change Requests</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Create a change request to track planned configuration updates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {changes.map(change => (
            <div
              key={change.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                onClick={() => setExpandedId(expandedId === change.id ? null : change.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">{STATUS_CONFIG[change.status].icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">{change.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[change.status].style}`}>
                        {STATUS_CONFIG[change.status].label}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-[var(--color-surface-subtle)] rounded border border-[var(--color-border-primary)] capitalize">
                        {change.change_type}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        by {change.requested_by_email}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {new Date(change.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[var(--color-text-secondary)] ml-3 flex-shrink-0">
                  {expandedId === change.id ? '▲' : '▼'}
                </span>
              </div>

              {expandedId === change.id && (
                <div className="px-4 pb-4 border-t border-[var(--color-border-primary)] pt-3 space-y-3">
                  <p className="text-sm text-[var(--color-text-primary)]">{change.description}</p>

                  {change.planned_at && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Planned for: {new Date(change.planned_at).toLocaleString()}
                    </p>
                  )}

                  {change.approved_by_email && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {change.status === 'approved' ? 'Approved' : 'Reviewed'} by {change.approved_by_email}
                      {change.approved_at ? ` on ${new Date(change.approved_at).toLocaleString()}` : ''}
                    </p>
                  )}

                  {change.notes && (
                    <div className="bg-[var(--color-surface-subtle)] rounded-lg p-3 text-sm text-[var(--color-text-secondary)]">
                      <span className="font-medium">Notes: </span>{change.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {change.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleAction(change.id, 'approve')}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const notes = window.prompt('Reason for rejection (optional):');
                          handleAction(change.id, 'reject', notes ?? undefined);
                        }}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(change.id, 'cancel')}
                        className="px-3 py-1.5 border border-[var(--color-border-primary)] rounded-lg text-sm hover:bg-[var(--color-surface-subtle)]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {change.status === 'approved' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleAction(change.id, 'complete')}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
