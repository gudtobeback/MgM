
import JSZip from 'jszip';
import { 
    MerakiDevice, MerakiNetwork, MerakiOrganization, MerakiDeviceDetails, GroupPolicy,
    SwitchPortSettings, ManagementInterfaceSettings, DeviceWirelessRadioSettings, ApplianceUplinkSettings, SwitchStack,
    SwitchRoutingInterface, SwitchStaticRoute, OspfSettings, AccessControlLists, AccessPolicy, PortSchedule,
    SwitchSettings, WirelessSsid, SsidFirewallL3Rules, SsidFirewallL7Rules,
    ApplianceVlan, MerakiL3FirewallRule, MerakiL7FirewallRule, SiteToSiteVpnSettings, ApplianceStaticRoute, BgpSettings,
    IntrusionSettings, MalwareSettings, ContentFilteringSettings, OrganizationAdmin, SnmpSettings,
    AlertSettings, ConfigTemplate, SyslogServer, SwitchStpSettings, LinkAggregation, WirelessSettings, RfProfile,
    PolicyObject, VpnPeer, VpnFirewallRule, WebhookHttpServer, NetworkSnmpSettings, Floorplan, ApplianceSettings,
    UplinkSelection, TrafficShapingRules, QosRule, DhcpServerPolicy, DscpToCosMappings, StormControlSettings, MtuSettings,
    SsidTrafficShapingRules, WirelessBluetoothSettings,
    BackupFile, DeviceConfigBackup, NetworkConfigBackup
} from '../types';

// The proxy endpoint is now explicitly set for local development.
const LOCAL_PROXY_URL = 'http://127.0.0.1:8787/api/proxy';

// --- Proactive Rate Limiter & Request Queue ---
const MAX_CONCURRENT_REQUESTS = 9; // Meraki allows 10/sec. We'll use 9 to be safe.
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000;
let activeRequests = 0;

// Queue to hold the functions that resolve the promises for each API call
const requestQueue: (() => void)[] = [];

// Processes the next request in the queue if a concurrency slot is available.
const processQueue = () => {
    if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
        return;
    }

    activeRequests++;
    const nextRequest = requestQueue.shift();
    if (nextRequest) {
        nextRequest();
    }
};

// --- Core API Fetch Logic (Internal) ---
const _fetchWithMerakiApi = async (
  apiKey: string,
  region: string,
  endpoint: string,
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET',
  body: Record<string, any> | null = null,
  signal?: AbortSignal
): Promise<any> => {
  const options: RequestInit = {
    method: 'POST', // All requests to our proxy are POST
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
        apiKey,
        region,
        endpoint,
        method,
        body
    })
  };

  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (signal?.aborted) {
            throw new Error("Operation aborted");
        }
        
        const response = await fetch(LOCAL_PROXY_URL, options);

        // --- Success Case ---
        if (response.ok) {
            // No Content success
            if (response.status === 204) {
                return { success: true };
            }
            return response.json();
        }

        // --- Graceful "Not Found" Case ---
        if (response.status === 404) {
            console.warn(`Meraki API returned 404 Not Found for endpoint: ${endpoint}. This is expected for optional configurations.`);
            return null; // Return null to indicate the resource is not available or applicable.
        }
       
        // --- Reactive Rate Limit Handling (429) ---
        if (response.status === 429) {
            const retryAfterSeconds = parseInt(response.headers.get('Retry-After') || '2', 10);
            const delay = retryAfterSeconds * 1000 + Math.random() * 500; // Add jitter
            console.warn(`Rate limit hit (429) for ${endpoint}. Retrying after ${retryAfterSeconds} seconds...`);
            if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Retry the loop
            }
        }
        
        // --- Retryable Server Errors ---
        if (response.status >= 500 && attempt < MAX_RETRIES) {
            const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 1000;
            console.warn(`Meraki API returned a server error (${response.status}) for ${endpoint}. Retrying attempt ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry the loop
        }

        // --- Final/Fatal Errors ---
        const errorData = await response.json().catch(() => ({}));
        const errorMessages = errorData.errors ? errorData.errors.join(', ') : `HTTP error! status: ${response.status}`;
        throw new Error(`Meraki API Error: ${errorMessages}`);
    }
  } catch (error) {
      if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
        // This error now means the local backend server is not running.
        (error as Error).message = 'Network request failed. Is the local backend proxy server running? (Check README for instructions)';
      }
      // Re-throw the (potentially modified) error
      throw error;
  }

  throw new Error(`Failed to fetch ${endpoint} after ${MAX_RETRIES + 1} attempts.`);
};


// --- Public API function that uses the rate-limiting queue ---
const fetchWithMerakiApi = async (
  apiKey: string,
  region: string,
  endpoint: string,
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET',
  body: Record<string, any> | null = null,
  signal?: AbortSignal
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const task = () => {
            _fetchWithMerakiApi(apiKey, region, endpoint, method, body, signal)
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    activeRequests--;
                    processQueue(); // A concurrency slot is now free, process the next item in the queue.
                });
        };
        
        requestQueue.push(task);
        processQueue(); // Try to process the queue immediately
    });
};


// --- Organization & General Device ---
export const getOrganizations = async (apiKey: string, region: string, signal?: AbortSignal): Promise<MerakiOrganization[]> => {
  const orgs = await fetchWithMerakiApi(apiKey, region, '/organizations', 'GET', null, signal);
  return Array.isArray(orgs) ? orgs : [];
};

export const getOrgNetworks = async (apiKey: string, region: string, orgId: string, signal?: AbortSignal): Promise<MerakiNetwork[]> => {
    const networks = await fetchWithMerakiApi(apiKey, region, `/organizations/${orgId}/networks`, 'GET', null, signal);
    return Array.isArray(networks) ? networks : [];
}

export const addDevicesToNetwork = async (apiKey: string, region: string, networkId: string, serials: string[]): Promise<any> => 
  fetchWithMerakiApi(apiKey, region, `/networks/${networkId}/devices/claim`, 'POST', { serials });

export const getOrgDevices = async (apiKey: string, region: string, orgId: string, signal?: AbortSignal): Promise<MerakiDeviceDetails[]> => {
  const [allDevices, statuses] = await Promise.all([
    fetchWithMerakiApi(apiKey, region, `/organizations/${orgId}/devices?perPage=1000`, 'GET', null, signal),
    fetchWithMerakiApi(apiKey, region, `/organizations/${orgId}/devices/statuses?perPage=1000`, 'GET', null, signal).catch(() => [])
  ]);
  
  // Guard against null/undefined responses which can happen on 404s (e.g., org with no devices).
  const safeDevices = Array.isArray(allDevices) ? allDevices : [];
  const safeStatuses = Array.isArray(statuses) ? statuses : [];

  const statusMap = new Map<string, string>(safeStatuses.map((s: any) => [s.serial, s.status]));
  return safeDevices.map((d: any) => ({ ...d, status: statusMap.get(d.serial) || 'unknown' }));
};

export const getNetworkDevices = async (apiKey: string, region: string, networkId: string, signal?: AbortSignal): Promise<MerakiDeviceDetails[]> => {
    const devices = await fetchWithMerakiApi(apiKey, region, `/networks/${networkId}/devices`, 'GET', null, signal);
    return Array.isArray(devices) ? devices : [];
};

export const removeDeviceFromNetwork = async (apiKey: string, region: string, networkId: string, serial: string): Promise<any> => 
  fetchWithMerakiApi(apiKey, region, `/networks/${networkId}/devices/remove`, 'POST', { serial });

export const getDevice = async (apiKey: string, region: string, serial: string): Promise<MerakiDeviceDetails> => 
  fetchWithMerakiApi(apiKey, region, `/devices/${serial}`);

export const updateDevice = async (apiKey: string, region: string, serial: string, body: Partial<MerakiDeviceDetails>): Promise<any> => 
  fetchWithMerakiApi(apiKey, region, `/devices/${serial}`, 'PUT', body);

// --- Inventory Management ---
export const unclaimDevicesFromInventory = (apiKey: string, r: string, oid: string, serials: string[]): Promise<any> => 
  fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/inventory/release`, 'POST', { serials });

export const claimDevicesToInventory = (apiKey: string, r: string, oid: string, serials: string[]): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/inventory/claim`, 'POST', { serials });


// --- Organization-Level ---
export const getOrganizationPolicyObjects = (apiKey: string, r: string, oid: string): Promise<PolicyObject[]> => fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/policyObjects`);
export const getThirdPartyVpnPeers = (apiKey: string, r: string, oid: string): Promise<VpnPeer[]> => fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/vpn/thirdPartyVPNPeers`);
export const updateThirdPartyVpnPeers = (apiKey: string, r: string, oid: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/vpn/thirdPartyVPNPeers`, 'PUT', body);
export const getVpnFirewallRules = (apiKey: string, r: string, oid: string): Promise<any> => fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/appliance/vpn/vpnFirewallRules`);
export const updateVpnFirewallRules = (apiKey: string, r: string, oid: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/appliance/vpn/vpnFirewallRules`, 'PUT', body);

