import React from "react";

export default function InformationCard({
  icon,
  label,
  className,
  children,
}: {
  label?: any;
  icon?: any;
  className?: any;
  children?: any;
}) {
  const Icon = icon;

  return (
    <div
      className={`${className} p-6 flex flex-col gap-5 bg-[#003E68] rounded-lg`}
    >
      <div className="flex items-center gap-3">
        <Icon size={22} className="text-[#D0F059]" />

        <div className="text-white text-sm">{label}</div>
      </div>

      {children}
    </div>
  );
}
