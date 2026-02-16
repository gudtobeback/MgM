import React from 'react';
import { ChevronDown } from 'lucide-react';
import { RestoreData, RestoreCategories } from '../RestoreWizard';

interface SelectStepProps {
  data: RestoreData;
  onUpdate: (patch: Partial<RestoreData>) => void;
}

const CATEGORIES: { key: keyof RestoreCategories; label: string; description: string }[] = [
  { key: 'vlans',         label: 'VLANs',                description: 'Appliance VLAN definitions' },
  { key: 'firewallRules', label: 'L3 Firewall Rules',    description: 'Appliance layer-3 firewall rules' },
  { key: 'ssids',         label: 'SSIDs',                description: 'Wireless SSID configurations' },
  { key: 'switchPorts',   label: 'Switch Ports',         description: 'Per-device switch port settings' },
  { key: 'groupPolicies', label: 'Group Policies',       description: 'Network group policies' },
  { key: 'vpnSettings',   label: 'Site-to-Site VPN',     description: 'VPN hub/spoke settings' },
];

function getCounts(data: RestoreData) {
  const backup = data.parsedBackup;
  if (!backup) return {};

  const netCfg = backup.networkConfigs[data.selectedNetworkId] ?? {};

  const switchPortsCount = backup.devices.reduce(
    (sum, d) => sum + (d.config.switchPorts?.length ?? 0),
    0
  );

  return {
    vlans:         netCfg.applianceVlans?.length ?? 0,
    firewallRules: (netCfg.applianceL3FirewallRules as any)?.rules?.length ?? 0,
    ssids:         (netCfg.ssids ?? []).filter((s: any) => s.enabled).length,
    switchPorts:   switchPortsCount,
    groupPolicies: netCfg.groupPolicies?.length ?? 0,
    vpnSettings:   netCfg.siteToSiteVpnSettings ? 1 : 0,
  };
}

export function SelectStep({ data, onUpdate }: SelectStepProps) {
  const backup = data.parsedBackup!;
  const networkIds = Object.keys(backup.networkConfigs);
  const counts = getCounts(data);

  const setCategory = (key: keyof RestoreCategories, value: boolean) => {
    onUpdate({ restoreCategories: { ...data.restoreCategories, [key]: value } });
  };

  const selectAll = () => {
    const next: RestoreCategories = { ...data.restoreCategories };
    CATEGORIES.forEach(c => {
      if ((counts[c.key] ?? 0) > 0) next[c.key] = true;
    });
    onUpdate({ restoreCategories: next });
  };

  const clearAll = () => {
    const next: RestoreCategories = {
      vlans: false, firewallRules: false, ssids: false,
      switchPorts: false, groupPolicies: false, vpnSettings: false,
    };
    onUpdate({ restoreCategories: next });
  };

  const hasAnySelected = CATEGORIES.some(c => data.restoreCategories[c.key]);

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        Select What to Restore
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '28px' }}>
        Choose the network from the backup and which configuration categories to restore.
      </p>

      {/* Network selector (shown only when >1 network) */}
      {networkIds.length > 1 && (
        <div style={{ marginBottom: '22px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 700,
            color: 'var(--color-text-secondary)', marginBottom: '6px',
            letterSpacing: '0.05em', textTransform: 'uppercase' as const,
          }}>
            Source Network
          </label>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <select
              value={data.selectedNetworkId}
              onChange={e => onUpdate({ selectedNetworkId: e.target.value })}
              style={{
                width: '100%', padding: '9px 32px 9px 12px',
                border: '1px solid var(--color-border-primary)', borderRadius: '5px',
                fontSize: '13px', color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-bg-primary)',
                appearance: 'none', cursor: 'pointer',
              }}
            >
              {networkIds.map(id => (
                <option key={id} value={id}>
                  Network: {id}
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{
              position: 'absolute', right: '10px', top: '50%',
              transform: 'translateY(-50%)', pointerEvents: 'none',
              color: 'var(--color-text-tertiary)',
            }} />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
        <button
          onClick={selectAll}
          style={{
            fontSize: '12px', color: '#2563eb', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600,
          }}
        >
          Select all
        </button>
        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>·</span>
        <button
          onClick={clearAll}
          disabled={!hasAnySelected}
          style={{
            fontSize: '12px',
            color: hasAnySelected ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
            background: 'none', border: 'none',
            cursor: hasAnySelected ? 'pointer' : 'default',
            padding: 0, fontWeight: 600,
          }}
        >
          Clear all
        </button>
      </div>

      {/* Category checkboxes */}
      <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '6px', overflow: 'hidden' }}>
        {CATEGORIES.map((cat, i) => {
          const count = counts[cat.key] ?? 0;
          const disabled = count === 0;
          const checked = data.restoreCategories[cat.key] && !disabled;

          return (
            <label
              key={cat.key}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px 20px',
                borderBottom: i < CATEGORIES.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                backgroundColor: disabled ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.55 : 1,
                transition: 'background 100ms',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={e => setCategory(cat.key, e.target.checked)}
                style={{ width: '15px', height: '15px', cursor: disabled ? 'not-allowed' : 'pointer', accentColor: '#2563eb' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '3px' }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                  {cat.description}
                </div>
              </div>
              <div style={{
                flexShrink: 0,
                fontSize: '12px', fontWeight: 700,
                padding: '2px 8px', borderRadius: '12px',
                backgroundColor: disabled ? 'var(--color-border-subtle)' : '#e8f5eb',
                color: disabled ? 'var(--color-text-tertiary)' : '#2563eb',
                border: `1px solid ${disabled ? 'var(--color-border-primary)' : '#bbdfc4'}`,
              }}>
                {cat.key === 'vpnSettings'
                  ? (count > 0 ? 'Configured' : 'Not found')
                  : count}
              </div>
            </label>
          );
        })}
      </div>

      {/* Info note for switch ports */}
      {(counts.switchPorts ?? 0) > 0 && (
        <div style={{
          marginTop: '14px', padding: '10px 14px',
          backgroundColor: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: '5px', fontSize: '12px', color: '#92400e',
        }}>
          <strong>Note:</strong> Switch ports will be restored to devices with matching serial numbers. Ensure the destination network contains the same devices.
        </div>
      )}
    </div>
  );
}
