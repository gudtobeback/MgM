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

  const IconBtn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-white/40 hover:text-foreground transition-all duration-200"
    >
      {children}
    </button>
  );

  return (
    <header className="flex items-center justify-between h-[var(--topbar-height)] px-4 glass z-50 relative">
      {/* Left: logo + product name + hamburger */}
      <div className="flex items-center gap-3">
        <IconBtn onClick={onToggleSidebar} title="Toggle sidebar">
          <Menu size={19} />
        </IconBtn>

        <div className="flex items-center gap-2.5">
          {/* Logo - kept as requested */}
          <svg width="32" height="16" viewBox="0 0 60 30" fill="none" className="opacity-90">
            <rect x="0" y="12" width="6" height="6" rx="1" fill="#007AFF" />
            <rect x="9" y="6" width="6" height="12" rx="1" fill="#007AFF" />
            <rect x="18" y="0" width="6" height="18" rx="1" fill="#007AFF" />
            <rect x="27" y="6" width="6" height="12" rx="1" fill="#007AFF" />
            <rect x="36" y="12" width="6" height="6" rx="1" fill="#007AFF" />
          </svg>
          <span className="font-semibold text-lg tracking-tight text-foreground">
            Meraki Management
          </span>
        </div>
      </div>

      {/* Right: org pill + help + user + logout */}
      <div className="flex items-center gap-1.5">

        {/* Org pill */}
        {selectedOrgName && (
          <button
            onClick={() => onNavigate('organizations')}
            title="Switch organization"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-white/20 text-sm text-foreground hover:bg-white/70 transition-all duration-200 max-w-[200px]"
          >
            <Building2 size={13} className="text-muted-foreground" />
            <span className="truncate max-w-[140px] font-medium opacity-90">
              {selectedOrgName}
            </span>
          </button>
        )}

        {/* Divider */}
        {selectedOrgName && (
          <div className="w-px h-5 bg-border mx-2 hidden md:block" />
        )}

        {/* Help */}
        <IconBtn onClick={() => { }} title="Help">
          <HelpCircle size={18} />
        </IconBtn>

        {/* User */}
        <button
          onClick={() => onNavigate('profile')}
          title="Profile & Settings"
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-white/40 transition-all duration-200 group"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:shadow transition-all">
            {initial}
          </div>
          {/* Name + tier */}
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium leading-none text-foreground truncate max-w-[150px]">
              {displayName}
            </div>
            {tier && (
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">
                {TIER_LABELS[tier] || tier}
              </div>
            )}
          </div>
          <ChevronDown size={13} className="text-muted-foreground hidden md:block group-hover:text-foreground transition-colors" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-2" />

        {/* Sign out */}
        <IconBtn onClick={onLogout} title="Sign out">
          <LogOut size={17} />
        </IconBtn>
      </div>
    </header>
  );
};
