import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { restoreNetworkConfiguration, restoreDeviceConfiguration } from '../../../services/merakiService';
import { NetworkConfigBackup } from '../../../types';
import { RestoreData } from '../RestoreWizard';

interface RestoreExecStepProps {
  data: RestoreData;
  onUpdate: (patch: Partial<RestoreData>) => void;
  onComplete: () => void;
}

export function RestoreExecStep({ data, onUpdate, onComplete }: RestoreExecStepProps) {
  const hasRun = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  const scrollLog = () => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      const log: string[] = [];
      let restored = 0;
      let failed = 0;

      const backup = data.parsedBackup!;
      const cats = data.restoreCategories;
      const apiKey = data.destinationApiKey;
      const region = data.destinationRegion;
      const networkId = data.destinationNetwork!.id;
      const networkName = data.destinationNetwork!.name;
      const srcNetCfg = backup.networkConfigs[data.selectedNetworkId] ?? {};

      const addLog = (msg: string) => {
        log.push(msg);
        onUpdate({ results: { log: [...log], restored, failed } });
        scrollLog();
      };

      addLog('Starting restore…');
      addLog(`Target network: ${networkName} (${networkId})`);
      addLog(`Source: ${backup.sourceOrgName}`);
      addLog('');

      // ── Build filtered NetworkConfigBackup ────────────────────────────────────
      const filteredConfig: Partial<NetworkConfigBackup> = {};

      if (cats.vlans && srcNetCfg.applianceVlans) {
        filteredConfig.applianceVlans = srcNetCfg.applianceVlans;
      }
      if (cats.firewallRules && srcNetCfg.applianceL3FirewallRules) {
        filteredConfig.applianceL3FirewallRules = srcNetCfg.applianceL3FirewallRules;
      }
      if (cats.ssids && srcNetCfg.ssids) {
        filteredConfig.ssids = srcNetCfg.ssids;
      }
      if (cats.groupPolicies && srcNetCfg.groupPolicies) {
        filteredConfig.groupPolicies = srcNetCfg.groupPolicies;
      }
      if (cats.vpnSettings && srcNetCfg.siteToSiteVpnSettings) {
        filteredConfig.siteToSiteVpnSettings = srcNetCfg.siteToSiteVpnSettings;
      }

      const hasNetworkWork = Object.keys(filteredConfig).length > 0;

      // ── Network-level restore ─────────────────────────────────────────────────
      if (hasNetworkWork) {
        addLog('── Network Configuration ──');
        const count = await restoreNetworkConfiguration(
          apiKey,
          region,
          networkId,
          filteredConfig as NetworkConfigBackup,
          addLog
        );
        restored += count;
        addLog('');
      }

      // ── Device-level restore (switch ports) ───────────────────────────────────
      if (cats.switchPorts && backup.devices.length > 0) {
        addLog('── Switch Port Configuration ──');
        addLog(`Found ${backup.devices.length} device(s) in backup`);

        for (const device of backup.devices) {
          if (!device.config.switchPorts || device.config.switchPorts.length === 0) continue;
          addLog(`\nDevice: ${device.serial}`);
          const ok = await restoreDeviceConfiguration(
            apiKey,
            region,
            device.serial,
            device.config,
            addLog
          );
          if (ok) restored++;
          else failed++;
        }
        addLog('');
      }

      // ── Summary ───────────────────────────────────────────────────────────────
      addLog('── Complete ──');
      addLog(`Categories / operations restored: ${restored}`);
      if (failed > 0) addLog(`Failures: ${failed}`);

      onUpdate({ results: { log: [...log], restored, failed } });
      scrollLog();

      setTimeout(onComplete, 2000);
    };

    run().catch(err => {
      console.error('RestoreExecStep error:', err);
    });
  }, []);

  const log = data.results?.log ?? [];

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Loader2 size={18} color="#2563eb" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Restoring Configuration
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Pushing selected categories to {data.destinationNetwork?.name ?? 'the target network'}…
          </p>
        </div>
      </div>

      {/* Live log */}
      <div
        ref={logRef}
        style={{
          height: '380px',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          borderRadius: '6px',
          padding: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: 1.6,
          color: '#e2e8f0',
          border: '1px solid var(--color-border-primary)',
        }}
      >
        {log.map((line, i) => (
          <div key={i} style={{
            color: line.startsWith('✅') ? '#4ade80'
              : line.includes('❌') ? '#f87171'
              : line.startsWith('⚠️') || line.includes('⏩') ? '#facc15'
              : line.startsWith('──') ? '#94a3b8'
              : '#e2e8f0',
          }}>
            {line || <br />}
          </div>
        ))}
        {log.length === 0 && (
          <div style={{ color: '#64748b' }}>Initializing…</div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
