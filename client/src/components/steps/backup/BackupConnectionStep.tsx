import { Input, Select } from "antd";
import { HardDriveDownload } from "lucide-react";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";

import { MERAKI_REGIONS } from "@/src/constants";

import DomainCard from "../DomainCard";
import StepHeadingCard from "../StepHeadingCard";

interface BackupConnectionStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function BackupConnectionStep({
  data,
  onUpdate,
}: BackupConnectionStepProps) {
  const selectedRegion =
    MERAKI_REGIONS.find((r) => r.code === data.sourceRegion) ??
    MERAKI_REGIONS[0];
  const isCustom = data.sourceRegion === "custom";

  const handleRegionChange = (code: string) => {
    // Reset org/network when region changes
    onUpdate({
      sourceRegion: code,
      sourceOrg: null,
      sourceNetwork: null,
      sourceApiKey: "",
    });
  };

  return (
    <div className="step-card-inner-layout">
      {/* Title */}
      <DomainCard
        title="Source Dashboard"
        subTitle={isCustom ? "Custom API endpoint" : selectedRegion.dashboard}
      />

      <LabelInput id="region" label="Region" required>
        <Select
          id="region"
          placeholder="Select Region"
          options={MERAKI_REGIONS.map((r) => ({
            value: r.code,
            label: `${r.name} ${!r.confirmed && r.code !== "custom" ? " ⚠" : ""}`,
          }))}
          value={data.sourceRegion || "com"}
          onChange={handleRegionChange}
        />

        {!isCustom && !selectedRegion.confirmed && (
          <p className="mt-1 text-xs text-amber-600">
            ⚠ This region domain is not officially confirmed. Verify{" "}
            <strong>{selectedRegion.dashboard}</strong> is active before
            proceeding.
          </p>
        )}
      </LabelInput>

      {isCustom && (
        <LabelInput
          id="source-custom-url"
          label="Custom API Base URL"
          colSpan="col-span-12"
          required
        >
          <Input
            id="source-custom-url"
            placeholder="https://api.meraki.example/api/v1"
            value={
              data.sourceRegion === "custom"
                ? (data.sourceCustomApiBase ?? "")
                : ""
            }
            onChange={(e) =>
              onUpdate({
                sourceCustomApiBase: e.target.value,
                // sourceRegion: e.target.value || "custom",
              })
            }
          />

          <p className="text-xs">
            Enter the full API base URL for your Meraki region (e.g.
            https://api.meraki.cn/api/v1).
          </p>
        </LabelInput>
      )}

      <LabelInput id="api-key" label="API Key" colSpan="col-span-12" required>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter your API key"
          value={data.apiKey}
          onChange={(e) => onUpdate({ apiKey: e.target.value })}
          autoComplete="new-password"
        />
      </LabelInput>

      <AlertCard variant="note">
        <p>
          <strong>Note:</strong> Your API key is only used for this session and
          is never stored. Make sure you have read access to the organization
          you want to backup.
        </p>
      </AlertCard>
    </div>
  );
}