// --- Network-Level ---
export const updateNetworkSettings = (apiKey: string, r: string, nid: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}`, 'PUT', body);
export const getNetworkWebhooks = (apiKey: string, r: string, nid: string): Promise<WebhookHttpServer[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/webhooks/httpServers`);
export const createNetworkWebhook = (apiKey: string, r: string, nid: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/webhooks/httpServers`, 'POST', body);
export const getNetworkSnmp = (apiKey: string, r: string, nid: string): Promise<NetworkSnmpSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/snmp`);
export const updateNetworkSnmp = (apiKey: string, r: string, nid: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/snmp`, 'PUT', body);
export const getNetworkFloorplans = (apiKey: string, r: string, nid: string): Promise<Floorplan[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/floorPlans`);
export const getNetworkGroupPolicies = (apiKey: string, r: string, nid: string): Promise<GroupPolicy[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/groupPolicies`);
export const createNetworkGroupPolicy = (apiKey: string, r: string, nid: string, body: GroupPolicy): Promise<GroupPolicy> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/groupPolicies`, 'POST', body);
export const deleteNetworkGroupPolicy = (apiKey: string, r: string, nid: string, gpId: string): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/groupPolicies/${gpId}`, 'DELETE');
export const getNetworkSyslogServers = (apiKey: string, r: string, nid: string): Promise<{servers: SyslogServer[]}> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/syslogServers`);
export const updateNetworkSyslogServers = (apiKey: string, r: string, nid: string, body: {servers: SyslogServer[]}): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/syslogServers`, 'PUT', body);
export const getNetworkAlertsSettings = (apiKey: string, r: string, nid: string): Promise<AlertSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/alerts/settings`);
export const updateNetworkAlertsSettings = (apiKey: string, r: string, nid: string, body: AlertSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/alerts/settings`, 'PUT', body);
export const getNetworkSettings = (apiKey: string, r: string, nid: string): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}`);

