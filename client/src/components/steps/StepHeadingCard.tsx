import React from "react";

import { ArrowRightLeft } from "lucide-react";

type StepHeadingCardProps = {
  icon?: React.ElementType;
  heading?: string;
  subHeading?: string;
  variant?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function StepHeadingCard({
  icon: Icon = ArrowRightLeft,
  heading,
  subHeading,
}: StepHeadingCardProps) {
  if (!heading) return;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-[#87D2ED]">
      <Icon size={30} color="#049FD9" className="shrink-0" />

      <div className="flex flex-col gap-1">
        <p className="font-semibold text-[16px]">{heading}</p>

        <p className="text-[12px] text-[#049FD9]">{subHeading}</p>
      </div>
    </div>
  );
}
