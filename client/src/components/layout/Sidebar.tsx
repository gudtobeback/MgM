import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Building2,
  ArrowRightLeft,
  HardDriveDownload,
  HardDriveUpload,
  GitBranch,
  Activity,
  Layers,
  FileText,
  ShieldCheck,
  CalendarClock,
  Globe2,
  BarChart3,
  UserCircle,
  ChevronRight,
  ChevronLeft,
  ServerCog,
  Users,
  Settings2,
  Menu,
  LogOut,
  X,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { ToolMode, TOOL_MODE_ROUTES } from "../../types/routes";

interface NavItem {
  id: ToolMode;
  label: string;
  icon: React.ReactNode;
  children?: { id: ToolMode; label: string }[];
}

/* ---- NAV ITEMS (unchanged) ---- */
const NAV_ITEMS: NavItem[] = [
  { id: "selection", label: "Dashboard", icon: <LayoutGrid size={18} /> },
  {
    id: "organizations",
    label: "Organizations",
    icon: <Building2 size={18} />,
  },
  {
    id: "migration",
    label: "Migration",
    icon: <ArrowRightLeft size={18} />,
    children: [
      { id: "migration", label: "Full Migration" },
      { id: "cat9k", label: "Cat9K → Meraki" },
    ],
  },
  {
    id: "backup",
    label: "Backup & Recovery",
    icon: <HardDriveDownload size={18} />,
    children: [
      { id: "backup", label: "Backup Config" },
      { id: "restore", label: "Restore Backup" },
    ],
  },
  // {
  //   id: "version-control",
  //   label: "Configuration",
  //   icon: <Settings2 size={18} />,
  //   children: [
  //     { id: "version-control", label: "Version Control" },
  //     { id: "drift", label: "Drift Detection" },
  //     { id: "change-management", label: "Change Management" },
  //     { id: "bulk-ops", label: "Bulk Operations" },
  //   ],
  // },
  // {
  //   id: "compliance",
  //   label: "Compliance & Security",
  //   icon: <ShieldCheck size={18} />,
  //   children: [
  //     { id: "compliance", label: "Compliance Audit" },
  //     { id: "security", label: "Security Posture" },
  //   ],
  // },
  // {
  //   id: "dashboard",
  //   label: "Operations",
  //   icon: <BarChart3 size={18} />,
  //   children: [
  //     { id: "dashboard", label: "Analytics" },
  //     { id: "scheduler", label: "Scheduler" },
  //     { id: "cross-region", label: "Cross-Region Sync" },
  //     { id: "documentation", label: "Documentation" },
  //   ],
  // },
];

const PERMISSION_GATE: Record<string, ToolMode[]> = {
  backup: ["backup"],
  restore: ["restore"],
  migration: ["migration"],
  cat9k: ["cat9k"],
  "change-management": ["change-management"],
  compliance: ["compliance"],
  drift: ["drift"],
  scheduler: ["scheduler"],
  analytics: ["dashboard"],
  security: ["security"],
};

interface SidebarProps {
  activeMode: ToolMode;
  onNavigate: (mode: ToolMode) => void;
  selectedOrgName?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: string;
  onLogout: () => void;
  userPermissions?: Record<string, boolean>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMode,
  selectedOrgName,
  collapsed,
  onToggleCollapse,
  userRole,
  userPermissions = {},
  onLogout,
}) => {
  const navigate = useNavigate();
  const isCompanyAdmin = userRole === "company_admin";
  const isSuperAdmin = userRole === "super_admin";

  const isModeAllowed = (mode: ToolMode): boolean => {
    if (isSuperAdmin) return true;
    for (const [feature, modes] of Object.entries(PERMISSION_GATE)) {
      if (modes.includes(mode)) {
        if (feature in userPermissions && userPermissions[feature] === false)
          return false;
      }
    }
    return true;
  };

  const navItems: NavItem[] = NAV_ITEMS;

  const [expandedGroup, setExpandedGroup] = useState<ToolMode | null>(null);

  const isGroupActive = (item: NavItem): boolean => {
    if (item.id === activeMode) return true;
    return item.children?.some((c) => c.id === activeMode) ?? false;
  };

  const handleNavigate = (mode: ToolMode) => {
    navigate(TOOL_MODE_ROUTES[mode]);
  };

  return (
    <aside className={`flex flex-col h-full shrink-0 z-40 bg-white border-r`}>
      {/* NAV */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-3 pb-3">
        <div className="h-18 flex items-center justify-between">
          {!collapsed && (
            <div className="ml-2 font-bold text-[20px] text-[#049FD9]">
              Meraki
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
          >
            {collapsed ? <ArrowRight size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const groupActive = isGroupActive(item);
            const isExpanded = expandedGroup === item.id;
            const hasChildren = item.children && item.children.length > 0;

            const handleItemClick = () => {
              if (hasChildren) {
                setExpandedGroup(isExpanded ? null : item.id);
                // if (!isExpanded && item.children) {
                //   handleNavigate(item.children[0].id);
                // }
              } else {
                handleNavigate(item.id);
              }
            };

            return (
              <div key={item.id}>
                <button
                  onClick={handleItemClick}
                  className={`flex items-center w-full p-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    collapsed ? "justify-center" : "gap-3"
                  } ${
                    groupActive
                      ? "bg-[#049FD9] text-white shadow-md"
                      : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>

                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">
                        {item.label}
                      </span>
                      {hasChildren && (
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-45" : ""
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {!collapsed && isExpanded && item.children && (
                  <div className="mt-1 ml-4 space-y-1 border-l border-gray-200 pl-2">
                    {item.children.map((child) => {
                      const childActive = activeMode === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => handleNavigate(child.id)}
                          className={`flex items-center w-full py-2 px-3 text-[13px] rounded-md transition-all duration-200 text-left ${
                            childActive
                              ? "bg-blue-50 text-[#049FD9] font-medium"
                              : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                          }`}
                        >
                          {childActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#049FD9] mr-2" />
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
        </div>

        <button
          onClick={onLogout}
          className={`flex items-center w-full p-2.5 text-sm font-medium text-gray-600 hover:bg-red-100 hover:text-red-500 rounded-lg transition-all duration-200 ${
            collapsed ? "justify-center" : "gap-3"
          } `}
        >
          <LogOut size={18} />

          {!collapsed && (
            <span className="flex-1 truncate text-left">Logout</span>
          )}
        </button>
      </nav>
    </aside>
  );
};
