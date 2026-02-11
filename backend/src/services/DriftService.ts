import { query } from '../config/database';

export interface DriftItem {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  changeType: 'added' | 'modified' | 'removed';
  field?: string;
  oldValue?: any;
  newValue?: any;
  detectedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DriftReport {
  organizationId: string;
  baselineSnapshotId: string;
  baselineCreatedAt: string;
  totalDrifts: number;
  criticalDrifts: number;
  highDrifts: number;
  drifts: DriftItem[];
  checkedAt: string;
}

export class DriftService {
  /**
   * Compares the latest snapshot against a previous baseline snapshot
   * to identify configuration drift.
   */
  static async detectDrift(organizationId: string): Promise<DriftReport> {
    // Get the two most recent snapshots for comparison
    const snapshots = await query(
      `SELECT id, snapshot_data, created_at
       FROM config_snapshots
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 2`,
      [organizationId]
    );

    if (snapshots.rows.length < 2) {
      return {
        organizationId,
        baselineSnapshotId: snapshots.rows[0]?.id ?? '',
        baselineCreatedAt: snapshots.rows[0]?.created_at ?? new Date().toISOString(),
        totalDrifts: 0,
        criticalDrifts: 0,
        highDrifts: 0,
        drifts: [],
        checkedAt: new Date().toISOString(),
      };
    }

    const latest = snapshots.rows[0];
    const baseline = snapshots.rows[1];

    const drifts = DriftService.compareConfigs(
      baseline.snapshot_data,
      latest.snapshot_data
    );

    const criticalDrifts = drifts.filter(d => d.severity === 'critical').length;
    const highDrifts = drifts.filter(d => d.severity === 'high').length;

    // Store drift events in DB for history
    for (const drift of drifts) {
      await query(
        `INSERT INTO config_changes
         (organization_id, snapshot_id, change_type, change_action, resource_type, resource_id,
          resource_name, old_value, new_value, change_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'drift_detection')
         ON CONFLICT DO NOTHING`,
        [
          organizationId,
          latest.id,
          drift.resourceType,
          drift.changeType,
          drift.resourceType,
          drift.resourceId,
          drift.resourceName,
          drift.oldValue ? JSON.stringify(drift.oldValue) : null,
          drift.newValue ? JSON.stringify(drift.newValue) : null,
        ]
      ).catch(() => {}); // non-critical, don't fail on duplicate
    }

    return {
      organizationId,
      baselineSnapshotId: baseline.id,
      baselineCreatedAt: baseline.created_at,
      totalDrifts: drifts.length,
      criticalDrifts,
      highDrifts,
      drifts,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Compares two snapshot data objects and returns a list of drift items.
   */
  private static compareConfigs(baseline: any, current: any): DriftItem[] {
    const drifts: DriftItem[] = [];
    const now = new Date().toISOString();

    // Compare devices
    if (baseline.devices && current.devices) {
      const baselineDevices = new Map<string, any>(baseline.devices.map((d: any) => [d.serial, d]));
      const currentDevices = new Map<string, any>(current.devices.map((d: any) => [d.serial, d]));

      // Check for removed devices
      for (const [serial, device] of baselineDevices.entries()) {
        if (!currentDevices.has(serial)) {
          drifts.push({
            resourceType: 'device',
            resourceId: serial,
            resourceName: (device as any).name || serial,
            changeType: 'removed',
            oldValue: device,
            detectedAt: now,
            severity: 'critical',
          });
        }
      }

      // Check for added or modified devices
      for (const [serial, device] of currentDevices.entries()) {
        const baseDevice = baselineDevices.get(serial) as any;
        if (!baseDevice) {
          drifts.push({
            resourceType: 'device',
            resourceId: serial,
            resourceName: (device as any).name || serial,
            changeType: 'added',
            newValue: device,
            detectedAt: now,
            severity: 'high',
          });
        } else {
          // Check for config changes on the device
          const changes = DriftService.findObjectDiff(baseDevice, device as any);
          for (const change of changes) {
            drifts.push({
              resourceType: 'device',
              resourceId: serial,
              resourceName: (device as any).name || serial,
              changeType: 'modified',
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              detectedAt: now,
              severity: DriftService.getDeviceFieldSeverity(change.field),
            });
          }
        }
      }
    }

    // Compare networks
    if (baseline.networks && current.networks) {
      const baselineNets = new Map<string, any>(baseline.networks.map((n: any) => [n.id, n]));
      const currentNets = new Map<string, any>(current.networks.map((n: any) => [n.id, n]));

      for (const [id, network] of currentNets.entries()) {
        const baseNet = baselineNets.get(id) as any;
        if (!baseNet) {
          drifts.push({
            resourceType: 'network',
            resourceId: id,
            resourceName: (network as any).name || id,
            changeType: 'added',
            newValue: network,
            detectedAt: now,
            severity: 'medium',
          });
        } else {
          const changes = DriftService.findObjectDiff(baseNet, network as any);
          for (const change of changes) {
            drifts.push({
              resourceType: 'network',
              resourceId: id,
              resourceName: (network as any).name || id,
              changeType: 'modified',
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              detectedAt: now,
              severity: 'medium',
            });
          }
        }
      }

      for (const [id, network] of baselineNets.entries()) {
        if (!currentNets.has(id)) {
          drifts.push({
            resourceType: 'network',
            resourceId: id,
            resourceName: (network as any).name || id,
            changeType: 'removed',
            oldValue: network,
            detectedAt: now,
            severity: 'high',
          });
        }
      }
    }

    // Compare VLANs
    if (baseline.vlans && current.vlans) {
      const baselineVlans = new Map<string, any>(baseline.vlans.map((v: any) => [`${v.networkId}-${v.id}`, v]));
      const currentVlans = new Map<string, any>(current.vlans.map((v: any) => [`${v.networkId}-${v.id}`, v]));

      for (const [key, vlan] of currentVlans.entries()) {
        const baseVlan = baselineVlans.get(key) as any;
        if (!baseVlan) {
          drifts.push({
            resourceType: 'vlan',
            resourceId: key,
            resourceName: `VLAN ${(vlan as any).id} - ${(vlan as any).name || ''}`,
            changeType: 'added',
            newValue: vlan,
            detectedAt: now,
            severity: 'medium',
          });
        } else {
          const changes = DriftService.findObjectDiff(baseVlan, vlan as any);
          for (const change of changes) {
            drifts.push({
              resourceType: 'vlan',
              resourceId: key,
              resourceName: `VLAN ${(vlan as any).id} - ${(vlan as any).name || ''}`,
              changeType: 'modified',
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              detectedAt: now,
              severity: change.field === 'subnet' || change.field === 'applianceIp' ? 'high' : 'medium',
            });
          }
        }
      }
    }

    return drifts;
  }

  /**
   * Finds field-level differences between two objects.
   */
  private static findObjectDiff(obj1: any, obj2: any, prefix = ''): { field: string; oldValue: any; newValue: any }[] {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    const ignoredFields = ['updatedAt', 'updated_at', 'lastUpdated'];

    for (const key of Object.keys(obj2)) {
      if (ignoredFields.includes(key)) continue;
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        if (typeof obj2[key] === 'object' && obj2[key] !== null && typeof obj1[key] === 'object' && obj1[key] !== null) {
          // Recurse for nested objects (max 2 levels)
          if (!prefix) {
            changes.push(...DriftService.findObjectDiff(obj1[key], obj2[key], fieldPath));
          }
        } else {
          changes.push({ field: fieldPath, oldValue: obj1[key], newValue: obj2[key] });
        }
      }
    }

    return changes;
  }

  /**
   * Returns severity based on which device field changed.
   */
  private static getDeviceFieldSeverity(field: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalFields = ['networkId', 'serial'];
    const highFields = ['firmwareVersion', 'tags'];
    const mediumFields = ['name', 'address', 'notes'];

    if (criticalFields.includes(field)) return 'critical';
    if (highFields.includes(field)) return 'high';
    if (mediumFields.includes(field)) return 'medium';
    return 'low';
  }
}
