import { query, getClient } from '../config/database';
import fetch from 'node-fetch';

export interface ProgressEvent {
  step: string;
  detail: string;
  status: 'running' | 'done' | 'error';
  snapshotId?: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;

export interface MerakiConfig {
  organization: any;
  networks: any[];
  devices: any[];
  organizationLevel: {
    admins?: any[];
    alertSettings?: any[];
    policyObjects?: any[];
    snmpSettings?: any;
    vpnPeers?: any[];
    vpnFirewallRules?: any;
  };
  networkLevel: Record<string, any>;
  deviceLevel: Record<string, any>;
}

export interface Snapshot {
  id: string;
  organizationId: string;
  snapshotType: 'manual' | 'scheduled' | 'pre-change' | 'post-change';
  snapshotData: MerakiConfig;
  snapshotMetadata?: any;
  sizeBytes: number;
  createdBy?: string;
  createdAt: Date;
  notes?: string;
}

function rowToSnapshot(row: any): Snapshot {
  return {
    id: row.id,
    organizationId: row.organization_id,
    snapshotType: row.snapshot_type,
    // snapshot_data is only included when fetching a single snapshot, not the list.
    snapshotData: row.snapshot_data == null
      ? null as any
      : typeof row.snapshot_data === 'string'
        ? JSON.parse(row.snapshot_data)
        : row.snapshot_data,
    snapshotMetadata: row.snapshot_metadata,
    sizeBytes: row.size_bytes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    notes: row.notes,
  };
}

export interface ConfigDiff {
  added: any[];
  modified: any[];
  removed: any[];
  summary: {
    totalChanges: number;
    devicesChanged: number;
    networksChanged: number;
  };
}

export class SnapshotService {
  /**
   * Create a new configuration snapshot
   */
  static async createSnapshot(
    organizationId: string,
    type: 'manual' | 'scheduled' | 'pre-change' | 'post-change',
    userId?: string,
    notes?: string,
    onProgress?: ProgressCallback
  ): Promise<Snapshot> {
    const emit = onProgress ?? (() => {});

    // Get organization details (API key, region)
    emit({ step: 'org', detail: 'Loading organization details…', status: 'running' });
    const orgResult = await query(
      'SELECT meraki_org_id, meraki_api_key_encrypted, meraki_region FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (orgResult.rows.length === 0) {
      throw new Error('Organization not found');
    }

    const org = orgResult.rows[0];
    emit({ step: 'org', detail: 'Organization details loaded', status: 'done' });

    // Decrypt API key (we'll implement encryption service later)
    const apiKey = this.decryptApiKey(org.meraki_api_key_encrypted);
    const region = org.meraki_region;

    // Fetch current configuration from Meraki API
    const config = await this.fetchMerakiConfig(org.meraki_org_id, apiKey, region, emit);

    // Calculate size
    const configJson = JSON.stringify(config);
    const sizeBytes = Buffer.byteLength(configJson, 'utf8');

    // Store snapshot in database
    emit({ step: 'store', detail: 'Saving snapshot to database…', status: 'running' });
    const result = await query(
      `INSERT INTO config_snapshots (organization_id, snapshot_type, snapshot_data, snapshot_metadata, size_bytes, created_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, organization_id, snapshot_type, snapshot_data, snapshot_metadata, size_bytes, created_by, created_at, notes`,
      [
        organizationId,
        type,
        JSON.stringify(config),
        JSON.stringify({ capturedAt: new Date(), apiVersion: 'v1' }),
        sizeBytes,
        userId || null,
        notes || null
      ]
    );

    const snapshot = result.rows[0];

    const kb = (sizeBytes / 1024).toFixed(1);
    emit({ step: 'store', detail: `Snapshot saved (${kb} KB)`, status: 'done' });

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, organizationId, 'snapshot.created', 'config_snapshot', snapshot.id, JSON.stringify({ type, sizeBytes })]
    );

    emit({ step: 'complete', detail: 'Snapshot created successfully', status: 'done', snapshotId: snapshot.id });

