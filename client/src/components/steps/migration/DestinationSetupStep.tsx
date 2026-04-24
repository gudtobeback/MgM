import { Input, Select } from "antd";
import {
  ExternalLink,
  CircleAlert,
  Earth,
  LockKeyholeOpen,
  Shield,
  CircleQuestionMark,
} from "lucide-react";

import DomainCard from "../DomainCard";
import StepHeadingCard from "../StepHeadingCard";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";
import CustomButton from "../../ui/CustomButton";

import { MERAKI_REGIONS } from "@/src/constants";
import FormField from "../../ui/FormField";
import CustomSelect from "../../ui/CustomSelect";
import { CustomInput } from "../../ui/CustomInput";
import { CustomInputPassword } from "../../ui/CustomInputPassword";
import InformationCard from "../InformationCard";

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

  const handleRegionChange = (code: string | null | number) => {
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
    <div className="flex flex-col gap-6">
      {/* Warning */}
      <AlertCard variant="blue">
        <div className="font-semibold ">Before proceeding:</div>

        <div>
          <p>
            Make sure you have created an organization in the destination
            dashboard.
          </p>
          {!isCustom && selectedRegion.dashboard && (
            <p>
              If you haven't, open{" "}
              <span className="font-semibold">{selectedRegion.dashboard}</span>{" "}
              and create one first.
            </p>
          )}
        </div>
      </AlertCard>

      <div className="flex items-start gap-6">
        <div className="w-full bg-white border border-[#C1C7D11A] rounded-lg shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
          <div className="p-5 flex items-center justify-between border-b border-gray-200">
            {/* Title Card */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EDEEEF] rounded-md">
                <Earth className="text-[#003E68]" />
              </div>

              <div className="text-[#003E68]">
                <p className="text-sm font-semibold">Destination Dashboard</p>
                <a
                  href={
                    isCustom ? "Custom API endpoint" : selectedRegion.dashboard
                  }
                  target="_blank"
                  className="text-[11px]"
                >
                  {isCustom ? "Custom API endpoint" : selectedRegion.dashboard}
                </a>
              </div>
            </div>

            {!isCustom && !selectedRegion.confirmed && (
              <p className="text-xs text-amber-600">
                ⚠ This region domain is not officially confirmed. Verify{" "}
                <strong>{selectedRegion.dashboard}</strong> is active before
                proceeding.
              </p>
            )}

            {!isCustom && dashboardUrl && (
              <button
                className="px-3.5 py-2 flex items-center gap-2 text-[13px] text-[#003E68] hover:bg-gray-100 rounded-full border border-gray-300 cursor-pointer transition-all"
                onClick={() => window.open(dashboardUrl, "_blank")}
              >
                <ExternalLink size={14} />
                Open {selectedRegion.dashboard}
              </button>
            )}
          </div>

          {/* Form */}
          <div className="p-5 flex flex-col gap-6">
            <FormField
              id="region"
              label="Region"
              className="text-[13px] uppercase"
            >
              <CustomSelect
                id="region"
                placeholder="Select Region"
                options={MERAKI_REGIONS.map((r) => ({
                  value: r.code,
                  label: `${r.name} ${!r.confirmed && r.code !== "custom" ? " ⚠" : ""}`,
                }))}
                value={data.destinationRegion || "in"}
                onChange={handleRegionChange}
              />
            </FormField>

            {isCustom && (
              <FormField
                id="dest-custom-url"
                label="Custom API Base URL"
                className="text-[13px] uppercase"
              >
                <CustomInput
                  id="dest-custom-url"
                  placeholder="https://api.meraki.example/api/v1"
                  value={
                    data.destinationRegion === "custom"
                      ? (data.destinationCustomApiBase ?? "")
                      : ""
                  }
                  onChange={(e: any) =>
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
              </FormField>
            )}

            <FormField
              id="dest-api-key"
              label="API Key"
              className="text-[13px] uppercase"
            >
              <CustomInputPassword
                id="dest-api-key"
                icon={LockKeyholeOpen}
                placeholder="Enter destination API key"
                value={data.destinationApiKey}
                onChange={(e: any) =>
                  onUpdate({ destinationApiKey: e.target.value })
                }
              />
            </FormField>

            {/* Note */}
            <div className="px-5 p-3 flex items-center gap-3 bg-[#F3F4F5] rounded-3xl">
              <Shield size={16} className="text-[#003E68] shrink-0" />
              <p className="text-xs">
                <span>Note: </span>Your API key is only used for this session
                and is never stored. Make sure you have administrator access to
                create and manage devices in the destination organization.
              </p>
            </div>
          </div>
        </div>

        {/* Howto get api key */}
        <InformationCard
          icon={CircleQuestionMark}
          label="Where is my API key?"
          className="w-[600px]"
        >
          <ul className="space-y-3 font-light text-[13px] text-white">
            <li>
              <span className="font-semibold text-[#D0F059]">01</span> Log in to{" "}
              <span className="font-semibold">
                {isCustom ? "your Meraki dashboard" : selectedRegion.dashboard}
              </span>
            </li>
            <li>
              <span className="font-semibold text-[#D0F059]">02</span> Go to{" "}
              <span className="font-semibold">Organization → Settings</span>
            </li>
            <li>
              <span className="font-semibold text-[#D0F059]">03</span> Scroll to{" "}
              <span className="font-semibold">Dashboard API access</span> and
              enable it
            </li>
            <li>
              <span className="font-semibold text-[#D0F059]">04</span> Click{" "}
              <span className="font-semibold">Generate new API key</span>, then
              paste it above
            </li>
          </ul>
        </InformationCard>
      </div>
    </div>
  );
}
