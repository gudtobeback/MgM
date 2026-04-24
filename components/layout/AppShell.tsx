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
  userPermissions?: Record<string, boolean>;
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  toolMode,
  selectedOrgId,
  selectedOrgName,
  onNavigate,
  onLogout,
  children,
  userPermissions,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-transparent">
      {/* Top Bar — full width, always at the top */}
      <div className="shrink-0 z-50">
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
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar
          activeMode={toolMode}
          onNavigate={onNavigate}
          selectedOrgName={selectedOrgName}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          userRole={user?.role}
          userPermissions={userPermissions}
        />

        {/* Main content — only this area scrolls, scrollbar hidden */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-transparent min-w-0 p-4">
          <div className="glass-panel min-h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
