import React from "react";

import { useNavigate } from "react-router-dom";
import { Check, Rocket, Star, Flame } from "lucide-react";

const iconSize = 18;

const subscriptionPlans = [
  {
    icon: <Rocket size={iconSize} />,
    title: "Starter Plan",
    description: "Perfect for small businesses getting started",
    pricing: "$299.00",
    features: [
      "Up to 10 devices",
      "Fully Automated Migration",
      "Pre-migration org backup (ZIP)",
      "Configuration restore",
      "Cross-region support",
      "Stage-by-stage rollback",
      "Email Support",
    ],
    text_color: "text-black",
    bg_color: "bg-white",
    subscriptionTier: "starter",
  },
  {
    icon: <Star size={iconSize} fill="black" />,
    title: "Professional Plan",
    description: "For growing businesses with advanced needs",
    pricing: "$799.00",
    features: [
      "Up to 50 devices",
      "Fully Automated Migration",
      "Pre-migration org backup (ZIP)",
      "Configuration restore",
      "Migration verification report",
      "Pre-migration validation",
      "Priority support",
    ],
    text_color: "text-white",
    bg_color: "bg-[#015C95]",
    subscriptionTier: "professional",
  },
  {
    icon: <Flame size={iconSize} fill="black" />,
    title: "Enterprise Plan",
    description: "Unlimited scale for large organizations",
    pricing: "Custom",
    features: [
      "Unlimited devices",
      "Fully Automated Migration",
      "Pre-migration org backup (ZIP)",
      "Configuration restore",
      "Dedicated migration engineer",
      "Custom migration schedule",
      "24/7 premium support",
    ],
    text_color: "text-black",
    bg_color: "bg-white",
    subscriptionTier: "enterprise",
  },
];

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <div id="pricing" className="flex flex-col items-center gap-10 px-5">
      {/* Heading */}
      <div className="flex flex-col items-center justify-center gap-5">
        <div className="text-center text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
          <span>Simple, </span>
          <span className="block sm:inline font-bold text-[#015C95]">
            Transparent Pricing
          </span>
        </div>

        <p className="text-center text-[13px] sm:text-sm">
          Transparent pricing with no hidden fees. Start with a 30-day free
          trial.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row items-center justify-center gap-3 p-3 bg-[#F2F2F2] rounded-xl">
        {subscriptionPlans?.map((card, idx) => {
          const isProfessional = card?.subscriptionTier === "professional";

          return (
            <div
              key={card?.title || idx}
              className={`p-5 flex flex-col gap-5 w-full lg:w-[350px] ${card?.bg_color} rounded-lg`}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#D7FB71] rounded-md">
                  {card?.icon}
                </div>

                <p
                  className={`font-medium text-sm uppercase ${isProfessional ? "text-white" : "text-[#015C95]"}`}
                >
                  {card?.title}
                </p>
              </div>

              <p className={`text-[13px] sm:text-sm ${card?.text_color}`}>
                {card?.description}
              </p>

              <p className="flex items-center gap-3">
                <span className={`font-medium text-[30px] ${card?.text_color}`}>
                  {card?.pricing}
                </span>
                <span
                  className={`text-sm ${isProfessional ? "text-white" : "text-[#7B7B7B]"}`}
                >
                  / month
                </span>
              </p>

              <button
                className={`px-5 py-2 font-medium text-sm ${isProfessional ? "text-black bg-[#D7FB71]" : "text-white bg-[#015C95]"} rounded-full`}
              >
                Get Started
              </button>

              <p className={`mt-1 font-medium text-sm ${card?.text_color}`}>
                What's Included
              </p>

              <div className="flex flex-col gap-4">
                {card?.features?.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className={`p-0.5 ${isProfessional ? "bg-white" : "bg-[#015C95]"} rounded-full`}
                    >
                      <Check
                        strokeWidth={3}
                        size={10}
                        className={`${isProfessional ? "text-[#015C95]" : "text-white"}`}
                      />
                    </div>

                    <p className={`text-xs ${card?.text_color}`}>{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
