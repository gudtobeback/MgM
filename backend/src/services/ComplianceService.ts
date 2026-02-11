import { query } from '../config/database';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'pci-dss' | 'hipaa' | 'cis' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  check: (snapshotData: any) => ComplianceViolation[];
}

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resourceType: string;
  resourceId: string;
  resourceName: string;
  description: string;
  remediation: string;
}

export interface ComplianceReport {
  organizationId: string;
  snapshotId: string;
  score: number; // 0-100
  totalChecks: number;
  passed: number;
  failed: number;
  violations: ComplianceViolation[];
  byCategory: Record<string, { passed: number; failed: number }>;
  checkedAt: string;
}

const COMPLIANCE_RULES: ComplianceRule[] = [
  // PCI DSS Rules
  {
    id: 'pci-1',
    name: 'Guest VLAN Isolation',
    description: 'Guest networks must be isolated from internal networks (PCI DSS Req. 1.3)',
    category: 'pci-dss',
    severity: 'critical',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.vlans) return violations;

      const guestVlans = data.vlans.filter((v: any) =>
        v.name?.toLowerCase().includes('guest') || v.name?.toLowerCase().includes('visitor')
      );

      for (const vlan of guestVlans) {
        if (!vlan.vpnNatSubnet && !vlan.dnsNameservers?.includes('8.8.8.8')) {
          violations.push({
            ruleId: 'pci-1',
            ruleName: 'Guest VLAN Isolation',
            category: 'pci-dss',
            severity: 'critical',
            resourceType: 'vlan',
            resourceId: String(vlan.id),
            resourceName: vlan.name || `VLAN ${vlan.id}`,
            description: `Guest VLAN "${vlan.name}" may not be properly isolated from the internal network.`,
            remediation: 'Ensure guest VLAN uses a separate subnet and cannot route to internal VLANs. Apply firewall rules to block inter-VLAN routing.',
          });
        }
      }
      return violations;
    },
  },
  {
    id: 'pci-2',
    name: 'Default Credentials Not Used',
    description: 'Devices must not use vendor default passwords (PCI DSS Req. 2.1)',
    category: 'pci-dss',
    severity: 'critical',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.devices) return violations;

      for (const device of data.devices) {
        // Check for default hostnames indicating unconfigured device
        if (device.name && (device.name.startsWith('My ') || device.name === device.model)) {
          violations.push({
            ruleId: 'pci-2',
            ruleName: 'Default Credentials Not Used',
            category: 'pci-dss',
            severity: 'critical',
            resourceType: 'device',
            resourceId: device.serial,
            resourceName: device.name,
            description: `Device "${device.name}" appears to have a default/unchanged name, indicating it may still use default settings.`,
            remediation: 'Rename device with a meaningful name and verify all default credentials have been changed.',
          });
        }
      }
      return violations;
    },
  },
  {
    id: 'pci-3',
    name: 'Firewall Rules Present',
    description: 'Firewall rules must be configured to restrict traffic (PCI DSS Req. 1.2)',
    category: 'pci-dss',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.networks) return violations;

      for (const network of data.networks) {
        const hasFirewallRules =
          (data.l3FirewallRules && data.l3FirewallRules.some((r: any) => r.networkId === network.id)) ||
          (data.firewallRules && data.firewallRules.some((r: any) => r.networkId === network.id));

        if (!hasFirewallRules && network.productTypes?.includes('appliance')) {
          violations.push({
            ruleId: 'pci-3',
            ruleName: 'Firewall Rules Present',
            category: 'pci-dss',
            severity: 'high',
            resourceType: 'network',
            resourceId: network.id,
            resourceName: network.name,
            description: `Network "${network.name}" has no outbound firewall rules configured.`,
            remediation: 'Configure L3 firewall rules for this network to restrict unauthorized traffic.',
          });
        }
      }
      return violations;
    },
  },

  // HIPAA Rules
  {
    id: 'hipaa-1',
    name: 'Network Segmentation for PHI',
    description: 'Networks containing PHI must be segmented from other networks (HIPAA §164.312)',
    category: 'hipaa',
    severity: 'critical',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.vlans) return violations;

      const phiVlans = data.vlans.filter((v: any) =>
        v.name?.toLowerCase().includes('medical') ||
        v.name?.toLowerCase().includes('health') ||
        v.name?.toLowerCase().includes('phi') ||
        v.name?.toLowerCase().includes('ehr')
      );

      for (const vlan of phiVlans) {
        violations.push({
          ruleId: 'hipaa-1',
          ruleName: 'Network Segmentation for PHI',
          category: 'hipaa',
          severity: 'critical',
          resourceType: 'vlan',
          resourceId: String(vlan.id),
          resourceName: vlan.name || `VLAN ${vlan.id}`,
          description: `VLAN "${vlan.name}" may contain PHI and requires review to ensure proper segmentation.`,
          remediation: 'Verify this VLAN is isolated from other networks and access is restricted to authorized personnel only.',
        });
      }
      return violations;
    },
  },
  {
    id: 'hipaa-2',
    name: 'Wireless Encryption Required',
    description: 'All wireless networks must use WPA2 or higher (HIPAA §164.312(e)(2)(ii))',
    category: 'hipaa',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.ssids) return violations;

      for (const ssid of data.ssids) {
        if (ssid.enabled && ssid.authMode !== 'open') {
          if (ssid.encryptionMode === 'wep' || ssid.encryptionMode === 'tkip') {
            violations.push({
              ruleId: 'hipaa-2',
              ruleName: 'Wireless Encryption Required',
              category: 'hipaa',
              severity: 'high',
              resourceType: 'ssid',
              resourceId: String(ssid.number),
              resourceName: ssid.name,
              description: `SSID "${ssid.name}" uses weak encryption (${ssid.encryptionMode}). WPA2/WPA3 required.`,
              remediation: 'Update the SSID to use WPA2-Enterprise or WPA3 encryption.',
            });
          }
        }
      }
      return violations;
    },
  },

  // CIS Benchmark Rules
  {
    id: 'cis-1',
    name: 'Unused SSIDs Disabled',
    description: 'Unused or unconfigured SSIDs should be disabled (CIS Meraki Benchmark)',
    category: 'cis',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.ssids) return violations;

      for (const ssid of data.ssids) {
        // SSIDs with default names that are enabled
        if (ssid.enabled && (ssid.name?.startsWith('Unconfigured SSID') || ssid.name?.startsWith('SSID '))) {
          violations.push({
            ruleId: 'cis-1',
            ruleName: 'Unused SSIDs Disabled',
            category: 'cis',
            severity: 'medium',
            resourceType: 'ssid',
            resourceId: String(ssid.number),
            resourceName: ssid.name,
            description: `SSID "${ssid.name}" appears to be unconfigured but is enabled.`,
            remediation: 'Disable any SSIDs that are not actively used.',
          });
        }
      }
      return violations;
    },
  },
  {
    id: 'cis-2',
    name: 'Management VLAN Configured',
    description: 'A dedicated management VLAN should be configured (CIS Meraki Benchmark)',
    category: 'cis',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.vlans || data.vlans.length === 0) return violations;

      const hasManagementVlan = data.vlans.some((v: any) =>
        v.name?.toLowerCase().includes('mgmt') ||
        v.name?.toLowerCase().includes('management') ||
        v.name?.toLowerCase().includes('admin')
      );

      if (!hasManagementVlan && data.vlans.length > 1) {
        violations.push({
          ruleId: 'cis-2',
          ruleName: 'Management VLAN Configured',
          category: 'cis',
          severity: 'medium',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No dedicated management VLAN was found. Management traffic should be isolated.',
          remediation: 'Create a dedicated management VLAN (e.g., VLAN 999) for out-of-band management of network devices.',
        });
      }
      return violations;
    },
  },
  {
    id: 'cis-3',
    name: 'Devices Have Tags',
    description: 'All devices should have tags for asset management (CIS Meraki Benchmark)',
    category: 'cis',
    severity: 'low',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.devices) return violations;

      const untagged = data.devices.filter((d: any) => !d.tags || d.tags.length === 0);
      if (untagged.length > 0) {
        violations.push({
          ruleId: 'cis-3',
          ruleName: 'Devices Have Tags',
          category: 'cis',
          severity: 'low',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: `${untagged.length} device(s) have no tags. Tagging is required for proper asset management.`,
          remediation: 'Add descriptive tags to all devices (e.g., location, type, owner) for better visibility.',
        });
      }
      return violations;
    },
  },

  // General Best Practices
  {
    id: 'gen-1',
    name: 'Devices Have Notes',
    description: 'Devices should have notes documenting their purpose',
    category: 'general',
    severity: 'low',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.devices) return violations;

      const noNotes = data.devices.filter((d: any) => !d.notes || d.notes.trim() === '');
      if (noNotes.length > 3) {
        violations.push({
          ruleId: 'gen-1',
          ruleName: 'Devices Have Notes',
          category: 'general',
          severity: 'low',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: `${noNotes.length} device(s) have no notes. Documentation improves operational efficiency.`,
          remediation: 'Add notes to devices describing their purpose, location, or any special configuration requirements.',
        });
      }
      return violations;
    },
  },
];

