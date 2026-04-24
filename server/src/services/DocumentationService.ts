import { query } from '../config/database';

export interface NetworkDoc {
  generatedAt: string;
  organization: {
    id: string;
    name: string;
    region: string;
    deviceCount: number;
  };
  snapshotId: string;
  snapshotDate: string;
  summary: {
    totalDevices: number;
    totalNetworks: number;
    totalVlans: number;
    totalSsids: number;
    devicesByModel: Record<string, number>;
  };
  devices: DeviceDoc[];
  networks: NetworkSectionDoc[];
  vlans: VlanDoc[];
  ssids: SsidDoc[];
  firewallRules: FirewallRuleDoc[];
  markdown: string;
  html: string;
}

interface DeviceDoc {
  serial: string;
  name: string;
  model: string;
  networkId: string;
  networkName: string;
  firmware: string;
  tags: string[];
  address: string;
  notes: string;
}

interface NetworkSectionDoc {
  id: string;
  name: string;
  productTypes: string[];
  timeZone: string;
  deviceCount: number;
}

interface VlanDoc {
  id: number;
  name: string;
  subnet: string;
  applianceIp: string;
  networkName: string;
}

interface SsidDoc {
  number: number;
  name: string;
  enabled: boolean;
  authMode: string;
  encryptionMode: string;
  networkName: string;
}

interface FirewallRuleDoc {
  policy: string;
  protocol: string;
  srcCidr: string;
  srcPort: string;
  destCidr: string;
  destPort: string;
  comment: string;
  networkName: string;
}

