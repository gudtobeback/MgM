import { query } from '../config/database';

export interface CrossRegionDiff {
  category: 'networks' | 'devices' | 'vlans' | 'ssids';
  item: string;
  sourceValue: any;
  targetValue: any;
  status: 'only_in_source' | 'only_in_target' | 'differs';
}

export interface CrossRegionReport {
  sourceOrg: { id: string; name: string; region: string };
  targetOrg: { id: string; name: string; region: string };
  generatedAt: string;
  summary: {
    networksOnlyInSource: number;
    networksOnlyInTarget: number;
    networksDiffer: number;
    devicesOnlyInSource: number;
    devicesOnlyInTarget: number;
    vlansOnlyInSource: number;
    vlansOnlyInTarget: number;
    ssidsOnlyInSource: number;
    ssidsOnlyInTarget: number;
  };
  diffs: CrossRegionDiff[];
}

export class CrossRegionService {
  /**
   * Compare the latest snapshots of two organizations (source vs target).
   * Both orgs must belong to the authenticated user.
   */
  static async compareOrgs(sourceOrgId: string, targetOrgId: string): Promise<CrossRegionReport> {
    // Fetch both organizations
    const orgsResult = await query(
      `SELECT id, meraki_org_name, meraki_region FROM organizations WHERE id = ANY($1::uuid[])`,
      [[sourceOrgId, targetOrgId]]
    );

    if (orgsResult.rows.length < 2) {
      throw new Error('One or both organizations not found');
    }

    const sourceOrg = orgsResult.rows.find((r: any) => r.id === sourceOrgId);
    const targetOrg = orgsResult.rows.find((r: any) => r.id === targetOrgId);

    if (!sourceOrg || !targetOrg) {
      throw new Error('Could not identify source or target organization');
    }

    // Get latest snapshot for each
    const [sourceSnap, targetSnap] = await Promise.all([
      CrossRegionService.getLatestSnapshot(sourceOrgId),
      CrossRegionService.getLatestSnapshot(targetOrgId),
    ]);

    if (!sourceSnap) throw new Error(`No snapshot found for source organization "${sourceOrg.meraki_org_name}". Create a snapshot first.`);
    if (!targetSnap) throw new Error(`No snapshot found for target organization "${targetOrg.meraki_org_name}". Create a snapshot first.`);

    const srcData = sourceSnap.snapshot_data;
    const tgtData = targetSnap.snapshot_data;

    const diffs: CrossRegionDiff[] = [];

    // Compare Networks by name
    const srcNets = new Map<string, any>((srcData.networks || []).map((n: any) => [n.name, n]));
    const tgtNets = new Map<string, any>((tgtData.networks || []).map((n: any) => [n.name, n]));

    for (const [name, srcNet] of srcNets) {
      if (!tgtNets.has(name)) {
        diffs.push({ category: 'networks', item: name, sourceValue: srcNet, targetValue: null, status: 'only_in_source' });
      } else {
        const tgtNet = tgtNets.get(name);
        if (srcNet.timeZone !== tgtNet.timeZone || JSON.stringify(srcNet.productTypes) !== JSON.stringify(tgtNet.productTypes)) {
          diffs.push({ category: 'networks', item: name, sourceValue: srcNet, targetValue: tgtNet, status: 'differs' });
        }
      }
    }

    for (const [name, tgtNet] of tgtNets) {
      if (!srcNets.has(name)) {
        diffs.push({ category: 'networks', item: name, sourceValue: null, targetValue: tgtNet, status: 'only_in_target' });
      }
    }

    // Compare Devices by serial
    const srcDevices = new Map<string, any>((srcData.devices || []).map((d: any) => [d.serial, d]));
    const tgtDevices = new Map<string, any>((tgtData.devices || []).map((d: any) => [d.serial, d]));

    for (const [serial, srcDev] of srcDevices) {
      if (!tgtDevices.has(serial)) {
        diffs.push({ category: 'devices', item: `${srcDev.name || serial} (${serial})`, sourceValue: srcDev, targetValue: null, status: 'only_in_source' });
      }
    }

    for (const [serial, tgtDev] of tgtDevices) {
      if (!srcDevices.has(serial)) {
        diffs.push({ category: 'devices', item: `${tgtDev.name || serial} (${serial})`, sourceValue: null, targetValue: tgtDev, status: 'only_in_target' });
      }
    }

    // Compare VLANs by id+name combo
    const srcVlans = new Map<string, any>((srcData.vlans || []).map((v: any) => [`${v.id}:${v.name}`, v]));
    const tgtVlans = new Map<string, any>((tgtData.vlans || []).map((v: any) => [`${v.id}:${v.name}`, v]));

    for (const [key, sv] of srcVlans) {
      if (!tgtVlans.has(key)) {
        diffs.push({ category: 'vlans', item: `VLAN ${sv.id} — ${sv.name}`, sourceValue: sv, targetValue: null, status: 'only_in_source' });
      } else {
        const tv = tgtVlans.get(key);
        if (sv.subnet !== tv.subnet) {
          diffs.push({ category: 'vlans', item: `VLAN ${sv.id} — ${sv.name}`, sourceValue: sv, targetValue: tv, status: 'differs' });
        }
      }
    }

    for (const [key, tv] of tgtVlans) {
      if (!srcVlans.has(key)) {
        diffs.push({ category: 'vlans', item: `VLAN ${tv.id} — ${tv.name}`, sourceValue: null, targetValue: tv, status: 'only_in_target' });
      }
    }

    // Compare SSIDs by number+name
    const enabledSrcSsids = (srcData.ssids || []).filter((s: any) => s.enabled);
    const enabledTgtSsids = (tgtData.ssids || []).filter((s: any) => s.enabled);
    const srcSsids = new Map<string, any>(enabledSrcSsids.map((s: any) => [`${s.number}:${s.name}`, s]));
    const tgtSsids = new Map<string, any>(enabledTgtSsids.map((s: any) => [`${s.number}:${s.name}`, s]));

    for (const [key, ss] of srcSsids) {
      if (!tgtSsids.has(key)) {
        diffs.push({ category: 'ssids', item: `SSID ${ss.number}: ${ss.name}`, sourceValue: ss, targetValue: null, status: 'only_in_source' });
      } else {
        const ts = tgtSsids.get(key);
        if (ss.authMode !== ts.authMode || ss.encryptionMode !== ts.encryptionMode) {
          diffs.push({ category: 'ssids', item: `SSID ${ss.number}: ${ss.name}`, sourceValue: ss, targetValue: ts, status: 'differs' });
        }
      }
    }

    for (const [key, ts] of tgtSsids) {
      if (!srcSsids.has(key)) {
        diffs.push({ category: 'ssids', item: `SSID ${ts.number}: ${ts.name}`, sourceValue: null, targetValue: ts, status: 'only_in_target' });
      }
    }

    // Build summary
    const networkDiffs = diffs.filter(d => d.category === 'networks');
    const deviceDiffs = diffs.filter(d => d.category === 'devices');
    const vlanDiffs = diffs.filter(d => d.category === 'vlans');
    const ssidDiffs = diffs.filter(d => d.category === 'ssids');

    return {
      sourceOrg: { id: sourceOrg.id, name: sourceOrg.meraki_org_name, region: sourceOrg.meraki_region },
      targetOrg: { id: targetOrg.id, name: targetOrg.meraki_org_name, region: targetOrg.meraki_region },
      generatedAt: new Date().toISOString(),
      summary: {
        networksOnlyInSource: networkDiffs.filter(d => d.status === 'only_in_source').length,
        networksOnlyInTarget: networkDiffs.filter(d => d.status === 'only_in_target').length,
        networksDiffer: networkDiffs.filter(d => d.status === 'differs').length,
        devicesOnlyInSource: deviceDiffs.filter(d => d.status === 'only_in_source').length,
        devicesOnlyInTarget: deviceDiffs.filter(d => d.status === 'only_in_target').length,
        vlansOnlyInSource: vlanDiffs.filter(d => d.status === 'only_in_source').length,
        vlansOnlyInTarget: vlanDiffs.filter(d => d.status === 'only_in_target').length,
        ssidsOnlyInSource: ssidDiffs.filter(d => d.status === 'only_in_source').length,
        ssidsOnlyInTarget: ssidDiffs.filter(d => d.status === 'only_in_target').length,
      },
      diffs,
    };
  }

  private static async getLatestSnapshot(organizationId: string) {
    const result = await query(
      `SELECT id, snapshot_data, created_at
       FROM config_snapshots
       WHERE organization_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [organizationId]
    );
    return result.rows[0] || null;
  }
}
