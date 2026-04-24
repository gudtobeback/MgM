import React, { Input, Select } from "antd";

import DomainCard from "../DomainCard";
import StepHeadingCard from "../StepHeadingCard";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";

import { MERAKI_REGIONS } from "@/src/constants";
import {
  ArrowRightLeft,
  Loader2,
  X,
  Earth,
  LockKeyholeOpen,
  CircleQuestionMark,
  Shield,
} from "lucide-react";
import FormField from "../../ui/FormField";
import { CustomInput } from "../../ui/CustomInput";
import { CustomInputPassword } from "../../ui/CustomInputPassword";
import CustomSelect from "../../ui/CustomSelect";
import InformationCard from "../InformationCard";

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

  const handleRegionChange = (value: string | number | null) => {
    const code = value as string;
    // Reset org/network when region changes
    onUpdate({
      sourceRegion: code,
      sourceOrg: null,
      sourceNetwork: null,
      sourceApiKey: "",
    });
  };

  return (
    <div className="flex items-start gap-6">
      <div className="w-full bg-white border border-[#C1C7D11A] rounded-lg shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
        <div className="p-5 flex items-center justify-between border-b border-gray-200">
          {/* Title Card */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EDEEEF] rounded-md">
              <Earth className="text-[#003E68]" />
            </div>

            <div className="text-[#003E68]">
              <p className="text-sm font-semibold">Source Dashboard</p>
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
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-6">
          <FormField
            id="region"
            label="Meraki Region"
            className="text-[13px] uppercase"
          >
            <CustomSelect
              id="region"
              placeholder="Select Region"
              options={MERAKI_REGIONS.map((r) => ({
                value: r.code,
                label: `${r.name} ${!r.confirmed && r.code !== "custom" ? " ⚠" : ""}`,
              }))}
              value={data.sourceRegion || "com"}
              onChange={handleRegionChange}
            />
          </FormField>

          {isCustom && (
            <FormField
              id="source-custom-url"
              label="Custom API Base URL"
              className="text-[13px] uppercase"
            >
              <CustomInput
                id="source-custom-url"
                placeholder="https://api.meraki.example/api/v1"
                value={
                  data.sourceRegion === "custom"
                    ? (data.sourceCustomApiBase ?? "")
                    : ""
                }
                onChange={(e: any) =>
                  onUpdate({
                    sourceCustomApiBase: e.target.value,
                    // sourceRegion: e.target.value || "custom",
                  })
                }
              />

              <p className="text-xs text-[#64748B]">
                Enter the full API base URL for your Meraki region (e.g.
                https://api.meraki.cn/api/v1).
              </p>
            </FormField>
          )}

          <FormField
            id="source-api-key"
            label="Dashboard API Key"
            className="text-[13px] uppercase"
          >
            <CustomInputPassword
              id="source-api-key"
              placeholder="*******"
              icon={LockKeyholeOpen}
              value={data.sourceApiKey}
              onChange={(e: any) => onUpdate({ sourceApiKey: e.target.value })}
            />
          </FormField>

          <div className="px-5 p-3 flex items-center gap-3 bg-[#F3F4F5] rounded-3xl">
            <Shield size={16} className="text-[#003E68] shrink-0" />
            <p className="text-xs">
              <span>Note: </span>Your API key is only used for this session and
              is never stored. Make sure you have administrator access to the
              source dashboard.
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
  );
}

// <DomainCard
//   title="Source Dashboard"
//   subTitle={isCustom ? "Custom API endpoint" : selectedRegion.dashboard}
// />
