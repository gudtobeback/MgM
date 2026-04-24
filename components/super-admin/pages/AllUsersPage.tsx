import React, { useEffect, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

interface UserRow {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  subscription_tier: string;
  company_id: number | null;
  company_name: string | null;
  created_at: string;
}

export function AllUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const data = await apiClient.listAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpdateRole = async (userId: number, role: string) => {
    try {
      await apiClient.updateAdminUser(userId, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await apiClient.deleteAdminUser(userId);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const filtered = users.filter(u =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.company_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_BADGE: Record<string, React.CSSProperties> = {
    super_admin: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    company_admin: { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
    user: { backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-tertiary)', border: '1px solid var(--color-border-subtle)' },
  };

  const TH: React.CSSProperties = {
    padding: '10px 16px', fontSize: '11px', fontWeight: 600,
    color: 'var(--color-text-tertiary)', textAlign: 'left',
    backgroundColor: 'var(--color-bg-secondary)',
    borderBottom: '1px solid var(--color-border-subtle)',
  };
  const TD: React.CSSProperties = {
    padding: '11px 16px', fontSize: '13px', color: 'var(--color-text-primary)',
    borderBottom: '1px solid var(--color-border-subtle)',
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>All Users</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          View and manage all users across all companies.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '360px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email, name, or company…"
          style={{
            width: '100%', padding: '8px 12px 8px 34px', fontSize: '13px',
            border: '1px solid var(--color-border-primary)', borderRadius: '6px',
            backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
            Loading users…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Email</th>
                  <th style={TH}>Name</th>
                  <th style={{ ...TH, width: '140px' }}>Role</th>
                  <th style={{ ...TH, width: '160px' }}>Company</th>
                  <th style={{ ...TH, width: '100px' }}>Tier</th>
                  <th style={{ ...TH, width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...TD, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                      {search ? 'No users match your search' : 'No users found'}
                    </td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td style={TD}>{u.email}</td>
                    <td style={{ ...TD, color: 'var(--color-text-secondary)' }}>{u.full_name || '—'}</td>
                    <td style={TD}>
                      <select
                        value={u.role}
                        onChange={e => handleUpdateRole(u.id, e.target.value)}
                        style={{
                          padding: '4px 8px', fontSize: '12px',
                          border: '1px solid var(--color-border-primary)', borderRadius: '4px',
                          backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
                        }}
                      >
                        <option value="user">User</option>
                        <option value="company_admin">Company Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td style={{ ...TD, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {u.company_name || '—'}
                    </td>
                    <td style={{ ...TD, fontSize: '12px' }}>{u.subscription_tier}</td>
                    <td style={TD}>
                      <button
                        onClick={() => handleDelete(u.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                        title="Delete user"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
        {filtered.length} of {users.length} users
      </div>
    </div>
  );
}
