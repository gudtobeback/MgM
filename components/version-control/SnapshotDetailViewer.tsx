import React, { useState } from 'react';
import { formatDistance } from 'date-fns';

interface Snapshot {
  id: string;
  organizationId: string;
  snapshotType: 'manual' | 'scheduled' | 'pre-change' | 'post-change';
  snapshotData: any;
  snapshotMetadata?: any;
  sizeBytes: number;
  createdBy?: string;
  createdAt: string;
  notes?: string;
}

interface SnapshotDetailViewerProps {
  snapshot: Snapshot;
  onClose: () => void;
}

type Tab = 'overview' | 'devices' | 'networks' | 'vlans' | 'ssids' | 'firewall' | 'json';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const SnapshotDetailViewer: React.FC<SnapshotDetailViewerProps> = ({ snapshot, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);
  const [jsonSearch, setJsonSearch] = useState('');

  const data = snapshot.snapshotData || {};
  const networks: any[] = Array.isArray(data.networks) ? data.networks : [];
  const devices: any[] = Array.isArray(data.devices) ? data.devices : [];
  const networkLevel: Record<string, any> = data.networkLevel || {};

  // Aggregate VLANs from all networks
  const allVlans: Array<{ networkName: string; networkId: string; vlan: any }> = [];
  for (const [networkId, netConfig] of Object.entries(networkLevel)) {
    const networkName = networks.find(n => n.id === networkId)?.name || networkId;
    if (Array.isArray(netConfig?.vlans)) {
      for (const vlan of netConfig.vlans) {
        allVlans.push({ networkName, networkId, vlan });
      }
    }
  }

  // Aggregate SSIDs from all networks
  const allSsids: Array<{ networkName: string; networkId: string; ssid: any }> = [];
  for (const [networkId, netConfig] of Object.entries(networkLevel)) {
    const networkName = networks.find(n => n.id === networkId)?.name || networkId;
    if (Array.isArray(netConfig?.ssids)) {
      for (const ssid of netConfig.ssids) {
        if (ssid.name && ssid.name !== 'Unconfigured SSID') {
          allSsids.push({ networkName, networkId, ssid });
        }
      }
    }
  }

  // Aggregate firewall rules from all networks
  const allFirewallRules: Array<{ networkName: string; rule: any }> = [];
  for (const [networkId, netConfig] of Object.entries(networkLevel)) {
    const networkName = networks.find(n => n.id === networkId)?.name || networkId;
    const rules = netConfig?.l3FirewallRules?.rules;
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        allFirewallRules.push({ networkName, rule });
      }
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'devices', label: 'Devices', count: devices.length },
    { id: 'networks', label: 'Networks', count: networks.length },
    { id: 'vlans', label: 'VLANs', count: allVlans.length },
    { id: 'ssids', label: 'SSIDs', count: allSsids.length },
    { id: 'firewall', label: 'Firewall Rules', count: allFirewallRules.length },
    { id: 'json', label: 'Raw JSON' },
  ];

  const rawJson = JSON.stringify(snapshot.snapshotData, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJson).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([rawJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshot-${snapshot.id.slice(0, 8)}-${new Date(snapshot.createdAt).toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const typeColors: Record<string, string> = {
    manual: 'bg-blue-100 text-blue-800',
    scheduled: 'bg-green-100 text-green-800',
    'pre-change': 'bg-yellow-100 text-yellow-800',
    'post-change': 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Snapshot Details</h2>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeColors[snapshot.snapshotType] || 'bg-gray-100 text-gray-800'}`}>
                {snapshot.snapshotType}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Captured {formatDistance(new Date(snapshot.createdAt), new Date(), { addSuffix: true })} &bull; {formatBytes(snapshot.sizeBytes)}
            </p>
            {snapshot.notes && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 italic">{snapshot.notes}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Networks', value: networks.length, icon: '🌐' },
                  { label: 'Devices', value: devices.length, icon: '🖥️' },
                  { label: 'VLANs', value: allVlans.length, icon: '🔀' },
                  { label: 'SSIDs', value: allSsids.length, icon: '📶' },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Snapshot Metadata</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">ID:</span>
                    <span className="ml-2 font-mono text-xs text-slate-700 dark:text-slate-300">{snapshot.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Type:</span>
                    <span className="ml-2 text-slate-700 dark:text-slate-300 capitalize">{snapshot.snapshotType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Captured:</span>
                    <span className="ml-2 text-slate-700 dark:text-slate-300">{new Date(snapshot.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Size:</span>
                    <span className="ml-2 text-slate-700 dark:text-slate-300">{formatBytes(snapshot.sizeBytes)}</span>
                  </div>
                  {snapshot.createdBy && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Created By:</span>
                      <span className="ml-2 font-mono text-xs text-slate-700 dark:text-slate-300">{snapshot.createdBy}</span>
                    </div>
                  )}
                  {data.organization?.name && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Organization:</span>
                      <span className="ml-2 text-slate-700 dark:text-slate-300">{data.organization.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {data.organizationLevel?.snmpSettings && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">SNMP Settings</h3>
                  <pre className="text-xs text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(data.organizationLevel.snmpSettings, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            devices.length === 0 ? (
              <EmptyState message="No devices found in this snapshot." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      {['Name', 'Serial', 'Model', 'Network', 'Status', 'MAC', 'Firmware'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device, i) => {
                      const network = networks.find(n => n.id === device.networkId);
                      return (
                        <tr key={device.serial || i} className={`border-t border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{device.name || '—'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{device.serial || '—'}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{device.model || '—'}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{network?.name || device.networkId || '—'}</td>
                          <td className="px-4 py-3">
                            {device.status ? (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${device.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {device.status}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{device.mac || '—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{device.firmware || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Networks Tab */}
          {activeTab === 'networks' && (
            networks.length === 0 ? (
              <EmptyState message="No networks found in this snapshot." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      {['Name', 'ID', 'Type', 'Time Zone', 'Tags', 'VLANs', 'SSIDs'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {networks.map((network, i) => {
                      const netConfig = networkLevel[network.id] || {};
                      const vlanCount = Array.isArray(netConfig.vlans) ? netConfig.vlans.length : 0;
                      const ssidCount = Array.isArray(netConfig.ssids) ? netConfig.ssids.filter((s: any) => s.name && s.name !== 'Unconfigured SSID').length : 0;
                      return (
                        <tr key={network.id || i} className={`border-t border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{network.name || '—'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{network.id || '—'}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{Array.isArray(network.productTypes) ? network.productTypes.join(', ') : (network.type || '—')}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{network.timeZone || '—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{Array.isArray(network.tags) ? network.tags.join(', ') || '—' : '—'}</td>
                          <td className="px-4 py-3 text-center">
                            {vlanCount > 0 ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{vlanCount}</span> : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {ssidCount > 0 ? <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">{ssidCount}</span> : <span className="text-slate-400">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* VLANs Tab */}
          {activeTab === 'vlans' && (
            allVlans.length === 0 ? (
              <EmptyState message="No VLANs found in this snapshot." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      {['Network', 'VLAN ID', 'Name', 'Subnet', 'Appliance IP', 'DHCP'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allVlans.map(({ networkName, vlan }, i) => (
                      <tr key={i} className={`border-t border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                        <td className="px-4 py-3 text-slate-500 text-xs">{networkName}</td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{vlan.id ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{vlan.name || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{vlan.subnet || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{vlan.applianceIp || '—'}</td>
                        <td className="px-4 py-3">
                          {vlan.dhcpHandling ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${vlan.dhcpHandling === 'Run a DHCP server' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                              {vlan.dhcpHandling === 'Run a DHCP server' ? 'DHCP' : 'None'}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* SSIDs Tab */}
          {activeTab === 'ssids' && (
            allSsids.length === 0 ? (
              <EmptyState message="No active SSIDs found in this snapshot." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      {['Network', 'SSID #', 'Name', 'Enabled', 'Auth Mode', 'Band', 'VLAN'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allSsids.map(({ networkName, ssid }, i) => (
                      <tr key={i} className={`border-t border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                        <td className="px-4 py-3 text-slate-500 text-xs">{networkName}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{ssid.number ?? '—'}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{ssid.name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${ssid.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {ssid.enabled ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{ssid.authMode || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{ssid.bandSelection || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{ssid.defaultVlanId ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Firewall Rules Tab */}
          {activeTab === 'firewall' && (
            allFirewallRules.length === 0 ? (
              <EmptyState message="No firewall rules found in this snapshot." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      {['Network', 'Policy', 'Protocol', 'Src CIDR', 'Src Port', 'Dst CIDR', 'Dst Port', 'Comment'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allFirewallRules.map(({ networkName, rule }, i) => (
                      <tr key={i} className={`border-t border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                        <td className="px-4 py-3 text-slate-500 text-xs">{networkName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.policy === 'allow' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {rule.policy || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 uppercase">{rule.protocol || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{rule.srcCidr || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{rule.srcPort || 'any'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{rule.destCidr || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{rule.destPort || 'any'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{rule.comment || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
          {/* Raw JSON Tab */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-500 flex-1">
                  Complete snapshot data · {formatBytes(snapshot.sizeBytes)}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={jsonSearch}
                    onChange={e => setJsonSearch(e.target.value)}
                    placeholder="Search JSON…"
                    className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                  />
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copied ? (
                      <><svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download .json
                  </button>
                </div>
              </div>
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800 flex items-center px-4 gap-2 z-10">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs text-slate-400 font-mono">snapshot.json</span>
                </div>
                <pre
                  className="text-xs font-mono p-4 pt-10 bg-slate-900 text-slate-300 overflow-auto max-h-[60vh] leading-relaxed"
                  style={{ tabSize: 2 }}
                >
                  {jsonSearch
                    ? (() => {
                        const lines = rawJson.split('\n');
                        const lc = jsonSearch.toLowerCase();
                        return lines
                          .map((line, i) => {
                            if (!line.toLowerCase().includes(lc)) return null;
                            return (
                              <span key={i} className="block">
                                <span className="text-slate-600 select-none mr-3">{String(i + 1).padStart(4)}</span>
                                {line.replace(
                                  new RegExp(`(${jsonSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                  (m) => `\x00HIGHLIGHT\x00${m}\x00ENDHIGHLIGHT\x00`
                                ).split('\x00').map((part, j) =>
                                  part.startsWith('HIGHLIGHT\x00') ? (
                                    <mark key={j} className="bg-yellow-400 text-slate-900 rounded px-0.5">{part.slice('HIGHLIGHT\x00'.length)}</mark>
                                  ) : part === 'ENDHIGHLIGHT\x00' ? null : part
                                )}
                              </span>
                            );
                          })
                          .filter(Boolean);
                      })()
                    : rawJson}
                </pre>
              </div>
              {jsonSearch && (
                <p className="text-xs text-slate-500">
                  Showing lines containing "{jsonSearch}" — {rawJson.split('\n').filter(l => l.toLowerCase().includes(jsonSearch.toLowerCase())).length} match(es)
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-16 text-slate-400 dark:text-slate-500">
    <div className="text-4xl mb-3">📭</div>
    <p className="text-sm">{message}</p>
  </div>
);
