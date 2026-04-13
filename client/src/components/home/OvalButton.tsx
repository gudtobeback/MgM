import React from "react";

type OvalButtonProps = {
  children: React.ReactNode;
  text_prop?: string;
  bg_prop?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function OvalButton({
  children,
  text_prop = "text-black",
  bg_prop = "bg-[#D7FB71]",
  className = "",
  ...props
}: OvalButtonProps) {
  return (
    <button
      className={`${text_prop} ${bg_prop} ${className} px-4 py-2.5 w-fit flex items-center gap-1 font-medium text-[13px] rounded-full cursor-pointer`}
      {...props}
    >
      {children}
    </button>
  );
}
