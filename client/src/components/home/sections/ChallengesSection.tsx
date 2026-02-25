import React from "react";

import SectionHeading from "../SectionHeading";
import SectionDescription from "../SectionDescription";

export default function ChallengesSection() {
  const problems = [
    {
      num: "01",
      title: "No native support for backup and restore",
      description:
        "Cisco Meraki provides zero built-in tooling to migrate devices between dashboard regions or organizations. Every step must be executed manually — in the correct order.",
      stat: "0",
      statLabel: "built-in migration tools",
      accent: "#dc2626",
      accentBg: "#fef2f2",
    },
    {
      num: "02",
      title: "No Native Migration Support",
      description:
        "Cisco Meraki provides zero built-in tooling to migrate devices between dashboard regions or organizations. Every step must be executed manually — in the correct order.",
      stat: "0",
      statLabel: "built-in migration tools",
      accent: "#dc2626",
      accentBg: "#fef2f2",
    },
    {
      num: "03",
      title: "High Risk of Configuration Loss",
      description:
        "Manual migration involves dozens of API calls and dashboard steps per device. A single mistake with VLANs, firewall rules, SSIDs, or RADIUS configs can silently break your network.",
      stat: "1",
      statLabel: "error can mean full network outage",
      accent: "#d97706",
      accentBg: "#fffbeb",
    },
    {
      num: "04",
      title: "Extremely Time-Consuming at Scale",
      description:
        "Migrating 20 devices manually takes an entire work day. For 100+ devices, it becomes a multi-day project requiring full administrator focus and careful sequencing across both dashboards.",
      stat: "8–12 hrs",
      statLabel: "per 20-device migration",
      accent: "#7c3aed",
      accentBg: "#f5f3ff",
    },
    {
      num: "05",
      title: "Requires Deep API Expertise",
      description:
        "A correct manual migration demands knowledge of Meraki API ordering rules, claim/unclaim propagation delays, rate limits, and per-config restore sequences — knowledge most teams don't have.",
      stat: "50+",
      statLabel: "manual steps per network",
      accent: "#0891b2",
      accentBg: "#ecfeff",
    },
  ];

  return (
    <div className="home-section border-b border-gray-200">
      <div className="flex flex-col items-center gap-8">
        {/* Section Heading */}
        <SectionHeading text="The Challenge's" variant="red" />

        <SectionDescription
          des1={
            <>
              Why manual Meraki migration{" "}
              <span className="text-red-600">fails</span> every time.
            </>
          }
          des2={
            <>
              Manual migrations take{" "}
              <span className="font-bold">5-7 hours per network</span>. That's
              not scalable when you need to migrate hundreds of devices. Plus,
              human error when attempting a manual move is certain to have
              unintended costs.
            </>
          }
        />

        <div className="flex flex-wrap items-center justify-evenly gap-12 mt-8">
          {problems?.map((problem, idx) => (
            <div className="relative p-5 bg-white border border-gray-100 rounded-lg max-w-[500px] shadow-lg">
              <div className="flex items-start gap-3">
                <p className="text-[16px] font-bold">{problem?.num}.</p>

                <div className="flex flex-col gap-2">
                  <p className="text-[16px] font-bold">{problem?.title}</p>
                  <p className="text-[12px]">{problem?.description}</p>
                </div>
              </div>

              <div className="absolute -top-4 -right-8 p-2 bg-[#FFE1E1] rounded-sm">
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="font-bold">{problem?.stat}</span>
                  <span className="font-medium">{problem?.statLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
