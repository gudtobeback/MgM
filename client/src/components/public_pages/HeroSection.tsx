import React from "react";

export default function HeroSection({
  title,
  desc,
}: {
  title: any;
  desc: any;
}) {
  return (
    <div className="bg-[url('/images/cloud.jpg')] bg-cover rounded-b-3xl overflow-hidden">
      <div className="flex flex-col justify-center gap-6 p-5 lg:h-[300px] lg:px-25 lg:py-0">
        <div className="px-3 py-1.5 text-[11px] w-fit bg-[#D7FB71] rounded-full">
          Trust & Transfer
        </div>

        <p className="text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-white">
          {title}
        </p>

        <p className="text-[12px] sm:text-[13px] text-white">{desc}</p>
      </div>
    </div>
  );
}
