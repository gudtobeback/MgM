import React, { useState, useRef } from "react";

import JSZip from "jszip";
import {
  UploadCloud,
  Upload,
  FileJson,
  Archive,
  CheckCircle2,
  HardDriveDownload,
} from "lucide-react";

import StepHeadingCard from "../StepHeadingCard";

import AlertCard from "../../ui/AlertCard";

import {
  RestoreData,
  BackupFile,
  NetworkConfigBackup,
  DeviceConfigBackup,
  DeviceBackup,
} from "../../../types/types";

interface UploadStepProps {
  data: RestoreData;
  onUpdate: (patch: Partial<RestoreData>) => void;
}

// ── ZIP parser ────────────────────────────────────────────────────────────────

async function parseZip(buffer: ArrayBuffer): Promise<BackupFile> {
  const zip = await JSZip.loadAsync(buffer);

  // Organisation details
  let sourceOrgId = "unknown";
  let sourceOrgName = "Unknown Organization";
  const orgDetailsFile = zip.file("organization/details.json");
  if (orgDetailsFile) {
    try {
      const raw = await orgDetailsFile.async("text");
      const parsed = JSON.parse(raw);
      sourceOrgId = parsed.id ?? sourceOrgId;
      sourceOrgName = parsed.name ?? sourceOrgName;
    } catch {
      /* ignore */
    }
  }

  // Networks
  const networkConfigs: Record<string, Partial<NetworkConfigBackup>> = {};
  const networkFolderRe = /^networks\/([^/]+)\/(.+)$/;
  const networkFolders = new Set<string>();

  zip.forEach((relativePath) => {
    const m = relativePath.match(networkFolderRe);
    if (m) networkFolders.add(m[1]);
  });

  for (const folder of networkFolders) {
    // Extract networkId: last _-delimited segment
    const parts = folder.split("_");
    const networkId = parts[parts.length - 1] || folder;
    const cfg: Partial<NetworkConfigBackup> = {};

    const readJson = async (filename: string): Promise<any | null> => {
      const f = zip.file(`networks/${folder}/${filename}`);
      if (!f) return null;
      try {
        return JSON.parse(await f.async("text"));
      } catch {
        return null;
      }
    };

    const vlans = await readJson("appliance_vlans.json");
    if (Array.isArray(vlans)) cfg.applianceVlans = vlans;

    const fwRules = await readJson("appliance_firewall_l3FirewallRules.json");
    if (fwRules) cfg.applianceL3FirewallRules = fwRules;

    const ssids = await readJson("wireless_ssids.json");
    if (Array.isArray(ssids)) cfg.ssids = ssids;

    const groupPolicies = await readJson("group_policies.json");
    if (Array.isArray(groupPolicies)) cfg.groupPolicies = groupPolicies;

    const vpn = await readJson("appliance_vpn_siteToSiteVpn.json");
    if (vpn) cfg.siteToSiteVpnSettings = vpn;

    networkConfigs[networkId] = cfg;
  }

  // Devices
  const devices: DeviceBackup[] = [];
  const deviceFolderRe = /^devices\/([^/]+)\/(.+)$/;
  const deviceFolders = new Set<string>();

  zip.forEach((relativePath) => {
    const m = relativePath.match(deviceFolderRe);
    if (m) deviceFolders.add(m[1]);
  });

  for (const folder of deviceFolders) {
    const parts = folder.split("_");
    const serial = parts[parts.length - 1] || folder;

    const readJson = async (filename: string): Promise<any | null> => {
      const f = zip.file(`devices/${folder}/${filename}`);
      if (!f) return null;
      try {
        return JSON.parse(await f.async("text"));
      } catch {
        return null;
      }
    };

    const general = await readJson("details.json");
    if (!general) continue;

    const cfg: DeviceConfigBackup = { general };
    const switchPorts = await readJson("switch_ports.json");
    if (Array.isArray(switchPorts)) cfg.switchPorts = switchPorts;

    devices.push({ serial, config: cfg });
  }

  return {
    createdAt: new Date().toISOString(),
    sourceOrgId,
    sourceOrgName,
    devices,
    networkConfigs,
    organizationConfig: {},
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UploadStep({ data, onUpdate }: UploadStepProps) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setParsing(true);
    setParseError("");
    onUpdate({ parsedBackup: null, fileType: null, fileName: "" });

    const isZip = file.name.toLowerCase().endsWith(".zip");
    const isJson = file.name.toLowerCase().endsWith(".json");

    if (!isZip && !isJson) {
      setParseError(
        "Unsupported file type. Please upload a .zip or .json backup file.",
      );
      setParsing(false);
      return;
    }

    try {
      let parsed: BackupFile;

      if (isJson) {
        const text = await file.text();
        parsed = JSON.parse(text) as BackupFile;
        if (!parsed.networkConfigs)
          throw new Error(
            "File does not appear to be a valid MerakiMigration backup JSON.",
          );
        onUpdate({
          fileType: "json",
          fileName: file.name,
          parsedBackup: parsed,
        });
      } else {
        const buffer = await file.arrayBuffer();
        parsed = await parseZip(buffer);
        onUpdate({
          fileType: "zip",
          fileName: file.name,
          parsedBackup: parsed,
        });
      }

      // Auto-select network if only one
      const networkIds = Object.keys(parsed.networkConfigs);
      if (networkIds.length === 1) {
        onUpdate({ selectedNetworkId: networkIds[0] });
      }
    } catch (e: any) {
      setParseError(
        e.message ||
          "Failed to parse backup file. Ensure it is a valid MerakiMigration backup.",
      );
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const networkCount = data.parsedBackup
    ? Object.keys(data.parsedBackup.networkConfigs).length
    : 0;
  const deviceCount = data.parsedBackup ? data.parsedBackup.devices.length : 0;
  const createdAt = data.parsedBackup?.createdAt
    ? new Date(data.parsedBackup.createdAt).toLocaleString()
    : null;

  return (
    <div className="step-card-inner-layout">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-7 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-150
          ${
            dragging
              ? "bg-green-50 border-green-300"
              : "bg-[#F3F4F5] border-gray-300"
          }`}
      >
        {/* Hidden */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.zip"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div className="h-full flex flex-col items-center justify-center gap-3">
          <div
            className={`p-4 ${
              dragging ? "bg-green-100" : "bg-[#003E680D]"
            } rounded-full`}
          >
            <Upload
              size={20}
              className={dragging ? "text-blue-600" : "text-[#003E68]"}
            />
          </div>

          <div className="font-semibold text-sm text-[#003E68]">
            {parsing
              ? "Parsing backup file"
              : data.parsedBackup
                ? "File loaded — click to replace"
                : "Drop file here or click to browse"}
          </div>

          <div className="text-xs text-[#94A3B8]">Supports .json, .zip</div>
        </div>
      </div>

      {/* Parse error */}
      {parseError && <AlertCard variant="red">{parseError}</AlertCard>}

      {/* Backup summary */}
      {data.parsedBackup && (
        <div className="overflow-hidden rounded-md border border-gray-300">
          <div className="px-4 py-2 text-sm font-medium">Backup Summary</div>

          <div className="grid grid-cols-4">
            {[
              {
                label: "File type",
                value: data.fileType === "zip" ? "Full ZIP" : "Selective JSON",
                icon:
                  data.fileType === "zip" ? (
                    <Archive size={16} />
                  ) : (
                    <FileJson size={16} />
                  ),
              },
              {
                label: "Organization",
                value: data.parsedBackup.sourceOrgName,
                icon: null,
              },
              { label: "Networks", value: String(networkCount), icon: null },
              { label: "Devices", value: String(deviceCount), icon: null },
            ].map((item, i) => (
              <div
                key={i}
                className={`px-5 py-[18px] ${
                  i < 3 ? "border-r border-[var(--color-border-subtle)]" : ""
                }`}
              >
                <div className="mb-1 flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                  {item.icon}
                  {item.label}
                </div>
                <div className="text-sm font-bold text-[var(--color-text-primary)]">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {createdAt && (
            <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-4 py-2 text-[11px] text-[var(--color-text-tertiary)]">
              Created: {createdAt}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
