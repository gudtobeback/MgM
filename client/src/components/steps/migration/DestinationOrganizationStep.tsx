import { useState, useEffect } from "react";
import { Card } from "../../ui/card";
import { Label } from "../../ui/label";

import { Building2, CheckCircle2, Loader2, NetworkIcon } from "lucide-react";
// FIX: Use correct relative path for merakiService import.
import {
  getOrganizations,
  getOrgNetworks,
} from "../../../services/merakiService";
import { MerakiOrganization, MerakiNetwork } from "../../../types/types";
import LabelInput from "../../ui/LabelInput";
import { Select } from "antd";
import AlertCard from "../../ui/AlertCard";

interface DestinationOrganizationStepProps {
  data: {
    destinationApiKey: string;
    destinationRegion: string;
    destinationOrg: MerakiOrganization | null;
    destinationNetwork: MerakiNetwork | null;
  };
  onUpdate: (data: any) => void;
}

export function DestinationOrganizationStep({
  data,
  onUpdate,
}: DestinationOrganizationStepProps) {
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
          data.destinationApiKey,
          data.destinationRegion,
          signal,
        );
        if (!signal.aborted) {
          setOrganizations(orgs);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(
            "Failed to fetch destination organizations. Please check your destination API key.",
          );
          console.error(err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (data.destinationApiKey) {
      fetchOrgs();
    } else {
      setLoading(false);
      setError(
        "Destination API Key not provided. Please go back to the previous step.",
      );
    }

    return () => {
      controller.abort();
    };
  }, [data.destinationApiKey]);

  // Fetch networks when an organization is selected
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNetworks = async () => {
      if (!data.destinationOrg) return;
      setLoadingNetworks(true);
      setNetworks([]); // Clear previous networks
      try {
        const nets = await getOrgNetworks(
          data.destinationApiKey,
          data.destinationRegion,
          data.destinationOrg.id,
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
  }, [data.destinationOrg, data.destinationApiKey]);

  const handleOrgChange = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      onUpdate({ destinationOrg: org, destinationNetwork: null }); // Reset network on org change
    }
  };

  const handleNetworkChange = (networkId: string) => {
    const network = networks.find((n) => n.id === networkId);
    if (network) {
      onUpdate({ destinationNetwork: network });
    }
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">
          Select Destination Organization & Network
        </p>
        <p className="text-[12px] text-[#232C32]">
          Choose the organization from your source dashboard that you want to
          migrate.
        </p>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <p className="mt-4 text-muted-foreground">
              Fetching destination organizations...
            </p>
          </div>
        ) : error ? (
          <div className="p-5 bg-[#FECFCF] border border-[#D86C6C] rounded-md text-sm">
            {error}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <LabelInput
              id="destination-organization"
              label="Destination Organization (dashboard.meraki.in)"
              colSpan=""
              required
            >
              <Select
                id="destination-organization"
                placeholder="Select source organization"
                value={data.destinationOrg?.id || null}
                options={organizations.map((org) => ({
                  value: org?.id,
                  label: org?.name,
                }))}
                onChange={handleOrgChange}
              />
            </LabelInput>

            {data.destinationOrg && (
              <LabelInput
                id="destination-network"
                label="Destination Network"
                colSpan=""
                required
              >
                <Select
                  id="destination-network"
                  placeholder={
                    loadingNetworks
                      ? "Loading networks..."
                      : "Select destination network"
                  }
                  value={data.destinationNetwork?.id || null}
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
            {(data.destinationOrg || data.destinationNetwork) && (
              <AlertCard variant="success">
                {data.destinationOrg && (
                  <p>
                    <strong>Organization:</strong> {data.destinationOrg.name}
                  </p>
                )}

                {data.destinationNetwork && (
                  <p>
                    <strong>Network:</strong> {data.destinationNetwork.name}
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
