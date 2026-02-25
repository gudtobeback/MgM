import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { apiClient } from "./services/apiClient";
import {
  ToolMode,
  TOOL_MODE_ROUTES,
  ORG_REQUIRED_ROUTES,
  ROUTE_TO_TOOL_MODE,
} from "./types/routes";
import { AuthScreen } from "./pages/auth/AuthScreen";
import { AppShell } from "./components/layout/AppShell";
import { ModeSelectionScreen } from "./components/ModeSelectionScreen";
import { MigrationWizard } from "./components/MigrationWizard";
import { BackupWizard } from "./components/BackupWizard";
import { VersionControlPage } from "./components/version-control/VersionControlPage";
import { OrganizationsPage } from "./components/organizations/OrganizationsPage";
import { DriftDetectionPage } from "./components/drift/DriftDetectionPage";
import { CompliancePage } from "./components/compliance/CompliancePage";
import { BulkOperationsPage } from "./components/bulk-ops/BulkOperationsPage";
import { DashboardPage } from "./components/analytics/DashboardPage";
import { SecurityPage } from "./components/security/SecurityPage";
import { ChangeManagementPage } from "./components/change-management/ChangeManagementPage";
import { DocumentationPage } from "./components/docs/DocumentationPage";
import { SchedulerPage } from "./components/scheduler/SchedulerPage";
import { CrossRegionPage } from "./components/cross-region/CrossRegionPage";
import { ProfilePage } from "./components/profile/ProfilePage";
import { Cat9KMigrationWizard } from "./components/cat9k/Cat9KMigrationWizard";
import { RestoreWizard } from "./components/restore/RestoreWizard";
import { SuperAdminApp } from "./components/super-admin/SuperAdminApp";
import { TeamManagementPage } from "./components/team/TeamManagementPage";

import { toast } from "sonner";

import Home from "./pages/public/Home";

/**
 * Protected Route Wrapper Component
 * Checks if user has required organization for org-dependent routes
 * Derives toolMode from URL location to avoid prop drilling
 */
function ProtectedRouteWrapper({ connectedOrgs }: { connectedOrgs: any[] }) {
  const location = useLocation();
  const toolMode = ROUTE_TO_TOOL_MODE[location.pathname] as ToolMode;

  if (ORG_REQUIRED_ROUTES.includes(toolMode) && connectedOrgs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="text-center p-10 rounded-xl border max-w-md w-full"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border-primary)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--color-primary-light)" }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="var(--color-primary)"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            No Organizations Connected
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Connect a Meraki organization to access this feature.
          </p>
          <a
            href={TOOL_MODE_ROUTES.organizations}
            className="inline-block px-5 py-2 text-sm font-medium rounded text-white transition-colors"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--radius-md)",
            }}
          >
            Connect Organization
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

