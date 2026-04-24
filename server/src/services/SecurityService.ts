import { query } from '../config/database';

export interface SecurityFinding {
  id: string;
  category: 'access_control' | 'encryption' | 'network_segmentation' | 'firmware' | 'configuration';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedResource: string;
  resourceType: string;
  remediation: string;
  detectedAt: string;
}

export interface SecurityPostureReport {
  organizationId: string;
  snapshotId: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100, lower is better
  findings: SecurityFinding[];
  byCategory: Record<string, { count: number; criticalCount: number }>;
  checkedAt: string;
}

type SecurityCheck = (data: any) => SecurityFinding[];

const SECURITY_CHECKS: { id: string; check: SecurityCheck }[] = [
  // Open SSIDs
  {
    id: 'sec-open-ssid',
    check: (data) => {
      if (!data.ssids) return [];
      return data.ssids
        .filter((s: any) => s.enabled && s.authMode === 'open')
        .map((s: any): SecurityFinding => ({
          id: `sec-open-ssid-${s.number}`,
          category: 'encryption',
          severity: 'critical',
          title: 'Open Wi-Fi Network Detected',
          description: `SSID "${s.name}" is broadcasting without any authentication. Anyone can join this network.`,
          affectedResource: s.name,
          resourceType: 'ssid',
          remediation: 'Enable WPA2-Enterprise or WPA3 authentication on this SSID, or disable it if unused.',
          detectedAt: new Date().toISOString(),
        }));
    },
  },

  // WEP or TKIP encryption
  {
    id: 'sec-weak-encryption',
    check: (data) => {
      if (!data.ssids) return [];
      return data.ssids
        .filter((s: any) => s.enabled && (s.encryptionMode === 'wep' || s.encryptionMode === 'tkip'))
        .map((s: any): SecurityFinding => ({
          id: `sec-weak-enc-${s.number}`,
          category: 'encryption',
          severity: 'high',
          title: 'Weak Wireless Encryption',
          description: `SSID "${s.name}" uses ${s.encryptionMode?.toUpperCase()} encryption which is crackable in minutes.`,
          affectedResource: s.name,
          resourceType: 'ssid',
          remediation: 'Upgrade to WPA2-AES or WPA3 encryption immediately.',
          detectedAt: new Date().toISOString(),
        }));
    },
  },

  // Devices with outdated firmware (heuristic: check if firmwareVersion contains old patterns)
  {
    id: 'sec-old-firmware',
    check: (data) => {
      if (!data.devices) return [];
      const findings: SecurityFinding[] = [];
      for (const device of data.devices) {
        // Flag devices where firmware update is available (MX, MS, MR patterns)
        if (device.firmware && device.firmware.toLowerCase().includes('outdated')) {
          findings.push({
            id: `sec-firmware-${device.serial}`,
            category: 'firmware',
            severity: 'medium',
            title: 'Outdated Firmware',
            description: `Device "${device.name || device.serial}" (${device.model}) has outdated firmware: ${device.firmware}.`,
            affectedResource: device.name || device.serial,
            resourceType: 'device',
            remediation: 'Update firmware to the latest stable release via Meraki Dashboard > Network > Firmware.',
            detectedAt: new Date().toISOString(),
          });
        }
      }
      return findings;
    },
  },

  // Any-to-Any firewall allow rules
  {
    id: 'sec-permissive-fw',
    check: (data) => {
      const findings: SecurityFinding[] = [];
      const rules = data.l3FirewallRules || data.firewallRules || [];
      const permissive = rules.filter((r: any) =>
        r.policy === 'allow' &&
        (r.srcCidr === 'Any' || r.srcCidr === '0.0.0.0/0') &&
        (r.destCidr === 'Any' || r.destCidr === '0.0.0.0/0')
      );
      for (const rule of permissive) {
        findings.push({
          id: `sec-fw-any-${rule.comment || Math.random()}`,
          category: 'network_segmentation',
          severity: 'high',
          title: 'Overly Permissive Firewall Rule',
          description: `Firewall rule allows ALL traffic from Any source to Any destination${rule.comment ? ` (${rule.comment})` : ''}.`,
          affectedResource: rule.comment || 'Firewall Rule',
          resourceType: 'firewall_rule',
          remediation: 'Replace Any-to-Any allow rules with specific source/destination CIDRs and required ports only.',
          detectedAt: new Date().toISOString(),
        });
      }
      return findings;
    },
  },

  // Devices not assigned to a network
  {
    id: 'sec-unclaimed-devices',
    check: (data) => {
      if (!data.devices) return [];
      const unassigned = data.devices.filter((d: any) => !d.networkId);
      if (unassigned.length === 0) return [];
      return [{
        id: 'sec-unclaimed',
        category: 'configuration',
        severity: 'medium',
        title: 'Devices Not Assigned to a Network',
        description: `${unassigned.length} device(s) are not assigned to any network and may be unmanaged.`,
        affectedResource: unassigned.map((d: any) => d.name || d.serial).join(', '),
        resourceType: 'device',
        remediation: 'Claim all discovered devices and assign them to appropriate networks.',
        detectedAt: new Date().toISOString(),
      }];
    },
  },

  // Management VPN / admin access check
  {
    id: 'sec-admin-vlan',
    check: (data) => {
      if (!data.vlans || data.vlans.length === 0) return [];
      const hasManagementVlan = data.vlans.some((v: any) =>
        v.name?.toLowerCase().includes('mgmt') ||
        v.name?.toLowerCase().includes('management')
      );
      if (!hasManagementVlan) {
        return [{
          id: 'sec-no-mgmt-vlan',
          category: 'access_control',
          severity: 'medium',
          title: 'No Management VLAN',
          description: 'No dedicated management VLAN found. Management traffic may be mixed with user traffic.',
          affectedResource: 'Organization',
          resourceType: 'vlan',
          remediation: 'Create a dedicated management VLAN and restrict access to authorized admin hosts only.',
          detectedAt: new Date().toISOString(),
        }];
      }
      return [];
    },
  },

  // Devices with no tags (asset tracking gap)
  {
    id: 'sec-untagged-devices',
    check: (data) => {
      if (!data.devices) return [];
      const untagged = data.devices.filter((d: any) => !d.tags || d.tags.length === 0);
      if (untagged.length < 5) return [];
      return [{
        id: 'sec-untagged',
        category: 'configuration',
        severity: 'info',
        title: 'Untagged Devices',
        description: `${untagged.length} devices have no tags, making asset management and policy enforcement harder.`,
        affectedResource: 'Multiple devices',
        resourceType: 'device',
        remediation: 'Add location and role tags to all devices to enable policy-based management.',
        detectedAt: new Date().toISOString(),
      }];
    },
  },

  // Guest network with VPN access enabled
  {
    id: 'sec-guest-vpn',
    check: (data) => {
      if (!data.vlans) return [];
      const guestVpn = data.vlans.filter((v: any) =>
        (v.name?.toLowerCase().includes('guest') || v.name?.toLowerCase().includes('visitor')) &&
        v.vpnNatSubnet === true
      );
      return guestVpn.map((v: any): SecurityFinding => ({
        id: `sec-guest-vpn-${v.id}`,
        category: 'network_segmentation',
        severity: 'critical',
        title: 'Guest VLAN Has VPN Access',
        description: `Guest VLAN "${v.name}" has VPN NAT subnet enabled, potentially exposing internal networks to guests.`,
        affectedResource: v.name,
        resourceType: 'vlan',
        remediation: 'Disable VPN NAT subnet for guest VLANs. Guests should only have internet access.',
        detectedAt: new Date().toISOString(),
      }));
    },
  },
];

