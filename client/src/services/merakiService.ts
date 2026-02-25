import JSZip from "jszip";
import {
  MerakiDevice,
  MerakiNetwork,
  MerakiOrganization,
  MerakiDeviceDetails,
  GroupPolicy,
  SwitchPortSettings,
  ManagementInterfaceSettings,
  DeviceWirelessRadioSettings,
  ApplianceUplinkSettings,
  SwitchStack,
  SwitchRoutingInterface,
  SwitchStaticRoute,
  OspfSettings,
  AccessControlLists,
  AccessPolicy,
  PortSchedule,
  SwitchSettings,
  WirelessSsid,
  SsidFirewallL3Rules,
  SsidFirewallL7Rules,
  ApplianceVlan,
  MerakiL3FirewallRule,
  MerakiL7FirewallRule,
  SiteToSiteVpnSettings,
  ApplianceStaticRoute,
  BgpSettings,
  IntrusionSettings,
  MalwareSettings,
  ContentFilteringSettings,
  OrganizationAdmin,
  SnmpSettings,
  AlertSettings,
  ConfigTemplate,
  SyslogServer,
  SwitchStpSettings,
  LinkAggregation,
  WirelessSettings,
  RfProfile,
  PolicyObject,
  VpnPeer,
  VpnFirewallRule,
  WebhookHttpServer,
  NetworkSnmpSettings,
  Floorplan,
  ApplianceSettings,
  UplinkSelection,
  TrafficShapingRules,
  QosRule,
  DhcpServerPolicy,
  DscpToCosMappings,
  StormControlSettings,
  MtuSettings,
  SsidTrafficShapingRules,
  WirelessBluetoothSettings,
  BackupFile,
  DeviceConfigBackup,
  NetworkConfigBackup,
  OrgConfigBackup,
  RestoreCategories,
} from "../types/types";

// The proxy endpoint is now explicitly set for local development.
const LOCAL_PROXY_URL = "http://127.0.0.1:8787/api/proxy";

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
  method: "GET" | "PUT" | "POST" | "DELETE" = "GET",
  body: Record<string, any> | null = null,
  signal?: AbortSignal,
): Promise<any> => {
  const options: RequestInit = {
    method: "POST", // All requests to our proxy are POST
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      apiKey,
      region,
      endpoint,
      method,
      body,
    }),
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
        console.warn(
          `Meraki API returned 404 Not Found for endpoint: ${endpoint}. This is expected for optional configurations.`,
        );
        return null; // Return null to indicate the resource is not available or applicable.
      }

      // --- Reactive Rate Limit Handling (429) ---
      if (response.status === 429) {
        const retryAfterSeconds = parseInt(
          response.headers.get("Retry-After") || "2",
          10,
        );
        const delay = retryAfterSeconds * 1000 + Math.random() * 500; // Add jitter
        console.warn(
          `Rate limit hit (429) for ${endpoint}. Retrying after ${retryAfterSeconds} seconds...`,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry the loop
        }
      }

      // --- Retryable Server Errors ---
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const delay =
          INITIAL_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(
          `Meraki API returned a server error (${response.status}) for ${endpoint}. Retrying attempt ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay / 1000)}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Retry the loop
      }

      // --- Final/Fatal Errors ---
      const errorData = await response.json().catch(() => ({}));
      const errorMessages = errorData.errors
        ? errorData.errors.join(", ")
        : `HTTP error! status: ${response.status}`;
      throw new Error(`Meraki API Error: ${errorMessages}`);
    }
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message.toLowerCase().includes("failed to fetch")
    ) {
      // This error now means the local backend server is not running.
      (error as Error).message =
        "Network request failed. Is the local backend proxy server running? (Check README for instructions)";
    }
    // Re-throw the (potentially modified) error
    throw error;
  }

  throw new Error(
    `Failed to fetch ${endpoint} after ${MAX_RETRIES + 1} attempts.`,
  );
};

// --- Public API function that uses the rate-limiting queue ---
const fetchWithMerakiApi = async (
  apiKey: string,
  region: string,
  endpoint: string,
  method: "GET" | "PUT" | "POST" | "DELETE" = "GET",
  body: Record<string, any> | null = null,
  signal?: AbortSignal,
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
export const getOrganizations = async (
  apiKey: string,
  region: string,
  signal?: AbortSignal,
): Promise<MerakiOrganization[]> => {
  const orgs = await fetchWithMerakiApi(
    apiKey,
    region,
    "/organizations",
    "GET",
    null,
    signal,
  );
  return Array.isArray(orgs) ? orgs : [];
};

export const getOrgNetworks = async (
  apiKey: string,
  region: string,
  orgId: string,
  signal?: AbortSignal,
): Promise<MerakiNetwork[]> => {
  const networks = await fetchWithMerakiApi(
    apiKey,
    region,
    `/organizations/${orgId}/networks`,
    "GET",
    null,
    signal,
  );
  return Array.isArray(networks) ? networks : [];
};

export const addDevicesToNetwork = async (
  apiKey: string,
  region: string,
  networkId: string,
  serials: string[],
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    region,
    `/networks/${networkId}/devices/claim`,
    "POST",
    { serials },
  );

export const getOrgDevices = async (
  apiKey: string,
  region: string,
  orgId: string,
  signal?: AbortSignal,
): Promise<MerakiDeviceDetails[]> => {
  const [allDevices, statuses] = await Promise.all([
    fetchWithMerakiApi(
      apiKey,
      region,
      `/organizations/${orgId}/devices?perPage=1000`,
      "GET",
      null,
      signal,
    ),
    fetchWithMerakiApi(
      apiKey,
      region,
      `/organizations/${orgId}/devices/statuses?perPage=1000`,
      "GET",
      null,
      signal,
    ).catch(() => []),
  ]);

  // Guard against null/undefined responses which can happen on 404s (e.g., org with no devices).
  const safeDevices = Array.isArray(allDevices) ? allDevices : [];
  const safeStatuses = Array.isArray(statuses) ? statuses : [];

  const statusMap = new Map<string, string>(
    safeStatuses.map((s: any) => [s.serial, s.status]),
  );
  return safeDevices.map((d: any) => ({
    ...d,
    status: statusMap.get(d.serial) || "unknown",
  }));
};

export const getNetworkDevices = async (
  apiKey: string,
  region: string,
  networkId: string,
  signal?: AbortSignal,
): Promise<MerakiDeviceDetails[]> => {
  const devices = await fetchWithMerakiApi(
    apiKey,
    region,
    `/networks/${networkId}/devices`,
    "GET",
    null,
    signal,
  );
  return Array.isArray(devices) ? devices : [];
};

export const removeDeviceFromNetwork = async (
  apiKey: string,
  region: string,
  networkId: string,
  serial: string,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    region,
    `/networks/${networkId}/devices/remove`,
    "POST",
    { serial },
  );

export const getDevice = async (
  apiKey: string,
  region: string,
  serial: string,
): Promise<MerakiDeviceDetails> =>
  fetchWithMerakiApi(apiKey, region, `/devices/${serial}`);

export const updateDevice = async (
  apiKey: string,
  region: string,
  serial: string,
  body: Partial<MerakiDeviceDetails>,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, region, `/devices/${serial}`, "PUT", body);

// --- Inventory Management ---
export const unclaimDevicesFromInventory = (
  apiKey: string,
  r: string,
  oid: string,
  serials: string[],
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${oid}/inventory/release`,
    "POST",
    { serials },
  );

export const claimDevicesToInventory = (
  apiKey: string,
  r: string,
  oid: string,
  serials: string[],
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${oid}/inventory/claim`,
    "POST",
    { serials },
  );

// --- Organization-Level ---
export const getOrganization = (
  apiKey: string,
  r: string,
  oid: string,
): Promise<any> => fetchWithMerakiApi(apiKey, r, `/organizations/${oid}`);
export const updateOrganization = (
  apiKey: string,
  r: string,
  oid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${oid}`, "PUT", body);
export const updateOrganizationBrandingPoliciesPriorities = (
  apiKey: string,
  r: string,
  oid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${oid}/brandingPolicies/priorities`,
    "PUT",
    body,
  );
export const updateOrganizationApplianceSecurityIntrusion = (
  apiKey: string,
  r: string,
  oid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${oid}/appliance/security/intrusion`,
    "PUT",
    body,
  );
export const getOrganizationAdmins = (
  apiKey: string,
  r: string,
  oid: string,
): Promise<OrganizationAdmin[]> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/admins`);
export const createOrganizationAdmin = (
  apiKey: string,
  r: string,
  oid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/admins`, "POST", body);
export const getOrganizationSnmp = (
  apiKey: string,
  r: string,
  oid: string,
): Promise<SnmpSettings> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/snmp`);
export const updateOrganizationSnmp = (
  apiKey: string,
  r: string,
  oid: string,
  body: SnmpSettings,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/snmp`, "PUT", body);
export const getOrganizationPolicyObjects = (
  apiKey: string,
  r: string,
  oid: string,
): Promise<PolicyObject[]> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/policyObjects`);
export const createOrganizationPolicyObject = (
  apiKey: string,
  r: string,
  oid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${oid}/policyObjects`,
    "POST",
    body,
  );
export const getThirdPartyVpnPeers = (
  apiKey: string,
  r: string,
  oid: string,
): Promise<VpnPeer[]> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${oid}/vpn/thirdPartyVPNPeers`);
export const updateThirdPartyVpnPeers = (
  apiKey: string,
  r: string,
  oid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${oid}/vpn/thirdPartyVPNPeers`,
    "PUT",
    body,
  );
export const getVpnFirewallRules = (
  apiKey: string,
  r: string,
  oid: string,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${oid}/appliance/vpn/vpnFirewallRules`,
  );
export const updateVpnFirewallRules = (
  apiKey: string,
  r: string,
  oid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${oid}/appliance/vpn/vpnFirewallRules`,
    "PUT",
    body,
  );

// --- Network-Level ---
export const updateNetwork = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}`, "PUT", body);
export const getNetworkWebhooks = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<WebhookHttpServer[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/webhooks/httpServers`);
export const createNetworkWebhook = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/webhooks/httpServers`,
    "POST",
    body,
  );
export const getNetworkSnmp = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<NetworkSnmpSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/snmp`);
export const updateNetworkSnmp = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/snmp`, "PUT", body);
export const getNetworkFloorplans = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<Floorplan[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/floorPlans`);
export const getNetworkGroupPolicies = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<GroupPolicy[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/groupPolicies`);
export const createNetworkGroupPolicy = (
  apiKey: string,
  r: string,
  nid: string,
  body: GroupPolicy,
): Promise<GroupPolicy> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/groupPolicies`, "POST", body);
export const deleteNetworkGroupPolicy = (
  apiKey: string,
  r: string,
  nid: string,
  gpId: string,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/groupPolicies/${gpId}`,
    "DELETE",
  );
export const getNetworkSyslogServers = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<{ servers: SyslogServer[] }> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/syslogServers`);
export const updateNetworkSyslogServers = (
  apiKey: string,
  r: string,
  nid: string,
  body: { servers: SyslogServer[] },
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/syslogServers`, "PUT", body);
export const getNetworkAlertsSettings = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<AlertSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/alerts/settings`);
export const updateNetworkAlertsSettings = (
  apiKey: string,
  r: string,
  nid: string,
  body: AlertSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/alerts/settings`,
    "PUT",
    body,
  );
export const getNetworkSettings = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}`);

// --- Appliance (MX) ---
export const getNetworkApplianceSettings = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<ApplianceSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/settings`);
export const updateNetworkApplianceSettings = (
  apiKey: string,
  r: string,
  nid: string,
  body: ApplianceSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/settings`,
    "PUT",
    body,
  );
export const getNetworkApplianceVlans = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<ApplianceVlan[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vlans`);
export const createNetworkApplianceVlan = (
  apiKey: string,
  r: string,
  nid: string,
  body: Omit<ApplianceVlan, "networkId">,
): Promise<ApplianceVlan> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/vlans`,
    "POST",
    body,
  );
export const updateNetworkApplianceVlan = (
  apiKey: string,
  r: string,
  nid: string,
  vlanId: string | number,
  body: Partial<ApplianceVlan>,
): Promise<ApplianceVlan> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/vlans/${vlanId}`,
    "PUT",
    body,
  );
export const getNetworkApplianceVlan = (
  apiKey: string,
  r: string,
  nid: string,
  vlanId: string,
): Promise<ApplianceVlan> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vlans/${vlanId}`);
export const getNetworkApplianceVlansSettings = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<{ vlansEnabled: boolean }> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vlans/settings`);
export const updateNetworkApplianceVlansSettings = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/vlans/settings`,
    "PUT",
    body,
  );
