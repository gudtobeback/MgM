

// --- Core Application Types ---

export interface User {
  id: number;
  username: string;
}

// FIX: Add missing ChatMessage and Sender types for the AI assistant feature.
export enum Sender {
  User = 'user',
  AI = 'ai',
  System = 'system',
  Webex = 'webex',
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  timestamp: string;
  personEmail?: string;
  imageUrl?: string;
  videoUrl?: string;
  originalVideoUrl?: string;
}


// --- Application Configuration Types ---
export interface NetworkConfiguration {
  id?: number;
  userId: number;
  name: string;
  apiKey: string;
  orgId: string;
  region: 'com' | 'in';
  // FIX: Add optional geminiApiKey to support AI features.
  geminiApiKey?: string;
}

// FIX: Add missing DefaultTemplate type.
export interface DefaultTemplate {
  id?: number;
  userId: number;
  name: string;
  content: string;
}


// --- Meraki Base Types ---

export interface MerakiOrganization {
  id: string;
  name: string;
  url: string;
  api: {
    enabled: boolean;
  };
}

export interface MerakiNetwork {
  id: string;
  organizationId: string;
  name: string;
  productTypes: string[];
  timeZone: string;
  tags: string[];
  notes?: string;
}

export interface MerakiDevice {
  serial: string;
  name: string;
  model: string;
  status: string;
  networkId?: string;
  lanIp?: string;
  mac: string;
  tags: string[];
  notes?: string;
}

export interface MerakiDeviceDetails extends MerakiDevice {
  lat?: number;
  lng?: number;
  address?: string;
  url: string;
  ledIdentificationStatus?: string;
}

// --- Meraki Configuration Types (Generated from API calls) ---
// Note: Many of these are partial definitions for brevity. `[key: string]: any` is used for flexibility.

export interface PolicyObject { id: string; name: string; [key: string]: any; }
export interface VpnPeer { name: string; publicIp: string; [key: string]: any; }
export interface VpnFirewallRule { [key: string]: any; }
export interface WebhookHttpServer { id: string; name: string; url: string; [key: string]: any; }
export interface NetworkSnmpSettings { [key: string]: any; }
export interface Floorplan { floorplanId: string; name: string; [key: string]: any; }

export interface GroupPolicy {
  groupPolicyId?: string;
  name: string;
  [key: string]: any;
}

export interface SwitchPortSettings {
  portId: string;
  name?: string;
  tags?: string[];
  enabled?: boolean;
  poeEnabled?: boolean;
  type?: 'access' | 'trunk';
  vlan?: number;
  voiceVlan?: number;
  allowedVlans?: string;
  isolationEnabled?: boolean;
  rstpEnabled?: boolean;
  stpGuard?: 'disabled' | 'root guard' | 'bpdu guard';
  linkNegotiation?: string;
  [key: string]: any;
}

export interface ManagementInterfaceSettings {
  wan1?: { [key: string]: any; };
  wan2?: { [key: string]: any; };
}

export interface DeviceWirelessRadioSettings {
  serial: string;
  [key: string]: any;
}

export interface ApplianceUplinkSettings {
  interfaces: { [key: string]: any; }
}

export interface SwitchStack {
  id: string;
  name: string;
  serials: string[];
}

export interface SwitchRoutingInterface {
  interfaceId: string;
  name: string;
  subnet: string;
  interfaceIp: string;
  vlanId: number;
  [key: string]: any;
}

export interface SwitchStaticRoute {
  staticRouteId: string;
  name: string;
  subnet: string;
  nextHopIp: string;
  [key: string]: any;
}

export interface OspfSettings {
  enabled: boolean;
  [key: string]: any;
}

export interface AccessControlLists {
  rules: any[];
}

export interface AccessPolicy {
  [key: string]: any;
}

export interface PortSchedule {
  id: string;
  name: string;
  [key: string]: any;
}

export interface SwitchSettings {
  vlan: number;
  useCombinedPower: boolean;
  powerExceptions: any[];
}

export interface WirelessSsid {
  number: number;
  name: string;
  enabled: boolean;
  [key: string]: any;
}

