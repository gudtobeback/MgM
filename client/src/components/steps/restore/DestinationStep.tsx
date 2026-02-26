import React, { useState } from "react";

import { MERAKI_REGIONS } from "@/src/constants";
import {
  getOrganizations,
  getOrgNetworks,
  getNetworkDevices,
} from "../../../services/merakiService";
import { MerakiOrganization, MerakiNetwork } from "../../../types/types";
import { RestoreData } from "../../../pages/private/backup_and_recovery/RestoreWizard";
import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";
import { Input, Select } from "antd";
import CustomButton from "../../ui/CustomButton";

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
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 border-b-2 p-6">
        <p className="text-[16px] font-semibold">
          Select Destination Meraki Network
        </p>
        <p className="text-[12px] text-[#232C32]">
          Connect to the Meraki dashboard where you want to restore the
          configuration.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Region */}
        <LabelInput id="region" label="Region" required>
          <Select
            id="region"
            placeholder="Select Region"
            value={data.destinationRegion || null}
            options={MERAKI_REGIONS?.map((r) => ({
              value: r?.code,
              label: r?.name,
            }))}
            onChange={(value) => handleRegionChange(value)}
          />

          {selectedRegion.code !== "custom" && (
            <div className="mt-1 text-xs">{selectedRegion.dashboard}</div>
          )}
        </LabelInput>

        {/* API Key */}
        <LabelInput id="api-key" label="API Key" required>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter Meraki API key"
            value={data.destinationApiKey}
            onChange={(e) => {
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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFetchOrgs();
            }}
          />
        </LabelInput>

        <CustomButton
          onClick={handleFetchOrgs}
          disabled={!data.destinationApiKey.trim() || orgState === "loading"}
          className="w-fit"
        >
          {orgState === "loading"
            ? "Connecting..."
            : orgState === "success"
              ? "Connected"
              : "Connect"}
        </CustomButton>

        {/* Error */}
        {error && <AlertCard variant="error">{error}</AlertCard>}

        {/* Organization */}
        {orgs.length > 0 && (
          <LabelInput id="organization" label="Organization" required>
            <Select
              id="organization"
              placeholder="Select Organization"
              value={data.destinationOrg?.id ?? null}
              options={orgs?.map((o) => ({ value: o?.id, label: o?.name }))}
              onChange={(value) => handleSelectOrg(value)}
            />
          </LabelInput>
        )}

        {/* Network */}
        {(networks.length > 0 || networkState === "loading") && (
          <LabelInput id="network" label="Network" required>
            <Select
              id="network"
              value={data.destinationNetwork?.id || null}
              options={networks?.map((n) => ({
                value: n?.id,
                label: n?.name,
              }))}
              onChange={(value) => handleSelectNetwork(value)}
              loading={networkState === "loading"}
              disabled={networkState === "loading"}
            />
          </LabelInput>
        )}

        {/* Selected summary */}
        {data.destinationNetwork && (
          <AlertCard variant="note">
            <p>
              <strong>Organization - </strong>
              {data.destinationNetwork.name}
            </p>
            <p>
              <strong>Network - </strong>
              {data.destinationOrg?.name}
              {data.destinationDevices.length > 0 && (
                <span>
                  {" "}
                  &middot; {data.destinationDevices.length} device(s) found
                </span>
              )}
            </p>
          </AlertCard>
        )}
      </div>
    </div>
  );
}
