import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Cat9KData } from '../Cat9KMigrationWizard';

interface ResultsStepProps {
  data: Cat9KData;
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
    { value: results.portsPushed, label: 'Ports configured' },
    { value: results.portsFailed, label: 'Ports skipped' },
    { value: results.policiesCreated, label: 'RADIUS policies' },
    { value: results.aclRulesPushed, label: 'ACL rules pushed' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#e8f5eb', border: '1px solid #bbdfc4',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CheckCircle2 size={18} color="#2563eb" />
        </div>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
            Configuration Applied
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            The IOS-XE configuration has been translated and pushed to {data.destinationNetwork?.name ?? 'the target network'}.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
        marginBottom: '24px',
      }}>
        {stats.map(s => (
          <div
            key={s.label}
            style={{
              border: '1px solid var(--color-border-primary)',
              borderRadius: '6px', padding: '16px 18px',
              backgroundColor: 'var(--color-bg-primary)',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: '26px', fontWeight: 700,
              color: s.label === 'Ports skipped' && s.value > 0 ? '#d97706' : 'var(--color-text-primary)',
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

      {/* Log */}
      <div style={{
        border: '1px solid var(--color-border-primary)',
        borderRadius: '6px', overflow: 'hidden',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '10px 16px',
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
                : line.startsWith('⚠️') ? '#facc15'
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
          Start new migration
        </button>
      </div>
    </div>
  );
}