export const getNetworkApplianceStaticRoutes = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<ApplianceStaticRoute[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/staticRoutes`);
export const getNetworkApplianceStaticRoute = (
  apiKey: string,
  r: string,
  nid: string,
  routeId: string,
): Promise<ApplianceStaticRoute> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/staticRoutes/${routeId}`,
  );
export const createNetworkApplianceStaticRoute = (
  apiKey: string,
  r: string,
  nid: string,
  body: Partial<ApplianceStaticRoute>,
): Promise<ApplianceStaticRoute> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/staticRoutes`,
    "POST",
    body,
  );
export const deleteNetworkApplianceStaticRoute = (
  apiKey: string,
  r: string,
  nid: string,
  rid: string,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/staticRoutes/${rid}`,
    "DELETE",
  );
export const getNetworkApplianceSecurityMalware = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<MalwareSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/security/malware`);
export const updateNetworkApplianceSecurityMalware = (
  apiKey: string,
  r: string,
  nid: string,
  body: MalwareSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/security/malware`,
    "PUT",
    body,
  );
export const getNetworkApplianceSecurityIntrusion = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<IntrusionSettings> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/security/intrusion`,
  );
export const updateNetworkApplianceSecurityIntrusion = (
  apiKey: string,
  r: string,
  nid: string,
  body: IntrusionSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/security/intrusion`,
    "PUT",
    body,
  );
export const getNetworkApplianceFirewallL3FirewallRules = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<{ rules: MerakiL3FirewallRule[] }> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/firewall/l3FirewallRules`,
  );
export const updateNetworkApplianceFirewallL3FirewallRules = (
  apiKey: string,
  r: string,
  nid: string,
  body: { rules: MerakiL3FirewallRule[] },
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/firewall/l3FirewallRules`,
    "PUT",
    body,
  );
export const getNetworkApplianceFirewallL7FirewallRules = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<{ rules: MerakiL7FirewallRule[] }> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/firewall/l7FirewallRules`,
  );
export const updateNetworkApplianceFirewallL7FirewallRules = (
  apiKey: string,
  r: string,
  nid: string,
  body: { rules: MerakiL7FirewallRule[] },
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/firewall/l7FirewallRules`,
    "PUT",
    body,
  );
export const getNetworkApplianceContentFiltering = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<ContentFilteringSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/contentFiltering`);
export const updateNetworkApplianceContentFiltering = (
  apiKey: string,
  r: string,
  nid: string,
  body: ContentFilteringSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/contentFiltering`,
    "PUT",
    body,
  );
export const getNetworkApplianceVpnSiteToSiteVpn = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<SiteToSiteVpnSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vpn/siteToSiteVpn`);
export const updateNetworkApplianceVpnSiteToSiteVpn = (
  apiKey: string,
  r: string,
  nid: string,
  body: SiteToSiteVpnSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/vpn/siteToSiteVpn`,
    "PUT",
    body,
  );
export const getNetworkApplianceUplinkSelection = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<UplinkSelection> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/trafficShaping/uplinkSelection`,
  );
export const updateNetworkApplianceUplinkSelection = (
  apiKey: string,
  r: string,
  nid: string,
  body: UplinkSelection,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/trafficShaping/uplinkSelection`,
    "PUT",
    body,
  );
export const getNetworkApplianceTrafficShapingRules = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<TrafficShapingRules> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/trafficShaping/rules`,
  );
export const updateNetworkApplianceTrafficShapingRules = (
  apiKey: string,
  r: string,
  nid: string,
  body: TrafficShapingRules,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/trafficShaping/rules`,
    "PUT",
    body,
  );
export const getNetworkApplianceVpnBgp = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<BgpSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/appliance/vpn/bgp`);
export const updateNetworkApplianceVpnBgp = (
  apiKey: string,
  r: string,
  nid: string,
  body: BgpSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/vpn/bgp`,
    "PUT",
    body,
  );

// --- Switch (MS) ---
export const getNetworkSwitchPortSchedules = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<PortSchedule[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/portSchedules`);
export const updateNetworkSwitchPortSchedules = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/switch/portSchedules`,
    "PUT",
    body,
  );
export const getNetworkSwitchQosRules = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<QosRule[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/qosRules`);
export const updateNetworkSwitchQosRules = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/switch/qosRules`,
    "PUT",
    body,
  );
export const getNetworkSwitchAccessPolicies = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<AccessPolicy[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/accessPolicies`);
export const createNetworkSwitchAccessPolicy = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/switch/accessPolicies`,
    "POST",
    body,
  );
// Claim devices to a network using Cloud IDs (Cat9K Meraki-managed onboarding)
export const claimNetworkDevices = (
  apiKey: string,
  r: string,
  networkId: string,
  serials: string[],
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${networkId}/devices/claim`,
    "POST",
    { serials },
  );

export const getSwitchPorts = (
  apiKey: string,
  r: string,
  serial: string,
): Promise<SwitchPortSettings[]> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/ports`);
export const getSwitchPort = (
  apiKey: string,
  r: string,
  serial: string,
  portId: string,
): Promise<SwitchPortSettings> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/ports/${portId}`);
export const updateSwitchPort = (
  apiKey: string,
  r: string,
  serial: string,
  portId: string,
  body: Omit<SwitchPortSettings, "portId">,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/switch/ports/${portId}`,
    "PUT",
    body,
  );
export const getDeviceManagementInterface = (
  apiKey: string,
  r: string,
  serial: string,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/managementInterface`);
export const updateDeviceManagementInterface = (
  apiKey: string,
  r: string,
  serial: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/managementInterface`,
    "PUT",
    body,
  );
export const getDeviceWirelessRadioSettings = (
  apiKey: string,
  r: string,
  serial: string,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/wireless/radio/settings`);
export const updateDeviceWirelessRadioSettings = (
  apiKey: string,
  r: string,
  serial: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/wireless/radio/settings`,
    "PUT",
    body,
  );
export const getNetworkSwitchAccessControlLists = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<AccessControlLists> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/accessControlLists`);
export const updateNetworkSwitchAccessControlLists = (
  apiKey: string,
  r: string,
  nid: string,
  body: AccessControlLists,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/switch/accessControlLists`,
    "PUT",
    body,
  );
export const getNetworkSwitchDhcpServerPolicy = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<DhcpServerPolicy> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/dhcpServerPolicy`);
export const updateNetworkSwitchDhcpServerPolicy = (
  apiKey: string,
  r: string,
  nid: string,
  body: DhcpServerPolicy,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/switch/dhcpServerPolicy`,
    "PUT",
    body,
  );
export const getNetworkSwitchDscpToCosMappings = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<DscpToCosMappings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/dscpToCosMappings`);
export const updateNetworkSwitchDscpToCosMappings = (
  apiKey: string,
  r: string,
  nid: string,
  body: DscpToCosMappings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/switch/dscpToCosMappings`,
    "PUT",
    body,
  );
export const getNetworkSwitchStormControl = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<StormControlSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/stormControl`);
export const updateNetworkSwitchStormControl = (
  apiKey: string,
  r: string,
  nid: string,
  body: StormControlSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/switch/stormControl`,
    "PUT",
    body,
  );
export const getNetworkSwitchMtu = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<MtuSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/mtu`);
export const updateNetworkSwitchMtu = (
  apiKey: string,
  r: string,
  nid: string,
  body: MtuSettings,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/mtu`, "PUT", body);
export const getNetworkSwitchLinkAggregations = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<LinkAggregation[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/linkAggregations`);
export const createNetworkSwitchLinkAggregation = (
  apiKey: string,
  r: string,
  nid: string,
  body: LinkAggregation,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/switch/linkAggregations`,
    "POST",
    body,
  );
export const getNetworkSwitchOspf = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<OspfSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/ospf`);
export const updateNetworkSwitchOspf = (
  apiKey: string,
  r: string,
  nid: string,
  body: OspfSettings,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/ospf`, "PUT", body);
export const getDeviceSwitchRoutingStaticRoutes = (
  apiKey: string,
  r: string,
  serial: string,
): Promise<SwitchStaticRoute[]> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/switch/routing/staticRoutes`,
  );
export const createDeviceSwitchRoutingStaticRoute = (
  apiKey: string,
  r: string,
  serial: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/switch/routing/staticRoutes`,
    "POST",
    body,
  );
export const updateDeviceSwitchRoutingStaticRoute = (
  apiKey: string,
  r: string,
  serial: string,
  routeId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/switch/routing/staticRoutes/${routeId}`,
    "PUT",
    body,
  );
export const getDeviceSwitchRoutingInterfaces = (
  apiKey: string,
  r: string,
  serial: string,
): Promise<SwitchRoutingInterface[]> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/routing/interfaces`);
export const createDeviceSwitchRoutingInterface = (
  apiKey: string,
  r: string,
  serial: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/switch/routing/interfaces`,
    "POST",
    body,
  );
export const updateDeviceSwitchRoutingInterface = (
  apiKey: string,
  r: string,
  serial: string,
  interfaceId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/switch/routing/interfaces/${interfaceId}`,
    "PUT",
    body,
  );
export const getNetworkSwitchSettings = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<SwitchSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/settings`);
export const updateNetworkSwitchSettings = (
  apiKey: string,
  r: string,
  nid: string,
  body: SwitchSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/switch/settings`,
    "PUT",
    body,
  );

// --- Wireless (MR) ---
export const getNetworkWirelessSsids = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<WirelessSsid[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/ssids`);
export const updateNetworkWirelessSsid = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: Partial<WirelessSsid>,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}`,
    "PUT",
    body,
  );
export const getNetworkWirelessSsidFirewallL3Rules = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
): Promise<SsidFirewallL3Rules> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/firewall/l3FirewallRules`,
  );
export const updateNetworkWirelessSsidFirewallL3Rules = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: SsidFirewallL3Rules,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/firewall/l3FirewallRules`,
    "PUT",
    body,
  );
export const getNetworkWirelessSsidFirewallL7Rules = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
): Promise<SsidFirewallL7Rules> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/firewall/l7FirewallRules`,
  );
export const updateNetworkWirelessSsidFirewallL7Rules = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: SsidFirewallL7Rules,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/firewall/l7FirewallRules`,
    "PUT",
    body,
  );
export const getNetworkWirelessSsidTrafficShapingRules = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
): Promise<SsidTrafficShapingRules> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/trafficShaping/rules`,
  );
export const updateNetworkWirelessSsidTrafficShapingRules = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: SsidTrafficShapingRules,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/trafficShaping/rules`,
    "PUT",
    body,
  );
export const getNetworkWirelessRfProfiles = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<RfProfile[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/rfProfiles`);
export const createNetworkWirelessRfProfile = (
  apiKey: string,
  r: string,
  nid: string,
  body: RfProfile,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/rfProfiles`,
    "POST",
    body,
  );
export const getNetworkWirelessBluetoothSettings = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<WirelessBluetoothSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/bluetooth/settings`);
export const updateNetworkWirelessBluetoothSettings = (
  apiKey: string,
  r: string,
  nid: string,
  body: WirelessBluetoothSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/bluetooth/settings`,
    "PUT",
    body,
  );
export const getNetworkWirelessSettings = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<WirelessSettings> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/wireless/settings`);
export const updateNetworkWirelessSettings = (
  apiKey: string,
  r: string,
  nid: string,
  body: WirelessSettings,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/settings`,
    "PUT",
    body,
  );

// Wireless SSID Advanced Settings
export const updateNetworkWirelessSsidBonjourForwarding = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/bonjourForwarding`,
    "PUT",
    body,
  );
export const updateNetworkWirelessSsidDeviceTypeGroupPolicies = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/deviceTypeGroupPolicies`,
    "PUT",
    body,
  );
export const updateNetworkWirelessSsidHotspot20 = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/hotspot20`,
    "PUT",
    body,
  );
export const getNetworkWirelessSsidIdentityPsks = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
): Promise<any[]> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/identityPsks`,
  );
export const createNetworkWirelessSsidIdentityPsk = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/identityPsks`,
    "POST",
    body,
  );
export const updateNetworkWirelessSsidSchedules = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/schedules`,
    "PUT",
    body,
  );
export const updateNetworkWirelessSsidSplashSettings = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/splash/settings`,
    "PUT",
    body,
  );
export const updateNetworkWirelessSsidVpn = (
  apiKey: string,
  r: string,
  nid: string,
  ssidNum: number,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/ssids/${ssidNum}/vpn`,
    "PUT",
    body,
  );
