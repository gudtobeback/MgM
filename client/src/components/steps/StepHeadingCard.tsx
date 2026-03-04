import React from "react";

import { ArrowRightLeft } from "lucide-react";

type StepHeadingCardProps = {
  icon?: React.ReactNode;
  heading?: string;
  subHeading?: string;
  variant?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function StepHeadingCard({
  icon,
  heading,
  subHeading,
}: StepHeadingCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-[#87D2ED]">
      {icon || <ArrowRightLeft size={30} color="#049FD9" />}

      <div className="flex flex-col gap-1">
        <p className="font-semibold text-[16px]">{heading}</p>

        <p className="text-[12px] text-[#049FD9]">{subHeading}</p>
      </div>
    </div>
  );
}
