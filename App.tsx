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
import { Toaster } from './components/ui/sonner';

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
  | 'documentation' | 'scheduler' | 'cross-region' | 'profile' | 'cat9k';

function App() {
  const [user, setUser] = useState<any | null>(null);
  const [isHome, setIsHome] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [toolMode, setToolMode] = useState<ToolMode>('selection');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState<string>('');

  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      setUser(apiClient.getUser());
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    apiClient.logout();
    setUser(null);
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
  };

  const handleTierChange = () => {
    setUser(apiClient.getUser());
  };

  const renderContent = () => {
    const orgRequiredModes: ToolMode[] = [
      'version-control', 'drift', 'compliance', 'bulk-ops',
      'security', 'change-management', 'documentation', 'scheduler',
    ];

    if (orgRequiredModes.includes(toolMode) && !selectedOrgId) {
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
              Select an Organization First
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
              Manage Organizations
            </button>
          </div>
        </div>
      );
    }

    switch (toolMode) {
      case 'migration':
        return <MigrationWizard />;
      case 'backup':
        return <BackupWizard />;
      case 'version-control':
        return <VersionControlPage organizationId={selectedOrgId!} />;
      case 'organizations':
        return <OrganizationsPage onSelectOrg={handleSelectOrg} />;
      case 'drift':
        return <DriftDetectionPage organizationId={selectedOrgId!} organizationName={selectedOrgName} />;
      case 'compliance':
        return <CompliancePage organizationId={selectedOrgId!} organizationName={selectedOrgName} />;
      case 'bulk-ops':
        return <BulkOperationsPage organizationId={selectedOrgId!} organizationName={selectedOrgName} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'security':
        return <SecurityPage organizationId={selectedOrgId!} organizationName={selectedOrgName} />;
      case 'change-management':
        return <ChangeManagementPage organizationId={selectedOrgId!} organizationName={selectedOrgName} />;
      case 'documentation':
        return <DocumentationPage organizationId={selectedOrgId!} organizationName={selectedOrgName} />;
      case 'scheduler':
        return <SchedulerPage organizationId={selectedOrgId!} organizationName={selectedOrgName} />;
      case 'cross-region':
        return <CrossRegionPage />;
      case 'cat9k':
        return <Cat9KMigrationWizard />;
      case 'profile':
        return <ProfilePage onTierChange={handleTierChange} />;
      case 'restore':
        return (
          <div
            className="text-center p-10 rounded-xl border max-w-lg mx-auto mt-10"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border-primary)',
            }}
          >
            <div className="text-4xl mb-3">🚧</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Restore Feature Coming Soon
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              This feature is under development and will be available in a future release.
            </p>
          </div>
        );
      case 'selection':
      default:
        return (
          <ModeSelectionScreen
            onSelectMode={handleNavigate}
            selectedOrgName={selectedOrgName}
            userEmail={user?.email}
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
        <div className="min-h-screen bg-white text-gray-900">
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

  return (
    <AppShell
      user={user}
      toolMode={toolMode}
      selectedOrgId={selectedOrgId}
      selectedOrgName={selectedOrgName}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderContent()}
      <Toaster />
    </AppShell>
  );
}

export default App;
