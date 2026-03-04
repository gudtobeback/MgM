import { useState, useEffect } from "react";

import { Select } from "antd";
import {
  Building2,
  CheckCircle2,
  HardDriveDownload,
  Loader2,
} from "lucide-react";

import StepHeadingCard from "../StepHeadingCard";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";

import { getOrganizations } from "../../../services/merakiService";

import { MerakiOrganization } from "../../../types/types";

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
    <div className="step-card-layout">
      {/* Heading */}
      <StepHeadingCard
        icon={<HardDriveDownload size={30} color="#049FD9" />}
        heading="Select Organization"
        subHeading="Choose the organization you want to backup"
      />

      <div className="step-card-inner-layout">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#049FD9]" />
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
              <AlertCard variant="note">
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
