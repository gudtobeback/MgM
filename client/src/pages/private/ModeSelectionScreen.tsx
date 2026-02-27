import React from "react";
import { useNavigate } from "react-router-dom";

import { Progress } from "antd";
import {
  HardDriveDownload,
  Activity,
  Building2,
  ServerCog,
  HardDriveUpload,
  Plus,
  Globe,
  RefreshCw,
  EllipsisVertical,
} from "lucide-react";

import CustomButton from "../../components/ui/CustomButton";

import { ToolMode, TOOL_MODE_ROUTES } from "../../types/routes";

interface ModeSelectionScreenProps {
  userEmail?: string;
  connectedOrgs?: any[];
}

// ── Tool cards ────────────────────────────────────────────────────────────────
const TOOLS: {
  id: ToolMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  icon_bg_color: string;
}[] = [
  {
    id: "migration",
    label: "Full Migration",
    description: "Migrate devices and configurations between organizations",
    icon: <RefreshCw size={18} color="#0F55EC" />,
    icon_bg_color: "bg-[#DBEAFE]",
  },
  {
    id: "restore",
    label: "Restore Backup",
    description: "Restore a previous configuration snapshot to your org",
    icon: <HardDriveUpload size={18} color="#0F9F91" />,
    icon_bg_color: "bg-[#DCFCE7]",
  },
  {
    id: "cat9k",
    label: "Cat9K → Meraki",
    description: "Translate IOS-XE running-config to Meraki MS switch config",
    icon: <ServerCog size={18} color="#6E1FF6" />,
    icon_bg_color: "bg-[#EDE9FE]",
  },
  {
    id: "backup",
    label: "Backup Config",
    description: "Snapshot your org and save to ZIP before any change",
    icon: <HardDriveDownload size={18} color="#0F9F91" />,
    icon_bg_color: "bg-[#CCFBF1]",
  },
  // {
  //   id: "drift",
  //   label: "Drift Detection",
  //   description: "Detect configuration changes against a saved baseline",
  //   icon: <Activity size={18} color="#FF0000" />,
  //   icon_bg_color: "bg-[#FEE2E2]",
  // },
  // {
  //   id: "version-control",
  //   label: "Version Control",
  //   description: "Track and compare configuration changes over time",
  //   icon: <GitBranch size={18} color="#FF9500" />,
  //   icon_bg_color: "bg-[#FFEDD5]",
  // },
  // {
  //   id: "bulk-ops",
  //   label: "Bulk Operations",
  //   description: "Push settings across multiple networks simultaneously",
  //   icon: <Layers size={18} color="#006DFF" />,
  //   icon_bg_color: "bg-[#DBEAFE]",
  // },
  // {
  //   id: "compliance",
  //   label: "Compliance Audit",
  //   description: "Run PCI DSS, HIPAA, ISO 27001 and CIS benchmark checks",
  //   icon: <ShieldCheck size={18} color="#0F9F91" />,
  //   icon_bg_color: "bg-[#DCFCE7]",
  // },
  // {
  //   id: "security",
  //   label: "Security Posture",
  //   description: "Review firewall, SSID encryption and vulnerability status",
  //   icon: <Shield size={18} color="#FF0000" />,
  //   icon_bg_color: "bg-[#FEE2E2]",
  // },
  // {
  //   id: "dashboard",
  //   label: "Analytics",
  //   description: "Platform usage metrics and operational insights",
  //   icon: <BarChart3 size={18} color="#0F55EC" />,
  //   icon_bg_color: "bg-[#DBEAFE]",
  // },
];

// ── Region display helpers ────────────────────────────────────────────────────
const REGION_LABEL: Record<string, string> = {
  com: "Global",
  in: "India",
};

const REGION_STYLES: Record<string, string> = {
  com: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10",
  in: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10",
};

