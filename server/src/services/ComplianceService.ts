import { query } from '../config/database';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'pci-dss' | 'hipaa' | 'cis' | 'general' | 'iso27001' | 'dpdp';
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

  // ── Additional CIS Controls v8 ───────────────────────────────────────────
  {
    id: 'cis-asset-inventory-device',
    name: 'Asset Inventory — Device Inventory',
    description: 'CIS Control 1: All enterprise assets must be inventoried and tagged',
    category: 'cis',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.devices || data.devices.length === 0) {
        violations.push({
          ruleId: 'cis-asset-inventory-device',
          ruleName: 'Asset Inventory — Device Inventory',
          category: 'cis',
          severity: 'medium',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No devices found in the network asset inventory.',
          remediation: 'Ensure all network devices are registered in the Meraki dashboard with descriptive names and tags.',
        });
      }
      return violations;
    },
  },
  {
    id: 'cis-secure-config-baseline-default',
    name: 'Secure Configuration — Config Default Baseline Hardening',
    description: 'CIS Control 4: Secure configurations must be established for all assets',
    category: 'cis',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.devices) return violations;
      const defaultNamed = data.devices.filter((d: any) =>
        d.name && (d.name.startsWith('My ') || d.name === d.model || d.name.startsWith('Meraki '))
      );
      if (defaultNamed.length > 0) {
        violations.push({
          ruleId: 'cis-secure-config-baseline-default',
          ruleName: 'Secure Configuration — Config Default Baseline Hardening',
          category: 'cis',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: `${defaultNamed.length} device(s) appear to have default or unconfigured names, indicating a missing secure configuration baseline.`,
          remediation: 'Rename all devices with meaningful identifiers and apply a documented configuration baseline to each device type.',
        });
      }
      return violations;
    },
  },
  {
    id: 'cis-access-control-vlan-radius-8021x',
    name: 'Access Control Management — VLAN ACL RADIUS 802.1X',
    description: 'CIS Control 6: Access must be controlled using VLANs and port authentication',
    category: 'cis',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const has8021x = data.ssids?.some((s: any) =>
        s.enabled && (s.authMode?.includes('8021x') || s.authMode?.includes('ipsk-with-radius'))
      );
      const hasMultipleVlans = data.vlans && data.vlans.length > 1;
      if (!has8021x && !hasMultipleVlans) {
        violations.push({
          ruleId: 'cis-access-control-vlan-radius-8021x',
          ruleName: 'Access Control Management — VLAN ACL RADIUS 802.1X',
          category: 'cis',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No 802.1X port authentication or VLAN-based access segmentation detected. Access control is insufficient.',
          remediation: 'Implement 802.1X/RADIUS authentication on SSIDs and create dedicated VLANs for different user groups.',
        });
      }
      return violations;
    },
  },
  {
    id: 'cis-vulnerability-firmware-patch-update',
    name: 'Vulnerability Management — Firmware Patch Update',
    description: 'CIS Control 7: Vulnerabilities must be identified and remediated through patching',
    category: 'cis',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.devices) return violations;
      const noFirmware = data.devices.filter((d: any) => !d.firmware || d.firmware === 'Not running configured version');
      if (noFirmware.length > 0) {
        violations.push({
          ruleId: 'cis-vulnerability-firmware-patch-update',
          ruleName: 'Vulnerability Management — Firmware Patch Update',
          category: 'cis',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: `${noFirmware.length} device(s) are not running the configured firmware version. Unpatched devices are vulnerable.`,
          remediation: 'Upgrade all devices to the latest stable firmware using Meraki Dashboard > Network-wide > Firmware upgrades.',
        });
      }
      return violations;
    },
  },
  {
    id: 'cis-audit-log-syslog-event',
    name: 'Audit Log Management — Syslog Audit Event',
    description: 'CIS Control 8: Audit logs must be collected and retained',
    category: 'cis',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasSyslog = data.syslogServers && data.syslogServers.length > 0;
      if (!hasSyslog) {
        violations.push({
          ruleId: 'cis-audit-log-syslog-event',
          ruleName: 'Audit Log Management — Syslog Audit Event',
          category: 'cis',
          severity: 'medium',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No syslog server is configured. Audit logs are not being forwarded for centralised retention.',
          remediation: 'Configure a syslog server under Network-wide > General > Reporting to forward all event logs.',
        });
      }
      return violations;
    },
  },
  {
    id: 'cis-web-browser-content-filter-url-email',
    name: 'Web Browser Protections — Content Filter URL Email',
    description: 'CIS Control 9: Web and email filtering must be applied',
    category: 'cis',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasContentFilter = data.contentFiltering?.blockedUrlCategories?.length > 0 ||
        data.contentFiltering?.allowedUrlPatterns?.length > 0 ||
        data.contentFiltering?.blockedUrlPatterns?.length > 0;
      if (!hasContentFilter) {
        violations.push({
          ruleId: 'cis-web-browser-content-filter-url-email',
          ruleName: 'Web Browser Protections — Content Filter URL Email',
          category: 'cis',
          severity: 'medium',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No web content filtering categories are configured. Users are unprotected against malicious web content.',
          remediation: 'Enable content filtering under Security & SD-WAN > Content filtering and block high-risk URL categories.',
        });
      }
      return violations;
    },
  },
  {
    id: 'cis-malware-defences-content-threat-amp',
    name: 'Malware Defences — Content Threat AMP Malware',
    description: 'CIS Control 10: Malware defences must be deployed',
    category: 'cis',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasAMP = data.ampEnabled === true || data.malwareSettings?.mode === 'enabled';
      const hasContentFilter = data.contentFiltering?.blockedUrlCategories?.length > 0;
      if (!hasAMP && !hasContentFilter) {
        violations.push({
          ruleId: 'cis-malware-defences-content-threat-amp',
          ruleName: 'Malware Defences — Content Threat AMP Malware',
          category: 'cis',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No malware protection (AMP) or content filtering is enabled. Endpoints are exposed to malware threats.',
          remediation: 'Enable Advanced Malware Protection (AMP) and Threat Protection under Security & SD-WAN > Threat protection.',
        });
      }
      return violations;
    },
  },
  {
    id: 'cis-network-infrastructure-firewall-device-config',
    name: 'Network Infrastructure Management — Firewall Network Device Config',
    description: 'CIS Control 12: Network devices must be securely managed',
    category: 'cis',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.networks) return violations;
      const applianceNetworks = data.networks.filter((n: any) => n.productTypes?.includes('appliance'));
      const networksWithoutFirewall = applianceNetworks.filter((n: any) =>
        !data.l3FirewallRules?.some((r: any) => r.networkId === n.id) &&
        !data.firewallRules?.some((r: any) => r.networkId === n.id)
      );
      if (networksWithoutFirewall.length > 0) {
        violations.push({
          ruleId: 'cis-network-infrastructure-firewall-device-config',
          ruleName: 'Network Infrastructure Management — Firewall Network Device Config',
          category: 'cis',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: `${networksWithoutFirewall.length} appliance network(s) have no firewall rules configured.`,
          remediation: 'Configure L3 firewall rules on all MX appliance networks to control inbound and outbound traffic.',
        });
      }
      return violations;
    },
  },
  {
    id: 'cis-network-monitoring-ids-ips-alert-anomal',
    name: 'Network Monitoring — IDS IPS Alert Monitor Anomal',
    description: 'CIS Control 13: Network monitoring and intrusion detection must be active',
    category: 'cis',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasIDS = data.intrusionSettings?.mode === 'detection' || data.intrusionSettings?.mode === 'prevention';
      const hasSyslog = data.syslogServers && data.syslogServers.length > 0;
      if (!hasIDS && !hasSyslog) {
        violations.push({
          ruleId: 'cis-network-monitoring-ids-ips-alert-anomal',
          ruleName: 'Network Monitoring — IDS IPS Alert Monitor Anomal',
          category: 'cis',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No intrusion detection (IDS/IPS) or syslog monitoring is configured. Network anomalies will go undetected.',
          remediation: 'Enable IDS/IPS under Security & SD-WAN > Threat protection and configure syslog for centralised monitoring.',
        });
      }
      return violations;
    },
  },

  // ── ISO 27001:2022 Controls ─────────────────────────────────────────────────
  {
    id: 'iso27001-asset-inventory',
    name: 'Asset Inventory — Device Inventory',
    description: 'ISO 27001 A.5.9: An inventory of assets must be compiled and maintained',
    category: 'iso27001',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.devices || data.devices.length === 0) {
        violations.push({
          ruleId: 'iso27001-asset-inventory',
          ruleName: 'Asset Inventory — Device Inventory',
          category: 'iso27001',
          severity: 'medium',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No devices found in the asset inventory. ISO 27001 A.5.9 requires a maintained inventory of all information assets.',
          remediation: 'Register all network devices in the Meraki dashboard with meaningful names and asset tags.',
        });
      } else {
        const untagged = data.devices.filter((d: any) => !d.tags || d.tags.length === 0);
        if (untagged.length > data.devices.length * 0.5) {
          violations.push({
            ruleId: 'iso27001-asset-inventory',
            ruleName: 'Asset Inventory — Device Inventory',
            category: 'iso27001',
            severity: 'medium',
            resourceType: 'organization',
            resourceId: 'org',
            resourceName: 'Organization',
            description: `${untagged.length} of ${data.devices.length} device(s) have no asset tags. Tagging is required for a complete asset inventory.`,
            remediation: 'Tag all devices with location, owner, and device-type labels to satisfy asset inventory requirements.',
          });
        }
      }
      return violations;
    },
  },
  {
    id: 'iso27001-encrypt-transfer',
    name: 'Information Transfer Encryption — VPN TLS Encrypt',
    description: 'ISO 27001 A.5.14: Information transfer must use strong encryption',
    category: 'iso27001',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (data.ssids) {
        for (const ssid of data.ssids) {
          if (ssid.enabled && (ssid.encryptionMode === 'wep' || ssid.encryptionMode === 'tkip')) {
            violations.push({
              ruleId: 'iso27001-encrypt-transfer',
              ruleName: 'Information Transfer Encryption — VPN TLS Encrypt',
              category: 'iso27001',
              severity: 'high',
              resourceType: 'ssid',
              resourceId: String(ssid.number),
              resourceName: ssid.name,
              description: `SSID "${ssid.name}" uses weak encryption (${ssid.encryptionMode}). Information in transit is not adequately protected.`,
              remediation: 'Upgrade the SSID to WPA2-Enterprise or WPA3 to ensure strong encryption for all transmitted data.',
            });
          }
        }
      }
      return violations;
    },
  },
  {
    id: 'iso27001-privilege-access',
    name: 'Privileged Access Rights — Admin Privilege Role',
    description: 'ISO 27001 A.8.2: Privileged access rights must be restricted and managed',
    category: 'iso27001',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const has8021x = data.ssids?.some((s: any) =>
        s.enabled && (s.authMode?.includes('8021x') || s.authMode?.includes('ipsk-with-radius'))
      );
      if (!has8021x) {
        violations.push({
          ruleId: 'iso27001-privilege-access',
          ruleName: 'Privileged Access Rights — Admin Privilege Role',
          category: 'iso27001',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No 802.1X/RADIUS authentication is configured. Privileged access to network resources is not restricted.',
          remediation: 'Configure 802.1X port authentication with RADIUS to enforce role-based network access control.',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-access-restriction',
    name: 'Information Access Restriction — Firewall ACL VLAN Access Policy',
    description: 'ISO 27001 A.8.3: Access to information systems must be restricted per access control policy',
    category: 'iso27001',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.networks) return violations;
      const applianceNetworks = data.networks.filter((n: any) => n.productTypes?.includes('appliance'));
      const noRules = applianceNetworks.filter((n: any) =>
        !data.l3FirewallRules?.some((r: any) => r.networkId === n.id) &&
        !data.firewallRules?.some((r: any) => r.networkId === n.id)
      );
      if (noRules.length > 0) {
        violations.push({
          ruleId: 'iso27001-access-restriction',
          ruleName: 'Information Access Restriction — Firewall ACL VLAN Access Policy',
          category: 'iso27001',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: `${noRules.length} network(s) have no firewall ACL rules. Information access is unrestricted.`,
          remediation: 'Configure L3 firewall rules and VLAN-based ACLs to restrict access to sensitive information systems.',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-secure-auth',
    name: 'Secure Authentication — RADIUS Auth 802.1X MFA Password',
    description: 'ISO 27001 A.8.5: Secure authentication technologies must be implemented',
    category: 'iso27001',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasSecureAuth = data.ssids?.some((s: any) =>
        s.enabled && (
          s.authMode?.includes('8021x') ||
          s.authMode?.includes('ipsk-with-radius') ||
          s.authMode === 'psk'
        )
      );
      if (data.ssids && data.ssids.filter((s: any) => s.enabled).length > 0 && !hasSecureAuth) {
        violations.push({
          ruleId: 'iso27001-secure-auth',
          ruleName: 'Secure Authentication — RADIUS Auth 802.1X MFA Password',
          category: 'iso27001',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'Enabled SSIDs are using open authentication. Secure authentication is not enforced.',
          remediation: 'Configure WPA2/WPA3-Enterprise with RADIUS or at minimum WPA2-Personal (PSK) on all enabled SSIDs.',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-malware-protection',
    name: 'Malware Protection — Content Filter Threat AMP Malware',
    description: 'ISO 27001 A.8.7: Protection against malware must be implemented',
    category: 'iso27001',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasAMP = data.ampEnabled === true || data.malwareSettings?.mode === 'enabled';
      const hasContentFilter = data.contentFiltering?.blockedUrlCategories?.length > 0;
      if (!hasAMP && !hasContentFilter) {
        violations.push({
          ruleId: 'iso27001-malware-protection',
          ruleName: 'Malware Protection — Content Filter Threat AMP Malware',
          category: 'iso27001',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No malware protection (AMP) or content filtering is configured. The network is unprotected against malicious software.',
          remediation: 'Enable Advanced Malware Protection (AMP) and configure content filtering to block malicious URL categories.',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-vulnerability-mgmt',
    name: 'Vulnerability Management — Firmware Patch Vulnerability Update CVE',
    description: 'ISO 27001 A.8.8: Technical vulnerabilities must be identified and remediated',
    category: 'iso27001',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.devices) return violations;
      const outdated = data.devices.filter((d: any) =>
        d.firmware === 'Not running configured version' || d.firmware?.includes('outdated')
      );
      if (outdated.length > 0) {
        violations.push({
          ruleId: 'iso27001-vulnerability-mgmt',
          ruleName: 'Vulnerability Management — Firmware Patch Vulnerability Update CVE',
          category: 'iso27001',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: `${outdated.length} device(s) are not running the configured firmware version, exposing them to known vulnerabilities.`,
          remediation: 'Apply firmware upgrades to all devices via Meraki Dashboard > Network-wide > Firmware upgrades.',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-config-mgmt',
    name: 'Configuration Management — Config Baseline Change Drift',
    description: 'ISO 27001 A.8.9: Configurations must be established, documented, and monitored',
    category: 'iso27001',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      // A config snapshot existing means baselining is occurring; check for untagged/unnamed devices as proxy for undocumented config
      if (!data.devices || data.devices.length === 0) {
        violations.push({
          ruleId: 'iso27001-config-mgmt',
          ruleName: 'Configuration Management — Config Baseline Change Drift',
          category: 'iso27001',
          severity: 'medium',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No devices found. Configuration management baseline cannot be established.',
          remediation: 'Ensure all devices are registered and use the Version Control feature to capture configuration baselines.',
        });
      } else {
        const noNotes = data.devices.filter((d: any) => !d.notes || d.notes.trim() === '');
        if (noNotes.length > data.devices.length * 0.5) {
          violations.push({
            ruleId: 'iso27001-config-mgmt',
            ruleName: 'Configuration Management — Config Baseline Change Drift',
            category: 'iso27001',
            severity: 'medium',
            resourceType: 'organization',
            resourceId: 'org',
            resourceName: 'Organization',
            description: `${noNotes.length} device(s) have no notes documenting their configuration. Configuration baseline is incomplete.`,
            remediation: 'Add notes to all devices documenting configuration purpose and baseline settings.',
          });
        }
      }
      return violations;
    },
  },
  {
    id: 'iso27001-dlp',
    name: 'Data Leakage Prevention — Content Filter DLP URL',
    description: 'ISO 27001 A.8.12: Data leakage prevention measures must be applied',
    category: 'iso27001',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasContentFilter = data.contentFiltering?.blockedUrlCategories?.length > 0 ||
        data.contentFiltering?.blockedUrlPatterns?.length > 0;
      if (!hasContentFilter) {
        violations.push({
          ruleId: 'iso27001-dlp',
          ruleName: 'Data Leakage Prevention — Content Filter DLP URL',
          category: 'iso27001',
          severity: 'medium',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No content filtering is configured to prevent data leakage via web channels.',
          remediation: 'Enable content filtering to block data-exfiltration-prone URL categories (e.g., file sharing, paste sites).',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-logging',
    name: 'Logging — Syslog Audit Event Log',
    description: 'ISO 27001 A.8.15: Logs must be produced, stored, and protected',
    category: 'iso27001',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasSyslog = data.syslogServers && data.syslogServers.length > 0;
      if (!hasSyslog) {
        violations.push({
          ruleId: 'iso27001-logging',
          ruleName: 'Logging — Syslog Audit Event Log',
          category: 'iso27001',
          severity: 'medium',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No syslog server is configured. Security event logs are not being centrally collected or retained.',
          remediation: 'Configure a syslog server under Network-wide > General > Reporting to forward all security events.',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-monitoring',
    name: 'Monitoring Activities — Alert IDS Monitor Anomal',
    description: 'ISO 27001 A.8.16: Networks must be monitored for anomalous behaviour',
    category: 'iso27001',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasIDS = data.intrusionSettings?.mode === 'detection' || data.intrusionSettings?.mode === 'prevention';
      const hasSyslog = data.syslogServers && data.syslogServers.length > 0;
      if (!hasIDS && !hasSyslog) {
        violations.push({
          ruleId: 'iso27001-monitoring',
          ruleName: 'Monitoring Activities — Alert IDS Monitor Anomal',
          category: 'iso27001',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No IDS/IPS or centralised log monitoring is enabled. Anomalous network activity will not be detected.',
          remediation: 'Enable Intrusion Detection/Prevention (IDS/IPS) and configure syslog forwarding for continuous monitoring.',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-network-security',
    name: 'Network Security — Firewall Network Segment VLAN',
    description: 'ISO 27001 A.8.20: Networks and devices must be secured and managed',
    category: 'iso27001',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.networks) return violations;
      const applianceNetworks = data.networks.filter((n: any) => n.productTypes?.includes('appliance'));
      const unprotected = applianceNetworks.filter((n: any) =>
        !data.l3FirewallRules?.some((r: any) => r.networkId === n.id) &&
        !data.firewallRules?.some((r: any) => r.networkId === n.id)
      );
      if (unprotected.length > 0) {
        violations.push({
          ruleId: 'iso27001-network-security',
          ruleName: 'Network Security — Firewall Network Segment VLAN',
          category: 'iso27001',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: `${unprotected.length} network(s) lack firewall rules. Network security controls are insufficient.`,
          remediation: 'Configure firewall rules on all appliance networks and use VLANs to segment network traffic.',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-segregation',
    name: 'Network Segregation — VLAN Segment Segregat Isolat DMZ',
    description: 'ISO 27001 A.8.22: Information services must be segregated in the network',
    category: 'iso27001',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      if (!data.vlans) return violations;
      if (data.vlans.length <= 1) {
        violations.push({
          ruleId: 'iso27001-segregation',
          ruleName: 'Network Segregation — VLAN Segment Segregat Isolat DMZ',
          category: 'iso27001',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'Only one VLAN is configured. Network segregation is insufficient for isolating information services.',
          remediation: 'Create separate VLANs for different user groups (staff, guests, IoT, servers) to enforce network segregation.',
        });
      }
      return violations;
    },
  },
  {
    id: 'iso27001-web-filtering',
    name: 'Web Filtering — Content Filter URL Category Web',
    description: 'ISO 27001 A.8.23: Access to external websites must be managed',
    category: 'iso27001',
    severity: 'medium',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasWebFilter = data.contentFiltering?.blockedUrlCategories?.length > 0 ||
        data.contentFiltering?.allowedUrlPatterns?.length > 0;
      if (!hasWebFilter) {
        violations.push({
          ruleId: 'iso27001-web-filtering',
          ruleName: 'Web Filtering — Content Filter URL Category Web',
          category: 'iso27001',
          severity: 'medium',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No web filtering or URL category blocking is configured. Users can access malicious or inappropriate websites.',
          remediation: 'Enable content filtering under Security & SD-WAN > Content filtering and block high-risk URL categories.',
        });
      }
      return violations;
    },
  },

  // ── DPDP Act 2023 Controls ─────────────────────────────────────────────────
  {
    id: 'dpdp-security-safeguards',
    name: 'Security Safeguards — Firewall Encrypt WPA Security Access',
    description: 'DPDP S.8(3): Reasonable security safeguards must prevent personal data breaches',
    category: 'dpdp',
    severity: 'high',
    check: (data) => {
      const violations: ComplianceViolation[] = [];
      const hasFirewall = data.networks?.some((n: any) =>
        n.productTypes?.includes('appliance') && (
          data.l3FirewallRules?.some((r: any) => r.networkId === n.id) ||
          data.firewallRules?.some((r: any) => r.networkId === n.id)
        )
      );
      const hasStrongWireless = data.ssids?.some((s: any) =>
        s.enabled && s.encryptionMode !== 'wep' && s.encryptionMode !== 'tkip' && s.authMode !== 'open'
      );
      if (!hasFirewall && !hasStrongWireless) {
        violations.push({
          ruleId: 'dpdp-security-safeguards',
          ruleName: 'Security Safeguards — Firewall Encrypt WPA Security Access',
          category: 'dpdp',
          severity: 'high',
          resourceType: 'organization',
          resourceId: 'org',
          resourceName: 'Organization',
          description: 'No firewall rules or strong wireless encryption are configured. Network-level safeguards are insufficient to prevent personal data breaches under DPDP S.8(3).',
          remediation: 'Configure firewall rules on all appliance networks and enable WPA2/WPA3-Enterprise on all wireless SSIDs.',
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