// --- Appliance (MX) ---
export const getNetworkApplianceSettings = (apiKey: string, r: string, nid: string): Promise<ApplianceSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/settings`);
export const updateNetworkApplianceSettings = (apiKey: string, r: string, nid: string, body: ApplianceSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/settings`, 'PUT', body);
export const getNetworkApplianceVlans = (apiKey: string, r: string, nid: string): Promise<ApplianceVlan[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vlans`);
export const createNetworkApplianceVlan = (apiKey: string, r: string, nid: string, body: Omit<ApplianceVlan, 'id'>): Promise<ApplianceVlan> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vlans`, 'POST', body);
export const getNetworkApplianceVlan = (apiKey: string, r: string, nid: string, vlanId: string): Promise<ApplianceVlan> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vlans/${vlanId}`);
export const updateNetworkApplianceVlansSettings = (apiKey: string, r: string, nid: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vlans/settings`, 'PUT', body);
export const getNetworkApplianceStaticRoutes = (apiKey: string, r: string, nid: string): Promise<ApplianceStaticRoute[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/staticRoutes`);
export const getNetworkApplianceStaticRoute = (apiKey: string, r: string, nid: string, routeId: string): Promise<ApplianceStaticRoute> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/staticRoutes/${routeId}`);
export const createNetworkApplianceStaticRoute = (apiKey: string, r: string, nid: string, body: Partial<ApplianceStaticRoute>): Promise<ApplianceStaticRoute> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/staticRoutes`, 'POST', body);
export const deleteNetworkApplianceStaticRoute = (apiKey: string, r: string, nid: string, rid: string): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/staticRoutes/${rid}`, 'DELETE');
export const getNetworkApplianceSecurityMalware = (apiKey: string, r: string, nid: string): Promise<MalwareSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/security/malware`);
export const updateNetworkApplianceSecurityMalware = (apiKey: string, r: string, nid: string, body: MalwareSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/security/malware`, 'PUT', body);
export const getNetworkApplianceSecurityIntrusion = (apiKey: string, r: string, nid: string): Promise<IntrusionSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/security/intrusion`);
export const updateNetworkApplianceSecurityIntrusion = (apiKey: string, r: string, nid: string, body: IntrusionSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/security/intrusion`, 'PUT', body);
export const getNetworkApplianceFirewallL3FirewallRules = (apiKey: string, r: string, nid: string): Promise<{ rules: MerakiL3FirewallRule[] }> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/firewall/l3FirewallRules`);
export const updateNetworkApplianceFirewallL3FirewallRules = (apiKey: string, r: string, nid: string, body: { rules: MerakiL3FirewallRule[] }): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/firewall/l3FirewallRules`, 'PUT', body);
export const getNetworkApplianceFirewallL7FirewallRules = (apiKey: string, r: string, nid: string): Promise<{ rules: MerakiL7FirewallRule[] }> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/firewall/l7FirewallRules`);
export const updateNetworkApplianceFirewallL7FirewallRules = (apiKey: string, r: string, nid: string, body: { rules: MerakiL7FirewallRule[] }): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/firewall/l7FirewallRules`, 'PUT', body);
export const getNetworkApplianceContentFiltering = (apiKey: string, r: string, nid: string): Promise<ContentFilteringSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/contentFiltering`);
export const updateNetworkApplianceContentFiltering = (apiKey: string, r: string, nid: string, body: ContentFilteringSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/contentFiltering`, 'PUT', body);
export const getNetworkApplianceVpnSiteToSiteVpn = (apiKey: string, r: string, nid: string): Promise<SiteToSiteVpnSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vpn/siteToSiteVpn`);
export const updateNetworkApplianceVpnSiteToSiteVpn = (apiKey: string, r: string, nid: string, body: SiteToSiteVpnSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vpn/siteToSiteVpn`, 'PUT', body);
export const getNetworkApplianceUplinkSelection = (apiKey: string, r: string, nid: string): Promise<UplinkSelection> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/trafficShaping/uplinkSelection`);
export const updateNetworkApplianceUplinkSelection = (apiKey: string, r: string, nid: string, body: UplinkSelection): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/trafficShaping/uplinkSelection`, 'PUT', body);
export const getNetworkApplianceTrafficShapingRules = (apiKey: string, r: string, nid: string): Promise<TrafficShapingRules> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/trafficShaping/rules`);
export const updateNetworkApplianceTrafficShapingRules = (apiKey: string, r: string, nid: string, body: TrafficShapingRules): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/trafficShaping/rules`, 'PUT', body);
export const getNetworkApplianceVpnBgp = (apiKey: string, r: string, nid: string): Promise<BgpSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vpn/bgp`);
export const updateNetworkApplianceVpnBgp = (apiKey: string, r: string, nid: string, body: BgpSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vpn/bgp`, 'PUT', body);