// ── Sync time formatter ───────────────────────────────────────────────────────
function formatSync(syncedAt: string | null): string {
  if (!syncedAt) return "Never synced";
  const diff = Date.now() - new Date(syncedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  userEmail,
  connectedOrgs = [],
}) => {
  const navigate = useNavigate();

  const firstName = userEmail
    ? userEmail.split("@")[0].replace(/[._]/g, " ")
    : null;

  const handleNavigate = (mode: ToolMode) => {
    navigate(TOOL_MODE_ROUTES[mode]);
  };

  // ── Derived summary from real orgs ──────────────────────────────────────────
  const totalDevices = connectedOrgs.reduce(
    (s, o) => s + (o.device_count ?? 0),
    0,
  );

  const uniqueRegions = new Set(connectedOrgs.map((o) => o.meraki_region)).size;

  const SUMMARY = [
    {
      value: String(connectedOrgs?.length),
      label: "Connected Orgs",
      icon: <Building2 size={20} />,
      icon_bg_color: "bg-[#D398E7]",
    },
    {
      value: String(totalDevices),
      label: "Total Devices",
      icon: <HardDriveDownload size={20} />,
      icon_bg_color: "bg-[#E89271]",
    },
    {
      value: String(uniqueRegions),
      label: "Regions",
      icon: <Globe size={20} />,
      icon_bg_color: "bg-[#70A1E5]",
    },
    {
      value: connectedOrgs.length === 0 ? "—" : "Active",
      label: "Platform Status",
      icon: <Activity size={20} />,
      icon_bg_color: "bg-[#F0C274]",
    },
  ];

  const quickAccessTools = [
    {
      name: "Samuel Goodwin",
      function: "Full Migration",
      time: "08:30",
      description: "Migrate devices & configurations",
      action: <EllipsisVertical size={12} />,
    },
    {
      name: "Samuel Goodwin",
      function: "Full Migration",
      time: "08:30",
      description: "Migrate devices & configurations",
      action: <EllipsisVertical size={12} />,
    },
    {
      name: "Samuel Goodwin",
      function: "Full Migration",
      time: "08:30",
      description: "Migrate devices & configurations",
      action: <EllipsisVertical size={12} />,
    },
    {
      name: "Samuel Goodwin",
      function: "Full Migration",
      time: "08:30",
      description: "Migrate devices & configurations",
      action: <EllipsisVertical size={12} />,
    },
    {
      name: "Samuel Goodwin",
      function: "Full Migration",
      time: "08:30",
      description: "Migrate devices & configurations",
      action: <EllipsisVertical size={12} />,
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-6 w-full">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Welcome back, {firstName}</p>
          <p className="text-xs text-black/60">
            Unified Meraki Management — {connectedOrgs?.length || 0}{" "}
            organization connected
          </p>
        </div>

        <CustomButton
          onClick={() => handleNavigate("organizations")}
          className="px-6 py-3 text-sm"
        >
          <Plus size={20} /> Add Organization
        </CustomButton>
      </div>

      {/* Summay Cards */}
      <div className="grid grid-cols-4 gap-6">
        {SUMMARY.map((s, i) => (
          <div
            key={s.label}
            className="col-span-4 md:col-span-2 lg:col-span-1 flex items-start gap-5 p-5 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all"
          >
            <div
              className={`mt-2 p-2.5 text-white ${s?.icon_bg_color} rounded-full`}
            >
              {s.icon}
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-[28px] font-semibold">{s.value}</div>
              <div className="text-xs font-medium text-[#797979] tracking-wider">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hero Row: Quick Access Tools + Device Distribution */}
      <div className="grid grid-cols-12 gap-6">
        {/* Quick Access Tools */}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-4 p-5 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
          <div className="text-md font-bold flex items-center gap-2">
            Quick Access Tools
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {quickAccessTools?.map((tools, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-2 border rounded-lg"
              >
                <p className="font-semibold">{tools?.name}</p>

                <div className="px-2 py-1 text-[#049FD9] bg-[#CEF2FF] rounded-md">
                  {tools?.function}
                </div>

                <p className="font-semibold">{tools?.time}</p>

                <p className="text-black/60">{tools?.description}</p>

                {tools?.action}
              </div>
            ))}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-4 p-5 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
          <div className="text-md font-bold flex items-center gap-2">
            Device Distribution
          </div>

          <div className="space-y-4">
            {connectedOrgs.slice(0, 5).map((org, i) => {
              const max = Math.max(
                ...connectedOrgs.map((o: any) => o.device_count ?? 0),
                1,
              );

              const pct = Math.round(((org.device_count ?? 0) / max) * 100);

              const gradientMap = [
                ["#3b82f6", "#1d4ed8"],
                ["#06b6d4", "#0e7490"],
                ["#8b5cf6", "#6d28d9"],
                ["#10b981", "#047857"],
                ["#f59e0b", "#b45309"],
              ];

              const gradient = gradientMap[i % gradientMap.length];

              return (
                <div key={org.id}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground truncate max-w-[65%]">
                      {org.meraki_org_name}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {(org.device_count ?? 0).toLocaleString()}
                    </span>
                  </div>

                  <Progress
                    percent={pct}
                    showInfo={false}
                    strokeColor={{
                      "0%": gradient[0],
                      "100%": gradient[1],
                    }}
                  />

                  <p className="text-[10px] text-muted-foreground mt-1">
                    {pct}% of fleet
                  </p>
                </div>
              );
            })}

            {connectedOrgs.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{connectedOrgs.length - 5} more organization
                {connectedOrgs.length - 5 !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex items-center justify-around gap-5">
            <div className="space-y-3 p-3 text-center border rounded-lg w-full">
              <p className="text-xs text-[#8E8E93]">Global</p>
              <p className="font-semibold">12</p>
              <p className="text-xs text-[#8E8E93]">1 Org</p>
            </div>

            <div className="space-y-3 p-3 text-center border rounded-lg w-full">
              <p className="text-xs text-[#8E8E93]">India</p>
              <p className="font-semibold">0</p>
              <p className="text-xs text-[#8E8E93]">o Org</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Tools */}
      <div className="flex flex-col gap-4 p-5 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
        <div className="text-[16px] font-bold">Platform Tools</div>

        <div className="grid grid-cols-20 gap-5">
          {TOOLS.map((tool, index) => (
            <button
              key={tool.id || index}
              onClick={() => handleNavigate(tool.id)}
              className={`col-span-20 sm:col-span-10 lg:col-span-5 flex items-start gap-3 p-4 text-left rounded-lg border border-[#EFEFEF] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all`}
            >
              <div
                className={`shrink-0 flex items-center justify-center w-9 h-9 ${tool?.icon_bg_color} rounded-xl`}
              >
                {tool.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                  {tool.label}
                </h3>
                <p className="text-xs text-[#ADB8CC] leading-relaxed line-clamp-2">
                  {tool.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 text-xs text-center text-black/60 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
        © 2026 Meraki Management. All rights reserved.
      </div>
    </div>
  );
};