export const updateNetworkWirelessAlternateManagementInterface = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/alternateManagementInterface`,
    "PUT",
    body,
  );
export const updateNetworkWirelessBilling = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/wireless/billing`,
    "PUT",
    body,
  );

// Organization Advanced Settings
export const getOrganizationAlertProfiles = (
  apiKey: string,
  r: string,
  orgId: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${orgId}/alerts/profiles`);
export const createOrganizationAlertProfile = (
  apiKey: string,
  r: string,
  orgId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${orgId}/alerts/profiles`,
    "POST",
    body,
  );
export const getOrganizationBrandingPolicies = (
  apiKey: string,
  r: string,
  orgId: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${orgId}/brandingPolicies`);
export const createOrganizationBrandingPolicy = (
  apiKey: string,
  r: string,
  orgId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${orgId}/brandingPolicies`,
    "POST",
    body,
  );
export const getOrganizationConfigTemplates = (
  apiKey: string,
  r: string,
  orgId: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${orgId}/configTemplates`);
export const createOrganizationConfigTemplate = (
  apiKey: string,
  r: string,
  orgId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${orgId}/configTemplates`,
    "POST",
    body,
  );
export const getOrganizationLoginSecurity = (
  apiKey: string,
  r: string,
  orgId: string,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${orgId}/loginSecurity`);
export const updateOrganizationLoginSecurity = (
  apiKey: string,
  r: string,
  orgId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${orgId}/loginSecurity`,
    "PUT",
    body,
  );
export const getOrganizationSamlRoles = (
  apiKey: string,
  r: string,
  orgId: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${orgId}/saml/roles`);
export const createOrganizationSamlRole = (
  apiKey: string,
  r: string,
  orgId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${orgId}/saml/roles`,
    "POST",
    body,
  );
export const getOrganizationWebhookHttpServers = (
  apiKey: string,
  r: string,
  orgId: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${orgId}/webhooks/httpServers`);
export const createOrganizationWebhookHttpServer = (
  apiKey: string,
  r: string,
  orgId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${orgId}/webhooks/httpServers`,
    "POST",
    body,
  );
export const getOrganizationPolicyObjectGroups = (
  apiKey: string,
  r: string,
  orgId: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/organizations/${orgId}/policyObjects/groups`);
export const createOrganizationPolicyObjectGroup = (
  apiKey: string,
  r: string,
  orgId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/organizations/${orgId}/policyObjects/groups`,
    "POST",
    body,
  );

// Appliance Advanced Firewall & NAT
export const updateNetworkApplianceFirewallCellularFirewallRules = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/firewall/cellularFirewallRules`,
    "PUT",
    body,
  );
export const updateNetworkApplianceFirewallInboundFirewallRules = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/firewall/inboundFirewallRules`,
    "PUT",
    body,
  );
export const updateNetworkApplianceFirewallOneToManyNatRules = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/firewall/oneToManyNatRules`,
    "PUT",
    body,
  );
export const updateNetworkApplianceFirewallOneToOneNatRules = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/firewall/oneToOneNatRules`,
    "PUT",
    body,
  );
export const updateNetworkApplianceFirewallPortForwardingRules = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/firewall/portForwardingRules`,
    "PUT",
    body,
  );

// Appliance Traffic Shaping & Connectivity
export const updateNetworkApplianceTrafficShaping = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/trafficShaping`,
    "PUT",
    body,
  );
export const getNetworkApplianceTrafficShapingCustomPerformanceClasses = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<any[]> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/trafficShaping/customPerformanceClasses`,
  );
export const createNetworkApplianceTrafficShapingCustomPerformanceClass = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/trafficShaping/customPerformanceClasses`,
    "POST",
    body,
  );
export const updateNetworkApplianceConnectivityMonitoringDestinations = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/connectivityMonitoringDestinations`,
    "PUT",
    body,
  );
export const updateNetworkApplianceUplinksSettings = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/appliance/uplinks/settings`,
    "PUT",
    body,
  );

// Switch Advanced Settings
export const getNetworkSwitchStp = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<any> => fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/stp`);
export const updateNetworkSwitchStp = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/switch/stp`, "PUT", body);
export const getDeviceSwitchRoutingOspf = (
  apiKey: string,
  r: string,
  serial: string,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/routing/ospf`);
export const updateDeviceSwitchRoutingOspf = (
  apiKey: string,
  r: string,
  serial: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/switch/routing/ospf`,
    "PUT",
    body,
  );
export const getDeviceSwitchStp = (
  apiKey: string,
  r: string,
  serial: string,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/stp`);
export const updateDeviceSwitchStp = (
  apiKey: string,
  r: string,
  serial: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/switch/stp`, "PUT", body);

// Network General Settings
export const updateNetworkSettings = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/settings`, "PUT", body);
export const getNetworkFloorPlans = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/floorPlans`);
export const createNetworkFloorPlan = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/floorPlans`, "POST", body);
export const updateNetworkNetflow = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/netflow`, "PUT", body);
export const updateNetworkTrafficAnalysis = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/trafficAnalysis`,
    "PUT",
    body,
  );
export const getNetworkVlanProfiles = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/vlanProfiles`);
export const createNetworkVlanProfile = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/vlanProfiles`, "POST", body);
export const getNetworkWebhookHttpServers = (
  apiKey: string,
  r: string,
  nid: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/networks/${nid}/webhooks/httpServers`);
export const createNetworkWebhookHttpServer = (
  apiKey: string,
  r: string,
  nid: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/networks/${nid}/webhooks/httpServers`,
    "POST",
    body,
  );

// Device-Level Appliance Configuration
export const getDeviceApplianceUplinkSettings = (
  apiKey: string,
  r: string,
  serial: string,
): Promise<any> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/appliance/uplink/settings`);
export const updateDeviceApplianceUplinkSettings = (
  apiKey: string,
  r: string,
  serial: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/appliance/uplink/settings`,
    "PUT",
    body,
  );
export const getDeviceApplianceDhcpSubnets = (
  apiKey: string,
  r: string,
  serial: string,
): Promise<any[]> =>
  fetchWithMerakiApi(apiKey, r, `/devices/${serial}/appliance/dhcp/subnets`);
export const createDeviceApplianceDhcpSubnet = (
  apiKey: string,
  r: string,
  serial: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/appliance/dhcp/subnets`,
    "POST",
    body,
  );
export const updateDeviceApplianceDhcpSubnet = (
  apiKey: string,
  r: string,
  serial: string,
  subnetId: string,
  body: any,
): Promise<any> =>
  fetchWithMerakiApi(
    apiKey,
    r,
    `/devices/${serial}/appliance/dhcp/subnets/${subnetId}`,
    "PUT",
    body,
  );

// --- Selective Backup Engine ---
export const createSelectiveBackup = async (
  apiKey: string,
  region: string,
  organization: MerakiOrganization,
  devices: MerakiDeviceDetails[],
  logCallback: (message: string) => void,
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

  const getErrorMessage = (e: unknown) =>
    e instanceof Error ? e.message : String(e);

  // 1. Fetch organization-level configs (can be a smaller subset than exhaustive)
  logCallback("Backing up key organization-level configurations...");
  try {
    const [policyObjects, snmp] = await Promise.all([
      getOrganizationPolicyObjects(apiKey, region, organization.id).catch(
        () => null,
      ),
      fetchWithMerakiApi(
        apiKey,
        region,
        `/organizations/${organization.id}/snmp`,
      ).catch(() => null),
    ]);
    backupFile.organizationConfig = { policyObjects, snmp };
    logCallback("  - ✅ Organization configs backed up.");
  } catch (e) {
    logCallback(
      `  - ❌ FAILED to back up organization configs: ${getErrorMessage(e)}`,
    );
  }

  // 2. Identify unique networks and back them up
  const networkIds = [
    ...new Set(devices.map((d) => d.networkId).filter(Boolean)),
  ];
  logCallback(`Found ${networkIds.length} unique networks to back up.`);

  for (const networkId of networkIds) {
    logCallback(`--- Backing up Network ID: ${networkId} ---`);
    try {
      const nid = networkId as string;
      // Fetch all network-level configs in parallel
      const [
        groupPolicies,
        ssids,
        applianceVlansSettings,
        applianceVlans,
        l3FirewallRules,
        l7FirewallRules,
        siteToSiteVpn,
        contentFiltering,
        intrusionSettings,
        malwareSettings,
        applianceStaticRoutes,
        trafficShapingRules,
        uplinkSelection,
        bgpSettings,
        applianceSettings,
        switchSettings,
        switchAcls,
        portSchedules,
        syslogServers,
      ] = await Promise.all([
        getNetworkGroupPolicies(apiKey, region, nid).catch(() => null),
        getNetworkWirelessSsids(apiKey, region, nid).catch(() => null),
        getNetworkApplianceVlansSettings(apiKey, region, nid).catch(() => null),
        getNetworkApplianceVlans(apiKey, region, nid).catch(() => null),
        getNetworkApplianceFirewallL3FirewallRules(apiKey, region, nid).catch(
          () => null,
        ),
        getNetworkApplianceFirewallL7FirewallRules(apiKey, region, nid).catch(
          () => null,
        ),
        getNetworkApplianceVpnSiteToSiteVpn(apiKey, region, nid).catch(
          () => null,
        ),
        getNetworkApplianceContentFiltering(apiKey, region, nid).catch(
          () => null,
        ),
        getNetworkApplianceSecurityIntrusion(apiKey, region, nid).catch(
          () => null,
        ),
        getNetworkApplianceSecurityMalware(apiKey, region, nid).catch(
          () => null,
        ),
        getNetworkApplianceStaticRoutes(apiKey, region, nid).catch(() => null),
        getNetworkApplianceTrafficShapingRules(apiKey, region, nid).catch(
          () => null,
        ),
        getNetworkApplianceUplinkSelection(apiKey, region, nid).catch(
          () => null,
        ),
        getNetworkApplianceVpnBgp(apiKey, region, nid).catch(() => null),
        getNetworkApplianceSettings(apiKey, region, nid).catch(() => null),
        getNetworkSwitchSettings(apiKey, region, nid).catch(() => null),
        getNetworkSwitchAccessControlLists(apiKey, region, nid).catch(
          () => null,
        ),
        getNetworkSwitchPortSchedules(apiKey, region, nid).catch(() => null),
        getNetworkSyslogServers(apiKey, region, nid).catch(() => null),
      ]);
      backupFile.networkConfigs![nid] = {
        groupPolicies,
        ssids,
        applianceVlansSettings,
        applianceVlans,
        applianceL3FirewallRules: l3FirewallRules,
        applianceL7FirewallRules: l7FirewallRules,
        siteToSiteVpnSettings: siteToSiteVpn,
        contentFiltering,
        intrusionSettings,
        malwareSettings,
        staticRoutes: applianceStaticRoutes,
        trafficShapingRules,
        uplinkSelection,
        bgpSettings,
        applianceSettings,
        switchSettings,
        switchAcls,
        portSchedules,
        syslogServers,
      };
      logCallback(`  - ✅ Network ${nid} configs backed up.`);
    } catch (e) {
      logCallback(
        `  - ❌ FAILED to back up network ${networkId}: ${getErrorMessage(e)}`,
      );
    }
  }

  // 3. Back up each selected device
  logCallback(`--- Backing up ${devices.length} selected devices ---`);
  for (const device of devices) {
    logCallback(`Backing up device: ${device.name} (${device.serial})`);
    try {
      const deviceConfig: Partial<DeviceConfigBackup> = { general: device };
      if (device.model.startsWith("MS")) {
        deviceConfig.switchPorts = await getSwitchPorts(
          apiKey,
          region,
          device.serial,
        ).catch(() => []);
        deviceConfig.routingInterfaces = await getDeviceSwitchRoutingInterfaces(
          apiKey,
          region,
          device.serial,
        ).catch(() => []);
        deviceConfig.staticRoutes = await getDeviceSwitchRoutingStaticRoutes(
          apiKey,
          region,
          device.serial,
        ).catch(() => []);
      }

      backupFile.devices!.push({
        serial: device.serial,
        config: deviceConfig as DeviceConfigBackup,
      });
      logCallback(`  - ✅ Device ${device.serial} backed up.`);
    } catch (e) {
      logCallback(
        `  - ❌ FAILED to back up device ${device.serial}: ${getErrorMessage(e)}`,
      );
    }
  }

  logCallback("--- Finalizing backup file ---");
  const jsonString = JSON.stringify(backupFile, null, 2);
  return new Blob([jsonString], { type: "application/json" });
};

