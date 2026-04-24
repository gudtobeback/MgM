import React from 'react';
import {
  Menu, LogOut, ChevronDown, Building2,
  ArrowRightLeft, HardDriveDownload, HardDriveUpload,
  Activity, GitBranch, Layers, ShieldCheck, Shield,
  BarChart3, FileText, CalendarClock, Globe2, ServerCog,
  Home, Building, Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';

type ToolMode =
  | 'selection' | 'migration' | 'backup' | 'restore'
  | 'version-control' | 'organizations' | 'drift' | 'compliance'
  | 'bulk-ops' | 'dashboard' | 'security' | 'change-management'
  | 'documentation' | 'scheduler' | 'cross-region' | 'profile' | 'cat9k' | 'team';

interface TopBarProps {
  user: any;
  toolMode: ToolMode;
  selectedOrgName?: string;
  onToggleSidebar: () => void;
  onNavigate: (mode: ToolMode) => void;
  onLogout: () => void;
}

// Page context: current section label + icon + accent colour
const PAGE_CONTEXT: Record<string, { label: string; icon: React.ReactNode; accent: string }> = {
  selection:          { label: 'Home',              icon: <Home size={13} />,          accent: 'text-blue-500' },
  migration:          { label: 'Full Migration',    icon: <ArrowRightLeft size={13} />, accent: 'text-blue-500' },
  cat9k:              { label: 'Cat9K → Meraki',   icon: <ServerCog size={13} />,     accent: 'text-violet-500' },
  backup:             { label: 'Backup Config',     icon: <HardDriveDownload size={13} />, accent: 'text-cyan-500' },
  restore:            { label: 'Restore Backup',    icon: <HardDriveUpload size={13} />,  accent: 'text-emerald-500' },
  drift:              { label: 'Drift Detection',   icon: <Activity size={13} />,      accent: 'text-red-500' },
  'version-control':  { label: 'Version Control',  icon: <GitBranch size={13} />,     accent: 'text-amber-500' },
  'change-management':{ label: 'Change Management',icon: <GitBranch size={13} />,     accent: 'text-indigo-500' },
  'bulk-ops':         { label: 'Bulk Operations',  icon: <Layers size={13} />,        accent: 'text-cyan-500' },
  compliance:         { label: 'Compliance Audit', icon: <ShieldCheck size={13} />,   accent: 'text-green-500' },
  security:           { label: 'Security Posture', icon: <Shield size={13} />,        accent: 'text-red-500' },
  dashboard:          { label: 'Analytics',         icon: <BarChart3 size={13} />,     accent: 'text-blue-500' },
  organizations:      { label: 'Organizations',     icon: <Building size={13} />,      accent: 'text-blue-500' },
  scheduler:          { label: 'Scheduler',         icon: <CalendarClock size={13} />, accent: 'text-orange-500' },
  'cross-region':     { label: 'Cross-Region Sync',icon: <Globe2 size={13} />,        accent: 'text-purple-500' },
  documentation:      { label: 'Documentation',     icon: <FileText size={13} />,      accent: 'text-gray-500' },
  profile:            { label: 'Administration',    icon: <Building2 size={13} />,     accent: 'text-blue-500' },
  team:               { label: 'Team Management',  icon: <Users size={13} />,         accent: 'text-indigo-500' },
};

// Tier badge styling
const TIER_STYLES: Record<string, { label: string; from: string; to: string }> = {
  free:         { label: 'Free',       from: '#9ca3af', to: '#6b7280' },
  essentials:   { label: 'Essentials', from: '#38bdf8', to: '#0ea5e9' },
  professional: { label: 'Pro',        from: '#a78bfa', to: '#7c3aed' },
  enterprise:   { label: 'Enterprise', from: '#fbbf24', to: '#f59e0b' },
  msp:          { label: 'MSP',        from: '#3b82f6', to: '#4f46e5' },
};

export const TopBar: React.FC<TopBarProps> = ({
  user,
  toolMode,
  selectedOrgName,
  onToggleSidebar,
  onNavigate,
  onLogout,
}) => {
  const email: string       = user?.email || '';
  const initial             = email[0]?.toUpperCase() || '?';
  const displayName         = email.split('@')[0] || email;
  const tier                = user?.subscriptionTier || 'free';
  const tierStyle           = TIER_STYLES[tier] ?? TIER_STYLES.free;
  const ctx                 = PAGE_CONTEXT[toolMode];
  const showContext         = !!ctx && toolMode !== 'selection';

  return (
    <header
      className="relative flex items-center justify-between h-[var(--topbar-height)] px-4 z-50"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.35)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.2) inset',
      }}
    >
      {/* Rainbow-thin gradient bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #3b82f680 25%, #818cf880 50%, #3b82f680 75%, transparent 100%)' }}
      />

      {/* ── LEFT: hamburger + logo ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          title="Toggle sidebar"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-white/60 hover:text-foreground transition-all duration-200"
        >
          <Menu size={18} />
        </button>

        {/* Logo + wordmark */}
        <div className="flex items-center gap-2.5">
          {/* Logo with soft glow backing */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)', boxShadow: '0 0 0 1px rgba(99,102,241,0.15)' }}>
            <svg width="22" height="14" viewBox="0 0 60 30" fill="none">
              <rect x="0"  y="12" width="6" height="6"  rx="1.5" fill="url(#lg)" />
              <rect x="9"  y="6"  width="6" height="12" rx="1.5" fill="url(#lg)" />
              <rect x="18" y="0"  width="6" height="18" rx="1.5" fill="url(#lg)" />
              <rect x="27" y="6"  width="6" height="12" rx="1.5" fill="url(#lg)" />
              <rect x="36" y="12" width="6" height="6"  rx="1.5" fill="url(#lg)" />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-bold text-[15px] tracking-tight text-foreground hidden sm:block">
            Meraki Management
          </span>
        </div>
      </div>

      {/* ── CENTER: current page context pill ─────────────────── */}
      {showContext && (
        <div
          className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full select-none"
          style={{
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.5)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          }}
        >
          <span className={cn('shrink-0', ctx.accent)}>{ctx.icon}</span>
          <span className="text-sm font-semibold text-foreground tracking-tight">{ctx.label}</span>
        </div>
      )}

      {/* ── RIGHT: org + tier + user + logout ─────────────────── */}
      <div className="flex items-center gap-2">

        {/* Org pill with live pulse */}
        {selectedOrgName && (
          <button
            onClick={() => onNavigate('organizations')}
            title="Switch organization"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-foreground transition-all duration-200 hover:shadow-sm"
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.4)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Pulse indicator */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <Building2 size={13} className="text-muted-foreground shrink-0" />
            <span className="truncate max-w-[160px]">{selectedOrgName}</span>
          </button>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-border/50 hidden md:block mx-1" />

        {/* Tier badge — gradient pill */}
        <span
          className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold text-white tracking-wider shadow-sm"
          style={{ background: `linear-gradient(135deg, ${tierStyle.from}, ${tierStyle.to})` }}
        >
          {tierStyle.label}
        </span>

        {/* User button */}
        <button
          onClick={() => onNavigate('profile')}
          title="Profile & Settings"
          className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-white/50 transition-all duration-200 group"
        >
          {/* Avatar with gradient ring */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{
              background: `linear-gradient(135deg, #3b82f6, #4f46e5)`,
              boxShadow: `0 0 0 2px rgba(255,255,255,0.8), 0 0 0 3.5px rgba(99,102,241,0.4)`,
            }}
          >
            {initial}
          </div>
          {/* Name — desktop only */}
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold leading-none text-foreground truncate max-w-[130px]">
              {displayName}
            </div>
          </div>
          <ChevronDown size={12} className="text-muted-foreground hidden md:block group-hover:text-foreground transition-colors" />
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Sign out */}
        <button
          onClick={onLogout}
          title="Sign out"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
