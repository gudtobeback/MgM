import React from "react";

import { Timer } from "lucide-react";

const commonInputClass =
  "w-full p-3 outline-none text-sm placeholder:text-[#C1C7D1] bg-[#C1C7D133] border border-gray-200 rounded-3xl";

const errorClass = (error: any) => {
  return error
    ? "border-2 border-red-400"
    : "border-gray-200 focus:border-transparent focus:ring ring-[#015C95]";
};

export const CustomTimepicker = React.forwardRef(
  ({ icon, error, className, ...props }: any, ref: any) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          {...props}
          type="time"
          className={`${icon && "pl-12"} ${className} ${errorClass(error)} ${commonInputClass}`}
        />

        {icon && (
          <Timer
            size={18}
            className="absolute top-1/2 -translate-y-1/2 left-4"
            color="#717781"
          />
        )}
      </div>
    );
  },
);
