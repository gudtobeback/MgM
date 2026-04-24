import React from "react";
import {
  CircleCheck,
  CircleAlert,
  TriangleAlert,
  Info,
  XCircle,
} from "lucide-react";

type AlertCardProps = {
  isIcon?: Boolean;
  children: React.ReactNode;
  variant?: "red" | "blue" | "green" | "yellow";
};

export default function AlertCard({
  isIcon = true,
  children,
  variant = "blue",
}: AlertCardProps) {
  const styles = {
    red: "text-[#93000A] bg-[#FFDAD64D] border-[#BA1A1A]",
    blue: "text-[#004A7A] bg-[#D0E4FF4D] border-[#003E68]",
    green: "text-green-600 bg-green-50 border-green-600",
    yellow: "text-amber-600 bg-amber-50 border-amber-500",
  };

  const icons = {
    red: <XCircle size={18} className="mt-0.5 shrink-0" />,
    blue: <CircleAlert size={18} className="mt-0.5 shrink-0" />,
    green: <CircleCheck size={18} className="mt-0.5 shrink-0" />,
    yellow: <TriangleAlert size={18} className="mt-0.5 shrink-0" />,
  };

  return (
    <div className={`p-4 flex gap-3 border-l-4 ${styles[variant]}`}>
      {(isIcon && icons[variant]) || ""}

      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}
