import React, { useEffect, useRef, useState } from "react";
import { Loader2, PauseCircle, CheckCircle2 } from "lucide-react";

import LogsCard from "../LogsCard";
import StepHeadingCard from "../StepHeadingCard";

import {
  getSwitchPorts,
  updateSwitchPort,
  createNetworkSwitchAccessPolicy,
  updateNetworkSwitchAccessControlLists,
} from "../../../services/merakiService";
import { extractPortNumber } from "../../../services/cat9kParser";

import { Cat9KData } from "../../../types/types";
import ProcedureCard from "../ProcedureCard";

interface ApplyStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
  onComplete: () => void;
  onResume: () => void;
}

// Small delay helper to avoid hammering the API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ApplyStep({
  data,
  onUpdate,
  onComplete,
  onResume,
}: ApplyStepProps) {
  const hasRun = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);
  const [running, setRunning] = useState(true);

  const scrollLog = () => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      // Preserve previous log and counters so resume accumulates
      const log: string[] = [...(data.results?.log ?? [])];
      let portsPushed = data.results?.portsPushed ?? 0;
      let portsFailed = data.results?.portsFailed ?? 0;
      let policiesCreated = data.results?.policiesCreated ?? 0;
      let aclRulesPushed = data.results?.aclRulesPushed ?? 0;

      // Mutable local copy of completed ports (avoids stale closure on data)
      const appliedPorts: string[] = [...(data.appliedPorts ?? [])];

      const parsed = data.parsedConfig!;
      const apiKey = data.destinationApiKey;
      const region = data.destinationRegion;
      const networkId = data.destinationNetwork!.id;

      const addLog = (msg: string) => {
        log.push(msg);
        onUpdate({
          results: {
            portsPushed,
            portsFailed,
            policiesCreated,
            aclRulesPushed,
            log: [...log],
          },
        });
        scrollLog();
      };

      // Resume divider
      if (log.length > 0) {
        addLog("");
        addLog("── Resuming Migration ──");
        addLog("");
      } else {
        addLog("Starting Cat9K → Meraki configuration push…");
        addLog(`Target network: ${data.destinationNetwork!.name}`);
        addLog("");
      }

      // Determine which devices to target — prefer the specifically claimed devices
      const targetDevices =
        data.claimedDevices.length > 0
          ? data.claimedDevices
          : data.destinationDevices
              .filter(
                (d) =>
                  d.model?.startsWith("C93") ||
                  d.model?.startsWith("C9300") ||
                  d.model?.startsWith("C9K"),
              )
              .map((d) => ({
                cloudId: d.serial,
                serial: d.serial,
                name: d.name ?? d.serial,
                model: d.model ?? "",
              }));

      // ── Switch ports ──────────────────────────────────────────────────────
      if (data.applyPorts && parsed.interfaces.length > 0) {
        addLog("── Switch Port Configuration ──");

        if (targetDevices.length === 0) {
          addLog(
            "⚠️  No claimed Cat9K devices found. Skipping port configuration.",
          );
        } else {
          for (const device of targetDevices) {
            addLog(
              `\nDevice: ${device.name} (${device.model || "Cat9K"}) — ${device.serial}`,
            );
            let existingPorts: any[] = [];
            try {
              existingPorts = await getSwitchPorts(
                apiKey,
                region,
                device.serial,
              );
            } catch (err) {
              addLog(
                `  ⚠️  Could not fetch ports for ${device.serial}: ${(err as any).message}`,
              );
              continue;
            }

            for (const iface of parsed.interfaces) {
              if (iface.mode === "unknown") continue;

              const portNumber = extractPortNumber(iface.name);
              const portKey = `${device.serial}:${portNumber}`;

              // Skip ports already applied in a previous run
              if (appliedPorts.includes(portKey)) {
                addLog(`  ↩ Skipped (already applied): ${iface.shortName}`);
                continue;
              }

              const merakiPort = existingPorts.find(
                (p) => String(p.portId) === portNumber,
              );
              if (!merakiPort) {
                addLog(
                  `  ⚠️  Port ${iface.shortName} (${portNumber}) not found on ${device.serial}`,
                );
                portsFailed++;
                continue;
              }

              const portBody: Record<string, any> = {
                name: iface.description || iface.shortName,
                type: iface.mode,
                poeEnabled: true,
              };

              if (iface.mode === "access") {
                portBody.vlan = iface.accessVlan ?? 1;
              } else if (iface.mode === "trunk") {
                portBody.allowedVlans = iface.trunkAllowedVlans ?? "all";
                if (iface.nativeVlan != null) portBody.vlan = iface.nativeVlan;
              }

              try {
                await updateSwitchPort(
                  apiKey,
                  region,
                  device.serial,
                  portNumber,
                  portBody,
                );
                addLog(
                  `  ✅ ${iface.shortName} → ${iface.mode}${iface.mode === "access" ? ` VLAN ${portBody.vlan}` : ` (${portBody.allowedVlans})`}`,
                );
                portsPushed++;
                appliedPorts.push(portKey);
              } catch (err) {
                addLog(
                  `  ⚠️  ${iface.shortName}: ${(err as any).message ?? "update failed"}`,
                );
                portsFailed++;
              }

              await delay(120);

              // Check stop flag between each port push
              if (stopRef.current) {
                addLog("");
                addLog(
                  "🛑 Migration paused — click Resume to continue from here.",
                );
                onUpdate({
                  wasStopped: true,
                  appliedPorts: [...appliedPorts],
                  results: {
                    portsPushed,
                    portsFailed,
                    policiesCreated,
                    aclRulesPushed,
                    log: [...log],
                  },
                });
                setRunning(false);
                return;
              }
            }
          }
        }
        addLog("");
      }

      // ── RADIUS access policy ──────────────────────────────────────────────
      if (
        !data.radiusApplied &&
        data.applyRadius &&
        parsed.radiusServers.length > 0
      ) {
        addLog("── RADIUS / 802.1X Access Policy ──");
        const radiusServersPayload = parsed.radiusServers.map((srv) => ({
          host: srv.ip,
          port: srv.authPort,
          secret: srv.key || "changeme",
        }));

        const policyBody = {
          name: "Cat9K-RADIUS-Policy",
          radius: { servers: radiusServersPayload },
          dot1x: { controlDirection: "inbound" },
          radiusTestingEnabled: false,
          radiusGroupAttribute: "11",
          voiceVlanClients: true,
          accessPolicyType: "Dot1x",
        };

        try {
          await createNetworkSwitchAccessPolicy(
            apiKey,
            region,
            networkId,
            policyBody,
          );
          addLog(
            `✅ Created RADIUS access policy with ${radiusServersPayload.length} server(s)`,
          );
          policiesCreated++;
          onUpdate({ radiusApplied: true });
        } catch (err) {
          addLog(
            `⚠️  RADIUS policy creation failed: ${(err as any).message ?? "unknown error"}`,
          );
        }
        addLog("");
      } else if (data.radiusApplied) {
        addLog(
          "── RADIUS / 802.1X Access Policy ── (skipped — already applied)",
        );
        addLog("");
      }

      // ── ACL rules ─────────────────────────────────────────────────────────
      if (!data.aclsApplied && data.applyAcls && parsed.acls.length > 0) {
        addLog("── ACL Rules ──");
        const merakiRules: any[] = [];

        for (const acl of parsed.acls) {
          addLog(`Processing ACL: ${acl.name} (${acl.rules.length} rules)`);
          for (const rule of acl.rules) {
            let protocol: string = "any";
            if (/^tcp$/i.test(rule.protocol)) protocol = "tcp";
            else if (/^udp$/i.test(rule.protocol)) protocol = "udp";
            else if (/^icmp$/i.test(rule.protocol)) protocol = "icmp";
            else if (/^ip$/i.test(rule.protocol) || rule.protocol === "any")
              protocol = "any";

            const merakiRule: any = {
              policy: rule.action === "permit" ? "allow" : "deny",
              protocol,
              srcCidr: rule.srcCidr,
              dstCidr: rule.dstCidr,
            };
            if (rule.srcPort) merakiRule.srcPort = rule.srcPort;
            if (rule.dstPort) merakiRule.dstPort = rule.dstPort;
            if (rule.comment) merakiRule.comment = rule.comment;
            merakiRules.push(merakiRule);
          }
        }

        merakiRules.push({
          policy: "allow",
          protocol: "any",
          srcCidr: "any",
          dstCidr: "any",
          comment: "Default allow all",
        });

        try {
          await updateNetworkSwitchAccessControlLists(
            apiKey,
            region,
            networkId,
            { rules: merakiRules },
          );
          addLog(
            `✅ Pushed ${merakiRules.length - 1} ACL rule(s) + default allow-all`,
          );
          aclRulesPushed = merakiRules.length - 1;
          onUpdate({ aclsApplied: true });
        } catch (err) {
          addLog(
            `⚠️  ACL push failed: ${(err as any).message ?? "unknown error"}`,
          );
        }
        addLog("");
      } else if (data.aclsApplied) {
        addLog("── ACL Rules ── (skipped — already applied)");
        addLog("");
      }

      addLog("");
      addLog("── Complete ──");
      addLog(
        `Ports pushed: ${portsPushed}  |  Ports skipped/failed: ${portsFailed}`,
      );
      addLog(`RADIUS policies created: ${policiesCreated}`);
      addLog(`ACL rules pushed: ${aclRulesPushed}`);

      onUpdate({
        wasStopped: false,
        appliedPorts: [...appliedPorts],
        results: {
          portsPushed,
          portsFailed,
          policiesCreated,
          aclRulesPushed,
          log: [...log],
        },
      });
      setRunning(false);
      setTimeout(onComplete, 2000);
    };

    run().catch((err) => {
      console.error("ApplyStep error:", err);
    });
  }, []);

  const log = data.results?.log ?? [];
  const isPaused = !running && data.wasStopped;
  const isDone = !running && !data.wasStopped;

  return (
    <div className="flex flex-col gap-6">
      <ProcedureCard
        icon={
          running ? (
            <Loader2 size={30} className="text-[#049FD9] animate-spin" />
          ) : isPaused ? (
            <PauseCircle size={30} className="text-amber-500" />
          ) : (
            isDone && <CheckCircle2 size={30} className="text-green-600" />
          )
        }
        heading={
          running
            ? "Applying Configuration"
            : isPaused
              ? "Migration Paused"
              : isDone && "Configuration Applied"
        }
        subHeading={
          running
            ? "Pushing switch port configurations, RADIUS policies, and ACL rules…"
            : isPaused
              ? "The migration was paused. Resume to continue from the last checkpoint."
              : isDone &&
                "All configuration has been pushed to the claimed Catalyst 9K device(s)."
        }
      />

      {/* Logs */}
      <LogsCard logName="Live Log">
        {log.map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith("✅")
                ? "text-green-400"
                : line.startsWith("⚠️") || line.startsWith("🛑")
                  ? "text-yellow-400"
                  : line.startsWith("──")
                    ? "text-slate-400"
                    : line.startsWith("  ↩")
                      ? "text-slate-500"
                      : "text-slate-200"
            }
          >
            {line || <br />}
          </div>
        ))}
      </LogsCard>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2.5">
        {/* Stop button — only while running */}
        {running && (
          <button
            onClick={() => {
              stopRef.current = true;
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-md border border-amber-500 bg-amber-50 text-amber-800 hover:bg-amber-100"
          >
            <PauseCircle size={14} />
            Stop After Current
          </button>
        )}

        {/* Paused state buttons */}
        {isPaused && (
          <>
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 px-5 py-2 text-[13px] font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              <Loader2 size={14} className="animate-spin" />
              Resume Migration
            </button>

            <button
              onClick={onComplete}
              className="px-4 py-2 text-[13px] font-semibold rounded-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              View Results So Far
            </button>
          </>
        )}
      </div>
    </div>
  );
}
