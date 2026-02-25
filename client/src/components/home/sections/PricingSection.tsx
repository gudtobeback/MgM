import React from "react";

import { Check, Settings, MoveRight } from "lucide-react";

import CustomButton from "../../ui/CustomButton";

import SectionHeading from "../SectionHeading";
import SectionDescription from "../SectionDescription";

export default function PricingSection() {
  const iconSize = 18;

  const tableBody = [
    {
      feature: "Fully Automated Migration",
      basic: <Check size={iconSize} />,
      pro: <Check size={iconSize} />,
      enterprise: <Check size={iconSize} />,
    },
    {
      feature: "Pre-migration org backup (ZIP)",
      basic: <Check size={iconSize} />,
      pro: <Check size={iconSize} />,
      enterprise: <Check size={iconSize} />,
    },
    {
      feature: "Configuration restore",
      basic: <Check size={iconSize} />,
      pro: <Check size={iconSize} />,
      enterprise: <Check size={iconSize} />,
    },
    {
      feature: "Cross-region support",
      basic: <Check size={iconSize} />,
      pro: <Check size={iconSize} />,
      enterprise: <Check size={iconSize} />,
    },
    {
      feature: "Stage-by-stage rollback",
      basic: <Check size={iconSize} />,
      pro: <Check size={iconSize} />,
      enterprise: <Check size={iconSize} />,
    },
    {
      feature: "Migration verification report",
      basic: "-",
      pro: <Check size={iconSize} />,
      enterprise: <Check size={iconSize} />,
    },
    {
      feature: "Pre-migration validation",
      basic: "-",
      pro: <Check size={iconSize} />,
      enterprise: <Check size={iconSize} />,
    },
    {
      feature: "Priority support",
      basic: "Email",
      pro: "Priority",
      enterprise: "24/7",
    },
    {
      feature: "Post-migration support period",
      basic: "30 days",
      pro: "90 days",
      enterprise: "Ongoing",
    },
    {
      feature: "Dedicated migration engineer",
      basic: "-",
      pro: "-",
      enterprise: <Check size={iconSize} />,
    },
    {
      feature: "Custom migration schedule",
      basic: "-",
      pro: "-",
      enterprise: <Check size={iconSize} />,
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "$300",
      subtitle: "Up to 20 devices",
      highlighted: false,
    },
    {
      name: "Professional",
      price: "$750",
      subtitle: "21 - 50 devices",
      highlighted: true,
      badge: "The Most Popular",
    },
    {
      name: "Enterprise",
      price: "Custom",
      subtitle: "50+ devices",
      highlighted: false,
    },
  ];

  return (
    <div
      id="pricing"
      className="home-section bg-white border-b border-gray-200"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Section Heading */}
        <SectionHeading text="Our Pricing" variant="blue" />

        <SectionDescription
          des1="Simple, one-time pricing."
          des2="No subscriptions. Pay once per migration project. Compare this to 8–12 hours of admin time and the risk of manual errors."
        />

        <table
          className="w-full
            [&_th]:px-2 [&_th]:py-3 [&_th]:min-w-[100px] [&_th]:whitespace-nowrap
            [&_td]:px-2 [&_td]:py-3 [&_td]:min-w-[100px] [&_td]:whitespace-nowrap"
        >
          <thead>
            <tr>
              <th className="text-[16px]">
                <div className="flex items-center gap-3">
                  <Settings size={iconSize} strokeWidth={3} /> Features
                </div>
              </th>

              {/* Plans */}
              {plans.map((plan, index) => (
                <th key={index} className="max-w-[100px]">
                  <div
                    className={`relative p-4 text-sm border border-[#E5E5E4] rounded-2xl ${
                      plan.highlighted
                        ? "bg-[#049FD9] text-white"
                        : "bg-[#F7F5EE] text-black"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <p>{plan.name}</p>

                      <div className="flex items-end gap-1">
                        <span className="text-[16px] font-bold">
                          {plan.price}
                        </span>

                        <span
                          className={`font-medium text-[12px] ${
                            plan.highlighted ? "text-white/80" : "text-black/60"
                          }`}
                        >
                          {plan.subtitle}
                        </span>
                      </div>

                      <CustomButton
                        className="text-center text-[12px] w-full"
                        text_prop={
                          plan.highlighted ? "text-black/80" : "text-white"
                        }
                        bg_prop={
                          plan.highlighted
                            ? "bg-[#F7F5EE] hover:bg-[#e7e5dd]"
                            : "bg-[#049FD9] hover:bg-[#0e8dbb]"
                        }
                      >
                        Get Started <MoveRight size={16} />
                      </CustomButton>
                    </div>

                    {plan.highlighted && plan.badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-8 bg-red-400 px-3 py-1 rounded-md">
                        <p className="font-medium text-[12px] text-white whitespace-nowrap">
                          {plan.badge}
                        </p>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {tableBody.map((row, index) => (
              <tr key={index} className="text-[13px] border-b border-gray-200">
                <td className="font-medium">{row.feature}</td>
                <td className="text-center font-bold place-items-center">
                  {row.basic}
                </td>
                <td className="text-center font-bold place-items-center bg-[#181F2C08]">
                  {row.pro}
                </td>
                <td className="text-center font-bold place-items-center">
                  {row.enterprise}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
