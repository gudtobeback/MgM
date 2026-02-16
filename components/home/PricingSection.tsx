import React from 'react';
import { Check, Minus, ArrowRight } from 'lucide-react';

const SHADOW_LG  = '0 12px 36px rgba(0,0,0,0.11), 0 4px 10px rgba(0,0,0,0.06)';
const SHADOW_XL  = '0 20px 60px rgba(0,0,0,0.14), 0 6px 16px rgba(0,0,0,0.07)';
const GLASS      = { background: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(1.04)', border: '1px solid rgba(255,255,255,0.85)' } as const;

const TIERS = [
  {
    name: 'Starter',
    price: '$300',
    devices: 'Up to 20 devices',
    cta: 'Get started',
    highlight: false,
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    name: 'Professional',
    price: '$750',
    devices: '21–50 devices',
    cta: 'Get started',
    highlight: true,
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    devices: '50+ devices',
    cta: 'Contact sales',
    highlight: false,
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
];

const FEATURES: { label: string; starter: boolean | string; pro: boolean | string; enterprise: boolean | string }[] = [
  { label: 'Fully automated migration',        starter: true,       pro: true,       enterprise: true },
  { label: 'Pre-migration org backup (ZIP)',   starter: true,       pro: true,       enterprise: true },
  { label: 'Configuration restore',            starter: true,       pro: true,       enterprise: true },
  { label: 'Cross-region support',             starter: true,       pro: true,       enterprise: true },
  { label: 'Stage-by-stage rollback',          starter: true,       pro: true,       enterprise: true },
  { label: 'Migration verification report',    starter: false,      pro: true,       enterprise: true },
  { label: 'Pre-migration validation',         starter: false,      pro: true,       enterprise: true },
  { label: 'Priority support',                 starter: 'Email',    pro: 'Priority', enterprise: '24/7' },
  { label: 'Post-migration support period',    starter: '30 days',  pro: '90 days',  enterprise: 'Ongoing' },
  { label: 'Dedicated migration engineer',     starter: false,      pro: false,      enterprise: true },
  { label: 'Custom migration schedule',        starter: false,      pro: false,      enterprise: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={15} color="#2563eb" />;
  if (value === false) return <Minus size={15} color="#d1d5db" />;
  return <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{value}</span>;
}

export function PricingSection() {
  return (
    <section style={{ backgroundColor: 'rgb(226, 238, 251)' }} id="pricing">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            backgroundColor: '#fef3c7', border: '1px solid #fde68a',
            borderRadius: '100px',
            fontSize: '11px', fontWeight: 600, color: '#92400e',
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97706', flexShrink: 0 }} />
            Pricing
          </div>
          <h2 style={{
            fontSize: '34px', fontWeight: 800, color: '#0f172a',
            lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: '12px',
          }}>
            Simple, one-time pricing.
          </h2>
          <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.7, maxWidth: '500px' }}>
            No subscriptions. Pay once per migration project.
            Compare this to 8–12 hours of admin time and the risk of manual errors.
          </p>
        </div>

        {/* Tier cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              style={{
                ...GLASS,
                borderRadius: '20px',
                boxShadow: tier.highlight ? SHADOW_XL : SHADOW_LG,
                border: tier.highlight ? `2px solid ${tier.color}` : '1px solid rgba(255,255,255,0.50)',
                padding: '28px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {tier.highlight && (
                <div style={{
                  position: 'absolute', top: '16px', right: '16px',
                  padding: '3px 10px',
                  backgroundColor: tier.bg, border: `1px solid ${tier.color}30`,
                  borderRadius: '100px', fontSize: '10px', fontWeight: 700,
                  color: tier.color, letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  Most popular
                </div>
              )}

              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                backgroundColor: tier.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: tier.color }}>
                  {tier.name[0]}
                </span>
              </div>

              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                {tier.name}
              </div>
              <div style={{
                fontSize: '30px', fontWeight: 800, color: tier.color,
                letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '4px',
              }}>
                {tier.price}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>{tier.devices}</div>

              <button style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: tier.highlight ? tier.color : '#ffffff',
                color: tier.highlight ? '#ffffff' : '#374151',
                border: tier.highlight ? 'none' : '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                boxShadow: tier.highlight ? `0 4px 14px ${tier.color}40` : SHADOW_LG,
              }}>
                {tier.cta} <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div style={{
          ...GLASS,
          borderRadius: '20px',
          boxShadow: SHADOW_XL,
          overflow: 'hidden',
        }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 200px 200px 200px',
            borderBottom: '1px solid #f0f1f3',
            backgroundColor: '#f8fafc',
          }}>
            <div style={{
              padding: '14px 24px',
              fontSize: '11px', fontWeight: 700, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center',
            }}>
              Feature
            </div>
            {TIERS.map((tier) => (
              <div key={tier.name} style={{
                padding: '14px 20px',
                borderLeft: '1px solid #f0f1f3',
                fontSize: '12px', fontWeight: 700, color: tier.color,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center',
              }}>
                {tier.name}
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {FEATURES.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 200px 200px 200px',
                borderBottom: i < FEATURES.length - 1 ? '1px solid #f8f9fb' : 'none',
              }}
            >
              <div style={{ padding: '13px 24px', fontSize: '13px', color: '#374151' }}>
                {row.label}
              </div>
              {([row.starter, row.pro, row.enterprise] as (boolean | string)[]).map((val, ci) => (
                <div key={ci} style={{
                  padding: '13px 20px',
                  borderLeft: '1px solid #f8f9fb',
                  display: 'flex', alignItems: 'center',
                  backgroundColor: ci === 1 ? '#f9fffe' : '#ffffff',
                }}>
                  <Cell value={val} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '20px', lineHeight: 1.6 }}>
          All plans are one-time project fees. Volume discounts available for 100+ device migrations — contact us for custom pricing.
        </p>

      </div>
    </section>
  );
}