export class ComplianceService {
  /**
   * Run compliance checks against the latest snapshot of an organization.
   */
  static async runChecks(organizationId: string, snapshotId?: string): Promise<ComplianceReport> {
    // Get the snapshot to check
    let snapshotQuery;
    if (snapshotId) {
      snapshotQuery = await query(
        `SELECT id, snapshot_data, created_at FROM config_snapshots WHERE id = $1 AND organization_id = $2`,
        [snapshotId, organizationId]
      );
    } else {
      snapshotQuery = await query(
        `SELECT id, snapshot_data, created_at FROM config_snapshots
         WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [organizationId]
      );
    }

    if (snapshotQuery.rows.length === 0) {
      return {
        organizationId,
        snapshotId: snapshotId ?? '',
        score: 100,
        totalChecks: COMPLIANCE_RULES.length,
        passed: COMPLIANCE_RULES.length,
        failed: 0,
        violations: [],
        byCategory: {},
        checkedAt: new Date().toISOString(),
      };
    }

    const snapshot = snapshotQuery.rows[0];
    const snapshotData = snapshot.snapshot_data;
    const allViolations: ComplianceViolation[] = [];
    const byCategory: Record<string, { passed: number; failed: number }> = {};

    for (const rule of COMPLIANCE_RULES) {
      if (!byCategory[rule.category]) {
        byCategory[rule.category] = { passed: 0, failed: 0 };
      }

      const violations = rule.check(snapshotData);
      if (violations.length === 0) {
        byCategory[rule.category].passed++;
      } else {
        byCategory[rule.category].failed++;
        allViolations.push(...violations);
      }
    }

    const totalChecks = COMPLIANCE_RULES.length;
    const failed = Object.values(byCategory).reduce((sum, c) => sum + c.failed, 0);
    const passed = totalChecks - failed;
    const score = Math.round((passed / totalChecks) * 100);

    return {
      organizationId,
      snapshotId: snapshot.id,
      score,
      totalChecks,
      passed,
      failed,
      violations: allViolations,
      byCategory,
      checkedAt: new Date().toISOString(),
    };
  }

  static getRules(): ComplianceRule[] {
    return COMPLIANCE_RULES.map(({ check: _, ...rule }) => rule as any);
  }
}
