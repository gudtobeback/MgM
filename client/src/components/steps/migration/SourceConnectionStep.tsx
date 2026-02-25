import { Label } from "../../ui/label";
import { Card } from "../../ui/card";

import { Globe, Key } from "lucide-react";
import { Input, Select } from "antd";
import LabelInput from "../../ui/LabelInput";
import AlertCard from "../../ui/AlertCard";

export const MERAKI_REGIONS = [
  {
    code: "com",
    name: "Global (Americas)",
    dashboard: "dashboard.meraki.com",
    confirmed: true,
  },
  {
    code: "in",
    name: "India",
    dashboard: "dashboard.meraki.in",
    confirmed: true,
  },
  {
    code: "cn",
    name: "China",
    dashboard: "dashboard.meraki.cn",
    confirmed: false,
  },
  {
    code: "ca",
    name: "Canada",
    dashboard: "dashboard.meraki.ca",
    confirmed: false,
  },
  {
    code: "uk",
    name: "United Kingdom",
    dashboard: "dashboard.meraki.uk",
    confirmed: false,
  },
  {
    code: "eu",
    name: "Europe",
    dashboard: "dashboard.meraki.eu",
    confirmed: false,
  },
  {
    code: "au",
    name: "Australia",
    dashboard: "dashboard.meraki.au",
    confirmed: false,
  },
  { code: "custom", name: "Custom URL", dashboard: "", confirmed: true },
];

interface SourceConnectionStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function SourceConnectionStep({
  data,
  onUpdate,
}: SourceConnectionStepProps) {
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
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">Connect to Source Dashboard</p>
        <p className="text-[12px] text-[#232C32]">
          Select the Meraki region and enter your API key for the dashboard you
          want to migrate from.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-6 p-6">
        {/* Title */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#F6FDFF] rounded-lg border border-[#87D2ED] w-fit">
          <div className="size-7.5 bg-[#049FD9] rounded-full"></div>

          <div className="flex flex-col justify-between">
            <p className="text-sm font-medium">Source Dashboard</p>
            <p className="text-sm text-[#232C32]">
              {isCustom ? "Custom API endpoint" : selectedRegion.dashboard}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <LabelInput id="region" label="Region" colSpan="col-span-12" required>
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

          <LabelInput
            id="source-api-key"
            label="API Key"
            colSpan="col-span-12"
            required
          >
            <Input
              id="source-api-key"
              type="password"
              placeholder="Enter source API key"
              value={data.sourceApiKey}
              onChange={(e) => onUpdate({ sourceApiKey: e.target.value })}
            />
          </LabelInput>
        </div>

        {/* Note */}
        <AlertCard variant="success">
          <p>
            <strong>Note:</strong> Your API key is only used for this session
            and is never stored. Make sure you have administrator access to the
            source dashboard.
          </p>
        </AlertCard>

        {/* Howto get api key */}
        <AlertCard>
          <p className="font-semibold text-sm">How to get your API key</p>

          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>
              Log in to{" "}
              <strong>
                {isCustom ? "your Meraki dashboard" : selectedRegion.dashboard}
              </strong>
            </li>
            <li>
              Go to <strong>Organization → Settings</strong>
            </li>
            <li>
              Scroll to <strong>Dashboard API access</strong> and enable it
            </li>
            <li>
              Click <strong>Generate new API key</strong>, then paste it above
            </li>
          </ol>
        </AlertCard>
      </div>
    </div>
  );
}