    return rowToSnapshot({ ...snapshot, snapshot_data: config });
  }

  /**
   * Fetch current configuration from Meraki API
   */
  private static async fetchMerakiConfig(
    merakiOrgId: string,
    apiKey: string,
    region: 'com' | 'in',
    emit: ProgressCallback = () => {}
  ): Promise<MerakiConfig> {
    const baseUrl = region === 'in' ? 'https://api.meraki.in/api/v1' : 'https://api.meraki.com/api/v1';
    const headers = {
      'X-Cisco-Meraki-API-Key': apiKey,
      'Content-Type': 'application/json'
    };

    // Fetch organization details
    emit({ step: 'meraki-org', detail: 'Fetching organization profile from Meraki API…', status: 'running' });
    const orgResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}`, { headers });
    const organization = await orgResponse.json();
    emit({ step: 'meraki-org', detail: `Organization: ${(organization as any).name}`, status: 'done' });

    // Fetch networks
    emit({ step: 'networks', detail: 'Fetching networks list…', status: 'running' });
    const networksResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}/networks`, { headers });
    const networks = await networksResponse.json() as any[];
    emit({ step: 'networks', detail: `Found ${networks.length} network${networks.length !== 1 ? 's' : ''}`, status: 'done' });

    // Fetch devices
    emit({ step: 'devices', detail: 'Fetching device inventory…', status: 'running' });
    const devicesResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}/devices`, { headers });
    const devices = await devicesResponse.json() as any[];
    emit({ step: 'devices', detail: `Found ${devices.length} device${devices.length !== 1 ? 's' : ''}`, status: 'done' });

    // Fetch organization-level configs
    emit({ step: 'org-config', detail: 'Fetching organization-level configuration…', status: 'running' });
    const organizationLevel: any = {};

    try {
      const adminsResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}/admins`, { headers });
      if (adminsResponse.ok) organizationLevel.admins = await adminsResponse.json();
    } catch (e) { /* Optional */ }

    try {
      const policyObjectsResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}/policyObjects`, { headers });
      if (policyObjectsResponse.ok) organizationLevel.policyObjects = await policyObjectsResponse.json();
    } catch (e) { /* Optional */ }

    try {
      const snmpResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}/snmp`, { headers });
      if (snmpResponse.ok) organizationLevel.snmpSettings = await snmpResponse.json();
    } catch (e) { /* Optional */ }

    try {
      const vpnFwResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}/appliance/vpn/vpnFirewallRules`, { headers });
      if (vpnFwResponse.ok) organizationLevel.vpnFirewallRules = await vpnFwResponse.json();
    } catch (e) { /* Optional */ }

    try {
      const alertResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}/alertSettings`, { headers });
      if (alertResponse.ok) organizationLevel.alertSettings = await alertResponse.json();
    } catch (e) { /* Optional */ }

    emit({ step: 'org-config', detail: 'Organization configuration fetched', status: 'done' });

    // Fetch network-level configs for each network
    const networkLevel: Record<string, any> = {};
    for (let i = 0; i < networks.length; i++) {
      const network = networks[i];
      const label = network.name || network.id;
      emit({ step: `net-${network.id}`, detail: `[${i + 1}/${networks.length}] Network: ${label}`, status: 'running' });
      networkLevel[network.id] = await this.fetchNetworkConfig(baseUrl, network.id, headers);
      const cfg = networkLevel[network.id];
      const vlansCount = (cfg.vlans || []).length;
      const ssidsCount = (cfg.ssids || []).length;
      emit({ step: `net-${network.id}`, detail: `${label} — ${vlansCount} VLANs, ${ssidsCount} SSIDs`, status: 'done' });
    }

    // Fetch device-level configs for each device
    const deviceLevel: Record<string, any> = {};
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const label = device.name || device.serial;
      emit({ step: `dev-${device.serial}`, detail: `[${i + 1}/${devices.length}] Device: ${label} (${device.model || 'unknown'})`, status: 'running' });
      deviceLevel[device.serial] = await this.fetchDeviceConfig(baseUrl, device.serial, headers);
      emit({ step: `dev-${device.serial}`, detail: `${label} config captured`, status: 'done' });
    }

    return {
      organization,
      networks,
      devices,
      organizationLevel,
      networkLevel,
      deviceLevel
    };
  }

  /**
   * Fetch network-level configuration
   */
  private static async fetchNetworkConfig(baseUrl: string, networkId: string, headers: any): Promise<any> {
    const config: any = {};

    try {
      const response = await fetch(`${baseUrl}/networks/${networkId}`, { headers });
      if (response.ok) config.details = await response.json();
    } catch (e) { /* Ignore */ }

    // Appliance – VLANs
    try {
      const vlansResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/vlans`, { headers });
      if (vlansResponse.ok) config.vlans = await vlansResponse.json();
    } catch (e) { /* Ignore */ }

    // Appliance – L3 firewall
    try {
      const l3RulesResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/firewall/l3FirewallRules`, { headers });
      if (l3RulesResponse.ok) config.l3FirewallRules = await l3RulesResponse.json();
    } catch (e) { /* Ignore */ }

    // Appliance – L7 firewall
    try {
      const l7RulesResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/firewall/l7FirewallRules`, { headers });
      if (l7RulesResponse.ok) config.l7FirewallRules = await l7RulesResponse.json();
    } catch (e) { /* Ignore */ }

    // Appliance – port forwarding
    try {
      const pfResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/firewall/portForwardingRules`, { headers });
      if (pfResponse.ok) config.portForwardingRules = await pfResponse.json();
    } catch (e) { /* Ignore */ }

    // Appliance – 1:1 NAT
    try {
      const natResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/firewall/oneToOneNatRules`, { headers });
      if (natResponse.ok) config.oneToOneNatRules = await natResponse.json();
    } catch (e) { /* Ignore */ }

    // Appliance – inbound firewall
    try {
      const inboundResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/firewall/inboundFirewallRules`, { headers });
      if (inboundResponse.ok) config.inboundFirewallRules = await inboundResponse.json();
    } catch (e) { /* Ignore */ }

    // Appliance – site-to-site VPN
    try {
      const vpnResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/vpn/siteToSiteVpn`, { headers });
      if (vpnResponse.ok) config.siteToSiteVpn = await vpnResponse.json();
    } catch (e) { /* Ignore */ }

    // Appliance – content filtering
    try {
      const cfResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/contentFiltering`, { headers });
      if (cfResponse.ok) config.contentFiltering = await cfResponse.json();
    } catch (e) { /* Ignore */ }

    // Appliance – traffic shaping
    try {
      const tsResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/trafficShaping`, { headers });
      if (tsResponse.ok) config.trafficShaping = await tsResponse.json();
    } catch (e) { /* Ignore */ }

    // Appliance – static routes
    try {
      const srResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/staticRoutes`, { headers });
      if (srResponse.ok) config.staticRoutes = await srResponse.json();
    } catch (e) { /* Ignore */ }

    // Group policies
    try {
      const gpResponse = await fetch(`${baseUrl}/networks/${networkId}/groupPolicies`, { headers });
      if (gpResponse.ok) config.groupPolicies = await gpResponse.json();
    } catch (e) { /* Ignore */ }

    // Wireless SSIDs
    try {
      const ssidsResponse = await fetch(`${baseUrl}/networks/${networkId}/wireless/ssids`, { headers });
      if (ssidsResponse.ok) config.ssids = await ssidsResponse.json();
    } catch (e) { /* Ignore */ }

    // Network alert settings
    try {
      const alertResponse = await fetch(`${baseUrl}/networks/${networkId}/alertSettings`, { headers });
      if (alertResponse.ok) config.alertSettings = await alertResponse.json();
    } catch (e) { /* Ignore */ }

    // Syslog servers
    try {
      const syslogResponse = await fetch(`${baseUrl}/networks/${networkId}/syslogServers`, { headers });
      if (syslogResponse.ok) config.syslogServers = await syslogResponse.json();
    } catch (e) { /* Ignore */ }

    // SNMP
    try {
      const snmpResponse = await fetch(`${baseUrl}/networks/${networkId}/snmp`, { headers });
      if (snmpResponse.ok) config.snmp = await snmpResponse.json();
    } catch (e) { /* Ignore */ }

    return config;
  }

  /**
   * Fetch device-level configuration
   */
  private static async fetchDeviceConfig(baseUrl: string, serial: string, headers: any): Promise<any> {
    const config: any = {};

    try {
      const response = await fetch(`${baseUrl}/devices/${serial}`, { headers });
      if (response.ok) config.details = await response.json();
    } catch (e) { /* Ignore */ }

    // Management interface
    try {
      const mgmtResponse = await fetch(`${baseUrl}/devices/${serial}/managementInterface`, { headers });
      if (mgmtResponse.ok) config.managementInterface = await mgmtResponse.json();
    } catch (e) { /* Ignore */ }

    // Switch ports (MS devices)
    try {
      const portsResponse = await fetch(`${baseUrl}/devices/${serial}/switch/ports`, { headers });
      if (portsResponse.ok) config.switchPorts = await portsResponse.json();
    } catch (e) { /* Ignore */ }

    // Switch routing interfaces (MS L3)
    try {
      const routingResponse = await fetch(`${baseUrl}/devices/${serial}/switch/routing/interfaces`, { headers });
      if (routingResponse.ok) config.switchRoutingInterfaces = await routingResponse.json();
    } catch (e) { /* Ignore */ }

    // Switch STP settings
    try {
      const stpResponse = await fetch(`${baseUrl}/devices/${serial}/switch/stp`, { headers });
      if (stpResponse.ok) config.switchStp = await stpResponse.json();
    } catch (e) { /* Ignore */ }

    // Wireless radio settings (MR devices)
    try {
      const radioResponse = await fetch(`${baseUrl}/devices/${serial}/wireless/radio/settings`, { headers });
      if (radioResponse.ok) config.wirelessRadioSettings = await radioResponse.json();
    } catch (e) { /* Ignore */ }

    return config;
  }

  /**
   * List snapshots for an organization
   */
  static async listSnapshots(
    organizationId: string,
    filters?: {
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Snapshot[]> {
    // Omit snapshot_data from the list for performance — callers should use
    // getSnapshot() to fetch the full data for a single snapshot.
    let queryText =
      'SELECT id, organization_id, snapshot_type, snapshot_metadata, size_bytes, created_by, created_at, notes ' +
      'FROM config_snapshots WHERE organization_id = $1';
    const params: any[] = [organizationId];

    if (filters?.type) {
      queryText += ' AND snapshot_type = $2';
      params.push(filters.type);
    }

    queryText += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      queryText += ` LIMIT ${filters.limit}`;
    }

    if (filters?.offset) {
      queryText += ` OFFSET ${filters.offset}`;
    }

    const result = await query(queryText, params);

    return result.rows.map(rowToSnapshot);
  }

  /**
   * Get a single snapshot by ID
   */
  static async getSnapshot(snapshotId: string): Promise<Snapshot | null> {
    const result = await query(
      'SELECT * FROM config_snapshots WHERE id = $1',
      [snapshotId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return rowToSnapshot(result.rows[0]);
  }

  /**
   * Compare two snapshots and generate diff
   */
  static async compareSnapshots(snapshot1Id: string, snapshot2Id: string): Promise<ConfigDiff> {
    const [snapshot1, snapshot2] = await Promise.all([
      this.getSnapshot(snapshot1Id),
      this.getSnapshot(snapshot2Id)
    ]);

    if (!snapshot1 || !snapshot2) {
      throw new Error('One or both snapshots not found');
    }

    return this.computeDiff(snapshot1.snapshotData, snapshot2.snapshotData);
  }

  /**
   * Compute diff between two configurations
   */
  private static computeDiff(oldConfig: MerakiConfig, newConfig: MerakiConfig): ConfigDiff {
    const added: any[] = [];
    const modified: any[] = [];
    const removed: any[] = [];

    // Compare devices
    const oldDeviceMap = new Map(oldConfig.devices.map(d => [d.serial, d]));
    const newDeviceMap = new Map(newConfig.devices.map(d => [d.serial, d]));

    for (const [serial, newDevice] of newDeviceMap) {
      if (!oldDeviceMap.has(serial)) {
        added.push({ type: 'device', serial, data: newDevice });
      } else {
        const oldDevice = oldDeviceMap.get(serial);
        if (JSON.stringify(oldDevice) !== JSON.stringify(newDevice)) {
          modified.push({ type: 'device', serial, old: oldDevice, new: newDevice });
        }
      }
    }

    for (const [serial, oldDevice] of oldDeviceMap) {
      if (!newDeviceMap.has(serial)) {
        removed.push({ type: 'device', serial, data: oldDevice });
      }
    }

    // Compare networks
    const oldNetworkMap = new Map(oldConfig.networks.map(n => [n.id, n]));
    const newNetworkMap = new Map(newConfig.networks.map(n => [n.id, n]));

    for (const [id, newNetwork] of newNetworkMap) {
      if (!oldNetworkMap.has(id)) {
        added.push({ type: 'network', id, data: newNetwork });
      } else {
        const oldNetwork = oldNetworkMap.get(id);
        if (JSON.stringify(oldNetwork) !== JSON.stringify(newNetwork)) {
          modified.push({ type: 'network', id, old: oldNetwork, new: newNetwork });
        }
      }
    }

    for (const [id, oldNetwork] of oldNetworkMap) {
      if (!newNetworkMap.has(id)) {
        removed.push({ type: 'network', id, data: oldNetwork });
      }
    }

    return {
      added,
      modified,
      removed,
      summary: {
        totalChanges: added.length + modified.length + removed.length,
        devicesChanged: [...added, ...modified, ...removed].filter(c => c.type === 'device').length,
        networksChanged: [...added, ...modified, ...removed].filter(c => c.type === 'network').length
      }
    };
  }

  /**
   * Delete a snapshot
   */
  static async deleteSnapshot(snapshotId: string, userId: string): Promise<void> {
    const result = await query(
      'DELETE FROM config_snapshots WHERE id = $1 RETURNING organization_id',
      [snapshotId]
    );

    if (result.rows.length > 0) {
      // Log audit event
      await query(
        `INSERT INTO audit_log (user_id, organization_id, action, resource_type, resource_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, result.rows[0].organization_id, 'snapshot.deleted', 'config_snapshot', snapshotId]
      );
    }
  }

  /**
   * Decrypt API key (placeholder - implement with actual encryption)
   */
  private static decryptApiKey(encryptedKey: string): string {
    // TODO: Implement actual decryption using crypto module
    // For now, return as-is (assuming it's not encrypted yet)
    return encryptedKey;
  }
}
