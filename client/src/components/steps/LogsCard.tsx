import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

type LogsCardProps = {
  logName?: string;
  variant?: string;
  className?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function LogsCard({ logName, children }: LogsCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col h-fit w-full rounded-2xl overflow-hidden">
      <div className="px-5 py-2.5 flex items-center justify-between gap-3 bg-[#072A49]">
        {/* <div className="flex items-center gap-1.5">
          <div className="p-1 bg-[#FF5F56] rounded-full"></div>
          <div className="p-1 bg-[#FFBD2E] rounded-full"></div>
          <div className="p-1 bg-[#27C93F] rounded-full"></div>
        </div> */}
        <p className="font-mono text-[12px] text-[#94A3B8]">
          Console Output - {logName}
        </p>

        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-0.5 hover:bg-gray-600 rounded-full cursor-pointer"
        >
          <ChevronDown
            size={18}
            className={`text-[#94A3B8] ${!isOpen && "rotate-180"} transition-all`}
          />
        </div>
      </div>

      <div
        className={`${isOpen ? "h-80 overflow-y-auto" : "h-fit"} p-4 font-mono text-sm text-[#D5D5D5] bg-[#003E68] transition-all`}
      >
        {isOpen ? children : <p className="text-xs">Open to see console</p>}
      </div>
    </div>
  );
}
