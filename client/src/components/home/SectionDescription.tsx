import React from "react";

type SectionDescriptionProps = {
  des1: React.ReactNode;
  des2?: React.ReactNode;
};
export default function SectionDescription({
  des1,
  des2,
}: SectionDescriptionProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-[32px] font-bold">{des1}</div>

      <div className="text-[16px] text-center">{des2}</div>
    </div>
  );
}
