import React, { useState } from "react";

import { Input, Select } from "antd";
import {
  HardDriveDownload,
  ClipboardList,
  LockKeyholeOpen,
} from "lucide-react";

import StepHeadingCard from "../StepHeadingCard";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";
import CustomButton from "../../ui/CustomButton";

import { MERAKI_REGIONS } from "@/src/constants";

import {
  RestoreData,
  MerakiOrganization,
  MerakiNetwork,
} from "../../../types/types";

import {
  getOrganizations,
  getOrgNetworks,
  getNetworkDevices,
} from "../../../services/merakiService";
import InformationCard from "../InformationCard";
import FormField from "../../ui/FormField";
import CustomSelect from "../../ui/CustomSelect";
import { CustomInput } from "../../ui/CustomInput";
import { CustomInputPassword } from "../../ui/CustomInputPassword";
import OvalButton from "../../home/OvalButton";

interface DestinationStepProps {
  data: RestoreData;
  onUpdate: (patch: Partial<RestoreData>) => void;
}

type FetchState = "idle" | "loading" | "success" | "error";

export function DestinationStep({ data, onUpdate }: DestinationStepProps) {
  const [orgs, setOrgs] = useState<MerakiOrganization[]>([]);
  const [networks, setNetworks] = useState<MerakiNetwork[]>([]);
  const [orgState, setOrgState] = useState<FetchState>("idle");
  const [networkState, setNetworkState] = useState<FetchState>("idle");
  const [error, setError] = useState("");

  const selectedRegion =
    MERAKI_REGIONS.find((r) => r.code === data.destinationRegion) ??
    MERAKI_REGIONS[0];

  const handleRegionChange = (code: string) => {
    onUpdate({
      destinationRegion: code,
      destinationOrg: null,
      destinationNetwork: null,
      destinationDevices: [],
      destinationApiKey: "",
    });
    setOrgs([]);
    setNetworks([]);
    setOrgState("idle");
    setNetworkState("idle");
    setError("");
  };

  const handleFetchOrgs = async () => {
    if (!data.destinationApiKey.trim()) return;
    setOrgState("loading");
    setError("");
    try {
      const result = await getOrganizations(
        data.destinationApiKey,
        data.destinationRegion,
      );
      setOrgs(result);
      setOrgState("success");
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch organizations.");
      setOrgState("error");
    }
  };

  const handleSelectOrg = async (orgId: string) => {
    const org = orgs.find((o) => o.id === orgId) ?? null;
    onUpdate({
      destinationOrg: org,
      destinationNetwork: null,
      destinationDevices: [],
    });
    setNetworks([]);
    setNetworkState("idle");
    if (!org) return;
    setNetworkState("loading");
    try {
      const nets = await getOrgNetworks(
        data.destinationApiKey,
        data.destinationRegion,
        org.id,
      );
      setNetworks(nets);
      setNetworkState("success");
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch networks.");
      setNetworkState("error");
    }
  };

  const handleSelectNetwork = async (netId: string) => {
    const net = networks.find((n) => n.id === netId) ?? null;
    onUpdate({ destinationNetwork: net, destinationDevices: [] });
    if (!net) return;
    try {
      const devices = await getNetworkDevices(
        data.destinationApiKey,
        data.destinationRegion,
        net.id,
      );
      onUpdate({ destinationDevices: devices });
    } catch {
      // Non-fatal — devices will be empty
    }
  };

  return (
    <div className="flex items-start gap-6">
      <div className="p-5 w-full flex flex-col gap-6 bg-white border border-[#C1C7D11A] rounded-lg shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
        {/* Region */}
        <FormField id="region" label="Region" className="text-[13px] uppercase">
          <CustomSelect
            id="region"
            placeholder="Select Region"
            value={data.destinationRegion || null}
            options={MERAKI_REGIONS?.map((r) => ({
              value: r?.code,
              label: r?.name,
            }))}
            onChange={(value: any) => handleRegionChange(value)}
          />

          {selectedRegion.code !== "custom" && (
            <div className="mt-1 text-xs">{selectedRegion.dashboard}</div>
          )}
        </FormField>

        {/* API Key */}
        <FormField
          id="api-key"
          label="API Key"
          className="text-[13px] uppercase"
        >
          <CustomInputPassword
            id="api-key"
            placeholder="******"
            icon={LockKeyholeOpen}
            value={data.destinationApiKey}
            onChange={(e: any) => {
              onUpdate({
                destinationApiKey: e.target.value,
                destinationOrg: null,
                destinationNetwork: null,
                destinationDevices: [],
              });
              setOrgs([]);
              setNetworks([]);
              setOrgState("idle");
              setNetworkState("idle");
            }}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") handleFetchOrgs();
            }}
          />
        </FormField>

        <OvalButton
          onClick={handleFetchOrgs}
          disabled={!data.destinationApiKey.trim() || orgState === "loading"}
        >
          {orgState === "loading"
            ? "Connecting..."
            : orgState === "success"
              ? "Connected"
              : "Connect"}
        </OvalButton>

        {/* Error */}
        {error && <AlertCard variant="red">{error}</AlertCard>}

        {/* Organization */}
        {orgs.length > 0 && (
          <FormField
            id="organization"
            label="Organization"
            className="text-[13px] uppercase"
          >
            <CustomSelect
              id="organization"
              placeholder="Select Organization"
              value={data.destinationOrg?.id ?? null}
              options={orgs?.map((o) => ({ value: o?.id, label: o?.name }))}
              onChange={(value: any) => handleSelectOrg(value)}
            />
          </FormField>
        )}

        {/* Network */}
        {(networks.length > 0 || networkState === "loading") && (
          <FormField
            id="network"
            label="Network"
            className="text-[13px] uppercase"
          >
            <CustomSelect
              id="network"
              value={data.destinationNetwork?.id || null}
              options={networks?.map((n) => ({
                value: n?.id,
                label: n?.name,
              }))}
              onChange={(value: any) => handleSelectNetwork(value)}
              disabled={networkState === "loading"}
            />
          </FormField>
        )}
      </div>

      {/* Selected summary */}
      {data.destinationNetwork && (
        <InformationCard
          icon={ClipboardList}
          label="Selection Summary"
          className="w-[600px]"
        >
          {data.destinationOrg && (
            <div className="p-3 flex flex-col gap-1 bg-white/10 rounded-lg">
              <div className="font-medium text-[11px] text-[#D0F059CC]">
                Selected Organization :{" "}
              </div>
              <div className="text-xs text-white">
                {data.destinationOrg.name}{" "}
                {data.destinationDevices.length > 0 && (
                  <span className="text-[#D0F059CC]">
                    {" "}
                    &middot; {data.destinationDevices.length} device(s) found
                  </span>
                )}
              </div>
            </div>
          )}

          {data.destinationNetwork && (
            <div className="p-3 flex flex-col gap-1 bg-white/10 rounded-lg">
              <div className="font-medium text-[11px] text-[#D0F059CC]">
                Selected Network :{" "}
              </div>
              <div className="text-xs text-white">
                {data.destinationNetwork.name}
              </div>
            </div>
          )}
        </InformationCard>
      )}
    </div>
  );
}
