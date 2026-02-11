import React from 'react';
import { Check, Minus, ArrowRight } from 'lucide-react';

const TIERS = [
  {
    name: 'Starter',
    price: '$300',
    devices: 'Up to 20 devices',
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$750',
    devices: '21–50 devices',
    cta: 'Get started',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    devices: '50+ devices',
    cta: 'Contact sales',
    highlight: false,
  },
];

// true = included, false = not included, string = value shown as text
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
  if (value === true) return <Check size={15} color="#048a24" />;
  if (value === false) return <Minus size={15} color="#d1d5db" />;
  return <span style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>{value}</span>;
}

export function PricingSection() {
  return (
    <section style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }} id="pricing">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block', padding: '3px 10px',
            border: '1px solid #d1d5db', borderRadius: '4px',
            fontSize: '11px', fontWeight: 600, color: '#6b7280',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px',
          }}>
            Pricing
          </div>
          <h2 style={{
            fontSize: '32px', fontWeight: 700, color: '#111827',
            lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '12px',
          }}>
            Simple, one-time pricing.
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.65, maxWidth: '480px' }}>
            No subscriptions. Pay once per migration project.
            Compare this to 8–12 hours of admin time and the risk of manual errors.
          </p>
        </div>

        {/* Comparison table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          {/* Tier headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 200px 200px 200px',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#f9fafb',
              fontSize: '11px', fontWeight: 600, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'flex', alignItems: 'flex-end',
            }}>
              Feature
            </div>
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                style={{
                  padding: '20px',
                  borderLeft: '1px solid #e5e7eb',
                  backgroundColor: tier.highlight ? '#f0faf2' : '#f9fafb',
                }}
              >
                {tier.highlight && (
                  <div style={{
                    display: 'inline-block', padding: '2px 8px',
                    backgroundColor: '#e8f5eb', border: '1px solid #bbdfc4',
                    borderRadius: '3px', fontSize: '10px', fontWeight: 600,
                    color: '#025115', letterSpacing: '0.04em',
                    textTransform: 'uppercase', marginBottom: '8px',
                  }}>
                    Most popular
                  </div>
                )}
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  {tier.name}
                </div>
                <div style={{
                  fontSize: '24px', fontWeight: 700, color: '#111827',
                  letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '4px',
                }}>
                  {tier.price}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{tier.devices}</div>
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
                borderBottom: i < FEATURES.length - 1 ? '1px solid #f0f1f3' : 'none',
              }}
            >
              <div style={{
                padding: '13px 20px',
                fontSize: '13px', color: '#374151',
              }}>
                {row.label}
              </div>
              {([row.starter, row.pro, row.enterprise] as (boolean | string)[]).map((val, ci) => (
                <div
                  key={ci}
                  style={{
                    padding: '13px 20px',
                    borderLeft: '1px solid #f0f1f3',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: ci === 1 ? '#fafffe' : '#ffffff',
                  }}
                >
                  <Cell value={val} />
                </div>
              ))}
            </div>
          ))}

          {/* CTA row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 200px 200px 200px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}>
            <div style={{ padding: '16px 20px' }} />
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                style={{
                  padding: '16px 20px',
                  borderLeft: '1px solid #e5e7eb',
                  backgroundColor: tier.highlight ? '#f0faf2' : '#f9fafb',
                }}
              >
                <button style={{
                  width: '100%',
                  padding: '8px 14px',
                  backgroundColor: tier.highlight ? '#048a24' : '#ffffff',
                  color: tier.highlight ? '#ffffff' : '#374151',
                  border: tier.highlight ? 'none' : '1px solid #d1d5db',
                  borderRadius: '5px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}>
                  {tier.cta} <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footnote */}
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '20px', lineHeight: 1.6 }}>
          All plans are one-time project fees. Volume discounts available for 100+ device migrations — contact us for custom pricing.
        </p>

      </div>
    </section>
  );
}
