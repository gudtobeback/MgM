import React from "react";

import { useReveal } from "@/src/hooks/useReveal";

export default function StatsSection() {
  const [ref1, show1] = useReveal();

  // for normal cards (optional reuse)
  const [ref2, show2] = useReveal();

  return (
    <div className="bg-[url('/images/cloud.jpg')] bg-cover rounded-3xl overflow-hidden">
      <div className="flex flex-col items-center justify-center gap-10 lg:h-[650px] p-5 lg:p-0">
        {/* Heading */}
        <div className="relative py-4 lg:py-0">
          <p className="font-medium text-center text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-white">
            Trusted by Teams That Scale Fast
          </p>

          <p className="absolute bottonm-1 lg:-bottom-1 right-23 sm:right-0 border-2 border-[#D7FB71] w-[100px] rounded" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-18 gap-3 md:gap-5 md:w-[820px]">
          <div
            ref={ref2}
            className={`col-span-9 md:col-span-5 md:h-[210px] flex flex-col items-start justify-center p-10 text-white bg-black rounded-2xl
              ${show2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"} transition-all duration-1000 ease-out`}
          >
            <p className="font-medium text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
              60%
            </p>
            <p className="font-light text-xs">
              Reduction in
              <br />
              Manual Work
            </p>
          </div>

          <div
            ref={ref2}
            className={`col-span-9 md:col-span-5 md:h-[210px] flex flex-col items-start justify-center p-10 text-black bg-white rounded-2xl
            ${show2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-y-20"} transition-all duration-1000 ease-out`}
          >
            <p className="font-medium text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
              50+
            </p>
            <p className="font-light text-xs">Config categories</p>
          </div>

          {/* slide right to left */}
          <div
            ref={ref1}
            className={`col-span-18 md:col-span-8 md:h-[210px] flex flex-col items-start justify-between gap-4 lg:gap-0 p-8 text-black bg-[#D7FB71] rounded-2xl
            ${show1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"} transition-all duration-1000 ease-out`}
          >
            <p className="font-medium text-sm">
              “This cut our migration time by more than half.” We no longer
              worry about manual errors or downtime. Everything just works.
            </p>

            <div className="flex items-center gap-2">
              <img src="/images/6596121.png" alt="" className="size-10" />

              <div className="flex flex-col gap-1">
                <p className="font-medium text-xs text-black">Shon Taite</p>
                <p className="font-light text-xs text-gray-700">
                  Head of IT, SaaS Company
                </p>
              </div>
            </div>
          </div>

          {/* slide left to right */}
          <div
            ref={ref1}
            className={`col-span-18 md:col-span-8 md:h-[210px] flex flex-col items-start justify-between gap-4 lg:gap-0 p-8 text-black bg-white rounded-2xl
            ${show1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"} transition-all duration-1000 ease-out`}
          >
            <p className="font-medium text-sm">
              “Feels like an extension of our team.” The automation is seamless,
              and the control is unmatched.
            </p>

            <div className="flex items-center gap-2">
              <img src="/images/6596121.png" alt="" className="size-10" />

              <div className="flex flex-col gap-1">
                <p className="font-medium text-xs text-black">Mark Demon</p>
                <p className="font-light text-xs text-gray-700">
                  Network Engineer, Enterprise Tech
                </p>
              </div>
            </div>
          </div>

          <div
            ref={ref2}
            className={`col-span-9 md:col-span-5 md:h-[210px] flex flex-col items-start justify-center p-10 text-white bg-[#015A94] rounded-2xl
            ${show2 ? "opacity-100 translate-x-0" : "opacity-0 translate-y-20"} transition-all duration-1000 ease-out`}
          >
            <p className="font-medium text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
              ~10<span className="text-[14px] lg:text-2xl"> min</span>
            </p>
            <p className="font-light text-xs">Average time</p>
          </div>

          <div
            ref={ref2}
            className={`col-span-9 md:col-span-5 md:h-[210px] flex flex-col items-start justify-center p-10 text-black bg-white rounded-2xl
            ${show2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"} transition-all duration-1000 ease-out`}
          >
            <p className="font-medium text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
              99%
            </p>
            <p className="font-light text-xs">Migration success</p>
          </div>
        </div>
      </div>
    </div>
  );
}
