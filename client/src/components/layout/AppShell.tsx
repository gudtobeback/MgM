import React, { useState } from "react";

import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Toaster } from "../ui/sonner";

import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/src/context/AuthContext";

export const AppShell = () => {
  const { authLoading, accessToken } = useAuth();

  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen font-semibold text-lg">
        Restoring Session...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Top Bar — full width, always at the top */}
        <div className="shrink-0 z-50">{/* <TopBar /> */}</div>

        {/* Main content — only this area scrolls, scrollbar hidden */}
        <main className="flex-1 overflow-y-auto no-scrollbar min-w-0 bg-[#F8FAFC]">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
};
