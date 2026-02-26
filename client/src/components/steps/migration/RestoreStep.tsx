import React, { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  restoreDeviceConfiguration,
  restoreNetworkConfiguration,
} from "../../../services/merakiService";
import { MigrationData } from "../../../pages/private/migration/MigrationWizard";
import { NetworkConfigBackup, RestoreCategories } from "../../../types/types";

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
}

export function RestoreStep({ data, onComplete, onUpdate }: RestoreStepProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const hasRun = useRef(false);

  const log = (msg: string) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  };

  useEffect(() => {
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

    startRestore();
  }, []);

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[16px]">
            {isComplete ? "Restore Phase Complete" : "Restoring Configurations"}
          </p>

          {isComplete && !error && (
            <CheckCircle2 size={24} className="text-green-500" />
          )}
          {isComplete && error && (
            <XCircle size={24} className="text-red-500" />
          )}
          {isRestoring && (
            <Loader2 size={24} className="animate-spin text-[#2563eb]" />
          )}
        </div>

        <p className="text-[12px] text-[#232C32]">
          Automatically applying backed-up settings to your newly migrated
          devices.
        </p>
      </div>

      {/* Logs */}
      <div className="flex flex-col gap-3 p-6">
        <p className="text-sm text-[#333232]">Live Restore Log</p>

        <div className="h-80 p-4 font-mono text-sm text-[#D5D5D5] bg-black border border-[#B3B3B3] rounded-md overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap leading-relaxed">
              {log}
            </div>
          ))}
          {error && (
            <div className="text-red-600 mt-2 font-semibold">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
