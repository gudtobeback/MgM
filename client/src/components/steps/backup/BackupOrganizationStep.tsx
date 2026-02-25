import { useState, useEffect } from "react";
import { Card } from "../../ui/card";
import { Label } from "../../ui/label";

import { Building2, CheckCircle2, Loader2 } from "lucide-react";
// FIX: Use correct relative path for merakiService import.
import { getOrganizations } from "../../../services/merakiService";
import { MerakiOrganization } from "../../../types/types";
import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";
import { Select } from "antd";

interface BackupOrganizationStepProps {
  data: {
    apiKey: string;
    region: "com" | "in";
    organization: MerakiOrganization | null;
  };
  onUpdate: (data: { organization?: MerakiOrganization }) => void;
}

export function BackupOrganizationStep({
  data,
  onUpdate,
}: BackupOrganizationStepProps) {
  const [selectedOrgId, setSelectedOrgId] = useState(
    data.organization?.id || "",
  );
  const [organizations, setOrganizations] = useState<MerakiOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOrgs = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = data.apiKey;
        const region = data.region || "com";
        const orgs = await getOrganizations(apiKey, region, signal);
        if (!signal.aborted) {
          setOrganizations(orgs);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(
            "Failed to fetch organizations. Please check your API key and try again.",
          );
          console.error(err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (data.apiKey) {
      fetchOrgs();
    } else {
      setLoading(false);
      setError("API Key not provided. Please go back to the first step.");
    }

    return () => {
      controller.abort();
    };
  }, [data.apiKey, data.region]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      onUpdate({ organization: org });
    }
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">Select Organization</p>
        <p className="text-[12px] text-[#232C32]">
          Choose the organization you want to backup
        </p>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="mt-4 text-muted-foreground">
              Fetching organizations...
            </p>
          </div>
        ) : error ? (
          <AlertCard variant="error">{error}</AlertCard>
        ) : (
          <div className="flex flex-col gap-6">
            <LabelInput id="organization" label="Organization" required>
              <Select
                id="organization"
                placeholder="Select organization to backup"
                value={selectedOrgId || null}
                options={organizations.map((org) => ({
                  value: org?.id,
                  label: org?.name,
                }))}
                onChange={handleOrgChange}
              />
            </LabelInput>

            {selectedOrgId && data.organization && (
              <AlertCard variant="success">
                <p>
                  <strong>Selected: </strong>
                  {data.organization.name}
                </p>
              </AlertCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
