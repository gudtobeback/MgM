import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { RestoreData } from "../../../pages/private/backup_and_recovery/RestoreWizard";
import { RestoreCategories } from "../../../types/types";

interface SelectStepProps {
  data: RestoreData;
  onUpdate: (patch: Partial<RestoreData>) => void;
}

type CategoryGroup = {
  id: string;
  title: string;
  categories: Array<{
    key: keyof RestoreCategories;
    label: string;
    description: string;
  }>;
};

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "organization",
    title: "Organization",
    categories: [
      {
        key: "orgDetails",
        label: "Organization Details",
        description: "Basic organization metadata and settings",
      },
      {
        key: "orgAdmins",
        label: "Admins",
        description: "Organization administrators",
      },
      {
        key: "orgPolicyObjects",
        label: "Policy Objects",
        description: "Network policy objects (IP groups, ports)",
      },
      {
        key: "orgPolicyObjectGroups",
        label: "Policy Object Groups",
        description: "Grouped policy objects",
      },
      {
        key: "orgSnmp",
        label: "SNMP Settings",
        description: "Organization-level SNMP configuration",
      },
      {
        key: "orgVpnFirewallRules",
        label: "VPN Firewall Rules",
        description: "Organization VPN firewall rules",
      },
      {
        key: "orgThirdPartyVpn",
        label: "Third-Party VPN Peers",
        description: "IPsec VPN peer configurations",
      },
      {
        key: "orgAlertProfiles",
        label: "Alert Profiles",
        description: "Custom alert profile configurations",
      },
      {
        key: "orgBrandingPolicies",
        label: "Branding Policies",
        description: "Custom branding and splash pages",
      },
      {
        key: "orgBrandingPoliciesPriorities",
        label: "Branding Policy Priorities",
        description: "Priority order for branding policies",
      },
      {
        key: "orgConfigTemplates",
        label: "Config Templates",
        description: "Network configuration templates",
      },
      {
        key: "orgLoginSecurity",
        label: "Login Security",
        description: "API/portal login security settings",
      },
      {
        key: "orgSamlRoles",
        label: "SAML Roles",
        description: "SAML SSO role mappings",
      },
      {
        key: "orgApplianceSecurityIntrusion",
        label: "Appliance Security Intrusion (Org)",
        description: "Organization-level intrusion detection settings",
      },
      {
        key: "orgWebhooks",
        label: "Webhook HTTP Servers",
        description: "Organization-level webhook endpoints",
      },
    ],
  },
  {
    id: "appliance",
    title: "Appliance (MX)",
    categories: [
      {
        key: "vlans",
        label: "VLANs",
        description: "Appliance VLAN definitions",
      },
      {
        key: "applianceFirewallL3",
        label: "L3 Firewall Rules",
        description: "Layer 3 firewall rules",
      },
      {
        key: "applianceFirewallL7",
        label: "L7 Firewall Rules",
        description: "Layer 7 application firewall rules",
      },
      {
        key: "cellularFirewallRules",
        label: "Cellular Firewall Rules",
        description: "Firewall rules for cellular WAN",
      },
      {
        key: "inboundFirewallRules",
        label: "Inbound Firewall Rules",
        description: "Inbound NAT firewall rules",
      },
      {
        key: "oneToManyNat",
        label: "One-to-Many NAT Rules",
        description: "Port address translation (PAT) rules",
      },
      {
        key: "oneToOneNat",
        label: "One-to-One NAT Rules",
        description: "Static NAT mappings",
      },
      {
        key: "portForwardingRules",
        label: "Port Forwarding Rules",
        description: "Inbound port forwarding rules",
      },
      {
        key: "applianceStaticRoutes",
        label: "Static Routes",
        description: "Appliance static routing table",
      },
      {
        key: "contentFiltering",
        label: "Content Filtering",
        description: "Web content filtering policies",
      },
      {
        key: "applianceSecurity",
        label: "Security (IDS/IPS + Malware)",
        description: "Intrusion detection/prevention and anti-malware",
      },
      {
        key: "trafficShaping",
        label: "Traffic Shaping Rules + Uplink Selection",
        description: "QoS traffic shaping rules and WAN uplink policies",
      },
      {
        key: "trafficShapingGeneral",
        label: "Traffic Shaping General Settings",
        description: "Global traffic shaping configuration",
      },
      {
        key: "customPerformanceClasses",
        label: "Custom Performance Classes",
        description: "SD-WAN custom performance classes",
      },
      {
        key: "applianceSettings",
        label: "Appliance Settings",
        description: "MX appliance general settings",
      },
      {
        key: "applianceConnectivityMonitoring",
        label: "Connectivity Monitoring",
        description: "Uplink connectivity monitoring destinations",
      },
      {
        key: "applianceUplinksSettings",
        label: "Uplinks Settings",
        description: "WAN uplink configuration",
      },
      {
        key: "siteToSiteVpn",
        label: "Site-to-Site VPN",
        description: "Auto VPN hub/spoke configuration",
      },
      {
        key: "bgpSettings",
        label: "BGP Settings",
        description: "BGP routing protocol configuration",
      },
    ],
  },
  {
    id: "switch",
    title: "Switch (MS)",
    categories: [
      {
        key: "switchPorts",
        label: "Switch Ports",
        description: "Per-device switch port settings",
      },
      {
        key: "switchRoutingInterfaces",
        label: "Routing Interfaces (SVIs)",
        description: "Layer 3 switch virtual interfaces and static routes",
      },
      {
        key: "switchAcls",
        label: "Access Control Lists",
        description: "Switch ACLs",
      },
      {
        key: "switchAccessPolicies",
        label: "Access Policies",
        description: "802.1X and MAC-based access policies",
      },
      {
        key: "switchSettings",
        label: "Switch Settings",
        description: "Network-level switch settings",
      },
      {
        key: "networkStp",
        label: "STP Settings",
        description: "Spanning Tree Protocol configuration",
      },
      {
        key: "portSchedules",
        label: "Port Schedules",
        description: "Port on/off schedules",
      },
      {
        key: "qosRules",
        label: "QoS Rules",
        description: "Quality of Service prioritization rules",
      },
      {
        key: "dhcpServerPolicy",
        label: "DHCP Server Policy",
        description: "DHCP server configuration",
      },
      {
        key: "stormControl",
        label: "Storm Control",
        description: "Broadcast/multicast storm control",
      },
      {
        key: "switchMtu",
        label: "MTU Settings",
        description: "Maximum transmission unit",
      },
      {
        key: "switchOspf",
        label: "OSPF Settings (Network)",
        description: "Network-level OSPF routing protocol configuration",
      },
      {
        key: "switchLinkAggregations",
        label: "Link Aggregations (LAG)",
        description: "Port channel / LACP configurations",
      },
    ],
  },
  {
    id: "wireless",
    title: "Wireless (MR)",
    categories: [
      {
        key: "ssids",
        label: "SSIDs (Base Config)",
        description: "Wireless SSID base configurations",
      },
      {
        key: "ssidFirewallRules",
        label: "SSID Firewall Rules (L3 + L7)",
        description: "Per-SSID firewall rules",
      },
      {
        key: "ssidTrafficShaping",
        label: "SSID Traffic Shaping",
        description: "Per-SSID bandwidth limits and QoS",
      },
      {
        key: "ssidBonjourForwarding",
        label: "SSID Bonjour Forwarding",
        description: "Per-SSID Bonjour/mDNS forwarding rules",
      },
      {
        key: "ssidDeviceTypeGroupPolicies",
        label: "SSID Device Type Group Policies",
        description: "Per-device-type group policy assignments",
      },
      {
        key: "ssidHotspot20",
        label: "SSID Hotspot 2.0",
        description: "Passpoint / Hotspot 2.0 configuration",
      },
      {
        key: "ssidIdentityPsks",
        label: "SSID Identity PSKs",
        description: "Per-user pre-shared keys",
      },
      {
        key: "ssidSchedules",
        label: "SSID Schedules",
        description: "Time-based SSID availability",
      },
      {
        key: "ssidSplashSettings",
        label: "SSID Splash Settings",
        description: "Captive portal / splash page settings",
      },
      {
        key: "ssidVpnSettings",
        label: "SSID VPN Settings",
        description: "Per-SSID VPN concentrator configuration",
      },
      {
        key: "wirelessRfProfiles",
        label: "RF Profiles",
        description: "Radio frequency templates (channel, power)",
      },
      {
        key: "bluetoothSettings",
        label: "Bluetooth Settings",
        description: "Bluetooth beacon configuration",
      },
      {
        key: "wirelessSettings",
        label: "Wireless Settings",
        description: "Network-level wireless settings",
      },
      {
        key: "alternateManagementInterface",
        label: "Alternate Management Interface",
        description: "Wireless alternate management interface",
      },
      {
        key: "wirelessBilling",
        label: "Wireless Billing",
        description: "Wireless billing configuration",
      },
    ],
  },
  {
    id: "general",
    title: "Network General",
    categories: [
      {
        key: "networkDetails",
        label: "Network Details",
        description: "Basic network metadata (name, tags, notes, timezone)",
      },
      {
        key: "groupPolicies",
        label: "Group Policies",
        description: "Network group policies (bandwidth, firewall, VLANs)",
      },
      {
        key: "syslogServers",
        label: "Syslog Servers",
        description: "Syslog server configuration",
      },
      {
        key: "networkSnmp",
        label: "Network SNMP",
        description: "Network-level SNMP settings",
      },
      {
        key: "networkAlerts",
        label: "Network Alerts",
        description: "Email/webhook alert settings",
      },
      {
        key: "networkSettings",
        label: "Network Settings",
        description: "General network settings",
      },
      {
        key: "floorPlans",
        label: "Floor Plans",
        description: "Indoor mapping floor plans",
      },
      {
        key: "netflowSettings",
        label: "Netflow Settings",
        description: "Netflow export configuration",
      },
      {
        key: "trafficAnalysis",
        label: "Traffic Analysis",
        description: "Traffic analytics settings",
      },
      {
        key: "vlanProfiles",
        label: "VLAN Profiles",
        description: "VLAN profile templates",
      },
      {
        key: "networkWebhooks",
        label: "Network Webhook HTTP Servers",
        description: "Network-level webhook endpoints",
      },
    ],
  },
  {
    id: "device",
    title: "Device-Level Settings",
    categories: [
      {
        key: "managementInterface",
        label: "Management Interface",
        description: "Out-of-band management IP configuration",
      },
      {
        key: "wirelessRadioSettings",
        label: "Wireless Radio Settings",
        description: "Per-device wireless radio configuration",
      },
      {
        key: "deviceSwitchOspf",
        label: "Device Switch OSPF",
        description: "Device-level OSPF routing configuration",
      },
      {
        key: "deviceSwitchStp",
        label: "Device Switch STP",
        description: "Device-level Spanning Tree Protocol settings",
      },
      {
        key: "deviceApplianceUplink",
        label: "Device Appliance Uplink",
        description: "Device-level appliance WAN uplink settings",
      },
      {
        key: "deviceApplianceDhcpSubnets",
        label: "Device Appliance DHCP Subnets",
        description: "Device-level DHCP subnet configuration",
      },
    ],
  },
];

