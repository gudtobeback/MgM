import React, { useState } from "react";

export type SuperAdminPage =
  | "overview"
  | "companies"
  | "company-detail"
  | "users"
  | "audit";

interface SuperAdminLayoutContextType {
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number | null) => void;
}

export const SuperAdminLayoutContext = React.createContext<
  SuperAdminLayoutContextType | undefined
>(undefined);

export function useSuperAdminLayout() {
  const context = React.useContext(SuperAdminLayoutContext);
  if (!context) {
    throw new Error("useSuperAdminLayout must be used within SuperAdminLayout");
  }
  return context;
}

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  children,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );

  const value: SuperAdminLayoutContextType = {
    selectedCompanyId,
    setSelectedCompanyId,
  };

  return (
    <SuperAdminLayoutContext.Provider value={value}>
      {children}
    </SuperAdminLayoutContext.Provider>
  );
};
