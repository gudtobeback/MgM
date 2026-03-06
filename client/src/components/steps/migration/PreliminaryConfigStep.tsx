import React, { useState, useEffect, useRef } from "react";

import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import LogsCard from "../LogsCard";
import ProcedureCard from "../ProcedureCard";

import {
  getNetworkGroupPolicies,
  createNetworkGroupPolicy,
  getNetworkWirelessRfProfiles,
  createNetworkWirelessRfProfile,
  getNetworkSwitchAccessPolicies,
  createNetworkSwitchAccessPolicy,
  getThirdPartyVpnPeers,
  updateThirdPartyVpnPeers,
  getVpnFirewallRules,
  updateVpnFirewallRules,
  getOrganizationPolicyObjects,
} from "../../../services/merakiService";

import { MigrationData } from "../../../types/types";


interface PreliminaryConfigStepProps {
  data: MigrationData;
  onUpdate: (data: Partial<MigrationData>) => void;
  onComplete: () => void;
}

export function PreliminaryConfigStep({
  data,
  onComplete,
}: PreliminaryConfigStepProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const hasRun = useRef(false);

  const log = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const run = async () => {
    if (hasRun.current) return;
    hasRun.current = true;
    setIsRunning(true);

    const {
      sourceApiKey,
      sourceRegion,
      destinationApiKey,
      destinationRegion,
      sourceOrg,
      sourceNetwork,
      destinationOrg,
      destinationNetwork,
    } = data;

    if (
      !sourceOrg ||
      !sourceNetwork ||
      !destinationOrg ||
      !destinationNetwork
    ) {
      log("❌ Missing required data. Cannot run preliminary config transfer.");
      setError("Missing required selection data. Please restart the wizard.");
      setIsRunning(false);
      return;
    }

    log("--- Starting Preliminary Configuration Transfer ---");
    log(`Source: ${sourceOrg.name} / ${sourceNetwork.name}`);
    log(`Destination: ${destinationOrg.name} / ${destinationNetwork.name}\n`);

    // ─── Phase 1: Group Policies ───────────────────────────────────────────
    try {
      log("📋 Phase 1: Transferring Group Policies...");
      const policies = await getNetworkGroupPolicies(
        sourceApiKey,
        sourceRegion,
        sourceNetwork.id,
      );
      const transferable = policies.filter(
        (p: any) => p.name !== "Default policy",
      );
      log(
        `  Found ${policies.length} policies (${transferable.length} transferable, skipping "Default policy").`,
      );

      let created = 0;
      for (const policy of transferable) {
        const { groupPolicyId, ...body } = policy as any;
        try {
          await createNetworkGroupPolicy(
            destinationApiKey,
            destinationRegion,
            destinationNetwork.id,
            body,
          );
          log(`  ✅ Created group policy: "${policy.name}"`);
          created++;
        } catch (e: any) {
          log(
            `  ⚠️ Could not create group policy "${policy.name}": ${e.message}`,
          );
        }
      }
      log(
        `  Group Policies done: ${created}/${transferable.length} created.\n`,
      );
    } catch (e: any) {
      log(`  ⚠️ Could not fetch group policies: ${e.message}\n`);
    }

    // ─── Phase 2: Wireless RF Profiles ────────────────────────────────────
    try {
      log("📡 Phase 2: Transferring Wireless RF Profiles...");
      const profiles = await getNetworkWirelessRfProfiles(
        sourceApiKey,
        sourceRegion,
        sourceNetwork.id,
      );
      log(`  Found ${profiles.length} RF profile(s).`);

      let created = 0;
      for (const profile of profiles) {
        const { id, networkId, ...body } = profile as any;
        try {
          await createNetworkWirelessRfProfile(
            destinationApiKey,
            destinationRegion,
            destinationNetwork.id,
            body,
          );
          log(`  ✅ Created RF profile: "${profile.name}"`);
          created++;
        } catch (e: any) {
          log(
            `  ⚠️ Could not create RF profile "${profile.name}": ${e.message}`,
          );
        }
      }
      log(`  RF Profiles done: ${created}/${profiles.length} created.\n`);
    } catch (e: any) {
      log(`  ⚠️ Could not fetch RF profiles: ${e.message}\n`);
    }

    // ─── Phase 3: Switch Access Policies (802.1X / RADIUS) ────────────────
    try {
      log("🔐 Phase 3: Transferring Switch Access Policies (RADIUS/802.1X)...");
      const accessPolicies = await getNetworkSwitchAccessPolicies(
        sourceApiKey,
        sourceRegion,
        sourceNetwork.id,
      );
      log(`  Found ${accessPolicies.length} access policy/policies.`);

      let created = 0;
      for (const policy of accessPolicies) {
        const { accessPolicyNumber, ...body } = policy as any;
        try {
          await createNetworkSwitchAccessPolicy(
            destinationApiKey,
            destinationRegion,
            destinationNetwork.id,
            body,
          );
          log(`  ✅ Created access policy: "${policy.name}"`);
          created++;
        } catch (e: any) {
          log(
            `  ⚠️ Could not create access policy "${policy.name}": ${e.message}`,
          );
        }
      }
      log(
        `  Switch Access Policies done: ${created}/${accessPolicies.length} created.\n`,
      );
    } catch (e: any) {
      log(`  ⚠️ Could not fetch switch access policies: ${e.message}\n`);
    }

    // ─── Phase 4: Third-Party VPN Peers ───────────────────────────────────
    try {
      log("🔗 Phase 4: Transferring Third-Party VPN Peers...");
      const vpnPeers = await getThirdPartyVpnPeers(
        sourceApiKey,
        sourceRegion,
        sourceOrg.id,
      );
      if (vpnPeers.length === 0) {
        log("  No third-party VPN peers configured. Skipping.\n");
      } else {
        log(
          `  Found ${vpnPeers.length} VPN peer(s). Applying to destination organization...`,
        );
        await updateThirdPartyVpnPeers(
          destinationApiKey,
          destinationRegion,
          destinationOrg.id,
          { peers: vpnPeers },
        );
        log(`  ✅ VPN peers applied to destination organization.\n`);
      }
    } catch (e: any) {
      log(`  ⚠️ Could not transfer VPN peers: ${e.message}\n`);
    }

    // ─── Phase 5: VPN Firewall Rules ──────────────────────────────────────
    try {
      log("🛡️ Phase 5: Transferring VPN Firewall Rules...");
      const fwData = await getVpnFirewallRules(
        sourceApiKey,
        sourceRegion,
        sourceOrg.id,
      );
      const rules = fwData.rules ?? fwData;
      if (!rules || rules.length === 0) {
        log("  No VPN firewall rules configured. Skipping.\n");
      } else {
        log(
          `  Found ${rules.length} firewall rule(s). Applying to destination organization...`,
        );
        await updateVpnFirewallRules(
          destinationApiKey,
          destinationRegion,
          destinationOrg.id,
          { rules },
        );
        log(`  ✅ VPN firewall rules applied to destination organization.\n`);
      }
    } catch (e: any) {
      log(`  ⚠️ Could not transfer VPN firewall rules: ${e.message}\n`);
    }

    // ─── Phase 6: Policy Objects (read-only reference) ────────────────────
    try {
      log("📌 Phase 6: Checking Policy Objects...");
      const policyObjects = await getOrganizationPolicyObjects(
        sourceApiKey,
        sourceRegion,
        sourceOrg.id,
      );
      if (policyObjects.length === 0) {
        log("  No policy objects found. Skipping.\n");
      } else {
        log(
          `  ℹ️ Found ${policyObjects.length} policy object(s) in source organization.`,
        );
        log(
          "  Policy objects cannot be transferred automatically via the Meraki API.",
        );
        log(
          "  → Manual action required: recreate these policy objects in the destination dashboard.\n",
        );
      }
    } catch (e: any) {
      log(`  ⚠️ Could not check policy objects: ${e.message}\n`);
    }

    log("--- ✅ Preliminary configuration transfer complete! ---");
    log("Proceeding to device migration...");
    setIsComplete(true);
    setIsRunning(false);
    setTimeout(() => onComplete(), 2000);
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <div className="step-card-inner-layout">
      <ProcedureCard
        icon={
          isRunning ? (
            <Loader2 size={30} className="animate-spin text-[#049FD9]" />
          ) : isComplete ? (
            <CheckCircle2 size={30} className="text-green-500" />
          ) : (
            error && <XCircle size={30} className="text-red-500" />
          )
        }
        heading={
          isRunning
            ? "Transferring Foundational Configs"
            : isComplete
              ? "Pre-Config Transfer Complete"
              : error && "Pre-Config Transfer Failed"
        }
      />

      {/* Logs */}
      <LogsCard logName="Live Pre-Config Log">
        {logs.map((entry, index) => (
          <div key={index} className="whitespace-pre-wrap leading-relaxed">
            {entry}
          </div>
        ))}
        {error && (
          <div className="text-red-600 mt-2 font-semibold">{error}</div>
        )}
      </LogsCard>
    </div>
  );
}
