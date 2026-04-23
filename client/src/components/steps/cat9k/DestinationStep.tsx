import React, { useEffect, useState } from "react";

import { Input, Select } from "antd";
import { ClipboardList, LockKeyholeOpen } from "lucide-react";

import StepHeadingCard from "../StepHeadingCard";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";
import CustomButton from "../../ui/CustomButton";

import { MERAKI_REGIONS } from "@/src/constants";

import {
  getOrganizations,
  getOrgNetworks,
  getNetworkDevices,
} from "../../../services/merakiService";

import { apiClient } from "../../../services/apiClient";

import {
  MerakiOrganization,
  MerakiNetwork,
  Cat9KData,
} from "../../../types/types";
import OvalButton from "../../home/OvalButton";
import InformationCard from "../InformationCard";
import FormField from "../../ui/FormField";
import CustomSelect from "../../ui/CustomSelect";
import { CustomInput } from "../../ui/CustomInput";
import { CustomInputPassword } from "../../ui/CustomInputPassword";

interface DestinationStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
  connectedOrgs?: any[];
  selectedOrgId?: string;
}

type FetchState = "idle" | "loading" | "success" | "error";

export function DestinationStep({
  data,
  onUpdate,
  connectedOrgs = [],
  selectedOrgId,
}: DestinationStepProps) {
  // "connected" mode uses the backend-stored API key; "manual" mode lets the user enter one
  const [mode, setMode] = useState<"connected" | "manual">(
    connectedOrgs.length > 0 ? "connected" : "manual",
  );

  // Connected-org flow
  const [connectedNetworks, setConnectedNetworks] = useState<MerakiNetwork[]>(
    [],
  );
  const [connectedOrgId, setConnectedOrgId] = useState<string>(
    selectedOrgId ?? connectedOrgs[0]?.id?.toString() ?? "",
  );
  const [networkLoadState, setNetworkLoadState] = useState<FetchState>("idle");
  const [networkError, setNetworkError] = useState("");

  // Manual flow (same as before)
  const [orgs, setOrgs] = useState<MerakiOrganization[]>([]);
  const [networks, setNetworks] = useState<MerakiNetwork[]>([]);
  const [orgState, setOrgState] = useState<FetchState>("idle");
  const [networkState, setNetworkState] = useState<FetchState>("idle");
  const [error, setError] = useState("");

  const selectedRegion =
    MERAKI_REGIONS.find((r) => r.code === data.destinationRegion) ??
    MERAKI_REGIONS[0];

  // Auto-load networks when connected org is selected
  useEffect(() => {
    if (mode === "connected" && connectedOrgId) {
      loadConnectedNetworks(connectedOrgId);
    }
  }, [connectedOrgId, mode]);

  const loadConnectedNetworks = async (orgDbId: string) => {
    setNetworkLoadState("loading");
    setNetworkError("");
    setConnectedNetworks([]);
    onUpdate({
      destinationNetwork: null,
      destinationDevices: [],
      destinationOrg: null,
    });
    try {
      // Fetch networks and credentials in parallel
      const [nets, creds] = await Promise.all([
        apiClient.getOrganizationNetworks(orgDbId) as Promise<MerakiNetwork[]>,
        apiClient.getOrganizationCredentials(orgDbId),
      ]);
      setConnectedNetworks(nets);
      setNetworkLoadState("success");

      // Build a MerakiOrganization-shaped object from the connected org row and
      // store the real API key so ApplyStep can push config to Meraki directly.
      const row = connectedOrgs.find((o) => String(o.id) === String(orgDbId));
      if (row) {
        onUpdate({
          destinationOrg: {
            id: row.meraki_org_id,
            name: row.meraki_org_name,
          } as MerakiOrganization,
          destinationRegion: creds.region ?? row.meraki_region ?? "com",
          destinationApiKey: creds.api_key,
        });
      }
    } catch (err: any) {
      setNetworkError(err.message ?? "Failed to fetch networks.");
      setNetworkLoadState("error");
    }
  };

  const handleConnectedNetworkSelect = async (netId: string) => {
    const net = connectedNetworks.find((n) => n.id === netId) ?? null;
    onUpdate({ destinationNetwork: net, destinationDevices: [] });
    if (!net) return;
    // Fetch devices via the backend proxy (uses the stored API key)
    try {
      const devices = await apiClient.getOrganizationNetworkDevices(
        connectedOrgId,
        net.id,
      );
      onUpdate({ destinationDevices: devices });
    } catch {
      // Non-fatal — device count is informational only
    }
  };

  // Manual mode handlers (unchanged logic)
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
      // Non-fatal
    }
  };

  const switchMode = (newMode: "connected" | "manual") => {
    setMode(newMode);
    onUpdate({
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
    setConnectedNetworks([]);
    setNetworkLoadState("idle");
    setNetworkError("");
  };

  return (
    <div className="flex items-start gap-6">
      <div className="p-5 w-full flex flex-col gap-6 bg-white border border-[#C1C7D11A] rounded-lg shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
        {/* Mode toggle — only show if there are connected orgs */}
        {connectedOrgs.length > 0 && (
          <div className="flex items-center gap-2">
            {(["connected", "manual"] as const).map((m) => (
              <OvalButton
                key={m}
                onClick={() => switchMode(m)}
                bg_prop={mode === m ? `bg-[#D0F059]` : `bg-gray-100`}
              >
                {m === "connected" ? "Use Connected Org" : "Different API Key"}
              </OvalButton>
            ))}
          </div>
        )}

        {/* ── Connected-org flow ── */}
        {mode === "connected" && (
          <>
            {/* Connected org picker */}
            <FormField
              id="organization"
              label="Connected Organization"
              className="text-[13px] uppercase"
            >
              <CustomSelect
                placeholder="Select Oragnization"
                value={connectedOrgId}
                options={connectedOrgs?.map((o) => ({
                  value: o?.id,
                  label: `${o?.meraki_org_name} ${o.meraki_region === "in" ? " (India)" : " (Global)"}`,
                }))}
                onChange={(value: any) => setConnectedOrgId(value)}
              />
            </FormField>

            {/* Network error */}
            {networkError && (
              <AlertCard variant="red">{networkError}</AlertCard>
            )}

            {/* Network picker */}
            {(connectedNetworks.length > 0 ||
              networkLoadState === "loading") && (
              <FormField
                id="network"
                label="Network"
                className="text-[13px] uppercase"
              >
                <CustomSelect
                  id="network"
                  placeholder="Select Network"
                  value={data.destinationNetwork?.id ?? null}
                  options={connectedNetworks?.map((n) => ({
                    value: n?.id,
                    label: n?.name,
                  }))}
                  onChange={(value: any) => handleConnectedNetworkSelect(value)}
                  disabled={networkLoadState === "loading"}
                />
              </FormField>
            )}
          </>
        )}

        {/* ── Manual / different API key flow ── */}
        {mode === "manual" && (
          <>
            {/* Region */}
            <FormField
              id="region"
              label="Region"
              className="text-[13px] uppercase"
            >
              <CustomSelect
                id="region"
                placeholder="Select Region"
                value={data.destinationRegion}
                options={MERAKI_REGIONS.map((r) => ({
                  value: r.code,
                  label: r.name,
                }))}
                onChange={(value: any) => handleRegionChange(value)}
              />

              {selectedRegion.code !== "custom" && (
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedRegion.dashboard}
                </div>
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
                onPressEnter={handleFetchOrgs}
              />
            </FormField>

            <OvalButton
              onClick={handleFetchOrgs}
              disabled={
                !data.destinationApiKey.trim() || orgState === "loading"
              }
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
                  placeholder="Select organization…"
                  value={data.destinationOrg?.id ?? undefined}
                  options={orgs.map((o) => ({
                    value: o.id,
                    label: o.name,
                  }))}
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
                  placeholder="Select network…"
                  value={data.destinationNetwork?.id ?? undefined}
                  options={networks.map((n) => ({
                    value: n.id,
                    label: n.name,
                  }))}
                  onChange={(value: any) => handleSelectNetwork(value)}
                  disabled={networkState === "loading"}
                />
              </FormField>
            )}
          </>
        )}
      </div>

      {/* Selected summary */}
      {(data.destinationOrg || data.destinationNetwork) && (
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
                  <span>
                    {" "}
                    &middot;{" "}
                    {
                      data.destinationDevices.filter(
                        (d) =>
                          d.model?.startsWith("C93") ||
                          d.model?.startsWith("C9K"),
                      ).length
                    }{" "}
                    Cat9K device(s) found
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
