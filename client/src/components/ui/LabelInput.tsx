import React from "react";

type LabelInputProps = {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  colSpan?: string;
  orientation?: string;
  required?: Boolean;
  type?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function LabelInput({
  id,
  label,
  bold,
  className = "",
  colSpan = "col-span-1",
  orientation = "vertical",
  required,
  children,
  type,
}: LabelInputProps) {
  const isFile = type == "file";

  const isCheckbox = type == "checkbox";

  return (
    <div
      className={`${className} ${colSpan}
      flex ${!isCheckbox && orientation == "vertical" ? `flex-col gap-1` : `items-center gap-3`}`}
    >
      {isCheckbox && children}

      <label
        htmlFor={id}
        className={`text-sm font-semibold
        ${bold && `font-semibold`} ${!isCheckbox && `whitespace-nowrap`}`}
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
        {orientation == "horizontal" && " :"}

        {isFile && <div className="mt-1">{children}</div>}
      </label>

      {!isCheckbox && !isFile && children}
    </div>
  );
}
