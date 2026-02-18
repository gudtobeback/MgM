import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { FileText, Download, RefreshCw, Loader2, BookOpen, Monitor, Network, Server, Wifi, Shield } from 'lucide-react';

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

const SELECT = 'w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/50 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all backdrop-blur-sm';

const TAB_ICONS: Record<string, React.ReactNode> = {
  summary:  <BookOpen size={13} />,
  devices:  <Monitor size={13} />,
  networks: <Network size={13} />,
  vlans:    <Server size={13} />,
  ssids:    <Wifi size={13} />,
  firewall: <Shield size={13} />,
};

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ organizationId, organizationName }) => {
  const [doc, setDoc] = useState<NetworkDoc | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingSnaps, setLoadingSnaps] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'devices' | 'networks' | 'vlans' | 'ssids' | 'firewall'>('summary');
  const [downloading, setDownloading] = useState<'html' | 'markdown' | null>(null);

  useEffect(() => { loadSnapshots(); }, [organizationId]);

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
    { key: 'summary',  label: 'Summary' },
    { key: 'devices',  label: `Devices (${doc?.devices.length ?? 0})` },
    { key: 'networks', label: `Networks (${doc?.networks.length ?? 0})` },
    { key: 'vlans',    label: `VLANs (${doc?.vlans.length ?? 0})` },
    { key: 'ssids',    label: `SSIDs (${doc?.ssids.length ?? 0})` },
    { key: 'firewall', label: `Firewall (${doc?.firewallRules.length ?? 0})` },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FileText size={20} className="text-gray-500" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Documentation Generator</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {organizationName ? `${organizationName} — ` : ''}Auto-generate network documentation from configuration snapshots.
          </p>
        </div>
        {doc && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadFile('html')}
              disabled={!!downloading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
            >
              {downloading === 'html'
                ? <Loader2 size={13} className="animate-spin" />
                : <Download size={13} />}
              {downloading === 'html' ? 'Downloading…' : 'Download HTML'}
            </button>
            <button
              onClick={() => downloadFile('markdown')}
              disabled={!!downloading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-foreground border border-white/40 bg-white/40 hover:bg-white/60 transition-all disabled:opacity-50 backdrop-blur-sm"
            >
              {downloading === 'markdown'
                ? <Loader2 size={13} className="animate-spin" />
                : <Download size={13} />}
              {downloading === 'markdown' ? 'Downloading…' : 'Download Markdown'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50/80 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="glass-card p-5">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              Snapshot (optional — uses latest if blank)
            </label>
            <select
              value={selectedSnapshot}
              onChange={e => setSelectedSnapshot(e.target.value)}
              className={SELECT}
            >
              <option value="">Latest snapshot</option>
              {loadingSnaps ? (
                <option disabled>Loading snapshots…</option>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 whitespace-nowrap shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
          >
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : doc
                ? <RefreshCw size={14} />
                : <FileText size={14} />}
            {loading ? 'Generating…' : doc ? 'Regenerate' : 'Generate Documentation'}
          </button>
        </div>
      </div>

      {/* Documentation View */}
      {doc && (
        <div className="glass-card overflow-hidden">
          {/* Doc header */}
          <div className="p-5 border-b border-white/40"
            style={{ background: 'linear-gradient(135deg, rgba(239,246,255,0.8), rgba(238,242,255,0.8))' }}>
            <h2 className="text-xl font-bold text-foreground">{doc.organization.name}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <span>Generated: {new Date(doc.generatedAt).toLocaleString()}</span>
              <span>Snapshot: {new Date(doc.snapshotDate).toLocaleString()}</span>
              <span>Region: {doc.organization.region === 'in' ? 'India (.in)' : 'Global (.com)'}</span>
              <span>Org ID: {doc.organization.id}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-white/40 overflow-x-auto bg-white/20">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 bg-white/30'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/20'
                }`}
              >
                <span className={activeTab === tab.key ? 'text-blue-500' : 'text-muted-foreground'}>
                  {TAB_ICONS[tab.key]}
                </span>
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
                    { label: 'Networks',     value: doc.summary.totalNetworks, icon: <Network size={18} />,  color: 'text-blue-500' },
                    { label: 'Devices',      value: doc.summary.totalDevices,  icon: <Monitor size={18} />,  color: 'text-indigo-500' },
                    { label: 'VLANs',        value: doc.summary.totalVlans,    icon: <Server size={18} />,   color: 'text-purple-500' },
                    { label: 'Active SSIDs', value: doc.summary.totalSsids,    icon: <Wifi size={18} />,     color: 'text-cyan-500' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-4 text-center bg-white/30 border border-white/40 backdrop-blur-sm">
                      <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
                      <div className="text-3xl font-bold text-blue-600">{s.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                {Object.keys(doc.summary.devicesByModel).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Device Models</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/30">
                            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Model</th>
                            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(doc.summary.devicesByModel).map(([model, count]) => (
                            <tr key={model} className="border-t border-white/30 hover:bg-white/20 transition-colors">
                              <td className="px-3 py-2 text-foreground">{model}</td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">{count as number}</td>
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
        <div className="text-center py-16 border border-dashed border-white/50 rounded-xl bg-white/10 backdrop-blur-sm">
          <div className="flex justify-center mb-3 text-muted-foreground opacity-40">
            <FileText size={48} />
          </div>
          <h3 className="font-semibold text-foreground">No Documentation Yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
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
          <tr className="bg-white/30">
            {headers.map(h => (
              <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-white/30 hover:bg-white/20 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-foreground">{cell}</td>
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
    <div className="text-center py-8 text-muted-foreground text-sm">{message}</div>
  );
}
