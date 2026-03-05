import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { apiClient } from "./services/apiClient";
import {
  ToolMode,
  TOOL_MODE_ROUTES,
  ORG_REQUIRED_ROUTES,
  ROUTE_TO_TOOL_MODE,
} from "./types/routes";

import { Building2 } from "lucide-react";

import { AuthScreen } from "./pages/auth/AuthScreen";
import { AppShell } from "./components/layout/AppShell";

// ------- Pages ---------- //
import { OrganizationsPage } from "./pages/private/OrganizationsPage";
import { ModeSelectionScreen } from "./pages/private/ModeSelectionScreen";

// Migartion
import { MigrationWizard } from "./pages/private/migration/MigrationWizard";
import { Cat9KMigrationWizard } from "./pages/private/migration/Cat9KMigrationWizard";

// Backup and Recovery
import { BackupWizard } from "./pages/private/backup_and_recovery/BackupWizard";
import { RestoreWizard } from "./pages/private/backup_and_recovery/RestoreWizard";

import { VersionControlPage } from "./components/version-control/VersionControlPage";
import { DriftDetectionPage } from "./components/drift/DriftDetectionPage";
import { CompliancePage } from "./components/compliance/CompliancePage";
import { BulkOperationsPage } from "./components/bulk-ops/BulkOperationsPage";
import { DashboardPage } from "./components/analytics/DashboardPage";
import { SecurityPage } from "./components/security/SecurityPage";
import { ChangeManagementPage } from "./components/change-management/ChangeManagementPage";
import { DocumentationPage } from "./components/docs/DocumentationPage";
import { SchedulerPage } from "./components/scheduler/SchedulerPage";
import { CrossRegionPage } from "./components/cross-region/CrossRegionPage";
import { ProfilePage } from "./pages/private/ProfilePage";
import { SuperAdminApp } from "./components/super-admin/SuperAdminApp";
import { TeamManagementPage } from "./components/team/TeamManagementPage";

import Home from "./pages/public/Home";
import { useAuth } from "./context/AuthContext";

import { useOrganization } from "./context/OrganizationContext";
import Header from "./components/home/Header";

import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import TermsAndConditions from "./pages/public/TermsAndConditions";
import Footer from "./components/home/Footer";
import SubscriptionPage from "./pages/private/SubscriptionPage";

/**
 * Protected Route Wrapper Component
 * Checks if user has required organization for org-dependent routes
 * Derives toolMode from URL location to avoid prop drilling
 */
function ProtectedRouteWrapper() {
  const { orgsLoading, organizations } = useOrganization();

  const location = useLocation();
  const toolMode = ROUTE_TO_TOOL_MODE[location.pathname] as ToolMode;

  if (ORG_REQUIRED_ROUTES.includes(toolMode) && organizations.length === 0) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-100 gap-3 p-5 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
          <Building2 size={24} className="text-muted-foreground" />

          <p className="font-semibold text-md text-foreground">
            No organizations connected
          </p>

          <p className="-m-2 text-xs text-black/60">
            Add your Meraki organization to get started with monitoring and
            snapshots.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

function PublicLayout() {
  return (
    <div className="text-black/80">
      <Header />

      {/* Body */}
      <div className="flex flex-col bg-white">
        {/* Hero body */}
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}

/**
 * Main App Component with Routing
 */
function App() {
  const { authLoading, user, accessToken } = useAuth();

  const {
    orgsLoading,
    organizations,
    selectedOrgId,
    selectedOrgName,

    effectiveOrgId,
    effectiveOrgName,
  } = useOrganization();

  const [isInitializing, setIsInitializing] = useState(true);
  const [userPermissions, setUserPermissions] = useState<
    Record<string, boolean>
  >(() => apiClient.getUserPermissions());

  useEffect(() => {
    setUserPermissions(apiClient.getUserPermissions());
    apiClient
      .fetchAndCachePermissions()
      .then((perms) => setUserPermissions(perms))
      .catch(() => {});

    setIsInitializing(false);
  }, [accessToken]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full font-semibold text-lg">
        Restoring Session...
      </div>
    );
  }

  // Super admins get their own portal
  if (user?.role === "super_admin") {
    return <SuperAdminApp />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
      </Route>

      <Route
        path="/auth"
        element={
          user ? (
            <Navigate to={TOOL_MODE_ROUTES.selection} replace />
          ) : (
            <AuthScreen />
          )
        }
      />

      {/* Authenticated routes */}
      {user && (
        <Route
          element={
            <AppShell
              user={user}
              selectedOrgName={selectedOrgName}
              userPermissions={userPermissions}
            />
          }
        >
          {/* Non-protected routes */}
          <Route
            path={TOOL_MODE_ROUTES.selection}
            element={
              <ModeSelectionScreen
                userEmail={user?.email}
                connectedOrgs={organizations}
              />
            }
          />
          <Route
            path={TOOL_MODE_ROUTES.migration}
            element={<MigrationWizard />}
          />
          <Route path={TOOL_MODE_ROUTES.backup} element={<BackupWizard />} />
          <Route path={TOOL_MODE_ROUTES.restore} element={<RestoreWizard />} />
          <Route
            path={TOOL_MODE_ROUTES.organizations}
            element={<OrganizationsPage />}
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
                connectedOrgs={organizations}
                selectedOrgId={effectiveOrgId}
              />
            }
          />
          <Route path={TOOL_MODE_ROUTES.profile} element={<ProfilePage />} />
          <Route path={TOOL_MODE_ROUTES.subscription} element={<SubscriptionPage />} />
          <Route
            path={TOOL_MODE_ROUTES.team}
            element={<TeamManagementPage />}
          />

          {/* Protected routes requiring organization */}
          <Route
            element={<ProtectedRouteWrapper connectedOrgs={organizations} />}
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
