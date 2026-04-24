import React, { useEffect, useState } from 'react';
import { Globe, Key, ChevronDown, Loader2, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { MERAKI_REGIONS } from '../../steps/migration/SourceConnectionStep';
import { getOrganizations, getOrgNetworks, getNetworkDevices } from '../../../services/merakiService';
import { apiClient } from '../../../services/apiClient';
import { MerakiOrganization, MerakiNetwork } from '../../../types';
import { Cat9KData } from '../Cat9KMigrationWizard';

interface DestinationStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
  connectedOrgs?: any[];
  selectedOrgId?: string;
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: 'var(--color-text-secondary)', marginBottom: '6px',
  letterSpacing: '0.04em', textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--color-border-primary)', borderRadius: '5px',
  fontSize: '13px', color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-bg-primary)', outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: 'none',
  cursor: 'pointer',
};

export function DestinationStep({ data, onUpdate, connectedOrgs = [], selectedOrgId }: DestinationStepProps) {
  // "connected" mode uses the backend-stored API key; "manual" mode lets the user enter one
  const [mode, setMode] = useState<'connected' | 'manual'>(connectedOrgs.length > 0 ? 'connected' : 'manual');

  // Connected-org flow
  const [connectedNetworks, setConnectedNetworks] = useState<MerakiNetwork[]>([]);
  const [connectedOrgId, setConnectedOrgId] = useState<string>(selectedOrgId ?? connectedOrgs[0]?.id?.toString() ?? '');
  const [networkLoadState, setNetworkLoadState] = useState<FetchState>('idle');
  const [networkError, setNetworkError] = useState('');

  // Manual flow (same as before)
  const [orgs, setOrgs] = useState<MerakiOrganization[]>([]);
  const [networks, setNetworks] = useState<MerakiNetwork[]>([]);
  const [orgState, setOrgState] = useState<FetchState>('idle');
  const [networkState, setNetworkState] = useState<FetchState>('idle');
  const [error, setError] = useState('');

  const selectedRegion = MERAKI_REGIONS.find(r => r.code === data.destinationRegion) ?? MERAKI_REGIONS[0];

  // Auto-load networks when connected org is selected
  useEffect(() => {
    if (mode === 'connected' && connectedOrgId) {
      loadConnectedNetworks(connectedOrgId);
    }
  }, [connectedOrgId, mode]);

  const loadConnectedNetworks = async (orgDbId: string) => {
    setNetworkLoadState('loading');
    setNetworkError('');
    setConnectedNetworks([]);
    onUpdate({ destinationNetwork: null, destinationDevices: [], destinationOrg: null });
    try {
      // Fetch networks and credentials in parallel
      const [nets, creds] = await Promise.all([
        apiClient.getOrganizationNetworks(orgDbId) as Promise<MerakiNetwork[]>,
        apiClient.getOrganizationCredentials(orgDbId),
      ]);
      setConnectedNetworks(nets);
      setNetworkLoadState('success');

      // Build a MerakiOrganization-shaped object from the connected org row and
      // store the real API key so ApplyStep can push config to Meraki directly.
      const row = connectedOrgs.find(o => String(o.id) === String(orgDbId));
      if (row) {
        onUpdate({
          destinationOrg: { id: row.meraki_org_id, name: row.meraki_org_name } as MerakiOrganization,
          destinationRegion: creds.region ?? row.meraki_region ?? 'com',
          destinationApiKey: creds.api_key,
        });
      }
    } catch (err: any) {
      setNetworkError(err.message ?? 'Failed to fetch networks.');
      setNetworkLoadState('error');
    }
  };

  const handleConnectedNetworkSelect = async (netId: string) => {
    const net = connectedNetworks.find(n => n.id === netId) ?? null;
    onUpdate({ destinationNetwork: net, destinationDevices: [] });
    if (!net) return;
    // Fetch devices via the backend proxy (uses the stored API key)
    try {
      const devices = await apiClient.getOrganizationNetworkDevices(connectedOrgId, net.id);
      onUpdate({ destinationDevices: devices });
    } catch {
      // Non-fatal — device count is informational only
    }
  };

  // Manual mode handlers (unchanged logic)
  const handleRegionChange = (code: string) => {
    onUpdate({ destinationRegion: code, destinationOrg: null, destinationNetwork: null, destinationDevices: [], destinationApiKey: '' });
    setOrgs([]);
    setNetworks([]);
    setOrgState('idle');
    setNetworkState('idle');
    setError('');
  };

  const handleFetchOrgs = async () => {
    if (!data.destinationApiKey.trim()) return;
    setOrgState('loading');
    setError('');
    try {
      const result = await getOrganizations(data.destinationApiKey, data.destinationRegion);
      setOrgs(result);
      setOrgState('success');
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch organizations.');
      setOrgState('error');
    }
  };

  const handleSelectOrg = async (orgId: string) => {
    const org = orgs.find(o => o.id === orgId) ?? null;
    onUpdate({ destinationOrg: org, destinationNetwork: null, destinationDevices: [] });
    setNetworks([]);
    setNetworkState('idle');
    if (!org) return;
    setNetworkState('loading');
    try {
      const nets = await getOrgNetworks(data.destinationApiKey, data.destinationRegion, org.id);
      setNetworks(nets);
      setNetworkState('success');
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch networks.');
      setNetworkState('error');
    }
  };

  const handleSelectNetwork = async (netId: string) => {
    const net = networks.find(n => n.id === netId) ?? null;
    onUpdate({ destinationNetwork: net, destinationDevices: [] });
    if (!net) return;
    try {
      const devices = await getNetworkDevices(data.destinationApiKey, data.destinationRegion, net.id);
      onUpdate({ destinationDevices: devices });
    } catch {
      // Non-fatal
    }
  };

  const switchMode = (newMode: 'connected' | 'manual') => {
    setMode(newMode);
    onUpdate({ destinationOrg: null, destinationNetwork: null, destinationDevices: [], destinationApiKey: '' });
    setOrgs([]);
    setNetworks([]);
    setOrgState('idle');
    setNetworkState('idle');
    setError('');
    setConnectedNetworks([]);
    setNetworkLoadState('idle');
    setNetworkError('');
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          Select Destination Meraki Network
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Choose the Meraki network where the translated configuration will be pushed.
          The target network should contain Catalyst 9K devices under Meraki cloud management.
        </p>
      </div>

      {/* Mode toggle — only show if there are connected orgs */}
      {connectedOrgs.length > 0 && (
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '24px',
          padding: '4px', backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-primary)', borderRadius: '7px',
          width: 'fit-content',
        }}>
          {(['connected', 'manual'] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                padding: '6px 16px', borderRadius: '5px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 120ms',
                backgroundColor: mode === m ? '#2563eb' : 'transparent',
                color: mode === m ? '#ffffff' : 'var(--color-text-secondary)',
              }}
            >
              {m === 'connected' ? 'Use Connected Org' : 'Different API Key'}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ── Connected-org flow ── */}
        {mode === 'connected' && (
          <>
            {/* Connected org picker */}
            <div>
              <label style={labelStyle}>Connected Organization</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Building2 size={14} color="var(--color-text-tertiary)" />
                </div>
                <select
                  value={connectedOrgId}
                  onChange={e => setConnectedOrgId(e.target.value)}
                  style={{ ...selectStyle, paddingLeft: '32px' }}
                >
                  {connectedOrgs.map(o => (
                    <option key={o.id} value={String(o.id)}>
                      {o.meraki_org_name}
                      {o.meraki_region === 'in' ? ' (India)' : ' (Global)'}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }} />
              </div>
            </div>

            {/* Network error */}
            {networkError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#dc2626', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {networkError}
              </div>
            )}

            {/* Network picker */}
            {(connectedNetworks.length > 0 || networkLoadState === 'loading') && (
              <div>
                <label style={labelStyle}>
                  Network
                  {networkLoadState === 'loading' && (
                    <span style={{ marginLeft: '8px', color: 'var(--color-text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      <Loader2 size={11} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} /> Loading…
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={data.destinationNetwork?.id ?? ''}
                    onChange={e => handleConnectedNetworkSelect(e.target.value)}
                    style={selectStyle}
                    disabled={networkLoadState === 'loading'}
                  >
                    <option value="">Select network…</option>
                    {connectedNetworks.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Manual / different API key flow ── */}
        {mode === 'manual' && (
          <>
            {/* Region */}
            <div>
              <label style={labelStyle}>Region</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Globe size={14} color="var(--color-text-tertiary)" />
                </div>
                <select
                  value={data.destinationRegion}
                  onChange={e => handleRegionChange(e.target.value)}
                  style={{ ...selectStyle, paddingLeft: '32px' }}
                >
                  {MERAKI_REGIONS.map(r => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }} />
              </div>
              {selectedRegion.code !== 'custom' && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  {selectedRegion.dashboard}
                </div>
              )}
            </div>

            {/* API Key */}
            <div>
              <label style={labelStyle}>API Key</label>
              <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}>
                  <Key size={14} color="var(--color-text-tertiary)" />
                </div>
                <input
                  type="password"
                  value={data.destinationApiKey}
                  onChange={e => {
                    onUpdate({ destinationApiKey: e.target.value, destinationOrg: null, destinationNetwork: null, destinationDevices: [] });
                    setOrgs([]);
                    setNetworks([]);
                    setOrgState('idle');
                    setNetworkState('idle');
                  }}
                  placeholder="Enter Meraki API key"
                  style={{ ...inputStyle, paddingLeft: '32px', flex: 1 }}
                  onKeyDown={e => { if (e.key === 'Enter') handleFetchOrgs(); }}
                />
                <button
                  onClick={handleFetchOrgs}
                  disabled={!data.destinationApiKey.trim() || orgState === 'loading'}
                  style={{
                    padding: '9px 16px', flexShrink: 0,
                    backgroundColor: data.destinationApiKey.trim() ? '#2563eb' : 'var(--color-bg-secondary)',
                    color: data.destinationApiKey.trim() ? '#ffffff' : 'var(--color-text-tertiary)',
                    border: `1px solid ${data.destinationApiKey.trim() ? '#2563eb' : 'var(--color-border-primary)'}`,
                    borderRadius: '5px', fontSize: '13px', fontWeight: 600,
                    cursor: data.destinationApiKey.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: '5px',
                  }}
                >
                  {orgState === 'loading'
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : orgState === 'success'
                    ? <CheckCircle2 size={14} />
                    : null
                  }
                  Connect
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#dc2626', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Organization */}
            {orgs.length > 0 && (
              <div>
                <label style={labelStyle}>Organization</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={data.destinationOrg?.id ?? ''}
                    onChange={e => handleSelectOrg(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Select organization…</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }} />
                </div>
              </div>
            )}

            {/* Network */}
            {(networks.length > 0 || networkState === 'loading') && (
              <div>
                <label style={labelStyle}>
                  Network
                  {networkState === 'loading' && (
                    <span style={{ marginLeft: '8px', color: 'var(--color-text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      <Loader2 size={11} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} /> Loading…
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={data.destinationNetwork?.id ?? ''}
                    onChange={e => handleSelectNetwork(e.target.value)}
                    style={selectStyle}
                    disabled={networkState === 'loading'}
                  >
                    <option value="">Select network…</option>
                    {networks.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Selected summary */}
        {data.destinationNetwork && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px',
            fontSize: '13px', color: '#1e3a5f',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <CheckCircle2 size={16} color="#2563eb" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>{data.destinationNetwork.name}</div>
              <div style={{ fontSize: '12px', color: '#2563eb' }}>
                {data.destinationOrg?.name}
                {data.destinationDevices.length > 0 && (
                  <span> &middot; {data.destinationDevices.filter(d => d.model?.startsWith('C93') || d.model?.startsWith('C9K')).length} Cat9K device(s) found</span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
