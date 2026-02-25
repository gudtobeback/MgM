import React from "react";

type AlertCardProps = {
  children: React.ReactNode;
  variant?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function AlertCard({
  children,
  variant = "info",
}: AlertCardProps) {
  const colorScheme = {
    note: "text-[#025115] bg-[#CFFED7] border border-[#6CD87D]",
    success: "text-[#025115] bg-[#CFFED7] border border-[#6CD87D]",
    warning: "text-amber-800 bg-[#FFEDD5] border border-[#FF9500]",
    alert: "text-red-800 bg-[#FECFCF] border border-[#D86C6C]",
    error: "text-red-800 bg-[#FECFCF] border border-[#D86C6C]",
    info: "text-black/90 bg-[#F1F1F1] border border-[#D9D9D9]",
  };

  return (
    <div
      className={`px-4 py-3 w-full text-[13px] rounded-md ${colorScheme[variant]}`}
    >
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
