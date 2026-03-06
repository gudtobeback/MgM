import React from "react";

import { Input } from "antd";
import { Loader2, ArrowRight } from "lucide-react";

import DomainCard from "../DomainCard";
import StepHeadingCard from "../StepHeadingCard";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";

import { MERAKI_REGIONS } from "@/src/constants";

import { MigrationData } from "../../../types/types";

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
          {/* Title */}
          <div className="flex items-center justify-between gap-4">
            {/* Source */}
            <DomainCard title="Source" className="w-[250px]">
              <div className="flex flex-col gap-1 font-medium text-xs">
                <p className="text-[#049FD9]">DASHBOARD</p>
                <p>
                  {isSourceRegionCustom
                    ? "Custom API endpoint"
                    : soucrce_region.dashboard}
                </p>
              </div>

              <div className="flex flex-col gap-1 font-medium text-xs">
                <p className="text-[#049FD9]">ORGANIZATION</p>
                <p>{data.sourceOrg?.name}</p>
              </div>

              <div className="flex flex-col gap-1 font-medium text-xs">
                <p className="text-[#049FD9]">NETWORK</p>
                <p>{data.sourceNetwork?.name}</p>
              </div>
            </DomainCard>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-3">
              <div className="font-semibold">
                {data.devicesToMigrate.length} Devices
              </div>
              <ArrowRight
                size={40}
                className="p-2 text-white rounded-full"
                style={{
                  backgroundImage: `linear-gradient(to right, #049FD9, #10B981)`,
                }}
              />
            </div>

            {/* Destination */}
            <DomainCard
              title="Destination"
              variant="green"
              className="w-[250px]"
            >
              <div className="flex flex-col gap-1 font-medium text-xs">
                <p className="text-[#059669]">DASHBOARD</p>
                <p>
                  {isDestinationRegionCustom
                    ? "Custom API endpoint"
                    : destination_region.dashboard}
                </p>
              </div>

              <div className="flex flex-col gap-1 font-medium text-xs">
                <p className="text-[#059669]">ORGANIZATION</p>
                <p>{data.destinationOrg?.name}</p>
              </div>

              <div className="flex flex-col gap-1 font-medium text-xs">
                <p className="text-[#059669]">NETWORK</p>
                <p>{data.destinationNetwork?.name}</p>
              </div>
            </DomainCard>
          </div>

          {/* Warning */}
          <AlertCard variant="warning">
            <p>
              <strong>Warning: </strong>This action is irreversible. All devices
              will be unclaimed from the source and moved. This will cause a
              service interruption for all devices being migrated. A full backup
              will be created automatically before migration begins.
            </p>
          </AlertCard>

          <LabelInput
            id="confirmation"
            label="To confirm, please type MIGRATE below."
            required
          >
            <Input
              id="confirmation"
              placeholder='Type "MIGRATE" to proceed'
              value={data.reviewConfirmation}
              onChange={(e) => onUpdate({ reviewConfirmation: e.target.value })}
            />
          </LabelInput>
        </div>
      )}
    </div>
  );
}
