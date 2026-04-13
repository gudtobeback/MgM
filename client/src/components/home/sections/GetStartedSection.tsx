import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ExternalLink } from "lucide-react";

import OvalButton from "../OvalButton";

const cards = [
  {
    id: "01",
    title: "Connect Your Source Network",
    description:
      "Securely connect your existing infrastructure in just a few clicks.",
  },
  {
    id: "02",
    title: "Connect Your Destination Network",
    description:
      "Choose what you want to migrate with full visibility and control.",
  },
  {
    id: "03",
    title: "Select Devices and Review",
    description:
      "Preview changes and ensure everything is configured correctly before execution.",
  },
  {
    id: "04",
    title: "Automatic Pre-Migration Backup",
    description:
      "We automatically back up your data to ensure zero risk during migration.",
  },
  {
    id: "05",
    title: "Devices Are Migrated",
    description:
      "Launch migration with one click — no manual intervention needed.",
  },
  {
    id: "06",
    title: "Configurations Restored Automatically",
    description:
      "Configurations are applied and optimized instantly across all devices.",
  },
];

export default function GetStartedSection() {
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 2000); // change every 2 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row items-start lg:justify-between gap-10 lg:gap-4 px-5 lg:px-25">
      {/* Right Container */}
      <div className="flex flex-col gap-5 items-start lg:w-[400px]">
        <div className="text-xs px-2.5 py-1 bg-[#D7FB71] rounded-full">
          Quick Setup
        </div>

        <div className="relative">
          <p className="text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
            Get Started
          </p>
          <p className="font-bold text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-[#015C95]">
            in Minutes
          </p>
          <p className="absolute -bottom-1 left-13 sm:left-23 md:left-40 border-2 border-[#D7FB71] w-[100px] rounded" />
        </div>

        <p className="text-[12px] sm:text-[13px]">
          Simplify network operations with intelligent automation, real-time
          control, and zero manual overhead.
        </p>

        <OvalButton
          onClick={() => navigate("/auth")}
          text_prop="text-white"
          bg_prop="bg-[#015C95]"
        >
          <ArrowUpRight strokeWidth={1} size={20} /> Get Started Free
        </OvalButton>

        {/* <video
          src="/images/DataMigration.mp4"
          className="size-80"
          autoPlay
          loop
          muted
          playsInline
        /> */}
      </div>

      {/* Left Container */}
      <div className="relative flex flex-col items-stretch gap-6">
        <div className=" absolute left-10 sm:left-12 h-full border-r border-[#015C95]"></div>

        {cards?.map((card, idx) => {
          const isActive = idx === activeIndex;

          return (
            <div
              key={card?.id || idx}
              className={`flex items-center gap-3 px-5 py-5 sm:px-7 sm:py-5 rounded-xl transition-all duration-500 z-10
                ${isActive ? "bg-[#015C95]" : "bg-[#F5F5F5]"}`}
            >
              <div
                className={`h-10 w-10 flex items-center justify-center font-bold rounded-lg transition-all duration-500
                  ${isActive ? "text-[#015C95] bg-[#D7FB71]" : "text-black bg-white"}`}
              >
                {card?.id}
              </div>

              <div className="flex-1 flex flex-col">
                <div
                  className={`font-medium sm:text-lg transition-all duration-500
                    ${isActive ? "text-white" : "text-[#015C95]"}`}
                >
                  {card?.title}
                </div>

                <div
                  className={`text-xs transition-all duration-500
                    ${isActive ? "text-[#D7FB71]" : "text-[#434140]"}`}
                >
                  {card?.description}
                </div>
              </div>

              <ExternalLink
                className={isActive ? "text-[#D7FB71]" : "text-[#F5F5F5]"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
