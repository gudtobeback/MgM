import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type ToolMode =
  | 'selection' | 'migration' | 'backup' | 'restore'
  | 'version-control' | 'organizations' | 'drift' | 'compliance'
  | 'bulk-ops' | 'dashboard' | 'security' | 'change-management'
  | 'documentation' | 'scheduler' | 'cross-region' | 'profile' | 'cat9k' | 'team';

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
        height: '100vh',
        overflow: 'hidden',
        background: 'transparent',
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

      {/* Body: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Sidebar
          activeMode={toolMode}
          onNavigate={onNavigate}
          selectedOrgName={selectedOrgName}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          userRole={user?.role}
        />

        {/* Main content — only this area scrolls, scrollbar hidden */}
        <main
          className="no-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'rgb(226, 238, 251)',
            minWidth: 0,
          }}
        >
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
