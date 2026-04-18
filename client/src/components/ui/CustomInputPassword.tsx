import React, { useState } from "react";

import { Eye, EyeOff } from "lucide-react";

const commonInputClass =
  "w-full pl-12 p-3 outline-none text-sm placeholder:text-[#C1C7D1] bg-[#C1C7D133] border border-gray-200 rounded-3xl";

const errorClass = (error: any) => {
  return error
    ? "border-2 border-red-400"
    : "border-gray-200 focus:border-transparent focus:ring ring-[#015C95]";
};

export const CustomInputPassword = React.forwardRef(
  ({ icon, error, className, ...props }: any, ref: any) => {
    const [showPassword, setShowPassword] = useState(false);
    const Icon = icon;

    return (
      <div className="relative">
        <input
          ref={ref} // ✅ CRITICAL FIX
          {...props}
          type={showPassword ? "text" : "password"}
          className={`${className} ${errorClass(error)} ${commonInputClass}`}
        />

        <Icon
          size={18}
          className="absolute top-1/2 -translate-y-1/2 left-4"
          color="#717781"
        />

        <button type="button" onClick={() => setShowPassword((prev) => !prev)}>
          {showPassword ? (
            <EyeOff
              size={18}
              className="absolute top-1/2 -translate-y-1/2 right-4"
              color="#717781"
            />
          ) : (
            <Eye
              size={18}
              className="absolute top-1/2 -translate-y-1/2 right-4"
              color="#717781"
            />
          )}
        </button>
      </div>
    );
  },
);
