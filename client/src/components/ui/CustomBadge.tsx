import React from "react";

type BadgeProps = {
  text_prop?: string;
  bg_prop?: string;
  className?: string;
  text: string;
  icon?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function CustomBadge({
  className,
  text_prop="text-white",
  bg_prop,
  text,
  icon,
  ...props
}: BadgeProps) {
  return (
    <div
      {...props}
      className={`px-3 py-1 flex items-center gap-1 rounded-full ${text_prop} ${bg_prop} ${className}`}
    >
      {icon}
      {text}
    </div>
  );
}
