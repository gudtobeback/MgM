import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Organization } from "../types/types";
import { TOOL_MODE_ROUTES } from "../types/routes";

import { apiEndpoints } from "../services/api";

import { useAuth } from "./AuthContext";
import axios from "axios";

/* =========================
   Types
========================= */

type OrganizationContextType = {
  orgsLoading: boolean;
  organizations: Organization[];

  selectedOrgId: string | null;
  selectedOrgName: string;

  handleSelectOrg: (orgId: string, orgName: string) => void;
  fetchOrganizations: () => void;
};

type OrganizationProviderProps = {
  children: React.ReactNode;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
};

export const OrganizationProvider = ({
  children,
}: OrganizationProviderProps) => {
  const { accessToken } = useAuth();

  const navigate = useNavigate();

  const [orgsLoading, setLoading] = useState<boolean>(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState<string>("");

  const fetchOrganizations = async () => {
    setLoading(true);

    try {
      const res = await apiEndpoints.listOrganizations();

      const data = res.data;

      setOrganizations(data);
      console.log("Organizations List: ", data);
    } catch (error) {
      console.error("Failed to fetch Organizations: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId);
    setSelectedOrgName(orgName);
    navigate(TOOL_MODE_ROUTES.selection);
  };

  useEffect(() => {
    if (accessToken) {
      fetchOrganizations();
    }
  }, [accessToken]);

  useEffect(() => {
    if (organizations?.length > 0 && !selectedOrgId) {
      setSelectedOrgId(String(organizations[0].id));
      setSelectedOrgName(organizations[0].meraki_org_name);
    }
  }, [organizations]);

  // Test
  // const getJokes = async () => {
  //   try {
  //     const res = axios.get("http://192.168.0.188:8788/api/jokes");

  //     console.log("Jokes: ", res);
  //   } catch (error) {
  //     console.error("Error Getting Jokes: ", error);
  //   }
  // };

  // useEffect(() => {
  //   getJokes();
  // }, []);

  return (
    <OrganizationContext.Provider
      value={{
        orgsLoading,
        organizations,

        selectedOrgId,
        selectedOrgName,

        handleSelectOrg,
        fetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
