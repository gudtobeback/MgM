import React, { useState } from "react";

import { useFadeInOnScroll } from "@/src/hooks/useFadeInOnScroll";
import { ChevronDown } from "lucide-react";

export default function QuestionsSection() {
  const fadeRef = useFadeInOnScroll();

  const [openedIdx, setOpenedIdx] = useState<number | null>(0);

  return (
    <div
      id="FAQ"
      ref={fadeRef}
      className="flex flex-col items-start gap-10 px-5
      lg:flex-row lg:gap-6 lg:px-10 xl:px-25"
    >
      {/* Right Container */}
      <div className="flex flex-col gap-5 w-full lg:w-[450px]">
        <div className="relative">
          <p className="text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
            Frequently Asked
          </p>
          <p className="relative w-fit font-bold text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-[#015C95]">
            Questions
            <span className="absolute -bottom-1 -right-1 border-2 border-[#D7FB71] w-[100px] rounded" />
          </p>
        </div>

        <p className="text-[13px] sm:text-sm">
          Get answers to common questions here
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-3 w-full">
        {[
          {
            question: "How long does migration take?",
            description:
              "Most migrations are completed in under 30 minutes, depending on network size and complexity.",
          },
          {
            question: "Is there a downtime?",
            description:
              "There is minimal to no downtime. The migration is designed to be seamless, with most configurations replicated without interrupting live traffic.",
          },
          {
            question: "Do I need technical expertise?",
            description:
              "No deep expertise is required. The platform is designed for guided, automated migration, though basic networking knowledge helps.",
          },
          {
            question: "What devices are supported?",
            description: (
              <div>
                <p>Typically Supports: </p>

                <ul className="list-disc list-inside mt-1">
                  <li>Switches</li>
                  <li>Wireless APs</li>
                  <li>Security appliances</li>
                  <li>
                    (Depends on vendor compatibility—e.g., Cisco Meraki, etc.)
                  </li>
                </ul>
              </div>
            ),
          },
        ].map((data, idx) => {
          const isOpen = openedIdx === idx;

          return (
            <div
              onClick={() => setOpenedIdx(isOpen ? null : idx)}
              className={`flex flex-col gap-3 px-4 py-3 text-black ${isOpen && "bg-gray-100"} border border-gray-300 rounded-xl w-full cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{data?.question}</p>
                <ChevronDown
                  size={18}
                  className={`${isOpen ? "rotate-180" : ""} cursor-pointer`}
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
