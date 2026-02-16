import React, { useEffect, useState } from 'react';
import { Plus, ChevronRight, Trash2 } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

interface Company {
  id: number;
  name: string;
  user_count: number;
  created_at: string;
}

interface CompaniesPageProps {
  onSelectCompany: (id: number) => void;
}

export function CompaniesPage({ onSelectCompany }: CompaniesPageProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await apiClient.listAdminCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Load companies error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await apiClient.createAdminCompany(newName.trim());
      setNewName('');
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this company? All associated users will lose their company assignment.')) return;
    try {
      await apiClient.deleteAdminCompany(id);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to delete company');
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Companies</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Manage customer companies and their users.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px',
            backgroundColor: '#2563eb', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add Company
        </button>
      </div>

      {showForm && (
        <div style={{
          marginBottom: '20px', padding: '16px 20px',
          border: '1px solid var(--color-border-primary)', borderRadius: '8px',
          backgroundColor: 'var(--color-bg-secondary)',
          display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              COMPANY NAME
            </label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Acme Corp"
              style={{
                width: '100%', padding: '8px 12px', fontSize: '13px',
                border: '1px solid var(--color-border-primary)', borderRadius: '5px',
                backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {error && <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{error}</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', paddingTop: '22px' }}>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              style={{
                padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff',
                border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600,
                cursor: creating ? 'not-allowed' : 'pointer',
              }}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewName(''); setError(''); }}
              style={{
                padding: '8px 14px', backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-primary)', borderRadius: '5px',
                fontSize: '13px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
            Loading companies…
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Company Name</th>
                <th style={{ ...TH, width: '120px' }}>Users</th>
                <th style={{ ...TH, width: '160px' }}>Created</th>
                <th style={{ ...TH, width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...TD, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No companies found
                  </td>
                </tr>
              ) : companies.map(c => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCompany(c.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      {c.id === 1 && (
                        <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#e8f5eb', color: '#025115', borderRadius: '3px', border: '1px solid #bbdfc4' }}>
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={TD}>{c.user_count}</td>
                  <td style={{ ...TD, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      {c.id !== 1 && (
                        <button
                          onClick={e => handleDelete(c.id, e)}
                          style={{
                            padding: '4px 8px', background: 'transparent',
                            border: '1px solid var(--color-border-subtle)', borderRadius: '4px',
                            cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center',
                          }}
                          title="Delete company"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); onSelectCompany(c.id); }}
                        style={{
                          padding: '4px 8px', background: 'transparent',
                          border: '1px solid var(--color-border-subtle)', borderRadius: '4px',
                          cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
