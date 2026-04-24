import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { RestoreData } from '../RestoreWizard';
import { RestoreCategories } from '../../../types';

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
    id: 'organization',
    title: 'Organization',
    categories: [
      { key: 'orgDetails', label: 'Organization Details', description: 'Basic organization metadata and settings' },
      { key: 'orgAdmins', label: 'Admins', description: 'Organization administrators' },
      { key: 'orgPolicyObjects', label: 'Policy Objects', description: 'Network policy objects (IP groups, ports)' },
      { key: 'orgPolicyObjectGroups', label: 'Policy Object Groups', description: 'Grouped policy objects' },
      { key: 'orgSnmp', label: 'SNMP Settings', description: 'Organization-level SNMP configuration' },
      { key: 'orgVpnFirewallRules', label: 'VPN Firewall Rules', description: 'Organization VPN firewall rules' },
      { key: 'orgThirdPartyVpn', label: 'Third-Party VPN Peers', description: 'IPsec VPN peer configurations' },
      { key: 'orgAlertProfiles', label: 'Alert Profiles', description: 'Custom alert profile configurations' },
      { key: 'orgBrandingPolicies', label: 'Branding Policies', description: 'Custom branding and splash pages' },
      { key: 'orgBrandingPoliciesPriorities', label: 'Branding Policy Priorities', description: 'Priority order for branding policies' },
      { key: 'orgConfigTemplates', label: 'Config Templates', description: 'Network configuration templates' },
      { key: 'orgLoginSecurity', label: 'Login Security', description: 'API/portal login security settings' },
      { key: 'orgSamlRoles', label: 'SAML Roles', description: 'SAML SSO role mappings' },
      { key: 'orgApplianceSecurityIntrusion', label: 'Appliance Security Intrusion (Org)', description: 'Organization-level intrusion detection settings' },
      { key: 'orgWebhooks', label: 'Webhook HTTP Servers', description: 'Organization-level webhook endpoints' },
    ],
  },
  {
    id: 'appliance',
    title: 'Appliance (MX)',
    categories: [
      { key: 'vlans', label: 'VLANs', description: 'Appliance VLAN definitions' },
      { key: 'applianceFirewallL3', label: 'L3 Firewall Rules', description: 'Layer 3 firewall rules' },
      { key: 'applianceFirewallL7', label: 'L7 Firewall Rules', description: 'Layer 7 application firewall rules' },
      { key: 'cellularFirewallRules', label: 'Cellular Firewall Rules', description: 'Firewall rules for cellular WAN' },
      { key: 'inboundFirewallRules', label: 'Inbound Firewall Rules', description: 'Inbound NAT firewall rules' },
      { key: 'oneToManyNat', label: 'One-to-Many NAT Rules', description: 'Port address translation (PAT) rules' },
      { key: 'oneToOneNat', label: 'One-to-One NAT Rules', description: 'Static NAT mappings' },
      { key: 'portForwardingRules', label: 'Port Forwarding Rules', description: 'Inbound port forwarding rules' },
      { key: 'applianceStaticRoutes', label: 'Static Routes', description: 'Appliance static routing table' },
      { key: 'contentFiltering', label: 'Content Filtering', description: 'Web content filtering policies' },
      { key: 'applianceSecurity', label: 'Security (IDS/IPS + Malware)', description: 'Intrusion detection/prevention and anti-malware' },
      { key: 'trafficShaping', label: 'Traffic Shaping Rules + Uplink Selection', description: 'QoS traffic shaping rules and WAN uplink policies' },
      { key: 'trafficShapingGeneral', label: 'Traffic Shaping General Settings', description: 'Global traffic shaping configuration' },
      { key: 'customPerformanceClasses', label: 'Custom Performance Classes', description: 'SD-WAN custom performance classes' },
      { key: 'applianceSettings', label: 'Appliance Settings', description: 'MX appliance general settings' },
      { key: 'applianceConnectivityMonitoring', label: 'Connectivity Monitoring', description: 'Uplink connectivity monitoring destinations' },
      { key: 'applianceUplinksSettings', label: 'Uplinks Settings', description: 'WAN uplink configuration' },
      { key: 'siteToSiteVpn', label: 'Site-to-Site VPN', description: 'Auto VPN hub/spoke configuration' },
      { key: 'bgpSettings', label: 'BGP Settings', description: 'BGP routing protocol configuration' },
    ],
  },
  {
    id: 'switch',
    title: 'Switch (MS)',
    categories: [
      { key: 'switchPorts', label: 'Switch Ports', description: 'Per-device switch port settings' },
      { key: 'switchRoutingInterfaces', label: 'Routing Interfaces (SVIs)', description: 'Layer 3 switch virtual interfaces and static routes' },
      { key: 'switchAcls', label: 'Access Control Lists', description: 'Switch ACLs' },
      { key: 'switchAccessPolicies', label: 'Access Policies', description: '802.1X and MAC-based access policies' },
      { key: 'switchSettings', label: 'Switch Settings', description: 'Network-level switch settings' },
      { key: 'networkStp', label: 'STP Settings', description: 'Spanning Tree Protocol configuration' },
      { key: 'portSchedules', label: 'Port Schedules', description: 'Port on/off schedules' },
      { key: 'qosRules', label: 'QoS Rules', description: 'Quality of Service prioritization rules' },
      { key: 'dhcpServerPolicy', label: 'DHCP Server Policy', description: 'DHCP server configuration' },
      { key: 'stormControl', label: 'Storm Control', description: 'Broadcast/multicast storm control' },
      { key: 'switchMtu', label: 'MTU Settings', description: 'Maximum transmission unit' },
      { key: 'switchOspf', label: 'OSPF Settings (Network)', description: 'Network-level OSPF routing protocol configuration' },
      { key: 'switchLinkAggregations', label: 'Link Aggregations (LAG)', description: 'Port channel / LACP configurations' },
    ],
  },
  {
    id: 'wireless',
    title: 'Wireless (MR)',
    categories: [
      { key: 'ssids', label: 'SSIDs (Base Config)', description: 'Wireless SSID base configurations' },
      { key: 'ssidFirewallRules', label: 'SSID Firewall Rules (L3 + L7)', description: 'Per-SSID firewall rules' },
      { key: 'ssidTrafficShaping', label: 'SSID Traffic Shaping', description: 'Per-SSID bandwidth limits and QoS' },
      { key: 'ssidBonjourForwarding', label: 'SSID Bonjour Forwarding', description: 'Per-SSID Bonjour/mDNS forwarding rules' },
      { key: 'ssidDeviceTypeGroupPolicies', label: 'SSID Device Type Group Policies', description: 'Per-device-type group policy assignments' },
      { key: 'ssidHotspot20', label: 'SSID Hotspot 2.0', description: 'Passpoint / Hotspot 2.0 configuration' },
      { key: 'ssidIdentityPsks', label: 'SSID Identity PSKs', description: 'Per-user pre-shared keys' },
      { key: 'ssidSchedules', label: 'SSID Schedules', description: 'Time-based SSID availability' },
      { key: 'ssidSplashSettings', label: 'SSID Splash Settings', description: 'Captive portal / splash page settings' },
      { key: 'ssidVpnSettings', label: 'SSID VPN Settings', description: 'Per-SSID VPN concentrator configuration' },
      { key: 'wirelessRfProfiles', label: 'RF Profiles', description: 'Radio frequency templates (channel, power)' },
      { key: 'bluetoothSettings', label: 'Bluetooth Settings', description: 'Bluetooth beacon configuration' },
      { key: 'wirelessSettings', label: 'Wireless Settings', description: 'Network-level wireless settings' },
      { key: 'alternateManagementInterface', label: 'Alternate Management Interface', description: 'Wireless alternate management interface' },
      { key: 'wirelessBilling', label: 'Wireless Billing', description: 'Wireless billing configuration' },
    ],
  },
  {
    id: 'general',
    title: 'Network General',
    categories: [
      { key: 'networkDetails', label: 'Network Details', description: 'Basic network metadata (name, tags, notes, timezone)' },
      { key: 'groupPolicies', label: 'Group Policies', description: 'Network group policies (bandwidth, firewall, VLANs)' },
      { key: 'syslogServers', label: 'Syslog Servers', description: 'Syslog server configuration' },
      { key: 'networkSnmp', label: 'Network SNMP', description: 'Network-level SNMP settings' },
      { key: 'networkAlerts', label: 'Network Alerts', description: 'Email/webhook alert settings' },
      { key: 'networkSettings', label: 'Network Settings', description: 'General network settings' },
      { key: 'floorPlans', label: 'Floor Plans', description: 'Indoor mapping floor plans' },
      { key: 'netflowSettings', label: 'Netflow Settings', description: 'Netflow export configuration' },
      { key: 'trafficAnalysis', label: 'Traffic Analysis', description: 'Traffic analytics settings' },
      { key: 'vlanProfiles', label: 'VLAN Profiles', description: 'VLAN profile templates' },
      { key: 'networkWebhooks', label: 'Network Webhook HTTP Servers', description: 'Network-level webhook endpoints' },
    ],
  },
  {
    id: 'device',
    title: 'Device-Level Settings',
    categories: [
      { key: 'managementInterface', label: 'Management Interface', description: 'Out-of-band management IP configuration' },
      { key: 'wirelessRadioSettings', label: 'Wireless Radio Settings', description: 'Per-device wireless radio configuration' },
      { key: 'deviceSwitchOspf', label: 'Device Switch OSPF', description: 'Device-level OSPF routing configuration' },
      { key: 'deviceSwitchStp', label: 'Device Switch STP', description: 'Device-level Spanning Tree Protocol settings' },
      { key: 'deviceApplianceUplink', label: 'Device Appliance Uplink', description: 'Device-level appliance WAN uplink settings' },
      { key: 'deviceApplianceDhcpSubnets', label: 'Device Appliance DHCP Subnets', description: 'Device-level DHCP subnet configuration' },
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
    orgDetails: (orgCfg as any).organizationDetails ? 'Configured' : 0,
    orgAdmins: orgCfg.admins?.length ?? 0,
    orgPolicyObjects: orgCfg.policyObjects?.length ?? 0,
    orgPolicyObjectGroups: (orgCfg as any).policyObjectGroups?.length ?? 0,
    orgSnmp: orgCfg.snmp ? 'Configured' : 0,
    orgVpnFirewallRules: orgCfg.vpnFirewallRules ? 'Configured' : 0,
    orgThirdPartyVpn: orgCfg.thirdPartyVpnPeers?.length ?? 0,
    orgAlertProfiles: (orgCfg as any).alertProfiles?.length ?? 0,
    orgBrandingPolicies: (orgCfg as any).brandingPolicies?.length ?? 0,
    orgBrandingPoliciesPriorities: (orgCfg as any).brandingPoliciesPriorities ? 'Configured' : 0,
    orgConfigTemplates: (orgCfg as any).configTemplates?.length ?? 0,
    orgLoginSecurity: (orgCfg as any).loginSecurity ? 'Configured' : 0,
    orgSamlRoles: (orgCfg as any).samlRoles?.length ?? 0,
    orgApplianceSecurityIntrusion: (orgCfg as any).applianceSecurityIntrusion ? 'Configured' : 0,
    orgWebhooks: (orgCfg as any).webhookHttpServers?.length ?? 0,

    // Appliance
    vlans: netCfg.applianceVlans?.length ?? 0,
    applianceFirewallL3: (netCfg.applianceL3FirewallRules as any)?.rules?.length ?? 0,
    applianceFirewallL7: (netCfg.applianceL7FirewallRules as any)?.rules?.length ?? 0,
    cellularFirewallRules: (netCfg as any).cellularFirewallRules?.rules?.length ?? 0,
    inboundFirewallRules: (netCfg as any).inboundFirewallRules?.rules?.length ?? 0,
    oneToManyNat: (netCfg as any).oneToManyNatRules?.rules?.length ?? 0,
    oneToOneNat: (netCfg as any).oneToOneNatRules?.rules?.length ?? 0,
    portForwardingRules: (netCfg as any).portForwardingRules?.rules?.length ?? 0,
    applianceStaticRoutes: netCfg.staticRoutes?.length ?? 0,
    contentFiltering: netCfg.contentFiltering ? 'Configured' : 0,
    applianceSecurity: (netCfg.intrusionSettings || netCfg.malwareSettings) ? 'Configured' : 0,
    trafficShaping: (netCfg.trafficShapingRules || netCfg.uplinkSelection) ? 'Configured' : 0,
    trafficShapingGeneral: (netCfg as any).trafficShaping ? 'Configured' : 0,
    customPerformanceClasses: (netCfg as any).customPerformanceClasses?.length ?? 0,
    applianceSettings: netCfg.applianceSettings ? 'Configured' : 0,
    applianceConnectivityMonitoring: (netCfg as any).connectivityMonitoring ? 'Configured' : 0,
    applianceUplinksSettings: (netCfg as any).applianceUplinksSettings ? 'Configured' : 0,
    siteToSiteVpn: netCfg.siteToSiteVpnSettings ? 'Configured' : 0,
    bgpSettings: netCfg.bgpSettings ? 'Configured' : 0,

    // Switch
    switchPorts: deviceCfg.reduce((sum, d) => sum + (d.config.switchPorts?.length ?? 0), 0),
    switchRoutingInterfaces: deviceCfg.reduce((sum, d) => sum + (d.config.routingInterfaces?.length ?? 0) + (d.config.staticRoutes?.length ?? 0), 0),
    switchAcls: netCfg.switchAcls ? 'Configured' : 0,
    switchAccessPolicies: (netCfg as any).switchAccessPolicies?.length ?? 0,
    switchSettings: netCfg.switchSettings ? 'Configured' : 0,
    networkStp: (netCfg as any).switchStp ? 'Configured' : 0,
    portSchedules: netCfg.portSchedules?.length ?? 0,
    qosRules: netCfg.qosRules?.length ?? 0,
    dhcpServerPolicy: netCfg.dhcpServerPolicy ? 'Configured' : 0,
    stormControl: netCfg.stormControl ? 'Configured' : 0,
    switchMtu: netCfg.switchMtu ? 'Configured' : 0,
    switchOspf: netCfg.switchOspf ? 'Configured' : 0,
    switchLinkAggregations: netCfg.switchLinkAggregations?.length ?? 0,

    // Wireless
    ssids: (netCfg.ssids ?? []).filter((s: any) => s.enabled).length,
    ssidFirewallRules: Object.keys(netCfg.ssidFirewallL3Rules ?? {}).length + Object.keys(netCfg.ssidFirewallL7Rules ?? {}).length,
    ssidTrafficShaping: Object.keys(netCfg.ssidTrafficShaping ?? {}).length,
    ssidBonjourForwarding: (netCfg.ssids ?? []).filter((s: any) => (s as any).bonjourForwarding).length,
    ssidDeviceTypeGroupPolicies: (netCfg.ssids ?? []).filter((s: any) => (s as any).deviceTypeGroupPolicies).length,
    ssidHotspot20: (netCfg.ssids ?? []).filter((s: any) => (s as any).hotspot20).length,
    ssidIdentityPsks: (netCfg.ssids ?? []).reduce((sum: number, s: any) => sum + ((s as any).identityPsks?.length ?? 0), 0),
    ssidSchedules: (netCfg.ssids ?? []).filter((s: any) => (s as any).schedules).length,
    ssidSplashSettings: (netCfg.ssids ?? []).filter((s: any) => (s as any).splashSettings).length,
    ssidVpnSettings: (netCfg.ssids ?? []).filter((s: any) => (s as any).vpn).length,
    wirelessRfProfiles: netCfg.wirelessRfProfiles?.length ?? 0,
    bluetoothSettings: netCfg.bluetoothSettings ? 'Configured' : 0,
    wirelessSettings: netCfg.wirelessSettings ? 'Configured' : 0,
    alternateManagementInterface: (netCfg as any).alternateManagementInterface ? 'Configured' : 0,
    wirelessBilling: (netCfg as any).wirelessBilling ? 'Configured' : 0,

    // General
    networkDetails: (netCfg as any).networkDetails ? 'Configured' : 0,
    groupPolicies: netCfg.groupPolicies?.length ?? 0,
    syslogServers: (netCfg.syslogServers as any)?.servers?.length ?? 0,
    networkSnmp: netCfg.snmp ? 'Configured' : 0,
    networkAlerts: netCfg.networkAlerts ? 'Configured' : 0,
    networkSettings: (netCfg as any).networkSettings ? 'Configured' : 0,
    floorPlans: (netCfg as any).floorPlans?.length ?? 0,
    netflowSettings: (netCfg as any).netflow ? 'Configured' : 0,
    trafficAnalysis: (netCfg as any).trafficAnalysis ? 'Configured' : 0,
    vlanProfiles: (netCfg as any).vlanProfiles?.length ?? 0,
    networkWebhooks: (netCfg as any).webhookHttpServers?.length ?? 0,

    // Device-Level
    managementInterface: deviceCfg.some(d => d.config.managementInterface) ? 'Configured' : 0,
    wirelessRadioSettings: deviceCfg.some(d => d.config.wirelessRadioSettings) ? 'Configured' : 0,
    deviceSwitchOspf: deviceCfg.some(d => (d.config as any).switchOspf) ? 'Configured' : 0,
    deviceSwitchStp: deviceCfg.some(d => (d.config as any).switchStp) ? 'Configured' : 0,
    deviceApplianceUplink: deviceCfg.some(d => (d.config as any).applianceUplinkSettings) ? 'Configured' : 0,
    deviceApplianceDhcpSubnets: deviceCfg.reduce((sum, d) => sum + ((d.config as any).applianceDhcpSubnets?.length ?? 0), 0),
  };
}

