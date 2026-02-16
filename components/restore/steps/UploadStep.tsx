import React, { useState, useRef } from 'react';
import { UploadCloud, FileJson, Archive, AlertTriangle, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import { BackupFile, NetworkConfigBackup, DeviceConfigBackup, DeviceBackup } from '../../../types';
import { RestoreData } from '../RestoreWizard';

interface UploadStepProps {
  data: RestoreData;
  onUpdate: (patch: Partial<RestoreData>) => void;
}

// ── ZIP parser ────────────────────────────────────────────────────────────────

async function parseZip(buffer: ArrayBuffer): Promise<BackupFile> {
  const zip = await JSZip.loadAsync(buffer);

  // Organisation details
  let sourceOrgId = 'unknown';
  let sourceOrgName = 'Unknown Organization';
  const orgDetailsFile = zip.file('organization/details.json');
  if (orgDetailsFile) {
    try {
      const raw = await orgDetailsFile.async('text');
      const parsed = JSON.parse(raw);
      sourceOrgId = parsed.id ?? sourceOrgId;
      sourceOrgName = parsed.name ?? sourceOrgName;
    } catch { /* ignore */ }
  }

  // Networks
  const networkConfigs: Record<string, Partial<NetworkConfigBackup>> = {};
  const networkFolderRe = /^networks\/([^/]+)\/(.+)$/;
  const networkFolders = new Set<string>();

  zip.forEach((relativePath) => {
    const m = relativePath.match(networkFolderRe);
    if (m) networkFolders.add(m[1]);
  });

  for (const folder of networkFolders) {
    // Extract networkId: last _-delimited segment
    const parts = folder.split('_');
    const networkId = parts[parts.length - 1] || folder;
    const cfg: Partial<NetworkConfigBackup> = {};

    const readJson = async (filename: string): Promise<any | null> => {
      const f = zip.file(`networks/${folder}/${filename}`);
      if (!f) return null;
      try { return JSON.parse(await f.async('text')); } catch { return null; }
    };

    const vlans = await readJson('appliance_vlans.json');
    if (Array.isArray(vlans)) cfg.applianceVlans = vlans;

    const fwRules = await readJson('appliance_firewall_l3FirewallRules.json');
    if (fwRules) cfg.applianceL3FirewallRules = fwRules;

    const ssids = await readJson('wireless_ssids.json');
    if (Array.isArray(ssids)) cfg.ssids = ssids;

    const groupPolicies = await readJson('group_policies.json');
    if (Array.isArray(groupPolicies)) cfg.groupPolicies = groupPolicies;

    const vpn = await readJson('appliance_vpn_siteToSiteVpn.json');
    if (vpn) cfg.siteToSiteVpnSettings = vpn;

    networkConfigs[networkId] = cfg;
  }

  // Devices
  const devices: DeviceBackup[] = [];
  const deviceFolderRe = /^devices\/([^/]+)\/(.+)$/;
  const deviceFolders = new Set<string>();

  zip.forEach((relativePath) => {
    const m = relativePath.match(deviceFolderRe);
    if (m) deviceFolders.add(m[1]);
  });

  for (const folder of deviceFolders) {
    const parts = folder.split('_');
    const serial = parts[parts.length - 1] || folder;

    const readJson = async (filename: string): Promise<any | null> => {
      const f = zip.file(`devices/${folder}/${filename}`);
      if (!f) return null;
      try { return JSON.parse(await f.async('text')); } catch { return null; }
    };

    const general = await readJson('details.json');
    if (!general) continue;

    const cfg: DeviceConfigBackup = { general };
    const switchPorts = await readJson('switch_ports.json');
    if (Array.isArray(switchPorts)) cfg.switchPorts = switchPorts;

    devices.push({ serial, config: cfg });
  }

  return {
    createdAt: new Date().toISOString(),
    sourceOrgId,
    sourceOrgName,
    devices,
    networkConfigs,
    organizationConfig: {},
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UploadStep({ data, onUpdate }: UploadStepProps) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setParsing(true);
    setParseError('');
    onUpdate({ parsedBackup: null, fileType: null, fileName: '' });

    const isZip = file.name.toLowerCase().endsWith('.zip');
    const isJson = file.name.toLowerCase().endsWith('.json');

    if (!isZip && !isJson) {
      setParseError('Unsupported file type. Please upload a .zip or .json backup file.');
      setParsing(false);
      return;
    }

    try {
      let parsed: BackupFile;

      if (isJson) {
        const text = await file.text();
        parsed = JSON.parse(text) as BackupFile;
        if (!parsed.networkConfigs) throw new Error('File does not appear to be a valid MerakiMigration backup JSON.');
        onUpdate({ fileType: 'json', fileName: file.name, parsedBackup: parsed });
      } else {
        const buffer = await file.arrayBuffer();
        parsed = await parseZip(buffer);
        onUpdate({ fileType: 'zip', fileName: file.name, parsedBackup: parsed });
      }

      // Auto-select network if only one
      const networkIds = Object.keys(parsed.networkConfigs);
      if (networkIds.length === 1) {
        onUpdate({ selectedNetworkId: networkIds[0] });
      }

    } catch (e: any) {
      setParseError(e.message || 'Failed to parse backup file. Ensure it is a valid MerakiMigration backup.');
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const networkCount = data.parsedBackup ? Object.keys(data.parsedBackup.networkConfigs).length : 0;
  const deviceCount = data.parsedBackup ? data.parsedBackup.devices.length : 0;
  const createdAt = data.parsedBackup?.createdAt
    ? new Date(data.parsedBackup.createdAt).toLocaleString()
    : null;

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        Upload Backup File
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
        Upload a <strong>.zip</strong> (full backup) or <strong>.json</strong> (selective backup) created by the Backup tool.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#2563eb' : data.parsedBackup ? '#2563eb' : 'var(--color-border-primary)'}`,
          borderRadius: '10px',
          padding: '60px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragging ? '#f0faf2' : data.parsedBackup ? '#f8fffe' : 'var(--color-bg-secondary)',
          transition: 'border-color 150ms, background 150ms',
          marginBottom: '24px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.zip"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {parsing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Parsing backup file…</span>
          </div>
        ) : data.parsedBackup ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={36} color="#2563eb" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#025115' }}>{data.fileName}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Click to replace</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <UploadCloud size={40} color="var(--color-text-tertiary)" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Drop your backup file here
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                or click to browse · accepts <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>.json</code> and <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>.zip</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parse error */}
      {parseError && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px', marginBottom: '16px' }}>
          <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '13px', color: '#dc2626' }}>{parseError}</span>
        </div>
      )}

      {/* Backup summary */}
      {data.parsedBackup && (
        <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border-primary)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)' }}>
            Backup Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'File type', value: data.fileType === 'zip' ? 'Full ZIP' : 'Selective JSON', icon: data.fileType === 'zip' ? <Archive size={16} /> : <FileJson size={16} /> },
              { label: 'Organization', value: data.parsedBackup.sourceOrgName, icon: null },
              { label: 'Networks', value: String(networkCount), icon: null },
              { label: 'Devices', value: String(deviceCount), icon: null },
            ].map((item, i) => (
              <div key={i} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {item.icon}
                  {item.label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>
          {createdAt && (
            <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border-subtle)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              Created: {createdAt}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
