import React from 'react';
import { Menu, HelpCircle, LogOut, ChevronDown, Building2 } from 'lucide-react';

type ToolMode =
  | 'selection' | 'migration' | 'backup' | 'restore'
  | 'version-control' | 'organizations' | 'drift' | 'compliance'
  | 'bulk-ops' | 'dashboard' | 'security' | 'change-management'
  | 'documentation' | 'scheduler' | 'cross-region' | 'profile';

interface TopBarProps {
  user: any;
  toolMode: ToolMode;
  selectedOrgName?: string;
  onToggleSidebar: () => void;
  onNavigate: (mode: ToolMode) => void;
  onLogout: () => void;
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  essentials: 'Essentials',
  professional: 'Professional',
  enterprise: 'Enterprise',
  msp: 'MSP',
};

export const TopBar: React.FC<TopBarProps> = ({
  user,
  toolMode,
  selectedOrgName,
  onToggleSidebar,
  onNavigate,
  onLogout,
}) => {
  const email: string = user?.email || '';
  const initial = email[0]?.toUpperCase() || '?';
  const displayName = email.split('@')[0] || email;
  const tier = user?.subscriptionTier || 'free';

  const iconBtn = (onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px',
        borderRadius: '6px',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        color: 'var(--topbar-text-muted)',
        transition: 'background 120ms, color 120ms',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--topbar-hover)';
        (e.currentTarget as HTMLElement).style.color = 'var(--topbar-text)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'none';
        (e.currentTarget as HTMLElement).style.color = 'var(--topbar-text-muted)';
      }}
    >
      {children}
    </button>
  );

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--topbar-border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: '0 16px',
        flexShrink: 0,
        gap: '8px',
      }}
    >
      {/* Left: logo + product name + hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {iconBtn(onToggleSidebar, 'Toggle sidebar', <Menu size={19} />)}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Cisco bridge logo — keep Cisco cyan for brand identity */}
          <svg width="40" height="20" viewBox="0 0 60 30" fill="none">
            <rect x="0" y="12" width="6" height="6" rx="1" fill="#00bceb" />
            <rect x="9" y="6" width="6" height="12" rx="1" fill="#00bceb" />
            <rect x="18" y="0" width="6" height="18" rx="1" fill="#00bceb" />
            <rect x="27" y="6" width="6" height="12" rx="1" fill="#00bceb" />
            <rect x="36" y="12" width="6" height="6" rx="1" fill="#00bceb" />
          </svg>
          <span style={{ color: 'var(--topbar-text)', fontWeight: 600, fontSize: '16px', letterSpacing: '-0.01em' }}>
            Meraki Management
          </span>
        </div>
      </div>

      {/* Right: org pill + help + user + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

        {/* Org pill */}
        {selectedOrgName && (
          <button
            onClick={() => onNavigate('organizations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: '6px',
              background: '#f3f4f6',
              border: '1px solid var(--topbar-border)',
              color: '#4b5563',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 120ms',
              maxWidth: '200px',
            }}
            title="Switch organization"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--topbar-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
          >
            <Building2 size={12} color="#6b7280" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
              {selectedOrgName}
            </span>
          </button>
        )}

        {/* Divider */}
        {selectedOrgName && (
          <div style={{ width: '1px', height: '20px', background: 'var(--topbar-border)', margin: '0 4px' }} />
        )}

        {/* Help */}
        {iconBtn(() => {}, 'Help', <HelpCircle size={18} />)}

        {/* User */}
        <button
          onClick={() => onNavigate('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 120ms',
          }}
          title="Profile & Settings"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--topbar-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          {/* Name + tier */}
          <div style={{ textAlign: 'left' }} className="hidden md:block">
            <div style={{ color: 'var(--topbar-text)', fontSize: '14px', fontWeight: 500, lineHeight: 1.2, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            {tier && (
              <div style={{ color: 'var(--topbar-text-muted)', fontSize: '12px', lineHeight: 1.2 }}>
                {TIER_LABELS[tier] || tier}
              </div>
            )}
          </div>
          <ChevronDown size={13} color="#9ca3af" className="hidden md:block" />
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: 'var(--topbar-border)', margin: '0 4px' }} />

        {/* Sign out */}
        {iconBtn(onLogout, 'Sign out', <LogOut size={17} />)}
      </div>
    </header>
  );
};
