import React from "react";

import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
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

import { ProfilePage } from "./pages/private/ProfilePage";

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
import { SuperAdminLayout } from "./components/layout/SuperAdminLayout";
import { OverviewPage } from "./components/super-admin/pages/OverviewPage";
import { CompaniesPage } from "./components/super-admin/pages/CompaniesPage";
import { CompanyDetailPage } from "./components/super-admin/pages/CompanyDetailPage";
import { AllUsersPage } from "./components/super-admin/pages/AllUsersPage";
import { AuditLogPage } from "./components/super-admin/pages/AuditLogPage";
import { TeamManagementPage } from "./components/team/TeamManagementPage";

import Home from "./pages/public/Home";
import { useAuth } from "./context/AuthContext";

import { useOrganization } from "./context/OrganizationContext";
import Header from "./components/home/Header";

import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import TermsAndConditions from "./pages/public/TermsAndConditions";
import Footer from "./components/home/Footer";
import SubscriptionPage from "./pages/private/SubscriptionPage";

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

// Super Admin Protected Route
function SuperAdminProtectedRoute() {
  const { user } = useAuth();

  if (user?.role !== "super_admin") {
    return <Navigate to={TOOL_MODE_ROUTES.selection} replace />;
  }

  return <Outlet />;
}

function UserProtectedRoute() {
  const { user } = useAuth();

  if (user?.role === "super_admin") {
    return <Navigate to={TOOL_MODE_ROUTES["admin-overview"]} replace />;
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

function App() {
  const { user, accessToken } = useAuth();

  const { orgsLoading, organizations, selectedOrgId, selectedOrgName } =
    useOrganization();

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          accessToken ? (
            <Navigate to={TOOL_MODE_ROUTES.selection} replace />
          ) : (
            <AuthScreen />
          )
        }
      />

      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
      </Route>

      {/* Private routes */}
      <Route element={<AppShell />}>
        <Route element={<UserProtectedRoute />}>
          {/* Non-protected routes */}
          <Route
            path={TOOL_MODE_ROUTES.selection}
            element={<ModeSelectionScreen />}
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
                selectedOrgId={selectedOrgId}
              />
            }
          />
          <Route path={TOOL_MODE_ROUTES.profile} element={<ProfilePage />} />
          <Route
            path={TOOL_MODE_ROUTES.subscription}
            element={<SubscriptionPage />}
          />
          <Route
            path={TOOL_MODE_ROUTES.team}
            element={<TeamManagementPage />}
          />

          {/* Protected routes requiring organization */}
          <Route element={<ProtectedRouteWrapper />}>
            <Route
              path={TOOL_MODE_ROUTES["version-control"]}
              element={<VersionControlPage organizationId={selectedOrgId} />}
            />
            <Route
              path={TOOL_MODE_ROUTES.drift}
              element={
                <DriftDetectionPage
                  organizationId={selectedOrgId}
                  organizationName={selectedOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES.compliance}
              element={
                <CompliancePage
                  organizationId={selectedOrgId}
                  organizationName={selectedOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES["bulk-ops"]}
              element={
                <BulkOperationsPage
                  organizationId={selectedOrgId}
                  organizationName={selectedOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES.security}
              element={
                <SecurityPage
                  organizationId={selectedOrgId}
                  organizationName={selectedOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES["change-management"]}
              element={
                <ChangeManagementPage
                  organizationId={selectedOrgId}
                  organizationName={selectedOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES.documentation}
              element={
                <DocumentationPage
                  organizationId={selectedOrgId}
                  organizationName={selectedOrgName}
                />
              }
            />
            <Route
              path={TOOL_MODE_ROUTES.scheduler}
              element={
                <SchedulerPage
                  organizationId={selectedOrgId}
                  organizationName={selectedOrgName}
                />
              }
            />
          </Route>
        </Route>

        {/* Super Admin Protected Routes */}
        <Route element={<SuperAdminProtectedRoute />}>
          <Route
            element={
              <SuperAdminLayout>
                <Outlet />
              </SuperAdminLayout>
            }
          >
            <Route
              path={TOOL_MODE_ROUTES["admin-overview"]}
              element={<OverviewPage />}
            />
            <Route
              path={TOOL_MODE_ROUTES["admin-companies"]}
              element={<CompaniesPage />}
            />
            <Route
              path="/admin/companies/:companyId"
              element={<CompanyDetailPage />}
            />
            <Route
              path={TOOL_MODE_ROUTES["admin-users"]}
              element={<AllUsersPage />}
            />
            <Route
              path={TOOL_MODE_ROUTES["admin-audit"]}
              element={<AuditLogPage />}
            />
          </Route>
        </Route>
      </Route>

      {/* Fallback redirects */}
      <Route
        path="*"
        element={
          accessToken ? (
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
