import React, { useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import {
  X,
  Home,
  Menu,
  Users,
  Globe2,
  Layers,
  LogOut,
  Activity,
  FileText,
  BarChart3,
  Building2,
  GitBranch,
  Settings2,
  ServerCog,
  LayoutGrid,
  ArrowRight,
  UserCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  ArrowRightLeft,
  HardDriveUpload,
  LayoutDashboard,
  HardDriveDownload,
  CircleQuestionMark,
} from "lucide-react";

import {
  ToolMode,
  TOOL_MODE_ROUTES,
  ROUTE_TO_TOOL_MODE,
} from "../../types/routes";

import { useAuth } from "@/src/context/AuthContext";
import { usePermissions } from "@/src/context/PermissionContext";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: ToolMode;
  label: string;
  icon: React.ReactNode;
  children?: { id: ToolMode; label: string }[];
}

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

const CUSTOMER_NAV_ITEMS: NavItem[] = [
  { id: "selection", label: "Dashboard", icon: <LayoutGrid size={18} /> },
  // {
  //   id: "organizations",
  //   label: "Organizations",
  //   icon: <Building2 size={18} />,
  // },
  {
    id: "migration",
    label: "AurionOne Migration",
    icon: <ArrowRightLeft size={18} />,
    children: [
      { id: "migration", label: "Full Migration" },
      { id: "cat9k", label: "Cat9K → Meraki" },
    ],
  },
  {
    id: "backup",
    label: "AurionOne Backup & Recovery",
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

const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  {
    id: "admin-overview",
    label: "Overview",
    icon: <LayoutDashboard size={16} />,
  },
  { id: "admin-companies", label: "Companies", icon: <Building2 size={16} /> },
  { id: "admin-users", label: "All Users", icon: <Users size={16} /> },
  { id: "admin-audit", label: "Audit Log", icon: <FileText size={16} /> },
];

const NAV_ITEMS = {
  super_admin: SUPER_ADMIN_NAV_ITEMS,
  user: CUSTOMER_NAV_ITEMS,
};

// if (!isExpanded && item.children) {
//   handleNavigate(item.children[0].id);
// }

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();
  const { userPermissions } = usePermissions();

  const navigate = useNavigate();
  const location = useLocation();

  const [expandedGroup, setExpandedGroup] = useState<ToolMode | null>(null);

  // Determine current tool mode from route
  const activeMode: ToolMode =
    ROUTE_TO_TOOL_MODE[location.pathname] || "selection";

  // Use different nav items based on user role
  const navItems = NAV_ITEMS[user?.role as keyof typeof NAV_ITEMS];

  const email = user?.email || "";
  const displayName = email.split("@")[0] || email;

  const isGroupActive = (item: NavItem) => {
    if (item.id === activeMode) return true;
    return item.children?.some((c) => c.id === activeMode) ?? false;
  };

  const handleNavigate = (mode: ToolMode) => {
    navigate(TOOL_MODE_ROUTES[mode]);
  };

  return (
    <nav
      className={`h-full px-2 flex flex-col bg-[#003E68] overflow-y-auto transition-all max-w-[250px]`}
    >
      <header className="h-18 shrink-0 flex items-center justify-center">
        {!collapsed && (
          <div className="ml-2 flex-1 font-bold text-[20px] text-white">
            AurionOne
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-3 flex items-center justify-center text-white hover:text-black hover:bg-[#F6FCDE] rounded-full cursor-pointer transition-all"
        >
          {collapsed ? (
            <ArrowRight strokeWidth={3} size={18} />
          ) : (
            <Menu strokeWidth={3} size={18} />
          )}
        </button>
      </header>

      <div className="h-full py-3 flex flex-col gap-3">
        <div className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const groupActive = isGroupActive(item);
            const isExpanded = expandedGroup === item.id;
            const hasChildren = item.children && item.children.length > 0;

            const handleItemClick = () => {
              if (hasChildren) {
                setExpandedGroup(isExpanded ? null : item.id);
              } else {
                handleNavigate(item.id);
              }
            };

            return (
              <div key={item.id}>
                <button
                  onClick={handleItemClick}
                  className={`w-full ${collapsed ? "p-3" : "px-4 py-3"} flex items-center gap-3 rounded-full font-medium cursor-pointer transition-all ${
                    groupActive
                      ? "text-black bg-[#D0F059]"
                      : "text-white hover:text-black hover:bg-[#F6FCDE]"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>

                  {!collapsed && (
                    <>
                      <p className="flex-1 text-left text-sm leading-tight">
                        {item.label}
                      </p>

                      {hasChildren && (
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {!collapsed && isExpanded && item.children && (
                  <div className="mt-1 ml-4 pl-2 flex flex-col gap-1 border-l border-gray-200">
                    {item.children.map((child) => {
                      const childActive = activeMode === child.id;

                      return (
                        <button
                          key={child.id}
                          onClick={() => handleNavigate(child.id)}
                          className={`w-full px-4 py-2.5 flex items-center rounded-full cursor-pointer transition-all ${
                            childActive
                              ? "font-medium text-black bg-[#F6FCDE]"
                              : "text-white hover:text-black hover:bg-[#F6FCDE]"
                          }`}
                        >
                          {childActive && (
                            <span className="p-1 mr-2 bg-[#D0F059] rounded-full" />
                          )}

                          <span className="text-[13px] truncate">
                            {child.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-1">
          {[
            { icon: CircleQuestionMark, onClick: () => {}, label: "Support" },
            { icon: LogOut, onClick: logout, label: "Logout" },
          ]?.map(({ icon, onClick, label }, idx) => {
            const Icon = icon;

            return (
              <button
                key={label || idx}
                onClick={onClick}
                className={`${collapsed ? "p-2.5" : "px-4 py-2.5"} w-full flex items-center justify-center gap-3 font-medium text-white hover:text-black hover:bg-[#F6FCDE] rounded-full cursor-pointer transition-all`}
              >
                <Icon size={16} />

                {!collapsed && (
                  <p className="flex-1 text-left text-[13px] leading-tight line-clamp-1">
                    {label}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-b border-[#ABABAB]" />

        {/* Admin Button */}
        <button
          onClick={() => navigate(TOOL_MODE_ROUTES.profile)}
          className={`${collapsed ? "p-1" : "px-2 py-1"} flex items-center justify-center gap-2 text-white hover:text-black hover:bg-[#F6FCDE] rounded-full cursor-pointer transition-all`}
        >
          <img src="/images/6596121.png" alt="User Image" className="size-8" />

          {!collapsed && (
            <div className="flex-1 text-start text-sm font-medium">
              {displayName}
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};