export function SelectStep({ data, onUpdate }: SelectStepProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['organization', 'appliance', 'switch', 'wireless', 'general', 'device']));
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
    const group = CATEGORY_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    const next = { ...data.restoreCategories };
    for (const cat of group.categories) {
      const count = counts[cat.key];
      const hasData = typeof count === 'number' ? count > 0 : count === 'Configured';
      if (hasData) {
        next[cat.key] = checked;
      }
    }
    onUpdate({ restoreCategories: next });
  };

  const setCategory = (key: keyof RestoreCategories, value: boolean) => {
    onUpdate({ restoreCategories: { ...data.restoreCategories, [key]: value } });
  };

  const selectAll = () => {
    const next: RestoreCategories = { ...data.restoreCategories };
    for (const group of CATEGORY_GROUPS) {
      for (const cat of group.categories) {
        const count = counts[cat.key];
        const hasData = typeof count === 'number' ? count > 0 : count === 'Configured';
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

  const hasAnySelected = Object.values(data.restoreCategories).some(v => v);

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
        Select What to Restore
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px' }}>
        Choose the network from the backup and which configuration categories to restore.
      </p>

      {networkIds.length > 1 && (
        <div style={{ marginBottom: '22px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 700,
            color: '#6b7280', marginBottom: '6px',
            letterSpacing: '0.05em', textTransform: 'uppercase' as const,
          }}>
            Source Network
          </label>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <select
              value={data.selectedNetworkId}
              onChange={e => onUpdate({ selectedNetworkId: e.target.value })}
              style={{
                width: '100%', padding: '9px 32px 9px 12px',
                border: '1px solid rgba(255,255,255,0.4)', borderRadius: '5px',
                fontSize: '13px', color: '#111827',
                backgroundColor: 'rgba(255,255,255,0.5)',
                appearance: 'none', cursor: 'pointer',
              }}
            >
              {networkIds.map(id => (
                <option key={id} value={id}>Network: {id}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{
              position: 'absolute', right: '10px', top: '50%',
              transform: 'translateY(-50%)', pointerEvents: 'none',
              color: '#9ca3af',
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
        <button
          onClick={selectAll}
          style={{
            fontSize: '12px', color: '#2563eb', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600,
          }}
        >
          Select all
        </button>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>·</span>
        <button
          onClick={clearAll}
          disabled={!hasAnySelected}
          style={{
            fontSize: '12px',
            color: hasAnySelected ? '#6b7280' : '#9ca3af',
            background: 'none', border: 'none',
            cursor: hasAnySelected ? 'pointer' : 'default',
            padding: 0, fontWeight: 600,
          }}
        >
          Clear all
        </button>
      </div>

      <div style={{ border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', overflow: 'hidden' }}>
        {CATEGORY_GROUPS.map((group, groupIdx) => {
          const isExpanded = expandedGroups.has(group.id);
          const groupCats = group.categories.filter(cat => {
            const count = counts[cat.key];
            return typeof count === 'number' ? count > 0 : count === 'Configured';
          });
          const hasData = groupCats.length > 0;
          const allSelected = hasData && groupCats.every(cat => data.restoreCategories[cat.key]);
          const someSelected = hasData && groupCats.some(cat => data.restoreCategories[cat.key]) && !allSelected;

          return (
            <div key={group.id} style={{
              borderBottom: groupIdx < CATEGORY_GROUPS.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none',
            }}>
              {/* Group Header */}
              <div
                onClick={() => toggleGroup(group.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 20px',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {isExpanded ? <ChevronDown size={16} color="#6b7280" /> : <ChevronRight size={16} color="#6b7280" />}
                <div style={{ flex: 1, fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                  {group.title}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroupSelection(group.id, !allSelected);
                  }}
                  disabled={!hasData}
                  style={{
                    fontSize: '11px', padding: '4px 10px', borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.5)',
                    backgroundColor: allSelected ? '#2563eb' : someSelected ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255,255,255,0.6)',
                    color: allSelected ? '#fff' : '#2563eb',
                    cursor: hasData ? 'pointer' : 'not-allowed',
                    opacity: hasData ? 1 : 0.4,
                    fontWeight: 600,
                  }}
                >
                  {allSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
                </button>
              </div>

              {/* Group Categories */}
              {isExpanded && (
                <div>
                  {group.categories.map((cat, idx) => {
                    const count = counts[cat.key];
                    const hasItemData = typeof count === 'number' ? count > 0 : count === 'Configured';
                    const disabled = !hasItemData;
                    const checked = data.restoreCategories[cat.key] && !disabled;

                    return (
                      <label
                        key={cat.key}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '16px',
                          padding: '12px 20px 12px 48px',
                          borderTop: '1px solid rgba(255,255,255,0.25)',
                          backgroundColor: 'rgba(255,255,255,0.65)',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.5 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={e => setCategory(cat.key, e.target.checked)}
                          style={{ width: '15px', height: '15px', cursor: disabled ? 'not-allowed' : 'pointer', accentColor: '#2563eb' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                            {cat.label}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {cat.description}
                          </div>
                        </div>
                        <div style={{
                          flexShrink: 0,
                          fontSize: '11px', fontWeight: 700,
                          padding: '3px 8px', borderRadius: '12px',
                          backgroundColor: disabled ? 'rgba(0,0,0,0.05)' : '#dbeafe',
                          color: disabled ? '#9ca3af' : '#2563eb',
                          border: `1px solid ${disabled ? 'rgba(0,0,0,0.1)' : '#bfdbfe'}`,
                        }}>
                          {typeof count === 'number' ? count : count || 'Not found'}
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
  );
}
