import React from "react";
import {
  CircleCheck,
  CircleAlert,
  TriangleAlert,
  Info,
  XCircle,
} from "lucide-react";

type AlertCardProps = {
  children: React.ReactNode;
  variant?: "note" | "success" | "warning" | "alert" | "error" | "info";
};

export default function AlertCard({
  children,
  variant = "info",
}: AlertCardProps) {
  const styles = {
    success: "text-green-800 bg-green-50 border border-green-200",

    note: "text-emerald-800 bg-emerald-50 border border-emerald-200",

    warning: "text-amber-800 bg-amber-50 border border-amber-200",

    alert: "text-red-800 bg-red-50 border border-red-200",

    error: "text-red-900 bg-red-100 border border-red-300",

    info: "text-[#049FD9] bg-[#F6FDFF] border border-[#87D2ED]",
  };

  const icons = {
    success: <CircleCheck size={18} className="text-green-600 shrink-0" />,
    warning: <TriangleAlert size={18} className="text-amber-600 shrink-0" />,
    alert: <CircleAlert size={18} className="text-red-600 shrink-0" />,
    error: <XCircle size={18} className="text-red-700 shrink-0" />,
  };

  return (
    <div
      className={`w-full rounded-md border px-4 py-3 text-[13px] ${styles[variant]}`}
    >
      <div className="flex items-start gap-3">
        {icons[variant] || ""}
        <div className="flex flex-col gap-1">{children}</div>
      </div>
    </div>
  );
}
