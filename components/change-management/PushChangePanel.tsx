import React, { useState, useRef } from 'react';
import { X, Wifi, Loader2 } from 'lucide-react';
import {
  getOrganizations, getOrgNetworks,
  createNetworkApplianceVlan,
  updateNetworkApplianceFirewallL3FirewallRules,
  updateNetworkWirelessSsid,
  updateSwitchPort,
  createNetworkSwitchAccessPolicy,
  updateNetworkSettings,
  updateDevice,
} from '../../services/merakiService';
import { MerakiOrganization, MerakiNetwork } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AffectedResources {
  devices: string[];
  networks: string[];
  specificChanges: string;
  riskLevel: string;
  rollbackPlan: string;
}

interface ChangeRequest {
  id: string;
  title: string;
  change_type: string;
  affected_resources: AffectedResources | null;
  status: string;
}

export interface PushChangePanelProps {
  change: ChangeRequest;
  onComplete: () => void;
  onCancel: () => void;
}

// ── Region list ───────────────────────────────────────────────────────────────

const REGIONS = [
  { code: 'com', name: 'Global (Americas)' },
  { code: 'in',  name: 'India' },
  { code: 'eu',  name: 'Europe' },
  { code: 'au',  name: 'Australia' },
  { code: 'ca',  name: 'Canada' },
  { code: 'uk',  name: 'United Kingdom' },
  { code: 'cn',  name: 'China' },
];

// ── JSON templates per change type ────────────────────────────────────────────

function getTemplate(changeType: string): object | null {
  switch (changeType) {
    case 'vlan':
      return { id: 100, name: 'New VLAN', subnet: '10.100.0.0/24', applianceIp: '10.100.0.1' };
    case 'firewall':
      return {
        rules: [
          {
            comment: 'Rule description',
            policy: 'allow',
            protocol: 'tcp',
            srcPort: 'Any',
            srcCidr: '192.168.1.0/24',
            destPort: '443',
            destCidr: 'Any',
            syslogEnabled: false,
          },
        ],
      };
    case 'ssid':
      return {
        name: 'My SSID',
        enabled: true,
        authMode: 'psk',
        encryptionMode: 'wpa',
        psk: 'YourPassphrase1!',
        ipAssignmentMode: 'Bridge mode',
        defaultVlanId: 1,
      };
    case 'switch-port':
      return {
        name: 'Port description',
        enabled: true,
        poeEnabled: true,
        type: 'access',
        vlan: 1,
        allowedVlans: 'all',
        isolationEnabled: false,
        rstpEnabled: true,
        stpGuard: 'disabled',
      };
    case 'access-policy':
      return {
        name: 'Dot1x Policy',
        radiusServers: [{ host: '1.2.3.4', port: 1812, secret: 'radius_secret' }],
        radiusTestingEnabled: false,
        hostMode: 'Single-Host',
        urlRedirectWalledGardenEnabled: false,
        voiceVlanClients: false,
        dot1xControlDirection: 'inbound',
      };
    case 'network':
      return { notes: 'Updated via MerakiMigration change management' };
    case 'device':
      return { name: 'Device Name', tags: [], notes: '' };
    default:
      return {};
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: '13px',
  border: '1px solid var(--color-border-primary)', borderRadius: '4px',
  backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
  outline: 'none', boxSizing: 'border-box',
};
const LBL: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: 'var(--color-text-secondary)', marginBottom: '4px',
  letterSpacing: '0.04em', textTransform: 'uppercase',
};
const SECTION: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
  textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: '10px',
};

// ── Main component ─────────────────────────────────────────────────────────────

type Phase = 'connect' | 'payload' | 'pushing' | 'done';

