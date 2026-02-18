import React, { useState, useEffect } from 'react';
import { apiClient } from './services/apiClient';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppShell } from './components/layout/AppShell';
import { ModeSelectionScreen } from './components/ModeSelectionScreen';
import { MigrationWizard } from './components/MigrationWizard';
import { BackupWizard } from './components/BackupWizard';
import { VersionControlPage } from './components/version-control/VersionControlPage';
import { OrganizationsPage } from './components/organizations/OrganizationsPage';
import { DriftDetectionPage } from './components/drift/DriftDetectionPage';
import { CompliancePage } from './components/compliance/CompliancePage';
import { BulkOperationsPage } from './components/bulk-ops/BulkOperationsPage';
import { DashboardPage } from './components/analytics/DashboardPage';
import { SecurityPage } from './components/security/SecurityPage';
import { ChangeManagementPage } from './components/change-management/ChangeManagementPage';
import { DocumentationPage } from './components/docs/DocumentationPage';
import { SchedulerPage } from './components/scheduler/SchedulerPage';
import { CrossRegionPage } from './components/cross-region/CrossRegionPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { Cat9KMigrationWizard } from './components/cat9k/Cat9KMigrationWizard';
import { RestoreWizard } from './components/restore/RestoreWizard';
import { SuperAdminApp } from './components/super-admin/SuperAdminApp';
import { TeamManagementPage } from './components/team/TeamManagementPage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

import { Hero } from './components/home/Hero';
import { ProblemSection } from './components/home/ProblemSection';
import { SolutionSection } from './components/home/SolutionSection';
import { HowItWorks } from './components/home/HowItWorks';
import { PricingSection } from './components/home/PricingSection';
import { CTASection } from './components/home/CTASection';
import { Footer } from './components/home/Footer';

type ToolMode =
  | 'selection' | 'migration' | 'backup' | 'restore'
  | 'version-control' | 'organizations' | 'drift' | 'compliance'
  | 'bulk-ops' | 'dashboard' | 'security' | 'change-management'
  | 'documentation' | 'scheduler' | 'cross-region' | 'profile' | 'cat9k' | 'team';