// --- Switch (MS) ---
export const getNetworkSwitchPortSchedules = (apiKey: string, r: string, nid: string): Promise<PortSchedule[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/portSchedules`);
export const getNetworkSwitchQosRules = (apiKey: string, r: string, nid: string): Promise<QosRule[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/qosRules`);
export const updateNetworkSwitchQosRules = (apiKey: string, r: string, nid: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/qosRules`, 'PUT', body);
export const getNetworkSwitchAccessPolicies = (apiKey: string, r: string, nid: string): Promise<AccessPolicy[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/accessPolicies`);
export const createNetworkSwitchAccessPolicy = (apiKey: string, r: string, nid: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/accessPolicies`, 'POST', body);
export const getSwitchPorts = (apiKey: string, r: string, serial: string): Promise<SwitchPortSettings[]> => fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/ports`);
export const getSwitchPort = (apiKey: string, r: string, serial: string, portId: string): Promise<SwitchPortSettings> => fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/ports/${portId}`);
export const updateSwitchPort = (apiKey: string, r: string, serial: string, portId: string, body: Omit<SwitchPortSettings, 'portId'>): Promise<any> => fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/ports/${portId}`, 'PUT', body);
export const getNetworkSwitchAccessControlLists = (apiKey: string, r: string, nid: string): Promise<AccessControlLists> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/accessControlLists`);
export const updateNetworkSwitchAccessControlLists = (apiKey: string, r: string, nid: string, body: AccessControlLists): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/accessControlLists`, 'PUT', body);
export const getNetworkSwitchDhcpServerPolicy = (apiKey: string, r: string, nid: string): Promise<DhcpServerPolicy> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/dhcpServerPolicy`);
export const updateNetworkSwitchDhcpServerPolicy = (apiKey: string, r: string, nid: string, body: DhcpServerPolicy): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/dhcpServerPolicy`, 'PUT', body);
export const getNetworkSwitchDscpToCosMappings = (apiKey: string, r: string, nid: string): Promise<DscpToCosMappings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/dscpToCosMappings`);
export const updateNetworkSwitchDscpToCosMappings = (apiKey: string, r: string, nid: string, body: DscpToCosMappings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/dscpToCosMappings`, 'PUT', body);
export const getNetworkSwitchStormControl = (apiKey: string, r: string, nid: string): Promise<StormControlSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/stormControl`);
export const updateNetworkSwitchStormControl = (apiKey: string, r: string, nid: string, body: StormControlSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/stormControl`, 'PUT', body);
export const getNetworkSwitchMtu = (apiKey: string, r: string, nid: string): Promise<MtuSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/mtu`);
export const updateNetworkSwitchMtu = (apiKey: string, r: string, nid: string, body: MtuSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/mtu`, 'PUT', body);
export const getNetworkSwitchLinkAggregations = (apiKey: string, r: string, nid: string): Promise<LinkAggregation[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/linkAggregations`);
export const createNetworkSwitchLinkAggregation = (apiKey: string, r: string, nid: string, body: LinkAggregation): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/linkAggregations`, 'POST', body);
export const getNetworkSwitchOspf = (apiKey: string, r: string, nid: string): Promise<OspfSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/ospf`);
export const updateNetworkSwitchOspf = (apiKey: string, r: string, nid: string, body: OspfSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/ospf`, 'PUT', body);
export const getDeviceSwitchRoutingStaticRoutes = (apiKey: string, r: string, serial: string): Promise<SwitchStaticRoute[]> => fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/routing/staticRoutes`);
export const updateDeviceSwitchRoutingStaticRoute = (apiKey: string, r: string, serial: string, routeId: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/routing/staticRoutes/${routeId}`, 'PUT', body);
export const getDeviceSwitchRoutingInterfaces = (apiKey: string, r: string, serial: string): Promise<SwitchRoutingInterface[]> => fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/routing/interfaces`);
export const updateDeviceSwitchRoutingInterface = (apiKey: string, r: string, serial: string, interfaceId: string, body: any): Promise<any> => fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/routing/interfaces/${interfaceId}`, 'PUT', body);
export const getNetworkSwitchSettings = (apiKey: string, r: string, nid: string): Promise<SwitchSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/settings`);
export const updateNetworkSwitchSettings = (apiKey: string, r: string, nid: string, body: SwitchSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/settings`, 'PUT', body);

// --- Wireless (MR) ---
export const getNetworkWirelessSsids = (apiKey: string, r: string, nid: string): Promise<WirelessSsid[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/ssids`);
export const updateNetworkWirelessSsid = (apiKey: string, r: string, nid: string, ssidNum: number, body: Partial<WirelessSsid>): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/ssids/${ssidNum}`, 'PUT', body);
export const getNetworkWirelessSsidFirewallL3Rules = (apiKey: string, r: string, nid: string, ssidNum: number): Promise<SsidFirewallL3Rules> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/ssids/${ssidNum}/firewall/l3FirewallRules`);
export const updateNetworkWirelessSsidFirewallL3Rules = (apiKey: string, r: string, nid: string, ssidNum: number, body: SsidFirewallL3Rules): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/ssids/${ssidNum}/firewall/l3FirewallRules`, 'PUT', body);
export const getNetworkWirelessSsidFirewallL7Rules = (apiKey: string, r: string, nid: string, ssidNum: number): Promise<SsidFirewallL7Rules> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/ssids/${ssidNum}/firewall/l7FirewallRules`);
export const updateNetworkWirelessSsidFirewallL7Rules = (apiKey: string, r: string, nid: string, ssidNum: number, body: SsidFirewallL7Rules): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/ssids/${ssidNum}/firewall/l7FirewallRules`, 'PUT', body);
export const getNetworkWirelessSsidTrafficShapingRules = (apiKey: string, r: string, nid: string, ssidNum: number): Promise<SsidTrafficShapingRules> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/ssids/${ssidNum}/trafficShaping/rules`);
export const updateNetworkWirelessSsidTrafficShapingRules = (apiKey: string, r: string, nid: string, ssidNum: number, body: SsidTrafficShapingRules): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/ssids/${ssidNum}/trafficShaping/rules`, 'PUT', body);
export const getNetworkWirelessRfProfiles = (apiKey: string, r: string, nid: string): Promise<RfProfile[]> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/rfProfiles`);
export const createNetworkWirelessRfProfile = (apiKey: string, r: string, nid: string, body: RfProfile): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/rfProfiles`, 'POST', body);
export const getNetworkWirelessBluetoothSettings = (apiKey: string, r: string, nid: string): Promise<WirelessBluetoothSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/bluetooth/settings`);
export const updateNetworkWirelessBluetoothSettings = (apiKey: string, r: string, nid: string, body: WirelessBluetoothSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/bluetooth/settings`, 'PUT', body);
export const getNetworkWirelessSettings = (apiKey: string, r: string, nid: string): Promise<WirelessSettings> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/settings`);
export const updateNetworkWirelessSettings = (apiKey: string, r: string, nid: string, body: WirelessSettings): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/settings`, 'PUT', body);