/**
 * Main App Component with Routing
 */
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<any | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState<string>("");
  const [connectedOrgs, setConnectedOrgs] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<
    Record<string, boolean>
  >(() => apiClient.getUserPermissions());

  // Memoize effective org values
  const effectiveOrgId = selectedOrgId ?? String(connectedOrgs[0]?.id ?? "");
  const effectiveOrgName =
    selectedOrgName || connectedOrgs[0]?.meraki_org_name || "";

  const fetchOrgs = async (currentSelectedId?: string | null) => {
    try {
      const orgs = await apiClient.listOrganizations();
      setConnectedOrgs(orgs);
      // Auto-select the first org if nothing is selected yet
      if (orgs.length > 0 && !currentSelectedId) {
        setSelectedOrgId(String(orgs[0].id));
        setSelectedOrgName(orgs[0].meraki_org_name);
      }
      // Background: refresh device counts from Meraki, then update state
      if (orgs.length > 0) {
        Promise.allSettled(
          orgs.map((o: any) => apiClient.refreshOrganization(o.id)),
        )
          .then(() =>
            apiClient
              .listOrganizations()
              .then(setConnectedOrgs)
              .catch(() => {}),
          )
          .catch(() => {});
      }
    } catch {
      setConnectedOrgs([]);
    }
  };

  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      setUser(apiClient.getUser());
      fetchOrgs(selectedOrgId);
      setUserPermissions(apiClient.getUserPermissions());
      apiClient
        .fetchAndCachePermissions()
        .then((perms) => setUserPermissions(perms))
        .catch(() => {});
    }
    setIsInitializing(false);
  }, []);

  // Redirect logic based on auth state
  useEffect(() => {
    const pathname = location.pathname;
    const isAuthPage = pathname === "/auth";
    const isHomePage = pathname === "/home" || pathname === "/";

    if (!user && !isInitializing && !isAuthPage && !isHomePage) {
      // Not authenticated and trying to access protected route
      navigate("/auth");
    } else if (user && isAuthPage) {
      // Authenticated but on auth page, redirect to selection
      navigate(TOOL_MODE_ROUTES.selection);
    }
  }, [user, isInitializing, location.pathname, navigate]);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
    fetchOrgs(null);
    apiClient
      .fetchAndCachePermissions()
      .then((perms) => setUserPermissions(perms))
      .catch(() => {});
  };

  const handleLogout = () => {
    apiClient.logout();
    setUser(null);
    setUserPermissions({});
    navigate("/home");
  };

  const handleNavigate = (mode: ToolMode) => {
    navigate(TOOL_MODE_ROUTES[mode]);
  };

  const handleSelectOrg = (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId);
    setSelectedOrgName(orgName);
    fetchOrgs(orgId);
    navigate(TOOL_MODE_ROUTES.selection);
  };

  const handleTierChange = () => {
    setUser(apiClient.getUser());
  };

  // Render ModeSelectionScreen element
  const renderModeSelection = () => (
    <ModeSelectionScreen
      onSelectMode={handleNavigate}
      selectedOrgName={selectedOrgName}
      userEmail={user?.email}
      connectedOrgs={connectedOrgs}
      onRefreshOrgs={async () => {
        try {
          const orgs = await apiClient.listOrganizations();
          if (orgs.length === 0) {
            toast.info("No organizations to sync.");
            return;
          }

          const results = await Promise.allSettled(
            orgs.map((o: any) => apiClient.refreshOrganization(o.id)),
          );

          const failed = results.filter((r) => r.status === "rejected");
          const succeeded = results.filter((r) => r.status === "fulfilled");

          const updated = await apiClient.listOrganizations();
          setConnectedOrgs(updated);

          const totalDevices = updated.reduce(
            (s: number, o: any) => s + (o.device_count ?? 0),
            0,
          );

          if (failed.length === 0) {
            toast.success(
              `Synced ${succeeded.length} org${succeeded.length !== 1 ? "s" : ""} — ${totalDevices} device${totalDevices !== 1 ? "s" : ""} found`,
            );
          } else {
            const reason =
              (failed[0] as PromiseRejectedResult).reason?.message ??
              "Unknown error";
            toast.error(
              `Sync failed for ${failed.length} org${failed.length !== 1 ? "s" : ""}: ${reason}`,
            );
          }
        } catch (err: any) {
          toast.error(`Sync error: ${err?.message ?? "Unknown error"}`);
        }
      }}
    />
  );

  if (isInitializing) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }} />
    );
  }

  // Super admins get their own portal
  if (user?.role === "super_admin") {
    return <SuperAdminApp onLogout={handleLogout} />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/auth" element={<AuthScreen onSuccess={handleLogin} />} />

      {/* Authenticated routes */}
      {user && (
        <Route
          element={
            <AppShell
              user={user}
              selectedOrgId={selectedOrgId}
              selectedOrgName={selectedOrgName}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              userPermissions={userPermissions}
            />
          }
        >
          {/* Non-protected routes */}
          <Route
            path={TOOL_MODE_ROUTES.selection}
            element={renderModeSelection()}
          />
          <Route
            path={TOOL_MODE_ROUTES.migration}
            element={<MigrationWizard />}
          />
          <Route path={TOOL_MODE_ROUTES.backup} element={<BackupWizard />} />
          <Route path={TOOL_MODE_ROUTES.restore} element={<RestoreWizard />} />
          <Route
            path={TOOL_MODE_ROUTES.organizations}
            element={<OrganizationsPage onSelectOrg={handleSelectOrg} />}
          />
          <Route
            path={TOOL_MODE_ROUTES.dashboard}
            element={<DashboardPage />}
          />
          <Route
            path={TOOL_MODE_ROUTES["cross-region"]}
            element={<CrossRegionPage />}
          />
          <Route
            path={TOOL_MODE_ROUTES.cat9k}
            element={
              <Cat9KMigrationWizard
                connectedOrgs={connectedOrgs}
                selectedOrgId={effectiveOrgId}
              />
            }
          />
          <Route
            path={TOOL_MODE_ROUTES.profile}
            element={<ProfilePage onTierChange={handleTierChange} />}
          />
          <Route
            path={TOOL_MODE_ROUTES.team}
            element={<TeamManagementPage />}
          />

          {/* Protected routes requiring organization */}
          <Route
            element={<ProtectedRouteWrapper connectedOrgs={connectedOrgs} />}
          >
            <Route
              path={TOOL_MODE_ROUTES["version-control"]}
              element={<VersionControlPage organizationId={effectiveOrgId} />}
            />
            <Route
              path={TOOL_MODE_ROUTES.drift}
              element={
                <DriftDetectionPage
                  organizationId={effectiveOrgId}
                  organizationName={effectiveOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES.compliance}
              element={
                <CompliancePage
                  organizationId={effectiveOrgId}
                  organizationName={effectiveOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES["bulk-ops"]}
              element={
                <BulkOperationsPage
                  organizationId={effectiveOrgId}
                  organizationName={effectiveOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES.security}
              element={
                <SecurityPage
                  organizationId={effectiveOrgId}
                  organizationName={effectiveOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES["change-management"]}
              element={
                <ChangeManagementPage
                  organizationId={effectiveOrgId}
                  organizationName={effectiveOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES.documentation}
              element={
                <DocumentationPage
                  organizationId={effectiveOrgId}
                  organizationName={effectiveOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES.scheduler}
              element={
                <SchedulerPage
                  organizationId={effectiveOrgId}
                  organizationName={effectiveOrgName}
                />
              }
            />
          </Route>
        </Route>
      )}

      {/* Fallback redirects */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate to={TOOL_MODE_ROUTES.selection} />
          ) : (
            <Navigate to="/home" />
          )
        }
      />
    </Routes>
  );
}

export default App;
