import React, { useState, useRef } from 'react';
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Terminal } from 'lucide-react';
import { claimNetworkDevices, getNetworkDevices } from '../../../services/merakiService';
import { Cat9KData } from '../Cat9KMigrationWizard';

interface ClaimStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
  onComplete: () => void;
}

type ClaimState = 'idle' | 'claiming' | 'polling' | 'done' | 'error';

const CLOUD_ID_REGEX = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--color-border-primary)', borderRadius: '5px',
  fontSize: '13px', color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-bg-primary)', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'var(--font-mono)',
  letterSpacing: '0.05em',
};

export function ClaimStep({ data, onUpdate, onComplete }: ClaimStepProps) {
  // Cloud IDs entered by the user (one per stack member)
  const [cloudIds, setCloudIds] = useState<string[]>(
    data.claimedDevices.length > 0
      ? data.claimedDevices.map(d => d.cloudId)
      : ['']
  );
  const [claimState, setClaimState] = useState<ClaimState>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (msg: string) => {
    setLog(prev => {
      const next = [...prev, msg];
      setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      }, 0);
      return next;
    });
  };

  const validIds = cloudIds.filter(id => CLOUD_ID_REGEX.test(id.trim()));
  const canClaim = validIds.length > 0 && claimState === 'idle';

  const handleAddRow = () => setCloudIds(prev => [...prev, '']);
  const handleRemoveRow = (i: number) => setCloudIds(prev => prev.filter((_, idx) => idx !== i));
  const handleChange = (i: number, val: string) => {
    setCloudIds(prev => prev.map((v, idx) => idx === i ? val.toUpperCase() : v));
  };

  const handleClaim = async () => {
    const ids = cloudIds.map(id => id.trim()).filter(id => CLOUD_ID_REGEX.test(id));
    if (ids.length === 0) return;

    setClaimState('claiming');
    setLog([]);
    setErrorMsg('');

    const apiKey = data.destinationApiKey;
    const region = data.destinationRegion;
    const networkId = data.destinationNetwork!.id;
    const orgId = data.destinationOrg!.id;

    addLog(`Claiming ${ids.length} device(s) to network "${data.destinationNetwork!.name}"…`);
    addLog(`Cloud ID(s): ${ids.join(', ')}`);
    addLog('');

    try {
      await claimNetworkDevices(apiKey, region, networkId, ids);
      addLog(`✅ Claim request accepted by Meraki.`);
      addLog('');
    } catch (err: any) {
      const msg = err.message ?? 'Claim failed';
      addLog(`⚠️  Claim failed: ${msg}`);
      setErrorMsg(msg);
      setClaimState('error');
      return;
    }

    // Poll until all claimed devices appear in the network device list
    setClaimState('polling');
    addLog('Waiting for device(s) to register in Meraki Dashboard…');
    addLog('(This can take up to 5–15 minutes after running `service meraki start` on the switch)');
    addLog('');

    let attempts = 0;
    const MAX_POLLS = 60; // 5 min at 5-sec intervals

    const poll = async () => {
      attempts++;
      try {
        const devices: any[] = await getNetworkDevices(apiKey, region, networkId) ?? [];
        const found = ids.filter(id =>
          devices.some(d =>
            d.serial?.toLowerCase() === id.toLowerCase() ||
            d.cloudId?.toLowerCase() === id.toLowerCase()
          )
        );

        addLog(`[Poll ${attempts}/${MAX_POLLS}] ${found.length}/${ids.length} device(s) visible in Dashboard`);

        if (found.length === ids.length) {
          // All devices found
          if (pollRef.current) clearInterval(pollRef.current);

          const claimedDevices = ids.map(cloudId => {
            const dev = devices.find(
              d => d.serial?.toLowerCase() === cloudId.toLowerCase() ||
                   d.cloudId?.toLowerCase() === cloudId.toLowerCase()
            );
            return {
              cloudId,
              serial: dev?.serial ?? cloudId,
              name: dev?.name ?? dev?.serial ?? cloudId,
              model: dev?.model ?? '',
            };
          });

          addLog('');
          addLog(`✅ All ${ids.length} device(s) are now registered in Meraki Dashboard.`);
          ids.forEach(id => {
            const dev = claimedDevices.find(d => d.cloudId === id);
            addLog(`   • ${dev?.name ?? id} (${dev?.model ?? 'Cat9K'}) — ${dev?.serial}`);
          });
          addLog('');
          addLog('Ready to push configuration. Click Next to continue.');

          onUpdate({ claimedDevices });
          setClaimState('done');
        } else if (attempts >= MAX_POLLS) {
          if (pollRef.current) clearInterval(pollRef.current);
          addLog('');
          addLog('⚠️  Timed out waiting for devices. The devices may still be registering.');
          addLog('   You can proceed anyway — make sure `service meraki start` was run on the switch.');
          // Still mark done so the user can proceed
          onUpdate({
            claimedDevices: ids.map(id => ({ cloudId: id, serial: id, name: id, model: '' })),
          });
          setClaimState('done');
        }
      } catch {
        addLog(`[Poll ${attempts}] Could not fetch devices — retrying…`);
      }
    };

    // First poll immediately, then every 5 seconds
    await poll();
    pollRef.current = setInterval(poll, 5000);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          Claim Device(s) to Meraki Dashboard
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Before pushing configuration, the Catalyst 9K switch must be registered with Meraki and
          claimed to the destination network. Complete the steps on your physical switch first,
          then enter the Cloud ID(s) below.
        </p>
      </div>

      {/* Instructions */}
      <div style={{
        backgroundColor: '#0f172a', borderRadius: '6px', padding: '16px 20px',
        marginBottom: '24px', border: '1px solid #1e293b',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Run on your Catalyst 9K switch (IOS-XE CLI)
        </div>
        {[
          { label: 'Step 1 — Validate compatibility', cmd: 'show meraki compatibility' },
          { label: 'Step 2 — Register & get Cloud ID', cmd: 'service meraki register' },
          { label: 'Step 3 — Start Meraki migration', cmd: 'service meraki start' },
        ].map(({ label, cmd }) => (
          <div key={cmd} style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>{label}</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#4ade80',
              backgroundColor: '#1e293b', padding: '6px 10px', borderRadius: '4px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Terminal size={12} color="#4ade80" style={{ flexShrink: 0 }} />
              {cmd}
            </div>
          </div>
        ))}
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }}>
          After <code style={{ color: '#e2e8f0', backgroundColor: '#1e293b', padding: '1px 4px', borderRadius: '3px' }}>service meraki register</code>, the CLI shows each switch's Cloud ID in the format <code style={{ color: '#e2e8f0', backgroundColor: '#1e293b', padding: '1px 4px', borderRadius: '3px' }}>XXZZ-XXZZ-XXZZ</code>. Enter those below.
        </div>
      </div>

      {/* Cloud ID entry */}
      {claimState === 'idle' || claimState === 'error' ? (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Cloud ID(s) — one per switch / stack member
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cloudIds.map((id, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={id}
                  onChange={e => handleChange(i, e.target.value)}
                  placeholder="XXZZ-XXZZ-XXZZ"
                  maxLength={14}
                  style={{
                    ...inputStyle,
                    borderColor: id && !CLOUD_ID_REGEX.test(id) ? '#f87171' : 'var(--color-border-primary)',
                  }}
                />
                {cloudIds.length > 1 && (
                  <button
                    onClick={() => handleRemoveRow(i)}
                    style={{ flexShrink: 0, padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', borderRadius: '4px' }}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleAddRow}
            style={{
              marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 600, color: '#2563eb', background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 0',
            }}
          >
            <Plus size={13} /> Add another switch
          </button>

          {claimState === 'error' && errorMsg && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#dc2626', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {errorMsg}
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <button
              onClick={handleClaim}
              disabled={!canClaim}
              style={{
                padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                border: 'none', cursor: canClaim ? 'pointer' : 'not-allowed',
                backgroundColor: canClaim ? '#2563eb' : 'var(--color-bg-secondary)',
                color: canClaim ? '#ffffff' : 'var(--color-text-tertiary)',
              }}
            >
              Claim & Wait for Device
            </button>
          </div>
        </div>
      ) : null}

      {/* Progress log */}
      {log.length > 0 && (
        <div
          ref={logRef}
          style={{
            height: '220px', overflowY: 'auto',
            backgroundColor: '#0f172a', borderRadius: '6px',
            padding: '14px 16px',
            fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6,
            color: '#e2e8f0', border: '1px solid var(--color-border-primary)',
            marginBottom: '16px',
          }}
        >
          {log.map((line, i) => (
            <div key={i} style={{
              color: line.startsWith('✅') ? '#4ade80'
                : line.startsWith('⚠️') ? '#facc15'
                : line.startsWith('──') || line.startsWith('[Poll') ? '#94a3b8'
                : '#e2e8f0',
            }}>
              {line || <br />}
            </div>
          ))}
          {(claimState === 'claiming' || claimState === 'polling') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', marginTop: '4px' }}>
              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              {claimState === 'claiming' ? 'Sending claim request…' : 'Polling for device…'}
            </div>
          )}
        </div>
      )}

      {/* Done state */}
      {claimState === 'done' && (
        <div style={{
          padding: '14px 16px', backgroundColor: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '16px',
        }}>
          <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
              {data.claimedDevices.length} device(s) claimed successfully
            </div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px' }}>
              Click Next to push the translated IOS-XE configuration to the claimed device(s).
            </div>
          </div>
        </div>
      )}

      {/* Next button (only shown when done) */}
      {claimState === 'done' && (
        <button
          onClick={onComplete}
          style={{
            padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
            backgroundColor: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer',
          }}
        >
          Next — Push Configuration
        </button>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
