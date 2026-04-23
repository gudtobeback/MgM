import React from "react";

import { ArrowRightLeft } from "lucide-react";

type ProcedureCardProps = {
  icon?: React.ReactNode;
  heading?: string | null | any;
  subHeading?: string | any;
  variant?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function ProcedureCard({
  icon,
  heading,
  subHeading,
}: ProcedureCardProps) {
  if (!heading) return;

  return (
    <div className="flex items-center gap-3">
      {icon && icon}

      <div className="flex flex-col gap-1">
        <p className="font-semibold text-[16px] text-[#003E68]">{heading}</p>

        {subHeading && (
          <p className="text-[12px] text-black/60">{subHeading}</p>
        )}
      </div>
    </div>
  );
}
