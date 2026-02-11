import React, { useState } from 'react';
import {
  Home, Building2, ArrowRightLeft, HardDriveDownload, HardDriveUpload,
  GitBranch, Activity, Layers, FileText,
  ShieldCheck, Lock, ClipboardList,
  CalendarClock, Globe2, BarChart3,
  UserCircle, ChevronRight, ChevronLeft, ServerCog,
} from 'lucide-react';

type ToolMode =
  | 'selection' | 'migration' | 'backup' | 'restore'
  | 'version-control' | 'organizations' | 'drift' | 'compliance'
  | 'bulk-ops' | 'dashboard' | 'security' | 'change-management'
  | 'documentation' | 'scheduler' | 'cross-region' | 'profile' | 'cat9k';

interface NavItem {
  id: ToolMode;
  label: string;
  icon: React.ReactNode;
  children?: { id: ToolMode; label: string }[];
}

// Flat nav — matches Cisco Secure Client's simple sidebar pattern
const NAV_ITEMS: NavItem[] = [
  { id: 'selection', label: 'Home', icon: <Home size={17} /> },
  { id: 'organizations', label: 'Organization', icon: <Building2 size={17} /> },
  {
    id: 'migration',
    label: 'Migration',
    icon: <ArrowRightLeft size={17} />,
    children: [
      { id: 'migration', label: 'Full Migration' },
      { id: 'cat9k', label: 'Cat9K → Meraki' },
      { id: 'backup', label: 'Backup Config' },
      { id: 'restore', label: 'Restore Backup' },
    ],
  },
  {
    id: 'version-control',
    label: 'Network Mgmt',
    icon: <GitBranch size={17} />,
    children: [
      { id: 'version-control', label: 'Version Control' },
      { id: 'drift', label: 'Drift Detection' },
      { id: 'bulk-ops', label: 'Bulk Operations' },
      { id: 'documentation', label: 'Documentation' },
    ],
  },
  {
    id: 'compliance',
    label: 'Security',
    icon: <ShieldCheck size={17} />,
    children: [
      { id: 'compliance', label: 'Compliance' },
      { id: 'security', label: 'Security Posture' },
      { id: 'change-management', label: 'Change Mgmt' },
    ],
  },
  {
    id: 'dashboard',
    label: 'Operations',
    icon: <BarChart3 size={17} />,
    children: [
      { id: 'scheduler', label: 'Scheduler' },
      { id: 'cross-region', label: 'Cross-Region Sync' },
      { id: 'dashboard', label: 'Analytics' },
    ],
  },
];

interface SidebarProps {
  activeMode: ToolMode;
  onNavigate: (mode: ToolMode) => void;
  selectedOrgName?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const BASE = {
  item: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
    width: '100%',
    padding: '10px 16px',
    fontSize: '14px',
    cursor: 'pointer' as const,
    background: 'none',
    border: 'none',
    borderLeft: '3px solid transparent',
    textAlign: 'left' as const,
    transition: 'background 100ms',
  },
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeMode,
  onNavigate,
  selectedOrgName,
  collapsed,
  onToggleCollapse,
}) => {
  // Track which top-level group is expanded
  const getDefaultExpanded = (): ToolMode | null => {
    for (const item of NAV_ITEMS) {
      if (item.children?.some(c => c.id === activeMode)) return item.id;
    }
    return null;
  };
  const [expandedGroup, setExpandedGroup] = useState<ToolMode | null>(getDefaultExpanded);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const width = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)';

  const isGroupActive = (item: NavItem): boolean => {
    if (item.id === activeMode) return true;
    return item.children?.some(c => c.id === activeMode) ?? false;
  };

  return (
    <aside
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 180ms ease, min-width 180ms ease, max-width 180ms ease',
        flexShrink: 0,
      }}
    >
      {/* Nav items — scrollable */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: '8px' }}>
        {NAV_ITEMS.map(item => {
          const groupActive = isGroupActive(item);
          const isExpanded = expandedGroup === item.id;
          const hasChildren = item.children && item.children.length > 0;

          const handleItemClick = () => {
            if (hasChildren) {
              setExpandedGroup(isExpanded ? null : item.id);
              // Navigate to the first child
              if (!isExpanded && item.children) {
                onNavigate(item.children[0].id);
              }
            } else {
              onNavigate(item.id);
            }
          };

          return (
            <div key={item.id}>
              {/* Top-level item */}
              <button
                onClick={handleItemClick}
                title={collapsed ? item.label : undefined}
                style={{
                  ...BASE.item,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '11px 0' : '10px 16px',
                  borderLeft: groupActive ? '3px solid var(--sidebar-accent)' : '3px solid transparent',
                  backgroundColor: hoveredId === item.id
                    ? 'var(--sidebar-bg-hover)'
                    : groupActive
                    ? 'var(--sidebar-bg-active)'
                    : 'transparent',
                  color: groupActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                  fontWeight: groupActive ? 600 : 400,
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <span style={{
                  flexShrink: 0,
                  display: 'flex',
                  color: groupActive ? 'var(--sidebar-accent)' : 'var(--sidebar-text-muted)',
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                    {hasChildren && (
                      <ChevronRight
                        size={13}
                        style={{
                          flexShrink: 0,
                          color: 'var(--sidebar-text-muted)',
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 150ms',
                        }}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Sub-items — only when expanded and not collapsed */}
              {!collapsed && isExpanded && item.children?.map(child => {
                const childActive = activeMode === child.id;
                return (
                  <button
                    key={child.id}
                    onClick={() => onNavigate(child.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 16px 8px 44px',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      background: hoveredId === child.id
                        ? 'var(--sidebar-bg-hover)'
                        : childActive
                        ? 'var(--sidebar-bg-active)'
                        : 'transparent',
                      border: 'none',
                      borderLeft: childActive ? '3px solid var(--sidebar-accent)' : '3px solid transparent',
                      color: childActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                      fontWeight: childActive ? 600 : 400,
                      textAlign: 'left',
                      transition: 'background 100ms',
                    }}
                    onMouseEnter={() => setHoveredId(child.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {childActive && (
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--sidebar-accent)',
                          marginRight: '8px',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {child.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom: Profile + org name + collapse */}
      <div style={{ borderTop: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
        {/* Org name strip */}
        {!collapsed && selectedOrgName && (
          <div
            style={{
              padding: '8px 16px',
              fontSize: '12.5px',
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-light)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('organizations')}
            title={selectedOrgName}
          >
            {selectedOrgName}
          </div>
        )}

        {/* Profile */}
        <button
          onClick={() => onNavigate('profile')}
          title={collapsed ? 'Profile' : undefined}
          style={{
            ...BASE.item,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '11px 0' : '10px 16px',
            borderLeft: activeMode === 'profile' ? '3px solid var(--sidebar-accent)' : '3px solid transparent',
            backgroundColor: activeMode === 'profile' ? 'var(--sidebar-bg-active)' : 'transparent',
            color: activeMode === 'profile' ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
            fontWeight: activeMode === 'profile' ? 600 : 400,
          }}
          onMouseEnter={e => { if (activeMode !== 'profile') (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-bg-hover)'; }}
          onMouseLeave={e => { if (activeMode !== 'profile') (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          <span style={{ flexShrink: 0, display: 'flex', color: activeMode === 'profile' ? 'var(--sidebar-accent)' : 'var(--sidebar-text-muted)' }}>
            <UserCircle size={17} />
          </span>
          {!collapsed && (
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>
              Administration
            </span>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--sidebar-text-muted)',
            transition: 'color 100ms',
            borderTop: '1px solid var(--sidebar-border)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-text-active)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-text-muted)'; }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
};
