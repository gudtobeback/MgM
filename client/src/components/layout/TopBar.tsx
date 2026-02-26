import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  ChevronDown,
  Building2,
  ArrowRightLeft,
  HardDriveDownload,
  HardDriveUpload,
  Activity,
  GitBranch,
  Layers,
  ShieldCheck,
  Shield,
  BarChart3,
  FileText,
  CalendarClock,
  Globe2,
  ServerCog,
  Home,
  Building,
  Users,
} from "lucide-react";
import { ToolMode, TOOL_MODE_ROUTES } from "../../types/routes";

interface TopBarProps {
  user: any;
  toolMode: ToolMode;
  selectedOrgName?: string;
  onToggleSidebar: () => void;
  onNavigate?: (mode: ToolMode) => void;
  onLogout: () => void;
}

const PAGE_CONTEXT: Record<
  string,
  { label: string; icon: React.ReactNode; accent: string }
> = {
  selection: {
    label: "Home",
    icon: <Home size={13} />,
    accent: "text-blue-500",
  },
  migration: {
    label: "Full Migration",
    icon: <ArrowRightLeft size={13} />,
    accent: "text-blue-500",
  },
  cat9k: {
    label: "Cat9K → Meraki",
    icon: <ServerCog size={13} />,
    accent: "text-violet-500",
  },
  backup: {
    label: "Backup Config",
    icon: <HardDriveDownload size={13} />,
    accent: "text-cyan-500",
  },
  restore: {
    label: "Restore Backup",
    icon: <HardDriveUpload size={13} />,
    accent: "text-emerald-500",
  },
  drift: {
    label: "Drift Detection",
    icon: <Activity size={13} />,
    accent: "text-red-500",
  },
  "version-control": {
    label: "Version Control",
    icon: <GitBranch size={13} />,
    accent: "text-amber-500",
  },
  "change-management": {
    label: "Change Management",
    icon: <GitBranch size={13} />,
    accent: "text-indigo-500",
  },
  "bulk-ops": {
    label: "Bulk Operations",
    icon: <Layers size={13} />,
    accent: "text-cyan-500",
  },
  compliance: {
    label: "Compliance Audit",
    icon: <ShieldCheck size={13} />,
    accent: "text-green-500",
  },
  security: {
    label: "Security Posture",
    icon: <Shield size={13} />,
    accent: "text-red-500",
  },
  dashboard: {
    label: "Analytics",
    icon: <BarChart3 size={13} />,
    accent: "text-blue-500",
  },
  organizations: {
    label: "Organizations",
    icon: <Building size={13} />,
    accent: "text-blue-500",
  },
  scheduler: {
    label: "Scheduler",
    icon: <CalendarClock size={13} />,
    accent: "text-orange-500",
  },
  "cross-region": {
    label: "Cross-Region Sync",
    icon: <Globe2 size={13} />,
    accent: "text-purple-500",
  },
  documentation: {
    label: "Documentation",
    icon: <FileText size={13} />,
    accent: "text-gray-500",
  },
  profile: {
    label: "Administration",
    icon: <Building2 size={13} />,
    accent: "text-blue-500",
  },
  team: {
    label: "Team Management",
    icon: <Users size={13} />,
    accent: "text-indigo-500",
  },
};

const TIER_STYLES: Record<string, { label: string; from: string; to: string }> =
  {
    free: { label: "Free", from: "#9ca3af", to: "#6b7280" },
    essentials: { label: "Essentials", from: "#38bdf8", to: "#0ea5e9" },
    professional: { label: "Pro", from: "#a78bfa", to: "#7c3aed" },
    enterprise: { label: "Enterprise", from: "#fbbf24", to: "#f59e0b" },
    msp: { label: "MSP", from: "#3b82f6", to: "#4f46e5" },
  };

export const TopBar: React.FC<TopBarProps> = ({
  user,
  toolMode,
  selectedOrgName,
  onLogout,
}) => {
  const navigate = useNavigate();

  const email: string = user?.email || "";
  const initial = email[0]?.toUpperCase() || "?";
  const displayName = email.split("@")[0] || email;
  const tier = user?.subscriptionTier || "free";
  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.free;
  const ctx = PAGE_CONTEXT[toolMode];
  const showContext = !!ctx && toolMode !== "selection";

  return (
    <header className="relative flex items-center justify-between px-4 h-18 z-50 bg-white">
      {/* LEFT */}
      <div className="hidden sm:flex flex-col">
        <p className="font-bold text-[20px] text-gray-800">
          Meraki Management Platform
        </p>

        <p className="text-[10px]">via Cisco Integration</p>
      </div>

      {/* CENTER */}
      {/* {showContext && (
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-white/50 backdrop-blur-md shadow-sm">
          <span className={`shrink-0 ${ctx.accent}`}>{ctx.icon}</span>
          <span className="text-sm font-semibold text-gray-700 tracking-tight">
            {ctx.label}
          </span>
        </div>
      )} */}

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {selectedOrgName && (
          <button
            onClick={() => navigate(TOOL_MODE_ROUTES.organizations)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 font-medium text-[12px] border rounded-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>

            <span className="truncate max-w-[160px]">{selectedOrgName}</span>
          </button>
        )}

        <div className="w-px h-5 bg-gray-200 hidden md:block" />

        <span
          className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold text-white tracking-wider shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${tierStyle.from}, ${tierStyle.to})`,
          }}
        >
          {tierStyle.label}
        </span>

        <button
          onClick={() => navigate(TOOL_MODE_ROUTES.profile)}
          className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full hover:bg-white/70 transition-all duration-200 group"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold bg-[#049FD9] shadow-md">
            {initial}
          </div>

          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold leading-none text-gray-800 truncate max-w-[130px]">
              {displayName}
            </div>
          </div>

          <ChevronDown
            size={13}
            className="text-gray-400 hidden md:block group-hover:text-gray-700 transition-colors"
          />
        </button>
      </div>
    </header>
  );
};
