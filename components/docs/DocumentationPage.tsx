import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface NetworkDoc {
  generatedAt: string;
  organization: { id: string; name: string; region: string; deviceCount: number };
  snapshotId: string;
  snapshotDate: string;
  summary: {
    totalDevices: number;
    totalNetworks: number;
    totalVlans: number;
    totalSsids: number;
    devicesByModel: Record<string, number>;
  };
  devices: any[];
  networks: any[];
  vlans: any[];
  ssids: any[];
  firewallRules: any[];
  markdown: string;
  html: string;
}

interface Snapshot {
  id: string;
  snapshot_type: string;
  created_at: string;
  notes?: string;
}

interface DocumentationPageProps {
  organizationId: string;
  organizationName?: string;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ organizationId, organizationName }) => {
  const [doc, setDoc] = useState<NetworkDoc | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingSnaps, setLoadingSnaps] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'devices' | 'networks' | 'vlans' | 'ssids' | 'firewall'>('summary');
  const [downloading, setDownloading] = useState<'html' | 'markdown' | null>(null);

  useEffect(() => {
    loadSnapshots();
  }, [organizationId]);

  const loadSnapshots = async () => {
    setLoadingSnaps(true);
    try {
      const data = await apiClient.listSnapshots(organizationId, { limit: 20 });
      setSnapshots(data);
    } catch {
      // Non-fatal — user can still generate with latest
    } finally {
      setLoadingSnaps(false);
    }
  };

  const generateDoc = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.generateDocumentation(organizationId, selectedSnapshot || undefined);
      setDoc(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate documentation');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (format: 'html' | 'markdown') => {
    if (!doc) return;
    setDownloading(format);
    try {
      const url = apiClient.getDocumentationDownloadUrl(organizationId, format, selectedSnapshot || undefined);
      // Fetch with auth header
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `network-doc-${doc.organization.name.replace(/\s+/g, '-').toLowerCase()}.${format === 'html' ? 'html' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const TABS = [
    { key: 'summary', label: 'Summary' },
    { key: 'devices', label: `Devices (${doc?.devices.length ?? 0})` },
    { key: 'networks', label: `Networks (${doc?.networks.length ?? 0})` },
    { key: 'vlans', label: `VLANs (${doc?.vlans.length ?? 0})` },
    { key: 'ssids', label: `SSIDs (${doc?.ssids.length ?? 0})` },
    { key: 'firewall', label: `Firewall (${doc?.firewallRules.length ?? 0})` },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Documentation Generator</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {organizationName ? `${organizationName} — ` : ''}Auto-generate network documentation from configuration snapshots.
          </p>
        </div>
        {doc && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadFile('html')}
              disabled={!!downloading}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {downloading === 'html' ? 'Downloading...' : 'Download HTML'}
            </button>
            <button
              onClick={() => downloadFile('markdown')}
              disabled={!!downloading}
              className="flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm font-medium hover:bg-[var(--color-surface-subtle)] disabled:opacity-50"
            >
              {downloading === 'markdown' ? 'Downloading...' : 'Download Markdown'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Controls */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Snapshot (optional — uses latest if blank)
            </label>
            <select
              value={selectedSnapshot}
              onChange={e => setSelectedSnapshot(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="">Latest snapshot</option>
              {loadingSnaps ? (
                <option disabled>Loading snapshots...</option>
              ) : (
                snapshots.map(s => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.created_at).toLocaleString()} — {s.snapshot_type}
                    {s.notes ? ` (${s.notes})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            onClick={generateDoc}
            disabled={loading}
            className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Generating...' : doc ? 'Regenerate' : 'Generate Documentation'}
          </button>
        </div>
      </div>

      {/* Documentation View */}
      {doc && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
          {/* Doc header */}
          <div className="p-5 border-b border-[var(--color-border-primary)] bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{doc.organization.name}</h3>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-[var(--color-text-secondary)]">
              <span>Generated: {new Date(doc.generatedAt).toLocaleString()}</span>
              <span>Snapshot: {new Date(doc.snapshotDate).toLocaleString()}</span>
              <span>Region: {doc.organization.region === 'in' ? 'India (.in)' : 'Global (.com)'}</span>
              <span>Org ID: {doc.organization.id}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-[var(--color-border-primary)] overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Summary */}
            {activeTab === 'summary' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Networks', value: doc.summary.totalNetworks },
                    { label: 'Devices', value: doc.summary.totalDevices },
                    { label: 'VLANs', value: doc.summary.totalVlans },
                    { label: 'Active SSIDs', value: doc.summary.totalSsids },
                  ].map(s => (
                    <div key={s.label} className="bg-[var(--color-surface-subtle)] rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-[var(--color-primary)]">{s.value}</div>
                      <div className="text-sm text-[var(--color-text-secondary)] mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                {Object.keys(doc.summary.devicesByModel).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">Device Models</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[var(--color-surface-subtle)]">
                            <th className="text-left px-3 py-2 font-medium">Model</th>
                            <th className="text-right px-3 py-2 font-medium">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(doc.summary.devicesByModel).map(([model, count]) => (
                            <tr key={model} className="border-t border-[var(--color-border-primary)]">
                              <td className="px-3 py-2">{model}</td>
                              <td className="px-3 py-2 text-right font-medium">{count as number}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Devices */}
            {activeTab === 'devices' && (
              <DocTable
                headers={['Name', 'Serial', 'Model', 'Network', 'Firmware', 'Tags']}
                rows={doc.devices.map(d => [
                  d.name, d.serial, d.model, d.networkName, d.firmware,
                  d.tags?.join(', ') || '—',
                ])}
              />
            )}

            {/* Networks */}
            {activeTab === 'networks' && (
              <DocTable
                headers={['Name', 'Types', 'Timezone', 'Devices']}
                rows={doc.networks.map(n => [
                  n.name,
                  n.productTypes?.join(', ') || '—',
                  n.timeZone,
                  String(n.deviceCount),
                ])}
              />
            )}

            {/* VLANs */}
            {activeTab === 'vlans' && (
              <DocTable
                headers={['ID', 'Name', 'Subnet', 'Gateway', 'Network']}
                rows={doc.vlans.map(v => [
                  String(v.id), v.name, v.subnet, v.applianceIp, v.networkName,
                ])}
              />
            )}

            {/* SSIDs */}
            {activeTab === 'ssids' && (
              <DocTable
                headers={['#', 'Name', 'Auth Mode', 'Encryption', 'Network']}
                rows={doc.ssids.map(s => [
                  String(s.number), s.name, s.authMode, s.encryptionMode || 'N/A', s.networkName,
                ])}
              />
            )}

            {/* Firewall */}
            {activeTab === 'firewall' && (
              doc.firewallRules.length > 0 ? (
                <DocTable
                  headers={['Policy', 'Protocol', 'Source', 'Destination', 'Comment', 'Network']}
                  rows={doc.firewallRules.map(r => [
                    r.policy.toUpperCase(), r.protocol,
                    `${r.srcCidr}:${r.srcPort}`, `${r.destCidr}:${r.destPort}`,
                    r.comment || '—', r.networkName,
                  ])}
                />
              ) : (
                <EmptyState message="No firewall rules found in snapshot data." />
              )
            )}
          </div>
        </div>
      )}

      {!doc && !loading && (
        <div className="text-center py-16 border border-dashed border-[var(--color-border-primary)] rounded-xl">
          <div className="text-4xl mb-3">📄</div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">No Documentation Yet</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Click Generate Documentation to build a full report from your latest snapshot.
          </p>
        </div>
      )}
    </div>
  );
};

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) return <EmptyState message="No data available." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-surface-subtle)]">
            {headers.map(h => (
              <th key={h} className="text-left px-3 py-2 font-medium text-[var(--color-text-secondary)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--color-border-primary)] hover:bg-[var(--color-surface-subtle)]">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-[var(--color-text-primary)]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-[var(--color-text-secondary)] text-sm">{message}</div>
  );
}