function calculateRiskScore(findings: SecurityFinding[]): number {
  const weights = { critical: 25, high: 15, medium: 7, low: 3, info: 1 };
  const raw = findings.reduce((sum, f) => sum + (weights[f.severity] || 0), 0);
  return Math.min(100, raw);
}

function overallRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 50) return 'critical';
  if (score >= 25) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
}

export class SecurityService {
  static async analyzePosture(organizationId: string, snapshotId?: string): Promise<SecurityPostureReport> {
    // Get latest snapshot
    let snapshotResult;
    if (snapshotId) {
      snapshotResult = await query(
        `SELECT id, snapshot_data FROM config_snapshots WHERE id = $1 AND organization_id = $2`,
        [snapshotId, organizationId]
      );
    } else {
      snapshotResult = await query(
        `SELECT id, snapshot_data FROM config_snapshots
         WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [organizationId]
      );
    }

    if (snapshotResult.rows.length === 0) {
      return {
        organizationId,
        snapshotId: '',
        overallRisk: 'low',
        riskScore: 0,
        findings: [],
        byCategory: {},
        checkedAt: new Date().toISOString(),
      };
    }

    const snapshot = snapshotResult.rows[0];
    const data = snapshot.snapshot_data;
    const allFindings: SecurityFinding[] = [];

    for (const { check } of SECURITY_CHECKS) {
      try {
        allFindings.push(...check(data));
      } catch {
        // skip failing checks
      }
    }

    const byCategory: Record<string, { count: number; criticalCount: number }> = {};
    for (const finding of allFindings) {
      if (!byCategory[finding.category]) {
        byCategory[finding.category] = { count: 0, criticalCount: 0 };
      }
      byCategory[finding.category].count++;
      if (finding.severity === 'critical') byCategory[finding.category].criticalCount++;
    }

    const riskScore = calculateRiskScore(allFindings);

    return {
      organizationId,
      snapshotId: snapshot.id,
      overallRisk: overallRisk(riskScore),
      riskScore,
      findings: allFindings.sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return order[a.severity] - order[b.severity];
      }),
      byCategory,
      checkedAt: new Date().toISOString(),
    };
  }
}