// --- Full Backup Engine ---
export const createExhaustiveBackup = async (
  apiKey: string,
  region: string,
  orgId: string,
  logCallback: (message: string) => void,
): Promise<Blob> => {
  const zip = new JSZip();
  const safeFilename = (name: string) => name.replace(/[^a-z0-9_.-]/gi, "_");

  const getAndZip = async (path: string, apiCall: () => Promise<any>) => {
    try {
      const data = await apiCall();
      if (
        data !== null &&
        data !== undefined &&
        (!Array.isArray(data) || data.length > 0)
      ) {
        zip.file(path, JSON.stringify(data, null, 2));
        logCallback(`  - ✅ Success: ${path}`);
      } else {
        logCallback(`  - ⏩ Skipped (no data/not configured): ${path}`);
      }
    } catch (error) {
      logCallback(
        `  - ❌ FAILED: ${path} (${error instanceof Error ? error.message : "Unknown error"})`,
      );
    }
  };

  logCallback("--- Starting Exhaustive Backup ---");
  logCallback("Fetching core inventories (Networks and Devices)...");
  const [networks, devices] = await Promise.all([
    getOrgNetworks(apiKey, region, orgId),
    getOrgDevices(apiKey, region, orgId),
  ]);
  logCallback(
    `Found ${networks.length} networks and ${devices.length} devices.`,
  );

  // --- Organization Level ---
  logCallback("\n--- Backing up Organization-level configurations ---");
  const orgEndpoints = [
    { path: `/organizations/${orgId}`, name: "details" },
    { path: `/organizations/${orgId}/admins`, name: "admins" },
    {
      path: `/organizations/${orgId}/alerts/profiles`,
      name: "alerts_profiles",
    },
    {
      path: `/organizations/${orgId}/apiRequests`,
      name: "apiRequests_summary",
    },
    {
      path: `/organizations/${orgId}/brandingPolicies`,
      name: "brandingPolicies",
    },
    {
      path: `/organizations/${orgId}/brandingPolicies/priorities`,
      name: "brandingPolicies_priorities",
    },
    {
      path: `/organizations/${orgId}/configTemplates`,
      name: "configTemplates",
    },
    {
      path: `/organizations/${orgId}/inventory/devices`,
      name: "inventory_devices",
    },
    { path: `/organizations/${orgId}/licenses`, name: "licenses" },
    { path: `/organizations/${orgId}/loginSecurity`, name: "loginSecurity" },
    { path: `/organizations/${orgId}/policyObjects`, name: "policyObjects" },
    {
      path: `/organizations/${orgId}/policyObjects/groups`,
      name: "policyObjects_groups",
    },
    { path: `/organizations/${orgId}/saml/roles`, name: "saml_roles" },
    { path: `/organizations/${orgId}/snmp`, name: "snmp" },
    {
      path: `/organizations/${orgId}/appliance/vpn/thirdPartyVPNPeers`,
      name: "appliance_vpn_thirdPartyVPNPeers",
    },
    {
      path: `/organizations/${orgId}/appliance/vpn/vpnFirewallRules`,
      name: "appliance_vpn_vpnFirewallRules",
    },
    {
      path: `/organizations/${orgId}/appliance/security/intrusion`,
      name: "appliance_security_intrusion",
    },
    {
      path: `/organizations/${orgId}/earlyAccess/features`,
      name: "earlyAccess_features",
    },
    {
      path: `/organizations/${orgId}/webhooks/alertTypes`,
      name: "webhooks_alertTypes",
    },
    {
      path: `/organizations/${orgId}/webhooks/httpServers`,
      name: "webhooks_httpServers",
    },
    {
      path: `/organizations/${orgId}/summary/top/devices/byUsage`,
      name: "summary_topDevices",
    },
    {
      path: `/organizations/${orgId}/appliance/uplink/statuses`,
      name: "appliance_uplink_statuses",
    },
    {
      path: `/organizations/${orgId}/devices/statuses`,
      name: "devices_statuses",
    },
  ];
  await Promise.all(
    orgEndpoints.map((endpoint) =>
      getAndZip(`organization/${endpoint.name}.json`, () =>
        fetchWithMerakiApi(apiKey, region, endpoint.path),
      ),
    ),
  );

  // --- Network Level ---
  const networkEndpoints = [
    { path: ``, name: "details" },
    { path: `/alerts/settings`, name: "alerts_settings" },
    { path: `/bluetoothClients`, name: "bluetoothClients" },
    { path: `/events/eventTypes`, name: "events_eventTypes" },
    { path: `/floorPlans`, name: "floorPlans" },
    { path: `/groupPolicies`, name: "groupPolicies" },
    { path: `/merakiAuthUsers`, name: "merakiAuthUsers" },
    { path: `/netflow`, name: "netflow" },
    { path: `/pii/piiKeys`, name: "pii_piiKeys" },
    { path: `/settings`, name: "settings" },
    { path: `/snmp`, name: "snmp" },
    { path: `/syslogServers`, name: "syslogServers" },
    { path: `/trafficAnalysis`, name: "trafficAnalysis" },
    {
      path: `/trafficShaping/applicationCategories`,
      name: "trafficShaping_applicationCategories",
    },
    {
      path: `/trafficShaping/dscpTaggingOptions`,
      name: "trafficShaping_dscpTaggingOptions",
    },
    { path: `/vlanProfiles`, name: "vlanProfiles" },
    { path: `/webhooks/httpServers`, name: "webhooks_httpServers" },
    { path: `/webhooks/payloadTemplates`, name: "webhooks_payloadTemplates" },
  ];

  for (const network of networks) {
    logCallback(
      `\n--- Backing up Network: ${network.name} (${network.id}) ---`,
    );
    const netFolder = `networks/${safeFilename(network.name)}_${network.id}`;

    await Promise.all(
      networkEndpoints.map((endpoint) =>
        getAndZip(`${netFolder}/${endpoint.name}.json`, () =>
          fetchWithMerakiApi(
            apiKey,
            region,
            `/networks/${network.id}${endpoint.path}`,
          ),
        ),
      ),
    );

    if (network.productTypes.includes("appliance")) {
      const applianceEndpoints = [
        {
          path: `/appliance/connectivityMonitoringDestinations`,
          name: "appliance_connectivityMonitoringDestinations",
        },
        {
          path: `/appliance/contentFiltering`,
          name: "appliance_contentFiltering",
        },
        {
          path: `/appliance/firewall/cellularFirewallRules`,
          name: "appliance_firewall_cellularFirewallRules",
        },
        {
          path: `/appliance/firewall/inboundFirewallRules`,
          name: "appliance_firewall_inboundFirewallRules",
        },
        {
          path: `/appliance/firewall/l3FirewallRules`,
          name: "appliance_firewall_l3FirewallRules",
        },
        {
          path: `/appliance/firewall/l7FirewallRules`,
          name: "appliance_firewall_l7FirewallRules",
        },
        {
          path: `/appliance/firewall/oneToManyNatRules`,
          name: "appliance_firewall_oneToManyNatRules",
        },
        {
          path: `/appliance/firewall/oneToOneNatRules`,
          name: "appliance_firewall_oneToOneNatRules",
        },
        {
          path: `/appliance/firewall/portForwardingRules`,
          name: "appliance_firewall_portForwardingRules",
        },
        {
          path: `/appliance/security/intrusion`,
          name: "appliance_security_intrusion",
        },
        {
          path: `/appliance/security/malware`,
          name: "appliance_security_malware",
        },
        { path: `/appliance/settings`, name: "appliance_settings" },
        { path: `/appliance/staticRoutes`, name: "appliance_staticRoutes" },
        { path: `/appliance/trafficShaping`, name: "appliance_trafficShaping" },
        {
          path: `/appliance/trafficShaping/customPerformanceClasses`,
          name: "appliance_trafficShaping_customPerformanceClasses",
        },
        {
          path: `/appliance/trafficShaping/rules`,
          name: "appliance_trafficShaping_rules",
        },
        {
          path: `/appliance/trafficShaping/uplinkSelection`,
          name: "appliance_trafficShaping_uplinkSelection",
        },
        {
          path: `/appliance/uplinks/settings`,
          name: "appliance_uplinks_settings",
        },
        { path: `/appliance/vlans`, name: "appliance_vlans" },
        { path: `/appliance/vlans/settings`, name: "appliance_vlans_settings" },
        { path: `/appliance/vpn/bgp`, name: "appliance_vpn_bgp" },
        {
          path: `/appliance/vpn/siteToSiteVpn`,
          name: "appliance_vpn_siteToSiteVpn",
        },
      ];
      await Promise.all(
        applianceEndpoints.map((endpoint) =>
          getAndZip(`${netFolder}/${endpoint.name}.json`, () =>
            fetchWithMerakiApi(
              apiKey,
              region,
              `/networks/${network.id}${endpoint.path}`,
            ),
          ),
        ),
      );
    }

    if (network.productTypes.includes("switch")) {
      const switchEndpoints = [
        {
          path: `/switch/accessControlLists`,
          name: "switch_accessControlLists",
        },
        { path: `/switch/accessPolicies`, name: "switch_accessPolicies" },
        { path: `/switch/dhcpServerPolicy`, name: "switch_dhcpServerPolicy" },
        { path: `/switch/dscpToCosMappings`, name: "switch_dscpToCosMappings" },
        { path: `/switch/linkAggregations`, name: "switch_linkAggregations" },
        { path: `/switch/mtu`, name: "switch_mtu" },
        { path: `/switch/ospf`, name: "switch_ospf" },
        { path: `/switch/portSchedules`, name: "switch_portSchedules" },
        { path: `/switch/qosRules`, name: "switch_qosRules" },
        { path: `/switch/settings`, name: "switch_settings" },
        { path: `/switch/stormControl`, name: "switch_stormControl" },
        { path: `/switch/stp`, name: "switch_stp" },
      ];
      await Promise.all(
        switchEndpoints.map((endpoint) =>
          getAndZip(`${netFolder}/${endpoint.name}.json`, () =>
            fetchWithMerakiApi(
              apiKey,
              region,
              `/networks/${network.id}${endpoint.path}`,
            ),
          ),
        ),
      );
    }

    if (network.productTypes.includes("wireless")) {
      const wirelessEndpoints = [
        {
          path: `/wireless/alternateManagementInterface`,
          name: "wireless_alternateManagementInterface",
        },
        { path: `/wireless/billing`, name: "wireless_billing" },
        {
          path: `/wireless/bluetooth/settings`,
          name: "wireless_bluetooth_settings",
        },
        { path: `/wireless/rfProfiles`, name: "wireless_rfProfiles" },
        { path: `/wireless/settings`, name: "wireless_settings" },
        { path: `/wireless/ssids`, name: "wireless_ssids" },
      ];
      await Promise.all(
        wirelessEndpoints.map((endpoint) =>
          getAndZip(`${netFolder}/${endpoint.name}.json`, () =>
            fetchWithMerakiApi(
              apiKey,
              region,
              `/networks/${network.id}${endpoint.path}`,
            ),
          ),
        ),
      );

      const ssids = await fetchWithMerakiApi(
        apiKey,
        region,
        `/networks/${network.id}/wireless/ssids`,
      );
      if (Array.isArray(ssids)) {
        for (const ssid of ssids) {
          const ssidEndpoints = [
            {
              path: `/wireless/ssids/${ssid.number}/bonjourForwarding`,
              name: `wireless_ssid_${ssid.number}_bonjourForwarding`,
            },
            {
              path: `/wireless/ssids/${ssid.number}/deviceTypeGroupPolicies`,
              name: `wireless_ssid_${ssid.number}_deviceTypeGroupPolicies`,
            },
            {
              path: `/wireless/ssids/${ssid.number}/firewall/l3FirewallRules`,
              name: `wireless_ssid_${ssid.number}_firewall_l3FirewallRules`,
            },
            {
              path: `/wireless/ssids/${ssid.number}/firewall/l7FirewallRules`,
              name: `wireless_ssid_${ssid.number}_firewall_l7FirewallRules`,
            },
            {
              path: `/wireless/ssids/${ssid.number}/hotspot20`,
              name: `wireless_ssid_${ssid.number}_hotspot20`,
            },
            {
              path: `/wireless/ssids/${ssid.number}/identityPsks`,
              name: `wireless_ssid_${ssid.number}_identityPsks`,
            },
            {
              path: `/wireless/ssids/${ssid.number}/schedules`,
              name: `wireless_ssid_${ssid.number}_schedules`,
            },
            {
              path: `/wireless/ssids/${ssid.number}/splash/settings`,
              name: `wireless_ssid_${ssid.number}_splash_settings`,
            },
            {
              path: `/wireless/ssids/${ssid.number}/trafficShaping/rules`,
              name: `wireless_ssid_${ssid.number}_trafficShaping_rules`,
            },
            {
              path: `/wireless/ssids/${ssid.number}/vpn`,
              name: `wireless_ssid_${ssid.number}_vpn`,
            },
          ];
          await Promise.all(
            ssidEndpoints.map((endpoint) =>
              getAndZip(`${netFolder}/${endpoint.name}.json`, () =>
                fetchWithMerakiApi(
                  apiKey,
                  region,
                  `/networks/${network.id}${endpoint.path}`,
                ),
              ),
            ),
          );
        }
      }
    }
  }

  // --- Device Level ---
  for (const device of devices) {
    logCallback(
      `\n--- Backing up Device: ${device.name || device.serial} (${device.serial}) ---`,
    );
    const deviceFolder = `devices/${safeFilename(device.name || device.serial)}_${device.serial}`;

    await getAndZip(`${deviceFolder}/details.json`, () =>
      Promise.resolve(device),
    );
    // Management interface is common to all device types
    await getAndZip(`${deviceFolder}/management_interface.json`, () =>
      fetchWithMerakiApi(
        apiKey,
        region,
        `/devices/${device.serial}/managementInterface`,
      ),
    );

    if (device.model.startsWith("MS")) {
      const switchDeviceEndpoints = [
        { path: `/switch/ports`, name: "switch_ports" },
        { path: `/switch/ports/statuses`, name: "switch_ports_statuses" },
        {
          path: `/switch/routing/interfaces`,
          name: "switch_routing_interfaces",
        },
        {
          path: `/switch/routing/staticRoutes`,
          name: "switch_routing_staticRoutes",
        },
        { path: `/switch/routing/ospf`, name: "switch_routing_ospf" },
      ];
      await Promise.all(
        switchDeviceEndpoints.map((endpoint) =>
          getAndZip(`${deviceFolder}/${endpoint.name}.json`, () =>
            fetchWithMerakiApi(
              apiKey,
              region,
              `/devices/${device.serial}${endpoint.path}`,
            ),
          ),
        ),
      );
    } else if (device.model.startsWith("MR")) {
      const mrEndpoints = [
        { path: `/wireless/radio/settings`, name: "wireless_radio_settings" },
        { path: `/wireless/status`, name: "wireless_status" },
      ];
      await Promise.all(
        mrEndpoints.map((endpoint) =>
          getAndZip(`${deviceFolder}/${endpoint.name}.json`, () =>
            fetchWithMerakiApi(
              apiKey,
              region,
              `/devices/${device.serial}${endpoint.path}`,
            ),
          ),
        ),
      );
    } else if (device.model.startsWith("MX") || device.model.startsWith("Z")) {
      const mxEndpoints = [
        {
          path: `/appliance/uplink/settings`,
          name: "appliance_uplink_settings",
        },
        { path: `/appliance/dhcp/subnets`, name: "appliance_dhcp_subnets" },
        { path: `/appliance/performance`, name: "appliance_performance" },
      ];
      await Promise.all(
        mxEndpoints.map((endpoint) =>
          getAndZip(`${deviceFolder}/${endpoint.name}.json`, () =>
            fetchWithMerakiApi(
              apiKey,
              region,
              `/devices/${device.serial}${endpoint.path}`,
            ),
          ),
        ),
      );
    }
  }

  logCallback("\n--- Generating backup ZIP file ---");
  const blob = await zip.generateAsync({ type: "blob" });
  logCallback("--- ✅ Backup process complete! ---");
  return blob;
};

