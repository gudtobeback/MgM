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
  className= "w-fit",
  children,
}: DomainCardProps) {
  const colorVariant = {
    blue: {
      circle_color: "bg-[#049FD9]",
      bg_color: "bg-[#F6FDFF]",
      border_color: "border-[#87D2ED]",
    },
    green: {
      circle_color: "bg-[#0BD904]",
      bg_color: "bg-[#F8FFF6]",
      border_color: "border-[#87ED87]",
    },
  };
  return (
    <div
      className={`p-4 ${className} ${colorVariant[variant]?.bg_color} rounded-lg border ${colorVariant[variant]?.border_color}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`size-7.5 ${colorVariant[variant]?.circle_color} rounded-full`}
          />

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{title}</p>
            {subTitle && <p className="text-sm text-[#232C32]">{subTitle}</p>}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