function getCounts(data: RestoreData): Record<string, number | string> {
  const backup = data.parsedBackup;
  if (!backup) return {};

  const netCfg = backup.networkConfigs[data.selectedNetworkId] ?? {};
  const orgCfg = backup.organizationConfig;
  const deviceCfg = backup.devices;

  return {
    // Organization
    orgDetails: (orgCfg as any).organizationDetails ? "Configured" : 0,
    orgAdmins: orgCfg.admins?.length ?? 0,
    orgPolicyObjects: orgCfg.policyObjects?.length ?? 0,
    orgPolicyObjectGroups: (orgCfg as any).policyObjectGroups?.length ?? 0,
    orgSnmp: orgCfg.snmp ? "Configured" : 0,
    orgVpnFirewallRules: orgCfg.vpnFirewallRules ? "Configured" : 0,
    orgThirdPartyVpn: orgCfg.thirdPartyVpnPeers?.length ?? 0,
    orgAlertProfiles: (orgCfg as any).alertProfiles?.length ?? 0,
    orgBrandingPolicies: (orgCfg as any).brandingPolicies?.length ?? 0,
    orgBrandingPoliciesPriorities: (orgCfg as any).brandingPoliciesPriorities
      ? "Configured"
      : 0,
    orgConfigTemplates: (orgCfg as any).configTemplates?.length ?? 0,
    orgLoginSecurity: (orgCfg as any).loginSecurity ? "Configured" : 0,
    orgSamlRoles: (orgCfg as any).samlRoles?.length ?? 0,
    orgApplianceSecurityIntrusion: (orgCfg as any).applianceSecurityIntrusion
      ? "Configured"
      : 0,
    orgWebhooks: (orgCfg as any).webhookHttpServers?.length ?? 0,

    // Appliance
    vlans: netCfg.applianceVlans?.length ?? 0,
    applianceFirewallL3:
      (netCfg.applianceL3FirewallRules as any)?.rules?.length ?? 0,
    applianceFirewallL7:
      (netCfg.applianceL7FirewallRules as any)?.rules?.length ?? 0,
    cellularFirewallRules:
      (netCfg as any).cellularFirewallRules?.rules?.length ?? 0,
    inboundFirewallRules:
      (netCfg as any).inboundFirewallRules?.rules?.length ?? 0,
    oneToManyNat: (netCfg as any).oneToManyNatRules?.rules?.length ?? 0,
    oneToOneNat: (netCfg as any).oneToOneNatRules?.rules?.length ?? 0,
    portForwardingRules:
      (netCfg as any).portForwardingRules?.rules?.length ?? 0,
    applianceStaticRoutes: netCfg.staticRoutes?.length ?? 0,
    contentFiltering: netCfg.contentFiltering ? "Configured" : 0,
    applianceSecurity:
      netCfg.intrusionSettings || netCfg.malwareSettings ? "Configured" : 0,
    trafficShaping:
      netCfg.trafficShapingRules || netCfg.uplinkSelection ? "Configured" : 0,
    trafficShapingGeneral: (netCfg as any).trafficShaping ? "Configured" : 0,
    customPerformanceClasses:
      (netCfg as any).customPerformanceClasses?.length ?? 0,
    applianceSettings: netCfg.applianceSettings ? "Configured" : 0,
    applianceConnectivityMonitoring: (netCfg as any).connectivityMonitoring
      ? "Configured"
      : 0,
    applianceUplinksSettings: (netCfg as any).applianceUplinksSettings
      ? "Configured"
      : 0,
    siteToSiteVpn: netCfg.siteToSiteVpnSettings ? "Configured" : 0,
    bgpSettings: netCfg.bgpSettings ? "Configured" : 0,

    // Switch
    switchPorts: deviceCfg.reduce(
      (sum, d) => sum + (d.config.switchPorts?.length ?? 0),
      0,
    ),
    switchRoutingInterfaces: deviceCfg.reduce(
      (sum, d) =>
        sum +
        (d.config.routingInterfaces?.length ?? 0) +
        (d.config.staticRoutes?.length ?? 0),
      0,
    ),
    switchAcls: netCfg.switchAcls ? "Configured" : 0,
    switchAccessPolicies: (netCfg as any).switchAccessPolicies?.length ?? 0,
    switchSettings: netCfg.switchSettings ? "Configured" : 0,
    networkStp: (netCfg as any).switchStp ? "Configured" : 0,
    portSchedules: netCfg.portSchedules?.length ?? 0,
    qosRules: netCfg.qosRules?.length ?? 0,
    dhcpServerPolicy: netCfg.dhcpServerPolicy ? "Configured" : 0,
    stormControl: netCfg.stormControl ? "Configured" : 0,
    switchMtu: netCfg.switchMtu ? "Configured" : 0,
    switchOspf: netCfg.switchOspf ? "Configured" : 0,
    switchLinkAggregations: netCfg.switchLinkAggregations?.length ?? 0,

    // Wireless
    ssids: (netCfg.ssids ?? []).filter((s: any) => s.enabled).length,
    ssidFirewallRules:
      Object.keys(netCfg.ssidFirewallL3Rules ?? {}).length +
      Object.keys(netCfg.ssidFirewallL7Rules ?? {}).length,
    ssidTrafficShaping: Object.keys(netCfg.ssidTrafficShaping ?? {}).length,
    ssidBonjourForwarding: (netCfg.ssids ?? []).filter(
      (s: any) => (s as any).bonjourForwarding,
    ).length,
    ssidDeviceTypeGroupPolicies: (netCfg.ssids ?? []).filter(
      (s: any) => (s as any).deviceTypeGroupPolicies,
    ).length,
    ssidHotspot20: (netCfg.ssids ?? []).filter((s: any) => (s as any).hotspot20)
      .length,
    ssidIdentityPsks: (netCfg.ssids ?? []).reduce(
      (sum: number, s: any) => sum + ((s as any).identityPsks?.length ?? 0),
      0,
    ),
    ssidSchedules: (netCfg.ssids ?? []).filter((s: any) => (s as any).schedules)
      .length,
    ssidSplashSettings: (netCfg.ssids ?? []).filter(
      (s: any) => (s as any).splashSettings,
    ).length,
    ssidVpnSettings: (netCfg.ssids ?? []).filter((s: any) => (s as any).vpn)
      .length,
    wirelessRfProfiles: netCfg.wirelessRfProfiles?.length ?? 0,
    bluetoothSettings: netCfg.bluetoothSettings ? "Configured" : 0,
    wirelessSettings: netCfg.wirelessSettings ? "Configured" : 0,
    alternateManagementInterface: (netCfg as any).alternateManagementInterface
      ? "Configured"
      : 0,
    wirelessBilling: (netCfg as any).wirelessBilling ? "Configured" : 0,

    // General
    networkDetails: (netCfg as any).networkDetails ? "Configured" : 0,
    groupPolicies: netCfg.groupPolicies?.length ?? 0,
    syslogServers: (netCfg.syslogServers as any)?.servers?.length ?? 0,
    networkSnmp: netCfg.snmp ? "Configured" : 0,
    networkAlerts: netCfg.networkAlerts ? "Configured" : 0,
    networkSettings: (netCfg as any).networkSettings ? "Configured" : 0,
    floorPlans: (netCfg as any).floorPlans?.length ?? 0,
    netflowSettings: (netCfg as any).netflow ? "Configured" : 0,
    trafficAnalysis: (netCfg as any).trafficAnalysis ? "Configured" : 0,
    vlanProfiles: (netCfg as any).vlanProfiles?.length ?? 0,
    networkWebhooks: (netCfg as any).webhookHttpServers?.length ?? 0,

    // Device-Level
    managementInterface: deviceCfg.some((d) => d.config.managementInterface)
      ? "Configured"
      : 0,
    wirelessRadioSettings: deviceCfg.some((d) => d.config.wirelessRadioSettings)
      ? "Configured"
      : 0,
    deviceSwitchOspf: deviceCfg.some((d) => (d.config as any).switchOspf)
      ? "Configured"
      : 0,
    deviceSwitchStp: deviceCfg.some((d) => (d.config as any).switchStp)
      ? "Configured"
      : 0,
    deviceApplianceUplink: deviceCfg.some(
      (d) => (d.config as any).applianceUplinkSettings,
    )
      ? "Configured"
      : 0,
    deviceApplianceDhcpSubnets: deviceCfg.reduce(
      (sum, d) => sum + ((d.config as any).applianceDhcpSubnets?.length ?? 0),
      0,
    ),
  };
}

