import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ToolMode, ROUTE_TO_TOOL_MODE } from "../../types/routes";
import { Toaster } from "../ui/sonner";

interface AppShellProps {
  user: any;
  selectedOrgId?: string | null;
  selectedOrgName?: string;
  onNavigate: (mode: ToolMode) => void;
  onLogout: () => void;
  userPermissions?: Record<string, boolean>;
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  selectedOrgName,
  onNavigate,
  onLogout,
  userPermissions,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Determine current tool mode from route
  const currentToolMode: ToolMode =
    ROUTE_TO_TOOL_MODE[location.pathname] || "selection";

  return (
    <div className="flex h-screen">
      <Sidebar
        activeMode={currentToolMode}
        onNavigate={onNavigate}
        selectedOrgName={selectedOrgName}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        userRole={user?.role}
        userPermissions={userPermissions}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Top Bar — full width, always at the top */}
        <div className="shrink-0 z-50">
          <TopBar
            user={user}
            toolMode={currentToolMode}
            selectedOrgName={selectedOrgName}
            onNavigate={onNavigate}
          />
        </div>

        {/* Main content — only this area scrolls, scrollbar hidden */}
        <main className="flex-1 overflow-y-auto no-scrollbar min-w-0 bg-[#F9F9F9]">
          <div className="min-h-full p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
};
