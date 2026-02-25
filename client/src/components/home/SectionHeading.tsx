import React from "react";
import clsx from "clsx";

type SectionHeadingProps = {
  text: string;
  variant: "red" | "blue";
};

export default function SectionHeading({ text, variant }: SectionHeadingProps) {
  const colorMap = {
    red: {
      main: "#FF0F0F",
      bg: "#FFE1E1",
    },
    blue: {
      main: "#049FD9",
      bg: "#E1EDFF",
    },
  };

  const current = colorMap[variant];

  return (
    <div className="flex items-center w-full">
      <div
        className="flex-1 h-px"
        style={{
          backgroundImage: `linear-gradient(to right, transparent, ${current.main}, ${current.main})`,
        }}
      />

      <div
        className="flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-black border rounded-full"
        style={{
          backgroundColor: current.bg,
          borderColor: current.main,
        }}
      >
        <span className="w-1 h-1 bg-black rounded" />
        {text}
      </div>

      <div
        className="flex-1 h-px"
        style={{
          backgroundImage: `linear-gradient(to right, ${current.main}, ${current.main}, transparent)`,
        }}
      />
    </div>
  );
}
