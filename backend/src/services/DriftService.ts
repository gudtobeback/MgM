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
  baselineSnapshotType: string;
  baselineCreatedAt: string;
  currentSnapshotId: string;
  currentCreatedAt: string;
  totalDrifts: number;
  criticalDrifts: number;
  highDrifts: number;
  drifts: DriftItem[];
  checkedAt: string;
}

type Severity = 'low' | 'medium' | 'high' | 'critical';

// ─────────────────────────────────────────────────────────────────────────────
// Timestamp fields to skip (they change on every API fetch, not real drift)
// ─────────────────────────────────────────────────────────────────────────────
const IGNORED_FIELDS = new Set([
  'updatedAt', 'updated_at', 'lastUpdated', 'lastSeenAt',
  'checkedAt', 'modifiedAt', 'modified_at',
]);

export class DriftService {
  /**
   * Detects drift between two snapshots.
   *
   * If baselineSnapshotId is supplied, that snapshot is used as the golden config
   * and the latest snapshot is compared against it.
   *
   * If no baselineSnapshotId is supplied, falls back to comparing the two most
   * recent snapshots (legacy behaviour).
   */
  static async detectDrift(organizationId: string, baselineSnapshotId?: string): Promise<DriftReport> {
    let baselineRow: any;
    let currentRow: any;

    if (baselineSnapshotId) {
      const [baselineResult, latestResult] = await Promise.all([
        query(
          `SELECT id, snapshot_type, snapshot_data, created_at
           FROM config_snapshots
           WHERE id = $1 AND organization_id = $2`,
          [baselineSnapshotId, organizationId]
        ),
        query(
          `SELECT id, snapshot_type, snapshot_data, created_at
           FROM config_snapshots
           WHERE organization_id = $1
           ORDER BY created_at DESC LIMIT 1`,
          [organizationId]
        ),
      ]);

      if (baselineResult.rows.length === 0) {
        throw new Error('Baseline (golden config) snapshot not found.');
      }

      baselineRow = baselineResult.rows[0];
      currentRow  = latestResult.rows[0];

      if (baselineRow.id === currentRow?.id) {
        return DriftService.emptyReport(organizationId, baselineRow);
      }
    } else {
      const snapshots = await query(
        `SELECT id, snapshot_type, snapshot_data, created_at
         FROM config_snapshots
         WHERE organization_id = $1
         ORDER BY created_at DESC LIMIT 2`,
        [organizationId]
      );

      if (snapshots.rows.length < 2) {
        return DriftService.emptyReport(organizationId, snapshots.rows[0]);
      }

      currentRow  = snapshots.rows[0];
      baselineRow = snapshots.rows[1];
    }

    const drifts = DriftService.compareConfigs(
      baselineRow.snapshot_data,
      currentRow.snapshot_data
    );

    const criticalDrifts = drifts.filter(d => d.severity === 'critical').length;
    const highDrifts     = drifts.filter(d => d.severity === 'high').length;

    for (const drift of drifts) {
      await query(
        `INSERT INTO config_changes
         (organization_id, snapshot_id, change_type, change_action, resource_type, resource_id,
          resource_name, old_value, new_value, change_source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'drift_detection')
         ON CONFLICT DO NOTHING`,
        [
          organizationId, currentRow.id,
          drift.resourceType, drift.changeType, drift.resourceType,
          drift.resourceId, drift.resourceName,
          drift.oldValue ? JSON.stringify(drift.oldValue) : null,
          drift.newValue ? JSON.stringify(drift.newValue) : null,
        ]
      ).catch(() => {});
    }

    return {
      organizationId,
      baselineSnapshotId:   baselineRow.id,
      baselineSnapshotType: baselineRow.snapshot_type ?? 'manual',
      baselineCreatedAt:    baselineRow.created_at,
      currentSnapshotId:    currentRow.id,
      currentCreatedAt:     currentRow.created_at,
      totalDrifts:    drifts.length,
      criticalDrifts,
      highDrifts,
      drifts,
      checkedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Master comparison — covers ALL three config layers
  // ─────────────────────────────────────────────────────────────────────────────

  private static compareConfigs(baseline: any, current: any): DriftItem[] {
    const drifts: DriftItem[] = [];

    DriftService.compareOrganizationLevel(baseline, current, drifts);
    DriftService.compareRootDevices(baseline, current, drifts);
    DriftService.compareNetworkLevel(baseline, current, drifts);
    DriftService.compareDeviceLevel(baseline, current, drifts);

    return drifts;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Organization-level configs
  // ─────────────────────────────────────────────────────────────────────────────

  private static compareOrganizationLevel(baseline: any, current: any, drifts: DriftItem[]) {
    const bOrg: any = baseline.organizationLevel || {};
    const cOrg: any = current.organizationLevel  || {};
    const now = new Date().toISOString();

    // ── Admins (keyed by email) ───────────────────────────────────────────────
    if (bOrg.admins || cOrg.admins) {
      DriftService.diffArray(
        bOrg.admins || [], cOrg.admins || [],
        (a: any) => a.email ?? a.id,
        (a: any) => `Admin: ${a.name || a.email}`,
        'org_admin', 'high', 'medium', 'high', now, drifts
      );
    }

    // ── Alert settings (single object) ───────────────────────────────────────
    if (bOrg.alertSettings || cOrg.alertSettings) {
      DriftService.diffObject(
        bOrg.alertSettings, cOrg.alertSettings,
        'org_alert_settings', 'alert-settings', 'Organization Alert Settings',
        () => 'medium', now, drifts
      );
    }

    // ── Policy objects (keyed by id) ──────────────────────────────────────────
    if (bOrg.policyObjects || cOrg.policyObjects) {
      DriftService.diffArray(
        bOrg.policyObjects || [], cOrg.policyObjects || [],
        (p: any) => String(p.id ?? p.name),
        (p: any) => `Policy Object: ${p.name}`,
        'org_policy_object', 'medium', 'medium', 'medium', now, drifts
      );
    }

    // ── SNMP settings (single object) ────────────────────────────────────────
    if (bOrg.snmpSettings || cOrg.snmpSettings) {
      DriftService.diffObject(
        bOrg.snmpSettings, cOrg.snmpSettings,
        'org_snmp', 'snmp-settings', 'Organization SNMP Settings',
        () => 'medium', now, drifts
      );
    }

    // ── VPN peers (keyed by networkId) ────────────────────────────────────────
    if (bOrg.vpnPeers || cOrg.vpnPeers) {
      const bPeers = Array.isArray(bOrg.vpnPeers) ? bOrg.vpnPeers : [];
      const cPeers = Array.isArray(cOrg.vpnPeers) ? cOrg.vpnPeers : [];
      DriftService.diffArray(
        bPeers, cPeers,
        (p: any) => p.networkId ?? p.name ?? JSON.stringify(p),
        (p: any) => `VPN Peer: ${p.networkName || p.networkId || p.name}`,
        'org_vpn_peer', 'high', 'high', 'high', now, drifts
      );
    }

    // ── VPN firewall rules ────────────────────────────────────────────────────
    if (bOrg.vpnFirewallRules || cOrg.vpnFirewallRules) {
      const bRaw = bOrg.vpnFirewallRules;
      const cRaw = cOrg.vpnFirewallRules;
      const bRules: any[] = Array.isArray(bRaw) ? bRaw : (bRaw?.rules || []);
      const cRules: any[] = Array.isArray(cRaw) ? cRaw : (cRaw?.rules || []);
      if (bRules.length !== cRules.length) {
        drifts.push({
          resourceType: 'org_vpn_firewall', resourceId: 'vpn-fw-rules',
          resourceName: 'Organization VPN Firewall Rules',
          changeType: 'modified', field: 'ruleCount',
          oldValue: bRules.length, newValue: cRules.length,
          detectedAt: now, severity: 'high',
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Root-level devices array
  // ─────────────────────────────────────────────────────────────────────────────

  private static compareRootDevices(baseline: any, current: any, drifts: DriftItem[]) {
    if (!baseline.devices && !current.devices) return;
    const now = new Date().toISOString();

    DriftService.diffArray(
      baseline.devices || [], current.devices || [],
      (d: any) => d.serial,
      (d: any) => `Device: ${d.name || d.serial} (${d.model || ''})`,
      'device', 'high', 'critical',
      (changeType: string, field?: string) => {
        if (changeType === 'removed') return 'critical';
        if (changeType === 'added')   return 'high';
        return DriftService.deviceFieldSeverity(field ?? '');
      },
      now, drifts
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Network-level configs (16 keys)
  // ─────────────────────────────────────────────────────────────────────────────

  private static compareNetworkLevel(baseline: any, current: any, drifts: DriftItem[]) {
    const bNL: Record<string, any> = baseline.networkLevel || {};
    const cNL: Record<string, any> = current.networkLevel  || {};
    const now = new Date().toISOString();
    const allNetIds = new Set([...Object.keys(bNL), ...Object.keys(cNL)]);

    // Find network name from root networks array
    const netName = (id: string, data: any): string => {
      const n = (data.networks || []).find((x: any) => x.id === id);
      return n?.name ? `${n.name} (${id.slice(0, 8)})` : id.slice(0, 8);
    };

    for (const netId of allNetIds) {
      const bNet: any = bNL[netId] || {};
      const cNet: any = cNL[netId] || {};
      const label = netName(netId, baseline) || netName(netId, current);

      // ── VLANs ───────────────────────────────────────────────────────────────
      DriftService.diffArray(
        bNet.vlans || [], cNet.vlans || [],
        (v: any) => String(v.id),
        (v: any) => `VLAN ${v.id}${v.name ? ` – ${v.name}` : ''} [${label}]`,
        'vlan', 'medium', 'high',
        (_ct: string, field?: string) =>
          ['subnet', 'applianceIp'].includes(field ?? '') ? 'high' : 'medium',
        now, drifts
      );

      // ── SSIDs ───────────────────────────────────────────────────────────────
      DriftService.diffArray(
        bNet.ssids || [], cNet.ssids || [],
        (s: any) => String(s.number),
        (s: any) => `SSID ${s.number}: ${s.name || 'Unnamed'} [${label}]`,
        'ssid', 'medium', 'high',
        (_ct: string, field?: string) =>
          ['authMode', 'encryptionMode', 'wpaEncryptionMode', 'psk'].includes(field ?? '')
            ? 'critical' : 'medium',
        now, drifts
      );

      // ── L3 Firewall Rules ────────────────────────────────────────────────────
      DriftService.diffRuleList(
        bNet.l3FirewallRules, cNet.l3FirewallRules,
        `l3-fw-${netId}`, `L3 Firewall Rules [${label}]`,
        'firewall_l3', 'high', now, drifts
      );

      // ── L7 Firewall Rules ────────────────────────────────────────────────────
      DriftService.diffRuleList(
        bNet.l7FirewallRules, cNet.l7FirewallRules,
        `l7-fw-${netId}`, `L7 Firewall Rules [${label}]`,
        'firewall_l7', 'high', now, drifts
      );

      // ── Inbound Firewall Rules ────────────────────────────────────────────────
      DriftService.diffRuleList(
        bNet.inboundFirewallRules, cNet.inboundFirewallRules,
        `inbound-fw-${netId}`, `Inbound Firewall Rules [${label}]`,
        'firewall_inbound', 'high', now, drifts
      );

      // ── Port Forwarding Rules ────────────────────────────────────────────────
      DriftService.diffRuleList(
        bNet.portForwardingRules, cNet.portForwardingRules,
        `port-fwd-${netId}`, `Port Forwarding Rules [${label}]`,
        'port_forwarding', 'high', now, drifts
      );

      // ── 1:1 NAT Rules ────────────────────────────────────────────────────────
      DriftService.diffRuleList(
        bNet.oneToOneNatRules, cNet.oneToOneNatRules,
        `nat-${netId}`, `1:1 NAT Rules [${label}]`,
        'nat_rules', 'high', now, drifts
      );

      // ── Site-to-Site VPN (single object) ─────────────────────────────────────
      DriftService.diffObject(
        bNet.siteToSiteVpn, cNet.siteToSiteVpn,
        'site_to_site_vpn', `s2s-vpn-${netId}`, `Site-to-Site VPN [${label}]`,
        () => 'high', now, drifts
      );

      // ── Content Filtering ─────────────────────────────────────────────────────
      DriftService.diffObject(
        bNet.contentFiltering, cNet.contentFiltering,
        'content_filtering', `cf-${netId}`, `Content Filtering [${label}]`,
        () => 'medium', now, drifts
      );

      // ── Traffic Shaping ───────────────────────────────────────────────────────
      DriftService.diffObject(
        bNet.trafficShaping, cNet.trafficShaping,
        'traffic_shaping', `ts-${netId}`, `Traffic Shaping [${label}]`,
        () => 'low', now, drifts
      );

      // ── Static Routes ─────────────────────────────────────────────────────────
      DriftService.diffArray(
        bNet.staticRoutes || [], cNet.staticRoutes || [],
        (r: any) => r.id ?? r.subnet ?? JSON.stringify(r),
        (r: any) => `Static Route: ${r.name || r.subnet} [${label}]`,
        'static_route', 'high', 'high',
        (_ct: string, field?: string) =>
          ['subnet', 'gatewayIp', 'enabled'].includes(field ?? '') ? 'high' : 'medium',
        now, drifts
      );

      // ── Group Policies ────────────────────────────────────────────────────────
      DriftService.diffArray(
        bNet.groupPolicies || [], cNet.groupPolicies || [],
        (p: any) => String(p.groupPolicyId ?? p.id ?? p.name),
        (p: any) => `Group Policy: ${p.name} [${label}]`,
        'group_policy', 'medium', 'medium', () => 'medium', now, drifts
      );

      // ── Alert Settings ────────────────────────────────────────────────────────
      DriftService.diffObject(
        bNet.alertSettings, cNet.alertSettings,
        'network_alert_settings', `alert-${netId}`, `Alert Settings [${label}]`,
        () => 'low', now, drifts
      );

      // ── Syslog Servers ────────────────────────────────────────────────────────
      DriftService.diffRuleList(
        bNet.syslogServers, cNet.syslogServers,
        `syslog-${netId}`, `Syslog Servers [${label}]`,
        'syslog', 'medium', now, drifts
      );

      // ── SNMP ──────────────────────────────────────────────────────────────────
      DriftService.diffObject(
        bNet.snmp, cNet.snmp,
        'network_snmp', `snmp-${netId}`, `Network SNMP [${label}]`,
        () => 'medium', now, drifts
      );

      // ── Network details (name, tags, etc.) ────────────────────────────────────
      DriftService.diffObject(
        bNet.details, cNet.details,
        'network_details', `details-${netId}`, `Network Details [${label}]`,
        (field: string) => ['name', 'enrollmentString'].includes(field) ? 'medium' : 'low',
        now, drifts
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Device-level configs (per device serial, 6 keys)
  // ─────────────────────────────────────────────────────────────────────────────

  private static compareDeviceLevel(baseline: any, current: any, drifts: DriftItem[]) {
    const bDL: Record<string, any> = baseline.deviceLevel || {};
    const cDL: Record<string, any> = current.deviceLevel  || {};
    const now = new Date().toISOString();
    const allSerials = new Set([...Object.keys(bDL), ...Object.keys(cDL)]);

    const devName = (serial: string, data: any): string => {
      const d = (data.devices || []).find((x: any) => x.serial === serial);
      return d?.name ? `${d.name} (${serial.slice(0, 8)})` : serial.slice(0, 8);
    };

    for (const serial of allSerials) {
      const bDev: any = bDL[serial] || {};
      const cDev: any = cDL[serial] || {};
      const label = devName(serial, baseline) || devName(serial, current);

      // ── Management Interface ───────────────────────────────────────────────
      DriftService.diffObject(
        bDev.managementInterface, cDev.managementInterface,
        'device_mgmt_interface', `mgmt-${serial}`, `Management Interface [${label}]`,
        () => 'medium', now, drifts
      );

      // ── Switch Ports ───────────────────────────────────────────────────────
      DriftService.diffArray(
        bDev.switchPorts || [], cDev.switchPorts || [],
        (p: any) => String(p.portId ?? p.port),
        (p: any) => `Switch Port ${p.portId ?? p.port}${p.name ? `: ${p.name}` : ''} [${label}]`,
        'switch_port', 'medium', 'medium',
        (_ct: string, field?: string) =>
          ['vlan', 'voiceVlan', 'allowedVlans', 'type', 'poeEnabled'].includes(field ?? '')
            ? 'high' : 'low',
        now, drifts
      );

      // ── Switch Routing Interfaces ─────────────────────────────────────────
      DriftService.diffArray(
        bDev.switchRoutingInterfaces || [], cDev.switchRoutingInterfaces || [],
        (i: any) => i.interfaceId ?? i.subnet ?? JSON.stringify(i),
        (i: any) => `Routing Interface: ${i.name || i.subnet} [${label}]`,
        'switch_routing_interface', 'high', 'high',
        (_ct: string, field?: string) =>
          ['subnet', 'ip', 'vlanId'].includes(field ?? '') ? 'high' : 'medium',
        now, drifts
      );

      // ── Switch STP ────────────────────────────────────────────────────────
      DriftService.diffObject(
        bDev.switchStp, cDev.switchStp,
        'switch_stp', `stp-${serial}`, `Switch STP Settings [${label}]`,
        () => 'medium', now, drifts
      );

      // ── Wireless Radio Settings ───────────────────────────────────────────
      DriftService.diffObject(
        bDev.wirelessRadioSettings, cDev.wirelessRadioSettings,
        'wireless_radio', `radio-${serial}`, `Wireless Radio Settings [${label}]`,
        (field: string) =>
          ['channel', 'channelWidth', 'txPower', 'band'].includes(field) ? 'medium' : 'low',
        now, drifts
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Generic diff helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Diffs two arrays of objects identified by a key function.
   * severityFn can be a function or a fixed Severity string.
   */
  private static diffArray(
    baseArr: any[],
    currArr: any[],
    keyFn: (item: any) => string,
    nameFn: (item: any) => string,
    resourceType: string,
    addedSeverity: Severity,
    removedSeverity: Severity,
    severityFn: Severity | ((changeType: string, field?: string) => Severity),
    now: string,
    drifts: DriftItem[]
  ) {
    const baseMap = new Map<string, any>(baseArr.map(x => [keyFn(x), x]));
    const currMap = new Map<string, any>(currArr.map(x => [keyFn(x), x]));

    for (const [key, item] of baseMap.entries()) {
      if (!currMap.has(key)) {
        drifts.push({
          resourceType, resourceId: key, resourceName: nameFn(item),
          changeType: 'removed', oldValue: item, detectedAt: now,
          severity: removedSeverity,
        });
      }
    }

    for (const [key, item] of currMap.entries()) {
      const base = baseMap.get(key);
      if (!base) {
        drifts.push({
          resourceType, resourceId: key, resourceName: nameFn(item),
          changeType: 'added', newValue: item, detectedAt: now,
          severity: addedSeverity,
        });
      } else {
        for (const change of DriftService.fieldDiff(base, item)) {
          const sev: Severity = typeof severityFn === 'function'
            ? severityFn('modified', change.field)
            : severityFn;
          drifts.push({
            resourceType, resourceId: key, resourceName: nameFn(item),
            changeType: 'modified', field: change.field,
            oldValue: change.oldValue, newValue: change.newValue,
            detectedAt: now, severity: sev,
          });
        }
      }
    }
  }

  /**
   * Diffs two single objects field-by-field.
   */
  private static diffObject(
    base: any, curr: any,
    resourceType: string, resourceId: string, resourceName: string,
    severityFn: (field: string) => Severity,
    now: string, drifts: DriftItem[]
  ) {
    if (!base && !curr) return;
    if (!base && curr) {
      drifts.push({
        resourceType, resourceId, resourceName,
        changeType: 'added', newValue: curr,
        detectedAt: now, severity: severityFn(''),
      });
      return;
    }
    if (base && !curr) {
      drifts.push({
        resourceType, resourceId, resourceName,
        changeType: 'removed', oldValue: base,
        detectedAt: now, severity: severityFn(''),
      });
      return;
    }

    for (const change of DriftService.fieldDiff(base, curr)) {
      drifts.push({
        resourceType, resourceId, resourceName,
        changeType: 'modified', field: change.field,
        oldValue: change.oldValue, newValue: change.newValue,
        detectedAt: now, severity: severityFn(change.field),
      });
    }
  }

  /**
   * Diffs a rule list (array or { rules: [...] } wrapper) by count.
   * If count changes, emits one "modified" drift item.
   * If individual rules differ, emits per-rule diffs.
   */
  private static diffRuleList(
    base: any, curr: any,
    resourceId: string, resourceName: string, resourceType: string,
    severity: Severity, now: string, drifts: DriftItem[]
  ) {
    if (!base && !curr) return;
    const bRules: any[] = Array.isArray(base) ? base : (base?.rules || []);
    const cRules: any[] = Array.isArray(curr) ? curr : (curr?.rules || []);

    if (bRules.length === cRules.length && bRules.length === 0) return;

    if (bRules.length !== cRules.length) {
      drifts.push({
        resourceType, resourceId, resourceName,
        changeType: 'modified', field: 'ruleCount',
        oldValue: bRules.length, newValue: cRules.length,
        detectedAt: now, severity,
      });
      return;
    }

    // Same count — check if any rule changed (positional comparison)
    for (let i = 0; i < bRules.length; i++) {
      if (JSON.stringify(bRules[i]) !== JSON.stringify(cRules[i])) {
        drifts.push({
          resourceType, resourceId, resourceName,
          changeType: 'modified', field: `rule[${i}]`,
          oldValue: bRules[i], newValue: cRules[i],
          detectedAt: now, severity,
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Field-level diff (1-level deep; 2 levels for nested objects)
  // ─────────────────────────────────────────────────────────────────────────────

  private static fieldDiff(
    obj1: any, obj2: any, prefix = ''
  ): { field: string; oldValue: any; newValue: any }[] {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of keys) {
      if (IGNORED_FIELDS.has(key)) continue;
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const v1 = obj1?.[key];
      const v2 = obj2?.[key];

      if (JSON.stringify(v1) === JSON.stringify(v2)) continue;

      if (
        !prefix &&
        typeof v1 === 'object' && v1 !== null && !Array.isArray(v1) &&
        typeof v2 === 'object' && v2 !== null && !Array.isArray(v2)
      ) {
        changes.push(...DriftService.fieldDiff(v1, v2, fieldPath));
      } else {
        changes.push({ field: fieldPath, oldValue: v1, newValue: v2 });
      }
    }

    return changes;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Severity helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private static deviceFieldSeverity(field: string): Severity {
    if (['networkId', 'serial'].includes(field))       return 'critical';
    if (['firmwareVersion', 'tags'].includes(field))   return 'high';
    if (['name', 'address', 'notes'].includes(field))  return 'medium';
    return 'low';
  }

  private static emptyReport(organizationId: string, row?: any): DriftReport {
    return {
      organizationId,
      baselineSnapshotId:   row?.id ?? '',
      baselineSnapshotType: row?.snapshot_type ?? 'manual',
      baselineCreatedAt:    row?.created_at ?? new Date().toISOString(),
      currentSnapshotId:    row?.id ?? '',
      currentCreatedAt:     row?.created_at ?? new Date().toISOString(),
      totalDrifts:    0,
      criticalDrifts: 0,
      highDrifts:     0,
      drifts:         [],
      checkedAt:      new Date().toISOString(),
    };
  }
}
