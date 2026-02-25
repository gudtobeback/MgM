import React, { useState } from 'react';
import { SuperAdminShell, SuperAdminPage } from './SuperAdminShell';
import { OverviewPage } from './pages/OverviewPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { CompanyDetailPage } from './pages/CompanyDetailPage';
import { AllUsersPage } from './pages/AllUsersPage';
import { AuditLogPage } from './pages/AuditLogPage';

interface SuperAdminAppProps {
  onLogout: () => void;
}

export function SuperAdminApp({ onLogout }: SuperAdminAppProps) {
  const [activePage, setActivePage] = useState<SuperAdminPage>('overview');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const handleNavigate = (page: SuperAdminPage) => {
    setActivePage(page);
    if (page !== 'company-detail') setSelectedCompanyId(null);
  };

  const handleSelectCompany = (id: number) => {
    setSelectedCompanyId(id);
    setActivePage('company-detail');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage onNavigate={handleNavigate} />;
      case 'companies':
        return <CompaniesPage onSelectCompany={handleSelectCompany} />;
      case 'company-detail':
        if (!selectedCompanyId) return <CompaniesPage onSelectCompany={handleSelectCompany} />;
        return (
          <CompanyDetailPage
            companyId={selectedCompanyId}
            onBack={() => handleNavigate('companies')}
          />
        );
      case 'users':
        return <AllUsersPage />;
      case 'audit':
        return <AuditLogPage />;
      default:
        return <OverviewPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <SuperAdminShell
      activePage={activePage}
      onNavigate={handleNavigate}
      onLogout={onLogout}
    >
      {renderPage()}
    </SuperAdminShell>
  );
}
