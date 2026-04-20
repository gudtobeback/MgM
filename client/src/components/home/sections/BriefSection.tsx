import React, { useEffect, useRef, useState } from "react";

import { User, Layers, X, Check } from "lucide-react";
import { Progress } from "antd";

const automaionStats = [
  {
    value: 10,
    suffix: "x",
    description: "faster deployments",
  },
  {
    value: 99.9,
    suffix: "%",
    description: "success rate",
  },
  {
    value: 24,
    suffix: "/7",
    description: "active monitoring",
  },
  {
    value: 200,
    suffix: "+",
    description: "integrations",
  },
];

const networkStatus = [
  {
    title: "Deployment Status",
    percentage: 100,
    color: "#D7FB71",
  },
  {
    title: "Configuration Sync",
    percentage: 87,
    color: "#049FD9",
  },
  {
    title: "Network Health",
    percentage: 95,
    color: "#00BC7D",
  },
];

export default function BriefSection() {
  const sectionRef = useRef(null);
  const [startAnimation, setStartAnimation] = useState(false);

  const [animatedValues, setAnimatedValues] = useState(
    networkStatus.map(() => 0),
  );
  const [animatedStats, setAnimatedStats] = useState(
    automaionStats.map(() => 0),
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStartAnimation(true);
          observer.unobserve(el); // run once
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!startAnimation) return;

    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setAnimatedValues(
        networkStatus.map((item) => item.percentage * progress),
      );

      setAnimatedStats(automaionStats.map((item) => item.value * progress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [startAnimation]);

  return (
    <div
      id="features"
      ref={sectionRef}
      className="bg-[url('/images/cloud.jpg')] bg-cover rounded-3xl overflow-hidden"
    >
      <div
        className="flex flex-col items-center justify-between gap-10 p-5
        xl:flex-row xl:gap-20 xl:h-[600px] xl:px-25 xl:py-0"
      >
        {/* Right Container */}
        <div className="flex flex-col gap-5 sm:gap-7 py-4 xl:py-0">
          <div className="relative">
            <p className="text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-white">
              Automation that
            </p>
            <p className="font-bold text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-white">
              just works
            </p>
            <p className="absolute -bottom-1 left-13 sm:left-23 md:left-40 border-2 border-[#D7FB71] w-[100px] rounded" />
          </div>

          <p className="text-[13px] sm:text-sm text-white">
            Simplify network operations with intelligent automation,
            <br />
            real-time control, and zero manual overhead.
          </p>

          <div className="grid grid-cols-4 gap-5">
            {automaionStats?.map((card, idx) => (
              <div
                key={idx}
                className="col-span-2 sm:col-span-1 flex flex-col gap-0.5 sm:gap-1"
              >
                <p className="font-bold text-[30px] sm:text-[34px] text-[#D7FB71] leading-12">
                  {card.value % 1 !== 0
                    ? animatedStats[idx].toFixed(1)
                    : Math.round(animatedStats[idx])}
                  {card.suffix}
                </p>

                <p className="text-xs text-white">{card.description}</p>

                <p
                  className="h-0.5 mt-4 rounded"
                  style={{
                    backgroundImage: `linear-gradient(to right, #D7FB71, #D7FB71, transparent)`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Left Container */}
        <div className="relative p-0.5 flex-1 border-[3px] border-[#B9B9B9] rounded-2xl w-full">
          <div className="px-6 py-4 flex items-center gap-2 text-[12px] text-white bg-[#033657] rounded-t-xl">
            <div className="p-1.5 bg-[#D7FB71] rounded-full"></div>
            Live Network Status
          </div>

          <div className="flex flex-col gap-8 p-7 bg-white rounded-b-xl">
            <div className="flex flex-col gap-5">
              {networkStatus?.map((data, idx) => (
                <div key={data?.title || idx} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-semibold text-xs">
                    <p>{data?.title}</p>
                    <p>{Math.round(animatedValues[idx])}%</p>
                  </div>

                  <Progress
                    percent={animatedValues[idx]}
                    size="small"
                    strokeColor={data?.color}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {[
                { title: "Device sync completed", timeStamp: "5s ago" },
                { title: "Configuration validated", timeStamp: "2s ago" },
                { title: "Monitoring 247 devices", timeStamp: "live" },
              ]?.map((data) => (
                <div className="flex items-center gap-3">
                  <div className="p-0.5 bg-black rounded-full">
                    <Check strokeWidth={3} size={8} className="text-white" />
                  </div>
                  <p className="flex-1 text-xs font-medium">{data?.title}</p>
                  <p className="text-xs">{data?.timeStamp}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden xl:block absolute -top-20 -right-10 z-10 p-5 bg-[#D7FB71] border border-white rounded-xl">
            <p className="font-bold text-[34px] leading-10">2.3s</p>
            <p className="font-medium text-sm">Deploy Time</p>
          </div>

          <div className="hidden xl:block absolute -bottom-20 -left-10 z-10 p-5 bg-[#033657] border border-white rounded-xl">
            <p className="font-bold text-[34px] text-white leading-10">247</p>
            <p className="font-medium text-sm text-white">Connected Devices</p>
            <div className="flex items-center gap-1 mt-1 px-2 py-0.5 w-fit bg-[#27B22780] rounded-full">
              <div className="relative flex items-center justify-center">
                {/* Glow ring */}
                <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#08FF00] opacity-75 animate-ping"></span>

                {/* Solid dot */}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#08FF00] shadow-[0_0_8px_#08FF00]"></span>
              </div>

              <p className="text-[11px] text-[#09FF00]">Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
