import React, { useState } from "react";

import { useFadeInOnScroll } from "@/src/hooks/useFadeInOnScroll";
import { ChevronDown } from "lucide-react";

export default function QuestionsSection() {
  const fadeRef = useFadeInOnScroll();

  const [openedIdx, setOpenedIdx] = useState<number[]>([]);

  return (
    <div
      id="how"
      ref={fadeRef}
      className="flex flex-col lg:flex-row items-start gap-10 lg:gap-4 px-5 lg:px-25"
    >
      {/* Right Container */}
      <div className="flex flex-col gap-5 w-full lg:w-[450px]">
        <div className="relative">
          <p className="text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
            Frequently Asked
          </p>
          <p className="font-bold text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-[#015C95]">
            Questions
          </p>
          <p className="absolute -bottom-1 left-13 sm:left-23 md:left-40 border-2 border-[#D7FB71] w-[100px] rounded" />
        </div>

        <p className="text-[12px] sm:text-[13px]">
          Get answers to common questions here
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-3 w-full">
        {[
          {
            question: "How long does migration take?",
            description:
              "Most migrations are completed in under 30 minutes, depending on network size.",
          },
          {
            question: "Is there downtime?",
            description:
              "Most migrations are completed in under 30 minutes, depending on network size.",
          },
          {
            question: "Do I need technical expertise?",
            description:
              "Most migrations are completed in under 30 minutes, depending on network size.",
          },
          {
            question: "What devices are supported?",
            description:
              "Most migrations are completed in under 30 minutes, depending on network size.",
          },
        ].map((data, idx) => {
          const isOpen = openedIdx?.includes(idx);

          return (
            <div
              onClick={() =>
                setOpenedIdx((prev) => {
                  return prev?.includes(idx)
                    ? prev?.filter((p) => p !== idx)
                    : [...prev, idx];
                })
              }
              className={`flex flex-col gap-3 px-4 py-3 text-black ${isOpen && "bg-gray-100"} border border-gray-300 rounded-xl w-full`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{data?.question}</p>
                <ChevronDown
                  size={18}
                  className={`${isOpen ? "rotate-90" : ""} cursor-pointer`}
                />
              </div>

              {isOpen && (
                <p className="font-light text-xs">{data?.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