export interface SsidFirewallL3Rules {
  rules: any[];
  allowLanAccess: boolean;
}
export interface SsidFirewallL7Rules {
  rules: any[];
}

export interface ApplianceStaticRoute {
  id: string;
  name: string;
  subnet: string;
  gatewayIp: string;
  enabled?: boolean;
  networkId?: string;
  [key: string]: any;
}

export interface ApplianceVlan {
  id: string;
  name: string;
  subnet: string;
  applianceIp: string;
  [key: string]: any;
}

export interface MerakiL3FirewallRule {
  comment: string;
  policy: 'allow' | 'deny';
  protocol: string;
  destPort: string;
  destCidr: string;
  srcPort?: string;
  srcCidr: string;
  syslogEnabled?: boolean;
}

export interface MerakiL7FirewallRule {
  policy: 'allow' | 'deny';
  type: string;
  value: any;
}

export interface SiteToSiteVpnSettings {
  mode: 'none' | 'spoke' | 'hub';
  hubs: any[];
  subnets: any[];
}

export interface BgpSettings {
  enabled: boolean;
  asNumber: number;
  [key:string]: any;
}

export interface IntrusionSettings {
  mode: 'detection' | 'prevention' | 'disabled';
  [key:string]: any;
}

export interface MalwareSettings {
  mode: 'enabled' | 'disabled';
  [key:string]: any;
}

export interface ContentFilteringSettings {
  [key:string]: any;
}

export interface OrganizationAdmin {
  id: string;
  name: string;
  email: string;
  orgAccess: 'full' | 'read-only' | 'none';
  [key: string]: any;
}

export interface SnmpSettings {
    v2cEnabled: boolean;
    v3Enabled: boolean;
    [key: string]: any;
}

export interface AlertSettings {
  defaultDestinations: { [key: string]: any; };
  alerts: any[];
}

export interface ConfigTemplate {
  id: string;
  name: string;
}

export interface SyslogServer {
  host: string;
  port: number;
  roles: string[];
}

export interface SwitchStpSettings {
  rstpEnabled: boolean;
  stpdBridgePriority: any[];
}

export interface LinkAggregation {
  [key: string]: any;
}

export interface WirelessSettings {
  [key: string]: any;
}
export interface WirelessBluetoothSettings {
  [key: string]: any;
}

export interface RfProfile {
  id: string;
  name: string;
  [key: string]: any;
}

export interface QosRule {
  id?: string;
  vlan: number;
  [key: string]: any;
}

export interface DhcpServerPolicy { [key: string]: any; }
export interface DscpToCosMappings { [key: string]: any; }
export interface StormControlSettings { [key: string]: any; }
export interface MtuSettings { [key: string]: any; }
export interface ApplianceSettings { [key: string]: any; }
export interface UplinkSelection { [key: string]: any; }
export interface TrafficShapingRules { [key: string]: any; }
export interface SsidTrafficShapingRules { [key: string]: any; }


// --- Backup & Restore Types ---

export interface OrgConfigBackup {
    policyObjects?: PolicyObject[];
    thirdPartyVpnPeers?: VpnPeer[];
    vpnFirewallRules?: VpnFirewallRule[];
    // Deprecated, but kept for potential old backup compatibility
    admins?: OrganizationAdmin[];
    snmp?: SnmpSettings;
    alerts?: AlertSettings;
    configTemplates?: ConfigTemplate[];
}

export interface NetworkConfigBackup {
    // Network-wide
    webhooks?: WebhookHttpServer[];
    syslogServers?: { servers: SyslogServer[] };
    snmp?: NetworkSnmpSettings;
    networkAlerts?: AlertSettings;
    floorplans?: Floorplan[];
    groupPolicies?: GroupPolicy[];