// --- Restore Engines ---

export const restoreOrganizationConfiguration = async (
  apiKey: string,
  region: string,
  orgId: string,
  orgConfig: Partial<OrgConfigBackup>,
  cats: RestoreCategories,
  log: (msg: string) => void,
): Promise<number> => {
  let successCount = 0;

  const runRestore = async (
    name: string,
    backupData: any,
    restoreFn: () => Promise<any>,
  ) => {
    if (backupData && (!Array.isArray(backupData) || backupData.length > 0)) {
      log(`  - Restoring ${name}...`);
      try {
        await restoreFn();
        log(`    ✅ ${name} restored successfully.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to restore ${name}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    } else {
      log(`  - ⏩ Skipping ${name} (no backup data).`);
    }
  };

  // Org Admins - match by email, create if not exists
  if (cats.orgAdmins && orgConfig.admins && orgConfig.admins.length > 0) {
    log(`  - Restoring ${orgConfig.admins.length} organization admin(s)...`);
    try {
      const existingAdmins = await getOrganizationAdmins(apiKey, region, orgId);
      const existingEmails = new Set(
        existingAdmins.map((a) => a.email.toLowerCase()),
      );

      for (const admin of orgConfig.admins) {
        if (existingEmails.has(admin.email.toLowerCase())) {
          log(`    ⏩ Admin "${admin.email}" already exists - skipped.`);
          continue;
        }
        try {
          await createOrganizationAdmin(apiKey, region, orgId, {
            email: admin.email,
            name: admin.name,
            orgAccess: admin.orgAccess,
            networks: admin.networks || [],
          });
          log(`    ✅ Admin "${admin.email}" created.`);
          successCount++;
        } catch (e) {
          log(
            `    ❌ FAILED to create admin "${admin.email}": ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    } catch (e) {
      log(
        `    ❌ FAILED to restore admins: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  } else if (!cats.orgAdmins) {
    log(`  - ⏩ Skipping Organization Admins (category not selected).`);
  } else {
    log(`  - ⏩ Skipping Organization Admins (no backup data).`);
  }

  // Policy Objects - create each individually
  if (
    cats.orgPolicyObjects &&
    orgConfig.policyObjects &&
    orgConfig.policyObjects.length > 0
  ) {
    log(`  - Restoring ${orgConfig.policyObjects.length} policy object(s)...`);
    for (const obj of orgConfig.policyObjects) {
      try {
        const { id, ...objBody } = obj as any;
        await createOrganizationPolicyObject(apiKey, region, orgId, objBody);
        log(`    ✅ Policy object "${obj.name}" created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create policy object "${obj.name}": ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.orgPolicyObjects) {
    log(`  - ⏩ Skipping Policy Objects (category not selected).`);
  } else {
    log(`  - ⏩ Skipping Policy Objects (no backup data).`);
  }

  // Organization SNMP
  if (cats.orgSnmp) {
    await runRestore("Organization SNMP", orgConfig.snmp, () =>
      updateOrganizationSnmp(apiKey, region, orgId, orgConfig.snmp!),
    );
  } else {
    log(`  - ⏩ Skipping Organization SNMP (category not selected).`);
  }

  // VPN Firewall Rules
  if (cats.orgVpnFirewallRules) {
    await runRestore("VPN Firewall Rules", orgConfig.vpnFirewallRules, () =>
      updateVpnFirewallRules(
        apiKey,
        region,
        orgId,
        orgConfig.vpnFirewallRules!,
      ),
    );
  } else {
    log(`  - ⏩ Skipping VPN Firewall Rules (category not selected).`);
  }

  // Third-Party VPN Peers
  if (cats.orgThirdPartyVpn) {
    await runRestore(
      "Third-Party VPN Peers",
      orgConfig.thirdPartyVpnPeers,
      () =>
        updateThirdPartyVpnPeers(apiKey, region, orgId, {
          peers: orgConfig.thirdPartyVpnPeers,
        }),
    );
  } else {
    log(`  - ⏩ Skipping Third-Party VPN Peers (category not selected).`);
  }

  // Policy Object Groups
  if (
    cats.orgPolicyObjectGroups &&
    (orgConfig as any).policyObjectGroups &&
    (orgConfig as any).policyObjectGroups.length > 0
  ) {
    log(
      `  - Restoring ${(orgConfig as any).policyObjectGroups.length} policy object group(s)...`,
    );
    for (const group of (orgConfig as any).policyObjectGroups) {
      try {
        const { id, ...groupBody } = group;
        await createOrganizationPolicyObjectGroup(
          apiKey,
          region,
          orgId,
          groupBody,
        );
        log(`    ✅ Policy object group "${group.name}" created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create policy object group "${group.name}": ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.orgPolicyObjectGroups) {
    log(`  - ⏩ Skipping Policy Object Groups (category not selected).`);
  }

  // Alert Profiles
  if (
    cats.orgAlertProfiles &&
    (orgConfig as any).alertProfiles &&
    (orgConfig as any).alertProfiles.length > 0
  ) {
    log(
      `  - Restoring ${(orgConfig as any).alertProfiles.length} alert profile(s)...`,
    );
    for (const profile of (orgConfig as any).alertProfiles) {
      try {
        const { id, ...profileBody } = profile;
        await createOrganizationAlertProfile(
          apiKey,
          region,
          orgId,
          profileBody,
        );
        log(`    ✅ Alert profile created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create alert profile: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.orgAlertProfiles) {
    log(`  - ⏩ Skipping Alert Profiles (category not selected).`);
  }

  // Branding Policies
  if (
    cats.orgBrandingPolicies &&
    (orgConfig as any).brandingPolicies &&
    (orgConfig as any).brandingPolicies.length > 0
  ) {
    log(
      `  - Restoring ${(orgConfig as any).brandingPolicies.length} branding polic(ies)...`,
    );
    for (const policy of (orgConfig as any).brandingPolicies) {
      try {
        const { id, ...policyBody } = policy;
        await createOrganizationBrandingPolicy(
          apiKey,
          region,
          orgId,
          policyBody,
        );
        log(`    ✅ Branding policy "${policy.name}" created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create branding policy: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.orgBrandingPolicies) {
    log(`  - ⏩ Skipping Branding Policies (category not selected).`);
  }

  // Config Templates
  if (
    cats.orgConfigTemplates &&
    (orgConfig as any).configTemplates &&
    (orgConfig as any).configTemplates.length > 0
  ) {
    log(
      `  - Restoring ${(orgConfig as any).configTemplates.length} config template(s)...`,
    );
    for (const template of (orgConfig as any).configTemplates) {
      try {
        const { id, ...templateBody } = template;
        await createOrganizationConfigTemplate(
          apiKey,
          region,
          orgId,
          templateBody,
        );
        log(`    ✅ Config template "${template.name}" created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create config template: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.orgConfigTemplates) {
    log(`  - ⏩ Skipping Config Templates (category not selected).`);
  }

  // Login Security
  if (cats.orgLoginSecurity) {
    await runRestore("Login Security", (orgConfig as any).loginSecurity, () =>
      updateOrganizationLoginSecurity(
        apiKey,
        region,
        orgId,
        (orgConfig as any).loginSecurity!,
      ),
    );
  } else {
    log(`  - ⏩ Skipping Login Security (category not selected).`);
  }

  // SAML Roles
  if (
    cats.orgSamlRoles &&
    (orgConfig as any).samlRoles &&
    (orgConfig as any).samlRoles.length > 0
  ) {
    log(`  - Restoring ${(orgConfig as any).samlRoles.length} SAML role(s)...`);
    for (const role of (orgConfig as any).samlRoles) {
      try {
        const { id, ...roleBody } = role;
        await createOrganizationSamlRole(apiKey, region, orgId, roleBody);
        log(`    ✅ SAML role created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create SAML role: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.orgSamlRoles) {
    log(`  - ⏩ Skipping SAML Roles (category not selected).`);
  }

  // Webhook HTTP Servers (Org-level)
  if (
    cats.orgWebhooks &&
    (orgConfig as any).webhookHttpServers &&
    (orgConfig as any).webhookHttpServers.length > 0
  ) {
    log(
      `  - Restoring ${(orgConfig as any).webhookHttpServers.length} webhook HTTP server(s)...`,
    );
    for (const server of (orgConfig as any).webhookHttpServers) {
      try {
        const { id, ...serverBody } = server;
        await createOrganizationWebhookHttpServer(
          apiKey,
          region,
          orgId,
          serverBody,
        );
        log(`    ✅ Webhook server "${server.name}" created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create webhook server: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.orgWebhooks) {
    log(`  - ⏩ Skipping Webhook HTTP Servers (category not selected).`);
  }

  // Organization Details
  if (cats.orgDetails) {
    await runRestore(
      "Organization Details",
      (orgConfig as any).organizationDetails,
      () =>
        updateOrganization(
          apiKey,
          region,
          orgId,
          (orgConfig as any).organizationDetails!,
        ),
    );
  } else {
    log(`  - ⏩ Skipping Organization Details (category not selected).`);
  }

  // Branding Policies Priorities
  if (cats.orgBrandingPoliciesPriorities) {
    await runRestore(
      "Branding Policies Priorities",
      (orgConfig as any).brandingPoliciesPriorities,
      () =>
        updateOrganizationBrandingPoliciesPriorities(
          apiKey,
          region,
          orgId,
          (orgConfig as any).brandingPoliciesPriorities!,
        ),
    );
  } else {
    log(
      `  - ⏩ Skipping Branding Policies Priorities (category not selected).`,
    );
  }

  // Appliance Security Intrusion (Org-level)
  if (cats.orgApplianceSecurityIntrusion) {
    await runRestore(
      "Appliance Security Intrusion (Org)",
      (orgConfig as any).applianceSecurityIntrusion,
      () =>
        updateOrganizationApplianceSecurityIntrusion(
          apiKey,
          region,
          orgId,
          (orgConfig as any).applianceSecurityIntrusion!,
        ),
    );
  } else {
    log(
      `  - ⏩ Skipping Appliance Security Intrusion (Org-level) (category not selected).`,
    );
  }

  return successCount;
};

export const restoreDeviceConfiguration = async (
  apiKey: string,
  region: string,
  serial: string,
  deviceConfig: DeviceConfigBackup,
  cats: RestoreCategories,
  log: (msg: string) => void,
): Promise<boolean> => {
  try {
    // Restore device name / tags / notes (always restore general settings)
    const { name, tags, notes } = deviceConfig.general;
    if (name) {
      log(`  - Restoring general settings for ${serial} (Name: ${name})...`);
      await updateDevice(apiKey, region, serial, { name, tags, notes });
      log(`    ✅ General settings restored.`);
    } else {
      log(`  - ⏩ Skipping name restore for ${serial} (no name in backup).`);
    }

    // Restore switch ports
    if (
      cats.switchPorts &&
      deviceConfig.switchPorts &&
      deviceConfig.switchPorts.length > 0
    ) {
      log(
        `  - Restoring ${deviceConfig.switchPorts.length} switch port configuration(s)...`,
      );
      for (const port of deviceConfig.switchPorts) {
        try {
          const { portId, ...portConfig } = port;
          await updateSwitchPort(apiKey, region, serial, portId, portConfig);
          log(`    ✅ Port ${portId} restored.`);
        } catch (portError) {
          log(
            `    ❌ FAILED to restore port ${port.portId}: ${portError instanceof Error ? portError.message : String(portError)}`,
          );
        }
      }
    } else if (!cats.switchPorts) {
      log(`  - ⏩ Skipping Switch Ports (category not selected).`);
    }

    // Restore switch routing interfaces (SVIs) + static routes
    if (
      cats.switchRoutingInterfaces &&
      deviceConfig.routingInterfaces &&
      deviceConfig.routingInterfaces.length > 0
    ) {
      log(
        `  - Restoring ${deviceConfig.routingInterfaces.length} routing interface(s) (SVIs)...`,
      );
      const existingInterfaces = await getDeviceSwitchRoutingInterfaces(
        apiKey,
        region,
        serial,
      ).catch(() => [] as SwitchRoutingInterface[]);
      const existingByVlan = new Map(
        existingInterfaces.map((i) => [i.vlanId, i.interfaceId]),
      );

      for (const iface of deviceConfig.routingInterfaces) {
        try {
          const { interfaceId, ...ifaceBody } = iface;
          const existingId =
            iface.vlanId != null ? existingByVlan.get(iface.vlanId) : undefined;
          if (existingId) {
            await updateDeviceSwitchRoutingInterface(
              apiKey,
              region,
              serial,
              existingId,
              ifaceBody,
            );
            log(`    ✅ Routing interface (VLAN ${iface.vlanId}) updated.`);
          } else {
            await createDeviceSwitchRoutingInterface(
              apiKey,
              region,
              serial,
              ifaceBody,
            );
            log(`    ✅ Routing interface (VLAN ${iface.vlanId}) created.`);
          }
        } catch (ifaceError) {
          log(
            `    ❌ FAILED to restore routing interface ${iface.name}: ${ifaceError instanceof Error ? ifaceError.message : String(ifaceError)}`,
          );
        }
      }
    } else if (!cats.switchRoutingInterfaces) {
      log(`  - ⏩ Skipping Switch Routing Interfaces (category not selected).`);
    }

    if (
      cats.switchRoutingInterfaces &&
      deviceConfig.staticRoutes &&
      deviceConfig.staticRoutes.length > 0
    ) {
      log(
        `  - Restoring ${deviceConfig.staticRoutes.length} static route(s)...`,
      );
      for (const route of deviceConfig.staticRoutes) {
        try {
          const { staticRouteId, ...routeBody } = route as any;
          await createDeviceSwitchRoutingStaticRoute(
            apiKey,
            region,
            serial,
            routeBody,
          );
          log(
            `    ✅ Static route ${route.subnet} → ${route.nextHopIp} created.`,
          );
        } catch (routeError) {
          log(
            `    ❌ FAILED to restore static route ${route.subnet}: ${routeError instanceof Error ? routeError.message : String(routeError)}`,
          );
        }
      }
    }

    // Management Interface
    if (cats.managementInterface && deviceConfig.managementInterface) {
      log(`  - Restoring management interface settings...`);
      try {
        await updateDeviceManagementInterface(
          apiKey,
          region,
          serial,
          deviceConfig.managementInterface,
        );
        log(`    ✅ Management interface restored.`);
      } catch (e) {
        log(
          `    ❌ FAILED to restore management interface: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    } else if (!cats.managementInterface) {
      log(`  - ⏩ Skipping Management Interface (category not selected).`);
    }

    // Wireless Radio Settings
    if (cats.wirelessRadioSettings && deviceConfig.wirelessRadioSettings) {
      log(`  - Restoring wireless radio settings...`);
      try {
        await updateDeviceWirelessRadioSettings(
          apiKey,
          region,
          serial,
          deviceConfig.wirelessRadioSettings,
        );
        log(`    ✅ Wireless radio settings restored.`);
      } catch (e) {
        log(
          `    ❌ FAILED to restore wireless radio settings: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    } else if (!cats.wirelessRadioSettings) {
      log(`  - ⏩ Skipping Wireless Radio Settings (category not selected).`);
    }

    // Device Switch OSPF
    if (cats.deviceSwitchOspf && (deviceConfig as any).switchOspf) {
      log(`  - Restoring device-level switch OSPF settings...`);
      try {
        await updateDeviceSwitchRoutingOspf(
          apiKey,
          region,
          serial,
          (deviceConfig as any).switchOspf,
        );
        log(`    ✅ Device switch OSPF restored.`);
      } catch (e) {
        log(
          `    ❌ FAILED to restore device switch OSPF: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    } else if (!cats.deviceSwitchOspf) {
      log(`  - ⏩ Skipping Device Switch OSPF (category not selected).`);
    }

    // Device Switch STP
    if (cats.deviceSwitchStp && (deviceConfig as any).switchStp) {
      log(`  - Restoring device-level switch STP settings...`);
      try {
        await updateDeviceSwitchStp(
          apiKey,
          region,
          serial,
          (deviceConfig as any).switchStp,
        );
        log(`    ✅ Device switch STP restored.`);
      } catch (e) {
        log(
          `    ❌ FAILED to restore device switch STP: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    } else if (!cats.deviceSwitchStp) {
      log(`  - ⏩ Skipping Device Switch STP (category not selected).`);
    }

    // Device Appliance Uplink Settings
    if (
      cats.deviceApplianceUplink &&
      (deviceConfig as any).applianceUplinkSettings
    ) {
      log(`  - Restoring device appliance uplink settings...`);
      try {
        await updateDeviceApplianceUplinkSettings(
          apiKey,
          region,
          serial,
          (deviceConfig as any).applianceUplinkSettings,
        );
        log(`    ✅ Device appliance uplink settings restored.`);
      } catch (e) {
        log(
          `    ❌ FAILED to restore device appliance uplink settings: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    } else if (!cats.deviceApplianceUplink) {
      log(`  - ⏩ Skipping Device Appliance Uplink (category not selected).`);
    }

    // Device Appliance DHCP Subnets
    if (
      cats.deviceApplianceDhcpSubnets &&
      (deviceConfig as any).applianceDhcpSubnets &&
      (deviceConfig as any).applianceDhcpSubnets.length > 0
    ) {
      log(
        `  - Restoring ${(deviceConfig as any).applianceDhcpSubnets.length} device appliance DHCP subnet(s)...`,
      );
      for (const subnet of (deviceConfig as any).applianceDhcpSubnets) {
        try {
          const { vlanId, ...subnetBody } = subnet;
          // Try creating first, fall back to update if exists
          try {
            await createDeviceApplianceDhcpSubnet(apiKey, region, serial, {
              vlanId,
              ...subnetBody,
            });
            log(`    ✅ DHCP subnet for VLAN ${vlanId} created.`);
          } catch (createErr: any) {
            if (
              createErr?.message?.toLowerCase().includes("already") ||
              createErr?.message?.toLowerCase().includes("exist")
            ) {
              await updateDeviceApplianceDhcpSubnet(
                apiKey,
                region,
                serial,
                vlanId,
                subnetBody,
              );
              log(`    ✅ DHCP subnet for VLAN ${vlanId} updated.`);
            } else {
              throw createErr;
            }
          }
        } catch (e) {
          log(
            `    ❌ FAILED to restore DHCP subnet: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    } else if (!cats.deviceApplianceDhcpSubnets) {
      log(
        `  - ⏩ Skipping Device Appliance DHCP Subnets (category not selected).`,
      );
    }

    return true;
  } catch (e) {
    log(
      `  - ❌ FAILED to restore device configuration for ${serial}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return false;
  }
};

export const restoreNetworkConfiguration = async (
  apiKey: string,
  region: string,
  networkId: string,
  networkConfig: NetworkConfigBackup,
  cats: RestoreCategories,
  log: (msg: string) => void,
): Promise<number> => {
  let successCount = 0;

  const runRestore = async (
    name: string,
    backupData: any,
    cat: boolean,
    restoreFn: () => Promise<any>,
  ) => {
    if (!cat) {
      log(`  - ⏩ Skipping ${name} (category not selected).`);
      return;
    }
    if (backupData && (!Array.isArray(backupData) || backupData.length > 0)) {
      log(`  - Restoring ${name}...`);
      try {
        await restoreFn();
        log(`    ✅ ${name} restored successfully.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to restore ${name}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    } else {
      log(`  - ⏩ Skipping ${name} (no backup data).`);
    }
  };

  // --- Appliance (MX) settings ---

  // Enable VLAN mode on the destination MX before attempting any VLAN operations
  let vlanModeReady = true;
  if (cats.vlans && networkConfig.applianceVlansSettings?.vlansEnabled) {
    log(`  - Enabling VLAN mode on destination MX...`);
    try {
      await updateNetworkApplianceVlansSettings(apiKey, region, networkId, {
        vlansEnabled: true,
      });
      log(`    ✅ VLAN mode enabled.`);
    } catch (e) {
      log(
        `    ❌ FAILED to enable VLAN mode: ${e instanceof Error ? e.message : String(e)}`,
      );
      log(`    ⚠️  Skipping VLAN restore — VLAN mode must be enabled first.`);
      vlanModeReady = false;
    }
  }

  // VLANs
  await runRestore(
    "VLANs",
    vlanModeReady ? networkConfig.applianceVlans : undefined,
    cats.vlans,
    async () => {
      if (networkConfig.applianceVlans) {
        for (const vlan of networkConfig.applianceVlans) {
          const {
            networkId: _srcNetId,
            mask: _mask,
            ...vlanWithId
          } = vlan as any;
          const { id, ...vlanWithoutId } = vlanWithId;

          if (String(id) === "1") {
            await updateNetworkApplianceVlan(
              apiKey,
              region,
              networkId,
              id,
              vlanWithoutId,
            );
            continue;
          }
          try {
            await createNetworkApplianceVlan(apiKey, region, networkId, {
              id,
              ...vlanWithoutId,
            });
          } catch (createErr: any) {
            if (
              createErr?.message?.toLowerCase().includes("already") ||
              createErr?.message?.toLowerCase().includes("exist")
            ) {
              await updateNetworkApplianceVlan(
                apiKey,
                region,
                networkId,
                id,
                vlanWithoutId,
              );
            } else {
              throw createErr;
            }
          }
        }
      }
    },
  );

  await runRestore(
    "L3 Firewall Rules",
    networkConfig.applianceL3FirewallRules,
    cats.applianceFirewallL3,
    () =>
      updateNetworkApplianceFirewallL3FirewallRules(
        apiKey,
        region,
        networkId,
        networkConfig.applianceL3FirewallRules!,
      ),
  );

  await runRestore(
    "L7 Firewall Rules",
    networkConfig.applianceL7FirewallRules,
    cats.applianceFirewallL7,
    () =>
      updateNetworkApplianceFirewallL7FirewallRules(
        apiKey,
        region,
        networkId,
        networkConfig.applianceL7FirewallRules!,
      ),
  );

  await runRestore(
    "Content Filtering",
    networkConfig.contentFiltering,
    cats.contentFiltering,
    () =>
      updateNetworkApplianceContentFiltering(
        apiKey,
        region,
        networkId,
        networkConfig.contentFiltering!,
      ),
  );

  // Intrusion + Malware (applianceSecurity)
  await runRestore(
    "Intrusion Settings",
    networkConfig.intrusionSettings,
    cats.applianceSecurity,
    () =>
      updateNetworkApplianceSecurityIntrusion(
        apiKey,
        region,
        networkId,
        networkConfig.intrusionSettings!,
      ),
  );

  await runRestore(
    "Malware Settings",
    networkConfig.malwareSettings,
    cats.applianceSecurity,
    () =>
      updateNetworkApplianceSecurityMalware(
        apiKey,
        region,
        networkId,
        networkConfig.malwareSettings!,
      ),
  );

  // Traffic Shaping + Uplink Selection (trafficShaping)
  await runRestore(
    "Appliance Traffic Shaping Rules",
    networkConfig.trafficShapingRules,
    cats.trafficShaping,
    () =>
      updateNetworkApplianceTrafficShapingRules(
        apiKey,
        region,
        networkId,
        networkConfig.trafficShapingRules!,
      ),
  );

  await runRestore(
    "Uplink Selection",
    networkConfig.uplinkSelection,
    cats.trafficShaping,
    () =>
      updateNetworkApplianceUplinkSelection(
        apiKey,
        region,
        networkId,
        networkConfig.uplinkSelection!,
      ),
  );

  await runRestore(
    "BGP Settings",
    networkConfig.bgpSettings,
    cats.bgpSettings,
    () =>
      updateNetworkApplianceVpnBgp(
        apiKey,
        region,
        networkId,
        networkConfig.bgpSettings!,
      ),
  );

  await runRestore(
    "Site-to-Site VPN",
    networkConfig.siteToSiteVpnSettings,
    cats.siteToSiteVpn,
    () =>
      updateNetworkApplianceVpnSiteToSiteVpn(
        apiKey,
        region,
        networkId,
        networkConfig.siteToSiteVpnSettings!,
      ),
  );

  await runRestore(
    "Appliance Settings",
    networkConfig.applianceSettings,
    cats.applianceSettings,
    () =>
      updateNetworkApplianceSettings(
        apiKey,
        region,
        networkId,
        networkConfig.applianceSettings!,
      ),
  );

  // Appliance static routes
  if (
    cats.applianceStaticRoutes &&
    networkConfig.staticRoutes &&
    networkConfig.staticRoutes.length > 0
  ) {
    log(
      `  - Restoring ${networkConfig.staticRoutes.length} appliance static route(s)...`,
    );
    for (const route of networkConfig.staticRoutes as ApplianceStaticRoute[]) {
      try {
        const { id: _id, networkId: _rNetId, ...routeBody } = route as any;
        await createNetworkApplianceStaticRoute(
          apiKey,
          region,
          networkId,
          routeBody,
        );
        log(`    ✅ Static route ${route.subnet} restored.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to restore static route ${route.subnet}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.applianceStaticRoutes) {
    log(`  - ⏩ Skipping Appliance Static Routes (category not selected).`);
  } else {
    log(`  - ⏩ Skipping Appliance Static Routes (no backup data).`);
  }

  // --- Switch (MS) network settings ---

  await runRestore(
    "Switch Settings",
    networkConfig.switchSettings,
    cats.switchSettings,
    () =>
      updateNetworkSwitchSettings(
        apiKey,
        region,
        networkId,
        networkConfig.switchSettings!,
      ),
  );

  await runRestore(
    "Switch ACLs",
    networkConfig.switchAcls,
    cats.switchAcls,
    () =>
      updateNetworkSwitchAccessControlLists(
        apiKey,
        region,
        networkId,
        networkConfig.switchAcls!,
      ),
  );

  await runRestore(
    "DHCP Server Policy",
    networkConfig.dhcpServerPolicy,
    cats.dhcpServerPolicy,
    () =>
      updateNetworkSwitchDhcpServerPolicy(
        apiKey,
        region,
        networkId,
        networkConfig.dhcpServerPolicy!,
      ),
  );

  await runRestore(
    "Storm Control",
    networkConfig.stormControl,
    cats.stormControl,
    () =>
      updateNetworkSwitchStormControl(
        apiKey,
        region,
        networkId,
        networkConfig.stormControl!,
      ),
  );

  await runRestore("Switch MTU", networkConfig.switchMtu, cats.switchMtu, () =>
    updateNetworkSwitchMtu(apiKey, region, networkId, networkConfig.switchMtu!),
  );

  await runRestore(
    "Switch OSPF",
    networkConfig.switchOspf,
    cats.switchOspf,
    () =>
      updateNetworkSwitchOspf(
        apiKey,
        region,
        networkId,
        networkConfig.switchOspf!,
      ),
  );

  // QoS Rules
  await runRestore("QoS Rules", networkConfig.qosRules, cats.qosRules, () =>
    updateNetworkSwitchQosRules(apiKey, region, networkId, {
      rules: networkConfig.qosRules,
    }),
  );

  // Link Aggregations
  if (
    cats.switchLinkAggregations &&
    networkConfig.switchLinkAggregations &&
    networkConfig.switchLinkAggregations.length > 0
  ) {
    log(
      `  - Restoring ${networkConfig.switchLinkAggregations.length} link aggregation(s)...`,
    );
    for (const agg of networkConfig.switchLinkAggregations) {
      try {
        const { id, ...aggBody } = agg as any;
        await createNetworkSwitchLinkAggregation(
          apiKey,
          region,
          networkId,
          aggBody,
        );
        log(`    ✅ Link aggregation created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create link aggregation: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.switchLinkAggregations) {
    log(`  - ⏩ Skipping Link Aggregations (category not selected).`);
  } else {
    log(`  - ⏩ Skipping Link Aggregations (no backup data).`);
  }

  // --- Wireless (MR) ---

  // SSIDs (base config)
  if (cats.ssids && networkConfig.ssids && networkConfig.ssids.length > 0) {
    log(`  - Restoring ${networkConfig.ssids.length} SSID(s)...`);
    const destSsids = await getNetworkWirelessSsids(
      apiKey,
      region,
      networkId,
    ).catch(() => [] as WirelessSsid[]);
    for (const ssid of networkConfig.ssids) {
      try {
        const destSsid = destSsids.find((ds) => ds.number === ssid.number);
        if (destSsid !== undefined) {
          await updateNetworkWirelessSsid(
            apiKey,
            region,
            networkId,
            ssid.number,
            ssid,
          );
          log(`    ✅ SSID "${ssid.name}" (${ssid.number}) restored.`);
          successCount++;
        } else {
          log(
            `    ⚠️ No matching SSID slot ${ssid.number} in destination — skipped.`,
          );
        }
      } catch (e) {
        log(
          `    ❌ FAILED to restore SSID "${ssid.name}": ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.ssids) {
    log(`  - ⏩ Skipping SSIDs (category not selected).`);
  } else {
    log(`  - ⏩ Skipping SSIDs (no backup data).`);
  }

  // SSID Firewall Rules (L3 + L7)
  if (cats.ssidFirewallRules && networkConfig.ssidFirewallL3Rules) {
    for (const [ssidNumStr, rules] of Object.entries(
      networkConfig.ssidFirewallL3Rules,
    )) {
      const ssidNum = parseInt(ssidNumStr, 10);
      await runRestore(
        `SSID ${ssidNum} L3 Firewall Rules`,
        rules,
        cats.ssidFirewallRules,
        () =>
          updateNetworkWirelessSsidFirewallL3Rules(
            apiKey,
            region,
            networkId,
            ssidNum,
            rules,
          ),
      );
    }
  }
  if (cats.ssidFirewallRules && networkConfig.ssidFirewallL7Rules) {
    for (const [ssidNumStr, rules] of Object.entries(
      networkConfig.ssidFirewallL7Rules,
    )) {
      const ssidNum = parseInt(ssidNumStr, 10);
      await runRestore(
        `SSID ${ssidNum} L7 Firewall Rules`,
        rules,
        cats.ssidFirewallRules,
        () =>
          updateNetworkWirelessSsidFirewallL7Rules(
            apiKey,
            region,
            networkId,
            ssidNum,
            rules,
          ),
      );
    }
  }

  // SSID Traffic Shaping
  if (cats.ssidTrafficShaping && networkConfig.ssidTrafficShaping) {
    for (const [ssidNumStr, rules] of Object.entries(
      networkConfig.ssidTrafficShaping,
    )) {
      const ssidNum = parseInt(ssidNumStr, 10);
      await runRestore(
        `SSID ${ssidNum} Traffic Shaping`,
        rules,
        cats.ssidTrafficShaping,
        () =>
          updateNetworkWirelessSsidTrafficShapingRules(
            apiKey,
            region,
            networkId,
            ssidNum,
            rules,
          ),
      );
    }
  }

  // Wireless RF Profiles
  if (
    cats.wirelessRfProfiles &&
    networkConfig.wirelessRfProfiles &&
    networkConfig.wirelessRfProfiles.length > 0
  ) {
    log(
      `  - Restoring ${networkConfig.wirelessRfProfiles.length} RF profile(s)...`,
    );
    for (const profile of networkConfig.wirelessRfProfiles) {
      try {
        const { id, networkId: _nid, ...profileBody } = profile as any;
        await createNetworkWirelessRfProfile(
          apiKey,
          region,
          networkId,
          profileBody,
        );
        log(`    ✅ RF profile "${profile.name}" created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create RF profile "${profile.name}": ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.wirelessRfProfiles) {
    log(`  - ⏩ Skipping RF Profiles (category not selected).`);
  } else {
    log(`  - ⏩ Skipping RF Profiles (no backup data).`);
  }

  await runRestore(
    "Bluetooth Settings",
    networkConfig.bluetoothSettings,
    cats.bluetoothSettings,
    () =>
      updateNetworkWirelessBluetoothSettings(
        apiKey,
        region,
        networkId,
        networkConfig.bluetoothSettings!,
      ),
  );

  await runRestore(
    "Wireless Settings",
    networkConfig.wirelessSettings,
    cats.wirelessSettings,
    () =>
      updateNetworkWirelessSettings(
        apiKey,
        region,
        networkId,
        networkConfig.wirelessSettings!,
      ),
  );

  // --- Network General ---

  await runRestore(
    "Syslog Servers",
    networkConfig.syslogServers,
    cats.syslogServers,
    () =>
      updateNetworkSyslogServers(
        apiKey,
        region,
        networkId,
        networkConfig.syslogServers!,
      ),
  );

  // Group Policies
  if (
    cats.groupPolicies &&
    networkConfig.groupPolicies &&
    networkConfig.groupPolicies.length > 0
  ) {
    log(
      `  - Restoring ${networkConfig.groupPolicies.length} Group Policies...`,
    );
    for (const policy of networkConfig.groupPolicies) {
      try {
        const { groupPolicyId, ...policyData } = policy;
        await createNetworkGroupPolicy(apiKey, region, networkId, policyData);
        log(`    ✅ Group Policy "${policy.name}" restored.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to restore Group Policy "${policy.name}": ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.groupPolicies) {
    log(`  - ⏩ Skipping Group Policies (category not selected).`);
  } else {
    log(`  - ⏩ Skipping Group Policies (no backup data).`);
  }

  await runRestore("Network SNMP", networkConfig.snmp, cats.networkSnmp, () =>
    updateNetworkSnmp(apiKey, region, networkId, networkConfig.snmp!),
  );

  await runRestore(
    "Network Alerts",
    networkConfig.networkAlerts,
    cats.networkAlerts,
    () =>
      updateNetworkAlertsSettings(
        apiKey,
        region,
        networkId,
        networkConfig.networkAlerts!,
      ),
  );

  // --- Additional Appliance Settings ---

  await runRestore(
    "Cellular Firewall Rules",
    (networkConfig as any).cellularFirewallRules,
    cats.cellularFirewallRules,
    () =>
      updateNetworkApplianceFirewallCellularFirewallRules(
        apiKey,
        region,
        networkId,
        (networkConfig as any).cellularFirewallRules!,
      ),
  );

  await runRestore(
    "Inbound Firewall Rules",
    (networkConfig as any).inboundFirewallRules,
    cats.inboundFirewallRules,
    () =>
      updateNetworkApplianceFirewallInboundFirewallRules(
        apiKey,
        region,
        networkId,
        (networkConfig as any).inboundFirewallRules!,
      ),
  );

  await runRestore(
    "One-to-Many NAT Rules",
    (networkConfig as any).oneToManyNatRules,
    cats.oneToManyNat,
    () =>
      updateNetworkApplianceFirewallOneToManyNatRules(
        apiKey,
        region,
        networkId,
        (networkConfig as any).oneToManyNatRules!,
      ),
  );

  await runRestore(
    "One-to-One NAT Rules",
    (networkConfig as any).oneToOneNatRules,
    cats.oneToOneNat,
    () =>
      updateNetworkApplianceFirewallOneToOneNatRules(
        apiKey,
        region,
        networkId,
        (networkConfig as any).oneToOneNatRules!,
      ),
  );

  await runRestore(
    "Port Forwarding Rules",
    (networkConfig as any).portForwardingRules,
    cats.portForwardingRules,
    () =>
      updateNetworkApplianceFirewallPortForwardingRules(
        apiKey,
        region,
        networkId,
        (networkConfig as any).portForwardingRules!,
      ),
  );

  await runRestore(
    "Traffic Shaping General",
    (networkConfig as any).trafficShaping,
    cats.trafficShapingGeneral,
    () =>
      updateNetworkApplianceTrafficShaping(
        apiKey,
        region,
        networkId,
        (networkConfig as any).trafficShaping!,
      ),
  );

  // Custom Performance Classes
  if (
    cats.customPerformanceClasses &&
    (networkConfig as any).customPerformanceClasses &&
    (networkConfig as any).customPerformanceClasses.length > 0
  ) {
    log(
      `  - Restoring ${(networkConfig as any).customPerformanceClasses.length} custom performance class(es)...`,
    );
    for (const perfClass of (networkConfig as any).customPerformanceClasses) {
      try {
        const { customPerformanceClassId, ...classBody } = perfClass;
        await createNetworkApplianceTrafficShapingCustomPerformanceClass(
          apiKey,
          region,
          networkId,
          classBody,
        );
        log(`    ✅ Custom performance class created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create custom performance class: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.customPerformanceClasses) {
    log(`  - ⏩ Skipping Custom Performance Classes (category not selected).`);
  }

  await runRestore(
    "Connectivity Monitoring Destinations",
    (networkConfig as any).connectivityMonitoring,
    cats.applianceConnectivityMonitoring,
    () =>
      updateNetworkApplianceConnectivityMonitoringDestinations(
        apiKey,
        region,
        networkId,
        (networkConfig as any).connectivityMonitoring!,
      ),
  );

  await runRestore(
    "Appliance Uplinks Settings",
    (networkConfig as any).applianceUplinksSettings,
    cats.applianceUplinksSettings,
    () =>
      updateNetworkApplianceUplinksSettings(
        apiKey,
        region,
        networkId,
        (networkConfig as any).applianceUplinksSettings!,
      ),
  );

  // --- Additional Switch Settings ---

  // Switch Access Policies
  if (
    cats.switchAccessPolicies &&
    (networkConfig as any).switchAccessPolicies &&
    (networkConfig as any).switchAccessPolicies.length > 0
  ) {
    log(
      `  - Restoring ${(networkConfig as any).switchAccessPolicies.length} switch access polic(ies)...`,
    );
    for (const policy of (networkConfig as any).switchAccessPolicies) {
      try {
        const { accessPolicyId, ...policyBody } = policy;
        await createNetworkSwitchAccessPolicy(
          apiKey,
          region,
          networkId,
          policyBody,
        );
        log(`    ✅ Switch access policy created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create switch access policy: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.switchAccessPolicies) {
    log(`  - ⏩ Skipping Switch Access Policies (category not selected).`);
  }

  await runRestore(
    "Network STP",
    (networkConfig as any).switchStp,
    cats.networkStp,
    () =>
      updateNetworkSwitchStp(
        apiKey,
        region,
        networkId,
        (networkConfig as any).switchStp!,
      ),
  );

  // --- Additional Wireless Settings ---

  // SSID-specific advanced settings
  if (networkConfig.ssids && networkConfig.ssids.length > 0) {
    for (const ssid of networkConfig.ssids) {
      const ssidNum = ssid.number;
      const ssidName = ssid.name || `SSID ${ssidNum}`;

      // Bonjour Forwarding
      if (cats.ssidBonjourForwarding && (ssid as any).bonjourForwarding) {
        await runRestore(
          `Bonjour Forwarding (${ssidName})`,
          (ssid as any).bonjourForwarding,
          cats.ssidBonjourForwarding,
          () =>
            updateNetworkWirelessSsidBonjourForwarding(
              apiKey,
              region,
              networkId,
              ssidNum,
              (ssid as any).bonjourForwarding!,
            ),
        );
      }

      // Device Type Group Policies
      if (
        cats.ssidDeviceTypeGroupPolicies &&
        (ssid as any).deviceTypeGroupPolicies
      ) {
        await runRestore(
          `Device Type Group Policies (${ssidName})`,
          (ssid as any).deviceTypeGroupPolicies,
          cats.ssidDeviceTypeGroupPolicies,
          () =>
            updateNetworkWirelessSsidDeviceTypeGroupPolicies(
              apiKey,
              region,
              networkId,
              ssidNum,
              (ssid as any).deviceTypeGroupPolicies!,
            ),
        );
      }

      // Hotspot 2.0
      if (cats.ssidHotspot20 && (ssid as any).hotspot20) {
        await runRestore(
          `Hotspot 2.0 (${ssidName})`,
          (ssid as any).hotspot20,
          cats.ssidHotspot20,
          () =>
            updateNetworkWirelessSsidHotspot20(
              apiKey,
              region,
              networkId,
              ssidNum,
              (ssid as any).hotspot20!,
            ),
        );
      }

      // Identity PSKs
      if (
        cats.ssidIdentityPsks &&
        (ssid as any).identityPsks &&
        (ssid as any).identityPsks.length > 0
      ) {
        log(
          `  - Restoring ${(ssid as any).identityPsks.length} Identity PSK(s) for ${ssidName}...`,
        );
        for (const psk of (ssid as any).identityPsks) {
          try {
            const { id, ...pskBody } = psk;
            await createNetworkWirelessSsidIdentityPsk(
              apiKey,
              region,
              networkId,
              ssidNum,
              pskBody,
            );
            log(`    ✅ Identity PSK created.`);
            successCount++;
          } catch (e) {
            log(
              `    ❌ FAILED to create Identity PSK: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }
      }

      // SSID Schedules
      if (cats.ssidSchedules && (ssid as any).schedules) {
        await runRestore(
          `SSID Schedules (${ssidName})`,
          (ssid as any).schedules,
          cats.ssidSchedules,
          () =>
            updateNetworkWirelessSsidSchedules(
              apiKey,
              region,
              networkId,
              ssidNum,
              (ssid as any).schedules!,
            ),
        );
      }

      // Splash Settings
      if (cats.ssidSplashSettings && (ssid as any).splashSettings) {
        await runRestore(
          `Splash Settings (${ssidName})`,
          (ssid as any).splashSettings,
          cats.ssidSplashSettings,
          () =>
            updateNetworkWirelessSsidSplashSettings(
              apiKey,
              region,
              networkId,
              ssidNum,
              (ssid as any).splashSettings!,
            ),
        );
      }

      // VPN Settings
      if (cats.ssidVpnSettings && (ssid as any).vpn) {
        await runRestore(
          `VPN Settings (${ssidName})`,
          (ssid as any).vpn,
          cats.ssidVpnSettings,
          () =>
            updateNetworkWirelessSsidVpn(
              apiKey,
              region,
              networkId,
              ssidNum,
              (ssid as any).vpn!,
            ),
        );
      }
    }
  }

  await runRestore(
    "Alternate Management Interface",
    (networkConfig as any).alternateManagementInterface,
    cats.alternateManagementInterface,
    () =>
      updateNetworkWirelessAlternateManagementInterface(
        apiKey,
        region,
        networkId,
        (networkConfig as any).alternateManagementInterface!,
      ),
  );

  await runRestore(
    "Wireless Billing",
    (networkConfig as any).wirelessBilling,
    cats.wirelessBilling,
    () =>
      updateNetworkWirelessBilling(
        apiKey,
        region,
        networkId,
        (networkConfig as any).wirelessBilling!,
      ),
  );

  // --- Additional Network General Settings ---

  await runRestore(
    "Network Settings",
    (networkConfig as any).networkSettings,
    cats.networkSettings,
    () =>
      updateNetworkSettings(
        apiKey,
        region,
        networkId,
        (networkConfig as any).networkSettings!,
      ),
  );

  // Floor Plans
  if (
    cats.floorPlans &&
    (networkConfig as any).floorPlans &&
    (networkConfig as any).floorPlans.length > 0
  ) {
    log(
      `  - Restoring ${(networkConfig as any).floorPlans.length} floor plan(s)...`,
    );
    for (const plan of (networkConfig as any).floorPlans) {
      try {
        const { floorPlanId, ...planBody } = plan;
        await createNetworkFloorPlan(apiKey, region, networkId, planBody);
        log(`    ✅ Floor plan "${plan.name}" created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create floor plan: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.floorPlans) {
    log(`  - ⏩ Skipping Floor Plans (category not selected).`);
  }

  await runRestore(
    "Netflow Settings",
    (networkConfig as any).netflow,
    cats.netflowSettings,
    () =>
      updateNetworkNetflow(
        apiKey,
        region,
        networkId,
        (networkConfig as any).netflow!,
      ),
  );

  await runRestore(
    "Traffic Analysis",
    (networkConfig as any).trafficAnalysis,
    cats.trafficAnalysis,
    () =>
      updateNetworkTrafficAnalysis(
        apiKey,
        region,
        networkId,
        (networkConfig as any).trafficAnalysis!,
      ),
  );

  // VLAN Profiles
  if (
    cats.vlanProfiles &&
    (networkConfig as any).vlanProfiles &&
    (networkConfig as any).vlanProfiles.length > 0
  ) {
    log(
      `  - Restoring ${(networkConfig as any).vlanProfiles.length} VLAN profile(s)...`,
    );
    for (const profile of (networkConfig as any).vlanProfiles) {
      try {
        const { iname, ...profileBody } = profile;
        await createNetworkVlanProfile(apiKey, region, networkId, profileBody);
        log(`    ✅ VLAN profile created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create VLAN profile: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.vlanProfiles) {
    log(`  - ⏩ Skipping VLAN Profiles (category not selected).`);
  }

  // Network Webhook HTTP Servers
  if (
    cats.networkWebhooks &&
    (networkConfig as any).webhookHttpServers &&
    (networkConfig as any).webhookHttpServers.length > 0
  ) {
    log(
      `  - Restoring ${(networkConfig as any).webhookHttpServers.length} network webhook HTTP server(s)...`,
    );
    for (const server of (networkConfig as any).webhookHttpServers) {
      try {
        const { id, ...serverBody } = server;
        await createNetworkWebhookHttpServer(
          apiKey,
          region,
          networkId,
          serverBody,
        );
        log(`    ✅ Webhook server "${server.name}" created.`);
        successCount++;
      } catch (e) {
        log(
          `    ❌ FAILED to create webhook server: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  } else if (!cats.networkWebhooks) {
    log(
      `  - ⏩ Skipping Network Webhook HTTP Servers (category not selected).`,
    );
  }

  // Network Details
  await runRestore(
    "Network Details",
    (networkConfig as any).networkDetails,
    cats.networkDetails,
    () =>
      updateNetwork(
        apiKey,
        region,
        networkId,
        (networkConfig as any).networkDetails!,
      ),
  );

  return successCount;
};
