import React from "react";

import { Input } from "antd";
import { Loader2, ArrowRight } from "lucide-react";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";

import { MigrationData } from "../../../pages/private/migration/MigrationWizard";

import { MERAKI_REGIONS } from "@/src/constants";

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
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">Review Migration Plan</p>
        <p className="text-[12px] text-[#232C32]">
          Review all settings before we begin the migration process.
        </p>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
            <p className="mt-4 text-muted-foreground">
              Analyzing source organization and preparing migration plan...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Title */}
            <div className="flex items-center justify-between">
              {/* Source */}
              <div className="p-4 bg-[#F6FDFF] rounded-lg border border-[#87D2ED] w-fit">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-7.5 bg-[#049FD9] rounded-full"></div>

                    <p className="text-sm font-medium">Source</p>
                  </div>

                  <div className="flex flex-col gap-1 font-medium text-xs">
                    <p className="text-[#8B8B8B]">DASHBOARD</p>
                    <p>
                      {isSourceRegionCustom
                        ? "Custom API endpoint"
                        : soucrce_region.dashboard}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 font-medium text-xs">
                    <p className="text-[#8B8B8B]">ORGANIZATION</p>
                    <p>{data.sourceOrg?.name}</p>
                  </div>

                  <div className="flex flex-col gap-1 font-medium text-xs">
                    <p className="text-[#8B8B8B]">NETWORK</p>
                    <p>{data.sourceNetwork?.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="font-semibold">
                  {data.devicesToMigrate.length} Devices
                </div>
                <ArrowRight
                  size={40}
                  className="p-2 text-white bg-[#5D626B] rounded-full"
                />
              </div>

              {/* Destination */}
              <div className="p-4 bg-[#F8FFF6] rounded-lg border border-[#87ED87] w-fit">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-7.5 bg-[#0BD904] rounded-full"></div>

                    <p className="text-sm font-medium">Destination</p>
                  </div>

                  <div className="flex flex-col gap-1 font-medium text-xs">
                    <p className="text-[#8B8B8B]">DASHBOARD</p>
                    <p>
                      {isDestinationRegionCustom
                        ? "Custom API endpoint"
                        : destination_region.dashboard}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 font-medium text-xs">
                    <p className="text-[#8B8B8B]">ORGANIZATION</p>
                    <p>{data.destinationOrg?.name}</p>
                  </div>

                  <div className="flex flex-col gap-1 font-medium text-xs">
                    <p className="text-[#8B8B8B]">NETWORK</p>
                    <p>{data.destinationNetwork?.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning */}
            <AlertCard variant="alert">
              <p>
                <strong>Warning: </strong>This action is irreversible. All
                devices will be unclaimed from the source and moved. This will
                cause a service interruption for all devices being migrated. A
                full backup will be created automatically before migration
                begins.
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
                onChange={(e) =>
                  onUpdate({ reviewConfirmation: e.target.value })
                }
              />
            </LabelInput>
          </div>
        )}
      </div>
    </div>
  );
}
