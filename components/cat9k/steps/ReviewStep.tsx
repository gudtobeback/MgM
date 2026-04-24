import React from 'react';
import { Cat9KData } from '../Cat9KMigrationWizard';

interface ReviewStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
}

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (val: boolean) => void;
  label: string;
  subtitle?: string;
}

function Toggle({ checked, disabled, onChange, label, subtitle }: ToggleProps) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: '2px', accentColor: '#2563eb', cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '1px' }}>{subtitle}</div>}
      </div>
    </label>
  );
}

function PanelHeader({ title, count }: { title: string; count: number }) {
  return (
    <div style={{
      padding: '10px 16px',
      backgroundColor: 'var(--color-bg-secondary)',
      borderBottom: '1px solid var(--color-border-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)' }}>
        {title}
      </span>
      <span style={{
        fontSize: '11px', fontWeight: 600, padding: '1px 7px',
        backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)',
        borderRadius: '4px', color: 'var(--color-text-tertiary)',
      }}>
        {count}
      </span>
    </div>
  );
}

const TH: React.CSSProperties = {
  padding: '8px 14px', fontSize: '11px', fontWeight: 600,
  color: 'var(--color-text-tertiary)', textAlign: 'left',
  backgroundColor: 'var(--color-bg-secondary)',
  borderBottom: '1px solid var(--color-border-subtle)',
};

const TD: React.CSSProperties = {
  padding: '9px 14px', fontSize: '12px', color: 'var(--color-text-primary)',
  borderBottom: '1px solid var(--color-border-subtle)',
};

const CODE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '11px',
  backgroundColor: 'var(--color-bg-secondary)',
  padding: '1px 5px', borderRadius: '3px',
  color: 'var(--color-text-secondary)',
};

export function ReviewStep({ data, onUpdate }: ReviewStepProps) {
  const parsed = data.parsedConfig;
  if (!parsed) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-secondary)' }}>
      No parsed configuration found. Go back and parse a config first.
    </div>
  );

  const hasRadius = parsed.radiusServers.length > 0;
  const hasAcls = parsed.acls.length > 0;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          Review Parsed Configuration
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Review the items extracted from the running-config and select which categories to apply to the destination Meraki network.
        </p>
      </div>

      {/* Apply toggles */}
      <div style={{
        padding: '14px 16px', marginBottom: '20px',
        border: '1px solid var(--color-border-primary)',
        borderRadius: '6px', backgroundColor: 'var(--color-bg-secondary)',
        display: 'flex', flexWrap: 'wrap' as const, gap: '20px',
      }}>
        <Toggle
          checked={data.applyPorts}
          onChange={val => onUpdate({ applyPorts: val })}
          label="Apply switch port configurations"
          subtitle={`${parsed.interfaces.length} interfaces detected`}
        />
        <Toggle
          checked={data.applyRadius}
          disabled={!hasRadius}
          onChange={val => onUpdate({ applyRadius: val })}
          label="Create RADIUS access policy"
          subtitle={hasRadius ? `${parsed.radiusServers.length} server(s) detected` : 'No RADIUS servers found'}
        />
        <Toggle
          checked={data.applyAcls}
          disabled={!hasAcls}
          onChange={val => onUpdate({ applyAcls: val })}
          label="Apply ACL rules"
          subtitle={hasAcls ? `${parsed.acls.length} ACL(s) detected` : 'No ACLs found'}
        />
      </div>

      {/* VLANs panel */}
      <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
        <PanelHeader title="VLANs" count={parsed.vlans.length} />
        {parsed.vlans.length === 0 ? (
          <div style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>None detected</div>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: '80px' }}>ID</th>
                  <th style={TH}>Name</th>
                </tr>
              </thead>
              <tbody>
                {parsed.vlans.map(v => (
                  <tr key={v.id}>
                    <td style={TD}><span style={CODE}>{v.id}</span></td>
                    <td style={TD}>{v.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interfaces panel */}
      <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
        <PanelHeader title="Switch Interfaces" count={parsed.interfaces.length} />
        {parsed.interfaces.length === 0 ? (
          <div style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>None detected</div>
        ) : (
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: '100px' }}>Port</th>
                  <th style={{ ...TH, width: '80px' }}>Mode</th>
                  <th style={{ ...TH, width: '120px' }}>VLAN(s)</th>
                  <th style={TH}>Description</th>
                </tr>
              </thead>
              <tbody>
                {parsed.interfaces.map(iface => (
                  <tr key={iface.name}>
                    <td style={TD}><span style={CODE}>{iface.shortName}</span></td>
                    <td style={TD}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600,
                        padding: '1px 6px', borderRadius: '3px',
                        backgroundColor: iface.mode === 'access' ? '#f0faf2' : iface.mode === 'trunk' ? '#eff6ff' : 'var(--color-bg-secondary)',
                        color: iface.mode === 'access' ? '#025115' : iface.mode === 'trunk' ? '#1d4ed8' : 'var(--color-text-tertiary)',
                        border: `1px solid ${iface.mode === 'access' ? '#bbdfc4' : iface.mode === 'trunk' ? '#bfdbfe' : 'var(--color-border-subtle)'}`,
                      }}>
                        {iface.mode}
                      </span>
                    </td>
                    <td style={{ ...TD, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {iface.mode === 'access' && iface.accessVlan != null ? iface.accessVlan
                        : iface.mode === 'trunk' && iface.trunkAllowedVlans ? iface.trunkAllowedVlans
                        : '—'}
                    </td>
                    <td style={{ ...TD, color: 'var(--color-text-secondary)' }}>
                      {iface.description || <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RADIUS panel */}
      {hasRadius && (
        <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
          <PanelHeader title="RADIUS Servers" count={parsed.radiusServers.length} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Name</th>
                <th style={TH}>IP Address</th>
                <th style={{ ...TH, width: '100px' }}>Auth Port</th>
                <th style={TH}>Secret</th>
              </tr>
            </thead>
            <tbody>
              {parsed.radiusServers.map(srv => (
                <tr key={srv.name}>
                  <td style={TD}><span style={CODE}>{srv.name}</span></td>
                  <td style={{ ...TD, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{srv.ip}</td>
                  <td style={TD}>{srv.authPort}</td>
                  <td style={{ ...TD, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                    {srv.key ? '••••••••' : <span style={{ color: 'var(--color-text-tertiary)' }}>not set</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ACLs panel */}
      {hasAcls && (
        <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
          <PanelHeader title="Access Control Lists" count={parsed.acls.length} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>ACL Name</th>
                <th style={{ ...TH, width: '100px' }}>Rules</th>
              </tr>
            </thead>
            <tbody>
              {parsed.acls.map(acl => (
                <tr key={acl.name}>
                  <td style={TD}><span style={CODE}>{acl.name}</span></td>
                  <td style={TD}>{acl.rules.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
