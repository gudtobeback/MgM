import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { getSwitchPorts, updateSwitchPort, createNetworkSwitchAccessPolicy, updateNetworkSwitchAccessControlLists } from '../../../services/merakiService';
import { extractPortNumber } from '../../../services/cat9kParser';
import { Cat9KData, Cat9KResults } from '../Cat9KMigrationWizard';

interface ApplyStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
  onComplete: () => void;
}

// Small delay helper to avoid hammering the API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ApplyStep({ data, onUpdate, onComplete }: ApplyStepProps) {
  const hasRun = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Scroll log to bottom when updated
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
      let portsPushed = 0;
      let portsFailed = 0;
      let policiesCreated = 0;
      let aclRulesPushed = 0;

      const parsed = data.parsedConfig!;
      const apiKey = data.destinationApiKey;
      const region = data.destinationRegion;
      const networkId = data.destinationNetwork!.id;

      const addLog = (msg: string) => {
        log.push(msg);
        onUpdate({ results: { portsPushed, portsFailed, policiesCreated, aclRulesPushed, log: [...log] } });
        scrollLog();
      };

      addLog('Starting Cat9K → Meraki configuration push...');
      addLog(`Target network: ${data.destinationNetwork!.name}`);
      addLog('');

      // ── Switch ports ────────────────────────────────────────────────
      if (data.applyPorts && parsed.interfaces.length > 0) {
        addLog('── Switch Port Configuration ──');

        const msDevices = data.destinationDevices.filter(d => d.model?.startsWith('MS'));
        if (msDevices.length === 0) {
          addLog('⚠️  No Meraki MS switches found in the target network. Skipping port configuration.');
        } else {
          for (const device of msDevices) {
            addLog(`\nDevice: ${device.name ?? device.serial} (${device.model})`);
            let existingPorts: any[] = [];
            try {
              existingPorts = await getSwitchPorts(apiKey, region, device.serial);
            } catch (err) {
              addLog(`  ⚠️  Could not fetch ports for ${device.serial}: ${(err as any).message}`);
              continue;
            }

            for (const iface of parsed.interfaces) {
              if (iface.mode === 'unknown') continue;

              const portNumber = extractPortNumber(iface.name);
              const merakiPort = existingPorts.find(p => String(p.portId) === portNumber);
              if (!merakiPort) {
                addLog(`  ⚠️  Port ${iface.shortName} (${portNumber}) not found on ${device.serial}`);
                portsFailed++;
                continue;
              }

              const portBody: Record<string, any> = {
                name: iface.description || iface.shortName,
                type: iface.mode,
                poeEnabled: true,
              };

              if (iface.mode === 'access') {
                portBody.vlan = iface.accessVlan ?? 1;
              } else if (iface.mode === 'trunk') {
                portBody.allowedVlans = iface.trunkAllowedVlans ?? 'all';
                if (iface.nativeVlan != null) portBody.vlan = iface.nativeVlan;
              }

              try {
                await updateSwitchPort(apiKey, region, device.serial, portNumber, portBody);
                addLog(`  ✅ ${iface.shortName} → ${iface.mode}${iface.mode === 'access' ? ` VLAN ${portBody.vlan}` : ` (${portBody.allowedVlans})`}`);
                portsPushed++;
              } catch (err) {
                addLog(`  ⚠️  ${iface.shortName}: ${(err as any).message ?? 'update failed'}`);
                portsFailed++;
              }
              await delay(120);
            }
          }
        }
        addLog('');
      }

      // ── RADIUS access policy ────────────────────────────────────────
      if (data.applyRadius && parsed.radiusServers.length > 0) {
        addLog('── RADIUS / 802.1X Access Policy ──');
        const radiusServersPayload = parsed.radiusServers.map(srv => ({
          host: srv.ip,
          port: srv.authPort,
          secret: srv.key || 'changeme',
        }));

        const policyBody = {
          name: 'Cat9K-RADIUS-Policy',
          radius: {
            servers: radiusServersPayload,
          },
          dot1x: {
            controlDirection: 'inbound',
          },
          radiusTestingEnabled: false,
          radiusGroupAttribute: '11',
          voiceVlanClients: true,
          accessPolicyType: 'Dot1x',
        };

        try {
          await createNetworkSwitchAccessPolicy(apiKey, region, networkId, policyBody);
          addLog(`✅ Created RADIUS access policy with ${radiusServersPayload.length} server(s)`);
          policiesCreated++;
        } catch (err) {
          addLog(`⚠️  RADIUS policy creation failed: ${(err as any).message ?? 'unknown error'}`);
        }
        addLog('');
      }

      // ── ACL rules ───────────────────────────────────────────────────
      if (data.applyAcls && parsed.acls.length > 0) {
        addLog('── ACL Rules ──');

        const merakiRules: any[] = [];

        for (const acl of parsed.acls) {
          addLog(`Processing ACL: ${acl.name} (${acl.rules.length} rules)`);
          for (const rule of acl.rules) {
            // Map IOS-XE protocol to Meraki protocol
            let protocol: string = 'any';
            if (/^tcp$/i.test(rule.protocol)) protocol = 'tcp';
            else if (/^udp$/i.test(rule.protocol)) protocol = 'udp';
            else if (/^icmp$/i.test(rule.protocol)) protocol = 'icmp';
            else if (/^ip$/i.test(rule.protocol) || rule.protocol === 'any') protocol = 'any';

            const merakiRule: any = {
              policy: rule.action === 'permit' ? 'allow' : 'deny',
              protocol,
              srcCidr: rule.srcCidr,
              dstCidr: rule.dstCidr,
            };

            if (rule.srcPort) merakiRule.srcPort = rule.srcPort;
            if (rule.dstPort) merakiRule.dstPort = rule.dstPort;
            if (rule.comment) merakiRule.comment = rule.comment;

            merakiRules.push(merakiRule);
          }
        }

        // Meraki requires a final default allow-all rule
        merakiRules.push({
          policy: 'allow',
          protocol: 'any',
          srcCidr: 'any',
          dstCidr: 'any',
          comment: 'Default allow all',
        });

        try {
          await updateNetworkSwitchAccessControlLists(apiKey, region, networkId, { rules: merakiRules });
          addLog(`✅ Pushed ${merakiRules.length - 1} ACL rule(s) + default allow-all`);
          aclRulesPushed = merakiRules.length - 1;
        } catch (err) {
          addLog(`⚠️  ACL push failed: ${(err as any).message ?? 'unknown error'}`);
        }
        addLog('');
      }

      addLog('');
      addLog('── Complete ──');
      addLog(`Ports pushed: ${portsPushed}  |  Ports skipped/failed: ${portsFailed}`);
      addLog(`RADIUS policies created: ${policiesCreated}`);
      addLog(`ACL rules pushed: ${aclRulesPushed}`);

      onUpdate({ results: { portsPushed, portsFailed, policiesCreated, aclRulesPushed, log: [...log] } });
      scrollLog();

      setTimeout(onComplete, 2000);
    };

    run().catch(err => {
      console.error('ApplyStep error:', err);
    });
  }, []);

  const log = data.results?.log ?? [];

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Loader2 size={18} color="#2563eb" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
            Applying Configuration
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Pushing switch port configurations, RADIUS policies, and ACL rules to Meraki…
          </p>
        </div>
      </div>

      {/* Live log */}
      <div
        ref={logRef}
        style={{
          height: '360px',
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
              : line.startsWith('⚠️') ? '#facc15'
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
