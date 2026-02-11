import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type ToolMode =
  | 'selection' | 'migration' | 'backup' | 'restore'
  | 'version-control' | 'organizations' | 'drift' | 'compliance'
  | 'bulk-ops' | 'dashboard' | 'security' | 'change-management'
  | 'documentation' | 'scheduler' | 'cross-region' | 'profile';

interface AppShellProps {
  user: any;
  toolMode: ToolMode;
  selectedOrgId?: string | null;
  selectedOrgName?: string;
  onNavigate: (mode: ToolMode) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  toolMode,
  selectedOrgId,
  selectedOrgName,
  onNavigate,
  onLogout,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100vh',        /* lock to viewport — prevents body scroll */
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Top Bar — full width, always at the top */}
      <div style={{ flexShrink: 0 }}>
        <TopBar
          user={user}
          toolMode={toolMode}
          selectedOrgName={selectedOrgName}
          onToggleSidebar={() => setSidebarCollapsed(v => !v)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      </div>

      {/* Body: Sidebar + Content — fills remaining height exactly (body height = 100vh - topbar) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Sidebar
          activeMode={toolMode}
          onNavigate={onNavigate}
          selectedOrgName={selectedOrgName}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        />

        {/* Main content — only this area scrolls */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--color-bg)',
            minWidth: 0,
          }}
        >
          <div className="p-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
