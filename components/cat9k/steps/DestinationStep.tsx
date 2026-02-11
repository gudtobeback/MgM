import React, { useState } from 'react';
import { Globe, Key, ChevronDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { MERAKI_REGIONS } from '../../steps/migration/SourceConnectionStep';
import { getOrganizations, getOrgNetworks, getNetworkDevices } from '../../../services/merakiService';
import { MerakiOrganization, MerakiNetwork } from '../../../types';
import { Cat9KData } from '../Cat9KMigrationWizard';

interface DestinationStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
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

export function DestinationStep({ data, onUpdate }: DestinationStepProps) {
  const [orgs, setOrgs] = useState<MerakiOrganization[]>([]);
  const [networks, setNetworks] = useState<MerakiNetwork[]>([]);
  const [orgState, setOrgState] = useState<FetchState>('idle');
  const [networkState, setNetworkState] = useState<FetchState>('idle');
  const [error, setError] = useState('');

  const selectedRegion = MERAKI_REGIONS.find(r => r.code === data.destinationRegion) ?? MERAKI_REGIONS[0];

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
      // Non-fatal — devices will just be empty
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          Select Destination Meraki Network
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Connect to the Meraki dashboard where you want to push the translated configuration.
          The target network should contain Meraki MS switches.
        </p>
      </div>

      <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

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
                backgroundColor: data.destinationApiKey.trim() ? '#048a24' : 'var(--color-bg-secondary)',
                color: data.destinationApiKey.trim() ? '#ffffff' : 'var(--color-text-tertiary)',
                border: `1px solid ${data.destinationApiKey.trim() ? '#048a24' : 'var(--color-border-primary)'}`,
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

        {/* Selected summary */}
        {data.destinationNetwork && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#f0faf2', border: '1px solid #bbdfc4', borderRadius: '6px',
            fontSize: '13px', color: '#025115',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{data.destinationNetwork.name}</div>
            <div style={{ fontSize: '12px', color: '#048a24' }}>
              {data.destinationOrg?.name}
              {data.destinationDevices.length > 0 && (
                <span> &middot; {data.destinationDevices.filter(d => d.model?.startsWith('MS')).length} MS switch(es) found</span>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
