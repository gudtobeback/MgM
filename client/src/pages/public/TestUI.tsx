import OvalButton from "@/src/components/home/OvalButton";
import {
  Router,
  CircleAlert,
  Shield,
  Download,
  FileArchive,
  FolderClosed,
  HardDriveUpload,
  RefreshCcw,
  ShieldCheck,
  CloudUpload,
  ServerCog,
  RotateCcw,
  Icon,
} from "lucide-react";
import React from "react";

export default function TestUI() {
  const stats = [
    {
      value: 6,
      label: "Ports configured",
      icon: (
        <div className="p-2 bg-[#D0E4FF4D] rounded-full">
          <Router size={20} className="text-[#003E68]" />
        </div>
      ),
      badge: "SYNCED",
    },
    {
      value: 6,
      label: "Ports skipped",
      icon: (
        <div className="p-2 bg-[#FEF3C7] rounded-full">
          <CircleAlert size={20} className="text-[#D97706]" />
        </div>
      ),
      badge: "BYPASSED",
    },
    {
      value: 6,
      label: "RADIUS policies",
      icon: (
        <div className="p-2 bg-[#D0F05933] rounded-full">
          <ShieldCheck size={20} className="text-[#536600]" />
        </div>
      ),
      badge: "ACTIVE",
    },
    {
      value: 6,
      label: "ACL rules pushed",
      icon: (
        <div className="p-2 bg-[#E0F2FE] rounded-full">
          <Shield size={20} className="text-[#0284C7]" />
        </div>
      ),
      badge: "PUSHED",
    },
  ];

  return (
    <div className="flex flex-col gap-6 px-40">
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border p-6 flex flex-col gap-1 bg-white rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              {s?.icon}{" "}
              <p className="font-semibold text-xs text-[#41474F99]">
                {s?.badge}
              </p>
            </div>

            <div className="mt-3 font-semibold text-4xl text-[#003E68] leading-tight">
              {s.value}
            </div>

            <div className="font-medium text-sm text-[#41474F]">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
