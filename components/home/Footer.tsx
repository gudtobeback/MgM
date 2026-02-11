import React from 'react';

const productLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How It Works', href: '#how' },
  { label: 'Documentation', href: '#' },
  { label: 'FAQ', href: '#' },
];

const companyLinks = [
  { label: 'About Us', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Support', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
];

const linkStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#9ca3af',
  textDecoration: 'none',
  transition: 'color 120ms',
};

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#111827', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 32px 32px' }}>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '48px', marginBottom: '40px' }}>

          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <svg width="36" height="18" viewBox="0 0 60 30" fill="none">
                <rect x="0" y="12" width="6" height="6" rx="1" fill="#00bceb" />
                <rect x="9" y="6" width="6" height="12" rx="1" fill="#00bceb" />
                <rect x="18" y="0" width="6" height="18" rx="1" fill="#00bceb" />
                <rect x="27" y="6" width="6" height="12" rx="1" fill="#00bceb" />
                <rect x="36" y="12" width="6" height="6" rx="1" fill="#00bceb" />
              </svg>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Meraki Management</span>
            </div>
            <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.7, marginBottom: '20px', maxWidth: '340px' }}>
              The fastest, safest way to migrate and manage Meraki devices across dashboards. Automated, error-free, and incredibly simple.
            </p>
            {/* Region badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['dashboard.meraki.com', 'dashboard.meraki.in', 'More regions soon'].map(label => (
                <span key={label} style={{
                  padding: '3px 10px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '100px',
                  fontSize: '12px',
                  color: '#9ca3af',
                  fontWeight: 500,
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
              Product
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {productLinks.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={linkStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
              Company
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {companyLinks.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={linkStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            © 2025 DealMyTime Services Private Limited. All rights reserved.
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Not affiliated with Cisco Meraki.
          </p>
        </div>

      </div>
    </footer>
  );
}
