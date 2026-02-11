import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface Network {
  id: string;
  name: string;
  productTypes: string[];
  timeZone?: string;
}

interface BulkResult {
  networkId: string;
  success: boolean;
  error?: string;
}

interface BulkResponse {
  succeeded: number;
  failed: number;
  results: BulkResult[];
}

interface BulkOperationsPageProps {
  organizationId: string;
  organizationName?: string;
}

type OperationType = 'vlan' | 'firewall' | 'tags';

const OPERATION_OPTIONS = [
  {
    id: 'vlan' as OperationType,
    icon: '🔀',
    title: 'Apply VLAN',
    description: 'Create a VLAN across multiple networks simultaneously.',
  },
  {
    id: 'firewall' as OperationType,
    icon: '🔥',
    title: 'Apply Firewall Rules',
    description: 'Push L3 firewall rules to multiple networks at once.',
  },
  {
    id: 'tags' as OperationType,
    icon: '🏷️',
    title: 'Tag Devices',
    description: 'Apply tags to multiple devices for better asset tracking.',
  },
];

export const BulkOperationsPage: React.FC<BulkOperationsPageProps> = ({ organizationId, organizationName }) => {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [selectedOp, setSelectedOp] = useState<OperationType | null>(null);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BulkResponse | null>(null);
  const [networkError, setNetworkError] = useState('');

  // VLAN form
  const [vlanForm, setVlanForm] = useState({ id: '', name: '', subnet: '', applianceIp: '' });
  // Firewall form
  const [firewallRules, setFirewallRules] = useState([
    { policy: 'deny', protocol: 'tcp', srcCidr: 'Any', srcPort: 'Any', destCidr: 'Any', destPort: 'Any', comment: '' }
  ]);
  // Tags form
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (selectedOp) loadNetworks();
  }, [selectedOp]);

  const loadNetworks = async () => {
    setLoadingNetworks(true);
    setNetworkError('');
    try {
      const data = await apiClient.getBulkNetworks(organizationId);
      setNetworks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setNetworkError(err.message || 'Failed to load networks');
    } finally {
      setLoadingNetworks(false);
    }
  };

  const toggleNetwork = (id: string) => {
    setSelectedNetworks(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedNetworks(networks.map(n => n.id));
  };

  const clearSelection = () => setSelectedNetworks([]);

  const handleRun = async () => {
    if (selectedNetworks.length === 0) return;
    setRunning(true);
    setResult(null);

    try {
      let res: BulkResponse;
      if (selectedOp === 'vlan') {
        res = await apiClient.bulkApplyVlan(organizationId, selectedNetworks, vlanForm);
      } else if (selectedOp === 'firewall') {
        res = await apiClient.bulkApplyFirewall(organizationId, selectedNetworks, firewallRules);
      } else {
        const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
        res = await apiClient.bulkApplyTags(organizationId, selectedNetworks, tags);
      }
      setResult(res);
    } catch (err: any) {
      setResult({ succeeded: 0, failed: selectedNetworks.length, results: [] });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Bulk Operations</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {organizationName ? `${organizationName} — ` : ''}Apply configurations across multiple networks simultaneously.
        </p>
      </div>

      {/* Operation Selection */}
      {!selectedOp ? (
        <div className="grid grid-cols-3 gap-4">
          {OPERATION_OPTIONS.map(op => (
            <button
              key={op.id}
              onClick={() => { setSelectedOp(op.id); setResult(null); setSelectedNetworks([]); }}
              className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6 text-left hover:border-[var(--color-primary)] hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-3">{op.icon}</div>
              <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">{op.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{op.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Back + header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedOp(null); setResult(null); setSelectedNetworks([]); }}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              ← Back
            </button>
            <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">
              {OPERATION_OPTIONS.find(o => o.id === selectedOp)?.title}
            </h3>
          </div>

          {/* Configuration Form */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-5">
            <h4 className="font-medium text-[var(--color-text-primary)] mb-4">Configuration</h4>

            {selectedOp === 'vlan' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">VLAN ID</label>
                  <input type="number" value={vlanForm.id} onChange={e => setVlanForm(f => ({ ...f, id: e.target.value }))}
                    placeholder="100" className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">VLAN Name</label>
                  <input type="text" value={vlanForm.name} onChange={e => setVlanForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Guest" className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Subnet</label>
                  <input type="text" value={vlanForm.subnet} onChange={e => setVlanForm(f => ({ ...f, subnet: e.target.value }))}
                    placeholder="192.168.100.0/24" className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Appliance IP</label>
                  <input type="text" value={vlanForm.applianceIp} onChange={e => setVlanForm(f => ({ ...f, applianceIp: e.target.value }))}
                    placeholder="192.168.100.1" className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]" />
                </div>
              </div>
            )}

            {selectedOp === 'firewall' && (
              <div className="space-y-3">
                {firewallRules.map((rule, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 items-center p-3 bg-[var(--color-surface-subtle)] rounded-lg">
                    <select value={rule.policy} onChange={e => setFirewallRules(r => r.map((x, i) => i === idx ? { ...x, policy: e.target.value } : x))}
                      className="px-2 py-1.5 border border-[var(--color-border-primary)] rounded text-sm bg-white">
                      <option value="deny">Deny</option>
                      <option value="allow">Allow</option>
                    </select>
                    <select value={rule.protocol} onChange={e => setFirewallRules(r => r.map((x, i) => i === idx ? { ...x, protocol: e.target.value } : x))}
                      className="px-2 py-1.5 border border-[var(--color-border-primary)] rounded text-sm bg-white">
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                      <option value="any">Any</option>
                    </select>
                    <input value={rule.srcCidr} onChange={e => setFirewallRules(r => r.map((x, i) => i === idx ? { ...x, srcCidr: e.target.value } : x))}
                      placeholder="Src CIDR" className="px-2 py-1.5 border border-[var(--color-border-primary)] rounded text-sm" />
                    <input value={rule.destCidr} onChange={e => setFirewallRules(r => r.map((x, i) => i === idx ? { ...x, destCidr: e.target.value } : x))}
                      placeholder="Dest CIDR" className="px-2 py-1.5 border border-[var(--color-border-primary)] rounded text-sm" />
                    <input value={rule.comment} onChange={e => setFirewallRules(r => r.map((x, i) => i === idx ? { ...x, comment: e.target.value } : x))}
                      placeholder="Comment" className="px-2 py-1.5 border border-[var(--color-border-primary)] rounded text-sm" />
                    <button onClick={() => setFirewallRules(r => r.filter((_, i) => i !== idx))}
                      className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded text-sm">✕</button>
                  </div>
                ))}
                <button
                  onClick={() => setFirewallRules(r => [...r, { policy: 'deny', protocol: 'tcp', srcCidr: 'Any', srcPort: 'Any', destCidr: 'Any', destPort: 'Any', comment: '' }])}
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  + Add Rule
                </button>
              </div>
            )}

            {selectedOp === 'tags' && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Tags (comma-separated)</label>
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  placeholder="location-hq, floor-1, type-switch"
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]" />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Tags will be applied to all devices in the selected networks.</p>
              </div>
            )}
          </div>

          {/* Network Selection */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-[var(--color-text-primary)]">
                Target Networks ({selectedNetworks.length} selected)
              </h4>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-sm text-[var(--color-primary)] hover:underline">Select All</button>
                <span className="text-[var(--color-text-secondary)]">|</span>
                <button onClick={clearSelection} className="text-sm text-[var(--color-text-secondary)] hover:underline">Clear</button>
              </div>
            </div>

            {networkError && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-3">{networkError}</p>
            )}

            {loadingNetworks ? (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">Loading networks...</p>
            ) : networks.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">No networks found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {networks.map(network => (
                  <label
                    key={network.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedNetworks.includes(network.id)
                        ? 'border-[var(--color-primary)] bg-blue-50'
                        : 'border-[var(--color-border-primary)] hover:bg-[var(--color-surface-subtle)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedNetworks.includes(network.id)}
                      onChange={() => toggleNetwork(network.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{network.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {network.productTypes?.join(', ') || 'Unknown'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Execute Button */}
          <button
            onClick={handleRun}
            disabled={running || selectedNetworks.length === 0}
            className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {running ? `Applying to ${selectedNetworks.length} networks...` : `Apply to ${selectedNetworks.length} Network${selectedNetworks.length !== 1 ? 's' : ''}`}
          </button>

          {/* Results */}
          {result && (
            <div className={`rounded-xl p-5 border ${result.failed === 0 ? 'bg-green-50 border-green-200' : result.succeeded === 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">{result.failed === 0 ? '✅' : result.succeeded === 0 ? '❌' : '⚠️'}</div>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {result.succeeded} succeeded, {result.failed} failed
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">out of {result.succeeded + result.failed} total</p>
                </div>
              </div>
              {result.results.filter(r => !r.success).length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700">Failed networks:</p>
                  {result.results.filter(r => !r.success).map((r, i) => (
                    <p key={i} className="text-xs text-red-600">
                      {r.networkId}: {r.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
