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
import FormField from "../../ui/FormField";
import CustomSelect from "../../ui/CustomSelect";
import InformationCard from "../InformationCard";

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

  const handleOrgChange = (orgId: string | number | null) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      onUpdate({ sourceOrg: org, sourceNetwork: null }); // Reset network on org change
    }
  };

  const handleNetworkChange = (networkId: string | number | null) => {
    const network = networks.find((n) => n.id === networkId);
    if (network) {
      onUpdate({ sourceNetwork: network });
    }
  };

  return (
    <div>
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
        <div className="flex items-start gap-6">
          <div className="p-5 w-full flex flex-col gap-6 bg-white border border-[#C1C7D11A] rounded-lg shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
            <FormField
              id="source-organization"
              label="Source Organization (dashboard.meraki.com)"
              className="text-[13px] uppercase"
            >
              <CustomSelect
                id="source-organization"
                placeholder="Select source organization"
                value={data.sourceOrg?.id || null}
                options={organizations.map((org) => ({
                  value: org?.id,
                  label: org?.name,
                }))}
                onChange={handleOrgChange}
              />
            </FormField>

            {data.sourceOrg && (
              <FormField
                id="source-network"
                label="Source Network"
                className="text-[13px] uppercase"
              >
                <CustomSelect
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
              </FormField>
            )}
          </div>

          {/* Note */}
          {(data.sourceOrg || data.sourceNetwork) && (
            <InformationCard
              icon={ClipboardList}
              label="Selection Summary"
              className="w-[600px]"
            >
              {data.sourceOrg && (
                <div className="p-3 flex flex-col gap-1 bg-white/10 rounded-lg">
                  <div className="font-medium text-[11px] text-[#D0F059CC]">
                    Selected Organization :{" "}
                  </div>
                  <div className="text-xs text-white">
                    {data.sourceOrg.name}
                  </div>
                </div>
              )}

              {data.sourceNetwork && (
                <div className="p-3 flex flex-col gap-1 bg-white/10 rounded-lg">
                  <div className="font-medium text-[11px] text-[#D0F059CC]">
                    Selected Network :{" "}
                  </div>
                  <div className="text-xs text-white">
                    {data.sourceNetwork.name}
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
