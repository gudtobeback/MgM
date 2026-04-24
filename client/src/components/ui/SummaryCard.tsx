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

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <img
            src="/images/Terminal.png"
            alt=""
            className="p-1 size-6 rounded-full bg-gray-100"
          />

          <p className="font-medium text-[#003E68]">{label}</p>
        </div>

        <div className="font-semibold text-2xl text-[#015C95]">{value}</div>
      </div>
    </div>
  );
}
