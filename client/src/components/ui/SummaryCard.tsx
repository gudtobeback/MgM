import React from "react";

type SummaryCardProps = {
  children: React.ReactNode;
  icon?: string;
  icon_bg_color?: string;
  label?: string;
  value?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function SummaryCard({
  icon,
  icon_bg_color,
  label,
  value,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={`${className} flex items-start gap-5 p-5 bg-white rounded-xl shadow-[0_0px_8px_rgba(0,0,0,0.10)]`}
    >
      <div className={`mt-2 p-2.5 text-white ${icon_bg_color} rounded-full`}>
        {icon}
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[28px] font-semibold">{value}</div>
        <div className="text-xs font-medium text-[#797979] tracking-wider">
          {label}
        </div>
      </div>
    </div>
  );
}