export class DocumentationService {
  static async generateDoc(organizationId: string, snapshotId?: string): Promise<NetworkDoc> {
    // Get org details
    const orgResult = await query(
      `SELECT meraki_org_id, meraki_org_name, meraki_region, device_count
       FROM organizations WHERE id = $1`,
      [organizationId]
    );

    if (orgResult.rows.length === 0) {
      throw new Error('Organization not found');
    }

    const org = orgResult.rows[0];

    // Get snapshot
    let snapshotResult;
    if (snapshotId) {
      snapshotResult = await query(
        `SELECT id, snapshot_data, created_at FROM config_snapshots WHERE id = $1 AND organization_id = $2`,
        [snapshotId, organizationId]
      );
    } else {
      snapshotResult = await query(
        `SELECT id, snapshot_data, created_at FROM config_snapshots
         WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [organizationId]
      );
    }

    if (snapshotResult.rows.length === 0) {
      throw new Error('No snapshot found. Create a snapshot first.');
    }

    const snapshot = snapshotResult.rows[0];
    const data = snapshot.snapshot_data;
    const networks: any[] = data.networks || [];
    const devices: any[] = data.devices || [];

    // SSIDs, VLANs, and firewall rules are stored per-network inside
    // data.networkLevel[networkId] — flatten them all with networkId attached.
    const networkLevel: Record<string, any> = data.networkLevel || {};

    const vlans: any[] = Object.entries(networkLevel).flatMap(([networkId, cfg]: [string, any]) =>
      (cfg.vlans || []).map((v: any) => ({ ...v, networkId }))
    );

    const ssids: any[] = Object.entries(networkLevel).flatMap(([networkId, cfg]: [string, any]) =>
      (cfg.ssids || []).map((s: any) => ({ ...s, networkId }))
    );

    // Meraki returns l3FirewallRules as { rules: [...] }, not a bare array
    const firewallRules: any[] = Object.entries(networkLevel).flatMap(([networkId, cfg]: [string, any]) => {
      const raw = cfg.l3FirewallRules;
      const rules: any[] = Array.isArray(raw) ? raw : (raw?.rules || []);
      return rules.map((r: any) => ({ ...r, networkId }));
    });

    // Build network name lookup
    const networkMap = new Map<string, string>(networks.map((n: any) => [n.id, n.name]));

    // Device summary
    const devicesByModel: Record<string, number> = {};
    for (const d of devices) {
      devicesByModel[d.model || 'Unknown'] = (devicesByModel[d.model || 'Unknown'] || 0) + 1;
    }

    const deviceDocs: DeviceDoc[] = devices.map((d: any) => ({
      serial: d.serial || '',
      name: d.name || d.serial || 'Unnamed',
      model: d.model || 'Unknown',
      networkId: d.networkId || '',
      networkName: networkMap.get(d.networkId) || 'Unassigned',
      firmware: d.firmware || d.firmwareVersion || 'Unknown',
      tags: d.tags || [],
      address: d.address || '',
      notes: d.notes || '',
    }));

    const networkDocs: NetworkSectionDoc[] = networks.map((n: any) => ({
      id: n.id,
      name: n.name,
      productTypes: n.productTypes || [],
      timeZone: n.timeZone || 'UTC',
      deviceCount: devices.filter((d: any) => d.networkId === n.id).length,
    }));

    const vlanDocs: VlanDoc[] = vlans.map((v: any) => ({
      id: v.id,
      name: v.name || 'Unnamed',
      subnet: v.subnet || '',
      applianceIp: v.applianceIp || '',
      networkName: networkMap.get(v.networkId) || v.networkId || '',
    }));

    const ssidDocs: SsidDoc[] = ssids
      .filter((s: any) => s.enabled)
      .map((s: any) => ({
        number: s.number,
        name: s.name || `SSID ${s.number}`,
        enabled: s.enabled,
        authMode: s.authMode || 'open',
        encryptionMode: s.encryptionMode || 'none',
        networkName: networkMap.get(s.networkId) || s.networkId || '',
      }));

    const firewallDocs: FirewallRuleDoc[] = firewallRules.map((r: any) => ({
      policy: r.policy || 'allow',
      protocol: r.protocol || 'any',
      srcCidr: r.srcCidr || 'Any',
      srcPort: r.srcPort || 'Any',
      destCidr: r.destCidr || 'Any',
      destPort: r.destPort || 'Any',
      comment: r.comment || '',
      networkName: networkMap.get(r.networkId) || r.networkId || 'All Networks',
    }));

    const doc: Omit<NetworkDoc, 'markdown' | 'html'> = {
      generatedAt: new Date().toISOString(),
      organization: {
        id: org.meraki_org_id,
        name: org.meraki_org_name,
        region: org.meraki_region,
        deviceCount: org.device_count,
      },
      snapshotId: snapshot.id,
      snapshotDate: snapshot.created_at,
      summary: {
        totalDevices: devices.length,
        totalNetworks: networks.length,
        totalVlans: vlans.length,
        totalSsids: ssids.filter((s: any) => s.enabled).length,
        devicesByModel,
      },
      devices: deviceDocs,
      networks: networkDocs,
      vlans: vlanDocs,
      ssids: ssidDocs,
      firewallRules: firewallDocs,
    };

    const markdown = DocumentationService.toMarkdown(doc);
    const html = DocumentationService.toHtml(doc, markdown);

    return { ...doc, markdown, html };
  }

  private static toMarkdown(doc: Omit<NetworkDoc, 'markdown' | 'html'>): string {
    const d = doc;
    const lines: string[] = [];

    lines.push(`# Network Documentation — ${d.organization.name}`);
    lines.push(`\n**Generated:** ${new Date(d.generatedAt).toLocaleString()}`);
    lines.push(`**Snapshot Date:** ${new Date(d.snapshotDate).toLocaleString()}`);
    lines.push(`**Region:** ${d.organization.region === 'in' ? 'India (api.meraki.in)' : 'Global (api.meraki.com)'}`);
    lines.push(`**Org ID:** ${d.organization.id}`);

    lines.push('\n---\n');
    lines.push('## Summary\n');
    lines.push(`| Metric | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Networks | ${d.summary.totalNetworks} |`);
    lines.push(`| Devices | ${d.summary.totalDevices} |`);
    lines.push(`| VLANs | ${d.summary.totalVlans} |`);
    lines.push(`| Active SSIDs | ${d.summary.totalSsids} |`);

    if (Object.keys(d.summary.devicesByModel).length > 0) {
      lines.push('\n### Device Models\n');
      lines.push(`| Model | Count |`);
      lines.push(`|-------|-------|`);
      for (const [model, count] of Object.entries(d.summary.devicesByModel)) {
        lines.push(`| ${model} | ${count} |`);
      }
    }

    if (d.networks.length > 0) {
      lines.push('\n---\n');
      lines.push('## Networks\n');
      lines.push(`| Name | Types | Timezone | Devices |`);
      lines.push(`|------|-------|----------|---------|`);
      for (const n of d.networks) {
        lines.push(`| ${n.name} | ${n.productTypes.join(', ')} | ${n.timeZone} | ${n.deviceCount} |`);
      }
    }

    if (d.devices.length > 0) {
      lines.push('\n---\n');
      lines.push('## Device Inventory\n');
      lines.push(`| Name | Serial | Model | Network | Firmware | Tags |`);
      lines.push(`|------|--------|-------|---------|----------|------|`);
      for (const dev of d.devices) {
        const tags = dev.tags.length > 0 ? dev.tags.join(', ') : '—';
        lines.push(`| ${dev.name} | ${dev.serial} | ${dev.model} | ${dev.networkName} | ${dev.firmware} | ${tags} |`);
      }
    }

    if (d.vlans.length > 0) {
      lines.push('\n---\n');
      lines.push('## VLAN Configuration\n');
      lines.push(`| ID | Name | Subnet | Gateway | Network |`);
      lines.push(`|----|------|--------|---------|---------|`);
      for (const v of d.vlans) {
        lines.push(`| ${v.id} | ${v.name} | ${v.subnet} | ${v.applianceIp} | ${v.networkName} |`);
      }
    }

    if (d.ssids.length > 0) {
      lines.push('\n---\n');
      lines.push('## Wireless SSIDs (Active)\n');
      lines.push(`| # | Name | Auth Mode | Encryption | Network |`);
      lines.push(`|---|------|-----------|------------|---------|`);
      for (const s of d.ssids) {
        lines.push(`| ${s.number} | ${s.name} | ${s.authMode} | ${s.encryptionMode || 'N/A'} | ${s.networkName} |`);
      }
    }

    if (d.firewallRules.length > 0) {
      lines.push('\n---\n');
      lines.push('## Firewall Rules\n');
      lines.push(`| Policy | Protocol | Source | Destination | Comment | Network |`);
      lines.push(`|--------|----------|--------|-------------|---------|---------|`);
      for (const r of d.firewallRules) {
        lines.push(`| ${r.policy.toUpperCase()} | ${r.protocol} | ${r.srcCidr}:${r.srcPort} | ${r.destCidr}:${r.destPort} | ${r.comment || '—'} | ${r.networkName} |`);
      }
    }

    lines.push('\n---');
    lines.push(`\n*Documentation auto-generated by Meraki Management Platform*`);

    return lines.join('\n');
  }

  private static toHtml(doc: Omit<NetworkDoc, 'markdown' | 'html'>, markdown: string): string {
    // Simple HTML wrapper - frontend renders markdown, this is for direct download
    const title = `Network Documentation — ${doc.organization.name}`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1100px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; line-height: 1.6; }
  h1 { color: #1e3a5f; border-bottom: 3px solid #0ea5e9; padding-bottom: 12px; }
  h2 { color: #1e3a5f; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 40px; }
  h3 { color: #334155; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14px; }
  th { background: #0ea5e9; color: white; padding: 10px 14px; text-align: left; }
  td { padding: 8px 14px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  tr:hover { background: #eff6ff; }
  .meta { color: #64748b; font-size: 14px; }
  .meta strong { color: #334155; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }
  footer { color: #94a3b8; font-size: 12px; margin-top: 40px; text-align: center; }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="meta">
  <p><strong>Generated:</strong> ${new Date(doc.generatedAt).toLocaleString()}</p>
  <p><strong>Snapshot Date:</strong> ${new Date(doc.snapshotDate).toLocaleString()}</p>
  <p><strong>Region:</strong> ${doc.organization.region === 'in' ? 'India (api.meraki.in)' : 'Global (api.meraki.com)'}</p>
  <p><strong>Org ID:</strong> ${doc.organization.id}</p>
</div>
<hr>
<h2>Summary</h2>
<table><tr><th>Metric</th><th>Count</th></tr>
<tr><td>Networks</td><td>${doc.summary.totalNetworks}</td></tr>
<tr><td>Devices</td><td>${doc.summary.totalDevices}</td></tr>
<tr><td>VLANs</td><td>${doc.summary.totalVlans}</td></tr>
<tr><td>Active SSIDs</td><td>${doc.summary.totalSsids}</td></tr>
</table>
${Object.keys(doc.summary.devicesByModel).length > 0 ? `
<h3>Device Models</h3>
<table><tr><th>Model</th><th>Count</th></tr>
${Object.entries(doc.summary.devicesByModel).map(([m, c]) => `<tr><td>${m}</td><td>${c}</td></tr>`).join('')}
</table>` : ''}
${doc.networks.length > 0 ? `
<hr><h2>Networks</h2>
<table><tr><th>Name</th><th>Types</th><th>Timezone</th><th>Devices</th></tr>
${doc.networks.map(n => `<tr><td>${n.name}</td><td>${n.productTypes.join(', ')}</td><td>${n.timeZone}</td><td>${n.deviceCount}</td></tr>`).join('')}
</table>` : ''}
${doc.devices.length > 0 ? `
<hr><h2>Device Inventory</h2>
<table><tr><th>Name</th><th>Serial</th><th>Model</th><th>Network</th><th>Firmware</th><th>Tags</th></tr>
${doc.devices.map(d => `<tr><td>${d.name}</td><td>${d.serial}</td><td>${d.model}</td><td>${d.networkName}</td><td>${d.firmware}</td><td>${d.tags.join(', ') || '—'}</td></tr>`).join('')}
</table>` : ''}
${doc.vlans.length > 0 ? `
<hr><h2>VLAN Configuration</h2>
<table><tr><th>ID</th><th>Name</th><th>Subnet</th><th>Gateway</th><th>Network</th></tr>
${doc.vlans.map(v => `<tr><td>${v.id}</td><td>${v.name}</td><td>${v.subnet}</td><td>${v.applianceIp}</td><td>${v.networkName}</td></tr>`).join('')}
</table>` : ''}
${doc.ssids.length > 0 ? `
<hr><h2>Wireless SSIDs (Active)</h2>
<table><tr><th>#</th><th>Name</th><th>Auth Mode</th><th>Encryption</th><th>Network</th></tr>
${doc.ssids.map(s => `<tr><td>${s.number}</td><td>${s.name}</td><td>${s.authMode}</td><td>${s.encryptionMode || 'N/A'}</td><td>${s.networkName}</td></tr>`).join('')}
</table>` : ''}
${doc.firewallRules.length > 0 ? `
<hr><h2>Firewall Rules</h2>
<table><tr><th>Policy</th><th>Protocol</th><th>Source</th><th>Destination</th><th>Comment</th><th>Network</th></tr>
${doc.firewallRules.map(r => `<tr><td>${r.policy.toUpperCase()}</td><td>${r.protocol}</td><td>${r.srcCidr}:${r.srcPort}</td><td>${r.destCidr}:${r.destPort}</td><td>${r.comment || '—'}</td><td>${r.networkName}</td></tr>`).join('')}
</table>` : ''}
<hr>
<footer>Documentation auto-generated by Meraki Management Platform &bull; ${new Date(doc.generatedAt).toLocaleString()}</footer>
</body></html>`;
  }
}
