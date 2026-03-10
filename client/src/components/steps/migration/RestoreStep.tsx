import React, { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import LogsCard from "../LogsCard";
import StepHeadingCard from "../StepHeadingCard";

import {
  restoreDeviceConfiguration,
  restoreNetworkConfiguration,
} from "../../../services/merakiService";

import {
  NetworkConfigBackup,
  RestoreCategories,
  MigrationData,
} from "../../../types/types";
import { formatLogDuration } from "@/src/utilities/formatLogDuration";
import ProcedureCard from "../ProcedureCard";

// Default categories: restore everything in migration flow
const ALL_CATEGORIES: RestoreCategories = {
  orgDetails: true,
  orgAdmins: true,
  orgPolicyObjects: true,
  orgPolicyObjectGroups: true,
  orgSnmp: true,
  orgVpnFirewallRules: true,
  orgThirdPartyVpn: true,
  orgAlertProfiles: true,
  orgBrandingPolicies: true,
  orgBrandingPoliciesPriorities: true,
  orgConfigTemplates: true,
  orgLoginSecurity: true,
  orgSamlRoles: true,
  orgApplianceSecurityIntrusion: true,
  orgWebhooks: true,
  vlans: true,
  applianceFirewallL3: true,
  applianceFirewallL7: true,
  cellularFirewallRules: true,
  inboundFirewallRules: true,
  oneToManyNat: true,
  oneToOneNat: true,
  portForwardingRules: true,
  applianceStaticRoutes: true,
  contentFiltering: true,
  applianceSecurity: true,
  trafficShaping: true,
  trafficShapingGeneral: true,
  customPerformanceClasses: true,
  applianceSettings: true,
  applianceConnectivityMonitoring: true,
  applianceUplinksSettings: true,
  siteToSiteVpn: true,
  bgpSettings: true,
  switchPorts: true,
  switchRoutingInterfaces: true,
  switchAcls: true,
  switchAccessPolicies: true,
  switchSettings: true,
  networkStp: true,
  portSchedules: true,
  qosRules: true,
  dhcpServerPolicy: true,
  stormControl: true,
  switchMtu: true,
  switchOspf: true,
  switchLinkAggregations: true,
  ssids: true,
  ssidFirewallRules: true,
  ssidTrafficShaping: true,
  ssidBonjourForwarding: true,
  ssidDeviceTypeGroupPolicies: true,
  ssidHotspot20: true,
  ssidIdentityPsks: true,
  ssidSchedules: true,
  ssidSplashSettings: true,
  ssidVpnSettings: true,
  wirelessRfProfiles: true,
  bluetoothSettings: true,
  wirelessSettings: true,
  alternateManagementInterface: true,
  wirelessBilling: true,
  networkDetails: true,
  groupPolicies: true,
  syslogServers: true,
  networkSnmp: true,
  networkAlerts: true,
  networkSettings: true,
  floorPlans: true,
  netflowSettings: true,
  trafficAnalysis: true,
  vlanProfiles: true,
  networkWebhooks: true,
  managementInterface: true,
  wirelessRadioSettings: true,
  deviceSwitchOspf: true,
  deviceSwitchStp: true,
  deviceApplianceUplink: true,
  deviceApplianceDhcpSubnets: true,
};

interface RestoreStepProps {
  data: MigrationData;
  onUpdate: (data: Partial<MigrationData>) => void;
  onComplete: () => void;
  logStartTime: any;
  setLogDuration: any;
}

export function RestoreStep({
  data,
  onComplete,
  onUpdate,
  logStartTime,
  setLogDuration,
}: RestoreStepProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const hasRun = useRef(false);

  const log = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startRestore = async () => {
    if (hasRun.current) return;
    hasRun.current = true;
    setIsRestoring(true);

    const {
      destinationApiKey,
      destinationRegion,
      destinationNetwork,
      migrationSuccess,
      restoreData,
    } = data;

    if (!restoreData || migrationSuccess.length === 0) {
      log(
        "⏩ No devices were successfully migrated or no restore data is available. Skipping restore step.",
      );
      setIsComplete(true);
      setTimeout(() => onComplete(), 2000);
      return;
    }

    log("--- Starting Post-Migration Configuration Restore ---");
    let deviceSuccessCount = 0;
    let networkSuccessCount = 0;

    try {
      // Phase 1: Restore Device-Specific Configurations
      log(
        `\nFound ${migrationSuccess.length} devices to restore configuration for...`,
      );
      for (const migratedDevice of migrationSuccess) {
        const backupedDevice = restoreData.devices.find(
          (d) => d.serial === migratedDevice.serial,
        );
        if (backupedDevice) {
          log(
            `- Restoring configuration for ${migratedDevice.name} (${migratedDevice.serial})...`,
          );
          const success = await restoreDeviceConfiguration(
            destinationApiKey,
            destinationRegion,
            migratedDevice.serial,
            backupedDevice.config,
            ALL_CATEGORIES,
            log,
          );
          if (success) deviceSuccessCount++;
        } else {
          log(
            `- ⚠️ Could not find backup data for device ${migratedDevice.serial}.`,
          );
        }
      }

      // Phase 2: Restore Network-Level Configurations
      log(
        `\nPreparing to restore network-level configurations to "${destinationNetwork!.name}"...`,
      );
      const uniqueSourceNetworkIds = [
        ...new Set(migrationSuccess.map((d) => d.networkId).filter(Boolean)),
      ];
      log(
        `Found ${uniqueSourceNetworkIds.length} unique source networks to restore settings from.`,
      );

      for (const netId of uniqueSourceNetworkIds) {
        const networkConfig = restoreData.networkConfigs[netId as string] as
          | NetworkConfigBackup
          | undefined;
        if (networkConfig) {
          log(`- Restoring configurations from source network ${netId}...`);
          const restoredCount = await restoreNetworkConfiguration(
            destinationApiKey,
            destinationRegion,
            destinationNetwork!.id,
            networkConfig,
            ALL_CATEGORIES,
            log,
          );
          networkSuccessCount += restoredCount;
        } else {
          log(
            `- ⚠️ Could not find backup configuration for source network ${netId}.`,
          );
        }
      }

      setIsComplete(true);

      const endTime = Date.now(); // ⬅️ END TIMER
      const durationMs = endTime - logStartTime;

      const formattedDuration = formatLogDuration(durationMs);

      setLogDuration(durationMs);

      log(`--- ⏱ Backup completed in ${formattedDuration} ---`);

      log("\n--- ✅ Restore phase complete! ---");
      onUpdate({
        restoreDeviceSuccessCount: deviceSuccessCount,
        restoreNetworkSuccessCount: networkSuccessCount,
      });
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      const errorMessage =
        "A critical error occurred during restore: " +
        (err.message || "Unknown error");
      setError(errorMessage);
      log(`--- ❌ ${errorMessage} ---`);
      console.error("Restore error:", err);
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    startRestore();
  }, []);

  return (
    <div className="step-card-inner-layout">
      <ProcedureCard
        icon={
          isRestoring ? (
            <Loader2 size={30} className="animate-spin text-[#049FD9]" />
          ) : isComplete ? (
            <CheckCircle2 size={30} className="text-green-500" />
          ) : (
            error && <XCircle size={30} className="text-red-500" />
          )
        }
        heading={
          isRestoring
            ? "Restoring Configurations"
            : isComplete
              ? "Restore Phase Complete"
              : error && "Restoration Failed"
        }
      />

      {/* Logs */}
      <LogsCard logName="Live Restore Log">
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap leading-relaxed">
            {log}
          </div>
        ))}
        {error && (
          <div className="text-red-600 mt-2 font-semibold">{error}</div>
        )}
      </LogsCard>
    </div>
  );
}