export function SelectStep({ data, onUpdate }: SelectStepProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set([
      "organization",
      "appliance",
      "switch",
      "wireless",
      "general",
      "device",
    ]),
  );
  const backup = data.parsedBackup!;
  const networkIds = Object.keys(backup.networkConfigs);
  const counts = getCounts(data);

  const toggleGroup = (groupId: string) => {
    const next = new Set(expandedGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setExpandedGroups(next);
  };

  const toggleGroupSelection = (groupId: string, checked: boolean) => {
    const group = CATEGORY_GROUPS.find((g) => g.id === groupId);
    if (!group) return;

    const next = { ...data.restoreCategories };
    for (const cat of group.categories) {
      const count = counts[cat.key];
      const hasData =
        typeof count === "number" ? count > 0 : count === "Configured";
      if (hasData) {
        next[cat.key] = checked;
      }
    }
    onUpdate({ restoreCategories: next });
  };

  const setCategory = (key: keyof RestoreCategories, value: boolean) => {
    onUpdate({
      restoreCategories: { ...data.restoreCategories, [key]: value },
    });
  };

  const selectAll = () => {
    const next: RestoreCategories = { ...data.restoreCategories };
    for (const group of CATEGORY_GROUPS) {
      for (const cat of group.categories) {
        const count = counts[cat.key];
        const hasData =
          typeof count === "number" ? count > 0 : count === "Configured";
        if (hasData) next[cat.key] = true;
      }
    }
    onUpdate({ restoreCategories: next });
  };

  const clearAll = () => {
    const next = {} as RestoreCategories;
    for (const group of CATEGORY_GROUPS) {
      for (const cat of group.categories) {
        next[cat.key] = false;
      }
    }
    onUpdate({ restoreCategories: next });
  };

  const hasAnySelected = Object.values(data.restoreCategories).some((v) => v);

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 border-b-2 p-6">
        <p className="text-[16px] font-semibold">Select What to Restore</p>
        <p className="text-[12px] text-[#232C32]">
          Choose the network from the backup and which configuration categories
          to restore.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {networkIds.length > 1 && (
          <div className="mb-[22px]">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.05em] text-gray-500">
              Source Network
            </label>

            <div className="relative max-w-[400px]">
              <select
                value={data.selectedNetworkId}
                onChange={(e) =>
                  onUpdate({ selectedNetworkId: e.target.value })
                }
                className="w-full appearance-none rounded-[5px] border border-white/40 bg-white/50 px-3 py-[9px] pr-8 text-[13px] text-gray-900 outline-none transition focus:border-blue-500"
              >
                {networkIds.map((id) => (
                  <option key={id} value={id}>
                    Network: {id}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        )}

        {/* Select / Clear */}
        <div className="flex gap-3">
          <button
            onClick={selectAll}
            className="p-0 text-[12px] font-semibold text-blue-600 hover:underline"
          >
            Select all
          </button>

          <span className="text-[12px] text-gray-400">·</span>

          <button
            onClick={clearAll}
            disabled={!hasAnySelected}
            className={`p-0 text-[12px] font-semibold transition
            ${
              hasAnySelected
                ? "cursor-pointer text-gray-600 hover:underline"
                : "cursor-default text-gray-400"
            }
          `}
          >
            Clear all
          </button>
        </div>

        {/* Category Groups */}
        <div className="overflow-hidden rounded-md border border-white/40">
          {CATEGORY_GROUPS.map((group, groupIdx) => {
            const isExpanded = expandedGroups.has(group.id);
            const groupCats = group.categories.filter((cat) => {
              const count = counts[cat.key];
              return typeof count === "number"
                ? count > 0
                : count === "Configured";
            });

            const hasData = groupCats.length > 0;

            const allSelected =
              hasData &&
              groupCats.every((cat) => data.restoreCategories[cat.key]);

            const someSelected =
              hasData &&
              groupCats.some((cat) => data.restoreCategories[cat.key]) &&
              !allSelected;

            return (
              <div
                key={group.id}
                className={
                  groupIdx < CATEGORY_GROUPS.length - 1
                    ? "border-b border-white/30"
                    : ""
                }
              >
                {/* Group Header */}
                <div
                  onClick={() => toggleGroup(group.id)}
                  className="flex cursor-pointer select-none items-center gap-3 bg-white/40 px-5 py-3.5"
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}

                  <div className="flex-1 text-sm font-bold text-gray-900">
                    {group.title}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupSelection(group.id, !allSelected);
                    }}
                    disabled={!hasData}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold transition
                    ${!hasData ? "cursor-not-allowed opacity-40" : ""}
                    ${
                      allSelected
                        ? "border border-blue-600 bg-blue-600 text-white"
                        : someSelected
                          ? "border border-blue-200 bg-blue-50 text-blue-600"
                          : "border border-white/50 bg-white/60 text-blue-600"
                    }
                  `}
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {/* Categories */}
                {isExpanded && (
                  <div>
                    {group.categories.map((cat) => {
                      const count = counts[cat.key];
                      const hasItemData =
                        typeof count === "number"
                          ? count > 0
                          : count === "Configured";

                      const disabled = !hasItemData;
                      const checked =
                        data.restoreCategories[cat.key] && !disabled;

                      return (
                        <label
                          key={cat.key}
                          className={`flex items-center gap-4 border-t border-white/25 bg-white/65 px-5 py-3 pl-12
                          ${
                            disabled
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer"
                          }
                        `}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) =>
                              setCategory(cat.key, e.target.checked)
                            }
                            className="h-[15px] w-[15px] cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 text-[13px] font-semibold text-gray-900">
                              {cat.label}
                            </div>
                            <div className="text-[12px] text-gray-500">
                              {cat.description}
                            </div>
                          </div>

                          <div
                            className={`shrink-0 rounded-full px-2 py-[3px] text-[11px] font-bold
                            ${
                              disabled
                                ? "border border-black/10 bg-black/5 text-gray-400"
                                : "border border-blue-200 bg-blue-100 text-blue-600"
                            }
                          `}
                          >
                            {typeof count === "number"
                              ? count
                              : count || "Not found"}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
