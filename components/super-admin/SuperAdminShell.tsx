import React from 'react';
import { LayoutDashboard, Building2, Users, FileText, LogOut } from 'lucide-react';

export type SuperAdminPage = 'overview' | 'companies' | 'company-detail' | 'users' | 'audit';

interface SuperAdminShellProps {
  activePage: SuperAdminPage;
  onNavigate: (page: SuperAdminPage) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: SuperAdminPage; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { id: 'companies', label: 'Companies', icon: <Building2 size={16} /> },
  { id: 'users', label: 'All Users', icon: <Users size={16} /> },
  { id: 'audit', label: 'Audit Log', icon: <FileText size={16} /> },
];

export function SuperAdminShell({ activePage, onNavigate, onLogout, children }: SuperAdminShellProps) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        minWidth: '220px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        {/* Logo / Brand */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--sidebar-border)',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sidebar-text-active)', letterSpacing: '0.02em' }}>
            MSP Admin Portal
          </div>
          <div style={{ fontSize: '11px', color: 'var(--sidebar-text-muted)', marginTop: '2px' }}>
            Super Administrator
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: '8px' }}>
          {NAV_ITEMS.map(item => {
            const active = activePage === item.id || (activePage === 'company-detail' && item.id === 'companies');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px',
                  background: active ? 'var(--sidebar-bg-active)' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${active ? 'var(--sidebar-accent)' : 'transparent'}`,
                  color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: active ? 'var(--sidebar-accent)' : 'var(--sidebar-text-muted)', display: 'flex' }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: '1px solid var(--sidebar-border)', padding: '8px 0' }}>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 16px',
              fontSize: '14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--sidebar-text)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', color: 'var(--sidebar-text-muted)' }}><LogOut size={16} /></span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        {children}
      </main>
    </div>
  );
}
