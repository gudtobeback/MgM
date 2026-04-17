import React from "react";

type SummaryCardProps = {
  icon?: any;
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
      className={`${className} flex items-stretch bg-white overflow-hidden rounded-3xl shadow-[0_0_1px_0_rgba(0,0,0,0.25)]`}
    >
      <div className="border-2 border-[#003E68]"></div>

      <div className="flex items-center gap-5 p-5">
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
    </div>
  );
}
