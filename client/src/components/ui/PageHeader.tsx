import React from "react";

type PageHeaderProps = {
  heading?: string;
  subHeading?: string;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function PageHeader({
  heading,
  subHeading,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <p className="font-semibold">{heading}</p>
        <p className="text-xs text-black/60">{subHeading}</p>
      </div>

      {children}
    </div>
  );
}