export const PushChangePanel: React.FC<PushChangePanelProps> = ({ change, onComplete, onCancel }) => {
  const [phase, setPhase] = useState<Phase>('connect');

  // Connection state
  const [region, setRegion] = useState('com');
  const [apiKey, setApiKey] = useState('');
  const [orgs, setOrgs] = useState<MerakiOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<MerakiOrganization | null>(null);
  const [networks, setNetworks] = useState<MerakiNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<MerakiNetwork | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  // Extra fields for certain change types
  const [deviceSerial, setDeviceSerial] = useState(change.affected_resources?.devices[0] ?? '');
  const [portId, setPortId] = useState('');
  const [ssidNumber, setSsidNumber] = useState('0');

  // Payload
  const template = getTemplate(change.change_type);
  const [payloadStr, setPayloadStr] = useState(JSON.stringify(template, null, 2));
  const [payloadError, setPayloadError] = useState('');

  // Push log
  const [log, setLog] = useState<string[]>([]);
  const [pushError, setPushError] = useState('');
  const hasRun = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLog(prev => {
      const next = [...prev, msg];
      return next;
    });
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 30);
  };

  // ── Connect ──
  const handleConnect = async () => {
    setConnecting(true);
    setConnectError('');
    setOrgs([]);
    setSelectedOrg(null);
    setNetworks([]);
    setSelectedNetwork(null);
    try {
      const data = await getOrganizations(apiKey, region);
      setOrgs(data);
      if (data.length === 1) handleSelectOrg(data[0]);
    } catch (e: any) {
      setConnectError(e.message || 'Failed to connect. Check your API key and region.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSelectOrg = async (org: MerakiOrganization) => {
    setSelectedOrg(org);
    setNetworks([]);
    setSelectedNetwork(null);
    try {
      const nets = await getOrgNetworks(apiKey, region, org.id);
      setNetworks(nets);
      if (nets.length === 1) setSelectedNetwork(nets[0]);
    } catch (e: any) {
      setConnectError(e.message || 'Failed to load networks.');
    }
  };

  const canGoToPayload = !!selectedNetwork && (
    change.change_type === 'firmware' ||
    change.change_type !== 'firmware'
  );

  // ── Push ──
  const handlePush = async () => {
    setPayloadError('');
    let parsed: any;
    try {
      parsed = JSON.parse(payloadStr);
    } catch {
      setPayloadError('Invalid JSON — please fix the syntax above before pushing.');
      return;
    }

    if (!selectedNetwork || !apiKey) return;

    setPhase('pushing');
    hasRun.current = true;

    const networkId = selectedNetwork.id;
    const ct = change.change_type;

    try {
      addLog(`── Pushing "${change.title}" to network "${selectedNetwork.name}" ──`);

      if (ct === 'vlan') {
        addLog('Creating VLAN…');
        await createNetworkApplianceVlan(apiKey, region, networkId, parsed);
        addLog(`✅ VLAN created successfully.`);
      } else if (ct === 'firewall') {
        addLog('Updating L3 firewall rules…');
        await updateNetworkApplianceFirewallL3FirewallRules(apiKey, region, networkId, parsed);
        addLog(`✅ Firewall rules updated.`);
      } else if (ct === 'ssid') {
        const num = parseInt(ssidNumber, 10);
        addLog(`Updating SSID #${num}…`);
        await updateNetworkWirelessSsid(apiKey, region, networkId, num, parsed);
        addLog(`✅ SSID updated.`);
      } else if (ct === 'switch-port') {
        if (!deviceSerial || !portId) throw new Error('Device serial and port ID are required for switch-port changes.');
        addLog(`Updating port ${portId} on ${deviceSerial}…`);
        await updateSwitchPort(apiKey, region, deviceSerial, portId, parsed);
        addLog(`✅ Switch port ${portId} updated.`);
      } else if (ct === 'access-policy') {
        addLog('Creating access policy…');
        await createNetworkSwitchAccessPolicy(apiKey, region, networkId, parsed);
        addLog(`✅ Access policy created.`);
      } else if (ct === 'device') {
        if (!deviceSerial) throw new Error('Device serial is required for device changes.');
        addLog(`Updating device ${deviceSerial}…`);
        await updateDevice(apiKey, region, deviceSerial, parsed);
        addLog(`✅ Device updated.`);
      } else if (ct === 'firmware') {
        addLog('⚠️ Firmware upgrades cannot be pushed directly via this tool.');
        addLog('Please use the Meraki Dashboard to schedule firmware upgrades.');
      } else {
        addLog('Updating network settings…');
        await updateNetworkSettings(apiKey, region, networkId, parsed);
        addLog(`✅ Network settings updated.`);
      }

      addLog('');
      addLog('── ✅ Push complete. Marking change as Completed. ──');
      setPhase('done');
      setTimeout(() => onComplete(), 1200);

    } catch (e: any) {
      const msg = e.message || 'Unknown error';
      addLog(`❌ Push failed: ${msg}`);
      setPushError(msg);
      setPhase('done');
    }
  };

  // ── Render ──
  return (
    <div style={{
      marginTop: '14px',
      border: '1px solid var(--color-border-primary)',
      borderRadius: '6px',
      backgroundColor: 'var(--color-bg-secondary)',
      overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: '#f0faf2',
        borderBottom: '1px solid #bbdfc4',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#025115' }}>
          Push to Network
        </span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ padding: '18px 20px' }}>

        {/* ── Firmware notice ── */}
        {change.change_type === 'firmware' && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '5px', fontSize: '13px', color: '#92400e', marginBottom: '16px' }}>
            Firmware upgrades cannot be triggered via the Meraki API from this tool. Please schedule the upgrade directly in the Meraki Dashboard under Network → Firmware upgrades.
          </div>
        )}

        {/* ── Connect phase ── */}
        {(phase === 'connect' || phase === 'payload') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={SECTION}>1. Connect to Meraki</div>

            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label style={LBL}>Region</label>
                <select style={INP} value={region} onChange={e => { setRegion(e.target.value); setOrgs([]); setSelectedOrg(null); setNetworks([]); setSelectedNetwork(null); }}>
                  {REGIONS.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>API Key</label>
                <input style={INP} type="password" placeholder="Meraki API key" value={apiKey} onChange={e => setApiKey(e.target.value)} />
              </div>
              <button
                onClick={handleConnect}
                disabled={!apiKey || connecting}
                style={{
                  padding: '7px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: (!apiKey || connecting) ? 'not-allowed' : 'pointer',
                  backgroundColor: (!apiKey || connecting) ? '#6b7280' : '#2563eb', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {connecting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Wifi size={13} />}
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
            </div>

            {connectError && (
              <div style={{ fontSize: '12px', color: '#dc2626', padding: '6px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
                {connectError}
              </div>
            )}

            {orgs.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LBL}>Organization</label>
                  <select style={INP} value={selectedOrg?.id ?? ''} onChange={e => { const o = orgs.find(x => x.id === e.target.value); if (o) handleSelectOrg(o); }}>
                    <option value="">Select organization…</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Network</label>
                  <select style={INP} value={selectedNetwork?.id ?? ''} onChange={e => { const n = networks.find(x => x.id === e.target.value); setSelectedNetwork(n ?? null); }} disabled={networks.length === 0}>
                    <option value="">Select network…</option>
                    {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Extra fields */}
            {(change.change_type === 'switch-port' || change.change_type === 'device') && (
              <div style={{ display: 'grid', gridTemplateColumns: change.change_type === 'switch-port' ? '1fr 1fr' : '1fr', gap: '10px' }}>
                <div>
                  <label style={LBL}>Device Serial</label>
                  <input style={INP} type="text" placeholder="Q2QN-XXXX-XXXX" value={deviceSerial} onChange={e => setDeviceSerial(e.target.value)} />
                </div>
                {change.change_type === 'switch-port' && (
                  <div>
                    <label style={LBL}>Port ID</label>
                    <input style={INP} type="text" placeholder="e.g. 5" value={portId} onChange={e => setPortId(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {change.change_type === 'ssid' && (
              <div style={{ maxWidth: '180px' }}>
                <label style={LBL}>SSID Number (0–15)</label>
                <input style={INP} type="number" min={0} max={15} value={ssidNumber} onChange={e => setSsidNumber(e.target.value)} />
              </div>
            )}

            {/* Payload editor */}
            {phase === 'payload' && change.change_type !== 'firmware' && (
              <div>
                <div style={{ ...SECTION, marginTop: '8px' }}>2. API Payload (edit as needed)</div>
                <textarea
                  value={payloadStr}
                  onChange={e => { setPayloadStr(e.target.value); setPayloadError(''); }}
                  rows={12}
                  spellCheck={false}
                  style={{
                    ...INP,
                    fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.5,
                    resize: 'vertical',
                  }}
                />
                {payloadError && (
                  <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{payloadError}</div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
              {phase === 'connect' && (
                <button
                  onClick={() => setPhase('payload')}
                  disabled={!canGoToPayload && change.change_type !== 'firmware'}
                  style={{
                    padding: '7px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 600,
                    backgroundColor: (canGoToPayload || change.change_type === 'firmware') ? '#2563eb' : '#6b7280',
                    color: '#fff', border: 'none',
                    cursor: (canGoToPayload || change.change_type === 'firmware') ? 'pointer' : 'not-allowed',
                  }}
                >
                  {change.change_type === 'firmware' ? 'Acknowledge' : 'Review Payload →'}
                </button>
              )}

              {phase === 'payload' && (
                <>
                  <button
                    onClick={handlePush}
                    style={{ padding: '7px 20px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, backgroundColor: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    Push Change
                  </button>
                  <button
                    onClick={() => setPhase('connect')}
                    style={{ padding: '7px 14px', borderRadius: '4px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                </>
              )}

              <button
                onClick={onCancel}
                style={{ padding: '7px 14px', borderRadius: '4px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Pushing / Done phase ── */}
        {(phase === 'pushing' || phase === 'done') && (
          <div>
            <div style={SECTION}>{phase === 'pushing' ? 'Pushing change…' : 'Push result'}</div>
            <div
              ref={logRef}
              style={{
                height: '200px', overflowY: 'auto', padding: '12px',
                backgroundColor: '#0f172a', borderRadius: '5px',
                fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6,
              }}
            >
              {log.map((l, i) => (
                <div key={i} style={{ color: l.startsWith('✅') ? '#4ade80' : l.startsWith('❌') ? '#f87171' : l.startsWith('⚠️') ? '#fbbf24' : l.startsWith('──') ? '#94a3b8' : '#e2e8f0' }}>
                  {l}
                </div>
              ))}
              {phase === 'pushing' && <div style={{ color: '#94a3b8' }}>▌</div>}
            </div>
            {phase === 'done' && !pushError && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                Change pushed successfully and marked as Completed.
              </div>
            )}
            {phase === 'done' && pushError && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={onCancel} style={{ padding: '7px 14px', borderRadius: '4px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
