import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import {
  Plus, ChevronDown, ChevronUp, Calendar, User, FileText,
  Layers, Shield, Wifi, Server, Network, Cpu, HardDrive,
  Settings, CheckCircle2, XCircle, Clock, AlertTriangle,
  CheckCheck, Circle, Ban, Upload,
} from 'lucide-react';
import { PushChangePanel } from './PushChangePanel';

// ── Types ────────────────────────────────────────────────────────────────────

interface AffectedResources {
  devices: string[];
  networks: string[];
  specificChanges: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  rollbackPlan: string;
}

interface ChangeRequest {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  change_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  planned_at: string | null;
  affected_resources: AffectedResources | null;
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

// ── Constants ────────────────────────────────────────────────────────────────

const CHANGE_TYPES = [
  { value: 'vlan',          label: 'VLAN Configuration',   Icon: Layers },
  { value: 'firewall',      label: 'Firewall Rules',        Icon: Shield },
  { value: 'ssid',          label: 'SSID / Wireless',       Icon: Wifi },
  { value: 'device',        label: 'Device Add / Remove',   Icon: Server },
  { value: 'network',       label: 'Network Settings',      Icon: Network },
  { value: 'firmware',      label: 'Firmware Update',       Icon: Cpu },
  { value: 'switch-port',   label: 'Switch Port Config',    Icon: HardDrive },
  { value: 'access-policy', label: 'Access Policy',         Icon: CheckCheck },
  { value: 'other',         label: 'Other',                 Icon: Settings },
];

const RISK_LEVELS = [
  { value: 'low',      label: 'Low',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { value: 'medium',   label: 'Medium',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { value: 'high',     label: 'High',     color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { value: 'critical', label: 'Critical', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: 'Pending Review', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  approved:  { label: 'Approved',       color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  rejected:  { label: 'Rejected',       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  completed: { label: 'Completed',      color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  cancelled: { label: 'Cancelled',      color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dt: string | null | undefined) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function parseList(s: string): string[] {
  return s.split(/[\n,]+/).map(x => x.trim()).filter(Boolean);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

function RiskBadge({ level }: { level?: string }) {
  const c = RISK_LEVELS.find(r => r.value === level);
  if (!c) return null;
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
      {c.label} Risk
    </span>
  );
}

function TypeBadge({ changeType }: { changeType: string }) {
  const t = CHANGE_TYPES.find(x => x.value === changeType);
  const label = t ? t.label : changeType.charAt(0).toUpperCase() + changeType.slice(1);
  return (
    <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
      {label}
    </span>
  );
}

function AuditTrail({ change }: { change: ChangeRequest }) {
  type Step = { label: string; time: string | null; by: string | null; notes?: string | null; done: boolean; dotColor: string };

  const isNegative = change.status === 'rejected' || change.status === 'cancelled';

  const steps: Step[] = [
    {
      label: 'Change request submitted',
      time: change.created_at,
      by: change.requested_by_email,
      done: true,
      dotColor: '#2563eb',
    },
    {
      label: 'Under review',
      time: null,
      by: null,
      done: change.status !== 'pending',
      dotColor: '#d97706',
    },
    {
      label: change.status === 'rejected' ? 'Rejected' : change.status === 'cancelled' ? 'Cancelled' : 'Approved',
      time: change.approved_at,
      by: change.approved_by_email,
      notes: change.notes,
      done: !['pending'].includes(change.status),
      dotColor: isNegative ? '#dc2626' : '#16a34a',
    },
  ];

  if (!isNegative) {
    steps.push({
      label: 'Change completed',
      time: change.completed_at,
      by: null,
      done: change.status === 'completed',
      dotColor: '#2563eb',
    });
  }

  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)', marginBottom: '14px' }}>
        Approval Trail
      </div>
      <div style={{ position: 'relative', paddingLeft: '28px' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: '8px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--color-border-subtle)' }} />

        {steps.map((step, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: i < steps.length - 1 ? '18px' : 0 }}>
            {/* Dot */}
            <div style={{
              position: 'absolute', left: '-22px', top: '3px',
              width: '14px', height: '14px', borderRadius: '50%',
              backgroundColor: step.done ? step.dotColor : 'var(--color-bg-primary)',
              border: `2px solid ${step.done ? step.dotColor : 'var(--color-border-primary)'}`,
              zIndex: 1, flexShrink: 0,
            }} />

            <div style={{ fontSize: '13px', fontWeight: step.done ? 600 : 400, color: step.done ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
              {step.label}
            </div>
            {step.done && (step.by || step.time) && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
                {step.by && <span>{step.by}</span>}
                {step.by && step.time && <span> · </span>}
                {step.time && <span>{fmt(step.time)}</span>}
              </div>
            )}
            {step.notes && (
              <div style={{
                marginTop: '6px', padding: '8px 12px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-subtle)',
                borderLeft: `3px solid ${step.dotColor}`,
                borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-secondary)',
              }}>
                {step.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const INPUT = {
  width: '100%' as const, padding: '8px 12px', fontSize: '13px',
  border: '1px solid var(--color-border-primary)', borderRadius: '5px',
  backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
  outline: 'none', boxSizing: 'border-box' as const,
};
const LABEL = {
  display: 'block' as const, fontSize: '12px', fontWeight: 600 as const,
  color: 'var(--color-text-secondary)', marginBottom: '5px',
  letterSpacing: '0.04em', textTransform: 'uppercase' as const,
};

export const ChangeManagementPage: React.FC<ChangeManagementPageProps> = ({ organizationId, organizationName }) => {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'trail'>('details');
  const [rejectState, setRejectState] = useState<{ id: string; reason: string } | null>(null);
  const [pushPanelId, setPushPanelId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    changeType: 'network',
    plannedAt: '',
    affectedDevices: '',
    affectedNetworks: '',
    specificChanges: '',
    riskLevel: 'medium',
    rollbackPlan: '',
  });

  useEffect(() => { loadChanges(); }, [organizationId, statusFilter]);

  const loadChanges = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.listChanges(organizationId, statusFilter !== 'all' ? statusFilter : undefined);
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
        affectedResources: {
          devices: parseList(form.affectedDevices),
          networks: parseList(form.affectedNetworks),
          specificChanges: form.specificChanges,
          riskLevel: form.riskLevel,
          rollbackPlan: form.rollbackPlan,
        },
      });
      setForm({ title: '', description: '', changeType: 'network', plannedAt: '', affectedDevices: '', affectedNetworks: '', specificChanges: '', riskLevel: 'medium', rollbackPlan: '' });
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
      setRejectState(null);
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
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Change Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {organizationName ? `${organizationName} — ` : ''}Track, review, and approve network configuration changes with full audit trail.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px',
            backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '5px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> New Request
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px', fontSize: '13px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* ── New Request Form ── */}
      {showForm && (
        <div style={{ marginBottom: '24px', border: '1px solid var(--color-border-primary)', borderRadius: '8px', backgroundColor: 'var(--color-bg-primary)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border-primary)', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            New Change Request
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Title + Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '12px' }}>
              <div>
                <label style={LABEL}>Title *</label>
                <input style={INPUT} type="text" required placeholder="e.g. Add Guest VLAN to branch sites" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL}>Change Type *</label>
                <select style={INPUT} value={form.changeType} onChange={e => setForm(f => ({ ...f, changeType: e.target.value }))}>
                  {CHANGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={LABEL}>Description / Justification *</label>
              <textarea style={{ ...INPUT, resize: 'vertical' as const }} required rows={3} placeholder="Describe what will change, why it's needed, and expected business impact..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Affected Devices + Networks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={LABEL}>Affected Devices</label>
                <textarea style={{ ...INPUT, resize: 'vertical' as const }} rows={2} placeholder="Enter serial numbers or device names, one per line or comma-separated" value={form.affectedDevices} onChange={e => setForm(f => ({ ...f, affectedDevices: e.target.value }))} />
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '3px' }}>e.g. Q2QN-XXXX-XXXX, Branch-SW-01</div>
              </div>
              <div>
                <label style={LABEL}>Affected Networks</label>
                <textarea style={{ ...INPUT, resize: 'vertical' as const }} rows={2} placeholder="Enter network names, one per line or comma-separated" value={form.affectedNetworks} onChange={e => setForm(f => ({ ...f, affectedNetworks: e.target.value }))} />
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '3px' }}>e.g. Branch-Mumbai, HQ-Network</div>
              </div>
            </div>

            {/* Specific Changes */}
            <div>
              <label style={LABEL}>Specific Changes to be Made *</label>
              <textarea style={{ ...INPUT, resize: 'vertical' as const }} required rows={3} placeholder={`Describe exactly what configuration will change, e.g.:\n- VLAN 100 (Guest) will be added\n- Firewall rule: Allow TCP 443 from 10.0.0.0/8 to any\n- Port Gi1/0/5 mode changed from trunk to access VLAN 50`} value={form.specificChanges} onChange={e => setForm(f => ({ ...f, specificChanges: e.target.value }))} />
            </div>

            {/* Rollback Plan */}
            <div>
              <label style={LABEL}>Rollback Plan</label>
              <textarea style={{ ...INPUT, resize: 'vertical' as const }} rows={2} placeholder="How will the change be reversed if something goes wrong?" value={form.rollbackPlan} onChange={e => setForm(f => ({ ...f, rollbackPlan: e.target.value }))} />
            </div>

            {/* Risk + Planned Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', alignItems: 'start' }}>
              <div>
                <label style={LABEL}>Risk Level</label>
                <select style={INPUT} value={form.riskLevel} onChange={e => setForm(f => ({ ...f, riskLevel: e.target.value }))}>
                  {RISK_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>Planned Date / Time (optional)</label>
                <input style={INPUT} type="datetime-local" value={form.plannedAt} onChange={e => setForm(f => ({ ...f, plannedAt: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button type="submit" disabled={submitting} style={{ padding: '8px 20px', backgroundColor: submitting ? '#6b7280' : '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: '5px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {(['all', 'pending', 'approved', 'completed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: '5px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              backgroundColor: statusFilter === s ? '#2563eb' : 'var(--color-bg-primary)',
              color: statusFilter === s ? '#ffffff' : 'var(--color-text-secondary)',
              border: statusFilter === s ? '1px solid #2563eb' : '1px solid var(--color-border-primary)',
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {counts[s as keyof typeof counts] > 0 && (
              <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>({counts[s as keyof typeof counts]})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Change Request List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading change requests…</div>
      ) : changes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--color-border-primary)', borderRadius: '8px' }}>
          <FileText size={32} color="var(--color-text-tertiary)" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>No Change Requests</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Create a request to track planned configuration updates.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {changes.map(change => {
            const ar = change.affected_resources;
            const isExpanded = expandedId === change.id;
            const isRejecting = rejectState?.id === change.id;

            return (
              <div key={change.id} style={{ border: '1px solid var(--color-border-primary)', borderRadius: '8px', backgroundColor: 'var(--color-bg-primary)', overflow: 'hidden' }}>

                {/* Card header row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => { setExpandedId(isExpanded ? null : change.id); setActiveTab('details'); setRejectState(null); }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{change.title}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <StatusBadge status={change.status} />
                      <TypeBadge changeType={change.change_type} />
                      {ar?.riskLevel && <RiskBadge level={ar.riskLevel} />}
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        {change.requested_by_email} · {fmt(change.created_at)}
                      </span>
                      {ar?.devices && ar.devices.length > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                          {ar.devices.length} device{ar.devices.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={15} color="var(--color-text-tertiary)" /> : <ChevronDown size={15} color="var(--color-text-tertiary)" />}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--color-border-subtle)' }}>

                    {/* Tab switcher */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-secondary)' }}>
                      {(['details', 'trail'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          style={{
                            padding: '11px 20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            border: 'none', background: 'none',
                            color: activeTab === tab ? '#2563eb' : 'var(--color-text-secondary)',
                            borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                          }}
                        >
                          {tab === 'details' ? 'Change Details' : 'Approval Trail'}
                        </button>
                      ))}
                    </div>

                    <div style={{ padding: '22px 24px' }}>

                      {/* ── Details tab ── */}
                      {activeTab === 'details' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                          {/* Description */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)', marginBottom: '6px' }}>Description</div>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{change.description}</p>
                          </div>

                          {/* Specific changes */}
                          {ar?.specificChanges && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)', marginBottom: '6px' }}>Specific Changes</div>
                              <pre style={{ fontSize: '12px', color: 'var(--color-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)', borderRadius: '5px', padding: '10px 12px', margin: 0, fontFamily: 'inherit' }}>
                                {ar.specificChanges}
                              </pre>
                            </div>
                          )}

                          {/* Affected devices + networks */}
                          {(ar?.devices?.length || ar?.networks?.length) ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              {ar?.devices && ar.devices.length > 0 && (
                                <div>
                                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)', marginBottom: '6px' }}>Affected Devices ({ar.devices.length})</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {ar.devices.map((d, i) => (
                                      <span key={i} style={{ fontSize: '12px', color: 'var(--color-text-primary)', padding: '3px 8px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {ar?.networks && ar.networks.length > 0 && (
                                <div>
                                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)', marginBottom: '6px' }}>Affected Networks ({ar.networks.length})</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {ar.networks.map((n, i) => (
                                      <span key={i} style={{ fontSize: '12px', color: 'var(--color-text-primary)', padding: '3px 8px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)', borderRadius: '4px' }}>
                                        {n}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}

                          {/* Rollback plan */}
                          {ar?.rollbackPlan && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)', marginBottom: '6px' }}>Rollback Plan</div>
                              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{ar.rollbackPlan}</p>
                            </div>
                          )}

                          {/* Planned date */}
                          {change.planned_at && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              <Calendar size={13} />
                              Planned for: <strong>{fmt(change.planned_at)}</strong>
                            </div>
                          )}

                          {/* ── Action buttons ── */}
                          {change.status === 'pending' && (
                            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '18px' }}>
                              {!isRejecting ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => handleAction(change.id, 'approve')}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    <CheckCircle2 size={14} /> Approve
                                  </button>
                                  <button
                                    onClick={() => setRejectState({ id: change.id, reason: '' })}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    <XCircle size={14} /> Reject
                                  </button>
                                  <button
                                    onClick={() => handleAction(change.id, 'cancel')}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: '5px', fontSize: '13px', cursor: 'pointer' }}
                                  >
                                    <Ban size={13} /> Cancel
                                  </button>
                                </div>
                              ) : (
                                <div style={{ padding: '14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>Rejection Reason</div>
                                  <textarea
                                    value={rejectState.reason}
                                    onChange={e => setRejectState(s => s ? { ...s, reason: e.target.value } : s)}
                                    placeholder="Provide a reason for rejection (optional but recommended)..."
                                    rows={3}
                                    style={{ ...INPUT, marginBottom: '10px', resize: 'vertical' as const }}
                                    autoFocus
                                  />
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      onClick={() => handleAction(change.id, 'reject', rejectState.reason || undefined)}
                                      style={{ padding: '7px 16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      Confirm Rejection
                                    </button>
                                    <button
                                      onClick={() => setRejectState(null)}
                                      style={{ padding: '7px 14px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: '5px', fontSize: '13px', cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {change.status === 'approved' && (
                            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '18px' }}>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => { setPushPanelId(pushPanelId === change.id ? null : change.id); setRejectState(null); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  <Upload size={14} /> Push to Network
                                </button>
                                <button
                                  onClick={() => handleAction(change.id, 'complete')}
                                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  <CheckCheck size={14} /> Mark as Completed
                                </button>
                              </div>
                              {pushPanelId === change.id && (
                                <PushChangePanel
                                  change={change}
                                  onComplete={async () => { await handleAction(change.id, 'complete'); setPushPanelId(null); }}
                                  onCancel={() => setPushPanelId(null)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Audit Trail tab ── */}
                      {activeTab === 'trail' && <AuditTrail change={change} />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
