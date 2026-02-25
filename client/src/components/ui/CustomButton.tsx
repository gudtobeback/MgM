import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  text_prop?: string;
  bg_prop?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function CustomButton({
  children,
  text_prop = "text-white",
  bg_prop = "bg-[#049FD9] enabled:hover:bg-[#0e8dbb]",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded transition-all enabled:cursor-pointer disabled:opacity-50 ${text_prop} ${bg_prop} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
