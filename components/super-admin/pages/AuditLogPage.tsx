import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

interface AuditEntry {
  id: string;
  action: string;
  details: any;
  ip_address: string | null;
  created_at: string;
  user_email: string | null;
}

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAuditLog(200);
      setEntries(data);
    } catch (err) {
      console.error('Load audit log error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const TH: React.CSSProperties = {
    padding: '10px 16px', fontSize: '11px', fontWeight: 600,
    color: 'var(--color-text-tertiary)', textAlign: 'left',
    backgroundColor: 'var(--color-bg-secondary)',
    borderBottom: '1px solid var(--color-border-subtle)',
  };
  const TD: React.CSSProperties = {
    padding: '10px 16px', fontSize: '12px', color: 'var(--color-text-primary)',
    borderBottom: '1px solid var(--color-border-subtle)',
    fontFamily: 'var(--font-mono)',
  };

  const actionColor = (action: string) => {
    if (action.includes('login')) return '#1d4ed8';
    if (action.includes('register')) return '#2563eb';
    if (action.includes('delete') || action.includes('disconnect')) return '#dc2626';
    return 'var(--color-text-secondary)';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Audit Log</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Recent system events across all users.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px',
            backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-primary)', borderRadius: '6px',
            fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading && entries.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
            Loading audit log…
          </div>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ ...TH, width: '160px' }}>Timestamp</th>
                  <th style={TH}>User</th>
                  <th style={{ ...TH, width: '220px' }}>Action</th>
                  <th style={TH}>Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...TD, textAlign: 'center', color: 'var(--color-text-tertiary)', fontFamily: 'inherit' }}>
                      No audit entries found
                    </td>
                  </tr>
                ) : entries.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ ...TD, fontSize: '11px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td style={{ ...TD, fontFamily: 'inherit', fontSize: '12px' }}>
                      {entry.user_email || <span style={{ color: 'var(--color-text-tertiary)' }}>system</span>}
                    </td>
                    <td style={{ ...TD, color: actionColor(entry.action), fontWeight: 500 }}>
                      {entry.action}
                    </td>
                    <td style={{ ...TD, color: 'var(--color-text-tertiary)', fontSize: '11px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.details ? JSON.stringify(entry.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
        Showing {entries.length} entries
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
