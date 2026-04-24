import React from "react";

type DomainCardProps = {
  title?: string;
  subTitle?: string;
  variant?: string;
  className?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function DomainCard({
  title,
  subTitle,
  variant = "blue",
  className = "w-fit",
  children,
}: DomainCardProps) {
  const colorVariant = {
    blue: {
      circle_color: "bg-[#049FD9]",
      bg_color: "bg-[#F6FDFF]",
      border_color: "border-[#87D2ED]",
      text_color: "text-[#049FD9]",
    },
    green: {
      circle_color: "bg-[#10B981]", // emerald-500
      bg_color: "bg-[#F0FDF4]", // emerald-50
      border_color: "border-[#86EFAC]", // emerald-300
      text_color: "text-[#059669]", // emerald-600
    },
  };
  return (
    <div
      className={`p-4 ${className} bg-white rounded-lg border-2 ${colorVariant[variant]?.border_color}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Circle */}
          <div
            className={`flex items-center justify-center size-8 ${colorVariant[variant]?.circle_color} rounded-full`}
          >
            <div className="flex items-center justify-center size-5 bg-white rounded-full">
              <div
                className={`flex items-center justify-center size-3 ${colorVariant[variant]?.circle_color} rounded-full`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold">{title}</p>
            {subTitle && (
              <p className={`text-[13px] ${colorVariant[variant]?.text_color}`}>
                {subTitle}
              </p>
            )}
          </div>
        </div>

        {children && (
          <div
            className={`border ${colorVariant[variant]?.border_color}`}
          ></div>
        )}

        {children}
      </div>
    </div>
  );
}
