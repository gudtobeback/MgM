import React, { useEffect, useState } from "react";
import {
  Globe,
  Key,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { MERAKI_REGIONS } from "../../steps/migration/SourceConnectionStep";
import {
  getOrganizations,
  getOrgNetworks,
  getNetworkDevices,
} from "../../../services/merakiService";
import { apiClient } from "../../../services/apiClient";
import { MerakiOrganization, MerakiNetwork } from "../../../types/types";
import { Cat9KData } from "../Cat9KMigrationWizard";
import CustomButton from "../../ui/CustomButton";
import { Input, Select } from "antd";
import LabelInput from "../../ui/LabelInput";
import AlertCard from "../../ui/AlertCard";

interface DestinationStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
  connectedOrgs?: any[];
  selectedOrgId?: string;
}

type FetchState = "idle" | "loading" | "success" | "error";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  marginBottom: "6px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--color-border-primary)",
  borderRadius: "5px",
  fontSize: "13px",
  color: "var(--color-text-primary)",
  backgroundColor: "var(--color-bg-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  backgroundImage: "none",
  cursor: "pointer",
};

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
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">
          Select Destination Meraki Network
        </p>
        <p className="text-[12px] text-[#232C32]">
          Choose the Meraki network where the translated configuration will be
          pushed. The target network should contain Catalyst 9K devices under
          Meraki cloud management.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Mode toggle — only show if there are connected orgs */}
        {connectedOrgs.length > 0 && (
          <div className="flex items-center gap-2">
            {(["connected", "manual"] as const).map((m) => (
              <CustomButton
                key={m}
                onClick={() => switchMode(m)}
                bg_prop={mode === m ? `bg-[#049FD9]` : `bg-white`}
                text_prop={mode === m ? "text-white" : "text-black"}
              >
                {m === "connected" ? "Use Connected Org" : "Different API Key"}
              </CustomButton>
            ))}
          </div>
        )}

        {/* ── Connected-org flow ── */}
        {mode === "connected" && (
          <>
            {/* Connected org picker */}
            <LabelInput
              id="organization"
              label="Connected Organization"
              required
            >
              <Select
                placeholder="Select Oragnization"
                value={connectedOrgId}
                options={connectedOrgs?.map((o) => ({
                  value: o?.id,
                  label: `${o?.meraki_org_name} ${o.meraki_region === "in" ? " (India)" : " (Global)"}`,
                }))}
                onChange={(value) => setConnectedOrgId(value)}
              />
            </LabelInput>

            {/* Network error */}
            {networkError && (
              <AlertCard variant="error">{networkError}</AlertCard>
            )}

            {/* Network picker */}
            {(connectedNetworks.length > 0 ||
              networkLoadState === "loading") && (
              <LabelInput id="network" label="Network" required>
                <Select
                  id="network"
                  placeholder="Select Network"
                  value={data.destinationNetwork?.id ?? null}
                  options={connectedNetworks?.map((n) => ({
                    value: n?.id,
                    label: n?.name,
                  }))}
                  onChange={(value) => handleConnectedNetworkSelect(value)}
                  loading={networkLoadState === "loading"}
                  disabled={networkLoadState === "loading"}
                />
              </LabelInput>
            )}
          </>
        )}

        {/* ── Manual / different API key flow ── */}
        {mode === "manual" && (
          <>
            {/* Region */}
            <LabelInput id="region" label="Region" required>
              <Select
                id="region"
                placeholder="Select Region"
                value={data.destinationRegion}
                options={MERAKI_REGIONS.map((r) => ({
                  value: r.code,
                  label: r.name,
                }))}
                onChange={(value) => handleRegionChange(value)}
                className="w-full"
              />

              {selectedRegion.code !== "custom" && (
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedRegion.dashboard}
                </div>
              )}
            </LabelInput>

            {/* API Key */}
            <LabelInput id="api-key" label="API Key" required>
              <Input
                id="api-key"
                type="password"
                value={data.destinationApiKey}
                placeholder="Enter Meraki API key"
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
                onPressEnter={handleFetchOrgs}
              />
            </LabelInput>

            <CustomButton
              onClick={handleFetchOrgs}
              disabled={
                !data.destinationApiKey.trim() || orgState === "loading"
              }
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
                  placeholder="Select organization…"
                  value={data.destinationOrg?.id ?? undefined}
                  options={orgs.map((o) => ({
                    value: o.id,
                    label: o.name,
                  }))}
                  onChange={(value) => handleSelectOrg(value)}
                  className="w-full"
                />
              </LabelInput>
            )}

            {/* Network */}
            {(networks.length > 0 || networkState === "loading") && (
              <LabelInput id="network" label="Network" required>
                <Select
                  placeholder="Select network…"
                  value={data.destinationNetwork?.id ?? undefined}
                  options={networks.map((n) => ({
                    value: n.id,
                    label: n.name,
                  }))}
                  onChange={(value) => handleSelectNetwork(value)}
                  loading={networkState === "loading"}
                  disabled={networkState === "loading"}
                  className="w-full"
                />
              </LabelInput>
            )}
          </>
        )}

        {/* Selected summary */}
        {data.destinationNetwork && (
          <AlertCard variant="success">
            <div className="font-semibold">{data.destinationNetwork.name}</div>
            <div>
              {data.destinationOrg?.name}
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
          </AlertCard>
        )}
      </div>
    </div>
  );
}