    // Appliance (MX)
    applianceSettings?: ApplianceSettings;
    applianceVlansSettings?: { vlansEnabled: boolean };
    applianceVlans?: ApplianceVlan[];
    staticRoutes?: ApplianceStaticRoute[]; // Appliance static routes
    intrusionSettings?: IntrusionSettings;
    malwareSettings?: MalwareSettings;
    applianceL3FirewallRules?: { rules: MerakiL3FirewallRule[] };
    applianceL7FirewallRules?: { rules: MerakiL7FirewallRule[] };
    contentFiltering?: ContentFilteringSettings;
    siteToSiteVpnSettings?: SiteToSiteVpnSettings;
    uplinkSelection?: UplinkSelection;
    trafficShapingRules?: TrafficShapingRules;
    bgpSettings?: BgpSettings;

    // Switch (MS)
    portSchedules?: PortSchedule[];
    qosRules?: QosRule[];
    accessPolicies?: AccessPolicy[];
    switchAcls?: AccessControlLists;
    dhcpServerPolicy?: DhcpServerPolicy;
    dscpToCosMappings?: DscpToCosMappings;
    stormControl?: StormControlSettings;
    switchMtu?: MtuSettings;
    switchLinkAggregations?: LinkAggregation[];
    switchOspf?: OspfSettings;
    switchSettings?: SwitchSettings;

    // Wireless (MR)
    ssids?: WirelessSsid[];
    ssidFirewallL3Rules?: Record<number, SsidFirewallL3Rules>;
    ssidFirewallL7Rules?: Record<number, SsidFirewallL7Rules>;
    ssidTrafficShaping?: Record<number, SsidTrafficShapingRules>;
    wirelessRfProfiles?: RfProfile[];
    bluetoothSettings?: WirelessBluetoothSettings;
    wirelessSettings?: WirelessSettings;
}

export interface DeviceConfigBackup {
  general: MerakiDeviceDetails;
  switchPorts?: SwitchPortSettings[];
  routingInterfaces?: SwitchRoutingInterface[]; // SVIs
  staticRoutes?: SwitchStaticRoute[]; // Switch static routes
  managementInterface?: any;
  wirelessRadioSettings?: any;
}

export interface DeviceBackup {
  serial: string;
  config: DeviceConfigBackup;
}

export interface BackupFile {
  createdAt: string;
  sourceOrgId: string;
  sourceOrgName: string;
  devices: DeviceBackup[];
  networkConfigs: Record<string, Partial<NetworkConfigBackup>>;
  organizationConfig: Partial<OrgConfigBackup>;
}

export interface RestoreCategories {
  // ── Organization ──────────────────────────────────
  orgAdmins: boolean;
  orgPolicyObjects: boolean;
  orgSnmp: boolean;
  orgVpnFirewallRules: boolean;
  orgThirdPartyVpn: boolean;

  // ── Appliance (MX) ────────────────────────────────
  vlans: boolean;
  applianceFirewallL3: boolean;
  applianceFirewallL7: boolean;
  applianceStaticRoutes: boolean;
  contentFiltering: boolean;
  applianceSecurity: boolean;        // intrusion + malware
  trafficShaping: boolean;           // traffic shaping + uplink selection
  applianceSettings: boolean;
  siteToSiteVpn: boolean;
  bgpSettings: boolean;

  // ── Switch (MS) ───────────────────────────────────
  switchPorts: boolean;              // device-level
  switchRoutingInterfaces: boolean;  // device-level SVIs + static routes
  switchAcls: boolean;
  switchSettings: boolean;
  portSchedules: boolean;
  qosRules: boolean;
  dhcpServerPolicy: boolean;
  stormControl: boolean;
  switchMtu: boolean;
  switchOspf: boolean;
  switchLinkAggregations: boolean;

  // ── Wireless (MR) ─────────────────────────────────
  ssids: boolean;
  ssidFirewallRules: boolean;        // per-SSID L3 + L7
  ssidTrafficShaping: boolean;
  wirelessRfProfiles: boolean;
  bluetoothSettings: boolean;
  wirelessSettings: boolean;

  // ── Network General ───────────────────────────────
  groupPolicies: boolean;
  syslogServers: boolean;
  networkSnmp: boolean;
  networkAlerts: boolean;

  // ── Device ────────────────────────────────────────
  managementInterface: boolean;
  wirelessRadioSettings: boolean;
}
