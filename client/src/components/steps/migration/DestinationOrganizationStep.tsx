import { useState, useEffect } from "react";

import { Select } from "antd";
import { Loader2, ClipboardList } from "lucide-react";

import StepHeadingCard from "../StepHeadingCard";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";

import {
  getOrganizations,
  getOrgNetworks,
} from "../../../services/merakiService";

import { MerakiOrganization, MerakiNetwork } from "../../../types/types";
import InformationCard from "../InformationCard";
import FormField from "../../ui/FormField";
import CustomSelect from "../../ui/CustomSelect";

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

  const handleOrgChange = (orgId: string | number | null) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      onUpdate({ destinationOrg: org, destinationNetwork: null }); // Reset network on org change
    }
  };

  const handleNetworkChange = (networkId: string | number | null) => {
    const network = networks.find((n) => n.id === networkId);
    if (network) {
      onUpdate({ destinationNetwork: network });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="mt-4 text-muted-foreground">
            Fetching destination organizations...
          </p>
        </div>
      ) : error ? (
        <AlertCard variant="error">{error}</AlertCard>
      ) : (
        <div className="flex items-start gap-6">
          <div className="p-5 w-full flex flex-col gap-6 bg-white border border-[#C1C7D11A] rounded-lg shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
            <FormField
              id="destination-organization"
              label="Destination Organization (dashboard.meraki.in)"
              className="text-[13px] uppercase"
            >
              <CustomSelect
                id="destination-organization"
                placeholder="Select source organization"
                value={data.destinationOrg?.id || null}
                options={organizations.map((org) => ({
                  value: org?.id,
                  label: org?.name,
                }))}
                onChange={handleOrgChange}
              />
            </FormField>

            {data.destinationOrg && (
              <FormField
                id="destination-network"
                label="Destination Network"
                className="text-[13px] uppercase"
              >
                <CustomSelect
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
              </FormField>
            )}
          </div>

          {/* Note */}
          {(data.destinationOrg || data.destinationNetwork) && (
            <InformationCard
              icon={ClipboardList}
              label="Selection Summary"
              className="w-[600px]"
            >
              {data.destinationOrg && (
                <div className="p-3 flex flex-col gap-1 bg-white/10 rounded-lg">
                  <div className="font-medium text-[11px] text-[#D0F059CC]">
                    Selected Organization :{" "}
                  </div>
                  <div className="text-xs text-white">
                    {data.destinationOrg.name}
                  </div>
                </div>
              )}

              {data.destinationNetwork && (
                <div className="p-3 flex flex-col gap-1 bg-white/10 rounded-lg">
                  <div className="font-medium text-[11px] text-[#D0F059CC]">
                    Selected Network :{" "}
                  </div>
                  <div className="text-xs text-white">
                    {data.destinationNetwork.name}
                  </div>
                </div>
              )}
            </InformationCard>
          )}
        </div>
      )}
    </div>
  );
}
