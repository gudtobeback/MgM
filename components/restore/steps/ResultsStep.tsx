import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { RestoreData } from '../RestoreWizard';

interface ResultsStepProps {
  data: RestoreData;
  onReset: () => void;
}

export function ResultsStep({ data, onReset }: ResultsStepProps) {
  const results = data.results;

  if (!results) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-secondary)' }}>
        No results available.
      </div>
    );
  }

  const stats = [
    { value: results.restored, label: 'Categories restored', warn: false },
    { value: results.failed,   label: 'Failures',            warn: results.failed > 0 },
    {
      value: data.parsedBackup?.devices.reduce((sum, d) => sum + (d.config.switchPorts?.length ?? 0), 0) ?? 0,
      label: 'Switch ports in backup',
      warn: false,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#e8f5eb', border: '1px solid #bbdfc4',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CheckCircle2 size={18} color="#2563eb" />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Restore Complete
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Configuration has been pushed to {data.destinationNetwork?.name ?? 'the target network'}.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
        marginBottom: '28px',
      }}>
        {stats.map(s => (
          <div
            key={s.label}
            style={{
              border: '1px solid var(--color-border-primary)',
              borderRadius: '8px', padding: '20px 22px',
              backgroundColor: 'var(--color-bg-primary)',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: '26px', fontWeight: 700,
              color: s.warn ? '#d97706' : 'var(--color-text-primary)',
              letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '4px',
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Operation log */}
      <div style={{
        border: '1px solid var(--color-border-primary)',
        borderRadius: '6px', overflow: 'hidden',
        marginBottom: '28px',
      }}>
        <div style={{
          padding: '12px 18px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border-primary)',
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
          textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)',
        }}>
          Operation Log
        </div>
        <div style={{
          maxHeight: '280px', overflowY: 'auto',
          backgroundColor: '#0f172a',
          padding: '14px 16px',
          fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6,
        }}>
          {results.log.map((line, i) => (
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
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onReset}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: '5px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
          Start New Restore
        </button>
      </div>
    </div>
  );
}
