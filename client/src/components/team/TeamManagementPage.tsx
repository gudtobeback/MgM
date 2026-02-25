import React, { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, Save } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const FEATURE_KEYS = [
  { key: 'backup', label: 'Backup Config' },
  { key: 'restore', label: 'Restore Backup' },
  { key: 'migration', label: 'Full Migration' },
  { key: 'cat9k', label: 'Cat9K Migration' },
  { key: 'change-management', label: 'Change Management' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'drift', label: 'Drift Detection' },
  { key: 'scheduler', label: 'Scheduler' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'security', label: 'Security Posture' },
];

interface TeamUser {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  subscription_tier: string;
  permissions: Record<string, boolean>;
}

export function TeamManagementPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [permEdits, setPermEdits] = useState<Record<number, Record<string, boolean>>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', role: 'user' });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const data = await apiClient.listCompanyUsers();
      setUsers(data);
    } catch (err) {
      console.error('Load team users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (userId: number, currentPerms: Record<string, boolean>) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      // Initialize permission edits from current state
      if (!permEdits[userId]) {
        setPermEdits(prev => ({ ...prev, [userId]: { ...currentPerms } }));
      }
    }
  };

  const handlePermChange = (userId: number, feature: string, enabled: boolean) => {
    setPermEdits(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] ?? {}), [feature]: enabled },
    }));
  };

  const handleSavePerms = async (userId: number) => {
    setSavingId(userId);
    try {
      await apiClient.updateUserPermissions(userId, permEdits[userId] ?? {});
      await load();
      setExpandedUserId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save permissions');
    } finally {
      setSavingId(null);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!confirm('Remove this user from the team?')) return;
    try {
      await apiClient.deleteCompanyUser(userId);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to remove user');
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) { setAddError('Email and password are required'); return; }
    setAdding(true);
    setAddError('');
    try {
      await apiClient.createCompanyUser(newUser);
      setNewUser({ email: '', password: '', fullName: '', role: 'user' });
      setShowAddUser(false);
      await load();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const ROLE_LABEL: Record<string, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    user: 'User',
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            Team Management
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Manage your team members and their feature access permissions.
          </p>
        </div>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', backgroundColor: '#2563eb', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Plus size={14} /> Invite User
        </button>
      </div>

      {showAddUser && (
        <div style={{
          marginBottom: '20px', padding: '20px 24px',
          border: '1px solid var(--color-border-primary)', borderRadius: '8px',
          backgroundColor: 'var(--color-bg-secondary)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px', marginTop: 0 }}>
            Add New Team Member
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {[
              { label: 'EMAIL ADDRESS', key: 'email', type: 'email', placeholder: 'user@example.com' },
              { label: 'PASSWORD', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'FULL NAME (OPTIONAL)', key: 'fullName', type: 'text', placeholder: 'Jane Smith' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: '5px', letterSpacing: '0.04em' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={(newUser as any)[field.key]}
                  onChange={e => setNewUser(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box',
                    border: '1px solid var(--color-border-primary)', borderRadius: '5px',
                    backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', outline: 'none',
                  }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: '5px', letterSpacing: '0.04em' }}>
                ROLE
              </label>
              <select
                value={newUser.role}
                onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box',
                  border: '1px solid var(--color-border-primary)', borderRadius: '5px',
                  backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
                }}
              >
                <option value="user">User</option>
                <option value="company_admin">Company Admin</option>
              </select>
            </div>
          </div>
          {addError && <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '10px' }}>{addError}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddUser}
              disabled={adding}
              style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {adding ? 'Adding…' : 'Add User'}
            </button>
            <button
              onClick={() => { setShowAddUser(false); setAddError(''); }}
              style={{ padding: '8px 14px', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: '5px', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', padding: '32px 0', textAlign: 'center' }}>
          Loading team members…
        </div>
      ) : users.length === 0 ? (
        <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', padding: '32px 0', textAlign: 'center' }}>
          No team members yet. Invite someone to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map(user => {
            const isExpanded = expandedUserId === user.id;
            const edits = permEdits[user.id] ?? user.permissions;

            return (
              <div key={user.id} style={{ border: '1px solid var(--color-border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
                {/* User row header */}
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '14px 18px', gap: '12px',
                  backgroundColor: isExpanded ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                      {user.full_name || user.email}
                    </div>
                    {user.full_name && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{user.email}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                    backgroundColor: user.role === 'company_admin' ? '#eff6ff' : 'var(--color-bg-secondary)',
                    color: user.role === 'company_admin' ? '#1d4ed8' : 'var(--color-text-tertiary)',
                    border: `1px solid ${user.role === 'company_admin' ? '#bfdbfe' : 'var(--color-border-subtle)'}`,
                  }}>
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                  <button
                    onClick={() => toggleExpand(user.id, user.permissions)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px', fontSize: '12px', fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border-primary)', borderRadius: '4px', cursor: 'pointer',
                    }}
                  >
                    Permissions {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    style={{
                      padding: '5px 8px', background: 'transparent',
                      border: '1px solid var(--color-border-subtle)', borderRadius: '4px',
                      cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center',
                    }}
                    title="Remove user"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Permission panel */}
                {isExpanded && (
                  <div style={{ padding: '18px 20px', borderTop: '1px solid var(--color-border-primary)', backgroundColor: 'var(--color-bg-primary)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Feature Access
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                      {FEATURE_KEYS.map(feat => {
                        const enabled = edits[feat.key] !== false; // default true
                        return (
                          <label key={feat.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={e => handlePermChange(user.id, feat.key, e.target.checked)}
                              style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{feat.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleSavePerms(user.id)}
                        disabled={savingId === user.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '7px 16px', backgroundColor: '#2563eb', color: '#fff',
                          border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600,
                          cursor: savingId === user.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Save size={12} /> {savingId === user.id ? 'Saving…' : 'Save Permissions'}
                      </button>
                      <button
                        onClick={() => setExpandedUserId(null)}
                        style={{
                          padding: '7px 14px', backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border-primary)', borderRadius: '5px', fontSize: '12px', cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
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
}
