import React, { useState } from 'react';
import {
  Home, Building2, ArrowRightLeft, HardDriveDownload, HardDriveUpload,
  GitBranch, Activity, Layers, FileText,
  ShieldCheck, ClipboardList,
  CalendarClock, Globe2, BarChart3,
  UserCircle, ChevronRight, ChevronLeft, ServerCog, Users, Settings2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

type ToolMode =
  | 'selection' | 'migration' | 'backup' | 'restore'
  | 'version-control' | 'organizations' | 'drift' | 'compliance'
  | 'bulk-ops' | 'dashboard' | 'security' | 'change-management'
  | 'documentation' | 'scheduler' | 'cross-region' | 'profile' | 'cat9k' | 'team';

interface NavItem {
  id: ToolMode;
  label: string;
  icon: React.ReactNode;
  children?: { id: ToolMode; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'selection', label: 'Home', icon: <Home size={18} /> },
  { id: 'organizations', label: 'Organizations', icon: <Building2 size={18} /> },
  {
    id: 'migration',
    label: 'Migration',
    icon: <ArrowRightLeft size={18} />,
    children: [
      { id: 'migration', label: 'Full Migration' },
      { id: 'cat9k', label: 'Cat9K → Meraki' },
    ],
  },
  {
    id: 'backup',
    label: 'Backup & Recovery',
    icon: <HardDriveDownload size={18} />,
    children: [
      { id: 'backup', label: 'Backup Config' },
      { id: 'restore', label: 'Restore Backup' },
    ],
  },
  {
    id: 'version-control',
    label: 'Configuration',
    icon: <Settings2 size={18} />,
    children: [
      { id: 'version-control', label: 'Version Control' },
      { id: 'drift', label: 'Drift Detection' },
      { id: 'change-management', label: 'Change Management' },
      { id: 'bulk-ops', label: 'Bulk Operations' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance & Security',
    icon: <ShieldCheck size={18} />,
    children: [
      { id: 'compliance', label: 'Compliance Audit' },
      { id: 'security', label: 'Security Posture' },
    ],
  },
  {
    id: 'dashboard',
    label: 'Operations',
    icon: <BarChart3 size={18} />,
    children: [
      { id: 'dashboard', label: 'Analytics' },
      { id: 'scheduler', label: 'Scheduler' },
      { id: 'cross-region', label: 'Cross-Region Sync' },
      { id: 'documentation', label: 'Documentation' },
    ],
  },
];

interface SidebarProps {
  activeMode: ToolMode;
  onNavigate: (mode: ToolMode) => void;
  selectedOrgName?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMode,
  onNavigate,
  selectedOrgName,
  collapsed,
  onToggleCollapse,
  userRole,
}) => {
  const isCompanyAdmin = userRole === 'company_admin';

  // Build nav items dynamically based on role
  const navItems: NavItem[] = [
    ...NAV_ITEMS,
    ...(isCompanyAdmin ? [{
      id: 'team' as ToolMode,
      label: 'Team',
      icon: <Users size={18} />,
      children: [{ id: 'team' as ToolMode, label: 'Team Management' }],
    }] : []),
  ];
  // Track which top-level group is expanded
  const getDefaultExpanded = (): ToolMode | null => {
    for (const item of navItems) {
      if (item.children?.some(c => c.id === activeMode)) return item.id;
    }
    return null;
  };
  const [expandedGroup, setExpandedGroup] = useState<ToolMode | null>(getDefaultExpanded);

  const isGroupActive = (item: NavItem): boolean => {
    if (item.id === activeMode) return true;
    return item.children?.some(c => c.id === activeMode) ?? false;
  };

  return (
    <aside
      className={cn(
        "glass flex flex-col h-full border-r border-white/20 transition-all duration-300 ease-in-out shrink-0 z-40 relative",
        collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Nav items — scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden pt-4 px-3 space-y-1 no-scrollbar">
        {navItems.map(item => {
          const groupActive = isGroupActive(item);
          const isExpanded = expandedGroup === item.id;
          const hasChildren = item.children && item.children.length > 0;

          const handleItemClick = () => {
            if (hasChildren) {
              setExpandedGroup(isExpanded ? null : item.id);
              // Navigate to the first child if opening
              if (!isExpanded && item.children) {
                onNavigate(item.children[0].id);
              }
            } else {
              onNavigate(item.id);
            }
          };

          return (
            <div key={item.id} className="w-full">
              {/* Top-level item */}
              <button
                onClick={handleItemClick}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center w-full p-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  collapsed ? "justify-center" : "justify-start gap-3",
                  groupActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                )}
              >
                <span className={cn(
                  "shrink-0 flex items-center justify-center transition-colors",
                  groupActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left">
                      {item.label}
                    </span>
                    {hasChildren && (
                      <ChevronRight
                        size={14}
                        className={cn(
                          "shrink-0 transition-transform duration-200",
                          groupActive ? "text-white/70" : "text-muted-foreground",
                          isExpanded ? "rotate-90" : ""
                        )}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Sub-items — only when expanded and not collapsed */}
              {!collapsed && isExpanded && item.children && (
                <div className="mt-1 ml-4 space-y-0.5 border-l border-border pl-2 animate-fade-slide-up">
                  {item.children.map(child => {
                    const childActive = activeMode === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => onNavigate(child.id)}
                        className={cn(
                          "flex items-center w-full py-2 px-3 text-[13px] rounded-md transition-all duration-200 text-left",
                          childActive
                            ? "bg-white/60 text-primary font-medium shadow-sm"
                            : "text-muted-foreground hover:bg-white/40 hover:text-foreground"
                        )}
                      >
                        {childActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 shrink-0" />
                        )}
                        <span className="truncate">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: Sidebar Footer */}
      <div className="border-t border-white/20 p-3 space-y-2 bg-white/10 backdrop-blur-sm">
        {/* Org name strip */}
        {!collapsed && selectedOrgName && (
          <div
            onClick={() => onNavigate('organizations')}
            title={selectedOrgName}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50/50 border border-blue-100/50 text-xs font-medium text-primary cursor-pointer hover:bg-blue-50 transition-colors truncate"
          >
            <Building2 size={14} className="shrink-0" />
            <span className="truncate">{selectedOrgName}</span>
          </div>
        )}

        {/* Profile */}
        <button
          onClick={() => onNavigate('profile')}
          title={collapsed ? 'Profile' : undefined}
          className={cn(
            "flex items-center w-full p-2.5 rounded-lg transition-all duration-200 group",
            collapsed ? "justify-center" : "justify-start gap-3",
            activeMode === 'profile'
              ? "bg-white/60 text-primary font-medium shadow-sm"
              : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
          )}
        >
          <span className={cn(
            "shrink-0",
            activeMode === 'profile' ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}>
            <UserCircle size={20} />
          </span>
          {!collapsed && (
            <span className="truncate text-sm">Administration</span>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand' : 'Collapse'}
          className="flex items-center justify-center w-full py-2 text-muted-foreground hover:text-foreground hover:bg-white/40 rounded-md transition-all"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};