// --- Selective Backup Engine ---
export const createSelectiveBackup = async (
    apiKey: string,
    region: string,
    organization: MerakiOrganization,
    devices: MerakiDeviceDetails[],
    logCallback: (message: string) => void
): Promise<Blob> => {
    logCallback("--- Starting Selective Backup ---");

    const backupFile: Partial<BackupFile> = {
        createdAt: new Date().toISOString(),
        sourceOrgId: organization.id,
        sourceOrgName: organization.name,
        devices: [],
        networkConfigs: {},
        organizationConfig: {},
    };
    
    const getErrorMessage = (e: unknown) => e instanceof Error ? e.message : String(e);

    // 1. Fetch organization-level configs (can be a smaller subset than exhaustive)
    logCallback("Backing up key organization-level configurations...");
    try {
        const [policyObjects, snmp] = await Promise.all([
            getOrganizationPolicyObjects(apiKey, region, organization.id).catch(() => null),
            fetchWithMerakiApi(apiKey, region, `/organizations/${organization.id}/snmp`).catch(() => null)
        ]);
        backupFile.organizationConfig = { policyObjects, snmp };
        logCallback("  - ✅ Organization configs backed up.");
    } catch (e) {
        logCallback(`  - ❌ FAILED to back up organization configs: ${getErrorMessage(e)}`);
    }

    // 2. Identify unique networks and back them up
    const networkIds = [...new Set(devices.map(d => d.networkId).filter(Boolean))];
    logCallback(`Found ${networkIds.length} unique networks to back up.`);

    for (const networkId of networkIds) {
        logCallback(`--- Backing up Network ID: ${networkId} ---`);
        try {
            // Fetch a subset of network configs
            const [groupPolicies, ssids, applianceVlans, l3FirewallRules, siteToSiteVpn] = await Promise.all([
                getNetworkGroupPolicies(apiKey, region, networkId as string).catch(() => null),
                getNetworkWirelessSsids(apiKey, region, networkId as string).catch(() => null),
                getNetworkApplianceVlans(apiKey, region, networkId as string).catch(() => null),
                getNetworkApplianceFirewallL3FirewallRules(apiKey, region, networkId as string).catch(() => null),
                getNetworkApplianceVpnSiteToSiteVpn(apiKey, region, networkId as string).catch(() => null)
            ]);
            backupFile.networkConfigs![networkId as string] = { groupPolicies, ssids, applianceVlans, applianceL3FirewallRules: l3FirewallRules, siteToSiteVpnSettings: siteToSiteVpn };
            logCallback(`  - ✅ Network ${networkId} configs backed up.`);
        } catch (e) {
            logCallback(`  - ❌ FAILED to back up network ${networkId}: ${getErrorMessage(e)}`);
        }
    }

    // 3. Back up each selected device
    logCallback(`--- Backing up ${devices.length} selected devices ---`);
    for (const device of devices) {
        logCallback(`Backing up device: ${device.name} (${device.serial})`);
        try {
            const deviceConfig: Partial<DeviceConfigBackup> = { general: device };
            if (device.model.startsWith("MS")) {
                deviceConfig.switchPorts = await getSwitchPorts(apiKey, region, device.serial).catch(() => []);
                deviceConfig.routingInterfaces = await getDeviceSwitchRoutingInterfaces(apiKey, region, device.serial).catch(() => []);
                deviceConfig.staticRoutes = await getDeviceSwitchRoutingStaticRoutes(apiKey, region, device.serial).catch(() => []);
            }
            
            backupFile.devices!.push({ serial: device.serial, config: deviceConfig as DeviceConfigBackup });
            logCallback(`  - ✅ Device ${device.serial} backed up.`);
        } catch (e) {
            logCallback(`  - ❌ FAILED to back up device ${device.serial}: ${getErrorMessage(e)}`);
        }
    }

    logCallback("--- Finalizing backup file ---");
    const jsonString = JSON.stringify(backupFile, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
};


// --- Full Backup Engine ---
export const createExhaustiveBackup = async (
    apiKey: string, 
    region: string, 
    orgId: string, 
    logCallback: (message: string) => void
): Promise<Blob> => {
    const zip = new JSZip();
    const safeFilename = (name: string) => name.replace(/[^a-z0-9_.-]/gi, '_');

    const getAndZip = async (path: string, apiCall: () => Promise<any>) => {
        try {
            const data = await apiCall();
            if (data !== null && data !== undefined && (!Array.isArray(data) || data.length > 0)) {
                zip.file(path, JSON.stringify(data, null, 2));
                logCallback(`  - ✅ Success: ${path}`);
            } else {
                logCallback(`  - ⏩ Skipped (no data/not configured): ${path}`);
            }
        } catch (error) {
            logCallback(`  - ❌ FAILED: ${path} (${error instanceof Error ? error.message : 'Unknown error'})`);
        }
    };

    logCallback("--- Starting Exhaustive Backup ---");
    logCallback("Fetching core inventories (Networks and Devices)...");
    const [networks, devices] = await Promise.all([
        getOrgNetworks(apiKey, region, orgId),
        getOrgDevices(apiKey, region, orgId)
    ]);
    logCallback(`Found ${networks.length} networks and ${devices.length} devices.`);

    // --- Organization Level ---
    logCallback("\n--- Backing up Organization-level configurations ---");
    const orgEndpoints = [
        { path: `/organizations/${orgId}`, name: 'details'},
        { path: `/organizations/${orgId}/admins`, name: 'admins'},
        { path: `/organizations/${orgId}/alerts/profiles`, name: 'alerts_profiles'},
        { path: `/organizations/${orgId}/apiRequests`, name: 'apiRequests_summary'},
        { path: `/organizations/${orgId}/brandingPolicies`, name: 'brandingPolicies'},
        { path: `/organizations/${orgId}/brandingPolicies/priorities`, name: 'brandingPolicies_priorities'},
        { path: `/organizations/${orgId}/configTemplates`, name: 'configTemplates'},
        { path: `/organizations/${orgId}/inventory/devices`, name: 'inventory_devices'},
        { path: `/organizations/${orgId}/licenses`, name: 'licenses'},
        { path: `/organizations/${orgId}/loginSecurity`, name: 'loginSecurity'},
        { path: `/organizations/${orgId}/policyObjects`, name: 'policyObjects'},
        { path: `/organizations/${orgId}/policyObjects/groups`, name: 'policyObjects_groups'},
        { path: `/organizations/${orgId}/saml/roles`, name: 'saml_roles'},
        { path: `/organizations/${orgId}/snmp`, name: 'snmp'},
        { path: `/organizations/${orgId}/appliance/vpn/thirdPartyVPNPeers`, name: 'appliance_vpn_thirdPartyVPNPeers'},
        { path: `/organizations/${orgId}/appliance/vpn/vpnFirewallRules`, name: 'appliance_vpn_vpnFirewallRules'},
        { path: `/organizations/${orgId}/appliance/security/intrusion`, name: 'appliance_security_intrusion'},
        { path: `/organizations/${orgId}/earlyAccess/features`, name: 'earlyAccess_features'},
        { path: `/organizations/${orgId}/webhooks/alertTypes`, name: 'webhooks_alertTypes'},
    ];
    await Promise.all(orgEndpoints.map(endpoint => 
        getAndZip(`organization/${endpoint.name}.json`, () => fetchWithMerakiApi(apiKey, region, endpoint.path))
    ));
    
    // --- Network Level ---
    const networkEndpoints = [
        { path: ``, name: 'details' },
        { path: `/alerts/settings`, name: 'alerts_settings' },
        { path: `/bluetoothClients`, name: 'bluetoothClients' },
        { path: `/events/eventTypes`, name: 'events_eventTypes' },
        { path: `/floorPlans`, name: 'floorPlans' },
        { path: `/groupPolicies`, name: 'groupPolicies' },
        { path: `/merakiAuthUsers`, name: 'merakiAuthUsers' },
        { path: `/netflow`, name: 'netflow' },
        { path: `/pii/piiKeys`, name: 'pii_piiKeys' },
        { path: `/settings`, name: 'settings' },
        { path: `/snmp`, name: 'snmp' },
        { path: `/syslogServers`, name: 'syslogServers' },
        { path: `/trafficAnalysis`, name: 'trafficAnalysis' },
        { path: `/trafficShaping/applicationCategories`, name: 'trafficShaping_applicationCategories' },
        { path: `/trafficShaping/dscpTaggingOptions`, name: 'trafficShaping_dscpTaggingOptions' },
        { path: `/vlanProfiles`, name: 'vlanProfiles' },
        { path: `/webhooks/httpServers`, name: 'webhooks_httpServers' },
        { path: `/webhooks/payloadTemplates`, name: 'webhooks_payloadTemplates' },
    ];

    for (const network of networks) {
        logCallback(`\n--- Backing up Network: ${network.name} (${network.id}) ---`);
        const netFolder = `networks/${safeFilename(network.name)}_${network.id}`;
        
        await Promise.all(networkEndpoints.map(endpoint =>
            getAndZip(`${netFolder}/${endpoint.name}.json`, () => fetchWithMerakiApi(apiKey, region, `/networks/${network.id}${endpoint.path}`))
        ));

        if (network.productTypes.includes('appliance')) {
            const applianceEndpoints = [
                { path: `/appliance/connectivityMonitoringDestinations`, name: 'appliance_connectivityMonitoringDestinations' },
                { path: `/appliance/contentFiltering`, name: 'appliance_contentFiltering' },
                { path: `/appliance/firewall/cellularFirewallRules`, name: 'appliance_firewall_cellularFirewallRules' },
                { path: `/appliance/firewall/inboundFirewallRules`, name: 'appliance_firewall_inboundFirewallRules' },
                { path: `/appliance/firewall/l3FirewallRules`, name: 'appliance_firewall_l3FirewallRules' },
                { path: `/appliance/firewall/l7FirewallRules`, name: 'appliance_firewall_l7FirewallRules' },
                { path: `/appliance/firewall/oneToManyNatRules`, name: 'appliance_firewall_oneToManyNatRules' },
                { path: `/appliance/firewall/oneToOneNatRules`, name: 'appliance_firewall_oneToOneNatRules' },
                { path: `/appliance/firewall/portForwardingRules`, name: 'appliance_firewall_portForwardingRules' },
                { path: `/appliance/security/intrusion`, name: 'appliance_security_intrusion' },
                { path: `/appliance/security/malware`, name: 'appliance_security_malware' },
                { path: `/appliance/settings`, name: 'appliance_settings' },
                { path: `/appliance/staticRoutes`, name: 'appliance_staticRoutes' },
                { path: `/appliance/trafficShaping`, name: 'appliance_trafficShaping' },
                { path: `/appliance/trafficShaping/customPerformanceClasses`, name: 'appliance_trafficShaping_customPerformanceClasses' },
                { path: `/appliance/trafficShaping/rules`, name: 'appliance_trafficShaping_rules' },
                { path: `/appliance/trafficShaping/uplinkSelection`, name: 'appliance_trafficShaping_uplinkSelection' },
                { path: `/appliance/uplinks/settings`, name: 'appliance_uplinks_settings' },
                { path: `/appliance/vlans`, name: 'appliance_vlans' },
                { path: `/appliance/vlans/settings`, name: 'appliance_vlans_settings' },
                { path: `/appliance/vpn/bgp`, name: 'appliance_vpn_bgp' },
                { path: `/appliance/vpn/siteToSiteVpn`, name: 'appliance_vpn_siteToSiteVpn' },
            ];
            await Promise.all(applianceEndpoints.map(endpoint =>
                getAndZip(`${netFolder}/${endpoint.name}.json`, () => fetchWithMerakiApi(apiKey, region, `/networks/${network.id}${endpoint.path}`))
            ));
        }
        
        if (network.productTypes.includes('switch')) {
            const switchEndpoints = [
                { path: `/switch/accessControlLists`, name: 'switch_accessControlLists' },
                { path: `/switch/accessPolicies`, name: 'switch_accessPolicies' },
                { path: `/switch/dhcpServerPolicy`, name: 'switch_dhcpServerPolicy' },
                { path: `/switch/dscpToCosMappings`, name: 'switch_dscpToCosMappings' },
                { path: `/switch/linkAggregations`, name: 'switch_linkAggregations' },
                { path: `/switch/mtu`, name: 'switch_mtu' },
                { path: `/switch/ospf`, name: 'switch_ospf' },
                { path: `/switch/portSchedules`, name: 'switch_portSchedules' },
                { path: `/switch/qosRules`, name: 'switch_qosRules' },
                { path: `/switch/settings`, name: 'switch_settings' },
                { path: `/switch/stormControl`, name: 'switch_stormControl' },
                { path: `/switch/stp`, name: 'switch_stp' },
            ];
            await Promise.all(switchEndpoints.map(endpoint =>
                getAndZip(`${netFolder}/${endpoint.name}.json`, () => fetchWithMerakiApi(apiKey, region, `/networks/${network.id}${endpoint.path}`))
            ));
        }

        if (network.productTypes.includes('wireless')) {
            const wirelessEndpoints = [
                { path: `/wireless/alternateManagementInterface`, name: 'wireless_alternateManagementInterface' },
                { path: `/wireless/billing`, name: 'wireless_billing' },
                { path: `/wireless/bluetooth/settings`, name: 'wireless_bluetooth_settings' },
                { path: `/wireless/rfProfiles`, name: 'wireless_rfProfiles' },
                { path: `/wireless/settings`, name: 'wireless_settings' },
                { path: `/wireless/ssids`, name: 'wireless_ssids' },
            ];
            await Promise.all(wirelessEndpoints.map(endpoint =>
                getAndZip(`${netFolder}/${endpoint.name}.json`, () => fetchWithMerakiApi(apiKey, region, `/networks/${network.id}${endpoint.path}`))
            ));

            const ssids = await fetchWithMerakiApi(apiKey, region, `/networks/${network.id}/wireless/ssids`);
            if (Array.isArray(ssids)) {
                for (const ssid of ssids) {
                    const ssidEndpoints = [
                        { path: `/wireless/ssids/${ssid.number}/bonjourForwarding`, name: `wireless_ssid_${ssid.number}_bonjourForwarding` },
                        { path: `/wireless/ssids/${ssid.number}/deviceTypeGroupPolicies`, name: `wireless_ssid_${ssid.number}_deviceTypeGroupPolicies` },
                        { path: `/wireless/ssids/${ssid.number}/firewall/l3FirewallRules`, name: `wireless_ssid_${ssid.number}_firewall_l3FirewallRules` },
                        { path: `/wireless/ssids/${ssid.number}/firewall/l7FirewallRules`, name: `wireless_ssid_${ssid.number}_firewall_l7FirewallRules` },
                        { path: `/wireless/ssids/${ssid.number}/hotspot20`, name: `wireless_ssid_${ssid.number}_hotspot20` },
                        { path: `/wireless/ssids/${ssid.number}/identityPsks`, name: `wireless_ssid_${ssid.number}_identityPsks` },
                        { path: `/wireless/ssids/${ssid.number}/schedules`, name: `wireless_ssid_${ssid.number}_schedules` },
                        { path: `/wireless/ssids/${ssid.number}/splash/settings`, name: `wireless_ssid_${ssid.number}_splash_settings` },
                        { path: `/wireless/ssids/${ssid.number}/trafficShaping/rules`, name: `wireless_ssid_${ssid.number}_trafficShaping_rules` },
                        { path: `/wireless/ssids/${ssid.number}/vpn`, name: `wireless_ssid_${ssid.number}_vpn` },
                    ];
                    await Promise.all(ssidEndpoints.map(endpoint =>
                        getAndZip(`${netFolder}/${endpoint.name}.json`, () => fetchWithMerakiApi(apiKey, region, `/networks/${network.id}${endpoint.path}`))
                    ));
                }
            }
        }
    }

    // --- Device Level ---
    for (const device of devices) {
        logCallback(`\n--- Backing up Device: ${device.name} (${device.serial}) ---`);
        const deviceFolder = `devices/${safeFilename(device.name)}_${device.serial}`;
        
        await getAndZip(`${deviceFolder}/details.json`, () => Promise.resolve(device));

        if (device.model.startsWith("MS")) {
            const switchDeviceEndpoints = [
                { path: `/switch/ports`, name: 'switch_ports' },
                { path: `/switch/ports/statuses`, name: 'switch_ports_statuses' },
                { path: `/switch/routing/interfaces`, name: 'switch_routing_interfaces' },
                { path: `/switch/routing/staticRoutes`, name: 'switch_routing_staticRoutes' },
            ];
            await Promise.all(switchDeviceEndpoints.map(endpoint =>
                getAndZip(`${deviceFolder}/${endpoint.name}.json`, () => fetchWithMerakiApi(apiKey, region, `/devices/${device.serial}${endpoint.path}`))
            ));
        } else if (device.model.startsWith("MR")) {
            await getAndZip(`${deviceFolder}/wireless_radio_settings.json`, () => fetchWithMerakiApi(apiKey, region, `/devices/${device.serial}/wireless/radio/settings`));
        } else if (device.model.startsWith("MX") || device.model.startsWith("Z")) {
            await getAndZip(`${deviceFolder}/appliance_uplink_settings.json`, () => fetchWithMerakiApi(apiKey, region, `/devices/${device.serial}/appliance/uplink/settings`));
        }
    }
    
    logCallback("\n--- Generating backup ZIP file ---");
    const blob = await zip.generateAsync({ type: "blob" });
    logCallback("--- ✅ Backup process complete! ---");
    return blob;
};


// --- Restore Engines ---

export const restoreDeviceConfiguration = async (
    apiKey: string,
    region: string,
    serial: string,
    deviceConfig: DeviceConfigBackup,
    log: (msg: string) => void
): Promise<boolean> => {
    try {
        log(`  - Restoring general settings for ${serial} (Name: ${deviceConfig.general.name})...`);
        const { name, tags, notes } = deviceConfig.general;
        await updateDevice(apiKey, region, serial, { name, tags, notes });
        log(`    ✅ General settings restored.`);

        if (deviceConfig.switchPorts && deviceConfig.switchPorts.length > 0) {
            log(`  - Found ${deviceConfig.switchPorts.length} switch port configurations to restore...`);
            for (const port of deviceConfig.switchPorts) {
                try {
                    const { portId, ...portConfig } = port;
                    await updateSwitchPort(apiKey, region, serial, portId, portConfig);
                    log(`    ✅ Port ${portId} configuration restored.`);
                } catch (portError) {
                    log(`    ❌ FAILED to restore port ${port.portId}: ${portError instanceof Error ? portError.message : String(portError)}`);
                }
            }
        }
        return true;
    } catch (e) {
        log(`  - ❌ FAILED to restore device configuration for ${serial}: ${e instanceof Error ? e.message : String(e)}`);
        return false;
    }
};


export const restoreNetworkConfiguration = async (
    apiKey: string,
    region: string,
    networkId: string,
    networkConfig: NetworkConfigBackup,
    log: (msg: string) => void
): Promise<number> => {
    let successCount = 0;
    
    // Helper to run and log a restore operation
    const runRestore = async (name: string, backupData: any, restoreFn: () => Promise<any>) => {
        if (backupData && (!Array.isArray(backupData) || backupData.length > 0)) {
            log(`  - Restoring ${name}...`);
            try {
                await restoreFn();
                log(`    ✅ ${name} restored successfully.`);
                successCount++;
            } catch (e) {
                log(`    ❌ FAILED to restore ${name}: ${e instanceof Error ? e.message : String(e)}`);
            }
        } else {
            log(`  - ⏩ Skipping ${name} (no backup data).`);
        }
    };

    // --- Restore Network-level settings ---
    await runRestore('VLANs', networkConfig.applianceVlans, async () => {
        if (networkConfig.applianceVlans) {
            for (const vlan of networkConfig.applianceVlans) {
                // Destructure to remove properties that can't be in the POST body
                const { id, networkId: sourceNetId, ...vlanData } = vlan;
                // Don't try to create VLAN 1, it always exists
                if (String(id) !== "1") {
                    await createNetworkApplianceVlan(apiKey, region, networkId, vlanData);
                }
            }
        }
    });

    await runRestore('L3 Firewall Rules', networkConfig.applianceL3FirewallRules, () =>
        updateNetworkApplianceFirewallL3FirewallRules(apiKey, region, networkId, networkConfig.applianceL3FirewallRules!)
    );

    await runRestore('Site-to-Site VPN', networkConfig.siteToSiteVpnSettings, () =>
        updateNetworkApplianceVpnSiteToSiteVpn(apiKey, region, networkId, networkConfig.siteToSiteVpnSettings!)
    );
    
    // Restore Group Policies
    if (networkConfig.groupPolicies && networkConfig.groupPolicies.length > 0) {
        log(`  - Restoring ${networkConfig.groupPolicies.length} Group Policies...`);
        for (const policy of networkConfig.groupPolicies) {
            try {
                // Remove the ID as we need to create a new one
                const { groupPolicyId, ...policyData } = policy;
                await createNetworkGroupPolicy(apiKey, region, networkId, policyData);
                log(`    ✅ Group Policy "${policy.name}" restored.`);
                successCount++;
            } catch(e) {
                 log(`    ❌ FAILED to restore Group Policy "${policy.name}": ${e instanceof Error ? e.message : String(e)}`);
            }
        }
    }
    
    // Restore SSIDs
    if (networkConfig.ssids && networkConfig.ssids.length > 0) {
        log(`  - Restoring ${networkConfig.ssids.length} SSIDs...`);
        // First, fetch existing SSIDs in the destination to see which ones we can update
        const destSsids = await getNetworkWirelessSsids(apiKey, region, networkId);

        for (const ssid of networkConfig.ssids) {
            try {
                // Find a matching SSID number in the destination
                const destSsid = destSsids.find(ds => ds.number === ssid.number);
                if (destSsid) {
                    await updateNetworkWirelessSsid(apiKey, region, networkId, ssid.number, ssid);
                    log(`    ✅ SSID "${ssid.name}" (Number: ${ssid.number}) updated successfully.`);
                    successCount++;
                } else {
                    log(`    ⚠️ Could not find a destination SSID with number ${ssid.number} to update.`);
                }
            } catch(e) {
                log(`    ❌ FAILED to restore SSID "${ssid.name}": ${e instanceof Error ? e.message : String(e)}`);
            }
        }
    }

    return successCount;
};