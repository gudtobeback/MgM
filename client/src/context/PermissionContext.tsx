import React, { createContext, useContext, useState, useEffect } from "react";

import { apiEndpoints } from "../services/api";

import { useAuth } from "./AuthContext";

/* =========================
   Types
========================= */

type PermissionsContextType = {
  permissionsLoading: boolean;
  userPermissions: any;

  fetchPermissions: () => void;
};

type PermissionProviderProps = {
  key: any;
  children: React.ReactNode;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined,
);

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error(
      "usePermissions must be used within an PermissionsProvider",
    );
  }
  return context;
};

export const PermissionsProvider = ({ children }: PermissionProviderProps) => {
  const { accessToken } = useAuth();

  const [permissionsLoading, setLoading] = useState<boolean>(false);
  const [userPermissions, setUserPermissions] = useState({});

  const fetchPermissions = async () => {
    setLoading(true);

    try {
      const res = await apiEndpoints.getUserPermissions();

      const data = res.data;

      setUserPermissions(data);
      console.log("Permissions List: ", data);
    } catch (error) {
      console.error("Failed to fetch Organizations: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchPermissions();
    }
  }, [accessToken]);

  return (
    <PermissionsContext.Provider
      value={{
        permissionsLoading,
        userPermissions,

        fetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
