import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

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
    <div
      id="how"
      className="flex flex-col items-center gap-10 px-5
      lg:flex-row lg:justify-between lg:gap-6 lg:px-10 xl:px-25"
    >
      {/* Right Container */}
      <div className="flex flex-wrap gap-5 items-center justify-center lg:justify-between w-full lg:w-[400px]">
        <div className="flex flex-col gap-5 items-start max-w-[550px]">
          <div className="text-[11px] sm:text-[12px] px-2.5 py-1 bg-[#D7FB71] rounded-full">
            Quick Setup
          </div>

          <div className="relative">
            <p className="text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
              Get Started
            </p>

            <p className="relative w-fit font-bold text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-[#015C95]">
              in Minutes
              <span className="absolute -bottom-1 -right-1 border-2 border-[#D7FB71] w-[100px] rounded" />
            </p>
          </div>

          <p className="text-[13px] sm:text-sm">
            Simplify network operations with intelligent automation, real-time
            control, and zero manual overhead.
          </p>

          <OvalButton
            onClick={() => navigate("/auth")}
            text_prop="text-white"
            bg_prop="bg-[#015C95]"
            className="text-[13px] sm:text-sm"
          >
            <ArrowUpRight strokeWidth={1} size={20} /> Get Started Free
          </OvalButton>
        </div>

        {/* Migration SVG */}
        <div className="flex justify-center items-center h-[160px] lg:h-[220px]">
          <svg viewBox="0 0 400 200" className="w-full max-w-[400px] h-full">
            {/* LEFT: Devices */}
            <g>
              <rect
                x="20"
                y="45"
                width="50"
                height="30"
                rx="4"
                fill="#374151"
              />
              <rect
                x="20"
                y="85"
                width="50"
                height="30"
                rx="4"
                fill="#374151"
              />
              <rect
                x="20"
                y="125"
                width="50"
                height="30"
                rx="4"
                fill="#374151"
              />

              {/* small lights */}
              <circle cx="25" cy="60" r="2" fill="#22c55e" />
              <circle cx="25" cy="100" r="2" fill="#22c55e" />
              <circle cx="25" cy="140" r="2" fill="#22c55e" />
            </g>

            {/* MIDDLE: Automation Gear */}
            <g className="gear">
              <circle cx="190" cy="100" r="24" fill="#015C95" />

              {/* Teeth (rectangles rotated around center) */}
              {[...Array(8)].map((_, i) => (
                <rect
                  key={i}
                  x="184"
                  y="71"
                  width="13"
                  height="10"
                  rx="2"
                  fill="#015C95"
                  transform={`rotate(${i * 45} 190 100)`}
                />
              ))}

              {/* Inner ring */}
              <circle cx="190" cy="100" r="16" fill="#e5e7eb" />

              {/* Inner ring */}
              <circle cx="190" cy="100" r="13" fill="#0c4a6e" />

              {/* Center hole */}
              <circle cx="190" cy="100" r="8" fill="#e5e7eb" />
            </g>

            {/* RIGHT: Destination (organized stack) */}
            <g>
              <rect
                x="300"
                y="60"
                width="60"
                height="20"
                rx="4"
                fill="#93c5fd"
              />
              <rect
                x="300"
                y="90"
                width="60"
                height="20"
                rx="4"
                fill="#60a5fa"
              />
              <rect
                x="300"
                y="120"
                width="60"
                height="20"
                rx="4"
                fill="#3b82f6"
              />
            </g>

            {/* FLOW LINES */}
            <line
              x1="70"
              y1="100"
              x2="168"
              y2="100"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeDasharray="5 4"
            />

            <line
              x1="212"
              y1="100"
              x2="300"
              y2="100"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeDasharray="5 4"
            />

            {/* PACKETS IN */}
            <circle
              className="dot dot1"
              cx="70"
              cy="100"
              r="4"
              fill="#3b82f6"
            />
            <circle
              className="dot dot2"
              cx="70"
              cy="100"
              r="4"
              fill="#10b981"
            />
            <circle
              className="dot dot3"
              cx="70"
              cy="100"
              r="4"
              fill="#f59e0b"
            />

            {/* PACKETS OUT */}
            <circle
              className="dot-out dot4"
              cx="212"
              cy="100"
              r="4"
              fill="#22c55e"
            />
            <circle
              className="dot-out dot5"
              cx="212"
              cy="100"
              r="4"
              fill="#38bdf8"
            />
          </svg>
        </div>
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

              <div className="flex-1 space-y-1">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
