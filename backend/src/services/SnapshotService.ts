import { query, getClient } from '../config/database';
import fetch from 'node-fetch';

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
    snapshotData: typeof row.snapshot_data === 'string' ? JSON.parse(row.snapshot_data) : row.snapshot_data,
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
    notes?: string
  ): Promise<Snapshot> {
    // Get organization details (API key, region)
    const orgResult = await query(
      'SELECT meraki_org_id, meraki_api_key_encrypted, meraki_region FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (orgResult.rows.length === 0) {
      throw new Error('Organization not found');
    }

    const org = orgResult.rows[0];

    // Decrypt API key (we'll implement encryption service later)
    const apiKey = this.decryptApiKey(org.meraki_api_key_encrypted);
    const region = org.meraki_region;

    // Fetch current configuration from Meraki API
    const config = await this.fetchMerakiConfig(org.meraki_org_id, apiKey, region);

    // Calculate size
    const configJson = JSON.stringify(config);
    const sizeBytes = Buffer.byteLength(configJson, 'utf8');

    // Store snapshot in database
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

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, organizationId, 'snapshot.created', 'config_snapshot', snapshot.id, JSON.stringify({ type, sizeBytes })]
    );

    return rowToSnapshot({ ...snapshot, snapshot_data: config });
  }

  /**
   * Fetch current configuration from Meraki API
   */
  private static async fetchMerakiConfig(
    merakiOrgId: string,
    apiKey: string,
    region: 'com' | 'in'
  ): Promise<MerakiConfig> {
    const baseUrl = region === 'in' ? 'https://api.meraki.in/api/v1' : 'https://api.meraki.com/api/v1';
    const headers = {
      'X-Cisco-Meraki-API-Key': apiKey,
      'Content-Type': 'application/json'
    };

    // Fetch organization details
    const orgResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}`, { headers });
    const organization = await orgResponse.json();

    // Fetch networks
    const networksResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}/networks`, { headers });
    const networks = await networksResponse.json();

    // Fetch devices
    const devicesResponse = await fetch(`${baseUrl}/organizations/${merakiOrgId}/devices`, { headers });
    const devices = await devicesResponse.json();

    // Fetch organization-level configs
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

    // Fetch network-level configs for each network
    const networkLevel: Record<string, any> = {};
    for (const network of networks) {
      networkLevel[network.id] = await this.fetchNetworkConfig(baseUrl, network.id, headers);
    }

    // Fetch device-level configs for each device
    const deviceLevel: Record<string, any> = {};
    for (const device of devices) {
      deviceLevel[device.serial] = await this.fetchDeviceConfig(baseUrl, device.serial, headers);
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

    try {
      const vlansResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/vlans`, { headers });
      if (vlansResponse.ok) config.vlans = await vlansResponse.json();
    } catch (e) { /* Ignore */ }

    try {
      const l3RulesResponse = await fetch(`${baseUrl}/networks/${networkId}/appliance/firewall/l3FirewallRules`, { headers });
      if (l3RulesResponse.ok) config.l3FirewallRules = await l3RulesResponse.json();
    } catch (e) { /* Ignore */ }

    try {
      const ssidsResponse = await fetch(`${baseUrl}/networks/${networkId}/wireless/ssids`, { headers });
      if (ssidsResponse.ok) config.ssids = await ssidsResponse.json();
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

    try {
      const portsResponse = await fetch(`${baseUrl}/devices/${serial}/switch/ports`, { headers });
      if (portsResponse.ok) config.switchPorts = await portsResponse.json();
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
    let queryText = 'SELECT * FROM config_snapshots WHERE organization_id = $1';
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
