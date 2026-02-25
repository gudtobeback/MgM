import { Label } from "../../ui/label";
import { Card } from "../../ui/card";
import { Alert, AlertDescription } from "../../ui/alert";

import { Button } from "../../ui/button";
import { Globe, Key, ExternalLink, Info } from "lucide-react";
import { MERAKI_REGIONS } from "./SourceConnectionStep";
import LabelInput from "../../ui/LabelInput";
import { Input, Select } from "antd";
import CustomButton from "../../ui/CustomButton";
import AlertCard from "../../ui/AlertCard";

interface DestinationSetupStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function DestinationSetupStep({
  data,
  onUpdate,
}: DestinationSetupStepProps) {
  const selectedRegion =
    MERAKI_REGIONS.find((r) => r.code === data.destinationRegion) ??
    MERAKI_REGIONS[1];
  const isCustom = data.destinationRegion === "custom";

  const handleRegionChange = (code: string) => {
    // Reset destination org/network when region changes
    onUpdate({
      destinationRegion: code,
      destinationOrg: null,
      destinationNetwork: null,
      destinationApiKey: "",
    });
  };

  const dashboardUrl = isCustom
    ? undefined
    : `https://${selectedRegion.dashboard}`;

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">
          Connect to Destination Dashboard
        </p>
        <p className="text-[12px] text-[#232C32]">
          Select the Meraki region and enter your API key for the dashboard you
          want to migrate to.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Title */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#F6FDFF] rounded-lg border border-[#87D2ED] w-fit">
          <div className="size-7.5 bg-[#049FD9] rounded-full"></div>

          <div className="flex flex-col justify-between">
            <p className="text-sm font-medium">Destination Dashboard</p>
            <p className="text-sm text-[#232C32]">
              {isCustom ? "Custom API endpoint" : selectedRegion.dashboard}
            </p>
          </div>
        </div>

        {/* Warning */}
        <AlertCard variant="warning">
          <p className="font-bold">Before proceeding:</p>

          <ol className="list-decimal list-inside space-y-1">
            <li>
              Make sure you have created an organization in the destination
              dashboard.
            </li>
            {!isCustom && selectedRegion.dashboard && (
              <li>
                If you haven't, open <strong>{selectedRegion.dashboard}</strong>{" "}
                and create one first.
              </li>
            )}
          </ol>
        </AlertCard>

        {/* Form */}
        <div className="grid grid-cols-12 gap-6">
          <LabelInput id="region" label="Region" colSpan="col-span-12" required>
            <Select
              id="region"
              placeholder="Select Region"
              options={MERAKI_REGIONS.map((r) => ({
                value: r.code,
                label: `${r.name} ${!r.confirmed && r.code !== "custom" ? " ⚠" : ""}`,
              }))}
              value={data.destinationRegion || "in"}
              onChange={handleRegionChange}
            />

            {!isCustom && !selectedRegion.confirmed && (
              <p className="text-xs text-amber-600">
                ⚠ This region domain is not officially confirmed. Verify{" "}
                <strong>{selectedRegion.dashboard}</strong> is active before
                proceeding.
              </p>
            )}

            {!isCustom && dashboardUrl && (
              <CustomButton
                className="w-fit mt-1"
                onClick={() => window.open(dashboardUrl, "_blank")}
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Open {selectedRegion.dashboard}
              </CustomButton>
            )}
          </LabelInput>

          {isCustom && (
            <LabelInput
              id="dest-custom-url"
              label="Custom API Base URL"
              colSpan="col-span-12"
              required
            >
              <Input
                id="dest-custom-url"
                placeholder="https://api.meraki.example/api/v1"
                value={
                  data.destinationRegion === "custom"
                    ? (data.destinationCustomApiBase ?? "")
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    destinationCustomApiBase: e.target.value,
                    // destinationRegion: e.target.value || "custom",
                  })
                }
              />

              <p className="text-xs">
                Enter the full API base URL for your Meraki region (e.g.
                https://api.meraki.cn/api/v1).
              </p>
            </LabelInput>
          )}

          <LabelInput
            id="dest-api-key"
            label="API Key"
            colSpan="col-span-12"
            required
          >
            <Input
              id="dest-api-key"
              type="password"
              placeholder="Enter destination API key"
              value={data.destinationApiKey}
              onChange={(e) => onUpdate({ destinationApiKey: e.target.value })}
            />
          </LabelInput>
        </div>

        {/* Note */}
        <AlertCard variant="success">
          <p>
            <strong>Note:</strong> Your API key is only used for this session
            and is never stored. Make sure you have administrator access to
            create and manage devices in the destination organization.
          </p>
        </AlertCard>
      </div>
    </div>
  );
}