function App() {
  const [user, setUser] = useState<any | null>(null);
  const [isHome, setIsHome] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [toolMode, setToolMode] = useState<ToolMode>('selection');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState<string>('');
  const [connectedOrgs, setConnectedOrgs] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>(
    () => apiClient.getUserPermissions()
  );

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
        Promise.allSettled(orgs.map((o: any) => apiClient.refreshOrganization(o.id)))
          .then(() => apiClient.listOrganizations().then(setConnectedOrgs).catch(() => {}))
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
      // Load any cached permissions (already in localStorage) then re-fetch in background
      setUserPermissions(apiClient.getUserPermissions());
      apiClient.fetchAndCachePermissions().then(perms => setUserPermissions(perms)).catch(() => {});
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
    fetchOrgs(null); // null = no selection yet, auto-select first org
    // Fetch feature permissions for this user
    apiClient.fetchAndCachePermissions().then(perms => setUserPermissions(perms)).catch(() => {});
  };

  const handleLogout = () => {
    apiClient.logout();
    setUser(null);
    setUserPermissions({});
    setToolMode('selection');
    setIsHome(true);
  };

  const handleNavigate = (mode: ToolMode) => {
    setToolMode(mode);
  };

  const handleSelectOrg = (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId);
    setSelectedOrgName(orgName);
    setToolMode('selection');
    fetchOrgs(orgId);
  };

  const handleTierChange = () => {
    setUser(apiClient.getUser());
  };

  const renderContent = () => {
    const orgRequiredModes: ToolMode[] = [
      'version-control', 'drift', 'compliance', 'bulk-ops',
      'security', 'change-management', 'documentation', 'scheduler',
    ];

    if (orgRequiredModes.includes(toolMode) && connectedOrgs.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <div
            className="text-center p-10 rounded-xl border max-w-md w-full"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border-primary)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--color-primary-light)' }}
            >
              <svg className="w-8 h-8" fill="none" stroke="var(--color-primary)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              No Organizations Connected
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Connect a Meraki organization to access this feature.
            </p>
            <button
              onClick={() => setToolMode('organizations')}
              className="px-5 py-2 text-sm font-medium rounded text-white transition-colors"
              style={{
                backgroundColor: 'var(--color-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Connect Organization
            </button>
          </div>
        </div>
      );
    }

    // Fall back to first connected org if explicit selection not yet made
    const effectiveOrgId   = selectedOrgId   ?? String(connectedOrgs[0]?.id ?? '');
    const effectiveOrgName = selectedOrgName || connectedOrgs[0]?.meraki_org_name || '';

    switch (toolMode) {
      case 'migration':
        return <MigrationWizard />;
      case 'backup':
        return <BackupWizard />;
      case 'version-control':
        return <VersionControlPage organizationId={effectiveOrgId} />;
      case 'organizations':
        return <OrganizationsPage onSelectOrg={handleSelectOrg} />;
      case 'drift':
        return <DriftDetectionPage organizationId={effectiveOrgId} organizationName={effectiveOrgName} />;
      case 'compliance':
        return <CompliancePage organizationId={effectiveOrgId} organizationName={effectiveOrgName} />;
      case 'bulk-ops':
        return <BulkOperationsPage organizationId={effectiveOrgId} organizationName={effectiveOrgName} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'security':
        return <SecurityPage organizationId={effectiveOrgId} organizationName={effectiveOrgName} />;
      case 'change-management':
        return <ChangeManagementPage organizationId={effectiveOrgId} organizationName={effectiveOrgName} />;
      case 'documentation':
        return <DocumentationPage organizationId={effectiveOrgId} organizationName={effectiveOrgName} />;
      case 'scheduler':
        return <SchedulerPage organizationId={effectiveOrgId} organizationName={effectiveOrgName} />;
      case 'cross-region':
        return <CrossRegionPage />;
      case 'cat9k':
        return (
          <Cat9KMigrationWizard
            connectedOrgs={connectedOrgs}
            selectedOrgId={effectiveOrgId}
          />
        );
      case 'profile':
        return <ProfilePage onTierChange={handleTierChange} />;
      case 'restore':
        return <RestoreWizard />;
      case 'team':
        return <TeamManagementPage />;
      case 'selection':
      default:
        return (
          <ModeSelectionScreen
            onSelectMode={handleNavigate}
            selectedOrgName={selectedOrgName}
            userEmail={user?.email}
            connectedOrgs={connectedOrgs}
            onRefreshOrgs={async () => {
              try {
                const orgs = await apiClient.listOrganizations();
                if (orgs.length === 0) {
                  toast.info('No organizations to sync.');
                  return;
                }

                const results = await Promise.allSettled(
                  orgs.map((o: any) => apiClient.refreshOrganization(o.id))
                );

                const failed = results.filter(r => r.status === 'rejected');
                const succeeded = results.filter(r => r.status === 'fulfilled');

                const updated = await apiClient.listOrganizations();
                setConnectedOrgs(updated);

                const totalDevices = updated.reduce((s: number, o: any) => s + (o.device_count ?? 0), 0);

                if (failed.length === 0) {
                  toast.success(`Synced ${succeeded.length} org${succeeded.length !== 1 ? 's' : ''} — ${totalDevices} device${totalDevices !== 1 ? 's' : ''} found`);
                } else {
                  const reason = (failed[0] as PromiseRejectedResult).reason?.message ?? 'Unknown error';
                  toast.error(`Sync failed for ${failed.length} org${failed.length !== 1 ? 's' : ''}: ${reason}`);
                }
              } catch (err: any) {
                toast.error(`Sync error: ${err?.message ?? 'Unknown error'}`);
              }
            }}
          />
        );
    }
  };

  if (isInitializing) {
    return <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }} />;
  }

  if (!user) {
    if (isHome) {
      return (
        <div className="min-h-screen text-gray-900" style={{ backgroundColor: 'rgb(226, 238, 251)' }}>
          <Hero setIsHome={setIsHome} />
          <ProblemSection />
          <SolutionSection />
          <HowItWorks />
          <PricingSection />
          <CTASection setIsHome={setIsHome} />
          <Footer />
        </div>
      );
    }
    return <AuthScreen onSuccess={handleLogin} />;
  }

  // Super admins get their own portal
  if (user?.role === 'super_admin') {
    return <SuperAdminApp onLogout={handleLogout} />;
  }

  return (
    <AppShell
      user={user}
      toolMode={toolMode}
      selectedOrgId={selectedOrgId}
      selectedOrgName={selectedOrgName}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      userPermissions={userPermissions}
    >
      {renderContent()}
      <Toaster />
    </AppShell>
  );
}

export default App;
