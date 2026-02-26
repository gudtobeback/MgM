import { useState, useEffect } from "react";
import { Card } from "../../ui/card";
import { Label } from "../../ui/label";

import { Building2, CheckCircle2, Loader2, NetworkIcon } from "lucide-react";
import {
  getOrganizations,
  getOrgNetworks,
} from "../../../services/merakiService";
import { MerakiOrganization, MerakiNetwork } from "../../../types/types";
import LabelInput from "../../ui/LabelInput";
import { Select } from "antd";
import AlertCard from "../../ui/AlertCard";

interface SourceOrganizationStepProps {
  data: {
    sourceApiKey: string;
    sourceRegion: string;
    sourceOrg: MerakiOrganization | null;
    sourceNetwork: MerakiNetwork | null;
  };
  onUpdate: (data: any) => void;
}

export function SourceOrganizationStep({
  data,
  onUpdate,
}: SourceOrganizationStepProps) {
  const [organizations, setOrganizations] = useState<MerakiOrganization[]>([]);
  const [networks, setNetworks] = useState<MerakiNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch organizations when API key is available
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOrgs = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgs = await getOrganizations(
          data.sourceApiKey,
          data.sourceRegion,
          signal,
        );
        if (!signal.aborted) {
          setOrganizations(orgs);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(
            "Failed to fetch source organizations. Please check your source API key and try again.",
          );
          console.error(err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (data.sourceApiKey) {
      fetchOrgs();
    } else {
      setLoading(false);
      setError(
        "Source API Key not provided. Please go back to the first step.",
      );
    }

    return () => {
      controller.abort();
    };
  }, [data.sourceApiKey]);

  // Fetch networks when an organization is selected
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNetworks = async () => {
      if (!data.sourceOrg) return;
      setLoadingNetworks(true);
      setNetworks([]);
      try {
        const nets = await getOrgNetworks(
          data.sourceApiKey,
          data.sourceRegion,
          data.sourceOrg.id,
          signal,
        );
        if (!signal.aborted) {
          setNetworks(nets);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError("Failed to fetch networks for the selected organization.");
          console.error(err);
        }
      } finally {
        if (!signal.aborted) {
          setLoadingNetworks(false);
        }
      }
    };

    fetchNetworks();
    return () => {
      controller.abort();
    };
  }, [data.sourceOrg, data.sourceApiKey]);

  const handleOrgChange = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      onUpdate({ sourceOrg: org, sourceNetwork: null }); // Reset network on org change
    }
  };

  const handleNetworkChange = (networkId: string) => {
    const network = networks.find((n) => n.id === networkId);
    if (network) {
      onUpdate({ sourceNetwork: network });
    }
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">
          Select Source Organization & Network
        </p>
        <p className="text-[12px] text-[#232C32]">
          Choose the organization from your source dashboard that you want to
          migrate.
        </p>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
            <p className="mt-4 text-muted-foreground">
              Fetching source organizations...
            </p>
          </div>
        ) : error ? (
          <AlertCard variant="error">{error}</AlertCard>
        ) : (
          <div className="flex flex-col gap-6">
            <LabelInput
              id="source-organization"
              label="Source Organization (dashboard.meraki.com)"
              colSpan=""
              required
            >
              <Select
                id="source-organization"
                placeholder="Select source organization"
                value={data.sourceOrg?.id || null}
                options={organizations.map((org) => ({
                  value: org?.id,
                  label: org?.name,
                }))}
                onChange={handleOrgChange}
              />
            </LabelInput>

            {data.sourceOrg && (
              <LabelInput
                id="source-network"
                label="Source Network"
                colSpan=""
                required
              >
                <Select
                  id="source-network"
                  placeholder={
                    loadingNetworks
                      ? "Loading networks..."
                      : "Select source network"
                  }
                  value={data.sourceNetwork?.id || null}
                  options={networks.map((net) => ({
                    value: net?.id,
                    label: net?.name,
                  }))}
                  onChange={handleNetworkChange}
                  disabled={loadingNetworks || networks.length === 0}
                />
              </LabelInput>
            )}

            {/* Note */}
            {(data.sourceOrg || data.sourceNetwork) && (
              <AlertCard variant="note">
                {data.sourceOrg && (
                  <p>
                    <strong>Organization:</strong> {data.sourceOrg.name}
                  </p>
                )}

                {data.sourceNetwork && (
                  <p>
                    <strong>Network:</strong> {data.sourceNetwork.name}
                  </p>
                )}
              </AlertCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
