import React from "react";

import { User, Layers, X, Check } from "lucide-react";

import SectionHeading from "../SectionHeading";
import SectionDescription from "../SectionDescription";

export default function SolutionSection() {
  const cards = [
    {
      card_bg: "bg-[#FAFAFA]",
      cardText_color: "text-gray-500",
      divider_color: "border-gray-200",
      icon: <User size={20} className="text-white" />,
      icon_bg: "bg-gray-400",
      title: "Manual process",
      title_color: "text-gray-900",
      subTitle: "Traditional approach",
      subTitle_color: "text-gray-500",
      featureList: [
        "Manual API calls per device",
        "Not performed — no safety net",
        "Manual re-entry in destination dashboard",
        "Easily missed — no checklist",
        "No native path — error-prone",
        "Manual — if you know where to start",
        "Time for 20 devices: 8–12 hours",
      ],
      featureIcon: <X size={16} className="text-white" />,
      featureIcon_bg: "bg-red-400",
    },
    {
      card_bg: "bg-[#049FD9]",
      cardText_color: "text-white",
      divider_color: "border-white/80",
      icon: <Layers size={20} className="text-[#049FD9]" />,
      icon_bg: "bg-white",
      title: "Meraki Management",
      title_color: "text-white",
      subTitle: "Automated platform",
      subTitle_color: "text-white/80",
      featureList: [
        "Fully automated in sequence",
        "Full org snapshot saved as ZIP",
        "Auto-restored from backup data",
        "Transferred in pre-config phase",
        "Built-in: Global, India, Canada, China + more",
        "Stage-by-stage rollback with one click",
        "Time for 20 devices: ~10 minutes",
      ],
      featureIcon: <Check size={16} className="text-[#049FD9]" />,
      featureIcon_bg: "bg-white",
    },
  ];

  return (
    <div
      id="features"
      className="home-section bg-white border-b border-gray-200"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Section Heading */}
        <SectionHeading text="Our Solution" variant="blue" />

        <SectionDescription
          des1="Automated migration that just works."
          des2="Everything the manual process gets wrong, this platform does automatically — with a full backup, staged rollback, and cross-region support built in."
        />

        <div className="flex flex-col md:flex-row items-stretch justify-center gap-12 mt-6 w-full max-w-6xl px-4">
          {cards?.map((card, idx) => (
            <div
              key={idx}
              className={`flex-1 max-w-lg ${card?.card_bg} rounded-xl overflow-hidden shadow-lg`}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="px-8 py-6 flex items-center gap-4">
                  <div
                    className={`p-2 rounded-full ${card?.icon_bg} flex items-center justify-center flex-shrink-0`}
                  >
                    {card?.icon}
                  </div>
                  <div>
                    <h3
                      className={`text-[18px] font-bold ${card?.title_color}`}
                    >
                      {card?.title}
                    </h3>
                    <p className={`text-[12px] ${card?.subTitle_color}`}>
                      {card?.subTitle}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className={`border ${card?.divider_color} mx-6`}></div>

                {/* Feature List */}
                <div className="px-8 py-6 flex flex-col gap-5">
                  {card?.featureList.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full ${card?.featureIcon_bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                      >
                        {card?.featureIcon}
                      </div>
                      <p
                        className={`text-sm ${card?.cardText_color} leading-relaxed`}
                      >
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
