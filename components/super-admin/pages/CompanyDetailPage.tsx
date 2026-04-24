import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  subscription_tier: string;
  created_at: string;
}

interface Company {
  id: number;
  name: string;
  created_at: string;
  users: User[];
}

interface CompanyDetailPageProps {
  companyId: number;
  onBack: () => void;
}

export function CompanyDetailPage({ companyId, onBack }: CompanyDetailPageProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', role: 'user' });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const data = await apiClient.getAdminCompany(companyId);
      setCompany(data);
      setNameValue(data.name);
    } catch (err) {
      console.error('Load company detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [companyId]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || !company) return;
    try {
      await apiClient.updateAdminCompany(companyId, nameValue.trim());
      setEditingName(false);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to update company name');
    }
  };

  const handleChangeRole = async (userId: number, role: string) => {
    try {
      await apiClient.updateAdminUser(userId, { role });
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!confirm('Remove this user?')) return;
    try {
      await apiClient.deleteAdminUser(userId);
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
      await apiClient.createCompanyUser({ ...newUser, companyId });
      setNewUser({ email: '', password: '', fullName: '', role: 'user' });
      setShowAddUser(false);
      await load();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const TH: React.CSSProperties = {
    padding: '10px 16px', fontSize: '11px', fontWeight: 600,
    color: 'var(--color-text-tertiary)', textAlign: 'left',
    backgroundColor: 'var(--color-bg-secondary)',
    borderBottom: '1px solid var(--color-border-subtle)',
  };
  const TD: React.CSSProperties = {
    padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-primary)',
    borderBottom: '1px solid var(--color-border-subtle)',
  };

  if (loading) {
    return <div style={{ padding: '32px', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>Loading…</div>;
  }
  if (!company) {
    return <div style={{ padding: '32px', fontSize: '14px', color: '#dc2626' }}>Company not found.</div>;
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '20px', background: 'none', border: 'none',
          fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0,
        }}
      >
        <ArrowLeft size={14} /> Back to Companies
      </button>

      {/* Company name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        {editingName ? (
          <>
            <input
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              style={{
                fontSize: '22px', fontWeight: 700, padding: '4px 8px',
                border: '1px solid var(--color-border-primary)', borderRadius: '5px',
                backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', outline: 'none',
              }}
            />
            <button onClick={handleSaveName} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}>
              <Check size={18} />
            </button>
            <button onClick={() => setEditingName(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
              <X size={18} />
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {company.name}
            </h1>
            <button
              onClick={() => setEditingName(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}
            >
              <Edit2 size={14} />
            </button>
          </>
        )}
      </div>

      {/* Users section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          Users ({company.users.length})
        </h2>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', backgroundColor: '#2563eb', color: '#fff',
            border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={12} /> Add User
        </button>
      </div>

      {showAddUser && (
        <div style={{
          marginBottom: '16px', padding: '16px 20px',
          border: '1px solid var(--color-border-primary)', borderRadius: '8px',
          backgroundColor: 'var(--color-bg-secondary)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
            {[
              { label: 'EMAIL', key: 'email', type: 'email', placeholder: 'user@example.com' },
              { label: 'PASSWORD', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'FULL NAME', key: 'fullName', type: 'text', placeholder: 'Optional' },
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
                    width: '100%', padding: '7px 10px', fontSize: '13px', boxSizing: 'border-box',
                    border: '1px solid var(--color-border-primary)', borderRadius: '5px',
                    backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', outline: 'none',
                  }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAddUser}
                disabled={adding}
                style={{ padding: '7px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                {adding ? 'Adding…' : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddUser(false); setAddError(''); }}
                style={{ padding: '7px 12px', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: '5px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
          {addError && <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>{addError}</div>}
        </div>
      )}

      <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Email</th>
              <th style={TH}>Name</th>
              <th style={{ ...TH, width: '140px' }}>Role</th>
              <th style={{ ...TH, width: '120px' }}>Tier</th>
              <th style={{ ...TH, width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {company.users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...TD, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                  No users in this company
                </td>
              </tr>
            ) : company.users.map(u => (
              <tr key={u.id}>
                <td style={TD}>{u.email}</td>
                <td style={{ ...TD, color: 'var(--color-text-secondary)' }}>{u.full_name || '—'}</td>
                <td style={TD}>
                  <select
                    value={u.role}
                    onChange={e => handleChangeRole(u.id, e.target.value)}
                    style={{
                      padding: '4px 8px', fontSize: '12px',
                      border: '1px solid var(--color-border-primary)', borderRadius: '4px',
                      backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="user">User</option>
                    <option value="company_admin">Company Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td style={{ ...TD, fontSize: '12px' }}>{u.subscription_tier}</td>
                <td style={TD}>
                  <button
                    onClick={() => handleRemoveUser(u.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                    title="Remove user"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
