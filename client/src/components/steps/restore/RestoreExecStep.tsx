import React, { useEffect, useRef } from "react";

import { Loader2 } from "lucide-react";

import LogsCard from "../LogsCard";
import StepHeadingCard from "../StepHeadingCard";

import { RestoreData } from "../../../types/types";

import {
  restoreOrganizationConfiguration,
  restoreNetworkConfiguration,
  restoreDeviceConfiguration,
} from "../../../services/merakiService";

interface RestoreExecStepProps {
  data: RestoreData;
  onUpdate: (patch: Partial<RestoreData>) => void;
  onComplete: () => void;
}

export function RestoreExecStep({
  data,
  onUpdate,
  onComplete,
}: RestoreExecStepProps) {
  const hasRun = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  const scrollLog = () => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      const log: string[] = [];
      let restored = 0;
      let failed = 0;

      const backup = data.parsedBackup!;
      const cats = data.restoreCategories;
      const apiKey = data.destinationApiKey;
      const region = data.destinationRegion;
      const orgId = data.destinationOrg!.id;
      const networkId = data.destinationNetwork!.id;
      const networkName = data.destinationNetwork!.name;
      const srcNetCfg = backup.networkConfigs[data.selectedNetworkId] ?? {};

      const addLog = (msg: string) => {
        log.push(msg);
        onUpdate({ results: { log: [...log], restored, failed } });
        scrollLog();
      };

      addLog("Starting restore…");
      addLog(`Target organization: ${data.destinationOrg!.name} (${orgId})`);
      addLog(`Target network: ${networkName} (${networkId})`);
      addLog(`Source: ${backup.sourceOrgName}`);
      addLog("");

      // ── Organization restore ──────────────────────────────────────────────────
      if (
        backup.organizationConfig &&
        Object.keys(backup.organizationConfig).length > 0
      ) {
        addLog("── Organization Configuration ──");
        const count = await restoreOrganizationConfiguration(
          apiKey,
          region,
          orgId,
          backup.organizationConfig,
          cats,
          addLog,
        );
        restored += count;
        addLog("");
      }

      // ── Network restore ───────────────────────────────────────────────────────
      if (srcNetCfg && Object.keys(srcNetCfg).length > 0) {
        addLog("── Network Configuration ──");
        const count = await restoreNetworkConfiguration(
          apiKey,
          region,
          networkId,
          srcNetCfg,
          cats,
          addLog,
        );
        restored += count;
        addLog("");
      }

      // ── Device restore ────────────────────────────────────────────────────────
      if (backup.devices.length > 0) {
        addLog("── Device Configuration ──");
        addLog(`Found ${backup.devices.length} device(s) in backup`);

        for (const device of backup.devices) {
          addLog(`\nDevice: ${device.serial}`);
          const ok = await restoreDeviceConfiguration(
            apiKey,
            region,
            device.serial,
            device.config,
            cats,
            addLog,
          );
          if (ok) restored++;
          else failed++;
        }
        addLog("");
      }

      // ── Summary ───────────────────────────────────────────────────────────────
      addLog("── Complete ──");
      addLog(`Categories / operations restored: ${restored}`);
      if (failed > 0) addLog(`Failures: ${failed}`);

      onUpdate({ results: { log: [...log], restored, failed } });
      scrollLog();

      setTimeout(onComplete, 2000);
    };

    run().catch((err) => {
      console.error("RestoreExecStep error:", err);
    });
  }, []);

  const log = data.results?.log ?? [];

  return (
    <div className="step-card-layout">
      {/* Heading */}
      <StepHeadingCard
        icon={<Loader2 size={30} className="animate-spin text-[#049FD9]" />}
        heading="Restoring Configuration"
        subHeading={`Pushing selected categories to ${data.destinationNetwork?.name ?? "the target network"}…`}
      />

      <div className="step-card-inner-layout">
        {/* Logs */}
        <LogsCard logName="Live Restore Log">
          {log.map((line, i) => (
            <div
              key={i}
              className={`${
                line.startsWith("✅")
                  ? "text-green-400"
                  : line.includes("❌")
                    ? "text-red-400"
                    : line.startsWith("⚠️") || line.includes("⏩")
                      ? "text-yellow-400"
                      : line.startsWith("──")
                        ? "text-slate-400"
                        : "text-slate-200"
              }`}
            >
              {line || <br />}
            </div>
          ))}
          {log.length === 0 && (
            <div className="text-[#64748b]">Initializing…</div>
          )}
        </LogsCard>
      </div>
    </div>
  );
}
