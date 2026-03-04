import React from "react";

type LogsCardProps = {
  logName?: string;
  variant?: string;
  className?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function LogsCard({ logName, children }: LogsCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="ml-1 text-sm font-semibold text-[#333232]">{logName} -</p>

      <div className="h-80 p-4 font-mono text-sm text-[#D5D5D5] bg-black border border-[#B3B3B3] rounded-md overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
