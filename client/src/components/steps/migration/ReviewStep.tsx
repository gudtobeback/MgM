import React from "react";

import { Input } from "antd";
import { Loader2, ArrowRight, CircleAlert, TriangleAlert } from "lucide-react";

import DomainCard from "../DomainCard";
import StepHeadingCard from "../StepHeadingCard";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";

import { MERAKI_REGIONS } from "@/src/constants";

import { MigrationData } from "../../../types/types";
import FormField from "../../ui/FormField";
import { CustomInput } from "../../ui/CustomInput";

interface ReviewStepProps {
  data: MigrationData;
  onUpdate: (data: Partial<MigrationData>) => void;
  isLoading: boolean;
}

export function ReviewStep({ data, onUpdate, isLoading }: ReviewStepProps) {
  const soucrce_region =
    MERAKI_REGIONS.find((r) => r.code === data.sourceRegion) ??
    MERAKI_REGIONS[0];
  const isSourceRegionCustom = data.sourceRegion === "custom";

  const destination_region =
    MERAKI_REGIONS.find((r) => r.code === data.destinationRegion) ??
    MERAKI_REGIONS[1];
  const isDestinationRegionCustom = data.destinationRegion === "custom";

  return (
    <div className="step-card-inner-layout">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-[#049FD9]" />
          <p className="mt-4 text-muted-foreground">
            Analyzing source organization and preparing migration plan...
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Warning */}
          <AlertCard variant="yellow">
            <div className="font-semibold">Warning : Irreversible Action</div>

            <p>
              This action is irreversible. All devices will be unclaimed from
              the source and moved. This will cause a service interruption for
              all devices being migrated. A full backup will be created
              automatically before migration begins.
            </p>
          </AlertCard>

          {/* Source & Destination */}
          <div className="flex items-center justify-between gap-5">
            {/* Source */}
            <div className="w-[300px] p-5 flex flex-col gap-5 bg-white border border-[#C1C7D11A] rounded-md shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
              <div className="uppercase font-semibold text-xs text-[#003E68]">
                Source Context
              </div>

              <div className="space-y-1 text-xs border-b border-gray-200 pb-0.5">
                <p>Dashboard</p>
                <p className="font-semibold text-[#003E68]">
                  {isSourceRegionCustom
                    ? "Custom API endpoint"
                    : soucrce_region.dashboard}
                </p>
              </div>

              <div className="space-y-1 text-xs border-b border-gray-200 pb-0.5">
                <p>Organization</p>
                <p className="font-semibold text-[#003E68]">
                  {data.sourceOrg?.name}
                </p>
              </div>

              <div className="space-y-1 text-xs border-b border-gray-200 pb-0.5">
                <p>Networks</p>
                <p className="font-semibold text-[#003E68]">
                  {data.sourceNetwork?.name}
                </p>
              </div>
            </div>

            {/* Devices */}
            <div className="flex flex-col items-center gap-10">
              <ArrowRight size={40} className="p-2 bg-[#D0F059] rounded-full" />

              <div className="font-semibold">
                {data.devicesToMigrate.length} Devices
              </div>
            </div>

            {/* Destination */}
            <div className="w-[300px] p-5 flex flex-col gap-5 bg-[#003E68] rounded-md">
              <div className="uppercase font-semibold text-xs text-[#D0F059]">
                Target Destination
              </div>

              <div className="space-y-1 text-xs border-b border-gray-200 pb-0.5">
                <p className="text-white">Mapped Dashboards</p>
                <p className="font-semibold text-[#D0F059]">
                  {isDestinationRegionCustom
                    ? "Custom API endpoint"
                    : destination_region.dashboard}
                </p>
              </div>

              <div className="space-y-1 text-xs border-b border-gray-200 pb-0.5">
                <p className="text-white">Enterprise Org</p>
                <p className="font-semibold text-[#D0F059]">
                  {data.destinationOrg?.name}
                </p>
              </div>

              <div className="space-y-1 text-xs border-b border-gray-200 pb-0.5">
                <p className="text-white">Network Tunneling</p>
                <p className="font-semibold text-[#D0F059]">
                  {data.destinationNetwork?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-5 w-full flex flex-col gap-6 bg-white border border-[#C1C7D11A] rounded-lg shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
            <FormField
              id="confirmation"
              label="To confirm, please type MIGRATE below."
              className="text-[13px] uppercase"
            >
              <CustomInput
                id="confirmation"
                placeholder='Type "MIGRATE" to proceed'
                value={data.reviewConfirmation}
                onChange={(e: any) =>
                  onUpdate({ reviewConfirmation: e.target.value })
                }
              />
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
}
